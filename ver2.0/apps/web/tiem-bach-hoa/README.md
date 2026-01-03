# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    # Tiệm Bách Hóa — Hai Tụi Mình (Frontend)

    This repository contains the React + TypeScript storefront and admin UI for Tiệm Bách Hóa Hai Tụi Mình, built with Vite.

    This README documents setup, common commands, and recent fixes related to accessibility, Firestore connectivity, order tracking, and mapping.

    ---

    ## Quick Start

    Requirements
    - Node.js 18+ (recommended)
    - npm 9+ (or yarn)

    Install dependencies

    ```cmd
    cd /d C:\Users\Admin\Desktop\coding\TiemBachHoa_HaiTuiMinh\ver2.0\apps\web\tiem-bach-hoa
    npm install --no-audit --no-fund
    ```

    Start development server

    ```cmd
    npm run dev
    ```

    Build for production

    ```cmd
    npm run build
    ```

    Preview production build

    ```cmd
    npm run preview
    ```

    ---

    ## Project Layout (high level)
    - `src/` — React app source code
    - `src/pages` — Page components (Product, Cart, Checkout, Order, Admin pages)
    - `src/components` — Reusable UI components
    - `css/` — Page-level styles (legacy plain CSS)
    - `public/` — Static assets

    ---

    ## Recent Fixes (applied during this session)

    - Accessibility
      - Added `autoComplete` attributes where missing (notably admin login) so browsers/password managers correctly suggest credentials.

    - Firestore connectivity
      - Added `src/utils/firestoreErrors.ts` which inspects Firestore errors for common client-side blocking (e.g., `ERR_BLOCKED_BY_CLIENT`) and shows a helpful toast recommending disabling adblock/whitelist the site.
      - This helps users diagnosing blocked realtime connections when onSnapshot requests fail.

    - Order tracking
      - `OrderConfirm` now sends the user directly to `/order-tracking?orderId=...` when clicking "Theo Dõi Đơn Hàng".
      - `OrderTracking` timeline now consumes real tracking events (timestamps) when available rather than static placeholder dates.
      - Order detail view shows product thumbnails if the order items include image fields.
      - Map rendering uses `CircleMarker` for reliable visibility and draws the route polyline based on recorded points; shipping location is shown as a distinct marker.

    ---

    ## Troubleshooting

    1) Firestore requests fail with `ERR_BLOCKED_BY_CLIENT`

    - Cause: browser extensions (adblockers) frequently block network calls to `firestore.googleapis.com` and similar endpoints.
    - Fix: disable adblock/whitelist the site for affected users. The app now shows a toast explaining this condition.

    2) Leaflet markers invisible in production

    - Cause: Leaflet default marker icons are image assets and may require explicit import in some bundlers (Vite). If default icons are invisible, we render `CircleMarker` as fallback.
    - Fix: to restore default markers, add the following initialization (example) into `src/main.tsx` or a top-level module:

    ```ts
    import L from 'leaflet';
    import iconUrl from 'leaflet/dist/images/marker-icon.png';
    import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
    import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

    L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
    ```

    3) CSS build errors (PostCSS parse error)

    - If `vite build` fails with a PostCSS parse error pointing to a CSS file line/column, open the file and check for mismatched braces or malformed `@media` blocks. I fixed one such issue in `css/blogdetail.css` earlier.

    ---


