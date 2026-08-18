/* BeautyMove — sincroniza o indicador S.O.S. ativos com a Central de Oportunidades */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const metric=()=>document.getElementById('metricSos');
  const date=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  function refresh(){
    const el=metric();
    if(!el)return;
    try{
      const state=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');
      const items=Array.isArray(state.opportunities)?state.opportunities:[];
      const active=items.filter(o=>o&&o.date===date()&&o.source==='sos'&&o.status!=='resolved'&&o.status!=='cancelado'&&!o.acceptedBy);
      el.textContent=String(active.length);
    }catch(_){el.textContent='0';}
  }
  function boot(){
    refresh();
    setInterval(refresh,700);
    ['agendaDatePicker','prevDay','nextDay','todayBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(refresh,180)));
    document.getElementById('agendaDatePicker')?.addEventListener('change',refresh);
    window.addEventListener('storage',refresh);
    window.addEventListener('beautymove:sos-accepted',()=>setTimeout(refresh,50));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300),{once:true});
  else setTimeout(boot,300);
})();
