<?php
try {
  $pdo = new PDO("mysql:host=localhost;dbname=bdhatbela_db;charset=utf8mb4","root","");
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  echo "SHOW CREATE TABLE products:\n";
  $row = $pdo->query('SHOW CREATE TABLE products')->fetch(PDO::FETCH_ASSOC);
  echo $row['Create Table'] . "\n\n";

  echo "SHOW CREATE TABLE product_variations:\n";
  $row = $pdo->query('SHOW CREATE TABLE product_variations')->fetch(PDO::FETCH_ASSOC);
  echo $row['Create Table'] . "\n\n";

  echo "SETTINGS JSON:\n";
  $stmt = $pdo->query('SELECT setting_value FROM settings WHERE setting_key = "store_settings"');
  $value = $stmt->fetchColumn();
  echo $value . "\n";
} catch (Exception $e) {
  echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
?>