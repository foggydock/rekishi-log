-- Applied to the shared remote project as add_hist_items_map_exclusion_reason.
alter table public.hist_items add column map_exclusion_reason text;
comment on column public.hist_items.map_exclusion_reason is 'Reason to exclude a region from map geocoding';
