/* BeautyMove — divisores ajustáveis: Agenda/Agenda S.O.S. e Painel S.O.S. */
(function(){
  'use strict';

  const MAIN_KEY='beautymove.mvp.agenda.workspace.mainWidth';
  const PANEL_KEY='beautymove.mvp.agenda.workspace.panelWidth';
  const GAP=14, SOS_MIN=200, MAIN_MIN=520, PANEL_MIN=230, PANEL_MAX=460;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  function build(){
    const ws=document.querySelector('.agenda-workspace');
    const region=ws?.querySelector('.agenda-scroll-region');
    const main=region?.querySelector('.agenda-primary');
    const sos=region?.querySelector('.agenda-sos-agenda-card');
    const panel=ws?.querySelector('.agenda-sos-panel');
    if(!ws||!region||!main||!sos||!panel){setTimeout(build,250);return;}

    if(!region.querySelector('.agenda-workspace-divider')){
      const divider=document.createElement('button');
      divider.type='button';
      divider.className='agenda-workspace-divider';
      divider.setAttribute('aria-label','Ajustar largura entre Agenda e Agenda S.O.S.');
      divider.title='Arraste para ajustar a largura';
      divider.innerHTML='<span></span>';
      region.appendChild(divider);

      function available(){return Math.max(0,region.clientWidth-GAP);}
      function limits(){
        const a=available();
        return {min:MAIN_MIN,max:Math.max(MAIN_MIN,a-SOS_MIN)};
      }
      function applyMain(mainWidth,save){
        const {min,max}=limits();
        const value=clamp(Number(mainWidth)||min,min,max);
        const sosWidth=Math.max(SOS_MIN,available()-value);
        region.style.gridTemplateColumns=`${value}px ${sosWidth}px`;
        divider.style.left=`${value+GAP/2-5}px`;
        if(save)localStorage.setItem(MAIN_KEY,String(Math.round(value)));
      }

      const saved=Number(localStorage.getItem(MAIN_KEY));
      applyMain(saved||Math.round(available()*.68),false);

      let dragging=false;
      let raf=0;
      let pendingX=0;
      const move=e=>{
        if(!dragging)return;
        pendingX=e.clientX;
        if(raf)return;
        raf=requestAnimationFrame(()=>{
          raf=0;
          const rect=region.getBoundingClientRect();
          applyMain(pendingX-rect.left,false);
        });
      };
      const stop=()=>{
        if(!dragging)return;
        dragging=false;
        divider.classList.remove('is-dragging');
        localStorage.setItem(MAIN_KEY,String(Math.round(main.getBoundingClientRect().width)));
        document.body.style.cursor='';
        document.body.style.userSelect='';
      };
      divider.addEventListener('pointerdown',e=>{
        if(window.matchMedia('(max-width:900px)').matches)return;
        dragging=true;
        divider.classList.add('is-dragging');
        divider.setPointerCapture?.(e.pointerId);
        document.body.style.cursor='col-resize';
        document.body.style.userSelect='none';
        e.preventDefault();
      });
      divider.addEventListener('pointermove',move);
      divider.addEventListener('pointerup',stop);
      divider.addEventListener('pointercancel',stop);
      window.addEventListener('resize',()=>{
        if(!window.matchMedia('(max-width:900px)').matches)applyMain(main.getBoundingClientRect().width,false);
      });
    }

    if(!ws.querySelector('.agenda-sos-panel-resizer')){
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
      function applyPanel(panelWidth,save){
        const {min,max}=panelLimits();
        const value=clamp(Number(panelWidth)||270,min,max);
        ws.style.gridTemplateColumns=`minmax(0,1fr) ${value}px`;
        panelResizer.style.left=`calc(100% - ${value + GAP/2 + 5}px)`;
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
      const stopPanel=()=>{
        if(!draggingPanel)return;
        draggingPanel=false;
        panelResizer.classList.remove('is-dragging');
        localStorage.setItem(PANEL_KEY,String(Math.round(panel.getBoundingClientRect().width)));
        document.body.style.cursor='';
        document.body.style.userSelect='';
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
        if(!window.matchMedia('(max-width:900px)').matches)applyPanel(panel.getBoundingClientRect().width,false);
      });
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(build,180),{once:true});
  else setTimeout(build,180);
})();
