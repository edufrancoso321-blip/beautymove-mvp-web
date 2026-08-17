/* BeautyMove — alinhamento final do cabeçalho da Agenda. */
(function(){
  'use strict';
  function apply(){
    if(document.getElementById('agendaHeaderAlignmentFinal')) return;
    const s=document.createElement('style');
    s.id='agendaHeaderAlignmentFinal';
    s.textContent=`
      /* Profissional + status + ocorrência: estrutura vertical única. */
      .agenda-grid thead tr.agenda-professional-row th.professional-header-control{
        vertical-align:top!important;
        padding:6px 8px 8px!important;
      }
      .agenda-grid thead tr.agenda-professional-row .professional-name{
        display:block!important;
        margin:0!important;
        font-size:16px!important;
        line-height:1.15!important;
        font-weight:900!important;
      }
      .agenda-grid thead tr.agenda-professional-row .professional-day-status{
        display:flex!important;
        flex-wrap:wrap!important;
        align-items:center!important;
        justify-content:center!important;
        gap:4px 5px!important;
        margin:4px 0 0!important;
        padding:3px 5px!important;
        min-height:15px!important;
        font-size:11px!important;
        line-height:1.15!important;
      }
      .agenda-grid thead tr.agenda-professional-row .professional-day-status .status-detail{
        flex:0 0 100%!important;
        display:block!important;
        margin:0!important;
        text-align:center!important;
        font-weight:500!important;
      }

      /* S.O.S. usa exatamente a mesma altura vertical do bloco profissional/status. */
      .agenda-grid thead tr.agenda-professional-row th.sos-col.agenda-sos-action{
        height:auto!important;
        min-height:0!important;
        box-sizing:border-box!important;
        align-self:stretch!important;
        vertical-align:top!important;
        padding:6px 8px 10px!important;
      }
      .agenda-grid thead tr.agenda-professional-row th.sos-col.agenda-sos-action .sos-action-label{
        display:block!important;
        margin:4px 0 0!important;
        font-size:12px!important;
        line-height:1.2!important;
        font-weight:850!important;
        color:var(--purple)!important;
      }
      .agenda-grid thead tr.agenda-professional-row th.sos-col.agenda-sos-action::after{
        left:12px!important;
        right:12px!important;
        bottom:0!important;
        height:6px!important;
        background:var(--purple)!important;
      }
    `;
    document.head.appendChild(s);
  }
  function boot(){apply();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
