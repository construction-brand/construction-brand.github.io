/* Construction Brand — offline support.
   Ballroom wi-fi is unreliable; once the page has been opened, it keeps working.

   Strategy: network first, but the network only gets NET_WAIT ms when a
   cached copy exists. A saturated hotel AP — wi-fi icon on, packets dropped —
   never errors, it just hangs; a plain network-first worker would show a
   spinner for a minute while a complete copy sat in the cache. Whatever the
   network eventually returns still refreshes the cache in the background, so
   an edit to data/event.js is picked up on the next open. */

var CACHE = "cb-event-v7";
var NET_WAIT = 3000;
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

  var isNav = req.mode === "navigate";

  /* "/?view=feedback" must hit the cached "/" — ignore the query on pages */
  var lookup = caches.match(req, isNav ? { ignoreSearch: true } : undefined);

  e.respondWith(lookup.then(function (cached) {
    var network = fetch(req).then(function (res) {
      /* never let a 404 or an error page overwrite a good copy */
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    });
    /* keep the worker alive so a late response still refreshes the cache */
    e.waitUntil(network.catch(function () {}));

    if (!cached) {
      return network.catch(function () {
        return isNav ? caches.match("./index.html") : Response.error();
      });
    }

    var fresh = network
      .then(function (res) { return (res && res.ok) ? res : cached; })
      .catch(function () { return cached; });
    var patience = new Promise(function (resolve) {
      setTimeout(function () { resolve(cached); }, NET_WAIT);
    });
    return Promise.race([fresh, patience]);
  }));
});
