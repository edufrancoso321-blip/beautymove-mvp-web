/* BeautyMove — ações essenciais do atendimento + S.O.S. vinculado ao atendimento */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const SPECIALTY={Ana:'Cabelos',Bruna:'Cabelos',Paula:'Mãos e Pés',Carla:'Estética'};
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return {appointments:[],opportunities:[],transactions:[]};}};
  const save=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const closeDetails=()=>{const m=document.getElementById('detailsModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};
  const notice=msg=>{const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmDetailNotice);window.__bmDetailNotice=setTimeout(()=>n.hidden=true,3500);};
  const currentId=()=>window.__bmCurrentAppointmentId||document.getElementById('detailsActions')?.dataset?.appointmentId||null;
  const current=()=>{const id=currentId();return id?read().appointments.find(a=>a.id===id)||null:null;};

  function refreshSosMetric(){
    const el=document.getElementById('metricSos');if(!el)return;
    const date=document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
    const s=read(),items=Array.isArray(s.opportunities)?s.opportunities:[];
    const active=items.filter(o=>o&&o.date===date&&o.source==='sos'&&o.status!=='resolved'&&o.status!=='cancelado'&&o.status!=='cancelada'&&!o.acceptedBy);
    el.textContent=String(active.length);
  }

  function refreshSosGrid(){
    const grid=document.querySelector('#agendaGrid .agenda-grid');if(!grid)return;
    const date=document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
    const state=read(),appointments=Array.isArray(state.appointments)?state.appointments:[],opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const tracked=appointments.find(a=>a&&a.date===date&&a.sosAcceptedBy&&a.status!=='cancelado');
    grid.querySelectorAll('tbody tr').forEach(row=>{
      const time=row.querySelector('.time-col')?.textContent?.trim();
      const cell=row.querySelector('[data-sos-cell],.sos-free-cell,.sos-cell');
      if(!cell)return;
      if(tracked&&time===tracked.time){
        const opportunity=opportunities.find(o=>o&&o.appointmentId===tracked.id&&o.source==='sos'&&o.status==='resolved'&&o.acceptedBy)||opportunities.find(o=>o&&o.appointmentId===tracked.id&&o.source==='sos'&&o.acceptedBy);
        if(!opportunity)return;
        cell.outerHTML=`<td data-agenda-cell data-time="${time}" data-sos-id="${opportunity.id}" class="sos-cell"><strong>${String(tracked.client||'Cliente').replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]))}</strong><span>${String(tracked.service||'Atendimento').replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]))}</span><small>Acompanhando · ${String(tracked.sosAcceptedBy).replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]))}</small></td>`;
      }
    });
  }

  function classifyButtons(box){
    box.querySelectorAll('button').forEach(btn=>{
      const text=(btn.textContent||'').trim().toLowerCase();
      if(text.includes('registrar chegada')||text.includes('iniciar atendimento'))btn.dataset.detailAction='arrived';
      else if(text.includes('finalizar atendimento'))btn.dataset.detailAction='finish';
      else if(text.includes('alterar horário'))btn.dataset.detailAction='schedule';
      else if(text.includes('incluir / remover serviços'))btn.dataset.detailAction='services';
      else if(text.includes('cancelar atendimento'))btn.dataset.detailAction='cancel';
      else if(text==='alterar profissional')btn.dataset.detailAction='professional';
      else if(text==='financeiro')btn.dataset.detailAction='finance';
    });
  }

  function ensureSosButton(){
    const box=document.getElementById('detailsActions');if(!box)return;
    if(box.dataset.sosId)return;
    classifyButtons(box);
    box.querySelector('[data-detail-action="professional"]')?.remove();
    box.querySelector('[data-detail-action="finance"]')?.remove();
    const start=box.querySelector('[data-detail-action="arrived"]');
    if(start){start.classList.add('action-start');if(start.textContent.trim()!=='Iniciar atendimento')start.textContent='Iniciar atendimento';}
    if(!box.querySelector('[data-detail-action="sos"]')){
      const b=document.createElement('button');b.type='button';b.className='action-button action-sos';b.dataset.detailAction='sos';b.textContent='S.O.S.';box.appendChild(b);
    }
    const a=current();
    if(a?.status==='em_andamento'||a?.status==='chegou'){if(start)start.hidden=true;}
    else if(a?.status==='finalizado'||a?.status==='concluido'){
      if(start)start.hidden=true;
      const finish=box.querySelector('[data-detail-action="finish"]');if(finish)finish.hidden=true;
    }
  }

  /* A janela S.O.S. é controlada exclusivamente por agenda-sos-actions-final.js. */
  function ensureSosDetailActions(){return;}

  function openAppointmentEditor(appointment){
    const modal=document.getElementById('appointmentModal');if(!modal)return;
    const id=document.getElementById('appointmentId');const client=document.getElementById('appointmentClient');const professional=document.getElementById('appointmentProfessional');const time=document.getElementById('appointmentTime');const status=document.getElementById('appointmentStatus');const statusField=document.getElementById('appointmentStatusField');const mode=document.getElementById('appointmentMode');const title=document.getElementById('appointmentTitle');
    if(id)id.value=appointment.id;if(client)client.value=appointment.client||'';if(professional)professional.value=appointment.professional||'Ana';if(time&&appointment.time)time.value=appointment.time;if(status)status.value=appointment.status||'agendado';if(statusField)statusField.style.display='flex';if(mode)mode.textContent='ALTERAR HORÁRIO';if(title)title.textContent='Alterar horário';modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');client?.focus();
  }
  function setStatus(status,id=currentId()){
    if(!id)return;const s=read(),a=s.appointments.find(x=>x.id===id);if(!a)return;if(status==='em_andamento')a.arrivedAt=new Date().toISOString();if(status==='finalizado')a.finishedAt=new Date().toISOString();a.status=status;save(s);closeDetails();location.reload();
  }
  function cancelAppointment(id){const s=read(),a=s.appointments.find(x=>x.id===id);if(!a)return;a.status='cancelado';save(s);closeDetails();location.reload();}
  function triggerSos(){const id=currentId();if(!id)return;const s=read(),a=s.appointments.find(x=>x.id===id);if(!a)return;s.opportunities=Array.isArray(s.opportunities)?s.opportunities:[];const active=s.opportunities.some(o=>o.source==='sos'&&o.appointmentId===a.id&&!['resolved','cancelado','cancelada'].includes(o.status));if(active){notice('Este atendimento já possui uma oportunidade S.O.S. ativa.');closeDetails();return;}const service=a.service||(Array.isArray(a.services)?a.services.map(x=>x.name).join(' + '):'Atendimento');s.opportunities.push({id:'sos-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),appointmentId:a.id,date:a.date,time:a.time,client:a.client||'Cliente',service,specialty:SPECIALTY[a.professional]||'Cabelos',professional:a.professional||'',source:'sos',kind:'manual',status:'searching',radius:'5 km',acceptedBy:'',createdAt:new Date().toISOString()});save(s);closeDetails();location.reload();}

  function intercept(e){
    /* Nunca interceptar a janela S.O.S. aqui. */
    if(document.getElementById('detailsActions')?.dataset?.sosId)return;
    const btn=e.target.closest?.('#detailsActions [data-detail-action]');if(!btn)return;
    const action=btn.dataset.detailAction;if(!['professional','finance','arrived','finish','sos'].includes(action))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(action==='arrived')setStatus('em_andamento');else if(action==='finish')setStatus('finalizado');else if(action==='sos')triggerSos();
  }
  function boot(){
    const actions=document.getElementById('detailsActions');
    document.addEventListener('click',e=>{const cell=e.target.closest?.('#agendaGrid [data-appointment-id]');if(cell)window.__bmCurrentAppointmentId=cell.dataset.appointmentId||null;},true);
    refreshSosMetric();refreshSosGrid();setInterval(()=>{refreshSosMetric();refreshSosGrid();},700);
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(()=>{refreshSosMetric();refreshSosGrid();},100));document.getElementById('prevDay')?.addEventListener('click',()=>setTimeout(()=>{refreshSosMetric();refreshSosGrid();},180));document.getElementById('nextDay')?.addEventListener('click',()=>setTimeout(()=>{refreshSosMetric();refreshSosGrid();},180));document.getElementById('todayBtn')?.addEventListener('click',()=>setTimeout(()=>{refreshSosMetric();refreshSosGrid();},180));window.addEventListener('beautymove:sos-accepted',()=>setTimeout(()=>{refreshSosMetric();refreshSosGrid();},50));
    if(!actions)return;actions.addEventListener('click',intercept,true);let normalizing=false;const normalize=()=>{if(normalizing)return;normalizing=true;try{if(actions.dataset.sosId)ensureSosDetailActions();else ensureSosButton();const a=current();if(a&&!actions.dataset.sosId)actions.dataset.appointmentId=a.id;}finally{normalizing=false;}};const modal=document.getElementById('detailsModal')||document.body;const ob=new MutationObserver(()=>normalize());ob.observe(modal,{childList:true,subtree:true});normalize();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300),{once:true});else setTimeout(boot,300);
})();
