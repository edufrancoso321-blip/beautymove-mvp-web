import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const config = window.BEAUTYMOVE_FIREBASE_CONFIG || {};
const configured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

if (configured) {
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  window.BeautyMoveFirebase = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    enabled: true
  };
  window.BEAUTYMOVE_BACKEND_ENABLED = true;
} else {
  window.BeautyMoveFirebase = { enabled: false };
}
