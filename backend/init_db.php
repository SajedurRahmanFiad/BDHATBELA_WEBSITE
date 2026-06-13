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
        );",

        "CREATE TABLE IF NOT EXISTS `staff` (
            `id` VARCHAR(50) PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `phone` VARCHAR(20),
            `role` ENUM('Admin', 'Editor', 'Order Manager') DEFAULT 'Editor',
            `password` VARCHAR(255) NOT NULL
        );",

        "CREATE TABLE IF NOT EXISTS `categories` (
            `id` VARCHAR(50) PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `icon` VARCHAR(50),
            `image` LONGTEXT,
            `parent_id` VARCHAR(50) DEFAULT NULL
        );",

        "CREATE TABLE IF NOT EXISTS `products` (
            `id` VARCHAR(50) PRIMARY KEY,
            `name` VARCHAR(200) NOT NULL,
            `shortDescription` LONGTEXT,
            `description` LONGTEXT,
            `price` DECIMAL(10, 2) NOT NULL,
            `discountPrice` DECIMAL(10, 2),
            `category` VARCHAR(50) NOT NULL,
            `stock` INT DEFAULT 0,
            `weight` DECIMAL(10, 2) DEFAULT 0,
            `weightUnit` VARCHAR(20) DEFAULT 'kg',
            `rating` DECIMAL(3, 2) DEFAULT 0,
            `badge` VARCHAR(50)
        );",

        "CREATE TABLE IF NOT EXISTS `product_images` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `product_id` VARCHAR(50) NOT NULL,
            `image_url` LONGTEXT NOT NULL,
            FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
        );",

        "CREATE TABLE IF NOT EXISTS `product_features` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `product_id` VARCHAR(50) NOT NULL,
            `feature` TEXT NOT NULL,
            FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
        );",

        "CREATE TABLE IF NOT EXISTS `reviews` (
            `id` VARCHAR(50) PRIMARY KEY,
            `product_id` VARCHAR(50) NOT NULL,
            `userName` VARCHAR(100) NOT NULL,
            `rating` INT NOT NULL,
            `comment` TEXT,
            `date` VARCHAR(50),
            `image` LONGTEXT,
            FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
        );",

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
        );",

        "CREATE TABLE IF NOT EXISTS `order_items` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `order_id` VARCHAR(50) NOT NULL,
            `product_id` VARCHAR(50) NOT NULL,
            `product_name` VARCHAR(200) NOT NULL,
            `price` DECIMAL(10, 2) NOT NULL,
            `quantity` INT NOT NULL,
            `image` LONGTEXT,
            FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
        );",

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
        );",

        "CREATE TABLE IF NOT EXISTS `settings` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `setting_key` VARCHAR(50) UNIQUE NOT NULL,
            `setting_value` JSON NOT NULL
        );",

        "CREATE TABLE IF NOT EXISTS `contact_messages` (
            `id` VARCHAR(50) PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `phone` VARCHAR(20) NOT NULL,
            `subject` VARCHAR(200) NOT NULL,
            `message` TEXT NOT NULL,
            `is_read` TINYINT(1) DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );"
    ];

    foreach ($tables as $sql) {
        $pdo->exec($sql);
    }
    
    // Drop legacy email columns if they exist
    try { $pdo->exec("ALTER TABLE `users` DROP COLUMN `email`"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `staff` DROP COLUMN `email`"); } catch(Exception $e) {}

    // Add parent_id to categories
    try { $pdo->exec("ALTER TABLE `categories` ADD COLUMN `parent_id` VARCHAR(255) DEFAULT NULL"); } catch(Exception $e) {}

    // Add banner columns
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `showButton` TINYINT(1) DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `buttonText` VARCHAR(50) DEFAULT 'Shop Now'"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `buttonLink` VARCHAR(255)"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `buttonTextColor` VARCHAR(20) DEFAULT '#FFFFFF'"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `buttonBgColor` VARCHAR(20) DEFAULT '#EF4444'"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `banners` ADD COLUMN `titleColor` VARCHAR(20) DEFAULT '#FFFFFF'"); } catch(Exception $e) {}

    // Add product weight fields if missing
    try { $pdo->exec("ALTER TABLE `products` ADD COLUMN `weight` DECIMAL(10, 2) DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE `products` ADD COLUMN `weightUnit` VARCHAR(20) DEFAULT 'kg'"); } catch(Exception $e) {}

    // Add variation_id to order_items
    try { $pdo->exec("ALTER TABLE `order_items` ADD COLUMN `variation_id` INT DEFAULT NULL"); } catch(Exception $e) {}

    echo "Tables created successfully.\n";
    
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
}
?>
