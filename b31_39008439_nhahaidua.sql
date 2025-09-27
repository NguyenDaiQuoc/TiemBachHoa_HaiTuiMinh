-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: sql206.byethost31.com
-- Thời gian đã tạo: Th9 27, 2025 lúc 03:48 AM
-- Phiên bản máy phục vụ: 11.4.7-MariaDB
-- Phiên bản PHP: 7.2.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `b31_39008439_nhahaidua`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_admin`
--

CREATE TABLE `tbl_admin` (
  `id_admin` int(11) NOT NULL,
  `user_name` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `admin_status` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Đang đổ dữ liệu cho bảng `tbl_admin`
--

INSERT INTO `tbl_admin` (`id_admin`, `user_name`, `password`, `admin_status`) VALUES
(1, 'test', '098f6bcd4621d373cade4e832627b4f6', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_anhchuyenkhoan`
--

CREATE TABLE `tbl_anhchuyenkhoan` (
  `iddangky` int(100) NOT NULL,
  `tenkhachhang` varchar(200) NOT NULL,
  `hinhanh` text NOT NULL,
  `phuongthuc` varchar(200) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_chitiet_giaohang`
--

CREATE TABLE `tbl_chitiet_giaohang` (
  `magiaohang` int(100) NOT NULL,
  `idsanpham` int(200) NOT NULL,
  `soluongmua` int(200) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tbl_chitiet_giaohang`
--

INSERT INTO `tbl_chitiet_giaohang` (`magiaohang`, `idsanpham`, `soluongmua`) VALUES
(687, 14, 2),
(687, 11, 1),
(687, 13, 1),
(687, 14, 2),
(687, 11, 1),
(687, 13, 1),
(687, 14, 2),
(687, 11, 1),
(687, 13, 1),
(687, 14, 2),
(687, 11, 1),
(687, 13, 1),
(687, 14, 2),
(687, 11, 1),
(687, 13, 1),
(687, 14, 2),
(687, 11, 1),
(687, 13, 1),
(687, 14, 2),
(687, 11, 1),
(687, 13, 1),
(687, 14, 3),
(687, 11, 2),
(687, 13, 1),
(687, 14, 3),
(687, 11, 2),
(687, 13, 1),
(687, 14, 3),
(687, 11, 2),
(687, 13, 1),
(687, 14, 3),
(687, 14, 3),
(687, 11, 2),
(687, 13, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_chitiet_giohang`
--

CREATE TABLE `tbl_chitiet_giohang` (
  `id_chitiet_giohang` int(11) NOT NULL,
  `code_cart` varchar(100) NOT NULL,
  `idsanpham` int(11) NOT NULL,
  `soluong` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tbl_chitiet_giohang`
--

INSERT INTO `tbl_chitiet_giohang` (`id_chitiet_giohang`, `code_cart`, `idsanpham`, `soluong`) VALUES
(586, '000002', 0, 1),
(585, '000001', 0, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_dangky`
--

CREATE TABLE `tbl_dangky` (
  `iddangky` int(10) NOT NULL,
  `tenkhachhang` varchar(200) NOT NULL,
  `email` varchar(50) NOT NULL,
  `diachi` varchar(100) NOT NULL,
  `matkhau` varchar(100) NOT NULL,
  `dienthoai` varchar(20) NOT NULL,
  `trangthai` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Đang đổ dữ liệu cho bảng `tbl_dangky`
--

INSERT INTO `tbl_dangky` (`iddangky`, `tenkhachhang`, `email`, `diachi`, `matkhau`, `dienthoai`, `trangthai`) VALUES
(4, 'nguyen thi a', 'abc@gmail.com', 'hcm', '3439b8456ece40ffed490454556987a2', '0912345678', 1),
(5, '?inh Phúc Th?nh', 'zaikaman123@gmail.com', '536 Au Co', 'ce9642a7df00bb973f5d9c55d5f67c49', '0931816175', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_danhmuc`
--

CREATE TABLE `tbl_danhmuc` (
  `id_danhmuc` int(100) NOT NULL,
  `tendanhmuc` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `thutu` int(100) NOT NULL,
  `iddanhmucgoc` int(10) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Đang đổ dữ liệu cho bảng `tbl_danhmuc`
--

INSERT INTO `tbl_danhmuc` (`id_danhmuc`, `tendanhmuc`, `thutu`, `iddanhmucgoc`) VALUES
(5, 'Quần áo nam', 1, 0),
(7, 'Quần áo nữ', 2, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_giaohang`
--

CREATE TABLE `tbl_giaohang` (
  `idgiaohang` int(100) NOT NULL,
  `name` varchar(200) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` varchar(200) NOT NULL,
  `note` varchar(200) NOT NULL,
  `iddangky` int(200) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tbl_giaohang`
--

INSERT INTO `tbl_giaohang` (`idgiaohang`, `name`, `phone`, `address`, `note`, `iddangky`) VALUES
(4, 'a', '0912345678', 'a', '', 4);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_giohang`
--

CREATE TABLE `tbl_giohang` (
  `idgiohang` int(11) NOT NULL,
  `idkhachhang` int(11) NOT NULL,
  `code_cart` varchar(100) NOT NULL,
  `trangthai` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tbl_giohang`
--

INSERT INTO `tbl_giohang` (`idgiohang`, `idkhachhang`, `code_cart`, `trangthai`) VALUES
(1, 4, '000001', 1),
(2, 5, '000002', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_hoadon`
--

CREATE TABLE `tbl_hoadon` (
  `idhoadon` int(100) NOT NULL,
  `idkhachhang` int(200) NOT NULL,
  `magiaohang` int(200) NOT NULL,
  `trangthai` int(11) NOT NULL,
  `cart_date` date NOT NULL,
  `cart_payment` varchar(200) NOT NULL,
  `cart_shipping` varchar(200) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tbl_hoadon`
--

INSERT INTO `tbl_hoadon` (`idhoadon`, `idkhachhang`, `magiaohang`, `trangthai`, `cart_date`, `cart_payment`, `cart_shipping`) VALUES
(1, 4, 687, 1, '2025-07-19', 'tienmat', '1'),
(13, 4, 687, 1, '2025-07-19', 'tienmat', '4'),
(12, 4, 687, 1, '2025-07-19', 'tienmat', '1'),
(11, 4, 687, 1, '2025-07-19', 'tienmat', '1'),
(10, 4, 687, 1, '2025-07-19', 'tienmat', '1');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_nhaphang`
--

CREATE TABLE `tbl_nhaphang` (
  `thutu` int(11) NOT NULL,
  `manhaphang` int(11) NOT NULL,
  `ngaynhaphang` date NOT NULL,
  `noinhaphang` varchar(200) NOT NULL,
  `diachi` varchar(200) NOT NULL,
  `sodienthoai` int(11) NOT NULL,
  `soluong` int(11) NOT NULL,
  `dongia` int(11) NOT NULL,
  `thanhtien` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_sanpham`
--

CREATE TABLE `tbl_sanpham` (
  `idsanpham` int(100) NOT NULL,
  `tensanpham` varchar(200) NOT NULL,
  `masanpham` varchar(200) NOT NULL,
  `giasanpham` varchar(200) NOT NULL,
  `khuyenmai` int(10) NOT NULL,
  `giaban` int(11) NOT NULL,
  `soluong` int(11) NOT NULL,
  `soluongconlai` int(100) NOT NULL,
  `hinhanh` varchar(50) NOT NULL,
  `tomtat` mediumtext NOT NULL,
  `noidung` longtext NOT NULL,
  `id_danhmuc` int(100) NOT NULL,
  `tinhtrang` int(10) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `tbl_sanpham`
--

INSERT INTO `tbl_sanpham` (`idsanpham`, `tensanpham`, `masanpham`, `giasanpham`, `khuyenmai`, `giaban`, `soluong`, `soluongconlai`, `hinhanh`, `tomtat`, `noidung`, `id_danhmuc`, `tinhtrang`) VALUES
(13, 'Áo công chúa babydoll', 'DAM01', '120000', 10, 108000, 1, 1, 'aothun.jpg', '', '', 7, 1),
(14, 'aobalo', 'NAM01', '100000', 5, 95000, 1, 3, 'quanyonex.jpg', '', '', 5, 1),
(12, 'Áo polo khoá kéo Karants 2025 màu kem dưới 65kg', 'POLO01', '120000', 20, 96000, 1, 1, 'karants_khoakeo.jpg', '', '', 5, 1),
(11, 'Áo sơ mi trắng nam size 2XL', 'SOMI01', '90000', 10, 81000, 1, 2, 'aosomitrang2XL.jpg', '', '', 5, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_thongtin_khachhang`
--

CREATE TABLE `tbl_thongtin_khachhang` (
  `idkhachhang` int(10) NOT NULL,
  `hoten` varchar(200) NOT NULL,
  `namsinh` date NOT NULL,
  `sodienthoai` int(11) NOT NULL,
  `diachi` varchar(200) NOT NULL,
  `email` text NOT NULL,
  `hinhanh` text NOT NULL,
  `trangthai` int(2) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tbl_thongtin_khachhang`
--

INSERT INTO `tbl_thongtin_khachhang` (`idkhachhang`, `hoten`, `namsinh`, `sodienthoai`, `diachi`, `email`, `hinhanh`, `trangthai`) VALUES
(4, 'nguyễn văn b', '0000-00-00', 912345678, 'hcm', 'abc@gmail.com', 'avatar_4.jpg', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_user_voucher`
--

CREATE TABLE `tbl_user_voucher` (
  `idvoucher` int(100) NOT NULL,
  `tenvoucher` varchar(200) NOT NULL,
  `loai` varchar(200) NOT NULL,
  `mota` varchar(200) NOT NULL,
  `dieukien` varchar(200) NOT NULL,
  `ghichu` varchar(200) NOT NULL,
  `tag` varchar(200) NOT NULL,
  `hieuluc` date NOT NULL,
  `trangthai` int(2) NOT NULL,
  `idkhachhang` int(100) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_voucher`
--

CREATE TABLE `tbl_voucher` (
  `idvoucher` int(11) NOT NULL,
  `tenvoucher` varchar(200) NOT NULL,
  `loai` varchar(200) NOT NULL,
  `mota` varchar(200) NOT NULL,
  `dieukien` varchar(200) NOT NULL,
  `ghichu` varchar(200) NOT NULL,
  `tag` varchar(200) NOT NULL,
  `hieuluc` date NOT NULL,
  `trangthai` int(2) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tbl_xacnhanemail`
--

CREATE TABLE `tbl_xacnhanemail` (
  `id` int(10) NOT NULL,
  `email` varchar(100) NOT NULL,
  `token` varchar(100) NOT NULL,
  `created_at` varchar(200) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `tbl_admin`
--
ALTER TABLE `tbl_admin`
  ADD PRIMARY KEY (`id_admin`);

--
-- Chỉ mục cho bảng `tbl_chitiet_giohang`
--
ALTER TABLE `tbl_chitiet_giohang`
  ADD PRIMARY KEY (`id_chitiet_giohang`);

--
-- Chỉ mục cho bảng `tbl_dangky`
--
ALTER TABLE `tbl_dangky`
  ADD PRIMARY KEY (`iddangky`);

--
-- Chỉ mục cho bảng `tbl_danhmuc`
--
ALTER TABLE `tbl_danhmuc`
  ADD PRIMARY KEY (`id_danhmuc`);

--
-- Chỉ mục cho bảng `tbl_giaohang`
--
ALTER TABLE `tbl_giaohang`
  ADD PRIMARY KEY (`idgiaohang`);

--
-- Chỉ mục cho bảng `tbl_giohang`
--
ALTER TABLE `tbl_giohang`
  ADD PRIMARY KEY (`idgiohang`);

--
-- Chỉ mục cho bảng `tbl_hoadon`
--
ALTER TABLE `tbl_hoadon`
  ADD PRIMARY KEY (`idhoadon`);

--
-- Chỉ mục cho bảng `tbl_nhaphang`
--
ALTER TABLE `tbl_nhaphang`
  ADD PRIMARY KEY (`thutu`);

--
-- Chỉ mục cho bảng `tbl_sanpham`
--
ALTER TABLE `tbl_sanpham`
  ADD PRIMARY KEY (`idsanpham`);

--
-- Chỉ mục cho bảng `tbl_thongtin_khachhang`
--
ALTER TABLE `tbl_thongtin_khachhang`
  ADD PRIMARY KEY (`idkhachhang`);

--
-- Chỉ mục cho bảng `tbl_user_voucher`
--
ALTER TABLE `tbl_user_voucher`
  ADD PRIMARY KEY (`idvoucher`);

--
-- Chỉ mục cho bảng `tbl_voucher`
--
ALTER TABLE `tbl_voucher`
  ADD PRIMARY KEY (`idvoucher`);

--
-- Chỉ mục cho bảng `tbl_xacnhanemail`
--
ALTER TABLE `tbl_xacnhanemail`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `tbl_admin`
--
ALTER TABLE `tbl_admin`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `tbl_chitiet_giohang`
--
ALTER TABLE `tbl_chitiet_giohang`
  MODIFY `id_chitiet_giohang` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=587;

--
-- AUTO_INCREMENT cho bảng `tbl_dangky`
--
ALTER TABLE `tbl_dangky`
  MODIFY `iddangky` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `tbl_danhmuc`
--
ALTER TABLE `tbl_danhmuc`
  MODIFY `id_danhmuc` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `tbl_giaohang`
--
ALTER TABLE `tbl_giaohang`
  MODIFY `idgiaohang` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `tbl_giohang`
--
ALTER TABLE `tbl_giohang`
  MODIFY `idgiohang` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `tbl_hoadon`
--
ALTER TABLE `tbl_hoadon`
  MODIFY `idhoadon` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `tbl_nhaphang`
--
ALTER TABLE `tbl_nhaphang`
  MODIFY `thutu` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `tbl_sanpham`
--
ALTER TABLE `tbl_sanpham`
  MODIFY `idsanpham` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT cho bảng `tbl_voucher`
--
ALTER TABLE `tbl_voucher`
  MODIFY `idvoucher` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `tbl_xacnhanemail`
--
ALTER TABLE `tbl_xacnhanemail`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
