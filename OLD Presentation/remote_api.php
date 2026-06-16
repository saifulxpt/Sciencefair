<?php
// ডাটাবেস কানেকশন
require_once 'config.php'; 

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// 🚀 NEW: Aggressive No-Cache Headers to prevent browser throttling
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Connection: keep-alive'); // Keep connection open for faster sequential requests

$action = $_GET['action'] ?? '';
$pin = $_GET['pin'] ?? '0000'; 

// ==========================================
// 🚀 NEW: EXCLUSIVE LOCK & HEARTBEAT SYSTEM
// ==========================================

// এক্সক্লুসিভ কানেকশন ট্রাই করা (Only 1 device allowed)
if ($action === 'try_connect') {
    $time = microtime(true);
    
    // ডাটাবেস থেকে বর্তমান অবস্থা চেক করা
    $stmt = $pdo->prepare("SELECT is_occupied, last_heartbeat, slide FROM remote_sessions WHERE pin = ?");
    $stmt->execute([$pin]);
    $res = $stmt->fetch();

    // যদি আগে থেকেই কেউ কানেক্টেড থাকে এবং তার লাস্ট হার্টবিট ১০ সেকেন্ডের কম হয় (মানে সে অ্যাক্টিভ)
    if ($res && isset($res['is_occupied']) && $res['is_occupied'] == 1 && ($time - $res['last_heartbeat'] < 10)) {
        echo json_encode(['status' => 'error', 'message' => 'Room is occupied!']);
        exit;
    }

    // রুম ফাঁকা থাকলে বা আগের জন ডিসকানেক্ট হয়ে গেলে নতুন কানেকশন দিবে
    $slide = $res ? (int)$res['slide'] : 1;
    $stmt = $pdo->prepare("INSERT INTO remote_sessions (pin, slide, is_occupied, last_heartbeat) VALUES (?, ?, 1, ?) 
                           ON DUPLICATE KEY UPDATE is_occupied=1, last_heartbeat=?");
    $stmt->execute([$pin, $slide, $time, $time]);
    
    echo json_encode(['status' => 'success', 'slide' => $slide]);
    exit;
}

// হার্টবিট আপডেট (প্রতি ৩ সেকেন্ডে মোবাইল থেকে কল হবে)
if ($action === 'heartbeat') {
    $time = microtime(true);
    $stmt = $pdo->prepare("UPDATE remote_sessions SET last_heartbeat = ? WHERE pin = ?");
    $stmt->execute([$time, $pin]);
    echo json_encode(['status' => 'alive']);
    exit;
}

// ডিসকানেক্ট করা (ট্যাব ক্লোজ করলে বা নিজে থেকে বের হলে)
if ($action === 'disconnect') {
    $stmt = $pdo->prepare("UPDATE remote_sessions SET is_occupied = 0 WHERE pin = ?");
    $stmt->execute([$pin]);
    echo json_encode(['status' => 'disconnected']);
    exit;
}

// ১. সেশন ডিলিট করা
if ($action === 'cleanup') {
    $stmt = $pdo->prepare("DELETE FROM remote_sessions WHERE pin = ?");
    $stmt->execute([$pin]);
    echo json_encode(['status' => 'cleaned']);
    exit;
}

// ২. স্টেট রাইট করা (PC এবং Mobile উভয়ের জন্য)
if ($action === 'sync_write') {
    $data = json_decode(file_get_contents('php://input'), true);
    $slide = (int)($data['slide'] ?? 1);
    $playing = !empty($data['playing']) ? 1 : 0;
    $trigger = $data['trigger_cmd'] ?? 'none';
    
    // ম্যাজিক টাইমস্ট্যাম্প (Double Read এড়ানোর জন্য)
    $time = microtime(true); 

    // পিন থাকলে ডাটা আপডেট, নাহলে নতুন রেকর্ড
    $stmt = $pdo->prepare("INSERT INTO remote_sessions (pin, slide, playing, command, cmd_time) VALUES (?, ?, ?, ?, ?) 
                           ON DUPLICATE KEY UPDATE slide=?, playing=?, command=?, cmd_time=?");
    $stmt->execute([$pin, $slide, $playing, $trigger, $time, $slide, $playing, $trigger, $time]);
    
    // নতুন টাইমস্ট্যাম্পটি রিটার্ন করা
    echo json_encode(['status' => 'success', 'time' => $time]);
    exit;
}

// ৩. স্টেট রিড করা (PC এবং Mobile উভয়ের জন্য)
if ($action === 'sync_read') {
    $last_time = isset($_GET['last_time']) ? (float)$_GET['last_time'] : 0;
    
    // 🚀 ULTRA FAST LONG-POLLING: যদি PC তার last_time পাঠায়, সার্ভার নতুন ডাটার জন্য হোল্ড করবে
    if ($last_time > 0) {
        set_time_limit(30); 
        session_write_close(); 
        
        $timeout = 20; // সর্বোচ্চ ২০ সেকেন্ড অপেক্ষা করবে
        $start = time();
        
        while (time() - $start < $timeout) {
            $stmt = $pdo->prepare("SELECT slide, playing, command as trigger_cmd, cmd_time as time FROM remote_sessions WHERE pin = ?");
            $stmt->execute([$pin]);
            $res = $stmt->fetch();
            
            // ডাটাবেসের টাইম PC এর পাঠানো টাইমের চেয়ে বড় হলে, সাথে সাথে রেসপন্স দিয়ে দিবে!
            if ($res && (float)$res['time'] > $last_time) {
                echo json_encode([
                    'slide' => (int)$res['slide'],
                    'playing' => (bool)$res['playing'],
                    'trigger_cmd' => $res['trigger_cmd'],
                    'time' => (float)$res['time']
                ]);
                exit;
            }
            
            usleep(50000); // 50ms Delay (একদম ইনস্ট্যান্ট চেকিং)
        }
    }

    // Long Polling না হলে বা ২০ সেকেন্ড পার হয়ে গেলে নরমাল রিড
    $stmt = $pdo->prepare("SELECT slide, playing, command as trigger_cmd, cmd_time as time FROM remote_sessions WHERE pin = ?");
    $stmt->execute([$pin]);
    $res = $stmt->fetch();
    
    if($res) {
        echo json_encode([
            'slide' => (int)$res['slide'],
            'playing' => (bool)$res['playing'],
            'trigger_cmd' => $res['trigger_cmd'],
            'time' => (float)$res['time']
        ]);
    } else {
        // কানেক্ট না থাকলে ডিফল্ট স্টেট
        echo json_encode(['slide' => 1, 'playing' => false, 'trigger_cmd' => 'none', 'time' => 0]);
    }
    exit;
}
?>