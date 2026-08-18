/* BeautyMove — sincronização segura da célula S.O.S. após seleção de profissional */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}catch(_){return {appointments:[],opportunities:[]};}};
  const dateKey=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const minutes=v=>{const p=String(v||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};

  function currentAccepted(){
    const state=readState();
    const items=(Array.isArray(state.appointments)?state.appointments:[])
      .filter(a=>a&&a.date===dateKey()&&a.sosAcceptedBy&&a.status!=='cancelado');
    items.sort((a,b)=>{
      const ta=Date.parse(a.sosAcceptedAt||'')||0;
      const tb=Date.parse(b.sosAcceptedAt||'')||0;
      return tb-ta || minutes(a.time)-minutes(b.time);
    });
    return items;
  }

  function sync(){
    const grid=document.getElementById('agendaGrid');
    if(!grid)return;
    const accepted=currentAccepted();
    const cells=[...grid.querySelectorAll('[data-sos-cell="true"]')];
    if(!cells.length)return;

    /* Remove somente as células marcadas pela camada anterior. */
    grid.querySelectorAll('.sos-cell-found').forEach(cell=>{
      const time=cell.dataset.time||'08:00';
      cell.outerHTML=`<td data-agenda-cell data-time="${esc(time)}" data-sos-cell="true" class="sos-free-cell">Livre</td>`;
    });

    /* A Agenda pode acompanhar mais de um S.O.S.; cada atendimento fica no seu horário. */
    accepted.forEach(item=>{
      const cell=[...grid.querySelectorAll('[data-sos-cell="true"]')]
        .find(c=>minutes(c.dataset.time)===minutes(item.time));
      if(!cell)return;
      cell.outerHTML=`<td data-agenda-cell data-time="${esc(item.time)}" data-appointment-id="${esc(item.id)}" data-sos-cell="true" class="sos-cell sos-cell-found"><strong>${esc(item.client||'Cliente')}</strong><span>${esc(item.service||'Atendimento')}</span><small>${esc(item.time)} · Profissional: ${esc(item.sosAcceptedBy)}</small><div class="sos-found-status">✓ Profissional encontrada · Atendimento em acompanhamento</div></td>`;
    });
  }

  function boot(){
    let signature='';
    const tick=()=>{
      const next=JSON.stringify([dateKey(),localStorage.getItem(STATE_KEY),document.getElementById('agendaGrid')?.innerHTML.length||0]);
      if(next!==signature){signature=next;sync();}
    };
    setTimeout(tick,600);
    setInterval(tick,700);
    ['prevDay','nextDay','todayBtn','agendaDatePicker'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(()=>{signature='';tick();},250)));
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(()=>{signature='';tick();},150));
    window.addEventListener('beautymove:sos-accepted',()=>setTimeout(()=>{signature='';tick();},80));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
