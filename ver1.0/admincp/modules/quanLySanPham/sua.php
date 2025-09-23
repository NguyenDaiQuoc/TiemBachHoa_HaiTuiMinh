<?php
include("config/config.php");

if (!isset($_GET['idsanpham'])) {
    echo "<div class='alert alert-warning text-center mt-4'>Không tìm thấy sản phẩm cần sửa!</div>";
    exit;
}

$idsanpham = intval($_GET['idsanpham']);
$sql_sua_sp = "SELECT * FROM tbl_sanpham WHERE idsanpham = $idsanpham LIMIT 1";
$query_sua_sp = mysqli_query($mysqli, $sql_sua_sp);

if (mysqli_num_rows($query_sua_sp) == 0) {
    echo "<div class='alert alert-danger text-center mt-4'>Sản phẩm không tồn tại!</div>";
    exit;
}

$row = mysqli_fetch_array($query_sua_sp);

// Xử lý cập nhật
if (isset($_POST['suasanpham'])) {
    $tensanpham = $_POST['tensanpham'];
    $masanpham = $_POST['masanpham'];
    $giasanpham = $_POST['giasanpham'];
    $soluong = $_POST['soluong'];
    $soluongconlai = $_POST['soluongconlai'];
    $danhmuc = $_POST['danhmuc'];
    $tomtat = $_POST['tomtat'];
    $noidung = $_POST['noidung'];
    $tinhtrang = $_POST['tinhtrang'];

    if ($_FILES['hinhanh']['name'] != '') {
        $hinhanh = $_FILES['hinhanh']['name'];
        $hinhanh_tmp = $_FILES['hinhanh']['tmp_name'];
        move_uploaded_file($hinhanh_tmp, "modules/quanLySanPham/uploads/" . $hinhanh);

        $sql_update = "UPDATE tbl_sanpham SET tensanpham='$tensanpham', masanpham='$masanpham', giasanpham='$giasanpham', soluong='$soluong', soluongconlai='$soluongconlai', hinhanh='$hinhanh', tomtat='$tomtat', noidung='$noidung', tinhtrang='$tinhtrang', id_danhmuc='$danhmuc' WHERE idsanpham=$idsanpham";
    } else {
        $sql_update = "UPDATE tbl_sanpham SET tensanpham='$tensanpham', masanpham='$masanpham', giasanpham='$giasanpham', soluong='$soluong', soluongconlai='$soluongconlai', tomtat='$tomtat', noidung='$noidung', tinhtrang='$tinhtrang', id_danhmuc='$danhmuc' WHERE idsanpham=$idsanpham";
    }

    if (mysqli_query($mysqli, $sql_update)) {
        echo "<script>
            alert('Cập nhật sản phẩm thành công!');
            window.location.href='index.php?action=quanlysanpham&query=them';
        </script>";
        exit;
    } else {
        echo "<script>alert('Cập nhật thất bại!');</script>";
    }
}
?>

<!-- Link Bootstrap -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">

<div class="container mt-5">
    <h3 class="text-center text-primary mb-4">Chỉnh Sửa Sản Phẩm</h3>
    <form method="POST" enctype="multipart/form-data">
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label">Tên sản phẩm</label>
                <input type="text" class="form-control" name="tensanpham" value="<?php echo htmlspecialchars($row['tensanpham']) ?>" required>
            </div>

            <div class="col-md-6">
                <label class="form-label">Mã sản phẩm</label>
                <input type="text" class="form-control" name="masanpham" value="<?php echo htmlspecialchars($row['masanpham']) ?>" required>
            </div>

            <div class="col-md-4">
                <label class="form-label">Giá sản phẩm</label>
                <input type="number" class="form-control" name="giasanpham" value="<?php echo $row['giasanpham'] ?>" required>
            </div>

            <div class="col-md-4">
                <label class="form-label">Số lượng</label>
                <input type="number" class="form-control" name="soluong" value="<?php echo $row['soluong'] ?>" required>
            </div>

            <div class="col-md-4">
                <label class="form-label">Số lượng còn lại</label>
                <input type="number" class="form-control" name="soluongconlai" value="<?php echo $row['soluongconlai'] ?>" required>
            </div>

            <div class="col-md-6">
                <label class="form-label">Danh mục</label>
                <select name="danhmuc" class="form-select" required>
                    <?php
                    $sql_danhmuc = "SELECT * FROM tbl_danhmuc ORDER BY id_danhmuc DESC";
                    $query_danhmuc = mysqli_query($mysqli, $sql_danhmuc);
                    while ($row_danhmuc = mysqli_fetch_array($query_danhmuc)) {
                        $selected = ($row['id_danhmuc'] == $row_danhmuc['id_danhmuc']) ? 'selected' : '';
                        echo "<option value='{$row_danhmuc['id_danhmuc']}' $selected>{$row_danhmuc['tendanhmuc']}</option>";
                    }
                    ?>
                </select>
            </div>

            <div class="col-md-6">
                <label class="form-label">Hình ảnh hiện tại</label><br>
                <img src="modules/quanLySanPham/uploads/<?php echo $row['hinhanh'] ?>" width="150px" class="mb-2 rounded">
                <input type="file" class="form-control" name="hinhanh">
            </div>

            <div class="col-md-6">
                <label class="form-label">Tóm tắt</label>
                <textarea class="form-control" name="tomtat" rows="3"><?php echo htmlspecialchars($row['tomtat']) ?></textarea>
            </div>

            <div class="col-md-6">
                <label class="form-label">Nội dung</label>
                <textarea class="form-control" name="noidung" rows="3"><?php echo htmlspecialchars($row['noidung']) ?></textarea>
            </div>

            <div class="col-md-4">
                <label class="form-label">Tình trạng</label>
                <select name="tinhtrang" class="form-select" required>
                    <option value="1" <?php echo ($row['tinhtrang'] == 1) ? 'selected' : '' ?>>Kích hoạt</option>
                    <option value="0" <?php echo ($row['tinhtrang'] == 0) ? 'selected' : '' ?>>Ẩn</option>
                </select>
            </div>
        </div>

        <div class="text-center mt-4">
            <button type="submit" name="suasanpham" class="btn btn-success px-5">Cập nhật</button>
        </div>
    </form>
</div>
