/* BeautyMove — Gate visual da Agenda por plano */
(function(){
  const FEATURE='sos_opportunities';
  const STYLE_ID='beautymove-plan-gate-style';

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      html[data-beautymove-sos="locked"] .sos-col,
      html[data-beautymove-sos="locked"] [data-sos-cell],
      html[data-beautymove-sos="locked"] .sos-metric,
      html[data-beautymove-sos="locked"] .legend-item:has(.purple),
      html[data-beautymove-sos="locked"] [data-feature="sos-opportunities"],
      html[data-beautymove-sos="locked"] .opportunities-panel { display:none !important; }
    `;
    document.head.appendChild(style);
  }

  function applyGate(){
    const enabled=window.BeautyMovePlan?.has(FEATURE)===true;
    document.documentElement.dataset.beautymoveSos=enabled?'enabled':'locked';
    if(enabled){
      document.querySelectorAll('[data-feature="sos-opportunities"], .opportunities-panel').forEach(el=>el.hidden=false);
      return;
    }
    document.querySelectorAll('#sosModal, .sos-header-button').forEach(el=>el.remove());
    document.querySelectorAll('[data-feature="sos-opportunities"], .opportunities-panel').forEach(el=>el.hidden=true);
  }

  function init(){
    if(!window.BeautyMovePlan)return;
    ensureStyle();
    applyGate();
    const grid=document.getElementById('agendaGrid');
    if(grid){
      new MutationObserver(applyGate).observe(grid,{childList:true,subtree:true});
    }
    document.addEventListener('beautymove:planchange',applyGate);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
