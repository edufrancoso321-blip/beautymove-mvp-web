/* BeautyMove — cabeçalho fixo, ocorrências e controle correto do intervalo da Agenda. */
(function(){
  'use strict';
  const KEY='beautymove.mvp.professional.daily-status';
  const HOURS_KEY='beautymove.mvp.agenda.hours';
  const PEOPLE=['Ana','Bruna','Paula','Carla'];
  let lastSignature='';

  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}};
  const dateKey=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const mins=v=>{const [h,m]=String(v||'00:00').split(':').map(Number);return (Number(h)||0)*60+(Number(m)||0);};

  function styles(){
    if(document.getElementById('agendaStickyOccurrenceStyles'))return;
    const s=document.createElement('style');
    s.id='agendaStickyOccurrenceStyles';
    s.textContent=`
      .agenda-grid{border-collapse:separate!important;border-spacing:0!important}
      .agenda-grid thead{position:relative!important;z-index:50!important}
      .agenda-grid thead tr.agenda-specialty-row th{position:sticky!important;top:0!important;z-index:52!important;height:36px!important;min-height:36px!important;padding:5px 10px 4px!important;background:#fff!important}
      .agenda-grid thead tr.agenda-professional-row th{position:sticky!important;top:36px!important;z-index:51!important;min-height:48px!important;padding:5px 8px 6px!important;background:#fff!important}
      .agenda-grid thead tr.agenda-specialty-row th.sos-col.agenda-sos-header-clean{position:sticky!important;top:0!important;z-index:56!important;background:#fff!important}
      .agenda-grid thead tr.agenda-professional-row th.sos-col.agenda-sos-action{position:sticky!important;top:36px!important;z-index:55!important;background:#fff!important}
      .agenda-grid thead tr.agenda-specialty-row th.sos-col.agenda-sos-header-clean::after,.agenda-grid thead tr.agenda-professional-row th.sos-col.agenda-sos-action::after{content:''!important;display:block!important;height:6px!important;margin:7px 0 0!important;border-radius:999px!important;background:#7438F5!important}
      .agenda-grid thead tr.agenda-professional-row th:not(.sos-col)::after{content:''!important;display:block!important;height:6px!important;margin:7px 0 0!important;border-radius:999px!important}
      .agenda-grid thead tr.agenda-professional-row th[data-professional="Ana"]::after,.agenda-grid thead tr.agenda-professional-row th[data-professional="Bruna"]::after{background:#e4efff!important}
      .agenda-grid thead tr.agenda-professional-row th[data-professional="Paula"]::after{background:#fde7e9!important}
      .agenda-grid thead tr.agenda-professional-row th[data-professional="Carla"]::after{background:#e3f4e9!important}
      .agenda-grid thead tr.agenda-specialty-row th.time-col{z-index:58!important}.agenda-grid thead tr.agenda-professional-row th.time-col{z-index:57!important}
      .agenda-grid thead th.sos-col .sos-title{font-size:16px!important;line-height:1.15!important;color:#7438F5!important}
      .agenda-grid thead th.sos-col.agenda-sos-action .sos-action-label{font-size:12px!important;line-height:1.2!important;color:#7438F5!important}
      .agenda-grid tbody th.time-col,.agenda-grid tbody td{height:48px!important;min-height:48px!important;padding:6px 10px!important;font-size:12px!important}
      .agenda-grid .professional-absent-period{background:#fff7f5!important}
      .agenda-grid .professional-absence-marker{display:block!important;margin-top:5px!important;font-size:10px!important;font-weight:700!important;line-height:1.2!important;color:#b42318!important}
    `;
    document.head.appendChild(s);
  }

  function readHoursForDate(){
    const fallback={open:'08:00',close:'18:00'};
    try{
      const week=JSON.parse(localStorage.getItem(HOURS_KEY)||'null');
      const date=new Date(`${dateKey()}T12:00:00`);
      if(Array.isArray(week)&&week.length===7)return week[date.getDay()]||fallback;
    }catch{}
    return fallback;
  }

  function syncTimeOptions(){
    const intervalSelect=document.getElementById('agendaInterval');
    const timeField=document.getElementById('appointmentTime');
    const sosTime=document.getElementById('sosTime');
    if(!intervalSelect||!timeField||!sosTime)return;
    const interval=Number(intervalSelect.value)||60;
    const hours=readHoursForDate();
    const start=mins(hours.open),end=mins(hours.close);
    const options=[];
    for(let value=start;value<=end;value+=interval){
      const h=String(Math.floor(value/60)).padStart(2,'0');
      const m=String(value%60).padStart(2,'0');
      options.push(`${h}:${m}`);
    }
    const current=timeField.value;
    const sosCurrent=sosTime.value;
    const html=options.map(t=>`<option value="${t}">${t}</option>`).join('');
    timeField.innerHTML=html;
    sosTime.innerHTML=html;
    if(current && !options.includes(current))timeField.insertAdjacentHTML('beforeend',`<option value="${current}">${current}</option>`);
    if(sosCurrent && !options.includes(sosCurrent))sosTime.insertAdjacentHTML('beforeend',`<option value="${sosCurrent}">${sosCurrent}</option>`);
    if(current)timeField.value=current;
    if(sosCurrent)sosTime.value=sosCurrent;
  }

  function setInitialDefaultInterval(){
    const select=document.getElementById('agendaInterval');
    if(!select||window.__beautymoveAgendaIntervalInitialized)return;
    window.__beautymoveAgendaIntervalInitialized=true;
    select.value='60';
    select.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function fixSticky(){
    const table=document.querySelector('#agendaGrid table.agenda-grid');
    if(!table)return;
    const first=table.querySelector('thead tr.agenda-specialty-row');
    const second=table.querySelector('thead tr.agenda-professional-row');
    if(!first||!second)return;
    const h=Math.ceil(first.getBoundingClientRect().height||36);
    table.style.setProperty('--agenda-specialty-height',h+'px');
    second.querySelectorAll('th').forEach(th=>th.style.setProperty('top',h+'px'));
    table.querySelectorAll('thead tr.agenda-specialty-row th.sos-col.agenda-sos-header-clean').forEach(th=>th.style.setProperty('top','0px'));
    table.querySelectorAll('thead tr.agenda-professional-row th.sos-col.agenda-sos-action').forEach(th=>th.style.setProperty('top',h+'px'));
  }

  function occurrenceFor(name){
    const r=read()[`${dateKey()}::${name}`];
    if(!r||r.status!=='absent'||!r.absenceType)return null;
    if(r.absenceType==='during_day')return {type:r.absenceType,start:r.absenceStart||'00:00',reason:r.absenceReason||'Interrupção do expediente'};
    return {type:r.absenceType,start:null,reason:r.absenceType==='full_notice'?'Ausência com aviso prévio':'Não compareceu'};
  }

  function renderOccurrences(){
    const table=document.querySelector('#agendaGrid table.agenda-grid');
    if(!table)return;
    const rows=[...table.querySelectorAll('tbody tr')];
    if(!rows.length)return;
    const professionalHeads=[...table.querySelectorAll('thead tr.agenda-professional-row th')];
    if(!professionalHeads.length)return;
    const signature=JSON.stringify([dateKey(),localStorage.getItem(KEY),rows.length,professionalHeads.length]);
    if(signature===lastSignature){fixSticky();return;}
    lastSignature=signature;
    table.querySelectorAll('.professional-absence-marker').forEach(e=>e.remove());
    table.querySelectorAll('.professional-absent-period').forEach(e=>e.classList.remove('professional-absent-period'));

    const professionalHeadList=professionalHeads.filter(th=>PEOPLE.includes(th.querySelector('.professional-name')?.textContent.trim()||''));
    const headsByName=new Map();
    professionalHeadList.forEach((th,index)=>{
      const name=th.querySelector('.professional-name')?.textContent.trim();
      headsByName.set(name,{head:th,index});
      th.dataset.professional=name;
    });

    const times=rows.map(row=>row.querySelector('th.time-col')?.textContent.trim()||'');
    PEOPLE.forEach(name=>{
      const entry=headsByName.get(name);
      const occ=occurrenceFor(name);
      if(!entry||!occ)return;
      const head=entry.head;
      const headerStatus=head.querySelector('.professional-day-status');
      if(!headerStatus?.classList.contains('is-absent'))return;
      const col=entry.index+1;
      rows.forEach((row,rowIndex)=>{
        const time=times[rowIndex]; if(!time)return;
        const current=mins(time); if(occ.type==='during_day'&&current<mins(occ.start))return;
        const cell=row.children[col]; if(!cell)return;
        cell.classList.add('professional-absent-period');
        const previousTime=rowIndex>0?times[rowIndex-1]:'';
        const shouldMark=occ.type!=='during_day'?rowIndex===0:(current>=mins(occ.start)&&(rowIndex===0||mins(previousTime)<mins(occ.start)));
        if(shouldMark&&!cell.querySelector('.professional-absence-marker')){
          const marker=document.createElement('span');
          marker.className='professional-absence-marker';
          marker.textContent=occ.type==='during_day'?`Ausente desde ${occ.start} · ${occ.reason}`:occ.reason;
          cell.appendChild(marker);
        }
      });
    });
    fixSticky();
  }

  function syncSosStatus(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    const date=dateKey();
    let state={appointments:[],opportunities:[]};
    try{state=JSON.parse(localStorage.getItem('beautymove.mvp.state')||'null')||state;}catch{}
    const appointments=Array.isArray(state.appointments)?state.appointments:[];
    const accepted=(Array.isArray(state.opportunities)?state.opportunities:[]).filter(o=>o&&o.date===date&&o.source==='sos'&&o.status==='resolved'&&o.acceptedBy);
    const cells=[...grid.querySelectorAll('[data-sos-cell="true"]')];
    cells.forEach(cell=>{cell.classList.remove('sos-cell','sos-cell-found');cell.removeAttribute('data-sos-id');cell.innerHTML='Livre';});
    accepted.forEach(item=>{
      const start=mins(item.time),cell=cells.find(c=>{const t=mins(c.dataset.time);return t>=start&&t<start+120;});
      if(!cell)return;
      const appointment=item.appointmentId?appointments.find(a=>a&&a.id===item.appointmentId):null;
      const client=item.client||appointment?.client||'Cliente';
      const service=item.service||appointment?.service||'Atendimento';
      const professional=item.acceptedBy||'Profissional selecionada';
      cell.dataset.sosId=item.id;
      cell.classList.add('sos-cell','sos-cell-found');
      cell.innerHTML=`<strong>${String(client).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}</strong><span>${String(service).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}</span><small class="sos-found-status">✓ Profissional encontrada</small><small>Profissional: ${String(professional).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}</small>`;
    });
  }

  function run(){styles();setInitialDefaultInterval();syncTimeOptions();renderOccurrences();fixSticky();syncSosStatus();}

  function boot(){
    run();
    const interval=document.getElementById('agendaInterval');
    interval?.addEventListener('change',()=>{setTimeout(syncTimeOptions,0);});
    const grid=document.getElementById('agendaGrid');
    if(grid){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;lastSignature='';run();});}).observe(grid,{childList:true,subtree:true});}
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>{lastSignature='';setTimeout(()=>{syncTimeOptions();run();},0);});
    window.addEventListener('resize',()=>{lastSignature='';fixSticky();renderOccurrences();syncSosStatus();});
    window.addEventListener('storage',()=>{lastSignature='';run();});
    window.addEventListener('beautymove:sos-accepted',()=>setTimeout(syncSosStatus,120));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,450),{once:true});else setTimeout(boot,450);
})();
