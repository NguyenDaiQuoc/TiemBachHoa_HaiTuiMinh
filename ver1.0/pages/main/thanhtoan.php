<?php

session_start();

error_reporting(E_ALL);
ini_set('display_errors', 1);
if (!isset($_SESSION['cart']) || empty($_SESSION['cart'])) {
    die('Giỏ hàng rỗng.');
}
require_once('config_vnpay.php');
require_once(__DIR__ . '/../../Carbon-3.8.0/vendor/autoload.php'); // Đường dẫn đúng đến thư mục Carbon của bạn
use Carbon\Carbon;



$logFilePath = __DIR__ . '/cart-error.log';
$magiaohang = uniqid();
$tong_tien = 0;
$tensanpham_arr = [];
$masanpham_arr = [];
$giasanpham_arr = [];
$soluong_arr = [];
$thanhtien_arr = [];

foreach ($_SESSION['cart'] as $key => $value) {
    $tenkhachhang = $_SESSION['tenkhachhang'];
    $email = $_SESSION['email'];
    $tensanpham = $value['tensanpham'];
    $masanpham = $value['id'];
    $giasanpham = $value['giasanpham'];
    $soluong = $value['soluong'];
    $thanhtien = $soluong * $giasanpham;
    $tong_tien += $thanhtien; 
    $tensanpham_arr[] = $tensanpham;
    $masanpham_arr[] = $masanpham;
    $giasanpham_arr[] = $giasanpham;
    $soluong_arr[] = $soluong;
    $thanhtien_arr[] = $thanhtien;
}


$now = Carbon::now('Asia/Ho_Chi_Minh');
$idkhachhang = $_SESSION['idkhachhang'];
$cart_payment = $_POST['payment'];
$expire = Carbon::now('Asia/Ho_Chi_Minh')->addHours(2)->format('YmdHis');

$iddangky = $_SESSION['idkhachhang'];
$sql_get_vanchuyen = mysqli_query($mysqli, "SELECT * FROM tbl_giaohang WHERE iddangky='$iddangky' LIMIT 1");
$row_get_vanchuyen = mysqli_fetch_array($sql_get_vanchuyen);
$idgiaohang = $row_get_vanchuyen['idgiaohang'];

if ($cart_payment == 'tienmat' || $cart_payment == 'chuyenkhoan') {
    $insert_cart = "INSERT INTO tbl_hoadon(idkhachhang, magiaohang, trangthai, cart_date, cart_payment, cart_shipping) 
                    VALUES ('$idkhachhang', '$magiaohang', 1, '$now', '$cart_payment', '$idgiaohang')";
    $cart_query = mysqli_query($mysqli, $insert_cart);
    foreach ($_SESSION['cart'] as $key => $value) {
        $idsanpham = $value['id'];
        $soluong = $value['soluong'];
        $insert_order_details = "INSERT INTO tbl_chitiet_giaohang(magiaohang, idsanpham, soluongmua) 
                                  VALUES ('$magiaohang', '$idsanpham', '$soluong')";
        mysqli_query($mysqli, $insert_order_details);
        $update_stock = "UPDATE tbl_sanpham SET soluongconlai = soluongconlai - $soluong WHERE idsanpham = $idsanpham";
        mysqli_query($mysqli, $update_stock);
    }
} elseif ($cart_payment === 'vnpay') {
    $vnp_TxnRef = $magiaohang;
    $vnp_Amount = $tong_tien * 100;
    $inputData = [
        "vnp_Version" => "2.1.0",
        "vnp_TmnCode" => $vnp_TmnCode,
        "vnp_Amount" => $vnp_Amount,
        "vnp_Command" => "pay",
        "vnp_CreateDate" => date('YmdHis'),
        "vnp_CurrCode" => "VND",
        "vnp_IpAddr" => $_SERVER['REMOTE_ADDR'],
        "vnp_Locale" => "vn",
        "vnp_OrderInfo" => "Thanh toán đơn hàng",
        "vnp_OrderType" => "billpayment",
        "vnp_ReturnUrl" => $vnp_Returnurl,
        "vnp_TxnRef" => $vnp_TxnRef,
        "vnp_ExpireDate" => $expire
    ];
    ksort($inputData);
    $hashdata = http_build_query($inputData, '', '&', PHP_QUERY_RFC3986);
    $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
    $vnp_Url .= "?" . $hashdata . '&vnp_SecureHash=' . $vnpSecureHash;
    $_SESSION['code_cart'] = $magiaohang;
    header('Location: ' . $vnp_Url);
    exit();
}

// Gửi Email Xác Nhận Bằng Gmail SMTP
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require_once(__DIR__ . '/../../PHPMailer/src/Exception.php');
require_once(__DIR__ . '/../../PHPMailer/src/PHPMailer.php');
require_once(__DIR__ . '/../../PHPMailer/src/SMTP.php');

$mail = new PHPMailer(true);
if (!isset($_SESSION['email']) || !isset($_SESSION['tenkhachhang'])) {
    echo '<pre>';
print_r($_SESSION);
echo '</pre>';
exit;
    die('Không xác định được thông tin người dùng.');
}
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'luutrithon1996@gmail.com';
    $mail->Password = 'hyrn umod hpkb uohl';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    $mail->setFrom('luutrithon1996@gmail.com', 'Tiệm bách hóa Hai Tụi Mình');
    $mail->addAddress($_SESSION['email'], $_SESSION['tenkhachhang']);
    $mail->isHTML(true);
    $mail->Subject = "Đặt hàng thành công từ Hai Tụi Mình";

    $body = "<p>Chào {$_SESSION['tenkhachhang']},<br>Cảm ơn bạn đã đặt hàng với mã: <b>{$magiaohang}</b>.</p><ul>";
    foreach ($_SESSION['cart'] as $item) {
        $body .= "<li>{$item['tensanpham']} ({$item['soluong']} x " . number_format($item['giasanpham']) . ")</li>";
    }
    $body .= "</ul><p>Tổng tiền: <strong>" . number_format($tong_tien) . " VND</strong></p>";

    $mail->Body = $body;
    $mail->send();
} catch (Exception $e) {
    error_log("Lỗi khi gửi email: {$mail->ErrorInfo}", 3, $logFilePath);
}

if ($cart_payment != 'vnpay') {
    unset($_SESSION['cart']);
    header('Location:../../index.php?quanly=camon');
    exit();
}
