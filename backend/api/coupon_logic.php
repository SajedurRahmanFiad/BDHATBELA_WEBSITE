<?php
// backend/api/coupon_logic.php

function couponNormalizeCode($code) {
    return strtoupper(trim((string)$code));
}

function couponTableExists($pdo) {
    $stmt = $pdo->prepare("SHOW TABLES LIKE 'coupons'");
    $stmt->execute();
    return (bool)$stmt->fetch();
}

function couponLoadRelations($pdo, $couponId) {
    $relations = ['productIds' => [], 'categoryIds' => []];
    if (!$couponId) return $relations;

    $stmt = $pdo->prepare("SELECT product_id FROM coupon_products WHERE coupon_id = ? ORDER BY product_id ASC");
    $stmt->execute([$couponId]);
    $relations['productIds'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $stmt = $pdo->prepare("SELECT category_id FROM coupon_categories WHERE coupon_id = ? ORDER BY category_id ASC");
    $stmt->execute([$couponId]);
    $relations['categoryIds'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    return $relations;
}

function couponHydrate($coupon) {
    if (!$coupon) return null;

    $coupon['id'] = (string)$coupon['id'];
    $coupon['code'] = couponNormalizeCode($coupon['code']);
    $coupon['isActive'] = isset($coupon['is_active']) ? (bool)$coupon['is_active'] : (bool)($coupon['isActive'] ?? false);
    $coupon['amount'] = isset($coupon['amount']) ? (float)$coupon['amount'] : 0.00;
    $coupon['percentage'] = isset($coupon['percentage']) ? (float)$coupon['percentage'] : 0.00;
    $coupon['noteMessage'] = isset($coupon['note_message']) ? $coupon['note_message'] : null;
    $coupon['usageLimit'] = isset($coupon['usage_limit']) ? (int)$coupon['usage_limit'] : null;
    $coupon['timesUsed'] = isset($coupon['times_used']) ? (int)$coupon['times_used'] : 0;
    $coupon['startDate'] = isset($coupon['start_date']) ? $coupon['start_date'] : null;
    $coupon['endDate'] = isset($coupon['end_date']) ? $coupon['end_date'] : null;
    $coupon['createdAt'] = isset($coupon['created_at']) ? $coupon['created_at'] : null;
    $coupon['updatedAt'] = isset($coupon['updated_at']) ? $coupon['updated_at'] : null;

    return $coupon;
}

function couponGetWithRelations($pdo, $couponId) {
    if (!couponTableExists($pdo)) return null;

    $stmt = $pdo->prepare("SELECT * FROM coupons WHERE id = ? LIMIT 1");
    $stmt->execute([$couponId]);
    $coupon = couponHydrate($stmt->fetch());
    if (!$coupon) return null;

    $relations = couponLoadRelations($pdo, $coupon['id']);
    return array_merge($coupon, $relations);
}

function couponListAll($pdo) {
    if (!couponTableExists($pdo)) return [];

    $stmt = $pdo->query("SELECT * FROM coupons ORDER BY created_at DESC, id DESC");
    $coupons = array_map('couponHydrate', $stmt->fetchAll());

    foreach ($coupons as &$coupon) {
        $relations = couponLoadRelations($pdo, $coupon['id']);
        $coupon = array_merge($coupon, $relations);
    }

    return $coupons;
}

function couponSave($pdo, $data) {
    if (!couponTableExists($pdo)) {
        throw new Exception('Coupon tables are not initialized.');
    }

    $code = couponNormalizeCode($data['code'] ?? '');
    if (!$code) throw new Exception('Coupon code is required.');
    if (!preg_match('/^[A-Z0-9_-]{3,64}$/', $code)) {
        throw new Exception('Coupon code must be 3-64 characters using letters, numbers, dash, or underscore.');
    }

    $name = trim((string)($data['name'] ?? $code));
    if (!$name) throw new Exception('Coupon name is required.');

    $type = $data['type'] ?? 'note';
    if (!in_array($type, ['fixed', 'percentage', 'note'], true)) {
        throw new Exception('Invalid coupon type.');
    }

    $amount = $type === 'fixed' ? max(0, (float)($data['amount'] ?? 0)) : 0.00;
    $percentage = $type === 'percentage' ? max(0, min(100, (float)($data['percentage'] ?? 0))) : 0.00;
    if (($type === 'fixed' && $amount <= 0) || ($type === 'percentage' && $percentage <= 0)) {
        throw new Exception('Discount value must be greater than zero.');
    }

    $noteMessage = $type === 'note' ? trim((string)($data['noteMessage'] ?? '')) : trim((string)($data['noteMessage'] ?? ''));
    if ($type === 'note' && !$noteMessage) {
        throw new Exception('Please provide the note/free gift message.');
    }

    $isActive = isset($data['isActive']) ? (bool)$data['isActive'] : true;
    $startDate = !empty($data['startDate']) ? $data['startDate'] : null;
    $endDate = !empty($data['endDate']) ? $data['endDate'] : null;
    if ($startDate && $endDate && strtotime($startDate) > strtotime($endDate)) {
        throw new Exception('Coupon end date cannot be before start date.');
    }

    $usageLimit = isset($data['usageLimit']) && $data['usageLimit'] !== '' && $data['usageLimit'] !== null
        ? max(0, (int)$data['usageLimit'])
        : null;

    $id = !empty($data['id']) ? $data['id'] : 'coupon-' . time() . '-' . bin2hex(random_bytes(4));
    $productIds = array_values(array_filter(array_map('trim', (array)($data['productIds'] ?? []))));
    $categoryIds = array_values(array_filter(array_map('trim', (array)($data['categoryIds'] ?? []))));

    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare("SELECT id FROM coupons WHERE code = ? AND id <> ? LIMIT 1");
        $stmt->execute([$code, $id]);
        if ($stmt->fetch()) {
            throw new Exception('This coupon code is already in use.');
        }

        $exists = false;
        if ($id) {
            $stmt = $pdo->prepare("SELECT id FROM coupons WHERE id = ? LIMIT 1");
            $stmt->execute([$id]);
            $exists = (bool)$stmt->fetch();
        }

        if ($exists) {
            $stmt = $pdo->prepare("
                UPDATE coupons
                SET code = ?, name = ?, type = ?, amount = ?, percentage = ?, note_message = ?,
                    is_active = ?, start_date = ?, end_date = ?, usage_limit = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$code, $name, $type, $amount, $percentage, $noteMessage, $isActive ? 1 : 0, $startDate, $endDate, $usageLimit, $id]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO coupons (id, code, name, type, amount, percentage, note_message, is_active, start_date, end_date, usage_limit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$id, $code, $name, $type, $amount, $percentage, $noteMessage, $isActive ? 1 : 0, $startDate, $endDate, $usageLimit]);
        }

        $stmt = $pdo->prepare("DELETE FROM coupon_products WHERE coupon_id = ?");
        $stmt->execute([$id]);
        $stmt = $pdo->prepare("DELETE FROM coupon_categories WHERE coupon_id = ?");
        $stmt->execute([$id]);

        $stmt = $pdo->prepare("INSERT INTO coupon_products (coupon_id, product_id) VALUES (?, ?)");
        foreach ($productIds as $productId) {
            $stmt->execute([$id, $productId]);
        }

        $stmt = $pdo->prepare("INSERT INTO coupon_categories (coupon_id, category_id) VALUES (?, ?)");
        foreach ($categoryIds as $categoryId) {
            $stmt->execute([$id, $categoryId]);
        }

        $pdo->commit();
        return couponGetWithRelations($pdo, $id);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function couponDelete($pdo, $couponId) {
    if (!couponTableExists($pdo)) return false;

    $stmt = $pdo->prepare("DELETE FROM coupons WHERE id = ?");
    return $stmt->execute([$couponId]);
}

function couponBuildCartProductMap($pdo, $items) {
    $productIds = [];
    foreach ($items as $item) {
        $product = $item['product'] ?? [];
        if (!empty($product['id'])) $productIds[] = $product['id'];
    }
    $productIds = array_values(array_unique(array_filter($productIds)));

    $map = [];
    if (count($productIds) > 0) {
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $stmt = $pdo->prepare("SELECT id, category FROM products WHERE id IN ({$placeholders})");
        $stmt->execute($productIds);
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $map[$row['id']] = $row['category'];
        }
    }

    return $map;
}

function couponCalculateSubtotal($items) {
    $subtotal = 0.0;
    foreach ($items as $item) {
        $product = $item['product'] ?? [];
        $variation = $item['variation'] ?? null;
        $unitPrice = $variation
            ? (float)($variation['discountPrice'] ?? $variation['price'] ?? 0)
            : (float)($product['discountPrice'] ?? $product['price'] ?? 0);
        $quantity = max(0, (int)($item['quantity'] ?? 0));
        $subtotal += $unitPrice * $quantity;
    }
    return $subtotal;
}

function couponGetApplicationResult($pdo, $code, $items) {
    $normalizedCode = couponNormalizeCode($code);
    $result = [
        'valid' => false,
        'error' => 'Coupon code is required.',
        'coupon' => null,
        'discount' => 0.00,
        'message' => '',
        'matchedProducts' => [],
        'matchedCategories' => []
    ];

    if (!$normalizedCode) return $result;
    if (!couponTableExists($pdo)) {
        $result['error'] = 'Coupon system is not initialized.';
        return $result;
    }

    $stmt = $pdo->prepare("SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1");
    $stmt->execute([$normalizedCode]);
    $coupon = couponHydrate($stmt->fetch());
    if (!$coupon) {
        $result['error'] = 'Coupon code not found.';
        return $result;
    }

    if (empty($coupon['isActive'])) {
        $result['error'] = 'This coupon is currently inactive.';
        return $result;
    }

    $now = date('Y-m-d H:i:s');
    if (!empty($coupon['endDate']) && $now > $coupon['endDate']) {
        $result['error'] = 'This coupon has expired.';
        return $result;
    }

    if ($coupon['usage_limit'] !== null) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE coupon_id = ? AND status <> 'Cancelled'");
        $stmt->execute([$coupon['id']]);
        $used = (int)$stmt->fetchColumn();
        if ($used >= (int)$coupon['usage_limit']) {
            $result['error'] = 'This coupon has reached its usage limit.';
            return $result;
        }
    }

    $productIds = couponLoadRelations($pdo, $coupon['id'])['productIds'];
    $categoryIds = couponLoadRelations($pdo, $coupon['id'])['categoryIds'];
    $hasProductRestriction = count($productIds) > 0;
    $hasCategoryRestriction = count($categoryIds) > 0;
    $cartProductMap = couponBuildCartProductMap($pdo, $items);
    $subtotal = couponCalculateSubtotal($items);

    if ($subtotal <= 0) {
        $result['error'] = 'Your cart is empty.';
        return $result;
    }

    $matchedProducts = [];
    $matchedCategories = [];

    if ($hasProductRestriction || $hasCategoryRestriction) {
        foreach ($items as $item) {
            $product = $item['product'] ?? [];
            $productId = (string)($product['id'] ?? '');
            $category = $cartProductMap[$productId] ?? (string)($product['category'] ?? '');

            if ($hasProductRestriction && in_array($productId, $productIds, true)) {
                $matchedProducts[] = $productId;
            }
            if ($hasCategoryRestriction && in_array($category, $categoryIds, true)) {
                $matchedCategories[] = $category;
            }
        }

        $matchedProducts = array_values(array_unique($matchedProducts));
        $matchedCategories = array_values(array_unique($matchedCategories));

        if ($hasProductRestriction && $hasCategoryRestriction) {
            if (count($matchedProducts) === 0 && count($matchedCategories) === 0) {
                $result['error'] = 'This coupon is only valid for selected products or categories.';
                return $result;
            }
        } elseif ($hasProductRestriction && count($matchedProducts) === 0) {
            $result['error'] = 'This coupon is only valid for selected products.';
            return $result;
        } elseif ($hasCategoryRestriction && count($matchedCategories) === 0) {
            $result['error'] = 'This coupon is only valid for selected categories.';
            return $result;
        }
    }

    $discount = 0.0;
    if ($coupon['type'] === 'fixed') {
        $discount = min((float)$coupon['amount'], $subtotal);
    } elseif ($coupon['type'] === 'percentage') {
        $discount = min($subtotal * ((float)$coupon['percentage'] / 100), $subtotal);
    }
    $discount = round($discount, 2);

    $message = $coupon['note_message'] ?: '';
    if ($coupon['type'] === 'fixed') {
        $message = $message ?: 'Fixed discount applied.';
    } elseif ($coupon['type'] === 'percentage') {
        $message = $message ?: $coupon['percentage'] . '% discount applied.';
    }

    return [
        'valid' => true,
        'error' => '',
        'coupon' => array_merge($coupon, [
            'productIds' => $productIds,
            'categoryIds' => $categoryIds
        ]),
        'discount' => $discount,
        'message' => $message,
        'matchedProducts' => $matchedProducts,
        'matchedCategories' => $matchedCategories
    ];
}
