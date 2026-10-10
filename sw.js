/* Service worker: la app abre sin conexión. Sube VERSION cada vez que cambies index.html. */
var VERSION="v3";
var CACHE="hoja-ruta-"+VERSION;
var SHELL=["./","index.html","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png"];

self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k.indexOf("hoja-ruta-")===0&&k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  var req=e.request;
  if(req.method!=="GET")return;
  var url=new URL(req.url);
  /* Páginas: red primero, caché si no hay conexión */
  if(req.mode==="navigate"){
    e.respondWith(fetch(req).then(function(r){
      var copy=r.clone();caches.open(CACHE).then(function(c){c.put("index.html",copy);});
      return r;
    }).catch(function(){return caches.match("index.html");}));
    return;
  }
  /* Resto (iconos, fuentes de Google): caché primero y se refresca de fondo */
  e.respondWith(caches.match(req).then(function(hit){
    var net=fetch(req).then(function(r){
      if(r&&(r.ok||r.type==="opaque")){var copy=r.clone();caches.open(CACHE).then(function(c){c.put(req,copy);});}
      return r;
    }).catch(function(){return hit;});
    return hit||net;
  }));
});
