-- eventsテーブルに販売期限・口数制限・最低保証カラムを追加
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS end_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS max_count integer,
  ADD COLUMN IF NOT EXISTS min_guarantee integer;
