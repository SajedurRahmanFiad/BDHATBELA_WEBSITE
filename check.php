<?php
require 'backend/config.php';
$stmt = $pdo->query('DESCRIBE banners');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
