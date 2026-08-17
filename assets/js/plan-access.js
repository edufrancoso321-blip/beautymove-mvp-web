/* BeautyMove — Controle de plano e recursos
 * Camada de autorização de interface para o MVP.
 * A fonte definitiva do plano deverá migrar para o backend quando a autenticação
 * e o billing estiverem conectados. Este arquivo não é uma barreira de segurança.
 */
(function(){
  const STORAGE_KEY='beautymove.mvp.plan';
  const PLAN_DEFINITIONS={
    gratuito:{label:'Gratuito',features:{sos_opportunities:false}},
    pago:{label:'Pago',features:{sos_opportunities:true}}
  };

  function normalizePlan(value){
    const normalized=String(value||'').trim().toLowerCase();
    if(normalized==='free'||normalized==='gratis'||normalized==='gratuito')return'gratuito';
    if(normalized==='premium'||normalized==='pro'||normalized==='paid'||normalized==='pago')return'pago';
    return null;
  }

  function readPlan(){
    const queryPlan=normalizePlan(new URLSearchParams(window.location.search).get('plan'));
    if(queryPlan)return queryPlan;
    const storedPlan=normalizePlan(localStorage.getItem(STORAGE_KEY));
    if(storedPlan)return storedPlan;
    const bodyPlan=normalizePlan(document.body?.dataset?.plan);
    return bodyPlan||'pago';
  }

  const api={
    key:STORAGE_KEY,
    definitions:PLAN_DEFINITIONS,
    getPlan:readPlan,
    getPlanInfo(){const plan=readPlan();return {id:plan,...PLAN_DEFINITIONS[plan]};},
    has(feature){const info=this.getPlanInfo();return Boolean(info.features?.[feature]);},
    setDemoPlan(plan){
      const normalized=normalizePlan(plan);
      if(!normalized)throw new Error('Plano inválido. Use gratuito ou pago.');
      localStorage.setItem(STORAGE_KEY,normalized);
      document.dispatchEvent(new CustomEvent('beautymove:planchange',{detail:this.getPlanInfo()}));
      return this.getPlanInfo();
    },
    clearDemoPlan(){
      localStorage.removeItem(STORAGE_KEY);
      document.dispatchEvent(new CustomEvent('beautymove:planchange',{detail:this.getPlanInfo()}));
      return this.getPlanInfo();
    }
  };

  window.BeautyMovePlan=api;
  document.documentElement.dataset.beautymovePlan=api.getPlan();
})();
