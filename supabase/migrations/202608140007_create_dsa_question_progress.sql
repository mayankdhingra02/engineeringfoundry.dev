begin;

create table public.dsa_question_catalog (
  id text primary key,
  constraint dsa_question_catalog_id check (id ~ '^[a-z0-9][a-z0-9-]{0,199}$')
);

insert into public.dsa_question_catalog (id)
select unnest(array[
  '3sum','accounts-merge','all-oone-data-structure','balanced-binary-tree','best-time-to-buy-and-sell-stock',
  'binary-search','binary-tree-level-order-traversal','binary-tree-maximum-path-sum','binary-tree-right-side-view',
  'bounded-sensor-window','burst-balloons','capacity-to-ship-packages-within-d-days','car-pooling',
  'cheapest-flights-within-k-stops','climbing-stairs','clone-graph','coin-change','combination-sum',
  'combination-sum-ii','construct-binary-tree-from-preorder-and-inorder-traversal','container-with-most-water',
  'contains-duplicate','contiguous-array','continuous-subarray-sum','course-schedule','course-schedule-ii',
  'critical-connections-in-a-network','daily-temperatures','data-stream-as-disjoint-intervals','decode-ways',
  'design-add-and-search-words-data-structure','design-authentication-manager','design-twitter','diameter-of-binary-tree',
  'edit-distance','find-eventual-safe-states','find-median-from-data-stream','find-minimum-in-rotated-sorted-array',
  'find-pivot-index','first-bad-version','flood-fill','frequency-ledger','fruit-into-baskets','gas-station',
  'group-anagrams','house-robber','house-robber-ii','implement-queue-using-stacks','implement-trie-prefix-tree',
  'insert-delete-getrandom-o1','insert-interval','invert-binary-tree','isomorphic-strings','jump-game','jump-game-ii',
  'k-closest-points-to-origin','koko-eating-bananas','kth-largest-element-in-a-stream',
  'kth-largest-element-in-an-array','kth-smallest-element-in-a-bst','largest-rectangle-in-histogram','lfu-cache',
  'linked-list-cycle','longest-common-subsequence','longest-consecutive-sequence',
  'longest-increasing-path-in-a-matrix','longest-increasing-subsequence','longest-repeating-character-replacement',
  'longest-substring-without-repeating-characters','lowest-common-ancestor-of-a-binary-search-tree',
  'lowest-common-ancestor-of-a-binary-tree','lru-cache','majority-element','max-area-of-island',
  'max-consecutive-ones-iii','maximum-average-subarray-i','maximum-depth-of-binary-tree','maximum-subarray',
  'merge-intervals','merge-k-sorted-lists','merge-service-queues','merge-two-sorted-lists','middle-of-the-linked-list',
  'min-cost-climbing-stairs','min-cost-to-connect-all-points','min-stack','minimum-number-of-arrows-to-burst-balloons',
  'minimum-number-of-days-to-make-m-bouquets','minimum-path-sum','minimum-size-subarray-sum','minimum-window-substring',
  'most-stones-removed-with-same-row-or-column','move-zeroes','my-calendar-i','my-calendar-ii','n-queens',
  'network-delay-time','next-greater-element-ii','no-link','non-overlapping-intervals','number-of-islands',
  'number-of-provinces','number-of-recent-calls','palindrome-partitioning','palindromic-substrings',
  'partition-equal-subset-sum','partition-labels','path-sum','path-sum-iii','path-with-maximum-probability',
  'path-with-minimum-effort','permutation-in-string','permutations','product-of-array-except-self','range-module',
  'range-sum-query-immutable','range-sum-query-mutable','reconstruct-itinerary','redundant-connection',
  'remove-duplicates-from-sorted-array','remove-k-digits','remove-nth-node-from-end-of-list','reorder-list',
  'reorganize-string','replace-words','reverse-linked-list','rotting-oranges','running-sum-of-1d-array',
  'search-a-2d-matrix','search-in-rotated-sorted-array','search-insert-position','search-suggestions-system',
  'serialize-and-deserialize-binary-tree','single-number','single-number-ii','sliding-window-maximum','snapshot-array',
  'sort-colors','split-array-largest-sum','stock-price-fluctuation','subarray-sum-equals-k',
  'subarray-sums-divisible-by-k','subarrays-with-k-different-integers','subsets','swim-in-rising-water',
  'target-sum','task-scheduler','time-based-key-value-store','top-k-frequent-elements','transit-network-reachability',
  'trapping-rain-water','two-sum','two-sum-ii-input-array-is-sorted','unique-paths','valid-anagram','valid-palindrome',
  'valid-parentheses','validate-binary-search-tree','word-break','word-ladder','word-search','word-search-ii'
]);

create table public.dsa_question_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.dsa_question_catalog(id) on update cascade on delete restrict,
  status text not null default 'not_started',
  confidence text,
  bookmarked boolean not null default false,
  notes text,
  first_attempted_at timestamptz,
  last_practiced_at timestamptz,
  solved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id),
  constraint dsa_question_progress_status check (status in ('not_started','attempted','solved','review')),
  constraint dsa_question_progress_confidence check (confidence is null or confidence in ('low','medium','high')),
  constraint dsa_question_progress_notes check (notes is null or char_length(notes) <= 5000),
  constraint dsa_question_progress_first_attempt check (status = 'not_started' or first_attempted_at is not null),
  constraint dsa_question_progress_solved_at check (solved_at is null or first_attempted_at is not null)
);

create index dsa_question_progress_user_status_idx on public.dsa_question_progress (user_id, status, updated_at desc);
create index dsa_question_progress_user_recent_idx on public.dsa_question_progress (user_id, last_practiced_at desc nulls last);
create index dsa_question_progress_user_bookmarked_idx on public.dsa_question_progress (user_id, bookmarked) where bookmarked;

create trigger dsa_question_progress_set_updated_at
before update on public.dsa_question_progress
for each row execute function public.set_updated_at();

alter table public.dsa_question_progress enable row level security;

create policy "Owners can read DSA question progress"
on public.dsa_question_progress for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners can delete DSA question progress"
on public.dsa_question_progress for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.save_dsa_question_progress(
  target_question_id text,
  target_status text,
  target_confidence text,
  target_bookmarked boolean,
  target_notes text
)
returns setof public.dsa_question_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  practice_time timestamptz := statement_timestamp();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.dsa_question_catalog where id = target_question_id) then
    raise exception 'Unknown canonical DSA question' using errcode = '23503';
  end if;
  if target_status not in ('not_started','attempted','solved','review') then
    raise exception 'Invalid DSA question status' using errcode = '23514';
  end if;
  if target_confidence is not null and target_confidence not in ('low','medium','high') then
    raise exception 'Invalid confidence' using errcode = '23514';
  end if;
  if char_length(coalesce(target_notes, '')) > 5000 then
    raise exception 'Notes are too long' using errcode = '22001';
  end if;

  return query
  insert into public.dsa_question_progress (
    user_id, question_id, status, confidence, bookmarked, notes,
    first_attempted_at, last_practiced_at, solved_at
  ) values (
    current_user_id, target_question_id, target_status, nullif(target_confidence, ''), target_bookmarked, nullif(btrim(target_notes), ''),
    case when target_status = 'not_started' then null else practice_time end,
    case when target_status = 'not_started' and target_confidence is null and nullif(btrim(target_notes), '') is null then null else practice_time end,
    case when target_status in ('solved','review') then practice_time else null end
  )
  on conflict (user_id, question_id) do update set
    status = excluded.status,
    confidence = excluded.confidence,
    bookmarked = excluded.bookmarked,
    notes = excluded.notes,
    first_attempted_at = coalesce(
      public.dsa_question_progress.first_attempted_at,
      case when excluded.status = 'not_started' then null else practice_time end
    ),
    last_practiced_at = case
      when public.dsa_question_progress.status is distinct from excluded.status
        or public.dsa_question_progress.confidence is distinct from excluded.confidence
        or public.dsa_question_progress.notes is distinct from excluded.notes
      then practice_time
      else public.dsa_question_progress.last_practiced_at
    end,
    solved_at = coalesce(
      public.dsa_question_progress.solved_at,
      case when excluded.status in ('solved','review') then practice_time else null end
    )
  returning *;
end;
$$;

revoke all on table public.dsa_question_catalog, public.dsa_question_progress from anon, authenticated;
grant select on table public.dsa_question_catalog to anon, authenticated;
grant select, delete on table public.dsa_question_progress to authenticated;
revoke all on function public.save_dsa_question_progress(text,text,text,boolean,text) from public;
grant execute on function public.save_dsa_question_progress(text,text,text,boolean,text) to authenticated;

commit;
