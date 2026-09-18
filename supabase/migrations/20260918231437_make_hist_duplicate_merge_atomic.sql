-- Move facts, fill missing display fields, and remove duplicate items in one transaction.
-- SECURITY INVOKER keeps the caller's RLS context; explicit ownership checks are defense in depth.
create or replace function public.merge_hist_items(
  p_keep_id bigint,
  p_other_ids bigint[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_expected_count integer;
  v_owned_count integer;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_keep_id is null or coalesce(cardinality(p_other_ids), 0) = 0 then
    raise exception 'A kept item and at least one duplicate item are required' using errcode = '22023';
  end if;

  if p_keep_id = any(p_other_ids)
     or cardinality(p_other_ids) <> cardinality(array(select distinct unnest(p_other_ids))) then
    raise exception 'Duplicate item IDs must be distinct and must not include the kept item' using errcode = '22023';
  end if;

  v_expected_count := cardinality(p_other_ids) + 1;

  -- Lock every affected row before changing anything, so concurrent merges cannot interleave.
  perform id
  from public.hist_items
  where id = any(array_append(p_other_ids, p_keep_id))
    and user_id = v_uid
  for update;
  get diagnostics v_owned_count = row_count;

  if v_owned_count <> v_expected_count then
    raise exception 'One or more items do not exist or are not owned by the current user' using errcode = '42501';
  end if;

  -- Keep existing information first; only use a duplicate's usable value to fill a gap.
  update public.hist_items as keep
  set summary = coalesce(
        nullif(keep.summary, ''),
        (select candidate.summary
         from public.hist_items as candidate
         where candidate.id = any(p_other_ids)
           and candidate.user_id = v_uid
           and nullif(candidate.summary, '') is not null
         order by candidate.id
         limit 1)
      ),
      lat = coalesce(
        case when keep.lat between -90 and 90
                   and keep.lng between -180 and 180
                   and not (keep.lat = 0 and keep.lng = 0)
             then keep.lat end,
        (select candidate.lat
         from public.hist_items as candidate
         where candidate.id = any(p_other_ids)
           and candidate.user_id = v_uid
           and candidate.lat between -90 and 90
           and candidate.lng between -180 and 180
           and not (candidate.lat = 0 and candidate.lng = 0)
         order by candidate.id
         limit 1)
      ),
      lng = coalesce(
        case when keep.lat between -90 and 90
                   and keep.lng between -180 and 180
                   and not (keep.lat = 0 and keep.lng = 0)
             then keep.lng end,
        (select candidate.lng
         from public.hist_items as candidate
         where candidate.id = any(p_other_ids)
           and candidate.user_id = v_uid
           and candidate.lat between -90 and 90
           and candidate.lng between -180 and 180
           and not (candidate.lat = 0 and candidate.lng = 0)
         order by candidate.id
         limit 1)
      ),
      updated_at = now()
  where keep.id = p_keep_id
    and keep.user_id = v_uid;

  update public.hist_facts
  set item_id = p_keep_id
  where item_id = any(p_other_ids)
    and user_id = v_uid;

  delete from public.hist_items
  where id = any(p_other_ids)
    and user_id = v_uid;
end;
$$;

revoke all on function public.merge_hist_items(bigint, bigint[]) from public;
revoke all on function public.merge_hist_items(bigint, bigint[]) from anon;
grant execute on function public.merge_hist_items(bigint, bigint[]) to authenticated;
