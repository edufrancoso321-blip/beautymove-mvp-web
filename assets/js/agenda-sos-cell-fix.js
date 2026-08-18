/* BeautyMove — sincronização da célula S.O.S. após seleção de profissional */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}catch(_){return {appointments:[],opportunities:[]};}};
  const dateKey=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const minutes=v=>{const p=String(v||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};

  /*
   * A coluna S.O.S. representa a oportunidade que está sendo acompanhada pela
   * recepção neste momento. O atendimento continua normalmente na coluna da
   * profissional original; na coluna S.O.S. mostramos somente a oportunidade
   * aceita mais recentemente, evitando que atendimentos antigos permaneçam
   * visualmente duplicados na Central.
   */
  function currentAccepted(){
    const state=readState();
    const items=(Array.isArray(state.appointments)?state.appointments:[])
      .filter(a=>a&&a.date===dateKey()&&a.sosAcceptedBy&&a.status!=='cancelado');
    if(!items.length)return null;
    items.sort((a,b)=>{
      const ta=Date.parse(a.sosAcceptedAt||'')||0;
      const tb=Date.parse(b.sosAcceptedAt||'')||0;
      return tb-ta || minutes(b.time)-minutes(a.time);
    });
    return items[0];
  }

  function sync(){
    const grid=document.getElementById('agendaGrid');
    if(!grid)return;
    const item=currentAccepted();

    /* Primeiro remove qualquer célula S.O.S. antiga criada por esta camada. */
    grid.querySelectorAll('.sos-cell-found').forEach(cell=>{
      const time=cell.dataset.time||'08:00';
      cell.outerHTML=`<td data-agenda-cell data-time="${esc(time)}" data-sos-cell="true" class="sos-free-cell">Livre</td>`;
    });

    /* Depois marca somente a oportunidade atualmente acompanhada. */
    if(!item)return;
    const cell=[...grid.querySelectorAll('[data-sos-cell="true"]')]
      .find(cell=>minutes(cell.dataset.time)===minutes(item.time));
    if(!cell)return;

    cell.outerHTML=`<td data-agenda-cell data-time="${esc(item.time)}" data-appointment-id="${esc(item.id)}" class="sos-cell sos-cell-found"><strong>${esc(item.client||'Cliente')}</strong><span>${esc(item.service||'Atendimento')}</span><small>${esc(item.time)} · Profissional: ${esc(item.sosAcceptedBy)}</small><div class="sos-found-status">✓ Profissional encontrada · Atendimento em acompanhamento</div></td>`;
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
