/* BeautyMove authentication adapter. Firebase is the primary backend; local session is only the browser session cache. */
(function () {
  const SESSION_KEY = 'beautymove.mvp.session';
  const PROFILE_KEY = 'beautymove.mvp.profile';

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }
  function setSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }
  function profileName(profile) { return profile.nome || profile.nomeSalao || ''; }
  function roleFromQuery() {
    const value = new URLSearchParams(window.location.search).get('perfil') || '';
    if (value.toLowerCase().includes('sala')) return 'salao';
    if (value.toLowerCase().includes('prof')) return 'profissional';
    if (value.toLowerCase().includes('clien')) return 'cliente';
    return '';
  }
  function formDataToObject(form) {
    const data = {};
    for (const [key, value] of new FormData(form).entries()) {
      if (key === 'especialidades') {
        if (!Array.isArray(data.especialidades)) data.especialidades = [];
        data.especialidades.push(value);
      } else {
        data[key] = value;
      }
    }
    return data;
  }

  async function register(profile, password) {
    const backend = window.BeautyMoveFirebase;
    if (!backend?.enabled) throw new Error('Firebase não está disponível.');

    const normalizedRole = profile.role || roleFromQuery();
    const normalizedProfile = { ...profile, role: normalizedRole };
    if (normalizedRole === 'salao') {
      const specialties = Array.isArray(normalizedProfile.especialidades) ? normalizedProfile.especialidades : [];
      if (!specialties.length) throw new Error('Selecione pelo menos uma especialidade do salão.');
      normalizedProfile.especialidades = specialties;
      normalizedProfile.especialidade = specialties[0];
    }

    const credential = await backend.auth.createUserWithEmailAndPassword(normalizedProfile.email, password);
    const uid = credential.user.uid;
    const session = { uid, role: normalizedRole, name: profileName(normalizedProfile), email: credential.user.email || normalizedProfile.email };
    setSession(session);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...normalizedProfile, uid })); } catch (storageError) { console.warn('[BeautyMove] local profile cache failed:', storageError); }

    try {
      const baseProfile = { ...normalizedProfile, uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
      await backend.db.collection('users').doc(uid).set(baseProfile, { merge: true });

      const roleCollection = { salao: 'salons', profissional: 'professionals', cliente: 'clients' }[normalizedRole];
      if (roleCollection) {
        await backend.db.collection(roleCollection).doc(uid).set({
          ...normalizedProfile,
          uid,
          ownerId: uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('[BeautyMove] profile persistence failed:', error);
      const permissionError = error?.code === 'permission-denied' || /insufficient permissions/i.test(error?.message || '');
      if (permissionError) {
        throw new Error('O cadastro de acesso foi criado, mas o Firebase bloqueou a gravação do perfil. Precisamos publicar as regras do Firestore antes de tentar novamente.');
      }
      throw error;
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
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(data)); } catch (storageError) { console.warn('[BeautyMove] local profile cache failed:', storageError); }
    return session;
  }

  async function restoreFirebaseSession() {
    const backend = window.BeautyMoveFirebase;
    if (!backend?.enabled || !backend.auth) return null;

    const currentUser = await new Promise((resolve) => {
      let settled = false;
      let unsubscribe = null;
      const finish = (user) => {
        if (settled) return;
        settled = true;
        if (unsubscribe) unsubscribe();
        resolve(user || null);
      };
      unsubscribe = backend.auth.onAuthStateChanged(finish);
      setTimeout(() => finish(backend.auth.currentUser || null), 4000);
    });

    if (!currentUser) return null;

    try {
      const snapshot = await backend.db.collection('users').doc(currentUser.uid).get();
      if (!snapshot.exists) return null;
      const data = snapshot.data() || {};
      const session = {
        uid: currentUser.uid,
        role: data.role || '',
        name: data.nome || data.nomeSalao || '',
        email: currentUser.email || data.email || ''
      };
      if (!session.role) return null;
      setSession(session);
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...data, uid: currentUser.uid })); } catch (storageError) { console.warn('[BeautyMove] local profile cache failed:', storageError); }
      return session;
    } catch (error) {
      console.error('[BeautyMove] session restore failed:', error);
      return null;
    }
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
      const data = formDataToObject(form);
      data.role = data.role || roleFromQuery();
      const password = data.password || '';
      const passwordConfirm = data.passwordConfirm || '';
      delete data.password;
      delete data.passwordConfirm;
      const errorBox = document.querySelector('#registrationError');
      const showError = (message) => { if (errorBox) { errorBox.hidden = false; errorBox.textContent = message; } else alert(message); };
      if (password !== passwordConfirm) {
        showError('As senhas não coincidem.');
        return;
      }
      if (data.role === 'salao' && (!Array.isArray(data.especialidades) || data.especialidades.length === 0)) {
        showError('Selecione pelo menos uma especialidade do salão.');
        return;
      }
      const button = form.querySelector('button[type="submit"]');
      if (button) { button.disabled = true; button.textContent = 'Criando cadastro...'; }
      if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; }
      try {
        const session = await register(data, password);
        redirectForRole(session.role);
      } catch (error) {
        console.error('[BeautyMove] registration failed:', error);
        const code = error?.code || '';
        const message = code === 'auth/email-already-in-use' ? 'Este e-mail já está cadastrado.' : code === 'auth/weak-password' ? 'A senha precisa ter pelo menos 6 caracteres.' : code === 'auth/invalid-email' ? 'Informe um e-mail válido.' : error?.message || 'Não foi possível concluir o cadastro.';
        showError(message);
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

  async function protectPage() {
    const role = document.body?.dataset?.role;
    if (!role) return;

    let session = getSession();
    if (!session || session.role !== role) {
      session = await restoreFirebaseSession();
    }

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
    restoreFirebaseSession,
    saveUserProfile,
    signInLocal: (profile) => { const session = { uid: profile.uid || `local-${Date.now()}`, role: profile.role, name: profileName(profile), email: profile.email || '' }; setSession(session); return session; },
    signOut: async () => { if (window.BeautyMoveFirebase?.enabled) await window.BeautyMoveFirebase.auth.signOut(); clearSession(); },
    requireRole: (role) => { const session = getSession(); if (!session || session.role !== role) { window.location.href = `login.html?perfil=${role}`; return false; } return true; }
  };

  bindRegistration();
  bindLogin();
  protectPage();
})();
