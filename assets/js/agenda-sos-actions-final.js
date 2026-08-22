/* BeautyMove — controlador de ações S.O.S.
 * Autoridade visual: agenda-sos-reservation-fix.js.
 * Este módulo NÃO pinta a coluna S.O.S. e NÃO observa o DOM.
 */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const DURATIONS={'Corte':60,'Escova':30,'Coloração':120,'Luzes':180,'Corte feminino':60,'Corte masculino':45,'Manicure':60,'Pedicure':60,'Limpeza de pele':75,'Design de sobrancelhas':45};
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const mins=t=>{const p=String(t||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const servicesOf=o=>{const list=Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:Array.isArray(o?.services)?o.services:[];if(list.length)return list.map(s=>({name:s?.name||'',duration:Number(s?.duration||s?.durationMinutes)||DURATIONS[String(s?.name||'').trim()]||30,value:Number(s?.clientPrice||s?.value||0)}));return String(o?.service||'').split('+').map(x=>x.trim()).filter(Boolean).map(name=>({name,duration:DURATIONS[name]||30,value:0}));};
  const durationOf=o=>servicesOf(o).reduce((n,s)=>n+Number(s.duration||0),0)||Number(o?.durationSnapshot||o?.durationMinutes||o?.duration)||30;
  const endOf=(o,start=o?.time)=>time(mins(start)+durationOf(o));
  const notice=message=>{const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=message;n.hidden=false;clearTimeout(window.__bmSosActionNotice);window.__bmSosActionNotice=setTimeout(()=>n.hidden=true,3500);};

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
    let appointment=opportunity.appointmentId?state.appointments.find(a=>a&&a.id===opportunity.appointmentId):null;
    if(!appointment)appointment=state.appointments.find(a=>a&&a.source==='sos'&&a.sosOpportunityId===opportunity.id)||null;
    const services=servicesOf(opportunity);
    if(appointment){
      appointment.source='sos';appointment.sosAcceptedBy=professional;appointment.sosAcceptedAt=acceptedAt;appointment.professional=professional;appointment.duration=duration;appointment.durationMinutes=duration;appointment.endTime=endOf(appointment,appointment.time||start);appointment.services=services;appointment.service=opportunity.service||services.map(s=>s.name).join(' + ');appointment.sosOpportunityId=opportunity.id;opportunity.appointmentId=appointment.id;
    }else{
      const id=`apt-sos-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      appointment={id,date:opportunity.date,time:start,endTime:endOf(opportunity,start),professional,client:opportunity.client||'Cliente',services,service:opportunity.service||services.map(s=>s.name).join(' + '),duration,durationMinutes:duration,value:Number(opportunity.value||0)||services.reduce((n,s)=>n+Number(s.value||0),0),status:'agendado',source:'sos',sosAcceptedBy:professional,sosAcceptedAt:acceptedAt,sosOpportunityId:opportunity.id};
      state.appointments.push(appointment);opportunity.appointmentId=id;
    }
    write(state);window.BeautyMoveAgendaPersistence?.syncNow?.();
    document.getElementById('todayBtn')?.click();
    window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-refresh'));
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
      document.getElementById('appointmentId').value=appointment.id;document.getElementById('appointmentClient').value=appointment.client||'';document.getElementById('appointmentProfessional').value=appointment.professional||appointment.sosAcceptedBy||'';document.getElementById('appointmentTime').value=appointment.time||'';document.getElementById('appointmentTitle').textContent='Alterar horário';document.getElementById('appointmentMode').textContent='ALTERAR HORÁRIO';m.dataset.bmSosRescheduleId=String(sosId);modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');m.classList.add('is-open');m.setAttribute('aria-hidden','false');
    });
    const cancel=actions.querySelector('.action-cancel');actions.insertBefore(button,cancel||null);
  }

  function bindReschedule(){
    const form=document.getElementById('appointmentForm');if(!form||form.dataset.bmSosAuthoritativeBound==='1')return;form.dataset.bmSosAuthoritativeBound='1';
    form.addEventListener('submit',()=>{
      const modal=document.getElementById('appointmentModal'),sosId=modal?.dataset.bmSosRescheduleId;if(!sosId)return;
      setTimeout(()=>{
        const newTime=document.getElementById('appointmentTime')?.value;if(!newTime)return;
        const state=read(),op=(state.opportunities||[]).find(o=>String(o.id)===String(sosId)),appointmentId=document.getElementById('appointmentId')?.value,a=(state.appointments||[]).find(x=>String(x.id)===String(appointmentId));
        if(op&&a){op.time=newTime;op.endTime=endOf(a,newTime);op.durationSnapshot=durationOf(a);op.status='resolved';op.acceptedBy=a.sosAcceptedBy||a.professional;a.time=newTime;a.endTime=endOf(a,newTime);write(state);window.BeautyMoveAgendaPersistence?.syncNow?.();document.getElementById('todayBtn')?.click();window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-refresh'));}
        delete modal.dataset.bmSosRescheduleId;
      },180);
    },true);
  }

  function cancelSosOnly(id){
    if(!id)return;const state=read(),op=(state.opportunities||[]).find(o=>o&&String(o.id)===String(id)&&o.source==='sos');if(!op)return;
    op.status='cancelado';op.cancelledAt=new Date().toISOString();op.cancelledReason='Cancelado pelo salão';
    const appointmentId=op.appointmentId;const appointment=(state.appointments||[]).find(a=>String(a.id)===String(appointmentId));if(appointment)appointment.status='cancelado';
    write(state);window.BeautyMoveAgendaPersistence?.syncNow?.();
    const modal=document.getElementById('detailsModal');modal?.classList.remove('is-open');modal?.setAttribute('aria-hidden','true');
    notice('S.O.S. cancelado. Nenhum outro atendimento foi alterado.');
    document.getElementById('todayBtn')?.click();window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-refresh'));
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
    bindReschedule();document.addEventListener('click',clickCapture,true);window.addEventListener('beautymove:sos-accepted',e=>ensureReservation(e.detail||{}));setInterval(addRescheduleButton,250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
