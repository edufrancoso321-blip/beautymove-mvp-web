/* BeautyMove — Central de Oportunidades S.O.S. */
(function(){
  'use strict';
  const STATUS_KEY='beautymove.mvp.professional.daily-status';
  const STATE_KEY='beautymove.mvp.state';
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v||fallback;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  const minutes=v=>{const p=String(v||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
  const today=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const specialty={Ana:'Cabelos',Bruna:'Cabelos',Paula:'Mãos e Pés',Carla:'Estética'};
  const candidates=[['Juliana Costa','4,9','15 min','2,3 km'],['Lucas Ferreira','4,8','18 min','3,1 km'],['Bianca Rodrigues','4,7','22 min','4,2 km'],['Carla Menezes','4,6','25 min','4,8 km'],['Rafael Santos','4,5','28 min','5,0 km']];
  function ensureWorkspace(){const grid=document.getElementById('agendaGrid');if(!grid)return null;let ws=document.getElementById('agendaWorkspace');if(!ws){ws=document.createElement('div');ws.id='agendaWorkspace';ws.className='agenda-workspace';grid.parentNode.insertBefore(ws,grid);ws.appendChild(grid);}return ws;}
  function ensurePanel(){const ws=ensureWorkspace();if(!ws)return null;let p=document.getElementById('sosOpportunityPanel');if(!p){p=document.createElement('aside');p.id='sosOpportunityPanel';p.setAttribute('aria-label','Central de Oportunidades S.O.S.');ws.appendChild(p);}else if(p.parentElement!==ws)ws.appendChild(p);return p;}
  function normalizeAcceptedAppointments(){
    const state=read(STATE_KEY,{appointments:[],opportunities:[],transactions:[]});
    let changed=false;
    (state.appointments||[]).forEach(a=>{
      if(a?.sosAcceptedBy&&a?.sosOriginalProfessional&&a.professional!==a.sosOriginalProfessional){
        a.professional=a.sosOriginalProfessional;
        changed=true;
      }
    });
    if(changed)write(STATE_KEY,state);
  }
  function affected(){
    const date=today(),statuses=read(STATUS_KEY,{}),state=read(STATE_KEY,{appointments:[],opportunities:[]}),appointments=Array.isArray(state.appointments)?state.appointments:[];
    return appointments.filter(a=>a&&a.date===date&&a.status!=='cancelado'&&!a.sosAcceptedBy).map(a=>{const r=statuses[date+'::'+a.professional];if(!r||!['absent','late'].includes(r.status))return null;const start=minutes(a.time),end=start+Math.max(30,Number(a.duration)||60);const ok=r.status==='late'?start<minutes(r.lateStart||'00:00'):r.absenceType==='during_day'?end>minutes(r.absenceStart||'23:59'):true;if(!ok)return null;return {id:'affected-'+a.id,appointmentId:a.id,date:a.date,time:a.time,client:a.client||'Cliente',service:a.service||'Atendimento',specialty:specialty[a.professional]||'Cabelos',professional:a.professional||'',kind:'urgente',status:'searching',reason:r.status==='late'?'Atraso':'Ausência'};}).filter(Boolean);
  }
  function manual(){const date=today(),state=read(STATE_KEY,{opportunities:[]}),items=Array.isArray(state.opportunities)?state.opportunities:[];return items.filter(o=>o&&o.date===date&&o.source==='sos'&&o.status!=='cancelado'&&o.status!=='resolved').map(o=>({...o,kind:o.kind||'manual',status:o.status||'searching'}));}
  function tracking(){
    const date=today(),state=read(STATE_KEY,{appointments:[],opportunities:[]}),appointments=Array.isArray(state.appointments)?state.appointments:[],items=Array.isArray(state.opportunities)?state.opportunities:[];
    const tracked=items.filter(o=>o&&o.date===date&&o.source==='sos'&&o.status==='resolved'&&o.acceptedBy).map(o=>{const appointment=o.appointmentId?appointments.find(a=>a&&a.id===o.appointmentId):null;return {...o,kind:'tracking',status:'tracking',professional:o.acceptedBy,appointmentStatus:appointment?.status||'confirmado'};});
    return tracked.filter(o=>o.appointmentStatus!=='cancelado');
  }
  function opportunities(){const map=new Map();[...affected(),...manual()].forEach(item=>{const key=item.appointmentId||item.id;if(!map.has(key)||item.kind==='manual')map.set(key,item);});return [...map.values()].sort((a,b)=>minutes(a.time)-minutes(b.time));}
  function candidateList(){return candidates.map(c=>`<div class="sos-op-candidate"><div class="sos-op-avatar-placeholder">${esc(c[0].charAt(0))}</div><div class="sos-op-candidate-main"><div class="sos-op-candidate-name">${esc(c[0])} <span>★ ${c[1]}</span></div><div class="sos-op-candidate-data">◷ ${c[2]} · ⌖ ${c[3]}</div><div class="sos-op-available">● Disponível</div></div><button type="button" class="sos-op-select" data-professional="${esc(c[0])}">Selecionar</button></div>`).join('');}
  function selectCandidate(professional){
    const state=read(STATE_KEY,{appointments:[],opportunities:[],transactions:[]});
    state.appointments=Array.isArray(state.appointments)?state.appointments:[];
    state.opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
    const items=opportunities();
    const active=items[0];
    if(!active)return;
    const now=new Date().toISOString();
    if(active.appointmentId){
      const appointment=state.appointments.find(a=>a&&a.id===active.appointmentId);
      if(appointment){
        const originalProfessional=appointment.sosOriginalProfessional||appointment.professional||'';
        appointment.sosOriginalProfessional=originalProfessional;
        appointment.professional=originalProfessional;
        appointment.sosAcceptedBy=professional;
        appointment.sosAcceptedAt=now;
      }
      state.opportunities.forEach(o=>{if(o&&o.source==='sos'&&o.date===active.date&&o.time===active.time&&o.client===active.client){o.status='resolved';o.acceptedBy=professional;o.acceptedAt=now;o.appointmentId=o.appointmentId||active.appointmentId;}});
      const existing=state.opportunities.find(o=>o&&o.id===active.id);
      if(existing){existing.status='resolved';existing.acceptedBy=professional;existing.acceptedAt=now;existing.appointmentId=existing.appointmentId||active.appointmentId;}
      else{state.opportunities.push({id:active.id,date:active.date,time:active.time,client:active.client,service:active.service,specialty:active.specialty,source:'sos',status:'resolved',acceptedBy:professional,acceptedAt:now,appointmentId:active.appointmentId});}
    }else{
      const opportunity=state.opportunities.find(o=>o&&o.id===active.id);
      if(opportunity){opportunity.status='resolved';opportunity.acceptedBy=professional;opportunity.acceptedAt=now;}
    }
    if(!write(STATE_KEY,state))return;
    const n=document.getElementById('agendaNotice');
    if(n){n.textContent=`${professional} selecionada para a oportunidade S.O.S.`;n.hidden=false;clearTimeout(window.__bmSosNotice);window.__bmSosNotice=setTimeout(()=>n.hidden=true,4500);}
    window.dispatchEvent(new CustomEvent('beautymove:sos-accepted',{detail:{professional,opportunity:active}}));
    render();
  }
  function render(){
    const panel=ensurePanel();if(!panel)return;const items=opportunities(),tracked=tracking();
    if(!items.length&&!tracked.length){panel.innerHTML=`<div class="sos-op-shell"><header class="sos-op-header"><div class="sos-op-kicker"><span class="sos-op-bolt">⚡</span><span>S.O.S.</span></div><div class="sos-op-subtitle">Central de Oportunidades</div><div class="sos-op-state"><span></span>Pronto para agir</div></header><div class="sos-op-body"><div class="sos-op-empty"><div class="sos-op-empty-icon">✓</div><strong>Tudo sob controle</strong><span>Nenhuma oportunidade ativa.</span></div></div></div>`;return;}
    if(!items.length&&tracked.length){
      const item=tracked[0];
      panel.innerHTML=`<div class="sos-op-shell tracking"><header class="sos-op-header active"><div class="sos-op-kicker"><span class="sos-op-bolt">⚡</span><span>S.O.S.</span></div><div class="sos-op-subtitle">Central de Oportunidades</div><div class="sos-op-state active"><span></span>Acompanhando atendimento</div></header><div class="sos-op-body"><section class="sos-op-alert"><div class="sos-op-alert-label">PROFISSIONAL SELECIONADA</div><strong>${esc(item.service||'Atendimento')}</strong><div>${esc(item.client||'Cliente')} · ${esc(item.time||'A definir')}</div><small>Profissional: ${esc(item.acceptedBy||item.professional||'A definir')}</small></section><div class="sos-op-search-state"><span class="sos-op-search-dot"></span><strong>Atendimento em acompanhamento</strong><small>${esc(item.specialty||'Especialidade')}</small></div><div class="sos-op-candidate sos-op-selected-candidate"><div class="sos-op-avatar-placeholder">${esc((item.acceptedBy||'P').charAt(0))}</div><div class="sos-op-candidate-main"><div class="sos-op-candidate-name">${esc(item.acceptedBy||'Profissional selecionada')}</div><div class="sos-op-candidate-data">Profissional selecionada para o atendimento</div><div class="sos-op-available">● Em acompanhamento</div></div></div><div style="margin-top:12px;padding:10px;border:1px solid #e5daf7;border-radius:9px;background:#fbf8ff;font-size:10px;color:#6f6280">A oportunidade S.O.S. foi encerrada, mas o atendimento continua sendo acompanhado nesta Central.</div></div><footer class="sos-op-footer">✓ Acompanhamento ativo</footer></div>`;
      return;
    }
    const active=items[0];
    panel.innerHTML=`<div class="sos-op-shell active"><header class="sos-op-header active"><div class="sos-op-kicker"><span class="sos-op-bolt">⚡</span><span>S.O.S.</span></div><div class="sos-op-subtitle">Central de Oportunidades</div><div class="sos-op-state active"><span></span>${items.length} oportunidade${items.length>1?'s':''} ativa${items.length>1?'s':''}</div></header><div class="sos-op-body"><div class="sos-op-queue">${items.map((item,i)=>`<button type="button" class="sos-op-queue-item ${i===0?'is-active':''}" data-op-index="${i}"><strong>${esc(item.time)}</strong><span>${esc(item.client)}</span><small>${esc(item.kind==='manual'?'Nova solicitação':item.reason||'Atendimento afetado')}</small></button>`).join('')}</div><section class="sos-op-alert"><div class="sos-op-alert-label">${active.kind==='manual'?'NOVA OPORTUNIDADE':'AÇÃO NECESSÁRIA'}</div><strong>${esc(active.service)}</strong><div>${esc(active.client)} · ${esc(active.time)}</div><small>${esc(active.kind==='manual'?'Solicitação S.O.S.':'Profissional indisponível')}</small></section><div class="sos-op-search-state"><span class="sos-op-search-dot"></span><strong>Buscando profissionais</strong><small>${esc(active.specialty||'Especialidade')}</small></div><div class="sos-op-candidates-title">Profissionais disponíveis</div><div id="sosCandidates">${candidateList()}</div></div><footer class="sos-op-footer">✓ Verificados pela plataforma</footer></div>`;
    panel.onclick=(event)=>{const button=event.target.closest('.sos-op-select');if(!button||!panel.contains(button))return;event.preventDefault();event.stopPropagation();selectCandidate(button.dataset.professional);};
    panel.querySelectorAll('.sos-op-queue-item').forEach(b=>b.addEventListener('click',()=>{const idx=Number(b.dataset.opIndex),selected=items[idx];if(!selected)return;panel.querySelectorAll('.sos-op-queue-item').forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active');const alert=panel.querySelector('.sos-op-alert');alert.querySelector('.sos-op-alert-label').textContent=selected.kind==='manual'?'NOVA OPORTUNIDADE':'AÇÃO NECESSÁRIA';alert.querySelector('strong').textContent=selected.service;alert.querySelector('div').textContent=`${selected.client} · ${selected.time}`;alert.querySelector('small').textContent=selected.kind==='manual'?'Solicitação S.O.S.':'Profissional indisponível';}));
  }
  function boot(){normalizeAcceptedAppointments();ensureWorkspace();render();let signature='';setInterval(()=>{normalizeAcceptedAppointments();const s=JSON.stringify([today(),localStorage.getItem(STATUS_KEY),localStorage.getItem(STATE_KEY)]);if(s!==signature){signature=s;render();}},700);document.getElementById('agendaDatePicker')?.addEventListener('change',render);document.getElementById('prevDay')?.addEventListener('click',()=>setTimeout(render,150));document.getElementById('nextDay')?.addEventListener('click',()=>setTimeout(render,150));document.getElementById('todayBtn')?.addEventListener('click',()=>setTimeout(render,150));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,250),{once:true});else setTimeout(boot,250);
})();