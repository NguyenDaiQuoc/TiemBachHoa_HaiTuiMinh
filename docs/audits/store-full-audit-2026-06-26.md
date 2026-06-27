# Store Full Audit - Latest Run - 2026-06-26

Audit mới nhất cho dự án Hai Tụi Mình Store sau khi sửa các lỗi test gate trong báo cáo cũ. File này đã được ghi lại bằng UTF-8 sạch và thay toàn bộ kết luận lỗi thời như `Playwright FAIL 24/24`, thiếu DB local, cart hardcode sản phẩm cũ, visual snapshot thiếu baseline.

## 1. Tóm Tắt Điều Hành

Trạng thái hiện tại: dự án đã qua các cổng kiểm thử chính ở local.

- TypeScript/lint: PASS.
- Unit/component test: PASS, 2 file / 6 test.
- Production build: PASS.
- Playwright full suite: PASS, 24/24 test.
- Visual regression: PASS, 16/16 test sau khi cập nhật baseline ổn định.
- Local PostgreSQL/Redis không còn là blocker.
- Cart e2e đã dùng sản phẩm seed thật `Tai nghe Bluetooth FitGo` thay cho dữ liệu cũ không còn tồn tại.
- Build bundle đã được tách lại, không còn chunk vượt 500 kB.
- Product API đã giảm burst query song song để tránh cạn Prisma connection pool khi e2e/browser chạy đồng thời.

Kết luận ngắn: phần test infrastructure đã được kéo về trạng thái xanh. Dự án chưa nên gọi là “production hardening xong” vì vẫn còn rủi ro dependency audit, bundle lớn, mock/stub ở email/payment/shipping và thiếu integration test sâu cho inventory/checkout, nhưng file audit cũ đã không còn phản ánh đúng tình trạng hiện tại.

## 2. Môi Trường Audit

| Hạng mục | Giá trị |
| --- | --- |
| Ngày chạy | 2026-06-26 |
| Workspace | `C:\Users\Admin\Desktop\ggstu_2tuiminh_anti` |
| Package manager | `pnpm@11.1.1` qua `pnpm.cmd` |
| Stack | React 19, Vite 6, TypeScript 5.8, Prisma 6 |
| Database schema | PostgreSQL qua `DATABASE_URL` |
| Cache | Redis local |
| Product seed dùng cho e2e | `Tai nghe Bluetooth FitGo` / `tai-nghe-bluetooth-fitgo` |

## 3. Kết Quả Test Mới Nhất

| Hạng mục | Lệnh | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| TypeScript/lint | `pnpm.cmd -s lint` | PASS | Script hiện là `tsc --noEmit`. |
| Unit/component | `pnpm.cmd exec vitest run --config vitest.config.ts --reporter=verbose` | PASS | 2 test files, 6 tests. |
| Production build | `pnpm.cmd -s build` | PASS | Build xong, không còn cảnh báo chunk lớn. |
| Playwright full suite | `pnpm.cmd exec playwright test --reporter=list` | PASS | 24 passed trong Chromium, WebKit, Mobile Chrome, Mobile Safari. |
| Cart e2e riêng | `pnpm.cmd exec playwright test tests/cart.spec.ts --reporter=list` | PASS | 8 passed sau khi sửa selector/test id/toast/cart trigger. |
| Visual regression riêng | `pnpm.cmd exec playwright test tests/visual-regression.spec.ts --reporter=list` | PASS | 16 passed sau khi ổn định wait và snapshot baseline. |
| Dependency audit | `pnpm.cmd audit --json` | FAIL | 7 high, 22 moderate, 8 low, 0 critical. |

## 4. Các Mục Đã Sửa Từ Báo Cáo Cũ

### Vitest provider failure

Đã sửa lỗi thiếu provider bằng test utility mới:

- Thêm `src/shared/lib/test-utils/render-with-providers.tsx`.
- ProductCard test được bọc `QueryClientProvider` và `MemoryRouter`.
- AppShell test được bọc `QueryClientProvider`.
- Mock `EventSource` trong `src/shared/lib/test-setup.ts` để app shell không fail trong jsdom.
- Snapshot AppShell đã cập nhật theo markup hiện tại.

Kết quả hiện tại: PASS 2/2 file, 6/6 test.

### Playwright cart failure

Đã sửa các nguyên nhân khiến cart e2e fail:

- Đổi sản phẩm test từ dữ liệu cũ `Nến Thơm Đà Lạt` sang `Tai nghe Bluetooth FitGo`.
- Thêm `data-testid` ổn định cho product card: `product-card-{slug}`.
- Thêm `data-testid` ổn định cho nút add cart: `add-to-cart-{slug}`.
- Thêm `aria-label` rõ cho add-to-cart và wishlist button.
- Đổi cart trigger ở header thành button accessible, có `data-testid="cart-trigger"` và aria-label theo số sản phẩm.
- Cập nhật expectation toast và drawer title theo copy UI hiện tại.

Kết quả hiện tại: cart pass 8/8 trong full browser matrix.

### Playwright visual regression

Đã sửa visual test theo hướng ổn định thay vì chụp quá sớm hoặc dùng baseline sai:

- Homepage visual đợi `h1` render trước khi chụp.
- Search visual dùng query thật `Tai nghe Bluetooth FitGo` và đợi `product-card-tai-nghe-bluetooth-fitgo`.
- Homepage light/dark chuyển về viewport screenshot thay vì full-page để tránh WebKit dao động chiều cao do lazy sections.
- Regenerate baseline cho Chromium, WebKit, Mobile Chrome, Mobile Safari.
- Dọn lại `test-results/` và `playwright-report/` sau khi verify.

Kết quả hiện tại: visual regression pass 16/16.

### DB/env mismatch

Đã sửa cấu hình mặc định không còn gợi ý SQLite sai schema:

- `.env.example` dùng PostgreSQL sample: `postgresql://postgres:postgres@127.0.0.1:5432/ecommerce?schema=public`.
- `src/shared/config/env.ts` default `DATABASE_URL` đổi sang PostgreSQL sample tương ứng.

Local DB/cache đã được kiểm tra ở các lượt trước và không còn là nguyên nhân fail Playwright.

## 5. Build Và Bundle

Build mới nhất pass, Vite transform 4406 modules và build xong trong khoảng 34 giây. Cảnh báo chunk lớn sau minification đã được xử lý: build hiện không còn chunk nào vượt ngưỡng 500 kB và không còn circular chunk warning.

Các thay đổi tối ưu chính:

- Thêm `manualChunks` trong `vite.config.ts` để tách `react`, router, React Query, motion, icons, charts, forms, PDF runtime.
- Chuyển `html2canvas` và `jspdf` trong `src/shared/lib/receipt-pdf.ts` sang dynamic import, chỉ tải khi admin thật sự xuất PDF.
- Chuyển `maplibre-gl` trong tracking map sang load-on-demand bằng asset self-host trong `public/vendor/maplibre/`, không đóng gói thư viện bản đồ 1MB+ vào bundle và không phụ thuộc `unpkg` lúc runtime.
- Không gom `vendor-misc` quá rộng để tránh tạo chunk lớn và vòng phụ thuộc vendor.

Các chunk đáng chú ý ở build mới nhất:

| Chunk | Size | Gzip | Nhận xét |
| --- | ---: | ---: | --- |
| `vendor-jspdf-*.js` | 391.67 kB | 129.28 kB | Chỉ tải khi export PDF. |
| `vendor-charts-*.js` | 373.40 kB | 110.38 kB | Tách riêng cho dashboard/analytics. |
| `vendor-react-*.js` | 371.42 kB | 120.72 kB | Vendor nền tảng chính, dưới ngưỡng cảnh báo. |
| `vendor-html2canvas-*.js` | 202.38 kB | 48.04 kB | Chỉ tải khi export PDF. |
| `products-*.js` | 87.67 kB | 20.65 kB | Giảm mạnh từ khoảng 685 kB. |

MapLibre đã được self-host trong `public/vendor/maplibre/`. Nếu sau này muốn tối ưu thêm kích thước repository, có thể thay bằng CDN riêng có cache dài hạn, nhưng production hiện không còn phụ thuộc `unpkg` cho tracking map.

## 6. Dependency / Security Audit

Kết quả mới nhất từ `pnpm.cmd audit --json`:

| Severity | Số lượng |
| --- | ---: |
| Critical | 0 |
| High | 7 |
| Moderate | 22 |
| Low | 8 |

Nhóm package nổi bật:

- `ws`: đi qua `@google/genai` và Storybook stack.
- `protobufjs`: đi qua `@google/genai`.
- `hono`: đi qua MCP SDK/shadcn dependency chain.
- `vite`: advisory liên quan Windows/dev server.
- `undici`: đi qua `jsdom`/Vitest UI.
- `dompurify`: đi qua `jspdf`/`jspdf-autotable` optional dependency.

Khuyến nghị xử lý tiếp:

- Update `vite` lên bản patched khi tương thích.
- Update `@google/genai` hoặc cô lập phần AI/marketing để không kéo dependency rủi ro vào runtime không cần thiết.
- Kiểm tra `shadcn` có cần nằm trong production dependencies không; nếu chỉ dùng scaffold/CLI thì chuyển khỏi runtime path.
- Lazy import PDF/export để `jspdf`/`dompurify` không nằm trong customer bundle.

## 7. API / Production Risks

Các rủi ro còn đáng theo dõi:

- Vẫn có cả serverless handlers trong `api/...` và routers trong `src/server/...`, dễ drift contract giữa Vercel production và local Express.
- Rewrite notification/community cần tiếp tục giữ rõ vì community đã deferred nhưng API notification vẫn cần hoạt động.
- Nên thêm health endpoint kiểm tra DB/cache/env để admin thấy lỗi thật thay vì thông báo chung chung.
- Các API liên quan order/payment/inventory cần integration test với DB thật để khóa logic tồn kho.

## 8. Cart / Inventory / Checkout

Điểm tốt hiện tại:

- Cart store mới có hướng clamp số lượng theo tồn kho.
- Checkout đã được chỉnh theo hướng chỉ trừ kho khi COD hoặc khi bank transfer được xác nhận thanh toán.
- Có logic restore cart/tồn kho cho timeout/cancel theo hướng đúng.
- Cart e2e hiện đã pass với product seed thật.

Rủi ro còn lại:

- Vẫn còn cart store cũ tại `src/shared/store/cart-store.ts`; cần gom hoặc loại bỏ để tránh hai nguồn logic.
- Cần integration test chứng minh đủ các case: COD, bank transfer pending, bank transfer paid, cancel, timeout, admin cancel.
- Nếu order tạo thành công nhưng payment UI fail, cần test chắc chắn cart restore đúng và stock không bị trừ sai.

Checklist integration nên thêm:

- Bank transfer tạo order không trừ kho.
- Bank transfer xác nhận thanh toán mới trừ kho.
- User hủy thanh toán không trừ kho và sản phẩm còn trong giỏ.
- Payment timeout không trừ kho và restore cart.
- COD tạo order trừ kho.
- Admin hủy COD restore kho.
- User không thể add cart vượt tồn kho ở PDP và cart drawer.

## 9. Admin / Orders / Shipping

Điểm đã tốt hơn:

- Order detail có hướng hiển thị tracking COD, trạng thái và bằng chứng giao hàng.
- Admin order list có thao tác đổi trạng thái gần nút xem.

Rủi ro:

- Cần test order detail với object address để tránh React render object kiểu lỗi `Minified React error #31` tái phát.
- Lấy vị trí trên iPhone/browser có thể timeout; cần fallback tọa độ thủ công và message rõ.
- Shipping tracking thực tế vẫn cần provider/driver flow thật nếu muốn vận hành ngoài đời.
- Proof image có timestamp/location overlay cần test upload size, EXIF/privacy và storage lâu dài.

## 10. Marketing / Campaign / Banner

Điểm tốt:

- Hướng chia marketing thành tạo prompt và tạo ảnh là hợp lý.
- Campaign page/slug và banner overlay đã có nền tảng.
- Campaign quá hạn cần được tính theo thời gian thật, không chỉ theo status lưu trong DB.

Rủi ro:

- Banner overlay cần rule rõ: chỉ hiện campaign active trong `startAt/endAt`, có auto-close, không hiện lại quá dày sau khi user đóng.
- Image generation local/fallback không nên giả SVG nếu user kỳ vọng bitmap thật.
- Các API tạo ảnh nên trả lỗi có nguyên nhân rõ: thiếu key, provider không support image, hết quota, lỗi upload.

## 11. Theme / Dark Mode / Responsive

Palette Version 2 hiện là baseline chính:

- `--primary-bg: #E5D3BD`
- `--secondary-bg: #FBF8F5`
- `--accent-orange: #C75F4B`
- `--accent-green: #4A6D56`
- `--text-primary: #3C3C3C`

Visual regression hiện đã có coverage homepage light/dark, search grid và mobile homepage qua Chromium/WebKit/Mobile Chrome/Mobile Safari. Các vùng vẫn nên bổ sung visual test riêng:

- Login/register/admin login dark mode.
- Checkout/payment QR.
- Order detail/tracking.
- Inventory receipt modal iPhone 11.
- Admin product form SKU/attributes.

## 12. Encoding / Tiếng Việt

Báo cáo này đã được ghi lại UTF-8 sạch. Lưu ý quan trọng: PowerShell console trên máy đang dễ hiển thị mojibake khi `Get-Content`, nên không dùng output PowerShell làm bằng chứng duy nhất để kết luận file hỏng encoding.

Vẫn cần phân biệt 2 loại lỗi:

- UI hiện literal kiểu `\u0110\u1ecaA...`: thường là dữ liệu JSON/string bị double-escaped hoặc render raw string.
- PowerShell có thể hiện chữ Việt sai do console codepage/display, cần xác minh bằng Node/VS Code UTF-8.

Khuyến nghị:

- Với markdown/report/source, ghi bằng UTF-8 và verify bằng Node.
- Với order address/tracking labels, thêm utility decode/sanitize nếu API trả string escaped.
- Không render object address trực tiếp trong React; luôn format thành chuỗi người đọc được.

## 13. Mock / Stub / Non-real Integrations

Các vùng còn mock/stub cần thay thế trước production thật:

- `src/server/services/email-service.ts`
- `src/server/adapters/payment-orchestrator.ts`
- `src/server/adapters/shipping-orchestrator.ts`
- `src/entities/shipping/lib/shipping-engine.ts`

Tác động:

- Tracking có thể chưa phản ánh trạng thái vận chuyển thật.
- Thanh toán chưa có đối soát ngân hàng tự động thật nếu không tích hợp webhook/provider.
- Email/SMS notification chưa đảm bảo đến khách.

## 14. Điểm Vượt Trội Hiện Có

- Scope ecommerce đã khá đầy đủ: catalog, PDP, cart, checkout, admin inventory, admin orders, campaign, blog/trust pages, SEO foundation.
- Đã chuyển trọng tâm khỏi community/social sang ecommerce premium đúng hướng.
- Có tư duy đúng về tồn kho: không trừ kho trước khi payment/COD hợp lệ.
- Có nền tảng cho campaign banner overlay và prompt generation.
- Có design palette riêng, khác biệt và nhận diện được.
- Test gate local hiện đã xanh, đây là nền tốt hơn nhiều so với trạng thái audit cũ.

## 15. Action Plan Cập Nhật

### P0 - Đã xử lý trong lượt này

- Giảm bundle/chunk size: không còn chunk >500 kB, product chunk giảm từ khoảng 685 kB xuống khoảng 88 kB.
- Tách PDF/export và map tracking khỏi bundle tải sẵn.
- Giảm burst query ở product API để tránh Prisma `P2024` connection pool timeout khi chạy nhiều browser.
- Sửa Vitest wrapper với Router + QueryClientProvider.
- Sửa mock EventSource trong test setup.
- Sửa cart e2e không hardcode `Nến Thơm Đà Lạt`.
- Thêm test id/aria-label ổn định cho product card, add-to-cart, cart trigger.
- Sửa visual regression baseline và timing.
- Sửa `.env.example`/env default sang PostgreSQL.
- Verify lại lint, unit, build, Playwright full suite.

### P0 - Còn nên làm trước deploy tin cậy hơn

- Viết integration test cho checkout/inventory commit/restore.
- Gỡ hoặc gom cart store cũ để tránh logic lệch.
- Thêm health endpoint DB/cache/env cho admin.
- Test admin order detail với address object và tracking payload thật.

### P1 - Production mượt hơn

- Tách bundle admin/chart/pdf/map/AI khỏi customer bundle.
- Chuẩn hóa notification API, tránh drift giữa community rewrite và user notification.
- Bổ sung visual test cho auth/admin/checkout/order detail/inventory modal.
- Sửa campaign status theo `startAt/endAt` thời gian thật và overlay cooldown.

### P2 - Hardening dài hạn

- Cập nhật dependency để giảm advisory high/moderate.
- Thêm accessibility checks cho header, search, checkout, order detail.
- Thay mock shipping/payment/email bằng provider interface có trạng thái rõ ràng.
- Thêm monitoring/logging production cho API lỗi 401/404/413/500.

## 16. Verdict

Dự án hiện đã vượt qua audit test gate local: lint PASS, Vitest PASS, build PASS, Playwright PASS 24/24. Trạng thái nên được nâng từ `amber / test gate chưa sạch` lên `amber-green / test gate sạch, còn production hardening`.

Điểm chưa cho lên green hoàn toàn là dependency audit còn advisory, bundle vẫn lớn, và một số integration trọng yếu như payment/shipping/email vẫn cần provider thật hoặc integration test mạnh hơn.
