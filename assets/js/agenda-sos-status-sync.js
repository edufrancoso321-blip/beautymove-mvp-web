/* BeautyMove — sincronização visual do atendimento S.O.S. na grade da Agenda */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}catch(_){return {appointments:[],opportunities:[]};}};
  const minutes=v=>{const [h,m]=String(v||'00:00').split(':').map(Number);return (h||0)*60+(m||0);};
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  function acceptedForDate(){
    const state=readState(),date=document.getElementById('agendaDatePicker')?.value;
    const appointments=Array.isArray(state.appointments)?state.appointments:[];
    const opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    return opportunities.filter(o=>o&&o.date===date&&o.source==='sos'&&o.status==='resolved'&&o.acceptedBy).map(o=>{
      const appointment=o.appointmentId?appointments.find(a=>a&&a.id===o.appointmentId):null;
      return {...o,appointment};
    });
  }
  function paint(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    const items=acceptedForDate();
    const cells=[...grid.querySelectorAll('[data-sos-cell="true"]')];
    cells.forEach(cell=>{cell.classList.remove('sos-cell','sos-cell-found');cell.removeAttribute('data-sos-id');cell.innerHTML='Livre';});
    items.forEach(item=>{
      const start=minutes(item.time),cell=cells.find(c=>minutes(c.dataset.time)>=start&&minutes(c.dataset.time)<start+120);
      if(!cell)return;
      cell.dataset.sosId=item.id;
      cell.classList.add('sos-cell','sos-cell-found');
      const client=item.client||item.appointment?.client||'Cliente';
      const service=item.service||item.appointment?.service||'Atendimento';
      const professional=item.acceptedBy||'Profissional selecionada';
      cell.innerHTML=`<strong>${esc(client)}</strong><span>${esc(service)}</span><small class="sos-found-status">✓ Profissional encontrada</small><small>Profissional: ${esc(professional)}</small>`;
    });
  }
  function bind(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    if(!grid.dataset.sosStatusSync){grid.dataset.sosStatusSync='1';new MutationObserver(()=>requestAnimationFrame(paint)).observe(grid,{childList:true,subtree:true});}
    paint();
  }
  function boot(){bind();setInterval(bind,1000);window.addEventListener('beautymove:sos-accepted',()=>setTimeout(paint,120));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,400),{once:true});else setTimeout(boot,400);
})();
