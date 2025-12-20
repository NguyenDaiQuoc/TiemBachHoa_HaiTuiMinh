# 🔥 Hướng dẫn Deploy Firestore Rules

## Lỗi đã sửa:
- ❌ **Lỗi cũ**: `Missing or insufficient permissions` khi fetch reviews
- ✅ **Đã fix**: Thêm rule cho collection `reviews` để public có thể đọc

## Cách Deploy Rules lên Firebase:

### **Cách 1: Sử dụng Firebase CLI (Khuyên dùng)**

1. **Mở Terminal tại thư mục dự án**:
   ```bash
   cd c:\Users\Admin\Desktop\coding\TiemBachHoa_HaiTuiMinh\ver2.0\apps\web\tiem-bach-hoa
   ```

2. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Hoặc deploy tất cả**:
   ```bash
   firebase deploy
   ```

### **Cách 2: Sử dụng Firebase Console (Thủ công)**

1. Truy cập: https://console.firebase.google.com
2. Chọn project: **tiembachhoa-haituiminh**
3. Vào **Firestore Database**
4. Click tab **Rules** (Quy tắc)
5. Copy nội dung từ file `firestore.rules` và paste vào
6. Click **Publish** (Xuất bản)

## Rule mới đã thêm:

```javascript
// -- Reviews --------------------------------------------------------------
// Reviews are publicly readable. Users can create reviews for products.
// Only admins or review authors can update/delete reviews.
match /reviews/{reviewId} {
  allow read: if true; // Public read for all users
  allow create: if isAuthenticated(); // Authenticated users can write reviews
  allow update, delete: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
}
```

## Kiểm tra sau khi deploy:

1. Refresh trang Product Detail
2. Phần reviews sẽ hiển thị bình thường
3. Không còn lỗi `Missing or insufficient permissions` trong Console

## Lưu ý:

- Rules mất khoảng 10-30 giây để có hiệu lực sau khi deploy
- Nếu vẫn gặp lỗi, thử clear cache trình duyệt (Ctrl + Shift + Delete)
- Kiểm tra Firebase CLI đã login: `firebase login`

## Troubleshooting:

### Nếu gặp lỗi "Firebase CLI not found":
```bash
npm install -g firebase-tools
firebase login
firebase use tiembachhoa-haituiminh
```

### Nếu gặp lỗi "No project active":
```bash
firebase use --add
# Chọn project: tiembachhoa-haituiminh
```

---

**Sau khi deploy xong, hệ thống sẽ hoạt động bình thường!** ✅
