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

  function seedDemoAgenda(){
    const key='beautymove.mvp.state';
    const marker='beautymove.mvp.demo-seeded-v1';
    try{
      if(localStorage.getItem(marker)==='1') return;
      const current=JSON.parse(localStorage.getItem(key)||'null');
      if(current && ((Array.isArray(current.appointments)&&current.appointments.length) || (Array.isArray(current.opportunities)&&current.opportunities.length))) {
        localStorage.setItem(marker,'1');
        return;
      }
      const date=new Date();
      const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
      const dateKey=`${y}-${m}-${d}`;
      const appointments=[{
        id:'demo-marta-0800',
        date:dateKey,
        time:'08:00',
        professional:'Ana',
        client:'MARTA',
        service:'Coloração + Luzes + Corte feminino',
        services:[
          {name:'Coloração',duration:120,value:150},
          {name:'Luzes',duration:180,value:250},
          {name:'Corte feminino',duration:60,value:80}
        ],
        duration:360,
        value:480,
        status:'em_andamento',
        source:'agenda-demo'
      }];
      const opportunities=[
        {id:'demo-sos-marta',date:dateKey,time:'09:00',client:'MARTA',service:'CORTE E ESCOVA',specialty:'Cabelos',acceptedBy:'Juliana Costa',source:'sos',status:'accepted'},
        {id:'demo-sos-gertrudes',date:dateKey,time:'10:00',client:'GERTRUDES',service:'Atendimento',specialty:'Cabelos',acceptedBy:'Lucas Ferreira',source:'sos',status:'accepted'},
        {id:'demo-sos-solange',date:dateKey,time:'11:00',client:'SOLANGE',service:'CORTE E ESCOVA',specialty:'Cabelos',acceptedBy:'Juliana Costa',source:'sos',status:'accepted'}
      ];
      localStorage.setItem(key,JSON.stringify({appointments,opportunities,transactions:[]}));
      localStorage.setItem(marker,'1');
    }catch(_){}
  }

  function boot(){
    seedDemoAgenda();
    fixAppointmentServices();
    fixSosPricing();
    removeConfirmationButtons();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,350),{once:true});
  else setTimeout(boot,350);
  setInterval(boot,700);
})();
