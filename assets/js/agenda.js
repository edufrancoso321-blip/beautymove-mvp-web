/* BeautyMove — Agenda Core V3
 * Estrutura temporal autoritativa: CSS Grid + lanes absolutas.
 * Um atendimento = um único bloco visual. Zero rowspan.
 */
(function () {
  'use strict';

  if (document.body?.dataset?.role !== 'salao') return;

  const STATE_KEY = 'beautymove.mvp.state';
  const HOURS_KEY = 'beautymove.mvp.agenda.hours';
  const PEOPLE = [
    { name: 'Ana', specialty: 'Cabelos', group: 'blue' },
    { name: 'Bruna', specialty: 'Cabelos', group: 'blue' },
    { name: 'Paula', specialty: 'Mãos e Pés', group: 'rose' },
    { name: 'Carla', specialty: 'Estética', group: 'green' }
  ];

  const SERVICES = [
    { name: 'Corte', duration: 60, value: 80 },
    { name: 'Escova', duration: 30, value: 60 },
    { name: 'Coloração', duration: 120, value: 150 },
    { name: 'Luzes', duration: 180, value: 250 },
    { name: 'Corte feminino', duration: 60, value: 80 },
    { name: 'Corte masculino', duration: 45, value: 50 },
    { name: 'Manicure', duration: 60, value: 55 },
    { name: 'Pedicure', duration: 60, value: 65 },
    { name: 'Limpeza de pele', duration: 75, value: 120 },
    { name: 'Design de sobrancelhas', duration: 45, value: 60 }
  ];

  const DEFAULT_HOURS = { open: '08:00', close: '18:00' };
  const ROW_HEIGHT = 68;

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const state = () => {
    const value = read(STATE_KEY, {});
    return {
      appointments: Array.isArray(value?.appointments) ? value.appointments : [],
      opportunities: Array.isArray(value?.opportunities) ? value.opportunities : [],
      transactions: Array.isArray(value?.transactions) ? value.transactions : []
    };
  };

  const write = value => {
    localStorage.setItem(STATE_KEY, JSON.stringify(value));
    window.BeautyMoveAgendaPersistence?.syncNow?.();
  };

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const mins = value => {
    const p = String(value || '00:00').split(':').map(Number);
    return (p[0] || 0) * 60 + (p[1] || 0);
  };

  const time = value =>
    `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

  const durationLabel = value => {
    const total = Math.max(0, Number(value) || 0);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h ? (m ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
  };

  const currency = value => Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
  });

  const dateKey = () => {
    const picker = document.getElementById('agendaDatePicker');
    if (picker?.value) return picker.value;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const interval = () => Number(document.getElementById('agendaInterval')?.value || 60);

  const configuredHours = () => {
    const week = read(HOURS_KEY, null);
    const d = new Date(`${dateKey()}T12:00:00`);
    if (Array.isArray(week) && week[d.getDay()]) {
      return {
        open: week[d.getDay()].open || DEFAULT_HOURS.open,
        close: week[d.getDay()].close || DEFAULT_HOURS.close
      };
    }
    return DEFAULT_HOURS;
  };

  const servicesOf = item => {
    if (Array.isArray(item?.services) && item.services.length) return item.services;
    if (Array.isArray(item?.servicesSnapshot) && item.servicesSnapshot.length) return item.servicesSnapshot;
    if (item?.service) {
      return String(item.service).split('+').map(name => name.trim()).filter(Boolean).map(name => {
        const known = SERVICES.find(s => s.name.toLowerCase() === name.toLowerCase());
        return known ? { ...known } : { name, duration: Number(item.duration) || 30, value: 0 };
      });
    }
    return [];
  };

  const durationOf = item => {
    const fromServices = servicesOf(item).reduce((sum, s) =>
      sum + (Number(s?.duration) || Number(s?.durationMinutes) || 0), 0);
    return fromServices || Number(item?.durationSnapshot) ||
      Number(item?.durationMinutes) || Number(item?.duration) || 30;
  };

  const endOf = item => time(mins(item?.time) + durationOf(item));

  const showNotice = message => {
    const n = document.getElementById('agendaNotice');
    if (!n) return;
    n.textContent = message;
    n.hidden = false;
    clearTimeout(window.__bmAgendaNotice);
    window.__bmAgendaNotice = setTimeout(() => { n.hidden = true; }, 3200);
  };

  function injectStyles() {
    if (document.getElementById('bmAgendaCoreV3Styles')) return;
    const style = document.createElement('style');
    style.id = 'bmAgendaCoreV3Styles';
    style.textContent = `
      #agendaGrid .agenda-scroll-v3{width:100%;height:100%;overflow:auto;overflow-y:scroll;overflow-x:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:#fff}
      #agendaGrid .bm-agenda-v3{min-width:1036px;width:max-content;background:#fff}
      #agendaGrid .bm-head-v3{display:grid;grid-template-columns:76px repeat(4,185px) 220px;position:sticky;top:0;z-index:80;background:#fff}
      #agendaGrid .bm-specialty{height:36px;display:flex;align-items:center;justify-content:center;border-right:1px solid #ece9f0;border-bottom:1px solid #ece9f0;font-size:15px;font-weight:850;color:#625b6c;position:relative}
      #agendaGrid .bm-specialty:after{content:'';position:absolute;left:12px;right:12px;bottom:0;height:6px;border-radius:6px 6px 0 0}
      #agendaGrid .bm-specialty.blue:after{background:#e7f1ff}#agendaGrid .bm-specialty.rose:after{background:#fce8e8}#agendaGrid .bm-specialty.green:after{background:#e7f6ec}
      #agendaGrid .bm-time-head,#agendaGrid .bm-sos-head{height:82px;background:#fff;border-right:1px solid #ece9f0;border-bottom:1px solid #ece9f0;box-sizing:border-box}
      #agendaGrid .bm-time-head{grid-column:1;grid-row:1 / span 2;position:sticky;left:0;z-index:100;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800}
      #agendaGrid .bm-sos-head{grid-column:6;grid-row:1 / span 2;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;color:var(--purple)}
      #agendaGrid .bm-sos-head:after{content:'';position:absolute;left:12px;right:12px;bottom:0;height:6px;border-radius:6px 6px 0 0;background:var(--purple)}
      #agendaGrid .bm-sos-head strong{font-size:16px;line-height:1.1}#agendaGrid .bm-sos-head span{margin-top:7px;font-size:11px;font-weight:850}
      #agendaGrid .bm-prof-head{height:46px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:5px 8px 8px;box-sizing:border-box;border-right:1px solid #ece9f0;border-bottom:1px solid #ece9f0;background:#fff;cursor:pointer}
      #agendaGrid .bm-prof-head .professional-name{font-size:16px;line-height:1.15;font-weight:900;color:#17131f}
      #agendaGrid .bm-prof-head .professional-day-status{margin-top:3px;min-height:14px;display:flex;align-items:center;justify-content:center;gap:4px;font-size:10px;line-height:1.1;color:#716c78}
      #agendaGrid .bm-prof-head .status-dot{width:6px;height:6px;border-radius:50%;background:#98a2b3;display:inline-block}
      #agendaGrid .bm-prof-head .professional-day-status.is-working .status-dot{background:#159957}.bm-prof-head .professional-day-status.is-late .status-dot{background:#d97706}.bm-prof-head .professional-day-status.is-absent{color:#b42318}.bm-prof-head .professional-day-status.is-absent .status-dot{background:#d92d20}
      #agendaGrid .bm-body-v3{display:grid;grid-template-columns:76px repeat(4,185px) 220px;position:relative}
      #agendaGrid .bm-time-lane{position:sticky;left:0;z-index:20;background:#fff;border-right:1px solid #ece9f0;background-image:repeating-linear-gradient(to bottom,#ece9f0 0,#ece9f0 1px,transparent 1px,transparent ${ROW_HEIGHT}px)}
      #agendaGrid .bm-time-label{height:${ROW_HEIGHT}px;display:flex;align-items:flex-start;justify-content:center;padding-top:11px;box-sizing:border-box;font-size:13px;font-weight:800;color:#17131f}
      #agendaGrid .bm-lane{position:relative;background:#fff;overflow:visible;border-right:1px solid #ece9f0;background-image:repeating-linear-gradient(to bottom,#ece9f0 0,#ece9f0 1px,transparent 1px,transparent ${ROW_HEIGHT}px)}
      #agendaGrid .bm-lane:last-child{border-right:0}
      #agendaGrid .bm-segment-v3{position:absolute;left:0;right:0;box-sizing:border-box;overflow:hidden;padding:8px 10px 7px;border-left:3px solid #68666f;background:#f5f4f6;z-index:5;cursor:pointer}
      #agendaGrid .bm-segment-v3:hover{filter:brightness(.985)}
      #agendaGrid .bm-segment-v3.progress{background:#eaf8f0;border-left-color:#178a5b}.bm-segment-v3.finished{background:#fdeaea;border-left-color:#c62828}.bm-segment-v3.sos{background:#f2eaff;border-left-color:var(--purple);z-index:8}
      #agendaGrid .bm-segment-v3 strong,#agendaGrid .bm-segment-v3 span,#agendaGrid .bm-segment-v3 small{display:block}
      #agendaGrid .bm-segment-v3 strong{font-size:13px;line-height:1.15;font-weight:900;color:#17131f}.bm-segment-v3 span{font-size:10.5px;line-height:1.25;margin-top:3px;color:#3f3945}.bm-segment-v3 small{font-size:9.5px;line-height:1.2;margin-top:3px;font-weight:700;color:#625c67}.bm-segment-v3.sos small{color:#5c4b72}
      #agendaGrid .bm-free-v3{position:absolute;left:0;right:0;height:${ROW_HEIGHT}px;display:flex;align-items:center;padding-left:13px;box-sizing:border-box;color:#7a7380;font-size:12px;pointer-events:none}
      #agendaGrid .bm-now-line{position:absolute;left:0;right:0;height:2px;background:var(--purple);z-index:30;pointer-events:none;display:none}
      @media(max-width:780px){#agendaGrid .bm-agenda-v3{min-width:852px}#agendaGrid .bm-head-v3,#agendaGrid .bm-body-v3{grid-template-columns:62px repeat(4,150px) 190px}}
    `;
    document.head.appendChild(style);
  }

  function render() {
    const grid = document.getElementById('agendaGrid');
    if (!grid) return;
    const h=configuredHours(),start=mins(h.open),end=mins(h.close),step=interval(),slots=Math.ceil(Math.max(step,end-start)/step),bodyHeight=slots*ROW_HEIGHT,s=state(),day=dateKey();
    const apps=s.appointments.filter(a=>a?.date===day&&String(a.status||'').toLowerCase()!=='cancelado');
    const sos=s.opportunities.filter(o=>{if(!o||o.date!==day||o.source!=='sos')return false;const status=String(o.status||'').toLowerCase();return!['cancelada','cancelado'].includes(status)&&(status!=='resolved'||!o.appointmentId)});
    const statusData=read('beautymove.mvp.professional.daily-status',{}),statusFor=name=>statusData?.[`${day}::${name}`]?.status||'unregistered',statusLabels={unregistered:'Sem registro',working:'Presença registrada',late:'Atraso registrado',absent:'Ausência registrada'};
    const segmentMarkup=(item,isSos)=>{const itemStart=mins(item.time),itemEnd=itemStart+durationOf(item),visibleStart=Math.max(start,itemStart),visibleEnd=Math.min(end,itemEnd);if(visibleEnd<=start||visibleStart>=end)return'';const top=(visibleStart-start)*ROW_HEIGHT/step,height=Math.max(22,(visibleEnd-visibleStart)*ROW_HEIGHT/step-2),service=isSos?(item.service||item.specialty||'Necessidade'):(servicesOf(item).map(x=>x.name).filter(Boolean).join(' + ')||item.service||'Atendimento'),progress=!isSos&&['em_andamento','chegou'].includes(item.status),finished=!isSos&&['finalizado','concluido'].includes(item.status),cls=isSos?'sos':progress?'progress':finished?'finished':'';return`<div class="bm-segment-v3 ${cls}" style="top:${top}px;height:${height}px" data-segment-id="${esc(item.id)}" data-appointment-id="${isSos?'':esc(item.id)}" data-sos-id="${isSos?esc(item.id):''}"><strong>${esc(item.client||'Cliente')}</strong><span>${esc(service)}</span><small>${esc(item.time||'')} – ${esc(time(itemEnd))} · ${durationLabel(durationOf(item))}</small>${isSos?`<small>Profissional: ${esc(item.acceptedBy||item.professional||'Aguardando profissional')}</small>`:''}</div>`};
    const laneMarkup=person=>{const items=apps.filter(a=>a.professional===person.name),freeLabels=Array.from({length:slots},(_,i)=>`<div class="bm-free-v3" style="top:${i*ROW_HEIGHT}px">Livre</div>`).join(''),segments=items.map(a=>segmentMarkup(a,false)).join('');return`<div class="bm-lane" data-lane="${esc(person.name)}" style="height:${bodyHeight}px">${freeLabels}${segments}</div>`};
    const sosSegments=sos.map(o=>segmentMarkup(o,true)).join(''),sosFreeLabels=Array.from({length:slots},(_,i)=>`<div class="bm-free-v3" style="top:${i*ROW_HEIGHT}px">Livre</div>`).join('');
    const header=`<div class="bm-time-head">Horário</div><div class="bm-specialty blue" style="grid-column:2 / span 2;grid-row:1">Cabelos</div><div class="bm-specialty rose" style="grid-column:4;grid-row:1">Mãos e Pés</div><div class="bm-specialty green" style="grid-column:5;grid-row:1">Estética</div><div class="bm-sos-head"><strong>S.O.S.</strong><span>${sos.length?`${sos.length} oportunidade${sos.length>1?'s':''}`:'Aguardando ação'}</span></div>${PEOPLE.map((p,i)=>{const st=statusFor(p.name);return`<div class="bm-prof-head professional-header-control" style="grid-column:${i+2};grid-row:2" tabindex="0"><span class="professional-name">${esc(p.name)}</span><span class="professional-day-status is-${esc(st)}"><i class="status-dot"></i><span>${statusLabels[st]||'Sem registro'}</span></span></div>`}).join('')}`;
    const timeLabels=Array.from({length:slots},(_,i)=>`<div class="bm-time-label">${esc(time(start+i*step))}</div>`).join('');
    grid.innerHTML=`<div class="agenda-scroll-v3"><div class="bm-agenda-v3"><div class="bm-head-v3">${header}</div><div class="bm-body-v3" style="height:${bodyHeight}px"><div class="bm-time-lane" style="height:${bodyHeight}px">${timeLabels}</div>${PEOPLE.map(laneMarkup).join('')}<div class="bm-lane sos-column" data-lane="sos" style="height:${bodyHeight}px">${sosFreeLabels}${sosSegments}</div></div></div></div>`;
    const body=grid.querySelector('.bm-body-v3');if(body){const line=document.createElement('div');line.className='bm-now-line';body.appendChild(line);const updateNow=()=>{const d=new Date(),today=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,current=d.getHours()*60+d.getMinutes(),y=(current-start)*ROW_HEIGHT/step;line.style.top=`${Math.max(0,Math.min(bodyHeight-2,y))}px`;line.style.display=dateKey()===today&&current>=start&&current<=end?'block':'none'};updateNow();clearInterval(window.__bmAgendaNowTimer);window.__bmAgendaNowTimer=setInterval(updateNow,30000)}
    document.getElementById('agendaDate').textContent=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(`${day}T12:00:00`));const picker=document.getElementById('agendaDatePicker');if(picker)picker.value=day;bindGrid();
  }

  function openModal(modal){modal?.classList.add('is-open');modal?.setAttribute('aria-hidden','false')}
  function closeModal(modal){modal?.classList.remove('is-open');modal?.setAttribute('aria-hidden','true')}
  function fillTimeOptions(){const h=configuredHours(),values=[];for(let m=mins(h.open);m<=mins(h.close);m+=30)values.push(time(m));const html=values.map(v=>`<option value="${v}">${v}</option>`).join('');['appointmentTime','sosTime'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html})}
  function readSelectedServices(){try{return JSON.parse(document.getElementById('selectedServices')?.value||'[]')}catch{return[]}}
  function setServices(selected){const list=Array.isArray(selected)?selected:[],hidden=document.getElementById('selectedServices'),duration=document.getElementById('appointmentDuration'),value=document.getElementById('appointmentValue'),button=document.getElementById('appointmentServiceButtonText'),preview=document.getElementById('appointmentServicePreview');if(hidden)hidden.value=JSON.stringify(list);if(duration)duration.value=list.reduce((n,x)=>n+Number(x.duration||0),0);if(value)value.value=currency(list.reduce((n,x)=>n+Number(x.value||0),0));if(button)button.textContent=list.length?`${list.length} serviço${list.length>1?'s':''} selecionado${list.length>1?'s':''}`:'Selecionar serviços';if(preview)preview.innerHTML=list.map(x=>`<span class="appointment-service-chip">${esc(x.name)}</span>`).join('')}
  function openNewAppointment(timeValue='08:00',professional='Ana'){fillTimeOptions();document.getElementById('appointmentId').value='';document.getElementById('appointmentClient').value='';document.getElementById('appointmentProfessional').value=professional;document.getElementById('appointmentTime').value=timeValue;document.getElementById('appointmentMode').textContent='NOVO AGENDAMENTO';document.getElementById('appointmentTitle').textContent='Agendar cliente';document.getElementById('appointmentStatusField').style.display='none';setServices([]);openModal(document.getElementById('appointmentModal'))}
  function openDetails(id){const item=state().appointments.find(a=>String(a.id)===String(id));if(!item)return;window.__bmCurrentAppointmentId=item.id;const modal=document.getElementById('detailsModal'),content=document.getElementById('detailsContent'),actions=document.getElementById('detailsActions');if(!modal||!content||!actions)return;actions.dataset.appointmentId=item.id;actions.dataset.sosId='';content.innerHTML=`<div class="detail-topline"><div><span class="detail-label">Cliente</span><strong>${esc(item.client||'Cliente')}</strong></div><div><span class="detail-label">Profissional</span><strong>${esc(item.professional||'A definir')}</strong></div><span class="agenda-status status-scheduled">Agendado</span></div><div class="detail-meta-grid"><div><span class="detail-label">Horário</span><strong>${esc(item.time)} – ${esc(endOf(item))}</strong></div><div><span class="detail-label">Duração</span><strong>${durationLabel(durationOf(item))}</strong></div><div><span class="detail-label">Valor</span><strong>${currency(item.value)}</strong></div></div><div class="detail-section"><h3>Serviços</h3><div class="service-detail-list">${servicesOf(item).map(s=>`<div><span>${esc(s.name)}</span><span>${durationLabel(s.duration)}</span></div>`).join('')}</div></div>`;actions.innerHTML='<button type="button" class="action-button" data-detail-action="reschedule">Alterar horário</button><button type="button" class="action-button action-success" data-detail-action="arrived">Registrar chegada</button><button type="button" class="action-button action-danger" data-detail-action="finish">Finalizar atendimento</button><button type="button" class="action-button action-cancel" data-detail-action="cancel">Cancelar atendimento</button>';openModal(modal)}
  function showSosDetails(op){const modal=document.getElementById('detailsModal'),content=document.getElementById('detailsContent'),actions=document.getElementById('detailsActions');if(!modal||!content||!actions)return;actions.dataset.sosId=op.id;actions.dataset.appointmentId=op.appointmentId||'';content.innerHTML=`<div class="detail-topline"><div><span class="detail-label">Cliente</span><strong>${esc(op.client||'Cliente')}</strong></div><div><span class="detail-label">Profissional</span><strong>${esc(op.acceptedBy||'Aguardando profissional')}</strong></div><span class="agenda-status status-sos">S.O.S.</span></div><div class="detail-meta-grid"><div><span class="detail-label">Horário</span><strong>${esc(op.time)} – ${esc(time(mins(op.time)+durationOf(op)))}</strong></div><div><span class="detail-label">Duração</span><strong>${durationLabel(durationOf(op))}</strong></div></div><div class="detail-section"><h3>Serviço</h3><div class="service-detail-list"><div><span>${esc(op.service||op.specialty||'Necessidade')}</span><span>${durationLabel(durationOf(op))}</span></div></div></div>`;actions.innerHTML='<button type="button" class="action-button action-cancel" data-sos-action="cancel">Cancelar S.O.S.</button>';openModal(modal)}
  function openSosModal(timeValue){fillTimeOptions();document.getElementById('sosTime').value=timeValue||configuredHours().open;openModal(document.getElementById('sosModal'))}

  function bindGrid(){const grid=document.getElementById('agendaGrid');if(!grid||grid.dataset.bmCoreBound==='1')return;grid.dataset.bmCoreBound='1';grid.addEventListener('click',event=>{const segment=event.target.closest('.bm-segment-v3');if(segment){if(segment.dataset.sosId){window.__bmCurrentSosId=segment.dataset.sosId;const op=state().opportunities.find(x=>String(x.id)===String(segment.dataset.sosId));if(op)showSosDetails(op)}else openDetails(segment.dataset.appointmentId);return}const lane=event.target.closest('.bm-lane[data-lane]');if(!lane||event.target.closest('.bm-segment-v3'))return;const scroll=grid.querySelector('.agenda-scroll-v3'),y=event.clientY-lane.getBoundingClientRect().top+(scroll?.scrollTop||0),slot=Math.max(0,Math.floor(y/ROW_HEIGHT));if(lane.dataset.lane==='sos')openSosModal(time(mins(configuredHours().open)+slot*interval()));else openNewAppointment(time(mins(configuredHours().open)+slot*interval()),lane.dataset.lane)})}
  function bindServiceModal(){document.getElementById('openServicesFromAppointment')?.addEventListener('click',()=>{const selected=readSelectedServices(),list=document.getElementById('serviceList');if(!list)return;list.innerHTML=SERVICES.map(s=>`<label class="service-option"><input type="checkbox" data-service="${esc(s.name)}" ${selected.some(x=>x.name===s.name)?'checked':''}><span><strong>${esc(s.name)}</strong><small>${durationLabel(s.duration)} · ${currency(s.value)}</small></span></label>`).join('');openModal(document.getElementById('servicesModal'))});document.getElementById('saveServicesButton')?.addEventListener('click',()=>{const list=document.getElementById('serviceList'),selected=SERVICES.filter(s=>list?.querySelector(`input[data-service="${CSS.escape(s.name)}"]`)?.checked).map(s=>({...s}));if(!selected.length){showNotice('Selecione pelo menos um serviço.');return}setServices(selected);closeModal(document.getElementById('servicesModal'))})}
  function bindForms(){document.querySelectorAll('[data-close-modal],.modal-close').forEach(btn=>btn.addEventListener('click',e=>{const modal=e.target.closest('.modal');if(modal)closeModal(modal)}));document.getElementById('newAppointmentBtn')?.addEventListener('click',()=>openNewAppointment(configuredHours().open,'Ana'));document.getElementById('appointmentForm')?.addEventListener('submit',e=>{e.preventDefault();const services=readSelectedServices();if(!services.length){showNotice('Selecione pelo menos um serviço.');return}const id=document.getElementById('appointmentId').value||`apt-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,current=state(),existing=current.appointments.find(a=>String(a.id)===String(id)),item={...(existing||{}),id,date:dateKey(),client:document.getElementById('appointmentClient').value.trim()||'Cliente',professional:document.getElementById('appointmentProfessional').value,time:document.getElementById('appointmentTime').value,services,service:services.map(s=>s.name).join(' + '),duration:services.reduce((n,s)=>n+Number(s.duration||0),0),durationMinutes:services.reduce((n,s)=>n+Number(s.duration||0),0),value:services.reduce((n,s)=>n+Number(s.value||0),0),status:existing?.status||'agendado'};if(existing)Object.assign(existing,item);else current.appointments.push(item);write(current);closeModal(document.getElementById('appointmentModal'));render()});document.getElementById('sosForm')?.addEventListener('submit',e=>{e.preventDefault();const serviceText=document.getElementById('sosService').value.trim();if(!serviceText)return;const names=serviceText.split('+').map(v=>v.trim()).filter(Boolean),services=names.map(name=>{const known=SERVICES.find(s=>s.name.toLowerCase()===name.toLowerCase());return known?{...known}:{name,duration:30,value:0}}),current=state(),id=`sos-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;current.opportunities.push({id,source:'sos',date:dateKey(),client:document.getElementById('sosClient').value.trim()||'Cliente',service:serviceText,servicesSnapshot:services,durationSnapshot:services.reduce((n,s)=>n+Number(s.duration||0),0),value:services.reduce((n,s)=>n+Number(s.value||0),0),specialty:document.getElementById('sosSpecialty').value,professional:document.getElementById('sosProfessional').value.trim(),time:document.getElementById('sosTime').value,radius:document.getElementById('sosRadius').value,status:'searching'});write(current);closeModal(document.getElementById('sosModal'));render();window.dispatchEvent(new CustomEvent('beautymove:sos-created'));window.dispatchEvent(new CustomEvent('beautymove:sos-runtime-refresh'))})}
  function bindToolbar(){const picker=document.getElementById('agendaDatePicker'),setDate=value=>{if(!value)return;if(picker)picker.value=value;render()};document.getElementById('prevDay')?.addEventListener('click',()=>{const d=new Date(`${dateKey()}T12:00:00`);d.setDate(d.getDate()-1);setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)});document.getElementById('nextDay')?.addEventListener('click',()=>{const d=new Date(`${dateKey()}T12:00:00`);d.setDate(d.getDate()+1);setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)});document.getElementById('todayBtn')?.addEventListener('click',()=>{const d=new Date();setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)});document.getElementById('agendaInterval')?.addEventListener('change',render);picker?.addEventListener('change',render);document.getElementById('calendarBtn')?.addEventListener('click',()=>picker?.showPicker?.())}
  function bindDetailsActions(){document.addEventListener('click',event=>{const action=event.target.closest('#detailsActions [data-detail-action]');if(!action)return;const id=document.getElementById('detailsActions')?.dataset?.appointmentId;if(!id)return;const current=state(),item=current.appointments.find(a=>String(a.id)===String(id));if(!item)return;if(action.dataset.detailAction==='arrived')item.status='em_andamento';if(action.dataset.detailAction==='finish')item.status='finalizado';if(action.dataset.detailAction==='cancel')item.status='cancelado';if(action.dataset.detailAction==='reschedule'){closeModal(document.getElementById('detailsModal'));openNewAppointment(item.time,item.professional);document.getElementById('appointmentId').value=item.id;document.getElementById('appointmentClient').value=item.client||'';setServices(servicesOf(item))}else{write(current);closeModal(document.getElementById('detailsModal'));render()}})}

  function boot(){injectStyles();bindToolbar();bindForms();bindServiceModal();bindDetailsActions();render();window.addEventListener('beautymove:agenda-hydrated',render);window.addEventListener('beautymove:agenda-external-state',render);window.addEventListener('beautymove:sos-runtime-refresh',render);window.addEventListener('beautymove:sos-created',render)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
