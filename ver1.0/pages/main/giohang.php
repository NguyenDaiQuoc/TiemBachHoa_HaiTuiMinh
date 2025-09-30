<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

include __DIR__ . "/../../admincp/config/config.php";
ini_set('display_errors', 1);
if (isset($_SESSION['idkhachhang'])) {
    $idkhachhang = $_SESSION['idkhachhang'];
    $sql_khach = "SELECT tenkhachhang FROM tbl_dangky WHERE iddangky = '$idkhachhang' LIMIT 1";
    $result_khach = mysqli_query($mysqli, $sql_khach);
    if ($row_khach = mysqli_fetch_assoc($result_khach)) {
        $_SESSION['tenkhachhang'] = $row_khach['tenkhachhang'];
    }
}

// Mảng giỏ hàng sẽ được sử dụng để hiển thị
$cart = [];

// Kiểm tra nếu có session cart (ưu tiên)
if (!empty($_SESSION['cart'])) {
    $cart = $_SESSION['cart'];
} else {
    // Nếu không có thì kiểm tra DB nếu người dùng đã đăng nhập
    if (isset($_SESSION['idkhachhang'])) {
        $idkhachhang = $_SESSION['idkhachhang'];

        // Lấy giỏ hàng đang hoạt động (trangthai = 1)
        $sql_cart = "SELECT * FROM tbl_giohang WHERE idkhachhang = '$idkhachhang' AND trangthai = 1 LIMIT 1";
        $query_cart = mysqli_query($mysqli, $sql_cart);
        $row_cart = mysqli_fetch_assoc($query_cart);

        if ($row_cart) {
            $code_cart = $row_cart['code_cart'];

            // Lấy chi tiết giỏ hàng từ code_cart
            $sql_details = "SELECT * FROM tbl_chitiet_giohang
                            JOIN tbl_sanpham ON tbl_chitiet_giohang.idsanpham = tbl_sanpham.idsanpham
                            WHERE code_cart = '$code_cart'";
            $query_details = mysqli_query($mysqli, $sql_details);

            while ($row = mysqli_fetch_assoc($query_details)) {
                $cart[] = [
                    'id' => $row['idsanpham'],
                    'tensanpham' => $row['tensanpham'],
                    'masanpham' => $row['masanpham'],
                    'soluong' => $row['soluong'],
                    'giaban' => $row['giaban'],
                    'hinhanh' => $row['hinhanh'],
                    'soluongconlai' => $row['soluongconlai'] ?? 0
                ];
            }

            // Lưu lại session để không phải truy vấn lần nữa
            $_SESSION['cart'] = $cart;
            $_SESSION['code_cart'] = $code_cart;
        }
    }
}

if (!isset($_SESSION['cart']) || !is_array($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

// Hàm tạo code_cart 6 số tự tăng
function generateCartCode($mysqli)
{
    $result = mysqli_query($mysqli, "SELECT MAX(code_cart) AS max_code FROM tbl_giohang");
    $row = mysqli_fetch_assoc($result);
    $max = $row['max_code'] ?? '000000';
    $num = (int) $max + 1;
    return str_pad($num, 6, '0', STR_PAD_LEFT);
}

// ==== XỬ LÝ AJAX: XÓA NHIỀU SẢN PHẨM ====
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_ids'])) {
    $ids = json_decode($_POST['delete_ids'], true);
    if (is_array($ids)) {
        foreach ($ids as $id) {
            foreach ($_SESSION['cart'] as $key => $item) {
                if ($item['id'] == $id) {
                    unset($_SESSION['cart'][$key]);
                }
            }
        }
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Dữ liệu không hợp lệ.']);
    }
    exit();
}

// ==== CẬP NHẬT SỐ LƯỢNG SẢN PHẨM (AJAX tăng/giảm) ====
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id']) && isset($_POST['qty'])) {
    $id = $_POST['id'];
    $qty = (int) $_POST['qty'];

    $stmt = $mysqli->prepare("SELECT soluongconlai FROM tbl_sanpham WHERE idsanpham = ? LIMIT 1");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $product = $result->fetch_assoc();

    if (!$product) {
        echo json_encode([
            'success' => false,
            'message' => '❌ Không tìm thấy sản phẩm trong cơ sở dữ liệu.'
        ]);
        exit();
    }

    $max = (int) $product['soluongconlai'];

    if ($max <= 0) {
        echo json_encode([
            'success' => false,
            'message' => "❌ Không thể thực hiện thao tác. Sản phẩm hiện tại đang hết."
        ]);
        exit();
    }

    if ($qty > $max) {
        echo json_encode([
            'success' => false,
            'message' => "❌ Không thể thực hiện thao tác. Trong kho đang còn: $max sản phẩm."
        ]);
        exit();
    }

    foreach ($_SESSION['cart'] as $key => $item) {

        if ($item['id'] == $id) {
            $_SESSION['cart'][$key]['soluong'] = $qty;
            $_SESSION['cart'][$key]['soluongconlai'] = $max;
            if (isset($_SESSION['idkhachhang'])) {
                $idkhachhang = $_SESSION['idkhachhang'];
                $code_cart = null;

                // Lấy mã giỏ hàng hiện tại
                $query_cart = mysqli_query($mysqli, "SELECT code_cart FROM tbl_giohang WHERE idkhachhang = '$idkhachhang' AND trangthai = 1 LIMIT 1");
                if ($query_cart && mysqli_num_rows($query_cart) > 0) {
                    $cart_data = mysqli_fetch_assoc($query_cart);
                    $code_cart = $cart_data['code_cart'];

                    // Cập nhật số lượng sản phẩm trong chi tiết giỏ hàng
                    $stmtUpdate = $mysqli->prepare("UPDATE tbl_chitiet_giohang SET soluong = ? WHERE code_cart = ? AND idsanpham = ?");
                    $stmtUpdate->bind_param("isi", $qty, $code_cart, $id);
                    $stmtUpdate->execute();
                }
            }
            echo json_encode([
                'success' => true,
                'qty' => $qty
            ]);
            exit();
        }
    }

    echo json_encode([
        'success' => false,
        'message' => '❌ Không tìm thấy sản phẩm trong giỏ hàng.'
    ]);
    exit();
}

// ==== CẬP NHẬT TỒN KHO KHI TẢI TRANG GIỎ HÀNG ====
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['cart']) && is_array($_SESSION['cart'])) {
        foreach ($_SESSION['cart'] as $key => $item) {
            $id = $item['id'];
            $sql = "SELECT soluongconlai FROM tbl_sanpham WHERE idsanpham = '$id' LIMIT 1";
            $result = mysqli_query($mysqli, $sql);
            $row = mysqli_fetch_assoc($result);
            if ($row) {
                $_SESSION['cart'][$key]['soluongconlai'] = $row['soluongconlai'];
            }
        }
    }
}

// ==== LƯU GIỎ HÀNG VÀO DB (GHI ĐÈ BẰNG CẬP NHẬT) ====
if (!empty($_SESSION['cart']) && isset($_SESSION['idkhachhang'])) {
    $idkhachhang = $_SESSION['idkhachhang'];

    // Tìm giỏ hàng đang hoạt động (trạng thái 1)
    $query = "SELECT * FROM tbl_giohang WHERE idkhachhang = '$idkhachhang' AND trangthai = 1 LIMIT 1";
    $result = mysqli_query($mysqli, $query);

    if (mysqli_num_rows($result) > 0) {
        $row = mysqli_fetch_assoc($result);
        $code_cart = $row['code_cart'];

        // Xóa toàn bộ chi tiết cũ và thêm lại mới
        mysqli_query($mysqli, "DELETE FROM tbl_chitiet_giohang WHERE code_cart = '$code_cart'");

        foreach ($_SESSION['cart'] as $item) {
            $idsp = $item['id'];
            $soluong = $item['soluong'];
            mysqli_query($mysqli, "INSERT INTO tbl_chitiet_giohang (code_cart, idsanpham, soluong) VALUES ('$code_cart', '$idsp', '$soluong')");
        }
    } else {
        // Nếu không có giỏ cũ thì tạo mới
        $code_cart = generateCartCode($mysqli);
        mysqli_query($mysqli, "INSERT INTO tbl_giohang (idkhachhang, code_cart, trangthai) VALUES ('$idkhachhang', '$code_cart', 1)");

        foreach ($_SESSION['cart'] as $item) {
            $idsp = $item['id'];
            $soluong = $item['soluong'];
            mysqli_query($mysqli, "INSERT INTO tbl_chitiet_giohang (code_cart, idsanpham, soluong) VALUES ('$code_cart', '$idsp', '$soluong')");
        }
    }
}
?>

<?php if (isset($_SESSION['message'])): ?>
    <div
        style="padding: 10px; margin-bottom: 15px; background-color: #d4edda; color: #155724; border-left: 5px solid green; border-radius: 5px; font-weight: bold; font-family: Arial;">
        <?= $_SESSION['message']; ?>
    </div>
    <?php unset($_SESSION['message']); endif; ?>


<style>
    .table-sp {
        width: 100%;
        border-collapse: collapse;
        background-color: #fff;
        border: 1px solid #ccc;
    }

    .table-sp th,
    .table-sp td {
        border: 1px solid #ddd;
        padding: 12px 10px;
        vertical-align: middle;
        text-align: center;
    }

    .table-sp thead {
        background-color: #f1f1f1;
    }

    .sp-info {
        display: flex;
        align-items: center;
    }

    .sp-info img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        margin-right: 10px;
        border-radius: 5px;
    }

    .sp-info .name {
        font-weight: bold;
        font-size: 15px;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 300px;
    }

    .quantity-box {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .quantity-box input {
        width: 60px;
        text-align: center;
        border: 1px solid #ccc;
        height: 32px;
        background-color: #f8f9fa;
        readonly: true;
    }

    .quantity-box button {
        width: 32px;
        height: 32px;
        border: 1px solid #ccc;
        background-color: #fff;
        font-weight: bold;
        line-height: 1;
        padding: 0;
        cursor: pointer;
    }

    .table-wrapper {
        margin-bottom: 150px;
    }

    .footer-cart {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #fff;
        padding: 15px;
        border-top: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1000;
        box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
    }

    .footer-cart .left,
    .footer-cart .right {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .footer-cart .total {
        color: red;
        font-weight: bold;
        font-size: 18px;
    }
</style>


<div class="main_content" style="background-color: #f5f5f5; padding: 0; margin: 0;width:100%">
    <div class="container-fluid p-0">
        <div class="table-wrapper">
            <table class="table table-sp">
                <thead>
                    <tr>
                        <th><input type="checkbox" id="checkAll"></th>
                        <th style="width:35%">Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Số tiền</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($_SESSION['cart'])): ?>
                        <?php foreach ($_SESSION['cart'] as $item):
                            $soluong = $item['soluong'] ?? 1;
                            $thanhtien = $item['giaban'] * $soluong;
                            ?>
                            <tr data-id="<?= $item['id']; ?>" data-price="<?= $item['giaban']; ?>">
                                <td><input type="checkbox" class="checkItem" value="<?= $item['id']; ?>"></td>
                                <td style="text-align:left;">
                                    <div class="sp-info">
                                        <img src="/admincp/modules/quanLySanPham/uploads/<?= $item['hinhanh']; ?>" alt="SP">
                                        <div class="name"><?= $item['tensanpham']; ?></div>
                                        <?php if ($item['soluongconlai'] <= 0): ?>
                                            <div style="color:red; font-size:13px;">⚠️ Sản phẩm hiện tại đang hết, vui lòng chọn
                                                sản phẩm khác</div>
                                        <?php endif; ?>
                                    </div>
                                </td>
                                <td>
                                    <span class="text-muted">
                                        <?= ($item['soluongconlai'] <= 0) ? '0₫' : number_format($item['giaban'], 0, ',', '.') . '₫'; ?>
                                    </span>
                                </td>
                                <td>
                                    <div class="quantity-box">
                                        <button type="button" class="qty-btn" data-action="decrease"
                                            data-id="<?= $item['id']; ?>">-</button>
                                        <input type="text" id="qty_<?= $item['id']; ?>" value="<?= $soluong; ?>" readonly>
                                        <button type="button" class="qty-btn" data-action="increase"
                                            data-id="<?= $item['id']; ?>" data-max="<?= $item['soluongconlai']; ?>"
                                            <?= $item['soluongconlai'] <= 0 ? 'disabled' : '' ?>>+</button>
                                    </div>
                                </td>
                                <td class="text-danger fw-bold tong_tien_sp">
                                    <?= ($item['soluongconlai'] <= 0) ? '0₫' : number_format($thanhtien, 0, ',', '.') . '₫'; ?>
                                </td>
                                <td><a href="pages/main/themgiohang.php?xoa=<?= $item['id']; ?>"
                                        class="text-danger text-decoration-none">Xóa</a></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="6" class="text-center p-5">
                                <img src="../images/emptycart.png" width="200"><br>
                                <strong class="text-muted">Giỏ hàng trống</strong>
                                <a href="index.php">Quay lại mua hàng</a>
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <div class="footer-cart">
            <div class="left">
                <input type="checkbox" id="checkAllBottom">
                <label for="checkAllBottom" class="mb-0">Chọn Tất Cả (<span id="selectedCount">0</span>)</label>
                <button id="deleteSelected" class="btn btn-outline-danger btn-sm">Xóa</button>
                <a href="#" class="text-muted text-decoration-none small">Lưu vào mục Đã thích</a>
            </div>

            <div class="right">
                <span>Tổng cộng: <span class="total" id="totalPrice">0₫</span></span>
                <!-- Nút mua hàng -->
                <form id="formMuaHang" method="POST" action="index.php?quanly=vanchuyen">
                    <input type="hidden" name="idsanpham" id="idsanphamInput">
                    <button type="submit" id="muaHangBtn" class="btn btn-danger px-4">Mua Hàng</button>
                </form>
                <!-- Biến PHP nhúng vào JS -->
                <script>
                    const isLoggedIn = <?= isset($_SESSION['idkhachhang']) && isset($_SESSION['dangky']) ? 'true' : 'false' ?>;
                    const hasCart = <?= !empty($_SESSION['cart']) ? 'true' : 'false' ?>;
                </script>

                <!-- JavaScript xử lý logic -->
                <script>
                    document.addEventListener('DOMContentLoaded', function () {
                        const form = document.querySelector('#formMuaHang');
                        const checkboxes = document.querySelectorAll('.checkItem');
                        const selectedInput = document.getElementById('idsanphamInput');
                        const muaHangBtn = document.getElementById('muaHangBtn');

                        const isLoggedIn = <?php echo isset($_SESSION['idkhachhang']) ? 'true' : 'false'; ?>;
                        const hasCart = <?= !empty($_SESSION['cart']) ? 'true' : 'false' ?>;


                        form.addEventListener('submit', function (e) {
                            const selected = Array.from(checkboxes).filter(cb => cb.checked);
                            if (!isLoggedIn) {
                                alert('🔒 Bạn cần đăng nhập để tiến hành mua hàng!');
                                e.preventDefault();
                                return;
                            }

                            if (!hasCart) {
                                alert('🛒 Giỏ hàng trống, không thể tiến hành mua hàng.');
                                e.preventDefault();
                                return;
                            }

                            if (selected.length === 0) {
                                alert('🛒 Vui lòng chọn ít nhất một sản phẩm để mua.');
                                e.preventDefault();
                                return;
                            }

                            const ids = selected.map(cb => cb.value);
                            selectedInput.value = JSON.stringify(ids);
                        });
                    });
                </script>
                <a href="#" class="btn btn-outline-secondary rounded-circle" style="width: 40px; height: 40px;"
                    title="Chat">💬</a>
            </div>
        </div>
    </div>
</div>



<script>
    const checkAllTop = document.getElementById('checkAll');
    const checkAllBottom = document.getElementById('checkAllBottom');
    const selectedCountEl = document.getElementById('selectedCount');
    const totalPriceEl = document.getElementById('totalPrice');

    // ✅ Hàm cập nhật tổng tiền và số sản phẩm
    function updateTotal() {
        let total = 0;
        let count = 0;
        document.querySelectorAll('.checkItem').forEach(cb => {
            if (cb.checked) {
                count++;
                const row = cb.closest('tr');
                const price = parseInt(row.dataset.price);
                const qty = parseInt(document.getElementById('qty_' + row.dataset.id).value);
                total += price * qty;
            }
        });

        selectedCountEl.innerText = count;
        totalPriceEl.innerText = `(${count} sản phẩm): ` + total.toLocaleString('vi-VN') + '₫';
    }

    // ✅ Sự kiện check chọn tất cả
    checkAllTop.addEventListener('change', function () {
        checkAllBottom.checked = this.checked;
        document.querySelectorAll('.checkItem').forEach(cb => cb.checked = this.checked);
        updateTotal();
    });

    checkAllBottom.addEventListener('change', function () {
        checkAllTop.checked = this.checked;
        document.querySelectorAll('.checkItem').forEach(cb => cb.checked = this.checked);
        updateTotal();
    });

    // ✅ Khi người dùng tick từng sản phẩm
    document.querySelectorAll('.checkItem').forEach(cb => cb.addEventListener('change', updateTotal));

    // ✅ Xử lý nút tăng/giảm số lượng
    document.querySelectorAll('.qty-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            const action = this.dataset.action;
            const input = document.getElementById('qty_' + id);
            const row = document.querySelector(`tr[data-id="${id}"]`);
            const price = parseInt(row.dataset.price);
            let qty = parseInt(input.value);

            const increaseBtn = document.querySelector(`button[data-action="increase"][data-id="${id}"]`);
            const max = parseInt(increaseBtn?.dataset.max || 999);

            if (action === 'increase') {
                if (qty >= max) {
                    alert('❌ Không thể thêm nữa. Số lượng trong kho chỉ còn ' + max + ' sản phẩm.');
                    return;
                }
                qty += 1;
            } else if (action === 'decrease') {
                if (qty <= 1) {
                    if (confirm("Bạn có muốn xoá sản phẩm này khỏi giỏ hàng không?")) {
                        window.location.href = `pages/main/themgiohang.php?xoa=${id}`;
                        return;
                    } else {
                        return;
                    }
                }
                qty -= 1;
            }

            fetch('pages/main/giohang.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `id=${id}&qty=${qty}`
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        console.log('AJAX result:', data);
                        // ✅ Cập nhật số lượng mới
                        input.value = data.qty;

                        // ✅ Cập nhật số tiền tương ứng
                        const tongTienCell = row.querySelector('.tong_tien_sp');
                        const newTotal = price * data.qty;
                        tongTienCell.textContent = newTotal.toLocaleString('vi-VN') + '₫';

                        // ✅ Cập nhật tổng cộng
                        updateTotal();
                    } else {
                        alert(data.message);
                    }
                });
        });
    });

// ✅ Xóa nhiều sản phẩm
document.getElementById('deleteSelected').addEventListener('click', function () {
    const selected = Array.from(document.querySelectorAll('.checkItem:checked')).map(cb => cb.value);

    if (selected.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để xóa.');
        return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xoá ${selected.length} sản phẩm đã chọn không?`)) return;

    fetch('pages/main/themgiohang.php', { // <--- ĐẢM BẢO ĐƯỜNG DẪN ĐẾN FILE PHP CHÍNH XÁC
        method: 'POST',
        headers: { 
            // Sử dụng Content-Type này vì chúng ta gửi dữ liệu form
            'Content-Type': 'application/x-www-form-urlencoded' 
        },
        // Gửi action=delete_multiple và danh sách ID
        body: 'action=delete_multiple&ids=' + selected.join(',')
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('🗑️ Đã xoá thành công các sản phẩm đã chọn!');
            // Reload trang để tải lại giỏ hàng từ Session/DB đã được cập nhật
            window.location.reload(); 
        } else { 
            // Hiển thị thông báo chi tiết từ PHP
            alert('❌ Lỗi: ' + (data.message || 'Đã có lỗi xảy ra.'));
        }
    })
    .catch(error => {
        console.error('Lỗi AJAX:', error);
        alert('❌ Lỗi kết nối. Vui lòng kiểm tra console.');
    });
});

    // ✅ Gọi updateTotal khi vừa load trang
    window.addEventListener('DOMContentLoaded', updateTotal);
</script>
