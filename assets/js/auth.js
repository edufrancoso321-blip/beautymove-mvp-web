/* BeautyMove authentication adapter. Uses Firebase Auth when the backend is available and keeps local mode as a safe fallback. */
(function () {
  const SESSION_KEY = 'beautymove.mvp.session';
  function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
  function setSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }
  function profileName(profile) { return profile.nome || profile.nomeSalao || ''; }

  async function register(profile, password) {
    const backend = window.BeautyMoveFirebase;
    if (!backend?.enabled) {
      const session = { uid: profile.uid || `local-${Date.now()}`, role: profile.role, name: profileName(profile), email: profile.email || '' };
      setSession(session);
      return session;
    }
    const credential = await backend.auth.createUserWithEmailAndPassword(profile.email, password);
    const session = { uid: credential.user.uid, role: profile.role, name: profileName(profile), email: credential.user.email || profile.email };
    setSession(session);
    return session;
  }

  async function signIn(email, password, role) {
    const backend = window.BeautyMoveFirebase;
    if (!backend?.enabled) throw new Error('O backend Firebase não está disponível.');
    const credential = await backend.auth.signInWithEmailAndPassword(email, password);
    const snapshot = await backend.db.collection('users').doc(credential.user.uid).get();
    const data = snapshot.exists ? snapshot.data() : {};
    const session = { uid: credential.user.uid, role: data.role || role || '', name: data.nome || data.nomeSalao || '', email: credential.user.email || email };
    setSession(session);
    return session;
  }

  async function saveUserProfile(profile) {
    const backend = window.BeautyMoveFirebase;
    const session = getSession();
    if (!backend?.enabled || !session?.uid) return;
    await backend.db.collection('users').doc(session.uid).set({ ...profile, uid: session.uid, createdAt: window.firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  window.BeautyMoveAuth = {
    mode: () => window.BeautyMoveFirebase?.enabled ? 'firebase' : 'local',
    current: getSession,
    register,
    signIn,
    saveUserProfile,
    signInLocal: (profile) => { const session = { uid: profile.uid || `local-${Date.now()}`, role: profile.role, name: profileName(profile), email: profile.email || '' }; setSession(session); return session; },
    signOut: async () => { if (window.BeautyMoveFirebase?.enabled) await window.BeautyMoveFirebase.auth.signOut(); clearSession(); },
    requireRole: (role) => { const session = getSession(); if (!session || session.role !== role) { window.location.href = `cadastro.html?perfil=${role}`; return false; } return true; }
  };
})();
