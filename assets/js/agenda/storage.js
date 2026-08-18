/* BeautyMove Agenda — storage facade and legacy bridge.
 * The bridge is temporary: it lets the existing agenda.js migrate safely
 * without duplicating or deleting its existing behavior in one step.
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

  function installLegacyBridge() {
    const api = data();
    if (!api) return;

    window.agendaReadState = () => api.getState();
    window.agendaSaveState = (state) => api.saveState(state, 'agenda');
    window.agendaReadHours = () => api.getAgendaHours();
    window.agendaSaveHours = (hours) => api.saveAgendaHours(hours);
    window.agendaId = (prefix) => api.id(prefix);
  }

  /* agenda.js is intentionally loaded immediately after this file. The
   * deferred bridge runs after the synchronous script chain has loaded, so
   * the legacy global functions are redirected without editing the large
   * legacy controller in place. */
  setTimeout(installLegacyBridge, 0);

  return Object.freeze({ readState, saveState, update, installLegacyBridge });
})();
