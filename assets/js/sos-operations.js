/* BeautyMove — Agenda S.O.S. V3
 * Cérebro independente da Agenda Profissionais.
 * Fonte de verdade: oportunidades em beautymove.mvp.state.
 * Ações aqui não criam, alteram ou removem appointments profissionais.
 */
(function(){
  'use strict';
  const STATE='beautymove.mvp.state', SERVICES='beautymove.mvp.services';
  const PEOPLE=['Ana','Bruna','Paula','Carla','Juliana Costa','Lucas Ferreira','Bianca Rodrigues'];
  const DEFAULT_SERVICES=[
    {id:'corte',name:'Corte',value:80,category:'Cabelos',durationMinutes:60},
    {id:'escova',name:'Escova',value:60,category:'Cabelos',durationMinutes:30},
    {id:'coloracao',name:'Coloração',value:150,category:'Cabelos',durationMinutes:120},
    {id:'luzes',name:'Luzes',value:250,category:'Cabelos',durationMinutes:180},
    {id:'corte-feminino',name:'Corte feminino',value:80,category:'Cabelos',durationMinutes:60},
    {id:'manicure',name:'Manicure',value:55,category:'Mãos e Pés',durationMinutes:60},
    {id:'pedicure',name:'Pedicure',value:65,category:'Mãos e Pés',durationMinutes:60},
    {id:'limpeza-pele',name:'Limpeza de pele',value:120,category:'Estética',durationMinutes:75}
  ];
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const saveState=st=>{localStorage.setItem(STATE,JSON.stringify(st));window.dispatchEvent(new CustomEvent('beautymove:sos-changed'))};
  const services=()=>{const s=read(SERVICES,[]);return Array.isArray(s)&&s.length?s.filter(x=>x.status!=='inativo'):DEFAULT_SERVICES};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const minutes=v=>{const p=String(v||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0)};
  const time=v=>`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const fmtDate=v=>{if(!v)return 'Hoje';const d=new Date(`${v}T12:00:00`);return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})};
  let selectedDate=today(), focusedId=new URLSearchParams(location.search).get('opportunity')||null;

  function state(){const s=read(STATE,{});return{appointments:Array.isArray(s?.appointments)?s.appointments:[],opportunities:Array.isArray(s?.opportunities)?s.opportunities:[],transactions:Array.isArray(s?.transactions)?s.transactions:[]}}
  function activeOps(){return state().opportunities.filter(o=>!['finalizada','cancelada','concluida'].includes(String(o.status||'').toLowerCase()))}
  function opsForDate(){return activeOps().filter(o=>String(o.date||'')===selectedDate)}

  function setDate(v,focus){selectedDate=v||today();const picker=document.getElementById('sosDatePicker');if(picker)picker.value=selectedDate;const label=document.getElementById('sosDateLabel');if(label)label.textContent=fmtDate(selectedDate);renderAgenda();renderSide();if(focus)focusOpportunity(focus)}
  function shiftDay(delta){const d=new Date(`${selectedDate}T12:00:00`);d.setDate(d.getDate()+delta);setDate(d.toISOString().slice(0,10))}

  function renderAgenda(){
    const grid=document.getElementById('sosGrid');if(!grid)return;
    const start=8,end=22,rows=end-start;
    const labels=Array.from({length:rows},(_,i)=>time((start+i)*60));
    grid.innerHTML=`<div class="sos-time-col">${labels.map(x=>`<div class="sos-time-cell">${x}</div>`).join('')}</div><div class="sos-op-col"><div class="sos-op-area" style="height:${rows*68}px">${labels.map((_,i)=>`<div class="sos-op-row"></div>`).join('')}${opsForDate().map(renderOpportunityBlock).join('')}</div></div>`;
    grid.querySelectorAll('[data-op-id]').forEach(el=>el.addEventListener('click',()=>focusOpportunity(el.dataset.opId)));
    if(focusedId)requestAnimationFrame(()=>focusOpportunity(focusedId));
  }
  function renderOpportunityBlock(o){
    const start=minutes(o.time)-8*60,dur=Math.max(30,Number(o.durationMinutes)||60),top=Math.max(0,start/60*68),height=Math.max(58,dur/60*68-6);
    return `<article class="sos-opportunity" id="sos-op-${esc(o.id)}" data-op-id="${esc(o.id)}" style="top:${top}px;height:${height}px"><h3>${esc(o.service||'Serviço S.O.S.')}</h3><p>${esc(o.time||'')} · ${esc(o.client||'Cliente')} · ${esc(o.specialty||'')}</p><p>${durationLabel(dur)} · ${money(o.value)}</p><span class="sos-op-status">${esc(o.status||'aberta')}${o.sentTo?` · ${esc(o.sentTo)}`:''}</span></article>`;
  }
  function durationLabel(v){const h=Math.floor(v/60),m=v%60;return h?`${h}h${m?` ${m}min`:''}`:`${m}min`}

  function renderSide(){
    const list=document.getElementById('sosSideList'),count=document.getElementById('sosSideCount');if(!list)return;
    const all=activeOps();if(count)count.textContent=`${all.length} oportunidade${all.length===1?'':'s'} ativa${all.length===1?'':'s'}`;
    const day=all.filter(o=>String(o.date||'')===selectedDate).sort((a,b)=>minutes(a.time)-minutes(b.time));
    if(!day.length){list.innerHTML='<div class="sos-empty">Nenhuma oportunidade ativa nesta data.</div>';return}
    list.innerHTML=day.map(o=>`<article class="sos-side-item" data-side-id="${esc(o.id)}"><strong>${esc(o.service||'Serviço S.O.S.')}</strong><span>${esc(o.time||'')} · ${esc(o.client||'Cliente')}</span><span>${esc(o.specialty||'')} · ${esc(o.status||'aberta')}${o.sentTo?` · ${esc(o.sentTo)}`:''}</span><button class="secondary compact" type="button" data-focus-id="${esc(o.id)}">Ver na agenda</button></article>`).join('');
    list.querySelectorAll('[data-focus-id]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();focusOpportunity(b.dataset.focusId)}));
    list.querySelectorAll('[data-side-id]').forEach(c=>c.addEventListener('click',()=>focusOpportunity(c.dataset.sideId)));
  }
  function focusOpportunity(id){
    const op=state().opportunities.find(x=>x.id===id);if(!op)return;focusedId=id;
    if(op.date&&op.date!==selectedDate){setDate(op.date);return}
    document.querySelectorAll('.is-focused').forEach(x=>x.classList.remove('is-focused'));
    document.getElementById(`sos-op-${CSS.escape(id)}`)?.classList.add('is-focused');
    document.querySelector(`[data-side-id="${CSS.escape(id)}"]`)?.classList.add('is-focused');
    document.getElementById(`sos-op-${CSS.escape(id)}`)?.scrollIntoView({behavior:'smooth',block:'center'});
    openDetail(op);
  }

  function openDetail(op){
    let modal=document.getElementById('sosDetailModal');
    if(!modal){modal=document.createElement('div');modal.id='sosDetailModal';modal.className='sos-modal';document.body.appendChild(modal)}
    modal.innerHTML=`<section class="sos-modal-card" role="dialog" aria-modal="true"><div class="eyebrow">OPORTUNIDADE S.O.S.</div><h2>${esc(op.service||'Serviço S.O.S.')}</h2><div class="sos-detail-grid"><div><small>Data</small><strong>${esc(op.date||'')}</strong></div><div><small>Horário</small><strong>${esc(op.time||'')}</strong></div><div><small>Cliente</small><strong>${esc(op.client||'Cliente')}</strong></div><div><small>Especialidade</small><strong>${esc(op.specialty||'')}</strong></div><div><small>Duração</small><strong>${durationLabel(Number(op.durationMinutes)||60)}</strong></div><div><small>Valor</small><strong>${money(op.value)}</strong></div></div><div class="sos-detail"><label for="sosAssignSelect"><strong>Decisão da recepcionista</strong></label><select id="sosAssignSelect" style="width:100%;height:40px;margin-top:8px;border:1px solid #ddd5e8;border-radius:8px;padding:0 10px"><option value="">${op.sentTo?`Profissional atual: ${esc(op.sentTo)}`:'Selecionar profissional'}</option>${PEOPLE.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select><div class="sos-modal-actions" style="margin-top:14px"><button class="secondary compact" type="button" data-detail-close>Fechar</button><button class="secondary compact" type="button" data-detail-cancel>Cancelar oportunidade</button><button class="primary compact" type="button" data-detail-assign>Atribuir profissional</button></div></div></section>`;
    modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
    modal.querySelector('[data-detail-close]').onclick=closeDetail;modal.querySelector('[data-detail-cancel]').onclick=()=>changeStatus(op.id,'cancelada');modal.querySelector('[data-detail-assign]').onclick=()=>assign(op.id,modal.querySelector('#sosAssignSelect').value);
    modal.addEventListener('click',e=>{if(e.target===modal)closeDetail()},{once:true});
  }
  function closeDetail(){const m=document.getElementById('sosDetailModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true')}}
  function assign(id,professional){if(!professional){alert('Selecione uma profissional para atribuir a oportunidade.');return}const st=state(),op=st.opportunities.find(x=>x.id===id);if(!op)return;op.status='enviada';op.sentTo=professional;op.sentAt=new Date().toISOString();saveState(st);closeDetail();renderAgenda();renderSide();focusOpportunity(id)}
  function changeStatus(id,status){const st=state(),op=st.opportunities.find(x=>x.id===id);if(!op)return;op.status=status;op.updatedAt=new Date().toISOString();saveState(st);closeDetail();renderAgenda();renderSide()}

  function openNew(){const modal=document.getElementById('sosModal');if(!modal)return;modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.getElementById('sosDate').value=selectedDate;document.getElementById('sosTime').value='';renderServicePicker()}
  function closeNew(){const modal=document.getElementById('sosModal');if(modal){modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true')}}
  function renderServicePicker(){const box=document.getElementById('sosServicePicker'),cat=document.getElementById('specialty')?.value;if(!box)return;const list=services().filter(s=>!cat||s.category===cat);box.innerHTML=list.length?list.map(s=>`<label><input type="checkbox" value="${esc(s.id)}"><span>${esc(s.name)}</span><strong>${money(s.value)} · ${Number(s.durationMinutes||30)} min</strong></label>`).join(''):'<div style="padding:12px;color:#777">Nenhum serviço cadastrado para esta especialidade.</div>'}
  function createOpportunity(e){e.preventDefault();const ids=[...document.querySelectorAll('#sosServicePicker input:checked')].map(x=>x.value),catalog=services(),items=catalog.filter(s=>ids.includes(s.id));if(!items.length){alert('Selecione pelo menos um serviço.');return}const st=state(),date=document.getElementById('sosDate').value,timeValue=document.getElementById('sosTime').value;const op={id:`sos-${Date.now()}`,date,time:timeValue,specialty:document.getElementById('specialty').value,serviceIds:items.map(s=>s.id),services:items.map(s=>({id:s.id,name:s.name,value:Number(s.value||0),category:s.category,durationMinutes:Number(s.durationMinutes||30)})),service:items.map(s=>s.name).join(' + '),value:items.reduce((n,s)=>n+Number(s.value||0),0),durationMinutes:items.reduce((n,s)=>n+Number(s.durationMinutes||30),0),radius:document.getElementById('sosRadius').value,materials:document.getElementById('sosMaterials').value,notes:document.getElementById('sosNotes').value,status:'aberta',client:document.getElementById('sosClient').value,createdAt:new Date().toISOString()};st.opportunities.push(op);saveState(st);closeNew();selectedDate=date;focusedId=op.id;setDate(date,op.id)}

  function boot(){
    const q=new URLSearchParams(location.search),qId=q.get('opportunity');
    const qOp=qId?state().opportunities.find(o=>o.id===qId):null;if(qOp?.date)selectedDate=qOp.date;focusedId=qId||null;
    document.getElementById('sosPrevDay')?.addEventListener('click',()=>shiftDay(-1));document.getElementById('sosNextDay')?.addEventListener('click',()=>shiftDay(1));document.getElementById('sosTodayBtn')?.addEventListener('click',()=>setDate(today()));document.getElementById('sosNewBtn')?.addEventListener('click',openNew);document.getElementById('sosCancelBtn')?.addEventListener('click',closeNew);document.getElementById('sosModal')?.addEventListener('click',e=>{if(e.target.id==='sosModal')closeNew()});document.getElementById('sosDatePicker')?.addEventListener('change',e=>setDate(e.target.value));document.getElementById('specialty')?.addEventListener('change',renderServicePicker);document.getElementById('sosForm')?.addEventListener('submit',createOpportunity);
    setDate(selectedDate,qId);window.addEventListener('storage',e=>{if(e.key===STATE){renderAgenda();renderSide();if(focusedId)focusOpportunity(focusedId)}});window.addEventListener('beautymove:sos-changed',()=>{renderAgenda();renderSide()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
