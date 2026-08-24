/* BeautyMove — divisor ajustável entre Agenda e Agenda S.O.S. */
(function(){
  'use strict';
  const KEY='beautymove.mvp.agenda.workspace.mainWidth';
  const GAP=14, SOS_MIN=270, PANEL_MIN=330, MAIN_MIN=520;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function build(){
    const ws=document.querySelector('.agenda-workspace'), main=ws?.querySelector('.agenda-primary'), sos=ws?.querySelector('.agenda-sos-agenda-card'), panel=ws?.querySelector('.agenda-sos-panel');
    if(!ws||!main||!sos||!panel){setTimeout(build,250);return;}
    if(ws.querySelector('.agenda-workspace-divider'))return;
    ws.style.position='relative';
    const divider=document.createElement('button');divider.type='button';divider.className='agenda-workspace-divider';divider.setAttribute('aria-label','Ajustar largura entre Agenda e Agenda S.O.S.');divider.title='Arraste para ajustar a largura';divider.innerHTML='<span></span>';ws.appendChild(divider);
    function available(){return Math.max(0,ws.clientWidth-panel.getBoundingClientRect().width-GAP*2)}
    function limits(){const a=available();return{min:MAIN_MIN,max:Math.max(MAIN_MIN,a-SOS_MIN)}}
    function apply(mainWidth,save){const {min,max}=limits(),value=clamp(Number(mainWidth)||min,min,max),sosWidth=Math.max(SOS_MIN,available()-value);ws.style.gridTemplateColumns=`${value}px ${sosWidth}px minmax(${PANEL_MIN}px,1fr)`;divider.style.left=`${value+GAP/2-5}px`;if(save)localStorage.setItem(KEY,String(Math.round(value)));}
    const saved=Number(localStorage.getItem(KEY)),a=available();apply(saved||Math.round(a*.68),false);
    let dragging=false;
    const move=e=>{if(!dragging)return;const rect=ws.getBoundingClientRect();apply(e.clientX-rect.left,false)};
    const stop=()=>{if(!dragging)return;dragging=false;divider.classList.remove('is-dragging');localStorage.setItem(KEY,String(Math.round(main.getBoundingClientRect().width)));document.body.style.cursor='';document.body.style.userSelect=''};
    divider.addEventListener('pointerdown',e=>{if(window.matchMedia('(max-width:900px)').matches)return;dragging=true;divider.classList.add('is-dragging');divider.setPointerCapture?.(e.pointerId);document.body.style.cursor='col-resize';document.body.style.userSelect='none';e.preventDefault()});
    divider.addEventListener('pointermove',move);divider.addEventListener('pointerup',stop);divider.addEventListener('pointercancel',stop);
    window.addEventListener('resize',()=>{if(!window.matchMedia('(max-width:900px)').matches)apply(main.getBoundingClientRect().width,false)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(build,180),{once:true});else setTimeout(build,180);
})();
