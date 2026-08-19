/* BeautyMove — correção definitiva da reserva S.O.S. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const mins=t=>{const p=String(t||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const durationOf=o=>{
    const direct=Number(o?.durationSnapshot||o?.durationMinutes||o?.duration||0);
    if(direct>0)return direct;
    const list=Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:Array.isArray(o?.services)?o.services:[];
    const total=list.reduce((n,s)=>n+Number(s?.duration||s?.durationMinutes||0),0);
    return total>0?total:30;
  };
  const servicesOf=o=>{
    const list=Array.isArray(o?.servicesSnapshot)?o.servicesSnapshot:Array.isArray(o?.services)?o.services:[];
    if(list.length)return list.map(s=>({id:s.id,name:s.name,duration:Number(s.duration||s.durationMinutes||0)||30,clientPrice:Number(s.clientPrice||s.value||0)}));
    return o?.service?[{name:o.service,duration:durationOf(o),clientPrice:Number(o.clientPriceSnapshot||o.value||0)}]:[];
  };
  const valueOf=o=>Number(o?.clientPriceSnapshot||o?.value||0)||servicesOf(o).reduce((n,s)=>n+Number(s.clientPrice||0),0);
  const endOf=(o,start=o?.time)=>time(mins(start)+durationOf(o));
  const overlaps=(aStart,aEnd,bStart,bEnd)=>aStart<bEnd&&bStart<aEnd;
  function appointmentConflict(state,date,professional,start,duration,ignoreId){
    const startMin=mins(start),endMin=startMin+duration;
    return (Array.isArray(state.appointments)?state.appointments:[]).some(a=>a&&a.id!==ignoreId&&a.date===date&&a.status!=='cancelado'&&a.professional===professional&&overlaps(startMin,endMin,mins(a.time),mins(a.time)+Math.max(30,Number(a.duration)||30)));
  }
  function ensureReservation(detail){
    if(!detail?.professional||!detail?.opportunity)return;
    const state=read();state.appointments=Array.isArray(state.appointments)?state.appointments:[];state.opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const opportunity=state.opportunities.find(o=>o&&o.id===detail.opportunity.id)||detail.opportunity;
    const date=opportunity.date,timeStart=opportunity.time||'08:00',duration=durationOf(opportunity),professional=detail.professional;
    opportunity.durationSnapshot=duration;opportunity.endTime=endOf(opportunity,timeStart);opportunity.acceptedBy=professional;opportunity.status='resolved';opportunity.acceptedAt=opportunity.acceptedAt||new Date().toISOString();
    if(opportunity.appointmentId){
      const existing=state.appointments.find(a=>a&&a.id===opportunity.appointmentId);
      if(existing){existing.sosAcceptedBy=professional;existing.sosAcceptedAt=opportunity.acceptedAt;existing.duration=duration;existing.durationMinutes=duration;existing.endTime=endOf(opportunity,existing.time);write(state);return;}
    }
    const id=`apt-sos-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    if(appointmentConflict(state,date,professional,timeStart,duration,id)){
      opportunity.status='searching';opportunity.acceptedBy='';opportunity.acceptedAt=null;opportunity.appointmentId='';write(state);
      const n=document.getElementById('agendaNotice');if(n){n.textContent=`${professional} não está disponível das ${timeStart} às ${opportunity.endTime}.`;n.hidden=false;setTimeout(()=>n.hidden=true,4500);}return;
    }
    const services=servicesOf(opportunity);
    state.appointments.push({id,date,time:timeStart,endTime:endOf(opportunity,timeStart),professional,client:opportunity.client||'Cliente',services,service:opportunity.service||services.map(s=>s.name).join(' + '),duration,durationMinutes:duration,value:valueOf(opportunity),status:'agendado',source:'sos',sosAcceptedBy:professional,sosAcceptedAt:opportunity.acceptedAt,sosOpportunityId:opportunity.id});
    opportunity.appointmentId=id;write(state);
  }
  const escapeHtml=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const durationLabel=m=>{m=Number(m)||0;const h=Math.floor(m/60),r=m%60;return h?(r?`${h}h ${r}min`:`${h}h`):`${r}min`;};
  function syncSosCells(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    const date=document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10),state=read();
    const accepted=(Array.isArray(state.appointments)?state.appointments:[]).filter(a=>a&&a.date===date&&a.source==='sos'&&a.sosAcceptedBy&&a.status!=='cancelado');
    const cells=[...grid.querySelectorAll('td[data-sos-cell="true"]')];if(!cells.length)return;
    cells.forEach(cell=>{cell.classList.remove('bm-sos-reserved','sos-cell-start','sos-cell-continuation');if(!accepted.some(a=>mins(cell.dataset.time)>=mins(a.time)&&mins(cell.dataset.time)<mins(a.time)+Math.max(30,Number(a.duration)||30))){cell.className='sos-free-cell';cell.removeAttribute('data-sos-id');cell.removeAttribute('data-appointment-id');cell.innerHTML='Livre';}});
    accepted.forEach(a=>{
      const start=mins(a.time),end=start+Math.max(30,Number(a.duration)||30);
      cells.forEach(cell=>{
        const minute=mins(cell.dataset.time);if(minute<start||minute>=end)return;
        const isStart=minute===start;cell.className=`sos-cell sos-cell-found bm-sos-reserved ${isStart?'sos-cell-start':'sos-cell-continuation'}`;cell.dataset.sosId=a.sosOpportunityId||'';cell.dataset.appointmentId=a.id;
        const html=isStart?`<strong>${escapeHtml(a.client||'Cliente')}</strong><span>${escapeHtml(a.service||'Atendimento')}</span><small>${escapeHtml(a.time)} – ${escapeHtml(a.endTime||time(end))} · ${durationLabel(Number(a.duration)||30)}</small><div class="sos-found-status">✓ ${escapeHtml(a.sosAcceptedBy)} · reservado</div>`:`<span>${escapeHtml(a.client||'Cliente')} · até ${escapeHtml(a.endTime||time(end))}</span>`;
        if(cell.innerHTML!==html)cell.innerHTML=html;
      });
    });
  }
  function boot(){
    window.addEventListener('beautymove:sos-accepted',event=>{ensureReservation(event.detail||{});setTimeout(()=>{lastSignature='';syncSosCells();},80);});
    let lastSignature='';
    const tick=()=>{const signature=JSON.stringify([document.getElementById('agendaDatePicker')?.value||'',localStorage.getItem(STATE_KEY),document.getElementById('agendaGrid')?.innerHTML.length||0]);if(signature!==lastSignature){lastSignature=signature;syncSosCells();}};
    setTimeout(tick,900);setInterval(tick,700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
