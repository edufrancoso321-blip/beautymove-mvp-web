/* BeautyMove — cancelamento definitivo do atendimento S.O.S. */
(function(){
'use strict';
const KEY='beautymove.mvp.state';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
const norm=v=>String(v??'').replace(/\s+/g,' ').trim().toLowerCase();
function context(){
 const box=document.getElementById('detailsActions'),s=read(),ops=Array.isArray(s.opportunities)?s.opportunities:[],apps=Array.isArray(s.appointments)?s.appointments:[];
 const id=box?.dataset?.sosId||window.__bmCurrentSosId;
 if(id){const op=ops.find(o=>o&&o.id===id);if(op)return{s,ops,apps,op,box};}
 const text=norm(document.getElementById('detailsContent')?.textContent||'');
 const client=((text.match(/cliente\s+([^]+?)(?=profissional|s\.o\.s\.|data\s)/i)||[])[1]||'');
 const tm=((text.match(/horário\s+(\d{2}:\d{2})/i)||[])[1]||'');
 const op=ops.find(o=>{if(!o||o.source!=='sos'||['cancelado','cancelada'].includes(norm(o.status)))return false;const a=o.appointmentId?apps.find(x=>x&&x.id===o.appointmentId):null;return client&&norm(a?.client||o.client)===norm(client)&&(!tm||String(a?.time||o.time||'')===tm);});
 return op?{s,ops,apps,op,box}:null;
}
function cancel(){
 const c=context();if(!c)return;
 const {s,ops,apps,op,box}=c;
 const appointmentId=box?.dataset?.appointmentId||op.appointmentId||null;
 const linked=appointmentId?apps.find(a=>a&&a.id===appointmentId):null;
 const client=norm(linked?.client||op.client),professional=norm(linked?.professional||op.acceptedBy||op.professional),date=linked?.date||op.date||'',time=linked?.time||op.time||'',now=new Date().toISOString();
 apps.forEach(a=>{if(!a||a.status==='cancelado')return;const direct=a.id===appointmentId||a.sosOpportunityId===op.id;const same=a.date===date&&norm(a.client)===client&&(!professional||norm(a.professional)===professional)&&(!time||a.time===time);if(direct||same){a.status='cancelado';a.cancelledAt=now;a.cancelledReason='Cancelado pelo salão na Agenda S.O.S.';}});
 ops.forEach(o=>{if(!o||o.source!=='sos')return;const direct=o.id===op.id||(appointmentId&&o.appointmentId===appointmentId);const same=o.date===date&&norm(o.client)===client&&(!time||String(o.time||'')===time)&&(!professional||norm(o.acceptedBy||o.professional)===professional);if(direct||same){o.status='cancelado';o.cancelledAt=now;o.cancelledReason='Atendimento S.O.S. cancelado pelo salão.';}});
 save(s);const modal=document.getElementById('detailsModal');modal?.classList.remove('is-open');modal?.setAttribute('aria-hidden','true');window.__bmCurrentSosId=null;window.__bmCurrentAppointmentId=null;location.reload();
}
function boot(){
 if(window.__bmSosCancelFinalBound)return;window.__bmSosCancelFinalBound=true;
 window.addEventListener('click',e=>{const b=e.target.closest?.('#detailsActions button');if(!b||norm(b.textContent)!=='cancelar atendimento')return;if(!document.getElementById('detailsModal')?.classList.contains('is-open'))return;if(!context())return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();cancel();},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
