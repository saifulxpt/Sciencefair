<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$key_file = __DIR__ . '/openrouter_key.txt';
$action = $_GET['action'] ?? '';

if ($action === 'has_key') {
    $hasKey = file_exists($key_file) && trim(file_get_contents($key_file)) !== '';
    echo json_encode(['status' => 'success', 'has_key' => $hasKey]);
    exit;
}

if ($action === 'set_key') {
    $data = json_decode(file_get_contents('php://input'), true);
    $key = trim($data['key'] ?? '');
    
    if ($key) {
        file_put_contents($key_file, $key);
        chmod($key_file, 0666);
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid key']);
    }
    exit;
}

if ($action === 'fetch_logs') {
    require_once __DIR__ . '/db.php';
    try {
        $stmt = $db->query("SELECT * FROM ai_logs ORDER BY timestamp DESC LIMIT 50");
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'logs' => $logs]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'ask') {
    $data = json_decode(file_get_contents('php://input'), true);
    $query = trim($data['query'] ?? '');
    
    if (!$query) {
        echo json_encode(['status' => 'error', 'message' => 'Empty query']);
        exit;
    }
    
    if (!file_exists($key_file) || trim(file_get_contents($key_file)) === '') {
        echo json_encode(['status' => 'error', 'message' => 'OpenRouter API Key is not configured. please set it in the Admin Panel.']);
        exit;
    }
    
    $openrouter_key = trim(file_get_contents($key_file));
    
    // Knowledge Base Prompt for AeroStone Project
    $system_prompt = "You are the AeroStone AI Voice Assistant (অ্যারোস্টোন এআই ভয়েস অ্যাসিস্ট্যান্ট). 
You are presenting at Science Fair 2026. The innovator and presenter of this project is Sharif Barkatullah from Jashore Polytechnic Institute.
Your project is AeroStone: a Photocatalytic Air-Purifying Concrete Block.

Here are the technical specifications of AeroStone:
1. Composition: Portland Cement (15%), Sand/Fine Aggregate (30%), Gravel/Coarse Aggregate (45%), Water (9%). Custom additive is Anatase structure Titanium Dioxide (TiO2) nanoparticles at 1% of total dry weight (5-7% of cement weight).
2. Fabrication: Concrete ingredients and TiO2 dry mixed to prevent nano-clumping, placed in molds and vibrated, water cured for 28 days. After curing, a light weak-acid surface wash exposes the embedded active TiO2 nanoparticles.
3. Compressive Strength: 22.5 MPa, structurally equivalent to standard bricks. Particle size is ~25nm.
4. Chemical Process (Photocatalysis): Sunlight UV energy hits TiO2, exciting electrons to conduction band, leaving positive holes (TiO2 + hv -> e- + h+). Positive holes react with water/moisture on block surface to form Hydroxyl Radicals (h+ + H2O -> .OH + H+). Free electrons react with oxygen to form Superoxide Radicals (e- + O2 -> O2.-). These active radicals react with Nitrogen Oxides (NOx - toxic exhaust gas) and oxidize them into safe, stable, non-toxic Nitrates (NO3-). Nitrates sit safely on the surface and wash away harmlessly with rain/water wash.
5. Performance: Up to 85% NOx reduction inside a 50L closed chamber under a 150W UV bulb. Reduced 800 ppb NOx to below 150 ppb in 35 minutes.
6. Application: Sidewalk pavements, road dividers, pedestrian path walkways, building outer facades. Ideal for heavily polluted cities like Dhaka. Passive, eco-friendly, zero power, self-cleaning.

Instructions:
- Answer questions briefly, clearly, and concisely in Bangla (বাংলা).
- Do not use markdown syntax (like **, *, ###, lists, bullet points) in your response, as the Text-to-Speech synthesizer will read symbols literally. Keep it as pure prose.
- Keep your answers limited to 2-3 short sentences. Speak directly and warmly as an assistant.";

    // Call OpenRouter API
    $post_data = [
        'model' => 'google/gemini-2.5-flash',
        'messages' => [
            ['role' => 'system', 'content' => $system_prompt],
            ['role' => 'user', 'content' => $query]
        ],
        'temperature' => 0.7,
        'max_tokens' => 300
    ];
    
    $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $openrouter_key,
        'HTTP-Referer: http://160.25.226.152',
        'X-Title: AeroStone Voice Assistant'
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $result = json_decode($response, true);
        $reply = $result['choices'][0]['message']['content'] ?? '';
        
        if ($reply) {
            $reply = trim($reply);
            
            // Log to SQLite database
            require_once __DIR__ . '/db.php';
            try {
                $stmt = $db->prepare("INSERT INTO ai_logs (query, response) VALUES (:query, :response)");
                $stmt->execute([':query' => $query, ':response' => $reply]);
            } catch (Exception $e) {
                // Silently ignore logging errors to ensure response returns
            }
            
            echo json_encode(['status' => 'success', 'response' => $reply]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to parse AI response.']);
        }
    } else {
        $err = json_decode($response, true);
        $msg = $err['error']['message'] ?? 'OpenRouter connection error (HTTP ' . $http_code . ')';
        echo json_encode(['status' => 'error', 'message' => $msg]);
    }
    exit;
}
?>
