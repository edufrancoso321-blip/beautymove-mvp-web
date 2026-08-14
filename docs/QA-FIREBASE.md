# BeautyMove MVP — QA Firebase

## Backend state

- Firebase project: `beautymove-mvp-web`
- Web App configured in the project
- Authentication: E-mail/senha enabled
- Firestore: active
- Frontend integration: `firebase-config.js`, `firebase-client.js`, `auth.js`

## End-to-end acceptance test

1. Open the published BeautyMove URL.
2. Choose one of the three profiles: Salão, Profissional or Cliente.
3. Complete the registration with a new test e-mail and a password of at least 6 characters.
4. Confirm that the corresponding dashboard opens.
5. In Firebase Authentication > Users, confirm the new user exists.
6. In Firestore > `users`, confirm the profile document uses the same Firebase UID.
7. Confirm the corresponding role collection is created: `salons`, `professionals` or `clients`.
8. Return to the login page and sign in with the same credentials.
9. Confirm the correct role dashboard opens.
10. Confirm an incorrect role selection is rejected.

## Important

Do not use the existing `teste@beautymove.com` test record as the acceptance account. Use a new test e-mail so the complete registration path is verified.
