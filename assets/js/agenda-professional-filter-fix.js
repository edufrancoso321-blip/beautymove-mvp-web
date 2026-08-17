/* BeautyMove — abertura do controle pelo filtro de profissional. */
(function(){
  'use strict';
  const NAMES=['Ana','Bruna','Paula','Carla'];
  function openByName(name){
    if(!NAMES.includes(name)) return;
    const target=[...document.querySelectorAll('#agendaGrid .professional-name')]
      .find(el=>el.textContent.trim()===name);
    const header=target?.closest('th');
    if(header){
      header.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    }
  }
  function bind(){
    const filter=document.getElementById('professionalFilter');
    if(!filter || filter.dataset.controlFixBound==='1') return;
    filter.dataset.controlFixBound='1';
    filter.addEventListener('change',()=>setTimeout(()=>openByName(filter.value),0));
    filter.addEventListener('click',()=>setTimeout(()=>openByName(filter.value),80));
  }
  bind();
  const grid=document.getElementById('agendaGrid');
  if(grid){
    new MutationObserver(bind).observe(grid,{childList:true,subtree:true});
  }
  window.addEventListener('load',bind);
})();
