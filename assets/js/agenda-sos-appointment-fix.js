/* BeautyMove — preserva o atendimento S.O.S. na coluna operacional da Agenda. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}catch(_){return {appointments:[],opportunities:[]};}};
  const save=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function restoreOriginalProfessional(){
    const state=read();
    let changed=false;
    (state.appointments||[]).forEach(a=>{
      if(a?.sosAcceptedBy && a?.sosOriginalProfessional && a.professional!==a.sosOriginalProfessional){
        a.professional=a.sosOriginalProfessional;
        changed=true;
      }
    });
    if(changed)save(state);
  }
  function decorateAgenda(){
    const date=document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
    const state=read();
    const appointments=(state.appointments||[]).filter(a=>a?.date===date&&a?.sosAcceptedBy&&a.status!=='cancelado');
    document.querySelectorAll('#agendaGrid [data-appointment-id]').forEach(cell=>cell.querySelector('.sos-assigned-professional')?.remove());
    appointments.forEach(a=>{
      const cells=[...document.querySelectorAll('#agendaGrid [data-appointment-id]')].filter(c=>c.dataset.appointmentId===a.id);
      cells.forEach(cell=>{
        const badge=document.createElement('span');
        badge.className='sos-assigned-professional';
        badge.textContent=`S.O.S. · ${a.sosAcceptedBy}`;
        cell.appendChild(badge);
      });
    });
  }
  function boot(){
    restoreOriginalProfessional();
    decorateAgenda();
    const grid=document.getElementById('agendaGrid');
    if(grid){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;restoreOriginalProfessional();decorateAgenda();});}).observe(grid,{childList:true,subtree:true});}
    window.addEventListener('beautymove:sos-accepted',()=>{restoreOriginalProfessional();setTimeout(()=>{location.reload();},80);});
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(decorateAgenda,120));
    document.getElementById('prevDay')?.addEventListener('click',()=>setTimeout(decorateAgenda,180));
    document.getElementById('nextDay')?.addEventListener('click',()=>setTimeout(decorateAgenda,180));
    document.getElementById('todayBtn')?.addEventListener('click',()=>setTimeout(decorateAgenda,180));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,450),{once:true});else setTimeout(boot,450);
})();