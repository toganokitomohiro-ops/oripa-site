-- eventsテーブルに販売期限・口数制限・最低保証カラムを追加
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS end_at        TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS max_count     INTEGER,
  ADD COLUMN IF NOT EXISTS min_guarantee INTEGER;

COMMENT ON COLUMN events.end_at        IS '販売期限（NULLの場合は無制限）';
COMMENT ON COLUMN events.max_count     IS '口数上限（NULLの場合は無制限）';
COMMENT ON COLUMN events.min_guarantee IS '最低保証（1回あたり）';
