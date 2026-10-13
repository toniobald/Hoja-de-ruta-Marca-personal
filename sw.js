/* Service worker de la cáscara. Solo guarda la app (código e iconos), nunca tus datos. Sube VERSION si cambias iconos o manifest. */
var VERSION="v10";
var CACHE="sofrito-"+VERSION;
var SHELL=["./","index.html","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png","fonts/syne-latin.woff2","fonts/dm-sans-latin.woff2","fonts/geist-mono-latin.woff2"];

self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  var req=e.request;
  if(req.method!=="GET")return;
  var url=new URL(req.url);
  /* La API de GitHub (contenido y datos) nunca pasa por la caché del service worker */
  if(url.hostname==="api.github.com")return;
  if(req.mode==="navigate"){
    e.respondWith(fetch(req).then(function(r){
      var copy=r.clone();caches.open(CACHE).then(function(c){c.put("index.html",copy);});
      return r;
    }).catch(function(){return caches.match("index.html");}));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    var net=fetch(req).then(function(r){
      if(r&&(r.ok||r.type==="opaque")){var copy=r.clone();caches.open(CACHE).then(function(c){c.put(req,copy);});}
      return r;
    }).catch(function(){return hit;});
    return hit||net;
  }));
});

/* Avisos push: muestran la notificación y abren la pestaña indicada */
self.addEventListener("push",function(e){
  var d={title:"Sofrito",body:"",tab:"inicio"};
  try{if(e.data){var j=e.data.json();for(var k in j)d[k]=j[k];}}catch(x){}
  e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:"icon-192.png",badge:"icon-192.png",data:{tab:d.tab}}));
});
self.addEventListener("notificationclick",function(e){
  e.notification.close();
  var tab=(e.notification.data&&e.notification.data.tab)||"inicio";
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(list){
    for(var i=0;i<list.length;i++){
      if("focus" in list[i]){list[i].postMessage({tab:tab});return list[i].focus();}
    }
    return self.clients.openWindow("./#"+tab);
  }));
});
