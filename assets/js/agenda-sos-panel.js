/* BeautyMove — Painel S.O.S.
 * Responsabilidade: somente a Central de Oportunidades lateral.
 * A Agenda S.O.S. visível ao lado da Agenda Profissionais é a única
 * visualização temporal das oportunidades na tela principal.
 * Este painel NÃO duplica as 18 oportunidades e NÃO renderiza uma agenda.
 */
(function(){
  'use strict';

  function render(){
    const body=document.getElementById('agendaSosPanelBody');
    const count=document.getElementById('agendaSosCount');
    if(!body)return;

    if(count) count.textContent='Agenda S.O.S. vinculada ao painel';

    body.innerHTML=`
      <div class="agenda-sos-panel-empty">
        <strong>Central de Oportunidades</strong>
        <p>As oportunidades S.O.S. são exibidas na <strong>Agenda S.O.S.</strong> ao lado da Agenda Profissionais.</p>
        <p>Este painel não duplica oportunidades nem contém uma segunda agenda.</p>
      </div>`;
  }

  function boot(){
    render();
    document.getElementById('agendaSosOpen')?.addEventListener('click',()=>window.location.href='sos.html');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
