begin;

insert into public.system_design_item_catalog (id, item_type)
select id, 'concept'
from unnest(array[
  'scaling-reads',
  'scaling-writes',
  'read-heavy-systems',
  'write-heavy-systems',
  'fan-out',
  'fanout-read-write',
  'background-jobs',
  'long-running-jobs',
  'batch-vs-streaming',
  'cqrs',
  'handling-hot-partitions',
  'handling-contention',
  'multi-step-workflows',
  'large-file-processing'
]) as id
on conflict (id, item_type) do nothing;

commit;
