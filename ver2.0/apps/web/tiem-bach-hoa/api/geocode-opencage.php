<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

$address = $_GET['address'] ?? '';
if (!$address) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing address']);
  exit;
}

$keyFile = __DIR__ . '/opencage.key';
if (!file_exists($keyFile)) {
  http_response_code(500);
  echo json_encode(['error' => 'Missing API key']);
  exit;
}

$apiKey = trim(file_get_contents($keyFile));

$url = "https://api.opencagedata.com/geocode/v1/json?q="
     . urlencode($address)
     . "&key={$apiKey}&limit=1&language=vi";

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 10,
  CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
  http_response_code(500);
  echo json_encode(['error' => 'Geocode request failed']);
  exit;
}

echo $response;
exit;

?>
