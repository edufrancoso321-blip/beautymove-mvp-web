/* BeautyMove — ações essenciais do atendimento + acionamento manual do S.O.S. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const SPECIALTY={Ana:'Cabelos',Bruna:'Cabelos',Paula:'Mãos e Pés',Carla:'Estética'};
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return {appointments:[],opportunities:[],transactions:[]};}};
  const save=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const closeDetails=()=>{const m=document.getElementById('detailsModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};
  const notice=msg=>{const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmDetailNotice);window.__bmDetailNotice=setTimeout(()=>n.hidden=true,3500);};
  const current=()=>{const id=document.getElementById('detailActions')?.dataset?.appointmentId;if(!id)return null;return read().appointments.find(a=>a.id===id)||null;};
  function ensureSosButton(){
    const box=document.getElementById('detailActions');if(!box)return;
    const old=box.querySelector('[data-detail-action="professional"]');if(old)old.remove();
    const finance=box.querySelector('[data-detail-action="finance"]');if(finance)finance.remove();
    const start=box.querySelector('[data-detail-action="arrived"]');if(start){start.textContent='Iniciar atendimento';start.classList.add('action-start');}
    if(!box.querySelector('[data-detail-action="sos"]')){
      const b=document.createElement('button');b.type='button';b.className='action-button action-sos';b.dataset.detailAction='sos';b.textContent='S.O.S.';box.appendChild(b);
    }
    const a=current();
    if(a?.status==='em_andamento'||a?.status==='chegou'){
      if(start)start.hidden=true;
    }else if(a?.status==='finalizado'||a?.status==='concluido'){
      if(start)start.hidden=true;
      const finish=box.querySelector('[data-detail-action="finish"]');if(finish)finish.hidden=true;
    }
  }
  function setStatus(status){
    const box=document.getElementById('detailActions');const id=box?.dataset?.appointmentId;if(!id)return;
    const s=read(),a=s.appointments.find(x=>x.id===id);if(!a)return;
    if(status==='em_andamento')a.arrivedAt=new Date().toISOString();
    if(status==='finalizado')a.finishedAt=new Date().toISOString();
    a.status=status;save(s);closeDetails();location.reload();
  }
  function triggerSos(){
    const box=document.getElementById('detailActions');const id=box?.dataset?.appointmentId;if(!id)return;
    const s=read(),a=s.appointments.find(x=>x.id===id);if(!a)return;
    s.opportunities=Array.isArray(s.opportunities)?s.opportunities:[];
    const active=s.opportunities.some(o=>o.source==='sos'&&o.appointmentId===a.id&&o.status!=='resolved'&&o.status!=='cancelado');
    if(active){notice('Este atendimento já possui uma oportunidade S.O.S. ativa.');closeDetails();return;}
    const service=a.service||(Array.isArray(a.services)?a.services.map(x=>x.name).join(' + '):'Atendimento');
    s.opportunities.push({id:'sos-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),appointmentId:a.id,date:a.date,time:a.time,client:a.client||'Cliente',service,specialty:SPECIALTY[a.professional]||'Cabelos',professional:a.professional||'',source:'sos',kind:'manual',status:'searching',radius:'5 km',acceptedBy:'',createdAt:new Date().toISOString()});
    save(s);closeDetails();location.reload();
  }
  function intercept(e){
    const btn=e.target.closest?.('#detailActions [data-detail-action]');if(!btn)return;
    const action=btn.dataset.detailAction;
    if(!['professional','finance','arrived','finish','sos'].includes(action))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(action==='arrived')setStatus('em_andamento');
    else if(action==='finish')setStatus('finalizado');
    else if(action==='sos')triggerSos();
  }
  function boot(){
    const actions=document.getElementById('detailsActions');if(!actions)return;
    actions.addEventListener('click',intercept,true);
    const normalize=()=>{ensureSosButton();const a=current();if(a){actions.dataset.appointmentId=a.id;}};
    const ob=new MutationObserver(normalize);ob.observe(actions,{childList:true,subtree:true});normalize();
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));
})();
