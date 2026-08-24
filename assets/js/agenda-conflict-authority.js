/* BeautyMove — proteção contra conflito de horário na Agenda. */
(function(){
'use strict';
if(document.body?.dataset?.role!=='salao')return;
const STATE_KEY='beautymove.mvp.state';
const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]}}catch{return{appointments:[],opportunities:[],transactions:[]}}};
const mins=t=>{const p=String(t||'00:00').split(':').map(Number);return(p[0]||0)*60+(p[1]||0)};
const duration=()=>{const hidden=document.getElementById('selectedServices');try{const list=JSON.parse(hidden?.value||'[]');const d=list.reduce((n,s)=>n+Number(s?.duration||s?.durationMinutes||0),0);if(d)return d}catch{}return Number(document.getElementById('appointmentDuration')?.value)||30};
function notice(msg){const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmConflictNotice);window.__bmConflictNotice=setTimeout(()=>n.hidden=true,5000)}
function boot(){const form=document.getElementById('appointmentForm');if(!form)return;form.addEventListener('submit',e=>{const date=document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10),time=document.getElementById('appointmentTime')?.value||'08:00',professional=document.getElementById('appointmentProfessional')?.value||'',id=document.getElementById('appointmentId')?.value||'',d=duration(),s=read(),end=mins(time)+d;const conflict=(s.appointments||[]).find(a=>a&&a.date===date&&a.professional===professional&&a.id!==id&&a.status!=='cancelado'&&mins(a.time)<end&&mins(time)<mins(a.time)+(Number(a.durationMinutes||a.duration)||30));if(conflict){e.preventDefault();e.stopImmediatePropagation();notice(`Horário indisponível para ${professional}. Já existe um atendimento de ${conflict.time} até ${String(Math.floor((mins(conflict.time)+(Number(conflict.durationMinutes||conflict.duration)||30))/60)).padStart(2,'0')}:${String((mins(conflict.time)+(Number(conflict.durationMinutes||conflict.duration)||30))%60).padStart(2,'0')}.`);return false}},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
