/* Background push handler. Firebase config arrives in the registration URL's query string. */
importScripts("https://www.gstatic.com/firebasejs/13.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.4.0/firebase-messaging-compat.js");

firebase.initializeApp(Object.fromEntries(new URL(location.href).searchParams));
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  self.registration.showNotification(d.title || "Chakan MIDC Force", {
    body: d.body || "",
    icon: "/favicon.ico",
    data: { link: d.link || "/dashboard" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // only ever open pages on this site
  const url = new URL(event.notification.data?.link || "/dashboard", self.location.origin);
  const target = url.origin === self.location.origin ? url.href : self.location.origin + "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.location.origin));
      return open ? open.navigate(target).then((c) => c && c.focus()) : clients.openWindow(target);
    }),
  );
});
