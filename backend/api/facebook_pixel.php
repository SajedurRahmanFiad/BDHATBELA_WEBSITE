<?php
// backend/api/facebook_pixel.php
require_once '../config.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$pixelId = $data['pixel_id'] ?? null;
$accessToken = $data['access_token'] ?? null;
$eventName = $data['event_name'] ?? null;
$eventTime = $data['event_time'] ?? time();
$eventId = $data['event_id'] ?? null;
$userData = $data['user_data'] ?? [];
$customData = $data['custom_data'] ?? [];
$eventSourceUrl = $data['event_source_url'] ?? null;
$pageUrl = $data['page_url'] ?? null;
$testEventCode = $data['test_event_code'] ?? null;

if (!$pixelId || !$accessToken || !$eventName) {
    http_response_code(400);
    echo json_encode(['error' => 'pixel_id, access_token, and event_name are required']);
    exit;
}

$payload = [
    'data' => [[
        'event_name' => $eventName,
        'event_time' => $eventTime,
        'event_source_url' => $eventSourceUrl,
        'page_url' => $pageUrl,
        'event_id' => $eventId,
        'user_data' => $userData,
        'custom_data' => $customData,
        'action_source' => 'website'
    ]]
];

$testEventQuery = $testEventCode ? '&test_event_code=' . urlencode($testEventCode) : '';
$url = "https://graph.facebook.com/v21.0/{$pixelId}/events?access_token=" . urlencode($accessToken) . $testEventQuery;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL error: ' . $curlError]);
    exit;
}

if ($httpCode >= 400) {
    http_response_code($httpCode);
    echo $response;
    exit;
}

echo $response;
