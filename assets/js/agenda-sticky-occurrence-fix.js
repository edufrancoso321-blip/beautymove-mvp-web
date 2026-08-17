/* BeautyMove — correção do cabeçalho fixo e das ocorrências após a reorganização do thead. */
(function(){
  'use strict';
  const KEY='beautymove.mvp.professional.daily-status';
  const PEOPLE=['Ana','Bruna','Paula','Carla'];
  let lastSignature='';

  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}};
  const dateKey=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const mins=v=>{const [h,m]=String(v||'00:00').split(':').map(Number);return (Number(h)||0)*60+(Number(m)||0);};
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

  function styles(){
    if(document.getElementById('agendaStickyOccurrenceStyles'))return;
    const s=document.createElement('style');
    s.id='agendaStickyOccurrenceStyles';
    s.textContent=`
      .agenda-grid{border-collapse:separate!important;border-spacing:0!important}
      .agenda-grid thead{position:relative;z-index:20}
      .agenda-grid thead tr.agenda-specialty-row th{
        position:sticky!important;
        top:0!important;
        z-index:22!important;
        background:#fff!important;
      }
      .agenda-grid thead tr.agenda-professional-row th{
        position:sticky!important;
        top:var(--agenda-specialty-height,34px)!important;
        z-index:21!important;
        background:#fff!important;
      }
      .agenda-grid thead tr.agenda-specialty-row th.time-col,
      .agenda-grid thead tr.agenda-professional-row th.time-col{
        z-index:24!important;
      }
      .agenda-grid thead th.sos-col{z-index:24!important}
      .agenda-grid .professional-absent-period{background:#fff7f5!important}
      .agenda-grid .professional-absence-marker{
        display:block!important;
        margin-top:5px!important;
        font-size:10px!important;
        font-weight:700!important;
        line-height:1.2!important;
        color:#b42318!important;
      }
      .agenda-grid .professional-absence-marker + *{margin-top:0}
    `;
    document.head.appendChild(s);
  }

  function fixSticky(){
    const table=document.querySelector('#agendaGrid table.agenda-grid');
    if(!table)return;
    const first=table.querySelector('thead tr.agenda-specialty-row');
    if(!first)return;
    const h=Math.ceil(first.getBoundingClientRect().height||34);
    table.style.setProperty('--agenda-specialty-height',h+'px');
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
    const columnMap=new Map();
    professionalHeads.forEach(th=>{
      const name=th.querySelector('.professional-name')?.textContent.trim();
      if(PEOPLE.includes(name))columnMap.set(name,th.cellIndex);
    });
    if(!columnMap.size)return;

    const signature=JSON.stringify([dateKey(),localStorage.getItem(KEY),rows.length,professionalHeads.length]);
    if(signature===lastSignature){fixSticky();return;}
    lastSignature=signature;

    table.querySelectorAll('.professional-absence-marker').forEach(e=>e.remove());
    table.querySelectorAll('.professional-absent-period').forEach(e=>e.classList.remove('professional-absent-period'));

    const times=rows.map(row=>row.querySelector('th.time-col')?.textContent.trim()||'');
    rows.forEach((row,rowIndex)=>{
      const time=times[rowIndex];
      if(!time)return;
      const current=mins(time);
      PEOPLE.forEach(name=>{
        const occ=occurrenceFor(name);
        if(!occ)return;
        if(occ.type==='during_day'&&current<mins(occ.start))return;
        const col=columnMap.get(name);
        const cell=row.children[col];
        if(!cell)return;
        cell.classList.add('professional-absent-period');
        const previousTime=rowIndex>0?times[rowIndex-1]:'';
        const shouldMark=occ.type!=='during_day'
          ? rowIndex===0
          : (current>=mins(occ.start)&&(rowIndex===0||mins(previousTime)<mins(occ.start)));
        if(shouldMark&&!cell.querySelector('.professional-absence-marker')){
          const marker=document.createElement('span');
          marker.className='professional-absence-marker';
          marker.textContent=occ.type==='during_day'
            ? `Ausente desde ${occ.start} · ${occ.reason}`
            : occ.reason;
          cell.appendChild(marker);
        }
      });
    });
    fixSticky();
  }

  function run(){styles();renderOccurrences();fixSticky();}
  function boot(){
    run();
    const grid=document.getElementById('agendaGrid');
    if(grid){
      let queued=false;
      new MutationObserver(()=>{
        if(queued)return;
        queued=true;
        requestAnimationFrame(()=>{queued=false;run();});
      }).observe(grid,{childList:true,subtree:true});
    }
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>{lastSignature='';run();});
    window.addEventListener('resize',fixSticky);
    window.addEventListener('storage',()=>{lastSignature='';run();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,450),{once:true});
  else setTimeout(boot,450);
})();
