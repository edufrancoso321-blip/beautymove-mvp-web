/* BeautyMove — S.O.S. pricing sync final */
(function(){
  'use strict';
  const SERVICES_KEY='beautymove.mvp.services';
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(SERVICES_KEY)||'null');return Array.isArray(v)?v:[];}catch(_){return[];}};
  const findService=(input, list)=>{
    const idx=input?.dataset?.index ?? input?.dataset?.i;
    if(idx!=null && list[Number(idx)]) return list[Number(idx)];
    const key=input?.value || input?.dataset?.service || input?.dataset?.id;
    return list.find(s=>String(s.id||'')===String(key)||String(s.name)===String(key));
  };
  function sync(){
    const form=document.getElementById('sosForm');
    const menus=[document.getElementById('bmSosServiceMenu'),document.getElementById('sosServiceMenu')].filter(Boolean);
    if(!form||!menus.length)return;
    const list=read();
    const checked=[];
    menus.forEach(menu=>menu.querySelectorAll('input[type="checkbox"]:checked').forEach(input=>{
      const item=findService(input,list); if(item&&!checked.some(x=>x.id===item.id))checked.push(item);
    }));
    const client=checked.reduce((n,s)=>n+Number(s.clientPrice||0),0);
    const offer=checked.reduce((n,s)=>n+Number(s.professionalOffer||0),0);
    const duration=checked.reduce((n,s)=>n+Number(s.duration||0),0);
    const clientEl=document.getElementById('sosClientPrice');
    const offerEl=document.getElementById('sosProfessionalOffer');
    const durationEl=document.getElementById('sosServiceDuration');
    if(clientEl)clientEl.textContent=checked.length?money(client):'—';
    if(offerEl)offerEl.textContent=checked.length?money(offer):'—';
    if(durationEl)durationEl.textContent=checked.length?`${duration} min`:'—';
    form.dataset.sosClientPrice=String(client);
    form.dataset.sosProfessionalOffer=String(offer);
    form.dataset.sosDuration=String(duration);
    form.dataset.sosSelectedServices=JSON.stringify(checked);
  }
  function bind(){
    [document.getElementById('bmSosServiceMenu'),document.getElementById('sosServiceMenu')].filter(Boolean).forEach(menu=>{
      menu.querySelectorAll('input[type="checkbox"]').forEach(input=>{
        if(input.dataset.bmPricingFinal==='1')return;
        input.dataset.bmPricingFinal='1';
        input.addEventListener('change',()=>setTimeout(sync,0));
      });
      if(!menu.dataset.bmPricingObserver){
        menu.dataset.bmPricingObserver='1';
        new MutationObserver(()=>{bind();sync();}).observe(menu,{childList:true,subtree:true});
      }
    });
    sync();
  }
  function boot(){bind();setTimeout(bind,250);setTimeout(bind,700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
