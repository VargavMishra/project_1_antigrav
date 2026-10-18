# Senior Developer Live Demonstration Script

## 1. Setup & Pre-Flight Checklist

Before calling your senior developer to evaluate the system, prepare these three simultaneously accessible screens:

```
+---------------------------------------------------------------------------------------------------+
| SCREEN A (Desktop Browser Tab 1)     | SCREEN B (Physical Android Phone) | SCREEN C (Desktop Tab 2)       |
| Deployed Website                     | Installed Android APK             | Supabase Dashboard             |
| https://synced-platform.vercel.app   | Loading the same Web URL          | Table Editor -> profiles table |
+---------------------------------------------------------------------------------------------------+
```

### Pre-Flight Verification:
* [ ] Open `https://<your-render-api>.onrender.com/api/health` to wake up the Render server from cold sleep.
* [ ] Confirm Supabase project is active.
* [ ] Verify the phone is connected to Wi-Fi/cellular and the APK launches to the login screen.

---

## 2. Step-by-Step Live Demonstration Script

### Step 1: System Presentation & Architecture Introduction
* **Action**: Show the GitHub repository and system architecture diagram (`docs/architecture.md`).
* **What to say**:
  > *"Hi! Today I am demonstrating a complete, remotely deployed full-stack system showing synchronized state across a React website, an Android APK running in a WebView, an Express TypeScript backend, and a Supabase PostgreSQL database with real PL/pgSQL triggers and audit trails."*

---

### Step 2: Open All Three Interfaces Simultaneously
* **Action**:
  1. Open the website on your desktop browser.
  2. Launch the APK on your Android phone.
  3. Open the Supabase dashboard in another browser tab on your desktop.
* **Expected Result**: Both clients show the modern authentication portal with options for Email, Phone OTP, Google OAuth, and Quick Demo Login.

---

### Step 3: Authenticate & Derive Identity from Cryptographic JWT
* **Action**: Click **Quick Demo Account (For Live Review)** on the website, or sign in with your test account.
* **What to say**:
  > *"Notice how the frontend authenticates via Supabase Auth and receives a cryptographically signed JWT. When the client makes API calls to our Express backend, the backend never trusts client-supplied IDs. Our `requireAuth` middleware validates the signature and derives identity from trusted token claims."*

---

### Step 4: Verify Initial Profile Creation (Database Bootstrap)
* **Action**: View the profile card on the website. Switch to the Supabase Table Editor and refresh `profiles`.
* **Expected Result**: A row exists in PostgreSQL with the user's UUID, default hobbies (`['Coding', 'Learning']`), and timestamps.
* **What to say**:
  > *"When the user registered, our PostgreSQL database trigger `on_auth_user_created` automatically executed inside the database engine to bootstrap this profile record without requiring manual API boilerplate."*

---

### Step 5: Web to Mobile Synchronization
* **Action**:
  1. On the **Desktop Website**, go to **Edit Profile**.
  2. Change Display Name to `"Alex Lead Architect"`.
  3. Change Bio to `"Building synchronized full-stack systems with PostgreSQL triggers."`.
  4. Add a hobby: `"Rock Climbing"`.
  5. Click **Save Profile Changes**.
* **Expected Result**:
  * Website shows green success toast.
  * Notice the `Last Modified (Triggered)` timestamp update on the screen.
* **What to say**:
  > *"Notice that the `updated_at` column changed. That was not set by the frontend or backend code; our PostgreSQL trigger `trigger_profiles_updated_at` automatically stamped the UTC time before writing to disk."*

---

### Step 6: Verify Persistence in PostgreSQL Database
* **Action**: Switch to the Supabase browser tab and click **Refresh** on the `profiles` table.
* **Expected Result**: The row for your user now contains `"Alex Lead Architect"`, the new bio, and the updated timestamp.
* **What to say**:
  > *"Here in the raw PostgreSQL table, we can see the exact values committed to disk, proving this is not an in-memory client illusion."*

---

### Step 7: Inspect Cross-Client Update on Physical Android APK
* **Action**: Look at your Android phone. If Auto-Sync is enabled, within 5 seconds the phone screen automatically updates with `"Alex Lead Architect"` and the new bio. Alternatively, tap **Sync**.
* **Expected Result**: The mobile app reflects the exact same profile data without restarting the app!

---

### Step 8: Mobile to Web Synchronization (Reverse Direction)
* **Action**:
  1. On the **Android Phone**, tap the **Profile & Edit** tab.
  2. In the mobile form, change Strengths to: `"Distributed Systems, Cloud Architecture, Mobile Sync"`.
  3. Select Gender: `"Non-Binary"`.
  4. Tap **Save Profile Changes**.
* **Expected Result**:
  * Phone displays green confirmation.
  * Look at the **Desktop Browser**: within 5 seconds, the website auto-updates to reflect `"Non-Binary"` and the new strengths!
* **What to say**:
  > *"Now we have demonstrated reliable bi-directional synchronization. Changes originated on the mobile device flow to the backend, commit to PostgreSQL, fire the database triggers, and populate back to the desktop browser."*

---

### Step 9: Inspect the PostgreSQL Audit Trail Trigger
* **Action**: Click the **Audit Trail** tab on the website, or inspect `profile_audit_logs` in Supabase.
* **Expected Result**: Multiple audit log rows appear, displaying action `'UPDATE'` along with the JSON before-and-after snapshots.
* **What to say**:
  > *"Our second database trigger, `trigger_profile_audit`, recorded an immutable audit entry for each change, storing the previous JSON and new JSON states."*

---

### Step 10: Demonstrate Security & IDOR Protection
* **Action**: Open Swagger UI at `/api-docs`. Try executing `PATCH /api/v1/profile/me` without an `Authorization` header, or with an invalid token.
* **Expected Result**: The API returns `HTTP 401 UNAUTHORIZED`.
* **What to say**:
  > *"Unauthorized access is strictly rejected. Furthermore, because the endpoint targets `/me` and extracts the UUID from token claims, an attacker cannot modify or access another user's profile."*

---

### Step 11: Show Automated Test Suite & CI Pipeline
* **Action**: Show GitHub Actions running or run `npm test` locally.
* **Expected Result**: All 15 automated test cases pass cleanly (auth middleware, profile updates, Zod validation, health checks).
* **What to say**:
  > *"We have automated Vitest and Supertest integration tests covering 100% of critical paths, running on every commit via GitHub Actions."*

---

## 3. Demo Troubleshooting Contingency Plan

| Scenario | Immediate Fix |
| :--- | :--- |
| Render server is sleeping | Open `GET /api/health` in a browser tab to wake it up. |
| Wi-Fi disconnects on phone | The APK top bar has a `⚙️ URL` button: switch to your mobile hotspot IP or production HTTPS domain in 3 seconds. |
| Supabase Auth session expired | Click `Quick Demo Account` to immediately re-authenticate with a valid session. |
