# Khắc Phục Lỗi Permission-Denied Firestore

## 🔴 Vấn Đề
Các trang admin (News, Blogs, Media) hiển thị lỗi: **"Missing or insufficient permissions"**

```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

## ✅ Giải Pháp Nhanh

### Bước 1: Cập Nhật Firestore Rules
Các rules đã được cập nhật trong file `firestore.rules`. Cần deploy lên Firebase:

**Option A - Dùng Firebase Console (Nhanh nhất)**
1. Mở https://console.firebase.google.com
2. Chọn project của bạn
3. Vào **Firestore Database** → **Rules**
4. Copy nội dung từ file `firestore.rules` (dòng 1-109)
5. Paste vào editor trên console
6. Click **Publish**

**Option B - Dùng Firebase CLI**
```bash
# Cài đặt Firebase CLI (nếu chưa có)
npm install -g firebase-tools

# Login vào Firebase
firebase login

# Deploy rules từ project directory
cd tiem-bach-hoa
firebase deploy --only firestore:rules
```

### Bước 2: Xác Nhận Thay Đổi
Sau khi deploy, chờ 1-2 phút rồi:
1. **Refresh browser**: Ctrl+F5
2. **Clear cache**: Ctrl+Shift+Delete → Clear all
3. **Logout và re-login** vào admin
4. Truy cập `/admin/news`, `/admin/blogs`, `/admin/media`

## 📋 Firestore Rules Được Cập Nhật

Thêm 2 dòng này vào file `firestore.rules`:

```plaintext
match /news/{id}    { allow read: if true; allow write: if isAdmin(); }
match /media/{id}   { allow read: if true; allow write: if isAdmin(); }
```

Điều này cho phép:
- **Read**: Bất kỳ ai cũng có thể đọc (public-read)
- **Write**: Chỉ admin mới có thể viết (admin-only)

## 🔍 Kiểm Tra

Sau khi khắc phục, các lỗi sau sẽ biến mất:

```
❌ @firebase/firestore: Firestore (12.6.0): Uncaught Error in snapshot listener: 
   FirebaseError: [code=permission-denied]: Missing or insufficient permissions.

❌ Blogs.tsx:51 Lỗi tải bài viết: FirebaseError: Missing or insufficient permissions.

❌ Media.tsx:38 Load media error FirebaseError: Missing or insufficient permissions.
```

Thay vào đó sẽ thấy:
```
✅ Trang News/Blogs/Media tải bình thường
✅ Có thể tạo/sửa/xóa bài viết
✅ Có thể upload/xóa ảnh
✅ Browser console không có lỗi permission
```

## 💡 Nếu Vẫn Không Hoạt Động

### 1. Kiểm Tra User Role
```
Firestore → users collection → document của bạn
→ Kiểm tra có field: role: "admin" không?
```

### 2. Xóa Cache Browser
```
Ctrl+Shift+Delete → Clear all → Refresh
```

### 3. Kiểm Tra Rules Published
```
Firebase Console → Firestore Rules tab
→ Xem "Last published" timestamp
```

### 4. Chờ Propagation
Firebase rules có thể mất 1-2 phút để lan tỏa toàn bộ. Thử lại sau 2 phút.

### 5. Test Với curl
```bash
# Kiểm tra quyền truy cập từ console
firebase firestore:delete --path=news/test --project=<project-id>
```

## 📞 Support

- [Firebase Docs - Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Docs - CLI Reference](https://firebase.google.com/docs/cli)
- Xem logs chi tiết trong Firebase Console → Logs

## ✨ Ghi Chú

- Quyền read được set thành `true` để frontend có thể load dữ liệu
- Quyền write được set thành `isAdmin()` để chỉ admin có thể modify
- Rules có hiệu lực ngay sau khi publish (không cần restart app)
