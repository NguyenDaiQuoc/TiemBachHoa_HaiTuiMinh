# 🔥 FIX LỖI STORAGE UPLOAD

## ⚠️ Lỗi: `storage/unauthorized`

Lỗi này xảy ra vì **Storage Rules chưa được deploy**!

## ✅ Giải pháp nhanh (2 phút)

### Cách 1: Firebase CLI (Khuyến nghị)
```bash
firebase login
firebase deploy --only storage
```

### Cách 2: Firebase Console (Không cần CLI)
1. Mở https://console.firebase.google.com/
2. Chọn project `tiembachhoa-haituiminh`
3. Vào **Storage** > **Rules**
4. Copy toàn bộ nội dung file `storage.rules`
5. Paste vào editor và click **Publish**

## 📝 Lưu ý
- User phải **đăng nhập** để upload (rules yêu cầu authentication)
- Sau khi deploy, đợi 5-10 giây để rules có hiệu lực
- Nếu vẫn lỗi, thử logout/login lại

## 🎯 Toast hiển thị đúng
- Toast đã được set z-index = 99999
- Sẽ hiển thị trên tất cả modal và overlay

