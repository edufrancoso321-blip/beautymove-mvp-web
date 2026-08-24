/* BeautyMove — sincronização imediata do S.O.S. com a Agenda e Central de Oportunidades. */
(function(){
  'use strict';
  function loadAuthoritativeGrid(){
    if(document.getElementById('bmAgendaAuthoritativeGrid'))return;
    const s=document.createElement('script');
    s.id='bmAgendaAuthoritativeGrid';
    s.src='assets/js/agenda-authoritative-grid-fix.js?v=20260824-1';
    s.async=false;
    document.head.appendChild(s);
  }
  function refresh(){
    document.getElementById('todayBtn')?.click();
    window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-refresh'));
  }
  function boot(){
    if(document.body?.dataset?.role!=='salao')return;
    setTimeout(loadAuthoritativeGrid,700);
    window.addEventListener('beautymove:sos-created',()=>setTimeout(refresh,50));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
