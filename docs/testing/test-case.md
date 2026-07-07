# Full Test Case Matrix

Date: 2026-07-04
Project: Hai Tui Minh ecommerce platform

## Test Scope

This matrix covers the current storefront, profile, checkout, admin, marketing, tracking, responsive, dark mode, and operational flows. It combines automated coverage targets with manual QA cases that should be executed before production releases.

## Test Data

Recommended accounts:

| Role | Email | Purpose |
| --- | --- | --- |
| Customer | `user@haituiminh.com` | Cart, checkout, orders, wishlist, voucher, profile |
| Admin | Existing admin account | Product, inventory, order, marketing, voucher, notification management |

Recommended products:

| Product | Purpose |
| --- | --- |
| `Tai nghe Bluetooth FitGo` | Search, PDP, cart, checkout, order history |
| Product with stock `0` | Out-of-stock behavior |
| Product with multiple images/SKU variants | Gallery, SKU, quantity, PDP zoom |
| Product in `Công nghệ` category with brand/subcategory | Category and subcategory filtering |

## P0 Release Blockers

### Auth

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| AUTH-001 | Customer login succeeds | Open `/login`, enter valid customer credentials, submit | User lands in customer area or previous intended page, auth state persists after refresh |
| AUTH-002 | Admin login succeeds | Open `/admin/login`, enter valid admin credentials, submit | Admin dashboard loads, admin APIs return 200 |
| AUTH-003 | Invalid login is handled | Submit wrong password | Clear error appears, no blank page, no malformed data crash |
| AUTH-004 | Logout route works | Login then click logout | Session clears, protected pages redirect to login, no `/api/auth/logout` 404 |
| AUTH-005 | Dark mode login readability | Enable dark mode, open `/login`, `/register`, `/admin/login` | Inputs, labels, placeholders, buttons, and errors are readable |

### Product Discovery

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| PROD-001 | Product listing loads | Open `/products` | Product cards render, no console crash, no horizontal overflow on mobile |
| PROD-002 | Search known product | Search `Tai nghe Bluetooth FitGo` | Matching product appears, product count is sensible |
| PROD-003 | Product detail by slug | Click product image/name | PDP opens with product slug in address bar, no product ID-only URL |
| PROD-004 | Missing product detail | Open invalid product slug | User sees graceful not-found/empty state, no React crash |
| PROD-005 | Category navigation | Click header category/dropdown/featured category | Product list filters by category, not by plain text search label |
| PROD-006 | Category and subcategory filtering | Select `Công nghệ` then brand/subcategory such as `Baseus` | Only matching subcategories/brands display and filter results |
| PROD-007 | Out-of-stock product | Open product with stock `0` | Add-to-cart/buy-now is disabled or clear sold-out state appears |

### Cart

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| CART-001 | Add item from PDP | Open PDP, choose quantity, click add to cart | Fly-to-cart animation plays, user stays on PDP, cart count increases |
| CART-002 | Add item from product card | Hover product card, click add/buy action | Product enters cart and cart count updates |
| CART-003 | Cart drawer stacking | Click cart icon while header is sticky | Cart drawer and backdrop appear above header and floating buttons |
| CART-004 | Quantity cannot exceed stock | Try to add more than available stock | Quantity is capped, user receives understandable feedback |
| CART-005 | Remove item | Open cart, remove item | Item disappears, totals update |
| CART-006 | Cart persists refresh | Add item, hard refresh | Cart items remain unless explicitly cleared |

### Checkout And Payment

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| PAY-001 | Checkout summary accuracy | Put 4 distinct cart lines in cart, open checkout | Summary shows all 4 lines, subtotal/shipping/total are correct |
| PAY-002 | Bank transfer QR | Select bank transfer | Left panel shows bank/account/order info, right panel shows scannable VietQR only |
| PAY-003 | MoMo/ZaloPay/VNPAY selection | Select each supported method | UI does not show COD or wrong bank placeholder for wallet/payment-gateway methods |
| PAY-004 | Cancel payment | Start bank transfer, click cancel | User returns to cart/previous page, items remain in cart, stock is not reduced |
| PAY-005 | Payment timeout | Start transfer and wait until timeout | Order does not become paid, items are restored, stock is not reduced |
| PAY-006 | COD order | Place COD order | Order is created and inventory handling follows COD rule |
| PAY-007 | Paid transfer confirmation | Confirm payment/check payment | Order becomes paid only after confirmation, stock is reduced once |
| PAY-008 | Email invoice | Place successful order | Customer receives order confirmation email with invoice details |

### Inventory And Order State

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| ORD-001 | Admin order list | Open `/admin/orders` | Orders load without 401 for valid admin session |
| ORD-002 | Admin order detail | Click view detail | Modal/page opens, shipping address and payment method render as text, no object rendering crash |
| ORD-003 | Quick status actions | Click confirm/cancel near view button | Status updates, UI refreshes, notification/email behavior is triggered if configured |
| ORD-004 | Cancel order restores stock | Cancel unpaid order from admin/user | Inventory is not reduced or is restored exactly once |
| ORD-005 | User order history | Login as customer with known orders, open `/profile/orders` | User sees all own orders including cancelled orders, not other users' orders |
| ORD-006 | Buy again | Open order detail, click buy again for product | Product is restored to cart respecting current stock |

### Shipping And Tracking

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| TRK-001 | User tracking detail button | Open tracking page/order history, click detail | Detail opens and uses real order data |
| TRK-002 | Self-delivery checkpoint | Admin/shipper adds checkpoint with manual coordinate | Server reverse-geocodes coordinate, tracking timeline shows Vietnamese status/address |
| TRK-003 | GPS timeout fallback | Deny/timeout GPS | UI explains manual coordinate fallback without blank/loading forever |
| TRK-004 | External carrier code | Admin selects GHN/GHTK/ViettelPost/SPX and enters tracking code | User tracking renders carrier status from configured adapter or clear "not configured" state |
| TRK-005 | Map rendering | Open tracking with self-delivery order | Map renders route/checkpoints from warehouse/address data without layout overflow |

## P1 Business Logic

### Profile, Voucher, Membership

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| PROF-001 | Wishlist persistence | Click heart on product, open `/profile/wishlist` | Product appears in wishlist after refresh |
| PROF-002 | Voucher notification deep link | Click new-member voucher notification | Opens voucher page/detail, not generic settings |
| PROF-003 | Voucher list | Open `/profile/vouchers` | Available/used/expired vouchers display correctly |
| PROF-004 | Birthday entry lock | Enter birthday month/date once | Save succeeds once with warning; later edits are blocked or require admin |
| PROF-005 | Birthday discount eligibility | During birthday month, place eligible order | Discount applies by membership tier only once per allowed policy |
| PROF-006 | Spending/points history | Open point history | Shows completed paid orders, excludes cancelled orders |
| PROF-007 | Password strength | Type weak/strong passwords | Strength meter updates live; submit enables only when new and confirm match |
| PROF-008 | Loyalty tier boundary | Use users at 49, 50, 199, 200, 499, 500 points | Membership tier and progress display match boundary rules |
| PROF-009 | Warranty tag display | Open products with 1 day, 1 month, 12 month, 24 month warranty tags | Warranty label is visible on PDP/card where supported |

### Admin Product And Inventory

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| ADM-PROD-001 | Create product | Admin creates product with category, subcategory, brand, SKU, images | Product appears in admin and storefront |
| ADM-PROD-002 | Edit product category | Edit existing product and choose category | Existing categories show, slug remains consistent with product name |
| ADM-PROD-003 | SKU attributes | Add SKU attributes like color/size/scent | UI filters SKU choices like marketplace variant selection |
| ADM-PROD-004 | Multi-image gallery | Upload multiple product images | PDP thumbnail/gallery and zoom use all images |
| ADM-PROD-005 | Warranty option | Set warranty to each supported value | Product saves one warranty tag only and storefront shows the selected value |
| ADM-INV-001 | Receipt form mobile | Open receipt form on iPhone 11 viewport | Date input, table columns, product/category columns do not overlap |
| ADM-INV-002 | Receipt SKU line | Add receipt line with SKU attributes and image | Quantity updates correctly and SKU image persists |
| ADM-INV-003 | Third-party supplier mode | Add supplier/drop-ship product not held in inventory | Product can sell without counting as on-hand stock until order is fulfilled |

### Marketing

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| MKT-001 | Create campaign | Admin creates campaign with slug, product selection, start/end | Save returns 200, route `/campaign-slug` works |
| MKT-002 | Expired campaign | Campaign end date is in past | Status shows expired, not active |
| MKT-003 | Active overlay | Campaign is active and configured as promotion/banner | Banner overlay covers viewport and can auto-close |
| MKT-004 | AI prompt mode | Enter brief and generate prompt | Complete prompt is generated and can be copied |
| MKT-005 | AI image mode not configured | Try provider without key/billing | Clear configuration error, no fake SVG passed as real image |
| MKT-006 | Upload banner image | Upload generated image to campaign | Banner URL stores and storefront renders image |

## P2 UX, Accessibility, Responsive

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UX-001 | Responsive public routes | Test `/`, `/products`, `/search`, PDP, `/cart`, `/checkout`, `/tracking`, `/blog`, `/collections` at 360, 414, 768, 1366, 1920 | No horizontal page overflow, no clipped essential text/buttons |
| UX-002 | Sticky header | Scroll down on mobile and desktop | Header stays visible and does not reveal text underneath awkwardly |
| UX-003 | Cart drawer z-index | Open cart after scrolling | Drawer overlays header/backdrop correctly |
| UX-004 | Dark mode contrast | Toggle dark mode across public/profile/admin login pages | No unreadable gray-on-dark input/text regions |
| UX-005 | Keyboard navigation | Tab through login, header, cart, checkout | Focus states visible, focus order logical |
| UX-006 | Product image zoom | Hover/move over PDP image | Zoom remains stable and navigation arrows remain reachable |
| UX-007 | Banner overlay close | Show campaign banner and hover/click close X | Pointer cursor appears, X is large enough, overlay closes |
| UX-008 | Sold count text | Product with sold count `0` | Displays `Đã bán 0` or hides according to design, not a lone `0` |

## Automation Mapping

| Priority | Automate With | Cases |
| --- | --- | --- |
| Unit | Vitest | Cart, product API client, password policy, pure price/loyalty/voucher helpers |
| Component | Testing Library | Header/cart drawer, checkout summary, product card, profile security tab |
| E2E | Playwright | Login, product search/PDP, cart, checkout, order history, admin order status, responsive smoke |
| Manual | QA checklist | Payment provider sandbox, carrier adapters, email delivery, real GPS permission behavior |

## Release Checklist

Run before production deployment:

```bash
pnpm lint
pnpm test:unit
pnpm build
```

Run cart smoke without local database:

```bash
pnpm exec playwright test tests/cart.spec.ts --project=chromium
```

Run when local DB/server is available:

```bash
pnpm test:e2e
```

Manual smoke after deploy:

- Open `https://haituiminh.vercel.app`.
- Hard refresh on mobile and desktop.
- Search `Tai nghe Bluetooth FitGo`.
- Open PDP, add quantity `2`, open cart.
- Checkout with bank transfer and cancel payment.
- Login customer, check `/profile/orders`, `/profile/wishlist`, `/profile/vouchers`.
- Login admin, open orders, view detail, confirm/cancel test order.
- Check tracking page for one COD/self-delivery and one carrier order.
