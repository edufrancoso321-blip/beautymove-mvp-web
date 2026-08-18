/* BeautyMove MVP — load Firebase + shared data bridge on pages that historically
 * predated the Firebase integration. Existing pages can call this once and keep
 * their current UI code unchanged.
 */
(function () {
  'use strict';

  const BASE = 'assets/js/';
  const CDN = 'https://www.gstatic.com/firebasejs/12.1.0/';
  let promise = null;

  function load(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true') return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.head.appendChild(script);
    });
  }

  async function boot() {
    if (window.BeautyMoveFirebase?.enabled && window.BeautyMoveDataSync) return;
    await load(`${BASE}firebase-config.js`);
    await load(`${CDN}firebase-app-compat.js`);
    await load(`${CDN}firebase-auth-compat.js`);
    await load(`${CDN}firebase-firestore-compat.js`);
    await load(`${BASE}firebase-client.js`);
    await load(`${BASE}mvp-data-sync.js`);
    return window.BeautyMoveFirebase;
  }

  window.BeautyMoveFirebaseBootstrap = function () {
    if (!promise) promise = boot().catch(error => {
      console.error('[BeautyMove] Firebase bootstrap failed:', error);
      throw error;
    });
    return promise;
  };
})();
