<div id="main">
    <?php
    // Xác định có sidebar hay không
    $tam = isset($_GET['quanly']) ? $_GET['quanly'] : '';

    $hasSidebar = ($tam == '' || $tam == 'danhmucsanpham');

    if ($hasSidebar) {
        include("sidebar/sidebar.php");
    }
    ?>

    <div class="maincontent <?php echo $hasSidebar ? 'with-sidebar' : 'full-width'; ?>">
        <?php
        if($tam =='dangnhap'){
            include("main/dangnhap.php");
        } elseif($tam == 'dangky'){
            include("main/dangky.php");
        } elseif($tam == 'dangxuat'){
            include("main/dangxuat.php");
        } elseif($tam=='danhmucsanpham'){
            include("main/danhmuc.php");
        } elseif($tam=='giohang'){
            include("main/giohang.php");
        } elseif($tam=='tintuc'){
            include("main/tintuc.php");
        } elseif($tam=='lienhe'){
            include("main/lienhe.php");
        } elseif($tam=='sanpham'){
            include("main/sanpham.php");
        } elseif($tam=='timKiem'){
            include("main/timkiem.php");
        } else{
            include("main/index.php");
        }
        ?>
    </div>
</div>
