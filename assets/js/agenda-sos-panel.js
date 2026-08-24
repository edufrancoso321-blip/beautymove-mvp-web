/* BeautyMove — Painel S.O.S. V1
 * Responsabilidade única: visualizar oportunidades S.O.S. e abrir a Agenda S.O.S.
 * NÃO altera appointments, horários ou status da Agenda Profissionais.
 */
(function(){
  'use strict';
  const STATE='beautymove.mvp.state';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const duration=v=>{const n=Number(v)||0,h=Math.floor(n/60),m=n%60;return h?`${h}h${m?` ${m}min`:''}`:`${m}min`};
  function render(){
    const body=document.getElementById('agendaSosPanelBody'),count=document.getElementById('agendaSosCount');
    if(!body)return;
    const st=read(STATE,{opportunities:[]});
    const ops=Array.isArray(st?.opportunities)?st.opportunities.filter(o=>!['finalizada','cancelada','concluida'].includes(String(o.status||'').toLowerCase())):[];
    if(count)count.textContent=`${ops.length} oportunidade${ops.length===1?'':'s'} ativa${ops.length===1?'':'s'}`;
    if(!ops.length){body.innerHTML='<div class="agenda-sos-empty">Nenhuma oportunidade S.O.S. ativa no momento.</div>';return;}
    body.innerHTML=ops.map(o=>`<article class="agenda-sos-opportunity"><h3>${esc(o.service||'Serviço S.O.S.')}</h3><p>${esc(o.client||'Cliente')} · ${esc(o.date||'')} · ${esc(o.time||'')}</p><p>${esc(o.specialty||'Especialidade')} · ${duration(o.durationMinutes)} · ${money(o.value)}</p><span class="agenda-sos-status">${esc(o.status||'aberta')}</span></article>`).join('');
  }
  function boot(){render();document.getElementById('agendaSosOpen')?.addEventListener('click',()=>{window.location.href='sos.html'});window.addEventListener('storage',e=>{if(e.key===STATE)render()});window.addEventListener('beautymove:sos-changed',render);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
