/* BeautyMove — cancelamento normal definitivo e isolado.
   Regra: cancelar atendimento normal altera somente o appointment selecionado.
   S.O.S. possui controlador próprio e nunca entra neste fluxo.
*/
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const close=()=>{const m=document.getElementById('detailsModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};

  function cancelAppointment(id){
    if(!id)return;
    const state=read();
    const appointment=state.appointments.find(a=>a&&String(a.id)===String(id));
    if(!appointment)return;
    if(!window.confirm(`Cancelar o atendimento de ${appointment.client||'esta cliente'}?`))return;

    appointment.status='cancelado';
    appointment.cancelledAt=new Date().toISOString();
    appointment.cancelledReason='Cancelado pelo salão';
    write(state);
    window.__bmCurrentAppointmentId=null;
    close();
    setTimeout(()=>window.location.reload(),60);
  }

  function intercept(event){
    const actions=document.getElementById('detailsActions');
    if(actions?.dataset?.sosId)return;
    const button=event.target.closest?.('#detailsActions [data-detail-action="cancel"]');
    if(!button)return;
    const id=actions?.dataset?.appointmentId||window.__bmCurrentAppointmentId;
    if(!id)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    cancelAppointment(id);
  }

  function boot(){
    if(document.body?.dataset?.role!=='salao')return;
    document.addEventListener('click',intercept,true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
