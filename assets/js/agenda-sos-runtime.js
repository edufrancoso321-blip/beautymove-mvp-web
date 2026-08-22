/* BeautyMove — S.O.S. runtime único da Agenda.
 * Uma única responsabilidade: manter a reserva S.O.S. e sua pintura visual.
 * Não usa polling nem MutationObserver para sincronizar estado.
 */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const mins=t=>{const [h,m]=String(t||'00:00').split(':').map(Number);return(Number(h)||0)*60+(Number(m)||0);};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const durationOf=o=>{const services=Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:Array.isArray(o?.services)?o.services:[];const total=services.reduce((n,s)=>n+Number(s?.duration||s?.durationMinutes||0),0);return Math.max(30,Number(o?.durationSnapshot||o?.durationMinutes||o?.duration||total||30));};
  const endOf=(o,start=o?.time)=>time(mins(start)+durationOf(o));
  const currentDate=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const cells=()=>[...(document.querySelectorAll('#agendaGrid td[data-sos-cell="true"],#agendaGrid td.sos-cell'))];

  function ensureReservation(detail){
    if(!detail?.professional||!detail?.opportunity?.id)return;
    const state=read();state.appointments=Array.isArray(state.appointments)?state.appointments:[];state.opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const op=state.opportunities.find(o=>String(o.id)===String(detail.opportunity.id));
    if(!op)return;
    const start=op.time||detail.opportunity.time||'08:00',duration=durationOf(op),professional=detail.professional,acceptedAt=op.acceptedAt||new Date().toISOString();
    op.status='resolved';op.acceptedBy=professional;op.acceptedAt=acceptedAt;op.durationSnapshot=duration;op.endTime=endOf(op,start);
    let appointment=op.appointmentId?state.appointments.find(a=>String(a.id)===String(op.appointmentId)):null;
    if(!appointment)appointment=state.appointments.find(a=>a?.source==='sos'&&String(a.sosOpportunityId)===String(op.id));
    const services=Array.isArray(op.services)?op.services.map(s=>({...s})):[];
    if(!appointment){
      const id=`apt-sos-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      appointment={id,date:op.date,time:start,endTime:endOf(op,start),professional,client:op.client||'Cliente',service:op.service||services.map(s=>s.name).join(' + '),services,duration,durationMinutes:duration,value:Number(op.clientPriceSnapshot||op.value||0),status:'agendado',source:'sos',sosAcceptedBy:professional,sosAcceptedAt:acceptedAt,sosOpportunityId:op.id};
      state.appointments.push(appointment);op.appointmentId=id;
    }else{
      appointment.date=op.date;appointment.time=start;appointment.endTime=endOf(op,start);appointment.professional=professional;appointment.sosAcceptedBy=professional;appointment.sosAcceptedAt=acceptedAt;appointment.duration=duration;appointment.durationMinutes=duration;appointment.services=services;appointment.service=op.service||services.map(s=>s.name).join(' + ');appointment.sosOpportunityId=op.id;appointment.source='sos';appointment.status=appointment.status==='cancelado'?'agendado':appointment.status;op.appointmentId=appointment.id;
    }
    write(state);
    window.BeautyMoveAgendaPersistence?.syncNow?.();
    paint();
    window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-updated',{detail:{appointmentId:appointment.id,opportunityId:op.id}}));
  }

  function paint(){
    const date=currentDate(),state=read();const appointments=(state.appointments||[]).filter(a=>a?.date===date&&a?.source==='sos'&&a?.status!=='cancelado'&&(a?.sosAcceptedBy||a?.sosOpportunityId));const opportunities=(state.opportunities||[]).filter(o=>o?.date===date&&o?.source==='sos'&&!['resolved','cancelado','cancelada'].includes(o.status));const list=cells();if(!list.length)return;
    list.forEach(cell=>{cell.className='sos-free-cell';cell.removeAttribute('data-sos-id');cell.removeAttribute('data-appointment-id');cell.innerHTML='Livre';});
    const draw=(item,isAppointment)=>{const start=mins(item.time||'08:00'),duration=durationOf(item),end=start+duration,endTime=item.endTime||time(end),professional=isAppointment?(item.sosAcceptedBy||item.professional||'Profissional confirmada'):(item.acceptedBy||item.professional||'Aguardando profissional');list.forEach(cell=>{const minute=mins(cell.dataset.time);if(minute<start||minute>=end)return;const first=minute===start;cell.className=`sos-cell sos-cell-found ${first?'sos-cell-start':'sos-cell-continuation'}`;cell.dataset.sosCell='true';if(isAppointment){cell.dataset.appointmentId=item.id;if(item.sosOpportunityId)cell.dataset.sosId=item.sosOpportunityId;}else cell.dataset.sosId=item.id;cell.innerHTML=first?`<strong>${esc(item.client||'Cliente')}</strong><span>${esc(item.service||'Atendimento')}</span><small>${esc(item.time||'')} – ${esc(endTime)} · ${duration>=60?`${Math.floor(duration/60)}h${duration%60?` ${duration%60}min`:''}`:`${duration}min`}</small><b>Profissional: ${esc(professional)}</b>`:`<span>${esc(item.client||'Cliente')} · até ${esc(endTime)}</span>`;});};
    appointments.forEach(a=>draw(a,true));opportunities.forEach(o=>draw(o,false));
  }

  function cancelSos(id){
    const state=read(),op=(state.opportunities||[]).find(o=>String(o.id)===String(id)&&o.source==='sos');if(!op)return;op.status='cancelado';op.cancelledAt=new Date().toISOString();if(op.appointmentId){const a=(state.appointments||[]).find(x=>String(x.id)===String(op.appointmentId));if(a)a.status='cancelado';}write(state);window.BeautyMoveAgendaPersistence?.syncNow?.();paint();
  }

  function boot(){
    if(document.body?.dataset?.role!=='salao')return;
    window.addEventListener('beautymove:sos-accepted',e=>ensureReservation(e.detail||{}));
    window.addEventListener('beautymove:agenda-hydrated',paint);
    window.addEventListener('beautymove:sos-created',paint);
    window.addEventListener('beautymove:sos-runtime-refresh',paint);
    window.addEventListener('storage',e=>{if(e.key===STATE_KEY)paint();});
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(paint,0));
    document.getElementById('prevDay')?.addEventListener('click',()=>setTimeout(paint,100));
    document.getElementById('nextDay')?.addEventListener('click',()=>setTimeout(paint,100));
    document.getElementById('todayBtn')?.addEventListener('click',()=>setTimeout(paint,100));
    document.addEventListener('click',e=>{
      const cell=e.target.closest?.('#agendaGrid [data-sos-id]');if(cell){window.__bmCurrentSosId=String(cell.dataset.sosId);window.__bmCurrentAppointmentId=cell.dataset.appointmentId||null;}
      const cancel=e.target.closest?.('#detailsActions [data-detail-action="cancel"],#detailsActions .action-cancel');if(!cancel)return;const id=window.__bmCurrentSosId;if(!id)return;e.preventDefault();e.stopImmediatePropagation();cancelSos(id);
    },true);
    paint();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
