/* RailReady offline-first study cache. Network is preferred to keep dated news fresh. */
const VERSION='railready-complete-v1';
const SHELL=['./','./index.html','./app.css','./app.js','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest',
 './data/general-awareness-bank.json','./data/quant-reasoning-bank.json','./data/study-lessons.json',
 './data/pyq-source-index.json','./data/news.json'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(VERSION).then(async cache=>{
  await Promise.allSettled(SHELL.map(async url=>{
   try{const res=await fetch(url,{cache:'reload'});if(res.ok)await cache.put(url,res.clone())}catch(_){}
  }));
  return self.skipWaiting();
 }));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('railready-')&&k!==VERSION).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  try{
   const response=await fetch(request,{cache:'no-cache'});
   if(response.ok)cache.put(request,response.clone());
   return response;
  }catch(error){
   const exact=await cache.match(request,{ignoreSearch:true});
   if(exact)return exact;
   if(request.mode==='navigate'){
    const fallback=await cache.match('./index.html');
    if(fallback)return fallback;
   }
   throw error;
  }
 })());
});
