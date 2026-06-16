<?php
// vote_api.php
require 'config.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

// ১. ভোট জমা নেওয়ার লজিক
if ($action === 'vote') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = htmlspecialchars(trim($data['name'] ?? ''));
    $type = $data['type'] ?? '';

    if ($name && in_array($type, ['yes', 'no'])) {
        try {
            $stmt = $pdo->prepare("INSERT INTO votes (voter_name, vote_type) VALUES (?, ?)");
            $stmt->execute([$name, $type]);
            echo json_encode(['status' => 'success']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'invalid']);
    }
    exit;
}

// ২. স্লাইডে লাইভ ডাটা পাঠানোর লজিক
if ($action === 'fetch') {
    try {
        // YES ভোটের সংখ্যা
        $stmtYes = $pdo->query("SELECT COUNT(*) FROM votes WHERE vote_type = 'yes'");
        $yes = $stmtYes->fetchColumn();

        // NO ভোটের সংখ্যা
        $stmtNo = $pdo->query("SELECT COUNT(*) FROM votes WHERE vote_type = 'no'");
        $no = $stmtNo->fetchColumn();

        // সর্বশেষ ১০ জনের লাইভ ফিড
        $stmtFeed = $pdo->query("SELECT voter_name as name, vote_type as type FROM votes ORDER BY id DESC LIMIT 10");
        $feed = $stmtFeed->fetchAll();

        echo json_encode([
            'yes' => (int)$yes, 
            'no' => (int)$no, 
            'feed' => $feed
        ]);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Database error']);
    }
    exit;
}
?>