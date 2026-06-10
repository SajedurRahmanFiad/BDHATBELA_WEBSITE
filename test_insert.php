<?php
require 'backend/config.php';
$id = 'b-123';
$image = 'test';
$title = 'Test';
$link = null;
$showButton = 0;
$buttonText = 'Shop Now';
$buttonTextColor = '#FFFFFF';
$buttonBgColor = '#EF4444';

try {
    $stmt = $pdo->prepare("INSERT INTO banners (id, image, title, link, showButton, buttonText, buttonTextColor, buttonBgColor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    if ($stmt->execute([$id, $image, $title, $link, $showButton, $buttonText, $buttonTextColor, $buttonBgColor])) {
        echo "Success\n";
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
