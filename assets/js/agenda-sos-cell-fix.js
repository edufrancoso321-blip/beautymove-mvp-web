/* BeautyMove — sincronização da célula S.O.S. para solicitações pendentes e atendimentos aceitos */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}catch(_){return {appointments:[],opportunities:[]};}};
  const dateKey=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const minutes=v=>{const p=String(v||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};

  function currentItems(){
    const state=readState();
    const appointments=Array.isArray(state.appointments)?state.appointments:[];
    const opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const pending=opportunities
      .filter(o=>o&&o.date===dateKey()&&o.source==='sos'&&o.status!=='cancelado'&&o.status!=='resolved')
      .map(o=>({
        id:o.id||'',
        time:o.time||'08:00',
        client:o.client||'Cliente',
        service:o.service||'Atendimento',
        appointmentId:o.appointmentId||'',
        state:'pending',
        acceptedBy:''
      }));
    const accepted=opportunities
      .filter(o=>o&&o.date===dateKey()&&o.source==='sos'&&o.status==='resolved'&&o.acceptedBy&&!o.cancelled)
      .map(o=>{
        const a=o.appointmentId?appointments.find(x=>x&&x.id===o.appointmentId):null;
        return {
          id:o.id||'',
          time:o.time||a?.time||'08:00',
          client:o.client||a?.client||'Cliente',
          service:o.service||a?.service||'Atendimento',
          appointmentId:a?.id||o.appointmentId||'',
          state:'accepted',
          acceptedBy:o.acceptedBy
        };
      });
    const map=new Map();
    [...pending,...accepted].forEach(item=>map.set(item.time,item));
    return [...map.values()].sort((a,b)=>minutes(a.time)-minutes(b.time));
  }

  function sync(){
    const grid=document.getElementById('agendaGrid');
    if(!grid)return;
    const items=currentItems();
    const cells=[...grid.querySelectorAll('[data-sos-cell="true"]')];
    if(!cells.length)return;

    grid.querySelectorAll('.sos-cell-found').forEach(cell=>{
      cell.outerHTML=`<td data-agenda-cell data-time="${esc(cell.dataset.time||'08:00')}" data-sos-cell="true" class="sos-free-cell">Livre</td>`;
    });

    items.forEach(item=>{
      const cell=[...grid.querySelectorAll('[data-sos-cell="true"]')]
        .find(c=>minutes(c.dataset.time)===minutes(item.time));
      if(!cell)return;
      const accepted=item.state==='accepted';
      cell.outerHTML=`<td data-agenda-cell data-time="${esc(item.time)}" data-appointment-id="${esc(item.appointmentId)}" data-sos-id="${esc(item.id)}" data-sos-cell="true" class="sos-cell sos-cell-found">
        <strong>${esc(item.client)}</strong>
        <span>${esc(item.service)}</span>
        ${accepted
          ? `<small>${esc(item.acceptedBy)}</small><div class="sos-found-status">✓ Profissional encontrada · Atendimento em acompanhamento</div>`
          : `<small>Profissional: aguardando seleção</small><div class="sos-found-status">● Buscando profissionais</div>`}
      </td>`;
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
    window.addEventListener('beautymove:sos-created',()=>setTimeout(()=>{signature='';tick();},80));
    window.addEventListener('beautymove:sos-accepted',()=>setTimeout(()=>{signature='';tick();},80));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
