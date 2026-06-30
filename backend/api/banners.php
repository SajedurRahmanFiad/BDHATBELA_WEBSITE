<?php
// backend/api/banners.php
require_once '../config.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM banners");
    $banners = $stmt->fetchAll();
    foreach ($banners as &$banner) {
        $banner['showButton'] = (bool)$banner['showButton'];
    }
    echo json_encode($banners);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        http_response_code(413);
        echo json_encode(['error' => 'Payload is empty or too large. Image might exceed server limits.']);
        exit;
    }

    try {
        $id = $data['id'] ?? 'b-' . time() . rand(100, 999);
        $title = $data['title'] ?? null;
        $link = $data['link'] ?? null;
        $image = $data['image'];
        $showButton = isset($data['showButton']) ? (int)filter_var($data['showButton'], FILTER_VALIDATE_BOOLEAN) : 0;
        $buttonText = $data['buttonText'] ?? 'Shop Now';
        $buttonLink = $data['buttonLink'] ?? null;
        $buttonTextColor = $data['buttonTextColor'] ?? '#FFFFFF';
        $buttonBgColor = $data['buttonBgColor'] ?? '#EF4444';
        $titleColor = $data['titleColor'] ?? '#FFFFFF';

        $stmt = $pdo->prepare("INSERT INTO banners (id, image, title, link, showButton, buttonText, buttonLink, buttonTextColor, buttonBgColor, titleColor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$id, $image, $title, $link, $showButton, $buttonText, $buttonLink, $buttonTextColor, $buttonBgColor, $titleColor])) {
            echo json_encode([
                'id' => $id,
                'image' => $image,
                'title' => $title,
                'link' => $link,
                'showButton' => $showButton,
                'buttonText' => $buttonText,
                'buttonLink' => $buttonLink,
                'buttonTextColor' => $buttonTextColor,
                'buttonBgColor' => $buttonBgColor,
                'titleColor' => $titleColor
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create banner']);
        }
    } catch (Exception $e) {
        error_log('Banners POST error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Server error while creating banner: ' . $e->getMessage()]);
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

    try {
        $showButton = isset($data['showButton']) ? (int)filter_var($data['showButton'], FILTER_VALIDATE_BOOLEAN) : 0;
        $buttonText = $data['buttonText'] ?? 'Shop Now';
        $buttonLink = $data['buttonLink'] ?? null;
        $buttonTextColor = $data['buttonTextColor'] ?? '#FFFFFF';
        $buttonBgColor = $data['buttonBgColor'] ?? '#EF4444';
        $titleColor = $data['titleColor'] ?? '#FFFFFF';

        $stmt = $pdo->prepare("UPDATE banners SET image = ?, title = ?, link = ?, showButton = ?, buttonText = ?, buttonLink = ?, buttonTextColor = ?, buttonBgColor = ?, titleColor = ? WHERE id = ?");
        if ($stmt->execute([$data['image'], $data['title'] ?? null, $data['link'] ?? null, $showButton, $buttonText, $buttonLink, $buttonTextColor, $buttonBgColor, $titleColor, $id])) {
            $data['showButton'] = $showButton;
            echo json_encode($data);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update banner']);
        }
    } catch (Exception $e) {
        error_log('Banners PUT error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Server error while updating banner: ' . $e->getMessage()]);
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
