/*
 * BeautyMove MVP data boundary.
 *
 * The UI talks to this adapter instead of directly depending on storage.
 * Today it uses localStorage. When Firebase is enabled, this is the single
 * boundary to replace with authenticated Firestore operations.
 */
window.BeautyMoveData = (() => {
  const STATE_KEY = 'beautymove.mvp.state';
  const PROFILE_KEY = 'beautymove.mvp.profile';
  const EMPTY_STATE = { appointments: [], opportunities: [], transactions: [], professionals: [], salons: [], clients: [] };

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  }

  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  return {
    mode: () => window.BEAUTYMOVE_BACKEND_ENABLED ? 'firebase' : 'local',
    getProfile: () => read(PROFILE_KEY, null),
    saveProfile: (profile) => write(PROFILE_KEY, profile),
    getState: () => ({ ...EMPTY_STATE, ...read(STATE_KEY, EMPTY_STATE) }),
    saveState: (state) => write(STATE_KEY, state),
    updateState: (mutator) => {
      const state = ({ ...EMPTY_STATE, ...read(STATE_KEY, EMPTY_STATE) });
      mutator(state);
      write(STATE_KEY, state);
      return state;
    }
  };
})();
