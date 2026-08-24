/* BeautyMove — divisor do Painel S.O.S. acoplado ao painel
   Regra: Agenda principal + Agenda S.O.S. são uma única área flexível.
   O divisor pertence fisicamente ao Painel S.O.S.; o painel permanece
   ancorado à direita e a área da Agenda ocupa automaticamente o restante. */
(function(){
  'use strict';

  const KEY = 'beautymove.mvp.agenda.sosPanelWidth';
  const GAP = 14;
  const PANEL_MIN = 250;
  const PANEL_MAX = 360;
  const MAIN_MIN = 600;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function injectStyles(){
    if(document.getElementById('beautymove-sos-resizer-style')) return;
    const style = document.createElement('style');
    style.id = 'beautymove-sos-resizer-style';
    style.textContent = `
      .agenda-workspace{position:relative!important;}
      .agenda-workspace > .agenda-primary{min-width:0!important;width:auto!important;}
      .agenda-workspace > .agenda-sos-panel{position:relative!important;min-width:0!important;width:auto!important;max-width:none!important;}
      .agenda-workspace-divider{
        position:absolute!important;
        left:0!important;
        top:50%!important;
        width:24px!important;
        height:52px!important;
        transform:translate(-50%,-50%)!important;
        margin:0!important;
        padding:0!important;
        border:1px solid #e1d5ef!important;
        border-radius:12px!important;
        background:#fff!important;
        box-shadow:0 2px 8px rgba(73,38,112,.08)!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        z-index:100!important;
        cursor:col-resize!important;
        touch-action:none!important;
      }
      .agenda-workspace-divider span{
        display:block!important;
        width:3px!important;
        height:18px!important;
        border-left:2px dotted var(--purple)!important;
        border-right:2px dotted var(--purple)!important;
        opacity:.85!important;
      }
      .agenda-workspace-divider:hover,
      .agenda-workspace-divider.is-dragging{
        background:#faf7ff!important;
        border-color:var(--purple)!important;
      }
      .agenda-workspace-divider.is-dragging{box-shadow:0 3px 12px rgba(73,38,112,.16)!important;}
      @media(max-width:900px){.agenda-workspace-divider{display:none!important;}}
    `;
    document.head.appendChild(style);
  }

  function build(){
    const workspace = document.querySelector('.agenda-workspace');
    const main = workspace?.querySelector('.agenda-primary');
    const panel = workspace?.querySelector('.agenda-sos-panel');
    if(!workspace || !main || !panel){
      setTimeout(build,250);
      return;
    }

    injectStyles();

    let divider = panel.querySelector('.agenda-workspace-divider');
    if(!divider){
      divider = document.createElement('button');
      divider.type = 'button';
      divider.className = 'agenda-workspace-divider';
      divider.setAttribute('aria-label','Ajustar largura do Painel S.O.S.');
      divider.title = 'Arraste para ajustar a largura do Painel S.O.S.';
      divider.innerHTML = '<span aria-hidden="true"></span>';
      panel.appendChild(divider);
    }

    function metrics(){
      const width = workspace.clientWidth;
      const panelMaxByMain = Math.max(PANEL_MIN, width - MAIN_MIN - GAP);
      const panelMax = Math.max(PANEL_MIN, Math.min(PANEL_MAX, panelMaxByMain));
      return { width, panelMin:PANEL_MIN, panelMax };
    }

    function applyPanelWidth(rawWidth, save){
      const {panelMin, panelMax} = metrics();
      const value = clamp(Number(rawWidth) || PANEL_MIN, panelMin, panelMax);
      workspace.style.setProperty('--beautymove-sos-panel-width', `${Math.round(value)}px`);
      workspace.style.gridTemplateColumns = `minmax(${MAIN_MIN}px, 1fr) minmax(${panelMin}px, var(--beautymove-sos-panel-width))`;
      if(save) localStorage.setItem(KEY, String(Math.round(value)));
    }

    const saved = Number(localStorage.getItem(KEY));
    const current = panel.getBoundingClientRect().width;
    const initialPanelWidth = saved || (current >= PANEL_MIN && current <= PANEL_MAX ? current : 314);
    applyPanelWidth(initialPanelWidth, false);

    let dragging = false;
    let pointerId = null;

    const move = event => {
      if(!dragging || (pointerId !== null && event.pointerId !== pointerId)) return;
      const rect = workspace.getBoundingClientRect();
      const proposedPanelWidth = rect.right - event.clientX;
      applyPanelWidth(proposedPanelWidth, false);
    };

    const stop = event => {
      if(!dragging || (pointerId !== null && event?.pointerId !== pointerId)) return;
      dragging = false;
      pointerId = null;
      divider.classList.remove('is-dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const panelWidth = panel.getBoundingClientRect().width;
      applyPanelWidth(panelWidth, true);
      try{ divider.releasePointerCapture?.(event?.pointerId); }catch(_e){}
    };

    divider.addEventListener('pointerdown', event => {
      if(window.matchMedia('(max-width:900px)').matches) return;
      dragging = true;
      pointerId = event.pointerId;
      divider.classList.add('is-dragging');
      try{ divider.setPointerCapture?.(event.pointerId); }catch(_e){}
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      event.preventDefault();
      event.stopPropagation();
    });

    divider.addEventListener('pointermove', move);
    divider.addEventListener('pointerup', stop);
    divider.addEventListener('pointercancel', stop);
    divider.addEventListener('lostpointercapture', event => {
      if(dragging) stop(event);
    });

    window.addEventListener('resize', () => {
      if(window.matchMedia('(max-width:900px)').matches) return;
      const width = panel.getBoundingClientRect().width;
      applyPanelWidth(width, false);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(build,180), {once:true});
  }else{
    setTimeout(build,180);
  }
})();
