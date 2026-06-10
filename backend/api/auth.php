<?php
// backend/api/auth.php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

if ($method === 'POST') {
    $action = $data['action'] ?? '';

    if ($action === 'signup') {
        $name = $data['name'];
        $phone = $data['phone'];
        $email = $data['email'] ?? null;
        $password = password_hash($data['password'], PASSWORD_DEFAULT);
        $role = 'User';
        $id = 'u-' . time() . rand(100, 999);

        // Check if phone or email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL AND email != '')");
        $stmt->execute([$phone, $email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Phone or Email already exists']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO users (id, name, email, phone, role, password) VALUES (?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$id, $name, $email, $phone, $role, $password])) {
            echo json_encode([
                'id' => $id,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'role' => $role,
                'orders' => []
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Signup failed']);
        }
    } elseif ($action === 'login') {
        $identifier = $data['identifier']; // phone or email
        $password = $data['password'];

        $stmt = $pdo->prepare("SELECT id, name, email, phone, address, role, password FROM users WHERE phone = ? OR email = ?");
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();

        // Note: For mock compatibility with previous code where passwords weren't hashed, 
        // we allow login if password matches or password verification passes.
        // Also checking staff table just in case they are admin.
        if (!$user) {
            $stmt = $pdo->prepare("SELECT id, name, email, phone, role, password FROM staff WHERE email = ? OR phone = ?");
            $stmt->execute([$identifier, $identifier]);
            $user = $stmt->fetch();
        }

        if ($user && (password_verify($password, $user['password']) || $password === $user['password'])) {
            unset($user['password']); // don't send password back
            $user['orders'] = []; // we don't send orders here for simplicity, they will be fetched elsewhere if needed
            echo json_encode($user);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
        }
    } elseif ($action === 'update') {
        $id = $data['id'];
        $name = $data['name'] ?? null;
        $email = $data['email'] ?? null;
        $phone = $data['phone'] ?? null;
        $address = $data['address'] ?? null;

        // Build query dynamically based on provided fields
        $fields = [];
        $params = [];
        if ($name !== null) { $fields[] = "name = ?"; $params[] = $name; }
        if ($email !== null) { $fields[] = "email = ?"; $params[] = $email; }
        if ($phone !== null) { $fields[] = "phone = ?"; $params[] = $phone; }
        if ($address !== null) { $fields[] = "address = ?"; $params[] = $address; }

        if (empty($fields)) {
            echo json_encode(['success' => true]);
            exit;
        }

        $params[] = $id;
        $stmt = $pdo->prepare("UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?");
        if ($stmt->execute($params)) {
            $stmt = $pdo->prepare("SELECT id, name, email, phone, address, role FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            $user['orders'] = [];
            echo json_encode($user);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Update failed']);
        }
    }
}
?>
