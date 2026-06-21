-- Traveler pet details + multi style preferences
ALTER TABLE travelers ADD COLUMN IF NOT EXISTS pet_species TEXT;
ALTER TABLE travelers ADD COLUMN IF NOT EXISTS pet_size TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS style_preferences JSONB DEFAULT '["casual"]'::jsonb;
