/* BeautyMove Firebase browser client — resilient static-web configuration. */
(function () {
  const config = window.BEAUTYMOVE_FIREBASE_CONFIG || {};
  const configured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
  if (!configured || !window.firebase) {
    window.BeautyMoveFirebase = { enabled: false, auth: null, db: null };
    return;
  }
  try {
    const app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(config);
    const auth = window.firebase.auth();
    const db = window.firebase.firestore();

    // Avoid indefinite WebChannel buffering in browsers/proxies/antivirus.
    try {
      db.settings({
        experimentalForceLongPolling: true,
        experimentalLongPollingOptions: { timeoutSeconds: 30 }
      });
    } catch (error) {
      console.warn('[BeautyMove] Firestore long-polling setup failed:', error);
    }

    try {
      auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch((error) => console.warn('[BeautyMove] Firebase persistence setup failed:', error));
    } catch (error) {
      console.warn('[BeautyMove] Firebase persistence setup failed:', error);
    }

    window.BeautyMoveFirebase = { app, auth, db, enabled: true };
  } catch (error) {
    console.error('[BeautyMove] Firebase initialization failed:', error);
    window.BeautyMoveFirebase = { enabled: false, auth: null, db: null, error };
  }
})();
