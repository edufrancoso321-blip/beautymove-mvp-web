/* BeautyMove — sincronização de ações do atendimento S.O.S. */
(function(){
'use strict';
if(document.body?.dataset?.role!=='salao')return;
const STATE_KEY='beautymove.mvp.state';
const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]}}catch{return{appointments:[],opportunities:[],transactions:[]}}};
const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
const mins=t=>{const p=String(t||'00:00').split(':').map(Number);return(p[0]||0)*60+(p[1]||0)};
const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const duration=a=>Number(a?.durationMinutes||a?.duration)||30;
function boot(){document.addEventListener('click',e=>{const b=e.target.closest?.('#detailsActions [data-bm-action]');if(!b)return;const actions=document.getElementById('detailsActions'),sosId=actions?.dataset?.sosId;if(!sosId)return;const s=read(),op=(s.opportunities||[]).find(o=>String(o.id)===String(sosId)),appointmentId=actions?.dataset?.appointmentId||op?.appointmentId,a=(s.appointments||[]).find(x=>String(x.id)===String(appointmentId));if(!op||!a)return;if(b.dataset.bmAction==='cancel'){e.preventDefault();e.stopImmediatePropagation();op.status='cancelado';op.cancelledAt=new Date().toISOString();a.status='cancelado';write(s);window.BeautyMoveAgendaPersistence?.syncNow?.();document.getElementById('detailsModal')?.classList.remove('is-open');document.getElementById('detailsModal')?.setAttribute('aria-hidden','true');window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-refresh'));return}if(b.dataset.bmAction==='reschedule'){const modal=document.getElementById('appointmentModal');if(!modal)return;e.preventDefault();e.stopImmediatePropagation();document.getElementById('appointmentId').value=a.id;document.getElementById('appointmentClient').value=a.client||'';document.getElementById('appointmentProfessional').value=a.professional||'';document.getElementById('appointmentTime').value=a.time||'';document.getElementById('appointmentMode').textContent='ALTERAR HORÁRIO';document.getElementById('appointmentTitle').textContent='Alterar horário';modal.dataset.bmSosRescheduleId=String(sosId);document.getElementById('detailsModal')?.classList.remove('is-open');modal.classList.add('is-open');modal.setAttribute('aria-hidden','false')}} ,true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
