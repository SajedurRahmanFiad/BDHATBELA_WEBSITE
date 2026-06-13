START TRANSACTION;

-- Add parent_id column to categories table if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id VARCHAR(255) DEFAULT NULL;

-- Optionally, we can add a foreign key constraint to link parent_id back to id
-- ALTER TABLE categories ADD CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Ensure startKg field is present in store settings JSON
UPDATE `settings`
SET `setting_value` = JSON_SET(
    setting_value,
    '$.shippingCharges.dynamicShipping.startKg',
    COALESCE(
        JSON_EXTRACT(setting_value, '$.shippingCharges.dynamicShipping.startKg'),
        0
    )
)
WHERE setting_key = 'store_settings';

COMMIT;

-- Notes:
-- This script adds the parent_id column for creating hierarchical categories.
