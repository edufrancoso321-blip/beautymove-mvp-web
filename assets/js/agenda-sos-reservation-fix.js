/* BeautyMove — autoridade visual única da coluna S.O.S.
 * Não usa MutationObserver nem disputa o DOM com a Agenda.
 * A Agenda base monta a grade; este módulo pinta somente a coluna S.O.S.
 * em resposta a eventos explícitos de estado/agenda.
 */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const DURATIONS={
    'Corte':60,'Escova':30,'Coloração':120,'Luzes':180,
    'Corte feminino':60,'Corte masculino':45,'Manicure':60,'Pedicure':60,
    'Limpeza de pele':75,'Design de sobrancelhas':45
  };
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const mins=t=>{const p=String(t||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const label=m=>{m=Number(m)||0;const h=Math.floor(m/60),r=m%60;return h?(r?`${h}h ${r}min`:`${h}h`):`${r}min`;};
  const servicesOf=o=>{
    const list=Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:Array.isArray(o?.services)?o.services:[];
    if(list.length)return list.map(s=>({name:s?.name||'',duration:Number(s?.duration||s?.durationMinutes)||DURATIONS[String(s?.name||'').trim()]||30}));
    return String(o?.service||'').split('+').map(x=>x.trim()).filter(Boolean).map(name=>({name,duration:DURATIONS[name]||30}));
  };
  const durationOf=o=>servicesOf(o).reduce((n,s)=>n+Number(s.duration||0),0)||Number(o?.durationSnapshot||o?.durationMinutes||o?.duration)||30;
  const endOf=o=>o?.endTime||time(mins(o?.time||'08:00')+durationOf(o));
  const currentDate=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);

  function cells(){
    const grid=document.getElementById('agendaGrid');
    return [...(grid?.querySelectorAll('td.sos-free-cell,td.sos-cell[data-sos-cell="true"],td.bm-sos-final-cell')||[])];
  }

  function acceptedAppointments(state,date){
    return (Array.isArray(state.appointments)?state.appointments:[])
      .filter(a=>a&&a.date===date&&a.status!=='cancelado'&&a.source==='sos'&&(a.sosAcceptedBy||a.acceptedBy||a.sosOpportunityId))
      .sort((a,b)=>mins(a.time)-mins(b.time));
  }

  function activeOpportunities(state,date){
    return (Array.isArray(state.opportunities)?state.opportunities:[])
      .filter(o=>o&&o.date===date&&o.source==='sos'&&!['resolved','cancelado','cancelada'].includes(String(o.status||'').toLowerCase()))
      .sort((a,b)=>mins(a.time)-mins(b.time));
  }

  function clear(list){
    list.forEach(cell=>{
      cell.className='sos-free-cell bm-sos-authority-cell';
      cell.dataset.sosCell='true';
      cell.removeAttribute('data-sos-id');
      cell.removeAttribute('data-appointment-id');
      cell.innerHTML='Livre';
    });
  }

  function draw(list,item,isAppointment){
    const start=mins(item.time||'08:00');
    const duration=Math.max(30,durationOf(item));
    const end=start+duration;
    const endTime=endOf(item);
    const professional=isAppointment
      ?(item.sosAcceptedBy||item.acceptedBy||item.professional||'Profissional confirmada')
      :(item.acceptedBy||item.professional||'Aguardando profissional');
    list.forEach(cell=>{
      const minute=mins(cell.dataset.time);
      if(minute<start||minute>=end)return;
      const first=minute===start;
      cell.className=`sos-cell sos-cell-found bm-sos-authority-cell ${first?'sos-cell-start':'sos-cell-continuation'}`;
      cell.dataset.sosCell='true';
      if(isAppointment){
        cell.dataset.appointmentId=item.id;
        if(item.sosOpportunityId)cell.dataset.sosId=item.sosOpportunityId;
      }else{
        cell.dataset.sosId=item.id;
      }
      cell.innerHTML=first
        ?`<strong class="bm-sos-client">${esc(item.client||'Cliente')}</strong><span class="bm-sos-service">${esc(item.service||'Atendimento')}</span><span class="bm-sos-meta">${esc(item.time||'')} – ${esc(endTime)} · ${label(duration)}</span><span class="bm-sos-professional">Profissional: ${esc(professional)}</span>`
        :`<span class="bm-sos-continuation">${esc(item.client||'Cliente')} · até ${esc(endTime)}</span>`;
    });
  }

  function paint(){
    const list=cells();if(!list.length)return;
    const state=read(),date=currentDate();
    clear(list);
    /* Atendimento confirmado tem precedência sobre oportunidade aberta. */
    acceptedAppointments(state,date).forEach(item=>draw(list,item,true));
    activeOpportunities(state,date).forEach(item=>draw(list,item,false));
  }

  function requestPaint(){requestAnimationFrame(paint);}

  function bind(){
    ['prevDay','nextDay','todayBtn','agendaInterval'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(requestPaint,0)));
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(requestPaint,0));
    window.addEventListener('beautymove:agenda-hydrated',requestPaint);
    window.addEventListener('beautymove:sos-created',requestPaint);
    window.addEventListener('beautymove:sos-accepted',requestPaint);
    window.addEventListener('beautymove:sos-runtime-refresh',requestPaint);
    window.addEventListener('beautymove:normal-appointment-isolated',requestPaint);
    window.addEventListener('storage',e=>{if(e.key===STATE_KEY)requestPaint();});
    setTimeout(requestPaint,0);
  }

  function styles(){
    if(document.getElementById('bmSosAuthorityCss'))return;
    const s=document.createElement('style');s.id='bmSosAuthorityCss';
    s.textContent=`
      #agendaGrid .bm-sos-authority-cell{font-size:inherit!important}
      #agendaGrid .bm-sos-client{font-size:15px!important;font-weight:900!important;line-height:1.15!important;display:block!important}
      #agendaGrid .bm-sos-service{font-size:11.5px!important;line-height:1.25!important;display:block!important;margin-top:2px!important}
      #agendaGrid .bm-sos-meta{font-size:10.5px!important;line-height:1.2!important;display:block!important;margin-top:2px!important}
      #agendaGrid .bm-sos-professional{font-size:11px!important;font-weight:800!important;line-height:1.2!important;display:block!important;margin-top:4px!important}
      #agendaGrid .bm-sos-continuation{font-size:10.5px!important;font-weight:700!important;line-height:1.2!important}
    `;
    document.head.appendChild(s);
  }

  function boot(){
    if(document.body?.dataset?.role!=='salao')return;
    styles();bind();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
