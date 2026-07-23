-- Allow people on the same trip to see each other's names/avatars.
-- (Previously profiles were only SELECT-able by the owner of that row.)
CREATE POLICY "View profiles of trip collaborators"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM trip_members me
      JOIN trip_members them ON them.trip_id = me.trip_id
      WHERE me.user_id = auth.uid()
        AND them.user_id = profiles.id
    )
    OR EXISTS (
      SELECT 1
      FROM trips t
      WHERE t.owner_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = profiles.id
        )
    )
    OR EXISTS (
      SELECT 1
      FROM trips t
      JOIN trip_members tm ON tm.trip_id = t.id
      WHERE tm.user_id = auth.uid()
        AND t.owner_id = profiles.id
    )
  );
