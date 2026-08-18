/* BeautyMove — Agenda S.O.S. canonical entrypoint.
 * Compatibility bridge: the approved legacy UI remains active while its state
 * is migrated to the canonical data/services layers.
 */
(function(){
  'use strict';
  if (window.__BEAUTYMOVE_AGENDA_SOS_BRIDGE__) return;
  window.__BEAUTYMOVE_AGENDA_SOS_BRIDGE__ = true;

  const load = (src, done) => {
    const existing = document.querySelector(`script[data-beautymove-module="${src}"]`);
    if (existing) { done?.(); return; }
    const script = document.createElement('script');
    script.src = `${src}?v=20260818-canonical`;
    script.dataset.beautymoveModule = src;
    script.onload = () => done?.();
    document.head.appendChild(script);
  };

  load('assets/js/agenda/services.js', () => {
    load('assets/js/agenda-sos-correction.js');
  });
})();
