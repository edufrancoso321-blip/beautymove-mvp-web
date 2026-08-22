/* BeautyMove — ponte de compatibilidade da Agenda.
 *
 * REGRA ESTRUTURAL:
 * Este módulo NÃO altera appointments, opportunities ou transactions.
 * A persistência da Agenda pertence exclusivamente ao
 * agenda-firestore-persistence.js e a renderização pertence ao agenda.js.
 *
 * O código anterior tentava "normalizar" atendimentos sobrepostos e, ao
 * encontrar registros que pareciam duplicados, alterava a duração do primeiro
 * atendimento e removia o segundo. Isso é destrutivo: uma confirmação S.O.S.
 * ou outro snapshot legítimo podia reaparecer com outra duração depois de F5,
 * troca de aba ou hidratação do Firestore. Este módulo não pode ser autoridade
 * de dados.
 */
(function(){
  'use strict';
  const METRIC_IDS=['metricAppointments','metricProgress','metricSos','metricCanceled'];

  function ensureMetricTargets(){
    let host=document.getElementById('agendaMetricCompat');
    if(!host){
      host=document.createElement('div');
      host.id='agendaMetricCompat';
      host.hidden=true;
      host.setAttribute('aria-hidden','true');
      document.body.appendChild(host);
    }
    METRIC_IDS.forEach(id=>{
      if(!document.getElementById(id)){
        const node=document.createElement('span');
        node.id=id;
        host.appendChild(node);
      }
    });
  }

  /* Compatibilidade somente: nenhum listener de storage, nenhum reload,
     nenhum click sintético e nenhuma escrita em localStorage. */
  if(document.body)ensureMetricTargets();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',ensureMetricTargets,{once:true});
  }else{
    ensureMetricTargets();
  }
})();
