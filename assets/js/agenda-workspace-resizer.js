/* BeautyMove — divisor do Painel S.O.S. acoplado ao painel
   Regra: Agenda principal + Agenda S.O.S. são uma única área flexível.
   O divisor pertence à borda esquerda do Painel S.O.S.; o painel permanece
   ancorado à direita e todo o conteúdo da Agenda acompanha organicamente. */
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
      .agenda-workspace-divider{
        position:absolute!important;
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

    let divider = workspace.querySelector('.agenda-workspace-divider');
    if(!divider){
      divider = document.createElement('button');
      divider.type = 'button';
      divider.className = 'agenda-workspace-divider';
      divider.setAttribute('aria-label','Ajustar largura do Painel S.O.S.');
      divider.title = 'Arraste para ajustar a largura do Painel S.O.S.';
      divider.innerHTML = '<span aria-hidden="true"></span>';
      workspace.appendChild(divider);
    }

    function metrics(){
      const width = workspace.clientWidth;
      const panelMin = Math.min(PANEL_MIN, Math.max(220, width - MAIN_MIN - GAP));
      const panelMaxByMain = width - MAIN_MIN - GAP;
      const panelMax = Math.max(panelMin, Math.min(PANEL_MAX, panelMaxByMain));
      return { width, panelMin, panelMax };
    }

    function applyPanelWidth(rawWidth, save){
      const {width, panelMin, panelMax} = metrics();
      const currentMain = width - GAP - (Number(rawWidth) || panelMin);
      const value = clamp(Number(rawWidth) || currentMain, panelMin, panelMax);
      workspace.style.gridTemplateColumns = `minmax(0, 1fr) ${Math.round(value)}px`;
      divider.style.left = `calc(100% - ${Math.round(value + GAP)}px)`;
      if(save) localStorage.setItem(KEY, String(Math.round(value)));
    }

    const saved = Number(localStorage.getItem(KEY));
    const initialPanelWidth = saved || Math.min(PANEL_MAX, Math.max(PANEL_MIN, panel.getBoundingClientRect().width || 314));
    applyPanelWidth(initialPanelWidth, false);

    let dragging = false;

    const move = event => {
      if(!dragging) return;
      const rect = workspace.getBoundingClientRect();
      const proposedPanelWidth = rect.right - event.clientX;
      applyPanelWidth(proposedPanelWidth, false);
    };

    const stop = () => {
      if(!dragging) return;
      dragging = false;
      divider.classList.remove('is-dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const panelWidth = panel.getBoundingClientRect().width;
      applyPanelWidth(panelWidth, true);
    };

    divider.addEventListener('pointerdown', event => {
      if(window.matchMedia('(max-width:900px)').matches) return;
      dragging = true;
      divider.classList.add('is-dragging');
      divider.setPointerCapture?.(event.pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      event.preventDefault();
    });

    divider.addEventListener('pointermove', move);
    divider.addEventListener('pointerup', stop);
    divider.addEventListener('pointercancel', stop);
    divider.addEventListener('lostpointercapture', stop);

    window.addEventListener('resize', () => {
      if(window.matchMedia('(max-width:900px)').matches) return;
      applyPanelWidth(panel.getBoundingClientRect().width, false);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(build,180), {once:true});
  }else{
    setTimeout(build,180);
  }
})();
