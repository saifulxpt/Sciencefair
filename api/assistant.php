<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$config_file = __DIR__ . '/config.json';
$action = $_GET['action'] ?? '';

// Configuration Helper Function
function get_config($config_file) {
    $default_prompt = "You are the AeroStone AI Voice Assistant (এ্যারোস্টোন এআই ভয়েস অ্যাসিস্ট্যান্ট). 
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

    if (!file_exists($config_file)) {
        $config = [
            'openrouter_key' => '',
            'selected_model' => 'google/gemini-2.5-flash',
            'system_prompt' => $default_prompt
        ];
        file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));
        chmod($config_file, 0666);
        return $config;
    }
    
    $config = json_decode(file_get_contents($config_file), true);
    if (!isset($config['system_prompt'])) {
        $config['system_prompt'] = $default_prompt;
    }
    if (!isset($config['selected_model'])) {
        $config['selected_model'] = 'google/gemini-2.5-flash';
    }
    return $config;
}

if ($action === 'has_key') {
    $config = get_config($config_file);
    $hasKey = isset($config['openrouter_key']) && trim($config['openrouter_key']) !== '';
    echo json_encode(['status' => 'success', 'has_key' => $hasKey]);
    exit;
}

if ($action === 'get_config') {
    $config = get_config($config_file);
    $key = $config['openrouter_key'] ?? '';
    $masked_key = '';
    if ($key) {
        $masked_key = (strlen($key) > 10) ? substr($key, 0, 8) . '...' . substr($key, -4) : '********';
    }
    echo json_encode([
        'status' => 'success',
        'model' => $config['selected_model'],
        'system_prompt' => $config['system_prompt'],
        'has_key' => ($key !== ''),
        'masked_key' => $masked_key
    ]);
    exit;
}

if ($action === 'save_config') {
    $data = json_decode(file_get_contents('php://input'), true);
    $config = get_config($config_file);
    
    $model = trim($data['model'] ?? '');
    $prompt = trim($data['prompt'] ?? '');
    $key = trim($data['key'] ?? '');
    
    if ($model) {
        $config['selected_model'] = $model;
    }
    if ($prompt) {
        $config['system_prompt'] = $prompt;
    }
    // Only save new key if it is not the masked key placeholder
    if ($key && strpos($key, '...') === false && $key !== '********') {
        $config['openrouter_key'] = $key;
    }
    
    file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));
    echo json_encode(['status' => 'success']);
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
    $history = $data['history'] ?? [];
    
    if (!$query) {
        echo json_encode(['status' => 'error', 'message' => 'Empty query']);
        exit;
    }
    
    $config = get_config($config_file);
    $openrouter_key = $config['openrouter_key'] ?? '';
    
    if (!$openrouter_key) {
        echo json_encode(['status' => 'error', 'message' => 'OpenRouter API Key is not configured. please set it in the Admin Panel.']);
        exit;
    }
    
    // Construct system and convo history messages
    $messages = [
        ['role' => 'system', 'content' => $config['system_prompt']]
    ];
    
    foreach ($history as $msg) {
        // Translate message bubbles sender name into API role
        $role = ($msg['sender'] === 'user') ? 'user' : 'assistant';
        $messages[] = [
            'role' => $role,
            'content' => $msg['text']
        ];
    }
    
    // Append the active user query
    $messages[] = [
        'role' => 'user',
        'content' => $query
    ];
    
    // Call OpenRouter API
    $post_data = [
        'model' => $config['selected_model'],
        'messages' => $messages,
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
