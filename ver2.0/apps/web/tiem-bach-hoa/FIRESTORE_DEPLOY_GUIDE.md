# Hướng Dẫn Deploy Firestore Security Rules

## Lỗi Gặp Phải
```
FirebaseError: Missing or insufficient permissions
```

## Nguyên Nhân
Firestore Security Rules chưa được cấu hình hoặc chưa được deploy lên Firebase.

## Cách 1: Deploy Qua Firebase CLI (Khuyến nghị)

### Bước 1: Cài đặt Firebase CLI
```bash
npm install -g firebase-tools
```

### Bước 2: Đăng nhập Firebase
```bash
firebase login
```

### Bước 3: Khởi tạo Firebase project (nếu chưa có)
```bash
firebase init firestore
```
- Chọn project hiện tại
- Chọn file rules: `firestore.rules`
- Indexes file: `firestore.indexes.json` (hoặc để mặc định)

### Bước 4: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

## Cách 2: Cấu Hình Qua Firebase Console

### Bước 1: Truy cập Firebase Console
1. Mở https://console.firebase.google.com/
2. Chọn project của bạn
3. Vào **Firestore Database** (menu bên trái)
4. Click tab **Rules**

### Bước 2: Copy & Paste Rules
1. Mở file `firestore.rules` trong project
2. Copy toàn bộ nội dung
3. Paste vào editor trên Firebase Console
4. Click **Publish** để deploy

## Kiểm Tra Rules Đã Deploy

### Trên Firebase Console:
1. Vào **Firestore Database** > **Rules**
2. Xem rules hiện tại và thời gian publish

### Test Rules:
1. Vào tab **Rules** > **Rules playground**
2. Chọn collection (ví dụ: `inventory_in`)
3. Chọn operation (read/write)
4. Thử simulate với authenticated/unauthenticated user

## Rules Hiện Tại Cho Phép:

### ✅ Products Collection
- Read: Tất cả users (kể cả chưa login)
- Write: Authenticated users

### ✅ Warehouse Collection
- Read: Tất cả users
- Create: Authenticated users
- Update/Delete: Authenticated users

### ✅ Inventory In Collection
- Read: Authenticated users
- Create: Authenticated users (với adminId = user ID)
- Update/Delete: Authenticated users

### ✅ Users Collection
- Read: Authenticated users
- Write: Chỉ user sở hữu document đó

## Troubleshooting

### Nếu vẫn gặp lỗi permission:
1. **Kiểm tra user đã login chưa:**
   ```javascript
   console.log('Current user:', auth.currentUser);
   ```

2. **Kiểm tra rules đã deploy:**
   - Vào Firebase Console > Firestore > Rules
   - Xem thời gian publish có phải mới nhất không

3. **Test với rules đơn giản nhất (CHỈ ĐỂ DEBUG):**
   ```
   match /{document=**} {
     allow read, write: if true;  // CHO PHÉP TẤT CẢ - KHÔNG AN TOÀN!
   }
   ```
   ⚠️ **LƯU Ý:** Rules này không an toàn, chỉ dùng để test. Phải thay bằng rules đúng sau khi confirm được vấn đề.

4. **Xóa cache browser và reload lại trang**

5. **Logout và login lại:**
   ```javascript
   await signOut(auth);
   // Sau đó login lại
   ```

## Firebase Project Setup

Nếu chưa setup Firebase project:

```bash
# Khởi tạo Firebase trong project
firebase init

# Chọn các services:
# - Firestore
# - Storage (đã có storage.rules)
# - Hosting (nếu cần)

# Deploy tất cả
firebase deploy
```

## Lưu Ý Bảo Mật

1. **Không để rules quá rộng** (allow all)
2. **Luôn validate data** trong rules
3. **Kiểm tra authentication** trước khi cho phép operations
4. **Test rules** trước khi deploy production
5. **Backup rules** trước khi thay đổi

## Commands Hữu Ích

```bash
# Deploy chỉ Firestore rules
firebase deploy --only firestore:rules

# Deploy cả Storage và Firestore rules
firebase deploy --only storage,firestore:rules

# Xem logs
firebase functions:log

# Test rules locally (emulator)
firebase emulators:start --only firestore
```
