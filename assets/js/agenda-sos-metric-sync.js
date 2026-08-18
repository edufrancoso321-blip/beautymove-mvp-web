/* BeautyMove — compatibilidade após remoção das métricas inferiores da Agenda */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';

  function ensureMetricTargets(){
    const ids=['metricAppointments','metricProgress','metricSos','metricCanceled'];
    let host=document.getElementById('agendaMetricCompat');
    if(!host){host=document.createElement('div');host.id='agendaMetricCompat';host.hidden=true;host.setAttribute('aria-hidden','true');document.body.appendChild(host);}
    ids.forEach(id=>{if(!document.getElementById(id)){const node=document.createElement('span');node.id=id;host.appendChild(node);}});
  }
  function today(){const picker=document.getElementById('agendaDatePicker');if(picker&&picker.value)return picker.value;return new Date().toISOString().slice(0,10);}
  function readState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{};}catch(_){return {};}}
  function sync(){
    ensureMetricTargets();
    const metric=document.getElementById('metricSos');
    if(!metric)return;
    const state=readState(),date=today(),opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const active=opportunities.filter(o=>o&&o.date===date&&o.source==='sos'&&o.status!=='resolved'&&o.status!=='cancelado');
    const panel=document.getElementById('sosOpportunityPanel'),queue=panel?.querySelectorAll('.sos-op-queue-item'),panelCount=queue?queue.length:0,activeShell=panel?.querySelector('.sos-op-shell.active');
    const fallbackCount=activeShell&&!activeShell.classList.contains('tracking')?Math.max(1,panelCount):0;
    metric.textContent=String(active.length||fallbackCount);
  }
  function refreshAgenda(){setTimeout(()=>{document.getElementById('todayBtn')?.click();sync();},120);}
  function loadBridge(){
    if(window.BeautyMoveFirebaseBootstrap)return window.BeautyMoveFirebaseBootstrap().catch(()=>{});
    return new Promise(resolve=>{
      const existing=document.querySelector('script[src="assets/js/mvp-firebase-bootstrap.js"]');
      if(existing){existing.addEventListener('load',()=>window.BeautyMoveFirebaseBootstrap?.().catch(()=>{}),{once:true});return resolve();}
      const script=document.createElement('script');script.src='assets/js/mvp-firebase-bootstrap.js';
      script.onload=()=>{window.BeautyMoveFirebaseBootstrap?.().catch(()=>{});resolve();};script.onerror=()=>resolve();document.head.appendChild(script);
    });
  }
  function boot(){
    ensureMetricTargets();sync();
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(sync,100));
    ['prevDay','nextDay','todayBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(sync,300)));
    window.addEventListener('storage',sync);
    window.addEventListener('beautymove:sos-accepted',()=>setTimeout(sync,100));
    window.addEventListener('beautymove:data-ready',()=>{refreshAgenda();});
    setInterval(sync,300);
    loadBridge();
  }
  if(document.readyState==='loading'){ensureMetricTargets();document.addEventListener('DOMContentLoaded',boot,{once:true});}else boot();
})();
