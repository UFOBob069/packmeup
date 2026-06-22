-- Subcategory for gear items (e.g. shirts, shorts, swimsuits within clothing)
ALTER TABLE gear_items ADD COLUMN subcategory TEXT;

CREATE INDEX idx_gear_items_subcategory ON gear_items(user_id, category, subcategory);
