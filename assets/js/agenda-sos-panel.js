/* BeautyMove — Painel S.O.S. V2
 * Responsabilidade única: espelhar oportunidades S.O.S. e navegar para a Agenda S.O.S.
 * NÃO altera appointments, horários ou status da Agenda Profissionais.
 */
(function(){
  'use strict';
  const STATE='beautymove.mvp.state';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const duration=v=>{const n=Number(v)||0,h=Math.floor(n/60),m=n%60;return h?`${h}h${m?` ${m}min`:''}`:`${m}min`};
  function active(){const st=read(STATE,{opportunities:[]});return Array.isArray(st?.opportunities)?st.opportunities.filter(o=>!['finalizada','cancelada','concluida'].includes(String(o.status||'').toLowerCase())):[]}
  function openOpportunity(id){window.location.href=`sos.html?opportunity=${encodeURIComponent(id||'')}`}
  function render(){
    const body=document.getElementById('agendaSosPanelBody'),count=document.getElementById('agendaSosCount');if(!body)return;
    const ops=active();if(count)count.textContent=`${ops.length} oportunidade${ops.length===1?'':'s'} ativa${ops.length===1?'':'s'}`;
    if(!ops.length){body.innerHTML='<div class="agenda-sos-empty">Nenhuma oportunidade S.O.S. ativa no momento.</div>';return;}
    body.innerHTML=ops.map(o=>`<article class="agenda-sos-opportunity" data-sos-id="${esc(o.id)}" tabindex="0"><h3>${esc(o.service||'Serviço S.O.S.')}</h3><p>${esc(o.client||'Cliente')} · ${esc(o.date||'')} · ${esc(o.time||'')}</p><p>${esc(o.specialty||'Especialidade')} · ${duration(o.durationMinutes)}</p><span class="agenda-sos-status">${esc(o.status||'aberta')}</span><button type="button" class="agenda-sos-open-item" data-open-sos="${esc(o.id)}">Abrir na Agenda S.O.S.</button></article>`).join('');
    body.querySelectorAll('[data-open-sos]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openOpportunity(b.dataset.openSos)}));
    body.querySelectorAll('[data-sos-id]').forEach(card=>{card.addEventListener('click',()=>openOpportunity(card.dataset.sosId));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openOpportunity(card.dataset.sosId)}})});
  }
  function boot(){render();document.getElementById('agendaSosOpen')?.addEventListener('click',()=>window.location.href='sos.html');window.addEventListener('storage',e=>{if(e.key===STATE)render()});window.addEventListener('beautymove:sos-changed',render);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
