# Practical Troubleshooting & Debugging Guide

This guide provides practical diagnoses and solutions for the most common errors encountered during development, deployment, and live demonstrations.

---

## 1. Backend / API Issues

### Problem 1: Render Cold Start Timeout (HTTP 502 or 30-Second Hang)
* **Symptom**: The first request to the deployed Render backend takes 30-50 seconds or occasionally returns `502 Bad Gateway`.
* **Root Cause**: On the free tier, Render automatically spins down services after 15 minutes of zero inbound traffic.
* **Fix**:
  1. Ping `GET /api/health` 2 minutes before demonstrating to your senior developer.
  2. For automated uptime, configure a free monitoring cron (e.g. UptimeRobot or Cron-Job.org) to ping `/api/health` every 10 minutes.

---

### Problem 2: CORS Error in Browser Console (`Access to fetch at ... has been blocked by CORS policy`)
* **Symptom**: Browser network inspector displays a failed request with `Cross-Origin Request Blocked`.
* **Root Cause**: The backend's `CORS_ORIGIN` environment variable does not include the exact origin sending the request (e.g. `http://localhost:5173` vs `https://your-frontend.vercel.app`).
* **Fix**:
  1. In `apps/server/src/config/index.ts`, check `config.corsOrigin`.
  2. Set `CORS_ORIGIN=*` during development, or provide a comma-separated list:
     `CORS_ORIGIN=http://localhost:5173,https://synced-platform.vercel.app`
  3. Note: If credentials (`Authorization` headers or cookies) are sent, browsers disallow `*` unless configured explicitly; our Express configuration handles comma-separated origin arrays cleanly.

---

### Problem 3: `401 UNAUTHORIZED: Access token is invalid, expired, or revoked`
* **Symptom**: Calling `PATCH /api/v1/profile/me` fails with HTTP 401.
* **Root Cause**: The Supabase JWT access token has expired (default lifetime is 3600 seconds = 1 hour) or the `SUPABASE_JWT_SECRET` / `SUPABASE_ANON_KEY` is mismatched between frontend and backend.
* **Fix**:
  1. Copy the token string from browser localStorage (`sb-<ref>-auth-token`).
  2. Inspect it on [jwt.io](https://jwt.io) to check the `exp` (expiration) timestamp.
  3. Call `supabase.auth.getSession()` on the frontend; Supabase automatically refreshes expired tokens using the `refresh_token`.

---

## 2. Mobile WebView & Android Issues

### Problem 4: `net::ERR_CLEARTEXT_NOT_PERMITTED` inside Android WebView
* **Symptom**: The Android WebView screen is blank and reports a cleartext error.
* **Root Cause**: Starting with Android 9 (API level 28), cleartext HTTP (`http://...`) is disabled by default for security. Android requires HTTPS.
* **Fix**:
  1. Always use HTTPS URLs for remote endpoints (`https://...`).
  2. If testing against a local Wi-Fi development server (`http://192.168.x.x:5173`), add `android:usesCleartextTraffic="true"` to `android/app/src/main/AndroidManifest.xml` during development.

---

### Problem 5: Google OAuth `403 disallowed_useragent`
* **Symptom**: Clicking "Sign in with Google" inside the mobile app displays a Google 403 error page.
* **Root Cause**: Google detects the embedded Android WebView User Agent (`wv`) and blocks login to prevent clickjacking.
* **Fix**:
  * In `apps/mobile/App.tsx`, we pass a standard mobile Chrome browser User Agent:
    `userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"`
  * This bypasses the embedded user-agent filter and allows Google OAuth to complete.

---

## 3. Database & Trigger Issues

### Problem 6: `updated_at` Column Not Updating on Mutation
* **Symptom**: Profile row updates, but `updated_at` retains the old timestamp.
* **Root Cause**: The PostgreSQL trigger is either missing or was created as an `AFTER UPDATE` rather than `BEFORE UPDATE`.
* **Fix**:
  * Run the following query in the Supabase SQL editor:
  ```sql
  SELECT tgname, tgenabled, tgtype FROM pg_trigger WHERE tgname = 'trigger_profiles_updated_at';
  ```
  * Verify the trigger is `BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();`.

---

### Problem 7: Infinite Recursion in Database Triggers
* **Symptom**: Database query times out or returns `stack depth limit exceeded`.
* **Root Cause**: An `AFTER UPDATE` trigger executing an `UPDATE` on the same table without condition checks, causing an infinite loop.
* **Fix**:
  * Always use `BEFORE UPDATE` when modifying `NEW.column` in the same table, so no secondary `UPDATE` query is dispatched!
