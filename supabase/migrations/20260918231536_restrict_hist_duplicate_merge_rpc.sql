-- The database has an explicit anon grant in addition to PostgreSQL's PUBLIC grant.
-- Keep this mutation endpoint callable only by signed-in users.
revoke all on function public.merge_hist_items(bigint, bigint[]) from public;
revoke all on function public.merge_hist_items(bigint, bigint[]) from anon;
grant execute on function public.merge_hist_items(bigint, bigint[]) to authenticated;
