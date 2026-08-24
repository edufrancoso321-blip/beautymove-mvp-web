/* BeautyMove — sincronização imediata do S.O.S. com a Agenda e Central de Oportunidades. */
(function(){
  'use strict';
  function refresh(){
    document.getElementById('todayBtn')?.click();
    window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-refresh'));
  }
  function boot(){
    if(document.body?.dataset?.role!=='salao')return;
    window.addEventListener('beautymove:sos-created',()=>setTimeout(refresh,50));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
