<?php
session_start();
// Điều chỉnh đường dẫn config/config.php sao cho đúng với vị trí file này (ví dụ: ../admincp/config/config.php)
include("../../admincp/config/config.php"); 

// Giả định bạn đã có $id_khachhang và $code_cart nếu khách hàng đăng nhập
$id_khachhang = $_SESSION['idkhachhang'] ?? null;
$code_cart = $_SESSION['code_cart'] ?? null;


// ====================================================================
// LOGIC CHÍNH: THÊM/CỘNG DỒN SẢN PHẨM TỪ TRANG CHI TIẾT
// ====================================================================

if (isset($_POST['themgiohang'])) {
    
    $id = $_POST['idsanpham'] ?? null;
    
    // LẤY SỐ LƯỢNG TỪ FORM. Nếu form không gửi (ví dụ: nút nhanh), mặc định là 1.
    $so_luong_them_moi = (int)($_POST['soluong'] ?? 1); 
    
    if (!$id || $so_luong_them_moi < 1) {
        $_SESSION['message'] = '❌ Dữ liệu sản phẩm không hợp lệ.';
        header('Location: ../../index.php?quanly=trangchu');
        exit();
    }
    
    // Lấy thông tin sản phẩm từ DB
    $id_safe = mysqli_real_escape_string($mysqli, $id);
    $sql = "SELECT * FROM tbl_sanpham WHERE idsanpham = '$id_safe' LIMIT 1";
    $query = mysqli_query($mysqli, $sql);
    $row = mysqli_fetch_array($query);

    if ($row) {
        
        $max_qty_available = $row['soluongconlai'];
        if ($max_qty_available == 0) {
             $_SESSION['message'] = '❌ Sản phẩm đã hết hàng.';
             header('Location: ../../index.php?quanly=sanpham&id=' . $id);
             exit();
        }
        
        // ----------------------------------------------------------------
        // XỬ LÝ SESSION CART (Cộng dồn số lượng)
        // ----------------------------------------------------------------
        $product_in_session = false;
        $updated_cart = [];

        if (isset($_SESSION['cart']) && is_array($_SESSION['cart'])) {
            foreach ($_SESSION['cart'] as $cart_item) {
                if ($cart_item['id'] == $id) {
                    // CẬP NHẬT: Cộng dồn số lượng mới vào số lượng cũ
                    $new_qty_in_cart = $cart_item['soluong'] + $so_luong_them_moi; 
                    
                    // Kiểm tra giới hạn
                    if ($new_qty_in_cart > $max_qty_available) {
                        $new_qty_in_cart = $max_qty_available;
                        $_SESSION['message'] = '⚠️ Số lượng tối đa đã đạt, chỉ còn ' . $max_qty_available . ' sản phẩm.';
                    } else {
                        // Thông báo thành công nếu không bị giới hạn
                        $_SESSION['message'] = '✅ Đã cập nhật giỏ hàng: cộng thêm ' . $so_luong_them_moi . ' sản phẩm.';
                    }
                    
                    $updated_cart[] = array_merge($cart_item, ['soluong' => $new_qty_in_cart]);
                    $product_in_session = true;
                } else {
                    $updated_cart[] = $cart_item;
                }
            }
        }
        
        if (!$product_in_session) {
            // Sản phẩm chưa có trong giỏ, thêm mới
             $new_product_data = [
                'tensanpham' => $row['tensanpham'],
                'id' => $row['idsanpham'],
                'soluong' => $so_luong_them_moi, 
                'giaban' => $row['giaban'],
                'hinhanh' => $row['hinhanh'],
                'masanpham' => $row['masanpham'],
                'soluongconlai' => $row['soluongconlai']
            ];
            
            $updated_cart[] = $new_product_data;
            $_SESSION['message'] = '✅ Đã thêm ' . $so_luong_them_moi . ' sản phẩm mới vào giỏ hàng.';
        }
        
        $_SESSION['cart'] = $updated_cart;

        // ----------------------------------------------------------------
        // LOGIC LƯU VÀO DATABASE (CẬP NHẬT hoặc INSERT)
        // ----------------------------------------------------------------
        if ($id_khachhang && $code_cart) {
            
            $code_cart_safe = mysqli_real_escape_string($mysqli, $code_cart);
            
            // Lấy số lượng mới nhất từ SESSION (sau khi cộng dồn) để cập nhật DB
            $current_qty_in_session = 0;
            foreach ($_SESSION['cart'] as $item) {
                if ($item['id'] == $id) {
                    $current_qty_in_session = $item['soluong'];
                    break;
                }
            }
            
            // 1. Kiểm tra sản phẩm đã có trong tbl_chitiet_giohang chưa
            $sql_check = "SELECT soluong FROM tbl_chitiet_giohang 
                          WHERE code_cart = '$code_cart_safe' AND idsanpham = '$id_safe' LIMIT 1";
            $query_check = mysqli_query($mysqli, $sql_check);

            if (mysqli_num_rows($query_check) > 0) {
                // Cập nhật số lượng mới nhất từ Session vào DB
                $sql_update = "UPDATE tbl_chitiet_giohang 
                               SET soluong = '$current_qty_in_session' 
                               WHERE code_cart = '$code_cart_safe' AND idsanpham = '$id_safe'";
                mysqli_query($mysqli, $sql_update);
            } else {
                // Thêm mới vào DB 
                $sql_insert = "INSERT INTO tbl_chitiet_giohang (code_cart, idsanpham, soluong) 
                               VALUES ('$code_cart_safe', '$id_safe', '$so_luong_them_moi')";
                mysqli_query($mysqli, $sql_insert);
            }
        }
    }
    
    // Chuyển hướng về trang giỏ hàng (để thấy cập nhật)
    header('Location: ../../index.php?quanly=giohang');
    exit();
}


// ====================================================================
// LOGIC: XÓA TỪNG SẢN PHẨM TRONG GIỎ HÀNG 
// ====================================================================

if (isset($_GET['xoa'])) {
    $id_to_delete = $_GET['xoa'];

    // 1. Xóa khỏi Session Cart
    $_SESSION['cart'] = array_filter($_SESSION['cart'] ?? [], function($item) use ($id_to_delete) {
        return $item['id'] != $id_to_delete;
    });
    // Đánh lại key cho mảng session
    $_SESSION['cart'] = array_values($_SESSION['cart']);

    // 2. Xóa khỏi DB nếu khách hàng đã đăng nhập và có mã giỏ hàng
    if ($id_khachhang && $code_cart) {
        $id_safe = mysqli_real_escape_string($mysqli, $id_to_delete);
        $code_cart_safe = mysqli_real_escape_string($mysqli, $code_cart);

        $sql_delete_db = "DELETE FROM tbl_chitiet_giohang 
                          WHERE code_cart = '$code_cart_safe' AND idsanpham = '$id_safe'";
        mysqli_query($mysqli, $sql_delete_db);
    }

    // Chuyển hướng về trang giỏ hàng chính xác
    $_SESSION['message'] = '🗑️ Đã xoá 1 sản phẩm khỏi giỏ hàng.';
    header('Location: ../../index.php?quanly=giohang');
    exit;
}


// ====================================================================
// LOGIC: XÓA TẤT CẢ SẢN PHẨM
// ====================================================================

if (isset($_GET['xoatatca']) && $_GET['xoatatca'] == 1) {
    unset($_SESSION['cart']);
    
    if ($id_khachhang && $code_cart) {
        $code_cart_safe = mysqli_real_escape_string($mysqli, $code_cart);
        $sql_delete_all = "DELETE FROM tbl_chitiet_giohang WHERE code_cart = '$code_cart_safe'";
        mysqli_query($mysqli, $sql_delete_all);
        unset($_SESSION['code_cart']); // Xóa mã giỏ hàng
    }
    
    $_SESSION['message'] = '🗑️ Đã xoá toàn bộ giỏ hàng.';
    header('Location: ../../index.php?quanly=giohang');
    exit;
}

// ====================================================================
// LOGIC: CỘNG SỐ LƯỢNG TỪ TRANG GIỎ HÀNG (Dấu +)
// ====================================================================

if (isset($_GET['cong'])) {
    $id_to_add = $_GET['cong'];
    $max_qty = 0;

    // Lấy số lượng còn lại từ DB (để giới hạn)
    $id_safe = mysqli_real_escape_string($mysqli, $id_to_add);
    $sql_check = "SELECT soluongconlai FROM tbl_sanpham WHERE idsanpham = '$id_safe' LIMIT 1";
    $query_check = mysqli_query($mysqli, $sql_check);
    if ($row_check = mysqli_fetch_array($query_check)) {
        $max_qty = $row_check['soluongconlai'];
    }

    if (isset($_SESSION['cart'])) {
        foreach ($_SESSION['cart'] as $key => $cart_item) {
            if ($cart_item['id'] == $id_to_add) {
                // Cộng thêm 1
                $new_qty = $cart_item['soluong'] + 1;
                
                if ($new_qty <= $max_qty) {
                    $_SESSION['cart'][$key]['soluong'] = $new_qty;
                    $_SESSION['message'] = '⬆️ Đã tăng số lượng lên 1.';

                    // Cập nhật DB
                    if ($id_khachhang && $code_cart) {
                        $code_cart_safe = mysqli_real_escape_string($mysqli, $code_cart);
                        $sql_update = "UPDATE tbl_chitiet_giohang 
                                       SET soluong = '$new_qty' 
                                       WHERE code_cart = '$code_cart_safe' AND idsanpham = '$id_safe'";
                        mysqli_query($mysqli, $sql_update);
                    }
                } else {
                    $_SESSION['message'] = '⚠️ Không thể tăng thêm, số lượng tối đa là ' . $max_qty . '.';
                }
                break;
            }
        }
    }
    header('Location: ../../index.php?quanly=giohang');
    exit;
}

// ====================================================================
// LOGIC: TRỪ SỐ LƯỢNG TỪ TRANG GIỎ HÀNG (Dấu -)
// ====================================================================

if (isset($_GET['tru'])) {
    $id_to_subtract = $_GET['tru'];

    if (isset($_SESSION['cart'])) {
        foreach ($_SESSION['cart'] as $key => $cart_item) {
            if ($cart_item['id'] == $id_to_subtract) {
                // Trừ đi 1
                $new_qty = $cart_item['soluong'] - 1;

                if ($new_qty > 0) {
                    $_SESSION['cart'][$key]['soluong'] = $new_qty;
                    $_SESSION['message'] = '⬇️ Đã giảm số lượng xuống 1.';

                    // Cập nhật DB
                    if ($id_khachhang && $code_cart) {
                        $id_safe = mysqli_real_escape_string($mysqli, $id_to_subtract);
                        $code_cart_safe = mysqli_real_escape_string($mysqli, $code_cart);
                        $sql_update = "UPDATE tbl_chitiet_giohang 
                                       SET soluong = '$new_qty' 
                                       WHERE code_cart = '$code_cart_safe' AND idsanpham = '$id_safe'";
                        mysqli_query($mysqli, $sql_update);
                    }
                } else {
                    // Nếu số lượng bằng 0, coi như xóa sản phẩm đó
                    unset($_SESSION['cart'][$key]);
                    $_SESSION['cart'] = array_values($_SESSION['cart']); // Đánh lại key
                    
                    // Xóa khỏi DB
                    if ($id_khachhang && $code_cart) {
                        $id_safe = mysqli_real_escape_string($mysqli, $id_to_subtract);
                        $code_cart_safe = mysqli_real_escape_string($mysqli, $code_cart);
                        $sql_delete_db = "DELETE FROM tbl_chitiet_giohang 
                                          WHERE code_cart = '$code_cart_safe' AND idsanpham = '$id_safe'";
                        mysqli_query($mysqli, $sql_delete_db);
                    }
                    $_SESSION['message'] = '🗑️ Đã xoá sản phẩm khỏi giỏ hàng.';
                }
                break;
            }
        }
    }
    header('Location: ../../index.php?quanly=giohang');
    exit;
}

// Nếu không có hành động nào được thực hiện
header('Location: ../../index.php?quanly=giohang');
exit();
?>
