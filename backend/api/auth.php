<?php
// backend/api/auth.php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT id, name, phone, address, role FROM users ORDER BY name ASC");
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($method === 'POST') {
    $action = $data['action'] ?? '';

    if ($action === 'signup') {
        $name = $data['name'];
        $phone = $data['phone'];
        $address = $data['address'] ?? '';
        $password = password_hash($data['password'], PASSWORD_DEFAULT);
        $role = 'User';
        $id = 'u-' . time() . rand(100, 999);

        // Check if phone already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
        $stmt->execute([$phone]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Phone number already exists']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, address, role, password) VALUES (?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$id, $name, $phone, $address, $role, $password])) {
            echo json_encode([
                'id' => $id,
                'name' => $name,
                'phone' => $phone,
                'address' => $address,
                'role' => $role,
                'orders' => []
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Signup failed']);
        }
    } elseif ($action === 'login') {
        $identifier = $data['identifier']; // phone
        $password = $data['password'];

        $stmt = $pdo->prepare("SELECT id, name, phone, address, role, password FROM users WHERE phone = ?");
        $stmt->execute([$identifier]);
        $user = $stmt->fetch();

        if (!$user) {
            $stmt = $pdo->prepare("SELECT id, name, phone, role, password FROM staff WHERE phone = ?");
            $stmt->execute([$identifier]);
            $user = $stmt->fetch();
        }

        if ($user && (password_verify($password, $user['password']) || $password === $user['password'])) {
            unset($user['password']);
            $user['orders'] = [];
            echo json_encode($user);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
        }
    } elseif ($action === 'update') {
        $id = $data['id'];
        $name = $data['name'] ?? null;
        $phone = $data['phone'] ?? null;
        $address = $data['address'] ?? null;

        $fields = [];
        $params = [];
        if ($name !== null) { $fields[] = "name = ?"; $params[] = $name; }
        if ($phone !== null) { $fields[] = "phone = ?"; $params[] = $phone; }
        if ($address !== null) { $fields[] = "address = ?"; $params[] = $address; }

        if (empty($fields)) {
            echo json_encode(['success' => true]);
            exit;
        }

        $params[] = $id;
        $stmt = $pdo->prepare("UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?");
        if ($stmt->execute($params)) {
            $stmt = $pdo->prepare("SELECT id, name, phone, address, role FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            $user['orders'] = [];
            echo json_encode($user);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Update failed']);
        }
    } elseif ($action === 'update_role') {
        $id = $data['id'];
        $role = $data['role']; // 'Admin' or 'User'

        $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
        if ($stmt->execute([$role, $id])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update role']);
        }
    }
}
?>
