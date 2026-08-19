/* BeautyMove — LAYOUT OFICIAL CONGELADO DA AGENDA
 * Um atendimento ocupa visualmente todo o período e exibe cliente/serviço apenas uma vez.
 * Não altera especialidades, cabeçalho, profissionais ou dimensões da grade.
 */
(function(){
  'use strict';
  function mergeAppointments(){
    const table=document.querySelector('#agendaGrid .agenda-grid');
    if(!table)return;
    const rows=[...table.querySelectorAll('tbody tr')];
    if(!rows.length)return;
    const groups=new Map();
    rows.forEach((row,rowIndex)=>{
      row.querySelectorAll('td[data-appointment-id]').forEach(cell=>{
        const id=cell.dataset.appointmentId;
        if(!id)return;
        if(!groups.has(id))groups.set(id,[]);
        groups.get(id).push({cell,row,rowIndex});
      });
    });
    groups.forEach(items=>{
      items.sort((a,b)=>a.rowIndex-b.rowIndex);
      if(items.length<2)return;
      const first=items[0];
      const contiguous=items.every((item,i)=>i===0||item.rowIndex===items[i-1].rowIndex+1);
      if(!contiguous)return;
      if(first.cell.dataset.bmMerged==='1')return;
      first.cell.rowSpan=items.length;
      first.cell.dataset.bmMerged='1';
      items.slice(1).forEach(item=>item.cell.remove());
    });
  }
  function boot(){
    const grid=document.getElementById('agendaGrid');
    if(!grid)return;
    const run=()=>requestAnimationFrame(mergeAppointments);
    new MutationObserver(run).observe(grid,{childList:true,subtree:true});
    run();
    setInterval(run,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
