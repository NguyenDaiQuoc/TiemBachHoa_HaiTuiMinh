<?php
$registration_error = "";
$registration_success = "";

if (isset($_POST['doiMatKhau'])) {
    $id = $_SESSION['idkhachhang'];
    $mat_khau_cu = md5($_POST['mat_khau_cu']);
    $mat_khau_moi = md5($_POST['mat_khau_moi']);
    
    // Use prepared statement for security
    $stmt = $mysqli->prepare("SELECT * FROM tbl_dangky WHERE iddangky = ? AND matkhau = ? LIMIT 1");
    $stmt->bind_param("is", $id, $mat_khau_cu);
    $stmt->execute();
    $result = $stmt->get_result();
    $count = $result->num_rows;
    
    if ($count < 1) {
        $registration_error = "Mật khẩu cũ không đúng!";
    } else {
        // Update password with prepared statement
        $update_stmt = $mysqli->prepare("UPDATE tbl_dangky SET matkhau = ? WHERE iddangky = ?");
        $update_stmt->bind_param("si", $mat_khau_moi, $id);
        
        if ($update_stmt->execute()) {
            $registration_success = "Đổi mật khẩu thành công!";
            // Redirect after 2 seconds
            echo "<script>setTimeout(function(){ window.location.href='index.php?quanly=doimatkhau&changepassword=1'; }, 2000);</script>";
        } else {
            $registration_error = "Có lỗi xảy ra khi cập nhật mật khẩu!";
        }
        $update_stmt->close();
    }
    $stmt->close();
}
?>

<div class="main_content">
    <div class="login_container">
        <p style="font-weight: bold; font-size: 20px; margin: 20px 0;">Đổi mật khẩu</p>
        <form action="" method="POST" class="login_content" id="registerForm">
            <!-- Mật khẩu cũ -->
            <div class="register_input_box">
                <div style="width: 100%; display: flex; flex-direction: row; align-items: center;">
                    <label for="mat_khau_cu">Mật khẩu cũ:</label>
                    <input type="password" id="mat_khau_cu" name="mat_khau_cu" onblur="validateOldPassword()">
                    <button type="button" onclick="togglePassword('mat_khau_cu')" style="margin-left:5px;">👁</button>
                    <span id="old_password_icon" style="margin-left: 10px; font-size: 18px;"></span>
                </div>
                <div id="mat_khau_cu_error"
                    style="display: none; width: 100%; color: red; padding: 4px 8px; font-size: 14px;">Mật khẩu không
                    được để trống</div>
                <div id="old_password_validation"
                    style="display: none; width: 100%; color: red; padding: 4px 8px; font-size: 14px;"></div>
            </div>

            <!-- Mật khẩu mới -->
            <div class="register_input_box">
                <div style="width: 100%; display: flex; flex-direction: row; align-items: center;">
                    <label for="mat_khau_moi">Mật khẩu mới:</label>
                    <input type="password" id="mat_khau_moi" name="mat_khau_moi" onkeyup="validateNewPassword()">
                    <button type="button" onclick="togglePassword('mat_khau_moi')" style="margin-left:5px;">👁</button>
                    <span id="new_password_icon" style="margin-left: 10px; font-size: 18px;"></span>
                </div>
                <div id="mat_khau_error"
                    style="display: none; width: 100%; color: red; padding: 4px 8px; font-size: 14px;">Mật khẩu không
                    được để trống</div>
                <div id="new_password_validation"
                    style="display: none; width: 100%; color: red; padding: 4px 8px; font-size: 14px;"></div>
            </div>

            <!-- Xác nhận mật khẩu -->
            <div class="register_input_box">
                <div style="width: 100%; display: flex; flex-direction: row; align-items: center;">
                    <label for="mat_khau_xacnhan">Xác nhận mật khẩu:</label>
                    <input type="password" id="mat_khau_xacnhan" name="mat_khau_xacnhan" onkeyup="validateConfirmPassword()">
                    <button type="button" onclick="togglePassword('mat_khau_xacnhan')"
                        style="margin-left:5px;">👁</button>
                    <span id="confirm_password_icon" style="margin-left: 10px; font-size: 18px;"></span>
                </div>
                <div id="mat_khau_xacnhan_error"
                    style="display: none; width: 100%; color: red; padding: 4px 8px; font-size: 14px;">Xác nhận mật khẩu
                    không được để trống</div>
                <div id="confirm_password_validation"
                    style="display: none; width: 100%; color: red; padding: 4px 8px; font-size: 14px;"></div>
            </div>

            <input class="login_form_btn" style="margin-bottom: 20px;" type="submit" name="doiMatKhau"
                value="Đổi mật khẩu">
            
            <!-- Debug buttons for testing AJAX -->
            <div style="margin-bottom: 10px;">
                <button type="button" onclick="testAjax()" style="margin-right: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px;">
                    Test AJAX Connection
                </button>
                <button type="button" onclick="testDebugAjax()" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px;">
                    Test Debug AJAX
                </button>
            </div>

            <?php if (!empty($registration_error)) { ?>
                <div id="registration_error"
                    style="display: flex; width: 100%; color: red; padding: 4px 8px; justify-content: center; align-items: center; margin-top: 10px;">
                    <?= $registration_error; ?>
                </div>
            <?php } ?>
            
            <?php if (!empty($registration_success)) { ?>
                <div id="registration_success"
                    style="display: flex; width: 100%; color: green; padding: 4px 8px; justify-content: center; align-items: center; margin-top: 10px;">
                    <?= $registration_success; ?>
                </div>
            <?php } ?>
            
            <?php if (isset($_GET['changepassword']) && $_GET['changepassword'] == '1') { ?>
                <div id="password_changed_success"
                    style="display: flex; width: 100%; color: green; padding: 4px 8px; justify-content: center; align-items: center; margin-top: 10px;">
                    Mật khẩu đã được thay đổi thành công!
                </div>
            <?php } ?>
        </form>
    </div>
</div>

<script>
    // Ẩn / hiện mật khẩu
    function togglePassword(id) {
        const input = document.getElementById(id);
        input.type = input.type === 'password' ? 'text' : 'password';
    }

    // Test AJAX connection
    function testAjax() {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'pages/main/test_ajax.php', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                alert('AJAX Test: ' + response.message);
            } else if (xhr.readyState === 4) {
                alert('AJAX Test Failed: Status ' + xhr.status + ' - Check console for details');
                console.error('AJAX Error:', xhr.status, xhr.statusText);
            }
        };
        xhr.onerror = function() {
            alert('AJAX Network Error - Check console for details');
            console.error('AJAX Network Error');
        };
        xhr.send();
    }

    // Test debug AJAX connection
    function testDebugAjax() {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'pages/main/debug_ajax.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                console.log('Debug AJAX Response:', response);
                alert('Debug AJAX: ' + response.message + '\nStatus: ' + response.status);
            } else if (xhr.readyState === 4) {
                alert('Debug AJAX Failed: Status ' + xhr.status);
                console.error('Debug AJAX Error:', xhr.status, xhr.statusText);
            }
        };
        xhr.onerror = function() {
            alert('Debug AJAX Network Error');
            console.error('Debug AJAX Network Error');
        };
        xhr.send('test=1');
    }

    // Validate old password against database
    function validateOldPassword() {
        const oldPassword = document.getElementById('mat_khau_cu').value;
        const icon = document.getElementById('old_password_icon');
        const validation = document.getElementById('old_password_validation');
        
        if (oldPassword.trim() === '') {
            icon.innerHTML = '';
            validation.style.display = 'none';
            return;
        }

        // Basic client-side validation first
        if (oldPassword.length < 6) {
            icon.innerHTML = '❌';
            validation.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
            validation.style.display = 'block';
            return;
        }

        // Show loading icon
        icon.innerHTML = '⏳';
        validation.style.display = 'none';

        // AJAX request to validate old password
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'pages/main/validate_old_password.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        // Set timeout to 3 seconds (reduced from 5)
        xhr.timeout = 3000;
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                console.log('AJAX Response Status:', xhr.status);
                console.log('AJAX Response Text:', xhr.responseText);
                
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        console.log('Parsed Response:', response);
                        
                        if (response.valid) {
                            icon.innerHTML = '✅';
                            validation.style.display = 'none';
                        } else {
                            icon.innerHTML = '❌';
                            validation.textContent = 'Mật khẩu đã nhập không khớp!';
                            validation.style.display = 'block';
                        }
                    } catch (e) {
                        console.error('JSON Parse Error:', e);
                        icon.innerHTML = '❌';
                        validation.textContent = 'Lỗi xác thực mật khẩu!';
                        validation.style.display = 'block';
                    }
                } else {
                    icon.innerHTML = '❌';
                    validation.textContent = 'Lỗi kết nối! (Status: ' + xhr.status + ')';
                    validation.style.display = 'block';
                }
            }
        };
        
        xhr.onerror = function() {
            console.error('AJAX Network Error');
            icon.innerHTML = '❌';
            validation.textContent = 'Lỗi kết nối mạng!';
            validation.style.display = 'block';
        };
        
        xhr.ontimeout = function() {
            console.error('AJAX Timeout');
            icon.innerHTML = '❌';
            validation.textContent = 'Hết thời gian chờ!';
            validation.style.display = 'block';
        };
        
        xhr.send('old_password=' + encodeURIComponent(oldPassword));
    }

    // Validate new password requirements
    function validateNewPassword() {
        const newPassword = document.getElementById('mat_khau_moi').value;
        const icon = document.getElementById('new_password_icon');
        const validation = document.getElementById('new_password_validation');
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

        if (newPassword.trim() === '') {
            icon.innerHTML = '';
            validation.style.display = 'none';
            return;
        }

        if (newPassword.length < 6) {
            icon.innerHTML = '❌';
            validation.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
            validation.style.display = 'block';
        } else if (/\s/.test(newPassword)) {
            icon.innerHTML = '❌';
            validation.textContent = 'Mật khẩu không được có dấu cách';
            validation.style.display = 'block';
        } else if (!passwordPattern.test(newPassword)) {
            icon.innerHTML = '❌';
            validation.textContent = 'Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 chữ số';
            validation.style.display = 'block';
        } else {
            icon.innerHTML = '✅';
            validation.style.display = 'none';
        }

        // Also validate confirm password if it has value
        const confirmPassword = document.getElementById('mat_khau_xacnhan').value;
        if (confirmPassword.trim() !== '') {
            validateConfirmPassword();
        }
    }

    // Validate confirm password
    function validateConfirmPassword() {
        const newPassword = document.getElementById('mat_khau_moi').value;
        const confirmPassword = document.getElementById('mat_khau_xacnhan').value;
        const icon = document.getElementById('confirm_password_icon');
        const validation = document.getElementById('confirm_password_validation');

        if (confirmPassword.trim() === '') {
            icon.innerHTML = '';
            validation.style.display = 'none';
            return;
        }

        if (confirmPassword === newPassword) {
            icon.innerHTML = '✅';
            validation.style.display = 'none';
        } else {
            icon.innerHTML = '❌';
            validation.textContent = 'Mật khẩu xác nhận không khớp';
            validation.style.display = 'block';
        }
    }

    document.getElementById('registerForm').addEventListener('submit', function (event) {
        var mat_khau = document.getElementById('mat_khau_moi').value;
        var mat_khau_error = document.getElementById('mat_khau_error');

        var mat_khau_cu = document.getElementById('mat_khau_cu').value;
        var mat_khau_cu_error = document.getElementById('mat_khau_cu_error');

        var mat_khau_xacnhan = document.getElementById('mat_khau_xacnhan').value;
        var mat_khau_xacnhan_error = document.getElementById('mat_khau_xacnhan_error');

        var passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
        var isValid = true;

        // Kiểm tra mật khẩu cũ
        if (mat_khau_cu.trim() === '') {
            mat_khau_cu_error.textContent = 'Mật khẩu cũ không được để trống';
            mat_khau_cu_error.style.display = 'flex';
            isValid = false;
        } else {
            mat_khau_cu_error.style.display = 'none';
        }

        // Kiểm tra mật khẩu mới
        if (mat_khau.trim() === '') {
            mat_khau_error.textContent = 'Mật khẩu mới không được để trống';
            mat_khau_error.style.display = 'flex';
            isValid = false;
        } else if (mat_khau.length < 6) {
            mat_khau_error.textContent = 'Độ dài mật khẩu quá ngắn, vui lòng nhập ít nhất 6 ký tự';
            mat_khau_error.style.display = 'flex';
            isValid = false;
        } else if (/\s/.test(mat_khau)) {
            mat_khau_error.textContent = 'Mật khẩu sai định dạng, không được có dấu cách';
            mat_khau_error.style.display = 'flex';
            isValid = false;
        } else if (!passwordPattern.test(mat_khau)) {
            mat_khau_error.textContent = 'Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 chữ số';
            mat_khau_error.style.display = 'flex';
            isValid = false;
        } else {
            mat_khau_error.style.display = 'none';
        }

        // Kiểm tra xác nhận mật khẩu
        if (mat_khau_xacnhan.trim() === '') {
            mat_khau_xacnhan_error.textContent = 'Vui lòng nhập lại mật khẩu để xác nhận';
            mat_khau_xacnhan_error.style.display = 'flex';
            isValid = false;
        } else if (mat_khau_xacnhan !== mat_khau) {
            mat_khau_xacnhan_error.textContent = 'Mật khẩu xác nhận không khớp với mật khẩu mới';
            mat_khau_xacnhan_error.style.display = 'flex';
            isValid = false;
        } else {
            mat_khau_xacnhan_error.style.display = 'none';
        }

        // Check if all icons show success
        var oldPasswordIcon = document.getElementById('old_password_icon').innerHTML;
        var newPasswordIcon = document.getElementById('new_password_icon').innerHTML;
        var confirmPasswordIcon = document.getElementById('confirm_password_icon').innerHTML;

        if (oldPasswordIcon !== '✅' || newPasswordIcon !== '✅' || confirmPasswordIcon !== '✅') {
            alert('Vui lòng kiểm tra lại thông tin mật khẩu!');
            isValid = false;
        }

        if (!isValid) {
            event.preventDefault(); // Ngăn submit nếu có lỗi
        }
    });
</script>