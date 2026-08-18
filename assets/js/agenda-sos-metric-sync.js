/* BeautyMove — sincronização robusta do indicador S.O.S. da Agenda */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';

  function today(){
    const picker=document.getElementById('agendaDatePicker');
    if(picker&&picker.value)return picker.value;
    return new Date().toISOString().slice(0,10);
  }

  function readState(){
    try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{};}
    catch(_){return {};}
  }

  function sync(){
    const metric=document.getElementById('metricSos');
    if(!metric)return;
    const state=readState();
    const date=today();
    const opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const active=opportunities.filter(o=>
      o && o.date===date && o.source==='sos' &&
      o.status!=='resolved' && o.status!=='cancelado'
    );

    /* A Central de Oportunidades é a referência visual final. */
    const panel=document.getElementById('sosOpportunityPanel');
    const queue=panel?.querySelectorAll('.sos-op-queue-item');
    const panelCount=queue?queue.length:0;
    const activeShell=panel?.querySelector('.sos-op-shell.active');
    const hasActiveCentral=!!activeShell && !activeShell.classList.contains('tracking');
    const fallbackCount=hasActiveCentral ? Math.max(1,panelCount) : 0;
    metric.textContent=String(active.length||fallbackCount);
  }

  function boot(){
    sync();
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(sync,100));
    ['prevDay','nextDay','todayBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(sync,300)));
    window.addEventListener('storage',sync);
    window.addEventListener('beautymove:sos-accepted',()=>setTimeout(sync,100));
    setInterval(sync,300);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
