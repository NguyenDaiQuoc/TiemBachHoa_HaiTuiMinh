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
    $avatarQuery = "SELECT hinhanh FROM tbl_thongtin_khachhang WHERE id_khachhang = '" . mysqli_real_escape_string($mysqli, $userId) . "' LIMIT 1";
    $avatarResult = mysqli_query($mysqli, $avatarQuery);

    if ($avatarResult && mysqli_num_rows($avatarResult) > 0) {
        $avatarRow = mysqli_fetch_assoc($avatarResult);
        $dbPath = trim((string)($avatarRow['hinhanh'] ?? ''));

        // Nếu DB có đường dẫn ảnh và KHÔNG phải default, dùng đúng đường dẫn lưu trong DB (images/...)
        if ($dbPath !== '' && $dbPath !== 'images/default_avatar.png') {
            $userAvatar = (strpos($dbPath, '../') === 0) ? $dbPath : "../" . $dbPath;
        }
    }
}
?>

<div class="header">
    <div class="header_background">
        <a href="index.php">
            <img class="logo" src="../images/logo.png" alt="Trang chủ">
        </a>

        <!-- Ô tìm kiếm -->
        <div class="search_wrapper">
            <form id="search_form" action="index.php" method="GET">
                <input type="hidden" name="quanly" value="timKiem">
                <input class="search_input" id="search_input" name="tuKhoa" type="text" placeholder="Bạn muốn tìm gì?">
                <a href="#" onclick="submitSearch()" title="Tìm kiếm" class="icon_button search_btn" aria-label="Tìm kiếm">
                    <i class="fa fa-search search_icon"></i>
                </a>
                <a href="index.php?quanly=giohang" class="icon_button cart_btn" aria-label="Giỏ hàng">
                    <i class="fa fa-shopping-cart cart_icon"></i>
                </a>
            </form>
        </div>

        <!-- Mạng xã hội + đăng nhập -->
        <div class="header_right">
            <div class="social_icons">
                <a target="_blank" href="https://www.facebook.com/profile.php?id=61576489061227"><i class="fab fa-facebook-f"></i></a>
                <a target="_blank" href="#"><i class="fab fa-tiktok"></i></a>
                <a target="_blank" href="#"><i class="fab fa-shopify"></i></a>
            </div>
            <div class="auth_buttons">
                <?php if (isset($_SESSION['idkhachhang']) && isset($_SESSION['dangky'])): ?>
                    <span style ="color:white;font-size:16px;margin:-10px;width:70px;"> Xin chào, </span> <?php echo '<p class="user_greeting"> ' . $_SESSION['dangky'] . '!</p>'; ?>
                    <div class="user_dropdown">
                        <div class="profile_icon" onclick="toggleUserDropdown()">
                            <img src="<?php echo $userAvatar; ?>" alt="Tài khoản" onerror="this.src='../images/default_avatar.png'">
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
                const url = "https://nhahaidua.byethost31.com/index.php?quanly=danhmucsanpham&id=" + matched.id_danhmuc;
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
document.addEventListener("DOMContentLoaded", function() {
    const dropdown = document.querySelector(".user_dropdown");
    const menu = document.getElementById("userDropdownMenu");
    
    if (dropdown && menu) {
        let hoverTimeout;
        
        // Hover vào dropdown
        dropdown.addEventListener("mouseenter", function() {
            clearTimeout(hoverTimeout);
            menu.classList.add("show");
        });
        
        // Rời khỏi dropdown
        dropdown.addEventListener("mouseleave", function() {
            hoverTimeout = setTimeout(function() {
                menu.classList.remove("show");
            }, 200); // Delay 200ms để tránh flicker
        });
        
        // Click vào profile icon
        const profileIcon = dropdown.querySelector(".profile_icon");
        if (profileIcon) {
            profileIcon.addEventListener("click", function(e) {
                e.stopPropagation();
                menu.classList.toggle("show");
            });
        }
        
        // Click outside để đóng dropdown
        document.addEventListener("click", function(event) {
            if (!dropdown.contains(event.target)) {
                menu.classList.remove("show");
            }
        });
    }
});
</script>

<style>
/* Header base layout */
.header_background {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    background: linear-gradient(135deg, #fbd786 0%, #f7797d 100%);
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: relative;
}

.logo { 
    height: 48px; 
    transition: transform 0.3s ease;
}
.logo:hover {
    transform: scale(1.05);
}

/* Search layout - Cải thiện bố cục */
.search_wrapper {
    height: 40px;
    flex: 1; 
    display: flex; 
    align-items: center; 
    min-width: 300px; 
    max-width: 600px;
    position: relative;
}

#search_form { 
    height: 40px;
    display: flex; 
    align-items: center; 
    width: 100%; 
    gap: 0; /* Loại bỏ gap để nút sát khung tìm kiếm */
    background: #fff;
    border-radius: 25px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
}

.search_input { 
    flex: 1; 
    height: 45px; 
    padding: 12px 20px; 
    border: none; 
    border-radius: 25px; 
    font-size: 15px; 
    min-width: 0;
    outline: none;
    background: transparent;
}

.search_input:focus {
    box-shadow: none;
}

/* Icon buttons - Đặt sát khung tìm kiếm */
.icon_button { 
    height: 45px; 
    min-width: 45px; 
    padding: 0 12px; 
    display: inline-flex; 
    align-items: center; 
    justify-content: center; 
    background: transparent; 
    border: none; 
    border-radius: 0; 
    color: #2e7d32; 
    text-decoration: none;
    transition: all 0.3s ease;
    position: relative;
}

.icon_button:hover { 
    background: #f8f9fa; 
    color: #1b5e20;
}

.icon_button:first-of-type {
    border-left: 1px solid #e0e0e0;
}

.search_icon, .cart_icon { 
    font-size: 18px; 
}

.header_right { 
    display: flex; 
    align-items: center; 
    gap: 15px; 
}

/* Social icons styling */
.social_icons {
    display: flex;
    gap: 8px;
}

.social_icons a {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    color: white;
    text-decoration: none;
    transition: all 0.3s ease;
}

.social_icons a:hover {
    background: rgba(255,255,255,0.3);
    transform: translateY(-2px);
}

/* Auth buttons */
.auth_buttons {
    display: flex;
    align-items: center;
    gap: 10px;
}

.auth_link {
    color: white;
    text-decoration: none;
    padding: 8px 16px;
    background: rgba(255,255,255,0.2);
    border-radius: 20px;
    transition: all 0.3s ease;
    font-weight: 500;
}

.auth_link:hover {
    background: rgba(255,255,255,0.3);
    color: white;
    text-decoration: none;
}

.user_greeting {
    color: white;
    margin: 0;
    font-weight: 500;
    font-size: 14px;
}

/* Tablet */
@media (max-width: 992px) {
    .header_background {
        gap: 15px;
        padding: 10px 16px;
    }
    
    .logo { height: 42px; }
    
    .search_wrapper { 
        min-width: 250px; 
        max-width: 500px; 
    }
    
    .search_input { 
        height: 40px; 
        padding: 10px 16px; 
        font-size: 14px; 
    }
    
    .icon_button { 
        height: 40px; 
        min-width: 40px; 
        padding: 0 10px; 
    }
    
    .social_icons a {
        width: 32px;
        height: 32px;
    }
}

/* Mobile (general) */
@media (max-width: 768px) {
    .header_background { 
        flex-wrap: wrap; 
        padding: 10px 12px; 
        gap: 10px; 
    }
    
    .logo { height: 38px; }
    
    .search_wrapper { 
        order: 3; 
        width: 100%; 
        min-width: unset;
        max-width: unset;
    }
    
    .header_right { 
        order: 2; 
        width: auto; 
        margin-left: auto; 
        gap: 10px;
    }
    
    .social_icons {
        gap: 6px;
    }
    
    .social_icons a {
        width: 30px;
        height: 30px;
        font-size: 14px;
    }
}
/* Avatar người dùng */
.profile_icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #eee;
    border: 2px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
}

.profile_icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.profile_icon:hover {
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

/* Container dropdown */
.user_dropdown {
    position: relative;
}

/* Menu dropdown ẩn */
.user_dropdown_menu {
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    position: absolute;
    top: 45px;
    right: 0;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
    min-width: 200px;
    z-index: 9999;
    pointer-events: none;
}

/* Khi mở dropdown */
.user_dropdown_menu.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
    z-index: 9999;
}

/* Hover effect cho user dropdown */
.user_dropdown:hover .user_dropdown_menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
}

/* Hover effect cho profile icon */
.profile_icon {
    transition: all 0.3s ease;
}

.user_dropdown:hover .profile_icon {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Link trong menu */
.user_dropdown_menu a {
    display: block;
    padding: 10px 15px;
    color: #333;
    text-decoration: none;
    font-size: 14px;
}

.user_dropdown_menu a:hover {
    background-color: #f9f9f9;
}

/* Mobile Small */
@media (max-width: 576px) {
    .header_background {
        padding: 8px 10px;
        gap: 8px;
    }

    .logo {
        height: 36px;
    }

    .search_wrapper {
        width: 100%;
        margin: 0;
    }

    #search_form {
        width: 100%;
        border-radius: 20px;
    }

    .search_input {
        height: 38px;
        padding: 8px 12px;
        font-size: 14px;
    }

    .icon_button {
        height: 38px;
        min-width: 38px;
        padding: 0 8px;
    }

    .search_icon,
    .cart_icon {
        font-size: 16px;
    }

    .header_right {
        flex-direction: row;
        align-items: center;
        width: auto;
        margin: 0;
        gap: 8px;
    }

    .social_icons {
        gap: 4px;
    }

    .social_icons a {
        width: 28px;
        height: 28px;
        font-size: 12px;
    }

    .auth_buttons {
        margin: 0;
    }

    .auth_link {
        padding: 6px 12px;
        font-size: 13px;
    }

    .user_greeting {
        font-size: 13px;
    }

    .profile_icon {
        width: 32px;
        height: 32px;
    }
}

/* Mobile: Cải thiện dropdown */
@media (max-width: 576px) {
    .user_dropdown_menu {
        right: 0;
        left: auto;
        top: 40px;
        min-width: 180px;
        transform: none;
    }
    
    .user_dropdown_menu a {
        padding: 8px 12px;
        font-size: 13px;
    }
}

/* Extra small mobile */
@media (max-width: 480px) {
    .header_background {
        padding: 6px 8px;
        gap: 6px;
    }
    
    .logo {
        height: 32px;
    }
    
    .search_input {
        height: 36px;
        padding: 6px 10px;
        font-size: 13px;
    }
    
    .icon_button {
        height: 36px;
        min-width: 36px;
        padding: 0 6px;
    }
    
    .search_icon,
    .cart_icon {
        font-size: 14px;
    }
    
    .social_icons a {
        width: 26px;
        height: 26px;
        font-size: 11px;
    }
    
    .auth_link {
        padding: 4px 8px;
        font-size: 12px;
    }
    
    .user_greeting {
        font-size: 12px;
    }
    
    .profile_icon {
        width: 28px;
        height: 28px;
    }
}


</style>