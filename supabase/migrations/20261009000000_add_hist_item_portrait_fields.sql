-- 人物項目の肖像画・彫像などを、出典とライセンス情報つきで保存する。
-- すべて任意項目にするため、既存の歴史項目・RLSポリシーには影響しない。
alter table public.hist_items
  add column if not exists portrait_image_url text,
  add column if not exists portrait_source_url text,
  add column if not exists portrait_credit text,
  add column if not exists portrait_license text;
