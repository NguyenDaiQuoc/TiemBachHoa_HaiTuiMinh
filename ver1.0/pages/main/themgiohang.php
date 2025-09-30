<?php
session_start();
include("../../admincp/config/config.php");

// Khởi tạo các biến cần thiết cho DB (Kiểm tra xem khách hàng đã đăng nhập chưa)
$id_khachhang = $_SESSION['idkhachhang'] ?? null;
$code_cart = $_SESSION['code_cart'] ?? null; // Cần chắc chắn bạn đã tạo $_SESSION['code_cart'] khi đăng nhập/tạo giỏ hàng

// Sửa: Load giỏ hàng từ DB nếu chưa có trong session
if (!isset($_SESSION['cart']) && $id_khachhang && $code_cart) {
    // ... (Giữ nguyên logic load từ DB lên session) ...
    $query = mysqli_query($mysqli, "SELECT c.*, s.tensanpham, s.giaban, s.soluongconlai 
        FROM tbl_chitiet_giohang c 
        JOIN tbl_sanpham s ON c.idsanpham = s.idsanpham 
        WHERE c.code_cart = '$code_cart'");

    $cart = [];
    while ($row = mysqli_fetch_array($query)) {
        $cart[] = [
            'id' => $row['idsanpham'], // Sửa: Lấy idsanpham
            'tensanpham' => $row['tensanpham'],
            'giaban' => $row['giaban'], // Sửa: Dùng giaban (nếu đó là giá bán cuối cùng)
            'soluong' => $row['soluong'], // Sửa: Tên cột số lượng trong chi tiết giỏ hàng
            'soluongconlai' => $row['soluongconlai'],
            'hinhanh' => $row['hinhanh'], // Có thể cần thêm
            'masanpham' => $row['masanpham'], // Có thể cần thêm
        ];
    }
    $_SESSION['cart'] = $cart;
}

// Cập nhật số lượng bằng AJAX (Giữ nguyên, nhưng đảm bảo tên cột trong DB chính xác: soluong)
if (isset($_POST['action']) && $_POST['action'] == 'update') {
    $id = $_POST['id'];
    $type = $_POST['type']; // 'plus' hoặc 'minus'

    foreach ($_SESSION['cart'] as &$item) {
        if ($item['id'] == $id) {
            // Lấy số lượng còn lại từ DB
            $result = mysqli_query($mysqli, "SELECT soluongconlai FROM tbl_sanpham WHERE idsanpham = '$id'"); // Sửa: idsanpham
            $row = mysqli_fetch_array($result);
            $max = $row['soluongconlai'];

            if ($type == 'plus' && $item['soluong'] < $max) {
                $item['soluong'] += 1;
            } elseif ($type == 'minus') {
                $item['soluong'] -= 1;
                if ($item['soluong'] < 1) {
                    echo json_encode(['confirm_delete' => true]);
                    exit;
                }
            }

            // Cập nhật DB nếu có đăng nhập
            if ($id_khachhang && $code_cart) {
                $new_qty = $item['soluong'];
                // Sửa: Tên cột số lượng trong DB phải khớp (ví dụ: soluong)
                mysqli_query($mysqli, "UPDATE tbl_chitiet_giohang SET soluong = '$new_qty' 
                    WHERE code_cart = '$code_cart' AND idsanpham = '$id'");
            }

            break;
        }
    }
    echo json_encode(['success' => true]);
    exit;
}

// Thêm sản phẩm vào giỏ hàng (Logic chính đã được sửa)
if (isset($_POST['themgiohang'])) {
    $id = $_GET['idsanpham'];
    
    // 💡 SỬA ĐỔI QUAN TRỌNG: Cố định số lượng thêm vào là 1
    $so_luong_them_moi = 1; 

    // Lấy thông tin sản phẩm từ DB
    $sql = "SELECT * FROM tbl_sanpham WHERE idsanpham = '".$id."' LIMIT 1";
    $query = mysqli_query($mysqli, $sql);
    $row = mysqli_fetch_array($query);

    if ($row) {
        // Chuẩn bị sản phẩm mới
        $new_product_data = [
            'tensanpham' => $row['tensanpham'],
            'id' => $row['idsanpham'],
            'soluong' => $so_luong_them_moi, // SỬ DỤNG GIÁ TRỊ CỐ ĐỊNH 1
            'giaban' => $row['giaban'],
            'hinhanh' => $row['hinhanh'],
            'masanpham' => $row['masanpham'],
            'soluongconlai' => $row['soluongconlai']
        ];
        
        $new_product = array($new_product_data);

        // Xử lý Session Cart
        if (isset($_SESSION['cart']) && is_array($_SESSION['cart'])) {
            $found = false;
            $product = [];

            foreach ($_SESSION['cart'] as $cart_item) {
                if ($cart_item['id'] == $id) {
                    // Cập nhật số lượng sản phẩm trùng (cộng thêm 1)
                    $new_qty_in_cart = $cart_item['soluong'] + $so_luong_them_moi; // Cộng thêm 1
                    
                    $product[] = array_merge($cart_item, ['soluong' => $new_qty_in_cart]);
                    $found = true;
                } else {
                    $product[] = $cart_item;
                }
            }
            
            if (!$found) {
                // Thêm sản phẩm mới (số lượng là 1)
                $_SESSION['cart'] = array_merge($product, $new_product);
            } else {
                // Cập nhật session cart với số lượng mới
                $_SESSION['cart'] = $product;
            }
        } else {
            // Tạo mới session cart (số lượng là 1)
            $_SESSION['cart'] = $new_product;
        }

        // ----------------------------------------------------------------
        // LOGIC LƯU VÀO DATABASE
        // ----------------------------------------------------------------
        if ($id_khachhang) {
            
            // 1. Kiểm tra/Tạo code_cart nếu chưa có
            if (!$code_cart) {
                $code_cart = time();
                $_SESSION['code_cart'] = $code_cart;
            }
            
            // 2. Kiểm tra sản phẩm đã có trong tbl_chitiet_giohang chưa
            $sql_check = "SELECT soluong FROM tbl_chitiet_giohang 
                          WHERE code_cart = '$code_cart' AND idsanpham = '$id' LIMIT 1";
            $query_check = mysqli_query($mysqli, $sql_check);

            if (mysqli_num_rows($query_check) > 0) {
                // Cập nhật số lượng (cộng thêm 1)
                $row_check = mysqli_fetch_array($query_check);
                $old_qty = $row_check['soluong'];
                $new_total_qty = $old_qty + $so_luong_them_moi; // Cộng thêm 1
                
                $sql_update = "UPDATE tbl_chitiet_giohang 
                               SET soluong = '$new_total_qty' 
                               WHERE code_cart = '$code_cart' AND idsanpham = '$id'";
                mysqli_query($mysqli, $sql_update);
            } else {
                // Thêm mới vào DB (số lượng là 1)
                $sql_insert = "INSERT INTO tbl_chitiet_giohang (code_cart, idsanpham, soluong) 
                               VALUES ('$code_cart', '$id', '$so_luong_them_moi')";
                mysqli_query($mysqli, $sql_insert);
            }
        }
    }
    
    // Chuyển hướng về trang giỏ hàng
    $_SESSION['message'] = '✅ Thêm vào giỏ hàng thành công!';
    header('Location: ../../index.php?quanly=giohang');
    exit();
}



// Xử lý Xóa nhiều sản phẩm bằng AJAX (YÊU CẦU MỚI)
if (isset($_POST['action']) && $_POST['action'] == 'delete_multiple' && isset($_POST['ids'])) {
    
    $ids_string = $_POST['ids']; // Chuỗi ID: "1,5,10"
    $ids_array = explode(',', $ids_string);
    
    $success = false;

    if (!empty($ids_array)) {
        // Chuyển mảng ID thành chuỗi an toàn cho SQL (ví dụ: '1','5','10')
        $safe_ids = array_map(function($id) use ($mysqli) {
            return "'" . mysqli_real_escape_string($mysqli, trim($id)) . "'";
        }, $ids_array);
        
        $ids_for_sql = implode(',', $safe_ids);

        // 1. Xóa khỏi Session Cart
        foreach ($ids_array as $id_to_delete) {
            foreach ($_SESSION['cart'] as $key => $item) {
                if ($item['id'] == $id_to_delete) {
                    unset($_SESSION['cart'][$key]);
                    break;
                }
            }
        }
        // Đảm bảo session được đánh lại key sau khi xóa
        $_SESSION['cart'] = array_values($_SESSION['cart']);

        // 2. Xóa khỏi DB nếu khách hàng đã đăng nhập
        if ($id_khachhang && $code_cart) {
            $code_cart_safe = mysqli_real_escape_string($mysqli, $code_cart);
            
            $sql_delete_db = "DELETE FROM tbl_chitiet_giohang 
                              WHERE code_cart = '$code_cart_safe' AND idsanpham IN ($ids_for_sql)";
            
            if (mysqli_query($mysqli, $sql_delete_db)) {
                $success = true;
            }
        } else {
             // Nếu không đăng nhập, việc xóa Session đã là thành công
             $success = true;
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode(['success' => $success]);
    exit;
}


// Xử lý Xóa nhiều sản phẩm bằng AJAX (YÊU CẦU ĐÃ SỬA)
if (isset($_POST['action']) && $_POST['action'] == 'delete_multiple' && isset($_POST['ids'])) {
    
    // Đảm bảo dữ liệu đầu vào là hợp lệ
    $ids_string = $_POST['ids']; // Chuỗi ID: "1,5,10"
    $ids_array = explode(',', $ids_string);
    
    $success = false;
    $message = 'Đã xóa thành công các sản phẩm đã chọn.';

    if (!empty($ids_array)) {
        
        // 1. Xóa khỏi Session Cart
        foreach ($ids_array as $id_to_delete) {
            // Dùng array_filter để xóa an toàn hơn và không cần phải re-index ngay lập tức
            $_SESSION['cart'] = array_filter($_SESSION['cart'], function($item) use ($id_to_delete) {
                return $item['id'] != $id_to_delete;
            });
        }
        // Đảm bảo session được đánh lại key sau khi xóa
        $_SESSION['cart'] = array_values($_SESSION['cart']);

        // 2. Xóa khỏi DB nếu khách hàng đã đăng nhập và có code_cart
        if ($id_khachhang && $code_cart) {
            
            // Chuẩn bị ID an toàn cho SQL (ví dụ: '1','5','10')
            $safe_ids = array_map(function($id) use ($mysqli) {
                return "'" . mysqli_real_escape_string($mysqli, trim($id)) . "'";
            }, $ids_array);
            
            $ids_for_sql = implode(',', $safe_ids);
            
            $code_cart_safe = mysqli_real_escape_string($mysqli, $code_cart);
            
            $sql_delete_db = "DELETE FROM tbl_chitiet_giohang 
                              WHERE code_cart = '$code_cart_safe' AND idsanpham IN ($ids_for_sql)";
            
            if (mysqli_query($mysqli, $sql_delete_db)) {
                $success = true;
            } else {
                 $message = 'Đã xóa khỏi giỏ hàng (session), nhưng lỗi khi xóa khỏi Database.';
            }
        } else {
             // Nếu không đăng nhập, việc xóa Session đã là thành công
             $success = true;
        }
    } else {
        $message = 'Không có sản phẩm nào được chọn.';
    }
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message
    ]);
    exit;
}

// ✅ Xoá sản phẩm theo ID (Dùng cho nút "Xóa" trên từng dòng sản phẩm)
if (isset($_GET['xoa'])) {
    $id_to_delete = $_GET['xoa'];

    // 1. Xóa khỏi Session Cart
    // Loại bỏ sản phẩm có ID trùng khỏi session
    $_SESSION['cart'] = array_filter($_SESSION['cart'], function($item) use ($id_to_delete) {
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

//thêm số lượng
if (isset($_GET['cong'])) {
    $id = $_GET['cong'];
    $sql_pro = "SELECT * FROM tbl_sanpham WHERE tbl_sanpham.idsanpham = '" . $id . "' LIMIT 1";
    $pro = mysqli_query($mysqli, $sql_pro);
    $row = mysqli_fetch_array($pro);
    foreach ($_SESSION['cart'] as $cart_item) {
        if ($cart_item['id'] != $id) {
            $product[] = array(
                'tensanpham' => $cart_item['tensanpham'],
                'id' => $cart_item['id'],
                'soluong' => $cart_item['soluong'],
                'giaban' => $cart_item['giaban'],
                'hinhanh' => $cart_item['hinhanh'],
                'masanpham' => $cart_item['masanpham']
            );
            $_SESSION['cart'] = $product;
        } else {
            if ($cart_item['soluong'] < $row['so_luong_con_lai']) {
                $tangso_luong = $cart_item['soluong'] + 1;
                $product[] = array(
                    'tensanpham' => $cart_item['tensanpham'],
                    'id' => $cart_item['id'],
                    'soluong' => $cart_item['soluong'],
                    'giaban' => $cart_item['giaban'],
                    'hinhanh' => $cart_item['hinhanh'],
                    'masanpham' => $cart_item['masanpham']
                );
            } else {
                $product[] = array(
                    'tensanpham' => $cart_item['tensanpham'],
                    'id' => $cart_item['id'],
                    'soluong' => $cart_item['soluong'],
                    'giaban' => $cart_item['giaban'],
                    'hinhanh' => $cart_item['hinhanh'],
                    'masanpham' => $cart_item['masanpham']
                );
            }
            $_SESSION['cart'] = $product;
        }
    }
    header('Location:../../index.php?quanly=giohang');
}
// trừ số lượng
if (isset($_GET['tru'])) {
    $id = $_GET['tru'];
    foreach ($_SESSION['cart'] as $cart_item) {
        if ($cart_item['id'] != $id) {
            $product[] = array(
                'tensanpham' => $cart_item['tensanpham'],
                'id' => $cart_item['id'],
                'soluong' => $cart_item['soluong'],
                'giaban' => $cart_item['giaban'],
                'hinhanh' => $cart_item['hinhanh'],
                'masanpham' => $cart_item['masanpham']
            );
            $_SESSION['cart'] = $product;
        } else {
            if ($cart_item['soluong'] > 1) {
                $tangso_luong = $cart_item['soluong'] - 1;
                $product[] = array(
                    'tensanpham' => $cart_item['tensanpham'],
                    'id' => $cart_item['id'],
                    'soluong' => $cart_item['soluong'],
                    'giaban' => $cart_item['giaban'],
                    'hinhanh' => $cart_item['hinhanh'],
                    'masanpham' => $cart_item['masanpham']
                );
            } else {
            }
            $_SESSION['cart'] = $product;
        }
    }
    header('Location:../../index.php?quanly=giohang');
}
