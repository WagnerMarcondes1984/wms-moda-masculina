/* Somente recursos estáticos públicos. Firebase e páginas administrativas passam pela rede. */
const CACHE = 'ra-vitrine-v2';
const PUBLICOS = ['index.html', 'style.css', 'script.js', 'storefront-ui.js', 'payment-split.js', 'firebase-config.js', 'manifest.json', 'offline.html', 'assets/icon-192.png', 'assets/icon-512.png'];
const urlsPublicas = new Set(PUBLICOS.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PUBLICOS)));
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('ra-vitrine-') && key !== CACHE).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);
    if (req.method !== 'GET' || url.origin !== self.location.origin) return;
    const raiz = new URL('./', self.registration.scope).pathname;
    const vitrine = req.mode === 'navigate' && (url.pathname === raiz || url.pathname === raiz + 'index.html');
    if (vitrine) {
        event.respondWith(fetch(req).catch(() => caches.match(new URL('offline.html', self.registration.scope).href)));
        return;
    }
    if (!urlsPublicas.has(url.href)) return;
    event.respondWith(fetch(req).then(response => {
        if (response.ok) {
            const copia = response.clone();
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, copia)));
        }
        return response;
    }).catch(() => caches.match(req)));
});
