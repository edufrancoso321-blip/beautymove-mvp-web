/* BeautyMove — isolamento entre agendamento normal e S.O.S.
 * Um atendimento criado diretamente pela célula da Agenda nunca deve gerar,
 * copiar ou aparecer como uma oportunidade S.O.S. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return{appointments:[],opportunities:[],transactions:[]};}};
  const write=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const norm=v=>String(v||'').trim().toLowerCase();
  const min=t=>{const p=String(t||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  const serviceNames=a=>norm(a?.service||((Array.isArray(a?.services)?a.services:[]).map(s=>s?.name||'').join(' + ')));
  function sameAppointment(o,a){
    if(!o||!a||o.source!=='sos')return false;
    if(o.date!==a.date||min(o.time)!==min(a.time))return false;
    if(norm(o.client)!==norm(a.client))return false;
    const os=serviceNames(o),as=serviceNames(a);
    return !!os&&!!as&&(os===as||os.includes(as)||as.includes(os));
  }
  function normalizeNewAppointment(beforeIds){
    const state=read();
    const appointments=Array.isArray(state.appointments)?state.appointments:[];
    const opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const created=appointments.filter(a=>a&&a.id&&!beforeIds.has(a.id));
    if(!created.length)return;
    let changed=false;
    created.forEach(a=>{
      /* Agendamento normal é explicitamente separado da origem S.O.S. */
      if(a.source==='sos'){a.source='agenda';changed=true;}
      opportunities.slice().forEach(o=>{
        if(sameAppointment(o,a) && !o.acceptedBy && (o.status==='searching'||o.status==='aguardando')){
          const idx=state.opportunities.indexOf(o);
          if(idx>=0){state.opportunities.splice(idx,1);changed=true;}
        }
      });
    });
    if(changed)write(state);
    if(changed)window.dispatchEvent(new CustomEvent('beautymove:normal-appointment-isolated'));
  }
  function boot(){
    const form=document.getElementById('appointmentForm');
    if(!form)return;
    form.addEventListener('submit',()=>{
      const state=read();
      const before=new Set((Array.isArray(state.appointments)?state.appointments:[]).map(a=>a?.id).filter(Boolean));
      setTimeout(()=>normalizeNewAppointment(before),120);
      setTimeout(()=>normalizeNewAppointment(before),450);
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
