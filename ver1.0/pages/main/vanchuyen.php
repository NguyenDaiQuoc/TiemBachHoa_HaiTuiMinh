
<?php
session_start();
include ("../../admincp/config/config.php");
if (isset($_POST['idsanpham'])) {
    $_SESSION['cart_selected'] = json_decode($_POST['idsanpham'], true); // lưu dạng chuỗi JSON
}
$cart = $_SESSION['cart'] ?? [];
$selected = $_SESSION['cart_selected'] ?? [];

$cart_selected = array_filter($cart, function ($item) use ($selected) {
    return in_array($item['id'], $selected);
});
?>



<div class="main_content">
  <div class="cart_content">
    <h4 class="title-vanchuyen">SẢN PHẨM ĐÃ CHỌN</h4>
    <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; margin-bottom: 20px;">
    <tr>
        <th>Tên sản phẩm</th>
        <th>Số lượng</th>
        <th>Giá</th>
        <th>Thành tiền</th>
    </tr>
    <?php
    $tong = 0;
    foreach ($cart_selected as $item) {
        $thanhtien = $item['soluong'] * $item['giasanpham'];
        $tong += $thanhtien;
        echo '<tr>';
        echo '<td>' . $item['tensanpham'] . '</td>';
        echo '<td>' . $item['soluong'] . '</td>';
        echo '<td>' . number_format($item['giasanpham'], 0, ',', '.') . 'đ</td>';
        echo '<td>' . number_format($thanhtien, 0, ',', '.') . 'đ</td>';
        echo '</tr>';
    }
    ?>
    <tr>
        <td colspan="3" style="text-align:right;"><strong>Tổng cộng:</strong></td>
        <td><strong><?= number_format($tong, 0, ',', '.') ?>đ</strong></td>
    </tr>
    </table>
    <h4 class="title-vanchuyen">THÔNG TIN VẬN CHUYỂN</h4>
    <?php
    if (isset($_POST['themvanchuyen'])) {
      $name = $_POST['name'];
      $phone = $_POST['phone'];
      $address = $_POST['address'];
      $note = $_POST['note'];
      $iddangky = $_SESSION['idkhachhang'];
      $sql_them_vanchuyen = mysqli_query($mysqli, "INSERT INTO tbl_giaohang(name,phone,address,note,iddangky) VALUES ('$name','$phone','$address','$note','$iddangky')");
      if ($sql_them_vanchuyen) {
        echo '<script>alert("Thêm thông tin vận chuyển thành công!")</script>';
      }
    } else if (isset($_POST['capnhatvanchuyen'])) {
      $name = $_POST['name'];
      $phone = $_POST['phone'];
      $address = $_POST['address'];
      $note = $_POST['note'];
      $iddangky = $_SESSION['idkhachhang'];
      $sql_update_vanchuyen = mysqli_query($mysqli, "UPDATE tbl_giaohang SET name='$name', phone ='$phone', address='$address', note ='$note', iddangky='$iddangky' WHERE iddangky='$iddangky'");
      if ($sql_update_vanchuyen) {
        echo '<script>alert("Cập nhật thông tin vận chuyển thành công!")</script>';
      }
    }
    ?>
    <div class="row vanchuyen-form">
      <?php
      $iddangky = $_SESSION['idkhachhang'];
      $sql_get_vanchuyen = mysqli_query($mysqli, "SELECT * FROM tbl_giaohang WHERE iddangky='$iddangky' LIMIT 1");
      $count = mysqli_num_rows($sql_get_vanchuyen);
      if ($count > 0) {
        $row_get_vanchuyen = mysqli_fetch_array($sql_get_vanchuyen);
        $name = $row_get_vanchuyen['name'];
        $phone = $row_get_vanchuyen['phone'];
        $address = $row_get_vanchuyen['address'];
        $note = $row_get_vanchuyen['note'];
      } else {
        $name = '';
        $phone = '';
        $address = '';
        $note = '';
      }
      ?>

      <form id="shippingForm" method="POST" class="shipping-form" autocomplete="off">
      <div class="form-row">
        <label for="name">Họ và tên:</label>
        <input type="text" id="name" name="name" value="<?= $name ?>" placeholder="Nhập họ tên...">
        <div class="error-msg" id="nameError"></div>
      </div>

      <div class="form-row">
        <label for="phone">Số điện thoại:</label>
        <input type="text" id="phone" name="phone" value="<?= $phone ?>" placeholder="Nhập số điện thoại...">
        <div id="phoneError" class="error-msg"></div>
      </div>

      <div class="form-row">
        <label for="address">Địa chỉ:</label>
        <input type="text" id="address" name="address" value="<?= $address ?>" placeholder="Nhập địa chỉ...">
        <div id="addressError" class="error-msg"></div>
      </div>

    <div class="form-row">
        <label for="note">Ghi chú:</label>
        <input type="text" id="note" name="note" value="<?= $note ?>" placeholder="Ghi chú nếu có...">
    </div>

      <div class="form-row action-buttons">
        <?php if ($row['name'] == '' && $row['phone'] == ''): ?>
          <button type="submit" name="themvanchuyen" class="btn-submit">Thêm thông tin</button>
        <?php else: ?>
          <button type="submit" name="capnhatvanchuyen" class="btn-submit">Cập nhật</button>
        <?php endif; ?>


      </div>
    </form>
    <div class="form-row action-buttons">
        <form id="checkoutForm" method="POST" action="index.php?quanly=thongtinthanhtoan">
            <input type="hidden" name="idsanpham" id="selectedIdsInput">
            <button type="submit" class="btn-submit btn-checkout" id="checkoutButton">💳 Thanh toán</button>
        </form>
    </div>
    </div>
  </div>
</div>


<script>
  // Hàm kiểm tra tính hợp lệ của form
  function validateForm() {
    let valid = true;
    let name = document.getElementById('name').value.trim();
    let phone = document.getElementById('phone').value.trim();
    let address = document.getElementById('address').value.trim();
    // Xóa các thông báo lỗi trước đó
    document.getElementById('nameError').innerText = '';
    document.getElementById('phoneError').innerText = '';
    document.getElementById('addressError').innerText = '';
    // Kiểm tra các trường bắt buộc
    if (name === '') {
      document.getElementById('nameError').innerText = 'Vui lòng nhập họ và tên.';
      valid = false;
    }
    if (phone === '') {
      document.getElementById('phoneError').innerText = 'Vui lòng nhập số điện thoại.';
      valid = false;
    } else if (!/^0\d{9}$/.test(phone)) { // Kiểm tra định dạng số điện thoại
      document.getElementById('phoneError').innerText = 'Số điện thoại sai định dạng, vui lòng nhập đúng số điện thoại bạn đang dùng.';
      valid = false;
    }
    if (address === '') {
      document.getElementById('addressError').innerText = 'Vui lòng nhập địa chỉ.';
      valid = false;
    }
    return valid;
  }

  // Kiểm tra khi nhấn vào nút "Cập nhật vận chuyển"
  document.getElementById('shippingForm').addEventListener('submit', function(e) {
    if (!validateForm()) {
      e.preventDefault();
    }
  });

  // Kiểm tra khi nhấn vào nút "Thanh toán"
  document.getElementById('checkoutButton').addEventListener('click', function(e) {
    if (!validateForm()) {
      e.preventDefault();
    }
  });

    //lấy cartselected
  document.getElementById('checkoutForm').addEventListener('submit', function (e) {
  const selectedIds = <?php echo json_encode($_SESSION['cart_selected'] ?? []); ?>;
  document.getElementById('selectedIdsInput').value = JSON.stringify(selectedIds);
    });
</script>


<style>
.cart_content {
  max-width: 600px;
  margin: auto;
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 0 6px rgba(0,0,0,0.1);
  font-family: Arial, sans-serif;
  font-size: 16px;
}

.title-vanchuyen {
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 25px;
  text-transform: uppercase;
}

.shipping-form .form-row {
  display:flex;
  flex-wrap: wrap;
  position: relative;
}

.shipping-form .form-row .error-msg {
  width: 100%;
  margin-top: 5px;
  font-size: 13px;
  color: red;
  min-height: 18px;
}

.shipping-form .form-row label {
  width: 140px;
  font-weight: 500;
  margin-right: 10px;
  line-height: 38px; /* đảm bảo cùng chiều cao với input */
}

.shipping-form .form-row input {
  flex: 1;
  height: 38px; /* đồng bộ với line-height của label */
  padding: 0 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 15px;
  box-sizing: border-box;
}

.error-msg {
  color: red;
  font-size: 13px;
  margin-left: 150px;
  display: block;
  margin-top: 5px;
}

.action-buttons {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding-left: 150px;
}

.btn-submit {
  background-color: #d9534f;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  font-size: 15px;
}

.btn-submit:hover {
  background-color: #c9302c;
}

.btn-checkout {
  background-color: #ff9800; /* Màu cam */
}

.btn-checkout:hover {
  background-color: #e68900;
}

/* Responsive */
@media (max-width: 768px) {
  .shipping-form .form-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .shipping-form .form-row label {
    width: 100%;
    margin-bottom: 5px;
    line-height: normal;
  }

  .shipping-form .form-row input {
    width: 100%;
    height: 38px;
  }

  .error-msg {
    margin-left: 0;
  }

  .action-buttons {
    flex-direction: column;
    align-items: flex-start;
    padding-left: 0;
  }

  .btn-submit {
    width: 100%;
    text-align: center;
  }
}

</style>
