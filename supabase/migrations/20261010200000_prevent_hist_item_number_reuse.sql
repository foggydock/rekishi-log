-- 削除後も番号を再利用しないよう、利用者ごとに次の番号を保持する。
create table public.hist_item_number_counters (
  user_id uuid primary key,
  next_item_no bigint not null check (next_item_no > 0)
);

alter table public.hist_item_number_counters enable row level security;
revoke all on table public.hist_item_number_counters from anon, authenticated;

insert into public.hist_item_number_counters (user_id, next_item_no)
select user_id, max(item_no) + 1
from public.hist_items
group by user_id;

create or replace function public.assign_hist_item_no()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'UPDATE' then
    new.item_no := old.item_no;
    return new;
  end if;

  insert into public.hist_item_number_counters as counter (user_id, next_item_no)
  values (new.user_id, 2)
  on conflict (user_id) do update
  set next_item_no = counter.next_item_no + 1
  returning next_item_no - 1 into new.item_no;

  return new;
end;
$$;

revoke all on function public.assign_hist_item_no() from public, anon, authenticated;
