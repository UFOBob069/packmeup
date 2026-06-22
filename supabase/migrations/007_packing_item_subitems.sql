-- Nested packing items: specific gear under a parent line item (e.g. "10 shirts" → "Blue Nike Polo")
ALTER TABLE packing_items
  ADD COLUMN parent_item_id UUID REFERENCES packing_items(id) ON DELETE CASCADE,
  ADD COLUMN gear_item_id UUID REFERENCES gear_items(id) ON DELETE SET NULL;

CREATE INDEX idx_packing_items_parent ON packing_items(parent_item_id);
