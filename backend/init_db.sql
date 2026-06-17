-- backend/init_db.sql
-- Safe schema initialization and migration script for bdhatbela_db.
-- This script is designed to be idempotent: it creates missing tables and columns,
-- and updates settings JSON fields without dropping or deleting existing production data.

CREATE DATABASE IF NOT EXISTS `bdhatbela_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bdhatbela_db`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `address` TEXT,
  `role` ENUM('User', 'Admin') DEFAULT 'User',
  `password` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20),
  `role` ENUM('Admin', 'Editor', 'Order Manager') DEFAULT 'Editor',
  `password` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50),
  `image` LONGTEXT,
  `parent_id` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `shortDescription` LONGTEXT,
  `description` LONGTEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `discountPrice` DECIMAL(10, 2),
  `category` VARCHAR(50) NOT NULL,
  `stock` INT DEFAULT 0,
  `weight` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `weightUnit` VARCHAR(20) NOT NULL DEFAULT 'kg',
  `rating` DECIMAL(3, 2) DEFAULT 0,
  `badge` VARCHAR(50),
  `product_type` VARCHAR(20) DEFAULT 'simple',
  `cost_of_goods` DECIMAL(10, 2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` VARCHAR(50) NOT NULL,
  `image_url` LONGTEXT NOT NULL,
  INDEX `idx_product_images_product_id` (`product_id`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_features` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` VARCHAR(50) NOT NULL,
  `feature` TEXT NOT NULL,
  INDEX `idx_product_features_product_id` (`product_id`),
  CONSTRAINT `fk_product_features_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(50) PRIMARY KEY,
  `product_id` VARCHAR(50) NOT NULL,
  `userName` VARCHAR(100) NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT,
  `date` VARCHAR(50),
  `image` LONGTEXT,
  INDEX `idx_reviews_product_id` (`product_id`),
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(50) PRIMARY KEY,
  `customerId` VARCHAR(50),
  `customerName` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `address` TEXT NOT NULL,
  `area` VARCHAR(100) NOT NULL,
  `total` DECIMAL(10, 2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `date` VARCHAR(50) NOT NULL,
  `paymentMethod` VARCHAR(50) NOT NULL,
  `note` TEXT,
  `eventId` VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(50) NOT NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `quantity` INT NOT NULL,
  `image` LONGTEXT,
  `variation_id` INT DEFAULT NULL,
  INDEX `idx_order_items_order_id` (`order_id`),
  INDEX `idx_order_items_product_id` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `banners` (
  `id` VARCHAR(50) PRIMARY KEY,
  `image` LONGTEXT NOT NULL,
  `title` VARCHAR(200),
  `link` VARCHAR(255),
  `showButton` TINYINT(1) DEFAULT 0,
  `buttonText` VARCHAR(50) DEFAULT 'Shop Now',
  `buttonLink` VARCHAR(255),
  `buttonTextColor` VARCHAR(20) DEFAULT '#FFFFFF',
  `buttonBgColor` VARCHAR(20) DEFAULT '#EF4444',
  `titleColor` VARCHAR(20) DEFAULT '#FFFFFF'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(50) UNIQUE NOT NULL,
  `setting_value` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_variations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `media` TEXT,
  `price` DECIMAL(12, 2) NOT NULL,
  `discount_price` DECIMAL(12, 2),
  `cost_of_goods` DECIMAL(12, 2) DEFAULT 0.00,
  `weight` DECIMAL(10, 3),
  `stock` INT DEFAULT 0,
  `sku` VARCHAR(128),
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_product_variations_product_id` (`product_id`),
  CONSTRAINT `fk_product_variations_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `address` TEXT,
  ADD COLUMN IF NOT EXISTS `role` ENUM('User', 'Admin') DEFAULT 'User',
  ADD COLUMN IF NOT EXISTS `password` VARCHAR(255) NOT NULL;

ALTER TABLE `staff`
  ADD COLUMN IF NOT EXISTS `phone` VARCHAR(20),
  ADD COLUMN IF NOT EXISTS `role` ENUM('Admin', 'Editor', 'Order Manager') DEFAULT 'Editor',
  ADD COLUMN IF NOT EXISTS `password` VARCHAR(255) NOT NULL;

ALTER TABLE `categories`
  ADD COLUMN IF NOT EXISTS `parent_id` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `shortDescription` LONGTEXT,
  ADD COLUMN IF NOT EXISTS `description` LONGTEXT,
  ADD COLUMN IF NOT EXISTS `discountPrice` DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS `stock` INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `weight` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `weightUnit` VARCHAR(20) NOT NULL DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS `rating` DECIMAL(3, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `badge` VARCHAR(50),
  ADD COLUMN IF NOT EXISTS `product_type` VARCHAR(20) DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS `cost_of_goods` DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE `order_items`
  ADD COLUMN IF NOT EXISTS `variation_id` INT DEFAULT NULL;

ALTER TABLE `order_items`
  ADD INDEX IF NOT EXISTS `idx_order_items_order_id` (`order_id`),
  ADD INDEX IF NOT EXISTS `idx_order_items_product_id` (`product_id`),
  ADD INDEX IF NOT EXISTS `idx_order_items_variation_id` (`variation_id`);

ALTER TABLE `products`
  ADD INDEX IF NOT EXISTS `idx_products_category` (`category`),
  ADD INDEX IF NOT EXISTS `idx_products_rating` (`rating`),
  ADD INDEX IF NOT EXISTS `idx_products_price` (`price`),
  ADD INDEX IF NOT EXISTS `idx_products_discount_price` (`discountPrice`),
  ADD INDEX IF NOT EXISTS `idx_products_product_type` (`product_type`);

ALTER TABLE `product_variations`
  ADD INDEX IF NOT EXISTS `idx_product_variations_product_default` (`product_id`, `is_default`);

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `eventId` VARCHAR(100) DEFAULT NULL,
  ADD INDEX IF NOT EXISTS `idx_orders_date` (`date`),
  ADD INDEX IF NOT EXISTS `idx_orders_status` (`status`);

ALTER TABLE `banners`
  ADD COLUMN IF NOT EXISTS `showButton` TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `buttonText` VARCHAR(50) DEFAULT 'Shop Now',
  ADD COLUMN IF NOT EXISTS `buttonLink` VARCHAR(255),
  ADD COLUMN IF NOT EXISTS `buttonTextColor` VARCHAR(20) DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS `buttonBgColor` VARCHAR(20) DEFAULT '#EF4444',
  ADD COLUMN IF NOT EXISTS `titleColor` VARCHAR(20) DEFAULT '#FFFFFF';

ALTER TABLE `product_variations`
  ADD COLUMN IF NOT EXISTS `is_default` TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE `settings`
SET `setting_value` = JSON_SET(
  `setting_value`,
  '$.shippingCharges.base', COALESCE(JSON_EXTRACT(`setting_value`, '$.shippingCharges.base'), JSON_EXTRACT(`setting_value`, '$.shippingCharges.insideDhaka'), 0),
  '$.shippingCharges.exceptions', COALESCE(JSON_EXTRACT(`setting_value`, '$.shippingCharges.exceptions'), JSON_ARRAY()),
  '$.shippingCharges.dynamicShipping', COALESCE(JSON_EXTRACT(`setting_value`, '$.shippingCharges.dynamicShipping'), JSON_OBJECT('enabled', false, 'perKgCharge', 0, 'startKg', 0)),
  '$.shippingCharges.dynamicShipping.startKg', COALESCE(JSON_EXTRACT(`setting_value`, '$.shippingCharges.dynamicShipping.startKg'), 0),
  '$.shippingCharges.dynamicShipping.perKgCharge', COALESCE(JSON_EXTRACT(`setting_value`, '$.shippingCharges.dynamicShipping.perKgCharge'), 0),
  '$.metaPixel', COALESCE(JSON_EXTRACT(`setting_value`, '$.metaPixel'), JSON_OBJECT('enabled', false, 'pixelId', '', 'businessAccountId', '', 'accessToken', '', 'domain', '', 'currency', 'BDT', 'timezone', 'Asia/Dhaka')),
  '$.metaPixel.enabled', COALESCE(JSON_EXTRACT(`setting_value`, '$.metaPixel.enabled'), false),
  '$.metaPixel.pixelId', COALESCE(JSON_EXTRACT(`setting_value`, '$.metaPixel.pixelId'), ''),
  '$.metaPixel.businessAccountId', COALESCE(JSON_EXTRACT(`setting_value`, '$.metaPixel.businessAccountId'), ''),
  '$.metaPixel.accessToken', COALESCE(JSON_EXTRACT(`setting_value`, '$.metaPixel.accessToken'), ''),
  '$.metaPixel.domain', COALESCE(JSON_EXTRACT(`setting_value`, '$.metaPixel.domain'), ''),
  '$.metaPixel.currency', COALESCE(JSON_EXTRACT(`setting_value`, '$.metaPixel.currency'), 'BDT'),
  '$.metaPixel.timezone', COALESCE(JSON_EXTRACT(`setting_value`, '$.metaPixel.timezone'), 'Asia/Dhaka')
)
WHERE `setting_key` = 'store_settings' AND JSON_VALID(`setting_value`);

-- Migration: add product-level SKU column and unique index
ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `sku` VARCHAR(255) DEFAULT NULL,
  ADD UNIQUE INDEX IF NOT EXISTS `idx_products_sku` (`sku`);

UPDATE `settings`
SET `setting_value` = JSON_SET(
  `setting_value`,
  '$.socialLinks.facebook', JSON_OBJECT(
    'enabled', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.facebook')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.facebook.enabled'), IF(JSON_EXTRACT(`setting_value`, '$.socialLinks.facebook') IS NULL, false, true)),
    'url', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.facebook')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.facebook.url'), JSON_UNQUOTE(JSON_EXTRACT(`setting_value`, '$.socialLinks.facebook')))
  ),
  '$.socialLinks.instagram', JSON_OBJECT(
    'enabled', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.instagram')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.instagram.enabled'), IF(JSON_EXTRACT(`setting_value`, '$.socialLinks.instagram') IS NULL, false, true)),
    'url', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.instagram')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.instagram.url'), JSON_UNQUOTE(JSON_EXTRACT(`setting_value`, '$.socialLinks.instagram')))
  ),
  '$.socialLinks.youtube', JSON_OBJECT(
    'enabled', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.youtube')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.youtube.enabled'), IF(JSON_EXTRACT(`setting_value`, '$.socialLinks.youtube') IS NULL, false, true)),
    'url', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.youtube')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.youtube.url'), JSON_UNQUOTE(JSON_EXTRACT(`setting_value`, '$.socialLinks.youtube')))
  ),
  '$.socialLinks.twitter', JSON_OBJECT(
    'enabled', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.twitter')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.twitter.enabled'), IF(JSON_EXTRACT(`setting_value`, '$.socialLinks.twitter') IS NULL, false, true)),
    'url', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.twitter')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.twitter.url'), JSON_UNQUOTE(JSON_EXTRACT(`setting_value`, '$.socialLinks.twitter')))
  ),
  '$.socialLinks.linkedin', JSON_OBJECT(
    'enabled', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.linkedin')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.linkedin.enabled'), IF(JSON_EXTRACT(`setting_value`, '$.socialLinks.linkedin') IS NULL, false, true)),
    'url', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.linkedin')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.linkedin.url'), JSON_UNQUOTE(JSON_EXTRACT(`setting_value`, '$.socialLinks.linkedin')))
  ),
  '$.socialLinks.whatsapp', JSON_OBJECT(
    'enabled', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.whatsapp')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.whatsapp.enabled'), IF(JSON_EXTRACT(`setting_value`, '$.socialLinks.whatsapp') IS NULL, false, true)),
    'url', IF(JSON_TYPE(JSON_EXTRACT(`setting_value`, '$.socialLinks.whatsapp')) = 'OBJECT', JSON_EXTRACT(`setting_value`, '$.socialLinks.whatsapp.url'), JSON_UNQUOTE(JSON_EXTRACT(`setting_value`, '$.socialLinks.whatsapp')))
  )
)
WHERE `setting_key` = 'store_settings' AND JSON_VALID(`setting_value`);

-- Migration: YouTube Embedding Support (2026-06-18)
-- Feature: Add YouTube video embedding to product gallery alongside uploaded images/videos
-- 
-- Storage Implementation:
-- - YouTube URLs are stored within the existing JSON array columns:
--   * `products.images` (stored via product_images.image_url)
--   * `product_variations.media` (stored as JSON array)
-- 
-- Data Structure:
-- The images/media arrays contain both image URLs and YouTube URLs merged with priority ordering:
-- Example: ["https://www.youtube.com/watch?v=VIDEO_ID", "https://example.com/image1.jpg", "https://example.com/image2.jpg"]
-- 
-- Where the first item is the YouTube video marked with "show first" checkbox (if selected),
-- followed by uploaded images, then additional YouTube videos.
--
-- Schema Compatibility:
-- - Existing UTF8MB4 charset supports YouTube URL storage
-- - No new columns required (leverages existing image/media JSON columns)
-- - Backward compatible: existing image-only galleries continue to work unchanged
--
-- Admin Features:
-- - Add/remove multiple YouTube video links per product and variation
-- - Checkbox for "show first" ensures only one primary video per product/variation (mutually exclusive)
-- - URLs normalized to https://www.youtube.com/watch?v=VIDEO_ID format
--
-- Frontend Rendering:
-- - ProductDetail gallery detects YouTube URLs via regex and renders as iframe
-- - Thumbnails show YouTube video thumbnail with play indicator
-- - Supports mixed galleries: YouTube videos + images + video files
--
-- No direct schema changes needed; YouTube URLs coexist with image URLs in JSON arrays
