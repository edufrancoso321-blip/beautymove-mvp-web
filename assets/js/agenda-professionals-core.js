/* BeautyMove — Agenda Profissionais Core V1
 * Responsabilidade única: agenda convencional do salão.
 * NÃO lê, renderiza ou modifica opportunities/S.O.S.
 * Um atendimento = um único bloco visual. Zero rowspan.
 */
(function(){
  'use strict';
  if(document.body?.dataset?.role!=='salao') return;

  const STATE_KEY='beautymove.mvp.state';
  const HOURS_KEY='beautymove.mvp.agenda.hours';
  const PEOPLE=[
    {name:'Ana',specialty:'Cabelos',group:'blue'},
    {name:'Bruna',specialty:'Cabelos',group:'blue'},
    {name:'Paula',specialty:'Mãos e Pés',group:'rose'},
    {name:'Carla',specialty:'Estética',group:'green'}
  ];
  const SERVICES=[
    {name:'Corte',duration:60,value:80},{name:'Escova',duration:30,value:60},{name:'Coloração',duration:120,value:150},{name:'Luzes',duration:180,value:250},
    {name:'Corte feminino',duration:60,value:80},{name:'Corte masculino',duration:45,value:50},{name:'Manicure',duration:60,value:55},{name:'Pedicure',duration:60,value:65},
    {name:'Limpeza de pele',duration:75,value:120},{name:'Design de sobrancelhas',duration:45,value:60}
  ];
  const DEFAULT_HOURS={open:'08:00',close:'18:00'};
  const ROW_HEIGHT=68;
  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw==null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=value=>{localStorage.setItem(STATE_KEY,JSON.stringify(value));window.BeautyMoveAgendaPersistence?.syncNow?.()};
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const mins=v=>{const p=String(v||'00:00').split(':').map(Number);return(p[0]||0)*60+(p[1]||0)};
  const time=v=>`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
  const durationLabel=v=>{const n=Math.max(0,Number(v)||0),h=Math.floor(n/60),m=n%60;return h?(m?`${h}h ${m}min`:`${h}h`):`${m}min`};
  const dateKey=()=>{const p=document.getElementById('agendaDatePicker');if(p?.value)return p.value;const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const interval=()=>Number(document.getElementById('agendaInterval')?.value||60);
  const configuredHours=()=>{const week=read(HOURS_KEY,null),d=new Date(`${dateKey()}T12:00:00`);if(Array.isArray(week)&&week[d.getDay()])return{open:week[d.getDay()].open||DEFAULT_HOURS.open,close:week[d.getDay()].close||DEFAULT_HOURS.close};return DEFAULT_HOURS};
  const state=()=>{const v=read(STATE_KEY,{});return{appointments:Array.isArray(v?.appointments)?v.appointments:[],transactions:Array.isArray(v?.transactions)?v.transactions:[]}};
  const servicesOf=item=>{if(Array.isArray(item?.services)&&item.services.length)return item.services;if(Array.isArray(item?.servicesSnapshot)&&item.servicesSnapshot.length)return item.servicesSnapshot;if(item?.service)return String(item.service).split('+').map(n=>n.trim()).filter(Boolean).map(name=>{const k=SERVICES.find(s=>s.name.toLowerCase()===name.toLowerCase());return k?{...k}:{name,duration:Number(item.duration)||30,value:0}});return[]};
  const durationOf=item=>{const d=servicesOf(item).reduce((s,x)=>s+(Number(x?.duration)||Number(x?.durationMinutes)||0),0);return d||Number(item?.durationSnapshot)||Number(item?.durationMinutes)||Number(item?.duration)||30};
  const endOf=item=>time(mins(item?.time)+durationOf(item));

  function styles(){if(document.getElementById('bmAgendaProfessionalsCoreStyles'))return;const s=document.createElement('style');s.id='bmAgendaProfessionalsCoreStyles';s.textContent=`
    #agendaGrid .bm-ap-scroll{width:100%;height:100%;overflow:auto;overflow-y:scroll;overflow-x:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:#fff}
    #agendaGrid .bm-ap{min-width:816px;width:100%;background:#fff}
    #agendaGrid .bm-ap-head,#agendaGrid .bm-ap-body{display:grid;grid-template-columns:76px repeat(4,minmax(0,1fr));width:100%;position:relative}
    #agendaGrid .bm-ap-head{position:sticky;top:0;z-index:80;background:#fff}
    #agendaGrid .bm-ap-specialty{height:36px;display:flex;align-items:center;justify-content:center;border-right:1px solid #ece9f0;border-bottom:1px solid #ece9f0;font-size:15px;font-weight:850;color:#625b6c;position:relative}
    #agendaGrid .bm-ap-specialty:after{content:'';position:absolute;left:12px;right:12px;bottom:0;height:6px;border-radius:6px 6px 0 0}.bm-ap-specialty.blue:after{background:#e7f1ff}.bm-ap-specialty.rose:after{background:#fce8e8}.bm-ap-specialty.green:after{background:#e7f6ec}
    #agendaGrid .bm-ap-time-head{grid-column:1;grid-row:1 / span 2;height:82px;position:sticky;left:0;z-index:100;display:flex;align-items:center;justify-content:center;border-right:1px solid #ece9f0;border-bottom:1px solid #ece9f0;font-size:13px;font-weight:800;background:#fff}
    #agendaGrid .bm-ap-prof-head{height:46px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:5px 8px 8px;box-sizing:border-box;border-right:1px solid #ece9f0;border-bottom:1px solid #ece9f0;background:#fff;cursor:pointer}.bm-ap-prof-head .professional-name{font-size:16px;line-height:1.15;font-weight:900;color:#17131f}.bm-ap-prof-head .professional-day-status{margin-top:3px;min-height:14px;display:flex;align-items:center;justify-content:center;gap:4px;font-size:10px;color:#716c78}.bm-ap-prof-head .status-dot{width:6px;height:6px;border-radius:50%;background:#98a2b3}.bm-ap-prof-head .is-working .status-dot{background:#159957}.bm-ap-prof-head .is-late .status-dot{background:#d97706}.bm-ap-prof-head .is-absent{color:#b42318}.bm-ap-prof-head .is-absent .status-dot{background:#d92d20}
    #agendaGrid .bm-ap-time{position:sticky;left:0;z-index:20;background:#fff;border-right:1px solid #ece9f0;background-image:repeating-linear-gradient(to bottom,#ece9f0 0,#ece9f0 1px,transparent 1px,transparent ${ROW_HEIGHT}px)}.bm-ap-time-label{height:${ROW_HEIGHT}px;display:flex;align-items:flex-start;justify-content:center;padding-top:11px;box-sizing:border-box;font-size:13px;font-weight:800;color:#17131f}
    #agendaGrid .bm-ap-lane{position:relative;background:#fff;overflow:visible;border-right:1px solid #ece9f0;background-image:repeating-linear-gradient(to bottom,#ece9f0 0,#ece9f0 1px,transparent 1px,transparent ${ROW_HEIGHT}px)}
    #agendaGrid .bm-ap-free{position:absolute;left:0;right:0;height:${ROW_HEIGHT}px;display:flex;align-items:center;padding-left:13px;box-sizing:border-box;color:#7a7380;font-size:12px;pointer-events:none}
    #agendaGrid .bm-ap-event{position:absolute;left:0;right:0;box-sizing:border-box;overflow:hidden;padding:8px 10px 7px;border-left:3px solid #68666f;background:#f5f4f6;z-index:5;cursor:pointer}.bm-ap-event.progress{background:#eaf8f0;border-left-color:#178a5b}.bm-ap-event.finished{background:#fdeaea;border-left-color:#c62828}.bm-ap-event strong,.bm-ap-event span,.bm-ap-event small{display:block}.bm-ap-event strong{font-size:13px;line-height:1.15;font-weight:900;color:#17131f}.bm-ap-event span{font-size:10.5px;line-height:1.25;margin-top:3px;color:#3f3945}.bm-ap-event small{font-size:9.5px;line-height:1.2;margin-top:3px;font-weight:700;color:#625c67}
    #agendaGrid .bm-ap-now{position:absolute;left:0;right:0;height:2px;background:var(--purple);z-index:30;pointer-events:none;display:none}
    @media(max-width:780px){#agendaGrid .bm-ap{min-width:662px}#agendaGrid .bm-ap-head,#agendaGrid .bm-ap-body{grid-template-columns:62px repeat(4,150px);width:max-content}}
  `;document.head.appendChild(s)}

  function render(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;styles();
    const h=configuredHours(),start=mins(h.open),end=mins(h.close),step=interval(),slots=Math.ceil(Math.max(step,end-start)/step),height=slots*ROW_HEIGHT,day=dateKey();
    const apps=state().appointments.filter(a=>a?.date===day&&String(a.status||'').toLowerCase()!=='cancelado');
    const statusData=read('beautymove.mvp.professional.daily-status',{}),statusFor=name=>statusData?.[`${day}::${name}`]?.status||'unregistered',labels={unregistered:'Sem registro',working:'Presença registrada',late:'Atraso registrado',absent:'Ausência registrada'};
    const event=item=>{const a=mins(item.time),b=a+durationOf(item),vs=Math.max(start,a),ve=Math.min(end,b);if(ve<=start||vs>=end)return'';const top=(vs-start)*ROW_HEIGHT/step,ht=Math.max(22,(ve-vs)*ROW_HEIGHT/step-2),progress=['em_andamento','chegou'].includes(item.status),finished=['finalizado','concluido'].includes(item.status),service=servicesOf(item).map(x=>x.name).filter(Boolean).join(' + ')||item.service||'Atendimento';return`<div class="bm-ap-event ${progress?'progress':''} ${finished?'finished':''}" style="top:${top}px;height:${ht}px" data-appointment-id="${esc(item.id)}"><strong>${esc(item.client||'Cliente')}</strong><span>${esc(service)}</span><small>${esc(item.time||'')} – ${esc(time(b))} · ${durationLabel(durationOf(item))}</small></div>`};
    const lane=p=>{const items=apps.filter(a=>a.professional===p.name);const free=Array.from({length:slots},(_,i)=>`<div class="bm-ap-free" style="top:${i*ROW_HEIGHT}px">Livre</div>`).join('');return`<div class="bm-ap-lane" data-lane="${esc(p.name)}" style="height:${height}px">${free}${items.map(event).join('')}</div>`};
    const labelsTime=Array.from({length:slots},(_,i)=>`<div class="bm-ap-time-label">${esc(time(start+i*step))}</div>`).join('');
    const header=`<div class="bm-ap-time-head">Horário</div><div class="bm-ap-specialty blue" style="grid-column:2 / span 2;grid-row:1">Cabelos</div><div class="bm-ap-specialty rose" style="grid-column:4;grid-row:1">Mãos e Pés</div><div class="bm-ap-specialty green" style="grid-column:5;grid-row:1">Estética</div>${PEOPLE.map(p=>{const st=statusFor(p.name),cls=st==='working'?'is-working':st==='late'?'is-late':st==='absent'?'is-absent':'';return`<div class="bm-ap-prof-head" data-professional="${esc(p.name)}" style="grid-column:${PEOPLE.indexOf(p)+2};grid-row:2"><span class="professional-name">${esc(p.name)}</span><span class="professional-day-status ${cls}"><i class="status-dot"></i>${esc(labels[st]||labels.unregistered)}</span></div>`}).join('')}`;
    const body=`<div class="bm-ap-time" style="height:${height}px">${labelsTime}</div>${PEOPLE.map(p=>lane(p)).join('')}`;
    grid.innerHTML=`<div class="bm-ap-scroll"><div class="bm-ap"><div class="bm-ap-head">${header}</div><div class="bm-ap-body" style="height:${height}px">${body}<div class="bm-ap-now" id="bmAgendaNow"></div></div></div></div>`;
    grid.querySelectorAll('[data-appointment-id]').forEach(el=>el.addEventListener('click',()=>openDetails(el.dataset.appointmentId)));
    updateNow(start,end,step,height);
  }

  function updateNow(start,end,step,height){const el=document.getElementById('bmAgendaNow');if(!el)return;const now=new Date(),v=now.getHours()*60+now.getMinutes();if(v<start||v>end){el.style.display='none';return}el.style.display='block';el.style.top=`${(v-start)*ROW_HEIGHT/step}px`;}
  function notice(msg){const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmAgendaNotice);window.__bmAgendaNotice=setTimeout(()=>n.hidden=true,3200)}
  function openDetails(id){const item=state().appointments.find(a=>String(a.id)===String(id));if(!item)return;const modal=document.getElementById('detailsModal'),content=document.getElementById('detailsContent'),actions=document.getElementById('detailsActions');if(!modal||!content)return;content.innerHTML=`<div class="detail-summary"><strong>${esc(item.client||'Cliente')}</strong><span>${esc(item.professional||'')}</span><span>${esc(item.time||'')} – ${esc(endOf(item))}</span><span>${esc(servicesOf(item).map(x=>x.name).join(' + '))}</span></div>`;if(actions)actions.innerHTML='';modal.setAttribute('aria-hidden','false');modal.classList.add('open')}
  function closeModals(){document.querySelectorAll('.modal.open').forEach(m=>{m.classList.remove('open');m.setAttribute('aria-hidden','true')})}
  function bind(){
    document.getElementById('todayBtn')?.addEventListener('click',render);document.getElementById('prevDay')?.addEventListener('click',()=>shiftDate(-1));document.getElementById('nextDay')?.addEventListener('click',()=>shiftDate(1));document.getElementById('agendaDatePicker')?.addEventListener('change',render);document.getElementById('agendaInterval')?.addEventListener('change',render);
    document.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',closeModals));
    window.addEventListener('beautymove:agenda-professionals-changed',render);window.addEventListener('beautymove:appointment-changed',render);window.addEventListener('storage',e=>{if(e.key===STATE_KEY||e.key==='beautymove.mvp.professional.daily-status')render()});
    document.getElementById('newAppointmentBtn')?.addEventListener('click',()=>{const m=document.getElementById('appointmentModal');if(m){m.setAttribute('aria-hidden','false');m.classList.add('open')}});
  }
  function shiftDate(delta){const p=document.getElementById('agendaDatePicker');const d=p?.value?new Date(`${p.value}T12:00:00`):new Date();d.setDate(d.getDate()+delta);if(p)p.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;render()}
  function boot(){bind();render();window.BeautyMoveAgendaProfessionals={render,readState:state,writeState:write,durationOf};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
