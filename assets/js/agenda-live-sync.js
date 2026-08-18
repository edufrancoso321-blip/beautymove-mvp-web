/* BeautyMove Agenda — live state synchronization.
 * Keeps the rendered Agenda and its metrics synchronized with the canonical state
 * when another Agenda module changes local application state (notably S.O.S.).
 */
(function(){
  'use strict';
  if (window.__BEAUTYMOVE_AGENDA_LIVE_SYNC__) return;
  window.__BEAUTYMOVE_AGENDA_LIVE_SYNC__ = true;

  let queued = false;
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

  window.addEventListener('beautymove:state-changed', refreshAgenda);
  window.addEventListener('beautymove:sos-created', refreshAgenda);
  window.addEventListener('beautymove:sos-accepted', refreshAgenda);
  window.addEventListener('beautymove:agenda-hours-changed', refreshAgenda);
})();
