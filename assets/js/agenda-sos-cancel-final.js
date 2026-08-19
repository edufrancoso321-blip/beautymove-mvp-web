/* BeautyMove — cancelamento definitivo do atendimento S.O.S.
   Regra: cancelar pelo S.O.S. cancela a reserva vinculada e a oportunidade S.O.S.
   relacionadas, sem apagar outros atendimentos. */
(function(){
  'use strict';
  const KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const norm=v=>String(v??'').trim().toLowerCase();
  const close=()=>{const m=document.getElementById('detailsModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};

  function cancelSos(){
    const box=document.getElementById('detailsActions');
    const sosId=box?.dataset?.sosId||window.__bmCurrentSosId;
    if(!sosId)return;
    const state=read();
    const opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const appointments=Array.isArray(state.appointments)?state.appointments:[];
    const source=opportunities.find(o=>o&&o.id===sosId);
    if(!source)return;

    const appointmentId=box?.dataset?.appointmentId||source.appointmentId||null;
    const linkedAppointment=appointmentId?appointments.find(a=>a&&a.id===appointmentId):null;
    const client=norm(linkedAppointment?.client||source.client);
    const professional=norm(linkedAppointment?.professional||source.acceptedBy||source.professional);
    const date=linkedAppointment?.date||source.date||'';
    const time=linkedAppointment?.time||source.time||'';
    const now=new Date().toISOString();

    const sameBooking=a=>a&&a.status!=='cancelado'&&a.date===date&&norm(a.client)===client&&(!professional||norm(a.professional)===professional)&&(!time||a.time===time);
    appointments.forEach(a=>{
      if(!a||a.status==='cancelado')return;
      if(a.id===appointmentId||a.sosOpportunityId===sosId||sameBooking(a)){
        a.status='cancelado';
        a.cancelledAt=now;
        a.cancelledReason='Cancelado pelo salão na Agenda S.O.S.';
      }
    });

    opportunities.forEach(o=>{
      if(!o||o.source!=='sos')return;
      const sameOpportunity=o.id===sosId;
      const sameAppointment=appointmentId&&o.appointmentId===appointmentId;
      const sameComposite=o.date===date&&norm(o.client)===client&&(!time||String(o.time||'')===time)&&(!professional||norm(o.acceptedBy||o.professional)===professional);
      if(sameOpportunity||sameAppointment||sameComposite){
        o.status='cancelado';
        o.cancelledAt=now;
        o.cancelledReason='Atendimento S.O.S. cancelado pelo salão.';
      }
    });

    save(state);
    close();
    window.__bmCurrentSosId=null;
    window.__bmCurrentAppointmentId=null;
    location.reload();
  }

  function boot(){
    if(window.__bmSosCancelFinalBound)return;
    window.__bmSosCancelFinalBound=true;
    document.addEventListener('click',e=>{
      const btn=e.target.closest?.('#detailsActions [data-detail-action="sos-cancel"], #detailsActions button');
      if(!btn)return;
      const box=document.getElementById('detailsActions');
      if(!box?.dataset?.sosId)return;
      if(norm(btn.textContent)!=='cancelar atendimento')return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      cancelSos();
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
