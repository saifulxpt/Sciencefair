<?php
// ডাটাবেস ক্রেডেনশিয়াল
define('DB_HOST', 'localhost');
define('DB_USER', 'neurobyt_science');
define('DB_PASS', 'Brockvai@420');
define('DB_NAME', 'neurobyt_science');

try {
    // PDO কানেকশন তৈরি
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
} catch (PDOException $e) {
    // ডেভেলপারের জন্য এরর লগ
    error_log("Database Connection Failed: " . $e->getMessage());
    
    // ইউজারের জন্য নিরাপদ মেসেজ
    die("Server error: Unable to connect to the database. Please try again later.");
}
?>