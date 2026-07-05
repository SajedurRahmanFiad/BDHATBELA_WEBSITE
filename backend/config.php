<?php
// backend/config.php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (!headers_sent()) {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: 'bdhatbela_db';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Unknown database') !== false) {
        // Database not found, maybe not initialized yet.
        http_response_code(500);
        echo json_encode(["error" => "Database not initialized. Please run init_db.php"]);
        exit();
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
        exit();
    }
}
?>
