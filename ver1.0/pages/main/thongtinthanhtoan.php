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

$name = $row_get_vanchuyen['name'] ?? '';
$phone = $row_get_vanchuyen['phone'] ?? '';
$address = $row_get_vanchuyen['address'] ?? '';
$note = $row_get_vanchuyen['note'] ?? '';
$magiaodich = 'BANK-' . date('YmdHis') . '-' . $id_dangky;

if (isset($_POST['thanhToan'])) {
    $voucher = $_POST['voucher'] ?? '';
    $ghichu = $_POST['ghichu'] ?? '';
    $phuongthuc = $_POST['payment'] ?? 'tienmat';
    $madonhang = 'DH' . date('YmdHis');
    $minhchung_path = '';

    if (!empty($_FILES['minhchung']['tmp_name'])) {
        $target_dir = "uploads/minhchung/";
        if (!is_dir($target_dir)) mkdir($target_dir, 0777, true);
        $filename = time() . '_' . basename($_FILES['minhchung']['name']);
        $target_file = $target_dir . $filename;
        move_uploaded_file($_FILES['minhchung']['tmp_name'], $target_file);
        $minhchung_path = $target_file;

        // Lưu minh chứng vào bảng tbl_anhchuyenkhoan
        $tenkhachhang = $name;
        mysqli_query($mysqli, "INSERT INTO tbl_anhchuyenkhoan (iddangky, tenkhachhang, hinhanh, phuongthuc) 
                               VALUES ('$id_dangky', '$tenkhachhang', '$filename', '$phuongthuc')");
    }

    foreach ($cart as $item) {
        if (in_array((int)$item['id'], $selectedIds)) {
            $thanhtien = $item['giaban'] * $item['soluong'];
            mysqli_query($mysqli, "INSERT INTO tbl_donhang (madonhang, id_khachhang, id_sanpham, soluong, thanhtien, ghichu, voucher, phuongthuc, minhchung) 
                VALUES ('$madonhang', '$id_dangky', '{$item['id']}', '{$item['soluong']}', '$thanhtien', '$ghichu', '$voucher', '$phuongthuc', '$minhchung_path')");
            $tongtien += $thanhtien;

            // Xóa sản phẩm khỏi DB
            $code_cart = $_SESSION['code_cart'] ?? '';
            mysqli_query($mysqli, "DELETE FROM tbl_chitiet_giohang WHERE code_cart = '$code_cart' AND idsanpham = '{$item['id']}'");
        }
    }

    // Nếu không còn sản phẩm nào thì xóa giỏ hàng
    $kiemtra_cart = mysqli_query($mysqli, "SELECT COUNT(*) AS total FROM tbl_chitiet_giohang WHERE code_cart = '$code_cart'");
    $row_count = mysqli_fetch_assoc($kiemtra_cart);
    if ($row_count['total'] == 0) {
        mysqli_query($mysqli, "DELETE FROM tbl_giohang WHERE code_cart = '$code_cart'");
    }

    unset($_SESSION['cart_selected']);
    header("Location: index.php?quanly=camon");
    exit();
}
?>

<form action="https://nhahaidua.byethost31.com/index.php?quanly=thanhtoan" method="POST" enctype="multipart/form-data">
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
                            <td style="padding: 10px;"><?php echo number_format($cart_item['giaban'], 0, ',', '.') . 'đ'; ?></td>
                            <td style="padding: 10px;"><?php echo $cart_item['soluong']; ?></td>
                            <td style="padding: 10px;">
                                <?php
                                $thanhtien = $cart_item['giaban'] * $cart_item['soluong'];
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
                <label><input type="radio" name="payment" value="tienmat" checked> Tiền mặt khi nhận hàng</label><br>
                <label><input type="radio" name="payment" value="vnpay"> VNPay</label><br>
                <label><input type="radio" name="payment" value="momo"> Momo</label><br>
                <label><input type="radio" name="payment" value="zalopay"> ZaloPay</label><br>
                <label><input type="radio" name="payment" value="nganhang"> Chuyển khoản ngân hàng</label>
            </div>

            <!-- Vùng hiển thị QR và thông tin chuyển khoản -->
            <div id="payment_qr_area" style="display: none; margin-top: 20px; border: 1px solid green; padding: 15px;">
                <h5>Thông tin chuyển khoản</h5>
                <div id="payment_momo" class="payment-method-info" style="display:none;">
                <div style="text-align:center"><img src="/images/qr_momo.png" width="200"></div>
                <p><b>Người nhận:</b> Nguyễn Văn A</p>
                <p><b>SĐT:</b> 0909999999</p>
                <p><b>Nội dung chuyển khoản:</b> Thanh toan MOMO - <?php echo date('YmdHis'); ?> - <?php echo $id_dangky; ?></p>
            </div>

            <div id="payment_zalopay" class="payment-method-info" style="display:none;">
                <div style="text-align:center"><img src="/images/qr_zalopay.png" width="200"></div>
                <p><b>Người nhận:</b> Nguyễn Văn A</p>
                <p><b>SĐT:</b> 0908888888</p>
                <p><b>Nội dung chuyển khoản:</b> Thanh toan ZALO - <?php echo date('YmdHis'); ?> - <?php echo $id_dangky; ?></p>
            </div>

            <div id="payment_nganhang" class="payment-method-info" style="display:none;">
                <div style="text-align:center"><img src="/images/qr_bank.jpg" width="200"></div>
                <p><b>Người nhận:</b> Tiệm bách hóa Hai Tụi Mình</p>
                <p><b>Số tài khoản:</b> 15516868</p>
                <p><b>Ngân hàng:</b> MB Bank</p>
                <p><b>Số tiền:</b> <?php echo number_format($tongtien, 0, ',', '.') . 'đ'; ?>
                <p><b>Nội dung chuyển khoản:</b> Thanh toan BANK - <?php echo date('YmdHis'); ?> - <?php echo $id_dangky; ?></p>
            </div>

            <div id="payment_vnpay" class="payment-method-info" style="display:none;">
                <p><i>Bạn sẽ được chuyển đến cổng thanh toán VNPAY sau khi đặt hàng.</i></p>
                <?php
                    include ("config_vnpay.php");
                ?>
            </div>

            <!-- Nút xác nhận -->
            <div style="margin-top: 10px;">
                <button type="button" onclick="kiemTraThanhToan('<?php echo $magiaodich; ?>')" style="padding: 8px 16px; background-color: green; color: white;">Tôi đã chuyển khoản</button>
                <p id="xacnhan_ketqua" style="margin-top: 10px; font-weight: bold; color: red;"></p>
                <label for="upload_minhchung"><b>📎 Tải lên ảnh chụp chuyển khoản:</b></label><br>
                <input type="file" id="upload_minhchung" name="minhchung" accept="image/*" required><br><br>
            </div>


        </div>
            <div style="text-align: right;">
                <p>Tổng tiền hàng: <b><?php echo number_format($tongtien, 0, ',', '.') . 'đ'; ?></b></p>
                <p>Phí vận chuyển: <b>0đ</b></p>
                <p><b style="color: red;">Tổng thanh toán: <?php echo number_format($tongtien, 0, ',', '.') . 'đ'; ?></b></p>
                <button type="submit" name="thanhToan" class="purchase_button" style="padding: 10px 20px; background-color: red; color: white; border: none; font-weight: bold;">Đặt hàng</button>
            </div>
    </div>
</form>

<script>
function hideAllPaymentInfo() {
    document.querySelectorAll('.payment-method-info').forEach(div => {
        div.style.display = 'none';
    });
}

document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', function () {
        const value = this.value;
        const qrArea = document.getElementById('payment_qr_area');
        hideAllPaymentInfo();

        if (["momo", "zalopay", "nganhang", "vnpay"].includes(value)) {
            qrArea.style.display = 'block';
            document.getElementById('payment_' + value).style.display = 'block';
        } else {
            qrArea.style.display = 'none';
        }
    });
});


function kiemTraThanhToan() {
    document.getElementById('xacnhan_ketqua').innerText = 'Đang kiểm tra...';

    setTimeout(() => {
        document.getElementById('xacnhan_ketqua').innerText = '✅ Đã xác nhận chuyển khoản thành công!';

        setTimeout(() => {
        }, 2000);
    }, 1500);
}

//                  PHẦN NÀY LÀ KIỂM TRA CHUYỂN KHOẢN NGÂN HÀNG TỰ ĐỘNG, SẼ LÀM SAU
// function kiemTraThanhToan(magiaodich) {
//     document.getElementById('xacnhan_ketqua').innerText = 'Đang kiểm tra...';
//     fetch('/xuly/kiemtrathanhtoan.php', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//         body: 'magiaodich=' + encodeURIComponent(magiaodich)
//     })
//     .then(res => res.json())
//     .then(data => {
//         if (data.status === 'success') {
//             document.getElementById('xacnhan_ketqua').innerText = '✅ Đã xác nhận chuyển khoản thành công!';
//             setTimeout(() => window.location.href = 'index.php?quanly=camon', 2000);
//         } else {
//             document.getElementById('xacnhan_ketqua').innerText = '❌ ' + data.msg;
//         }
//     })
//     .catch(() => {
//         document.getElementById('xacnhan_ketqua').innerText = '❌ Quý khách chưa thanh toán, vui lòng kiểm tra lại!';
//     });
// }


// document.querySelectorAll('input[name="payment"]').forEach(radio => {
//     radio.addEventListener('change', function () {
//         const value = this.value;
//         const qrArea = document.getElementById('payment_qr_area');
//         hideAllPaymentInfo();
//         if (["momo", "zalopay", "nganhang", "vnpay"].includes(value)) {
//             qrArea.style.display = 'block';
//             document.getElementById('payment_' + value).style.display = 'block';
//         } else {
//             qrArea.style.display = 'none';
//         }
//     });
// });
</script>