<?php
// backend/api/orders.php
require_once '../config.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

function getOrderDetails($pdo, $order_id) {
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$order_id]);
    $order = $stmt->fetch();
    if (!$order) return null;

    $order['total'] = (float)$order['total'];

    $stmt = $pdo->prepare("SELECT product_id, product_name, price, quantity, image FROM order_items WHERE order_id = ?");
    $stmt->execute([$order_id]);
    $items = $stmt->fetchAll();
    
    $order['items'] = [];
    foreach ($items as $item) {
        $order['items'][] = [
            'product' => [
                'id' => $item['product_id'],
                'name' => $item['product_name'],
                'price' => (float)$item['price'],
                'images' => [$item['image']]
            ],
            'quantity' => (int)$item['quantity']
        ];
    }

    return $order;
}

if ($method === 'GET') {
    $customerId = $_GET['customerId'] ?? null;
    $id = $_GET['id'] ?? null;

    if ($id) {
        $order = getOrderDetails($pdo, $id);
        if ($order) {
            echo json_encode($order);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Order not found']);
        }
    } else {
        if ($customerId) {
            $stmt = $pdo->prepare("SELECT id FROM orders WHERE customerId = ? ORDER BY date DESC");
            $stmt->execute([$customerId]);
        } else {
            $stmt = $pdo->query("SELECT id FROM orders ORDER BY date DESC");
        }
        
        $order_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $orders = [];
        foreach ($order_ids as $oid) {
            $orders[] = getOrderDetails($pdo, $oid);
        }
        echo json_encode($orders);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id = $data['id'] ?? 'ORD-' . strtoupper(substr(uniqid(), -6));
    $customerId = $data['customerId'] ?? null;
    $customerName = $data['customerName'];
    $phone = $data['phone'];
    $address = $data['address'];
    $area = $data['area'];
    $total = $data['total'];
    $status = $data['status'] ?? 'Pending';
    $date = $data['date'] ?? date('Y-m-d H:i:s');
    $paymentMethod = $data['paymentMethod'];
    $note = $data['note'] ?? null;
    $items = $data['items'] ?? [];

    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("INSERT INTO orders (id, customerId, customerName, phone, address, area, total, status, date, paymentMethod, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $customerId, $customerName, $phone, $address, $area, $total, $status, $date, $paymentMethod, $note]);

        foreach ($items as $item) {
            $prod = $item['product'];
            $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)");
            $image = !empty($prod['images']) ? $prod['images'][0] : null;
            $stmt->execute([$id, $prod['id'], $prod['name'], $prod['price'], $item['quantity'], $image]);
            
            // Optionally, reduce stock here
            if (isset($item['variationId']) && $item['variationId']) {
                $stmt_stock = $pdo->prepare("UPDATE product_variations SET stock = stock - ? WHERE id = ? AND stock >= ?");
                $stmt_stock->execute([$item['quantity'], $item['variationId'], $item['quantity']]);
            } else {
                $stmt_stock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
                $stmt_stock->execute([$item['quantity'], $prod['id'], $item['quantity']]);
            }
        }
        
        $pdo->commit();
        echo json_encode(getOrderDetails($pdo, $id));
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    $status = $data['status'];
    
    if (!$id || !$status) {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID and status are required']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    if ($stmt->execute([$status, $id])) {
        echo json_encode(getOrderDetails($pdo, $id));
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update order']);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete order']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID is required']);
    }
}
?>
