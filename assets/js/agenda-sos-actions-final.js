/* BeautyMove — ações S.O.S. finais: uma única ação de cancelamento */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const close=()=>{const m=document.getElementById('detailsModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};
  const notice=msg=>{const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmSosV3Notice);window.__bmSosV3Notice=setTimeout(()=>n.hidden=true,3500);};
  const box=()=>document.getElementById('detailsActions');
  const getSosId=()=>box()?.dataset?.sosId||window.__bmCurrentSosId||null;
  const getSos=()=>{const id=getSosId();if(!id)return null;const state=read(),opportunity=(state.opportunities||[]).find(o=>o&&o.id===id);return opportunity?{state,opportunity}:null;};
  function normalizeButtons(){
    const b=box();if(!b||!b.dataset.sosId)return;
    b.querySelectorAll('button').forEach(btn=>{const t=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(t==='cancelar s.o.s.'||t==='cancelar sos')btn.remove();});
    let schedule=[...b.querySelectorAll('button')].find(btn=>(btn.textContent||'').trim().toLowerCase()==='alterar horário');
    let cancel=[...b.querySelectorAll('button')].find(btn=>(btn.textContent||'').trim().toLowerCase()==='cancelar atendimento');
    if(!schedule){schedule=document.createElement('button');schedule.type='button';schedule.className='action-button';schedule.textContent='Alterar horário';b.appendChild(schedule);}
    if(!cancel){cancel=document.createElement('button');cancel.type='button';cancel.className='action-button action-cancel';cancel.textContent='Cancelar atendimento';b.appendChild(cancel);}
    b.querySelectorAll('button').forEach(btn=>{btn.removeAttribute('data-detail-action');btn.removeAttribute('data-sos-detail');});
    b.querySelectorAll('button').forEach(btn=>{const t=(btn.textContent||'').trim().toLowerCase();if(t!=='alterar horário'&&t!=='cancelar atendimento')btn.remove();});
  }
  function openReschedule(){
    const found=getSos();if(!found)return;
    const appointmentId=found.opportunity.appointmentId;
    const appointment=appointmentId?(found.state.appointments||[]).find(a=>a&&a.id===appointmentId):null;
    if(!appointment){notice('Este S.O.S. ainda não possui atendimento reservado.');return;}
    const modal=document.getElementById('appointmentModal'),id=document.getElementById('appointmentId'),client=document.getElementById('appointmentClient'),professional=document.getElementById('appointmentProfessional'),time=document.getElementById('appointmentTime'),status=document.getElementById('appointmentStatus'),statusField=document.getElementById('appointmentStatusField'),mode=document.getElementById('appointmentMode'),title=document.getElementById('appointmentTitle');
    if(!modal)return;
    if(time&&!Array.from(time.options).some(o=>o.value===appointment.time)){const opt=document.createElement('option');opt.value=appointment.time;opt.textContent=appointment.time;time.appendChild(opt);}
    if(id)id.value=appointment.id;if(client)client.value=appointment.client||'';if(professional)professional.value=appointment.professional||'';if(time)time.value=appointment.time||'';if(status)status.value=appointment.status||'agendado';if(statusField)statusField.style.display='flex';if(mode)mode.textContent='ALTERAR HORÁRIO';if(title)title.textContent='Alterar horário';
    const form=document.getElementById('appointmentForm');if(form){form.dataset.bmSosOpportunityId=found.opportunity.id;form.dataset.bmSosAppointmentId=appointment.id;}
    close();modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
  }
  function cancelAppointment(){
    const found=getSos();if(!found){notice('Não foi possível localizar o atendimento S.O.S.');return;}
    const id=found.opportunity.appointmentId;
    if(id){const appointment=(found.state.appointments||[]).find(a=>a&&a.id===id);if(appointment){appointment.status='cancelado';appointment.cancelledAt=new Date().toISOString();appointment.cancelledReason='Cancelado pelo salão';}}
    found.opportunity.status='cancelado';found.opportunity.cancelledAt=new Date().toISOString();found.opportunity.cancelledReason='Atendimento cancelado pelo salão';
    write(found.state);close();notice('Atendimento cancelado. A solicitação S.O.S. também foi encerrada.');setTimeout(()=>location.reload(),120);
  }
  function syncReschedule(){
    const form=document.getElementById('appointmentForm'),opportunityId=form?.dataset?.bmSosOpportunityId,appointmentId=form?.dataset?.bmSosAppointmentId;if(!opportunityId||!appointmentId)return;
    const state=read(),appointment=(state.appointments||[]).find(a=>a&&a.id===appointmentId),opportunity=(state.opportunities||[]).find(o=>o&&o.id===opportunityId);if(!appointment||!opportunity)return;
    opportunity.time=appointment.time;opportunity.date=appointment.date;opportunity.endTime=appointment.endTime||'';opportunity.appointmentId=appointment.id;write(state);delete form.dataset.bmSosOpportunityId;delete form.dataset.bmSosAppointmentId;
  }
  function bind(){
    document.addEventListener('click',e=>{
      const cell=e.target.closest?.('#agendaGrid [data-sos-id]');if(cell){window.__bmCurrentSosId=cell.dataset.sosId||null;return;}
      const b=box(),btn=e.target.closest?.('#detailsActions button');if(!btn||!b?.dataset?.sosId)return;
      const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(text==='alterar horário'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openReschedule();return;}
      if(text==='cancelar atendimento'||text==='cancelar s.o.s.'||text==='cancelar sos'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();cancelAppointment();return;}
    },true);
    const form=document.getElementById('appointmentForm');
    form?.addEventListener('submit',()=>{if(form.dataset.bmSosOpportunityId)form.dataset.bmSosAppointmentId=document.getElementById('appointmentId')?.value||form.dataset.bmSosAppointmentId||'';},true);
    form?.addEventListener('submit',()=>setTimeout(syncReschedule,0));
  }
  function boot(){
    if(document.body?.dataset.role!=='salao')return;
    bind();
    const target=document.getElementById('detailsActions')||document.body;new MutationObserver(normalizeButtons).observe(target,{childList:true,subtree:true});
    setInterval(normalizeButtons,250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
