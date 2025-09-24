<?php
// Hàm xóa dấu tiếng Việt
function xoa_dau($str)
{
    if (class_exists('Normalizer')) {
        $str = Normalizer::normalize($str, Normalizer::FORM_D);
    }
    $str = preg_replace('/\p{Mn}/u', '', $str); // xóa dấu tổ hợp
    $str = mb_strtolower($str, 'UTF-8');
    $str = str_replace('đ', 'd', $str);
    return $str;
}

$tuKhoa = isset($_GET['tuKhoa']) ? $_GET['tuKhoa'] : '';
$tuKhoa_khongdau = xoa_dau($tuKhoa);

$sql_pro = "SELECT * FROM tbl_sanpham WHERE tinhtrang = 1";
$query_pro = mysqli_query($mysqli, $sql_pro);

$ds_sanpham = [];

while ($row = mysqli_fetch_array($query_pro)) {
    $ten_khongdau = xoa_dau($row['tensanpham']);
    if (strpos($ten_khongdau, $tuKhoa_khongdau) !== false) {
        $ds_sanpham[] = $row;
    }
}
?>

<div class="search_result">
        <h3>Từ khóa tìm kiếm: <?php echo htmlspecialchars($tuKhoa); ?></h3>

    <ul class="product_list">
        <?php if (count($ds_sanpham) > 0): ?>
            <?php foreach ($ds_sanpham as $row): ?>
                <li>
                    <a href="index.php?quanly=sanpham&id=<?php echo $row['idsanpham'] ?>">
                        <img src="admincp/modules/quanLySanPham/uploads/<?php echo $row['hinhanh']; ?>"
                             alt="<?php echo $row['tensanpham'] ?>">
                        <p class="product_name"><?php echo $row['tensanpham'] ?></p>
                    </a>
                    <p class="product_price"><?php echo number_format($row['giaban']) . ' ₫' ?></p>
                    <div class="price_wrapper">
                        <p class="original_price"><?php echo number_format($row['giasanpham']) . ' ₫' ?></p>
                        <p class="discount"><?php echo number_format($row['khuyenmai']) ?>%</p>
                    </div>
                    <button class="buy_button">mua</button>
                </li>
            <?php endforeach; ?>
        <?php else: ?>
            <p style="padding: 20px;">Không tìm thấy sản phẩm nào phù hợp với từ khóa.</p>
        <?php endif; ?>
    </ul>
</div>

