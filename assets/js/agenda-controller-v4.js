/* BeautyMove — Agenda Principal v4
   Fonte única de controle da agenda do salão.
   - Encaixes permitidos: duração é referência visual, não bloqueio.
   - Status: agendado (sem cor), chegou (verde), finalizado (vermelho).
   - S.O.S. usa roxo e fica vinculado ao horário/serviços.
   - Grade configurável em 30, 45 ou 60 minutos.
   - Preço e duração pertencem ao catálogo de serviços.
*/
(function(){
  if(document.body?.dataset?.role!=='salao') return;

  const STATE='beautymove.mvp.state', SERVICES='beautymove.mvp.services', PROS='beautymove.mvp.professionals', SOS='beautymove.mvp.sosContext';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const state=()=>({appointments:[],opportunities:[],transactions:[],...read(STATE,{})});
  const save=s=>write(STATE,s);
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const mins=t=>{const [h,m]=String(t).split(':').map(Number);return h*60+m};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const fmt=m=>{m=Number(m)||0;const h=Math.floor(m/60),r=m%60;return h?(r?`${h}h ${r}min`:`${h}h`):`${r}min`};
  const dateKey=d=>{d=d||new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const dateBR=d=>new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR');

  const DEFAULT_SERVICES=[
    ['svc-corte-feminino','Corte feminino','Cabelos',80,60],['svc-corte-masculino','Corte masculino','Cabelos',50,60],['svc-escova','Escova','Cabelos',60,30],['svc-hidratacao','Hidratação','Cabelos',70,60],['svc-coloracao','Coloração','Cabelos',150,120],['svc-luzes','Luzes','Cabelos',220,180],
    ['svc-maos','Mãos','Mãos e Pés',40,60],['svc-pes','Pés','Mãos e Pés',45,60],['svc-maos-pes','Mãos e pés','Mãos e Pés',80,90],['svc-esmaltacao','Esmaltação','Mãos e Pés',35,45],
    ['svc-limpeza-pele','Limpeza de pele','Estética',120,60],['svc-design-facial','Design facial','Estética',70,45],['svc-virilha','Virilha','Depilação',55,30],['svc-axila','Axila','Depilação',35,20],['svc-buco','Buço','Depilação',25,15],['svc-pernas','Pernas','Depilação',70,45],['svc-design-sobrancelhas','Design de sobrancelhas','Sobrancelhas',45,30],['svc-henna','Design com henna','Sobrancelhas',60,45]
  ].map(x=>({id:x[0],name:x[1],category:x[2],value:x[3],durationMinutes:x[4],status:'ativo'}));
  const DEFAULT_PROS=[{name:'Ana',specialty:'Cabelos'},{name:'Bruna',specialty:'Cabelos'},{name:'Paula',specialty:'Mãos e Pés'},{name:'Carla',specialty:'Estética'}];

  let selectedDate=new Date();
  let step=Number(localStorage.getItem('beautymove.mvp.agendaStep')||30);

  function getServices(){
    let saved=read(SERVICES,null);
    if(!Array.isArray(saved)||!saved.length){write(SERVICES,DEFAULT_SERVICES);return [...DEFAULT_SERVICES]}
    const map=new Map(saved.map(s=>[s.id,s]));
    DEFAULT_SERVICES.forEach(s=>{if(!map.has(s.id))map.set(s.id,{...s})});
    const merged=[...map.values()]; if(merged.length!==saved.length)write(SERVICES,merged); return merged;
  }
  function getPros(){const p=read(PROS,null);return Array.isArray(p)&&p.length?p:[...DEFAULT_PROS]}
  function prof(name){return getPros().find(p=>p.name===name)||{}}
  function servicesFor(name){const cat=prof(name).specialty;return getServices().filter(s=>s.status!=='inativo'&&(!cat||s.category===cat))}
  function snapServices(a){if(Array.isArray(a.services)&&a.services.length)return a.services;const map=new Map(getServices().map(s=>[s.id,s]));if(Array.isArray(a.serviceIds))return a.serviceIds.map(id=>map.get(id)).filter(Boolean);if(a.serviceId&&map.has(a.serviceId))return [map.get(a.serviceId)];return a.service?[{name:a.service,value:a.value||0,durationMinutes:60}]:[]}
  function durationService(s){return Number(s.durationMinutes||s.duration||s.estimatedMinutes||30)||30}
  function duration(a){return Math.max(30,Number(a.durationMinutes)||snapServices(a).reduce((n,s)=>n+durationService(s),0))}
  function timing(a){const start=mins(a.time),d=duration(a);return{start,end:start+d,endTime:time(start+d),duration:d}}
  function appointmentAt(date,name,minute){return state().appointments.find(a=>a.date===date&&a.professional===name&&a.status!=='cancelado'&&minute>=timing(a).start&&minute<timing(a).end)}
  function currentDate(){return dateKey(selectedDate)}

  function ensureToolbar(){
    const tools=document.querySelector('.agenda-tools'); if(!tools||tools.querySelector('#agendaStep'))return;
    const wrap=document.createElement('label');wrap.className='agenda-step-control';wrap.innerHTML='<span>Visualização</span><select id="agendaStep"><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hora</option></select>';
    tools.insertBefore(wrap,tools.firstChild);
    const sel=wrap.querySelector('select');sel.value=String(step);sel.onchange=()=>{step=Number(sel.value);localStorage.setItem('beautymove.mvp.agendaStep',String(step));renderGrid()};
    const btn=document.createElement('button');btn.className='secondary compact';btn.type='button';btn.id='serviceCatalogBtn';btn.textContent='Configurar serviços';tools.appendChild(btn);btn.onclick=openCatalog;
  }

  function renderGrid(){
    const body=document.querySelector('#agendaBody'),head=document.querySelector('.agenda-grid thead tr');if(!body||!head)return;
    const pros=getPros().slice(0,4); const names=pros.map(p=>p.name);
    head.innerHTML='<th class="time-col">Horário</th>'+pros.map(p=>`<th><span class="specialty-label">${esc(p.specialty||'Beleza')}</span><span class="professional-name">${esc(p.name)}</span></th>`).join('');
    const start=8*60,end=18*60;const times=[];for(let m=start;m<=end;m+=step)times.push(m);
    body.innerHTML=times.map(m=>`<tr><th class="time-col">${time(m)}</th>${names.map(n=>`<td data-slot="${esc(time(m))}-${esc(n)}">Livre</td>`).join('')}</tr>`).join('');
    document.querySelector('#agendaDate').textContent=currentDate()===dateKey(new Date())?'Hoje':selectedDate.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
    renderAppointments();
  }

  function renderAppointments(){
    const current=currentDate(), all=state().appointments.filter(a=>a.date===current&&a.status!=='cancelado');
    document.querySelectorAll('#agendaBody [data-slot]').forEach(cell=>{
      const [slot,...r]=cell.dataset.slot.split('-'),name=r.join('-'),a=appointmentAt(current,name,mins(slot));
      cell.className=cell.className.replace(/\bappointment\b|\bbm-(pending|arrived|finished|sos)\b/g,'').trim();cell.innerHTML='Livre';cell.style.background='';cell.style.borderLeft='';
      if(!a)return;
      const t=timing(a),start=mins(slot)===t.start;
      cell.classList.add('appointment',a.status==='em_atendimento'?'bm-arrived':a.status==='concluido'?'bm-finished':'bm-pending');
      if(a.sosRequested)cell.classList.add('bm-sos');
      cell.style.cursor='pointer';
      if(start){cell.innerHTML=`<strong>${esc(a.client)}</strong><span>${esc(snapServices(a).map(s=>s.name).join(' + '))}</span><small>${esc(a.time)} – ${esc(t.endTime)} · ${fmt(t.duration)}</small>`}
      else cell.innerHTML=`<span class="occupied-label">${esc(a.client)} · até ${esc(t.endTime)}</span>`;
    });
    const free=document.querySelector('#freeCount'),pending=document.querySelector('#pendingCount'),sos=document.querySelector('#sosCount');
    if(free)free.textContent=`${document.querySelectorAll('#agendaBody [data-slot]').length-all.reduce((n,a)=>n,0)-document.querySelectorAll('#agendaBody [data-slot].appointment').length} horários livres`;
    if(pending)pending.textContent=`${all.length} atendimentos`;
    if(sos)sos.textContent=`${state().opportunities.filter(o=>o.status==='aberta').length} solicitações`;
  }

  function openNew(time,name){
    const modal=document.querySelector('#appointmentModal'),form=document.querySelector('#appointmentForm');if(!modal||!form)return;
    let date=document.querySelector('#appointmentDate');if(!date){const f=document.createElement('div');f.className='field';f.innerHTML='<label for="appointmentDate">Data</label><input id="appointmentDate" readonly>';document.querySelector('#professionalName')?.closest('.field')?.insertAdjacentElement('afterend',f);date=f.querySelector('input')}
    const p=document.querySelector('#professionalName'),tf=document.querySelector('#appointmentTime');p.innerHTML=getPros().map(x=>`<option value="${esc(x.name)}" ${x.name===name?'selected':''}>${esc(x.name)}</option>`).join('');tf.innerHTML=Array.from({length:21},(_,i)=>time(8*60+i*30)).map(x=>`<option value="${x}" ${x===time?'selected':''}>${x}</option>`).join('');date.value=dateBR(currentDate());document.querySelector('#clientName').value='';document.querySelector('#serviceValue').value='';
    buildPicker(document.querySelector('#servicePicker'),p.value,[]);p.onchange=()=>buildPicker(document.querySelector('#servicePicker'),p.value,[]);
    modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');setTimeout(()=>document.querySelector('#clientName')?.focus(),50);
  }

  function buildPicker(container,name,initial){
    if(!container)return;const list=servicesFor(name);let selected=[...new Set(initial)].filter(id=>list.some(s=>s.id===id)),draft=[...selected];
    const chosen=()=>list.filter(s=>selected.includes(s.id)),total=()=>chosen().reduce((n,s)=>n+Number(s.value||0),0),label=()=>chosen().length===0?'Selecione os serviços':chosen().length===1?chosen()[0].name:`${chosen().length} serviços selecionados`;
    container.innerHTML=`<button type="button" class="service-picker-trigger"><span class="service-picker-label">${esc(label())}</span><span class="service-picker-arrow">⌄</span></button><div class="service-picker-menu" hidden><div>${list.map(s=>`<button type="button" class="service-option-row ${selected.includes(s.id)?'selected':''}" data-service-id="${esc(s.id)}"><span>${esc(s.name)}</span><strong>${money(s.value)} · ${fmt(s.durationMinutes)}</strong></button>`).join('')}</div><div class="service-picker-menu-actions"><button type="button" class="secondary compact" data-cancel-services>Cancelar</button><button type="button" class="primary compact" data-confirm-services>Confirmar serviços</button></div></div>`;
    const trigger=container.querySelector('.service-picker-trigger'),menu=container.querySelector('.service-picker-menu');
    const syncDraft=()=>menu.querySelectorAll('[data-service-id]').forEach(b=>b.classList.toggle('selected',draft.includes(b.dataset.serviceId)));
    trigger.onclick=()=>{if(menu.hidden){draft=[...selected];menu.hidden=false;trigger.setAttribute('aria-expanded','true')}else{menu.hidden=true;trigger.setAttribute('aria-expanded','false')}};
    menu.querySelectorAll('[data-service-id]').forEach(b=>b.onclick=()=>{draft.includes(b.dataset.serviceId)?draft=draft.filter(id=>id!==b.dataset.serviceId):draft.push(b.dataset.serviceId);syncDraft()});
    menu.querySelector('[data-confirm-services]').onclick=()=>{selected=[...draft];container.querySelector('.service-picker-label').textContent=label();const v=document.querySelector('#serviceValue');if(v)v.value=chosen().length?total().toFixed(2).replace('.',','):'';menu.hidden=true;trigger.setAttribute('aria-expanded','false')};
    menu.querySelector('[data-cancel-services]').onclick=()=>{draft=[...selected];syncDraft();menu.hidden=true;trigger.setAttribute('aria-expanded','false')};
    container._get=()=>({ids:[...selected],services:chosen(),total:total()});
  }

  function saveNew(e){
    e.preventDefault();e.stopImmediatePropagation();
    const client=document.querySelector('#clientName')?.value.trim(),name=document.querySelector('#professionalName')?.value,timeValue=document.querySelector('#appointmentTime')?.value,picker=document.querySelector('#servicePicker'),sel=picker?._get?.();
    if(!client)return alert('Informe o nome da cliente.');if(!name||!timeValue)return alert('Informe profissional e horário.');if(!sel?.services?.length)return alert('Selecione e confirme pelo menos um serviço.');
    const snapshot=sel.services.map(s=>({id:s.id,name:s.name,value:Number(s.value||0),category:s.category,durationMinutes:Number(s.durationMinutes||30)})),d=snapshot.reduce((n,s)=>n+s.durationMinutes,0);const st=state();
    st.appointments.push({id:`apt-${Date.now()}`,date:currentDate(),time:timeValue,professional:name,client,services:snapshot,serviceIds:snapshot.map(s=>s.id),service:snapshot.map(s=>s.name).join(' + '),value:sel.total,durationMinutes:d,status:'agendado',source:'salao'});save(st);close('#appointmentModal');renderAppointments();
  }

  function close(id){const e=document.querySelector(id);if(e){e.classList.remove('is-open');e.setAttribute('aria-hidden','true')}}
  function openDetail(a){
    const b=document.querySelector('#appointmentDetailBody'),t=timing(a),sv=snapServices(a),labels={agendado:'Agendado',em_atendimento:'Cliente chegou',concluido:'Finalizado'};
    const status=a.status==='em_atendimento'?'status-arrived':a.status==='concluido'?'status-finished':'';
    b.innerHTML=`<div class="operation-detail"><div class="operation-summary"><span class="eyebrow">ATENDIMENTO</span><h2>${esc(a.client)}</h2><p>${esc(a.professional)} · ${dateBR(a.date)} · ${esc(a.time)} – ${esc(t.endTime)} · ${fmt(t.duration)}</p><span class="status ${status}">${labels[a.status]||'Agendado'}</span></div><div class="operation-info"><div><small>Profissional</small><strong>${esc(a.professional)}</strong></div><div><small>Serviços</small><strong>${esc(sv.map(s=>s.name).join(' + '))}</strong></div><div><small>Valor total</small><strong>${money(a.value)}</strong></div></div><div class="field"><label for="editAppointmentTime">Horário</label><select id="editAppointmentTime">${Array.from({length:21},(_,i)=>time(8*60+i*30)).map(x=>`<option ${x===a.time?'selected':''}>${x}</option>`).join('')}</select></div><div class="operation-actions"><button class="secondary compact" data-op="reschedule">Alterar horário</button>${a.status==='agendado'?'<button class="primary compact" data-op="arrived">Cliente chegou</button>':''}${a.status==='em_atendimento'?'<button class="primary compact" data-op="finish">Finalizar atendimento</button>':''}${a.status==='concluido'?'<button class="secondary compact" data-op="reopen">Reabrir atendimento</button>':''}<button class="secondary compact" data-op="cancel">Cancelar agendamento</button><button class="sos-subtle compact" data-op="sos">S.O.S. Profissionais</button></div></div>`;
    const op=(key,fn)=>b.querySelector(`[data-op="${key}"]`)?.addEventListener('click',fn);
    op('arrived',()=>setStatus(a.id,'em_atendimento'));op('finish',()=>setStatus(a.id,'concluido'));op('reopen',()=>setStatus(a.id,'em_atendimento'));op('cancel',()=>cancel(a.id));
    op('reschedule',()=>{const nt=b.querySelector('#editAppointmentTime').value;const st=state(),x=st.appointments.find(z=>z.id===a.id);if(!x)return;x.time=nt;save(st);close('#appointmentDetailModal');renderAppointments()});
    op('sos',()=>sendSos(a));
    document.querySelector('#appointmentDetailModal')?.classList.add('is-open');document.querySelector('#appointmentDetailModal')?.setAttribute('aria-hidden','false');
  }
  function setStatus(id,status){const st=state(),a=st.appointments.find(x=>x.id===id);if(!a)return;a.status=status;if(status==='em_atendimento')a.arrivedAt=new Date().toISOString();if(status==='concluido')a.finishedAt=new Date().toISOString();save(st);close('#appointmentDetailModal');renderAppointments()}
  function cancel(id){const a=state().appointments.find(x=>x.id===id);if(!a)return;if(!confirm(`Cancelar o agendamento de ${a.client}?`))return;const st=state(),x=st.appointments.find(z=>z.id===id);x.status='cancelado';x.cancelledAt=new Date().toISOString();save(st);close('#appointmentDetailModal');renderAppointments()}

  function sendSos(a){const sv=snapServices(a);write(SOS,{appointmentId:a.id,date:a.date,time:a.time,professional:a.professional,client:a.client,serviceIds:sv.map(s=>s.id),services:sv.map(s=>({id:s.id,name:s.name,value:Number(s.value||0),category:s.category,durationMinutes:Number(s.durationMinutes||30)})),service:sv.map(s=>s.name).join(' + '),value:Number(a.value||0)});a.sosRequested=true;const st=state(),x=st.appointments.find(z=>z.id===a.id);if(x)x.sosRequested=true;save(st);window.location.href='sos.html?origem=agenda&appointmentId='+encodeURIComponent(a.id)}

  function openCatalog(){
    let modal=document.querySelector('#serviceCatalogModal');if(!modal){modal=document.createElement('div');modal.id='serviceCatalogModal';modal.className='modal';modal.innerHTML='<div class="modal-backdrop" data-close-catalog></div><section class="modal-card catalog-card"><button class="modal-close" type="button" data-close-catalog>×</button><div class="eyebrow">CONFIGURAÇÃO</div><h2>Catálogo de serviços</h2><p class="modal-intro">Cadastre e ajuste o valor e a duração estimada de cada serviço. Esses dados serão usados automaticamente nos agendamentos.</p><div id="catalogBody"></div><div class="form-actions"><button class="secondary compact" type="button" data-close-catalog>Fechar</button><button class="primary compact" type="button" id="saveCatalog">Salvar alterações</button></div></section></div>';document.body.appendChild(modal);modal.querySelectorAll('[data-close-catalog]').forEach(x=>x.onclick=()=>close('#serviceCatalogModal'));modal.querySelector('#saveCatalog').onclick=saveCatalog}
    const list=getServices();document.querySelector('#catalogBody').innerHTML=`<div class="catalog-list">${list.map((s,i)=>`<div class="catalog-row"><div><strong>${esc(s.name)}</strong><small>${esc(s.category)}</small></div><label>Valor<input data-cat-value="${i}" inputmode="decimal" value="${Number(s.value||0).toFixed(2).replace('.',',')}"></label><label>Duração<select data-cat-duration="${i}">${[15,20,30,45,60,75,90,120,150,180,240].map(d=>`<option value="${d}" ${Number(s.durationMinutes||30)===d?'selected':''}>${fmt(d)}</option>`).join('')}</select></label></div>`).join('')}</div>`;
    modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
  }
  function saveCatalog(){const list=getServices();document.querySelectorAll('[data-cat-value]').forEach(i=>{const idx=Number(i.dataset.catValue),raw=String(i.value).replace(/\./g,'').replace(',','.');list[idx].value=Number(raw)||0});document.querySelectorAll('[data-cat-duration]').forEach(i=>{list[Number(i.dataset.catDuration)].durationMinutes=Number(i.value)||30});write(SERVICES,list);close('#serviceCatalogModal');renderGrid()}

  function wire(){
    ensureToolbar();
    document.querySelector('#newAppointmentBtn')?.addEventListener('click',()=>openNew(time(8*60),getPros()[0]?.name||'Ana'));
    document.querySelector('#quickAppointmentBtn')?.addEventListener('click',()=>openNew(time(8*60),getPros()[0]?.name||'Ana'));
    document.querySelector('#appointmentForm')?.addEventListener('submit',saveNew,true);
    document.querySelector('#prevDay')?.addEventListener('click',()=>{selectedDate.setDate(selectedDate.getDate()-1);renderGrid()});
    document.querySelector('#nextDay')?.addEventListener('click',()=>{selectedDate.setDate(selectedDate.getDate()+1);renderGrid()});
    document.querySelector('#todayBtn')?.addEventListener('click',()=>{selectedDate=new Date();renderGrid()});
    document.querySelector('#agendaBody')?.addEventListener('click',e=>{const cell=e.target.closest('[data-slot]');if(!cell)return;const [slot,...r]=cell.dataset.slot.split('-'),name=r.join('-'),a=appointmentAt(currentDate(),name,mins(slot));if(a)openDetail(a);else openNew(slot,name)});
    document.addEventListener('click',e=>{if(e.target.closest('[data-close-modal]'))close('#appointmentModal');if(e.target.closest('[data-close-operation-modal]')){close('#appointmentDetailModal');close('#financeModal');close('#professionalModal')}});
    renderGrid();
  }
  const css=document.createElement('style');css.textContent=`.agenda-step-control{display:flex;align-items:center;gap:7px;font-size:12px;color:#666}.agenda-step-control select{border:1px solid #ddd6eb;border-radius:8px;padding:9px 10px;background:#fff}.service-option-row{width:100%;display:flex;justify-content:space-between;align-items:center;border:0;background:#fff;padding:11px 10px;border-radius:7px;cursor:pointer;text-align:left}.service-option-row:hover,.service-option-row.selected{background:#f4efff}.service-option-row.selected span{font-weight:700;color:#5e2fd0}.service-picker-menu-actions{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #eee;padding:9px;margin-top:4px}.bm-arrived{background:#e8f7ed!important;border-left:3px solid #2e9d57!important}.bm-finished{background:#fdeaea!important;border-left:3px solid #c43b3b!important}.bm-pending{background:#fff!important;border-left:3px solid #ddd!important}.bm-sos{background:#f1eaff!important;border-left:3px solid #7438ff!important}.bm-arrived,.bm-finished,.bm-pending,.bm-sos{cursor:pointer!important}.occupied-label{font-size:12px;color:#777}.catalog-card{max-width:900px}.catalog-list{max-height:430px;overflow:auto;border:1px solid #eee;border-radius:10px}.catalog-row{display:grid;grid-template-columns:1fr 130px 140px;gap:12px;align-items:center;padding:10px 12px;border-bottom:1px solid #eee}.catalog-row:last-child{border-bottom:0}.catalog-row small{display:block;color:#777;margin-top:3px}.catalog-row label{font-size:12px;color:#666}.catalog-row input,.catalog-row select{width:100%;margin-top:4px;padding:8px;border:1px solid #ddd6eb;border-radius:7px;background:#fff}.sos-subtle{background:#7438ff!important;border-color:#7438ff!important;color:#fff!important}.sos-subtle:hover{background:#6330df!important}@media(max-width:800px){.catalog-row{grid-template-columns:1fr 1fr}.catalog-row>div{grid-column:1/-1}}`;document.head.appendChild(css);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();