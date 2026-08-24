/* BeautyMove — final desktop agenda header geometry. */
(function(){
'use strict';
if(document.body?.dataset?.role!=='salao')return;
if(document.getElementById('bmAgendaFinalVisualFix'))return;
const s=document.createElement('style');s.id='bmAgendaFinalVisualFix';s.textContent=`
#agendaGrid .agenda-grid thead.bm-agenda-head .agenda-specialty-row .agenda-sos-header-clean{height:82px!important;vertical-align:middle!important;position:sticky!important;top:0!important;z-index:55!important;padding:8px!important;text-align:center!important}
#agendaGrid .agenda-grid thead.bm-agenda-head .agenda-specialty-row .agenda-sos-header-clean .sos-title{display:block!important;margin:0!important;font-size:16px!important;line-height:1.1!important;color:var(--purple)!important;font-weight:900!important}
#agendaGrid .agenda-grid thead.bm-agenda-head .agenda-specialty-row .agenda-sos-header-clean .bm-sos-header-action{display:block!important;margin-top:7px!important;font-size:11px!important;line-height:1.2!important;color:var(--purple)!important;font-weight:850!important}
#agendaGrid .agenda-grid thead.bm-agenda-head .agenda-professional-row th::after{display:none!important;content:none!important}
#agendaGrid .agenda-grid thead.bm-agenda-head .agenda-professional-row th{border-bottom:1px solid #ece9f0!important}
`;
document.head.appendChild(s);
})();
