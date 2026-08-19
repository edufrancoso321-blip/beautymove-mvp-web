/* BeautyMove — controlador S.O.S. único e definitivo.
   Regra inviolável: cancelar um S.O.S. altera SOMENTE a opportunity S.O.S.
   Nenhum appointment é alterado, removido, cancelado ou convertido.
*/
(function(){
  'use strict';

  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));

  function closeDetails(){
    const modal=document.getElementById('detailsModal');
    if(modal){modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');}
    const actions=document.getElementById('detailsActions');
    if(actions){actions.dataset.sosId='';actions.dataset.appointmentId='';}
    window.__bmCurrentSosId=null;
    window.__bmCurrentAppointmentId=null;
  }

  function notice(message){
    const el=document.getElementById('agendaNotice');
    if(!el)return;
    el.textContent=message;
    el.hidden=false;
    clearTimeout(window.__bmSosFinalNotice);
    window.__bmSosFinalNotice=setTimeout(()=>el.hidden=true,3500);
  }

  function getActiveSosId(){
    const actions=document.getElementById('detailsActions');
    const direct=actions?.dataset?.sosId||window.__bmCurrentSosId;
    if(direct)return String(direct);

    const text=(document.getElementById('detailsContent')?.textContent||'').replace(/\s+/g,' ').trim();
    if(!text)return null;

    const state=read();
    const ops=Array.isArray(state.opportunities)?state.opportunities:[];
    const apps=Array.isArray(state.appointments)?state.appointments:[];

    for(const op of ops){
      if(!op||op.source!=='sos'||['cancelado','cancelada','resolved'].includes(op.status))continue;
      const appointment=op.appointmentId?apps.find(a=>a&&a.id===op.appointmentId):null;
      const client=String(appointment?.client||op.client||'');
      const time=String(appointment?.time||op.time||'');
      if(client&&time&&text.includes(client)&&text.includes(time))return String(op.id);
    }
    return null;
  }

  function cancelSosOnly(id){
    if(!id){
      notice('Não foi possível identificar esta solicitação S.O.S.');
      return;
    }

    const state=read();
    const opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const index=opportunities.findIndex(o=>o&&String(o.id)===String(id)&&o.source==='sos');

    if(index<0){
      notice('Não foi possível localizar esta solicitação S.O.S.');
      return;
    }

    /* ALTERAÇÃO ÚNICA PERMITIDA: status da própria opportunity. */
    opportunities[index]={
      ...opportunities[index],
      status:'cancelado',
      cancelledAt:new Date().toISOString(),
      cancelledReason:'Cancelado pelo salão'
    };

    /* Intencionalmente NÃO tocamos state.appointments. */
    state.opportunities=opportunities;
    write(state);

    closeDetails();
    notice('S.O.S. cancelado. Nenhum atendimento da Agenda foi alterado.');

    /* A própria fonte de dados será relida após o reload. */
    setTimeout(()=>window.location.reload(),80);
  }

  function interceptClick(event){
    /* Primeiro: registrar exatamente qual S.O.S. foi clicado. */
    const sosCell=event.target.closest?.('#agendaGrid [data-sos-id]');
    if(sosCell){
      const id=sosCell.dataset.sosId;
      if(id){
        window.__bmCurrentSosId=String(id);
        window.__bmCurrentAppointmentId=null;
      }
      return;
    }

    /* Segundo: o botão Cancelar S.O.S. usa SOMENTE o ID salvo acima/dataset. */
    const cancelButton=event.target.closest?.('#detailsActions [data-sos-action="cancel"], #detailsActions .action-cancel');
    if(!cancelButton)return;

    const actions=document.getElementById('detailsActions');
    const id=actions?.dataset?.sosId||window.__bmCurrentSosId;
    if(!id)return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    cancelSosOnly(String(id));
  }

  function boot(){
    if(document.body?.dataset.role!=='salao')return;
    document.addEventListener('click',interceptClick,true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
