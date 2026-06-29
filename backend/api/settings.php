<?php
// backend/api/settings.php
require_once '../config.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'store_settings'");
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Settings not found']);
        exit;
    }

    $settings = json_decode($row['setting_value'], true);
    if ($settings === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode(['error' => 'Invalid stored settings JSON']);
        exit;
    }

    echo json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} elseif ($method === 'PUT') {
    $data = file_get_contents("php://input");
    $settings = json_decode($data, true);

    if ($settings === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $storedValue = json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'store_settings'");
    if ($stmt->execute([$storedValue])) {
        echo $storedValue;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update settings']);
    }
}
?>
