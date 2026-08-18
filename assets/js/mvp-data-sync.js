/* BeautyMove MVP — shared operational data bridge.
 * Firestore is the source of truth; localStorage remains only as a fast UI cache.
 */
(function () {
  'use strict';

  const STATE_KEY = 'beautymove.mvp.state';
  const EMPTY_STATE = { appointments: [], opportunities: [], transactions: [] };
  const originalSetItem = Storage.prototype.setItem;
  let syncing = false;
  let bootedUid = null;
  let pushTimer = null;
  const unsubscribe = [];

  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return { ...EMPTY_STATE, ...(value || {}) };
    } catch (_) {
      return { ...EMPTY_STATE };
    }
  }

  function writeState(state) {
    syncing = true;
    try { originalSetItem.call(localStorage, STATE_KEY, JSON.stringify(state)); }
    finally { syncing = false; }
    window.dispatchEvent(new CustomEvent('beautymove:data-ready', { detail: state }));
  }

  function profile() {
    try { return JSON.parse(localStorage.getItem('beautymove.mvp.profile') || 'null') || {}; }
    catch (_) { return {}; }
  }

  function currentRole() { return document.body?.dataset?.role || profile().role || ''; }
  function currentUser() { return window.BeautyMoveFirebase?.auth?.currentUser || null; }
  function db() { return window.BeautyMoveFirebase?.db || null; }

  function queuePush() {
    if (syncing) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushLocalState, 120);
  }

  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && key === STATE_KEY && !syncing) queuePush();
  };

  function addCommon(item, uid, role) {
    const copy = { ...(item || {}) };
    delete copy._localOnly;
    copy.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    if (role === 'salao') copy.salonOwnerId = uid;
    if (role === 'profissional') copy.professionalOwnerId = uid;
    if (role === 'cliente') copy.clientOwnerId = uid;
    return copy;
  }

  async function pushCollection(name, items, uid, role) {
    const firestore = db();
    if (!firestore || !Array.isArray(items)) return;
    const batch = firestore.batch();
    let count = 0;
    for (const item of items) {
      if (!item?.id) continue;
      const ref = firestore.collection(name).doc(String(item.id));
      let payload = { ...item };
      if (name === 'opportunities') {
        if (role === 'salao') payload = addCommon(payload, uid, role);
        else if (role === 'profissional' && payload.salonOwnerId && payload.status !== 'aberta') payload = addCommon(payload, uid, role);
        else continue;
      } else if (name === 'appointments') {
        if (role === 'salao') payload = addCommon(payload, uid, role);
        else if (role === 'profissional' && (payload.professional === profile().nome || payload.professionalOwnerId === uid)) payload = addCommon(payload, uid, role);
        else if (role === 'cliente') payload = addCommon(payload, uid, role);
        else continue;
      } else if (name === 'transactions') {
        if (role === 'salao') payload = addCommon(payload, uid, role);
        else if (role === 'profissional') payload = addCommon(payload, uid, role);
        else continue;
      }
      batch.set(ref, payload, { merge: true });
      count += 1;
    }
    if (count) await batch.commit();
  }

  async function pushLocalState() {
    const user = currentUser(), firestore = db(), role = currentRole();
    if (!user || !firestore || !role) return;
    try {
      const state = readState();
      await pushCollection('opportunities', state.opportunities, user.uid, role);
      await pushCollection('appointments', state.appointments, user.uid, role);
      await pushCollection('transactions', state.transactions, user.uid, role);
    } catch (error) {
      console.error('[BeautyMove] Firestore sync write failed:', error);
      window.dispatchEvent(new CustomEvent('beautymove:data-error', { detail: error }));
    }
  }

  function upsertRemote(collectionName, docs, matcher) {
    const state = readState();
    const remoteIds = new Set(docs.map(item => String(item.id)));
    const existing = Array.isArray(state[collectionName]) ? state[collectionName] : [];
    const retained = existing.filter(item => !matcher(item) || !remoteIds.has(String(item.id)));
    state[collectionName] = retained.concat(docs);
    writeState(state);
  }

  function subscribeCollection(name, query, matcher) {
    try {
      const stop = query.onSnapshot(snapshot => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _remote: true }));
        upsertRemote(name, docs, matcher);
      }, error => console.error(`[BeautyMove] Firestore ${name} subscription failed:`, error));
      unsubscribe.push(stop);
    } catch (error) {
      console.error(`[BeautyMove] Firestore ${name} subscription setup failed:`, error);
    }
  }

  function clearSubscriptions() {
    while (unsubscribe.length) {
      try { unsubscribe.pop()(); } catch (_) {}
    }
  }

  function startForUser(user) {
    clearSubscriptions();
    bootedUid = user?.uid || null;
    if (!user || !db()) return;
    const role = currentRole();
    const firestore = db();

    if (role === 'salao') {
      subscribeCollection('opportunities', firestore.collection('opportunities').where('salonOwnerId', '==', user.uid), item => item.salonOwnerId === user.uid);
      subscribeCollection('appointments', firestore.collection('appointments').where('salonOwnerId', '==', user.uid), item => item.salonOwnerId === user.uid);
      subscribeCollection('transactions', firestore.collection('transactions').where('salonOwnerId', '==', user.uid), item => item.salonOwnerId === user.uid);
    } else if (role === 'profissional') {
      subscribeCollection('opportunities', firestore.collection('opportunities').where('status', '==', 'aberta'), item => item.status === 'aberta' || item.professionalOwnerId === user.uid);
      subscribeCollection('opportunities', firestore.collection('opportunities').where('professionalOwnerId', '==', user.uid), item => item.status === 'aberta' || item.professionalOwnerId === user.uid);
      subscribeCollection('appointments', firestore.collection('appointments').where('professionalOwnerId', '==', user.uid), item => item.professionalOwnerId === user.uid);
      subscribeCollection('transactions', firestore.collection('transactions').where('professionalOwnerId', '==', user.uid), item => item.professionalOwnerId === user.uid);
    } else if (role === 'cliente') {
      subscribeCollection('appointments', firestore.collection('appointments').where('clientOwnerId', '==', user.uid), item => item.clientOwnerId === user.uid);
    }

    setTimeout(pushLocalState, 300);
    window.dispatchEvent(new CustomEvent('beautymove:data-ready', { detail: readState() }));
  }

  function boot() {
    const firebaseClient = window.BeautyMoveFirebase;
    if (!firebaseClient?.enabled || !firebaseClient.auth || !firebaseClient.db) return;
    firebaseClient.auth.onAuthStateChanged(user => {
      if (user?.uid === bootedUid) return;
      startForUser(user);
    });
    if (firebaseClient.auth.currentUser) startForUser(firebaseClient.auth.currentUser);
  }

  window.BeautyMoveDataSync = { refresh: pushLocalState, state: readState, enabled: () => !!db() && !!currentUser() };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
