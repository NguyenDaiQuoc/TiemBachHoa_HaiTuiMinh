<?php
include("config/config.php");
$code = $_GET['code'];
$sql_lietke_dh= "SELECT * FROM tbl_chitiet_giohang,tbl_sanpham WHERE tbl_chitiet_giohang.idsanpham = tbl_sanpham.idsanpham AND tbl_chitiet_giohang.magiohang='".$code."' ORDER BY tbl_chitiet_giohang.id_chitiet_giohang DESC ";
$lietke_dh= mysqli_query($mysqli,$sql_lietke_dh);
?>

<!-- Link Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">

<div class="container mt-5">
    <div class="card">
        <div class="card-header text-center bg-primary text-white">
            <h3>Xem Đơn Hàng</h3>
        </div>
        <div class="card-body">
            <table class="table table-striped table-hover text-center align-middle">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Mã Giỏ Hàng</th>
                        <th>Tên Sản Phẩm</th>
                        <th>Số Lượng</th>
                        <th>Đơn Giá</th>
                        <th>Thành Tiền</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $i = 0;
                    $tongtien = 0;
                    while ($row = mysqli_fetch_array($lietke_dh)) {
                        $i++;
                        $thanhtien = $row['soluong'] * $row['giaban'];
                        $tongtien += $thanhtien;
                    ?>
                        <tr>
                            <td> <?php echo $i ?></td>
                            <td> <?php echo $row['magiohang'] ?></td>
                            <td> <?php echo $row['tensanpham'] ?></td>
                            <td> <?php echo $row['soluong'] ?></td>
                            <td> <?php echo number_format($row['giaban'], 0, ',', '.') . ' VND' ?></td>
                            <td> <?php echo number_format($thanhtien, 0, ',', '.') . ' VND' ?></td>
                        </tr>
                    <?php
                    }
                    ?>
                </tbody>
                <tfoot>
                    <tr class="table-warning">
                        <td colspan="5" class="text-end"><strong>Tổng Tiền:</strong></td>
                        <td><strong><?php echo number_format($tongtien, 0, ',', '.') . ' VND' ?></strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="card-footer text-center">
            <a href="index.php?action=donHang&query=lietke" class="btn btn-secondary">Quay Lại</a>
            <a href="modules/quanLyDonHang/indonhang.php?code=<?php echo $code ?>" class="btn btn-primary">In Đơn Hàng</a>
        </div>
    </div>
</div>

<!-- Link Bootstrap JS and Popper -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
