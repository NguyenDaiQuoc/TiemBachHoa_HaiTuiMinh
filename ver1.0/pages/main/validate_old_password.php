<?php
session_start();
include '../../admincp/config/config.php';

header('Content-Type: application/json');

try {
    if (!isset($_POST['old_password'])) {
        echo json_encode(['valid' => false, 'error' => 'No password provided']);
        exit;
    }

    if (!isset($_SESSION['idkhachhang'])) {
        echo json_encode(['valid' => false, 'error' => 'User not logged in']);
        exit;
    }

    $id = $_SESSION['idkhachhang'];
    $old_password = md5($_POST['old_password']);

    // Use prepared statement for security
    $stmt = $mysqli->prepare("SELECT * FROM tbl_dangky WHERE iddangky = ? AND matkhau = ? LIMIT 1");
    
    if (!$stmt) {
        echo json_encode(['valid' => false, 'error' => 'Database prepare failed: ' . $mysqli->error]);
        exit;
    }
    
    $stmt->bind_param("is", $id, $old_password);
    $stmt->execute();
    $result = $stmt->get_result();
    $count = $result->num_rows;

    if ($count > 0) {
        echo json_encode(['valid' => true]);
    } else {
        echo json_encode(['valid' => false]);
    }

    $stmt->close();
    $mysqli->close();
    
} catch (Exception $e) {
    echo json_encode(['valid' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
