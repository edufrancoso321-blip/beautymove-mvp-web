/* BeautyMove — composição estrutural da operação S.O.S.
 * Agenda S.O.S. aberta dentro do mesmo workspace da Agenda Profissionais.
 * A data é controlada exclusivamente pelo calendário principal da Agenda.
 * A Agenda principal e a Agenda S.O.S. compartilham UMA única área de rolagem vertical.
 * Não contém regra de negócio: apenas estrutura e foco entre os componentes.
 */
(function(){
  'use strict';
  function build(){
    const workspace=document.querySelector('.agenda-workspace');
    const main=document.querySelector('.agenda-workspace>.agenda-primary');
    const panel=document.querySelector('.agenda-sos-panel');
    if(!workspace||!main||!panel)return;
    if(document.querySelector('.agenda-scroll-region'))return;

    const region=document.createElement('div');
    region.className='agenda-scroll-region';
    region.setAttribute('aria-label','Agenda principal e Agenda S.O.S.');
    workspace.insertBefore(region,panel);
    region.appendChild(main);

    const card=document.createElement('section');
    card.className='agenda-sos-agenda-card';
    card.setAttribute('aria-label','Agenda S.O.S.');
    card.innerHTML=`<div class="agenda-sos-agenda-head"><div class="agenda-sos-agenda-title"><span class="sos-badge">⚡</span><div><strong>Agenda S.O.S.</strong><small>Oportunidades definidas pela recepcionista</small></div></div></div><div id="sosAgendaGrid"></div>`;
    region.appendChild(card);

    window.addEventListener('beautymove:sos-focus',e=>{
      card.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
      setTimeout(()=>window.dispatchEvent(new CustomEvent('beautymove:sos-selected',{detail:{id:e.detail?.id||null}})),120);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
