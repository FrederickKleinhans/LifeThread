self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() ?? '' };
  }

  const title = payload.title || 'LifeThread';
  const options = {
    body: payload.body || 'A thread could use an update.',
    icon: '/icons.svg',
    badge: '/favicon.svg',
    data: {
      url: payload.url || '/',
      notificationId: payload.notificationId,
    },
    tag: payload.notificationId || 'lifethread-reengagement',
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = new URL(data.url || '/', self.location.origin);
  if (data.notificationId) target.searchParams.set('notificationId', data.notificationId);

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(target.href);
      await existing.focus();
      return;
    }
    await self.clients.openWindow(target.href);
  })());
});
