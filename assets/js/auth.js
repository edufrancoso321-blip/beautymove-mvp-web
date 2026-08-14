/* BeautyMove authentication adapter. Firebase is intentionally disabled until the project credentials are supplied. */
(function () {
  const SESSION_KEY = 'beautymove.mvp.session';
  function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
  function setSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }

  window.BeautyMoveAuth = {
    mode: () => window.BEAUTYMOVE_BACKEND_ENABLED ? 'firebase' : 'local',
    current: getSession,
    signInLocal: (profile) => { const session = { uid: profile.uid || `local-${Date.now()}`, role: profile.role, name: profile.nome || profile.nomeSalao || '', email: profile.email || '' }; setSession(session); return session; },
    signOut: clearSession,
    requireRole: (role) => { const session = getSession(); if (!session || session.role !== role) { window.location.href = `cadastro.html?perfil=${role}`; return false; } return true; }
  };
})();
