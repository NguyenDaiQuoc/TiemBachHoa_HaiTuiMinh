<?php
// Dữ liệu mẫu
$products = [
    ["name" => "Nến thơm thư giãn", "price" => "180.000đ", "oldPrice" => "200.000đ", "tag" => "Mới", "image" => "https://via.placeholder.com/300/FBF8F5?text=Nen"],
    ["name" => "Bánh quy yến mạch", "price" => "150.000đ", "oldPrice" => "180.000đ", "tag" => "Hot", "image" => "https://via.placeholder.com/300/FBF8F5?text=Banh"],
    ["name" => "Khăn quấn organic", "price" => "150.000đ", "oldPrice" => "", "tag" => "", "image" => "https://via.placeholder.com/300/FBF8F5?text=Khan"],
    ["name" => "Bộ bát đĩa gốm", "price" => "350.000đ", "oldPrice" => "", "tag" => "", "image" => "https://via.placeholder.com/300/FBF8F5?text=Bat"],
];

$categories = [
    ["name" => "Đồ dùng bếp", "image" => "https://via.placeholder.com/200/FBF8F5?text=Bep"],
    ["name" => "Nhu yếu phẩm", "image" => "https://via.placeholder.com/200/FBF8F5?text=Yeu"],
    ["name" => "Gia vị & Thực phẩm", "image" => "https://via.placeholder.com/200/FBF8F5?text=GiaVi"],
    ["name" => "Đồ uống & Trà", "image" => "https://via.placeholder.com/200/FBF8F5?text=Tra"],
];
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tiệm Bách Hóa Nhà Hai Đứa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Import Playfair Display từ Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        .font-playfair { font-family: 'Playfair Display', serif; }
    </style>
</head>

<body class="bg-[#FBF8F5] font-sans flex flex-col min-h-screen">

    <!-- Header -->
    <header class="w-full bg-[#FBF8F5] shadow-sm z-10">
        <div class="max-w-7xl mx-auto flex justify-between items-center py-4 px-8">
            <span class="text-xl font-bold text-[#3C3C3C] font-playfair">Tiệm Bách Hóa Nhà Hai Đứa</span>
            <nav class="flex space-x-6 text-sm font-medium text-gray-700">
                <a href="#">Trang chủ</a>
                <a href="#">Sản phẩm</a>
                <a href="#">Combo & Ưu đãi</a>
                <a href="#">Blog/Câu chuyện</a>
                <a href="#">Liên hệ</a>
            </nav>
            <div class="flex space-x-4 text-xl text-gray-600">
                <span>🔍</span>
                <span>👤</span>
                <span>❤️</span>
                <span>🛒</span>
            </div>
        </div>
    </header>

    <!-- Hero -->
    <section class="w-full h-96 rounded-2xl shadow-xl relative mt-6">
        <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://via.placeholder.com/1400x500/E5D3BD?text=Hero+Image+Góc+Bếp+Ấm+Cúng');"></div>
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="absolute inset-0 flex flex-col justify-center items-start p-16 text-white">
            <h1 class="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-md">Những điều nhỏ xinh làm nên tổ ấm</h1>
            <button class="px-8 py-3 rounded-full font-semibold bg-[#C75F4B] hover:bg-opacity-90 transition duration-200">Khám Phá Ngay</button>
        </div>
    </section>

    <!-- Danh Mục Nổi Bật -->
    <section class="max-w-7xl mx-auto px-8 mt-12">
        <h2 class="text-2xl font-bold mb-6 text-center text-[#3C3C3C]">Danh Mục Nổi Bật</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <?php foreach ($categories as $cat): ?>
                <div class="flex flex-col items-center w-full">
                    <div class="w-32 h-32 md:w-40 md:h-40 bg-[#E5D3BD] rounded-full shadow-md flex items-center justify-center overflow-hidden mb-2">
                        <img src="<?= $cat['image'] ?>" alt="<?= $cat['name'] ?>" class="object-cover w-full h-full">
                    </div>
                    <span class="text-sm md:text-base font-semibold text-[#3C3C3C]"><?= $cat['name'] ?></span>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Sản Phẩm Mới -->
        <h2 class="text-2xl font-bold mb-6 text-center text-[#3C3C3C]">Sản Phẩm Mới</h2>
        <div class="flex justify-center mb-12">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <?php foreach ($products as $p): ?>
                    <div class="flex flex-col rounded-xl shadow-md bg-[#FBF8F5] p-3 w-64">
                        <div class="relative mb-3">
                            <div class="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                <img src="<?= $p['image'] ?>" alt="<?= $p['name'] ?>" class="object-cover w-full h-full">
                            </div>
                            <?php if ($p['tag']): ?>
                                <span class="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full text-white bg-[#C75F4B]"><?= $p['tag'] ?></span>
                            <?php endif; ?>
                        </div>
                        <span class="text-base font-medium text-[#3C3C3C]"><?= $p['name'] ?></span>
                        <div class="flex items-end justify-between mt-1">
                            <span class="text-lg font-bold text-[#4A6D56]"><?= $p['price'] ?></span>
                            <?php if ($p['oldPrice']): ?>
                                <span class="text-sm line-through text-gray-500"><?= $p['oldPrice'] ?></span>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Câu Chuyện Nhà Hai Đứa -->
        <div class="flex rounded-2xl shadow-xl overflow-hidden mb-16 bg-[#E5D3BD]">
            <div class="w-3/5 h-80 flex items-center justify-center overflow-hidden">
                <img src="https://via.placeholder.com/600x400/E5D3BD?text=Chuyện+Nhà+Hai+Đứa" alt="Câu chuyện" class="object-cover w-full h-full">
            </div>
            <div class="w-2/5 p-8 flex flex-col justify-center">
                <h2 class="text-2xl font-bold mb-3 text-[#3C3C3C]">Câu chuyện nhà Hai Đứa</h2>
                <p class="text-sm text-[#3C3C3C] opacity-90">
                    Tụi mình tin những điều nhỏ bé, chân thật nhất tạo nên tổ ấm. Tiệm Bách Hóa là nơi tụi mình sẻ chia đồ dùng, gia vị, và những câu chuyện ấm cúng mỗi ngày.
                </p>
                <button class="mt-4 text-sm font-semibold underline text-[#4A6D56] hover:opacity-80">Đọc thêm</button>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="w-full bg-[#E5D3BD] py-10 mt-auto">
        <div class="max-w-7xl mx-auto px-8 grid grid-cols-4 gap-8 text-sm text-gray-700">
            <div>
                <span class="text-lg font-bold text-[#3C3C3C]">Tiệm Bách Hóa</span>
                <p class="mt-2">Địa chỉ: 55 Lý Tự Trọng</p>
                <p>Hotline: 090xxxxxx</p>
            </div>
            <div>
                <span class="font-semibold text-gray-800">Hỗ trợ khách hàng</span>
                <ul class="mt-2 space-y-1">
                    <li>Chính sách đổi trả</li>
                    <li>Hướng dẫn mua hàng</li>
                    <li>FAQ</li>
                </ul>
            </div>
            <div>
                <span class="font-semibold text-gray-800">Về Tiệm</span>
                <ul class="mt-2 space-y-1">
                    <li>Giới thiệu</li>
                    <li>Blog</li>
                </ul>
            </div>
            <div>
                <span class="font-semibold text-gray-800">Đăng ký nhận bản tin</span>
                <div class="mt-2 flex">
                    <input type="email" placeholder="Email của bạn" class="p-2 text-sm w-3/4 rounded-l-lg border border-r-0 border-gray-300" />
                    <button class="p-2 text-sm text-white rounded-r-lg bg-[#4A6D56]">Gửi</button>
                </div>
                <div class="flex space-x-3 mt-4 text-xl">
                    <span>📘</span>
                    <span>📷</span>
                    <span>📍</span>
                </div>
            </div>
        </div>
    </footer>

</body>
</html>
