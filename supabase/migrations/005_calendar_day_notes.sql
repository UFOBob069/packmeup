-- Day-specific planning notes on the By Day view
ALTER TABLE calendar_days ADD COLUMN IF NOT EXISTS notes TEXT;
