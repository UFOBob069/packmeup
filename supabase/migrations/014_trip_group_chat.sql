-- Separate AI packing help from trip-member group chat.
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'ai'
  CHECK (channel IN ('ai', 'group'));

CREATE INDEX IF NOT EXISTS idx_chat_messages_trip_channel
  ON chat_messages(trip_id, channel, created_at);

-- Legacy rows stay on the AI channel (default).
UPDATE chat_messages SET channel = 'ai' WHERE channel IS NULL;

DROP POLICY IF EXISTS "Insert chat" ON chat_messages;

-- AI chat: editors+ (unchanged intent). Group chat: any trip member can post.
CREATE POLICY "Insert chat" ON chat_messages FOR INSERT WITH CHECK (
  user_has_trip_access(trip_id)
  AND (
    (channel = 'ai' AND user_has_trip_access(trip_id, ARRAY['owner', 'editor']))
    OR (channel = 'group' AND user_id = auth.uid())
  )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;
