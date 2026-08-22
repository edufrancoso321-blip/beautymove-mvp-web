/* BeautyMove — S.O.S. reservation compatibility layer.
   The Agenda has one visual authority: agenda-sos-actions-final.js.
   This file is intentionally inert to prevent competing DOM renderers.
*/
(function(){
  'use strict';
  if(document.body?.dataset?.role!=='salao')return;
  window.__bmSosSingleAuthorityLoaded=false;
})();
