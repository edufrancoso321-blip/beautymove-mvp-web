/* BeautyMove — renderizador final da coluna S.O.S.
   Regra congelada: cada solicitação/atendimento S.O.S. aparece UMA única vez,
   no horário de início. Não repetir cliente/serviço nas linhas seguintes. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}catch(_){return{appointments:[],opportunities:[]};}};
  const timeToMin=t=>{const p=String(t||'00:00').split(':').map(Number);return (Number(p[0])||0)*60+(Number(p[1])||0);};
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');

  function normalize(){
    const grid=document.querySelector('#agendaGrid .agenda-grid');
    if(!grid)return;
    const state=read();
    const ops=Array.isArray(state.opportunities)?state.opportunities:[];
    const cells=[...grid.querySelectorAll('tbody td[data-sos-id]')];
    if(!cells.length)return;

    const byId=new Map();
    cells.forEach(cell=>{
      const id=cell.dataset.sosId;
      if(!id)return;
      if(!byId.has(id))byId.set(id,[]);
      byId.get(id).push(cell);
    });

    byId.forEach((list,id)=>{
      const op=ops.find(x=>x&&x.id===id);
      const start=op?timeToMin(op.time):timeToMin(list[0].dataset.time);
      let keep=list.find(cell=>timeToMin(cell.dataset.time)===start)||list[0];
      list.forEach(cell=>{
        if(cell===keep)return;
        cell.outerHTML=`<td data-agenda-cell data-time="${esc(cell.dataset.time)}" data-sos-cell="true" class="sos-free-cell">Livre</td>`;
      });
    });

    /* Remove qualquer repetição visual de uma mesma oportunidade que tenha
       sido criada por uma renderização anterior com janela de 120 minutos. */
    const remaining=[...grid.querySelectorAll('tbody td[data-sos-id]')];
    const seen=new Set();
    remaining.forEach(cell=>{
      const id=cell.dataset.sosId;
      if(seen.has(id)){
        cell.outerHTML=`<td data-agenda-cell data-time="${esc(cell.dataset.time)}" data-sos-cell="true" class="sos-free-cell">Livre</td>`;
      }else seen.add(id);
    });
  }

  function bind(){
    const grid=document.getElementById('agendaGrid');
    if(!grid)return;
    const observer=new MutationObserver(()=>{
      if(observer.__running)return;
      observer.__running=true;
      try{normalize();}finally{observer.__running=false;}
    });
    observer.observe(grid,{childList:true,subtree:true});
    normalize();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,50),{once:true});
  else setTimeout(bind,50);
})();
