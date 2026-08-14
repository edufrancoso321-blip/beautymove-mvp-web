# BeautyMove — Firebase handoff

## When this step is reached

The codebase is prepared for Firebase, but the project credentials are intentionally empty in `assets/js/firebase-config.js`.

## What the founder must do

1. Open https://console.firebase.google.com/
2. Create a Firebase project named `BeautyMove MVP` (or an equivalent available project name).
3. Do not add a service account or download private keys.
4. Add a Web App to the Firebase project.
5. Enable Authentication > Sign-in method > Email/Password.
6. Create a Firestore Database in production mode.
7. Return to the project settings and copy only the Web App configuration values: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.

## Security rule

The Web App configuration is not a service-account credential. Never send private keys, service-account JSON files, passwords, or API secrets to the repository.

## Handoff

After step 7, send the configuration screen (or the six public Web App values) back to the technical lead. The technical lead will insert them into the branch and complete the Firebase integration.

Official docs:
- https://firebase.google.com/docs/web/setup
- https://firebase.google.com/docs/auth/web/start
- https://firebase.google.com/docs/firestore/quickstart
