<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function ensureDirectory($path) {
    if (!is_dir($path) && !mkdir($path, 0777, true) && !is_dir($path)) {
        throw new RuntimeException('Failed to create directory: ' . $path);
    }
}

function createOptimizedWebp($sourcePath, $targetPath) {
    if (!function_exists('imagecreatefromstring') || !function_exists('imagewebp')) {
        return false;
    }

    $imageData = @file_get_contents($sourcePath);
    if ($imageData === false) {
        return false;
    }

    $image = @imagecreatefromstring($imageData);
    if ($image === false) {
        return false;
    }

    $width = imagesx($image);
    $height = imagesy($image);
    $maxDimension = 1600;
    $scale = min(1, $maxDimension / max($width, $height));

    if ($scale < 1) {
        $newWidth = max(1, (int)round($width * $scale));
        $newHeight = max(1, (int)round($height * $scale));
        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        $transparent = imagecolorallocatealpha($resized, 255, 255, 255, 127);
        imagefilledrectangle($resized, 0, 0, $newWidth, $newHeight, $transparent);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($image);
        $image = $resized;
    }

    $result = imagewebp($image, $targetPath, 82);
    imagedestroy($image);
    return $result;
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'mov'];

if (!in_array($ext, $allowed)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type']);
    exit;
}

$isReviewImage = isset($_POST['purpose']) && $_POST['purpose'] === 'review';
$imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
if ($isReviewImage && !in_array($ext, $imageExtensions, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Review uploads must be images']);
    exit;
}
if ($isReviewImage && (int)($file['size'] ?? 0) > 5 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'Review images must be smaller than 5 MB']);
    exit;
}

$year = date('Y');
$month = date('m');
$documentRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__, 2), '/\\');
if ($isReviewImage) {
    $targetDir = $documentRoot . '/uploads/reviews/' . $year . '/' . $month . '/';
    $urlDirectory = '/uploads/reviews/' . $year . '/' . $month;
} else {
    // Keep existing uploads under the web server's document root.
    $targetDir = $documentRoot . '/uploads/images/' . $year . '/' . $month . '/';
    $urlDirectory = '/uploads/images/' . $year . '/' . $month;
}
ensureDirectory($targetDir);

$filename = uniqid('media_', true) . '.webp';
$targetFile = $targetDir . $filename;

if ($ext === 'mp4' || $ext === 'webm' || $ext === 'ogg' || $ext === 'mov') {
    $videoExt = $ext;
    $videoFileName = uniqid('media_', true) . '.' . $videoExt;
    $videoTargetFile = $targetDir . $videoFileName;
    if (move_uploaded_file($file['tmp_name'], $videoTargetFile)) {
        $url = $urlDirectory . '/' . $videoFileName;
        echo json_encode(['url' => $url]);
        exit;
    }

    http_response_code(500);
    echo json_encode(['error' => 'Failed to upload file. Check folder permissions and PHP upload limits.']);
    exit;
}

$temporarySource = $file['tmp_name'];
if (!is_file($temporarySource)) {
    http_response_code(500);
    echo json_encode(['error' => 'Temporary upload file is missing.']);
    exit;
}

if (createOptimizedWebp($temporarySource, $targetFile)) {
    @unlink($temporarySource);
    $url = $urlDirectory . '/' . $filename;
    echo json_encode(['url' => $url]);
    exit;
}

http_response_code(500);
echo json_encode(['error' => 'Failed to process image upload.']);
?>
