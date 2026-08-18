/* BeautyMove — recuperação segura da Agenda + sincronização de preços S.O.S. */
(function(){
  'use strict';
  const SERVICES_KEY='beautymove.mvp.services';
  const AGENDA_STATE_KEY='beautymove.mvp.state';
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const readServices=()=>{try{const v=JSON.parse(localStorage.getItem(SERVICES_KEY)||'null');return Array.isArray(v)?v:[];}catch(_){return[];}};
  const emptyState={appointments:[],opportunities:[],transactions:[]};

  function normalizeState(){
    try{
      const raw=localStorage.getItem(AGENDA_STATE_KEY);
      const state=raw?JSON.parse(raw):{};
      if(!state||typeof state!=='object'||Array.isArray(state))throw new Error('invalid');
      if(!Array.isArray(state.appointments))state.appointments=[];
      if(!Array.isArray(state.opportunities))state.opportunities=[];
      if(!Array.isArray(state.transactions))state.transactions=[];
      localStorage.setItem(AGENDA_STATE_KEY,JSON.stringify(state));
    }catch(_){
      localStorage.setItem(AGENDA_STATE_KEY,JSON.stringify(emptyState));
    }
  }

  function recoverAgenda(){
    normalizeState();
    const grid=document.getElementById('agendaGrid');
    if(!grid)return;
    if(grid.querySelector('.agenda-grid'))return;
    if(typeof window.agendaInit!=='function')return;
    try{window.agendaInit();}catch(error){
      console.error('BeautyMove Agenda: falha na inicialização',error);
      normalizeState();
      try{window.agendaInit();}catch(secondError){console.error('BeautyMove Agenda: segunda tentativa falhou',secondError);}
    }
  }

  function syncSosPricing(){
    const form=document.getElementById('sosForm');
    const menus=[document.getElementById('bmSosServiceMenu'),document.getElementById('sosServiceMenu')].filter(Boolean);
    if(!form||!menus.length)return;
    const services=readServices(),selected=[];
    const find=input=>{
      const index=input?.dataset?.index;
      if(index!=null&&services[Number(index)])return services[Number(index)];
      const key=input?.value||input?.dataset?.service||input?.dataset?.id;
      return services.find(s=>String(s.id||'')===String(key)||String(s.name)===String(key));
    };
    menus.forEach(menu=>menu.querySelectorAll('input[type="checkbox"]:checked').forEach(input=>{
      const item=find(input);
      if(item&&!selected.some(s=>String(s.id||s.name)===String(item.id||item.name)))selected.push(item);
    }));
    const client=selected.reduce((n,s)=>n+Number(s.clientPrice??s.value??0),0);
    const offer=selected.reduce((n,s)=>n+Number(s.professionalOffer??s.offer??0),0);
    const duration=selected.reduce((n,s)=>n+Number(s.duration||0),0);
    const clientEl=document.getElementById('sosClientPrice'),offerEl=document.getElementById('sosProfessionalOffer'),durationEl=document.getElementById('sosServiceDuration');
    if(clientEl)clientEl.textContent=selected.length?money(client):'—';
    if(offerEl)offerEl.textContent=selected.length?money(offer):'—';
    if(durationEl)durationEl.textContent=selected.length?`${duration} min`:'—';
    form.dataset.sosClientPrice=String(client);
    form.dataset.sosProfessionalOffer=String(offer);
    form.dataset.sosDuration=String(duration);
    form.dataset.sosSelectedServices=JSON.stringify(selected);
  }

  function boot(){
    normalizeState();
    setTimeout(recoverAgenda,250);
    setTimeout(recoverAgenda,900);
    setTimeout(syncSosPricing,300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
