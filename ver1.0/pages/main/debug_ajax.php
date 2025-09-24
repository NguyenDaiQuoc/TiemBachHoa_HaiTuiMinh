<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'message' => 'AJAX is working!',
    'timestamp' => date('Y-m-d H:i:s'),
    'post_data' => $_POST,
    'session_data' => isset($_SESSION) ? $_SESSION : 'No session'
]);
?>
