/* BeautyMove — Central de Oportunidades S.O.S. — vínculo real entre ocorrência, atendimento e solução. */
(function(){'use strict';
const STATUS_KEY='beautymove.mvp.professional.daily-status';
const STATE_KEY='beautymove.mvp.state';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const dateKey=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
const mins=v=>{const p=String(v||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0)};
const endMins=a=>mins(a.time)+Math.max(30,Number(a.duration)||60);
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const candidates=[
{name:'Juliana Costa',rating:'4,9',time:15,distance:'2,3 km',photo:'https://i.pravatar.cc/80?img=47'},
{name:'Lucas Ferreira',rating:'4,8',time:18,distance:'3,1 km',photo:'https://i.pravatar.cc/80?img=12'},
{name:'Bianca Rodrigues',rating:'4,7',time:22,distance:'4,2 km',photo:'https://i.pravatar.cc/80?img=32'},
{name:'Carla Menezes',rating:'4,6',time:25,distance:'4,8 km',photo:'https://i.pravatar.cc/80?img=44'},
{name:'Rafael Santos',rating:'4,5',time:28,distance:'5,0 km',photo:'https://i.pravatar.cc/80?img=11'}
];
function opportunityForAppointment(a,r){
 if(!r||!a||a.status==='cancelado')return false;
 if(r.status==='absent'){
   if(r.absenceType==='during_day'&&r.absenceStart)return endMins(a)>mins(r.absenceStart);
   return r.absenceType==='full_no_show'||r.absenceType==='full_notice'||!r.absenceType;
 }
 if(r.status==='late'&&r.lateStart)return mins(a.time)<mins(r.lateStart);
 return false;
}
function opportunities(){
 const d=dateKey(),st=read(STATUS_KEY,{}),s=read(STATE_KEY,{appointments:[]}),apps=Array.isArray(s.appointments)?s.appointments:[],out=[];
 Object.entries(st).forEach(([key,r])=>{
   if(!key.startsWith(d+'::')||!r||!['absent','late'].includes(r.status))return;
   const professional=key.slice(d.length+2);
   apps.filter(a=>a.date===d&&a.professional===professional&&opportunityForAppointment(a,r)).forEach(a=>out.push({...a,professional,reason:r.absenceReason||'Ocorrência registrada',occurrence:r,kind:r.status}));
 });
 return out.sort((a,b)=>mins(a.time)-mins(b.time));
}
function ensure(){let p=document.getElementById('sosOpportunityPanel');if(p)return p;p=document.createElement('aside');p.id='sosOpportunityPanel';p.setAttribute('aria-label','Central de Oportunidades S.O.S.');document.body.appendChild(p);return p}
function candidateMarkup(c){return `<div class="sos-op-candidate"><img class="sos-op-avatar" src="${c.photo}" alt=""><div class="sos-op-candidate-main"><div class="sos-op-candidate-name">${esc(c.name)} <span class="sos-op-candidate-rating">★ ${c.rating}</span></div><div class="sos-op-candidate-data"><span>◷ ${c.time} min</span><span>⌖ ${c.distance}</span></div><span class="sos-op-available">● Disponível</span></div><button type="button" class="sos-op-select" data-name="${esc(c.name)}">Selecionar</button></div>`}
function syncAgendaSos(list){
 const byKey=new Map(list.map(x=>[`${x.professional}::${x.time}`,x]));
 document.querySelectorAll('#agendaGrid td[data-sos-cell="true"]').forEach(cell=>{
   const key=`${cell.dataset.professional||''}::${cell.dataset.time||''}`;
   const item=list.find(x=>mins(x.time)<=mins(cell.dataset.time)&&endMins(x)>mins(cell.dataset.time)&&x.professional===cell.dataset.professional);
   if(!item){cell.classList.remove('sos-opportunity-active');if(cell.textContent.trim()==='Livre')return;return;}
   cell.classList.add('sos-opportunity-active');cell.innerHTML=`<strong>${esc(item.client||'Atendimento afetado')}</strong><span>${esc(item.service||'Atendimento')}</span><small>${esc(item.kind==='late'?'Atraso':'Ausência')} · ${esc(item.professional)} · ${esc(item.time)}</small>`;
 });
}
function render(){
 const p=ensure(),list=opportunities();
 if(!list.length){
   p.innerHTML=`<div class="sos-op-shell"><header class="sos-op-header"><div class="sos-op-kicker"><span class="sos-op-bolt">⚡</span><span>S.O.S. EM AÇÃO</span></div><div class="sos-op-subtitle">Central de Oportunidades</div><div class="sos-op-state"><span class="sos-op-state-dot"></span>Central pronta</div></header><div class="sos-op-body"><div class="sos-op-empty"><div class="sos-op-empty-icon">✓</div><strong>Tudo sob controle</strong><span>Quando um atendimento for afetado, a Central S.O.S. abrirá aqui a busca por profissionais.</span></div><div class="sos-op-principle"><strong>Resolver, não duplicar.</strong><span>A Agenda identifica o problema. O S.O.S. encontra a solução.</span></div></div></div>`;return;
 }
 const a=list[0],service=a.service||'Atendimento afetado',kindLabel=a.kind==='late'?'Atraso':'Ausência';
 p.innerHTML=`<div class="sos-op-shell"><header class="sos-op-header active"><div class="sos-op-kicker"><span class="sos-op-bolt">⚡</span><span>S.O.S. EM AÇÃO</span></div><div class="sos-op-subtitle">Central de Oportunidades</div><div class="sos-op-state active"><span class="sos-op-state-dot"></span>${list.length} atendimento${list.length>1?'s':''} em risco</div></header><div class="sos-op-body"><section class="sos-op-alert"><div class="sos-op-alert-label">ATENDIMENTO EM RISCO</div><div class="sos-op-request-title">${esc(service)}</div><div class="sos-op-request-meta">${kindLabel} · ${esc(a.professional)} · ${esc(a.time)}</div><div class="sos-op-request-grid"><div class="sos-op-request-box"><span>Cliente</span><strong>${esc(a.client||'—')}</strong></div><div class="sos-op-request-box"><span>Raio de busca</span><strong>Até 5 km</strong></div></div></section><div class="sos-op-search-state"><span class="sos-op-search-dot"></span><strong>Buscando profissionais</strong><span>Resposta rápida para este atendimento</span></div><div class="sos-op-sort"><span>Ordenar por:</span><select id="sosSort"><option value="time">Tempo de chegada</option><option value="distance">Distância</option><option value="rating">Avaliação</option></select></div><div class="sos-op-candidates-title">Profissionais disponíveis</div><div id="sosCandidates">${candidates.map(candidateMarkup).join('')}</div></div><footer class="sos-op-footer"><span class="sos-op-footer-mark">✓</span><strong>Profissionais verificados pela plataforma</strong></footer></div>`;
 const sort=p.querySelector('#sosSort');sort?.addEventListener('change',()=>{const mode=sort.value;const sorted=[...candidates].sort((x,y)=>mode==='rating'?Number(y.rating.replace(',','.'))-Number(x.rating.replace(',','.')):mode==='distance'?parseFloat(x.distance)-parseFloat(y.distance):x.time-y.time;const box=p.querySelector('#sosCandidates');if(box)box.innerHTML=sorted.map(candidateMarkup).join('');bindSelect()});bindSelect();
 function bindSelect(){p.querySelectorAll('.sos-op-select').forEach(btn=>btn.onclick=()=>{const n=document.getElementById('agendaNotice');if(n){n.textContent=`${btn.dataset.name} selecionada para avaliação da oportunidade.`;n.hidden=false;setTimeout(()=>n.hidden=true,4000)}})}
}
function boot(){
 render();
 let last='';
 const tick=()=>{const sig=JSON.stringify([dateKey(),localStorage.getItem(STATUS_KEY),localStorage.getItem(STATE_KEY)]);if(sig!==last){last=sig;render()}};
 setInterval(tick,1000);
 document.addEventListener('beautymove:planchange',render);
 document.getElementById('agendaDatePicker')?.addEventListener('change',render);
 const grid=document.getElementById('agendaGrid');if(grid)new MutationObserver(()=>{setTimeout(()=>syncAgendaSos(opportunities()),0)}).observe(grid,{childList:true,subtree:true});
 setTimeout(()=>syncAgendaSos(opportunities()),700);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500),{once:true});else setTimeout(boot,500);
})();
