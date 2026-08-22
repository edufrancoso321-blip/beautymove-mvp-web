/* BeautyMove — bootstrap da autoridade única do S.O.S. da Agenda. */
(function(){
'use strict';
function boot(){
  if(document.body?.dataset?.role!=='salao')return;
  if(window.__bmSosSingleAuthorityLoaded)return;
  window.__bmSosSingleAuthorityLoaded=true;
  const src='assets/js/agenda-sos-single-authority.js?v=20260822-1';
  if([...document.scripts].some(s=>s.src===src))return;
  const script=document.createElement('script');
  script.src=src;
  script.async=false;
  document.head.appendChild(script);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
