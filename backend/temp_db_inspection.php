<?php
try {
  $pdo = new PDO("mysql:host=localhost;dbname=bdhatbela_db;charset=utf8mb4","root","");
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  $products = $pdo->query('SHOW CREATE TABLE products')->fetch(PDO::FETCH_ASSOC)['Create Table'];
  $variations = $pdo->query('SHOW CREATE TABLE product_variations')->fetch(PDO::FETCH_ASSOC)['Create Table'];
  $orderItems = $pdo->query('SHOW CREATE TABLE order_items')->fetch(PDO::FETCH_ASSOC)['Create Table'];
  $settingsJsonRaw = $pdo->query('SELECT setting_value FROM settings WHERE setting_key = "store_settings"')->fetchColumn();
  $settingsJson = json_decode($settingsJsonRaw, true);

  $data = [
    'productsSchema' => $products,
    'productVariationsSchema' => $variations,
    'orderItemsSchema' => $orderItems,
    'settings' => [
      'raw' => $settingsJsonRaw,
      'parsed' => $settingsJson,
      'shippingCharges' => $settingsJson['shippingCharges'] ?? null,
      'paymentGateways' => $settingsJson['paymentGateways'] ?? null
    ]
  ];

  file_put_contents('db_inspection.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
} catch (Exception $e) {
  file_put_contents('db_inspection_error.txt', $e->getMessage());
}
?>