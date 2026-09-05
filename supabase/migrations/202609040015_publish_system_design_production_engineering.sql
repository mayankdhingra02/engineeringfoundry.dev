begin;

insert into public.system_design_item_catalog (id, item_type)
select id, 'concept'
from unnest(array[
  'observability',
  'logs',
  'metrics',
  'distributed-tracing',
  'request-ids',
  'alerts',
  'slis',
  'slos',
  'error-budgets',
  'authn-authz',
  'sessions-tokens',
  'jwt',
  'oauth-oidc',
  'tls',
  'encryption',
  'secrets-management',
  'api-abuse-ddos',
  'tenant-authorization'
]) as id
on conflict (id, item_type) do nothing;

commit;
