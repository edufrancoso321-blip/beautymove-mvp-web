/* BeautyMove Agenda — legacy storage bridge.
 * Keeps the existing agenda renderer intact while routing its state API
 * through BeautyMoveData. This is intentionally a compatibility layer;
 * the legacy renderer can be migrated later without changing behavior now.
 */
(() => {
  'use strict';
  const api = window.BeautyMoveAgendaStorage;
  if (!api) return;

  window.agendaReadState = () => api.readState();
  window.agendaSaveState = (state) => api.saveState(state, 'agenda-legacy-bridge');
  window.agendaReadHours = () => {
    const data = window.BeautyMoveData;
    return data?.getAgendaHours ? data.getAgendaHours() : [];
  };
  window.agendaId = (prefix) => {
    const data = window.BeautyMoveData;
    return data?.id ? data.id(prefix) : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  };
})();
