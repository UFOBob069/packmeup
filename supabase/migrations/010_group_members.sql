-- My Group: reusable travelers for future trips
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  traveler_type TEXT NOT NULL DEFAULT 'adult' CHECK (traveler_type IN ('adult', 'child', 'infant', 'pet')),
  pet_species TEXT CHECK (pet_species IN ('dog', 'cat', 'other')),
  pet_size TEXT CHECK (pet_size IN ('small', 'medium', 'large')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE UNIQUE INDEX idx_group_members_user_name_type ON group_members(user_id, lower(name), traveler_type);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own group" ON group_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Manage own group" ON group_members FOR ALL USING (user_id = auth.uid());
