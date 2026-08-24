/* BeautyMove — reforço final da restauração da Agenda.
 * Não cria agenda, não cria oportunidades e não altera dados.
 * Apenas garante a marcação do horário de fechamento no fim da grade.
 */
(function(){
  'use strict';
  const interval=()=>Number(document.getElementById('agendaInterval')?.value||60);
  function refreshCloseMarker(){
    const timeCol=document.querySelector('#agendaGrid .bm-ap-time');
    const labels=[...document.querySelectorAll('#agendaGrid .bm-ap-time-label')];
    if(!timeCol||!labels.length)return;
    const last=labels[labels.length-1].textContent.trim().split(':').map(Number);
    if(last.length<2)return;
    let minutes=(last[0]||0)*60+(last[1]||0)+interval();
    minutes=((minutes%1440)+1440)%1440;
    timeCol.setAttribute('data-close-label',`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`);
  }
  function boot(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    const style=document.createElement('style');
    style.textContent=`
      #agendaGrid .bm-ap-time{position:sticky!important;left:0!important;z-index:20!important;overflow:visible!important}
      #agendaGrid .bm-ap-time::after{content:attr(data-close-label);position:absolute;left:0;right:0;bottom:0;transform:translateY(50%);height:24px;display:flex;align-items:center;justify-content:center;background:#fff;color:#17131f;font-size:13px;font-weight:800;z-index:25}
    `;
    document.head.appendChild(style);
    refreshCloseMarker();
    new MutationObserver(refreshCloseMarker).observe(grid,{childList:true,subtree:true});
    document.getElementById('agendaInterval')?.addEventListener('change',refreshCloseMarker);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
