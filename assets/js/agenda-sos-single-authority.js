/* BeautyMove — S.O.S. single-render authority.
 * One state normalizer + one renderer for the S.O.S. column.
 * Prevents legacy painters from reintroducing alternate visual states.
 */
(function(){
  'use strict';
  if(document.body?.dataset?.role!=='salao') return;
  const STATE='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE,JSON.stringify(s));
  const mins=t=>{const [h,m]=String(t||'00:00').split(':').map(Number);return (Number(h)||0)*60+(Number(m)||0);};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const esc=v=>String(v==null?'':v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const services=o=>Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:Array.isArray(o?.services)?o.services:[];
  const duration=o=>Math.max(30,Number(o?.durationSnapshot||o?.durationMinutes||o?.duration)||services(o).reduce((n,s)=>n+Number(s?.duration||s?.durationMinutes||0),0)||30);
  const date=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const activeSos=o=>o&&o.source==='sos'&&o.date===date()&&!['cancelado','cancelada'].includes(o.status);
  const same=(a,b)=>a&&b&&a.date===b.date&&mins(a.time)===mins(b.time)&&String(a.client||'').trim().toLowerCase()===String(b.client||'').trim().toLowerCase();
  function normalizeState(){
    const s=read();s.appointments=Array.isArray(s.appointments)?s.appointments:[];s.opportunities=Array.isArray(s.opportunities)?s.opportunities:[];let changed=false;
    const byOp=new Map(s.opportunities.filter(o=>o&&o.source==='sos').map(o=>[String(o.id),o]));
    s.appointments.forEach(a=>{if(!a||a.source!=='sos'||!a.sosAcceptedBy)return;const linked=a.sosOpportunityId?byOp.get(String(a.sosOpportunityId)):null;const matches=s.opportunities.filter(o=>o&&o.source==='sos'&&same(o,a));const targets=linked?[linked,...matches.filter(o=>o!==linked)]:matches;targets.forEach(o=>{if(o.status!=='resolved'||o.acceptedBy!==a.sosAcceptedBy||o.appointmentId!==a.id){o.status='resolved';o.acceptedBy=a.sosAcceptedBy;o.acceptedAt=o.acceptedAt||a.sosAcceptedAt||new Date().toISOString();o.appointmentId=a.id;changed=true;}});});
    const seen=new Set();s.appointments=s.appointments.filter(a=>{if(!a||a.source!=='sos'||!a.sosAcceptedBy)return true;const key=[a.date,mins(a.time),String(a.client||'').trim().toLowerCase(),a.sosOpportunityId||''].join('|');if(seen.has(key)){changed=true;return false;}seen.add(key);return true;});
    if(changed)write(s);return s;
  }
  function cells(){const table=document.querySelector('#agendaGrid table.agenda-grid');if(!table)return [];return [...table.querySelectorAll('tbody tr')].map(row=>({row,time:row.querySelector('.time-col')?.textContent?.trim()||'',cell:row.lastElementChild})).filter(x=>x.cell);}
  function paint(){
    const list=cells();if(!list.length)return;const s=normalizeState(),d=date();
    const apps=s.appointments.filter(a=>a&&a.date===d&&a.source==='sos'&&a.status!=='cancelado'&&a.sosAcceptedBy);
    const ops=s.opportunities.filter(activeSos).filter(o=>o.status!=='resolved');
    const appByKey=new Map(apps.map(a=>[`${mins(a.time)}|${String(a.client||'').trim().toLowerCase()}`,a]));
    list.forEach(({cell})=>{cell.className='bm-sos-authority-cell';cell.removeAttribute('data-sos-cell');cell.removeAttribute('data-sos-id');cell.removeAttribute('data-appointment-id');cell.removeAttribute('data-agenda-cell');cell.style.cssText='';cell.innerHTML='Livre';});
    const draw=(item,accepted)=>{const start=mins(item.time),end=start+duration(item),endTime=item.endTime||time(end),client=item.client||'Cliente',service=item.service||services(item).map(x=>x.name).filter(Boolean).join(' + ')||'Atendimento',professional=accepted?(item.sosAcceptedBy||item.professional||'Profissional confirmada'):(item.acceptedBy||item.professional||'Buscando profissionais');list.forEach(({time:slot,cell})=>{const m=mins(slot);if(m<start||m>=end)return;const first=m===start;cell.className=`bm-sos-authority-cell ${first?'is-start':'is-continuation'}`;cell.innerHTML=first?`<strong>${esc(client)}</strong><span>${esc(service)}</span><small>${esc(item.time||'')} – ${esc(endTime)} · ${duration(item)>=60?`${Math.floor(duration(item)/60)}h${duration(item)%60?` ${duration(item)%60}min`:''}`:`${duration(item)}min`}</small><b>${accepted?'Acompanhando · '+esc(professional):'Buscando profissionais'}</b>`:`<span>${esc(client)} · até ${esc(endTime)}</span>`;cell.dataset.bmSosState=accepted?'tracking':'searching';cell.dataset.bmSosId=String(item.id||'');cell.dataset.bmSosAppointmentId=accepted?String(item.id||''):'';});};
    apps.forEach(a=>draw(a,true));ops.forEach(o=>{const key=`${mins(o.time)}|${String(o.client||'').trim().toLowerCase()}`;if(!appByKey.has(key))draw(o,false);});
  }
  function css(){if(document.getElementById('bmSosAuthorityCss'))return;const s=document.createElement('style');s.id='bmSosAuthorityCss';s.textContent=`#agendaGrid .bm-sos-authority-cell{height:48px!important;min-height:48px!important;padding:8px 10px!important;background:#f1e8ff!important;border-left:3px solid #7438F5!important;color:#17131f!important;vertical-align:top!important;cursor:pointer!important}#agendaGrid .bm-sos-authority-cell strong{display:block!important;font-size:14px!important;font-weight:900!important;line-height:1.15!important}#agendaGrid .bm-sos-authority-cell span{display:block!important;font-size:10.5px!important;line-height:1.2!important;margin-top:2px!important}#agendaGrid .bm-sos-authority-cell small{display:block!important;font-size:9.5px!important;line-height:1.2!important;margin-top:2px!important}#agendaGrid .bm-sos-authority-cell b{display:block!important;font-size:10px!important;line-height:1.2!important;margin-top:3px!important;color:#5f2bb8!important}#agendaGrid .bm-sos-authority-cell.is-continuation{padding-top:10px!important}`;document.head.appendChild(s);}
  let observer=null,queued=false;function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;paint();});}
  function boot(){css();paint();const grid=document.getElementById('agendaGrid');if(grid){observer=new MutationObserver(()=>schedule());observer.observe(grid,{childList:true,subtree:true});}window.addEventListener('beautymove:sos-accepted',schedule);window.addEventListener('beautymove:agenda-hydrated',schedule);window.addEventListener('storage',e=>{if(e.key===STATE)schedule();});window.addEventListener('pageshow',schedule);document.getElementById('agendaDatePicker')?.addEventListener('change',schedule);document.getElementById('prevDay')?.addEventListener('click',()=>setTimeout(schedule,50));document.getElementById('nextDay')?.addEventListener('click',()=>setTimeout(schedule,50));document.getElementById('todayBtn')?.addEventListener('click',()=>setTimeout(schedule,50));document.addEventListener('click',e=>{const cell=e.target.closest?.('#agendaGrid .bm-sos-authority-cell');if(!cell)return;e.preventDefault();e.stopImmediatePropagation();const id=cell.dataset.bmSosAppointmentId||cell.dataset.bmSosId;const s=read();if(cell.dataset.bmSosState==='tracking'){const a=s.appointments.find(x=>String(x.id)===String(id));if(a)window.dispatchEvent(new CustomEvent('beautymove:sos-authority-open',{detail:{appointment:a}}));}},true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,600),{once:true});else setTimeout(boot,600);
})();
