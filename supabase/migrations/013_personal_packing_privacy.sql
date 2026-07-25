-- Personal packing privacy: each member sees their own checklist + shared items.
-- Outfits (what to wear on By Day) are personal; day notes/activities stay trip-shared.

ALTER TABLE packing_items
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE outfits
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_packing_items_user_id ON packing_items(user_id);
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON outfits(user_id);

-- Backfill existing rows to the trip owner (solo/family lists stay intact for the host).
UPDATE packing_items pi
SET user_id = t.owner_id
FROM trips t
WHERE pi.trip_id = t.id
  AND pi.user_id IS NULL;

UPDATE outfits o
SET user_id = t.owner_id
FROM trips t
WHERE o.trip_id = t.id
  AND o.user_id IS NULL;

DROP POLICY IF EXISTS "View packing items" ON packing_items;
DROP POLICY IF EXISTS "Edit packing items" ON packing_items;
DROP POLICY IF EXISTS "View outfits" ON outfits;
DROP POLICY IF EXISTS "Edit outfits" ON outfits;

CREATE POLICY "View packing items" ON packing_items FOR SELECT USING (
  user_has_trip_access(trip_id)
  AND (shared = true OR user_id = auth.uid())
);

CREATE POLICY "Insert packing items" ON packing_items FOR INSERT WITH CHECK (
  user_has_trip_access(trip_id, ARRAY['owner', 'editor'])
  AND (shared = true OR user_id = auth.uid())
);

CREATE POLICY "Update packing items" ON packing_items FOR UPDATE USING (
  user_has_trip_access(trip_id, ARRAY['owner', 'editor'])
  AND (shared = true OR user_id = auth.uid())
);

CREATE POLICY "Delete packing items" ON packing_items FOR DELETE USING (
  user_has_trip_access(trip_id, ARRAY['owner', 'editor'])
  AND (shared = true OR user_id = auth.uid())
);

CREATE POLICY "View outfits" ON outfits FOR SELECT USING (
  user_has_trip_access(trip_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Insert outfits" ON outfits FOR INSERT WITH CHECK (
  user_has_trip_access(trip_id, ARRAY['owner', 'editor'])
  AND user_id = auth.uid()
);

CREATE POLICY "Update outfits" ON outfits FOR UPDATE USING (
  user_has_trip_access(trip_id, ARRAY['owner', 'editor'])
  AND user_id = auth.uid()
);

CREATE POLICY "Delete outfits" ON outfits FOR DELETE USING (
  user_has_trip_access(trip_id, ARRAY['owner', 'editor'])
  AND user_id = auth.uid()
);
