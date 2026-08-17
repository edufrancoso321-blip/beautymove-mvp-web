/* BeautyMove — cabeçalho operacional da Agenda. */
(function(){
  'use strict';
  const PROFESSIONALS=['Ana','Bruna','Paula','Carla'];
  let applying=false;

  function styles(){
    if(document.getElementById('agendaHeaderLayoutStyles'))return;
    const s=document.createElement('style');
    s.id='agendaHeaderLayoutStyles';
    s.textContent=`
      .agenda-grid thead tr.agenda-specialty-row th.agenda-specialty-group{
        text-align:center!important;
        vertical-align:middle!important;
        height:34px;
        padding:7px 10px 5px!important;
        font-size:11px!important;
        font-weight:800!important;
        color:#6f6878!important;
        background:#fff!important;
        border-bottom:1px solid #eee8f2!important;
      }
      .agenda-grid thead tr.agenda-professional-row th.professional-header-control{
        vertical-align:top!important;
        padding:7px 8px 8px!important;
      }
      .agenda-grid thead tr.agenda-professional-row .professional-name{
        display:block;
        margin-top:0!important;
      }
      .agenda-grid thead tr.agenda-professional-row .professional-day-status{
        margin-top:4px!important;
      }
      .agenda-grid thead th.sos-col.agenda-sos-header-clean{
        vertical-align:middle!important;
        text-align:center!important;
      }
      .agenda-grid thead th.sos-col.agenda-sos-header-clean .sos-title{
        display:block;
        margin:0!important;
      }
      .agenda-grid thead th.sos-col.agenda-sos-header-clean .sos-header-button{display:none!important}
    `;
    document.head.appendChild(s);
  }

  function apply(){
    if(applying)return;
    const grid=document.getElementById('agendaGrid');
    const table=grid?.querySelector('table.agenda-grid');
    const thead=table?.querySelector('thead');
    if(!thead||thead.dataset.headerLayout==='v2')return;
    const original=[...thead.querySelectorAll('tr:first-child > th')];
    const timeTh=original.find(th=>th.classList.contains('time-col'));
    const sosTh=original.find(th=>th.classList.contains('sos-col'));
    const profThs=original.filter(th=>PROFESSIONALS.includes(th.querySelector('.professional-name')?.textContent.trim()||''));
    if(!timeTh||!sosTh||profThs.length===0)return;

    applying=true;
    styles();
    const specialtyGroups=[];
    profThs.forEach(th=>{
      const specialty=th.querySelector('.specialty-label')?.textContent.trim()||'';
      let group=specialtyGroups.find(g=>g.specialty===specialty);
      if(!group){group={specialty,items:[]};specialtyGroups.push(group);}
      group.items.push(th);
      th.querySelector('.specialty-label')?.remove();
    });

    const specialtyRow=document.createElement('tr');
    specialtyRow.className='agenda-specialty-row';
    const newTime=timeTh.cloneNode(true);
    newTime.rowSpan=2;
    specialtyRow.appendChild(newTime);
    specialtyGroups.forEach(group=>{
      const th=document.createElement('th');
      th.className='agenda-specialty-group';
      th.colSpan=group.items.length;
      th.textContent=group.specialty;
      specialtyRow.appendChild(th);
    });
    const newSos=sosTh.cloneNode(true);
    newSos.rowSpan=2;
    newSos.classList.add('agenda-sos-header-clean');
    const button=newSos.querySelector('.sos-header-button');
    if(button)button.remove();
    specialtyRow.appendChild(newSos);

    const professionalRow=document.createElement('tr');
    professionalRow.className='agenda-professional-row';
    profThs.forEach(th=>professionalRow.appendChild(th));

    thead.innerHTML='';
    thead.appendChild(specialtyRow);
    thead.appendChild(professionalRow);
    thead.dataset.headerLayout='v2';
    applying=false;
  }

  function boot(){
    styles();
    const grid=document.getElementById('agendaGrid');
    if(!grid)return;
    const run=()=>requestAnimationFrame(apply);
    run();
    new MutationObserver(()=>{
      const table=grid.querySelector('table.agenda-grid');
      if(table&&table.tHead?.dataset.headerLayout!=='v2')run();
    }).observe(grid,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
