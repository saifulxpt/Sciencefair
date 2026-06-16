<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$app_id  = "2142548";
$key     = "e9724bd6db7ccd51f076";
$secret  = "d9314ff61394d94785c6";
$cluster = "ap2";

$data = json_decode(file_get_contents('php://input'), true);
if(empty($data['pin'])) {
    die(json_encode(["error" => "No PIN"]));
}

$payload = json_encode([
    "name" => "slide-update",
    "channels" => ["ecoblock-" . $data['pin']],
    "data" => json_encode($data)
]);

$path = "/apps/$app_id/events";
$body_md5 = md5($payload);
$timestamp = time();
$query = "auth_key=$key&auth_timestamp=$timestamp&auth_version=1.0&body_md5=$body_md5";
$auth_signature = hash_hmac('sha256', "POST\n$path\n$query", $secret);

$url = "https://api-$cluster.pusher.com$path?$query&auth_signature=$auth_signature";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
curl_close($ch);

echo json_encode(["status" => "success"]);
?>
