/* BeautyMove — correção final da Agenda + célula S.O.S. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}catch(_){return {appointments:[],opportunities:[]};}};
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const mins=v=>{const p=String(v||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  const date=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);

  function accepted(){
    const s=read(), appointments=Array.isArray(s.appointments)?s.appointments:[], opportunities=Array.isArray(s.opportunities)?s.opportunities:[];
    return opportunities.filter(o=>o&&o.date===date()&&o.source==='sos'&&o.status==='resolved'&&o.acceptedBy&&!o.cancelled)
      .map(o=>{
        const a=o.appointmentId?appointments.find(x=>x&&x.id===o.appointmentId):null;
        return {...o, appointment:a||null, client:o.client||a?.client||'Cliente', service:o.service||a?.service||'Atendimento', time:o.time||a?.time||'08:00', acceptedBy:o.acceptedBy};
      })
      .filter(o=>o.time);
  }

  function restoreAppointments(){
    /* A profissional encontrada pelo S.O.S. não substitui a profissional original
       na grade. A recepção continua vendo o atendimento no lugar de origem. */
    const s=read(); let changed=false;
    (s.appointments||[]).forEach(a=>{
      if(a?.sosAcceptedBy && a?.sosOriginalProfessional && a.professional!==a.sosOriginalProfessional){
        a.professional=a.sosOriginalProfessional; changed=true;
      }
    });
    if(changed) localStorage.setItem(STATE_KEY,JSON.stringify(s));
  }

  function sync(){
    const grid=document.getElementById('agendaGrid'); if(!grid)return;
    const items=accepted();
    grid.querySelectorAll('td.sos-cell-found').forEach(cell=>cell.classList.remove('sos-cell-found'));
    grid.querySelectorAll('td[data-sos-cell="true"]').forEach(cell=>{
      const t=cell.dataset.time;
      const item=items.find(x=>mins(x.time)===mins(t));
      if(!item)return;
      cell.className='sos-cell sos-cell-found';
      cell.dataset.sosId=item.id||'';
      cell.dataset.appointmentId=item.appointment?.id||'';
      cell.innerHTML=`<strong>${esc(item.client)}</strong><span>${esc(item.service)}</span><small>Profissional: ${esc(item.acceptedBy)}</small><div class="sos-found-status">✓ Profissional encontrada</div>`;
    });
  }

  function boot(){
    restoreAppointments();
    sync();
    const grid=document.getElementById('agendaGrid');
    if(grid)new MutationObserver(()=>requestAnimationFrame(sync)).observe(grid,{childList:true,subtree:true});
    window.addEventListener('beautymove:sos-accepted',()=>setTimeout(sync,80));
    ['prevDay','nextDay','todayBtn','agendaDatePicker'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(sync,250)));
    setInterval(()=>{restoreAppointments();sync();},800);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,700),{once:true});else setTimeout(boot,700);
})();
