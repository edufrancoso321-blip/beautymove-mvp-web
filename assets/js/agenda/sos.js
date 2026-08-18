/* BeautyMove — Agenda S.O.S. canonical entrypoint.
 * Temporary compatibility bridge: the legacy implementation remains intact
 * until the consolidated domain module is validated end-to-end.
 */
(function(){
  'use strict';
  if (window.__BEAUTYMOVE_AGENDA_SOS_BRIDGE__) return;
  window.__BEAUTYMOVE_AGENDA_SOS_BRIDGE__ = true;
  const script = document.createElement('script');
  script.src = 'assets/js/agenda-sos-correction.js?v=20260818-bridge1';
  script.dataset.beautymoveLegacy = 'agenda-sos-correction';
  document.head.appendChild(script);
})();
