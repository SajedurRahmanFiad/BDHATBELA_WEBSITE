<?php
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'PUT',
        'content' => "{malformed json",
    ]
];
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost:8000/api/banners.php', false, $context);
if ($result === FALSE) {
    echo "Error\n";
}
echo "Result: " . $result . "\n";
