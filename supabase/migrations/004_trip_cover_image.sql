-- Destination cover images (cached Unsplash URLs)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
