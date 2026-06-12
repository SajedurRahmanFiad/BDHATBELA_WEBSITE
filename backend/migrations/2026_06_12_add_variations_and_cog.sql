-- Migration: add productType, cost_of_goods, and variations table
-- Safe to run on live server; preserves existing products as simple products by default

START TRANSACTION;

-- Add product_type and cost_of_goods to products table
-- Assuming products are stored in `products` table with columns matching frontend types

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'simple';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_of_goods DECIMAL(10,2) DEFAULT 0.00;

-- Create variations table to hold variation units for variation products
CREATE TABLE IF NOT EXISTS product_variations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- product IDs are string-based in this app (e.g. "p-12345"), use VARCHAR to match
  product_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  media VARCHAR(1024),
  price DECIMAL(12,2) NOT NULL,
  discount_price DECIMAL(12,2),
  cost_of_goods DECIMAL(12,2) DEFAULT 0.00,
  weight DECIMAL(10,3),
  stock INT DEFAULT 0,
  sku VARCHAR(128),
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (product_id),
  CONSTRAINT fk_product_variations_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- For existing tables that might be missing the is_default column from earlier versions
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS is_default TINYINT(1) DEFAULT 0;

COMMIT;

-- Notes:
-- 1) This migration keeps existing products as 'simple'.
-- 2) To migrate existing price/stock into variations for specific products, insert into product_variations and update product_type to 'variation'.
-- 3) Manage uploads/media referencing using the existing uploads table or file storage mechanism.
