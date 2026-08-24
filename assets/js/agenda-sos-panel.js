/* BeautyMove — Painel S.O.S.
 * Responsabilidade única: espelhar oportunidades e conversar somente com a Agenda S.O.S.
 * A Agenda S.O.S. usa exclusivamente a data do calendário principal.
 */
(function(){
  'use strict';
  const base='assets/';
  function ensureAssets(){
    if(!document.querySelector('link[data-sos-workspace-css]')){const l=document.createElement('link');l.rel='stylesheet';l.href=`${base}css/agenda-sos-workspace.css?v=20260824-4`;l.dataset.sosWorkspaceCss='1';document.head.appendChild(l)}
    if(document.querySelector('script[data-sos-workspace-js]'))return;
    const a=document.createElement('script');a.src=`${base}js/agenda-sos-workspace.js?v=20260824-4`;a.dataset.sosWorkspaceJs='1';a.onload=()=>{if(document.querySelector('script[data-sos-agenda-js]'))return;const b=document.createElement('script');b.src=`${base}js/agenda-sos.js?v=20260824-4`;b.dataset.sosAgendaJs='1';document.body.appendChild(b)};document.body.appendChild(a);
  }
  ensureAssets();
  const STATE='beautymove.mvp.state';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const duration=v=>{const n=Number(v)||0,h=Math.floor(n/60),m=n%60;return h?`${h}h${m?` ${m}min`:''}`:`${m}min`};
  function active(){const st=read(STATE,{opportunities:[]});return Array.isArray(st?.opportunities)?st.opportunities.filter(o=>!['finalizada','cancelada','concluida'].includes(String(o.status||'').toLowerCase())):[]}
  function setMainDate(date){const picker=document.getElementById('agendaDatePicker');if(!picker||!date)return;if(picker.value!==date){picker.value=date;picker.dispatchEvent(new Event('change',{bubbles:true}))}}
  function focusOpportunity(id){
    const agenda=document.querySelector('.agenda-sos-agenda-card');
    const op=active().find(o=>String(o.id)===String(id));
    if(op?.date)setMainDate(op.date);
    if(!agenda){window.location.href=`sos.html?opportunity=${encodeURIComponent(id||'')}`;return}
    agenda.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
    setTimeout(()=>window.dispatchEvent(new CustomEvent('beautymove:sos-selected',{detail:{id:id||null}})),180);
  }
  function render(){
    const body=document.getElementById('agendaSosPanelBody'),count=document.getElementById('agendaSosCount');if(!body)return;
    const ops=active();if(count)count.textContent=`${ops.length} oportunidade${ops.length===1?'':'s'} ativa${ops.length===1?'':'s'}`;
    if(!ops.length){body.innerHTML='<div class="agenda-sos-empty">Nenhuma oportunidade S.O.S. ativa no momento.</div>';return;}
    body.innerHTML=ops.map(o=>`<article class="agenda-sos-opportunity" data-sos-id="${esc(o.id)}" tabindex="0"><h3>${esc(o.service||'Serviço S.O.S.')}</h3><p>${esc(o.client||'Cliente')} · ${esc(o.date||'')} · ${esc(o.time||'')}</p><p>${esc(o.specialty||'Especialidade')} · ${duration(o.durationMinutes)}</p><span class="agenda-sos-status">${esc(o.status||'aberta')}</span><button type="button" class="agenda-sos-open-item" data-open-sos="${esc(o.id)}">Ver na Agenda S.O.S.</button></article>`).join('');
    body.querySelectorAll('[data-open-sos]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();focusOpportunity(b.dataset.openSos)}));
    body.querySelectorAll('[data-sos-id]').forEach(card=>{card.addEventListener('click',()=>focusOpportunity(card.dataset.sosId));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();focusOpportunity(card.dataset.sosId)}})});
  }
  function boot(){render();document.getElementById('agendaSosOpen')?.addEventListener('click',()=>focusOpportunity(null));window.addEventListener('storage',e=>{if(e.key===STATE)render()});window.addEventListener('beautymove:sos-changed',render);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
