<?php
// backend/api/test.php
require_once '../config.php';

echo json_encode([
    'status' => 'connected',
    'timestamp' => date('Y-m-d H:i:s'),
    'message' => 'Database connection successful'
]);
?>
