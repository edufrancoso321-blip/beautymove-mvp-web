/* BeautyMove — divisor ajustável do Painel S.O.S. */
(function(){
  'use strict';

  const PANEL_KEY='beautymove.mvp.agenda.workspace.panelWidth';
  const GAP=14, MAIN_MIN=520, PANEL_MIN=230, PANEL_MAX=460;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  function build(){
    const ws=document.querySelector('.agenda-workspace');
    const panel=ws?.querySelector('.agenda-sos-panel');
    if(!ws||!panel){setTimeout(build,250);return;}

    if(ws.querySelector('.agenda-sos-panel-resizer'))return;

    const panelResizer=document.createElement('button');
    panelResizer.type='button';
    panelResizer.className='agenda-sos-panel-resizer';
    panelResizer.setAttribute('aria-label','Ajustar largura do Painel S.O.S.');
    panelResizer.title='Arraste para ampliar ou diminuir o Painel S.O.S.';
    panelResizer.innerHTML='<span aria-hidden="true">⋮</span>';
    ws.appendChild(panelResizer);

    function panelLimits(){
      const maxByWorkspace=Math.max(PANEL_MIN,ws.clientWidth-MAIN_MIN-GAP);
      return {min:PANEL_MIN,max:Math.min(PANEL_MAX,maxByWorkspace)};
    }

    function positionResizer(){
      // A alça fica fisicamente acoplada à borda esquerda do Painel S.O.S.
      panelResizer.style.left=`${panel.offsetLeft - 11}px`;
    }

    function applyPanel(panelWidth,save){
      const {min,max}=panelLimits();
      const value=clamp(Number(panelWidth)||270,min,max);
      ws.style.gridTemplateColumns=`minmax(0,1fr) ${value}px`;
      requestAnimationFrame(positionResizer);
      if(save)localStorage.setItem(PANEL_KEY,String(Math.round(value)));
    }

    const savedPanel=Number(localStorage.getItem(PANEL_KEY));
    applyPanel(savedPanel||270,false);

    let draggingPanel=false;
    let rafPanel=0;
    let pendingPanelX=0;

    const movePanel=e=>{
      if(!draggingPanel)return;
      pendingPanelX=e.clientX;
      if(rafPanel)return;
      rafPanel=requestAnimationFrame(()=>{
        rafPanel=0;
        const rect=ws.getBoundingClientRect();
        const value=rect.right-pendingPanelX-(GAP/2);
        applyPanel(value,false);
      });
    };

    const stopPanel=e=>{
      if(!draggingPanel)return;
      draggingPanel=false;
      panelResizer.classList.remove('is-dragging');
      if(e?.pointerId!=null)panelResizer.releasePointerCapture?.(e.pointerId);
      localStorage.setItem(PANEL_KEY,String(Math.round(panel.getBoundingClientRect().width)));
      document.body.style.cursor='';
      document.body.style.userSelect='';
      positionResizer();
    };

    panelResizer.addEventListener('pointerdown',e=>{
      if(window.matchMedia('(max-width:900px)').matches)return;
      draggingPanel=true;
      panelResizer.classList.add('is-dragging');
      panelResizer.setPointerCapture?.(e.pointerId);
      document.body.style.cursor='col-resize';
      document.body.style.userSelect='none';
      e.preventDefault();
    });
    panelResizer.addEventListener('pointermove',movePanel);
    panelResizer.addEventListener('pointerup',stopPanel);
    panelResizer.addEventListener('pointercancel',stopPanel);

    window.addEventListener('resize',()=>{
      if(!window.matchMedia('(max-width:900px)').matches){
        applyPanel(panel.getBoundingClientRect().width,false);
        positionResizer();
      }
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(build,180),{once:true});
  else setTimeout(build,180);
})();
