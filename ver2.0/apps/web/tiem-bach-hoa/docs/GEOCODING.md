OpenCage Geocoding setup (recommended temporary solution)

Overview
- This repo adds a tiny serverless proxy at `/api/geocode-opencage` to call OpenCage Geocoding API.
- The proxy hides your API key and avoids CORS issues when calling geocoding from browsers.

Steps to configure
1. Register for an OpenCage API key: https://opencagedata.com/
2. Deployment options

- Option A — Serverless host (Vercel / Netlify / Cloud Functions):
   - Set environment variable `OPENCAGE_API_KEY` in your host's project settings (Vercel: Project Settings → Environment Variables).
   - Deploy the serverless file at `api/geocode-opencage.js` (this repo already includes a Node serverless example).

- Option B — Traditional PHP hosting (byethost, cPanel, shared hosting):
   - If your host doesn't run serverless Node functions, use the included PHP proxy instead: `api/geocode-opencage.php` (added to the repo).
   - Upload both `api/geocode-opencage.php` and an `api/opencage.key` file to your hosting account under your site's `public_html/api/` folder.
   - Put your OpenCage key in the file `opencage.key` (just the key, no newline requirements beyond normal).
   - Ensure PHP `cURL` is enabled on the host (most shared hosts provide this by default).

3. Run / test locally (Node serverless or without serverless):

```cmd
:: If using the Node serverless function locally (requires a dev server that supports serverless functions):
set OPENCAGE_API_KEY=your_key_here
npm run dev

:: If testing the PHP proxy locally using a local PHP server (for quick debug):
php -S localhost:8080 -t .
:: then open http://localhost:8080/api/geocode-opencage.php?address=Ho%20Chi%20Minh
```

How it works
- Frontend calls `/api/geocode-opencage?address=...`.
- The serverless function calls OpenCage and returns `{ lat, lng, raw }` JSON on success.
- If the proxy fails, frontend falls back to opening Google Maps and prompting admin to paste coordinates manually.

Byethost-specific notes
- Byethost is primarily a shared/PHP hosting provider and usually serves files under `public_html`.
- Make sure you place `geocode-opencage.php` under `public_html/api/` so the URL becomes `https://yourdomain.example/api/geocode-opencage.php`.
- If your host serves the PHP file as plain text (shows source in browser), PHP is not enabled for that path — contact host support or use a different host (Vercel/Netlify recommended).
- To test quickly from your machine, after uploading, open in browser:

```
https://yourdomain.example/api/geocode-opencage.php?address=Ho%20Chi%20Minh
```

If it returns JSON like `{"lat":10.7,"lng":106.6,...}` then the proxy works and your frontend can call `/api/geocode-opencage.php?address=...`.

Secure key placement (recommended for shared/PHP hosts)
- Best: place `opencage.key` outside the webroot (outside `public_html`). Example: if your site files are in `/home/youruser/public_html/`, put the key in `/home/youruser/opencage.key` and update `api/geocode-opencage.php` to check parent folders (the proxy already checks common locations).
- If you must keep `opencage.key` under `public_html/api/`, add the included `.htaccess` (we added `api/.htaccess`) which denies HTTP access to `*.key` files.
- Set file permissions so only the owner can read it (if your host allows SSH):

```bash
chmod 600 /home/youruser/public_html/api/opencage.key
```

- If your host provides environment variables/secrets (e.g., some panels allow adding env vars), prefer setting `OPENCAGE_API_KEY` there — the PHP proxy will use it first.

How to upload safely (byethost / cPanel / FTP)
1. Use the hosting Control Panel File Manager to place `geocode-opencage.php` under `public_html/api/`.
2. Upload `opencage.key`:

Option A — File Manager (cPanel / byethost panel):
- In the hosting panel open File Manager.
- Prefer placing the key outside the webroot (e.g., `/home/youruser/opencage.key`). If you cannot, upload to `/public_html/api/opencage.key` and ensure `api/.htaccess` is present.
- If your panel supports changing file permissions, set the key file to `600` (owner read/write only).

Option B — FTP / SFTP / FileZilla:
- Connect to your host using FTP or SFTP (SFTP is preferred when available).
- Upload `opencage.key` to the server. Prefer a path outside `public_html` (e.g., `/home/youruser/opencage.key`). If only `public_html` is available, upload to `/public_html/api/opencage.key`.
- If you placed the key under `public_html/api/`, make sure `api/.htaccess` is uploaded as well.

Option C — SSH (if available):
- Upload the key via SFTP or `scp` to `/home/youruser/opencage.key`.
- Run:

```bash
chmod 600 /home/youruser/opencage.key
```

3. Final checks and testing
- Open in browser (replace yourdomain):

```
https://yourdomain.example/api/geocode-opencage.php?address=Ho%20Chi%20Minh
```

- Expected response: JSON with `lat` and `lng`.
- If you get raw PHP source in response, the host is not executing PHP for that path — contact host support or move to another host.

If you want, tôi có thể tạo một checklist từng bước (File Manager hoặc FTP) để bạn copy/paste khi upload lên byethost.

Switching to Google Geocoding later
- Google Geocoding requires an API key too. Best practice: implement a similar server-side proxy and keep the API key secret.
- If you call Google Geocoding directly from the client, restrict the API key to your domain (HTTP referrers) to reduce abuse risk.

Security notes
- Do not commit your OpenCage or Google API keys to the repo.
- Prefer serverless proxy to hide keys and avoid CORS problems.

If you want, I can scaffold a Cloud Function example for Google Geocoding as well.
