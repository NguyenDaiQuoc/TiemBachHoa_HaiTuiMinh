<?php
include("config/config.php");

if (isset($_GET['ajax_search'])) {
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $search_field = isset($_GET['search_field']) ? $_GET['search_field'] : 'all';
    $price_min = isset($_GET['price_min']) && $_GET['price_min'] !== '' ? floatval($_GET['price_min']) : '';
    $price_max = isset($_GET['price_max']) && $_GET['price_max'] !== '' ? floatval($_GET['price_max']) : '';

    $where_clause = "WHERE 1"; // không join danh mục nếu không cần hiển thị tên danh mục

    if (!empty($search) || $price_min !== '' || $price_max !== '') {
        if (!empty($search)) {
            switch ($search_field) {
                case 'tensanpham':
                    $where_clause .= " AND tensanpham LIKE '%" . mysqli_real_escape_string($mysqli, $search) . "%'";
                    break;
                case 'masanpham':
                    $where_clause .= " AND masanpham LIKE '%" . mysqli_real_escape_string($mysqli, $search) . "%'";
                    break;
                case 'tinhtrang':
                    $status = ($search == 'kích hoạt' || $search == '1') ? 1 : 0;
                    $where_clause .= " AND tinhtrang = $status";
                    break;
                default:
                    $s = mysqli_real_escape_string($mysqli, $search);
                    $where_clause .= " AND (tensanpham LIKE '%$s%' 
                                        OR masanpham LIKE '%$s%' 
                                        OR noidung LIKE '%$s%'
                                        OR tomtat LIKE '%$s%')";
            }
        }

        if ($price_min !== '') {
            $where_clause .= " AND giasanpham >= $price_min";
        }
        if ($price_max !== '') {
            $where_clause .= " AND giasanpham <= $price_max";
        }
    }

    $sql_lietke = "SELECT * FROM tbl_sanpham $where_clause ORDER BY idsanpham DESC";
    $lietke = mysqli_query($mysqli, $sql_lietke);

    ob_start();
    $i = 0;
    while ($row = mysqli_fetch_assoc($lietke)) {
        $i++;
        ?>
        <tr>
            <td><?php echo $i; ?></td>
            <td><?php echo htmlspecialchars($row['tensanpham']); ?></td>
            <td><?php echo htmlspecialchars($row['masanpham']); ?></td>
            <td><?php echo number_format($row['giasanpham'], 0, ',', '.') . ' VND'; ?></td>
            <td><?php echo isset($row['khuyenmai']) ? htmlspecialchars($row['khuyenmai']) : ''; ?></td>
            <td><?php echo isset($row['giaban']) ? number_format($row['giaban'], 0, ',', '.') . ' VND' : ''; ?></td>
            <td><?php echo $row['soluong']; ?></td>
            <td><?php echo $row['soluongconlai']; ?></td>
            <td>
                <?php if (!empty($row['hinhanh'])): ?>
                    <img src="modules/quanLySanPham/uploads/<?php echo htmlspecialchars($row['hinhanh']); ?>" width="100px" alt="Hình sản phẩm">
                <?php endif; ?>
            </td>
            <td><textarea readonly rows="3" class="form-control"><?php echo htmlspecialchars($row['tomtat']); ?></textarea></td>
            <td><textarea readonly rows="3" class="form-control"><?php echo htmlspecialchars($row['noidung']); ?></textarea></td>
            <td><?php echo $row['id_danhmuc']; ?></td>
            <td><?php echo ($row['tinhtrang'] == 1) ? 'Kích hoạt' : 'Ẩn'; ?></td>
            <td>
                <a href="modules/quanLySanPham/xuly.php?idsanpham=<?php echo $row['idsanpham']; ?>" class="btn btn-danger btn-sm" onclick="return confirm('Bạn có chắc muốn xóa sản phẩm này?')">Xóa</a>
                <a href="?action=quanLySanPham&query=sua&idsanpham=<?php echo $row['idsanpham']; ?>" class="btn btn-warning btn-sm">Sửa</a>
            </td>
        </tr>
        <?php
    }
    echo ob_get_clean();
    exit;
}

// Load lúc không ajax (trang chính)
$search = isset($_GET['search']) ? $_GET['search'] : '';
$search_field = isset($_GET['search_field']) ? $_GET['search_field'] : 'all';
$price_min = isset($_GET['price_min']) && $_GET['price_min'] !== '' ? floatval($_GET['price_min']) : '';
$price_max = isset($_GET['price_max']) && $_GET['price_max'] !== '' ? floatval($_GET['price_max']) : '';

$where_clause = "WHERE 1";

if (!empty($search) || $price_min !== '' || $price_max !== '') {
    if (!empty($search)) {
        switch ($search_field) {
            case 'tensanpham':
                $where_clause .= " AND tensanpham LIKE '%" . mysqli_real_escape_string($mysqli, $search) . "%'";
                break;
            case 'masanpham':
                $where_clause .= " AND masanpham LIKE '%" . mysqli_real_escape_string($mysqli, $search) . "%'";
                break;
            case 'tinhtrang':
                $status = ($search == 'kích hoạt' || $search == '1') ? 1 : 0;
                $where_clause .= " AND tinhtrang = $status";
                break;
            default:
                $s = mysqli_real_escape_string($mysqli, $search);
                $where_clause .= " AND (tensanpham LIKE '%$s%' 
                                    OR masanpham LIKE '%$s%' 
                                    OR noidung LIKE '%$s%'
                                    OR tomtat LIKE '%$s%')";
        }
    }

    if ($price_min !== '') {
        $where_clause .= " AND giasanpham >= $price_min";
    }
    if ($price_max !== '') {
        $where_clause .= " AND giasanpham <= $price_max";
    }
}

$sql_lietke = "SELECT * FROM tbl_sanpham $where_clause ORDER BY idsanpham DESC";
$lietke = mysqli_query($mysqli, $sql_lietke);
?>
<table class="table table-bordered">
    <thead>
        <tr>
            <th>STT</th>
            <th>Tên sản phẩm</th>
            <th>Mã sản phẩm</th>
            <th>Giá sản phẩm</th>
            <th>Khuyến mãi</th>
            <th>Giá bán</th>
            <th>Số lượng</th>
            <th>Số lượng còn lại</th>
            <th>Hình ảnh</th>
            <th>Tóm tắt</th>
            <th>Nội dung</th>
            <th>ID danh mục</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
        </tr>
    </thead>
    <tbody>
        <?php
        $i = 0;
        while ($row = mysqli_fetch_assoc($lietke)) {
            $i++;
            ?>
            <tr>
                <td><?php echo $i; ?></td>
                <td><?php echo htmlspecialchars($row['tensanpham']); ?></td>
                <td><?php echo htmlspecialchars($row['masanpham']); ?></td>
                <td><?php echo number_format($row['giasanpham'], 0, ',', '.') . ' VND'; ?></td>
                <td><?php echo isset($row['khuyenmai']) ? htmlspecialchars($row['khuyenmai']) : ''; ?></td>
                <td><?php echo isset($row['giaban']) ? number_format($row['giaban'], 0, ',', '.') . ' VND' : ''; ?></td>
                <td><?php echo $row['soluong']; ?></td>
                <td><?php echo $row['soluongconlai']; ?></td>
                <td>
                    <?php if (!empty($row['hinhanh'])): ?>
                        <img src="modules/quanLySanPham/uploads/<?php echo htmlspecialchars($row['hinhanh']); ?>" width="100px" alt="Hình sản phẩm">
                    <?php endif; ?>
                </td>
                <td><textarea readonly rows="3" class="form-control"><?php echo htmlspecialchars($row['tomtat']); ?></textarea></td>
                <td><textarea readonly rows="3" class="form-control"><?php echo htmlspecialchars($row['noidung']); ?></textarea></td>
                <td><?php echo $row['id_danhmuc']; ?></td>
                <td><?php echo ($row['tinhtrang'] == 1) ? 'Kích hoạt' : 'Ẩn'; ?></td>
                <td>
                    <a href="modules/quanLySanPham/xuly.php?idsanpham=<?php echo $row['idsanpham']; ?>" class="btn btn-danger btn-sm" onclick="return confirm('Bạn có chắc muốn xóa sản phẩm này?')">Xóa</a>
                    <a href="?action=quanLySanPham&query=sua&idsanpham=<?php echo $row['idsanpham']; ?>" class="btn btn-warning btn-sm">Sửa</a>
                </td>
            </tr>
            <?php
        }
        ?>
    </tbody>
</table>
