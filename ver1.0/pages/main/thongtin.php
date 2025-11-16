<?php
session_start();
include("admincp/config/config.php");

if (!isset($_SESSION['idkhachhang'])) {
    echo "<p>Vui lòng <a href='index.php?quanly=dangnhap'>đăng nhập</a> để xem thông tin cá nhân.</p>";
    exit();
}

$id = $_SESSION['idkhachhang'];

// Lấy thông tin từ bảng tbl_thongtin_khachhang
$sql_info = "SELECT * FROM tbl_thongtin_khachhang WHERE idkhachhang = $id LIMIT 1";
$info_result = mysqli_query($mysqli, $sql_info);
$info_row = mysqli_fetch_assoc($info_result);

// Lấy thông tin từ bảng tbl_dangky
$sql_dangky = "SELECT * FROM tbl_dangky WHERE iddangky = $id LIMIT 1";
$dangky_result = mysqli_query($mysqli, $sql_dangky);
$dangky_row = mysqli_fetch_assoc($dangky_result);

// Nếu các cột trong tbl_thongtin_khachhang rỗng thì dùng dữ liệu từ tbl_dangky
$hoten = $info_row['hoten'] ?: $dangky_row['tenkhachhang'];
$namsinh = $info_row['namsinh'];
$sodienthoai = $info_row['sodienthoai'] ?: $dangky_row['dienthoai'];
$diachi = $info_row['diachi'] ?: $dangky_row['diachi'];
$email = $info_row['email'] ?: $dangky_row['email'];
$hinhanh = $info_row['hinhanh'];

// Xử lý cập nhật
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['luuthongtin'])) {
    $hoten = mysqli_real_escape_string($mysqli, $_POST['hoten']);
    $namsinh = mysqli_real_escape_string($mysqli, $_POST['namsinh']);
    $sodienthoai = mysqli_real_escape_string($mysqli, $_POST['sodienthoai']);
    $diachi = mysqli_real_escape_string($mysqli, $_POST['diachi']);
    $email = mysqli_real_escape_string($mysqli, $_POST['email']);

    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === 0) {
        $target_dir = "images/";
        if (!is_dir($target_dir)) {
            @mkdir($target_dir, 0755, true);
        }
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $tmpPath = $_FILES['avatar']['tmp_name'];
        $originalName = $_FILES['avatar']['name'];
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed)) {
            echo "<script>alert('Định dạng ảnh không hợp lệ. Chỉ chấp nhận: jpg, jpeg, png, gif, webp');</script>";
        } else {
            // Đặt tên theo quy ước avatar_{iddangky}.{ext}
            $file_name = "avatar_" . $id . "." . $ext;
            $target_file = $target_dir . $file_name;

            // Xóa file cũ nếu khác default
            if (!empty($hinhanh) && $hinhanh !== 'images/default_avatar.png' && file_exists($hinhanh)) {
                @unlink($hinhanh);
            }

            if (move_uploaded_file($tmpPath, $target_file)) {
                // Lưu full path tương đối từ root web: images/...
                $hinhanh = $target_file;
            } else {
                echo "<script>alert('Tải ảnh thất bại. Vui lòng thử lại.');</script>";
            }
        }
    }

    // Cập nhật hoặc thêm mới
    $checkExist = mysqli_num_rows($info_result);
    if ($checkExist > 0) {
        $sql_update = "UPDATE tbl_thongtin_khachhang SET
            hoten = '$hoten',
            namsinh = '$namsinh',
            sodienthoai = '$sodienthoai',
            diachi = '$diachi',
            email = '$email',
            hinhanh = '$hinhanh'
            WHERE idkhachhang = $id";
    } else {
        $sql_update = "INSERT INTO tbl_thongtin_khachhang (idkhachhang, hoten, namsinh, sodienthoai, diachi, email, hinhanh, trangthai)
            VALUES ($id, '$hoten', '$namsinh', '$sodienthoai', '$diachi', '$email', '$hinhanh', 1)";
    }

    if (mysqli_query($mysqli, $sql_update)) {
        echo "<script>alert('Đã cập nhật thông tin thành công!'); window.location.href='index.php?quanly=thongtin';</script>";
        exit();
    } else {
        echo "<script>alert('Cập nhật thất bại.');</script>";
    }
}
?>

<div class="profile_container">
    <h2>Thông tin cá nhân</h2>

    <form method="POST" enctype="multipart/form-data" onsubmit="return confirmSave()">
        <!-- Ảnh đại diện -->
        <div class="avatar_section">
            <img id="avatarPreview" src="images/<?= $hinhanh ?: 'default_avatar.png' ?>"
                onerror="this.src='images/default_avatar.png'" width="120" height="120"
                style="border-radius: 50%; object-fit: cover;">

            <input type="file" name="avatar" accept="image/*" onchange="previewAvatar(event)">
        </div>

        <!-- Thông tin -->
        <div class="info_section">
            <label>Họ tên:</label>
            <input type="text" name="hoten" value="<?= htmlspecialchars($hoten) ?>">

            <label>Năm sinh:</label>
            <input type="date" name="namsinh" value="<?= $namsinh ?>">

            <label>Số điện thoại:</label>
            <input type="text" name="sodienthoai" value="<?= $sodienthoai ?>">

            <label>Địa chỉ:</label>
            <input type="text" name="diachi" value="<?= htmlspecialchars($diachi) ?>">

            <label>Email:</label>
            <input type="email" name="email" value="<?= $email ?>">
        </div>

        <!-- Nút hành động -->
        <div class="btn_group">
            <a href="index.php?quanly=doimatkhau" class="btn change_pass">Đổi mật khẩu</a>
            <button type="submit" name="luuthongtin" class="btn save_btn">Lưu</button>
            <a href="index.php" class="btn cancel_btn">Hủy bỏ</a>
        </div>
    </form>
</div>

<script>
    function confirmSave() {
        return confirm("Bạn có chắc muốn lưu các thay đổi?");
    }

    function previewAvatar(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('avatarPreview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
</script>

<style>
    .profile_container {
        max-width: 600px;
        margin: 30px auto;
        padding: 20px;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        font-family: Arial;
    }

    .profile_container h2 {
        text-align: center;
        margin-bottom: 20px;
    }

    .avatar_section {
        text-align: center;
        margin-bottom: 20px;
    }

    .avatar_section input[type="file"] {
        margin-top: 10px;
    }

    .info_section label {
        display: block;
        margin-top: 10px;
        font-weight: bold;
    }

    .info_section input {
        width: 100%;
        padding: 8px;
        margin-top: 5px;
        border: 1px solid #ccc;
        border-radius: 6px;
    }

    .btn_group {
        margin-top: 20px;
        text-align: center;
    }

    .btn {
        display: inline-block;
        margin: 5px;
        padding: 10px 18px;
        border: none;
        border-radius: 6px;
        background-color: #f0ad4e;
        color: white;
        text-decoration: none;
        font-weight: bold;
        cursor: pointer;
    }

    .btn:hover {
        background-color: #ec971f;
    }

    .change_pass {
        background-color: #5bc0de;
    }

    .change_pass:hover {
        background-color: #31b0d5;
    }

    .cancel_btn {
        background-color: #d9534f;
    }

    .cancel_btn:hover {
        background-color: #c9302c;
    }
</style>