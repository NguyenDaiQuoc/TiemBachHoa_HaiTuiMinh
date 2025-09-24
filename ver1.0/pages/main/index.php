<?php
$sql_sanpham = "SELECT * FROM tbl_danhmuc,tbl_sanpham WHERE tbl_sanpham.id_danhmuc = tbl_danhmuc.id_danhmuc AND tinhtrang = 1
    ORDER BY tbl_sanpham.idsanpham ASC LIMIT 25";
$query_sanpham = mysqli_query($mysqli, $sql_sanpham);

// Lấy số trang hiện tại từ URL, mặc định là 1
if (isset($_GET['page']) && $_GET['page'] > 0) {
    $page = $_GET['page'];
} else {
    $page = 1;
}

// Số sản phẩm mỗi trang
$limit = 25;
$start = ($page - 1) * $limit;

// Lấy danh sách sản phẩm theo trang
$sql_sanpham = "SELECT * FROM tbl_danhmuc, tbl_sanpham 
WHERE tbl_sanpham.id_danhmuc = tbl_danhmuc.id_danhmuc AND tinhtrang = 1 
ORDER BY tbl_sanpham.idsanpham ASC 
LIMIT $start, $limit";
$query_sanpham = mysqli_query($mysqli, $sql_sanpham);

// Đếm tổng số sản phẩm để phân trang
$sql_count = "SELECT COUNT(*) AS total FROM tbl_sanpham WHERE tinhtrang = 1";
$result_count = mysqli_query($mysqli, $sql_count);
$row_count = mysqli_fetch_assoc($result_count);
$total_records = $row_count['total'];
$total_pages = ceil($total_records / $limit);
?>

<div class="new_arrival">
    <h2>Hàng mới về</h2>
    <ul class="product_list">
        <?php while ($row_sanpham = mysqli_fetch_array($query_sanpham)) { ?>
            <li>
                <a href="index.php?quanly=sanpham&id=<?php echo $row_sanpham['idsanpham'] ?>">
                    <img src="admincp/modules/quanLySanPham/uploads/<?php echo $row_sanpham['hinhanh'] ?>"
                        alt="<?php echo $row_sanpham['tensanpham'] ?>">
                    <p class="product_name"><?php echo $row_sanpham['tensanpham'] ?></p>
                </a>
                <p class="product_price"><?php echo number_format($row_sanpham['giaban']) . ' ₫' ?></p>
                <div class="price_wrapper">
                    <p class="original_price"><?php echo number_format($row_sanpham['giasanpham']) . ' ₫' ?></p>
                    <p class="discount"><?php echo number_format($row_sanpham['khuyenmai']) ?>%</p>
                </div>
                <button class="buy_button">mua</button>
            </li>
        <?php } ?>
    </ul>

    <!-- PHÂN TRANG -->
    <div class="pagination_wrapper">
        <ul class="list_page">
            Trang:
            <?php for ($i = 1; $i <= $total_pages; $i++) { ?>
                <li>
                    <a href="index.php?trang=<?php echo $i; ?>" <?php if ($i == $page)
                           echo 'style="color:red;"'; ?>>
                        <?php echo $i; ?>
                    </a>
                </li>
            <?php } ?>
        </ul>
    </div>
</div>