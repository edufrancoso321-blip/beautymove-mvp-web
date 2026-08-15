(function () {
  if (document.body?.dataset?.role !== 'salao') return;

  const STATE_KEY = 'beautymove.mvp.state';
  const SERVICES_KEY = 'beautymove.mvp.services';
  const PROFESSIONALS_KEY = 'beautymove.mvp.professionals';
  const SOS_CONTEXT_KEY = 'beautymove.mvp.sosContext';
  const DEFAULT_SERVICES = [
    { id:'svc-corte', name:'Corte', category:'Cabelos', value:80, status:'ativo' },
    { id:'svc-coloracao', name:'Coloração', category:'Cabelos', value:150, status:'ativo' },
    { id:'svc-manicure', name:'Manicure', category:'Mãos e Pés', value:55, status:'ativo' },
    { id:'svc-pedicure', name:'Pedicure', category:'Mãos e Pés', value:60, status:'ativo' },
    { id:'svc-limpeza-pele', name:'Limpeza de pele', category:'Estética', value:120, status:'ativo' }
  ];
  const DEFAULT_PROFESSIONALS = [
    { name:'Ana', specialty:'Cabelos' }, { name:'Bruna', specialty:'Cabelos' },
    { name:'Paula', specialty:'Mãos e Pés' }, { name:'Carla', specialty:'Estética' }
  ];
  const TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
  const esc = value => String(value ?? '').replace(/[&<>\'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const getState = () => ({appointments:[], opportunities:[], transactions:[], ...read(STATE_KEY,{})});
  const saveState = state => write(STATE_KEY,state);
  const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const dateKey = date => { const d=date||new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  let agendaDate = new Date();

  function getServices(){ const saved=read(SERVICES_KEY,null); if(Array.isArray(saved)&&saved.length)return saved; write(SERVICES_KEY,DEFAULT_SERVICES); return [...DEFAULT_SERVICES]; }
  function getProfessionals(){ const saved=read(PROFESSIONALS_KEY,null); return Array.isArray(saved)&&saved.length?saved:[...DEFAULT_PROFESSIONALS]; }
  function open(id){ const el=document.querySelector(id); if(el){el.classList.add('is-open');el.setAttribute('aria-hidden','false');} }
  function close(id){ const el=document.querySelector(id); if(el){el.classList.remove('is-open');el.setAttribute('aria-hidden','true');} }

  function renderGrid(){
    const body=document.querySelector('#agendaBody'); if(!body)return;
    const names=getProfessionals().map(p=>p.name).slice(0,4);
    while(names.length<4) names.push(DEFAULT_PROFESSIONALS[names.length].name);
    body.innerHTML=TIMES.map(time=>`<tr><th class="time-col">${time}</th>${names.map(name=>`<td data-slot="${time}-${esc(name)}">Livre</td>`).join('')}</tr>`).join('');
    const header=document.querySelector('.agenda-grid thead tr');
    if(header) header.innerHTML='<th class="time-col">Horário</th>'+names.map(name=>{const p=getProfessionals().find(x=>x.name===name)||{};return `<th><span class="specialty-label">${esc(p.specialty||'Beleza')}</span><span class="professional-name">${esc(name)}</span></th>`}).join('');
    document.querySelector('#agendaDate').textContent = dateKey(agendaDate) === dateKey(new Date()) ? 'Hoje' : agendaDate.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
    bindCells();
    renderAppointments();
  }

  function renderAppointments(){
    const state=getState(); const current=dateKey(agendaDate);
    document.querySelectorAll('[data-slot]').forEach(cell=>{
      cell.classList.remove('appointment'); cell.innerHTML='Livre';
      const [time,...rest]=cell.dataset.slot.split('-'); const professional=rest.join('-');
      const appointment=state.appointments.find(a=>a.date===current&&a.time===time&&a.professional===professional&&a.status!=='cancelado');
      if(appointment){cell.classList.add('appointment');cell.innerHTML=`<strong>${esc(appointment.client)}</strong><span>${esc(appointment.service)}</span>`;}
    });
    const today=state.appointments.filter(a=>a.date===current&&a.status!=='cancelado');
    const free=document.querySelector('#freeCount'); const pending=document.querySelector('#pendingCount');
    if(free)free.textContent=`${document.querySelectorAll('[data-slot]:not(.appointment)').length} horários livres`;
    if(pending)pending.textContent=`${today.length} atendimentos`;
    const sos=document.querySelector('#sosCount'); if(sos)sos.textContent=`${state.opportunities.filter(o=>o.status==='aberta').length} solicitações`;
  }

  function populateServices(){
    const select=document.querySelector('#serviceName'); const value=document.querySelector('#serviceValue'); if(!select||!value)return;
    const services=getServices().filter(s=>s.status!=='inativo');
    select.innerHTML='<option value="">Selecione o serviço</option>'+services.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} — ${money(s.value)}</option>`).join('');
    select.onchange=()=>{const s=services.find(x=>x.id===select.value);value.value=s?Number(s.value).toFixed(2).replace('.',','):'';};
  }

  function openNew(time, professional){
    populateServices();
    const timeField=document.querySelector('#appointmentTime');
    timeField.innerHTML=TIMES.map(t=>`<option value="${t}" ${t===time?'selected':''}>${t}</option>`).join('');
    const prof=document.querySelector('#professionalName'); const list=getProfessionals();
    prof.innerHTML=list.map(p=>`<option value="${esc(p.name)}" ${p.name===professional?'selected':''}>${esc(p.name)}</option>`).join('');
    document.querySelector('#clientName').value=''; document.querySelector('#serviceValue').value='';
    open('#appointmentModal'); setTimeout(()=>document.querySelector('#clientName')?.focus(),50);
  }

  function bindCells(){
    document.querySelectorAll('[data-slot]').forEach(cell=>cell.onclick=()=>{
      const [time,...rest]=cell.dataset.slot.split('-'); const professional=rest.join('-');
      const appointment=getState().appointments.find(a=>a.date===dateKey(agendaDate)&&a.time===time&&a.professional===professional&&a.status!=='cancelado');
      if(appointment) showDetail(appointment); else openNew(time,professional);
    });
  }

  function showDetail(a){
    const labels={agendado:'Agendado',confirmado:'Confirmado',em_atendimento:'Em atendimento',concluido:'Finalizado',cancelado:'Cancelado'};
    let actions='';
    if(['agendado','confirmado'].includes(a.status)) actions='<button class="secondary compact" data-op="cancel">Cancelar</button><button class="secondary compact" data-op="sos">Acionar S.O.S.</button><button class="primary compact" data-op="start">Iniciar atendimento</button>';
    else if(a.status==='em_atendimento') actions='<button class="primary compact" data-op="finish">Finalizar atendimento</button>';
    else if(a.status==='concluido') actions='<button class="primary compact" data-op="finance">Abrir financeiro</button>';
    const body=document.querySelector('#appointmentDetailBody');
    body.innerHTML=`<div class="operation-detail"><div class="operation-summary"><span class="eyebrow">ATENDIMENTO</span><h2>${esc(a.client)}</h2><p>${esc(a.service)} · ${esc(a.professional)} · ${esc(a.time)}</p><span class="status">${esc(labels[a.status]||a.status)}</span></div><div class="operation-info"><div><small>Profissional</small><strong>${esc(a.professional)}</strong></div><div><small>Serviço</small><strong>${esc(a.service)}</strong></div><div><small>Valor</small><strong>${money(a.value)}</strong></div></div><div class="operation-actions">${actions}</div></div>`;
    body.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>operation(b.dataset.op,a.id));
    open('#appointmentDetailModal');
  }

  function operation(action,id){
    const state=getState(); const a=state.appointments.find(x=>x.id===id); if(!a)return;
    if(action==='cancel'){a.status='cancelado';saveState(state);close('#appointmentDetailModal');renderAppointments();return;}
    if(action==='start'){a.status='em_atendimento';a.startedAt=new Date().toISOString();saveState(state);showDetail(a);renderAppointments();return;}
    if(action==='finish'){a.status='concluido';a.finishedAt=new Date().toISOString();saveState(state);close('#appointmentDetailModal');openFinance(a);renderAppointments();return;}
    if(action==='finance'){close('#appointmentDetailModal');openFinance(a);return;}
    if(action==='sos'){write(SOS_CONTEXT_KEY,{appointmentId:id,client:a.client,service:a.service,serviceId:a.serviceId||null,value:Number(a.value||0),date:a.date,time:a.time,professional:a.professional});window.location.href='sos.html?origem=agenda';}
  }

  function openFinance(a){
    const body=document.querySelector('#financeBody'); body.innerHTML=`<div class="operation-detail"><div class="operation-summary"><span class="eyebrow">FECHAMENTO FINANCEIRO</span><h2>${esc(a.client)}</h2><p>${esc(a.service)} · ${esc(a.professional)}</p></div><div class="finance-grid"><div><small>Serviço</small><strong>${esc(a.service)}</strong></div><div><small>Valor registrado</small><strong>${money(a.value)}</strong></div></div><div class="field"><label for="financePaymentStatus">Status financeiro</label><select id="financePaymentStatus"><option value="pendente">Pendente</option><option value="recebido">Recebido</option></select></div><div class="form-actions"><button class="secondary" type="button" data-close-operation-modal>Fechar</button><button class="primary" type="button" id="saveFinanceBtn">Salvar fechamento</button></div></div>`;
    body.querySelector('#saveFinanceBtn').onclick=()=>{const s=getState();const item=s.appointments.find(x=>x.id===a.id);const status=body.querySelector('#financePaymentStatus').value;if(item)item.financeStatus=status;const tx=s.transactions.find(x=>x.appointmentId===a.id);if(tx){tx.value=Number(a.value||0);tx.status=status;}else s.transactions.push({id:makeId('txn'),appointmentId:a.id,type:'receita',value:Number(a.value||0),status});saveState(s);close('#financeModal');};
    open('#financeModal');
  }

  function bindForm(){
    const form=document.querySelector('#appointmentForm'); if(form)form.onsubmit=e=>{e.preventDefault();e.stopPropagation();const data=Object.fromEntries(new FormData(form).entries());const service=getServices().find(s=>s.id===data.serviceName);if(!service)return;const state=getState();state.appointments.push({id:makeId('apt'),date:dateKey(agendaDate),time:data.appointmentTime,professional:data.professionalName,client:data.clientName.trim(),service:service.name,serviceId:service.id,value:Number(service.value),status:'agendado',source:'salao'});saveState(state);close('#appointmentModal');renderAppointments();};
  }

  function bindProfessional(){
    document.querySelector('#addProfessionalBtn')?.addEventListener('click',()=>open('#professionalModal'));
    document.querySelector('#professionalForm')?.addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());const list=getProfessionals();if(d.name&&!list.some(p=>p.name.toLowerCase()===d.name.trim().toLowerCase())){list.push({name:d.name.trim(),specialty:d.specialty});write(PROFESSIONALS_KEY,list);}close('#professionalModal');e.target.reset();renderGrid();});
  }

  function bindNavigation(){
    document.querySelector('#newAppointmentBtn')?.addEventListener('click',()=>openNew());
    document.querySelector('#quickAppointmentBtn')?.addEventListener('click',()=>openNew());
    document.querySelector('#prevDay')?.addEventListener('click',()=>{agendaDate.setDate(agendaDate.getDate()-1);renderGrid();});
    document.querySelector('#nextDay')?.addEventListener('click',()=>{agendaDate.setDate(agendaDate.getDate()+1);renderGrid();});
    document.querySelector('#todayBtn')?.addEventListener('click',()=>{agendaDate=new Date();renderGrid();});
    document.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=()=>close('#appointmentModal'));
    document.querySelectorAll('[data-close-operation-modal]').forEach(b=>b.onclick=()=>{close('#appointmentDetailModal');close('#financeModal');close('#professionalModal');});
  }

  populateServices(); bindNavigation(); bindForm(); bindProfessional(); renderGrid();
})();