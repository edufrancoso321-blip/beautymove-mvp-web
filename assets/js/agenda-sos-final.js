/* BeautyMove — sincronização final da célula S.O.S. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}catch(_){return {appointments:[],opportunities:[]};}};
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const mins=v=>{const p=String(v||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  const date=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const professionalGender={'Juliana Costa':'feminino','Bianca Rodrigues':'feminino','Carla Menezes':'feminino','Lucas Ferreira':'masculino','Rafael Santos':'masculino'};
  const confirmationLabel=professional=>professionalGender[professional]==='masculino'?'Profissional confirmado':'Profissional confirmada';

  function accepted(){
    const s=read(),appointments=Array.isArray(s.appointments)?s.appointments:[],opportunities=Array.isArray(s.opportunities)?s.opportunities:[];
    return opportunities.filter(o=>o&&o.date===date()&&o.source==='sos'&&o.status==='resolved'&&o.acceptedBy&&!o.cancelled)
      .map(o=>{const a=o.appointmentId?appointments.find(x=>x&&x.id===o.appointmentId):null;return {...o,appointment:a||null,client:o.client||a?.client||'Cliente',service:o.service||a?.service||'Atendimento',time:o.time||a?.time||'08:00',acceptedBy:o.acceptedBy};})
      .filter(o=>o.time);
  }

  function restoreAppointments(){
    const s=read();let changed=false;
    (s.appointments||[]).forEach(a=>{if(a?.sosAcceptedBy&&a?.sosOriginalProfessional&&a.professional!==a.sosOriginalProfessional){a.professional=a.sosOriginalProfessional;changed=true;}});
    if(changed)localStorage.setItem(STATE_KEY,JSON.stringify(s));
  }

  function sync(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    const items=accepted();
    grid.querySelectorAll('td.sos-cell-found').forEach(cell=>{cell.className='sos-free-cell';cell.innerHTML='Livre';cell.removeAttribute('data-sos-id');cell.removeAttribute('data-appointment-id');});
    grid.querySelectorAll('td[data-sos-cell="true"]').forEach(cell=>{
      const item=items.find(x=>mins(x.time)===mins(cell.dataset.time));
      if(!item)return;
      cell.className='sos-cell sos-cell-found';
      cell.dataset.sosId=item.id||'';
      cell.dataset.appointmentId=item.appointment?.id||'';
      cell.innerHTML=`<strong>${esc(item.client)}</strong><span>${esc(item.service)}</span><small>${esc(item.acceptedBy)}</small><div class="sos-found-status">✓ ${confirmationLabel(item.acceptedBy)}</div>`;
    });
  }

  function boot(){
    restoreAppointments();
    let signature='';
    const tick=()=>{const s=JSON.stringify([date(),localStorage.getItem(STATE_KEY),document.getElementById('agendaGrid')?.innerHTML.length||0]);if(s!==signature){signature=s;sync();}};
    setTimeout(tick,700);
    setInterval(()=>{restoreAppointments();tick();},800);
    window.addEventListener('beautymove:sos-accepted',()=>{signature='';setTimeout(tick,100);});
    ['prevDay','nextDay','todayBtn','agendaDatePicker'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>{signature='';setTimeout(tick,250);}));
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>{signature='';setTimeout(tick,150);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
