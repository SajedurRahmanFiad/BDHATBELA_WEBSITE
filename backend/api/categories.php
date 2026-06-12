<?php
// backend/api/categories.php
require_once '../config.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM categories");
    $categories = $stmt->fetchAll();
    echo json_encode($categories);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id = $data['id'] ?? 'c-' . time() . rand(100, 999);
    $name = $data['name'];
    $icon = $data['icon'] ?? null;
    $image = $data['image'] ?? null;

    $stmt = $pdo->prepare("INSERT INTO categories (id, name, icon, image) VALUES (?, ?, ?, ?)");
    if ($stmt->execute([$id, $name, $icon, $image])) {
        echo json_encode(['id' => $id, 'name' => $name, 'icon' => $icon, 'image' => $image]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create category']);
    }

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Category ID is required']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE categories SET name = ?, icon = ?, image = ? WHERE id = ?");
    if ($stmt->execute([$data['name'], $data['icon'] ?? null, $data['image'] ?? null, $id])) {
        echo json_encode($data);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update category']);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete category']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Category ID is required']);
    }
}
?>
