/* BeautyMove — controlador único das ações S.O.S. + reparo de reserva */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const box=()=>document.getElementById('detailsActions');
  const close=id=>{const m=document.getElementById(id);if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};
  const open=id=>{const m=document.getElementById(id);if(m){m.classList.add('is-open');m.setAttribute('aria-hidden','false');}};
  const notice=msg=>{const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmSosControllerNotice);window.__bmSosControllerNotice=setTimeout(()=>n.hidden=true,3500);};
  const mins=t=>{const p=String(t||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const durationOf=o=>Math.max(30,Number(o?.durationSnapshot||o?.durationMinutes||o?.duration||0)||30);
  const servicesOf=o=>{const list=Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:Array.isArray(o?.services)?o.services:[];return list.map(s=>({id:s.id,name:s.name,duration:Number(s.duration||s.durationMinutes||0)||30,value:Number(s.value||s.clientPrice||0)}));};
  const valueOf=o=>Number(o?.clientPriceSnapshot||o?.value||0)||servicesOf(o).reduce((n,s)=>n+Number(s.value||0),0);
  const overlaps=(aStart,aEnd,bStart,bEnd)=>aStart<bEnd&&bStart<aEnd;

  function ensureAppointment(op,state){
    if(!op)return null;
    state.appointments=Array.isArray(state.appointments)?state.appointments:[];
    const acceptedProfessional=String(op.acceptedBy||op.professional||'').trim();
    if(!acceptedProfessional)return null;
    let appointment=op.appointmentId?state.appointments.find(a=>a&&a.id===op.appointmentId):null;
    if(!appointment){
      appointment=state.appointments.find(a=>a&&a.source==='sos'&&a.sosOpportunityId===op.id&&a.status!=='cancelado');
    }
    const date=op.date||appointment?.date||new Date().toISOString().slice(0,10);
    const start=op.time||appointment?.time||'08:00';
    const duration=durationOf(op);
    if(appointment){
      let changed=false;
      if(appointment.professional!==acceptedProfessional){appointment.professional=acceptedProfessional;appointment.sosAcceptedBy=acceptedProfessional;changed=true;}
      if(appointment.date!==date){appointment.date=date;changed=true;}
      if(appointment.time!==start){appointment.time=start;changed=true;}
      if(Number(appointment.duration)!==duration){appointment.duration=duration;appointment.durationMinutes=duration;changed=true;}
      const end=time(mins(start)+duration);if(appointment.endTime!==end){appointment.endTime=end;changed=true;}
      if(!appointment.source){appointment.source='sos';changed=true;}
      if(!appointment.sosOpportunityId){appointment.sosOpportunityId=op.id;changed=true;}
      if(changed)write(state);
      op.appointmentId=appointment.id;
      return appointment;
    }
    const conflict=state.appointments.some(a=>a&&a.status!=='cancelado'&&a.date===date&&a.professional===acceptedProfessional&&overlaps(mins(start),mins(start)+duration,mins(a.time),mins(a.time)+durationOf(a)));
    if(conflict){return null;}
    const id=`apt-sos-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const services=servicesOf(op);
    appointment={id,date,time:start,endTime:time(mins(start)+duration),professional:acceptedProfessional,client:op.client||'Cliente',services,service:op.service||services.map(s=>s.name).join(' + '),duration,durationMinutes:duration,value:valueOf(op),status:'agendado',source:'sos',sosAcceptedBy:acceptedProfessional,sosAcceptedAt:op.acceptedAt||new Date().toISOString(),sosOpportunityId:op.id};
    state.appointments.push(appointment);
    op.appointmentId=id;
    op.acceptedBy=acceptedProfessional;
    op.status='resolved';
    op.endTime=appointment.endTime;
    write(state);
    return appointment;
  }

  function resolveContext(){
    const state=read(),ops=Array.isArray(state.opportunities)?state.opportunities:[],apps=Array.isArray(state.appointments)?state.appointments:[];
    const candidates=ops.filter(o=>o&&o.source==='sos'&&!['cancelado','cancelada'].includes(String(o.status||'').toLowerCase()));
    const b=box();
    const ids=[b?.dataset?.sosId,window.__bmCurrentSosId].filter(Boolean);
    for(const id of ids){const op=candidates.find(o=>o.id===id);if(op){const appointment=ensureAppointment(op,state);return{state,opportunity:op,appointment};}}
    const appointmentId=b?.dataset?.appointmentId||window.__bmCurrentAppointmentId;
    if(appointmentId){const op=candidates.find(o=>o.appointmentId===appointmentId);if(op){const appointment=ensureAppointment(op,state);return{state,opportunity:op,appointment:appointment||apps.find(a=>a&&a.id===appointmentId)||null};}}
    const text=document.getElementById('detailsContent')?.textContent||'';
    for(const op of candidates){
      const a=op.appointmentId?apps.find(x=>x&&x.id===op.appointmentId):null;
      const client=String((a?.client||op.client||'')).trim();
      const timeValue=String((a?.time||op.time||'')).trim();
      if(client&&timeValue&&text.includes(client)&&text.includes(timeValue)){const appointment=ensureAppointment(op,state);return{state,opportunity:op,appointment:appointment||a||null};}
    }
    return null;
  }

  function normalizeButtons(){
    const b=box();if(!b)return;
    const ctx=resolveContext();if(!ctx)return;
    b.dataset.sosId=ctx.opportunity.id;
    if(ctx.appointment)b.dataset.appointmentId=ctx.appointment.id;
    const buttons=[...b.querySelectorAll('button')];
    buttons.forEach(btn=>{const t=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(t==='cancelar s.o.s.'||t==='cancelar sos')btn.remove();});
    let schedule=[...b.querySelectorAll('button')].find(btn=>(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()==='alterar horário');
    let cancel=[...b.querySelectorAll('button')].find(btn=>(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()==='cancelar atendimento');
    if(!schedule){schedule=document.createElement('button');schedule.type='button';schedule.className='action-button';schedule.textContent='Alterar horário';b.appendChild(schedule);}
    if(!cancel){cancel=document.createElement('button');cancel.type='button';cancel.className='action-button action-cancel';cancel.textContent='Cancelar atendimento';b.appendChild(cancel);}
    [...b.querySelectorAll('button')].forEach(btn=>{const t=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(t!=='alterar horário'&&t!=='cancelar atendimento')btn.remove();});
  }

  function buildTimeOptions(selected){const out=[];for(let m=0;m<=1439;m+=30){const t=time(m);out.push(`<option value="${t}"${t===selected?' selected':''}>${t}</option>`);}return out.join('');}
  function openReschedule(){
    const ctx=resolveContext();if(!ctx){notice('Não foi possível localizar o atendimento S.O.S.');return;}
    if(!ctx.appointment){notice('Não foi possível reconstruir a reserva S.O.S.');return;}
    let modal=document.getElementById('sosRescheduleModal');
    if(!modal){modal=document.createElement('div');modal.id='sosRescheduleModal';modal.className='modal';modal.setAttribute('aria-hidden','true');modal.innerHTML='<div class="modal-backdrop" data-bm-sos-close></div><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="sosRescheduleTitle"><button class="modal-close" type="button" aria-label="Fechar" data-bm-sos-close>×</button><div class="eyebrow">S.O.S. PROFISSIONAIS</div><h2 id="sosRescheduleTitle">Alterar horário</h2><p class="modal-intro" id="sosRescheduleInfo"></p><div class="field"><label for="sosRescheduleTime">Novo horário</label><select id="sosRescheduleTime"></select></div><div class="modal-actions"><button class="secondary" type="button" data-bm-sos-close>Cancelar</button><button class="primary compact" type="button" id="sosRescheduleSave">Salvar horário</button></div></section></div>';document.body.appendChild(modal);}
    const current=ctx.appointment.time||ctx.opportunity.time||'08:00';
    document.getElementById('sosRescheduleTime').innerHTML=buildTimeOptions(current);
    document.getElementById('sosRescheduleInfo').textContent=`${ctx.appointment.client||ctx.opportunity.client||'Cliente'} · ${ctx.appointment.professional||ctx.opportunity.acceptedBy||'Profissional'}`;
    modal.dataset.sosId=ctx.opportunity.id;modal.dataset.appointmentId=ctx.appointment.id;open('sosRescheduleModal');
  }
  function saveReschedule(){
    const modal=document.getElementById('sosRescheduleModal'),id=modal?.dataset?.sosId,timeValue=document.getElementById('sosRescheduleTime')?.value;
    if(!id||!timeValue){notice('Não foi possível identificar o horário.');return;}
    const state=read(),op=(state.opportunities||[]).find(o=>o&&o.id===id),appointmentId=modal.dataset.appointmentId,appointment=appointmentId?(state.appointments||[]).find(a=>a&&a.id===appointmentId):null;
    if(!op||!appointment){notice('Atendimento S.O.S. não encontrado.');return;}
    const duration=durationOf(appointment),startMin=mins(timeValue),conflict=(state.appointments||[]).some(a=>a&&a.id!==appointment.id&&a.status!=='cancelado'&&a.date===appointment.date&&a.professional===appointment.professional&&overlaps(startMin,startMin+duration,mins(a.time),mins(a.time)+durationOf(a)));
    if(conflict){notice(`${appointment.professional||'Profissional'} já possui atendimento nesse horário.`);return;}
    appointment.time=timeValue;appointment.endTime=time(startMin+duration);op.time=timeValue;op.endTime=appointment.endTime;write(state);close('sosRescheduleModal');notice('Horário alterado com sucesso.');setTimeout(()=>location.reload(),120);
  }
  function cancelAppointment(){
    const ctx=resolveContext();if(!ctx){notice('Não foi possível localizar o atendimento S.O.S.');return;}
    const {state,opportunity,appointment}=ctx;
    if(appointment){appointment.status='cancelado';appointment.cancelledAt=new Date().toISOString();appointment.cancelledReason='Cancelado pelo salão';}
    opportunity.status='cancelado';opportunity.cancelledAt=new Date().toISOString();opportunity.cancelledReason='Atendimento S.O.S. cancelado pelo salão';
    write(state);close('detailsModal');location.reload();
  }
  function bind(){
    document.addEventListener('click',e=>{
      const cell=e.target.closest?.('#agendaGrid [data-sos-id]');
      if(cell){window.__bmCurrentSosId=cell.dataset.sosId||null;window.__bmCurrentAppointmentId=cell.dataset.appointmentId||null;setTimeout(normalizeButtons,0);return;}
      const save=e.target.closest?.('#sosRescheduleSave');if(save){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveReschedule();return;}
      const closeBtn=e.target.closest?.('[data-bm-sos-close]');if(closeBtn){e.preventDefault();e.stopPropagation();close('sosRescheduleModal');return;}
      const btn=e.target.closest?.('#detailsActions button');if(!btn)return;
      const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(text!=='alterar horário'&&text!=='cancelar atendimento')return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(text==='alterar horário')openReschedule();else cancelAppointment();
    },true);
    const observer=new MutationObserver(()=>normalizeButtons());
    observer.observe(document.getElementById('detailsActions')||document.body,{childList:true,subtree:true});
    normalizeButtons();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
