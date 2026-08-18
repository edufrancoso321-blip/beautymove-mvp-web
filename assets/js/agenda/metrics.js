/* BeautyMove — Agenda metrics.
 * Metrics are derived from the shared state; no polling loop is used.
 */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';

  function today(){
    const picker=document.getElementById('agendaDatePicker');
    if(picker?.value)return picker.value;
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function readState(){
    try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}
    catch{return {appointments:[],opportunities:[]};}
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
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(render,0));
    ['prevDay','nextDay','todayBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(render,100)));
    window.addEventListener('beautymove:sos-created',render);
    window.addEventListener('beautymove:sos-accepted',render);
    window.addEventListener('storage',event=>{if(event.key===STATE_KEY)render();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
