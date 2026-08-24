/* BeautyMove — sincronização imediata do S.O.S. com a Agenda e Central de Oportunidades. */
(function(){
  'use strict';
  function loadScript(id,src){
    if(document.getElementById(id))return;
    const s=document.createElement('script');s.id=id;s.src=src;s.async=false;document.head.appendChild(s);
  }
  function refresh(){
    document.getElementById('todayBtn')?.click();
    window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-refresh'));
  }
  function boot(){
    if(document.body?.dataset?.role!=='salao')return;
    setTimeout(()=>{
      loadScript('bmAgendaAuthoritativeGrid','assets/js/agenda-authoritative-grid-fix.js?v=20260824-4');
      loadScript('bmAgendaFinalVisualFix','assets/js/agenda-grid-final-visual-fix.js?v=20260824-1');
      loadScript('bmAgendaSosSelectionAuthority','assets/js/agenda-sos-selection-authority.js?v=20260824-1');
      loadScript('bmAgendaConflictAuthority','assets/js/agenda-conflict-authority.js?v=20260824-1');
      loadScript('bmAgendaSosDetailAuthority','assets/js/agenda-sos-detail-authority.js?v=20260824-1');
      /* O antigo agenda-web-integrity-final.js não é mais carregado: havia dois motores
         de rowspan competindo entre si e isso era a origem do deslocamento de colunas. */
    },700);
    window.addEventListener('beautymove:sos-created',()=>setTimeout(refresh,50));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
