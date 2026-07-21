-- Grocery, arrival, and reminder items for the unified trip workspace
CREATE TABLE IF NOT EXISTS trip_workspace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('grocery', 'arrival', 'reminder')),
  title TEXT NOT NULL,
  details TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_workspace_items_trip
  ON trip_workspace_items(trip_id, kind, sort_order);

ALTER TABLE trip_workspace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View trip workspace items"
  ON trip_workspace_items FOR SELECT
  USING (user_has_trip_access(trip_id));

CREATE POLICY "Edit trip workspace items"
  ON trip_workspace_items FOR ALL
  USING (user_has_trip_access(trip_id, ARRAY['owner', 'editor']))
  WITH CHECK (user_has_trip_access(trip_id, ARRAY['owner', 'editor']));

ALTER PUBLICATION supabase_realtime ADD TABLE trip_workspace_items;
