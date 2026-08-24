/* BeautyMove — loader da Agenda Funcional Final.
 * A estrutura visual e as interações ficam centralizadas em um único controlador.
 */
(function(){
  'use strict';
  if(document.body?.dataset?.role!=='salao') return;
  if(document.getElementById('bmAgendaFinalFunctionalCss')) return;
  const css=document.createElement('link');css.id='bmAgendaFinalFunctionalCss';css.rel='stylesheet';css.href='assets/css/agenda-final-functional.css?v=20260824-1';document.head.appendChild(css);
  const script=document.createElement('script');script.src='assets/js/agenda-final-functional-controller.js?v=20260824-1';document.body.appendChild(script);
})();
