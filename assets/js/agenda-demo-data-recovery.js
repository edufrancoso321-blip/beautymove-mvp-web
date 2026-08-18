/* BeautyMove — recuperação segura dos dados da Agenda
   Regra: nunca apagar o estado atual. Recuperar somente o que estiver ausente.
*/
(function(){
  'use strict';

  const STATE_KEY='beautymove.mvp.state';
  const RECOVERY_KEY='beautymove.mvp.recovery.snapshot-v2';
  const LEGACY_KEYS=[
    'beautymove.mvp.state.backup',
    'beautymove.mvp.state.recovery',
    'beautymove.mvp.state.previous',
    'beautymove.mvp.agenda.state',
    'beautymove.mvp.agenda.backup',
    'beautymove.mvp.agendaData',
    'beautymove.agenda.data'
  ];

  const todayKey=()=>{
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  function readRaw(key){
    try{return JSON.parse(localStorage.getItem(key)||'null');}
    catch{return null;}
  }

  function readState(){
    const value=readRaw(STATE_KEY);
    return {
      appointments:Array.isArray(value?.appointments)?value.appointments:[],
      opportunities:Array.isArray(value?.opportunities)?value.opportunities:[],
      transactions:Array.isArray(value?.transactions)?value.transactions:[],
      ...(value||{})
    };
  }

  function saveState(state){
    localStorage.setItem(STATE_KEY,JSON.stringify(state));
  }

  function normalizeAppointment(a){
    if(!a||typeof a!=='object')return null;
    const services=Array.isArray(a.services)?a.services.map(s=>({
      id:s?.id,
      name:s?.name||s?.service||'',
      duration:Number(s?.duration??s?.durationMinutes??30)||30,
      durationMinutes:Number(s?.durationMinutes??s?.duration??30)||30,
      value:Number(s?.value??s?.clientPrice??0)||0
    })).filter(s=>s.name):[];
    const duration=Number(a.duration??a.durationMinutes)||services.reduce((n,s)=>n+(Number(s.durationMinutes)||0),0)||30;
    const value=Number(a.value??a.clientPrice)||services.reduce((n,s)=>n+(Number(s.value)||0),0)||0;
    return {
      ...a,
      id:a.id||`recovered-${a.date||todayKey()}-${a.time||'00:00'}-${a.client||'cliente'}-${a.professional||'profissional'}`,
      services,
      service:a.service||services.map(s=>s.name).join(' + '),
      duration,
      durationMinutes:Number(a.durationMinutes)||duration,
      value
    };
  }

  function extractState(value){
    if(!value||typeof value!=='object')return null;
    if(Array.isArray(value.appointments)||Array.isArray(value.opportunities)){
      return {
        appointments:Array.isArray(value.appointments)?value.appointments:[],
        opportunities:Array.isArray(value.opportunities)?value.opportunities:[],
        transactions:Array.isArray(value.transactions)?value.transactions:[]
      };
    }
    return null;
  }

  function appointmentKey(a){
    return String(a.id||`${a.date}|${a.time}|${a.client}|${a.professional}`).toLowerCase();
  }

  function mergeAppointments(current,incoming){
    const map=new Map();
    current.map(normalizeAppointment).filter(Boolean).forEach(a=>map.set(appointmentKey(a),a));
    incoming.map(normalizeAppointment).filter(Boolean).forEach(a=>{
      const key=appointmentKey(a);
      if(!map.has(key))map.set(key,a);
    });
    return [...map.values()];
  }

  function canonicalTodayAppointment(){
    const date=todayKey();
    return {
      id:`demo-marta-${date}`,
      date,
      time:'08:00',
      client:'MARTA',
      professional:'Ana',
      specialty:'Cabelos',
      service:'Coloração + Luzes + Corte feminino',
      services:[
        {name:'Coloração',duration:120,durationMinutes:120,value:150},
        {name:'Luzes',duration:180,durationMinutes:180,value:250},
        {name:'Corte feminino',duration:60,durationMinutes:60,value:80}
      ],
      duration:360,
      durationMinutes:360,
      value:480,
      status:'agendado',
      source:'recovery-demo'
    };
  }

  function recover(){
    const state=readState();
    const before=JSON.stringify(state);
    let recoveredFromLegacy=0;

    /* Recupera estados antigos encontrados no próprio navegador sem substituir o atual. */
    LEGACY_KEYS.forEach(key=>{
      const legacy=extractState(readRaw(key));
      if(!legacy)return;
      const beforeCount=state.appointments.length;
      state.appointments=mergeAppointments(state.appointments,legacy.appointments);
      recoveredFromLegacy+=Math.max(0,state.appointments.length-beforeCount);
      const existingOpp=new Map((state.opportunities||[]).map(o=>[String(o.id||`${o.date}|${o.time}|${o.client}|${o.service}`),o]));
      (legacy.opportunities||[]).forEach(o=>{
        const k=String(o.id||`${o.date}|${o.time}|${o.client}|${o.service}`);
        if(!existingOpp.has(k))existingOpp.set(k,o);
      });
      state.opportunities=[...existingOpp.values()];
      if((legacy.transactions||[]).length){
        const tx=new Map((state.transactions||[]).map(t=>[String(t.id||JSON.stringify(t)),t]));
        legacy.transactions.forEach(t=>{const k=String(t.id||JSON.stringify(t));if(!tx.has(k))tx.set(k,t);});
        state.transactions=[...tx.values()];
      }
    });

    /* O atendimento conhecido da recuperação anterior é restaurado somente se estiver ausente. */
    const today=todayKey();
    const demo=canonicalTodayAppointment();
    const hasMarta=state.appointments.some(a=>a && a.date===today && String(a.client||'').toUpperCase()==='MARTA');
    if(!hasMarta){
      state.appointments.push(demo);
      recoveredFromLegacy++;
    }

    if(recoveredFromLegacy || JSON.stringify(state)!==before){
      saveState(state);
      localStorage.setItem(RECOVERY_KEY,JSON.stringify({date:today,recoveredAt:new Date().toISOString(),recoveredAppointments:recoveredFromLegacy}));
    }

    return recoveredFromLegacy;
  }

  try{recover();}
  catch(error){console.warn('BeautyMove: recuperação da Agenda não concluída.',error);}
})();