(function(){
  const STATE_KEY='beautymove.mvp.state';
  function readState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{"appointments":[]}');}catch{return {appointments:[]};}}
  function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
  function durationLabel(minutes){const m=Number(minutes||0),h=Math.floor(m/60),r=m%60;if(!h)return `${r}min`;return r?`${h}h ${r}min`:`${h}h`;}
  function minutes(time){const[h,m]=String(time||'00:00').split(':').map(Number);return h*60+m;}
  function time(total){return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;}
  function serviceSummary(a){if(Array.isArray(a?.services)&&a.services.length)return a.services;if(a?.service)return[{name:a.service,duration:Number(a.duration)||60,value:Number(a.value)||0}];return[];}
  function decorateLongInterval(){
    const grid=document.getElementById('agendaGrid'), interval=Number(document.getElementById('agendaInterval')?.value||30);
    if(!grid||interval<=30)return;
    const state=readState();
    grid.querySelectorAll('td[data-appointment-id]').forEach(cell=>{
      if(!cell.classList.contains('appointment-continuation'))return;
      const a=state.appointments.find(x=>x.id===cell.dataset.appointmentId);
      if(!a)return;
      const services=serviceSummary(a), total=services.reduce((s,x)=>s+Number(x.duration||0),0)||Number(a.duration)||30;
      const service=services.map(x=>x.name).join(' + ')||a.service||'';
      const end=time(minutes(a.time)+total);
      cell.innerHTML=`<strong>${escapeHtml(a.client||'Cliente')}</strong><span>${escapeHtml(service)}</span><small>${escapeHtml(a.time)} – ${escapeHtml(end)} · ${durationLabel(total)}</small>`;
      cell.classList.remove('appointment-continuation');
      cell.classList.add('appointment-start');
    });
  }
  function escapeHtml(value){return String(value??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  document.addEventListener('DOMContentLoaded',function(){
    const calendarBtn=document.getElementById('calendarBtn'),picker=document.getElementById('agendaDatePicker');
    calendarBtn?.addEventListener('click',function(){
      if(!picker)return;
      try{if(typeof picker.showPicker==='function')picker.showPicker();else picker.click();}
      catch{picker.click();}
    });
    const grid=document.getElementById('agendaGrid'),interval=document.getElementById('agendaInterval');
    const observer=new MutationObserver(()=>{decorateLongInterval();});
    if(grid)observer.observe(grid,{childList:true,subtree:true});
    interval?.addEventListener('change',()=>setTimeout(decorateLongInterval,0));
    setTimeout(decorateLongInterval,0);
  });
})();