# 🔧 Hướng dẫn Fix Lỗi Permissions Inventory

## Vấn đề
```
FirebaseError: Missing or insufficient permissions
```

## Nguyên nhân
Tài khoản của bạn chưa có quyền admin trong Firestore.

## Giải pháp (Chọn 1 trong 3 cách)

---

### ✅ CÁCH 1: Sử dụng Firebase Console (Nhanh nhất - Khuyến nghị)

1. **Mở Firebase Console**: https://console.firebase.google.com/
2. **Chọn project** của bạn
3. **Vào Firestore Database** (menu bên trái)
4. **Tạo admin document:**
   - Click nút "**Start collection**" (nếu chưa có collection nào)
   - Hoặc click biểu tượng "**+**" để thêm collection
   - Collection ID: `admins`
   - Document ID: **UID của bạn** (lấy từ Authentication > Users)
   - Thêm fields:
     ```
     email: "your-email@gmail.com"  (string)
     role: "admin"                   (string)
     displayName: "Your Name"        (string)
     createdAt: [timestamp now]      (timestamp)
     ```
   - Click **Save**

5. **Cập nhật users collection** (nếu đã có):
   - Vào collection `users`
   - Tìm document có ID = UID của bạn
   - Thêm hoặc cập nhật field:
     ```
     role: "admin"  (string)
     ```

6. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

7. **Reload trang web** và thử lại

---

### 🛠️ CÁCH 2: Dùng setup-admin.html (Có sẵn)

**QUAN TRỌNG**: Trước khi dùng, bạn cần cập nhật Firebase config!

1. **Lấy Firebase Config**:
   - Mở file `src/firebase.ts`
   - Copy thông tin config (apiKey, authDomain, projectId, etc.)

2. **Cập nhật setup-admin.html**:
   - Mở file `setup-admin.html`
   - Tìm dòng:
     ```javascript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       // ...
     };
     ```
   - Thay thế bằng config thật của bạn từ `src/firebase.ts`

3. **Chạy file HTML**:
   - Mở `setup-admin.html` bằng trình duyệt
   - Click "1. Đăng nhập Firebase"
   - Click "2. Kiểm tra quyền admin"
   - Click "3. Tạo quyền admin" (nếu chưa có)

4. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Reload trang web** và thử lại

---

### 📝 CÁCH 3: Sử dụng Firestore API (Cho dev)

1. **Tạo script tạm** hoặc dùng Console trình duyệt:
   ```javascript
   // Paste vào Console của trang web (F12)
   import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
   import { db, auth } from './firebase';
   
   const user = auth.currentUser;
   if (user) {
     await setDoc(doc(db, 'admins', user.uid), {
       email: user.email,
       role: 'admin',
       displayName: user.displayName || '',
       createdAt: serverTimestamp()
     });
     
     await setDoc(doc(db, 'users', user.uid), {
       role: 'admin'
     }, { merge: true });
     
     console.log('✅ Admin created!');
   }
   ```

2. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Kiểm tra lại

Sau khi làm xong, kiểm tra:

1. **Firebase Console > Firestore Database**:
   - Collection `admins` có document với ID = UID của bạn ✓
   - Collection `users` có field `role = "admin"` ✓

2. **Deploy rules thành công**:
   ```bash
   firebase deploy --only firestore:rules
   ```
   Output: `✔ Deploy complete!`

3. **Test lại trên web**:
   - Reload trang (Ctrl+Shift+R)
   - Vào trang Inventory
   - Thử nhập hàng mới
   - Không còn lỗi permissions ✓

---

## Debug nếu vẫn lỗi

### Kiểm tra UID:
1. Vào Firebase Console > Authentication > Users
2. Copy UID của tài khoản bạn đang dùng
3. Paste vào Console:
   ```javascript
   console.log('Current UID:', auth.currentUser.uid);
   ```
4. So sánh 2 UID có giống nhau không

### Kiểm tra Firestore Rules đã deploy:
1. Firebase Console > Firestore Database > Rules tab
2. Xem có đúng rules mới nhất không
3. Nếu không, chạy lại: `firebase deploy --only firestore:rules`

### Clear cache:
```bash
# Clear browser cache
Ctrl + Shift + Delete > Clear cached images and files

# Hoặc hard reload
Ctrl + Shift + R
```

---

## Tóm tắt các bước fix nhanh

```bash
# 1. Vào Firebase Console tạo admin document thủ công (CÁCH DỄ NHẤT)

# 2. Deploy firestore rules
firebase deploy --only firestore:rules

# 3. Reload trang web
# Ctrl + Shift + R

# 4. Test lại
```

Done! 🎉
