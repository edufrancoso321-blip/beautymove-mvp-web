/* BeautyMove — cancelar S.O.S. sem apagar o atendimento reservado.
 * Cancelar S.O.S. encerra somente a oportunidade e transforma o atendimento
 * já reservado em atendimento normal da Agenda.
 */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const close=()=>{const m=document.getElementById('detailsModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};
  const notice=msg=>{const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmSosCancelNotice);window.__bmSosCancelNotice=setTimeout(()=>n.hidden=true,3500);};
  function cancelSosOnly(opportunity){
    const state=read();
    state.appointments=Array.isArray(state.appointments)?state.appointments:[];
    state.opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const op=state.opportunities.find(o=>o&&o.id===opportunity.id);
    if(!op)return;
    op.status='cancelado';
    op.cancelledAt=new Date().toISOString();
    if(op.appointmentId){
      const appointment=state.appointments.find(a=>a&&a.id===op.appointmentId);
      if(appointment){
        /* O atendimento já reservado permanece na profissional que o aceitou. */
        delete appointment.sosAcceptedBy;
        delete appointment.sosAcceptedAt;
        delete appointment.sosOpportunityId;
        delete appointment.sosOriginalProfessional;
        appointment.source='agenda';
      }
    }
    write(state);
    close();
    notice('S.O.S. cancelado. O atendimento permanece na Agenda.');
    setTimeout(()=>document.getElementById('todayBtn')?.click(),50);
    window.dispatchEvent(new CustomEvent('beautymove:sos-cancelled',{detail:{opportunityId:opportunity.id,appointmentId:op.appointmentId||null}}));
  }
  function intercept(event){
    const button=event.target.closest?.('#detailsActions button');
    if(!button)return;
    const text=(button.textContent||'').trim().toLowerCase();
    if(text!=='cancelar s.o.s.')return;
    const box=document.getElementById('detailsActions');
    const id=box?.dataset?.sosId;
    if(!id)return;
    const state=read(),opportunity=state.opportunities.find(o=>o&&o.id===id);
    if(!opportunity)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    cancelSosOnly(opportunity);
  }
  function boot(){document.addEventListener('click',intercept,true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
