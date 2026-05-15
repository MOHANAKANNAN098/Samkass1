/* ============================================================
   KaasFlow — Service Worker (sw.js)
   Handles notification action buttons:
     ✅  "paid"    → tells the app to record a full EMI payment
     ⏳  "pending" → dismisses, app marks as pending in its state
   ============================================================ */
'use strict';

/* ── Install & Activate (cache-first for offline, optional) ── */
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(clients.claim()));

/* ── Notification Click ──────────────────────────────────── */
self.addEventListener('notificationclick', e => {
  const notification = e.notification;
  const action       = e.action;            // 'paid' | 'pending' | '' (body tap)
  const data         = notification.data || {};

  notification.close();

  const openOrFocus = (msgType, extra = {}) => {
    return clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(wins => {
        const msg = { type: msgType, ...data, ...extra };
        if (wins.length > 0) {
          // App window already open — focus it and send message
          wins[0].focus();
          wins[0].postMessage(msg);
        } else {
          // App is closed — open it; it will read pending action from URL
          const params = new URLSearchParams({ kf_action: msgType, ...data, ...extra });
          return clients.openWindow('/?' + params.toString());
        }
      });
  };

  if (action === 'paid') {
    // User tapped ✅ Paid in the notification bar
    e.waitUntil(openOrFocus('NOTIF_MARK_PAID'));
  } else if (action === 'pending') {
    // User tapped ⏳ Pending in the notification bar
    e.waitUntil(openOrFocus('NOTIF_MARK_PENDING'));
  } else {
    // User tapped the notification body — just open the Collection page
    e.waitUntil(openOrFocus('NOTIF_OPEN_COLLECTION'));
  }
});

/* ── Future: Server Push Support ────────────────────────── */
self.addEventListener('push', e => {
  if (!e.data) return;
  const payload = e.data.json();
  e.waitUntil(
    self.registration.showNotification(payload.title || 'KaasFlow', {
      body:    payload.body  || '',
      icon:    payload.icon  || '/favicon.ico',
      badge:   payload.badge || '/favicon.ico',
      data:    payload.data  || {},
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || false,
    })
  );
});
