/* BeautyMove — sincronização visual da célula S.O.S. após seleção de profissional */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}catch(_){return {appointments:[],opportunities:[]};}};
  const dateKey=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const minutes=v=>{const p=String(v||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  function accepted(){
    const state=readState();
    return (Array.isArray(state.appointments)?state.appointments:[]).filter(a=>a&&a.date===dateKey()&&a.sosAcceptedBy&&a.status!=='cancelado');
  }
  function sync(){
    const grid=document.getElementById('agendaGrid');
    if(!grid)return;
    const items=accepted();
    grid.querySelectorAll('[data-sos-cell="true"]').forEach(cell=>{
      const item=items.find(a=>minutes(cell.dataset.time)===minutes(a.time));
      if(!item)return;
      cell.outerHTML=`<td data-agenda-cell data-time="${esc(item.time)}" data-appointment-id="${esc(item.id)}" class="sos-cell sos-cell-found"><strong>${esc(item.client||'Cliente')}</strong><span>${esc(item.service||'Atendimento')}</span><small>${esc(item.time)} · Profissional: ${esc(item.sosAcceptedBy)}</small><div class="sos-found-status">● Atendimento em acompanhamento</div></td>`;
    });
  }
  function boot(){
    sync();
    const grid=document.getElementById('agendaGrid');
    if(grid){new MutationObserver(()=>requestAnimationFrame(sync)).observe(grid,{childList:true,subtree:true});}
    ['prevDay','nextDay','todayBtn','agendaDatePicker'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(sync,200)));
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(sync,100));
    window.addEventListener('beautymove:sos-accepted',()=>setTimeout(sync,50));
    let signature='';
    setInterval(()=>{const s=JSON.stringify([dateKey(),localStorage.getItem(STATE_KEY)]);if(s!==signature){signature=s;sync();}},500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500),{once:true});
  else setTimeout(boot,500);
})();
