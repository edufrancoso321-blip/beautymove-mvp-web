/* BeautyMove — Painel S.O.S.
 * Responsabilidade: somente a Central de Oportunidades lateral.
 * NÃO altera a estrutura, largura, rolagem ou composição da Agenda principal.
 * A Agenda principal permanece sob autoridade exclusiva de agenda-professionals-core.js.
 */
(function(){
  'use strict';
  const STATE='beautymove.mvp.state';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const duration=v=>{const n=Number(v)||0,h=Math.floor(n/60),m=n%60;return h?`${h}h${m?` ${m}min`:''}`:`${m}min`};
  const statusLabel=v=>({aberta:'Aberta',em_busca:'Buscando profissionais',buscando:'Buscando profissionais',enviada:'Enviada ao profissional',aceita:'Aceita',accepted:'Aceita',em_andamento:'Em andamento',finalizada:'Finalizada',cancelada:'Cancelada'})[String(v||'').toLowerCase()]||String(v||'Aberta');
  function active(){const st=read(STATE,{opportunities:[]});return Array.isArray(st?.opportunities)?st.opportunities.filter(o=>!['finalizada','cancelada','concluida'].includes(String(o.status||'').toLowerCase())):[]}
  function focusOpportunity(id){
    const op=active().find(o=>String(o.id)===String(id));
    if(op?.date){const picker=document.getElementById('agendaDatePicker');if(picker&&picker.value!==op.date){picker.value=op.date;picker.dispatchEvent(new Event('change',{bubbles:true}));}}
    window.location.href=`sos.html${id?`?opportunity=${encodeURIComponent(id)}`:''}`;
  }
  function render(){
    const body=document.getElementById('agendaSosPanelBody'),count=document.getElementById('agendaSosCount');
    if(!body)return;
    const ops=active();
    if(count)count.textContent=`${ops.length} oportunidade${ops.length===1?'':'s'} ativa${ops.length===1?'':'s'}`;
    if(!ops.length){body.innerHTML='<div class="agenda-sos-empty">Nenhuma oportunidade S.O.S. ativa no momento.</div>';return}
    body.innerHTML=ops.map(o=>`<article class="agenda-sos-opportunity" data-sos-id="${esc(o.id)}" tabindex="0"><h3>${esc(o.service||'Serviço S.O.S.')}</h3><p><strong>Cliente:</strong> ${esc(o.client||'Cliente')}</p><p><strong>Data:</strong> ${esc(o.date||'')} · <strong>Horário:</strong> ${esc(o.time||'')}</p><p><strong>Especialidade:</strong> ${esc(o.specialty||'')} · <strong>Duração:</strong> ${duration(o.durationMinutes)}</p>${o.value!=null?`<p><strong>Valor:</strong> R$ ${Number(o.value||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>`:''}${o.radius?`<p><strong>Raio:</strong> ${esc(o.radius)}</p>`:''}${o.materials?`<p><strong>Material:</strong> ${esc(o.materials)}</p>`:''}${o.sentTo?`<p><strong>Profissional:</strong> ${esc(o.sentTo)}</p>`:''}${o.notes?`<p><strong>Obs.:</strong> ${esc(o.notes)}</p>`:''}<span class="agenda-sos-status">${esc(statusLabel(o.status))}</span><button type="button" class="agenda-sos-open-item" data-open-sos="${esc(o.id)}">Ver na Agenda S.O.S.</button></article>`).join('');
    body.querySelectorAll('[data-open-sos]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();focusOpportunity(b.dataset.openSos)}));
    body.querySelectorAll('[data-sos-id]').forEach(card=>{card.addEventListener('click',()=>focusOpportunity(card.dataset.sosId));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();focusOpportunity(card.dataset.sosId)}})});
  }
  function boot(){render();document.getElementById('agendaSosOpen')?.addEventListener('click',()=>window.location.href='sos.html');window.addEventListener('storage',e=>{if(e.key===STATE)render()});window.addEventListener('beautymove:sos-changed',render)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
