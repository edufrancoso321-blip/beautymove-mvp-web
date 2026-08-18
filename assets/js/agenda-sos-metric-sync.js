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

  function writeState(state){
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state));return true;}
    catch(_){return false;}
  }

  /* Remove apenas registros impossíveis: mesmo salão/data/profissional/cliente/serviço
     com horários sobrepostos. O atendimento mais antigo é preservado e sua duração
     cobre o maior término encontrado. Agendamentos distintos e não sobrepostos ficam intactos. */
  function normalizeOverlappingAppointments(state){
    if(!Array.isArray(state.appointments)||state.appointments.length<2)return false;
    const appointments=state.appointments.filter(a=>a&&a.status!=='cancelado');
    const groups=new Map();
    const minutes=t=>{const [h,m]=String(t||'00:00').split(':').map(Number);return (h||0)*60+(m||0);};
    const duration=a=>Number(a?.duration)||((Array.isArray(a?.services)?a.services:[]).reduce((s,x)=>s+Number(x?.duration||0),0)||30);
    const key=a=>[a.date,a.professional,a.client,(a.service||'').trim()].join('|');
    appointments.forEach(a=>{const k=key(a);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(a);});
    let changed=false;
    groups.forEach(list=>{
      list.sort((a,b)=>minutes(a.time)-minutes(b.time));
      for(let i=0;i<list.length-1;i++){
        const keep=list[i];
        let keepEnd=minutes(keep.time)+duration(keep);
        let j=i+1;
        while(j<list.length){
          const duplicate=list[j];
          const start=minutes(duplicate.time);
          if(start>=keepEnd)break;
          const duplicateEnd=start+duration(duplicate);
          if(duplicateEnd>keepEnd){
            keep.duration=duplicateEnd-minutes(keep.time);
            if(Array.isArray(keep.services)&&keep.services.length===1)keep.services[0].duration=keep.duration;
            keepEnd=duplicateEnd;
          }
          const index=state.appointments.indexOf(duplicate);
          if(index>=0){state.appointments.splice(index,1);changed=true;}
          list.splice(j,1);
        }
      }
    });
    if(changed)writeState(state);
    return changed;
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
      normalizeOverlappingAppointments(state);
      const next=signature(readState());
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
    const state=readState();
    const normalized=normalizeOverlappingAppointments(state);
    lastSignature=signature(readState());
    window.addEventListener('beautymove:data-ready',refreshAgenda);
    window.addEventListener('storage',event=>{
      if(event.key===STATE_KEY)refreshAgenda();
    });
    if(normalized)document.getElementById('todayBtn')?.click();
    loadBridge();
  }

  if(document.readyState==='loading'){
    ensureMetricTargets();
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else boot();
})();
