/* BeautyMove — controlador único das ações S.O.S. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const box=()=>document.getElementById('detailsActions');
  const close=id=>{const m=document.getElementById(id);if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};
  const open=id=>{const m=document.getElementById(id);if(m){m.classList.add('is-open');m.setAttribute('aria-hidden','false');}};
  const notice=msg=>{const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmSosControllerNotice);window.__bmSosControllerNotice=setTimeout(()=>n.hidden=true,3500);};
  function resolveContext(){
    const state=read(),ops=Array.isArray(state.opportunities)?state.opportunities:[],apps=Array.isArray(state.appointments)?state.appointments:[];
    const active=ops.filter(o=>o&&o.source==='sos'&&!['cancelado','cancelada'].includes(o.status));
    const b=box();
    const ids=[b?.dataset?.sosId,window.__bmCurrentSosId].filter(Boolean);
    for(const id of ids){const op=active.find(o=>o.id===id);if(op)return{state,opportunity:op,appointment:op.appointmentId?apps.find(a=>a&&a.id===op.appointmentId)||null:null};}
    const appointmentId=b?.dataset?.appointmentId||window.__bmCurrentAppointmentId;
    if(appointmentId){const op=active.find(o=>o.appointmentId===appointmentId);if(op)return{state,opportunity:op,appointment:apps.find(a=>a&&a.id===appointmentId)||null};}
    const text=document.getElementById('detailsContent')?.textContent||'';
    for(const op of active){
      const a=op.appointmentId?apps.find(x=>x&&x.id===op.appointmentId):null;
      const client=String((a?.client||op.client||'')).trim();
      const time=String((a?.time||op.time||'')).trim();
      if(client&&time&&text.includes(client)&&text.includes(time))return{state,opportunity:op,appointment:a||null};
    }
    return null;
  }
  function normalizeButtons(){
    const b=box(),ctx=resolveContext();if(!b||!ctx)return;
    b.dataset.sosId=ctx.opportunity.id;
    if(ctx.appointment)b.dataset.appointmentId=ctx.appointment.id;
    const buttons=[...b.querySelectorAll('button')];
    const valid=buttons.filter(btn=>['alterar horário','cancelar atendimento'].includes((btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()));
    if(valid.length===2&&buttons.length===2)return;
    b.innerHTML='';
    const schedule=document.createElement('button');schedule.type='button';schedule.className='action-button';schedule.textContent='Alterar horário';
    const cancel=document.createElement('button');cancel.type='button';cancel.className='action-button action-cancel';cancel.textContent='Cancelar atendimento';
    b.append(schedule,cancel);
  }
  function buildTimeOptions(selected){
    const out=[];for(let m=0;m<=1439;m+=30){const t=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;out.push(`<option value="${t}"${t===selected?' selected':''}>${t}</option>`);}return out.join('');
  }
  function openReschedule(){
    const ctx=resolveContext();if(!ctx){notice('Não foi possível localizar a solicitação S.O.S.');return;}
    let modal=document.getElementById('sosRescheduleModal');
    if(!modal){
      modal=document.createElement('div');modal.id='sosRescheduleModal';modal.className='modal';modal.setAttribute('aria-hidden','true');
      modal.innerHTML='<div class="modal-backdrop" data-bm-sos-close></div><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="sosRescheduleTitle"><button class="modal-close" type="button" aria-label="Fechar" data-bm-sos-close>×</button><div class="eyebrow">S.O.S. PROFISSIONAIS</div><h2 id="sosRescheduleTitle">Alterar horário</h2><p class="modal-intro" id="sosRescheduleInfo"></p><div class="field"><label for="sosRescheduleTime">Novo horário</label><select id="sosRescheduleTime"></select></div><div class="modal-actions"><button class="secondary" type="button" data-bm-sos-close>Cancelar</button><button class="primary compact" type="button" id="sosRescheduleSave">Salvar horário</button></div></section></div>';
      document.body.appendChild(modal);
    }
    const current=ctx.appointment?.time||ctx.opportunity.time||'08:00';
    document.getElementById('sosRescheduleTime').innerHTML=buildTimeOptions(current);
    document.getElementById('sosRescheduleInfo').textContent=`${ctx.opportunity.client||'Cliente'} · ${ctx.opportunity.specialty||'Especialidade'}${ctx.appointment?.professional?` · ${ctx.appointment.professional}`:''}`;
    modal.dataset.sosId=ctx.opportunity.id;modal.dataset.appointmentId=ctx.appointment?.id||'';open('sosRescheduleModal');
  }
  function saveReschedule(){
    const modal=document.getElementById('sosRescheduleModal'),id=modal?.dataset?.sosId,time=document.getElementById('sosRescheduleTime')?.value;
    if(!id||!time){notice('Não foi possível identificar o horário.');return;}
    const state=read(),op=(state.opportunities||[]).find(o=>o&&o.id===id),appointmentId=modal.dataset.appointmentId,appointment=appointmentId?(state.appointments||[]).find(a=>a&&a.id===appointmentId):null;
    if(!op){notice('Solicitação S.O.S. não encontrada.');return;}
    const start=time.split(':').map(Number),startMin=start[0]*60+start[1];
    if(appointment){
      const duration=Math.max(30,Number(appointment.duration)||30),conflict=(state.appointments||[]).some(a=>a&&a.id!==appointment.id&&a.status!=='cancelado'&&a.date===appointment.date&&a.professional===appointment.professional&&(()=>{const p=String(a.time||'00:00').split(':').map(Number),s=p[0]*60+p[1],d=Math.max(30,Number(a.duration)||30);return startMin<s+d&&s<startMin+duration;})());
      if(conflict){notice(`${appointment.professional||'Profissional'} já possui atendimento nesse horário.`);return;}
      appointment.time=time;const end=startMin+duration;appointment.endTime=`${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`;
    }
    op.time=time;
    const duration=Number(op.durationSnapshot)||Number(op.duration)||30,endMin=startMin+duration;op.endTime=`${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`;
    write(state);close('sosRescheduleModal');notice('Horário alterado com sucesso.');setTimeout(()=>location.reload(),120);
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
      const save=e.target.closest?.('#sosRescheduleSave');
      if(save){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveReschedule();return;}
      const closeBtn=e.target.closest?.('[data-bm-sos-close]');
      if(closeBtn){e.preventDefault();e.stopPropagation();close('sosRescheduleModal');return;}
      const cell=e.target.closest?.('#agendaGrid [data-sos-id]');
      if(cell){window.__bmCurrentSosId=cell.dataset.sosId||null;window.__bmCurrentAppointmentId=cell.dataset.appointmentId||null;return;}
      const btn=e.target.closest?.('#detailsActions button');if(!btn)return;
      const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(text!=='alterar horário'&&text!=='cancelar atendimento')return;
      if(!resolveContext())return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(text==='alterar horário')openReschedule();else cancelAppointment();
    },true);
    const observer=new MutationObserver(normalizeButtons);observer.observe(document.getElementById('detailsActions')||document.body,{childList:true,subtree:true});
    normalizeButtons();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
