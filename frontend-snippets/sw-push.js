/**
 * Pixora Push Notifications — service worker for receiving Web Push.
 *
 * Save this file as `public/sw-push.js` in your Next.js (or any static)
 * frontend. Register it from the app shell with:
 *
 *   if ('serviceWorker' in navigator) {
 *     await navigator.serviceWorker.register('/sw-push.js');
 *   }
 *
 * The service worker listens for `push` events (from the FCM/Mozilla push
 * service) and displays a system notification. When the user clicks the
 * notification, we focus/open the app and navigate to the deep-link URL
 * provided in the payload's `data.url`.
 *
 * NOTE: This file must be served from the SAME ORIGIN as the page that
 * registers it. It runs in a separate thread with no DOM access.
 */

// eslint-disable-next-line no-restricted-globals
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: 'Pixora', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Pixora';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/badge-72.png',
    tag: payload.tag,
    renotify: true,
    data: {
      url: payload.url || '/',
      ...(payload.data || {}),
    },
  };

  event.waitUntil(
    // eslint-disable-next-line no-restricted-globals
    self.registration.showNotification(title, options),
  );
});

// Notification click — focus or open the app at the deep-link URL
// eslint-disable-next-line no-restricted-globals
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    // eslint-disable-next-line no-restricted-globals
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'navigate', url: targetUrl });
          return client.focus();
        }
      }
      // Otherwise open a new window
      // eslint-disable-next-line no-restricted-globals
      if (self.clients.openWindow) {
        // eslint-disable-next-line no-restricted-globals
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});

// Optional: handle pushsubscriptionchange (browser rotated the subscription)
// eslint-disable-next-line no-restricted-globals
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      // Re-subscribe with the same VAPID key and POST the new subscription
      // to the backend's `subscribeToPush` GraphQL mutation.
      // The implementation depends on how the frontend stores the access
      // token — typically you'd postMessage the page to do the GraphQL
      // call on behalf of the service worker.
      // For a minimal MVP, just log it; the next page load will re-subscribe.
      // eslint-disable-next-line no-console
      console.log('[sw-push] pushsubscriptionchange — re-subscribe on next page load');
    })(),
  );
});
