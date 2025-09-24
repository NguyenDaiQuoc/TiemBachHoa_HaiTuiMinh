<?php
session_start();
include("admincp/config/config.php"); // Nếu chưa có

$sql_pro_info = "SELECT * FROM tbl_sanpham WHERE tbl_sanpham.idsanpham = '$_GET[id]' LIMIT 1";
$pro_info = mysqli_query($mysqli, $sql_pro_info);
$info = mysqli_fetch_array($pro_info);

// Lưu lại ID danh mục và sản phẩm hiện tại
$id_danhmuc = $info['id_danhmuc'];
$id_sanpham_hientai = $info['idsanpham'];

// Truy vấn sản phẩm liên quan
$sql_lienquan = "SELECT * FROM tbl_sanpham WHERE id_danhmuc = '$id_danhmuc' AND idsanpham != '$id_sanpham_hientai' ORDER BY idsanpham DESC LIMIT 20";
$query_lienquan = mysqli_query($mysqli, $sql_lienquan);
?>

<div class="main_content">
    <form class="product_content" method="POST"
        action="/pages/main/themgiohang.php?idsanpham=<?php echo $info['idsanpham'] ?>&redirect=giohang">
        <div class="product_wrapper">
            <div class="product_img">
                <div class="main-image">
                    <img id="main-img" class="img"
                        src="admincp/modules/quanLySanPham/uploads/<?php echo $info['hinhanh'] ?>" alt="">
                </div>
                <div class="thumbnail-wrapper">
                    <button type="button" class="img-nav left">&lt;</button>
                    <div class="thumbnail-container">
                        <img class="thumbnail"
                            src="admincp/modules/quanLySanPham/uploads/<?php echo $info['hinhanh'] ?>" alt="">
                        <img class="thumbnail" src="admincp/modules/quanLySanPham/uploads/sale.png" alt="">
                    </div>
                    <button type="button" class="img-nav right">&gt;</button>
                </div>
            </div>

            <div class="product_detail">
                <p class="ten_sp"><?php echo $info['tensanpham'] ?></p>

                <div class="price_wrapper">
                    <p class="product_price" style="font-size:24px">
                        <?php echo number_format($info['giaban']) . ' ₫' ?></p>
                    <p class="original_price"><?php echo number_format($info['giasanpham'], 0, ',', ',') . 'đ' ?></p>
                    <p class="discount"><?php echo number_format($info['khuyenmai']) ?>%</p>
                </div>

                <div class="soluong" style="margin-top:75px">
                    <label for="soluong_input"
                        style="color : #55595C; font-size : 18px;margin-top: 10px;text-align: center;font-weight:bold">
                        Số lượng :</label>
                    <div style="display: flex; align-items: center;">
                        <button id="giam" class="soluong_btn" type="button" <?php if ($info['soluongconlai'] == 0)
                            echo "disabled"; ?>>-</button>
                        <input class="soluong_input" style="text-align:center" id="soluong_input" name="soluong"
                            type="number" value="1" min="1" max="<?php echo $info['soluongconlai']; ?>"
                            <?php if ($info['soluongconlai'] == 0) echo "disabled"; ?>>
                        <button id="tang" class="soluong_btn" type="button" <?php if ($info['soluongconlai'] == 0)
                            echo "disabled"; ?>>+</button>
                        <span style="margin-left: 10px;">
                            <?php echo $info['soluongconlai'] > 0 ? "Còn lại: <strong>" . $info['soluongconlai'] . "</strong> món" : "<span style='color: red;'>Hết hàng</span>"; ?>
                        </span>
                    </div>
                </div>

                <?php if (isset($_SESSION['idkhachhang']) && isset($_SESSION['dangky'])) { ?>
                    <div style="margin-top: 25px; width: 100%; border-radius: 10px; height: 40px; background-color: orange; display: flex; align-items: center; justify-content: center;">
                        <input class="mua_btn"
                            style="border: none; background: none; color: whitesmoke; font-size: 16px; text-transform: uppercase; cursor: pointer;"
                            type="submit" name="themgiohang" value="Thêm vào giỏ hàng">
                    </div>
                <?php } else { ?>
                    <div style="margin-top: 25px; width: 100%; border-radius: 10px; height: 40px; background-color: orange; display: flex; align-items: center; justify-content: center;">
                        <a style="color: whitesmoke; font-size: 16px; text-transform: uppercase;" class="mua_btn" href="index.php?quanly=dangnhap">Đăng nhập để mua hàng</a>
                    </div>
                <?php } ?>
            </div>
        </div>

        <div class="product_description" style="margin-top: 300px;">
            <h2 style="font-size: 20px; color: #333;">Thông tin chi tiết sản phẩm</h2>
            <p style="margin-bottom: 15px;">
                <?php echo nl2br(str_replace(['\r\n', '\n'], "<br>", $info['tomtat'])) ?>
            </p>

            <h2 style="font-size: 20px; color: #333;">Mô tả sản phẩm</h2>
            <p>
                <?php echo nl2br(str_replace(['\r\n', '\n'], "<br>", $info['noidung'])) ?>
            </p>
        </div>
    </form>

    <!-- Sản phẩm liên quan -->
    <div class="related-products-wrapper">
        <h2 style="font-size: 20px; color: #333; margin-bottom: 10px;">Sản phẩm liên quan</h2>
        <div class="carousel-container">
            <button class="carousel-nav left">&lt;</button>
            <div class="carousel-track">
                <?php while ($row = mysqli_fetch_array($query_lienquan)) { ?>
                    <div class="product-card" style ="width:120px">
                        <a href="index.php?quanly=sanpham&id=<?php echo $row['idsanpham']; ?>">
                            <img src="admincp/modules/quanLySanPham/uploads/<?php echo $row['hinhanh']; ?>" alt="" />
                            <p class="name"><?php echo $row['tensanpham']; ?></p>
                            <p class="price"><?php echo number_format($row['giaban'], 0, ',', '.') . '₫'; ?></p>
                        </a>
                    </div>
                <?php } ?>
            </div>
            <button class="carousel-nav right">&gt;</button>
        </div>
    </div>
</div>

<!-- CSS -->
<style>
.carousel-container {
    position: relative;
    overflow: hidden;
    width: 100%;
}
.carousel-track {
    display: flex;
    transition: transform 0.3s ease-in-out;
    gap: 20px;
}
.product-card {
    flex: 0 0 calc(100% / 6 - 20px);
    text-align: center;
}
.product-card img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: 8px;
}
.product-card .name {
    margin: 5px 0;
    font-weight: bold;
    font-size: 15px;
}
.product-card .price {
    color: red;
}
.carousel-nav {
    position: absolute;
    top: 40%;
    transform: translateY(-50%);
    font-size: 24px;
    background: #f0f0f0;
    border: none;
    padding: 10px;
    cursor: pointer;
    z-index: 2;
}
.carousel-nav.left {
    left: 0;
}
.carousel-nav.right {
    right: 0;
}

@media (max-width: 1200px) {
    .product-card {
        flex: 0 0 calc(100% / 4 - 20px);
    }
}
@media (max-width: 992px) {
    .product_wrapper {
        flex-direction: column;
        align-items: center;
    }

    .product_img, .product_detail {
        width: 100%;
    }

    .product-card {
        flex: 0 0 calc(100% / 3 - 20px);
    }
}

@media (max-width: 768px) {
    .product-card {
        flex: 0 0 calc(100% / 2 - 20px);
    }

    .carousel-nav {
        font-size: 20px;
        padding: 8px;
    }

    .product_detail .ten_sp {
        font-size: 20px;
    }

    .product_price {
        font-size: 20px;
    }

    .product_description {
        margin-top: 150px;
    }
}

@media (max-width: 576px) {
    .product-card {
        flex: 0 0 100%;
    }

    .carousel-nav {
        top: 30%;
    }

    .product_detail .ten_sp {
        font-size: 18px;
    }

    .price_wrapper {
        flex-direction: column;
        gap: 5px;
    }

    .product_price, .original_price, .discount {
        font-size: 16px;
    }
}
.product-card .name {
    margin: 5px 0;
    font-weight: bold;
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

</style>

<!-- JS -->
<script>
document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("soluong_input");
    const btnDecrease = document.getElementById("giam");
    const btnIncrease = document.getElementById("tang");
    const maxQuantity = parseInt(input?.max || 1);

    btnIncrease?.addEventListener("click", function () {
        let val = parseInt(input.value);
        if (val < maxQuantity) input.value = val + 1;
    });

    btnDecrease?.addEventListener("click", function () {
        let val = parseInt(input.value);
        if (val > 1) input.value = val - 1;
    });

    const thumbnails = document.querySelectorAll(".thumbnail");
    const mainImg = document.getElementById("main-img");
    const leftBtn = document.querySelector(".img-nav.left");
    const rightBtn = document.querySelector(".img-nav.right");

    let currentIndex = 0;
    const imageSources = Array.from(thumbnails).map(img => img.src);

    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener("mouseenter", () => {
            mainImg.src = thumb.src;
            currentIndex = index;
        });
    });

    leftBtn.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + imageSources.length) % imageSources.length;
        mainImg.src = imageSources[currentIndex];
    });

    rightBtn.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % imageSources.length;
        mainImg.src = imageSources[currentIndex];
    });

    // Carousel logic với vòng lặp vô hạn
    const track = document.querySelector(".carousel-track");
    const navLeft = document.querySelector(".carousel-nav.left");
    const navRight = document.querySelector(".carousel-nav.right");

    const cards = document.querySelectorAll(".product-card");
    let currentIndexCarousel = 0;
    const cardWidth = cards[0]?.offsetWidth + 20 || 200;
    const visibleCount = Math.floor(track.offsetWidth / cardWidth);
    const totalItems = cards.length;

    function updateCarousel() {
        const scrollX = currentIndexCarousel * cardWidth;
        track.style.transform = `translateX(-${scrollX}px)`;
    }

    navRight.addEventListener("click", () => {
        currentIndexCarousel++;
        if (currentIndexCarousel > totalItems - visibleCount) currentIndexCarousel = 0;
        updateCarousel();
    });

    navLeft.addEventListener("click", () => {
        currentIndexCarousel--;
        if (currentIndexCarousel < 0) currentIndexCarousel = totalItems - visibleCount;
        updateCarousel();
    });
});
</script>
