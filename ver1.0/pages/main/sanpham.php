<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
// Đảm bảo đường dẫn file config đúng với vị trí hiện tại
include("admincp/config/config.php"); 

// Bắt lỗi nếu không có ID
if (!isset($_GET['id']) || empty($_GET['id'])) {
    header('Location: index.php');
    exit();
}

// Lấy thông tin sản phẩm
$product_id = mysqli_real_escape_string($mysqli, $_GET['id']);
$sql_pro_info = "SELECT * FROM tbl_sanpham WHERE tbl_sanpham.idsanpham = '$product_id' LIMIT 1";
$pro_info = mysqli_query($mysqli, $sql_pro_info);
$info = mysqli_fetch_array($pro_info);

if (!$info) {
    header('Location: index.php');
    exit();
}

// Lưu lại ID danh mục và sản phẩm hiện tại
$id_danhmuc = $info['id_danhmuc'];
$id_sanpham_hientai = $info['idsanpham'];

// Truy vấn sản phẩm liên quan
$sql_lienquan = "SELECT * FROM tbl_sanpham 
                 WHERE id_danhmuc = '$id_danhmuc' AND idsanpham != '$id_sanpham_hientai' 
                 ORDER BY idsanpham DESC LIMIT 20";
$query_lienquan = mysqli_query($mysqli, $sql_lienquan);
?>

<div class="main_content">
    <form class="product_content" method="POST"
        action="pages/main/themgiohang.php">
        
        <input type="hidden" name="idsanpham" value="<?php echo $info['idsanpham'] ?>">
        
        <div class="product_wrapper">
            <div class="product_img">
                <div class="main-image">
                    <img id="main-img" class="img"
                        src="admincp/modules/quanLySanPham/uploads/<?php echo $info['hinhanh'] ?>" alt="<?php echo $info['tensanpham'] ?>">
                </div>
                
                <div class="thumbnail-wrapper">
                    <button type="button" class="img-nav left">&lt;</button>
                    <div class="thumbnail-container">
                        <img class="thumbnail active"
                            src="admincp/modules/quanLySanPham/uploads/<?php echo $info['hinhanh'] ?>" alt="Thumbnail 1">
                        <img class="thumbnail" src="admincp/modules/quanLySanPham/uploads/sale.png" alt="Thumbnail 2">
                    </div>
                    <button type="button" class="img-nav right">&gt;</button>
                </div>
            </div>

            <div class="product_detail">
                <p class="ten_sp"><?php echo $info['tensanpham'] ?></p>

                <div class="price_wrapper">
                    <p class="product_price">
                        <?php echo number_format($info['giaban']) . ' ₫' ?></p>
                    <p class="original_price"><?php echo number_format($info['giasanpham'], 0, ',', '.') . 'đ' ?></p>
                    <p class="discount"><?php echo number_format($info['khuyenmai']) ?>%</p>
                </div>

                <div class="soluong" style="margin-top:75px">
                    <label for="soluong_input" class="qty-label">Số lượng :</label>
                    <div style="display: flex; align-items: center;">
                        <button id="giam" class="soluong_btn" type="button" <?php if ($info['soluongconlai'] == 0)
                            echo "disabled"; ?>>-</button>
                        
                        <input class="soluong_input" id="soluong_input" name="soluong"
                            type="number" value="1" min="1" max="<?php echo $info['soluongconlai']; ?>"
                            <?php if ($info['soluongconlai'] == 0) echo "disabled"; ?>>
                            
                        <button id="tang" class="soluong_btn" type="button" <?php if ($info['soluongconlai'] == 0)
                            echo "disabled"; ?>>+</button>
                        <span style="margin-left: 10px; font-size: 14px;">
                            <?php echo $info['soluongconlai'] > 0 ? "Còn lại: <strong>" . $info['soluongconlai'] . "</strong> món" : "<span style='color: red; font-weight: bold;'>Hết hàng</span>"; ?>
                        </span>
                    </div>
                </div>

                <?php if (isset($_SESSION['idkhachhang']) && isset($_SESSION['dangky'])) { ?>
                    <div class="buy_btn_wrapper">
                        <input class="mua_btn" type="submit" name="themgiohang" value="Thêm vào giỏ hàng"
                            <?php if ($info['soluongconlai'] == 0) echo "disabled"; ?>>
                    </div>
                <?php } else { ?>
                    <div class="buy_btn_wrapper login-to-buy">
                        <a class="mua_btn" href="index.php?quanly=dangnhap">Đăng nhập để mua hàng</a>
                    </div>
                <?php } ?>
            </div>
        </div>

        <div class="product_description" style="margin-top: 50px;">
            <h2>Thông tin chi tiết sản phẩm</h2>
            <p><?php echo nl2br(str_replace(['\r\n', '\n'], "<br>", $info['tomtat'])) ?></p>

            <h2>Mô tả sản phẩm</h2>
            <p><?php echo nl2br(str_replace(['\r\n', '\n'], "<br>", $info['noidung'])) ?></p>
        </div>
    </form>

    <div class="related-products-wrapper">
        <h2>Sản phẩm liên quan</h2>
        <div class="carousel-container">
            <button class="carousel-nav left">&lt;</button>
            <div class="carousel-track">
                <?php while ($row = mysqli_fetch_array($query_lienquan)) { ?>
                    <div class="product-card">
                        <a href="index.php?quanly=sanpham&id=<?php echo $row['idsanpham']; ?>">
                            <img src="admincp/modules/quanLySanPham/uploads/<?php echo $row['hinhanh']; ?>" alt="<?php echo $row['tensanpham']; ?>" />
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

<style>
/* --- Layout và CSS Cơ bản --- */
.main_content { max-width: 1200px;padding: 20px; }
.product_wrapper { display: flex; gap: 40px; align-items: flex-start; }
.product_img { flex: 1; max-width: 500px; }
.main-image { border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); }
.main-image .img { width: 100%; height: auto; display: block; transition: transform 0.3s ease; }
.main-image:hover .img { transform: scale(1.02); }

/* Gallery */
.thumbnail-wrapper { display: flex; align-items: center; margin-top: 15px; position: relative; }
.thumbnail-container { display: flex; overflow: hidden; gap: 10px; flex-grow: 1; justify-content: center; }
.thumbnail {
    width: 80px; height: 80px; object-fit: cover; border-radius: 5px; cursor: pointer;
    opacity: 0.7; transition: opacity 0.2s, border 0.2s; border: 2px solid transparent;
}
.thumbnail:hover, .thumbnail.active { opacity: 1; border-color: #ff9900; }
.img-nav { background: none; border: none; font-size: 24px; cursor: pointer; color: #333; padding: 5px; transition: color 0.2s; }
.img-nav:hover { color: #ff6600; }

/* Chi tiết */
.product_detail { flex: 1; padding-top: 20px; }
.product_detail .ten_sp { font-size: 28px; font-weight: 700; color: #333; margin-bottom: 15px; }
.price_wrapper { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; padding: 10px 0; border-bottom: 1px solid #eee; }
.product_price { color: #ff6600; font-size: 32px !important; font-weight: bold; }
.original_price { color: #999; text-decoration: line-through; font-size: 18px; }
.discount { background: red; color: white; padding: 2px 8px; border-radius: 5px; font-weight: bold; font-size: 14px; }

/* Số lượng */
.soluong { display: flex; align-items: center; gap: 20px; margin-bottom: 25px; }
.qty-label { color : #55595C; font-size : 18px; margin-top: 10px; text-align: center; font-weight:bold; }
.soluong_btn {
    background-color: #f0f0f0; border: 1px solid #ddd; width: 35px; height: 35px; font-size: 20px;
    cursor: pointer; transition: background-color 0.2s, transform 0.1s; border-radius: 5px;
}
.soluong_btn:hover:not([disabled]) { background-color: #ddd; transform: scale(1.05); }
.soluong_btn:active:not([disabled]) { transform: scale(0.95); }
.soluong_btn[disabled] { opacity: 0.5; cursor: not-allowed; }
.soluong_input { width: 50px; height: 35px; border: 1px solid #ddd; text-align: center; font-size: 16px; margin: 0 5px; border-radius: 5px; -moz-appearance: textfield; }
.soluong_input::-webkit-inner-spin-button, .soluong_input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

/* Nút Mua */
.buy_btn_wrapper {
    margin-top: 25px; width: 100%; border-radius: 10px; height: 50px; display: flex; align-items: center;
    justify-content: center; overflow: hidden; box-shadow: 0 4px 8px rgba(255, 102, 0, 0.3);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.mua_btn {
    border: none; background-color: #ff6600; color: whitesmoke; font-size: 18px; text-transform: uppercase;
    cursor: pointer; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    text-decoration: none; transition: background-color 0.2s; font-weight: bold;
}
.buy_btn_wrapper:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(255, 102, 0, 0.4); }
.mua_btn:hover { background-color: #e65c00; }
.buy_btn_wrapper input[disabled] { background-color: #cccccc; cursor: not-allowed; box-shadow: none; transform: none; }
.login-to-buy a { background-color: #3b5998; }
.login-to-buy:hover { box-shadow: 0 4px 8px rgba(59, 89, 152, 0.5); }

/* Mô tả */
.product_description { margin-top: 50px !important; padding-top: 20px; border-top: 1px solid #eee; }
.product_description h2 { margin-bottom: 10px; color: #333; position: relative; padding-left: 15px; font-size: 20px; }
.product_description h2::before { content: "•"; position: absolute; left: 0; color: #ff6600; font-size: 24px; top: -5px; }

/* Sản phẩm liên quan (Carousel) */
.related-products-wrapper { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
.related-products-wrapper h2 { font-size: 20px; margin-bottom: 15px; }
.carousel-container { position: relative; overflow: hidden; }
.carousel-track { display: flex; gap: 20px; transition: transform 0.4s ease-in-out; padding-bottom: 20px; }
.product-card {
    flex: 0 0 calc(100% / 5 - 16px); text-align: center; border: 1px solid #eee; border-radius: 8px;
    padding: 10px; transition: box-shadow 0.3s, transform 0.3s;
}
.product-card:hover { box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1); transform: translateY(-5px); }
.product-card img { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; }
.product-card .name { margin: 10px 0 5px; font-weight: bold; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #333; }
.product-card .price { color: #ff6600; font-weight: bold; font-size: 16px; }
.carousel-nav {
    position: absolute; top: 50%; transform: translateY(-50%); font-size: 20px; background: rgba(255, 255, 255, 0.7);
    border: 1px solid #ccc; border-radius: 50%; width: 35px; height: 35px; line-height: 35px; text-align: center;
    padding: 0; cursor: pointer; z-index: 10; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); transition: background 0.2s, color 0.2s;
}
.carousel-nav:hover { background: #ff6600; color: white; border-color: #ff6600; }
.carousel-nav.left { left: 0; } .carousel-nav.right { right: 0; }


/* Responsive Adjustments */
@media (max-width: 1200px) { .product-card { flex: 0 0 calc(100% / 4 - 15px); } }
@media (max-width: 992px) { 
    .product_wrapper { flex-direction: column; }
    .product_img, .product_detail { max-width: 100%; width: 100%; }
    .product-card { flex: 0 0 calc(100% / 3 - 13.33px); } 
}
@media (max-width: 768px) {
    .product_detail .ten_sp { font-size: 24px; }
    .product_price { font-size: 28px !important; }
    .product-card { flex: 0 0 calc(100% / 2 - 10px); }
}
@media (max-width: 576px) {
    .product_wrapper { gap: 20px; }
    .price_wrapper { flex-wrap: wrap; justify-content: center; }
    .product_description { margin-top: 20px !important; }
    .product-card { flex: 0 0 100%; }
}
</style>

<script>
document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("soluong_input");
    const btnDecrease = document.getElementById("giam");
    const btnIncrease = document.getElementById("tang");
    const maxQuantity = parseInt(input?.max || 1);

    // Logic Tăng/Giảm Số lượng
    btnIncrease?.addEventListener("click", function () {
        let val = parseInt(input.value);
        if (val < maxQuantity) input.value = val + 1;
    });

    btnDecrease?.addEventListener("click", function () {
        let val = parseInt(input.value);
        if (val > 1) input.value = val - 1;
    });
    
    // Đảm bảo số lượng không vượt quá min/max khi gõ tay
    input?.addEventListener('change', function() {
        let val = parseInt(this.value);
        if (isNaN(val) || val < 1) this.value = 1;
        if (val > maxQuantity) this.value = maxQuantity;
    });


    // Logic Gallery Ảnh (Thumbnails)
    const thumbnails = document.querySelectorAll(".thumbnail");
    const mainImg = document.getElementById("main-img");
    const leftBtn = document.querySelector(".img-nav.left");
    const rightBtn = document.querySelector(".img-nav.right");
    let currentIndex = 0;
    const imageSources = Array.from(thumbnails).map(img => img.src);

    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener("click", () => {
            mainImg.src = thumb.src;
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            currentIndex = index;
        });
    });
    
    const updateGallery = () => {
        mainImg.src = imageSources[currentIndex];
        thumbnails.forEach(t => t.classList.remove('active'));
        thumbnails[currentIndex].classList.add('active');
    };

    leftBtn.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + imageSources.length) % imageSources.length;
        updateGallery();
    });

    rightBtn.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % imageSources.length;
        updateGallery();
    });


    // Logic Carousel (Sản phẩm liên quan)
    const track = document.querySelector(".carousel-track");
    const navLeft = document.querySelector(".carousel-nav.left");
    const navRight = document.querySelector(".carousel-nav.right");
    const cards = document.querySelectorAll(".product-card");
    const totalItems = cards.length;
    let currentIndexCarousel = 0;

    function calculateMetrics() {
        if (totalItems === 0) return { cardWidth: 0, visibleCount: 0, gap: 0 };
        const gap = 20; 
        const cardWidth = cards[0].offsetWidth + gap;
        const containerWidth = track.parentElement.offsetWidth;
        const visibleCount = Math.floor(containerWidth / (cards[0].offsetWidth + gap));
        return { cardWidth, visibleCount, gap };
    }

    function updateCarousel() {
        const { cardWidth, visibleCount } = calculateMetrics();
        if (totalItems <= visibleCount) {
             navLeft.style.display = 'none';
             navRight.style.display = 'none';
             return;
        } else {
             navLeft.style.display = 'block';
             navRight.style.display = 'block';
        }

        if (currentIndexCarousel > totalItems - visibleCount) {
            currentIndexCarousel = totalItems - visibleCount;
        }
        if (currentIndexCarousel < 0) {
            currentIndexCarousel = 0;
        }

        const scrollX = currentIndexCarousel * cardWidth;
        track.style.transform = `translateX(-${scrollX}px)`;
    }

    navRight.addEventListener("click", () => {
        const { visibleCount } = calculateMetrics();
        if (currentIndexCarousel < totalItems - visibleCount) {
            currentIndexCarousel++;
            updateCarousel();
        }
    });

    navLeft.addEventListener("click", () => {
        if (currentIndexCarousel > 0) {
            currentIndexCarousel--;
            updateCarousel();
        }
    });

    window.addEventListener('resize', () => {
        currentIndexCarousel = 0; 
        updateCarousel();
    });
    // Chạy lần đầu
    setTimeout(updateCarousel, 100); 
    window.addEventListener('load', updateCarousel); 
});
</script>
