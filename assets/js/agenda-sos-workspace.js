/* BeautyMove — Workspace da Agenda
 * Responsabilidade única: comportamento estrutural do workspace.
 * Não renderiza Agenda, Agenda S.O.S. ou oportunidades.
 * O divisor é acoplado à borda esquerda do Painel S.O.S. e altera somente
 * a largura do painel. Agenda + Agenda S.O.S. absorvem o espaço restante.
 */
(function(){
  'use strict';
  const STORAGE_KEY='beautymove.mvp.agenda.sos.panelWidth';
  const MIN=280;
  const MAX=500;
  const DEFAULT=320;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const readWidth=()=>{try{const v=Number(localStorage.getItem(STORAGE_KEY));return Number.isFinite(v)?clamp(v,MIN,MAX):DEFAULT}catch{return DEFAULT}};
  const saveWidth=v=>{try{localStorage.setItem(STORAGE_KEY,String(Math.round(v)))}catch{}};
  function build(){
    const workspace=document.querySelector('.agenda-workspace');
    const panel=document.querySelector('.agenda-workspace>.agenda-sos-panel');
    if(!workspace||!panel)return;
    let width=readWidth();
    workspace.style.setProperty('--bm-sos-panel-width',`${width}px`);
    if(workspace.querySelector('.agenda-workspace-resize-handle'))return;
    const handle=document.createElement('button');
    handle.type='button';
    handle.className='agenda-workspace-resize-handle';
    handle.setAttribute('aria-label','Redimensionar painel S.O.S.');
    handle.setAttribute('title','Arraste para ampliar ou reduzir o Painel S.O.S.');
    workspace.appendChild(handle);
    let dragging=false,startX=0,startWidth=width;
    const move=e=>{
      if(!dragging)return;
      const next=clamp(startWidth-(e.clientX-startX),MIN,MAX);
      width=next;
      workspace.style.setProperty('--bm-sos-panel-width',`${next}px`);
      window.dispatchEvent(new CustomEvent('beautymove:sos-panel-resized',{detail:{width:next}}));
    };
    const stop=()=>{
      if(!dragging)return;
      dragging=false;
      handle.classList.remove('is-dragging');
      workspace.classList.remove('is-resizing');
      document.removeEventListener('pointermove',move);
      document.removeEventListener('pointerup',stop);
      document.removeEventListener('pointercancel',stop);
      saveWidth(width);
    };
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      e.preventDefault();
      dragging=true;
      startX=e.clientX;
      startWidth=width;
      handle.classList.add('is-dragging');
      workspace.classList.add('is-resizing');
      handle.setPointerCapture?.(e.pointerId);
      document.addEventListener('pointermove',move,{passive:true});
      document.addEventListener('pointerup',stop,{passive:true});
      document.addEventListener('pointercancel',stop,{passive:true});
    });
    handle.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
        e.preventDefault();
        const delta=e.key==='ArrowLeft'?20:-20;
        width=clamp(width+delta,MIN,MAX);
        workspace.style.setProperty('--bm-sos-panel-width',`${width}px`);
        saveWidth(width);
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
