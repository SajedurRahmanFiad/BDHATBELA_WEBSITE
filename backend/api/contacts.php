<?php
// backend/api/contacts.php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $id = 'c-' . time() . rand(100, 999);
    $name = $data['name'] ?? '';
    $phone = $data['phone'] ?? '';
    $subject = $data['subject'] ?? '';
    $message = $data['message'] ?? '';

    $stmt = $pdo->prepare("INSERT INTO contact_messages (id, name, phone, subject, message) VALUES (?, ?, ?, ?, ?)");
    if ($stmt->execute([$id, $name, $phone, $subject, $message])) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save message']);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Message ID required']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM contact_messages WHERE id = ?");
    if ($stmt->execute([$id])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete message']);
    }
}
?>
