/* BeautyMove authentication adapter. Firebase is the primary backend; local session is only the browser session cache. */
(function () {
  const SESSION_KEY = 'beautymove.mvp.session';

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }
  function setSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }
  function profileName(profile) { return profile.nome || profile.nomeSalao || ''; }

  async function register(profile, password) {
    const backend = window.BeautyMoveFirebase;
    if (!backend?.enabled) throw new Error('Firebase não está disponível.');

    const credential = await backend.auth.createUserWithEmailAndPassword(profile.email, password);
    const uid = credential.user.uid;
    const session = { uid, role: profile.role, name: profileName(profile), email: credential.user.email || profile.email };
    setSession(session);

    const baseProfile = { ...profile, uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    await backend.db.collection('users').doc(uid).set(baseProfile, { merge: true });

    const roleCollection = { salao: 'salons', profissional: 'professionals', cliente: 'clients' }[profile.role];
    if (roleCollection) {
      await backend.db.collection(roleCollection).doc(uid).set({
        ...profile,
        uid,
        ownerId: uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    return session;
  }

  async function signIn(email, password, expectedRole) {
    const backend = window.BeautyMoveFirebase;
    if (!backend?.enabled) throw new Error('O backend Firebase não está disponível.');

    const credential = await backend.auth.signInWithEmailAndPassword(email, password);
    const snapshot = await backend.db.collection('users').doc(credential.user.uid).get();
    if (!snapshot.exists) throw new Error('Seu acesso existe, mas o perfil BeautyMove ainda não foi criado.');

    const data = snapshot.data();
    const role = data.role || '';
    if (expectedRole && role !== expectedRole) {
      await backend.auth.signOut();
      throw new Error(`Este acesso pertence ao perfil ${role === 'salao' ? 'Salão' : role === 'profissional' ? 'Profissional' : 'Cliente'}.`);
    }

    const session = { uid: credential.user.uid, role, name: data.nome || data.nomeSalao || '', email: credential.user.email || email };
    setSession(session);
    return session;
  }

  async function saveUserProfile(profile) {
    const backend = window.BeautyMoveFirebase;
    const session = getSession();
    if (!backend?.enabled || !session?.uid) return;
    await backend.db.collection('users').doc(session.uid).set({ ...profile, uid: session.uid }, { merge: true });
  }

  function redirectForRole(role) {
    if (role === 'salao' || role === 'profissional' || role === 'cliente') window.location.href = `${role}.html`;
    else window.location.href = 'index.html';
  }

  function bindRegistration() {
    const form = document.querySelector('#registrationForm');
    if (!form || form.dataset.firebaseBound === 'true') return;
    form.dataset.firebaseBound = 'true';
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const data = Object.fromEntries(new FormData(form).entries());
      const password = data.password || '';
      delete data.password;
      const button = form.querySelector('button[type="submit"]');
      if (button) { button.disabled = true; button.textContent = 'Criando cadastro...'; }
      try {
        await register(data, password);
        redirectForRole(data.role);
      } catch (error) {
        console.error('[BeautyMove] registration failed:', error);
        const code = error?.code || '';
        const message = code === 'auth/email-already-in-use' ? 'Este e-mail já está cadastrado.' : code === 'auth/weak-password' ? 'A senha precisa ter pelo menos 6 caracteres.' : code === 'auth/invalid-email' ? 'Informe um e-mail válido.' : error?.message || 'Não foi possível concluir o cadastro.';
        alert(message);
        if (button) { button.disabled = false; button.textContent = 'Continuar'; }
      }
    }, true);
  }

  function bindLogin() {
    const form = document.querySelector('#loginForm');
    if (!form || form.dataset.firebaseBound === 'true') return;
    form.dataset.firebaseBound = 'true';
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const button = form.querySelector('button[type="submit"]');
      const errorBox = document.querySelector('#loginError');
      if (button) { button.disabled = true; button.textContent = 'Entrando...'; }
      if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; }
      try {
        const session = await signIn(data.email, data.password, data.role || '');
        redirectForRole(session.role);
      } catch (error) {
        console.error('[BeautyMove] sign-in failed:', error);
        const code = error?.code || '';
        const message = code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential' ? 'E-mail ou senha incorretos.' : code === 'auth/invalid-email' ? 'Informe um e-mail válido.' : error?.message || 'Não foi possível entrar.';
        if (errorBox) { errorBox.hidden = false; errorBox.textContent = message; }
        else alert(message);
        if (button) { button.disabled = false; button.textContent = 'Entrar'; }
      }
    });
  }

  function protectPage() {
    const role = document.body?.dataset?.role;
    if (!role) return;
    const session = getSession();
    if (!session || session.role !== role) {
      window.location.replace(`login.html?perfil=${role}`);
      return;
    }
    document.querySelectorAll('[data-signout]').forEach((button) => button.addEventListener('click', async (event) => {
      event.preventDefault();
      try { if (window.BeautyMoveFirebase?.enabled) await window.BeautyMoveFirebase.auth.signOut(); } catch (error) { console.error(error); }
      clearSession();
      window.location.href = 'index.html';
    }));
  }

  window.BeautyMoveAuth = {
    mode: () => window.BeautyMoveFirebase?.enabled ? 'firebase' : 'local',
    current: getSession,
    register,
    signIn,
    saveUserProfile,
    signInLocal: (profile) => { const session = { uid: profile.uid || `local-${Date.now()}`, role: profile.role, name: profileName(profile), email: profile.email || '' }; setSession(session); return session; },
    signOut: async () => { if (window.BeautyMoveFirebase?.enabled) await window.BeautyMoveFirebase.auth.signOut(); clearSession(); },
    requireRole: (role) => { const session = getSession(); if (!session || session.role !== role) { window.location.href = `login.html?perfil=${role}`; return false; } return true; }
  };

  bindRegistration();
  bindLogin();
  protectPage();
})();
