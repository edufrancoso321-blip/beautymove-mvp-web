/* BeautyMove — Agenda metrics.
 * Metrics are derived from the canonical BeautyMoveData state.
 */
(function(){
  'use strict';

  function today(){
    const picker=document.getElementById('agendaDatePicker');
    if(picker?.value)return picker.value;
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function readState(){
    try{
      if(window.BeautyMoveData?.getState)return window.BeautyMoveData.getState();
      return {appointments:[],opportunities:[]};
    }catch{return {appointments:[],opportunities:[]};}
  }

  function render(){
    const metric=document.getElementById('metricSos');
    if(!metric)return;
    const state=readState();
    const date=today();
    const opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const active=opportunities.filter(o=>o?.date===date&&o.source==='sos'&&o.status!=='resolved'&&o.status!=='cancelado');
    metric.textContent=String(active.length);
  }

  function boot(){
    render();
    window.BeautyMoveData?.subscribe?.(render);
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(render,0));
    ['prevDay','nextDay','todayBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(render,100)));
    window.addEventListener('beautymove:sos-created',render);
    window.addEventListener('beautymove:sos-accepted',render);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
