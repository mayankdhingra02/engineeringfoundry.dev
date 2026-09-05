begin;

insert into public.system_design_item_catalog (id, item_type)
select id, 'concept'
from unnest(array[
  'schema-data-migration',
  'incident-recovery-postmortems',
  'security-threat-modeling',
  'cost-efficiency',
  'operational-ownership',
  'backfill-rebuild',
  'control-plane-data-plane',
  'payments-ledgers',
  'distributed-file-systems',
  'storage-compute-separation'
]) as id
on conflict (id, item_type) do nothing;

commit;
