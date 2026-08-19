/* BeautyMove — ações finais da janela de atendimento S.O.S. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const close=()=>{const m=document.getElementById('detailsModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};
  const notice=msg=>{const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmSosActionNotice);window.__bmSosActionNotice=setTimeout(()=>n.hidden=true,3500);};
  const getSosId=()=>document.getElementById('detailsActions')?.dataset?.sosId||window.__bmCurrentSosId||null;
  const getSos=()=>{const id=getSosId();if(!id)return null;const s=read(),o=(s.opportunities||[]).find(x=>x&&x.id===id);return o?{state:s,opportunity:o}:null;};
  const openReschedule=appointment=>{
    const modal=document.getElementById('appointmentModal');
    if(!modal||!appointment)return false;
    const id=document.getElementById('appointmentId'),client=document.getElementById('appointmentClient'),professional=document.getElementById('appointmentProfessional'),time=document.getElementById('appointmentTime'),status=document.getElementById('appointmentStatus'),statusField=document.getElementById('appointmentStatusField'),mode=document.getElementById('appointmentMode'),title=document.getElementById('appointmentTitle');
    const current=[...((time&&time.options)||[])].map(o=>o.value);
    if(id)id.value=appointment.id;
    if(client)client.value=appointment.client||'';
    if(professional)professional.value=appointment.professional||'Ana';
    if(time&&current.includes(appointment.time))time.value=appointment.time;
    if(status)status.value=appointment.status||'agendado';
    if(statusField)statusField.style.display='flex';
    if(mode)mode.textContent='ALTERAR HORÁRIO';
    if(title)title.textContent='Alterar horário';
    modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
    return true;
  };
  function cancelSosOnly(){
    const found=getSos();if(!found){notice('Não foi possível localizar a solicitação S.O.S.');return;}
    found.opportunity.status='cancelado';
    found.opportunity.cancelledAt=new Date().toISOString();
    found.opportunity.cancelledReason='Cancelado pelo salão';
    /* O atendimento vinculado permanece intacto. */
    write(found.state);
    close();
    notice('S.O.S. cancelado. O atendimento permanece na agenda.');
    setTimeout(()=>location.reload(),120);
  }
  function cancelAppointmentOnly(){
    const found=getSos();if(!found){notice('Não foi possível localizar o atendimento S.O.S.');return;}
    const appointmentId=found.opportunity.appointmentId;
    if(!appointmentId){notice('Este S.O.S. ainda não possui atendimento reservado.');return;}
    const appointment=(found.state.appointments||[]).find(a=>a&&a.id===appointmentId);
    if(!appointment){notice('Atendimento não localizado.');return;}
    appointment.status='cancelado';
    appointment.cancelledAt=new Date().toISOString();
    appointment.cancelledReason='Cancelado pelo salão';
    found.opportunity.status='cancelado';
    found.opportunity.cancelledAt=new Date().toISOString();
    found.opportunity.cancelledReason='Atendimento cancelado pelo salão';
    write(found.state);
    close();
    notice('Atendimento cancelado.');
    setTimeout(()=>location.reload(),120);
  }
  function bind(){
    document.addEventListener('click',e=>{
      const sosCell=e.target.closest?.('#agendaGrid [data-sos-id]');
      if(sosCell){window.__bmCurrentSosId=sosCell.dataset.sosId||null;return;}
      const btn=e.target.closest?.('#detailsActions button');
      if(!btn)return;
      const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const found=getSos();
      if(!found)return;
      if(text==='cancelar s.o.s.'||text==='cancelar sos'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        cancelSosOnly();return;
      }
      if(text==='cancelar atendimento'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        cancelAppointmentOnly();return;
      }
      if(text==='alterar horário'){
        const appointmentId=found.opportunity.appointmentId;
        const appointment=appointmentId?(found.state.appointments||[]).find(a=>a&&a.id===appointmentId):null;
        if(!appointment){notice('Este S.O.S. ainda não possui atendimento reservado.');return;}
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        close();
        const timeSelect=document.getElementById('appointmentTime');
        if(timeSelect&&![...timeSelect.options].some(o=>o.value===appointment.time)){
          const option=document.createElement('option');option.value=appointment.time;option.textContent=appointment.time;timeSelect.appendChild(option);
        }
        openReschedule(appointment);
      }
    },true);
  }
  function boot(){
    if(document.body?.dataset.role!=='salao')return;
    bind();
    setInterval(()=>{
      const box=document.getElementById('detailsActions');
      if(!box)return;
      const sos=getSos();
      if(!sos)return;
      if(!box.dataset.sosId)box.dataset.sosId=sos.opportunity.id;
    },250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
