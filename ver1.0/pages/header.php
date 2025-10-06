<?php
include("admincp/config/config.php");
// Lấy danh mục (id + tên)
$sql = "SELECT id_danhmuc, tendanhmuc FROM tbl_danhmuc";
$result = mysqli_query($mysqli, $sql);
$danhmucList = [];
while ($row = mysqli_fetch_assoc($result)) {
    $danhmucList[] = $row;
}

// Chọn avatar theo ưu tiên
$guestAvatar = "../images/guest_avt.png";          // Khi chưa đăng nhập
$defaultAvatar = "../images/default_avatar.png";   // Khi đã đăng nhập nhưng chưa có ảnh riêng
$userAvatar = $guestAvatar;

if (isset($_SESSION['idkhachhang']) && isset($_SESSION['dangky'])) {
    // Đã đăng nhập: mặc định dùng default
    $userAvatar = $defaultAvatar;

    $userId = $_SESSION['idkhachhang'];
    $avatarQuery = "SELECT hinhanh FROM tbl_thongtin_khachhang WHERE idkhachhang = '" . mysqli_real_escape_string($mysqli, $userId) . "' LIMIT 1";
    $avatarResult = mysqli_query($mysqli, $avatarQuery);

    if ($avatarResult && mysqli_num_rows($avatarResult) > 0) {
        $avatarRow = mysqli_fetch_assoc($avatarResult);
        $dbPath = trim((string) ($avatarRow['hinhanh'] ?? ''));

        // Nếu DB có đường dẫn ảnh và KHÔNG phải default, dùng đúng đường dẫn lưu trong DB (images/...)
        if ($dbPath !== '' && $dbPath !== 'images/default_avatar.png') {
            $userAvatar = (strpos($dbPath, '../') === 0) ? $dbPath : "../" . $dbPath;
        }
    }
}
// XÁC ĐỊNH: là trang chủ nếu không có tham số `quanly` (ví dụ: index.php)
$isHome = !isset($_GET['quanly']) || trim($_GET['quanly']) === '' || trim($_GET['quanly']) === 'danhmucsanpham';

?>

<!-- Nếu là trang chủ thì thêm class fixed-header lên .header -->
<div class="header <?php echo $isHome ? 'fixed-header' : ''; ?>">
    <div class="header_background">
        <a href="index.php">
            <img class="logo" src="../images/logo.png" alt="Trang chủ">
        </a>

        <!-- Ô tìm kiếm -->
        <div class="search_wrapper">
            <form id="search_form" action="index.php" method="GET">
                <input type="hidden" name="quanly" value="timKiem">
                <input class="search_input" id="search_input" name="tuKhoa" type="text" placeholder="Bạn muốn tìm gì?">
                <a href="#" onclick="submitSearch()" title="Tìm kiếm" class="icon_button search_btn"
                    aria-label="Tìm kiếm">
                    <i class="fa fa-search search_icon"></i>
                </a>
            </form>
        </div>
        <!-- Mạng xã hội + đăng nhập -->

        <div class="header_right">
            <div class="hotline">
                <i class="fa fa-phone"></i>
                <span>Hotline: 093145176</span>
            </div>
            <div class="social_icons">
                <a target="_blank" href="https://www.facebook.com/profile.php?id=61576489061227"><i
                        class="fab fa-facebook-f"></i></a>
                <a target="_blank" href="#"><i class="fab fa-tiktok"></i></a>
                <a target="_blank" href="#"><i class="fab fa-shopify"></i></a>
            </div>
            <div class="auth_buttons">
                <?php if (isset($_SESSION['idkhachhang']) && isset($_SESSION['dangky'])): ?>
                    <span style="color:white;font-size:16px;margin:-10px;width:70px;"> Xin chào, </span>
                    <?php echo '<p class="user_greeting"> ' . $_SESSION['dangky'] . '!</p>'; ?>
                    <div class="user_dropdown">
                        <div class="profile_icon" onclick="toggleUserDropdown()">
                            <img src="<?php echo $userAvatar; ?>" alt="Tài khoản"
                                onerror="this.src='../images/default_avatar.png'">
                            <!-- Debug: <?php echo $userAvatar; ?> -->
                        </div>
                        <div class="user_dropdown_menu" id="userDropdownMenu">
                            <a href="index.php?quanly=thongtin">👤 Thông tin tài khoản</a>
                            <a href="index.php?quanly=donmua">📦 Đơn mua</a>
                            <a href="index.php?quanly=magiamgia">🎟️ Mã giảm giá</a>
                            <a href="index.php?quanly=dangxuat" class="text-danger">🚪 Đăng xuất</a>
                        </div>
                    </div>
                <?php else: ?>
                    <a href="index.php?quanly=dangnhap" class="auth_link">Đăng nhập</a>
                <?php endif; ?>
            </div>
        </div>

        <div class="cart_wrapper">
            <a href="index.php?quanly=giohang" class="cart_icon icon_button cart_btn" aria-label="Giỏ hàng">
                <i class="fa fa-shopping-cart"></i>
                <span class="cart_count">0</span>
                <span class="cart_text">Giỏ hàng</span>
            </a>
            <div class="cart_dropdown" id="cartDropdown">
                <div class="cart_dropdown_content" id="cartDropdownContent">
                    <!-- Sản phẩm sẽ được render bằng JS -->
                </div>
                <button class="cart_viewall_btn" onclick="window.location.href='index.php?quanly=giohang'">Xem tất cả sản phẩm</button>
            </div>
        </div>
    </div>
</div>

<!-- JS xử lý tìm kiếm thông minh -->
<script>
    const danhmucArray = <?php echo json_encode($danhmucList); ?>;
    const input = document.getElementById("search_input");
    let index = 0;

    // Thay đổi placeholder mỗi 3.5 giây
    setInterval(() => {
        input.placeholder = danhmucArray[index]?.tendanhmuc || "Bạn muốn tìm gì?";
        index = (index + 1) % danhmucArray.length;
    }, 3500);

    function submitSearch() {
        const keyword = input.value.trim();

        if (keyword === "") {
            const currentPlaceholder = input.placeholder;

            // Tìm id_danhmuc từ placeholder
            const matched = danhmucArray.find(dm => dm.tendanhmuc === currentPlaceholder);
            if (matched) {
                // Chuyển đến trang danh mục sản phẩm
                const url = "index.php?quanly=danhmucsanpham&id=" + matched.id_danhmuc;
                window.location.href = url;
            } else {
                alert("Không tìm thấy sản phẩm tương ứng.");
            }
        } else {
            // Tìm sản phẩm
            document.getElementById("search_form").submit();
        }
    }


</script>

<script>
    function toggleUserDropdown() {
        const menu = document.getElementById("userDropdownMenu");
        menu.classList.toggle("show");
    }

    // Xử lý hover và click cho dropdown
    document.addEventListener("DOMContentLoaded", function () {
        const dropdown = document.querySelector(".user_dropdown");
        const menu = document.getElementById("userDropdownMenu");

        if (dropdown && menu) {
            let hoverTimeout;

            // Hover vào dropdown
            dropdown.addEventListener("mouseenter", function () {
                clearTimeout(hoverTimeout);
                menu.classList.add("show");
            });

            // Rời khỏi dropdown
            dropdown.addEventListener("mouseleave", function () {
                hoverTimeout = setTimeout(function () {
                    menu.classList.remove("show");
                }, 200); // Delay 200ms để tránh flicker
            });

            // Click vào profile icon
            const profileIcon = dropdown.querySelector(".profile_icon");
            if (profileIcon) {
                profileIcon.addEventListener("click", function (e) {
                    e.stopPropagation();
                    menu.classList.toggle("show");
                });
            }

            // Click outside để đóng dropdown
            document.addEventListener("click", function (event) {
                if (!dropdown.contains(event.target)) {
                    menu.classList.remove("show");
                }
            });
        }
    });
</script>

<script>
    // Demo dữ liệu giỏ hàng (thay bằng dữ liệu thực tế từ PHP nếu có)
    const cartProducts = [
        // {
        //     name: "Sản phẩm 1",
        //     price: "120.000đ",
        //     img: "../images/demo1.jpg"
        // },
        // ... tối đa 4 sản phẩm
    ];

    // Render sản phẩm vào dropdown
    function renderCartDropdown() {
        const container = document.getElementById('cartDropdownContent');
        container.innerHTML = '';
        if (cartProducts.length === 0) {
            container.innerHTML = '<div class="cart_dropdown_empty">Không có sản phẩm</div>';
        } else {
            cartProducts.slice(0, 4).forEach(item => {
                container.innerHTML += `
                    <div class="cart_dropdown_item">
                        <img src="${item.img}" alt="${item.name}" class="cart_dropdown_item_img">
                        <div class="cart_dropdown_item_info">
                            <div class="cart_dropdown_item_name">${item.name}</div>
                            <div class="cart_dropdown_item_price">${item.price}</div>
                        </div>
                    </div>
                `;
            });
        }
    }

    // Hiện/ẩn dropdown khi hover hoặc click
    document.addEventListener('DOMContentLoaded', function () {
        const cartWrapper = document.querySelector('.cart_wrapper');
        const cartIcon = cartWrapper.querySelector('.cart_icon');

        renderCartDropdown();

        let hoverTimeout;
        cartWrapper.addEventListener('mouseenter', function () {
            clearTimeout(hoverTimeout);
            cartWrapper.classList.add('show-dropdown');
        });
        cartWrapper.addEventListener('mouseleave', function () {
            hoverTimeout = setTimeout(() => {
                cartWrapper.classList.remove('show-dropdown');
            }, 200);
        });
        cartIcon.addEventListener('click', function (e) {
            e.preventDefault();
            cartWrapper.classList.toggle('show-dropdown');
        });
    });
</script>