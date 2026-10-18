# Complete Full-Stack Engineering & Request Lifecycle Learning Guide

This comprehensive guide is designed for **V**, explaining every technical concept, architectural layer, and data lifecycle step in this repository so you can explain, debug, maintain, and extend the system independently.

---

## 1. What Happens When a User Opens the Website

When you type `https://synced-platform.vercel.app` into your browser:
1. **DNS Resolution**: Your browser contacts a DNS resolver (Domain Name System) to translate the human-readable domain into an IP address (e.g. `76.76.21.21`).
2. **TLS Handshake (HTTPS)**: The browser and edge CDN server establish an encrypted TLS (Transport Layer Security) session via asymmetric cryptography.
3. **HTML Download**: The server returns `index.html`.
4. **Asset Loading**: The browser parses `index.html`, encounters `<script type="module" src="/src/main.tsx">`, and downloads the compiled JavaScript and CSS bundles.
5. **Execution**: The browser executes JavaScript, mounting the React application onto `<div id="root"></div>`.

---

## 2. What React and Vite Do

* **Vite**: In development, traditional bundlers (like Webpack) bundle the entire codebase before starting the server. Vite uses native browser ES modules (`import`/`export`), serving files on demand. It uses `esbuild` written in Go, making compilation 10–100x faster than JavaScript-based tools.
* **React**: Instead of directly manipulating the slow browser DOM (Document Object Model) with `document.getElementById('...')`, React maintains a lightweight representation in memory called the **Virtual DOM**. When application state changes (e.g. `setProfile(newData)`), React calculates the exact difference (called "reconciliation" or "diffing") and updates *only* the specific DOM elements that changed.

---

## 3. What the Mobile WebView Does

* A **WebView** is an embedded browser component rendered inside a native iOS or Android application.
* Rather than rewriting the entire user interface using native Android Kotlin or React Native JSX components, the WebView loads our deployed web application inside a native APK container.
* In our project (`apps/mobile/App.tsx`), `react-native-webview` renders the web app while providing native bridge access:
  * Intercepts Android hardware back button presses (`BackHandler`) to go back in browser history rather than exiting the application.
  * Injects a custom mobile Chrome User Agent to allow Google OAuth to complete without embedded WebView blocks.

---

## 4. What Node.js and Express Do

* **Node.js**: Browsers execute JavaScript to manipulate UI; Node.js takes the Google Chrome V8 JavaScript engine and allows it to execute outside the browser directly on a server operating system (Linux, Windows, macOS). Node.js uses an asynchronous, single-threaded **Event Loop** with non-blocking I/O. When querying the database, the server does not freeze; it registers a callback/promise and continues handling other users' requests.
* **Express.js**: A minimalist web framework for Node.js built around the **Middleware Pattern**. Every incoming HTTP request flows sequentially through a pipeline:
  ```
  Incoming Request -> Helmet (Headers) -> CORS (Origin Check) -> RateLimiter -> BodyParser -> requireAuth -> Route Handler -> Error Handler -> Response
  ```

---

## 5. What an API Is and Why Clients Use It

* **API (Application Programming Interface)**: A formal contract that allows two separate programs to communicate.
* **Why can't the frontend connect directly to PostgreSQL?**
  1. **Security**: Connecting directly to PostgreSQL requires database credentials (username and password). If placed in frontend JavaScript, any visitor could open DevTools, read the password, and drop or steal the entire database.
  2. **Business Rules & Validation**: The backend validates data (e.g. bio cannot exceed 500 characters, name cannot be empty) before it reaches the database.
  3. **Abstraction**: Clients only need to know HTTP endpoints (`PATCH /api/v1/profile/me`), allowing the backend database to be refactored without breaking client apps.

---

## 6. What HTTP Requests and JSON Are

* **HTTP (HyperText Transfer Protocol)**: The protocol of the web.
  * **Methods**:
    * `GET`: Retrieve data (idempotent, safe).
    * `POST`: Create a new resource or upload data.
    * `PATCH`: Partially update an existing resource.
    * `DELETE`: Remove a resource.
  * **Status Codes**:
    * `200 OK`: Request succeeded.
    * `400 Bad Request`: Validation failed (e.g. Zod error).
    * `401 Unauthorized`: Missing or invalid JWT token.
    * `404 Not Found`: Endpoint or user record does not exist.
    * `500 Internal Server Error`: Unhandled crash on the server.
* **JSON (JavaScript Object Notation)**: A lightweight, human-readable data interchange format:
  ```json
  { "display_name": "Alex", "hobbies": ["Coding", "Cycling"] }
  ```

---

## 7. How Authentication Works (Tokens vs Sessions)

* **Legacy Session Cookies**: The server stores session data in memory or Redis and sets a `Cookie: session_id=123`. The browser automatically attaches cookies to every request. (Difficult to share with mobile native apps and cross-domain APIs).
* **JWT (JSON Web Token)**: Modern token-based authentication. When a user logs in, Supabase issues a self-contained, signed string containing three parts:
  1. **Header**: Algorithm used (e.g. `HS256`).
  2. **Payload (Claims)**: User ID (`sub`), email, role, expiration timestamp (`exp`).
  3. **Signature**: Cryptographic signature calculated as `HMAC-SHA256(header + "." + payload, secret)`.
* Because the signature is verified using the secret key, the client can read their user ID, but cannot tamper with it without invalidating the token.

---

## 8. How Access Tokens Are Verified in Express

In [`apps/server/src/middleware/auth.middleware.ts`](file:///c:/Users/Rentorzo/Documents/antigravity/valiant-bose/apps/server/src/middleware/auth.middleware.ts):
1. The middleware reads the `Authorization` header: `Bearer <token>`.
2. It strips `Bearer ` and extracts the token string.
3. It passes the token to Supabase Auth's `getUser(token)`.
4. Supabase cryptographically verifies that the token was signed by its auth server and has not expired.
5. If valid, the user object is attached to `req.user`.

---

## 9. How the Backend Identifies the Logged-in User (IDOR Protection)

* **IDOR (Insecure Direct Object Reference)**: An application design flaw where the client sends `PATCH /profile?userId=123` and the backend blindly updates row `123`. Any user can modify anyone else's account.
* **Our Protection**:
  * The frontend never passes a user ID.
  * The backend only updates `WHERE id = req.user.id`, where `req.user.id` came exclusively from the cryptographically verified JWT.

---

## 10. How the Database Stores Profiles (PostgreSQL Architecture)

* Data is persisted in PostgreSQL in the `public.profiles` table.
* Relational schema:
  * `id` is a `UUID` primary key referencing `auth.users(id)` with `ON DELETE CASCADE`. If a user deletes their account in Supabase Auth, PostgreSQL automatically removes their profile row.
  * Hobbies and strengths are stored as native PostgreSQL string arrays (`TEXT[]`), eliminating the need for complex join tables for simple tag lists.

---

## 11. How SQL, Constraints, and Relationships Work

* **Foreign Key (`REFERENCES auth.users(id)`)**: Enforces referential integrity. You cannot insert a profile for a user ID that does not exist in `auth.users`.
* **NOT NULL**: Ensures essential columns (like `display_name`) cannot be stored as null.
* **CHECK Constraints & Enums**: Ensures `gender` only accepts permitted values (`'male'`, `'female'`, `'non-binary'`, `'other'`, `'unspecified'`).

---

## 12. How Database Triggers Work

A database trigger is procedural code that runs automatically within PostgreSQL when an `INSERT`, `UPDATE`, or `DELETE` occurs.

* **Our `trigger_profiles_updated_at` Trigger**:
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = TIMEZONE('utc'::text, NOW());
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```
* **Why this is superior to frontend/API updates**:
  If 10 different services (Express, an admin dashboard, a background batch script, a CLI) update the profile, *none* of them need code to update the timestamp. PostgreSQL guarantees `updated_at` will always be updated accurately.

---

## 13. How the Frontend Retrieves and Updates Profile Data

1. **Retrieval**: `api.getMyProfile(token)` sends `GET /api/v1/profile/me`.
2. React parses the JSON response and calls `setProfile(data)`.
3. **Update**: When the user edits fields and clicks Save, `api.updateMyProfile(token, payload)` sends `PATCH /api/v1/profile/me`.
4. Upon receiving the HTTP 200 response, React updates the local state and displays a confirmation toast.

---

## 14. How Cross-Client Synchronization Works

1. Both the desktop website and the mobile APK communicate with the exact same Express backend and PostgreSQL database.
2. When Client A modifies a field, the change is written to PostgreSQL.
3. Client B periodically fetches `GET /api/v1/profile/me` (every 5 seconds via auto-sync polling) or when the user taps **Sync**.
4. Client B receives the updated record and re-renders the UI.

---

## 15. How Google OAuth and Phone OTP Work

* **Google OAuth**: Uses the OAuth 2.0 authorization code flow. Google handles user identity and passes an authorization code back to Supabase, which exchanges it for access tokens.
* **Phone OTP**: Supabase generates a temporary 6-digit random code, stores its cryptographic hash with an expiration time, and dispatches the code via SMS (Twilio). When the user submits the code, Supabase verifies the match.

---

## 16. How Image Uploads and Object Storage Work

* Storing large binary images directly in PostgreSQL as `BYTEA` bloats the database, degrades query cache performance, and increases backup sizes.
* **Industry Standard**: Store the image binary in an S3-compatible **Object Storage Bucket** (`avatars`), and store only the resulting public HTTPS URL (e.g. `https://xyz.supabase.co/storage/v1/object/public/avatars/user-1/photo.jpg`) in the PostgreSQL `avatar_url` column.

---

## 17. How Git and GitHub Version Control Work

* **Git**: A distributed version control system tracking snapshots of code changes.
* **Working Directory -> Staging Area (`git add`) -> Local Repository (`git commit`) -> Remote Repository (`git push`)**.
* Feature branching (`git checkout -b feature/auth`) isolates experimental work until tested and merged into `main` via Pull Requests.

---

## 18. How CI/CD and Deployments Work

* **CI (Continuous Integration)**: Automated checks run on GitHub Actions on every pull request to verify that TypeScript types check (`npm run typecheck`), linting passes (`npm run lint`), and tests pass (`npm run test`).
* **CD (Continuous Deployment)**: Once code merges into `main`, webhook triggers Render and Vercel to rebuild and redeploy the applications to production with zero downtime.

---

## 19. How to Debug a Failed Request from Frontend to Database

When a request fails, debug step-by-step through the stack:
1. **Browser DevTools (Network Tab)**: Check the request URL, HTTP status code (e.g. 401 or 500), request payload, and response error JSON.
2. **Express Server Console Logs**: Check the terminal running Express. Morgan logs incoming requests; our centralized error handler logs unhandled exceptions.
3. **Database Health**: Call `GET /api/health` to verify that the Express backend can communicate with PostgreSQL.
4. **Supabase SQL Editor**: Run `SELECT * FROM profiles WHERE id = '...'` to verify raw database contents.

---

## 20. How the Architecture Changes When Integrating S's Real App

When connecting friend S's real project:
1. S simply configures their React Native WebView to point to your deployed Vercel URL, or consumes your Express REST API directly.
2. No backend architecture changes are required; your API and database are already multi-client ready!
