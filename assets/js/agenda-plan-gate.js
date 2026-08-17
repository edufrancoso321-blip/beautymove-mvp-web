/* BeautyMove — compatibilidade do controle de plano.
 * O MVP não oculta mais a Agenda/S.O.S. por plano.
 * Ocorrências continuam visíveis para todos; a camada premium protege apenas a resolução de oportunidades.
 */
(function(){
  function apply(){
    const plan=window.BeautyMovePlan?.getPlan?.()||'pago';
    document.documentElement.dataset.beautymoveSos='enabled';
    document.body.dataset.plan=plan;
    document.body.dataset.sosEnabled='true';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
  document.addEventListener('beautymove:planchange',apply);
})();
