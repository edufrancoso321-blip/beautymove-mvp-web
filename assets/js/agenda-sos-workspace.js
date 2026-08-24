/* BeautyMove — composição estrutural da operação S.O.S.
 * Agenda S.O.S. aberta dentro do mesmo workspace da Agenda Profissionais.
 * A data é controlada exclusivamente pelo calendário principal da Agenda.
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
    card.innerHTML=`<div class="agenda-sos-agenda-head"><div class="agenda-sos-agenda-title"><span class="sos-badge">⚡</span><div><strong>Agenda S.O.S.</strong><small>Oportunidades definidas pela recepcionista</small></div></div></div><div id="sosAgendaGrid"></div>`;

    workspace.insertBefore(card,panel);

    window.addEventListener('beautymove:sos-focus',e=>{
      card.scrollIntoView({behavior:'smooth',block:'nearest'});
      setTimeout(()=>window.dispatchEvent(new CustomEvent('beautymove:sos-selected',{detail:{id:e.detail?.id||null}})),120);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
