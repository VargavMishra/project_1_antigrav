# Deployment Guide, Cloud Hosting & APK Distribution

This guide details the step-by-step procedure to deploy the entire full-stack system to remotely hosted, publicly accessible HTTPS infrastructure.

---

## 1. Cloud Hosting Providers & Free-Tier Architecture

To meet the requirement for a real, remotely accessible demonstration without incurring infrastructure expenses, we use standard production-grade free-tier providers:

| Component | Provider | Configuration | Free-Tier Details & Limitations |
| :--- | :--- | :--- | :--- |
| **Database & Auth** | **Supabase** | Managed PostgreSQL 15 | 500MB DB storage, 50,000 monthly active auth users. Pauses after 7 days of inactivity (unpause takes 1 min). |
| **Backend API** | **Render** | Web Service (Node.js) | 512MB RAM, 0.1 CPU. **Sleeps after 15 mins of inactivity**; first incoming request takes ~30-50 seconds to cold-start. |
| **Frontend Web** | **Vercel / Render** | Static Site (Vite React) | 100GB bandwidth/month, Global Edge CDN, automated HTTPS with custom domain support. Always warm. |
| **Mobile App APK** | **Expo / EAS** | Android Standalone APK | Free EAS Build credits allow compiling `.apk` in the cloud without local Android Studio SDK. |

> [!WARNING]
> **Render Cold Start Warning**:
> Free-tier Render web services spin down to zero instances when idle for 15 minutes. During your live demonstration with a senior developer, send a quick `GET /api/health` request from your browser 2 minutes before the presentation to wake up the server so your demo experiences zero latency!

---

## 2. Step 1: Database & Auth Setup (Supabase)

1. Create an account at [supabase.com](https://supabase.com).
2. Create a new project (e.g. `synced-platform-prod`). Note your database password securely.
3. Open the **SQL Editor** in the Supabase dashboard.
4. Copy the entire contents of [`supabase/migrations/20261018000001_initial_schema.sql`](file:///c:/Users/Rentorzo/Documents/antigravity/valiant-bose/supabase/migrations/20261018000001_initial_schema.sql).
5. Paste into the SQL editor and click **Run**.
6. Verify in **Table Editor** that `profiles` and `profile_audit_logs` exist.
7. Retrieve your API keys from **Project Settings -> API**:
   * `Project URL` (e.g. `https://xyzcompany.supabase.co`)
   * `anon` (public key)
   * `service_role` (secret key)
   * `JWT Secret` (from JWT Settings)

---

## 3. Step 2: Backend API Deployment (Render)

1. Push your repository to GitHub (see Section 6).
2. Go to [render.com](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   * **Root Directory**: `apps/server` (or repository root)
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
   * **Environment**: `Node`
5. Under **Environment Variables**, add:
   * `PORT`: `5000`
   * `NODE_ENV`: `production`
   * `CORS_ORIGIN`: `*` (or your deployed frontend URL)
   * `SUPABASE_URL`: `https://your-project-ref.supabase.co`
   * `SUPABASE_ANON_KEY`: `your-anon-key`
   * `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-key`
   * `SUPABASE_JWT_SECRET`: `your-jwt-secret`
6. Click **Deploy Web Service**.
7. Once deployed, test your public URL:
   * `https://<your-render-service>.onrender.com/api/health` -> should return `status: healthy`.
   * `https://<your-render-service>.onrender.com/api-docs` -> opens interactive Swagger UI.

---

## 4. Step 3: Frontend Web Deployment (Vercel or Render Static Site)

### Option A: Deploying via Vercel (Recommended for SPAs)
1. Go to [vercel.com](https://vercel.com) and import your Git repository.
2. Set **Root Directory** to `apps/web`.
3. Framework Preset: `Vite`.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add Environment Variables:
   * `VITE_API_BASE_URL`: `https://<your-render-service>.onrender.com`
   * `VITE_SUPABASE_URL`: `https://your-project-ref.supabase.co`
   * `VITE_SUPABASE_ANON_KEY`: `your-anon-key`
7. Click **Deploy**. Vercel will assign a public HTTPS domain (e.g. `https://synced-platform.vercel.app`).

---

## 5. Step 4: Generating and Distributing the Android APK

### Option A: Cloud APK Build via Expo EAS Build (No Android Studio Needed!)
1. In `apps/mobile`, verify `eas.json` is set to generate an `apk`:
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    }
  }
}
```
2. Log into your free Expo account:
```powershell
npx.cmd eas login
```
3. Run the build command:
```powershell
npx.cmd eas build -p android --profile preview
```
4. EAS compiles the APK in the cloud. Upon completion, it prints a direct HTTPS download URL (e.g. `https://expo.dev/artifacts/eas/...apk`).

### Option B: Hosting APK on GitHub Releases
1. Download the generated `.apk` file.
2. In your GitHub repository, go to **Releases -> Create a new release**.
3. Tag: `v1.0.0`. Title: `Release v1.0.0 - Android APK`.
4. Attach the `.apk` file as a binary asset.
5. Publish Release! Now anyone can download and install the APK via an official GitHub HTTPS link.

---

## 6. Pre-Release Security Checklist

* [x] No `.env` files committed to Git.
* [x] `SUPABASE_SERVICE_ROLE_KEY` used only on the backend; never bundled into `apps/web` or `apps/mobile`.
* [x] Rate limiting active on Express API (`express-rate-limit`).
* [x] Security headers enabled via `helmet`.
* [x] Row Level Security (RLS) enabled on all Supabase tables (`profiles`, `profile_audit_logs`).
* [x] Input validation enforced via Zod on all incoming mutation payloads.
* [x] Passwords never handled in plaintext by the backend; delegated to bcrypt-secured Supabase Auth.
* [x] Android APK WebView uses mobile Chrome User Agent to ensure OAuth compatibility.
