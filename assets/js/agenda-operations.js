(function () {
  if (document.body?.dataset?.role !== 'salao') return;

  const STATE_KEY = 'beautymove.mvp.state';
  const SERVICES_KEY = 'beautymove.mvp.services';
  const PROFESSIONALS_KEY = 'beautymove.mvp.professionals';
  const SOS_CONTEXT_KEY = 'beautymove.mvp.sosContext';

  const DEFAULT_SERVICES = [
    { id:'svc-corte-feminino', name:'Corte feminino', category:'Cabelos', value:80, status:'ativo' },
    { id:'svc-corte-masculino', name:'Corte masculino', category:'Cabelos', value:50, status:'ativo' },
    { id:'svc-escova', name:'Escova', category:'Cabelos', value:60, status:'ativo' },
    { id:'svc-hidratacao', name:'Hidratação', category:'Cabelos', value:70, status:'ativo' },
    { id:'svc-coloracao', name:'Coloração', category:'Cabelos', value:150, status:'ativo' },
    { id:'svc-luzes', name:'Luzes', category:'Cabelos', value:220, status:'ativo' },
    { id:'svc-maos', name:'Mãos', category:'Mãos e Pés', value:40, status:'ativo' },
    { id:'svc-pes', name:'Pés', category:'Mãos e Pés', value:45, status:'ativo' },
    { id:'svc-maos-pes', name:'Mãos e pés', category:'Mãos e Pés', value:80, status:'ativo' },
    { id:'svc-esmaltacao', name:'Esmaltação', category:'Mãos e Pés', value:35, status:'ativo' },
    { id:'svc-limpeza-pele', name:'Limpeza de pele', category:'Estética', value:120, status:'ativo' },
    { id:'svc-design-facial', name:'Design facial', category:'Estética', value:70, status:'ativo' },
    { id:'svc-virilha', name:'Virilha', category:'Depilação', value:55, status:'ativo' },
    { id:'svc-axila', name:'Axila', category:'Depilação', value:35, status:'ativo' },
    { id:'svc-buco', name:'Buço', category:'Depilação', value:25, status:'ativo' },
    { id:'svc-pernas', name:'Pernas', category:'Depilação', value:70, status:'ativo' },
    { id:'svc-design-sobrancelhas', name:'Design de sobrancelhas', category:'Sobrancelhas', value:45, status:'ativo' },
    { id:'svc-henna', name:'Design com henna', category:'Sobrancelhas', value:60, status:'ativo' }
  ];

  const DEFAULT_PROFESSIONALS = [
    { name:'Ana', specialty:'Cabelos' }, { name:'Bruna', specialty:'Cabelos' },
    { name:'Paula', specialty:'Mãos e Pés' }, { name:'Carla', specialty:'Estética' }
  ];
  const TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
  const esc = value => String(value ?? '').replace(/[&<>\'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const getState = () => ({appointments:[], opportunities:[], transactions:[], ...read(STATE_KEY,{})});
  const saveState = state => write(STATE_KEY,state);
  const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const dateKey = date => { const d=date||new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  let agendaDate = new Date();

  function getServices(){
    const saved=read(SERVICES_KEY,null);
    if(!Array.isArray(saved)||!saved.length){ write(SERVICES_KEY,DEFAULT_SERVICES); return [...DEFAULT_SERVICES]; }
    const byId=new Map(saved.map(s=>[s.id,s]));
    DEFAULT_SERVICES.forEach(service=>{ if(!byId.has(service.id)) byId.set(service.id,{...service}); });
    const merged=[...byId.values()];
    if(merged.length!==saved.length) write(SERVICES_KEY,merged);
    return merged;
  }
  function getProfessionals(){ const saved=read(PROFESSIONALS_KEY,null); return Array.isArray(saved)&&saved.length?saved:[...DEFAULT_PROFESSIONALS]; }
  function getProfessional(name){ return getProfessionals().find(p=>p.name===name)||{}; }
  function servicesForProfessional(name){
    const specialty=getProfessional(name).specialty;
    const services=getServices().filter(s=>s.status!=='inativo');
    return specialty ? services.filter(s=>s.category===specialty) : services;
  }
  function appointmentServices(a){
    if(Array.isArray(a.services)&&a.services.length) return a.services;
    if(a.serviceId){ const s=getServices().find(x=>x.id===a.serviceId); if(s)return [{id:s.id,name:s.name,value:Number(a.value||s.value),category:s.category}]; }
    return a.service ? [{id:a.serviceId||'',name:a.service,value:Number(a.value||0),category:''}] : [];
  }
  function open(id){ const el=document.querySelector(id); if(el){el.classList.add('is-open');el.setAttribute('aria-hidden','false');} }
  function close(id){ const el=document.querySelector(id); if(el){el.classList.remove('is-open');el.setAttribute('aria-hidden','true');} }

  function renderGrid(){
    const body=document.querySelector('#agendaBody'); if(!body)return;
    const names=getProfessionals().map(p=>p.name).slice(0,4);
    while(names.length<4) names.push(DEFAULT_PROFESSIONALS[names.length].name);
    body.innerHTML=TIMES.map(time=>`<tr><th class="time-col">${time}</th>${names.map(name=>`<td data-slot="${time}-${esc(name)}">Livre</td>`).join('')}</tr>`).join('');
    const header=document.querySelector('.agenda-grid thead tr');
    if(header) header.innerHTML='<th class="time-col">Horário</th>'+names.map(name=>{const p=getProfessional(name);return `<th><span class="specialty-label">${esc(p.specialty||'Beleza')}</span><span class="professional-name">${esc(name)}</span></th>`}).join('');
    document.querySelector('#agendaDate').textContent = dateKey(agendaDate) === dateKey(new Date()) ? 'Hoje' : agendaDate.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
    bindCells(); renderAppointments();
  }

  function renderAppointments(){
    const state=getState(); const current=dateKey(agendaDate);
    document.querySelectorAll('[data-slot]').forEach(cell=>{
      cell.classList.remove('appointment'); cell.innerHTML='Livre';
      const [time,...rest]=cell.dataset.slot.split('-'); const professional=rest.join('-');
      const appointment=state.appointments.find(a=>a.date===current&&a.time===time&&a.professional===professional&&a.status!=='cancelado');
      if(appointment){
        const services=appointmentServices(appointment);
        cell.classList.add('appointment');
        cell.innerHTML=`<strong>${esc(appointment.client)}</strong><span>${esc(services.map(s=>s.name).join(' + '))}</span>`;
      }
    });
    const today=state.appointments.filter(a=>a.date===current&&a.status!=='cancelado');
    const free=document.querySelector('#freeCount'); const pending=document.querySelector('#pendingCount');
    if(free)free.textContent=`${document.querySelectorAll('[data-slot]:not(.appointment)').length} horários livres`;
    if(pending)pending.textContent=`${today.length} atendimentos`;
    const sos=document.querySelector('#sosCount'); if(sos)sos.textContent=`${state.opportunities.filter(o=>o.status==='aberta').length} solicitações`;
  }

  function renderServicePicker(container, professional, initialIds=[], onChange){
    if(!container)return;
    const services=servicesForProfessional(professional);
    let ids=[...new Set(initialIds)].filter(id=>services.some(s=>s.id===id));
    const selected=()=>services.filter(s=>ids.includes(s.id));
    const total=()=>selected().reduce((sum,s)=>sum+Number(s.value||0),0);
    const label=()=>{
      const items=selected();
      if(!items.length)return 'Selecione os serviços';
      if(items.length===1)return items[0].name;
      return `${items.length} serviços selecionados`;
    };
    container.innerHTML=`<button type="button" class="service-picker-trigger" aria-expanded="false"><span class="service-picker-label">${esc(label())}</span><span class="service-picker-arrow">⌄</span></button><div class="service-picker-menu" hidden>${services.map(s=>`<label class="service-option"><input type="checkbox" value="${esc(s.id)}" ${ids.includes(s.id)?'checked':''}><span>${esc(s.name)}</span><strong>${money(s.value)}</strong></label>`).join('')}</div>`;
    const trigger=container.querySelector('.service-picker-trigger');
    const menu=container.querySelector('.service-picker-menu');
    const sync=()=>{
      container.querySelector('.service-picker-label').textContent=label();
      const value=document.querySelector(container.dataset.valueTarget);
      if(value)value.value=total().toFixed(2).replace('.',',');
      if(onChange)onChange(ids,selected(),total());
    };
    trigger.onclick=()=>{
      const willOpen=menu.hidden;
      document.querySelectorAll('.service-picker-menu').forEach(m=>m.hidden=true);
      document.querySelectorAll('.service-picker-trigger').forEach(b=>b.setAttribute('aria-expanded','false'));
      menu.hidden=!willOpen;
      trigger.setAttribute('aria-expanded',String(willOpen));
    };
    menu.querySelectorAll('input[type="checkbox"]').forEach(input=>input.onchange=()=>{
      if(input.checked) ids.push(input.value); else ids=ids.filter(id=>id!==input.value);
      sync();
    });
    container._getSelected=()=>({ids:[...ids],services:selected(),total:total()});
    sync();
  }

  function populateServices(professional, initialIds=[]){
    const picker=document.querySelector('#servicePicker'); const value=document.querySelector('#serviceValue'); if(!picker||!value)return;
    picker.dataset.valueTarget='#serviceValue';
    renderServicePicker(picker,professional,initialIds);
  }

  function openNew(time, professional){
    const list=getProfessionals();
    const prof=document.querySelector('#professionalName');
    prof.innerHTML=list.map(p=>`<option value="${esc(p.name)}" ${p.name===professional?'selected':''}>${esc(p.name)}</option>`).join('');
    populateServices(prof.value,[]);
    prof.onchange=()=>populateServices(prof.value,[]);
    const timeField=document.querySelector('#appointmentTime');
    timeField.innerHTML=TIMES.map(t=>`<option value="${t}" ${t===time?'selected':''}>${t}</option>`).join('');
    document.querySelector('#clientName').value=''; document.querySelector('#serviceValue').value='';
    open('#appointmentModal'); setTimeout(()=>document.querySelector('#clientName')?.focus(),50);
  }

  function bindCells(){
    document.querySelectorAll('[data-slot]').forEach(cell=>cell.onclick=()=>{
      const [time,...rest]=cell.dataset.slot.split('-'); const professional=rest.join('-');
      const appointment=getState().appointments.find(a=>a.date===dateKey(agendaDate)&&a.time===time&&a.professional===professional&&a.status!=='cancelado');
      if(appointment) showDetail(appointment); else showFreeSlot(time,professional);
    });
  }

  function showFreeSlot(time, professional){
    const body=document.querySelector('#appointmentDetailBody');
    const specialty=getProfessional(professional).specialty||'Serviços';
    body.innerHTML=`<div class="operation-detail"><div class="operation-summary"><span class="eyebrow">HORÁRIO SELECIONADO</span><h2>${esc(time)}</h2><p>${esc(professional)} · ${esc(agendaDate.toLocaleDateString('pt-BR'))}</p><span class="status">Horário livre · ${esc(specialty)}</span></div><div class="operation-info"><div><small>Profissional</small><strong>${esc(professional)}</strong></div><div><small>Data</small><strong>${esc(agendaDate.toLocaleDateString('pt-BR'))}</strong></div><div><small>Horário</small><strong>${esc(time)}</strong></div></div><div class="form-grid compact-form"><div class="field full"><label>Serviços</label><div class="service-picker" id="slotServicePicker" data-value-target="#slotServiceValue"></div></div><div class="field full"><label for="slotServiceValue">Valor total dos serviços (R$)</label><input id="slotServiceValue" readonly aria-readonly="true" placeholder="Selecione os serviços"></div></div><div class="operation-actions"><button class="secondary compact" type="button" data-slot-op="schedule">Agendar cliente</button><button class="sos-subtle compact" type="button" data-slot-op="sos">S.O.S. Profissionais</button></div></div>`;
    const picker=body.querySelector('#slotServicePicker');
    renderServicePicker(picker,professional,[],()=>{});
    body.querySelector('[data-slot-op="sos"]').onclick=()=>{
      const selection=picker._getSelected();
      write(SOS_CONTEXT_KEY,{date:dateKey(agendaDate),time,professional,source:'agenda-slot',serviceIds:selection.ids,services:selection.services.map(s=>({id:s.id,name:s.name,value:Number(s.value),category:s.category})),service:selection.services.map(s=>s.name).join(' + '),value:selection.total});
      window.location.href='sos.html?origem=agenda&horario=selecionado';
    };
    body.querySelector('[data-slot-op="schedule"]').onclick=()=>{close('#appointmentDetailModal');openNew(time,professional);};
    open('#appointmentDetailModal');
  }

  function showDetail(a){
    const labels={agendado:'Agendado',confirmado:'Confirmado',em_atendimento:'Em atendimento',concluido:'Finalizado',cancelado:'Cancelado'};
    const services=appointmentServices(a);
    let actions='';
    if(['agendado','confirmado'].includes(a.status)) actions='<button class="primary compact" data-op="start">Iniciar atendimento</button><button class="secondary compact" data-op="cancel">Cancelar</button><button class="sos-subtle compact" data-op="sos">S.O.S. Profissionais</button>';
    else if(a.status==='em_atendimento') actions='<button class="primary compact" data-op="finish">Finalizar atendimento</button>';
    else if(a.status==='concluido') actions='<button class="primary compact" data-op="finance">Abrir financeiro</button>';
    const body=document.querySelector('#appointmentDetailBody');
    body.innerHTML=`<div class="operation-detail"><div class="operation-summary"><span class="eyebrow">ATENDIMENTO</span><h2>${esc(a.client)}</h2><p>${esc(services.map(s=>s.name).join(' + '))} · ${esc(a.professional)} · ${esc(a.time)}</p><span class="status">${esc(labels[a.status]||a.status)}</span></div><div class="operation-info"><div><small>Profissional</small><strong>${esc(a.professional)}</strong></div><div><small>Serviços</small><strong>${esc(services.map(s=>s.name).join(' + '))}</strong></div><div><small>Valor total</small><strong>${money(a.value)}</strong></div></div><div class="operation-actions">${actions}</div></div>`;
    body.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>operation(b.dataset.op,a.id));
    open('#appointmentDetailModal');
  }

  function operation(action,id){
    const state=getState(); const a=state.appointments.find(x=>x.id===id); if(!a)return;
    if(action==='cancel'){a.status='cancelado';saveState(state);close('#appointmentDetailModal');renderAppointments();return;}
    if(action==='start'){a.status='em_atendimento';a.startedAt=new Date().toISOString();saveState(state);showDetail(a);renderAppointments();return;}
    if(action==='finish'){a.status='concluido';a.finishedAt=new Date().toISOString();saveState(state);close('#appointmentDetailModal');openFinance(a);renderAppointments();return;}
    if(action==='finance'){close('#appointmentDetailModal');openFinance(a);return;}
    if(action==='sos'){const services=appointmentServices(a);write(SOS_CONTEXT_KEY,{appointmentId:id,client:a.client,serviceIds:services.map(s=>s.id),services:services.map(s=>({id:s.id,name:s.name,value:Number(s.value||0),category:s.category})),service:services.map(s=>s.name).join(' + '),value:Number(a.value||0),date:a.date,time:a.time,professional:a.professional,source:'appointment'});window.location.href='sos.html?origem=agenda&atendimento='+encodeURIComponent(id);}
  }

  function openFinance(a){
    const services=appointmentServices(a);
    const body=document.querySelector('#financeBody'); body.innerHTML=`<div class="operation-detail"><div class="operation-summary"><span class="eyebrow">FECHAMENTO FINANCEIRO</span><h2>${esc(a.client)}</h2><p>${esc(services.map(s=>s.name).join(' + '))} · ${esc(a.professional)}</p></div><div class="finance-grid"><div><small>Serviços</small><strong>${esc(services.map(s=>s.name).join(' + '))}</strong></div><div><small>Valor registrado</small><strong>${money(a.value)}</strong></div></div><div class="field"><label for="financePaymentStatus">Status financeiro</label><select id="financePaymentStatus"><option value="pendente">Pendente</option><option value="recebido">Recebido</option></select></div><div class="form-actions"><button class="secondary" type="button" data-close-operation-modal>Fechar</button><button class="primary" type="button" id="saveFinanceBtn">Salvar fechamento</button></div></div>`;
    body.querySelector('#saveFinanceBtn').onclick=()=>{const s=getState();const item=s.appointments.find(x=>x.id===a.id);const status=body.querySelector('#financePaymentStatus').value;if(item)item.financeStatus=status;const tx=s.transactions.find(x=>x.appointmentId===a.id);if(tx){tx.value=Number(a.value||0);tx.status=status;}else s.transactions.push({id:makeId('txn'),appointmentId:a.id,type:'receita',value:Number(a.value||0),status});saveState(s);close('#financeModal');};
    open('#financeModal');
  }

  function bindForm(){
    const form=document.querySelector('#appointmentForm');
    if(form)form.onsubmit=e=>{
      e.preventDefault();e.stopPropagation();
      const data=Object.fromEntries(new FormData(form).entries());
      const picker=document.querySelector('#servicePicker');
      const selection=picker?picker._getSelected():{ids:[],services:[],total:0};
      if(!data.clientName.trim()||!data.professionalName||!selection.services.length)return;
      const professional=getProfessional(data.professionalName);
      if(!professional.specialty || selection.services.some(s=>s.category!==professional.specialty))return;
      const state=getState();
      const snapshot=selection.services.map(s=>({id:s.id,name:s.name,value:Number(s.value),category:s.category}));
      state.appointments.push({id:makeId('apt'),date:dateKey(agendaDate),time:data.appointmentTime,professional:data.professionalName,client:data.clientName.trim(),service:snapshot.map(s=>s.name).join(' + '),serviceId:snapshot[0]?.id||null,serviceIds:snapshot.map(s=>s.id),services:snapshot,value:Number(selection.total),status:'agendado',source:'salao'});
      saveState(state);close('#appointmentModal');renderAppointments();
    };
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
    document.addEventListener('click',e=>{
      if(!e.target.closest('.service-picker')) document.querySelectorAll('.service-picker-menu').forEach(m=>{m.hidden=true;});
    });
  }

  getServices(); bindNavigation(); bindForm(); bindProfessional(); renderGrid();
})();
