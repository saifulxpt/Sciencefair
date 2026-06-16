<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';
$action = $_GET['action'] ?? '';

if ($action === 'vote') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = htmlspecialchars(trim($data['name'] ?? ''));
    $type = $data['type'] ?? '';

    if ($name && in_array($type, ['yes', 'no'])) {
        try {
            $stmt = $db->prepare("INSERT INTO votes (name, type) VALUES (:name, :type)");
            $stmt->execute([':name' => $name, ':type' => $type]);
            echo json_encode(['status' => 'success']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'invalid']);
    }
    exit;
}

if ($action === 'fetch') {
    try {
        // Count yes
        $stmt = $db->query("SELECT COUNT(*) as count FROM votes WHERE type = 'yes'");
        $yes_count = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

        // Count no
        $stmt = $db->query("SELECT COUNT(*) as count FROM votes WHERE type = 'no'");
        $no_count = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

        // Feed of latest 20 votes
        $stmt = $db->query("SELECT name, type FROM votes ORDER BY timestamp DESC LIMIT 20");
        $feed = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'yes' => $yes_count,
            'no' => $no_count,
            'feed' => $feed
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'yes' => 0,
            'no' => 0,
            'feed' => [],
            'error' => $e->getMessage()
        ]);
    }
    exit;
}

if ($action === 'reset') {
    try {
        $db->exec("DELETE FROM votes");
        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}
?>
