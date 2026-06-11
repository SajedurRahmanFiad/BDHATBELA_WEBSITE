-- Add product weight fields and advanced shipping settings to the database.
-- Run this on the live database to update existing tables and settings.

ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `weight` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `weightUnit` VARCHAR(20) NOT NULL DEFAULT 'kg';

UPDATE `settings`
SET `setting_value` = JSON_SET(
    setting_value,
    '$.shippingCharges.base',
      COALESCE(JSON_EXTRACT(setting_value, '$.shippingCharges.base'), JSON_EXTRACT(setting_value, '$.shippingCharges.insideDhaka'), 0),
    '$.shippingCharges.exceptions',
      COALESCE(JSON_EXTRACT(setting_value, '$.shippingCharges.exceptions'), JSON_ARRAY()),
    '$.shippingCharges.dynamicShipping',
      COALESCE(JSON_EXTRACT(setting_value, '$.shippingCharges.dynamicShipping'), JSON_OBJECT('enabled', false, 'perKgCharge', 0))
)
WHERE setting_key = 'store_settings';
