/* BeautyMove — ações S.O.S. estáveis: alterar horário e cancelar atendimento */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const box=()=>document.getElementById('detailsActions');
  const close=id=>{const m=document.getElementById(id);if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};
  const open=id=>{const m=document.getElementById(id);if(m){m.classList.add('is-open');m.setAttribute('aria-hidden','false');}};
  const notice=msg=>{const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmSosStableNotice);window.__bmSosStableNotice=setTimeout(()=>n.hidden=true,3500);};
  function resolveSosId(){
    const b=box(),direct=b?.dataset?.sosId||window.__bmCurrentSosId;if(direct)return direct;
    const state=read(),ops=Array.isArray(state.opportunities)?state.opportunities:[],apps=Array.isArray(state.appointments)?state.appointments:[];
    const appointmentId=b?.dataset?.appointmentId||window.__bmCurrentAppointmentId;
    if(appointmentId){const op=ops.find(o=>o&&o.source==='sos'&&o.appointmentId===appointmentId&&!['cancelado','cancelada'].includes(o.status));if(op)return op.id;}
    const text=document.getElementById('detailsContent')?.textContent||'';
    for(const op of ops.filter(o=>o&&o.source==='sos'&&!['cancelado','cancelada'].includes(o.status))){
      const a=op.appointmentId?apps.find(x=>x&&x.id===op.appointmentId):null;
      if(a&&text.includes(String(a.client||''))&&text.includes(String(a.time||'')))return op.id;
      if(!a&&text.includes(String(op.client||''))&&text.includes(String(op.time||'')))return op.id;
    }
    return null;
  }
  function getSos(){const id=resolveSosId();if(!id)return null;const state=read(),opportunity=(state.opportunities||[]).find(o=>o&&o.id===id);if(!opportunity)return null;const b=box();if(b)b.dataset.sosId=id;window.__bmCurrentSosId=id;return{state,opportunity};}
  function normalizeButtons(){
    const b=box();if(!b||!getSos())return;
    b.querySelectorAll('button').forEach(btn=>{const t=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(t==='cancelar s.o.s.'||t==='cancelar sos')btn.remove();});
    let schedule=[...b.querySelectorAll('button')].find(x=>(x.textContent||'').trim().toLowerCase()==='alterar horário');
    let cancel=[...b.querySelectorAll('button')].find(x=>(x.textContent||'').trim().toLowerCase()==='cancelar atendimento');
    if(!schedule){schedule=document.createElement('button');schedule.type='button';schedule.className='action-button';schedule.textContent='Alterar horário';b.appendChild(schedule);}
    if(!cancel){cancel=document.createElement('button');cancel.type='button';cancel.className='action-button action-cancel';cancel.textContent='Cancelar atendimento';b.appendChild(cancel);}
    b.querySelectorAll('button').forEach(btn=>{const t=(btn.textContent||'').trim().toLowerCase();if(t!=='alterar horário'&&t!=='cancelar atendimento')btn.remove();});
  }
  function openReschedule(){
    const found=getSos();if(!found){notice('Não foi possível localizar a solicitação S.O.S.');return;}
    const {state,opportunity}=found,appointment=opportunity.appointmentId?(state.appointments||[]).find(a=>a&&a.id===opportunity.appointmentId):null;
    if(appointment){
      const form=document.getElementById('appointmentForm'),time=document.getElementById('appointmentTime'),id=document.getElementById('appointmentId'),client=document.getElementById('appointmentClient'),professional=document.getElementById('appointmentProfessional'),status=document.getElementById('appointmentStatus'),statusField=document.getElementById('appointmentStatusField'),mode=document.getElementById('appointmentMode'),title=document.getElementById('appointmentTitle');
      if(!form)return;
      if(time&&!Array.from(time.options).some(o=>o.value===appointment.time)){const opt=document.createElement('option');opt.value=appointment.time;opt.textContent=appointment.time;time.appendChild(opt);}
      if(id)id.value=appointment.id;if(client)client.value=appointment.client||'';if(professional)professional.value=appointment.professional||'';if(time)time.value=appointment.time||'';if(status)status.value=appointment.status||'agendado';if(statusField)statusField.style.display='flex';if(mode)mode.textContent='ALTERAR HORÁRIO';if(title)title.textContent='Alterar horário';
      form.dataset.bmSosReschedule='1';form.dataset.bmSosOpportunityId=opportunity.id;form.dataset.bmSosAppointmentId=appointment.id;close('detailsModal');open('appointmentModal');return;
    }
    const form=document.getElementById('sosForm');if(!form)return;
    document.getElementById('sosClient').value=opportunity.client||'';document.getElementById('sosService').value=opportunity.service||'';document.getElementById('sosSpecialty').value=opportunity.specialty||'';document.getElementById('sosProfessional').value=opportunity.acceptedBy||opportunity.professional||'';document.getElementById('sosTime').value=opportunity.time||'';document.getElementById('sosRadius').value=opportunity.radius||'5 km';
    const title=document.getElementById('sosTitle'),submit=form.querySelector('button[type="submit"]');if(title)title.textContent='Alterar horário';if(submit)submit.textContent='Salvar alteração';form.dataset.bmSosEditId=opportunity.id;close('detailsModal');open('sosModal');
  }
  function cancelAppointment(){
    const found=getSos();if(!found){notice('Não foi possível localizar o atendimento S.O.S.');return;}
    const {state,opportunity}=found,id=opportunity.appointmentId;
    if(id){const a=(state.appointments||[]).find(x=>x&&x.id===id);if(a){a.status='cancelado';a.cancelledAt=new Date().toISOString();a.cancelledReason='Cancelado pelo salão';}}
    opportunity.status='cancelado';opportunity.cancelledAt=new Date().toISOString();opportunity.cancelledReason='Atendimento cancelado pelo salão';write(state);close('detailsModal');location.reload();
  }
  function saveAppointmentReschedule(e){
    const form=e.currentTarget;if(form.dataset.bmSosReschedule!=='1')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const state=read(),a=(state.appointments||[]).find(x=>x&&x.id===form.dataset.bmSosAppointmentId),op=(state.opportunities||[]).find(x=>x&&x.id===form.dataset.bmSosOpportunityId),time=document.getElementById('appointmentTime')?.value||'';
    if(!a||!op||!time){notice('Não foi possível alterar o horário.');return;}a.time=time;op.time=time;write(state);delete form.dataset.bmSosReschedule;delete form.dataset.bmSosOpportunityId;delete form.dataset.bmSosAppointmentId;close('appointmentModal');notice('Horário alterado com sucesso.');setTimeout(()=>location.reload(),120);
  }
  function saveSosReschedule(e){
    const form=e.currentTarget,id=form.dataset.bmSosEditId;if(!id)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const state=read(),op=(state.opportunities||[]).find(x=>x&&x.id===id),time=document.getElementById('sosTime')?.value||'';if(!op||!time){notice('Não foi possível alterar o horário.');return;}op.time=time;write(state);delete form.dataset.bmSosEditId;const submit=form.querySelector('button[type="submit"]');if(submit)submit.textContent='Enviar S.O.S.';close('sosModal');notice('Horário da solicitação S.O.S. alterado.');setTimeout(()=>location.reload(),120);
  }
  function bind(){
    document.addEventListener('click',e=>{const cell=e.target.closest?.('#agendaGrid [data-sos-id]');if(cell){window.__bmCurrentSosId=cell.dataset.sosId||null;return;}const btn=e.target.closest?.('#detailsActions button');if(!btn)return;const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(text!=='alterar horário'&&text!=='cancelar atendimento')return;const found=getSos();if(!found)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(text==='alterar horário')openReschedule();else cancelAppointment();},true);
    document.getElementById('appointmentForm')?.addEventListener('submit',saveAppointmentReschedule,true);
    document.getElementById('sosForm')?.addEventListener('submit',saveSosReschedule,true);
  }
  function boot(){if(document.body?.dataset.role!=='salao')return;bind();const target=document.getElementById('detailsActions')||document.body;new MutationObserver(normalizeButtons).observe(target,{childList:true,subtree:true});setInterval(normalizeButtons,300);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();