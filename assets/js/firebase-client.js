/* BeautyMove Firebase browser client. Kept compatible with a static web deployment. */
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
    try {
      auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch((error) => console.warn('[BeautyMove] Firebase persistence setup failed:', error));
    } catch (error) {
      console.warn('[BeautyMove] Firebase persistence setup failed:', error);
    }
    window.BeautyMoveFirebase = {
      app,
      auth,
      db: window.firebase.firestore(),
      enabled: true
    };
  } catch (error) {
    console.error('[BeautyMove] Firebase initialization failed:', error);
    window.BeautyMoveFirebase = { enabled: false, auth: null, db: null, error };
  }
})();
