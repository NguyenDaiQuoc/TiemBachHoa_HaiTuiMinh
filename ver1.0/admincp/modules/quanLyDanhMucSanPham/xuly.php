<?php
// Hiển thị lỗi để debug khi test (có thể tắt khi public)
error_reporting(E_ALL);
ini_set('display_errors', 1);

include('../../config/config.php');

function validateCategoryName($name) {
    return preg_match('/^[a-zA-Z0-9\s\p{L}]{2,100}$/u', trim($name));
}

function isDuplicateCategory($mysqli, $name, $excludeId = null) {
    $stmt = null;
    if ($excludeId !== null) {
        $stmt = mysqli_prepare($mysqli, "SELECT COUNT(*) as count FROM tbl_danhmuc WHERE tendanhmuc = ? AND id_danhmuc != ?");
        mysqli_stmt_bind_param($stmt, "si", $name, $excludeId);
    } else {
        $stmt = mysqli_prepare($mysqli, "SELECT COUNT(*) as count FROM tbl_danhmuc WHERE tendanhmuc = ?");
        mysqli_stmt_bind_param($stmt, "s", $name);
    }
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    return $row['count'] > 0;
}

// THÊM DANH MỤC
if (isset($_POST['themDanhMuc'])) {
    $tenLoaisp = trim($_POST['tendanhmuc']);
    $thutu = intval($_POST['thutu']);

    if (empty($tenLoaisp)) {
        alertBack('Tên danh mục không được để trống!');
    }

    if (!validateCategoryName($tenLoaisp)) {
        alertBack('Tên danh mục không hợp lệ (2-100 ký tự, chỉ chứa chữ cái, số và khoảng trắng)');
    }

    if (isDuplicateCategory($mysqli, $tenLoaisp)) {
        alertBack('Tên danh mục đã tồn tại!');
    }

    $sql_them = "INSERT INTO tbl_danhmuc(tendanhmuc, thutu) VALUES (?, ?)";
    $stmt = mysqli_prepare($mysqli, $sql_them);
    mysqli_stmt_bind_param($stmt, "si", $tenLoaisp, $thutu);
    
    if (mysqli_stmt_execute($stmt)) {
        header('Location:../../index.php?action=quanLyDanhMucSanPham&query=them');
    } else {
        alertBack('Lỗi khi thêm danh mục: ' . mysqli_error($mysqli));
    }

// SỬA DANH MỤC
} elseif (isset($_POST['suaDanhMuc'])) {
    $tenLoaisp = trim($_POST['tendanhmuc']);
    $id = (int)$_GET['id_danhmuc'];
    $thutu = intval($_POST['thutu']);

    if (empty($tenLoaisp)) {
        alertBack('Tên danh mục không được để trống!');
    }

    if (!validateCategoryName($tenLoaisp)) {
        alertBack('Tên danh mục không hợp lệ (2-100 ký tự, chỉ chứa chữ cái, số và khoảng trắng)');
    }

    if (isDuplicateCategory($mysqli, $tenLoaisp, $id)) {
        alertBack('Tên danh mục đã tồn tại!');
    }

    $sql = "UPDATE tbl_danhmuc SET tendanhmuc=? WHERE id_danhmuc=?";
    $stmt = mysqli_prepare($mysqli, $sql);
    mysqli_stmt_bind_param($stmt, "si", $tenLoaisp, $id);
    
    if (mysqli_stmt_execute($stmt)) {
        header('Location:../../index.php?action=quanLyDanhMucSanPham&query=them');
    } else {
        alertBack('Lỗi khi cập nhật danh mục: ' . mysqli_error($mysqli));
    }

// XÓA DANH MỤC
} elseif (isset($_GET['id_danhmuc'])) {
    $id = (int)$_GET['id_danhmuc'];

    $sql = "SELECT COUNT(*) as count FROM tbl_sanpham WHERE id_danhmuc = ?";
    $stmt = mysqli_prepare($mysqli, $sql);
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);

    if ($row['count'] > 0) {
        alertBack("Không thể xóa vì có {$row['count']} sản phẩm trong danh mục!");
    } else {
        $sql = "DELETE FROM tbl_danhmuc WHERE id_danhmuc = ?";
        $stmt = mysqli_prepare($mysqli, $sql);
        mysqli_stmt_bind_param($stmt, "i", $id);
        if (mysqli_stmt_execute($stmt)) {
            alertBack('Xóa danh mục thành công!');
        } else {
            alertBack('Xóa thất bại: ' . mysqli_error($mysqli));
        }
    }

} else {
    alertBack('Hành động không hợp lệ!');
}

// Hàm hỗ trợ alert và quay về trang quản lý
function alertBack($msg) {
    echo "<script>alert('$msg'); window.location.href='../../index.php?action=quanLyDanhMucSanPham&query=them';</script>";
    exit;
}
?>
