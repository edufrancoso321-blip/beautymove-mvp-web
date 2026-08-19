/* BeautyMove — isolamento definitivo da coluna S.O.S.
   Regra: clicar/cancelar um S.O.S. nunca pode alterar um atendimento normal.
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
    }catch(_){
      return {appointments:[],opportunities:[],transactions:[]};
    }
  }
  function write(s){ localStorage.setItem(STATE_KEY,JSON.stringify(s)); }
  function esc(v){
    return String(v==null?'':v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  }
  function closeDetails(){
    const m=document.getElementById('detailsModal');
    if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}
    const a=document.getElementById('detailsActions');
    if(a){a.dataset.sosId='';a.dataset.appointmentId='';}
  }
  function notice(msg){
    const n=document.getElementById('agendaNotice');
    if(!n)return;
    n.textContent=msg;n.hidden=false;
    clearTimeout(window.__bmSosIsolationNotice);
    window.__bmSosIsolationNotice=setTimeout(()=>n.hidden=true,3500);
  }
  function activeOpportunity(id){
    return read().opportunities.find(o=>o&&o.id===id&&o.source==='sos')||null;
  }

  function openSosDetails(op){
    const state=read();
    const appointment=op.appointmentId
      ? state.appointments.find(a=>a&&a.id===op.appointmentId)
      : null;

    // Zera qualquer referência de atendimento normal antes de abrir o S.O.S.
    window.__bmCurrentAppointmentId=null;
    window.__bmCurrentSosId=op.id;

    const content=document.getElementById('detailsContent');
    const actions=document.getElementById('detailsActions');
    const modal=document.getElementById('detailsModal');
    if(!content||!actions||!modal)return;

    const professional=appointment?.professional||op.acceptedBy||op.professional||'Aguardando';
    const time=appointment?.time||op.time||'';
    const service=appointment?.service||op.service||op.specialty||'Atendimento';
    const duration=Number(appointment?.duration||op.durationSnapshot||30);
    const end=appointment?.endTime||'';
    const status=appointment ? 'Profissional selecionado' : 'Aguardando profissional';

    content.innerHTML=
      '<div class="detail-topline">'+
        '<div><span class="detail-label">Cliente</span><strong>'+esc(appointment?.client||op.client||'Cliente')+'</strong></div>'+
        '<div><span class="detail-label">Profissional</span><strong>'+esc(professional)+'</strong></div>'+
        '<span class="agenda-status status-sos">S.O.S.</span>'+ 
      '</div>'+ 
      '<div class="detail-meta-grid">'+
        '<div><span class="detail-label">Data</span><strong>'+esc(op.date||appointment?.date||'')+'</strong></div>'+ 
        '<div><span class="detail-label">Horário</span><strong>'+esc(time)+(end?' – '+esc(end):'')+'</strong></div>'+ 
        '<div><span class="detail-label">Especialidade</span><strong>'+esc(op.specialty||'Cabelos')+'</strong></div>'+ 
        '<div><span class="detail-label">Status</span><strong>'+esc(status)+'</strong></div>'+ 
      '</div>'+ 
      '<div class="detail-section"><h3>Serviços</h3>'+ 
        '<div class="service-detail-list"><div><span>'+esc(service)+'</span><span>'+esc(duration)+' min</span></div></div>'+ 
      '</div>'+ 
      '<div class="detail-note">Esta solicitação permanece identificada em roxo porque sua origem é o S.O.S. Profissionais.</div>';

    actions.dataset.sosId=op.id;
    actions.dataset.appointmentId=appointment?.id||'';
    actions.innerHTML=appointment
      ? '<button type="button" class="action-button" data-sos-action="reschedule">Alterar horário</button>'+ 
        '<button type="button" class="action-button action-cancel" data-sos-action="cancel">Cancelar S.O.S.</button>'
      : '<button type="button" class="action-button action-cancel" data-sos-action="cancel">Cancelar S.O.S.</button>';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
  }

  function cancelSos(opId){
    const state=read();
    const op=state.opportunities.find(o=>o&&o.id===opId&&o.source==='sos');
    if(!op){
      notice('Não foi possível localizar esta solicitação S.O.S.');
      return;
    }

    op.status='cancelado';
    op.cancelledAt=new Date().toISOString();
    op.cancelledReason='Cancelado pelo salão';

    // Se já havia profissional aceito, o atendimento continua na agenda normal.
    if(op.appointmentId){
      const a=state.appointments.find(x=>x&&x.id===op.appointmentId);
      if(a){
        delete a.sosAcceptedBy;
        delete a.sosAcceptedAt;
        delete a.sosOpportunityId;
        delete a.sosOriginalProfessional;
        a.source='agenda';
      }
    }

    write(state);
    window.__bmCurrentAppointmentId=null;
    window.__bmCurrentSosId=null;
    closeDetails();
    notice(op.appointmentId
      ? 'S.O.S. cancelado. O atendimento permanece na Agenda.'
      : 'S.O.S. cancelado. Nenhum outro atendimento foi alterado.'
    );

    setTimeout(()=>location.reload(),80);
  }

  function interceptClick(e){
    const cell=e.target.closest?.('#agendaGrid [data-sos-id]');
    if(cell){
      const id=cell.dataset.sosId;
      const op=activeOpportunity(id);
      if(!op)return;
      // Bloqueia completamente o handler genérico da agenda.
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      window.__bmCurrentAppointmentId=null;
      window.__bmCurrentSosId=id;
      openSosDetails(op);
      return;
    }

    const btn=e.target.closest?.('#detailsActions [data-sos-action]');
    if(btn){
      const actions=document.getElementById('detailsActions');
      const id=actions?.dataset?.sosId;
      if(!id)return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if(btn.dataset.sosAction==='cancel')cancelSos(id);
    }
  }

  function boot(){
    if(document.body?.dataset.role!=='salao')return;
    document.addEventListener('click',interceptClick,true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
