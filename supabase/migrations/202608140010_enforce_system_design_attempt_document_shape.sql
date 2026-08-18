begin;

create or replace function public.system_design_json_string_array_valid(value jsonb, max_items integer, max_chars integer)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare item jsonb;
begin
  if jsonb_typeof(value) <> 'array' or jsonb_array_length(value) > max_items then return false; end if;
  for item in select element from pg_catalog.jsonb_array_elements(value) as elements(element) loop
    if jsonb_typeof(item) <> 'string' or char_length(item #>> '{}') > max_chars then return false; end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

create or replace function public.system_design_json_object_array_valid(value jsonb, allowed_keys text[], max_items integer, max_chars integer)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare item jsonb; entry record;
begin
  if jsonb_typeof(value) <> 'array' or jsonb_array_length(value) > max_items then return false; end if;
  for item in select element from pg_catalog.jsonb_array_elements(value) as elements(element) loop
    if jsonb_typeof(item) <> 'object' or not (item ?& allowed_keys) then return false; end if;
    if exists (select 1 from pg_catalog.jsonb_object_keys(item) as keys(key) where not (key = any(allowed_keys))) then return false; end if;
    for entry in select key, child from pg_catalog.jsonb_each(item) as pairs(key, child) loop
      if jsonb_typeof(entry.child) <> 'string' or char_length(entry.child #>> '{}') > max_chars then return false; end if;
    end loop;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

create or replace function public.system_design_attempt_document_valid(document jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  top_keys constant text[] := array[
    'functional_requirements','non_functional_requirements','capacity','apis','data_models',
    'high_level_design','deep_dives','bottlenecks','failure_modes','tradeoffs','follow_ups','final_review_notes'
  ];
  capacity jsonb;
begin
  if document is null or jsonb_typeof(document) <> 'object' or octet_length(document::text) > 200000 then return false; end if;
  if not (document ?& top_keys) then return false; end if;
  if exists (select 1 from pg_catalog.jsonb_object_keys(document) as keys(key) where not (key = any(top_keys))) then return false; end if;

  capacity := document->'capacity';
  if jsonb_typeof(capacity) <> 'object' or not (capacity ?& array['assumptions','calculations']) then return false; end if;
  if exists (select 1 from pg_catalog.jsonb_object_keys(capacity) as keys(key) where not (key = any(array['assumptions','calculations']))) then return false; end if;

  if not public.system_design_json_string_array_valid(document->'functional_requirements', 50, 4000)
    or not public.system_design_json_string_array_valid(document->'non_functional_requirements', 50, 4000)
    or not public.system_design_json_object_array_valid(capacity->'assumptions', array['label','value','unit'], 50, 4000)
    or not public.system_design_json_object_array_valid(capacity->'calculations', array['label','formula','result'], 50, 4000)
    or not public.system_design_json_object_array_valid(document->'apis', array['method','path','purpose'], 50, 4000)
    or not public.system_design_json_object_array_valid(document->'data_models', array['entity','fields','notes'], 50, 4000)
    or not public.system_design_json_string_array_valid(document->'deep_dives', 50, 4000)
    or not public.system_design_json_string_array_valid(document->'bottlenecks', 50, 4000)
    or not public.system_design_json_object_array_valid(document->'failure_modes', array['failure','impact','mitigation'], 50, 4000)
    or not public.system_design_json_object_array_valid(document->'tradeoffs', array['choice','benefit','cost'], 50, 4000)
    or not public.system_design_json_string_array_valid(document->'follow_ups', 50, 4000)
  then return false; end if;

  if jsonb_typeof(document->'high_level_design') <> 'string'
    or char_length(document->>'high_level_design') > 30000
    or jsonb_typeof(document->'final_review_notes') <> 'string'
    or char_length(document->>'final_review_notes') > 20000
  then return false; end if;

  return true;
exception when others then
  return false;
end;
$$;

revoke all on function public.system_design_json_string_array_valid(jsonb,integer,integer) from public;
revoke all on function public.system_design_json_object_array_valid(jsonb,text[],integer,integer) from public;
revoke all on function public.system_design_attempt_document_valid(jsonb) from public;

commit;
