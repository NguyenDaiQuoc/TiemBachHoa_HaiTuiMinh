<?php
// xác định có phải index không
$isHome = !isset($_GET['quanly']) || trim($_GET['quanly']) === '' || trim($_GET['quanly']) === 'danhmucsanpham';

?>

<style>
* {
  margin: 0; padding: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}
body {
  background: #f5f5f5;
}

#main{
    padding-top: 60px;
}
/* #menu{
    font-weight: 16px;
    font-weight: bold;
} */

/* Navbar */

nav.fixed-nav {
  position: fixed;
  width: 100%;
  z-index: 10;
}

nav {
  background: whitesmoke; /* gradient tươi sáng phù hợp header */
  color: black;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border:1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}


nav ul {
  list-style: none;
  display: flex;
  gap: 20px;
  transition: all 0.3s ease;
  margin: 0;
}

nav ul li {
  cursor: pointer;
  gap:18px;
  transition: all 0.3s ease;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  }

nav ul li:hover {
  background: rgba(255, 255, 255, 0.3); /* nền sáng hơn, không trùng màu gradient */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); /* shadow rộng hơn một chút */
  transform: translateY(-2px); /* hiệu ứng nhích lên nhẹ */
}

nav ul li a {
  color: inherit;
  text-decoration: none;

  display: block; /* giúp vùng click full vùng li */
}

/* --- TOGGLE BUTTON --- */
.toggle {
  font-size: 18px;
  cursor: pointer;
  color: #000;
  display: none;
}

/* Overlay */
#overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 5;
}

/* --- MOBILE --- */
@media (max-width: 768px) {
  nav ul {
    position: absolute;
    top: 65px;
    left: -100%;
    flex-direction: column;
    background: linear-gradient(135deg, #fbd786 0%, #f7797d 100%);
    width: 100%;
    text-align: center;
    padding: 20px 0;
    z-index: 20;
  }
  nav ul.active {
    left: 0;
  }

  /* Toggle chỉ hiện ở mobile */
  .toggle.mobile {
    display: block;
  }
}

/* --- DESKTOP TOGGLE --- */
@media (min-width: 769px) {
  /* Menu luôn hiển thị ở desktop */
  nav ul {
    position: static;
    flex-direction: row;
    background: none;
    width: auto;
    padding: 0;
  }

  /* Toggle desktop hiện */
  .toggle.desktop {
    display: none;
  }
  /* Ẩn toggle mobile */
  .toggle.mobile {
    display: none;
  }
}

/* Đổi màu menu khi ấn desktop toggle */
nav ul.colored li {
  color: #333;
}
</style>

<div id="overlay" onclick="closeMenu()"></div>

<nav class="<?php echo $isHome ? 'fixed-nav' : ''; ?>">
  <ul id="menu">
    <li><a href="index.php">Trang chủ</a></li>
    <li><a href="index.php?quanly=giohang">Giỏ hàng</a></li>
    <li><a href="index.php?quanly=tintuc">Tin tức</a></li>
    <li><a href="index.php?quanly=lienhe">Liên hệ</a></li>
  </ul>
  <!-- Toggle cho mobile -->
  <div class="toggle mobile" id="toggleMobile" onclick="toggleMenu()">☰ Menu</div>
  <!-- Toggle cho desktop -->
  <div class="toggle desktop" onclick="toggleDesktop()">⚙️</div>
</nav>

<script>
const menu = document.getElementById("menu");
const overlay = document.getElementById("overlay");
const toggleMobile = document.getElementById("toggleMobile");

// Toggle cho mobile (ẩn/hiện menu + overlay + đổi chữ)
function toggleMenu() {
  const isActive = menu.classList.toggle("active");
  overlay.style.display = isActive ? "block" : "none";
  toggleMobile.textContent = isActive ? "✖ Đóng" : "☰ Menu";
}

// Đóng menu khi nhấn overlay
function closeMenu() {
  menu.classList.remove("active");
  overlay.style.display = "none";
  toggleMobile.textContent = "☰ Menu";
}

// Toggle cho desktop (không ẩn menu, chỉ đổi màu)
function toggleDesktop() {
  menu.classList.toggle("colored");
}
</script>
