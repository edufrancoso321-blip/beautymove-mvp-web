/* BeautyMove Agenda — live state synchronization.
 * Keeps the rendered Agenda and its metrics synchronized with the canonical state
 * when another Agenda module changes local application state (notably S.O.S.).
 */
(function(){
  'use strict';
  if (window.__BEAUTYMOVE_AGENDA_LIVE_SYNC__) return;
  window.__BEAUTYMOVE_AGENDA_LIVE_SYNC__ = true;

  let queued = false;
  let lastStateSignature = '';

  function stateSignature(){
    try { return localStorage.getItem('beautymove.mvp.state') || ''; }
    catch (_) { return ''; }
  }

  function refreshAgenda(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const interval = document.getElementById('agendaInterval');
      if (!interval) return;
      interval.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  window.addEventListener('beautymove:state-changed', () => {
    lastStateSignature = stateSignature();
    refreshAgenda();
  });
  window.addEventListener('beautymove:sos-created', refreshAgenda);
  window.addEventListener('beautymove:sos-accepted', refreshAgenda);
  window.addEventListener('beautymove:agenda-hours-changed', refreshAgenda);
  window.addEventListener('storage', (event) => {
    if (event.key === 'beautymove.mvp.state' || event.key === null) refreshAgenda();
  });

  setInterval(() => {
    const current = stateSignature();
    if (current && current !== lastStateSignature) {
      lastStateSignature = current;
      refreshAgenda();
    }
  }, 700);
})();
