/* BeautyMove — proteção de estado da Agenda
   Executa antes do agenda.js para impedir que dados antigos/corrompidos
   impeçam a construção da grade. */
(function(){
  'use strict';
  const KEY='beautymove.mvp.state';
  const EMPTY={appointments:[],opportunities:[],transactions:[]};
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw){
      localStorage.setItem(KEY,JSON.stringify(EMPTY));
      return;
    }
    const parsed=JSON.parse(raw);
    if(!parsed || typeof parsed!=='object' || Array.isArray(parsed)){
      localStorage.setItem(KEY,JSON.stringify(EMPTY));
      return;
    }
    const normalized={...parsed};
    if(!Array.isArray(normalized.appointments))normalized.appointments=[];
    if(!Array.isArray(normalized.opportunities))normalized.opportunities=[];
    if(!Array.isArray(normalized.transactions))normalized.transactions=[];
    localStorage.setItem(KEY,JSON.stringify(normalized));
  }catch(_){
    try{localStorage.setItem(KEY,JSON.stringify(EMPTY));}catch(__){}
  }
})();
