<?php
// backend/api/products.php
require_once '../config.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

function variationTableHasIsDefault($pdo) {
    $stmt = $pdo->prepare("SHOW COLUMNS FROM product_variations LIKE 'is_default'");
    $stmt->execute();
    return (bool)$stmt->fetch();
}

function productTableHasColumn($pdo, $column) {
    $stmt = $pdo->prepare("SHOW COLUMNS FROM products LIKE ?");
    $stmt->execute([$column]);
    return (bool)$stmt->fetch();
}

function sanitizeProductListParams($params) {
    $page = max(1, (int)($params['page'] ?? 1));
    $limit = min(100, max(1, (int)($params['limit'] ?? 24)));
    $search = trim((string)($params['search'] ?? ''));
    $categories = array_values(array_filter(array_map('trim', explode(',', (string)($params['categories'] ?? '')))));
    $minPriceValue = $params['minPrice'] ?? null;
    $maxPriceValue = $params['maxPrice'] ?? null;
    $minPrice = $minPriceValue !== '' && $minPriceValue !== null ? (float)$minPriceValue : null;
    $maxPrice = $maxPriceValue !== '' && $maxPriceValue !== null ? (float)$maxPriceValue : null;
    $sort = in_array($params['sort'] ?? 'newest', ['newest', 'low-to-high', 'high-to-low', 'rating'], true) ? $params['sort'] : 'newest';

    return [$page, $limit, $search, $categories, $minPrice, $maxPrice, $sort];
}

function buildProductListWhere($pdo, $params, &$where, &$bind) {
    [$page, $limit, $search, $categories, $minPrice, $maxPrice, $sort] = sanitizeProductListParams($params);
    $hasSku = productTableHasColumn($pdo, 'sku');

    if ($search !== '') {
        $searchConditions = ['p.name LIKE ?', 'p.category LIKE ?'];
        if ($hasSku) $searchConditions[] = 'p.sku LIKE ?';

        $where[] = '(' . implode(' OR ', $searchConditions) . ')';
        $like = "%{$search}%";
        $bind[] = $like;
        $bind[] = $like;
        if ($hasSku) $bind[] = $like;
    }

    if (count($categories) > 0) {
        $placeholders = implode(',', array_fill(0, count($categories), '?'));
        $where[] = "p.category IN ({$placeholders})";
        foreach ($categories as $category) {
            $bind[] = $category;
        }
    }

    if ($minPrice !== null) {
        $where[] = 'COALESCE(NULLIF(p.discountPrice, 0), p.price) >= ?';
        $bind[] = $minPrice;
    }

    if ($maxPrice !== null) {
        $where[] = 'COALESCE(NULLIF(p.discountPrice, 0), p.price) <= ?';
        $bind[] = $maxPrice;
    }

    return [$page, $limit, $sort];
}

function getProductListingSort($sort) {
    if ($sort === 'low-to-high') return 'COALESCE(NULLIF(p.discountPrice, 0), p.price) ASC, p.id DESC';
    if ($sort === 'high-to-low') return 'COALESCE(NULLIF(p.discountPrice, 0), p.price) DESC, p.id DESC';
    if ($sort === 'rating') return 'p.rating DESC, p.id DESC';
    return 'p.id DESC';
}

function getProductListingDetails($pdo, $product, $variationsByProductId, $imagesByProductId, $hasIsDefault) {
    $productId = $product['id'];
    $variation = isset($variationsByProductId[$productId]) ? $variationsByProductId[$productId] : null;

    $variations = [];
    if ($variation) {
        $rawMedia = $variation['media'] ?? null;
        $decodedMedia = null;
        if ($rawMedia !== null && $rawMedia !== '') {
            $decoded = json_decode($rawMedia, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $decodedMedia = $decoded;
            } else {
                $decodedMedia = [$rawMedia];
            }
        }

        $variations[] = [
            'id' => $variation['id'],
            'name' => $variation['name'],
            'media' => $decodedMedia,
            'price' => (float)$variation['price'],
            'discountPrice' => isset($variation['discount_price']) ? (float)$variation['discount_price'] : null,
            'weight' => isset($variation['weight']) ? (float)$variation['weight'] : null,
            'stock' => isset($variation['stock']) ? (int)$variation['stock'] : 0,
            'sku' => $variation['sku'] ?? null,
            'isDefault' => $hasIsDefault && isset($variation['is_default']) ? (bool)$variation['is_default'] : true
        ];
    }

    $images = isset($imagesByProductId[$productId]) ? $imagesByProductId[$productId] : [];
    $productType = isset($product['product_type']) ? $product['product_type'] : (isset($product['productType']) ? $product['productType'] : 'simple');

    return [
        'id' => $product['id'],
        'sku' => $product['sku'] ?? null,
        'name' => $product['name'],
        'price' => (float)$product['price'],
        'discountPrice' => isset($product['discountPrice']) ? (float)$product['discountPrice'] : null,
        'productType' => $productType,
        'variations' => $variations,
        'category' => $product['category'],
        'images' => $images,
        'stock' => (int)$product['stock'],
        'rating' => (float)$product['rating'],
        'badge' => $product['badge'] ?? null
    ];
}

function getProductPriceStats($pdo, $params) {
    [$page, $limit, $search, $categories, $minPrice, $maxPrice, $sort] = sanitizeProductListParams($params);
    $where = [];
    $bind = [];
    $statsParams = $params;
    unset($statsParams['minPrice'], $statsParams['maxPrice']);
    buildProductListWhere($pdo, $statsParams, $where, $bind);

    $whereSql = count($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    $stmt = $pdo->prepare("SELECT MIN(COALESCE(NULLIF(discountPrice, 0), price)) AS minPrice, MAX(COALESCE(NULLIF(discountPrice, 0), price)) AS maxPrice FROM products p {$whereSql}");
    $stmt->execute($bind);
    $row = $stmt->fetch();

    return [
        'minPrice' => $row['minPrice'] !== null ? (float)$row['minPrice'] : 0,
        'maxPrice' => $row['maxPrice'] !== null ? (float)$row['maxPrice'] : 100000
    ];
}

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

    // Map new DB columns (handle snake_case or camelCase)
    if (isset($product['cost_of_goods'])) $product['costOfGoods'] = (float)$product['cost_of_goods'];
    if (isset($product['costOfGoods'])) $product['costOfGoods'] = (float)$product['costOfGoods'];
    if (isset($product['product_type'])) $product['productType'] = $product['product_type'];
    if (isset($product['productType'])) $product['productType'] = $product['productType'];
    if (isset($product['sku'])) $product['sku'] = $product['sku'];

    // Get variations (if any)
    $product['variations'] = [];
    $hasIsDefault = variationTableHasIsDefault($pdo);
    $variationColumns = ['id', 'name', 'media', 'price', 'discount_price', 'cost_of_goods', 'weight', 'stock', 'sku'];
    if ($hasIsDefault) {
        $variationColumns[] = 'is_default';
    }

    $vstmt = $pdo->prepare("SELECT " . implode(', ', $variationColumns) . " FROM product_variations WHERE product_id = ? ORDER BY id ASC");
    $vstmt->execute([$product_id]);
    $variations = $vstmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($variations as $v) {
        // Decode media: stored as JSON array string or plain URL string
        $rawMedia = $v['media'] ?? null;
        $decodedMedia = null;
        if ($rawMedia !== null && $rawMedia !== '') {
            $decoded = json_decode($rawMedia, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $decodedMedia = $decoded;
            } else {
                // Legacy: plain URL string
                $decodedMedia = [$rawMedia];
            }
        }
        $product['variations'][] = [
            'id' => $v['id'],
            'name' => $v['name'],
            'media' => $decodedMedia,
            'price' => (float)$v['price'],
            'discountPrice' => isset($v['discount_price']) ? (float)$v['discount_price'] : null,
            'costOfGoods' => isset($v['cost_of_goods']) ? (float)$v['cost_of_goods'] : 0,
            'weight' => isset($v['weight']) ? (float)$v['weight'] : null,
            'stock' => isset($v['stock']) ? (int)$v['stock'] : 0,
            'sku' => $v['sku'] ?? null,
            'isDefault' => $hasIsDefault && isset($v['is_default']) ? (bool)$v['is_default'] : false
        ];
    }

    return $product;
}

function getProductListings($pdo, $params) {
    [$page, $limit, $search, $categories, $minPrice, $maxPrice, $sort] = sanitizeProductListParams($params);
    $where = [];
    $bind = [];
    buildProductListWhere($pdo, $params, $where, $bind);
    $hasSku = productTableHasColumn($pdo, 'sku');
    $hasProductType = productTableHasColumn($pdo, 'product_type');
    $hasIsDefault = variationTableHasIsDefault($pdo);

    $whereSql = count($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    $offset = ($page - 1) * $limit;

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM products p {$whereSql}");
    $countStmt->execute($bind);
    $total = (int)$countStmt->fetchColumn();

    $selectColumns = ['id', 'name', 'price', 'discountPrice', 'category', 'stock', 'rating', 'badge'];
    if ($hasProductType) $selectColumns[] = 'product_type';
    if ($hasSku) $selectColumns[] = 'sku';

    $stmt = $pdo->prepare("SELECT " . implode(', ', $selectColumns) . " FROM products p {$whereSql} ORDER BY " . getProductListingSort($sort) . " LIMIT ? OFFSET ?");
    foreach ($bind as $index => $value) {
        $stmt->bindValue($index + 1, $value);
    }
    $stmt->bindValue(count($bind) + 1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(count($bind) + 2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $variationsByProductId = [];
    $imagesByProductId = [];

    if (count($products) > 0) {
        $productIds = array_map(fn($product) => $product['id'], $products);
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));

        $variationColumns = ['id', 'product_id', 'name', 'media', 'price', 'discount_price', 'weight', 'stock', 'sku'];
        if ($hasIsDefault) $variationColumns[] = 'is_default';

        $variationSql = "SELECT " . implode(', ', $variationColumns) . " FROM product_variations WHERE product_id IN ({$placeholders})";
        if ($hasIsDefault) $variationSql .= ' ORDER BY product_id ASC, is_default DESC, id ASC';
        else $variationSql .= ' ORDER BY product_id ASC, id ASC';

        $variationStmt = $pdo->prepare($variationSql);
        $variationStmt->execute($productIds);
        foreach ($variationStmt->fetchAll(PDO::FETCH_ASSOC) as $variation) {
            $pid = $variation['product_id'];
            if (!isset($variationsByProductId[$pid])) {
                $variationsByProductId[$pid] = $variation;
            }
        }

        $imageStmt = $pdo->prepare("SELECT product_id, image_url FROM product_images WHERE product_id IN ({$placeholders}) ORDER BY product_id ASC, id ASC");
        $imageStmt->execute($productIds);
        foreach ($imageStmt->fetchAll(PDO::FETCH_ASSOC) as $image) {
            $pid = $image['product_id'];
            if (!isset($imagesByProductId[$pid])) $imagesByProductId[$pid] = [];
            $imagesByProductId[$pid][] = $image['image_url'];
        }
    }

    $stats = getProductPriceStats($pdo, $params);

    return [
        'items' => array_map(fn($product) => getProductListingDetails($pdo, $product, $variationsByProductId, $imagesByProductId, $hasIsDefault), $products),
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'totalPages' => (int)ceil($total / $limit),
        'minPrice' => $stats['minPrice'],
        'maxPrice' => $stats['maxPrice']
    ];
}

try {
    if ($method === 'GET') {
        $id = $_GET['id'] ?? null;
        
        if ($id) {
            // allow passing either internal id or sku
            $product = getProductFullDetails($pdo, $id);
            if (!$product) {
                // try lookup by sku
                $stmt = $pdo->prepare("SELECT id FROM products WHERE sku = ? LIMIT 1");
                $stmt->execute([$id]);
                $found = $stmt->fetchColumn();
                if ($found) $product = getProductFullDetails($pdo, $found);
            }
            if ($product) {
                echo json_encode($product);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Product not found']);
            }
        } else {
            if (isset($_GET['list'])) {
                echo json_encode(getProductListings($pdo, $_GET));
            } elseif (isset($_GET['stats'])) {
                echo json_encode(getProductPriceStats($pdo, $_GET));
            } else {
                $stmt = $pdo->query("SELECT id FROM products ORDER BY id DESC");
                $product_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

                $products = [];
                foreach ($product_ids as $pid) {
                    $products[] = getProductFullDetails($pdo, $pid);
                }
                echo json_encode($products);
            }
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
        $productType = $data['productType'] ?? 'simple';
        $costOfGoods = $data['costOfGoods'] ?? 0;

        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("INSERT INTO products (id, sku, name, shortDescription, description, price, discountPrice, category, stock, weight, weightUnit, badge, product_type, cost_of_goods) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $data['sku'] ?? null, $name, $shortDesc, $desc, $price, $discountPrice, $category, $stock, $data['weight'] ?? 0, $data['weightUnit'] ?? 'kg', $badge, $productType, $costOfGoods]);

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
            // Insert variations if provided
            if ($productType === 'variation' && isset($data['variations']) && is_array($data['variations'])) {
                $hasIsDefault = variationTableHasIsDefault($pdo);
                $variationInsertSql = $hasIsDefault
                    ? "INSERT INTO product_variations (product_id, name, media, price, discount_price, cost_of_goods, weight, stock, sku, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                    : "INSERT INTO product_variations (product_id, name, media, price, discount_price, cost_of_goods, weight, stock, sku) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

                foreach ($data['variations'] as $var) {
                    $vstmt = $pdo->prepare($variationInsertSql);
                    // Serialize media as JSON string to support multiple images
                    $mediaVal = $var['media'] ?? null;
                    if (is_array($mediaVal)) {
                        $mediaVal = count($mediaVal) > 0 ? json_encode($mediaVal) : null;
                    } elseif (is_string($mediaVal) && $mediaVal !== '') {
                        // Wrap plain string into JSON array for consistency
                        $mediaVal = json_encode([$mediaVal]);
                    } else {
                        $mediaVal = null;
                    }
                    $params = [
                        $id,
                        $var['name'] ?? '',
                        $mediaVal,
                        $var['price'] ?? 0,
                        $var['discountPrice'] ?? null,
                        $var['costOfGoods'] ?? 0,
                        $var['weight'] ?? null,
                        $var['stock'] ?? 0,
                        $var['sku'] ?? null,
                    ];
                    if ($hasIsDefault) {
                        $params[] = isset($var['isDefault']) && $var['isDefault'] ? 1 : 0;
                    }
                    $vstmt->execute($params);
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
            
            $productType = $data['productType'] ?? 'simple';
            $costOfGoods = $data['costOfGoods'] ?? 0;

            $stmt = $pdo->prepare("UPDATE products SET sku=?, name=?, shortDescription=?, description=?, price=?, discountPrice=?, category=?, stock=?, weight=?, weightUnit=?, badge=?, product_type=?, cost_of_goods=? WHERE id=?");
            $result = $stmt->execute([
                $data['sku'] ?? null,
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
                $productType,
                $costOfGoods,
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

            // Recreate variations: if product is variation type, replace existing variations
            if ($productType === 'variation') {
                $stmt = $pdo->prepare("DELETE FROM product_variations WHERE product_id = ?");
                $stmt->execute([$id]);
                if (isset($data['variations']) && is_array($data['variations'])) {
                    $hasIsDefault = variationTableHasIsDefault($pdo);
                    $variationInsertSql = $hasIsDefault
                        ? "INSERT INTO product_variations (product_id, name, media, price, discount_price, cost_of_goods, weight, stock, sku, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                        : "INSERT INTO product_variations (product_id, name, media, price, discount_price, cost_of_goods, weight, stock, sku) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

                    foreach ($data['variations'] as $var) {
                        $vstmt = $pdo->prepare($variationInsertSql);
                        // Serialize media as JSON string to support multiple images
                        $mediaVal = $var['media'] ?? null;
                        if (is_array($mediaVal)) {
                            $mediaVal = count($mediaVal) > 0 ? json_encode($mediaVal) : null;
                        } elseif (is_string($mediaVal) && $mediaVal !== '') {
                            // Wrap plain string into JSON array for consistency
                            $mediaVal = json_encode([$mediaVal]);
                        } else {
                            $mediaVal = null;
                        }
                        $params = [
                            $id,
                            $var['name'] ?? '',
                            $mediaVal,
                            $var['price'] ?? 0,
                            $var['discountPrice'] ?? null,
                            $var['costOfGoods'] ?? 0,
                            $var['weight'] ?? null,
                            $var['stock'] ?? 0,
                            $var['sku'] ?? null,
                        ];
                        if ($hasIsDefault) {
                            $params[] = isset($var['isDefault']) && $var['isDefault'] ? 1 : 0;
                        }
                        $vstmt->execute($params);
                    }
                }
            } else {
                // If switching to simple product, remove variations
                $stmt = $pdo->prepare("DELETE FROM product_variations WHERE product_id = ?");
                $stmt->execute([$id]);
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
} catch (Throwable $e) {
    http_response_code(500);
    error_log("API products.php uncaught error: " . $e->getMessage());
    error_log($e->getTraceAsString());
    echo json_encode(['error' => 'Server error. Please check server logs.']);
    exit;
}
?>
