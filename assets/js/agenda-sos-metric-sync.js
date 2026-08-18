/* BeautyMove — sincronização do indicador S.O.S. da Agenda */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';

  function dateKey(){
    const picker=document.getElementById('agendaDatePicker');
    if(picker&&picker.value)return picker.value;
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function readState(){
    try{
      const value=JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{};
      return {
        appointments:Array.isArray(value.appointments)?value.appointments:[],
        opportunities:Array.isArray(value.opportunities)?value.opportunities:[]
      };
    }catch(_){
      return {appointments:[],opportunities:[]};
    }
  }

  function sync(){
    const metric=document.getElementById('metricSos');
    if(!metric)return;
    const state=readState();
    const active=state.opportunities.filter(o=>
      o &&
      o.date===dateKey() &&
      o.source==='sos' &&
      o.status!=='resolved' &&
      o.status!=='cancelado'
    ).length;
    metric.textContent=String(active);
  }

  function boot(){
    sync();
    document.getElementById('agendaDatePicker')?.addEventListener('change',()=>setTimeout(sync,50));
    ['prevDay','nextDay','todayBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(sync,200)));
    window.addEventListener('storage',sync);
    setInterval(sync,500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
