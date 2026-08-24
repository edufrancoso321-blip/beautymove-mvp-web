/* BeautyMove — runtime bridge for the authoritative Agenda Core V3. */
(function(){
  'use strict';
  function loadScript(id,src){
    if(document.getElementById(id))return;
    const s=document.createElement('script');s.id=id;s.src=src;s.async=false;document.head.appendChild(s);
  }
  function refresh(){
    window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-refresh'));
  }
  function boot(){
    if(document.body?.dataset?.role!=='salao')return;
    setTimeout(()=>{
      /* Agenda Core V3 is already loaded by agenda.js and is the only renderer. */
      loadScript('bmAgendaSosSelectionAuthority','assets/js/agenda-sos-selection-authority.js?v=20260824-2');
      loadScript('bmAgendaConflictAuthority','assets/js/agenda-conflict-authority.js?v=20260824-2');
      loadScript('bmAgendaSosDetailAuthority','assets/js/agenda-sos-detail-authority.js?v=20260824-2');
      refresh();
    },700);
    window.addEventListener('beautymove:sos-created',()=>setTimeout(refresh,50));
    window.addEventListener('beautymove:sos-accepted',()=>setTimeout(refresh,50));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
