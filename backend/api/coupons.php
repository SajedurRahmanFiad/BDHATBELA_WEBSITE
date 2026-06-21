<?php
// backend/api/coupons.php
require_once '../config.php';
require_once __DIR__ . '/coupon_logic.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

try {
    if (($_GET['action'] ?? null) === 'validate') {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $code = $data['code'] ?? ($_GET['code'] ?? '');
        $items = is_array($data['items']) ? $data['items'] : [];

        echo json_encode(couponGetApplicationResult($pdo, $code, $items));
        exit;
    }

    if ($method === 'GET') {
        echo json_encode(couponListAll($pdo));
        exit;
    }

    if ($method === 'POST' || $method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON request body']);
            exit;
        }

        $saved = couponSave($pdo, $data);
        echo json_encode($saved);
        exit;
    }

    if ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Coupon ID is required']);
            exit;
        }

        if (couponDelete($pdo, $id)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Coupon not found']);
        }
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
