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
      #agendaNotice{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important}
      .agenda-shell-v2 > .agenda-header-spacer,
      .agenda-shell-v2 > .agenda-empty-bar,
      .agenda-shell-v2 > .agenda-alert-bar{display:none!important;height:0!important;margin:0!important;padding:0!important;border:0!important}
      .agenda-grid thead{position:sticky!important;top:0!important;z-index:25!important;background:#fff!important}
      .agenda-grid thead tr.agenda-specialty-row th.agenda-specialty-group{text-align:center!important;vertical-align:middle!important;height:36px!important;padding:6px 10px 5px!important;font-size:16px!important;line-height:1.15!important;font-weight:850!important;color:#625b6c!important;background:#fff!important;border-bottom:0!important}
      .agenda-grid thead tr.agenda-professional-row th.professional-header-control{vertical-align:top!important;padding:6px 8px 8px!important}
      .agenda-grid thead tr.agenda-professional-row .professional-name{display:block!important;margin:0!important;font-size:16px!important;line-height:1.15!important;font-weight:900!important}
      .agenda-grid thead tr.agenda-professional-row .professional-day-status{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;gap:4px 5px!important;margin:4px 0 0!important;padding:3px 5px!important;min-height:15px!important;font-size:11px!important;line-height:1.15!important}
      .agenda-grid thead tr.agenda-professional-row .professional-day-status .status-detail{flex:0 0 100%!important;display:block!important;margin:0!important;text-align:center!important;font-weight:500!important}
      .agenda-grid thead th.sos-col.agenda-sos-header-clean{vertical-align:middle!important;text-align:center!important;height:36px!important;padding:6px 8px 5px!important;border-top:0!important;border-bottom:0!important;position:relative!important;background:#fff!important}
      .agenda-grid thead th.sos-col.agenda-sos-header-clean .sos-title{display:block!important;margin:0!important;font-size:16px!important;line-height:1.15!important;color:var(--purple)!important;font-weight:900!important}
      .agenda-grid thead th.sos-col.agenda-sos-header-clean .sos-header-button{display:none!important}
      .agenda-grid thead th.sos-col.agenda-sos-header-clean::after{display:none!important}
      .agenda-grid thead tr.agenda-professional-row th.sos-col.agenda-sos-action{vertical-align:top!important;text-align:center!important;padding:6px 8px 10px!important;font-size:12px!important;font-weight:800!important;color:var(--purple)!important;background:#fff!important;border-top:0!important;border-bottom:0!important;position:relative!important;height:auto!important;min-height:0!important;box-sizing:border-box!important;align-self:stretch!important}
      .agenda-grid thead tr.agenda-professional-row th.sos-col.agenda-sos-action .sos-action-label{display:block!important;margin:4px 0 0!important;line-height:1.2!important;font-size:12px!important;font-weight:850!important;color:var(--purple)!important}
      .agenda-grid thead tr.agenda-professional-row th.sos-col.agenda-sos-action::after{content:''!important;position:absolute!important;left:12px!important;right:12px!important;bottom:0!important;height:6px!important;border-radius:6px 6px 0 0!important;background:var(--purple)!important}

      /* 2026-08-19 — cabeçalho de especialidades/profissionais permanece fixo durante a rolagem. */
      .agenda-grid thead tr.agenda-specialty-row th{position:sticky!important;top:0!important;z-index:20!important;background:#fff!important}
      .agenda-grid thead tr.agenda-specialty-row th.time-col{z-index:30!important}
      .agenda-grid thead tr.agenda-specialty-row th.sos-col{z-index:21!important}
      .agenda-grid thead tr.agenda-professional-row th{position:sticky!important;top:36px!important;z-index:19!important;background:#fff!important}
      .agenda-grid thead tr.agenda-professional-row th.sos-col{z-index:20!important}
      .agenda-grid thead tr.agenda-professional-row th.time-col{z-index:30!important}
    `;
    document.head.appendChild(s);
  }

  function updateSalonIdentity(){
    const nameElement=document.querySelector('.top-profile strong');
    if(!nameElement)return;
    try{
      const profile=JSON.parse(localStorage.getItem('beautymove.mvp.profile')||'null');
      const session=JSON.parse(localStorage.getItem('beautymove.mvp.session')||'null');
      const name=profile?.nomeSalao||((profile?.role==='salao')?profile?.nome:'')||session?.name||'';
      if(name)nameElement.textContent=name;
    }catch(error){
      console.warn('[BeautyMove] salon identity header update failed:',error);
    }
  }

  function sosActionLabel(){
    try{
      const raw=localStorage.getItem('beautymove.mvp.state');
      const data=raw?JSON.parse(raw):{};
      const appointments=Array.isArray(data.appointments)?data.appointments:[];
      const opportunities=Array.isArray(data.opportunities)?data.opportunities:[];
      const activeAppointment=appointments.some(a=>a&&a.sosRequested&&a.status!=='cancelado');
      const activeOpportunity=opportunities.some(o=>o&&['aberta','em_busca','buscando'].includes(String(o.status||'').toLowerCase()));
      return activeAppointment||activeOpportunity?'Buscando profissionais':'Aguardando ação';
    }catch{return 'Aguardando ação'}
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
      if(!group){group={specialty,items:[]};specialtyGroups.push(group)}
      group.items.push(th);
      th.querySelector('.specialty-label')?.remove();
      th.classList.add('professional-header-control');
    });
    const specialtyRow=document.createElement('tr');
    specialtyRow.className='agenda-specialty-row';
    const newTime=timeTh.cloneNode(true);newTime.rowSpan=2;specialtyRow.appendChild(newTime);
    specialtyGroups.forEach(group=>{const th=document.createElement('th');th.className='agenda-specialty-group';th.colSpan=group.items.length;th.textContent=group.specialty;specialtyRow.appendChild(th)});
    const newSos=sosTh.cloneNode(true);newSos.rowSpan=1;newSos.classList.add('agenda-sos-header-clean');newSos.querySelector('.sos-header-button')?.remove();specialtyRow.appendChild(newSos);
    const professionalRow=document.createElement('tr');professionalRow.className='agenda-professional-row';profThs.forEach(th=>professionalRow.appendChild(th));
    const sosAction=document.createElement('th');sosAction.className='sos-col agenda-sos-action';sosAction.innerHTML=`<span class="sos-action-label">${sosActionLabel()}</span>`;professionalRow.appendChild(sosAction);
    thead.innerHTML='';thead.appendChild(specialtyRow);thead.appendChild(professionalRow);thead.dataset.headerLayout='v2';applying=false;
  }

  function boot(){
    styles();
    updateSalonIdentity();
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    const run=()=>requestAnimationFrame(apply);run();
    new MutationObserver(()=>{const table=grid.querySelector('table.agenda-grid');if(table&&table.tHead?.dataset.headerLayout!=='v2')run()}).observe(grid,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
