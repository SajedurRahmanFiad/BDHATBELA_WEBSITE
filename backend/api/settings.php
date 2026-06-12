<?php
// backend/api/settings.php
require_once '../config.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'store_settings'");
    $row = $stmt->fetch();
    
    if ($row) {
        echo $row['setting_value']; // Already JSON string
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Settings not found']);
    }

} elseif ($method === 'PUT') {
    $data = file_get_contents("php://input");
    // Ensure it's valid JSON
    if (json_decode($data) === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'store_settings'");
    if ($stmt->execute([$data])) {
        echo $data;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update settings']);
    }
}
?>
