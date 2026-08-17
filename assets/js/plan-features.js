/* BeautyMove — Controle central de plano e recursos
 * MVP: a fonte de verdade ainda é localStorage. Na integração com backend,
 * este módulo deverá consumir o plano retornado pelo servidor.
 */
(function(){
  const STORAGE_KEY='beautymove.mvp.plan';
  const DEFAULT_PLAN='premium'; // Mantém o protótipo atual funcional enquanto o plano real não vem do backend.
  const PLANS={
    gratuito:{label:'Gratuito',features:{sos_opportunities:false}},
    premium:{label:'Premium',features:{sos_opportunities:true}}
  };
  const FEATURES={sos_opportunities:'Central de Oportunidades S.O.S.'};

  function normalizePlan(value){return PLANS[value]?value:DEFAULT_PLAN;}
  function getPlan(){return normalizePlan(localStorage.getItem(STORAGE_KEY)||DEFAULT_PLAN);}
  function can(feature){const plan=PLANS[getPlan()];return Boolean(plan?.features?.[feature]);}
  function setPlan(plan){const normalized=normalizePlan(plan);localStorage.setItem(STORAGE_KEY,normalized);apply();return normalized;}

  function showPlanNotice(){
    const notice=document.getElementById('agendaNotice');
    if(!notice)return;
    const params=new URLSearchParams(location.search);
    if(params.get('feature')==='sos-locked'){
      notice.textContent='A Central de Oportunidades S.O.S. está disponível nos planos pagos.';
      notice.hidden=false;
      window.setTimeout(()=>{notice.hidden=true;},5000);
    }
  }

  function setSosVisibility(enabled){
    document.body.dataset.plan=getPlan();
    document.body.dataset.sosEnabled=String(enabled);

    const grid=document.querySelector('.agenda-grid');
    if(grid){
      const header=grid.querySelector('thead .sos-col');
      const rows=grid.querySelectorAll('tbody tr');
      if(header)header.hidden=!enabled;
      rows.forEach(row=>{const cell=row.querySelector('[data-sos-cell="true"], [data-sos-id]');if(cell)cell.hidden=!enabled;});
    }

    document.querySelectorAll('.sos-metric,.legend-item .legend-dot.purple').forEach(el=>{
      const target=el.closest('.sos-metric')||el.closest('.legend-item')||el;
      if(target)target.hidden=!enabled;
    });

    document.querySelectorAll('.salon-nav a[href="sos.html"]').forEach(link=>{link.hidden=!enabled;});
    const sosModal=document.getElementById('sosModal');
    if(sosModal&&!enabled){sosModal.classList.remove('is-open');sosModal.setAttribute('aria-hidden','true');}
  }

  function apply(){
    const enabled=can('sos_opportunities');
    setSosVisibility(enabled);
    if(!enabled && location.pathname.endsWith('/sos.html')){
      window.location.replace('salao.html?feature=sos-locked');
      return;
    }
    showPlanNotice();
  }

  window.BeautyMovePlan={
    STORAGE_KEY,
    PLANS,
    FEATURES,
    getPlan,
    can,
    setPlan,
    apply
  };

  function init(){
    apply();
    const observer=new MutationObserver(()=>setSosVisibility(can('sos_opportunities')));
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
