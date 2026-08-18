/* BeautyMove — seleção de serviços sem confirmação */
(function(){
  'use strict';
  const SERVICES_KEY='beautymove.mvp.services';
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const readServices=()=>{try{const v=JSON.parse(localStorage.getItem(SERVICES_KEY)||'null');return Array.isArray(v)?v:[];}catch(_){return[];}};

  function fixAppointmentServices(){
    const list=document.getElementById('serviceList');
    const confirm=document.getElementById('saveServicesButton');
    const add=document.getElementById('addServiceButton');
    if(!list)return;
    if(confirm)confirm.hidden=true;
    if(add)add.hidden=true;
    list.querySelectorAll('input[type="checkbox"]').forEach(input=>{
      if(input.dataset.bmImmediate==='1')return;
      input.dataset.bmImmediate='1';
      input.addEventListener('change',()=>{
        /* agenda.js already updates temporaryServices immediately on change. */
        const checked=[...list.querySelectorAll('input[type="checkbox"]:checked')];
        const selected=checked.map(i=>readServices().find(s=>s.name===i.dataset.service)).filter(Boolean);
        const total=selected.reduce((n,s)=>n+Number(s.value??s.clientPrice??0),0);
        const duration=selected.reduce((n,s)=>n+Number(s.duration||0),0);
        const totalEl=document.getElementById('serviceTotal');
        const durationEl=document.getElementById('serviceDuration');
        if(totalEl)totalEl.textContent=money(total);
        if(durationEl)durationEl.textContent=duration?`${duration>=60?Math.floor(duration/60)+'h ':''}${duration%60?duration%60+'min':''}`:'0min';
      });
    });
  }

  function fixSosPricing(){
    const form=document.getElementById('sosForm');
    const menu=document.getElementById('sosServiceMenu');
    if(!form||!menu)return;
    menu.querySelectorAll('input[type="checkbox"]').forEach(input=>{
      if(input.dataset.bmPricing==='1')return;
      input.dataset.bmPricing='1';
      input.addEventListener('change',()=>{
        const selected=[...menu.querySelectorAll('input[type="checkbox"]:checked')];
        const services=readServices();
        const specialty=document.getElementById('sosSpecialty')?.value||'';
        const chosen=selected.map(i=>services.find(s=>String(s.id||s.name)===String(i.value))).filter(Boolean);
        const totalClient=chosen.reduce((n,s)=>n+Number(s.clientPrice||0),0);
        const totalOffer=chosen.reduce((n,s)=>n+Number(s.professionalOffer||0),0);
        const totalDuration=chosen.reduce((n,s)=>n+Number(s.duration||0),0);
        const client=document.getElementById('sosClientPrice');
        const offer=document.getElementById('sosProfessionalOffer');
        const duration=document.getElementById('sosServiceDuration');
        if(client)client.textContent=chosen.length?money(totalClient):'—';
        if(offer)offer.textContent=chosen.length?money(totalOffer):'—';
        if(duration)duration.textContent=chosen.length?`${totalDuration} min`:'—';
        form.dataset.sosClientPrice=String(totalClient);
        form.dataset.sosProfessionalOffer=String(totalOffer);
        form.dataset.sosDuration=String(totalDuration);
        form.dataset.sosSpecialty=specialty;
      });
    });
  }

  function removeConfirmationButtons(){
    document.querySelectorAll('.bm-sos-service-done,.sos-service-multi-menu .bm-sos-service-done').forEach(el=>el.remove());
    const confirm=document.getElementById('saveServicesButton');
    const add=document.getElementById('addServiceButton');
    if(confirm)confirm.hidden=true;
    if(add)add.hidden=true;
  }

  function boot(){
    fixAppointmentServices();
    fixSosPricing();
    removeConfirmationButtons();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,350),{once:true});
  else setTimeout(boot,350);
  setInterval(boot,700);
})();
