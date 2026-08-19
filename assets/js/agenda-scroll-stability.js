/* BeautyMove — estabilidade da rolagem da Agenda — 2026-08-19 */
(function(){
  'use strict';

  const GRID_HOST = '#agendaGrid';
  let activeScroll = null;
  let lastScrollTop = 0;
  let restoreTimer = null;

  function headerCells(scroll){
    return scroll?.querySelectorAll(
      '.agenda-grid > thead > tr.agenda-specialty-row > th,' +
      '.agenda-grid > thead > tr.agenda-professional-row > th'
    ) || [];
  }

  function applyHeaderPosition(scroll){
    if(!scroll) return;
    const y = Math.max(0, Number(scroll.scrollTop) || 0);
    headerCells(scroll).forEach(cell=>{
      cell.style.position = 'relative';
      cell.style.top = 'auto';
      cell.style.transform = `translate3d(0, ${y}px, 0)`;
      cell.style.willChange = y ? 'transform' : 'auto';
    });
  }

  function restoreScroll(scroll){
    if(!scroll) return;
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(()=>{
      const max = Math.max(0, scroll.scrollHeight - scroll.clientHeight);
      const target = Math.min(Math.max(0, lastScrollTop), max);
      if(Math.abs(scroll.scrollTop - target) > 1){
        scroll.scrollTop = target;
      }
      applyHeaderPosition(scroll);
    }, 0);
  }

  function bindScroll(scroll){
    if(!scroll || scroll === activeScroll) return;
    activeScroll = scroll;
    scroll.addEventListener('scroll',()=>{
      lastScrollTop = Math.max(0, Number(scroll.scrollTop) || 0);
      applyHeaderPosition(scroll);
    }, {passive:true});
    restoreScroll(scroll);
  }

  function scan(){
    const host = document.querySelector(GRID_HOST);
    const scroll = host?.querySelector('.agenda-scroll-v2');
    if(!scroll) return;
    bindScroll(scroll);
    applyHeaderPosition(scroll);
  }

  function boot(){
    scan();
    const host = document.querySelector(GRID_HOST);
    if(!host) return;
    new MutationObserver(()=>{
      const next = host.querySelector('.agenda-scroll-v2');
      if(next !== activeScroll){
        activeScroll = null;
        scan();
      }else{
        restoreScroll(next);
      }
    }).observe(host,{childList:true,subtree:true});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();
