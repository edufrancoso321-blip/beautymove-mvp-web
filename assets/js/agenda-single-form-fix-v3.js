/* BeautyMove agenda service selector v3 - duration and occupancy fix */
(function(){
  if(document.body?.dataset?.role!=='salao')return;
  const SERVICES_KEY='beautymove.mvp.services',PROFESSIONALS_KEY='beautymove.mvp.professionals',STATE_KEY='beautymove.mvp.state',SOS_CONTEXT_KEY='beautymove.mvp.sosContext';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateKey=d=>{d=d||new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const state=()=>({appointments:[],opportunities:[],transactions:[],...read(STATE_KEY,{})});
  const pros=()=>{const s=read(PROFESSIONALS_KEY,null);return Array.isArray(s)&&s.length?s:[{name:'Ana',specialty:'Cabelos'},{name:'Bruna',specialty:'Cabelos'},{name:'Paula',specialty:'Mãos e Pés'},{name:'Carla',specialty:'Estética'}]};
  const prof=n=>pros().find(p=>p.name===n)||{};

  const DEFAULT_DURATIONS={
    'svc-corte-feminino':60,'svc-corte-masculino':60,'svc-escova':30,'svc-hidratacao':60,'svc-coloracao':120,'svc-luzes':180,
    'svc-maos':60,'svc-pes':60,'svc-maos-pes':90,'svc-esmaltacao':45,
    'svc-limpeza-pele':60,'svc-design-facial':45,'svc-virilha':45,'svc-axila':30,'svc-buco':20,'svc-pernas':60,
    'svc-design-sobrancelhas':30,'svc-henna':45
  };
  const DEFAULT_DURATIONS_BY_NAME={'Corte feminino':60,'Corte masculino':60,'Escova':30,'Hidratação':60,'Coloração':120,'Luzes':180,'Mãos':60,'Pés':60,'Mãos e pés':90,'Esmaltação':45,'Limpeza de pele':60,'Design facial':45,'Virilha':45,'Axila':30,'Buço':20,'Pernas':60,'Design de sobrancelhas':30,'Design com henna':45};

  function normalizeServices(){
    const saved=read(SERVICES_KEY,[]);
    if(!Array.isArray(saved))return [];
    let changed=false;
    const normalized=saved.map(s=>{
      if(s.durationMin)return s;
      changed=true;
      return {...s,durationMin:Number(DEFAULT_DURATIONS[s.id]||DEFAULT_DURATIONS_BY_NAME[s.name]||60)};
    });
    if(changed)write(SERVICES_KEY,normalized);
    return normalized;
  }
  const services=n=>{const s=normalizeServices(),sp=prof(n).specialty;return s.filter(x=>x.status!=='inativo'&&(!sp||x.category===sp))};
  const fmtDuration=min=>{min=Math.max(0,Number(min||0));const h=Math.floor(min/60),m=min%60;return h?`${h}h${m?` ${m}min`:''}`:`${m}min`};
  const toMinutes=t=>{const [h,m]=String(t).split(':').map(Number);return h*60+m};
  const fromMinutes=min=>`${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;
  const durationOfServices=list=>Math.max(30,Math.ceil(list.reduce((t,s)=>t+Number(s.durationMin||DEFAULT_DURATIONS[s.id]||DEFAULT_DURATIONS_BY_NAME[s.name]||60),0)/30)*30);
  const appointmentDuration=a=>Number(a.durationMin)||durationOfServices(Array.isArray(a.services)?a.services:[]);
  const appointmentEnd=a=>fromMinutes(toMinutes(a.time)+appointmentDuration(a));
  const appointmentAt=(date,time,name)=>state().appointments.find(a=>a.date===date&&a.professional===name&&a.status!=='cancelado'&&toMinutes(time)>=toMinutes(a.time)&&toMinutes(time)<toMinutes(a.time)+appointmentDuration(a));
  const overlaps=(date,name,start,duration,ignoreId)=>{
    const s=toMinutes(start),e=s+duration;
    return state().appointments.some(a=>a.date===date&&a.professional===name&&a.status!=='cancelado'&&a.id!==ignoreId&&s<toMinutes(a.time)+appointmentDuration(a)&&e>toMinutes(a.time));
  };

  let activeDate=new Date(),installed=false;
  const css=document.createElement('style');css.textContent=`
  #appointmentDetailModal .modal-card{overflow:visible}
  .bm3-form{display:grid;gap:16px}.bm3-actions{display:flex;gap:10px;justify-content:flex-end;align-items:center;flex-wrap:wrap}
  .bm3-actions .bm3-sos{background:#fff;color:#7438ff;border:1px solid #7438ff;font-weight:700}.bm3-actions .bm3-sos:hover{background:#f7f3ff}
  .bm3-picker{position:relative}.bm3-trigger{width:100%;min-height:44px;border:1px solid #d9d3e7;border-radius:8px;background:#fff;padding:11px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;font:inherit;color:#222;cursor:pointer;text-align:left}.bm3-trigger:focus{outline:2px solid #7438ff;outline-offset:1px;border-color:#7438ff}
  .bm3-menu{position:absolute;z-index:100;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid #ddd6eb;border-radius:10px;box-shadow:0 12px 28px rgba(30,20,50,.16);overflow:hidden}
  .bm3-list{max-height:210px;overflow:auto;padding:7px}.bm3-option{display:grid;grid-template-columns:20px 1fr auto;align-items:center;gap:8px;padding:10px 9px;border-radius:7px;cursor:pointer}.bm3-option:hover{background:#f7f3ff}.bm3-option input{accent-color:#7438ff;width:16px;height:16px}.bm3-option strong{white-space:nowrap}.bm3-option small{color:#777;white-space:nowrap}
  .bm3-footer{display:flex;justify-content:flex-end;gap:8px;padding:10px;border-top:1px solid #eee7f5;background:#fff}.bm3-selected{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.bm3-chip{display:inline-flex;padding:5px 8px;border-radius:999px;background:#f1eaff;color:#5f2bc7;font-size:12px;font-weight:700}.bm3-empty{padding:12px;color:#777}
  .bm3-duration{margin-top:8px;color:#5f2bc7;font-size:13px;font-weight:700}.bm3-duration-box{border:1px solid #eee7f5;border-radius:10px;padding:11px 13px;background:#faf8ff}.bm3-occupied{background:#f1eaff!important;border-left:3px solid #7438ff!important}.bm3-occupied td{cursor:not-allowed}.agenda-grid td.bm3-occupied{cursor:not-allowed}.agenda-grid td.bm3-occupied.continuation{opacity:.72}.agenda-grid td.bm3-occupied.continuation span{display:block;color:#6f35e8;font-size:12px;font-weight:600}.agenda-grid td.bm3-occupied .bm3-end{display:block;color:#6f35e8;font-size:12px;font-weight:700;margin-top:3px}
  `;document.head.appendChild(css);

  const open=()=>{const m=document.querySelector('#appointmentDetailModal');if(m){m.classList.add('is-open');m.setAttribute('aria-hidden','false')}};
  const close=()=>{const m=document.querySelector('#appointmentDetailModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true')}};

  function picker(el,name){
    const list=services(name);let ids=[],draft=[];let ok=false;
    const picked=a=>list.filter(s=>a.includes(s.id));const total=a=>picked(a).reduce((t,s)=>t+Number(s.value||0),0);const duration=a=>durationOfServices(picked(a));
    el.innerHTML=`<button type="button" class="bm3-trigger" aria-expanded="false"><span>Selecione os serviços</span><span>⌄</span></button><div class="bm3-selected"></div><div class="bm3-duration" id="bm3PickerDuration">Duração estimada: 0min</div><div class="bm3-menu" hidden><div class="bm3-list">${list.length?list.map(s=>`<label class="bm3-option"><input type="checkbox" value="${esc(s.id)}"><span>${esc(s.name)}</span><strong>${money(s.value)} <small>· ${fmtDuration(s.durationMin)}</small></strong></label>`).join(''):'<div class="bm3-empty">Nenhum serviço cadastrado para esta especialidade.</div>'}</div><div class="bm3-footer"><button type="button" class="secondary compact" data-bm3-cancel>Cancelar</button><button type="button" class="primary compact" data-bm3-ok>Confirmar serviços</button></div></div>`;
    const trigger=el.querySelector('.bm3-trigger'),menu=el.querySelector('.bm3-menu'),label=trigger.firstElementChild,chips=el.querySelector('.bm3-selected'),durationLabel=el.querySelector('#bm3PickerDuration'),value=document.querySelector('#singleFormServiceValue');
    const paint=a=>{const p=picked(a);label.textContent=p.length===0?'Selecione os serviços':p.length===1?p[0].name:`${p.length} serviços selecionados`;chips.innerHTML=p.map(s=>`<span class="bm3-chip">${esc(s.name)}</span>`).join('');if(value)value.value=total(a).toFixed(2).replace('.',',');if(durationLabel)durationLabel.textContent=`Duração estimada: ${fmtDuration(p.length?duration(a):0)}`};
    const sync=()=>menu.querySelectorAll('input').forEach(i=>i.checked=draft.includes(i.value));
    const hide=()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false')};
    trigger.onclick=()=>{if(menu.hidden){draft=[...ids];sync();menu.hidden=false;trigger.setAttribute('aria-expanded','true')}else hide()};
    menu.querySelectorAll('input').forEach(i=>i.onchange=()=>{draft=i.checked?[...new Set([...draft,i.value])]:draft.filter(x=>x!==i.value);paint(draft)});
    menu.querySelector('[data-bm3-cancel]').onclick=()=>{draft=[...ids];paint(ids);sync();hide()};
    menu.querySelector('[data-bm3-ok]').onclick=()=>{ids=[...draft];ok=true;paint(ids);hide()};
    el._selection=()=>({confirmed:ok,ids:[...ids],services:picked(ids),total:total(ids),durationMin:duration(ids)});
    el._current=()=>({confirmed:ok,ids:[...draft],services:picked(draft),total:total(draft),durationMin:duration(draft)});
    paint(ids);
  }

  function save(client,name,time,sel){
    const s=state(),duration=sel.durationMin||durationOfServices(sel.services);
    if(overlaps(dateKey(activeDate),name,time,duration))return false;
    const snap=sel.services.map(x=>({id:x.id,name:x.name,value:Number(x.value||0),category:x.category,durationMin:Number(x.durationMin||DEFAULT_DURATIONS[x.id]||DEFAULT_DURATIONS_BY_NAME[x.name]||60)}));
    s.appointments.push({id:`apt-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,date:dateKey(activeDate),time,professional:name,client:client.trim(),service:snap.map(x=>x.name).join(' + '),serviceId:snap[0]?.id||null,serviceIds:snap.map(x=>x.id),services:snap,value:Number(sel.total||0),durationMin:duration,endTime:fromMinutes(toMinutes(time)+duration),status:'agendado',source:'salao'});write(STATE_KEY,s);return true;
  }

  function form(time,name){
    const b=document.querySelector('#appointmentDetailBody');if(!b)return;const d=activeDate,sp=prof(name).specialty||'Serviços';
    b.innerHTML=`<div class="operation-detail bm3-form"><div class="operation-summary"><span class="eyebrow">NOVO AGENDAMENTO</span><h2>Agendar cliente</h2><p>${esc(name)} · ${esc(d.toLocaleDateString('pt-BR'))} · ${esc(time)}</p><span class="status">Horário livre · ${esc(sp)}</span></div><div class="operation-info"><div><small>Profissional</small><strong>${esc(name)}</strong></div><div><small>Data</small><strong>${esc(d.toLocaleDateString('pt-BR'))}</strong></div><div><small>Horário inicial</small><strong>${esc(time)}</strong></div></div><div class="form-grid compact-form"><div class="field full"><label for="singleFormClient">Cliente</label><input id="singleFormClient" type="text" placeholder="Nome da cliente" autocomplete="off"></div><div class="field full"><label>Serviços</label><div class="bm3-picker" id="bm3Picker"></div></div><div class="field"><label for="singleFormServiceValue">Valor total dos serviços (R$)</label><input id="singleFormServiceValue" readonly value="0,00"></div><div class="field"><label>Horário estimado de término</label><div class="bm3-duration-box" id="bm3EndTime">Selecione os serviços</div></div></div><div class="bm3-actions"><button class="secondary compact" type="button" data-bm3-close>Cancelar</button><button class="primary compact" type="button" data-bm3-save>Adicionar à agenda</button><button class="bm3-sos compact" type="button" data-bm3-sos>S.O.S. Profissionais</button></div></div>`;
    const p=b.querySelector('#bm3Picker');picker(p,name);b.querySelector('[data-bm3-close]').onclick=close;
    const updateEnd=()=>{const sel=p._selection();b.querySelector('#bm3EndTime').textContent=sel.services.length?`${time} até ${fromMinutes(toMinutes(time)+sel.durationMin)} · ${fmtDuration(sel.durationMin)}`:'Selecione os serviços'};
    const observer=new MutationObserver(updateEnd);observer.observe(p,{childList:true,subtree:true});updateEnd();
    b.querySelector('[data-bm3-save]').onclick=()=>{const client=b.querySelector('#singleFormClient').value.trim(),sel=p._selection();if(!client){b.querySelector('#singleFormClient').focus();return}if(!sel.confirmed||!sel.services.length){p.querySelector('.bm3-trigger').focus();return}if(!save(client,name,time,sel)){alert('Este horário já está ocupado por outro atendimento. Escolha outro horário.');return}observer.disconnect();close();location.reload()};
    b.querySelector('[data-bm3-sos]').onclick=()=>{const c=p._current(),sel=c.services.length?c:p._selection();write(SOS_CONTEXT_KEY,{date:dateKey(d),time,professional:name,client:b.querySelector('#singleFormClient').value.trim(),serviceIds:sel.ids,services:sel.services.map(s=>({id:s.id,name:s.name,value:Number(s.value||0),category:s.category,durationMin:Number(s.durationMin||60)})),service:sel.services.map(s=>s.name).join(' + '),value:sel.total,durationMin:sel.durationMin});location.href='sos.html?origem=agenda&horario=selecionado'};
    open();setTimeout(()=>b.querySelector('#singleFormClient')?.focus(),40)
  }

  function renderOccupancy(){
    const body=document.querySelector('#agendaBody');if(!body)return;
    const current=dateKey(activeDate),appointments=state().appointments.filter(a=>a.date===current&&a.status!=='cancelado');
    body.querySelectorAll('td[data-slot]').forEach(c=>{c.classList.remove('bm3-occupied','continuation');c.removeAttribute('title');c.innerHTML='Livre'});
    body.querySelectorAll('td[data-slot]').forEach(c=>{
      const [t,...r]=String(c.dataset.slot).split('-'),name=r.join('-'),a=appointmentAt(current,t,name);if(!a)return;
      c.classList.add('bm3-occupied');c.title=`${a.client} · ${a.service||''} · ${a.time} até ${appointmentEnd(a)}`;
      if(t===a.time){c.innerHTML=`<strong>${esc(a.client)}</strong><span>${esc(a.service||'')}</span><span class="bm3-end">${esc(a.time)} até ${esc(appointmentEnd(a))}</span>`}
      else{c.classList.add('continuation');c.innerHTML='<span>Ocupado</span>'}
    });
  }

  function install(){
    if(installed)return;installed=true;
    normalizeServices();
    const agenda=document.querySelector('#agenda');if(!agenda)return;
    agenda.addEventListener('click',e=>{
      const c=e.target.closest('td[data-slot]');if(!c)return;
      const [t,...r]=String(c.dataset.slot).split('-'),n=r.join('-'),a=appointmentAt(dateKey(activeDate),t,n);
      if(a){
        if(t!==a.time){e.preventDefault();e.stopImmediatePropagation();return;}
        return;
      }
      e.preventDefault();e.stopImmediatePropagation();form(t,n);
    },true);
    const body=document.querySelector('#agendaBody');
    if(body){let painting=false;const observer=new MutationObserver(()=>{if(painting)return;painting=true;setTimeout(()=>{renderOccupancy();painting=false},0)});observer.observe(body,{childList:true,subtree:true});}
    setTimeout(renderOccupancy,30);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
