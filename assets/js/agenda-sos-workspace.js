/* BeautyMove — composição estrutural da operação S.O.S.
 * Agenda S.O.S. aberta dentro do mesmo workspace da Agenda Profissionais.
 * Não contém regra de negócio: apenas estrutura e foco entre os componentes.
 */
(function(){
  'use strict';
  function build(){
    const workspace=document.querySelector('.agenda-workspace');
    const panel=document.querySelector('.agenda-sos-panel');
    if(!workspace||!panel||document.querySelector('.agenda-sos-agenda-card'))return;

    const card=document.createElement('section');
    card.className='agenda-sos-agenda-card';
    card.setAttribute('aria-label','Agenda S.O.S.');
    card.innerHTML=`<div class="agenda-sos-agenda-head"><div class="agenda-sos-agenda-title"><span class="sos-badge">⚡</span><div><strong>Agenda S.O.S.</strong><small>Oportunidades definidas pela recepcionista</small></div></div><div class="agenda-sos-agenda-controls"><button class="secondary compact" id="sosAgendaPrev" type="button" aria-label="Dia anterior">‹</button><input id="sosAgendaDate" type="date" aria-label="Data da Agenda S.O.S."><button class="secondary compact" id="sosAgendaNext" type="button" aria-label="Próximo dia">›</button><button class="secondary compact" id="sosAgendaToday" type="button">Hoje</button></div></div><div id="sosAgendaGrid"></div>`;

    workspace.insertBefore(card,panel);
    const date=document.getElementById('sosAgendaDate');
    if(date)date.value=new Date().toISOString().slice(0,10);

    window.addEventListener('beautymove:sos-focus',e=>{
      card.scrollIntoView({behavior:'smooth',block:'nearest'});
      setTimeout(()=>window.dispatchEvent(new CustomEvent('beautymove:sos-selected',{detail:{id:e.detail?.id||null}})),120);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
