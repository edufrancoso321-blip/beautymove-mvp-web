/* BeautyMove — cabeçalho fixo, ocorrências e densidade visual da Agenda. */
(function(){
  'use strict';
  const KEY='beautymove.mvp.professional.daily-status';
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
      .agenda-grid thead tr.agenda-specialty-row th{
        position:sticky!important;
        top:0!important;
        z-index:52!important;
        height:36px!important;
        min-height:36px!important;
        padding:5px 10px 4px!important;
        background:#fff!important;
      }
      .agenda-grid thead tr.agenda-professional-row th{
        position:sticky!important;
        top:36px!important;
        z-index:51!important;
        min-height:48px!important;
        padding:5px 8px 6px!important;
        background:#fff!important;
      }
      .agenda-grid thead tr.agenda-specialty-row th.sos-col.agenda-sos-header-clean{
        position:sticky!important;
        top:0!important;
        z-index:56!important;
        background:#fff!important;
      }
      .agenda-grid thead tr.agenda-professional-row th.sos-col.agenda-sos-action{
        position:sticky!important;
        top:36px!important;
        z-index:55!important;
        background:#fff!important;
      }
      .agenda-grid thead tr.agenda-specialty-row th.time-col{z-index:58!important}
      .agenda-grid thead tr.agenda-professional-row th.time-col{z-index:57!important}
      .agenda-grid thead th.sos-col .sos-title{font-size:16px!important;line-height:1.15!important}
      .agenda-grid thead th.sos-col.agenda-sos-action .sos-action-label{font-size:12px!important;line-height:1.2!important}
      .agenda-grid tbody th.time-col,
      .agenda-grid tbody td{height:48px!important;min-height:48px!important;padding:6px 10px!important;font-size:12px!important}
      .agenda-grid .professional-absent-period{background:#fff7f5!important}
      .agenda-grid .professional-absence-marker{
        display:block!important;
        margin-top:5px!important;
        font-size:10px!important;
        font-weight:700!important;
        line-height:1.2!important;
        color:#b42318!important;
      }
    `;
    document.head.appendChild(s);
  }

  function setDefaultInterval(){
    const select=document.getElementById('agendaInterval');
    if(!select)return;
    if(select.value!=='60'){
      select.value='60';
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
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

    const headsByName=new Map();
    professionalHeads.forEach(th=>{
      const name=th.querySelector('.professional-name')?.textContent.trim();
      if(PEOPLE.includes(name))headsByName.set(name,th);
    });

    const times=rows.map(row=>row.querySelector('th.time-col')?.textContent.trim()||'');
    PEOPLE.forEach(name=>{
      const occ=occurrenceFor(name);
      const head=headsByName.get(name);
      if(!head||!occ)return;

      /* O cabeçalho já é a fonte visual oficial do status. Se a profissional está ausente,
         a grade também recebe a ocorrência, independentemente da posição das colunas. */
      const headerStatus=head.querySelector('.professional-day-status');
      const isAbsent=headerStatus?.classList.contains('is-absent');
      if(!isAbsent)return;

      const col=head.cellIndex;
      if(col<0)return;
      rows.forEach((row,rowIndex)=>{
        const time=times[rowIndex];
        if(!time)return;
        const current=mins(time);
        if(occ.type==='during_day'&&current<mins(occ.start))return;
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

  function run(){styles();setDefaultInterval();renderOccurrences();fixSticky();}
  function boot(){
    run();
    const grid=document.getElementById('agendaGrid');
    if(grid){
      let queued=false;
      new MutationObserver(()=>{
        if(queued)return;
        queued=true;
        requestAnimationFrame(()=>{queued=false;lastSignature='';run();});
      }).observe(grid,{childList:true,subtree:true});
    }
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>{lastSignature='';run();});
    window.addEventListener('resize',()=>{lastSignature='';fixSticky();renderOccurrences();});
    window.addEventListener('storage',()=>{lastSignature='';run();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,450),{once:true});
  else setTimeout(boot,450);
})();
