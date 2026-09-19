/* Construction Brand — offline support.
   Ballroom wi-fi is unreliable; once the page has been opened, it keeps working.

   Strategy: network first, cache as fallback. That way an edit to
   data/event.js is always picked up as soon as there is a connection,
   and the page still opens when there is none. */

var CACHE = "cb-event-v6";
var SHELL = [
  "./",
  "./index.html",
  "./data/event.js?v=20260919d",
  "./assets/css/style.css?v=20260919d",
  "./assets/js/app.js?v=20260919d",
  "./assets/img/logo.svg",
  "./assets/img/favicon.svg",
  "./manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () { /* a missing optional file must not block install */ })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") { return; }
  if (new URL(req.url).origin !== location.origin) { return; }

  e.respondWith(
    fetch(req)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
  );
});
