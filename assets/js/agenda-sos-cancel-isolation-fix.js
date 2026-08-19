/* BeautyMove — cancelamento S.O.S. definitivo e isolado.
   Regra: cancelar um S.O.S. altera somente a oportunidade S.O.S.
*/
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';

  function read(){
    try{
      const s=JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{};
      return {
        appointments:Array.isArray(s.appointments)?s.appointments:[],
        opportunities:Array.isArray(s.opportunities)?s.opportunities:[],
        transactions:Array.isArray(s.transactions)?s.transactions:[],
        ...s
      };
    }catch(_){return {appointments:[],opportunities:[],transactions:[]};}
  }
  function write(s){localStorage.setItem(STATE_KEY,JSON.stringify(s));}
  function notice(msg){
    const n=document.getElementById('agendaNotice');
    if(!n)return;
    n.textContent=msg;n.hidden=false;
    clearTimeout(window.__bmSosIsolationNotice);
    window.__bmSosIsolationNotice=setTimeout(()=>n.hidden=true,3500);
  }
  function close(){
    const m=document.getElementById('detailsModal');
    if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}
    const a=document.getElementById('detailsActions');
    if(a){a.dataset.sosId='';a.dataset.appointmentId='';}
  }
  function cancelOnly(id){
    if(!id)return false;
    const state=read();
    const op=state.opportunities.find(o=>o&&o.id===id&&o.source==='sos');
    if(!op)return false;

    op.status='cancelado';
    op.cancelledAt=new Date().toISOString();
    op.cancelledReason='Cancelado pelo salão';

    /* Se o S.O.S. já tinha profissional aceito, o atendimento continua.
       Nenhum appointment diferente deste vínculo é tocado. */
    if(op.appointmentId){
      const appointment=state.appointments.find(a=>a&&a.id===op.appointmentId);
      if(appointment){
        delete appointment.sosAcceptedBy;
        delete appointment.sosAcceptedAt;
        delete appointment.sosOpportunityId;
        delete appointment.sosOriginalProfessional;
        appointment.source='agenda';
      }
    }

    write(state);
    window.__bmCurrentAppointmentId=null;
    window.__bmCurrentSosId=null;
    close();
    notice(op.appointmentId
      ? 'S.O.S. cancelado. O atendimento permanece na Agenda.'
      : 'S.O.S. cancelado. Nenhum outro atendimento foi alterado.'
    );

    /* Atualiza a grade sem depender de handlers antigos. */
    setTimeout(()=>window.location.reload(),120);
    return true;
  }

  function bindButton(button){
    if(!button||button.dataset.bmSosCancelBound==='1')return;
    button.dataset.bmSosCancelBound='1';
    button.addEventListener('click',function(e){
      const actions=document.getElementById('detailsActions');
      const id=actions?.dataset?.sosId||window.__bmCurrentSosId||null;
      if(!id)return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      cancelOnly(id);
    },true);
  }

  function bindCurrentSosButton(){
    const actions=document.getElementById('detailsActions');
    if(!actions||!actions.dataset.sosId)return;
    const button=[...actions.querySelectorAll('button')].find(b=>{
      const text=(b.textContent||'').replace(/\\s+/g,' ').trim().toLowerCase();
      return text==='cancelar s.o.s.'||text==='cancelar sos';
    });
    if(button)bindButton(button);
  }

  function intercept(e){
    const cell=e.target.closest?.('#agendaGrid [data-sos-id]');
    if(cell){
      const id=cell.dataset.sosId;
      const state=read();
      const op=state.opportunities.find(o=>o&&o.id===id&&o.source==='sos');
      if(!op)return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      window.__bmCurrentAppointmentId=null;
      window.__bmCurrentSosId=id;
      /* O handler genérico da agenda não poderá assumir este clique. */
      const content=document.getElementById('detailsContent');
      const actions=document.getElementById('detailsActions');
      const modal=document.getElementById('detailsModal');
      if(content&&actions&&modal){
        const appointment=op.appointmentId?state.appointments.find(a=>a&&a.id===op.appointmentId):null;
        const professional=appointment?.professional||op.acceptedBy||op.professional||'Aguardando';
        const time=appointment?.time||op.time||'';
        const service=appointment?.service||op.service||op.specialty||'Atendimento';
        const duration=Number(appointment?.duration||op.durationSnapshot||30);
        content.innerHTML=`<div class="detail-topline"><div><span class="detail-label">Cliente</span><strong>${String(appointment?.client||op.client||'Cliente')}</strong></div><div><span class="detail-label">Profissional</span><strong>${String(professional)}</strong></div><span class="agenda-status status-sos">S.O.S.</span></div><div class="detail-meta-grid"><div><span class="detail-label">Data</span><strong>${String(op.date||appointment?.date||'')}</strong></div><div><span class="detail-label">Horário</span><strong>${String(time)}</strong></div><div><span class="detail-label">Especialidade</span><strong>${String(op.specialty||'Cabelos')}</strong></div><div><span class="detail-label">Status</span><strong>${appointment?'Profissional selecionado':'Aguardando profissional'}</strong></div></div><div class="detail-section"><h3>Serviços</h3><div class="service-detail-list"><div><span>${String(service)}</span><span>${duration} min</span></div></div></div><div class="detail-note">Esta solicitação permanece identificada em roxo porque sua origem é o S.O.S. Profissionais.</div>`;
        actions.dataset.sosId=id;
        actions.dataset.appointmentId=appointment?.id||'';
        actions.innerHTML=appointment?'<button type="button" class="action-button" data-sos-action="reschedule">Alterar horário</button><button type="button" class="action-button action-cancel" data-sos-action="cancel">Cancelar S.O.S.</button>':'<button type="button" class="action-button action-cancel" data-sos-action="cancel">Cancelar S.O.S.</button>';
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden','false');
        bindCurrentSosButton();
      }
      return;
    }

    const button=e.target.closest?.('#detailsActions button[data-sos-action="cancel"]');
    if(button){
      const id=document.getElementById('detailsActions')?.dataset?.sosId||window.__bmCurrentSosId||null;
      if(!id)return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      cancelOnly(id);
    }
  }

  function boot(){
    if(document.body?.dataset.role!=='salao')return;
    document.addEventListener('click',intercept,true);
    const actions=document.getElementById('detailsActions');
    if(actions){
      new MutationObserver(()=>bindCurrentSosButton()).observe(actions,{childList:true,subtree:true,attributes:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
