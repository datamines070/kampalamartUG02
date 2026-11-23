// Kampala Mart V68 SW - NEVER cache index.html or API, so new deploys show instantly
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var url = e.request.url;
  if(url.indexOf('/api/data')!==-1 || url.indexOf('/rest/')!==-1 || url.endsWith('/') || url.endsWith('/index.html') || url.indexOf('index.html')!==-1){
    e.respondWith(fetch(e.request, {cache:'no-store'}).catch(function(){ return fetch(e.request); }));
    return;
  }
  e.respondWith(fetch(e.request).catch(function(){ return caches.match(e.request); }));
});
