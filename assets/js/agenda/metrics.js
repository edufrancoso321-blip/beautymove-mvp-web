/* BeautyMove — Agenda metrics.
 *
 * Single-purpose boundary for the bottom S.O.S. metric.
 * The legacy Agenda renderer can still paint the metric during a full grid
 * render, but this module immediately reconciles it against the same
 * canonical opportunity state used by the S.O.S. panel.
 */
(function(){
  'use strict';
  if (window.__BEAUTYMOVE_AGENDA_METRICS_BOUNDARY__) return;
  window.__BEAUTYMOVE_AGENDA_METRICS_BOUNDARY__ = true;

  const STATE_KEY = 'beautymove.mvp.state';
  let scheduled = false;
  let observer = null;

  function readState(){
    try {
      if (window.BeautyMoveData?.getState) return window.BeautyMoveData.getState();
      const raw = localStorage.getItem(STATE_KEY);
      const value = raw ? JSON.parse(raw) : {};
      return value && typeof value === 'object' ? value : {};
    } catch (_) {
      return {};
    }
  }

  function currentDate(){
    return document.getElementById('agendaDatePicker')?.value || new Date().toISOString().slice(0,10);
  }

  function activeSosCount(){
    const state = readState();
    const opportunities = Array.isArray(state.opportunities) ? state.opportunities : [];
    const date = currentDate();
    return opportunities.filter(item =>
      item &&
      item.date === date &&
      item.source === 'sos' &&
      item.status !== 'resolved' &&
      item.status !== 'cancelado'
    ).length;
  }

  function reconcile(){
    scheduled = false;
    const node = document.getElementById('metricSos');
    if (!node) return;
    const expected = String(activeSosCount());
    if (node.textContent !== expected) node.textContent = expected;
  }

  function schedule(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(reconcile);
  }

  function boot(){
    reconcile();
    window.addEventListener('beautymove:state-changed', schedule);
    window.addEventListener('beautymove:sos-created', schedule);
    window.addEventListener('beautymove:sos-accepted', schedule);
    document.getElementById('agendaDatePicker')?.addEventListener('change', schedule);

    const target = document.getElementById('metricSos');
    if (target && !observer) {
      observer = new MutationObserver(schedule);
      observer.observe(target, { childList:true, characterData:true, subtree:true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }
})();
