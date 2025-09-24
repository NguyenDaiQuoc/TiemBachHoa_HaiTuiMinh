<?php
	// Menu chính đã được đơn giản hóa, không cần query danh mục nữa
	// Danh mục sản phẩm được hiển thị ở sidebar
?>

<style>
/* MENU STYLES */
.menu {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    height: 50px;
    width: 100%;
    font-family: Arial, Helvetica, "sans-serif" !important;
    display: flex;
    align-items: center;
    justify-content: center;
}

.menu_responsive .menu_inner {
    width: 90%;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

.menu_responsive .list_menu {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
    padding: 0;
    margin: 0;
    list-style: none;
}

.menu_item { 
    position: relative; 
}

.menu_link {
	background: lightgoldenrodyellow;
    color: #333;
    font-weight: 600;
    display: inline-block;
    padding: 10px 16px;
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.3s ease;
	/* box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); */
}

 .menu_link:hover {
    color: #f7aa55;
    background: linear-gradient(135deg, #fbd786 0%, #f7797d 100%)
    transform: translateY(-1px);
}

/* Mobile - đơn giản hóa */
@media (max-width: 768px) {
    .menu_responsive .list_menu {
        gap: 15px;
        flex-wrap: wrap;
    }
    .menu_link {
        padding: 8px 12px;
        font-size: 14px;
    }
}
</style>

<div class="menu menu_responsive">
	<div class="menu_inner">
		<ul class="list_menu">
			<li class="menu_item"><a class="menu_link" href="index.php">Trang chủ</a></li>
			<li class="menu_item"><a class="menu_link" href="index.php?quanly=giohang">Giỏ hàng</a></li>
			<li class="menu_item"><a class="menu_link" href="index.php?quanly=tintuc">Tin tức</a></li>
			<li class="menu_item"><a class="menu_link" href="index.php?quanly=lienhe">Liên hệ</a></li>
		</ul>
	</div>
</div>