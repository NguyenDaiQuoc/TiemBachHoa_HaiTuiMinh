<?php
// Lấy id danh mục từ URL nếu có
if (isset($_GET['id']) && $_GET['id'] > 0) {
    $id_danhmuc = $_GET['id'];
    $where_danhmuc = "AND tbl_sanpham.id_danhmuc = $id_danhmuc";
} else {
    $id_danhmuc = 0; // dùng để giữ giá trị cho phân trang
    $where_danhmuc = "";
}

// Lấy số trang hiện tại
$page = (isset($_GET['page']) && $_GET['page'] > 0) ? $_GET['page'] : 1;
$limit = 25;
$start = ($page - 1) * $limit;

// Query sản phẩm có lọc danh mục (nếu có)
$sql_sanpham = "SELECT * FROM tbl_danhmuc, tbl_sanpham 
WHERE tbl_sanpham.id_danhmuc = tbl_danhmuc.id_danhmuc 
AND tinhtrang = 1 $where_danhmuc 
ORDER BY tbl_sanpham.idsanpham ASC 
LIMIT $start, $limit";
$query_sanpham = mysqli_query($mysqli, $sql_sanpham);

// Đếm tổng sản phẩm để phân trang
$sql_count = "SELECT COUNT(*) AS total FROM tbl_sanpham 
WHERE tinhtrang = 1 $where_danhmuc";
$result_count = mysqli_query($mysqli, $sql_count);
$row_count = mysqli_fetch_assoc($result_count);
$total_records = $row_count['total'];
$total_pages = ceil($total_records / $limit);
?>

<div class="new_arrival">
    <h2>Hàng mới về</h2>
    <ul class="product_list">
        <?php while ($row_sanpham = mysqli_fetch_array($query_sanpham)) { ?>
            <li style ="width: 185px">
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
                <form method="POST"
                    action="/pages/main/themgiohang.php?idsanpham=<?php echo $row_sanpham['idsanpham'] ?>&redirect=giohang">
                    <input type="hidden" name="idsanpham" value="<?php echo $row_sanpham['idsanpham']; ?>">
                    <input type="hidden" name="soluong" value="1">
                    <button type="submit" name="themgiohang" class="buy_button">Mua</button>
                </form>
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

<style>

/* Tablet (≤768px) */
@media (max-width: 768px) {
    .product_list li {
        width: 48%; /* 2 sản phẩm mỗi hàng */
    }
}

/* Mobile trung bình (≤576px) */
@media (max-width: 576px) {
    .product_list li {
        width: 48%; /* 1 sản phẩm mỗi hàng */
    }

    .product_name {
        font-size: 15px;
    }

    .product_price,
    .original_price,
    .discount {
        font-size: 14px;
    }

    .buy_button {
        width: 100%;
    }
}

/* Mobile nhỏ (≤480px) */
@media (max-width: 480px) {
    .product_name {
        font-size: 14px;
    }

    .product_price,
    .original_price,
    .discount {
        font-size: 13px;
    }
}
</style>