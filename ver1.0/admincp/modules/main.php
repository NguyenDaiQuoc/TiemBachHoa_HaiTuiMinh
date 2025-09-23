<h3>main</h3>
<div class="main">
    <?php
    if (isset($_GET['action']) && $_GET['query']) {
        $tam = $_GET['action'];
        $query = $_GET['query'];
    } else {
        $tam = '';
        $query = '';
    }
    if ($tam == 'quanlydanhmucsanpham' && $query == 'them') {
        include("modules/quanLyDanhMucSanPham/them.php");
        include("modules/quanLyDanhMucSanPham/lietke.php");
    } elseif ($tam == 'quanLyDanhMucSanPham' && $query == 'sua') {
        include("modules/quanLyDanhMucSanPham/sua.php");
    } elseif ($tam == 'quanlysanpham' && $query == 'them') {
        include("modules/quanLySanPham/them.php");
        include("modules/quanLySanPham/lietke.php");
    } elseif ($tam == 'quanLySanPham' && $query == 'sua') {
        include("modules/quanLySanPham/sua.php");
    } elseif ($tam == 'quanlybaiviet') {
        include("modules/tintuc.php");
    } elseif ($tam == 'quanlydanhmucbaiviet') {
        include("modules/lienhe.php");
    }elseif ($tam == 'quanlydonhang' && $query == 'lietke') {
        include("modules/quanLyDonHang/lietke.php");
    } else {
        include("modules/dashboard.php");
    }
    ?>
</div>