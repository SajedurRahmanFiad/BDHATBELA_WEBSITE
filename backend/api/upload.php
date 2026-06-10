<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$target_dir = "../uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

if (!isset($_FILES["file"])) {
    http_response_code(400);
    echo json_encode(["error" => "No file uploaded"]);
    exit;
}

$file = $_FILES["file"];
$ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'mov'];

if (!in_array($ext, $allowed)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid file type"]);
    exit;
}

$filename = uniqid('media_') . '.' . $ext;
$target_file = $target_dir . $filename;

if (move_uploaded_file($file["tmp_name"], $target_file)) {
    $url = "/uploads/" . $filename;
    echo json_encode(["url" => $url]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to upload file. Check folder permissions and PHP upload limits."]);
}
?>
