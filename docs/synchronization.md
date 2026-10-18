# Cross-Client Synchronization Architecture

## 1. The Core Engineering Challenge

A distributed application with multiple clients (Desktop Browser, Mobile Phone APK) accessing a shared database must address data consistency:
* If User V changes their bio on their laptop website, how does the mobile APK running on their phone display the new bio?
* If User V edits their hobbies inside the Android APK WebView, how does the desktop website reflect that change without stale data?

---

## 2. Four Fundamental Concepts Junior Developers Must Distinguish

When explaining this to a senior developer, you must clearly distinguish four distinct operations that beginners often conflate:

```mermaid
flowchart TD
    Op1["1. Database Persistence\n(PostgreSQL Commit)"]
    Op2["2. Database Trigger Execution\n(BEFORE/AFTER UPDATE Trigger in Engine)"]
    Op3["3. Client Refetch / Sync\n(HTTP GET / Polling / Cache Invalidation)"]
    Op4["4. Real-Time Broadcast\n(WebSocket / Supabase Realtime / PubSub)"]

    Op1 -->|Fires Automatically| Op2
    Op2 -->|State on Disk Updated| Op3
    Op2 -.->|Optional Event Push| Op4
```

1. **Persisting Data in the Database**:
   * What it is: A SQL `UPDATE` statement executed within a database transaction and committed to non-volatile storage (disk / write-ahead log).
   * Where it happens: Supabase PostgreSQL server.
2. **Database Trigger Execution**:
   * What it is: A procedural PL/pgSQL function executed *inside the database engine* upon a table mutation event.
   * Key example: Our `trigger_profiles_updated_at` calculates and rewrites `NEW.updated_at = NOW()` immediately before the row write finishes. The client does NOT set this timestamp.
3. **Refreshing a Client Interface**:
   * What it is: A client application refetching data over HTTP (`GET /api/v1/profile/me`) and calling `setProfile(newData)` to trigger a React re-render.
4. **Real-Time Notification (Push vs Pull)**:
   * **Pull (Polling)**: The client periodically queries the backend (`setInterval` every 5 seconds). Simple, battle-tested, works across firewalls, proxies, and mobile sleeps.
   * **Push (WebSocket / SSE)**: The database publishes change events over a persistent TCP socket to subscribers. Higher efficiency for high-frequency collaborative apps, but requires connection resilience and reconnection backoff logic.

---

## 3. Two-Way Synchronization Flow

```mermaid
sequenceDiagram
    autonumber
    participant Web as Client A: Desktop Web
    participant API as Express API Server
    participant DB as PostgreSQL Database
    participant APK as Client B: Android APK WebView

    Note over Web,APK: Scenario 1: Web to Mobile Sync
    Web->>API: 1. PATCH /api/v1/profile/me (Bio: "Architecting Synced Systems")
    API->>DB: 2. UPDATE profiles SET bio = ...
    Note over DB: PostgreSQL Trigger fires: updated_at auto-refreshed
    DB-->>API: 3. Commits row and returns updated record
    API-->>Web: 4. HTTP 200 OK
    Note over Web: Web displays saved confirmation immediately

    Note over APK: Client B is polling or user taps "Sync"
    APK->>API: 5. GET /api/v1/profile/me
    API->>DB: 6. SELECT * FROM profiles WHERE id = user.id
    DB-->>API: 7. Returns latest row
    API-->>APK: 8. Responds with updated bio
    Note over APK: Mobile UI re-renders with new Bio!

    Note over Web,APK: Scenario 2: Mobile to Web Sync
    APK->>API: 9. PATCH /api/v1/profile/me (Hobbies: ["Coding", "Running"])
    API->>DB: 10. UPDATE profiles SET hobbies = ...
    DB-->>API: 11. Commits row
    API-->>APK: 12. HTTP 200 OK

    Note over Web: Web auto-sync interval fires (every 5 seconds)
    Web->>API: 13. GET /api/v1/profile/me
    API->>DB: 14. SELECT * FROM profiles WHERE id = user.id
    DB-->>API: 15. Returns row with new hobbies
    API-->>Web: 16. Returns updated profile
    Note over Web: Web re-renders with ["Coding", "Running"] automatically!
```

---

## 4. Why We Chose Periodic Polling for the Baseline Implementation

In our production demonstration:
1. **Zero Disconnection Dropouts**: Embedded mobile WebViews suspend background processes when the screen turns off or when the app is switched. WebSockets frequently drop or enter zombie states in mobile containers without complex keep-alive heartbeats.
2. **Predictable Observability**: By displaying the sync status ("Auto-polling active 5s", "Last fetched 12:30:15"), both the developer and the senior evaluator can see exactly when and how the client requests updates.
3. **Scalability Path**: When S's real application requires instant sub-second synchronization, Supabase Realtime can be enabled with a simple subscription hook:
```typescript
// Future Real-Time Upgrade:
supabase
  .channel('public:profiles')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
    setProfile(payload.new as Profile);
  })
  .subscribe();
```
Because both polling and WebSockets query the exact same PostgreSQL table, introducing real-time subscriptions requires zero alterations to the backend data model!
