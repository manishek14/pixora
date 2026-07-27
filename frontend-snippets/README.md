# Pixora Frontend Snippets

This directory contains ready-to-paste TypeScript/JavaScript snippets for the
Pixora frontend. They are NOT a runnable app — just helpers to wire up
realtime (Socket.io) and push notifications (Web Push) on the client side.

Drop them into your Next.js (or any other React/Vue/vanilla) frontend.

## Files

| File | Purpose |
|------|---------|
| `realtime-client.ts` | Drop-in `PixoraRealtime` class that connects to the backend's Socket.io gateway with JWT auth, and exposes typed event subscriptions for all 6 server-emitted events (`message_received`, `message_read`, `message_deleted`, `notification_received`, `typing`, `presence_update`). |
| `sw-push.js` | Service worker that listens for `push` events from FCM/Mozilla and shows system notifications. Also handles notification clicks (focuses the app and navigates to the deep-link URL). |
| `push-subscribe.ts` | Helper functions to ask the user for notification permission, subscribe via `PushManager.subscribe()`, and register/unregister the subscription with the backend's GraphQL `subscribeToPush` / `unsubscribeFromPush` mutations. |

## Setup

### 1. Install Socket.io client (in your frontend project)

```bash
npm install socket.io-client
```

### 2. Generate VAPID keys (run once, on the backend)

```bash
node scripts/generate-vapid-keys.js
```

This writes `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to `.env`. Restart
the backend. Verify "Web Push: configured" appears in the boot log.

### 3. Wire up the service worker (in your frontend)

Copy `sw-push.js` to `public/sw-push.js`. Register it from your app shell:

```ts
// app/layout.tsx (or wherever your app boots)
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw-push.js');
  }
}, []);
```

### 4. Subscribe the user to push (after login)

```ts
import {
  subscribeToPixoraPush,
  unsubscribeFromPixoraPush,
} from '../lib/push-subscribe';

// After login:
const vapidPublicKey = await fetchVapidPublicKeyFromBackend(); // expose via a new GraphQL query or REST endpoint
const { subscription, created } = await subscribeToPixoraPush(vapidPublicKey, accessToken);

// On logout:
await unsubscribeFromPixoraPush(subscription.endpoint, accessToken);
```

### 5. Connect the realtime client (after login)

```ts
import { PixoraRealtime } from '../lib/realtime-client';

const rt = new PixoraRealtime(process.env.NEXT_PUBLIC_BACKEND_URL!, () => getAccessToken());
await rt.connect();

rt.onMessageReceived(({ threadId, message }) => {
  // Append to the open thread view, bump inbox preview, etc.
  console.log('new DM in', threadId, message.text);
});

rt.onNotificationReceived(({ notification }) => {
  // Increment the bell badge, optionally show a toast
});

rt.onPresenceUpdate(({ userId, isOnline }) => {
  // Toggle the green dot next to userId in your presence cache
});

// When the user types in a thread:
rt.emitTyping(threadId, true);
// When they stop:
rt.emitTyping(threadId, false);

// On logout:
rt.disconnect();
```

## Events reference

### Server → client

| Event | Payload | Fired when |
|-------|---------|------------|
| `message_received` | `{ threadId, message }` | A new DM is sent to me (also echoed to the sender for multi-tab sync) |
| `message_read` | `{ threadId, readerId, messageIds }` | The other participant marked my messages as read |
| `message_deleted` | `{ threadId, messageId }` | The sender deleted a message |
| `notification_received` | `{ notification }` | A new notification was created for me (like/comment/follow/etc.) |
| `typing` | `{ threadId, userId, isTyping }` | The other participant in a thread started/stopped typing |
| `presence_update` | `{ userId, isOnline, lastSeenAt }` | A mutual follow came online or went offline |

### Client → server

| Event | Payload | Purpose |
|-------|---------|---------|
| `typing` | `{ threadId, isTyping }` | Tell the server I'm typing (or stopped) in a thread |
| `joinThread` | `{ threadId }` | Join a thread-scoped room (optional, for typing indicators) |
| `leaveThread` | `{ threadId }` | Leave a thread room |

## GraphQL queries / mutations

```graphql
# Subscribe a device to push
mutation SubscribeToPush($input: SubscribePushInput!) {
  subscribeToPush(input: $input) {
    subscription { id endpoint createdAt }
    created
  }
}

# Unsubscribe one device
mutation UnsubscribeFromPush($endpoint: String!) {
  unsubscribeFromPush(endpoint: $endpoint) { removed }
}

# Unsubscribe all my devices
mutation { unsubscribeAllPush { removed } }

# List my push subscriptions
query { myPushSubscriptions { id endpoint createdAt } }

# Online status of a batch of users
query OnlineStatus($userIds: [ID!]!) {
  onlineStatus(userIds: $userIds) {
    userId
    isOnline
    lastSeenAt
  }
}
```
