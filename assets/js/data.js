/* BeautyMove MVP data boundary. The UI depends on this adapter, not storage details. */
window.BeautyMoveData = (() => {
  const STATE_KEY = 'beautymove.mvp.state';
  const PROFILE_KEY = 'beautymove.mvp.profile';
  const EMPTY_STATE = { appointments: [], opportunities: [], transactions: [], professionals: [], salons: [], clients: [], users: [] };

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function getState() { return { ...EMPTY_STATE, ...read(STATE_KEY, EMPTY_STATE) }; }
  function id(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

  return {
    mode: () => window.BEAUTYMOVE_BACKEND_ENABLED ? 'firebase' : 'local',
    id,
    getProfile: () => read(PROFILE_KEY, null),
    saveProfile: (profile) => write(PROFILE_KEY, profile),
    getState,
    saveState: write.bind(null, STATE_KEY),
    updateState: (mutator) => {
      const state = getState();
      mutator(state);
      write(STATE_KEY, state);
      return state;
    }
  };
})();
