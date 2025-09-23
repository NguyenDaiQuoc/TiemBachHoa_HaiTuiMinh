<?php
include('../../config/config.php');

// Hàm kiểm tra dữ liệu nhập vào
function validateProduct($data, $mysqli, $isEdit = false, $currentId = null)
{
	$errors = [];

	if (empty(trim($data['tensanpham'] ?? ''))) $errors[] = 'Tên sản phẩm không được để trống';
	if (empty(trim($data['masanpham'] ?? ''))) $errors[] = 'Mã sản phẩm không được để trống';
	if (empty(trim($data['giasanpham'] ?? ''))) $errors[] = 'Giá sản phẩm không được để trống';
	if (empty(trim($data['soluong'] ?? ''))) $errors[] = 'Số lượng không được để trống';
	if (!$isEdit && empty($_FILES['hinhanh']['name'])) $errors[] = 'Hình ảnh không được để trống';

	if (!is_numeric($data['soluong'] ?? null) || (float)$data['soluong'] < 0) $errors[] = 'Số lượng phải là số dương';
	if (!is_numeric($data['giasanpham'] ?? null) || (float)$data['giasanpham'] < 0) $errors[] = 'Giá sản phẩm phải là số dương';

	// Danh mục
	$selectedCategories = $data['id_danhmuc'] ?? [];
	if (!is_array($selectedCategories) || count($selectedCategories) === 0) {
		$errors[] = 'Vui lòng chọn ít nhất một danh mục';
	}

	$tensanpham = mysqli_real_escape_string($mysqli, trim($data['tensanpham'] ?? ''));
	$masanpham = mysqli_real_escape_string($mysqli, trim($data['masanpham'] ?? ''));
	$sql_name = "SELECT COUNT(*) AS count FROM tbl_sanpham WHERE tensanpham = '$tensanpham'";
	$sql_code = "SELECT COUNT(*) AS count FROM tbl_sanpham WHERE masanpham = '$masanpham'";
	if ($isEdit && $currentId) {
		$sql_name .= " AND idsanpham != '" . (int)$currentId . "'";
		$sql_code .= " AND idsanpham != '" . (int)$currentId . "'";
	}
	$count_name = mysqli_fetch_assoc(mysqli_query($mysqli, $sql_name))['count'] ?? 0;
	$count_code = mysqli_fetch_assoc(mysqli_query($mysqli, $sql_code))['count'] ?? 0;
	if ((int)$count_name > 0) $errors[] = 'Tên sản phẩm đã tồn tại';
	if ((int)$count_code > 0) $errors[] = 'Mã sản phẩm đã tồn tại';

	if (!empty($_FILES['hinhanh']['name'])) {
		$imageFileType = strtolower(pathinfo($_FILES['hinhanh']['name'], PATHINFO_EXTENSION));
		$check = @getimagesize($_FILES['hinhanh']['tmp_name']);
		if ($check === false) $errors[] = 'File không phải là hình ảnh';
		if (($_FILES['hinhanh']['size'] ?? 0) > 5000000) $errors[] = 'File ảnh quá lớn! (tối đa 5MB)';
		if (!in_array($imageFileType, ['jpg', 'jpeg', 'png', 'gif'])) $errors[] = 'Chỉ chấp nhận JPG, JPEG, PNG, GIF';
	}

	return $errors;
}

// Tạo bảng mapping nếu chưa có
function ensureMappingTable($mysqli) {
	$sql = "CREATE TABLE IF NOT EXISTS tbl_sanpham_danhmuc (
		idsanpham INT NOT NULL,
		id_danhmuc INT NOT NULL,
		PRIMARY KEY (idsanpham, id_danhmuc)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8";
	mysqli_query($mysqli, $sql);
}

// XỬ LÝ THÊM SẢN PHẨM
if (isset($_POST['themSanPham'])) {
	$errors = validateProduct($_POST, $mysqli);

	if (!empty($errors)) {
		echo "<script>alert('" . implode("\\n", $errors) . "'); window.location.href='../../index.php?action=quanlysanpham&query=them';</script>";
		exit();
	}

	$tensp = mysqli_real_escape_string($mysqli, $_POST['tensanpham']);
	$masp = mysqli_real_escape_string($mysqli, $_POST['masanpham']);
	$giasp = (float)$_POST['giasanpham'];
	$soluong = (int)$_POST['soluong'];
	$hinhanh = $_FILES['hinhanh']['name'];
	$tomtat = mysqli_real_escape_string($mysqli, $_POST['tomtat'] ?? '');
	$noidung = mysqli_real_escape_string($mysqli, $_POST['noidung'] ?? '');
	$tinhtrang = isset($_POST['tinhtrang']) ? (int)$_POST['tinhtrang'] : 0;
	$selectedCategories = array_map('intval', $_POST['id_danhmuc'] ?? []);
	$primaryCategory = $selectedCategories[0] ?? 0;
	$hinhanh_tmp = $_FILES['hinhanh']['tmp_name'];

	move_uploaded_file($hinhanh_tmp, 'uploads/' . $hinhanh);

	// Insert sản phẩm với danh mục chính
	$sql = "INSERT INTO tbl_sanpham(tensanpham, masanpham, giasanpham, soluong, soluongconlai, hinhanh, tomtat, noidung, tinhtrang, id_danhmuc) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
	$stmt = mysqli_prepare($mysqli, $sql);
	mysqli_stmt_bind_param($stmt, "ssdddsssii", $tensp, $masp, $giasp, $soluong, $soluong, $hinhanh, $tomtat, $noidung, $tinhtrang, $primaryCategory);
	mysqli_stmt_execute($stmt);

	$productId = mysqli_insert_id($mysqli);

	// Lưu mapping nhiều danh mục
	ensureMappingTable($mysqli);
	if ($productId && !empty($selectedCategories)) {
		// Xóa trùng và chỉ chèn danh mục hợp lệ
		$selectedCategories = array_values(array_unique(array_filter($selectedCategories, function($v){ return (int)$v > 0; })));
		$ins = mysqli_prepare($mysqli, "INSERT IGNORE INTO tbl_sanpham_danhmuc (idsanpham, id_danhmuc) VALUES (?, ?)");
		foreach ($selectedCategories as $catId) {
			mysqli_stmt_bind_param($ins, "ii", $productId, $catId);
			mysqli_stmt_execute($ins);
		}
	}

	echo "<script>alert('Thêm sản phẩm thành công!'); window.location.href='../../index.php?action=quanlysanpham&query=them';</script>";
	exit();
}

// XỬ LÝ SỬA SẢN PHẨM
elseif (isset($_POST['suaSanPham'])) {
	$id = (int)($_GET['idsanpham'] ?? 0);
	$errors = validateProduct($_POST, $mysqli, true, $id);

	if (!empty($errors)) {
		echo "<script>alert('" . implode("\\n", $errors) . "'); window.location.href='../../index.php?action=quanlysanpham&query=sua&idsanpham=$id';</script>";
		exit();
	}

	$tensp = mysqli_real_escape_string($mysqli, $_POST['tensanpham']);
	$masp = mysqli_real_escape_string($mysqli, $_POST['masanpham']);
	$giasp = (float)$_POST['giasanpham'];
	$soluong = (int)$_POST['soluong'];
	$soluongconlai = (int)($_POST['soluongconlai'] ?? $soluong);
	$tomtat = mysqli_real_escape_string($mysqli, $_POST['tomtat'] ?? '');
	$noidung = mysqli_real_escape_string($mysqli, $_POST['noidung'] ?? '');
	$tinhtrang = isset($_POST['tinhtrang']) ? (int)$_POST['tinhtrang'] : 0;
	$selectedCategories = array_map('intval', $_POST['id_danhmuc'] ?? []);
	$primaryCategory = $selectedCategories[0] ?? (int)($_POST['danhmuc'] ?? 0);

	if (!empty($_FILES['hinhanh']['name'])) {
		$hinhanh = $_FILES['hinhanh']['name'];
		$hinhanh_tmp = $_FILES['hinhanh']['tmp_name'];

		$result = mysqli_query($mysqli, "SELECT hinhanh FROM tbl_sanpham WHERE idsanpham = $id");
		$row = mysqli_fetch_assoc($result);
		if ($row && $row['hinhanh'] && file_exists('uploads/' . $row['hinhanh'])) unlink('uploads/' . $row['hinhanh']);

		move_uploaded_file($hinhanh_tmp, 'uploads/' . $hinhanh);

		$sql = "UPDATE tbl_sanpham SET tensanpham=?, masanpham=?, giasanpham=?, soluong=?, soluongconlai=?, hinhanh=?, tomtat=?, noidung=?, tinhtrang=?, id_danhmuc=? 
				WHERE idsanpham=?";
		$stmt = mysqli_prepare($mysqli, $sql);
		mysqli_stmt_bind_param($stmt, "ssdddsssiii", $tensp, $masp, $giasp, $soluong, $soluongconlai, $hinhanh, $tomtat, $noidung, $tinhtrang, $primaryCategory, $id);
	} else {
		$sql = "UPDATE tbl_sanpham SET tensanpham=?, masanpham=?, giasanpham=?, soluong=?, soluongconlai=?, tomtat=?, noidung=?, tinhtrang=?, id_danhmuc=? 
				WHERE idsanpham=?";
		$stmt = mysqli_prepare($mysqli, $sql);
		mysqli_stmt_bind_param($stmt, "ssdddssiii", $tensp, $masp, $giasp, $soluong, $soluongconlai, $tomtat, $noidung, $tinhtrang, $primaryCategory, $id);
	}

	mysqli_stmt_execute($stmt);

	// Cập nhật mapping nếu có chọn nhiều danh mục từ form sửa (tùy chỉnh giao diện sau)
	if (!empty($selectedCategories)) {
		ensureMappingTable($mysqli);
		mysqli_query($mysqli, "DELETE FROM tbl_sanpham_danhmuc WHERE idsanpham = $id");
		$selectedCategories = array_values(array_unique(array_filter($selectedCategories, function($v){ return (int)$v > 0; })));
		$ins = mysqli_prepare($mysqli, "INSERT IGNORE INTO tbl_sanpham_danhmuc (idsanpham, id_danhmuc) VALUES (?, ?)");
		foreach ($selectedCategories as $catId) {
			mysqli_stmt_bind_param($ins, "ii", $id, $catId);
			mysqli_stmt_execute($ins);
		}
	}

	echo "<script>alert('Cập nhật thành công!'); window.location.href='../../index.php?action=quanlysanpham&query=them';</script>";
	exit();
}

// XỬ LÝ XÓA SẢN PHẨM
elseif (isset($_GET['idsanpham'])) {
	$id = intval($_GET['idsanpham']);

	$result = mysqli_query($mysqli, "SELECT hinhanh FROM tbl_sanpham WHERE idsanpham = $id");
	$row = mysqli_fetch_assoc($result);
	if ($row && $row['hinhanh'] && file_exists('uploads/' . $row['hinhanh'])) {
		unlink('uploads/' . $row['hinhanh']);
	}

	// Xóa mapping
	ensureMappingTable($mysqli);
	mysqli_query($mysqli, "DELETE FROM tbl_sanpham_danhmuc WHERE idsanpham = $id");

	mysqli_query($mysqli, "DELETE FROM tbl_sanpham WHERE idsanpham = $id");

	echo "<script>alert('Xóa sản phẩm thành công!'); window.location.href='../../index.php?action=quanLySanPham&query=them';</script>";
	exit();
}
?>
