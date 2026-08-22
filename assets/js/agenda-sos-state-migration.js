/* BeautyMove — migração de estado S.O.S. legado.
   Estados resolvidos com profissional confirmada passam a representar
   um atendimento aceito/ativo. Não altera layout nem DOM.
*/
(function(){
'use strict';
const KEY='beautymove.mvp.state';
try{
 const state=JSON.parse(localStorage.getItem(KEY)||'null');
 if(!state||!Array.isArray(state.opportunities))return;
 let changed=false;
 state.opportunities.forEach(o=>{
   if(o&&o.source==='sos'&&String(o.status||'').toLowerCase()==='resolved'&&o.acceptedBy){o.status='accepted';changed=true;}
 });
 if(changed)localStorage.setItem(KEY,JSON.stringify(state));
}catch(_){ }
})();
