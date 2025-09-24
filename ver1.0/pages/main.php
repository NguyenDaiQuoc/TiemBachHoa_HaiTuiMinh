<div id="main">
    <?php
    include("sidebar/sidebar.php");
    ?>

    <div class="maincontent">
        <?php
        if(isset($_GET['quanly'])){
            $tam = $_GET['quanly'];
        }else{
            $tam='';
        }if( $tam =='dangnhap'){
            include("main/dangnhap.php");
        }elseif($tam == 'dangky'){
            include("main/dangky.php");
        }elseif($tam == 'dangxuat'){
            include("main/dangxuat.php");
        }elseif($tam=='danhmucsanpham'){
            include("main/danhmuc.php");
        }elseif($tam=='giohang'){
            include("main/giohang.php");
        }elseif($tam=='tintuc'){
            include("main/tintuc.php");
        }elseif($tam=='lienhe'){
            include("main/lienhe.php");
        }elseif($tam=='sanpham'){
            include("main/sanpham.php");
        }elseif($tam=='timKiem'){
            include("main/timkiem.php");
        }else{
            include("main/index.php");
        }
        ?>
    </div>
</div>