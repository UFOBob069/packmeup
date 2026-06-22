-- My Gear: reusable personal item library
CREATE TABLE gear_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'clothing', 'shoes', 'toiletries', 'electronics', 'travel_documents',
    'medications', 'activity_gear', 'pet_supplies', 'miscellaneous'
  )),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gear_items_user ON gear_items(user_id);
CREATE UNIQUE INDEX idx_gear_items_user_name ON gear_items(user_id, lower(item_name));

ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own gear" ON gear_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Manage own gear" ON gear_items FOR ALL USING (user_id = auth.uid());
