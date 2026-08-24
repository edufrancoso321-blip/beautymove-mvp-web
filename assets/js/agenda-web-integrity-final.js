/* BeautyMove — Agenda Web Integrity Final — 2026-08-24
   Desktop only. Mobile agenda remains frozen for the later responsive phase.
   Responsibilities: proportional appointment/SOS occupancy, one grid, no business-state changes. */
(function(){
  'use strict';
  if(document.body?.dataset?.role!=='salao') return;
  const STATE_KEY='beautymove.mvp.state';
  const processedTables=new WeakSet();
  let queued=false;
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback}catch{return fallback}};
  const mins=t=>{const p=String(t||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0)};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const durationLabel=m=>{m=Number(m)||0;const h=Math.floor(m/60),r=m%60;return h?(r?`${h}h ${r}min`:`${h}h`):`${r}min`};
  const serviceDuration=s=>Number(s?.duration||s?.durationMinutes||0);
  const servicesOf=a=>{if(Array.isArray(a?.services)&&a.services.length)return a.services;if(Array.isArray(a?.servicesSnapshot)&&a.servicesSnapshot.length)return a.servicesSnapshot;return a?.service?[{name:a.service,duration:Number(a.duration)||Number(a.durationMinutes)||30,value:Number(a.value)||0}]:[]};
  const durationOf=a=>{const fromServices=servicesOf(a).reduce((n,s)=>n+serviceDuration(s),0);return fromServices||Number(a?.durationSnapshot||a?.durationMinutes||a?.duration||30)||30};
  const endOf=(a,start=a?.time)=>time(mins(start)+durationOf(a));
  const dateKey=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const interval=()=>Number(document.getElementById('agendaInterval')?.value||60);
  const state=()=>{const s=read(STATE_KEY,{appointments:[],opportunities:[],transactions:[]});return{appointments:Array.isArray(s.appointments)?s.appointments:[],opportunities:Array.isArray(s.opportunities)?s.opportunities:[],transactions:Array.isArray(s.transactions)?s.transactions:[]}};
  const currentAppointments=()=>state().appointments.filter(a=>a?.date===dateKey()&&a.status!=='cancelado');
  const currentSos=()=>state().opportunities.filter(o=>o?.date===dateKey()&&o.source==='sos'&&!['resolved','cancelada','cancelado'].includes(String(o.status||'').toLowerCase()));
  const spanFor=(duration,step)=>Math.max(1,Math.ceil((Number(duration)||30)/Math.max(1,step)));

  function mergeSos(table){
    const body=table.tBodies?.[0];if(!body)return;
    const rows=[...body.rows],items=currentSos(),step=interval(),rowHeight=68;
    for(let r=0;r<rows.length;r++){
      const cell=rows[r]?.cells[5];
      if(!cell?.classList.contains('sos-cell'))continue;
      const id=cell.dataset.sosId;if(!id)continue;
      const item=items.find(x=>String(x.id)===String(id));if(!item)continue;
      const duration=Number(item.durationSnapshot||item.durationMinutes||item.duration||30)||30;
      const span=spanFor(duration,step),end=Math.min(rows.length,r+span);let actual=1;
      for(let k=r+1;k<end;k++){
        const next=rows[k]?.cells[5];if(!next)break;
        if(next.dataset.sosId&&String(next.dataset.sosId)!==String(id))break;
        next.remove();actual++;
      }
      cell.rowSpan=actual;cell.classList.add('bm-sos-span-cell');cell.style.padding='0';cell.style.verticalAlign='top';
      const visualHeight=Math.max(42,Math.min(actual*rowHeight-4,duration*(rowHeight/step)-4));
      const endTime=time(mins(item.time||'08:00')+duration),accepted=item.acceptedBy||item.professional||'Aguardando profissional';
      cell.innerHTML=`<div class="bm-sos-span-visual" style="height:${visualHeight}px"><strong>${esc(item.client||'Solicitação S.O.S.')}</strong><span>${esc(item.service||item.specialty||'Necessidade')}</span><small>${esc(item.time||'')} – ${esc(endTime)} · ${durationLabel(duration)}</small><small>Profissional: ${esc(accepted)}</small></div>`;
    }
  }

  function mergeProfessionalAppointments(table){
    const body=table.tBodies?.[0];if(!body)return;
    const rows=[...body.rows],apps=currentAppointments(),step=interval(),rowHeight=68;
    for(let col=4;col>=1;col--){
      for(let r=0;r<rows.length;r++){
        const cell=rows[r]?.cells[col],id=cell?.dataset?.appointmentId;if(!id)continue;
        const appointment=apps.find(a=>String(a.id)===String(id));if(!appointment)continue;
        const duration=durationOf(appointment),span=spanFor(duration,step),end=Math.min(rows.length,r+span);let actual=1;
        for(let k=r+1;k<end;k++){
          const next=rows[k]?.cells[col];if(!next)break;
          if(next.dataset.appointmentId&&String(next.dataset.appointmentId)!==String(id))break;
          next.remove();actual++;
        }
        cell.rowSpan=actual;cell.classList.add('bm-appointment-span-cell');cell.style.padding='0';cell.style.verticalAlign='top';
        const visualHeight=Math.max(42,Math.min(actual*rowHeight-4,duration*(rowHeight/step)-4));
        const serviceText=servicesOf(appointment).map(s=>s.name).filter(Boolean).join(' + ')||appointment.service||'Atendimento';
        cell.innerHTML=`<div class="bm-span-visual" style="height:${visualHeight}px"><strong>${esc(appointment.client||'Cliente')}</strong><span>${esc(serviceText)}</span><small>${esc(appointment.time)} – ${esc(endOf(appointment))} · ${durationLabel(duration)}</small></div>`;
      }
    }
  }

  function applyTable(table){if(!table||processedTables.has(table)||!table.tBodies?.[0])return;processedTables.add(table);mergeSos(table);mergeProfessionalAppointments(table)}
  function applyStyles(){if(document.getElementById('bmAgendaWebIntegrityStyles'))return;const link=document.createElement('link');link.id='bmAgendaWebIntegrityStyles';link.rel='stylesheet';link.href='assets/css/agenda-web-integrity-final.css?v=20260824-1';document.head.appendChild(link)}
  function scan(){queued=false;const table=document.querySelector('#agendaGrid table.agenda-grid');if(table)applyTable(table)}
  function scheduleScan(){if(queued)return;queued=true;requestAnimationFrame(scan)}
  function boot(){
    applyStyles();scheduleScan();
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    new MutationObserver(scheduleScan).observe(grid,{childList:true,subtree:true});
    document.getElementById('agendaInterval')?.addEventListener('change',scheduleScan);
    document.getElementById('agendaDatePicker')?.addEventListener('change',scheduleScan);
    window.addEventListener('beautymove:sos-runtime-refresh',scheduleScan);
    window.addEventListener('beautymove:agenda-hydrated',scheduleScan);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();