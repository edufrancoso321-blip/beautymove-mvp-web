/* BeautyMove — bootstrap do runtime S.O.S. único. */
(function(){
'use strict';
function boot(){if(document.body?.dataset?.role!=='salao')return;if(window.__bmSosRuntimeLoaded)return;window.__bmSosRuntimeLoaded=true;const src='assets/js/agenda-sos-runtime.js?v=20260821-1';if([...document.scripts].some(s=>s.src===src))return;const script=document.createElement('script');script.src=src;script.async=false;document.head.appendChild(script);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
