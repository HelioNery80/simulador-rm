/* Service worker do Simulador RM (web): cache-first para uso offline. Troque VERSION ao publicar mudanças. */
var VERSION='srm-web-80897acf';
var FILES=['./','./index.html','./app-config.js','./app-native.js','./premium.js','./mobile.css','./mobile.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',function(e){ e.waitUntil(caches.open(VERSION).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate',function(e){ e.waitUntil(caches.keys().then(function(k){ return Promise.all(k.filter(function(n){ return n!==VERSION; }).map(function(n){ return caches.delete(n); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET') return;
  var u=new URL(r.url); if(u.origin!==location.origin) return;
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(function(hit){
    return hit || fetch(r).then(function(res){ if(res && res.ok){ var cp=res.clone(); caches.open(VERSION).then(function(c){ c.put(r,cp); }); } return res; }).catch(function(){ return r.mode==='navigate' ? caches.match('./index.html') : Response.error(); });
  }));
});
