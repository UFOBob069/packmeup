-- PackForVacation.com - Initial Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  travel_type TEXT NOT NULL CHECK (travel_type IN ('carry_on', 'checked_bag', 'multiple_bags', 'road_trip')),
  laundry_access TEXT NOT NULL DEFAULT 'limited' CHECK (laundry_access IN ('none', 'limited', 'full')),
  style_preference TEXT NOT NULL DEFAULT 'casual' CHECK (style_preference IN ('casual', 'smart_casual', 'business', 'formal', 'athletic', 'minimalist')),
  packing_mode TEXT NOT NULL DEFAULT 'standard' CHECK (packing_mode IN ('standard', 'minimalist', 'comfort', 'carry_on_optimized')),
  special_notes TEXT,
  weather_data JSONB,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip Members (collaborators)
CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Trip Invites
CREATE TABLE trip_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, email)
);

-- Travelers
CREATE TABLE travelers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  traveler_type TEXT NOT NULL DEFAULT 'adult' CHECK (traveler_type IN ('adult', 'child', 'infant', 'pet')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packing Items
CREATE TABLE packing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  traveler_id UUID REFERENCES travelers(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'clothing', 'shoes', 'toiletries', 'electronics', 'travel_documents',
    'medications', 'activity_gear', 'pet_supplies', 'miscellaneous'
  )),
  item_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  packed BOOLEAN NOT NULL DEFAULT FALSE,
  shared BOOLEAN NOT NULL DEFAULT FALSE,
  activity_name TEXT,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outfits
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  trip_date DATE NOT NULL,
  time_of_day TEXT NOT NULL DEFAULT 'morning' CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'all_day')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  activity_name TEXT,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Days
CREATE TABLE calendar_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  trip_date DATE NOT NULL,
  title TEXT NOT NULL,
  activities JSONB DEFAULT '[]',
  weather_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, trip_date)
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trips_owner ON trips(owner_id);
CREATE INDEX idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user ON trip_members(user_id);
CREATE INDEX idx_travelers_trip ON travelers(trip_id);
CREATE INDEX idx_packing_items_trip ON packing_items(trip_id);
CREATE INDEX idx_outfits_trip ON outfits(trip_id);
CREATE INDEX idx_calendar_days_trip ON calendar_days(trip_id);
CREATE INDEX idx_templates_user ON templates(user_id);
CREATE INDEX idx_chat_messages_trip ON chat_messages(trip_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function: check trip access
CREATE OR REPLACE FUNCTION user_has_trip_access(trip_uuid UUID, required_roles TEXT[] DEFAULT ARRAY['owner', 'editor', 'viewer'])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = trip_uuid AND t.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM trip_members tm
    WHERE tm.trip_id = trip_uuid AND tm.user_id = auth.uid() AND tm.role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trips policies
CREATE POLICY "Users can view accessible trips" ON trips FOR SELECT
  USING (owner_id = auth.uid() OR user_has_trip_access(id));
CREATE POLICY "Users can create trips" ON trips FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update trips" ON trips FOR UPDATE
  USING (owner_id = auth.uid() OR user_has_trip_access(id, ARRAY['owner', 'editor']));
CREATE POLICY "Owners can delete trips" ON trips FOR DELETE USING (owner_id = auth.uid());

-- Trip members policies
CREATE POLICY "View trip members" ON trip_members FOR SELECT USING (user_has_trip_access(trip_id));
CREATE POLICY "Owners manage members" ON trip_members FOR ALL USING (
  EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND owner_id = auth.uid())
);

-- Travelers, activities, packing, outfits, calendar, chat policies
CREATE POLICY "View travelers" ON travelers FOR SELECT USING (user_has_trip_access(trip_id));
CREATE POLICY "Edit travelers" ON travelers FOR ALL USING (user_has_trip_access(trip_id, ARRAY['owner', 'editor']));

CREATE POLICY "View activities" ON activities FOR SELECT USING (user_has_trip_access(trip_id));
CREATE POLICY "Edit activities" ON activities FOR ALL USING (user_has_trip_access(trip_id, ARRAY['owner', 'editor']));

CREATE POLICY "View packing items" ON packing_items FOR SELECT USING (user_has_trip_access(trip_id));
CREATE POLICY "Edit packing items" ON packing_items FOR ALL USING (user_has_trip_access(trip_id, ARRAY['owner', 'editor']));

CREATE POLICY "View outfits" ON outfits FOR SELECT USING (user_has_trip_access(trip_id));
CREATE POLICY "Edit outfits" ON outfits FOR ALL USING (user_has_trip_access(trip_id, ARRAY['owner', 'editor']));

CREATE POLICY "View calendar" ON calendar_days FOR SELECT USING (user_has_trip_access(trip_id));
CREATE POLICY "Edit calendar" ON calendar_days FOR ALL USING (user_has_trip_access(trip_id, ARRAY['owner', 'editor']));

CREATE POLICY "View chat" ON chat_messages FOR SELECT USING (user_has_trip_access(trip_id));
CREATE POLICY "Insert chat" ON chat_messages FOR INSERT WITH CHECK (user_has_trip_access(trip_id, ARRAY['owner', 'editor']));

CREATE POLICY "View own templates" ON templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Manage own templates" ON templates FOR ALL USING (user_id = auth.uid());

CREATE POLICY "View invites" ON trip_invites FOR SELECT USING (user_has_trip_access(trip_id, ARRAY['owner']));
CREATE POLICY "Manage invites" ON trip_invites FOR ALL USING (
  EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND owner_id = auth.uid())
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE packing_items;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', NEW.raw_user_meta_data->>'email_address'),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', 'user'), '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
