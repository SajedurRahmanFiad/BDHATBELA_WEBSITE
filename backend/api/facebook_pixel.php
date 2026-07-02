<?php
// Legacy Facebook Pixel endpoint disabled.
http_response_code(410);
echo json_encode(['error' => 'Not implemented']);
