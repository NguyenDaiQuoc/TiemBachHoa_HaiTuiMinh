<?php
session_start();
include("../../admincp/config/config.php");
// thêm vào giỏ hàng

// Load giỏ hàng từ DB nếu chưa có trong session (mới)
if (!isset($_SESSION['cart']) && $id_khachhang && $code_cart) {
    $query = mysqli_query($mysqli, "SELECT c.*, s.tensanpham, s.giasp, s.soluongconlai 
        FROM tbl_chitiet_giohang c 
        JOIN tbl_sanpham s ON c.idsanpham = s.id_sanpham 
        WHERE c.code_cart = '$code_cart'");

    $cart = [];
    while ($row = mysqli_fetch_array($query)) {
        $cart[] = [
            'id' => $row['idsanpham'],
            'tensanpham' => $row['tensanpham'],
            'giasp' => $row['giasp'],
            'soluong' => $row['soluong'],
            'soluongconlai' => $row['soluongconlai'],
        ];
    }
    $_SESSION['cart'] = $cart;
}
// Cập nhật số lượng bằng AJAX
if (isset($_POST['action']) && $_POST['action'] == 'update') {
    $id = $_POST['id'];
    $type = $_POST['type']; // 'plus' hoặc 'minus'

    foreach ($_SESSION['cart'] as &$item) {
        if ($item['id'] == $id) {
            // Lấy số lượng còn lại từ DB
            $result = mysqli_query($mysqli, "SELECT soluongconlai FROM tbl_sanpham WHERE id_sanpham = '$id'");
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
                mysqli_query($mysqli, "UPDATE tbl_chitiet_giohang SET soluong = '$new_qty' 
                    WHERE code_cart = '$code_cart' AND idsanpham = '$id'");
            }

            break;
        }
    }
    echo json_encode(['success' => true]);
    exit;
} //(mới)

if (isset($_POST['themgiohang'])) {
    //    RESET SESSTION 
    // if (session_status() == PHP_SESSION_NONE) {
    //     session_start();
    // }
    // session_destroy();
    $id = $_GET['idsanpham'];
    $so_luong = $_POST['soluong'];
    $sql = "SELECT * FROM tbl_sanpham WHERE tbl_sanpham.idsanpham =  '".$id."' LIMIT 1 ";
    $query = mysqli_query($mysqli, $sql);
    $row = mysqli_fetch_array($query);
    if ($row) {
        $new_product = array(
            array(
                'tensanpham' => $row['tensanpham'],
                'id' => $row['id'],
                'soluong' => $row['soluong'],
                'giaban' => $row['giaban'],
                'hinhanh' => $row['hinhanh'],
                'masanpham' => $row['masanpham'],
                'soluongconlai' => $row['so_luong_con_lai'] ?? 0
            )
        );
        if (isset($_SESSION['cart']) && is_array($_SESSION['cart'])) {
            $found = false;
            $product = array();
            foreach ($_SESSION['cart'] as $cart_item) {
                // nếu trùng sản phẩm
                if ($cart_item['id'] == $id) {
                    $product[] = array(
                        'tensanpham' => $cart_item['tensanpham'],
                        'id' => $cart_item['id'],
                        'soluong' => $cart_item['soluong'] + $so_luong,
                        'giaban' => $cart_item['giaban'],
                        'hinhanh' => $cart_item['hinhanh'],
                        'masanpham' => $cart_item['masanpham'],
                        'soluongconlai' => $row['so_luong_con_lai'] ?? 0
                    );
                    $found = true;
                } else {
                    $product[] = array(
                        'tensanpham' => $cart_item['tensanpham'],
                        'id' => $cart_item['id'],
                        'soluong' => $cart_item['soluong'],
                        'giaban' => $cart_item['giaban'],
                        'hinhanh' => $cart_item['hinhanh'],
                        'masanpham' => $cart_item['masanpham'],
                        'soluongconlai' => $row['so_luong_con_lai'] ?? 0

                    );
                }
            }
            if ($found == false) {
                $_SESSION['cart'] = array_merge($product, $new_product);
                // echo 'ko trùng';
                // print_r($_SESSION['cart']);
            } else {
                $_SESSION['cart'] = $product;
                // echo 'trùng';
                // print_r($_SESSION['cart']);
            }
        } else {
            $_SESSION['cart'] = $new_product;
            // echo 'Tạo mới session';
            // print_r($_SESSION['cart']);
        }
    }
    // Nếu có yêu cầu redirect về giỏ hàng
    if (isset($_GET['redirect']) && $_GET['redirect'] == 'giohang') {
        $_SESSION['message'] = '✅ Thêm vào giỏ hàng thành công!';
        header('Location: ../../index.php?quanly=giohang');
        exit();
    } else {
        header('Location:../../index.php?quanly=sanpham&id=' . $id . '&additem_success=1');
        exit();
    }

}

// Xoá sản phẩm
if (isset($_GET['xoa'])) {
    $id = $_GET['xoa'];

    foreach ($_SESSION['cart'] as $key => $item) {
        if ($item['id'] == $id) {
            unset($_SESSION['cart'][$key]);
            break;
        }
    }

    // Xoá trong DB
    if ($id_khachhang && $code_cart) {
        mysqli_query($mysqli, "DELETE FROM tbl_chitiet_giohang WHERE code_cart = '$code_cart' AND idsanpham = '$id'");
    }

    header('Location: giohang.php');
    exit;
}

// Xoá tất cả
if (isset($_GET['xoatatca']) && $_GET['xoatatca'] == 1) {
    unset($_SESSION['cart']);

    if ($id_khachhang && $code_cart) {
        mysqli_query($mysqli, "DELETE FROM tbl_chitiet_giohang WHERE code_cart = '$code_cart'");
    }

    header('Location: giohang.php');
    exit;
}

// xóa sản phẩm (cũ)
if (isset($_GET['xoa']) && isset($_SESSION['cart'])) {
    $id = $_GET['xoa'];
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
        }
        $_SESSION['cart'] = $product;
    }
    echo "<script>window.location.href='../../index.php?quanly=giohang';</script>";
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
