/* BeautyMove — layout oficial da Agenda + controles visuais.
   Atendimento ocupa visualmente todo o período e exibe cliente/serviço uma única vez.
   Cancelamento normal é isolado do S.O.S. e altera somente o appointment selecionado.
*/
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  function readState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}}
  function writeState(state){localStorage.setItem(STATE_KEY,JSON.stringify(state));}

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

  function cancelNormalAppointment(event){
    const actions=document.getElementById('detailsActions');
    if(actions?.dataset?.sosId)return;
    const button=event.target.closest?.('#detailsActions [data-detail-action="cancel"]');
    if(!button)return;
    const id=actions?.dataset?.appointmentId||window.__bmCurrentAppointmentId||null;
    if(!id)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const state=readState();
    const appointment=state.appointments.find(a=>a&&String(a.id)===String(id));
    if(!appointment)return;
    if(!window.confirm(`Cancelar o atendimento de ${appointment.client||'esta cliente'}?`))return;
    appointment.status='cancelado';
    appointment.cancelledAt=new Date().toISOString();
    appointment.cancelledReason='Cancelado pelo salão';
    writeState(state);
    window.__bmCurrentAppointmentId=null;
    const modal=document.getElementById('detailsModal');
    if(modal){modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');}
    setTimeout(()=>window.location.reload(),60);
  }

  function decorateTodayLabel(){
    const label=document.getElementById('agendaDate'),picker=document.getElementById('agendaDatePicker');
    if(!label||!picker||!label.textContent.trim())return;
    const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const base=label.textContent.replace(/^Hoje\s*·\s*/i,'').trim();
    label.textContent=picker.value===today?`Hoje · ${base}`:base;
  }
  function boot(){
    document.addEventListener('click',cancelNormalAppointment,true);
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
