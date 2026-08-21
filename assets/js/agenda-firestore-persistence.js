/*
 * BeautyMove Agenda persistence bridge.
 *
 * Transitional rule for the MVP:
 * - Firestore is the source of truth for Agenda operational data.
 * - localStorage remains only a synchronous browser cache because the
 *   current Agenda controller is intentionally left untouched in this step.
 * - The bridge mirrors the existing Agenda state contract so the approved
 *   Agenda UI/behavior does not need to be redesigned while persistence is
 *   migrated.
 */
(function () {
  'use strict';

  const STATE_KEY = 'beautymove.mvp.state';
  const HOURS_KEY = 'beautymove.mvp.agenda.hours';
  const HYDRATED_KEY = 'beautymove.agenda.firestore.hydrated';
  const COLLECTIONS = ['appointments', 'opportunities', 'transactions'];
  const EMPTY_STATE = { appointments: [], opportunities: [], transactions: [] };

  const nativeGetItem = Storage.prototype.getItem;
  const nativeSetItem = Storage.prototype.setItem;
  let cacheState = null;
  let cacheHours = null;
  let syncing = false;
  let ready = false;

  function readNative(key, fallback) {
    try {
      const raw = nativeGetItem.call(localStorage, key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeNative(key, value) {
    nativeSetItem.call(localStorage, key, JSON.stringify(value));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function currentUid() {
    const firebaseUser = window.BeautyMoveFirebase?.auth?.currentUser;
    if (firebaseUser?.uid) return firebaseUser.uid;
    try {
      const session = JSON.parse(nativeGetItem.call(localStorage, 'beautymove.mvp.session') || 'null');
      return session?.uid || null;
    } catch {
      return null;
    }
  }

  function backend() {
    const value = window.BeautyMoveFirebase;
    return value?.enabled && value.db ? value : null;
  }

  function normalizeState(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      appointments: Array.isArray(source.appointments) ? source.appointments : [],
      opportunities: Array.isArray(source.opportunities) ? source.opportunities : [],
      transactions: Array.isArray(source.transactions) ? source.transactions : []
    };
  }

  function normalizeHours(value) {
    const fallback = { open: '08:00', close: '18:00' };
    if (!Array.isArray(value) || value.length !== 7) {
      return Array.from({ length: 7 }, () => ({ ...fallback }));
    }
    return value.map((item) => ({
      open: item?.open || fallback.open,
      close: item?.close || fallback.close
    }));
  }

  function withId(item, prefix) {
    const value = { ...(item || {}) };
    if (!value.id) value.id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return value;
  }

  function firestoreData(item, uid) {
    const value = { ...item, salonOwnerId: uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    if (!value.createdAt) value.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    return value;
  }

  function cacheSafeDoc(data) {
    const value = { ...(data || {}) };
    delete value.createdAt;
    delete value.updatedAt;
    return value;
  }

  async function readCollection(db, name, uid) {
    const snapshot = await db.collection(name).where('salonOwnerId', '==', uid).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...cacheSafeDoc(doc.data()) }));
  }

  async function loadRemoteState(db, uid) {
    const entries = await Promise.all(COLLECTIONS.map(async (name) => [name, await readCollection(db, name, uid)]));
    return Object.fromEntries(entries);
  }

  async function saveCollection(db, name, items, uid) {
    const normalized = items.map((item) => withId(item, name.slice(0, -1)));
    const remote = await db.collection(name).where('salonOwnerId', '==', uid).get();
    const localIds = new Set(normalized.map((item) => item.id));
    const batch = db.batch();

    remote.docs.forEach((doc) => {
      if (!localIds.has(doc.id)) batch.delete(doc.ref);
    });

    normalized.forEach((item) => {
      batch.set(db.collection(name).doc(item.id), firestoreData(item, uid), { merge: true });
    });

    await batch.commit();
    return normalized;
  }

  async function persistState(state) {
    if (syncing) return;
    const service = backend();
    const uid = currentUid();
    if (!service || !uid || !ready) return;

    syncing = true;
    try {
      const normalized = normalizeState(state);
      const saved = {};
      for (const name of COLLECTIONS) {
        saved[name] = await saveCollection(service.db, name, normalized[name], uid);
      }
      cacheState = { ...normalized, ...saved };
      writeNative(STATE_KEY, cacheState);
    } catch (error) {
      console.error('[BeautyMove] Agenda Firestore persistence failed:', error);
      window.dispatchEvent(new CustomEvent('beautymove:agenda-persistence-error', { detail: error }));
    } finally {
      syncing = false;
    }
  }

  async function hydrate() {
    const service = backend();
    const uid = currentUid();
    const legacyState = normalizeState(readNative(STATE_KEY, EMPTY_STATE));

    if (!service || !uid) {
      cacheState = legacyState;
      cacheHours = normalizeHours(readNative(HOURS_KEY, null));
      ready = true;
      return;
    }

    try {
      const remote = await loadRemoteState(service.db, uid);
      const merged = { ...remote };

      for (const name of COLLECTIONS) {
        const remoteIds = new Set((remote[name] || []).map((item) => item.id));
        const legacyOnly = (legacyState[name] || [])
          .filter((item) => item?.id && !remoteIds.has(item.id))
          .map((item) => withId(item, name.slice(0, -1)));
        merged[name] = [...(remote[name] || []), ...legacyOnly];
      }

      cacheState = normalizeState(merged);
      writeNative(STATE_KEY, cacheState);

      // One-time migration of browser-only Agenda records into Firestore.
      if (COLLECTIONS.some((name) => (legacyState[name] || []).length)) {
        await persistState(cacheState);
      }

      cacheHours = normalizeHours(readNative(HOURS_KEY, null));
      writeNative(HOURS_KEY, cacheHours);
      nativeSetItem.call(sessionStorage, HYDRATED_KEY, '1');
      ready = true;
      window.dispatchEvent(new CustomEvent('beautymove:agenda-hydrated'));
    } catch (error) {
      console.error('[BeautyMove] Agenda Firestore hydration failed:', error);
      cacheState = legacyState;
      cacheHours = normalizeHours(readNative(HOURS_KEY, null));
      ready = true;
      window.dispatchEvent(new CustomEvent('beautymove:agenda-persistence-error', { detail: error }));
    }
  }

  function patchStorage() {
    Storage.prototype.getItem = function (key) {
      if (this === localStorage && key === STATE_KEY && cacheState) return JSON.stringify(cacheState);
      if (this === localStorage && key === HOURS_KEY && cacheHours) return JSON.stringify(cacheHours);
      return nativeGetItem.call(this, key);
    };

    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && key === STATE_KEY && !syncing) {
        try {
          cacheState = normalizeState(JSON.parse(value));
          nativeSetItem.call(this, key, JSON.stringify(cacheState));
          void persistState(cacheState);
          return;
        } catch {
          // Fall through to the native implementation for malformed values.
        }
      }

      if (this === localStorage && key === HOURS_KEY && !syncing) {
        try {
          cacheHours = normalizeHours(JSON.parse(value));
          nativeSetItem.call(this, key, JSON.stringify(cacheHours));
          return;
        } catch {
          // Fall through to the native implementation for malformed values.
        }
      }

      return nativeSetItem.call(this, key, value);
    };
  }

  window.BeautyMoveAgendaPersistence = {
    hydrate,
    isReady: () => ready,
    getState: () => clone(cacheState || normalizeState(readNative(STATE_KEY, EMPTY_STATE))),
    getHours: () => clone(cacheHours || normalizeHours(readNative(HOURS_KEY, null))),
    syncNow: () => persistState(cacheState || normalizeState(readNative(STATE_KEY, EMPTY_STATE)))
  };

  patchStorage();
  void hydrate();
})();
