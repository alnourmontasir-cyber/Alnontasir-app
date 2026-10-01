const CACHE = "montasir-plus-v2";
const FILES = [
  "./", "./index.html", "./app.js", "./manifest.json",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"
];

self.addEventListener("install", e => {
  // كل ملف يُخزَّن على حدة، فلا يفشل التثبيت لو غاب ملف
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // الطلبات الخارجية (أدوات الإنترنت، فيسبوك، المتصفح الداخلي...) تمر مباشرة بدون تدخل
  if (url.origin !== self.location.origin) return;

  // ملفات التطبيق: الشبكة أولاً ثم الكاش عند انقطاع الإنترنت
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() =>
      caches.match(req, { ignoreSearch: true })
        .then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : Response.error())))
  );
});
