/* BeautyMove — ponte estável entre dados persistidos e a Agenda.
 * As métricas inferiores foram removidas da interface, mas agenda.js ainda
 * usa seus alvos internamente. Mantemos apenas os alvos invisíveis e uma
 * atualização determinística da grade quando a fonte de dados muda.
 */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  let lastSignature='';
  let refreshTimer=null;

  function ensureMetricTargets(){
    const ids=['metricAppointments','metricProgress','metricSos','metricCanceled'];
    let host=document.getElementById('agendaMetricCompat');
    if(!host){
      host=document.createElement('div');
      host.id='agendaMetricCompat';
      host.hidden=true;
      host.setAttribute('aria-hidden','true');
      document.body.appendChild(host);
    }
    ids.forEach(id=>{
      if(!document.getElementById(id)){
        const node=document.createElement('span');
        node.id=id;
        host.appendChild(node);
      }
    });
  }

  function readState(){
    try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{};}
    catch(_){return {};}
  }

  function signature(state){
    return JSON.stringify({
      appointments:Array.isArray(state.appointments)?state.appointments:[],
      opportunities:Array.isArray(state.opportunities)?state.opportunities:[],
      transactions:Array.isArray(state.transactions)?state.transactions:[]
    });
  }

  function refreshAgenda(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{
      const state=readState();
      const next=signature(state);
      if(next===lastSignature)return;
      lastSignature=next;
      document.getElementById('todayBtn')?.click();
    },80);
  }

  function loadBridge(){
    if(window.BeautyMoveFirebaseBootstrap){
      return window.BeautyMoveFirebaseBootstrap().catch(()=>{});
    }
    return new Promise(resolve=>{
      const existing=document.querySelector('script[src="assets/js/mvp-firebase-bootstrap.js"]');
      if(existing){
        existing.addEventListener('load',()=>window.BeautyMoveFirebaseBootstrap?.().catch(()=>{}),{once:true});
        return resolve();
      }
      const script=document.createElement('script');
      script.src='assets/js/mvp-firebase-bootstrap.js?v=20260818-stable1';
      script.onload=()=>{window.BeautyMoveFirebaseBootstrap?.().catch(()=>{});resolve();};
      script.onerror=()=>resolve();
      document.head.appendChild(script);
    });
  }

  function boot(){
    ensureMetricTargets();
    lastSignature=signature(readState());
    window.addEventListener('beautymove:data-ready',refreshAgenda);
    window.addEventListener('storage',event=>{
      if(event.key===STATE_KEY)refreshAgenda();
    });
    loadBridge();
  }

  if(document.readyState==='loading'){
    ensureMetricTargets();
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else boot();
})();
