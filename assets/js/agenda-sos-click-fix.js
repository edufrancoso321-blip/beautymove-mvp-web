/* BeautyMove — clique delegado da célula S.O.S. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const duration=o=>Math.max(30,Number(o?.durationSnapshot||o?.durationMinutes||o?.duration||0)||30);
  function openSosDetails(op){
    const modal=document.getElementById('detailsModal'),content=document.getElementById('detailsContent'),actions=document.getElementById('detailsActions');
    if(!modal||!content||!actions)return;
    const state=read();
    const a=op.appointmentId?(state.appointments||[]).find(x=>x&&x.id===op.appointmentId):null;
    const professional=a?.professional||op.acceptedBy||op.professional||'Aguardando profissional';
    content.innerHTML=`<div class="detail-topline"><div><span class="detail-label">Cliente</span><strong>${esc(a?.client||op.client||'Cliente')}</strong></div><div><span class="detail-label">Profissional</span><strong>${esc(professional)}</strong></div><span class="agenda-status status-sos">S.O.S.</span></div><div class="detail-meta-grid"><div><span class="detail-label">Data</span><strong>${esc(op.date||'')}</strong></div><div><span class="detail-label">Horário</span><strong>${esc(a?.time||op.time||'')}</strong></div><div><span class="detail-label">Especialidade</span><strong>${esc(op.specialty||'Não definida')}</strong></div><div><span class="detail-label">Status</span><strong>${a?'Profissional selecionado':'Buscando profissionais'}</strong></div></div><div class="detail-section"><h3>Serviços</h3><div class="service-detail-list"><div><span>${esc(a?.service||op.service||'Atendimento')}</span><span>${duration(a)} min</span></div></div></div><div class="detail-note">Esta solicitação permanece identificada em roxo porque sua origem é o S.O.S. Profissionais.</div>`;
    actions.dataset.sosId=op.id;
    if(a)actions.dataset.appointmentId=a.id;else delete actions.dataset.appointmentId;
    actions.innerHTML=`<button type="button" class="action-button" data-detail-action="sos-schedule">Alterar horário</button><button type="button" class="action-button action-cancel" data-detail-action="sos-cancel">Cancelar atendimento</button>`;
    window.__bmCurrentSosId=op.id;window.__bmCurrentAppointmentId=a?.id||null;
    modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
  }
  function boot(){
    if(window.__bmSosClickFixBound)return;
    window.__bmSosClickFixBound=true;
    document.addEventListener('click',e=>{
      const cell=e.target.closest?.('#agendaGrid td[data-sos-id]');
      if(!cell)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const op=read().opportunities.find(x=>x&&x.id===cell.dataset.sosId);
      if(op)openSosDetails(op);
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
