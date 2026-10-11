/* Acervo Lula: service worker para avisos autorizados. Envio remoto de Web Push
   só funciona após configurar um backend com VAPID e registrar assinaturas. */
self.addEventListener('push',function(event){
  var payload={};
  if(event.data){
    try{payload=event.data.json();}catch(e){payload={body:event.data.text()};}
  }
  var title=payload.title||'Novidade no Acervo Lula';
  var destination=typeof payload.url==='string'&&payload.url.charAt(0)==='/'?payload.url:'/';
  event.waitUntil(self.registration.showNotification(title,{
    body:payload.body||'Novos conteúdos de mobilização publicados.',
    tag:'acervo-lula-updates',
    data:{url:destination},
    icon:'/assets/images/acervo-lula-og.jpg'
  }));
});
self.addEventListener('notificationclick',function(event){
  event.notification.close();
  var target=event.notification.data&&event.notification.data.url||'/';
  var url=new URL(target,self.location.origin);
  if(url.origin!==self.location.origin)url=new URL('/',self.location.origin);
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(windows){
    for(var i=0;i<windows.length;i++){
      if(new URL(windows[i].url).origin===url.origin){
        return windows[i].focus().then(function(){return windows[i].navigate(url.href);});
      }
    }
    return clients.openWindow(url.href);
  }));
});
