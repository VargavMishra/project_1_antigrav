# Integration Guide: Connecting Friend S's Application to the Backend

## 1. Context & Purpose

You (V) have built the complete backend, database, authentication system, validation layer, and synchronization engine.
Your friend (S) is building the actual React Native client application.

This document serves as the formal **Engineering Handoff Contract** that you can present to S and your senior developer to explain how the two systems connect seamlessly.

---

## 2. API Contract for S

S does not need to know the internal implementation details of your Express services or PostgreSQL triggers. S only needs the **API Contract**:

* **Base URL**: `https://<your-render-domain>.onrender.com`
* **Swagger Reference**: `https://<your-render-domain>.onrender.com/api-docs`
* **Authentication**: Bearer JWT in the `Authorization` header.
* **Content Type**: `application/json`

### Key Endpoints for S:
1. `GET /api/v1/profile/me`: Retrieves current user profile.
2. `PATCH /api/v1/profile/me`: Updates profile fields (`display_name`, `bio`, `gender`, `hobbies`, `strengths`).
3. `POST /api/v1/profile/me/avatar`: Updates the user avatar.
4. `GET /api/health`: Liveness probe for network checks.

---

## 3. Two Integration Modes for S

Depending on how S designs their React Native app, there are two primary integration patterns:

### Pattern A: WebView Integration (The Current Target Model)
In this pattern, S embeds your deployed web application inside their React Native app using `react-native-webview`:

```tsx
// Inside S's React Native project:
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function FriendApp() {
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: 'https://synced-platform.vercel.app' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
});
```
* **Advantage**: Zero extra UI code for S! Any updates V deploys to the web application automatically update inside S's mobile app without requiring an app store update.

---

### Pattern B: Native React Native API Integration (Hybrid Model)
If S wants to build native React Native forms (using native `TextInput`, `FlatList`, etc.) rather than a WebView, S consumes V's API directly using standard `fetch` or `axios`:

```typescript
// S's Native API Client (api.ts):
const API_URL = 'https://your-render-api.onrender.com';

export async function fetchProfile(token: string) {
  const response = await fetch(`${API_URL}/api/v1/profile/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export async function updateProfile(token: string, updates: any) {
  const response = await fetch(`${API_URL}/api/v1/profile/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return response.json();
}
```

---

## 4. Bridging Auth Tokens Between Native Shell and WebView

If S handles login in native React Native screens and wants to pass the authenticated session into a WebView, use `injectedJavaScript` or `postMessage`:

```tsx
// S's Native App injecting the Supabase token into the WebView session:
const injectAuthToken = `
  localStorage.setItem('sb-auth-token', '${userSessionToken}');
  true;
`;

<WebView
  source={{ uri: 'https://synced-platform.vercel.app' }}
  injectedJavaScript={injectAuthToken}
  onMessage={(event) => {
    const data = JSON.parse(event.nativeEvent.data);
    console.log('Message from WebView:', data);
  }}
/>
```

---

## 5. Migration Checklist for S's Production Integration

1. [ ] Share your deployed Render backend URL and Swagger docs with S.
2. [ ] Supply S with your `SUPABASE_URL` and `SUPABASE_ANON_KEY` for client-side authentication.
3. [ ] Verify that S adds your backend domain to their Android Network Security Config (`android:usesCleartextTraffic="false"`).
4. [ ] Ensure S includes the customized Chrome User Agent to allow Google OAuth without WebView blocks.
5. [ ] Perform a live sync test between V's web client and S's native app on physical hardware.
