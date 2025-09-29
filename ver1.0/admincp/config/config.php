<?php   
$mysqli = new mysqli("localhost", "root", "", "b31_39008439_nhahaidua");

// check connection
if ($mysqli->connect_error) {
    echo "Kết nối SQL lỗi " . $mysqli->connect_error;
    exit();
}

// Thiết lập charset là utf8
$mysqli->set_charset("utf8");
?>
