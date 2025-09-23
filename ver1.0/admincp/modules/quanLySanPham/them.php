<?php
include("config/config.php");

// Kiểm tra kết nối
if (!$mysqli) {
	die("Kết nối DB thất bại: " . mysqli_connect_error());
}

// Bật hiển thị lỗi (dùng khi dev)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Lấy danh sách danh mục gốc
$query_root = "SELECT id_danhmucgoc, tendanhmuc FROM tbl_danhmucgoc ORDER BY id_danhmucgoc ASC";
$result_root = mysqli_query($mysqli, $query_root);

// Lấy danh sách danh mục con
$query_child = "SELECT id_danhmuc, tendanhmuc, iddanhmucgoc FROM tbl_danhmuc ORDER BY id_danhmuc ASC";
$result_child = mysqli_query($mysqli, $query_child);
$childCategories = [];
if ($result_child) {
	while ($row = mysqli_fetch_assoc($result_child)) {
		$childCategories[] = $row;
	}
}
?>

<!-- Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">

<div class="container mt-5">
	<h3 class="text-center">Thêm Sản Phẩm</h3>
	<form method="POST" action="modules/quanLySanPham/xuly.php" enctype="multipart/form-data" id="productForm">
		<div class="mb-3">
			<label for="tensanpham" class="form-label">Tên Sản Phẩm</label>
			<input type="text" class="form-control" id="tensanpham" name="tensanpham" required>
		</div>
		<div class="mb-3">
			<label for="masanpham" class="form-label">Mã Sản Phẩm</label>
			<input type="text" class="form-control" id="masanpham" name="masanpham" required>
		</div>
		<div class="mb-3">
			<label for="giasanpham" class="form-label">Giá Gốc (VNĐ)</label>
			<input type="number" class="form-control" id="giasanpham" name="giasanpham" min="0" step="1000" required>
		</div>
		<div class="mb-3">
			<label for="khuyenmai" class="form-label">Khuyến Mãi (%)</label>
			<input type="number" class="form-control" id="khuyenmai" name="khuyenmai" min="0" max="100" step="1" value="0" required>
		</div>
		<div class="mb-3">
			<label for="giaban" class="form-label">Giá Bán (Sau Giảm, VNĐ)</label>
			<input type="number" class="form-control" id="giaban" name="giaban" readonly>
		</div>
		<div class="mb-3">
			<label for="soluong" class="form-label">Số Lượng</label>
			<input type="number" class="form-control" id="soluong" name="soluong" min="0" required>
		</div>
		<div class="mb-3">
			<label for="hinhanh" class="form-label">Hình Ảnh</label>
			<input type="file" class="form-control" id="hinhanh" name="hinhanh" accept=".jpg,.jpeg,.png,.gif" required>
		</div>
		<div class="mb-3">
			<label for="tomtat" class="form-label">Chi Tiết Sản Phẩm</label>
			<textarea class="form-control" id="tomtat" name="tomtat" rows="2"></textarea>
		</div>
		<div class="mb-3">
			<label for="noidung" class="form-label">Mô tả sản phẩm</label>
			<textarea class="form-control" id="noidung" name="noidung" rows="4"></textarea>
		</div>
		<div class="row g-3">
			<div class="col-md-6">
				<label for="id_danhmucgoc" class="form-label">Danh mục gốc</label>
				<select class="form-select" id="id_danhmucgoc" name="id_danhmucgoc" required>
					<option value="">-- Chọn danh mục gốc --</option>
					<?php if ($result_root && mysqli_num_rows($result_root) > 0): ?>
						<?php while ($r = mysqli_fetch_assoc($result_root)): ?>
							<option value="<?php echo (int)$r['id_danhmucgoc']; ?>"><?php echo htmlspecialchars($r['tendanhmuc']); ?></option>
						<?php endwhile; ?>
					<?php endif; ?>
				</select>
			</div>
			<div class="col-md-6">
				<label for="id_danhmuc" class="form-label">Danh mục (chọn nhiều)</label>
				<select class="form-select" id="id_danhmuc" name="id_danhmuc[]" multiple size="6" required>
					<?php foreach ($childCategories as $c): ?>
						<option value="<?php echo (int)$c['id_danhmuc']; ?>" data-root="<?php echo (int)$c['iddanhmucgoc']; ?>">
							<?php echo htmlspecialchars($c['tendanhmuc']); ?>
						</option>
					<?php endforeach; ?>
				</select>
				<div class="form-text">Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều.</div>
			</div>
		</div>
		<div class="mb-3 mt-3">
			<label for="tinhtrang" class="form-label">Trạng Thái</label>
			<select class="form-select" id="tinhtrang" name="tinhtrang">
				<option value="1">Kích hoạt</option>
				<option value="0">Ẩn</option>
			</select>
		</div>
		<button type="submit" name="themSanPham" class="btn btn-primary">Thêm Sản Phẩm</button>
	</form>
</div>

<!-- Bootstrap JS and Popper.js -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>

<!-- Script tính giá bán và lọc danh mục -->
<script>
	document.addEventListener("DOMContentLoaded", function () {
		const giasanpham = document.getElementById("giasanpham");
		const khuyenmai = document.getElementById("khuyenmai");
		const giaban = document.getElementById("giaban");
		const rootSelect = document.getElementById("id_danhmucgoc");
		const childSelect = document.getElementById("id_danhmuc");

		function capNhatGiaBan() {
			const goc = parseFloat(giasanpham.value);
			const km = parseFloat(khuyenmai.value);
			if (!isNaN(goc) && !isNaN(km) && km >= 0 && km <= 100) {
				const ban = goc * (100 - km) / 100;
				giaban.value = Math.round(ban);
			} else {
				giaban.value = '';
			}
		}

		giasanpham.addEventListener("input", capNhatGiaBan);
		khuyenmai.addEventListener("input", capNhatGiaBan);

		function filterChildByRoot() {
			const rootId = rootSelect.value;
			[...childSelect.options].forEach(opt => {
				const match = !rootId || opt.getAttribute('data-root') === rootId;
				opt.hidden = !match;
				if (!match) opt.selected = false;
			});
		}

		rootSelect.addEventListener('change', filterChildByRoot);
		filterChildByRoot();
	});
</script>
