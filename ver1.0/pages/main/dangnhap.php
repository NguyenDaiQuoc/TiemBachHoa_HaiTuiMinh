<?php
$login_success = null;
if (isset($_POST['dangNhap'])) {
    $email = $_POST['email'];
    $matkhau = md5($_POST['matkhau']);

    // Truy vấn người dùng
    $sql = "SELECT * FROM tbl_dangky WHERE email = '$email' AND trangthai = 1 LIMIT 1";
    $row = mysqli_query($mysqli, $sql);
    $count = mysqli_num_rows($row);

    if ($count > 0) {
        $row_data = mysqli_fetch_array($row);

        $_SESSION['dangky'] = $row_data['tenkhachhang'];
        $_SESSION['email'] = $row_data['email'];
        $_SESSION['idkhachhang'] = $row_data['iddangky'];
        $login_success = true;
        // Dùng header để chuyển trang
        header("Location: index.php");
        exit;
    } else {
        $login_success = false;
    }
}
?>

<!-- Giao diện form đăng nhập -->
<div class="main_content">
    <div class="login_container">
        <p style="font-weight: bold; font-size: 20px; margin: 20px 0 10px 0;">Đăng nhập</p>
        <form method="POST" class="login_content" id="loginForm">
            <div class="input-box">
                <label>Email :</label>
                <span class="icon"><ion-icon name="mail"></ion-icon></span>
                <input type="text" id="email" name="email" required>
            </div>
            <div id="email_error" style="display: none; width: 100%; color: red; padding: 4px 8px; font-size: 14px; margin-top: 10px;">Email không đúng định dạng</div>

            <div class="input-box">
                <label>Mật khẩu :</label>
                <input type="password" id="matkhau" name="matkhau" required>
            </div>

            <button class="login_form_btn" type="submit" name="dangNhap">Đăng nhập</button>
            <p>Chưa có tài khoản? <a class="registerlink" href="index.php?quanly=dangky">Đăng ký</a></p>

            <?php if ($login_success === false) { ?>
                <div style="width: 100%; color: red; padding: 4px 8px; text-align: center;">Tài khoản hoặc mật khẩu không đúng !!!</div>
            <?php } ?>
        </form>
    </div>
</div>

<!-- JavaScript kiểm tra email -->
<script>
document.getElementById('loginForm').addEventListener('submit', function(event) {
    var email = document.getElementById('email').value;
    var email_error = document.getElementById('email_error');
    var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    if (!emailPattern.test(email)) {
        email_error.style.display = 'block';
        event.preventDefault();
    } else {
        email_error.style.display = 'none';
    }
});
</script>