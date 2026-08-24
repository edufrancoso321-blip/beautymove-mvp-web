/* BeautyMove — autoridade de seleção S.O.S.
   Impede que o controlador visual crie uma segunda reserva divergente.
*/
(function(){
'use strict';
if(document.body?.dataset?.role!=='salao')return;
const STATE_KEY='beautymove.mvp.state';
const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]}}catch{return{appointments:[],opportunities:[],transactions:[]}}};
const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
const mins=t=>{const p=String(t||'00:00').split(':').map(Number);return(p[0]||0)*60+(p[1]||0)};
const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const duration=o=>Number(o?.durationSnapshot||o?.durationMinutes||o?.duration)||30;
const services=o=>Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:(Array.isArray(o?.services)?o.services:[]);
const overlap=(a,b)=>mins(a.time)<mins(b.time)+duration(b)&&mins(b.time)<mins(a.time)+duration(a);
function notice(msg){const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmSosAuthorityNotice);window.__bmSosAuthorityNotice=setTimeout(()=>n.hidden=true,4500)}
function select(professional){const state=read(),today=document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10),op=(state.opportunities||[]).filter(o=>o&&o.date===today&&o.source==='sos'&&!['resolved','cancelado','cancelada'].includes(String(o.status||'').toLowerCase())).sort((a,b)=>mins(a.time)-mins(b.time))[0];if(!op)return;const d=duration(op),candidate={date:op.date,time:op.time||'08:00',professional};const conflict=(state.appointments||[]).find(a=>a&&a.date===candidate.date&&a.professional===professional&&a.status!=='cancelado'&&overlap(candidate,a));if(conflict){notice(`Não é possível reservar ${professional} às ${candidate.time}: o profissional já está ocupado até ${time(mins(conflict.time)+duration(conflict))}.`);return}
const now=new Date().toISOString();op.status='resolved';op.acceptedBy=professional;op.acceptedAt=now;op.searchMode='selected';op.durationSnapshot=d;op.endTime=time(mins(op.time||'08:00')+d);let appointment=op.appointmentId?(state.appointments||[]).find(a=>a.id===op.appointmentId):null;if(!appointment){appointment={id:`apt-sos-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,date:op.date,time:op.time||'08:00',endTime:op.endTime,professional,client:op.client||'Cliente',services:services(op),service:op.service||services(op).map(s=>s.name).join(' + '),duration:d,durationMinutes:d,value:Number(op.clientPriceSnapshot||0),status:'agendado',source:'sos',sosAcceptedBy:professional,sosAcceptedAt:now,sosOpportunityId:op.id};state.appointments=Array.isArray(state.appointments)?state.appointments:[];state.appointments.push(appointment);op.appointmentId=appointment.id}else{appointment.professional=professional;appointment.duration=d;appointment.durationMinutes=d;appointment.endTime=op.endTime;appointment.services=services(op);appointment.sosAcceptedBy=professional;appointment.sosAcceptedAt=now;appointment.sosOpportunityId=op.id;appointment.status=appointment.status||'agendado'}write(state);window.BeautyMoveAgendaPersistence?.syncNow?.();document.getElementById('todayBtn')?.click();window.dispatchEvent(new CustomEvent('beautymove:sos-accepted',{detail:{professional,opportunity:op}}));window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-refresh'))}
function boot(){document.addEventListener('click',e=>{const b=e.target.closest?.('#sosOpportunityPanel .sos-op-select');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();select(b.dataset.professional||'')},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
