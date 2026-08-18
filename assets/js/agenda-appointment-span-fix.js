/* BeautyMove — correct appointment rendering in the agenda. */
(function(){
  'use strict';
  const GRID_ID='agendaGrid';
  let running=false;
  function mergeAppointments(){
    const grid=document.getElementById(GRID_ID);
    const table=grid?.querySelector('table.agenda-grid');
    if(!table)return;
    const rows=Array.from(table.querySelectorAll('tbody tr'));
    if(!rows.length)return;
    running=true;
    try{
      const professionalCount=4;
      for(let col=1;col<=professionalCount;col++){
        let rowIndex=0;
        while(rowIndex<rows.length){
          const cell=rows[rowIndex]?.children[col];
          const id=cell?.dataset?.appointmentId;
          if(!id){rowIndex++;continue;}
          let end=rowIndex+1;
          while(end<rows.length){
            const next=rows[end]?.children[col];
            if(!next || next.dataset.appointmentId!==id)break;
            end++;
          }
          const span=end-rowIndex;
          if(span>1){
            cell.rowSpan=span;
            cell.classList.remove('appointment-continuation');
            cell.classList.add('appointment-span');
            for(let remove=end-1;remove>rowIndex;remove--){
              const duplicate=rows[remove]?.children[col];
              duplicate?.remove();
            }
          }
          rowIndex=end;
        }
      }
    }finally{running=false;}
  }
  function schedule(){
    if(running)return;
    requestAnimationFrame(mergeAppointments);
  }
  document.addEventListener('DOMContentLoaded',function(){
    const grid=document.getElementById(GRID_ID);
    if(!grid)return;
    const observer=new MutationObserver(schedule);
    observer.observe(grid,{childList:true,subtree:true});
    schedule();
  });
})();
