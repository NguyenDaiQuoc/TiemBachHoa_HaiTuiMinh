<?php
session_start();
include("../../admincp/config/config.php");

// Lấy thông tin địa chỉ giao hàng
$id_dangky = $_SESSION['idkhachhang'] ?? 0;
$sql_get_vanchuyen = mysqli_query($mysqli, "SELECT * FROM tbl_giaohang WHERE iddangky='$id_dangky' LIMIT 1");
$row_get_vanchuyen = mysqli_fetch_array($sql_get_vanchuyen);

// Lưu danh sách sản phẩm đã chọn (nếu có) vào session
if (isset($_POST['idsanpham'])) {
    $_SESSION['cart_selected'] = json_decode($_POST['idsanpham'], true);
}

// Khởi tạo các biến giỏ hàng
$cart_hienthi = [];
$cart = $_SESSION['cart'] ?? [];
$selectedIds = array_map('intval', $_SESSION['cart_selected'] ?? []);
$tongtien = 0;

// Lọc sản phẩm đã chọn
if (!empty($selectedIds)) {
    $cart_hienthi = array_filter($cart, function ($item) use ($selectedIds) {
        return in_array((int)$item['id'], $selectedIds);
    });
}


echo '<h3>DEBUG SESSION:</h3>';
echo '<pre>';
print_r($_POST); // Xem toàn bộ dữ liệu POST được gửi lên
print_r($_SESSION['cart_selected']);
echo '</pre>';

$name = $row_get_vanchuyen['name'] ?? '';
$phone = $row_get_vanchuyen['phone'] ?? '';
$address = $row_get_vanchuyen['address'] ?? '';
$note = $row_get_vanchuyen['note'] ?? '';
?>

<form action="https://nhahaidua.byethost31.com/index.php?quanly=thanhtoan" method="POST" enctype="application/x-www-form-urlencoded">
    <div class="main_content" style="width: 90%; margin: 0 auto; padding: 20px;">

        <!-- Địa chỉ nhận hàng -->
        <div style="border: 1px solid red; padding: 10px; margin-bottom: 20px;">
            <h4>📍 Địa Chỉ Nhận Hàng</h4>
            <p><b><?php echo $name . ' (+84) ' . $phone; ?></b></p>
            <p><?php echo $address; ?></p>
            <a href="index.php?quanly=vanchuyen">Thay đổi</a>
        </div>

        <!-- Bảng sản phẩm -->
        <div style="border: 1px solid red; padding: 10px; margin-bottom: 20px;">
            <h4>Sản phẩm</h4>
            <table style="width: 100%; border-collapse: collapse; text-align: center;">
                <thead>
                    <tr style="border-bottom: 2px solid #ccc;">
                        <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                        <th style="padding: 10px;">Đơn giá</th>
                        <th style="padding: 10px;">Số lượng</th>
                        <th style="padding: 10px;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($cart_hienthi as $cart_item): ?>
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="text-align: left; padding: 10px; display: flex; align-items: center;">
                                <img src="/admincp/modules/quanLySanPham/uploads/<?php echo $cart_item['hinhanh']; ?>" width="60" height="60" style="margin-right: 10px; object-fit: cover;">
                                <div style="text-align: left;"><?php echo $cart_item['tensanpham']; ?></div>
                            </td>
                            <td style="padding: 10px;"><?php echo number_format($cart_item['giasanpham'], 0, ',', '.') . 'đ'; ?></td>
                            <td style="padding: 10px;"><?php echo $cart_item['soluong']; ?></td>
                            <td style="padding: 10px;">
                                <?php
                                $thanhtien = $cart_item['giasanpham'] * $cart_item['soluong'];
                                $tongtien += $thanhtien;
                                echo number_format($thanhtien, 0, ',', '.') . 'đ';
                                ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <!-- Voucher -->
        <div style="border: 1px solid red; padding: 10px; margin-bottom: 20px;">
            <label><b>🎁 Voucher của Shop:</b></label>
            <select name="voucher" style="margin-left: 10px;">
                <option value="">-- Chọn voucher --</option>
                <option value="voucher10">Giảm 10%</option>
                <option value="freeship">Miễn phí vận chuyển</option>
            </select>
        </div>

        <!-- Ghi chú -->
        <div style="border: 1px solid red; padding: 10px; margin-bottom: 20px;">
            <label for="note"><b>📝 Lời nhắn cho người bán:</b></label><br>
            <input type="text" id="note" name="ghichu" placeholder="Lưu ý cho người bán..." style="width: 100%; padding: 10px;">
        </div>

        <!-- Tổng kết -->
        <div style="border-top: 1px solid #ccc; padding-top: 20px;">
            <h4>Phương thức thanh toán</h4>
            <div style="margin-bottom: 10px;">
                <input type="radio" name="payment" value="tienmat" checked> Tiền mặt khi nhận hàng<br>
                <input type="radio" name="payment" value="vnpay"> VNPay
            </div>

            <div style="text-align: right;">
                <p>Tổng tiền hàng: <b><?php echo number_format($tongtien, 0, ',', '.') . 'đ'; ?></b></p>
                <p>Phí vận chuyển: <b>0đ</b></p>
                <p><b style="color: red;">Tổng thanh toán: <?php echo number_format($tongtien, 0, ',', '.') . 'đ'; ?></b></p>
                <button type="submit" name="thanhToan" class="purchase_button" style="padding: 10px 20px; background-color: red; color: white; border: none; font-weight: bold;">Đặt hàng</button>
            </div>
        </div>
    </div>
</form>
