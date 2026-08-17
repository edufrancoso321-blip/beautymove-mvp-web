/* BeautyMove — ações essenciais do atendimento + acionamento manual do S.O.S. */
(function(){
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const SPECIALTY={Ana:'Cabelos',Bruna:'Cabelos',Paula:'Mãos e Pés',Carla:'Estética'};
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};}catch(_){return {appointments:[],opportunities:[],transactions:[]};}};
  const save=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
  const closeDetails=()=>{const m=document.getElementById('detailsModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}};
  const notice=msg=>{const n=document.getElementById('agendaNotice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(window.__bmDetailNotice);window.__bmDetailNotice=setTimeout(()=>n.hidden=true,3500);};
  const currentId=()=>window.__bmCurrentAppointmentId||document.getElementById('detailActions')?.dataset?.appointmentId||null;
  const current=()=>{const id=currentId();return id?read().appointments.find(a=>a.id===id)||null:null;};
  function classifyButtons(box){
    box.querySelectorAll('button').forEach(btn=>{
      const text=(btn.textContent||'').trim().toLowerCase();
      if(text.includes('registrar chegada')||text.includes('iniciar atendimento'))btn.dataset.detailAction='arrived';
      else if(text.includes('finalizar atendimento'))btn.dataset.detailAction='finish';
      else if(text.includes('alterar horário'))btn.dataset.detailAction='schedule';
      else if(text.includes('incluir / remover serviços'))btn.dataset.detailAction='services';
      else if(text.includes('cancelar atendimento'))btn.dataset.detailAction='cancel';
      else if(text==='alterar profissional')btn.dataset.detailAction='professional';
      else if(text==='financeiro')btn.dataset.detailAction='finance';
    });
  }
  function ensureSosButton(){
    const box=document.getElementById('detailActions');if(!box)return;
    classifyButtons(box);
    box.querySelector('[data-detail-action="professional"]')?.remove();
    box.querySelector('[data-detail-action="finance"]')?.remove();
    const start=box.querySelector('[data-detail-action="arrived"]');if(start){start.textContent='Iniciar atendimento';start.classList.add('action-start');}
    if(!box.querySelector('[data-detail-action="sos"]')){
      const b=document.createElement('button');b.type='button';b.className='action-button action-sos';b.dataset.detailAction='sos';b.textContent='S.O.S.';box.appendChild(b);
    }
    const a=current();
    if(a?.status==='em_andamento'||a?.status==='chegou'){if(start)start.hidden=true;}
    else if(a?.status==='finalizado'||a?.status==='concluido'){if(start)start.hidden=true;const finish=box.querySelector('[data-detail-action="finish"]');if(finish)finish.hidden=true;}
  }
  function setStatus(status){
    const id=currentId();if(!id)return;
    const s=read(),a=s.appointments.find(x=>x.id===id);if(!a)return;
    if(status==='em_andamento')a.arrivedAt=new Date().toISOString();
    if(status==='finalizado')a.finishedAt=new Date().toISOString();
    a.status=status;save(s);closeDetails();location.reload();
  }
  function triggerSos(){
    const id=currentId();if(!id)return;
    const s=read(),a=s.appointments.find(x=>x.id===id);if(!a)return;
    s.opportunities=Array.isArray(s.opportunities)?s.opportunities:[];
    const active=s.opportunities.some(o=>o.source==='sos'&&o.appointmentId===a.id&&!['resolved','cancelado'].includes(o.status));
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
    const actions=document.getElementById('detailActions');
    document.addEventListener('click',e=>{const cell=e.target.closest?.('#agendaGrid [data-appointment-id]');if(cell)window.__bmCurrentAppointmentId=cell.dataset.appointmentId||null;},true);
    if(!actions)return;
    actions.addEventListener('click',intercept,true);
    const normalize=()=>{ensureSosButton();const a=current();if(a)actions.dataset.appointmentId=a.id;};
    const ob=new MutationObserver(normalize);ob.observe(actions,{childList:true,subtree:true});normalize();
    new MutationObserver(()=>{if(document.getElementById('detailActions')===actions)normalize();}).observe(document.getElementById('detailsModal')||document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300),{once:true});else setTimeout(boot,300);
})();
