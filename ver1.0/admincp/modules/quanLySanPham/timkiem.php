<?php
include("config/config.php");

$search = isset($_GET['search']) ? mysqli_real_escape_string($mysqli, trim($_GET['search'])) : '';
$search_field = isset($_GET['search_field']) ? $_GET['search_field'] : 'all';
$price_min = isset($_GET['price_min']) ? floatval($_GET['price_min']) : null;
$price_max = isset($_GET['price_max']) ? floatval($_GET['price_max']) : null;

// WHERE điều kiện
$where_clause = "WHERE 1 = 1";

if (!empty($search)) {
    switch ($search_field) {
        case 'tensanpham':
            $where_clause .= " AND sp.tensanpham LIKE '%$search%'";
            break;
        case 'masanpham':
            $where_clause .= " AND sp.masanpham LIKE '%$search%'";
            break;
        case 'tinh_trang':
            $status = (strtolower($search) == 'kích hoạt' || $search == '1') ? 1 : 0;
            $where_clause .= " AND sp.tinhtrang = $status";
            break;
        default:
            $where_clause .= " AND (
                sp.tensanpham LIKE '%$search%' 
                OR sp.masanpham LIKE '%$search%' 
                OR sp.noidung LIKE '%$search%'
                OR sp.tomtat LIKE '%$search%'
            )";
            break;
    }
}

if (!is_null($price_min)) {
    $where_clause .= " AND sp.giasanpham >= $price_min";
}
if (!is_null($price_max)) {
    $where_clause .= " AND sp.giasanpham <= $price_max";
}

// Truy vấn
$sql_lietke = "
    SELECT sp.*, dm.ten_danhmuc 
    FROM tbl_sanpham sp 
    JOIN tbl_danhmuc dm ON sp.id_danhmuc = dm.id_danhmuc 
    $where_clause 
    ORDER BY sp.id_sp DESC
";
$lietke = mysqli_query($mysqli, $sql_lietke);
?>

<!-- Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">

<div class="container mt-5">
    <h3 class="text-center">Kết Quả Tìm Kiếm Sản Phẩm</h3>

    <!-- Form -->
    <div class="row mb-4">
        <div class="col-md-12">
            <form class="row g-3" method="GET" action="index.php">
                <input type="hidden" name="action" value="quanLySanPham">
                <input type="hidden" name="query" value="timkiem">

                <div class="col-md-4">
                    <input type="text" name="search" class="form-control" placeholder="Từ khóa tìm kiếm..." value="<?php echo htmlspecialchars($search); ?>">
                </div>

                <div class="col-md-2">
                    <select name="search_field" class="form-select">
                        <option value="all" <?php echo $search_field == 'all' ? 'selected' : ''; ?>>Tất cả</option>
                        <option value="tensanpham" <?php echo $search_field == 'tensanpham' ? 'selected' : ''; ?>>Tên sản phẩm</option>
                        <option value="masanpham" <?php echo $search_field == 'masanpham' ? 'selected' : ''; ?>>Mã sản phẩm</option>
                        <option value="tinh_trang" <?php echo $search_field == 'tinh_trang' ? 'selected' : ''; ?>>Trạng thái</option>
                    </select>
                </div>

                <div class="col-md-2">
                    <input type="number" name="price_min" min="0" class="form-control" placeholder="Giá từ..." value="<?php echo htmlspecialchars($price_min); ?>">
                </div>

                <div class="col-md-2">
                    <input type="number" name="price_max" min="0" class="form-control" placeholder="Giá đến..." value="<?php echo htmlspecialchars($price_max); ?>">
                </div>

                <div class="col-md-2">
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-search"></i> Tìm kiếm
                    </button>
                </div>

                <?php if (!empty($search) || !is_null($price_min) || !is_null($price_max)): ?>
                <div class="col-md-12 mt-2">
                    <a href="index.php?action=quanLySanPham&query=them" class="btn btn-secondary">Quay lại</a>
                </div>
                <?php endif; ?>
            </form>
        </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
        <table class="table table-striped table-hover text-center align-middle">
            <thead class="table-dark">
                <tr>
                    <th>#</th>
                    <th>Tên SP</th>
                    <th>Hình ảnh</th>
                    <th>Giá</th>
                    <th>Số lượng</th>
                    <th>Còn lại</th>
                    <th>Danh mục</th>
                    <th>Mã SP</th>
                    <th>Nội dung</th>
                    <th>Tóm tắt</th>
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
                    <td>
                        <img src="modules/quanLySanPham/uploads/<?php echo htmlspecialchars($row['hinhanh']); ?>" width="100px" onerror="this.src='default.png';">
                    </td>
                    <td><?php echo number_format($row['giasanpham'], 0, ',', '.') . ' VND'; ?></td>
                    <td><?php echo (int)$row['soluong']; ?></td>
                    <td><?php echo (int)$row['soluongconlai']; ?></td>
                    <td><?php echo htmlspecialchars($row['ten_danhmuc']); ?></td>
                    <td><?php echo htmlspecialchars($row['masanpham']); ?></td>
                    <td><textarea class="form-control" rows="3" readonly><?php echo htmlspecialchars($row['noidung']); ?></textarea></td>
                    <td><textarea class="form-control" rows="3" readonly><?php echo htmlspecialchars($row['tomtat']); ?></textarea></td>
                    <td><?php echo $row['tinhtrang'] == 1 ? 'Kích hoạt' : 'Ẩn'; ?></td>
                    <td>
                        <a href="modules/quanLySanPham/xuly.php?idsp=<?php echo urlencode($row['masanpham']); ?>" class="btn btn-danger btn-sm" onclick="return confirm('Bạn có chắc muốn xóa sản phẩm này?');">Xóa</a>
                        <a href="?action=quanLySanPham&query=sua&idsp=<?php echo urlencode($row['masanpham']); ?>" class="btn btn-warning btn-sm">Sửa</a>
                    </td>
                </tr>
                <?php
                }
                if ($i == 0) {
                    echo '<tr><td colspan="12">Không tìm thấy sản phẩm nào phù hợp.</td></tr>';
                }
                ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
