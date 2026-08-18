(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const DEMO_KEY='beautymove.mvp.demo-recovery-v1';
  const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  function read(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{};}catch{return {};}}
  function save(s){localStorage.setItem(STATE_KEY,JSON.stringify(s));}
  function seed(){
    const state=read();
    state.appointments=Array.isArray(state.appointments)?state.appointments:[];
    state.opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    state.transactions=Array.isArray(state.transactions)?state.transactions:[];
    const date=todayKey();
    const hasToday=state.appointments.some(a=>a && a.date===date && a.status!=='cancelado');
    if(hasToday) return false;
    state.appointments.push({
      id:'demo-marta-'+date,
      date,
      time:'08:00',
      client:'MARTA',
      professional:'Ana',
      specialty:'Cabelos',
      service:'Coloração + Luzes + Corte feminino',
      services:[
        {name:'Coloração',duration:120,value:150},
        {name:'Luzes',duration:180,value:250},
        {name:'Corte feminino',duration:60,value:80}
      ],
      duration:360,
      value:480,
      status:'agendado'
    });
    save(state);
    localStorage.setItem(DEMO_KEY,date);
    return true;
  }
  seed();
})();
