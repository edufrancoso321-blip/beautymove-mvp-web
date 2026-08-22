/* BeautyMove — controlador S.O.S. autoritativo da Agenda. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const DURATIONS={'Corte':60,'Escova':30,'Coloração':120,'Luzes':180,'Corte feminino':60,'Corte masculino':45,'Manicure':60,'Pedicure':60,'Limpeza de pele':75,'Design de sobrancelhas':45};
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const mins=t=>{const p=String(t||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const label=m=>{m=Number(m)||0;const h=Math.floor(m/60),r=m%60;return h?(r?`${h}h ${r}min`:`${h}h`):`${r}min`;};
  const servicesOf=o=>{const list=Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:Array.isArray(o?.services)?o.services:[];if(list.length)return list.map(s=>({name:s?.name||'',duration:Number(s?.duration||s?.durationMinutes)||DURATIONS[String(s?.name||'').trim()]||30,value:Number(s?.clientPrice||s?.value||0)}));return String(o?.service||'').split('+').map(x=>x.trim()).filter(Boolean).map(name=>({name,duration:DURATIONS[name]||30,value:0}));};
  const durationOf=o=>servicesOf(o).reduce((n,s)=>n+Number(s.duration||0),0)||Number(o?.durationSnapshot||o?.durationMinutes||o?.duration)||30;
  const endOf=(o,start=o?.time)=>time(mins(start)+durationOf(o));
  const currentDate=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const getGrid=()=>document.getElementById('agendaGrid');
  const getCells=()=>[...(getGrid()?.querySelectorAll('td[data-sos-cell="true"],td.sos-cell[data-sos-id],td.bm-sos-final-cell')||[])];
  let painting=false;
  let paintTimer=null;

  function style(){
    if(document.getElementById('bmSosAuthoritativeCss'))return;
    const s=document.createElement('style');s.id='bmSosAuthoritativeCss';
    s.textContent=`#agendaGrid .bm-sos-client{font-size:15px!important;font-weight:900!important;line-height:1.15!important;display:block!important}#agendaGrid .bm-sos-service{font-size:11.5px!important;line-height:1.25!important;display:block!important;margin-top:2px!important}#agendaGrid .bm-sos-meta{font-size:10.5px!important;line-height:1.2!important;display:block!important;margin-top:2px!important}#agendaGrid .bm-sos-professional{font-size:12px!important;font-weight:900!important;line-height:1.2!important;display:block!important;margin-top:4px!important}#agendaGrid .bm-sos-continuation{font-size:10.5px!important;font-weight:700!important;line-height:1.2!important}#sosOpportunityPanel .sos-op-selected-candidate .sos-op-candidate-name{font-size:17px!important;font-weight:900!important;line-height:1.25!important}#sosOpportunityPanel .sos-op-selected-candidate .sos-op-candidate-data{font-size:12px!important;line-height:1.25!important}#detailsContent .detail-topline>div:nth-child(2)>strong{font-size:17px!important;font-weight:900!important}#detailsActions .bm-sos-reschedule{grid-column:1 / -1!important;background:#fff!important;border-color:#7438F5!important;color:#7438F5!important;font-weight:900!important}`;
    document.head.appendChild(s);
  }

  function ensureReservation(detail){
    if(!detail?.professional||!detail?.opportunity)return;
    const state=read();
    state.appointments=Array.isArray(state.appointments)?state.appointments:[];
    state.opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const opportunity=state.opportunities.find(o=>o&&o.id===detail.opportunity.id)||detail.opportunity;
    const start=opportunity.time||'08:00';
    const duration=durationOf(opportunity);
    const professional=detail.professional;
    const acceptedAt=opportunity.acceptedAt||new Date().toISOString();
    opportunity.durationSnapshot=duration;
    opportunity.endTime=endOf(opportunity,start);
    opportunity.acceptedBy=professional;
    opportunity.status='resolved';
    opportunity.acceptedAt=acceptedAt;
    let appointment=null;
    if(opportunity.appointmentId){
      appointment=state.appointments.find(a=>a&&a.id===opportunity.appointmentId)||null;
    }
    if(!appointment){
      appointment=state.appointments.find(a=>a&&a.source==='sos'&&a.sosOpportunityId===opportunity.id)||null;
    }
    const services=servicesOf(opportunity);
    if(appointment){
      appointment.source='sos';
      appointment.sosAcceptedBy=professional;
      appointment.sosAcceptedAt=acceptedAt;
      appointment.professional=professional;
      appointment.duration=duration;
      appointment.durationMinutes=duration;
      appointment.endTime=endOf(appointment,appointment.time||start);
      appointment.services=services;
      appointment.service=opportunity.service||services.map(s=>s.name).join(' + ');
      appointment.sosOpportunityId=opportunity.id;
      opportunity.appointmentId=appointment.id;
    }else{
      const id=`apt-sos-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      appointment={id,date:opportunity.date,time:start,endTime:endOf(opportunity,start),professional,client:opportunity.client||'Cliente',services,service:opportunity.service||services.map(s=>s.name).join(' + '),duration,durationMinutes:duration,value:Number(opportunity.value||0)||services.reduce((n,s)=>n+Number(s.value||0),0),status:'agendado',source:'sos',sosAcceptedBy:professional,sosAcceptedAt:acceptedAt,sosOpportunityId:opportunity.id};
      state.appointments.push(appointment);
      opportunity.appointmentId=id;
    }
    write(state);
    window.BeautyMoveAgendaPersistence?.syncNow?.();
    schedulePaint();
  }

  function paint(){
    const grid=getGrid();if(!grid||painting)return;
    const cells=getCells();if(!cells.length)return;
    const state=read(),date=currentDate();
    const appointments=(Array.isArray(state.appointments)?state.appointments:[]).filter(a=>a&&a.date===date&&a.status!=='cancelado'&&a.source==='sos'&&(a.sosAcceptedBy||a.acceptedBy||a.sosOpportunityId));
    const opportunities=(Array.isArray(state.opportunities)?state.opportunities:[]).filter(o=>o&&o.date===date&&o.source==='sos'&&!['resolved','cancelado','cancelada'].includes(o.status));
    painting=true;
    try{
      cells.forEach(c=>{c.className='sos-free-cell bm-sos-final-cell';c.removeAttribute('data-sos-id');c.removeAttribute('data-appointment-id');c.dataset.sosCell='true';c.innerHTML='Livre';});
      const draw=(item,isAppointment)=>{
        const start=mins(item.time||'08:00'),duration=Math.max(30,durationOf(item)),end=start+duration,endTime=item.endTime||time(end);
        const professional=isAppointment?(item.sosAcceptedBy||item.acceptedBy||item.professional||'Profissional confirmada'):(item.acceptedBy||item.professional||'Aguardando profissional');
        cells.forEach(cell=>{
          const minute=mins(cell.dataset.time);if(minute<start||minute>=end)return;
          const first=minute===start;
          cell.className=`sos-cell sos-cell-found bm-sos-final-cell ${first?'sos-cell-start':'sos-cell-continuation'}`;
          cell.dataset.sosCell='true';
          if(isAppointment){cell.dataset.appointmentId=item.id;if(item.sosOpportunityId)cell.dataset.sosId=item.sosOpportunityId;}
          else cell.dataset.sosId=item.id;
          cell.innerHTML=first?`<strong class="bm-sos-client">${esc(item.client||'Cliente')}</strong><span class="bm-sos-service">${esc(item.service||'Atendimento')}</span><span class="bm-sos-meta">${esc(item.time||'')} – ${esc(endTime)} · ${label(duration)}</span><span class="bm-sos-professional">Profissional: ${esc(professional)}</span>`:`<span class="bm-sos-continuation">${esc(item.client||'Cliente')} · até ${esc(endTime)}</span>`;
        });
      };
      appointments.forEach(a=>draw(a,true));
      opportunities.forEach(o=>draw(o,false));
    }finally{painting=false;}
  }

  function schedulePaint(){
    clearTimeout(paintTimer);
    paintTimer=setTimeout(paint,30);
  }

  function getSosContext(){
    const actions=document.getElementById('detailsActions'),direct=actions?.dataset?.sosId||window.__bmCurrentSosId;
    if(direct)return String(direct);
    const aId=actions?.dataset?.appointmentId||window.__bmCurrentAppointmentId;
    if(aId){const state=read(),op=(state.opportunities||[]).find(o=>String(o.appointmentId)===String(aId));if(op)return String(op.id);}
    return null;
  }

  function addRescheduleButton(){
    const modal=document.getElementById('detailsModal'),actions=document.getElementById('detailsActions');
    if(!modal||!modal.classList.contains('is-open')||!actions)return;
    const sosId=getSosContext();if(!sosId||actions.querySelector('.bm-sos-reschedule'))return;
    const state=read(),op=(state.opportunities||[]).find(o=>String(o.id)===String(sosId)),appointmentId=op?.appointmentId||actions.dataset.appointmentId;
    const appointment=(state.appointments||[]).find(a=>String(a.id)===String(appointmentId));if(!appointment)return;
    const button=document.createElement('button');button.type='button';button.className='action-button bm-sos-reschedule';button.textContent='Alterar horário';
    button.addEventListener('click',()=>{
      const m=document.getElementById('appointmentModal');if(!m)return;
      document.getElementById('appointmentId').value=appointment.id;
      document.getElementById('appointmentClient').value=appointment.client||'';
      document.getElementById('appointmentProfessional').value=appointment.professional||appointment.sosAcceptedBy||'';
      document.getElementById('appointmentTime').value=appointment.time||'';
      document.getElementById('appointmentTitle').textContent='Alterar horário';
      document.getElementById('appointmentMode').textContent='ALTERAR HORÁRIO';
      m.dataset.bmSosRescheduleId=String(sosId);
      modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');m.classList.add('is-open');m.setAttribute('aria-hidden','false');
    });
    const cancel=actions.querySelector('.action-cancel');actions.insertBefore(button,cancel||null);
  }

  function bindReschedule(){
    const form=document.getElementById('appointmentForm');if(!form||form.dataset.bmSosAuthoritativeBound==='1')return;
    form.dataset.bmSosAuthoritativeBound='1';
    form.addEventListener('submit',()=>{
      const modal=document.getElementById('appointmentModal'),sosId=modal?.dataset.bmSosRescheduleId;if(!sosId)return;
      setTimeout(()=>{
        const newTime=document.getElementById('appointmentTime')?.value;if(!newTime)return;
        const state=read(),op=(state.opportunities||[]).find(o=>String(o.id)===String(sosId)),appointmentId=document.getElementById('appointmentId')?.value,a=(state.appointments||[]).find(x=>String(x.id)===String(appointmentId));
        if(op&&a){op.time=newTime;op.endTime=endOf(a,newTime);op.durationSnapshot=durationOf(a);op.status='resolved';op.acceptedBy=a.sosAcceptedBy||a.professional;a.time=newTime;a.endTime=endOf(a,newTime);write(state);window.BeautyMoveAgendaPersistence?.syncNow?.();}
        delete modal.dataset.bmSosRescheduleId; schedulePaint();
      },180);
    },true);
  }

  function cancelSosOnly(id){
    if(!id)return;const state=read(),op=(state.opportunities||[]).find(o=>o&&String(o.id)===String(id)&&o.source==='sos');if(!op)return;
    op.status='cancelado';op.cancelledAt=new Date().toISOString();op.cancelledReason='Cancelado pelo salão';write(state);window.BeautyMoveAgendaPersistence?.syncNow?.();
    const appointmentId=op.appointmentId;const appointment=(state.appointments||[]).find(a=>String(a.id)===String(appointmentId));if(appointment)appointment.status='cancelado';
    if(appointment)write(state);
    const modal=document.getElementById('detailsModal');modal?.classList.remove('is-open');modal?.setAttribute('aria-hidden','true');
    const n=document.getElementById('agendaNotice');if(n){n.textContent='S.O.S. cancelado. Nenhum outro atendimento foi alterado.';n.hidden=false;setTimeout(()=>n.hidden=true,3500);}schedulePaint();
  }

  function clickCapture(event){
    const cell=event.target.closest?.('#agendaGrid [data-sos-id]');
    if(cell){window.__bmCurrentSosId=String(cell.dataset.sosId);window.__bmCurrentAppointmentId=cell.dataset.appointmentId||null;return;}
    const cancel=event.target.closest?.('#detailsActions [data-detail-action="cancel"],#detailsActions [data-sos-action="cancel"],#detailsActions .action-cancel');
    if(!cancel)return;
    const id=getSosContext();if(!id)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();cancelSosOnly(id);
  }

  function boot(){
    if(document.body?.dataset.role!=='salao')return;
    style();bindReschedule();document.addEventListener('click',clickCapture,true);
    window.addEventListener('beautymove:sos-accepted',event=>{ensureReservation(event.detail||{});schedulePaint();});
    window.addEventListener('beautymove:agenda-hydrated',schedulePaint);
    window.addEventListener('storage',e=>{if(e.key===STATE_KEY)schedulePaint();});
    const grid=getGrid();
    if(grid){const observer=new MutationObserver(()=>{if(!painting)schedulePaint();});observer.observe(grid,{childList:true,subtree:true});}
    setInterval(addRescheduleButton,250);
    setTimeout(()=>{paint();addRescheduleButton();},80);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
