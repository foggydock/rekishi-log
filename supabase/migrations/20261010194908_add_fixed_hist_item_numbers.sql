-- 各利用者の項目番号を、登録時に固定する。
-- 既存項目は登録日時の古い順（同日時はID順）で一度だけ採番する。
alter table public.hist_items
  add column item_no bigint;

with numbered as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at asc, id asc
    ) as item_no
  from public.hist_items
)
update public.hist_items as item
set item_no = numbered.item_no
from numbered
where item.id = numbered.id;

alter table public.hist_items
  alter column item_no set not null;

create unique index hist_items_user_item_no_key
  on public.hist_items (user_id, item_no);

create function public.assign_hist_item_no()
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

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select coalesce(max(item_no), 0) + 1
  into new.item_no
  from public.hist_items
  where user_id = new.user_id;

  return new;
end;
$$;

revoke all on function public.assign_hist_item_no() from public;

create trigger assign_hist_item_no_before_write
before insert or update on public.hist_items
for each row
execute function public.assign_hist_item_no();
