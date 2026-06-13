-- Migration: fix product_variations.media column size
-- Change from VARCHAR(1024) to TEXT to support JSON arrays of multiple image URLs

ALTER TABLE `product_variations`
  MODIFY COLUMN `media` TEXT;
