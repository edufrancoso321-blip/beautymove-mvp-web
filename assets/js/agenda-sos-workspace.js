/* BeautyMove — composição estrutural da operação S.O.S.
 * Não contém regra de negócio. Apenas monta a Agenda S.O.S. aberta
 * e coloca o Painel S.O.S. ao lado dela.
 */
(function(){
  'use strict';
  function build(){
    const workspace=document.querySelector('.agenda-workspace');
    const panel=document.querySelector('.agenda-sos-panel');
    if(!workspace||!panel||document.querySelector('.agenda-sos-workspace'))return;
    const section=document.createElement('section');
    section.className='agenda-sos-workspace';
    section.setAttribute('aria-label','Operação S.O.S.');
    const card=document.createElement('section');
    card.className='agenda-sos-agenda-card';
    card.innerHTML=`<div class="agenda-sos-agenda-head"><div class="agenda-sos-agenda-title"><span class="sos-badge">⚡</span><div><strong>Agenda S.O.S.</strong><small>Oportunidades definidas pela recepcionista</small></div></div><div class="agenda-sos-agenda-controls"><button class="secondary compact" id="sosAgendaPrev" type="button" aria-label="Dia anterior">‹</button><input id="sosAgendaDate" type="date" aria-label="Data da Agenda S.O.S."><button class="secondary compact" id="sosAgendaNext" type="button" aria-label="Próximo dia">›</button><button class="secondary compact" id="sosAgendaToday" type="button">Hoje</button></div></div><div id="sosAgendaGrid"></div>`;
    section.appendChild(card);
    section.appendChild(panel);
    workspace.insertAdjacentElement('afterend',section);
    const date=document.getElementById('sosAgendaDate');
    if(date)date.value=new Date().toISOString().slice(0,10);
    document.getElementById('agendaSosOpen')?.addEventListener('click',focusAgenda,{once:false});
    function focusAgenda(){section.scrollIntoView({behavior:'smooth',block:'start'});}
    window.addEventListener('beautymove:sos-focus',e=>{focusAgenda();setTimeout(()=>window.dispatchEvent(new CustomEvent('beautymove:sos-selected',{detail:{id:e.detail?.id||null}})),180)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
