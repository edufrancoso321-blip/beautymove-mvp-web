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
    window.BeautyMoveFirebase = {
      app,
      auth: window.firebase.auth(),
      db: window.firebase.firestore(),
      enabled: true
    };
  } catch (error) {
    console.error('[BeautyMove] Firebase initialization failed:', error);
    window.BeautyMoveFirebase = { enabled: false, auth: null, db: null, error };
  }
})();
