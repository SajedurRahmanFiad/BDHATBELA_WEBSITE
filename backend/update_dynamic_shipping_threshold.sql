-- Add the new dynamic shipping threshold field to existing store settings.
-- This will ensure older settings records include the new startKg property.

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
