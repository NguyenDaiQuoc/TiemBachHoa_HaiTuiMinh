<?php   
$mysqli = new mysqli("sql206.byethost31.com", "b31_39008439", "Nguyendaiquoc2004.", "b31_39008439_nhahaidua");

// check connection
if ($mysqli->connect_error) {
    echo "Kết nối SQL lỗi " . $mysqli->connect_error;
    exit();
}

// Thiết lập charset là utf8
$mysqli->set_charset("utf8");
?>
