/* BeautyMove — S.O.S. runtime único da Agenda. */
(function(){
'use strict';
const STATE_KEY='beautymove.mvp.state';
const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
const mins=t=>{const[h,m]=String(t||'00:00').split(':').map(Number);return(Number(h)||0)*60+(Number(m)||0);};
const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
const durationOf=o=>{const s=Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:Array.isArray(o?.services)?o.services:[];const total=s.reduce((n,x)=>n+Number(x?.duration||x?.durationMinutes||0),0);return Math.max(30,Number(o?.durationSnapshot||o?.durationMinutes||o?.duration||total||30));};
const endOf=(o,start=o?.time)=>time(mins(start)+durationOf(o));
const currentDate=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
const cells=()=>[...(document.querySelectorAll('#agendaGrid td[data-sos-cell="true"],#agendaGrid td.sos-cell'))];
function ensureReservation(detail){
 if(!detail?.professional||!detail?.opportunity?.id)return;
 const state=read();state.appointments=Array.isArray(state.appointments)?state.appointments:[];state.opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
 const op=state.opportunities.find(o=>String(o.id)===String(detail.opportunity.id));if(!op)return;
 const start=op.time||'08:00',duration=durationOf(op),professional=detail.professional,acceptedAt=op.acceptedAt||new Date().toISOString();
 op.status='resolved';op.acceptedBy=professional;op.acceptedAt=acceptedAt;op.durationSnapshot=duration;op.endTime=endOf(op,start);
 let appointment=op.appointmentId?state.appointments.find(a=>String(a.id)===String(op.appointmentId)):null;if(!appointment)appointment=state.appointments.find(a=>a?.source==='sos'&&String(a.sosOpportunityId)===String(op.id));
 const services=Array.isArray(op.services)?op.services.map(s=>({...s})):[];
 if(!appointment){const id=`apt-sos-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;appointment={id,date:op.date,time:start,endTime:endOf(op,start),professional,client:op.client||'Cliente',service:op.service||services.map(s=>s.name).join(' + '),services,duration,durationMinutes:duration,value:Number(op.clientPriceSnapshot||op.value||0),status:'agendado',source:'sos',sosAcceptedBy:professional,sosOriginalProfessional:professional,sosAcceptedAt:acceptedAt,sosOpportunityId:op.id};state.appointments.push(appointment);op.appointmentId=id;}
 else{appointment.date=op.date;appointment.time=start;appointment.endTime=endOf(op,start);appointment.professional=professional;appointment.sosAcceptedBy=professional;appointment.sosOriginalProfessional=professional;appointment.sosAcceptedAt=acceptedAt;appointment.duration=duration;appointment.durationMinutes=duration;appointment.services=services;appointment.service=op.service||services.map(s=>s.name).join(' + ');appointment.sosOpportunityId=op.id;appointment.source='sos';appointment.status=appointment.status==='cancelado'?'agendado':appointment.status;op.appointmentId=appointment.id;}
 write(state);window.BeautyMoveAgendaPersistence?.syncNow?.();paint();window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-updated',{detail:{appointmentId:appointment.id,opportunityId:op.id}}));
}
function paint(){
 const date=currentDate(),state=read(),appointments=(state.appointments||[]).filter(a=>a?.date===date&&a?.source==='sos'&&a?.status!=='cancelado'&&(a?.sosAcceptedBy||a?.sosOpportunityId)),opportunities=(state.opportunities||[]).filter(o=>o?.date===date&&o?.source==='sos'&&!['resolved','cancelado','cancelada'].includes(o.status)),list=cells();if(!list.length)return;
 list.forEach(c=>{c.className='sos-free-cell';c.removeAttribute('data-sos-id');c.removeAttribute('data-appointment-id');c.innerHTML='Livre';});
 const draw=(item,isAppointment)=>{const start=mins(item.time||'08:00'),duration=durationOf(item),end=start+duration,endTime=item.endTime||time(end),professional=isAppointment?(item.sosAcceptedBy||item.professional||'Profissional confirmada'):(item.acceptedBy||item.professional||'Aguardando profissional');list.forEach(c=>{const minute=mins(c.dataset.time);if(minute<start||minute>=end)return;const first=minute===start;c.className=`sos-cell sos-cell-found ${first?'sos-cell-start':'sos-cell-continuation'}`;c.dataset.sosCell='true';if(isAppointment){c.dataset.appointmentId=item.id;if(item.sosOpportunityId)c.dataset.sosId=item.sosOpportunityId;}else c.dataset.sosId=item.id;c.innerHTML=first?`<strong>${esc(item.client||'Cliente')}</strong><span>${esc(item.service||'Atendimento')}</span><small>${esc(item.time||'')} – ${esc(endTime)} · ${duration>=60?`${Math.floor(duration/60)}h${duration%60?` ${duration%60}min`:''}`:`${duration}min`}</small><b>Profissional: ${esc(professional)}</b>`:`<span>${esc(item.client||'Cliente')} · até ${esc(endTime)}</span>`;});};
 appointments.forEach(a=>draw(a,true));opportunities.forEach(o=>draw(o,false));
}
function boot(){if(document.body?.dataset?.role!=='salao')return;window.addEventListener('beautymove:sos-accepted',e=>ensureReservation(e.detail||{}));window.addEventListener('beautymove:agenda-hydrated',paint);window.addEventListener('beautymove:sos-created',paint);window.addEventListener('beautymove:sos-runtime-updated',paint);window.addEventListener('storage',e=>{if(e.key===STATE_KEY)paint();});document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(paint,0));document.getElementById('prevDay')?.addEventListener('click',()=>setTimeout(paint,100));document.getElementById('nextDay')?.addEventListener('click',()=>setTimeout(paint,100));document.getElementById('todayBtn')?.addEventListener('click',()=>setTimeout(paint,100));paint();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
