/* BeautyMove Agenda — storage facade.
 * Agenda modules use this API instead of knowing where state is stored.
 */
window.BeautyMoveAgendaStorage = (() => {
  'use strict';

  function data() {
    return window.BeautyMoveData || null;
  }

  function readState() {
    const api = data();
    if (!api?.getState) throw new Error('BeautyMoveData is not available.');
    return api.getState();
  }

  function saveState(state, reason) {
    const api = data();
    if (!api?.saveState) throw new Error('BeautyMoveData is not available.');
    return api.saveState(state, reason || 'agenda');
  }

  function update(mutator, reason) {
    const api = data();
    if (!api?.updateState) throw new Error('BeautyMoveData is not available.');
    return api.updateState(mutator, reason || 'agenda');
  }

  return Object.freeze({ readState, saveState, update });
})();
