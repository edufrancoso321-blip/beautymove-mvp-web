/* BeautyMove — S.O.S. pricing sync + agenda recovery */
(function(){
  'use strict';
  const SERVICES_KEY='beautymove.mvp.services';
  const AGENDA_STATE_KEY='beautymove.mvp.state';
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(SERVICES_KEY)||'null');return Array.isArray(v)?v:[];}catch(_){return[];}};
  const findService=(input,list)=>{const idx=input?.dataset?.index??input?.dataset?.i;if(idx!=null&&list[Number(idx)])return list[Number(idx)];const key=input?.value||input?.dataset?.service||input?.dataset?.id;return list.find(s=>String(s.id||'')===String(key)||String(s.name)===String(key));};
  function sync(){
    const form=document.getElementById('sosForm');
    const menus=[document.getElementById('bmSosServiceMenu'),document.getElementById('sosServiceMenu')].filter(Boolean);
    if(!form||!menus.length)return;
    const list=read(),checked=[];
    menus.forEach(menu=>menu.querySelectorAll('input[type="checkbox"]:checked').forEach(input=>{const item=findService(input,list);if(item&&!checked.some(x=>x.id===item.id))checked.push(item);}));
    const client=checked.reduce((n,s)=>n+Number(s.clientPrice||0),0),offer=checked.reduce((n,s)=>n+Number(s.professionalOffer||0),0),duration=checked.reduce((n,s)=>n+Number(s.duration||0),0);
    const clientEl=document.getElementById('sosClientPrice'),offerEl=document.getElementById('sosProfessionalOffer'),durationEl=document.getElementById('sosServiceDuration');
    if(clientEl)clientEl.textContent=checked.length?money(client):'—';
    if(offerEl)offerEl.textContent=checked.length?money(offer):'—';
    if(durationEl)durationEl.textContent=checked.length?`${duration} min`:'—';
    form.dataset.sosClientPrice=String(client);form.dataset.sosProfessionalOffer=String(offer);form.dataset.sosDuration=String(duration);form.dataset.sosSelectedServices=JSON.stringify(checked);
  }
  function recoverAgenda(){
    try{
      const raw=localStorage.getItem(AGENDA_STATE_KEY);
      if(raw){
        const state=JSON.parse(raw);
        if(!state||typeof state!=='object')throw new Error('invalid state');
        let changed=false;
        if(!Array.isArray(state.appointments)){state.appointments=[];changed=true;}
        if(!Array.isArray(state.opportunities)){state.opportunities=[];changed=true;}
        if(!Array.isArray(state.transactions)){state.transactions=[];changed=true;}
        if(changed)localStorage.setItem(AGENDA_STATE_KEY,JSON.stringify(state));
      }else{
        localStorage.setItem(AGENDA_STATE_KEY,JSON.stringify({appointments:[],opportunities:[],transactions:[]}));
      }
    }catch(_){localStorage.setItem(AGENDA_STATE_KEY,JSON.stringify({appointments:[],opportunities:[],transactions:[]}));}
    const grid=document.getElementById('agendaGrid');
    if(grid&&!grid.querySelector('.agenda-grid')&&typeof window.agendaInit==='function'&&!sessionStorage.getItem('beautymove.agenda.recovered')){
      sessionStorage.setItem('beautymove.agenda.recovered','1');
      try{window.agendaInit();}catch(_){/* agenda will remain available for diagnosis */}
    }
  }
  function bind(){
    const menus=[document.getElementById('bmSosServiceMenu'),document.getElementById('sosServiceMenu')].filter(Boolean);
    if(!menus.length)return;
    menus.forEach(menu=>menu.querySelectorAll('input[type="checkbox"]').forEach(input=>{if(input.dataset.bmPricingStable==='1')return;input.dataset.bmPricingStable='1';input.addEventListener('change',()=>setTimeout(sync,0));}));
    sync();
  }
  function boot(){recoverAgenda();bind();setTimeout(()=>{recoverAgenda();bind();},500);setTimeout(()=>{recoverAgenda();bind();},1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();