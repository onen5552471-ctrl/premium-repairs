// Premium.Repairs Service Worker
// Handles background push notifications

const CACHE = ‘pr-v1’;

self.addEventListener(‘install’, function(e){
self.skipWaiting();
});

self.addEventListener(‘activate’, function(e){
e.waitUntil(clients.claim());
});

// Handle push notifications from Firebase
self.addEventListener(‘push’, function(e){
var data = {};
try { data = e.data.json(); } catch(err) { data = {title:‘Premium.Repairs’, body: e.data ? e.data.text() : ‘New notification’}; }

var title = data.notification ? data.notification.title : (data.title || ‘Premium.Repairs’);
var body  = data.notification ? data.notification.body  : (data.body  || ‘You have a new update’);

e.waitUntil(
self.registration.showNotification(title, {
body: body,
icon: ‘/icon.png’,
badge: ‘/icon.png’,
vibrate: [200, 100, 200],
tag: ‘pr-notif’,
requireInteraction: false,
data: { url: self.location.origin }
})
);
});

// Tap notification → open app
self.addEventListener(‘notificationclick’, function(e){
e.notification.close();
e.waitUntil(
clients.matchAll({type:‘window’, includeUncontrolled:true}).then(function(list){
for(var i=0; i<list.length; i++){
if(list[i].url.includes(self.location.origin) && ‘focus’ in list[i]){
return list[i].focus();
}
}
if(clients.openWindow){
return clients.openWindow(’/’);
}
})
);
});

// Background sync - keep polling when app is in background
self.addEventListener(‘periodicsync’, function(e){
if(e.tag === ‘pr-sync’){
e.waitUntil(backgroundSync());
}
});

async function backgroundSync(){
// Notify clients to sync
var allClients = await clients.matchAll({includeUncontrolled: true});
allClients.forEach(function(client){
client.postMessage({type: ‘SYNC’});
});
}

// Listen for messages from the app
self.addEventListener(‘message’, function(e){
if(e.data && e.data.type === ‘NOTIFY’){
self.registration.showNotification(e.data.title || ‘Premium.Repairs’, {
body: e.data.body || ‘’,
icon: ‘/icon.png’,
badge: ‘/icon.png’,
vibrate: [200, 100, 200],
tag: ‘pr-notif’
});
}
});
