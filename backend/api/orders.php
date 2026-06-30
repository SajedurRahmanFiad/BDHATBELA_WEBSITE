<?php
// backend/api/orders.php
require_once '../config.php';
require_once __DIR__ . '/coupon_logic.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

function getOrderDetails($pdo, $order_id) {
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$order_id]);
    $order = $stmt->fetch();
    if (!$order) return null;

    $order['total'] = (float)$order['total'];
    $order['couponId'] = $order['coupon_id'] ?? null;
    $order['couponCode'] = $order['coupon_code'] ?? null;
    $order['couponType'] = $order['coupon_type'] ?? null;
    $order['couponDiscount'] = isset($order['coupon_discount']) ? (float)$order['coupon_discount'] : 0.00;
    $order['couponNoteMessage'] = $order['coupon_note_message'] ?? null;

    $stmt = $pdo->prepare("
        SELECT
            oi.product_id,
            oi.product_name,
            oi.price AS historical_price,
            oi.quantity,
            oi.image,
            oi.variation_id,
            p.cost_of_goods AS product_cost_of_goods,
            p.weight AS product_weight,
            p.sku AS product_sku,
            p.price AS current_product_price,
            p.discountPrice AS current_product_discount,
            v.name AS variation_name,
            v.cost_of_goods AS variation_cost_of_goods,
            v.weight AS variation_weight,
            v.sku AS variation_sku,
            v.price AS current_variation_price,
            v.discount_price AS current_variation_discount
        FROM order_items oi
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN product_variations v ON v.id = oi.variation_id
        WHERE oi.order_id = ?
        ORDER BY oi.id ASC
    ");
    $stmt->execute([$order_id]);
    $items = $stmt->fetchAll();

    $order['items'] = [];
    foreach ($items as $item) {
        $variation = null;
        if ($item['variation_id']) {
            $variation = [
                'id' => (string)$item['variation_id'],
                'name' => $item['variation_name'] ?? '',
                'costOfGoods' => (float)($item['variation_cost_of_goods'] ?? 0),
                'weight' => (float)($item['variation_weight'] ?? 0),
                'sku' => $item['variation_sku'] ?: null,
                'price' => isset($item['current_variation_price']) ? (float)$item['current_variation_price'] : null,
                'discountPrice' => isset($item['current_variation_discount']) ? (float)$item['current_variation_discount'] : null,
            ];
        }

        $order['items'][] = [
            'product' => [
                'id' => (string)$item['product_id'],
                'name' => $item['product_name'],
                'price' => (float)($item['current_product_price'] ?? $item['historical_price']),
                'discountPrice' => isset($item['current_product_discount']) ? (float)$item['current_product_discount'] : null,
                'historicalPrice' => (float)$item['historical_price'],
                'costOfGoods' => (float)($item['product_cost_of_goods'] ?? 0),
                'weight' => (float)($item['product_weight'] ?? 0),
                'sku' => $item['product_sku'] ?: null,
                'images' => [$item['image']]
            ],
            'variation' => $variation,
            'quantity' => (int)$item['quantity']
        ];
    }

    return $order;
}

function getStoreSettings($pdo) {
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'store_settings'");
    $row = $stmt->fetch();
    if (!$row) return null;
    $settings = json_decode($row['setting_value'], true);
    return is_array($settings) ? $settings : null;
}

function hashUserData($value) {
    if (!$value) return null;
    $normalized = trim(strtolower($value));
    return hash('sha256', $normalized);
}

function sendFacebookConversionsEvent($pixelId, $accessToken, $eventName, $eventId, $customData, $userData = [], $eventSourceUrl = null, $pageUrl = null) {
    if (!$eventSourceUrl) {
        $eventSourceUrl = $_SERVER['HTTP_REFERER'] ?? null;
    }
    if (!$eventSourceUrl) {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $eventSourceUrl = $scheme . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    }
    $pageUrl = $pageUrl ?: $eventSourceUrl;

    $payload = [
        'data' => [[
            'event_name' => $eventName,
            'event_time' => time(),
            'event_source_url' => $eventSourceUrl,
            'page_url' => $pageUrl,
            'event_id' => $eventId,
            'user_data' => array_filter($userData),
            'custom_data' => $customData,
            'action_source' => 'website'
        ]]
    ];

    $url = "https://graph.facebook.com/v21.0/{$pixelId}/events?access_token=" . urlencode($accessToken);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 400) {
        error_log('Facebook Conversions API error (' . $httpCode . '): ' . $response);
        return false;
    }
    return true;
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
    $couponCode = couponNormalizeCode($data['couponCode'] ?? '');
    $couponId = $data['couponId'] ?? null;
    $couponType = $data['couponType'] ?? null;
    $couponNoteMessage = $data['couponNoteMessage'] ?? null;
    $couponDiscount = 0.00;
    $couponResult = null;

    if ($couponCode) {
        $couponResult = couponGetApplicationResult($pdo, $couponCode, $items);
        if (!$couponResult['valid']) {
            throw new Exception($couponResult['error']);
        }
        $couponId = $couponResult['coupon']['id'] ?? $couponId;
        $couponType = $couponResult['coupon']['type'] ?? $couponType;
        $couponNoteMessage = $couponResult['message'] ?: $couponNoteMessage;
        $couponDiscount = (float)$couponResult['discount'];
        $total = max(0, (float)$total - $couponDiscount);
    }

    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("INSERT INTO orders (id, customerId, customerName, phone, address, area, total, status, date, paymentMethod, note, coupon_id, coupon_code, coupon_type, coupon_discount, coupon_note_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $customerId, $customerName, $phone, $address, $area, $total, $status, $date, $paymentMethod, $note, $couponId, $couponCode ?: null, $couponType, $couponDiscount, $couponNoteMessage]);

        foreach ($items as $item) {
            $prod = $item['product'];
            $variation = $item['variation'] ?? null;
            $variationId = $variation['id'] ?? null;
            $quantity = $item['quantity'];
            
            $vDiscount = (isset($variation['discountPrice']) && is_numeric($variation['discountPrice']) && $variation['discountPrice'] > 0) ? $variation['discountPrice'] : null;
            $vPrice = (isset($variation['price']) && is_numeric($variation['price'])) ? $variation['price'] : null;
            $pDiscount = (isset($prod['discountPrice']) && is_numeric($prod['discountPrice']) && $prod['discountPrice'] > 0) ? $prod['discountPrice'] : null;
            $pPrice = (isset($prod['price']) && is_numeric($prod['price'])) ? $prod['price'] : 0;
            
            if ($variationId) {
                $itemPrice = $vDiscount ?? $vPrice ?? $pDiscount ?? $pPrice;
            } else {
                $itemPrice = $pDiscount ?? $pPrice;
            }
            
            $image = null;

            if (!empty($variation['media'])) {
                $image = is_array($variation['media']) ? $variation['media'][0] : $variation['media'];
            } elseif (!empty($prod['images'])) {
                $image = $prod['images'][0];
            }
            
            // Deduct stock first
            if ($variationId) {
                $stmt_stock = $pdo->prepare("UPDATE product_variations SET stock = stock - ? WHERE id = ? AND stock >= ?");
                $stmt_stock->execute([$quantity, $variationId, $quantity]);
            } else {
                $stmt_stock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
                $stmt_stock->execute([$quantity, $prod['id'], $quantity]);
            }

            if ($stmt_stock->rowCount() === 0) {
                throw new Exception("Insufficient stock for " . $prod['name']);
            }

            $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image, variation_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $prod['id'], $prod['name'], $itemPrice, $quantity, $image, $variationId]);
        }
        
        $pdo->commit();

        $storeSettings = getStoreSettings($pdo);
        if (!empty($storeSettings['metaPixel']['enabled']) && !empty($storeSettings['metaPixel']['pixelId']) && !empty($storeSettings['metaPixel']['accessToken'])) {
            $customData = [
                'currency' => $storeSettings['metaPixel']['currency'] ?? 'BDT',
                'value' => (float)$total,
                'content_ids' => array_map(function ($item) { return $item['product']['id']; }, $items),
                'content_name' => implode(', ', array_map(function ($item) { return $item['product']['name']; }, $items)),
                'content_type' => 'product',
                'num_items' => array_sum(array_map(function ($item) { return (int)$item['quantity']; }, $items)),
                'order_id' => $id,
                'shipping' => 0,
            ];

            $userData = [
                'phone' => hashUserData($phone),
                'first_name' => hashUserData(explode(' ', trim($customerName))[0] ?? ''),
                'last_name' => hashUserData(implode(' ', array_slice(explode(' ', trim($customerName)), 1)) ?: ''),
            ];

            sendFacebookConversionsEvent(
                $storeSettings['metaPixel']['pixelId'],
                $storeSettings['metaPixel']['accessToken'],
                'Purchase',
                $id,
                $customData,
                $userData,
                $data['event_source_url'] ?? null,
                $data['page_url'] ?? null
            );
        }

        echo json_encode(getOrderDetails($pdo, $id));
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(400);
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

    $stmt = $pdo->prepare("SELECT status FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    $oldStatus = $stmt->fetchColumn();

    if (!$oldStatus) {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);

        // If marked as cancelled, restore stock
        if ($status === 'Cancelled' && $oldStatus !== 'Cancelled') {
            $stmt_items = $pdo->prepare("SELECT product_id, quantity, variation_id FROM order_items WHERE order_id = ?");
            $stmt_items->execute([$id]);
            $orderItems = $stmt_items->fetchAll();

            foreach ($orderItems as $item) {
                if (!empty($item['variation_id'])) {
                    $stmt_stock = $pdo->prepare("UPDATE product_variations SET stock = stock + ? WHERE id = ?");
                    $stmt_stock->execute([$item['quantity'], $item['variation_id']]);
                } else {
                    $stmt_stock = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
                    $stmt_stock->execute([$item['quantity'], $item['product_id']]);
                }
            }
        }

        $pdo->commit();
        echo json_encode(getOrderDetails($pdo, $id));
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update order: ' . $e->getMessage()]);
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
