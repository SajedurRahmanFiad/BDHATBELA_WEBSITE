<?php
// backend/api/banners.php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM banners");
    $banners = $stmt->fetchAll();
    echo json_encode($banners);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        http_response_code(413);
        echo json_encode(['error' => 'Payload is empty or too large. Image might exceed server limits.']);
        exit;
    }
    
    $id = $data['id'] ?? 'b-' . time() . rand(100, 999);
    $title = $data['title'] ?? null;
    $link = $data['link'] ?? null;
    $image = $data['image'];
    $showButton = isset($data['showButton']) ? (int)$data['showButton'] : 0;
    $buttonText = $data['buttonText'] ?? 'Shop Now';
    $buttonTextColor = $data['buttonTextColor'] ?? '#FFFFFF';
    $buttonBgColor = $data['buttonBgColor'] ?? '#EF4444';

    $stmt = $pdo->prepare("INSERT INTO banners (id, image, title, link, showButton, buttonText, buttonTextColor, buttonBgColor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    if ($stmt->execute([$id, $image, $title, $link, $showButton, $buttonText, $buttonTextColor, $buttonBgColor])) {
        echo json_encode([
            'id' => $id, 
            'image' => $image, 
            'title' => $title, 
            'link' => $link,
            'showButton' => (bool)$showButton,
            'buttonText' => $buttonText,
            'buttonTextColor' => $buttonTextColor,
            'buttonBgColor' => $buttonBgColor
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create banner']);
    }

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        http_response_code(413);
        echo json_encode(['error' => 'Payload is empty or too large. Image might exceed server limits.']);
        exit;
    }
    $id = $data['id'];
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Banner ID is required']);
        exit;
    }

    $showButton = isset($data['showButton']) ? (int)$data['showButton'] : 0;
    $buttonText = $data['buttonText'] ?? 'Shop Now';
    $buttonTextColor = $data['buttonTextColor'] ?? '#FFFFFF';
    $buttonBgColor = $data['buttonBgColor'] ?? '#EF4444';

    $stmt = $pdo->prepare("UPDATE banners SET image = ?, title = ?, link = ?, showButton = ?, buttonText = ?, buttonTextColor = ?, buttonBgColor = ? WHERE id = ?");
    if ($stmt->execute([$data['image'], $data['title'] ?? null, $data['link'] ?? null, $showButton, $buttonText, $buttonTextColor, $buttonBgColor, $id])) {
        echo json_encode($data);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update banner']);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM banners WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete banner']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Banner ID is required']);
    }
}
?>
