/**
 * Pixora Push Subscription Helper — browser-side code for subscribing to
 * Web Push and registering the subscription with the backend.
 *
 * Flow:
 *   1. Register the service worker (`/sw-push.js`)
 *   2. Ask the user for notification permission
 *   3. Subscribe via PushManager (using the backend's VAPID public key)
 *   4. Send the subscription to the backend's `subscribeToPush` mutation
 *
 * Usage:
 *
 *   import { subscribeToPixoraPush, unsubscribeFromPixoraPush } from './push-subscribe';
 *
 *   const VAPID_PUBLIC_KEY = await fetchVapidPublicKey(); // from backend
 *   const { subscription, created } = await subscribeToPixoraPush(VAPID_PUBLIC_KEY, token);
 *
 *   // ... later, on logout:
 *   await unsubscribeFromPixoraPush(subscription.endpoint, token);
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime: number | null;
}

/**
 * Convert a base64-url VAPID public key to a Uint8Array (for PushManager.subscribe).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

/**
 * Ensure the service worker is registered and ready.
 */
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('service workers not supported in this browser');
  }
  return navigator.serviceWorker.register('/sw-push.js');
}

/**
 * Ask the user for notification permission. Resolves true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Subscribe to Web Push and register the subscription with the backend.
 *
 * @param vapidPublicKey The VAPID public key from the backend (base64url)
 * @param accessToken    The current user's JWT access token
 * @returns The saved subscription and whether it was newly created
 */
export async function subscribeToPixoraPush(
  vapidPublicKey: string,
  accessToken: string,
): Promise<{ subscription: PushSubscriptionJSON; created: boolean }> {
  // 1. Make sure notifications are permitted
  const granted = await requestNotificationPermission();
  if (!granted) {
    throw new Error('notification permission denied');
  }

  // 2. Register / wait for the service worker
  const reg = await ensureServiceWorker();

  // 3. Subscribe via PushManager
  let pushSub: PushSubscription;
  try {
    pushSub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  } catch (err) {
    throw new Error(`push subscribe failed: ${(err as Error).message}`);
  }

  // 4. Serialize and POST to backend
  const json = pushSub.toJSON() as PushSubscriptionJSON;
  if (!json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('push subscription missing keys (p256dh / auth)');
  }

  const mutation = `
    mutation Sub($input: SubscribePushInput!) {
      subscribeToPush(input: $input) {
        subscription { id endpoint }
        created
      }
    }
  `;

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          expirationTime: json.expirationTime ?? undefined,
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`subscribeToPush HTTP ${res.status}`);
  }

  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(`subscribeToPush GraphQL error: ${body.errors[0].message}`);
  }

  return {
    subscription: json,
    created: body.data.subscribeToPush.created as boolean,
  };
}

/**
 * Unsubscribe from Web Push (browser side) and tell the backend to forget
 * the subscription.
 */
export async function unsubscribeFromPixoraPush(
  endpoint: string,
  accessToken: string,
): Promise<void> {
  // 1. Tell the browser to stop sending push to this endpoint
  const reg = await ensureServiceWorker();
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await sub.unsubscribe();
  }

  // 2. Tell the backend to remove the subscription
  const mutation = `
    mutation Unsub($endpoint: String!) {
      unsubscribeFromPush(endpoint: $endpoint) { removed }
    }
  `;
  await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: mutation, variables: { endpoint } }),
  });
}

/**
 * Unsubscribe ALL of the current user's devices (e.g. on "log out everywhere").
 */
export async function unsubscribeAllPixoraPush(accessToken: string): Promise<void> {
  const mutation = `
    mutation { unsubscribeAllPush { removed } }
  `;
  await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: mutation }),
  });
}
