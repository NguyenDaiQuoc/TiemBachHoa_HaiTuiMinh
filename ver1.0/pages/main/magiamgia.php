<?php
session_start();
date_default_timezone_set('Asia/Ho_Chi_Minh');

$idkhachhang = $_SESSION['idkhachhang'] ?? 0;
$today = date('Y-m-d');

// Lọc và sắp xếp
$filter_tag = $_GET['tag'] ?? '';
$filter_loai = $_GET['loai'] ?? '';
$filter_expire = $_GET['expire'] ?? ''; // 7|30|...
$where = "WHERE 1";

if ($filter_tag) {
    $where .= " AND v.tag = '" . mysqli_real_escape_string($mysqli, $filter_tag) . "'";
}
if ($filter_loai) {
    $where .= " AND v.loai = '" . mysqli_real_escape_string($mysqli, $filter_loai) . "'";
}
if ($filter_expire) {
    $expire_date = date('Y-m-d', strtotime("+$filter_expire days"));
    $where .= " AND v.hieuluc BETWEEN '$today' AND '$expire_date'";
}

// Phân trang
$limit = 8;
$page = $_GET['page'] ?? 1;
$offset = ($page - 1) * $limit;

// Đếm tổng số voucher
$count_sql = "SELECT COUNT(*) as total FROM tbl_voucher v $where";
$count_result = mysqli_query($mysqli, $count_sql);
$total = mysqli_fetch_assoc($count_result)['total'];
$total_pages = ceil($total / $limit);

// Lấy dữ liệu voucher (phân trang)
$sql = "SELECT v.*, uv.idkhachhang AS saved
        FROM tbl_voucher v
        LEFT JOIN tbl_user_voucher uv ON v.idvoucher = uv.idvoucher AND uv.idkhachhang = $idkhachhang
        $where
        ORDER BY 
            CASE WHEN v.hieuluc >= '$today' THEN 0 ELSE 1 END,
            v.hieuluc ASC
        LIMIT $limit OFFSET $offset";
$result = mysqli_query($mysqli, $sql);

$vouchers = [];
while ($row = mysqli_fetch_assoc($result)) {
    $row['trangthai'] = ($row['hieuluc'] >= $today) ? 'kha_dung' : 'het_han';
    $vouchers[] = $row;
}
?>

<style>
    .voucher_container {
        max-width: 960px;
        margin: 30px auto;
        font-family: Arial, sans-serif;
        background: #fff8f2;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #ffd2b3;
    }

    .voucher_tabs {
        display: flex;
        border-bottom: 2px solid #ffd2b3;
        margin-bottom: 15px;
    }

    .voucher_tabs div {
        padding: 10px 20px;
        cursor: pointer;
        font-weight: bold;
        border-bottom: 3px solid transparent;
        color: #333;
        transition: 0.3s;
    }

    .voucher_tabs .active {
        border-bottom: 3px solid #ff6600;
        color: #ff6600;
    }

    .voucher_list {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
    }

    .voucher_item {
        flex: 0 0 48%;
        border: 1px solid #ffd2b3;
        border-left: 6px solid #ff6600;
        padding: 15px;
        border-radius: 8px;
        background: #fffdf9;
        position: relative;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .voucher_item.expired {
        border-left-color: #aaa;
        background: #f4f4f4;
        opacity: 0.7;
    }

    .voucher_tag {
        font-weight: bold;
        color: #ff6600;
        margin-bottom: 5px;
    }

    .voucher_name {
        font-size: 17px;
        font-weight: bold;
    }

    .voucher_condition {
        font-size: 14px;
        margin-top: 5px;
    }

    .voucher_expire {
        font-size: 13px;
        color: #888;
        margin-top: 5px;
    }

    .voucher_btns {
        margin-top: 10px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;
    }

    .voucher_btns button {
        padding: 6px 14px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: 0.3s;
    }

    .voucher_btns .save_btn {
        background: #ffe2cc;
        color: #ff6600;
    }

    .voucher_btns .save_btn.saved {
        background: #00c896;
        color: #fff;
    }

    .voucher_btns .use_btn {
        background: #ff6600;
        color: white;
    }

    .voucher_btns .use_btn:disabled {
        background: #bbb;
        cursor: not-allowed;
    }

    .pagination {
        text-align: center;
        margin-top: 20px;
    }

    .pagination a {
        margin: 0 5px;
        padding: 6px 12px;
        border: 1px solid #ffcc99;
        color: #ff6600;
        border-radius: 4px;
        text-decoration: none;
    }

    .pagination a.active {
        background: #ff6600;
        color: white;
        border-color: #ff6600;
    }
</style>

<div class="voucher_container">
    <h2>Kho Voucher</h2>
    <div
        style="max-width: 960px; margin: 0 auto 20px auto; padding: 10px; background: #fff7f0; border-radius: 10px; border: 1px solid #ffd2b3;">
        <form method="GET" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
            <select name="tag">
                <option value="">-- Chọn tag --</option>
                <option value="GIAO_HANG" <?= $filter_tag === 'GIAO_HANG' ? 'selected' : '' ?>>GIAO_HANG</option>
                <option value="GIAM_GIA" <?= $filter_tag === 'GIAM_GIA' ? 'selected' : '' ?>>GIAM_GIA</option>
            </select>
            <select name="loai">
                <option value="">-- Chọn loại --</option>
                <option value="FREESHIP" <?= $filter_loai === 'FREESHIP' ? 'selected' : '' ?>>FREESHIP</option>
                <option value="TIENMAT" <?= $filter_loai === 'TIENMAT' ? 'selected' : '' ?>>TIENMAT</option>
            </select>
            <select name="expire">
                <option value="">-- Hạn sử dụng --</option>
                <option value="3" <?= $filter_expire === '3' ? 'selected' : '' ?>>Còn hạn trong 3 ngày</option>
                <option value="7" <?= $filter_expire === '7' ? 'selected' : '' ?>>Còn hạn trong 7 ngày</option>
                <option value="30" <?= $filter_expire === '30' ? 'selected' : '' ?>>Còn hạn trong 30 ngày</option>
            </select>
            <button type="submit"
                style="padding: 6px 12px; background: #ff6600; color: white; border: none; border-radius: 5px; font-weight: bold;">Lọc</button>
        </form>
    </div>

    <div class="voucher_tabs">
        <div class="tab_btn active" onclick="showTab('tatca', event)">Tất cả</div>
        <div class="tab_btn" onclick="showTab('kha_dung', event)">Khả dụng</div>
        <div class="tab_btn" onclick="showTab('het_han', event)">Hết hạn</div>
        <div class="tab_btn" onclick="showTab('luu', event)">Đã lưu</div>
    </div>

    <?php
    $tabs = ['tatca' => 'Tất cả', 'kha_dung' => 'Đang còn hạn', 'het_han' => 'Đã hết hạn', 'luu' => 'Đã lưu'];
    foreach ($tabs as $key => $label):
        ?>
        <div class="voucher_list tab_content" id="tab_<?= $key ?>"
            style="display: <?= $key === 'tatca' ? 'flex' : 'none' ?>;">
            <?php foreach ($vouchers as $vc): ?>
                <?php if (
                    $key === 'tatca' ||
                    $vc['trangthai'] === $key ||
                    ($key === 'luu' && $vc['saved'])
                ): ?>
                    <div class="voucher_item <?= $vc['trangthai'] === 'het_han' ? 'expired' : '' ?>">
                        <div class="voucher_tag"><?= $vc['tag'] ?></div>
                        <div class="voucher_name"><?= $vc['tenvoucher'] ?></div>
                        <div class="voucher_condition">Áp dụng cho đơn hàng từ <?= number_format($vc['dieukien']) ?>đ</div>
                        <div class="voucher_expire">
                            <?= $vc['trangthai'] === 'het_han' ? 'Hết hạn: ' : 'Còn hạn đến: ' ?>
                            <?= date('d/m/Y', strtotime($vc['hieuluc'])) ?>
                        </div>
                        <div class="voucher_btns">
                            <?php if ($vc['saved']): ?>
                                <button class="save_btn saved" disabled>Đã lưu</button>
                                <button class="use_btn" onclick="useVoucher(<?= $vc['idvoucher'] ?>)" <?= $vc['trangthai'] === 'het_han' ? 'disabled' : '' ?>>Dùng ngay</button>
                                <button class="save_btn" onclick="deleteVoucher(<?= $vc['idvoucher'] ?>)">Xóa</button>
                            <?php else: ?>
                                <button class="save_btn" onclick="saveVoucher(<?= $vc['idvoucher'] ?>, this)"
                                    <?= $vc['trangthai'] === 'het_han' ? 'disabled' : '' ?>>Lưu mã</button>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
    <?php endforeach; ?>

    <div class="pagination">
        <?php for ($i = 1; $i <= $total_pages; $i++): ?>
            <a href="?page=<?= $i ?>" class="<?= $i == $page ? 'active' : '' ?>"><?= $i ?></a>
        <?php endfor; ?>
    </div>
</div>

<script>
    function showTab(tab, event) {
        document.querySelectorAll('.tab_content').forEach(div => div.style.display = 'none');
        document.querySelectorAll('.tab_btn').forEach(btn => btn.classList.remove('active'));

        document.getElementById('tab_' + tab).style.display = 'flex';
        event.target.classList.add('active');
    }

    function saveVoucher(idvoucher, btn) {
        fetch('luu_voucher.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'idvoucher=' + idvoucher
        })
            .then(res => res.text())
            .then(text => {
                if (text === 'success') {
                    btn.textContent = 'Đã lưu';
                    btn.classList.add('saved');
                    btn.disabled = true;
                    location.reload();
                } else if (text === 'expired') {
                    alert('Mã này đã hết hạn, không thể lưu.');
                } else if (text === 'already_saved') {
                    alert('Bạn đã lưu mã này rồi.');
                } else {
                    alert('Vui lòng đăng nhập hoặc thử lại.');
                }
            });
    }

    function deleteVoucher(idvoucher) {
        if (!confirm('Bạn có chắc muốn xóa mã này khỏi danh sách đã lưu?')) return;
        fetch('xoa_voucher.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'idvoucher=' + idvoucher
        })
            .then(res => res.text())
            .then(text => {
                if (text === 'success') {
                    alert('Đã xóa thành công');
                    location.reload();
                } else {
                    alert('Không thể xóa, vui lòng thử lại.');
                }
            });
    }

    function useVoucher(idvoucher) {
        window.location.href = 'index.php?quanly=giohang&voucher=' + idvoucher;
    }
</script>