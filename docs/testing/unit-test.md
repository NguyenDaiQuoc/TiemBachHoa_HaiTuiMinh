# Unit Test Report

Date: 2026-07-04
Project: Hai Tui Minh ecommerce platform

## Purpose

This file records the automated unit test coverage currently available in the repository, how to run it, and the production risks it is intended to catch.

## Commands

```bash
pnpm test:unit
```

Equivalent direct command:

```bash
pnpm vitest run
```

Update snapshots only when the rendered UI intentionally changes:

```bash
pnpm vitest run -u
```

## Current Result

Last local run:

```text
Test Files  5 passed (5)
Tests       20 passed (20)
```

After expanding pure business-rule coverage, latest local run:

```text
Test Files  10 passed (10)
Tests       36 passed (36)
```

Snapshot note: one existing app-shell snapshot was intentionally updated first because the current header/profile shell UI had changed. After that update, `pnpm test:unit` was rerun and passed cleanly.

Additional local gates:

```text
pnpm lint   passed
pnpm build  passed
```

## E2E Smoke

Command run:

```bash
pnpm exec playwright test tests/cart.spec.ts --project=chromium
```

Result:

```text
2 passed
```

The cart smoke test mocks product/category API responses so it can validate add-to-cart and cart drawer behavior without requiring local PostgreSQL.

## Full E2E Environment Note

The broader non-mocked Playwright suite still requires a local database. Earlier full e2e execution was blocked by local environment, not by application assertions.

```text
Can't reach database server at 127.0.0.1:5432
```

Docker startup was attempted:

```bash
docker compose up -d db cache
```

Docker could not start because the Docker Desktop Linux engine was not running:

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

To run Playwright locally, start Docker Desktop first, then run:

```bash
docker compose up -d db cache
pnpm db:push
pnpm db:seed
pnpm test:e2e
```

## Unit Test Files

| File | Area | Coverage |
| --- | --- | --- |
| `src/entities/cart/model/store.test.ts` | Cart store | Add item, reject out-of-stock products, cap quantity by stock, restore cancelled/timed-out order items, merge restored items, total item/price calculation |
| `src/entities/product/api/product-service.test.ts` | Product API client | Product detail response handling, null fallback for failed detail API, search query encoding/limit, malformed list payload fallback, filtered query param building |
| `src/pages/profile/lib/password-policy.test.ts` | Password policy | 8-32 character rule, uppercase requirement, number requirement, special character requirement, strength-meter metadata |
| `src/entities/user/lib/loyalty.test.ts` | Loyalty/membership | Point-to-spend conversion, savings estimate, tier boundary selection, progress-to-next-tier calculation, top-tier handling |
| `src/entities/product/lib/warranty.test.ts` | Warranty tags | Warranty option list, tag generation/detection, label extraction, replacing/removing warranty tags |
| `src/entities/order/lib/order-utils.test.ts` | Order utilities | Order ID format, bank-transfer content format with compact customer name and fixed date |
| `src/entities/shipping/lib/shipping-engine.test.ts` | Shipping engine | Shipping method list, base price and weight surcharge, arrival estimate, normalized tracking aggregator response |
| `src/entities/product/lib/product-url.test.ts` | Product URL | Slug-first PDP URLs, encoded ID fallback when slug is missing |
| `src/entities/product/ui/product-card.test.tsx` | Product card UI | Product text/price/category/new badge rendering, add-to-cart button rendering |
| `src/app/app-shell.test.tsx` | App shell | Shared header/footer on profile route, route-change focus restoration, dark theme preservation, shell snapshot |

## Critical Assertions

### Cart

- Product with `stock <= 0` must not enter cart.
- Repeated add-to-cart cannot exceed available stock.
- Manual quantity updates are clamped to available stock.
- Cancelled or timed-out order items can be restored to cart without exceeding stock.
- Restored duplicate products merge into one cart line.
- `totalItems()` and `totalPrice()` reflect the current cart state.

### Product API Client

- PDP detail fetch returns `null` instead of throwing when the product detail API fails.
- Product list/search functions return `[]` instead of throwing when API payload shape is invalid.
- Search query is URL-encoded and respects `limit`.
- Filtered product query only sends defined filter values.

### Password Security

- Valid password: 8-32 characters, at least 1 uppercase letter, 1 number, and 1 special character.
- Invalid password examples: too short, too long, missing uppercase, missing number, missing special character.
- Strength meter labels and score come from the same policy helper as validation.

### Loyalty, Warranty, Shipping, URL

- Loyalty tier thresholds are locked at the current boundary values.
- Warranty options include the requested short and long warranty terms through 24 months.
- Warranty tag replacement preserves non-warranty tags and removes stale warranty tags.
- Bank transfer content keeps the order ID, compact uppercase customer name, and `DDMMYYYY` date.
- Shipping price uses base price plus surcharge only above 1kg.
- PDP URLs prefer product slug and only fall back to encoded ID when slug is unavailable.

### App Shell

- Header, footer, and profile content render together.
- Main landmark receives focus after route changes.
- Dark theme is preserved by the theme wrapper.
- Snapshot captures the current dark-mode profile shell.

## Known Gaps

These are not fully covered by unit tests yet and should be covered by integration/e2e tests:

- Auth token refresh and 401 recovery.
- Admin order status transitions.
- Payment confirmation and inventory reservation/release with real backend state.
- Shipping provider tracking adapters.
- Marketing campaign lifecycle and banner overlay runtime behavior.
- Voucher eligibility, birthday benefit lock, and membership tier calculations.
- Image generation provider API failures.

## Recommended CI Gates

Minimum merge gate:

```bash
pnpm lint
pnpm test:unit
pnpm build
```

Full release gate when the database/test server is available:

```bash
pnpm lint
pnpm test:unit
pnpm build
pnpm test:e2e
```
