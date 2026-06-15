-- Add product-level SKU column and unique index
ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `sku` VARCHAR(255) DEFAULT NULL,
  ADD UNIQUE INDEX IF NOT EXISTS `idx_products_sku` (`sku`);
