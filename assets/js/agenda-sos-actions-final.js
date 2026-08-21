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
    if(!id){notice('Não foi possível identificar esta solicitação S.O.S.');return;}
    const state=read();
    const opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const index=opportunities.findIndex(o=>o&&String(o.id)===String(id)&&o.source==='sos');
    if(index<0){notice('Não foi possível localizar esta solicitação S.O.S.');return;}
    opportunities[index]={...opportunities[index],status:'cancelado',cancelledAt:new Date().toISOString(),cancelledReason:'Cancelado pelo salão'};
    state.opportunities=opportunities;
    write(state);
    closeDetails();
    notice('S.O.S. cancelado. Nenhum atendimento da Agenda foi alterado.');
    setTimeout(()=>window.location.reload(),80);
  }

  function interceptClick(event){
    const sosCell=event.target.closest?.('#agendaGrid [data-sos-id]');
    if(sosCell){const id=sosCell.dataset.sosId;if(id){window.__bmCurrentSosId=String(id);window.__bmCurrentAppointmentId=null;}return;}
    const cancelButton=event.target.closest?.('#detailsActions [data-sos-action="cancel"], #detailsActions .action-cancel');
    if(!cancelButton)return;
    const actions=document.getElementById('detailsActions');
    const id=actions?.dataset?.sosId||window.__bmCurrentSosId;
    if(!id)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();cancelSosOnly(String(id));
  }

  function boot(){if(document.body?.dataset.role!=='salao')return;document.addEventListener('click',interceptClick,true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* BeautyMove — correção complementar do S.O.S.: duração real, atualização imediata e padrão visual. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const DURATIONS={'Corte':60,'Escova':30,'Coloração':120,'Luzes':180,'Corte feminino':60,'Corte masculino':45,'Manicure':60,'Pedicure':60,'Limpeza de pele':75,'Design de sobrancelhas':45};
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const mins=t=>{const p=String(t||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const label=m=>{m=Number(m)||0;const h=Math.floor(m/60),r=m%60;return h?(r?`${h}h ${r}min`:`${h}h`):`${r}min`;};
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  function services(o){
    const list=Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:Array.isArray(o?.services)?o.services:[];
    if(list.length)return list.map(s=>({id:s.id,name:s.name,duration:Number(s.duration||s.durationMinutes||0)||DURATIONS[String(s.name||'').trim()]||30,clientPrice:Number(s.clientPrice||s.value||0)}));
    return String(o?.service||'').split('+').map(x=>x.trim()).filter(Boolean).map(name=>({name,duration:DURATIONS[name]||30,clientPrice:0}));
  }
  function duration(o){const total=services(o).reduce((n,s)=>n+Number(s.duration||0),0);return total||Number(o?.durationSnapshot||o?.durationMinutes||o?.duration)||30;}
  function sync(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    const date=document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10),state=read();
    const accepted=(state.appointments||[]).filter(a=>a&&a.date===date&&a.source==='sos'&&a.sosAcceptedBy&&a.status!=='cancelado');
    accepted.forEach(a=>{const d=duration(a);a.duration=d;a.durationMinutes=d;a.endTime=time(mins(a.time)+d);});
    const cells=[...grid.querySelectorAll('td[data-sos-cell="true"],td.sos-cell[data-sos-id]')];
    if(!cells.length)return;
    cells.forEach(c=>{c.className='sos-free-cell';c.removeAttribute('data-sos-id');c.removeAttribute('data-appointment-id');c.innerHTML='Livre';});
    accepted.forEach(a=>{const start=mins(a.time),end=start+Math.max(30,Number(a.duration)||30);cells.forEach(c=>{const m=mins(c.dataset.time);if(m<start||m>=end)return;const first=m===start;c.className=`sos-cell sos-cell-found bm-sos-reserved ${first?'sos-cell-start':'sos-cell-continuation'}`;c.dataset.sosId=a.sosOpportunityId||'';c.dataset.appointmentId=a.id;c.innerHTML=first?`<strong>${esc(a.client||'Cliente')}</strong><span>${esc(a.service||'Atendimento')}</span><small>${esc(a.time)} – ${esc(a.endTime)} · ${label(a.duration)}</small><div class="sos-found-status">✓ ${esc(a.sosAcceptedBy)} · reservado</div>`:`<span class="sos-cell-continued-time">Até ${esc(a.endTime)}</span>`;});});
    write(state);
  }
  function style(){if(document.getElementById('bmSosStandardStyle'))return;const s=document.createElement('style');s.id='bmSosStandardStyle';s.textContent=`#agendaGrid .sos-cell-start strong{font-size:15px!important;font-weight:900!important}#agendaGrid .sos-found-status{font-size:12px!important;font-weight:900!important;margin-top:4px!important}#sosOpportunityPanel .sos-op-selected-candidate .sos-op-candidate-name{font-size:15px!important;font-weight:900!important;line-height:1.25!important}#sosOpportunityPanel .sos-op-selected-candidate .sos-op-candidate-data{font-size:11px!important}#detailsContent .detail-topline>div:nth-child(2)>strong{font-size:16px!important;font-weight:900!important}`;document.head.appendChild(s);}
  function boot(){style();window.addEventListener('beautymove:sos-accepted',()=>{setTimeout(sync,60);setTimeout(sync,250);});setInterval(()=>{const modal=document.getElementById('detailsModal');if(modal?.classList.contains('is-open')){const actions=document.getElementById('detailsActions');if(actions?.dataset.sosId&&!actions.querySelector('.bm-sos-reschedule')){const b=document.createElement('button');b.type='button';b.className='action-button bm-sos-reschedule';b.textContent='Alterar horário';b.onclick=()=>{const state=read(),op=state.opportunities.find(o=>String(o.id)===String(actions.dataset.sosId)),a=op?.appointmentId?state.appointments.find(x=>x.id===op.appointmentId):null;if(!a)return;document.getElementById('detailsModal').classList.remove('is-open');const m=document.getElementById('appointmentModal');document.getElementById('appointmentId').value=a.id;document.getElementById('appointmentTime').value=a.time;document.getElementById('appointmentProfessional').value=a.professional;document.getElementById('appointmentClient').value=a.client||'';document.getElementById('appointmentTitle').textContent='Alterar horário';document.getElementById('appointmentMode').textContent='ALTERAR HORÁRIO';m.classList.add('is-open');};actions.insertBefore(b,actions.querySelector('.action-cancel'));}}},700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
