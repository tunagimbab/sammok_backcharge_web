// ============================================================
// sw.js — 서비스워커 (오프라인 캐싱 담당)
// ============================================================
// 목적: 최초 접속 시 핵심 파일(HTML/manifest/아이콘)을 캐시에 저장해,
//       이후 전파가 안 잡히는 현장에서도 폼 자체는 열리도록 한다.
//       pptxgenjs 같은 외부 스크립트도 최초 로드 시 캐시되므로,
//       이후에는 네트워크 없이 PPT 생성까지 가능하다.
// 이 파일이 하지 않는 것: 사진/입력값 저장 (그런 개인 데이터는 캐싱하지 않음)
// ============================================================
const CACHE_NAME = "work-order-form-v19";
const PRECACHE_ASSETS = [
  "./수정추가_등록.html",
  "./pptxgen.bundle.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 캐시 우선(cache-first) 전략: 있으면 캐시에서, 없으면 네트워크에서 가져온 뒤 캐시에 추가
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
