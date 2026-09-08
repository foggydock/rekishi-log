-- Applied to the shared remote project as add_hist_items_review_excluded.
-- This repository contains only the migration introduced for this feature.
alter table public.hist_items add column review_excluded boolean not null default false;
comment on column public.hist_items.review_excluded is 'Exclude from review recommendations while retaining the item in the timeline';
