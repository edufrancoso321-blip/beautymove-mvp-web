/* BeautyMove — Agenda Functional Controller FINAL
 * Autoridade funcional da grade atual.
 * Mantém a estrutura visual de 3 módulos e restaura interação sem recriar o Painel S.O.S.
 */
(function(){
  'use strict';
  if(document.body?.dataset?.role!=='salao') return;

  const STATE_KEY='beautymove.mvp.state';
  const STATUS_KEY='beautymove.mvp.professional.daily-status';
  const PEOPLE=[
    {name:'Ana',specialty:'Cabelos',group:'blue'},
    {name:'Bruna',specialty:'Cabelos',group:'blue'},
    {name:'Paula',specialty:'Mãos e Pés',group:'rose'},
    {name:'Carla',specialty:'Estética',group:'green'}
  ];
  const SERVICES_DEFAULT=[
    {id:'svc-corte',name:'Corte',category:'Cabelos',value:80,durationMinutes:60},
    {id:'svc-escova',name:'Escova',category:'Cabelos',value:60,durationMinutes:30},
    {id:'svc-coloracao',name:'Coloração',category:'Cabelos',value:150,durationMinutes:120},
    {id:'svc-luzes',name:'Luzes',category:'Cabelos',value:250,durationMinutes:180},
    {id:'svc-corte-feminino',name:'Corte feminino',category:'Cabelos',value:80,durationMinutes:60},
    {id:'svc-corte-masculino',name:'Corte masculino',category:'Cabelos',value:50,durationMinutes:45},
    {id:'svc-manicure',name:'Manicure',category:'Mãos e Pés',value:55,durationMinutes:60},
    {id:'svc-pedicure',name:'Pedicure',category:'Mãos e Pés',value:65,durationMinutes:60},
    {id:'svc-limpeza-pele',name:'Limpeza de pele',category:'Estética',value:120,durationMinutes:75},
    {id:'svc-design-sobrancelhas',name:'Design de sobrancelhas',category:'Sobrancelhas',value:60,durationMinutes:45}
  ];
  const DEFAULT_HOURS={open:'08:00',close:'18:00'};
  const ROW_HEIGHT=68;
  let editingId=null;
  let selectedServiceIds=[];

  const read=(key,fallback)=>{try{const v=localStorage.getItem(key);return v==null?fallback:JSON.parse(v)}catch{return fallback}};
  const saveState=s=>{localStorage.setItem(STATE_KEY,JSON.stringify(s));window.BeautyMoveAgendaPersistence?.syncNow?.()};
  const state=()=>{const s=read(STATE_KEY,{});return{appointments:Array.isArray(s.appointments)?s.appointments:[],opportunities:Array.isArray(s.opportunities)?s.opportunities:[],transactions:Array.isArray(s.transactions)?s.transactions:[]}};
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const mins=v=>{const p=String(v||'00:00').split(':').map(Number);return(p[0]||0)*60+(p[1]||0)};
  const time=v=>`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
  const durationOf=a=>{if(Array.isArray(a?.services)&&a.services.length)return a.services.reduce((n,s)=>n+(Number(s.durationMinutes||s.duration)||0),0)||30;return Number(a?.durationMinutes||a?.duration||30)||30};
  const servicesOf=a=>{if(Array.isArray(a?.services)&&a.services.length)return a.services;const text=a?.service||'';return text.split('+').map(x=>x.trim()).filter(Boolean).map(name=>getServices().find(s=>s.name===name)||{name,durationMinutes:30,value:0});};
  const endOf=a=>time(mins(a.time)+durationOf(a));
  const dateKey=()=>{const p=document.getElementById('agendaDatePicker');if(p?.value)return p.value;const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const interval=()=>Number(document.getElementById('agendaInterval')?.value||60);
  const configuredHours=()=>{const w=read('beautymove.mvp.agenda.hours',null),d=new Date(`${dateKey()}T12:00:00`);if(Array.isArray(w)&&w[d.getDay()])return{open:w[d.getDay()].open||DEFAULT_HOURS.open,close:w[d.getDay()].close||DEFAULT_HOURS.close};return DEFAULT_HOURS};
  const getServices=()=>{const saved=read('beautymove.mvp.services',null);return Array.isArray(saved)&&saved.length?saved:SERVICES_DEFAULT};
  const professionalServices=name=>{const specialty=PEOPLE.find(p=>p.name===name)?.specialty;return getServices().filter(s=>!specialty||!s.category||s.category===specialty||s.category==='Sobrancelhas'&&specialty==='Estética');};
  const statusData=()=>read(STATUS_KEY,{});

  function closeModal(id){const m=document.getElementById(id);if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}}
  function openModal(id){const m=document.getElementById(id);if(m){m.classList.add('is-open');m.setAttribute('aria-hidden','false');}}
  function notify(msg){const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmFinalNotice);window.__bmFinalNotice=setTimeout(()=>n.hidden=true,3000);}

  function renderGrid(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    const h=configuredHours(),start=mins(h.open),end=mins(h.close),step=interval(),slots=Math.ceil(Math.max(step,end-start)/step),height=slots*ROW_HEIGHT,day=dateKey();
    const apps=state().appointments.filter(a=>a?.date===day&&String(a.status||'').toLowerCase()!=='cancelado');
    const statuses=statusData();
    const statusLabel={unregistered:'Sem registro',working:'Presença registrada',late:'Atraso registrado',absent:'Ausência registrada'};
    const statusClass={working:'is-working',late:'is-late',absent:'is-absent',unregistered:''};
    const event=item=>{const a=mins(item.time),b=a+durationOf(item),vs=Math.max(start,a),ve=Math.min(end,b);if(ve<=start||vs>=end)return'';const top=(vs-start)*ROW_HEIGHT/step,ht=Math.max(22,(ve-vs)*ROW_HEIGHT/step-2),st=String(item.status||'').toLowerCase(),cls=st==='em_andamento'||st==='chegou'?'progress':st==='finalizado'||st==='concluido'?'finished':'';const svc=servicesOf(item).map(s=>s.name).filter(Boolean).join(' + ')||item.service||'Atendimento';return`<div class="bm-ap-event ${cls}" style="top:${top}px;height:${ht}px" data-appointment-id="${esc(item.id)}"><strong>${esc(item.client||'Cliente')}</strong><span>${esc(svc)}</span><small>${esc(item.time||'')} – ${esc(time(b))} · ${Math.round(durationOf(item))}min</small></div>`};
    const free=i=>`<div class="bm-ap-free" style="top:${i*ROW_HEIGHT}px">Livre</div>`;
    const header=`<div class="bm-ap-time-head">Horário</div><div class="bm-ap-specialty blue" style="grid-column:2 / span 2;grid-row:1">Cabelos</div><div class="bm-ap-specialty rose" style="grid-column:4;grid-row:1">Mãos e Pés</div><div class="bm-ap-specialty green" style="grid-column:5;grid-row:1">Estética</div>${PEOPLE.map((p,i)=>{const rec=statuses[`${day}::${p.name}`]||{};const st=rec.status||'unregistered';return`<div class="bm-ap-prof-head" data-professional="${esc(p.name)}" style="grid-column:${i+2};grid-row:2"><span class="professional-name">${esc(p.name)}</span><span class="professional-day-status ${statusClass[st]||''}"><i class="status-dot"></i>${esc(statusLabel[st]||statusLabel.unregistered)}</span></div>`}).join('')}`;
    const bodyTime=Array.from({length:slots},(_,i)=>`<div class="bm-ap-time-label">${esc(time(start+i*step))}</div>`).join('');
    const lanes=PEOPLE.map(p=>{const items=apps.filter(a=>a.professional===p.name);return`<div class="bm-ap-lane" data-lane="${esc(p.name)}" style="height:${height}px">${Array.from({length:slots},(_,i)=>free(i)).join('')}${items.map(event).join('')}</div>`}).join('');
    grid.innerHTML=`<div class="bm-ap-scroll"><div class="bm-ap"><div class="bm-ap-head">${header}</div><div class="bm-ap-body" style="height:${height}px"><div class="bm-ap-time" style="height:${height}px">${bodyTime}</div>${lanes}</div></div></div>`;
    bindGridInteractions();
  }

  function setFormTimeOptions(selected){const el=document.getElementById('appointmentTime');if(!el)return;const opts=[];for(let m=mins(configuredHours().open);m<=mins(configuredHours().close);m+=30)opts.push(`<option value="${time(m)}" ${time(m)===selected?'selected':''}>${time(m)}</option>`);el.innerHTML=opts.join('');}
  function setFormServices(name,selected){
    const list=document.getElementById('serviceList');if(!list)return;const services=professionalServices(name);selectedServiceIds=[...selected];
    list.innerHTML=services.map(s=>`<label class="service-option"><input type="checkbox" data-service value="${esc(s.name)}" data-service-id="${esc(s.id||s.name)}" ${selectedServiceIds.includes(s.id||s.name)||selectedServiceIds.includes(s.name)?'checked':''}><span>${esc(s.name)}</span><strong>R$ ${Number(s.value||0).toFixed(2).replace('.',',')} · ${Number(s.durationMinutes||s.duration||30)}min</strong></label>`).join('')||'<div class="specialty-empty">Nenhum serviço cadastrado para esta especialidade.</div>';
    list.querySelectorAll('input[data-service]').forEach(i=>i.addEventListener('change',()=>{selectedServiceIds=[...list.querySelectorAll('input[data-service]:checked')].map(x=>x.dataset.serviceId||x.value);updateServiceTotals(name)}));
    updateServiceTotals(name);
  }
  function updateServiceTotals(name){const list=document.getElementById('serviceList');if(!list)return;const selected=[...list.querySelectorAll('input[data-service]:checked')].map(i=>i.dataset.serviceId||i.value);const all=professionalServices(name);const chosen=all.filter(s=>selected.includes(s.id)||selected.includes(s.name));const total=chosen.reduce((n,s)=>n+Number(s.value||0),0),duration=chosen.reduce((n,s)=>n+Number(s.durationMinutes||s.duration||30),0);const d=document.getElementById('serviceDuration'),t=document.getElementById('serviceTotal');if(d)d.textContent=duration+'min';if(t)t.textContent='R$ '+total.toFixed(2).replace('.',',');}
  function openAppointmentForm({appointment=null,professional='Ana',timeValue=null}){
    editingId=appointment?.id||null;const p=document.getElementById('appointmentProfessional'),client=document.getElementById('appointmentClient'),status=document.getElementById('appointmentStatus'),mode=document.getElementById('appointmentMode'),title=document.getElementById('appointmentTitle'),id=document.getElementById('appointmentId');
    if(p)p.value=appointment?.professional||professional;if(client)client.value=appointment?.client||'';if(id)id.value=editingId||'';if(status)status.value=appointment?.status||'agendado';const sf=document.getElementById('appointmentStatusField');if(sf)sf.style.display=editingId?'flex':'none';if(mode)mode.textContent=editingId?'ALTERAR AGENDAMENTO':'NOVO AGENDAMENTO';if(title)title.textContent=editingId?'Alterar atendimento':'Agendar cliente';setFormTimeOptions(appointment?.time||timeValue||configuredHours().open);setFormServices(p?.value||professional,servicesOf(appointment||{}).map(s=>s.id||s.name));openModal('appointmentModal');setTimeout(()=>client?.focus(),50);
  }
  function saveAppointment(e){
    e.preventDefault();
    const s=state(),client=document.getElementById('appointmentClient')?.value.trim(),professional=document.getElementById('appointmentProfessional')?.value,timeValue=document.getElementById('appointmentTime')?.value,status=document.getElementById('appointmentStatus')?.value||'agendado';
    const list=document.getElementById('serviceList');const checked=[...list?.querySelectorAll('input[data-service]:checked')||[]].map(i=>i.dataset.serviceId||i.value);const catalog=professionalServices(professional),chosen=catalog.filter(x=>checked.includes(x.id)||checked.includes(x.name));
    if(!client)return alert('Informe o nome da cliente.');if(!professional||!timeValue)return alert('Informe profissional e horário.');if(!chosen.length)return alert('Selecione pelo menos um serviço.');
    const snapshot=chosen.map(x=>({id:x.id||x.name,name:x.name,value:Number(x.value||0),category:x.category,durationMinutes:Number(x.durationMinutes||x.duration||30)}));
    if(editingId){const a=s.appointments.find(x=>String(x.id)===String(editingId));if(!a)return;Object.assign(a,{client,professional,time:timeValue,status,services:snapshot,serviceIds:snapshot.map(x=>x.id),service:snapshot.map(x=>x.name).join(' + '),value:snapshot.reduce((n,x)=>n+x.value,0),durationMinutes:snapshot.reduce((n,x)=>n+x.durationMinutes,0),updatedAt:new Date().toISOString()});}
    else s.appointments.push({id:'apt-'+Date.now(),date:dateKey(),time:timeValue,professional,client,services:snapshot,serviceIds:snapshot.map(x=>x.id),service:snapshot.map(x=>x.name).join(' + '),value:snapshot.reduce((n,x)=>n+x.value,0),durationMinutes:snapshot.reduce((n,x)=>n+x.durationMinutes,0),status,source:'salao'});
    saveState(s);closeModal('appointmentModal');editingId=null;renderGrid();window.dispatchEvent(new CustomEvent('beautymove:appointment-changed'));
  }
  function openDetails(id){
    const a=state().appointments.find(x=>String(x.id)===String(id));if(!a)return;window.__bmCurrentAppointmentId=a.id;const content=document.getElementById('detailsContent'),actions=document.getElementById('detailsActions');if(!content)return;const svc=servicesOf(a).map(s=>s.name).join(' + ');content.innerHTML=`<div class="detail-summary"><strong>${esc(a.client||'Cliente')}</strong><span>${esc(a.professional||'')}</span><span>${esc(a.time||'')} – ${esc(endOf(a))}</span><span>${esc(svc)}</span><span>Status: ${esc(a.status||'agendado')}</span></div>`;if(actions){actions.dataset.appointmentId=a.id;actions.removeAttribute('data-sos-id');actions.innerHTML=`<button type="button" class="secondary" data-detail-action="schedule">Alterar horário</button><button type="button" class="secondary" data-detail-action="services">Incluir / remover serviços</button><button type="button" class="primary compact" data-detail-action="arrived">Iniciar atendimento</button><button type="button" class="secondary" data-detail-action="finish">Finalizar atendimento</button><button type="button" class="secondary" data-detail-action="cancel">Cancelar atendimento</button>`;}
    openModal('detailsModal');
  }
  function openServicesForCurrent(){const id=window.__bmCurrentAppointmentId||document.getElementById('detailsActions')?.dataset?.appointmentId;if(!id)return;const a=state().appointments.find(x=>String(x.id)===String(id));if(!a)return;setFormServices(a.professional,servicesOf(a).map(s=>s.id||s.name));openModal('servicesModal');}
  function saveServices(){const id=window.__bmCurrentAppointmentId||document.getElementById('detailsActions')?.dataset?.appointmentId;if(!id)return;const a=state().appointments.find(x=>String(x.id)===String(id));if(!a)return;const list=document.getElementById('serviceList'),checked=[...list.querySelectorAll('input[data-service]:checked')].map(i=>i.dataset.serviceId||i.value),catalog=professionalServices(a.professional),chosen=catalog.filter(x=>checked.includes(x.id)||checked.includes(x.name));if(!chosen.length)return alert('Selecione pelo menos um serviço.');a.services=chosen.map(x=>({id:x.id||x.name,name:x.name,value:Number(x.value||0),category:x.category,durationMinutes:Number(x.durationMinutes||x.duration||30)}));a.serviceIds=a.services.map(x=>x.id);a.service=a.services.map(x=>x.name).join(' + ');a.value=a.services.reduce((n,x)=>n+x.value,0);a.durationMinutes=a.services.reduce((n,x)=>n+x.durationMinutes,0);a.updatedAt=new Date().toISOString();saveState(state());closeModal('servicesModal');closeModal('detailsModal');renderGrid();}

  function professionalControl(name,anchor){
    document.querySelector('.bm-final-prof-popover')?.remove();const d=dateKey(),key=d+'::'+name,all=statusData(),rec=all[key]||{status:'unregistered'};const p=document.createElement('div');p.className='bm-final-prof-popover';p.innerHTML=`<strong>${esc(name)}</strong><small>Controle do dia</small><div class="bm-final-status-current">Status: <b>${esc(rec.status||'unregistered')}</b></div><button data-status="working">Marcar presença</button><button data-status="late">Registrar atraso</button><button data-status="absent">Registrar ausência</button><button data-status="unregistered">Limpar status</button>`;document.body.appendChild(p);const r=anchor.getBoundingClientRect();p.style.left=Math.max(8,Math.min(innerWidth-228,r.left+r.width/2-110))+'px';p.style.top=Math.min(innerHeight-220,r.bottom+8)+'px';p.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',()=>{const x=statusData();if(b.dataset.status==='unregistered')delete x[key];else x[key]={status:b.dataset.status,updatedAt:new Date().toISOString()};localStorage.setItem(STATUS_KEY,JSON.stringify(x));p.remove();renderGrid();}));setTimeout(()=>{const close=e=>{if(!p.contains(e.target)&&e.target!==anchor){p.remove();document.removeEventListener('click',close,true)}};document.addEventListener('click',close,true)},0);
  }

  function bindGridInteractions(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    grid.querySelectorAll('.bm-ap-event').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();openDetails(el.dataset.appointmentId)}));
    grid.querySelectorAll('.bm-ap-lane').forEach(lane=>lane.addEventListener('click',e=>{if(e.target.closest('.bm-ap-event'))return;const r=lane.getBoundingClientRect(),h=configuredHours(),start=mins(h.open),step=interval();const raw=start+((e.clientY-r.top)/ROW_HEIGHT)*step;const snapped=Math.max(start,Math.min(start+Math.floor((raw-start)/step)*step,mins(h.close)-step));openAppointmentForm({professional:lane.dataset.lane,timeValue:time(snapped)});}));
    grid.querySelectorAll('.bm-ap-prof-head').forEach(head=>head.addEventListener('click',e=>{e.stopPropagation();professionalControl(head.dataset.professional,head)}));
  }

  function bind(){
    document.getElementById('appointmentForm')?.addEventListener('submit',saveAppointment);
    document.getElementById('appointmentProfessional')?.addEventListener('change',e=>setFormServices(e.target.value,[]));
    document.getElementById('openServicesFromAppointment')?.addEventListener('click',()=>openModal('servicesModal'));
    document.getElementById('saveServicesButton')?.addEventListener('click',()=>{if(editingId)saveServices();else{closeModal('servicesModal');}});
    document.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>{const m=b.closest('.modal');if(m)closeModal(m.id)}));
    document.addEventListener('click',e=>{const a=e.target.closest('#detailsActions [data-detail-action]');if(!a)return;const id=document.getElementById('detailsActions')?.dataset?.appointmentId||window.__bmCurrentAppointmentId;if(!id)return;if(a.dataset.detailAction==='schedule'){const item=state().appointments.find(x=>String(x.id)===String(id));if(item){closeModal('detailsModal');openAppointmentForm({appointment:item});}}else if(a.dataset.detailAction==='services'){openServicesForCurrent();}});
    document.getElementById('newAppointmentBtn')?.addEventListener('click',()=>openAppointmentForm({professional:'Ana'}));
    document.getElementById('agendaInterval')?.addEventListener('change',renderGrid);
    document.getElementById('agendaDatePicker')?.addEventListener('change',renderGrid);
    document.getElementById('prevDay')?.addEventListener('click',()=>setTimeout(renderGrid,80));
    document.getElementById('nextDay')?.addEventListener('click',()=>setTimeout(renderGrid,80));
    document.getElementById('todayBtn')?.addEventListener('click',()=>setTimeout(renderGrid,80));
    window.addEventListener('beautymove:appointment-changed',renderGrid);
    window.addEventListener('storage',e=>{if(e.key===STATE_KEY||e.key===STATUS_KEY)renderGrid();});
  }
  function boot(){bind();setTimeout(renderGrid,120);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
