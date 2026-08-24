/* BeautyMove — Workspace da Agenda
 * Responsabilidade única: comportamento estrutural do workspace.
 * Não renderiza Agenda, Agenda S.O.S. ou oportunidades.
 */
(function(){
  'use strict';
  const STORAGE_KEY='beautymove.mvp.agenda.sos.panelWidth.v2';
  const MIN=320, MAX=500, DEFAULT=440;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const readStored=()=>{try{const v=Number(localStorage.getItem(STORAGE_KEY));return Number.isFinite(v)?v:DEFAULT}catch{return DEFAULT}};
  const saveWidth=v=>{try{localStorage.setItem(STORAGE_KEY,String(Math.round(v)))}catch{}};
  function addCloseMarker(){
    const grid=document.getElementById('agendaGrid'); if(!grid)return;
    if(!document.getElementById('bmAgendaCloseMarkerStyles')){
      const s=document.createElement('style');s.id='bmAgendaCloseMarkerStyles';
      s.textContent='#agendaGrid .bm-ap-time{overflow:visible!important}#agendaGrid .bm-ap-time::after{content:attr(data-close-label);position:absolute;left:0;right:0;bottom:0;transform:translateY(50%);height:24px;display:flex;align-items:center;justify-content:center;background:#fff;color:#17131f;font-size:13px;font-weight:800;z-index:25}';
      document.head.appendChild(s);
    }
    const timeCol=grid.querySelector('.bm-ap-time'),labels=[...grid.querySelectorAll('.bm-ap-time-label')];
    if(!timeCol||!labels.length)return;
    const parts=labels[labels.length-1].textContent.trim().split(':').map(Number); if(parts.length<2)return;
    const step=Number(document.getElementById('agendaInterval')?.value||60); let minutes=(parts[0]||0)*60+(parts[1]||0)+step; minutes=((minutes%1440)+1440)%1440;
    timeCol.setAttribute('data-close-label',`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`);
  }
  function setupScrollSync(){
    const main=document.querySelector('#agendaGrid .bm-ap-scroll');
    const sos=document.getElementById('sosAgendaGrid');
    if(!main||!sos||main.dataset.bmSyncReady==='1')return;
    main.dataset.bmSyncReady='1';
    let syncing=false;
    const sync=(source,target)=>{if(syncing)return;syncing=true;target.scrollTop=source.scrollTop;requestAnimationFrame(()=>{syncing=false})};
    main.addEventListener('scroll',()=>sync(main,sos),{passive:true});
    sos.addEventListener('scroll',()=>sync(sos,main),{passive:true});
    sos.scrollTop=main.scrollTop;
  }
  function build(){
    const workspace=document.querySelector('.agenda-workspace'),panel=document.querySelector('.agenda-workspace>.agenda-sos-panel');
    if(!workspace||!panel)return;
    const maxAllowed=()=>Math.max(MIN,Math.min(MAX,workspace.clientWidth-360));
    const normalize=v=>clamp(v,MIN,maxAllowed()); let width=normalize(readStored());
    workspace.style.setProperty('--bm-sos-panel-width',`${width}px`);
    if(!workspace.querySelector('.agenda-workspace-resize-handle')){
      const handle=document.createElement('button');handle.type='button';handle.className='agenda-workspace-resize-handle';handle.setAttribute('aria-label','Redimensionar painel S.O.S.');handle.setAttribute('title','Arraste para ampliar ou reduzir o Painel S.O.S.');workspace.appendChild(handle);
      let dragging=false,startX=0,startWidth=width;
      const apply=v=>{width=normalize(v);workspace.style.setProperty('--bm-sos-panel-width',`${width}px`);window.dispatchEvent(new CustomEvent('beautymove:sos-panel-resized',{detail:{width}}));};
      const move=e=>{if(dragging)apply(startWidth-(e.clientX-startX));};
      const stop=()=>{if(!dragging)return;dragging=false;handle.classList.remove('is-dragging');workspace.classList.remove('is-resizing');document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',stop);document.removeEventListener('pointercancel',stop);saveWidth(width)};
      handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();dragging=true;startX=e.clientX;startWidth=width;handle.classList.add('is-dragging');workspace.classList.add('is-resizing');handle.setPointerCapture?.(e.pointerId);document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerup',stop,{passive:true});document.addEventListener('pointercancel',stop,{passive:true})});
      handle.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();apply(width+(e.key==='ArrowLeft'?20:-20));saveWidth(width)});
      window.addEventListener('resize',()=>apply(width));
    }
    const grid=document.getElementById('agendaGrid');
    if(grid){const observer=new MutationObserver(()=>requestAnimationFrame(()=>{addCloseMarker();setupScrollSync()}));observer.observe(grid,{childList:true,subtree:true});requestAnimationFrame(()=>{addCloseMarker();setupScrollSync()});}
    setTimeout(setupScrollSync,250);setTimeout(setupScrollSync,800);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
