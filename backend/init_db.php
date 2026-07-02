<?php
// backend/init_db.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain");

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'bdhatbela_db';

try {
    // Connect without DB name first
    $pdo = new PDO("mysql:host=$db_host;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create DB if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    $pdo->exec("USE `$db_name`;");

    echo "Database created or already exists.\n";

    // Create tables
    $tables = [
        "CREATE TABLE IF NOT EXISTS `users` (
            `id` VARCHAR(50) PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `phone` VARCHAR(20) NOT NULL,
            `address` TEXT,
            `role` ENUM('User', 'Admin') DEFAULT 'User',
            `password` VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `staff` (
            `id` VARCHAR(50) PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `phone` VARCHAR(20),
            `role` ENUM('Admin', 'Editor', 'Order Manager') DEFAULT 'Editor',
            `password` VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `categories` (
            `id` VARCHAR(50) PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `icon` VARCHAR(50),
            `image` LONGTEXT,
            `parent_id` VARCHAR(255) DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `products` (
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
            `tags` TEXT,
            `product_type` VARCHAR(20) DEFAULT 'simple',
            `cost_of_goods` DECIMAL(10, 2) DEFAULT 0.00
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `product_images` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `product_id` VARCHAR(50) NOT NULL,
            `image_url` LONGTEXT NOT NULL,
            INDEX `idx_product_images_product_id` (`product_id`),
            CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `product_features` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `product_id` VARCHAR(50) NOT NULL,
            `feature` TEXT NOT NULL,
            INDEX `idx_product_features_product_id` (`product_id`),
            CONSTRAINT `fk_product_features_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `reviews` (
            `id` VARCHAR(50) PRIMARY KEY,
            `product_id` VARCHAR(50) NOT NULL,
            `userName` VARCHAR(100) NOT NULL,
            `rating` INT NOT NULL,
            `comment` TEXT,
            `date` VARCHAR(50),
            `image` LONGTEXT,
            INDEX `idx_reviews_product_id` (`product_id`),
            CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `orders` (
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
            `note` TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `order_items` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `coupons` (
            `id` VARCHAR(50) PRIMARY KEY,
            `code` VARCHAR(64) NOT NULL,
            `name` VARCHAR(200) NOT NULL,
            `type` ENUM('fixed', 'percentage', 'note') NOT NULL DEFAULT 'note',
            `amount` DECIMAL(12, 2) DEFAULT 0.00,
            `percentage` DECIMAL(5, 2) DEFAULT 0.00,
            `note_message` TEXT,
            `is_active` TINYINT(1) DEFAULT 1,
            `start_date` DATETIME DEFAULT NULL,
            `end_date` DATETIME DEFAULT NULL,
            `usage_limit` INT DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `idx_coupons_code` (`code`),
            INDEX `idx_coupons_active_dates` (`is_active`, `start_date`, `end_date`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `coupon_products` (
            `coupon_id` VARCHAR(50) NOT NULL,
            `product_id` VARCHAR(50) NOT NULL,
            PRIMARY KEY (`coupon_id`, `product_id`),
            INDEX `idx_coupon_products_product_id` (`product_id`),
            CONSTRAINT `fk_coupon_products_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
            CONSTRAINT `fk_coupon_products_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `coupon_categories` (
            `coupon_id` VARCHAR(50) NOT NULL,
            `category_id` VARCHAR(50) NOT NULL,
            PRIMARY KEY (`coupon_id`, `category_id`),
            INDEX `idx_coupon_categories_category_id` (`category_id`),
            CONSTRAINT `fk_coupon_categories_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
            CONSTRAINT `fk_coupon_categories_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `banners` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `settings` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `setting_key` VARCHAR(50) UNIQUE NOT NULL,
            `setting_value` JSON NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `contact_messages` (
            `id` VARCHAR(50) PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `phone` VARCHAR(20) NOT NULL,
            `subject` VARCHAR(200) NOT NULL,
            `message` TEXT NOT NULL,
            `is_read` TINYINT(1) DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        "CREATE TABLE IF NOT EXISTS `product_variations` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
    ];

    foreach ($tables as $sql) {
        $pdo->exec($sql);
    }

    // Safe idempotent migrations for databases created before the latest schema.
    try { $pdo->exec("ALTER TABLE `users` DROP COLUMN `email`"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `staff` DROP COLUMN `email`"); } catch(Exception $e) {}

    try { $pdo->exec("ALTER TABLE `categories` ADD COLUMN `parent_id` VARCHAR(255) DEFAULT NULL"); } catch(Exception $e) {}

    try { $pdo->exec("ALTER TABLE `products` ADD COLUMN `weight` DECIMAL(10, 2) NOT NULL DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `products` ADD COLUMN `weightUnit` VARCHAR(20) NOT NULL DEFAULT 'kg'"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `products` ADD COLUMN `tags` TEXT"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `products` ADD COLUMN `product_type` VARCHAR(20) DEFAULT 'simple'"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `products` ADD COLUMN `cost_of_goods` DECIMAL(10, 2) DEFAULT 0.00"); } catch(Exception $e) {}

    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `showButton` TINYINT(1) DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `buttonText` VARCHAR(50) DEFAULT 'Shop Now'"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `buttonLink` VARCHAR(255)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `buttonTextColor` VARCHAR(20) DEFAULT '#FFFFFF'"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `buttonBgColor` VARCHAR(20) DEFAULT '#EF4444'"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `titleColor` VARCHAR(20) DEFAULT '#FFFFFF'"); } catch(Exception $e) {}

    try { $pdo->exec("ALTER TABLE `order_items` ADD COLUMN `variation_id` INT DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `order_items` ADD INDEX `idx_order_items_order_id` (`order_id`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `order_items` ADD INDEX `idx_order_items_product_id` (`product_id`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `order_items` ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `order_items` ADD CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT"); } catch(Exception $e) {}

    try { $pdo->exec("ALTER TABLE `product_features` ADD INDEX `idx_product_features_product_id` (`product_id`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `product_features` ADD CONSTRAINT `fk_product_features_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE"); } catch(Exception $e) {}

    try { $pdo->exec("ALTER TABLE `product_images` ADD INDEX `idx_product_images_product_id` (`product_id`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `product_images` ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE"); } catch(Exception $e) {}

    try { $pdo->exec("ALTER TABLE `reviews` ADD INDEX `idx_reviews_product_id` (`product_id`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `reviews` ADD CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE"); } catch(Exception $e) {}

    try { $pdo->exec("ALTER TABLE `product_variations` MODIFY COLUMN `media` TEXT"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `product_variations` ADD COLUMN `is_default` TINYINT(1) DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `product_variations` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `product_variations` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `product_variations` ADD INDEX `idx_product_variations_product_id` (`product_id`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `product_variations` ADD INDEX `idx_product_variations_product_default` (`product_id`, `is_default`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `product_variations` ADD CONSTRAINT `fk_product_variations_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE"); } catch(Exception $e) {}

    try { $pdo->exec("ALTER TABLE `products` ADD INDEX `idx_products_category` (`category`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `products` ADD INDEX `idx_products_rating` (`rating`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `products` ADD INDEX `idx_products_price` (`price`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `products` ADD INDEX `idx_products_discount_price` (`discountPrice`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `products` ADD INDEX `idx_products_product_type` (`product_type`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `orders` ADD INDEX `idx_orders_date` (`date`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `orders` ADD INDEX `idx_orders_status` (`status`)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `order_items` ADD INDEX `idx_order_items_variation_id` (`variation_id`)"); } catch(Exception $e) {}

    try { $pdo->exec("CREATE TABLE IF NOT EXISTS `coupons` (
        `id` VARCHAR(50) PRIMARY KEY,
        `code` VARCHAR(64) NOT NULL,
        `name` VARCHAR(200) NOT NULL,
        `type` ENUM('fixed', 'percentage', 'note') NOT NULL DEFAULT 'note',
        `amount` DECIMAL(12, 2) DEFAULT 0.00,
        `percentage` DECIMAL(5, 2) DEFAULT 0.00,
        `note_message` TEXT,
        `is_active` TINYINT(1) DEFAULT 1,
        `start_date` DATETIME DEFAULT NULL,
        `end_date` DATETIME DEFAULT NULL,
        `usage_limit` INT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `idx_coupons_code` (`code`),
        INDEX `idx_coupons_active_dates` (`is_active`, `start_date`, `end_date`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"); } catch(Exception $e) {}

    try { $pdo->exec("CREATE TABLE IF NOT EXISTS `coupon_products` (
        `coupon_id` VARCHAR(50) NOT NULL,
        `product_id` VARCHAR(50) NOT NULL,
        PRIMARY KEY (`coupon_id`, `product_id`),
        INDEX `idx_coupon_products_product_id` (`product_id`),
        CONSTRAINT `fk_coupon_products_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_coupon_products_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"); } catch(Exception $e) {}

    try { $pdo->exec("CREATE TABLE IF NOT EXISTS `coupon_categories` (
        `coupon_id` VARCHAR(50) NOT NULL,
        `category_id` VARCHAR(50) NOT NULL,
        PRIMARY KEY (`coupon_id`, `category_id`),
        INDEX `idx_coupon_categories_category_id` (`category_id`),
        CONSTRAINT `fk_coupon_categories_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_coupon_categories_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"); } catch(Exception $e) {}

    try { $pdo->exec("ALTER TABLE `orders` ADD COLUMN `coupon_id` VARCHAR(50) DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `orders` ADD COLUMN `coupon_code` VARCHAR(64) DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `orders` ADD COLUMN `coupon_type` ENUM('fixed', 'percentage', 'note') DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `orders` ADD COLUMN `coupon_discount` DECIMAL(12, 2) DEFAULT 0.00"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `orders` ADD COLUMN `coupon_note_message` TEXT"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `orders` ADD INDEX `idx_orders_coupon_id` (`coupon_id`)"); } catch(Exception $e) {}

    // Normalize old settings into the current StoreSettings shape used by the frontend.
    $pdo->exec("UPDATE `settings`
        SET `setting_value` = JSON_SET(
            `setting_value`,
            '$.shippingCharges.base', COALESCE(JSON_EXTRACT(`setting_value`, '$.shippingCharges.base'), JSON_EXTRACT(`setting_value`, '$.shippingCharges.insideDhaka'), 0),
            '$.shippingCharges.exceptions', COALESCE(JSON_EXTRACT(`setting_value`, '$.shippingCharges.exceptions'), JSON_ARRAY()),
            '$.shippingCharges.dynamicShipping', COALESCE(JSON_EXTRACT(`setting_value`, '$.shippingCharges.dynamicShipping'), JSON_OBJECT('enabled', false, 'perKgCharge', 0, 'startKg', 0)),
            '$.shippingCharges.dynamicShipping.startKg', COALESCE(JSON_EXTRACT(`setting_value`, '$.shippingCharges.dynamicShipping.startKg'), 0),
            '$.shippingCharges.dynamicShipping.perKgCharge', COALESCE(JSON_EXTRACT(`setting_value`, '$.shippingCharges.dynamicShipping.perKgCharge'), 0),

        )
        WHERE `setting_key` = 'store_settings' AND JSON_VALID(`setting_value`)");

    $pdo->exec("UPDATE `settings`
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
        WHERE `setting_key` = 'store_settings' AND JSON_VALID(`setting_value`)");

    echo "Tables and indexes created or verified successfully.\n";

    // Check if initial settings exist
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `settings` WHERE `setting_key` = 'store_settings'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $initial_settings = json_encode([
            'companyName' => 'MyStore',
            'tagline' => 'Just click & get!',
            'logo' => 'https://cdn-icons-png.flaticon.com/512/1162/1162499.png',
            'favicon' => 'https://cdn-icons-png.flaticon.com/512/1162/1162499.png',
            'primaryColor' => '#ef4444',
            'contactPhone' => '016XXXXXXXX',
            'whatsappNumber' => '8801XXXXXXXXX',
            'hotlineHours' => '10:00 AM to 8:00 PM',
            'email' => 'support@shop.com',
            'address' => 'Dhaka, Bangladesh',
            'socialLinks' => [
                'facebook' => ['enabled' => true, 'url' => 'https://facebook.com'],
                'youtube' => ['enabled' => true, 'url' => 'https://youtube.com'],
                'instagram' => ['enabled' => true, 'url' => 'https://instagram.com'],
                'whatsapp' => ['enabled' => false, 'url' => ''],
                'twitter' => ['enabled' => false, 'url' => ''],
                'linkedin' => ['enabled' => false, 'url' => '']
            ],
            'shippingCharges' => [
                'base' => 60,
                'exceptions' => [],
                'dynamicShipping' => [
                    'enabled' => false,
                    'perKgCharge' => 0,
                    'startKg' => 0
                ],
                'insideDhaka' => 60,
                'outsideDhaka' => 120
            ],
            'paymentGateways' => [
                'cod' => ['enabled' => true],
                'bkash' => ['enabled' => true, 'number' => '01XXXXXXXXX', 'type' => 'Personal', 'instructions' => 'Send money to our bKash Personal number and submit the Transaction ID.'],
                'nagad' => ['enabled' => true, 'number' => '01XXXXXXXXX', 'type' => 'Personal', 'instructions' => 'Send money to our Nagad Personal number and submit the Transaction ID.'],
                'rocket' => ['enabled' => true, 'number' => '01XXXXXXXXX', 'type' => 'Personal', 'instructions' => 'Send money to our Rocket Personal number and submit the Transaction ID.'],
                'bank' => ['enabled' => false, 'accountName' => '', 'accountNumber' => '', 'bankName' => '', 'branchName' => '', 'instructions' => 'Deposit to our Bank account and upload the deposit receipt slip.']
            ]
        ]);

        $stmt = $pdo->prepare("INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES ('store_settings', ?)");
        $stmt->execute([$initial_settings]);
        echo "Initial settings inserted.\n";
    }

    // Seed admin user
    $adminPhone = '01700000000';
    $adminPass = password_hash('admin123', PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `users` WHERE `role` = 'Admin' OR `phone` = ?");
    $stmt->execute([$adminPhone]);
    if ($stmt->fetchColumn() == 0) {
        $stmt = $pdo->prepare("INSERT INTO `users` (`id`, `name`, `phone`, `address`, `role`, `password`) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute(['u-admin', 'Admin User', $adminPhone, 'Dhaka, Bangladesh', 'Admin', $adminPass]);
        echo "Default admin user inserted in users table (Phone: 01700000000 / Pass: admin123).\n";
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `staff` WHERE `role` = 'Admin' OR `phone` = ?");
    $stmt->execute([$adminPhone]);
    if ($stmt->fetchColumn() == 0) {
        $stmt = $pdo->prepare("INSERT INTO `staff` (`id`, `name`, `phone`, `role`, `password`) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['s-admin', 'Admin Staff', $adminPhone, 'Admin', $adminPass]);
        echo "Default admin staff inserted in staff table (Phone: 01700000000 / Pass: admin123).\n";
    }

    echo "Initialization complete.\n";

} catch (PDOException $e) {
    echo "Initialization failed: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Initialization failed: " . $e->getMessage() . "\n";
}
?>
