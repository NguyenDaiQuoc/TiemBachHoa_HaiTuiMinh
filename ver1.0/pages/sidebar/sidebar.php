<?php
$isHome = !isset($_GET['quanly']) || trim($_GET['quanly']) === '' || trim($_GET['quanly']) === 'danhmucsanpham';
?>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif;}
body{background:#f5f5f5;}

/* Sidebar */
.sidebar{
    background:whitesmoke;
    position:fixed;
    width:23%;
    height:100vh;
    overflow-y:auto;
    padding-bottom:20px;
    border:1px solid rgba(255,255,255,0.2);
    box-shadow:0 8px 32px rgba(0,0,0,0.25);
    transition:transform 0.4s ease;
    z-index:1000;
}

/* Scrollbar */
.sidebar::-webkit-scrollbar{width:8px;}
.sidebar::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.2);border-radius:4px;}

/* Toggle (mobile/tablet) */
.sidebar-toggle{
    align-items:center;
    padding:8px 10px;
    margin:5px;
    background:whitesmoke;
    border-radius:5px;
    cursor:pointer;
    transition:background 0.3s ease;
    position:relative;
    z-index:1100; /* trên overlay */
}
/* .sidebar-toggle:hover{background:whitesmoke;} */

/* Overlay mobile */
#sidebarOverlay{
    display:none;
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.5);
    z-index:900;
}
#sidebarOverlay.show{display:block;}

/* Menu list */
ul.list_sidebar{list-style:none;padding:10px 0;}
ul.list_sidebar li{margin:5px 0;}
ul.list_sidebar li a{
    display:flex;
    align-items:center;
    text-decoration:none;
    color:#000;
    padding:6px 10px;
    border-radius:4px;
    position:relative;
    overflow:hidden;
    transition:color 0.3s ease;
}

/* Hover effect */
/* ul.list_sidebar li a::before{
    content:"";
    position:absolute;
    top:0;left:0;width:100%;height:100%;
    background:crimson;
    opacity:0;
    transform:scaleY(0);
    transform-origin:top;
    transition:transform 0.4s ease,opacity 0.4s ease;
    z-index:-1;
} */
/* ul.list_sidebar li a:hover{
    /* color:#FFD700; vàng sáng thay vì trắng */
    /* font-weight:bold; */
/*} 
/* ul.list_sidebar li a:hover::before{
    opacity:1;
    transform:scaleY(1);
} */

.icon{width:16px;margin-right:8px;}

/* Dropdown */
.dropdown-toggle{
    cursor:pointer;
    padding:6px 10px;
    font-weight:bold;
    display:flex;
    justify-content:space-between;
    border-radius:4px;
    transition:background 0.3s ease;
    position:relative;
    overflow:hidden;
}
.dropdown-toggle::before{
    content:"";
    position:absolute;
    top:0;left:0;width:100%;height:100%;
    background:crimson;
    opacity:0;
    transform:scaleY(0);
    transform-origin:top;
    transition:transform 0.4s ease,opacity 0.4s ease;
    z-index:-1;
}
/* .dropdown-toggle:hover{
    /* color:#FFD700; */
    /*font-weight:bold;
}
.dropdown-toggle:hover::before{
    opacity:1;
    transform:scaleY(1);
} */
.dropdown-menu{
    max-height:0;
    overflow:hidden;
    list-style:none;
    padding-left:15px;
    transition:max-height 0.4s ease,opacity 0.4s ease;
    opacity:0;
}
.dropdown.open .dropdown-menu{max-height:500px;opacity:1;}

/* Responsive tablet/mobile */
@media(max-width:1024px){
    .sidebar{width:250px;transform:translateX(-100%);}
    .sidebar.show{transform:translateX(0);}
    .sidebar-toggle{display:flex;}
}

/* Desktop: sidebar luôn hiện */
@media(min-width:1025px){
    .sidebar{transform:translateX(0);}
}
</style>

<div id="sidebarOverlay" onclick="closeSidebar()"></div>

<!-- Toggle mobile/tablet -->
<div class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()">
    <span class="toggle-open" id="toggleOpen">
        <img src="../../images/menu.png" style="width:16px;vertical-align:middle;margin-right:4px;">
        <strong>DANH MỤC SẢN PHẨM</strong>
    </span>
    <span class="toggle-close" id="toggleClose" style="display:none;">✖ Đóng</span>
</div>

<div class="sidebar" id="sidebar">
  <div class="sidebar_relative" id="sidebarContent">
    <ul class="list_sidebar">
      <li><a href="#"><img src="../../images/sale.png" class="icon"><span>Khuyến mãi sốc</span></a></li>
      <li><a href="#"><img src="../../images/new_arrivals.png" class="icon"><span>Hàng mới về</span></a></li>

      <li class="dropdown">
        <div class="dropdown-toggle">Thời trang nam ▾</div>
        <ul class="dropdown-menu">
          <li><a href="index.php?quanly=danhmucsanpham&id=1">Áo</a></li>
          <li><a href="index.php?quanly=danhmucsanpham&id=2">Áo khoác</a></li>
        </ul>
      </li>
      <li class="dropdown">
        <div class="dropdown-toggle">Thời trang nữ ▾</div>
        <ul class="dropdown-menu">
          <li><a href="index.php?quanly=danhmucsanpham&id=9">Áo</a></li>
          <li><a href="index.php?quanly=danhmucsanpham&id=10">Áo khoác</a></li>
        </ul>
      </li>
      <li class="dropdown"> <div class="dropdown-toggle">Chăm sóc cá nhân▾</div> <ul class="dropdown-menu"> <li><a href="index.php?quanly=danhmucsanpham&id=17">Dầu gội</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=18">Sữa tắm</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=19">Dầu xả, kem ủ</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=20">Sữa dưỡng thể</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=21">Sữa rửa mặt</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=22">Tẩy trang</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=23">Toner,nước hoa hồng</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=24">Serum,tinh chất</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=25">Kem dưỡng da</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=26">Kem chống nắng</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=27">Kem đánh răng</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=28">Nước súc miệng</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=29">Bàn chải, tăm chỉ nha khoa</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=30">Nước rửa tay</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=31">Lăn xịt khử mùi</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=32">Xịt dưỡng, keo vuốt tóc</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=33">Khẩu trang</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=34">Giấy vệ sinh</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=35">Khăn giấy</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=36">Khăn ướt</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=37">Dung dịch vệ sinh</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=38">Dao cạo, bọt cạo râu</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=39">Tăm bông</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=40">Kem tẩy lông</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=41">Thuốc nhuộm tóc</a></li> </ul> </li> <li class="dropdown"> <div class="dropdown-toggle">Vệ sinh nhà cửa ▾</div> <ul class="dropdown-menu"> <li><a href="index.php?quanly=danhmucsanpham&id=42">Nước giặt</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=43">Nước rửa chén</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=44">Nước xả</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=45">Bột giặt</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=46">Nước lau sàn</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=47">Tẩy rửa nhà tắm</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=48">Bình xịt côn trùng</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=49">Lau kính, lau bếp</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=50">Nước tẩy</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=51">Xịt phòng, sáp thơm</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=52">Khăn giấy</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=53">Túi đựng rác</a></li> </ul> </li> <li class="dropdown"> <div class="dropdown-toggle">Đồ dùng gia đình▾</div> <ul class="dropdown-menu"> <li><a href="index.php?quanly=danhmucsanpham&id=54">Chảo</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=55">Nồi cơm</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=56">Nồi chiên không dầu</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=57">Thớt</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=58">Dao</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=59">Kéo</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=60">Máy xay sinh tố</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=61">Bàn ủi</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=62">Bình nước siêu tốc</a></li> </ul> </li> <li class="dropdown"> <div class="dropdown-toggle">Đồ công nghệ▾</div> <ul class="dropdown-menu"> <li><a href="index.php?quanly=danhmucsanpham&id=63">Sạc dự phòng</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=64">Bàn phím</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=65">Tai nghe</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=66">Chuột</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=67">Lót chuột</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=68">USB</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=69">Ổ cứng</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=70">Loa</a></li> <li><a href="index.php?quanly=danhmucsanpham&id=71">Dây sạc</a></li> </ul> </li> <!-- Thêm danh mục có con như trên --> <!-- ... -->
    </ul>
  </div>
</div>

<script>
// Dropdown toggle
document.querySelectorAll('.dropdown-toggle').forEach(el=>{
    el.addEventListener('click',function(){
        el.parentElement.classList.toggle('open');
    });
});

// Toggle sidebar on mobile/tablet
function toggleSidebar(){
    const sidebar=document.getElementById('sidebar');
    const overlay=document.getElementById('sidebarOverlay');
    const open=document.getElementById('toggleOpen');
    const close=document.getElementById('toggleClose');
    if(window.innerWidth<=1024){
        const isShown=sidebar.classList.toggle('show');
        overlay.classList.toggle('show',isShown);
        open.style.display=isShown?'none':'inline-flex';
        close.style.display=isShown?'inline-flex':'none';
    }
}

// Close sidebar
function closeSidebar(){
    const sidebar=document.getElementById('sidebar');
    const overlay=document.getElementById('sidebarOverlay');
    const open=document.getElementById('toggleOpen');
    const close=document.getElementById('toggleClose');
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
    open.style.display='inline-flex';
    close.style.display='none';
}
</script>
