/* BeautyMove Agenda — storage facade.
 * Agenda modules use this API instead of knowing where state is stored.
 */
window.BeautyMoveAgendaStorage = (() => {
  'use strict';

  const fallbackKey = 'beautymove.mvp.state';

  function data() {
    return window.BeautyMoveData || null;
  }

  function readState() {
    const api = data();
    if (api?.getState) return api.getState();
    try {
      return JSON.parse(localStorage.getItem(fallbackKey) || 'null') || {
        appointments: [], opportunities: [], transactions: [],
        professionals: [], salons: [], clients: [], users: []
      };
    } catch {
      return { appointments: [], opportunities: [], transactions: [] };
    }
  }

  function saveState(state, reason) {
    const api = data();
    if (api?.saveState) return api.saveState(state, reason || 'agenda');
    localStorage.setItem(fallbackKey, JSON.stringify(state));
    return state;
  }

  function update(mutator, reason) {
    const api = data();
    if (api?.updateState) return api.updateState(mutator, reason || 'agenda');
    const state = readState();
    mutator(state);
    return saveState(state, reason);
  }

  return Object.freeze({ readState, saveState, update });
})();
