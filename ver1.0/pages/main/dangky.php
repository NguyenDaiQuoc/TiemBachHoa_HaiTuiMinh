<div class="main_content">
    <?php
    session_start();
    include("admincp/config/config.php"); // Kết nối DB
    $registration_error = '';

    if (isset($_POST['dang_ky'])) {
        $tenkhachhang = trim($_POST['tenkhachhang']);
        $email = trim($_POST['email']);
        $dienthoai = trim($_POST['dienthoai']);
        $matkhau = $_POST['matkhau'];
        $diachi = trim($_POST['diachi']);

        $check_email_query = mysqli_query($mysqli, "SELECT * FROM tbl_dangky WHERE email = '$email'");
        if (mysqli_num_rows($check_email_query) > 0) {
            $registration_error = "Email đã tồn tại, vui lòng sử dụng email khác!";
        } elseif (!preg_match("/^[A-Za-zÀ-ỹ]+ [A-Za-zÀ-ỹ\s]+$/u", $tenkhachhang)) {
            $registration_error = "Họ và tên sai định dạng!";
        } elseif (strlen($matkhau) < 6) {
            $registration_error = "Độ dài mật khẩu quá ngắn!";
        } elseif (preg_match("/\s/", $matkhau)) {
            $registration_error = "Mật khẩu không được có dấu cách!";
        } elseif (!preg_match("/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/", $matkhau)) {
            $registration_error = "Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 chữ số!";
        } elseif (!preg_match("/^0[0-9]{9,10}$/", $dienthoai)) {
            $registration_error = "Số điện thoại sai định dạng!";
        } elseif (empty($diachi)) {
            $registration_error = "Địa chỉ không được để trống!";
        } else {
            $hashed_password = md5($matkhau);
            $trangthai = 1; // Trạng thái mặc định là kích hoạt
    
            $insert_user_query = "INSERT INTO tbl_dangky (tenkhachhang, email, diachi, matkhau, dienthoai, trangthai)
                              VALUES ('$tenkhachhang', '$email', '$diachi', '$hashed_password', '$dienthoai', '$trangthai')";

            if (mysqli_query($mysqli, $insert_user_query)) {
                echo "<div style='color: green; font-weight: bold;'>Đăng ký thành công! Bạn có thể đăng nhập ngay.</div>";
            } else {
                echo "<div style='color: red;'>Lỗi đăng ký: " . mysqli_error($mysqli) . "</div>";
            }
        }
    }
    ?>


    <div class="login_container">
        <p style="font-weight: bold; font-size : 20px; margin : 20px 0 20px 0;">Đăng ký</p>
        <form action="" method="POST" class="login_content" id="registerForm">
            <div class="register_input_box">
                <div style="width : 100%; display : flex; flex-direction : row">
                    <label for="tenkhachhang">Họ và tên :</label>
                    <input type="text" id="tenkhachhang" name="tenkhachhang">
                </div>
                <div id="tenkhachhang_error"
                    style="display : none; width : 100%; color :red; padding : 4px 8px; justify-content : start; ; font-size : 14px; align-items : center;">
                    Họ và tên không đúng định dạng</div>
            </div>
            <div class="register_input_box">
                <div style="width : 100%; display : flex; flex-direction : row">
                    <label for="email">Email :</label>
                    <input id="email" type="text" name="email">
                </div>
                <div id="email_error"
                    style="display : none; width : 100%; color :red; padding : 4px 8px; justify-content : start;; font-size : 14px; align-items : center;">
                    Email không đúng định dạng</div>
            </div>
            <div class="register_input_box">
                <div style="width : 100%; display : flex; flex-direction : row">
                    <label for="matkhau">Mật khẩu :</label>
                    <input type="password" id="matkhau" name="matkhau">
                </div>
                <div id="matkhau_error"
                    style="display : none; width : 100%; color :red; padding : 4px 8px; justify-content : start; ; font-size : 14px; align-items : center;">
                    Mật khẩu không được để trống</div>
            </div>
            <div class="register_input_box">
                <div style="width : 100%; display : flex; flex-direction : row">

                    <label for="dienthoai">Số điện thoại :</label>
                    <input type="text" id="dienthoai" name="dienthoai">
                </div>
                <div id="dienthoai_error"
                    style="display : none; width : 100%; color :red; padding : 4px 8px; justify-content : start; ; font-size : 14px; align-items : center;">
                    Số điện thoại không được để trống</div>
            </div>
            <div class="register_input_box">
                <div style="width : 100%; display : flex; flex-direction : row">
                    <label for="diachi">Địa chỉ :</label>
                    <input type="text" id="diachi" name="diachi">
                </div>
                <div id="diachi_error"
                    style="display : none; width : 100%; color :red; padding : 4px 8px; justify-content : start; ; font-size : 14px; align-items : center;">
                    Địa chỉ không được để trống</div>
            </div>
            <input class="login_form_btn" type="submit" name="dang_ky" value="Đăng ký">
            <p>Đã có tài khoản?<a class="registerlink" href="index.php?quanly=dangnhap">Đăng nhập</a></p>
            <?php if (!empty($registration_error)) { ?>
                <div id="registration_error"
                    style="display : flex; width : 100%; color :red; padding : 4px 8px; justify-content : center; align-items : center;">
                    <?php echo $registration_error; ?>
                </div>
            <?php } ?>
        </form>
    </div>
</div>

<script>
    document.getElementById('registerForm').addEventListener('submit', function (event) {
        var email = document.getElementById('email').value;
        var tenkhachhang = document.getElementById('tenkhachhang').value;
        var matkhau = document.getElementById('matkhau').value;
        var dienthoai = document.getElementById('dienthoai').value;
        var diachi = document.getElementById('diachi').value;
        var email_error = document.getElementById('email_error');
        var tenkhachhang_error = document.getElementById('tenkhachhang_error');
        var matkhau_error = document.getElementById('matkhau_error');
        var dienthoai_error = document.getElementById('dienthoai_error');
        var diachi_error = document.getElementById('diachi_error');

        var namePattern = /^[A-Za-zÀ-ỹ]+ [A-Za-zÀ-ỹ\s]+$/u;
        var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        var phonePattern = /^0[0-9]{9,10}$/;
        var passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
        var isValid = true;

        // Kiểm tra 'Họ và tên'
        if (tenkhachhang.trim() === '') {
            tenkhachhang_error.textContent = 'Họ và tên không được để trống';
            tenkhachhang_error.style.display = 'flex';
            isValid = false;
        } else if (!namePattern.test(tenkhachhang)) {
            tenkhachhang_error.textContent = 'Họ và tên sai định dạng, vui lòng nhập đúng họ và tên trong CCCD!';
            tenkhachhang_error.style.display = 'flex';
            isValid = false;
        } else {
            tenkhachhang_error.style.display = 'none';
        }

        // Kiểm tra email
        if (email.trim() === '') {
            email_error.textContent = 'Email không được để trống';
            email_error.style.display = 'flex';
            isValid = false;
        } else if (!emailPattern.test(email)) {
            email_error.textContent = 'Email không đúng định dạng';
            email_error.style.display = 'flex';
            isValid = false;
        } else {
            email_error.style.display = 'none';
        }

        // Kiểm tra mật khẩu
        if (matkhau.trim() === '') {
            matkhau_error.textContent = 'Mật khẩu không được để trống';
            matkhau_error.style.display = 'flex';
            isValid = false;
        } else if (matkhau.length < 6) {
            matkhau_error.textContent = 'Độ dài mật khẩu quá ngắn, vui lòng nhập ít nhất 6 ký tự';
            matkhau_error.style.display = 'flex';
            isValid = false;
        } else if (/\s/.test(matkhau)) {
            matkhau_error.textContent = 'Mật khẩu sai định dạng, không được có dấu cách';
            matkhau_error.style.display = 'flex';
            isValid = false;
        } else if (!passwordPattern.test(matkhau)) {
            matkhau_error.textContent = 'Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 chữ số';
            matkhau_error.style.display = 'flex';
            isValid = false;
        } else {
            matkhau_error.style.display = 'none';
        }

        // Kiểm tra số điện thoại
        if (dienthoai.trim() === '') {
            dienthoai_error.textContent = 'Số điện thoại không được để trống';
            dienthoai_error.style.display = 'flex';
            isValid = false;
        } else if (!phonePattern.test(dienthoai)) {
            dienthoai_error.textContent = 'Số điện thoại sai định dạng, vui lòng nhập số di động hợp lệ';
            dienthoai_error.style.display = 'flex';
            isValid = false;
        } else {
            dienthoai_error.style.display = 'none';
        }

        // Kiểm tra địa chỉ
        if (diachi.trim() === '') {
            diachi_error.textContent = 'Địa chỉ không được để trống';
            diachi_error.style.display = 'flex';
            isValid = false;
        } else {
            diachi_error.style.display = 'none';
        }

        if (!isValid) {
            event.preventDefault(); // Prevent form submission if validation fails
        }
    });
</script>