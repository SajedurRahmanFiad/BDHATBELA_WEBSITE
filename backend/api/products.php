<?php
// backend/api/products.php
require_once '../config.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

function getProductFullDetails($pdo, $product_id) {
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$product_id]);
    $product = $stmt->fetch();
    if (!$product) return null;

    // Convert numeric fields
    $product['price'] = (float)$product['price'];
    if ($product['discountPrice']) $product['discountPrice'] = (float)$product['discountPrice'];
    $product['stock'] = (int)$product['stock'];
    $product['weight'] = isset($product['weight']) ? (float)$product['weight'] : 0;
    $product['weightUnit'] = $product['weightUnit'] ?? 'kg';
    $product['rating'] = (float)$product['rating'];

    // Get images
    $stmt = $pdo->prepare("SELECT image_url FROM product_images WHERE product_id = ?");
    $stmt->execute([$product_id]);
    $product['images'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Get features
    $stmt = $pdo->prepare("SELECT feature FROM product_features WHERE product_id = ?");
    $stmt->execute([$product_id]);
    $product['features'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Get reviews
    $stmt = $pdo->prepare("SELECT id, userName, rating, comment, date, image FROM reviews WHERE product_id = ?");
    $stmt->execute([$product_id]);
    $product['reviews'] = $stmt->fetchAll();
    foreach ($product['reviews'] as &$review) {
        $review['rating'] = (int)$review['rating'];
    }

    return $product;
}

if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    
    if ($id) {
        $product = getProductFullDetails($pdo, $id);
        if ($product) {
            echo json_encode($product);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
        }
    } else {
        $stmt = $pdo->query("SELECT id FROM products");
        $product_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $products = [];
        foreach ($product_ids as $pid) {
            $products[] = getProductFullDetails($pdo, $pid);
        }
        echo json_encode($products);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Check if adding a review
    if (isset($_GET['action']) && $_GET['action'] === 'review') {
        $product_id = $_GET['id'];
        $review_id = 'r-' . time() . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO reviews (id, product_id, userName, rating, comment, date) VALUES (?, ?, ?, ?, ?, ?)");
        $date = date('Y-m-d');
        if ($stmt->execute([$review_id, $product_id, $data['userName'], $data['rating'], $data['comment'], $date])) {
            
            // Update product average rating
            $stmt = $pdo->prepare("SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ?");
            $stmt->execute([$product_id]);
            $avg = $stmt->fetchColumn();
            
            $stmt = $pdo->prepare("UPDATE products SET rating = ? WHERE id = ?");
            $stmt->execute([$avg, $product_id]);
            
            echo json_encode(['success' => true, 'id' => $review_id, 'date' => $date]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add review']);
        }
        exit;
    }
    
    // Create new product
    $id = $data['id'] ?? 'p-' . time() . rand(100, 999);
    $name = $data['name'];
    $shortDesc = $data['shortDescription'] ?? '';
    $desc = $data['description'] ?? '';
    $price = $data['price'];
    $discountPrice = $data['discountPrice'] ?? null;
    $category = $data['category'];
    $stock = $data['stock'] ?? 0;
    $badge = $data['badge'] ?? null;
    $images = $data['images'] ?? [];
    $features = $data['features'] ?? [];

    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("INSERT INTO products (id, name, shortDescription, description, price, discountPrice, category, stock, weight, weightUnit, badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $name, $shortDesc, $desc, $price, $discountPrice, $category, $stock, $data['weight'] ?? 0, $data['weightUnit'] ?? 'kg', $badge]);

        if (is_array($images) && count($images) > 0) {
            foreach ($images as $img) {
                if ($img && !empty(trim($img))) {
                    $stmt = $pdo->prepare("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)");
                    $stmt->execute([$id, $img]);
                }
            }
        }

        if (is_array($features) && count($features) > 0) {
            foreach ($features as $feat) {
                if ($feat && !empty(trim($feat))) {
                    $stmt = $pdo->prepare("INSERT INTO product_features (product_id, feature) VALUES (?, ?)");
                    $stmt->execute([$id, $feat]);
                }
            }
        }
        
        $pdo->commit();
        echo json_encode(getProductFullDetails($pdo, $id));
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        error_log("Product create error: " . $e->getMessage());
        echo json_encode(['error' => 'Failed to create product: ' . $e->getMessage()]);
    }
    
} elseif ($method === 'PUT') {
    $input = file_get_contents("php://input");
    error_log("PUT Request Body: " . $input);
    
    $data = json_decode($input, true);
    if ($data === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON in request body']);
        exit;
    }
    
    error_log("Decoded data: " . json_encode($data));
    
    $id = $data['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID is required']);
        exit;
    }

    error_log("Updating product ID: " . $id);

    try {
        // Check if product exists
        $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
            exit;
        }

        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("UPDATE products SET name=?, shortDescription=?, description=?, price=?, discountPrice=?, category=?, stock=?, weight=?, weightUnit=?, badge=? WHERE id=?");
        $result = $stmt->execute([
            $data['name'] ?? '', 
            $data['shortDescription'] ?? '', 
            $data['description'] ?? '', 
            $data['price'] ?? 0, 
            $data['discountPrice'] ?? null, 
            $data['category'] ?? '', 
            $data['stock'] ?? 0, 
            $data['weight'] ?? 0,
            $data['weightUnit'] ?? 'kg',
            $data['badge'] ?? null,
            $id
        ]);
        
        if (!$result) {
            throw new Exception("Failed to update product: " . json_encode($stmt->errorInfo()));
        }

        // Recreate images
        if (isset($data['images']) && is_array($data['images']) && count($data['images']) > 0) {
            $stmt = $pdo->prepare("DELETE FROM product_images WHERE product_id = ?");
            $stmt->execute([$id]);
            
            foreach ($data['images'] as $img) {
                if ($img && !empty(trim($img))) {
                    $stmt = $pdo->prepare("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)");
                    $stmt->execute([$id, $img]);
                }
            }
            error_log("Images updated: " . count($data['images']));
        }

        // Recreate features
        if (isset($data['features']) && is_array($data['features'])) {
            $stmt = $pdo->prepare("DELETE FROM product_features WHERE product_id = ?");
            $stmt->execute([$id]);
            
            foreach ($data['features'] as $feat) {
                if ($feat && !empty(trim($feat))) {
                    $stmt = $pdo->prepare("INSERT INTO product_features (product_id, feature) VALUES (?, ?)");
                    $stmt->execute([$id, $feat]);
                }
            }
            error_log("Features updated: " . count($data['features']));
        }
        
        $pdo->commit();
        error_log("Product update successful");
        echo json_encode(getProductFullDetails($pdo, $id));
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        error_log("Product update error: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        echo json_encode(['error' => 'Failed to update product: ' . $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete product']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID is required']);
    }
}
?>
