/* BeautyMove — Central de Oportunidades S.O.S. — painel operacional integrado à Agenda. */
(function(){'use strict';
const STATUS_KEY='beautymove.mvp.professional.daily-status',STATE_KEY='beautymove.mvp.state';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const dateKey=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
const mins=v=>{const [h,m]=String(v||'00:00').split(':').map(Number);return h*60+m};
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const candidates=[
 {name:'Juliana Costa',rating:'4,9',time:15,distance:'2,3 km',photo:'https://i.pravatar.cc/80?img=47'},
 {name:'Lucas Ferreira',rating:'4,8',time:18,distance:'3,1 km',photo:'https://i.pravatar.cc/80?img=12'},
 {name:'Bianca Rodrigues',rating:'4,7',time:22,distance:'4,2 km',photo:'https://i.pravatar.cc/80?img=32'},
 {name:'Carla Menezes',rating:'4,6',time:25,distance:'4,8 km',photo:'https://i.pravatar.cc/80?img=44'},
 {name:'Rafael Santos',rating:'4,5',time:28,distance:'5,0 km',photo:'https://i.pravatar.cc/80?img=11'}
];
function opportunities(){
 const d=dateKey(),st=read(STATUS_KEY,{}),s=read(STATE_KEY,{appointments:[]}),apps=s.appointments||[],out=[];
 apps.filter(a=>a.date===d&&a.status!=='cancelado').forEach(a=>{
   const r=st[`${d}::${a.professional}`];if(!r)return;
   if(r.status==='absent'){
     const affected=r.absenceType==='during_day'?mins(a.time)>=mins(r.absenceStart):(r.absenceType==='full_no_show'||r.absenceType==='full_notice');
     if(affected)out.push({...a,reason:r.absenceReason||'Ausência registrada',absence:r,kind:'absence'});
   }
   if(r.status==='late'&&r.lateStart&&mins(a.time)<mins(r.lateStart))out.push({...a,reason:'Atraso registrado',absence:r,kind:'late'});
 });
 return out;
}
function activeAbsences(){
 const d=dateKey(),st=read(STATUS_KEY,{});return Object.entries(st).filter(([k,v])=>k.startsWith(d+'::')&&v&&v.status==='absent').map(([k,v])=>({professional:k.split('::')[1],record:v}));
}
function ensure(){if(document.getElementById('sosOpportunityPanel'))return document.getElementById('sosOpportunityPanel');const p=document.createElement('aside');p.id='sosOpportunityPanel';p.setAttribute('aria-label','Central de Oportunidades S.O.S.');document.body.appendChild(p);return p}
function candidateMarkup(c){return `<div class="sos-op-candidate"><img class="sos-op-avatar" src="${c.photo}" alt=""><div class="sos-op-candidate-main"><div class="sos-op-candidate-name">${esc(c.name)} <span class="sos-op-candidate-rating">★ ${c.rating}</span></div><div class="sos-op-candidate-data"><span>◷ ${c.time} min</span><span>⌖ ${c.distance}</span></div><span class="sos-op-available">● Disponível</span></div><button type="button" class="sos-op-select" data-name="${esc(c.name)}">Selecionar</button></div>`}
function render(){
 const p=ensure(),list=opportunities(),abs=activeAbsences();
 if(!list.length){
   const monitored=abs.length;
   p.innerHTML=`<div class="sos-op-shell"><header class="sos-op-header"><div class="sos-op-kicker"><span class="sos-op-bolt">⚡</span><span>S.O.S. EM AÇÃO</span></div><div class="sos-op-subtitle">Central de Oportunidades</div><div class="sos-op-state"><span class="sos-op-state-dot"></span>${monitored?'Monitorando a agenda':'Central pronta'}</div></header><div class="sos-op-body"><div class="sos-op-empty"><div class="sos-op-empty-icon">✓</div><strong>${monitored?'Ocorrência monitorada':'Tudo sob controle'}</strong><span>${monitored?'A Central está acompanhando as ocorrências registradas e será acionada quando um atendimento precisar de solução.':'Quando um atendimento for afetado, a Central S.O.S. abrirá aqui a busca por profissionais.'}</span></div><div class="sos-op-principle"><strong>Resolver, não duplicar.</strong><span>A Agenda identifica o problema. O S.O.S. encontra a solução.</span></div></div></div>`;return;
 }
 const a=list[0],service=a.service||'Atendimento afetado',time=a.time||'—',kindLabel=a.kind==='late'?'Atraso':'Ausência';
 p.innerHTML=`<div class="sos-op-shell"><header class="sos-op-header active"><div class="sos-op-kicker"><span class="sos-op-bolt">⚡</span><span>S.O.S. EM AÇÃO</span></div><div class="sos-op-subtitle">Central de Oportunidades</div><div class="sos-op-state active"><span class="sos-op-state-dot"></span>${list.length} oportunidade${list.length>1?'s':''} ativa${list.length>1?'s':''}</div></header><div class="sos-op-body"><section class="sos-op-alert"><div class="sos-op-alert-label">ATENDIMENTO EM RISCO</div><div class="sos-op-request-title">${esc(service)}</div><div class="sos-op-request-meta">${kindLabel} de ${esc(a.professional)} · horário ${esc(time)}</div><div class="sos-op-request-grid"><div class="sos-op-request-box"><span>Serviço</span><strong>${esc(service)}</strong></div><div class="sos-op-request-box"><span>Busca</span><strong>Até 5 km</strong></div></div></section><div class="sos-op-search-state"><span class="sos-op-search-dot"></span><strong>Buscando profissionais</strong><span>Resposta rápida para este atendimento</span></div><div class="sos-op-sort"><span>Ordenar por:</span><select id="sosSort"><option value="time">Tempo de chegada</option><option value="distance">Distância</option><option value="rating">Avaliação</option></select></div><div class="sos-op-candidates-title">Profissionais disponíveis</div><div id="sosCandidates">${candidates.map(candidateMarkup).join('')}</div></div><footer class="sos-op-footer"><span class="sos-op-footer-mark">✓</span><strong>Profissionais verificados pela plataforma</strong></footer></div>`;
 const sort=p.querySelector('#sosSort');sort?.addEventListener('change',()=>{const mode=sort.value;const sorted=[...candidates].sort((x,y)=>mode==='rating'?Number(y.rating.replace(',','.'))-Number(x.rating.replace(',','.')):mode==='distance'?parseFloat(x.distance)-parseFloat(y.distance):x.time-y.time;const box=p.querySelector('#sosCandidates');if(box)box.innerHTML=sorted.map(candidateMarkup).join('');bindSelect()});bindSelect();
 function bindSelect(){p.querySelectorAll('.sos-op-select').forEach(btn=>btn.onclick=()=>{const n=document.getElementById('agendaNotice');if(n){n.textContent=`${btn.dataset.name} selecionada para avaliação da oportunidade.`;n.hidden=false;setTimeout(()=>n.hidden=true,4000)}})}
}
function boot(){render();let last='';const tick=()=>{const sig=JSON.stringify([dateKey(),localStorage.getItem(STATUS_KEY),localStorage.getItem(STATE_KEY)]);if(sig!==last){last=sig;render()}};setInterval(tick,1000);document.addEventListener('beautymove:planchange',render);document.getElementById('agendaDatePicker')?.addEventListener('change',render)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500),{once:true});else setTimeout(boot,500)
})();
