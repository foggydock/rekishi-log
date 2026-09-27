-- Gemini の利用権限を、歴史ログのデータ有無ではなく専用の許可リストで管理する。
-- 既存の記録利用者だけを初期登録し、クライアントからの追加・変更は許可しない。
create table public.hist_ai_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.hist_ai_users enable row level security;

revoke all on table public.hist_ai_users from anon;
revoke all on table public.hist_ai_users from authenticated;
grant select on table public.hist_ai_users to authenticated;

create policy "read own hist ai authorization"
on public.hist_ai_users
for select
to authenticated
using ((select auth.uid()) = user_id);

insert into public.hist_ai_users (user_id)
select distinct user_id
from public.hist_entries
on conflict (user_id) do nothing;
