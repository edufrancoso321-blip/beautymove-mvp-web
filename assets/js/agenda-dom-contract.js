/* BeautyMove — Agenda DOM contract
   Keeps non-visual controller targets available without reintroducing UI patches.
*/
(() => {
  'use strict';
  if (document.body?.dataset?.role !== 'salao') return;
  const ids = ['metricAppointments','metricProgress','metricSos','metricCanceled'];
  ids.forEach(id => {
    if (document.getElementById(id)) return;
    const el = document.createElement('span');
    el.id = id;
    el.hidden = true;
    el.setAttribute('aria-hidden','true');
    document.body.appendChild(el);
  });
})();
