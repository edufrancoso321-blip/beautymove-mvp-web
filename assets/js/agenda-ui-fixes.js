/* BeautyMove — layout oficial da Agenda + controles visuais.
   Atendimento ocupa visualmente todo o período e exibe cliente/serviço uma única vez.
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
  function decorateTodayLabel(){
    const label=document.getElementById('agendaDate'),picker=document.getElementById('agendaDatePicker');
    if(!label||!picker||!label.textContent.trim())return;
    const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const base=label.textContent.replace(/^Hoje\s*·\s*/i,'').trim();
    label.textContent=picker.value===today?`Hoje · ${base}`:base;
  }
  function boot(){
    const calendarBtn=document.getElementById('calendarBtn'),picker=document.getElementById('agendaDatePicker');
    calendarBtn?.addEventListener('click',function(){
      if(!picker)return;
      try{if(typeof picker.showPicker==='function')picker.showPicker();else picker.click();}
      catch{picker.click();}
    });
    const grid=document.getElementById('agendaGrid');
    if(grid){
      const run=()=>requestAnimationFrame(mergeAppointments);
      new MutationObserver(run).observe(grid,{childList:true,subtree:true});
      run();
      setInterval(run,500);
    }
    picker?.addEventListener('change',()=>setTimeout(decorateTodayLabel,0));
    setTimeout(decorateTodayLabel,0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
