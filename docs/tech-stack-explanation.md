# Technology Stack Justification & Engineering Trade-offs

This document outlines each core technology chosen for the project, why it was selected over alternative options, the technical trade-offs involved, and how it aligns with production full-stack engineering standards.

---

## 1. Frontend: React, Vite, TypeScript, Tailwind CSS

### What It Does
* **React 18**: Component-based declarative UI library managing client state and reactive DOM updates.
* **Vite**: Modern frontend build tool and development server powered by native ES modules and Rollup/esbuild.
* **TypeScript**: Static typing extending JavaScript with compile-time type verification.
* **Tailwind CSS**: Utility-first CSS framework enabling rapid, responsive mobile-first UI styling.

### Alternatives Considered
1. **Next.js (App Router)**:
   * *Why not chosen*: Adds server-side rendering (SSR) and server components complexity. For an application rendered inside an embedded mobile WebView where offline caching and static asset bundling are paramount, a single-page application (SPA) built with Vite delivers instant hot-module-reloading and clean client routing without server runtime dependencies.
2. **Vanilla JavaScript / React without TypeScript**:
   * *Why not chosen*: Lacks compile-time safety. In a synced full-stack project where backend API response schemas must exactly match frontend interfaces, TypeScript guarantees that refactors in the backend data model are caught immediately at build time.

### Trade-offs & Limitations
* SPAs have an initial JavaScript bundle download cost compared to server-rendered HTML.
* Vite bundles must be deployed to a static CDN (e.g. Vercel, Netlify, Render Static Sites) with URL rewrites (`/* -> /index.html`) configured for client routing.

---

## 2. Mobile App: React Native, Expo, React Native WebView

### What It Does
* **Expo**: Framework and platform for universal React applications providing preconfigured build pipelines, native toolchains, and EAS (Expo Application Services).
* **React Native WebView**: Cross-platform native view wrapper that renders web content inside a native iOS or Android app shell.

### Alternatives Considered
1. **Full Native React Native (Pure UI Components)**:
   * *Why not chosen for this demonstration*: The engineering objective is to replicate the friend S's architecture—a website rendered inside a mobile WebView shell—while decoupling development so V can demonstrate synchronization without waiting for S's proprietary native codebase.
2. **Capacitor / Apache Cordova**:
   * *Why not chosen*: Expo provides modern React Native infrastructure, active maintenance, superior TypeScript integration, and cloud APK build tools (EAS Build) without requiring an Android Studio SDK installation on the developer machine.

### Trade-offs & Limitations
* Embedded WebViews do not have the 120Hz native gesture responsiveness of native iOS/Android components.
* Identity providers like Google OAuth historically restrict logins in embedded WebViews (`disallowed_useragent`). To handle this, we customize the WebView User Agent and configure deep links or system browser authentication.

---

## 3. Backend: Node.js, Express, TypeScript

### What It Does
* **Node.js**: Asynchronous, event-driven JavaScript runtime running on Google V8.
* **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
* **TypeScript**: Strict compile-time type checking for API routes, middleware, and database access.

### Alternatives Considered
1. **NestJS**:
   * *Why not chosen*: NestJS enforces heavy Angular-style dependency injection and decorators. While great for large enterprise teams, it introduces unnecessary boilerplate and abstraction layers that obscure fundamental concepts for a junior engineer.
2. **Fastify**:
   * *Why not chosen*: Slightly faster raw throughput, but Express has the largest ecosystem, the most mature security middleware (Helmet, CORS, Morgan, Express-rate-limit), and is universally understood by any senior engineer during technical evaluations.
3. **Go / Python (FastAPI)**:
   * *Why not chosen*: Keeping the entire repository in TypeScript allows seamless sharing of types and validation schemas across frontend, mobile, and backend codebases.

### Trade-offs & Limitations
* Node.js is single-threaded. CPU-bound tasks (e.g. image processing or cryptographic hashing at scale) should be offloaded to worker threads or external cloud services. For I/O-bound operations (database queries, auth verification, REST payloads), Node.js excels.

---

## 4. Database & Auth: Supabase (PostgreSQL + GoTrue + Storage)

### What It Does
* **PostgreSQL 15+**: The world's most advanced open-source relational database, supporting ACID transactions, foreign keys, JSONB columns, check constraints, and PL/pgSQL triggers.
* **Supabase Auth (GoTrue)**: Managed authentication microservice issuing signed JWTs with support for Email/Password, Google OAuth, and Phone OTP (via SMS providers like Twilio).
* **Supabase Storage**: S3-compatible object storage for profile picture avatars with access policies.

### Alternatives Considered
1. **Firebase / Firestore**:
   * *Why not chosen*: Firestore is a proprietary NoSQL document database. It lacks relational integrity, SQL joins, foreign key cascades, and real PL/pgSQL database triggers. Learning PostgreSQL provides transferable enterprise database skills.
2. **Raw Self-Hosted PostgreSQL + Custom Auth Server**:
   * *Why not chosen*: Writing custom password hashing (bcrypt), token rotation, session invalidation, phone OTP SMS delivery, and OAuth PKCE protocol handling from scratch introduces critical security attack vectors. Using a hardened, open-source managed provider like Supabase aligns with modern production standards.

### Trade-offs & Limitations
* Free-tier Supabase projects enter a paused state after 7 days of inactivity. Unpausing takes ~1-2 minutes from the dashboard.
* Database triggers run in PostgreSQL process memory; complex trigger logic must be kept performant to prevent blocking transaction commits.

---

## 5. Input Validation: Zod

### What It Does
* TypeScript-first schema declaration and validation library with static type inference.

### Alternatives Considered
1. **Joi / Yup**: Older libraries requiring manual duplication between TypeScript interfaces and validation rules.
2. **class-validator**: Requires experimental decorators and TypeScript experimental reflection flags.

### Trade-offs & Limitations
* Zero runtime overhead until validation runs. Generates detailed error messages (`error.format()` / `error.errors`) that translate directly into clean API error responses.

---

## 6. Testing: Vitest & Supertest

### What It Does
* **Vitest**: Blazing-fast Vite-native testing framework with Jest-compatible APIs.
* **Supertest**: Library for testing Node.js HTTP servers without binding to a physical network port.

### Alternatives Considered
1. **Jest**: Requires complex Babel/ts-jest transformations for ESM modules in Node.js. Vitest works out of the box with modern TypeScript and ESM.

---

## Summary Stack Matrix

| Layer | Selected Tech | Key Reason |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + TS | Sub-second HMR, mobile-responsive styling, declarative UI |
| **Mobile App** | Expo + WebView | Emulates friend S's WebView architecture, builds standalone APK |
| **Backend API**| Express + TypeScript | Lightweight, transparent middleware, industry standard |
| **Database** | Supabase PostgreSQL | Real SQL, PL/pgSQL triggers, audit logs, RLS, ACID transactions |
| **Auth** | Supabase Auth (GoTrue)| Managed JWT issuance, Email, Google OAuth, Phone OTP |
| **Validation** | Zod | Single source of truth for runtime validation and TS types |
| **Testing** | Vitest + Supertest | Native ESM, instant execution, mockable repository layer |
| **Deployment** | Render / Vercel | Free-tier HTTPS hosting for backend and frontend |
