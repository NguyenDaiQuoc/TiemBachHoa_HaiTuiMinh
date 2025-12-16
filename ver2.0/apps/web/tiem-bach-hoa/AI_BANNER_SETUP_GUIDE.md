# 🤖 Hướng Dẫn Setup AI Tạo Banner

## 🎨 Tính Năng
Tự động tạo ảnh banner quảng cáo chuyên nghiệp từ mô tả văn bản sử dụng OpenAI DALL-E 3.

## 📋 Yêu Cầu

### 1. OpenAI API Key
- Truy cập: https://platform.openai.com/api-keys
- Đăng ký/Đăng nhập tài khoản OpenAI
- Tạo API key mới
- Copy API key (bắt đầu bằng `sk-...`)

### 2. Cấu Hình Billing
- Vào: https://platform.openai.com/account/billing
- Thêm phương thức thanh toán
- Nạp credit (tối thiểu $5)
- **Chi phí**: ~$0.04 per image với DALL-E 3 (standard quality)

## 🚀 Cài Đặt

### Bước 1: Tạo File .env
```bash
# Tại thư mục gốc project
cd tiem-bach-hoa
```

Tạo file `.env`:
```env
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**⚠️ LƯU Ý BẢO MẬT:**
- File `.env` đã được thêm vào `.gitignore`
- KHÔNG commit API key lên Git
- KHÔNG chia sẻ API key công khai

### Bước 2: Restart Dev Server
```bash
# Stop server hiện tại (Ctrl+C)
# Restart để load env variables
npm run dev
```

### Bước 3: Kiểm Tra
1. Vào trang **Marketing** → tab **Banner Quảng Cáo**
2. Click "Thêm Banner Mới"
3. Nhập prompt trong ô **"Tạo Ảnh Bằng AI"**
4. Click **"✨ Tạo Ảnh AI"**

## 📝 Cách Sử Dụng

### Ví Dụ Prompt Tốt:
```
Banner khuyến mãi Tết Nguyên Đán với màu đỏ vàng chủ đạo, 
có hình bánh chưng, cành mai vàng, phong bì lì xì, 
không gian cửa hàng tạp hóa hiện đại, 
chữ "GIẢM GIÁ 50%" nổi bật
```

```
Banner sale Black Friday phong cách tối giản, 
màu đen gold, sản phẩm tạp hóa cao cấp, 
không gian sang trọng, chữ "BLACK FRIDAY" lớn
```

```
Banner giới thiệu sản phẩm organic, 
phong cách tự nhiên xanh lá, 
có rau củ tươi, bầu không khí healthy lifestyle, 
ánh sáng tự nhiên
```

### Tips Viết Prompt Hiệu Quả:
1. ✅ **Mô tả cụ thể màu sắc**: "màu đỏ vàng", "tone xanh lá pastel"
2. ✅ **Nêu rõ phong cách**: "hiện đại", "vintage", "tối giản"
3. ✅ **Liệt kê các yếu tố**: "bánh chưng, mai vàng, lì xì"
4. ✅ **Đề cập text/chữ**: "chữ SALE lớn", "text giảm giá nổi bật"
5. ✅ **Mô tả không gian**: "cửa hàng tạp hóa", "background siêu thị"
6. ❌ **Tránh quá ngắn**: "banner đẹp" (không đủ chi tiết)
7. ❌ **Tránh quá dài**: >200 từ (khó hiểu)

## ⚙️ Quy Trình Xử Lý

1. **User nhập prompt** → Click "Tạo Ảnh AI"
2. **Frontend gọi OpenAI API** → Tạo ảnh từ prompt
3. **DALL-E 3 trả về URL** → Ảnh tạm trên server OpenAI
4. **Download ảnh** → Convert sang blob
5. **Upload lên Firebase Storage** → Lưu vĩnh viễn
6. **Set imageUrl** → Hiển thị preview
7. **Save banner** → Lưu vào Firestore

## 💰 Chi Phí

### DALL-E 3 Pricing:
- **Standard (1024x1024)**: $0.040/image
- **Standard (1792x1024)**: $0.080/image ← Đang dùng (landscape banner)
- **HD Quality**: $0.120/image

### Ước Tính:
- 10 banners/tháng: ~$0.80
- 50 banners/tháng: ~$4.00
- 100 banners/tháng: ~$8.00

## 🛡️ Bảo Mật

### Client-Side vs Server-Side:
**Hiện tại (Client-Side)**:
- ✅ Dễ implement
- ✅ Không cần backend
- ⚠️ API key exposed trong browser (có thể bị lộ)

**Khuyến nghị Production (Server-Side)**:
```javascript
// Tạo Cloud Function hoặc API endpoint
exports.generateBanner = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) throw new Error('Unauthorized');
  
  // Call OpenAI API from server
  const response = await openai.images.generate({
    prompt: data.prompt,
    model: 'dall-e-3',
    // ...
  });
  
  return response.data[0].url;
});
```

### Rate Limiting:
OpenAI limits:
- **Tier 1**: 5 requests/min, 200 requests/day
- **Tier 2**: 50 requests/min
- Nếu vượt → Lỗi 429 (Too Many Requests)

## 🐛 Troubleshooting

### Lỗi: "Chưa cấu hình OpenAI API Key"
- Kiểm tra file `.env` có tồn tại
- Key đúng format: `VITE_OPENAI_API_KEY=sk-...`
- Restart dev server

### Lỗi: "Insufficient quota"
- Kiểm tra billing: https://platform.openai.com/account/billing
- Thêm credit vào account
- Verify payment method

### Lỗi: "Invalid API key"
- Copy lại API key từ OpenAI dashboard
- Đảm bảo không có khoảng trắng thừa
- Key phải active (chưa revoked)

### Lỗi: "Rate limit exceeded"
- Đợi 1 phút rồi thử lại
- Giảm số lượng requests
- Upgrade tier nếu cần

### Ảnh tạo không đẹp:
- Viết prompt chi tiết hơn
- Thêm từ khóa về phong cách
- Mô tả màu sắc cụ thể
- Thử lại với prompt khác

## 🎯 Best Practices

1. **Cache prompts tốt**: Lưu các prompt đã dùng để tái sử dụng
2. **Preview trước khi save**: Xem ảnh AI có OK không
3. **Backup manual upload**: Luôn có option upload ảnh thủ công
4. **Monitor usage**: Theo dõi chi phí trên OpenAI dashboard
5. **Set spending limits**: Tránh vượt ngân sách

## 📚 Tài Liệu Tham Khảo

- OpenAI DALL-E Docs: https://platform.openai.com/docs/guides/images
- Pricing: https://openai.com/pricing
- API Reference: https://platform.openai.com/docs/api-reference/images
- Best Practices: https://platform.openai.com/docs/guides/safety-best-practices

## ✨ Nâng Cấp Tương Lai

- [ ] Lưu prompt history
- [ ] Template prompts có sẵn
- [ ] Multiple image variations
- [ ] Edit/refine existing images
- [ ] AI suggest improvements
- [ ] Integration với Midjourney/Stable Diffusion
