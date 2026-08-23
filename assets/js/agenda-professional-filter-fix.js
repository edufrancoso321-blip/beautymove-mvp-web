/* BeautyMove — controle de profissional + responsividade mobile da Agenda. */
(function(){
  'use strict';
  const NAMES=['Ana','Bruna','Paula','Carla'];
  const MOBILE_BREAKPOINT=780;

  function isMobile(){return window.innerWidth<=MOBILE_BREAKPOINT;}

  function openByName(name){
    if(!NAMES.includes(name)) return;
    const target=[...document.querySelectorAll('#agendaGrid .professional-name')]
      .find(el=>el.textContent.trim()===name);
    const header=target?.closest('th');
    if(header){
      header.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    }
  }

  function applyMobileAgendaLayout(){
    const grid=document.getElementById('agendaGrid');
    const table=grid?.querySelector('.agenda-grid');
    const filter=document.getElementById('professionalFilter');
    if(!table || !filter) return;

    if(!isMobile()){
      table.removeAttribute('data-mobile-professional');
      return;
    }

    const selected=NAMES.includes(filter.value)?filter.value:'Ana';
    table.setAttribute('data-mobile-professional',selected);
  }

  function bind(){
    const filter=document.getElementById('professionalFilter');
    if(!filter) return;

    if(filter.dataset.controlFixBound!=='1'){
      filter.dataset.controlFixBound='1';
      filter.addEventListener('change',()=>{
        applyMobileAgendaLayout();
        setTimeout(()=>openByName(filter.value),0);
      });
      filter.addEventListener('click',()=>setTimeout(()=>openByName(filter.value),80));
    }

    applyMobileAgendaLayout();
  }

  function injectMobileStyles(){
    if(document.getElementById('beautymove-agenda-mobile-responsive')) return;
    const style=document.createElement('style');
    style.id='beautymove-agenda-mobile-responsive';
    style.textContent=`
      @media (max-width:${MOBILE_BREAKPOINT}px){
        html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important}
        .salon-app,.salon-main{width:100%!important;max-width:100%!important;box-sizing:border-box!important}
        .salon-main{padding:14px 10px 12px!important}
        .salon-topbar{min-width:0!important;max-width:100%!important;overflow:hidden!important}
        .salon-topbar h1{font-size:24px!important}
        .salon-topbar p{font-size:12px!important}
        .salon-top-actions{min-width:0!important;max-width:100%!important}
        .salon-top-actions .secondary.compact{display:none!important}
        .top-profile{display:none!important}
        .agenda-toolbar-v2{width:100%!important;min-width:0!important;max-width:100%!important;grid-template-columns:1fr!important;gap:9px!important;overflow:hidden!important}
        .agenda-left-controls,.agenda-date-controls,.agenda-toolbar-right{width:100%!important;min-width:0!important;max-width:100%!important;grid-column:1!important}
        .agenda-date-controls{display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important}
        .agenda-date-controls strong{min-width:0!important;flex:1 1 auto!important;width:auto!important;font-size:13px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
        .agenda-calendar-control{position:static!important}
        .agenda-toolbar-right{display:flex!important;justify-content:stretch!important}
        .agenda-toolbar-right select{width:100%!important;min-width:0!important}
        .add-professional{display:none!important}
        .agenda-shell-v2{width:100%!important;min-width:0!important;max-width:100%!important;height:calc(100vh - 245px)!important;min-height:360px!important;overflow:hidden!important}
        .agenda-scroll-v2{width:100%!important;max-width:100%!important;height:100%!important;overflow-x:hidden!important;overflow-y:auto!important}
        .agenda-grid{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important;border-collapse:separate!important}
        .agenda-grid .time-col{width:62px!important;min-width:62px!important;max-width:62px!important}
        .agenda-grid th:not(.time-col),.agenda-grid td:not(.time-col){width:auto!important;min-width:0!important;max-width:none!important}
        .agenda-grid[data-mobile-professional="Ana"] th:nth-child(3),.agenda-grid[data-mobile-professional="Ana"] td:nth-child(3),
        .agenda-grid[data-mobile-professional="Ana"] th:nth-child(4),.agenda-grid[data-mobile-professional="Ana"] td:nth-child(4),
        .agenda-grid[data-mobile-professional="Ana"] th:nth-child(5),.agenda-grid[data-mobile-professional="Ana"] td:nth-child(5),
        .agenda-grid[data-mobile-professional="Ana"] th:nth-child(6),.agenda-grid[data-mobile-professional="Ana"] td:nth-child(6),
        .agenda-grid[data-mobile-professional="Bruna"] th:nth-child(2),.agenda-grid[data-mobile-professional="Bruna"] td:nth-child(2),
        .agenda-grid[data-mobile-professional="Bruna"] th:nth-child(4),.agenda-grid[data-mobile-professional="Bruna"] td:nth-child(4),
        .agenda-grid[data-mobile-professional="Bruna"] th:nth-child(5),.agenda-grid[data-mobile-professional="Bruna"] td:nth-child(5),
        .agenda-grid[data-mobile-professional="Bruna"] th:nth-child(6),.agenda-grid[data-mobile-professional="Bruna"] td:nth-child(6),
        .agenda-grid[data-mobile-professional="Paula"] th:nth-child(2),.agenda-grid[data-mobile-professional="Paula"] td:nth-child(2),
        .agenda-grid[data-mobile-professional="Paula"] th:nth-child(3),.agenda-grid[data-mobile-professional="Paula"] td:nth-child(3),
        .agenda-grid[data-mobile-professional="Paula"] th:nth-child(5),.agenda-grid[data-mobile-professional="Paula"] td:nth-child(5),
        .agenda-grid[data-mobile-professional="Paula"] th:nth-child(6),.agenda-grid[data-mobile-professional="Paula"] td:nth-child(6),
        .agenda-grid[data-mobile-professional="Carla"] th:nth-child(2),.agenda-grid[data-mobile-professional="Carla"] td:nth-child(2),
        .agenda-grid[data-mobile-professional="Carla"] th:nth-child(3),.agenda-grid[data-mobile-professional="Carla"] td:nth-child(3),
        .agenda-grid[data-mobile-professional="Carla"] th:nth-child(4),.agenda-grid[data-mobile-professional="Carla"] td:nth-child(4),
        .agenda-grid[data-mobile-professional="Carla"] th:nth-child(6),.agenda-grid[data-mobile-professional="Carla"] td:nth-child(6){display:none!important}
        .agenda-grid thead th{height:76px!important;padding:8px 7px 11px!important}
        .agenda-grid tbody td,.agenda-grid tbody th{height:58px!important;padding:7px 8px!important}
        .agenda-grid .professional-name{font-size:15px!important}
        .agenda-grid .specialty-label{font-size:10px!important}
        .appointment-cell strong{font-size:13px!important}
        .appointment-cell span{font-size:11px!important}
        .appointment-cell small{font-size:9px!important}
        .agenda-legend{width:100%!important;max-width:100%!important;overflow-x:auto!important;white-space:nowrap!important;gap:14px!important;padding-bottom:4px!important}
      }
    `;
    document.head.appendChild(style);
  }

  injectMobileStyles();
  bind();

  const grid=document.getElementById('agendaGrid');
  if(grid){
    new MutationObserver(()=>setTimeout(bind,0)).observe(grid,{childList:true,subtree:true});
  }

  window.addEventListener('resize',applyMobileAgendaLayout,{passive:true});
  window.addEventListener('load',bind);
})();
