/* BeautyMove agenda service selector v3 - loaded by salao.html */
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
  const services=n=>{const s=read(SERVICES_KEY,[]),sp=prof(n).specialty;return (Array.isArray(s)?s:[]).filter(x=>x.status!=='inativo'&&(!sp||x.category===sp))};
  let activeDate=new Date(),installed=false;
  const css=document.createElement('style');css.textContent=`
  #appointmentDetailModal .modal-card{overflow:visible}
  .bm3-form{display:grid;gap:16px}.bm3-actions{display:flex;gap:10px;justify-content:flex-end;align-items:center;flex-wrap:wrap}
  .bm3-actions .bm3-sos{background:#fff;color:#7438ff;border:1px solid #7438ff;font-weight:700}.bm3-actions .bm3-sos:hover{background:#f7f3ff}
  .bm3-picker{position:relative}.bm3-trigger{width:100%;min-height:44px;border:1px solid #d9d3e7;border-radius:8px;background:#fff;padding:11px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;font:inherit;color:#222;cursor:pointer;text-align:left}.bm3-trigger:focus{outline:2px solid #7438ff;outline-offset:1px;border-color:#7438ff}
  .bm3-menu{position:absolute;z-index:100;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid #ddd6eb;border-radius:10px;box-shadow:0 12px 28px rgba(30,20,50,.16);overflow:hidden}
  .bm3-list{max-height:210px;overflow:auto;padding:7px}.bm3-option{display:grid;grid-template-columns:20px 1fr auto;align-items:center;gap:8px;padding:10px 9px;border-radius:7px;cursor:pointer}.bm3-option:hover{background:#f7f3ff}.bm3-option input{accent-color:#7438ff;width:16px;height:16px}.bm3-option strong{white-space:nowrap}
  .bm3-footer{display:flex;justify-content:flex-end;gap:8px;padding:10px;border-top:1px solid #eee7f5;background:#fff}.bm3-selected{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.bm3-chip{display:inline-flex;padding:5px 8px;border-radius:999px;background:#f1eaff;color:#5f2bc7;font-size:12px;font-weight:700}.bm3-empty{padding:12px;color:#777}
  `;document.head.appendChild(css);
  const open=()=>{const m=document.querySelector('#appointmentDetailModal');if(m){m.classList.add('is-open');m.setAttribute('aria-hidden','false')}};
  const close=()=>{const m=document.querySelector('#appointmentDetailModal');if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true')}};
  function picker(el,name){
    const list=services(name);let ids=[],draft=[];let ok=false;
    const picked=a=>list.filter(s=>a.includes(s.id));const total=a=>picked(a).reduce((t,s)=>t+Number(s.value||0),0);
    el.innerHTML=`<button type="button" class="bm3-trigger" aria-expanded="false"><span>Selecione os serviços</span><span>⌄</span></button><div class="bm3-selected"></div><div class="bm3-menu" hidden><div class="bm3-list">${list.length?list.map(s=>`<label class="bm3-option"><input type="checkbox" value="${esc(s.id)}"><span>${esc(s.name)}</span><strong>${money(s.value)}</strong></label>`).join(''):'<div class="bm3-empty">Nenhum serviço cadastrado para esta especialidade.</div>'}</div><div class="bm3-footer"><button type="button" class="secondary compact" data-bm3-cancel>Cancelar</button><button type="button" class="primary compact" data-bm3-ok>Confirmar serviços</button></div></div>`;
    const trigger=el.querySelector('.bm3-trigger'),menu=el.querySelector('.bm3-menu'),label=trigger.firstElementChild,chips=el.querySelector('.bm3-selected'),value=document.querySelector('#singleFormServiceValue');
    const paint=a=>{const p=picked(a);label.textContent=p.length===0?'Selecione os serviços':p.length===1?p[0].name:`${p.length} serviços selecionados`;chips.innerHTML=p.map(s=>`<span class="bm3-chip">${esc(s.name)}</span>`).join('');if(value)value.value=total(a).toFixed(2).replace('.',',')};
    const sync=()=>menu.querySelectorAll('input').forEach(i=>i.checked=draft.includes(i.value));
    const hide=()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false')};
    trigger.onclick=()=>{if(menu.hidden){draft=[...ids];sync();menu.hidden=false;trigger.setAttribute('aria-expanded','true')}else hide()};
    menu.querySelectorAll('input').forEach(i=>i.onchange=()=>{draft=i.checked?[...new Set([...draft,i.value])]:draft.filter(x=>x!==i.value);paint(draft)});
    menu.querySelector('[data-bm3-cancel]').onclick=()=>{draft=[...ids];paint(ids);sync();hide()};
    menu.querySelector('[data-bm3-ok]').onclick=()=>{ids=[...draft];ok=true;paint(ids);hide()};
    el._selection=()=>({confirmed:ok,ids:[...ids],services:picked(ids),total:total(ids)});
    el._current=()=>({confirmed:ok,ids:[...draft],services:picked(draft),total:total(draft)});
    paint(ids);
  }
  function save(client,name,time,sel){const s=state(),snap=sel.services.map(x=>({id:x.id,name:x.name,value:Number(x.value||0),category:x.category}));s.appointments.push({id:`apt-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,date:dateKey(activeDate),time,professional:name,client:client.trim(),service:snap.map(x=>x.name).join(' + '),serviceId:snap[0]?.id||null,serviceIds:snap.map(x=>x.id),services:snap,value:Number(sel.total||0),status:'agendado',source:'salao'});write(STATE_KEY,s)}
  function form(time,name){const b=document.querySelector('#appointmentDetailBody');if(!b)return;const d=activeDate,sp=prof(name).specialty||'Serviços';b.innerHTML=`<div class="operation-detail bm3-form"><div class="operation-summary"><span class="eyebrow">NOVO AGENDAMENTO</span><h2>Agendar cliente</h2><p>${esc(name)} · ${esc(d.toLocaleDateString('pt-BR'))} · ${esc(time)}</p><span class="status">Horário livre · ${esc(sp)}</span></div><div class="operation-info"><div><small>Profissional</small><strong>${esc(name)}</strong></div><div><small>Data</small><strong>${esc(d.toLocaleDateString('pt-BR'))}</strong></div><div><small>Horário</small><strong>${esc(time)}</strong></div></div><div class="form-grid compact-form"><div class="field full"><label for="singleFormClient">Cliente</label><input id="singleFormClient" type="text" placeholder="Nome da cliente" autocomplete="off"></div><div class="field full"><label>Serviços</label><div class="bm3-picker" id="bm3Picker"></div></div><div class="field full"><label for="singleFormServiceValue">Valor total dos serviços (R$)</label><input id="singleFormServiceValue" readonly value="0,00"></div></div><div class="bm3-actions"><button class="secondary compact" type="button" data-bm3-close>Cancelar</button><button class="primary compact" type="button" data-bm3-save>Adicionar à agenda</button><button class="bm3-sos compact" type="button" data-bm3-sos>S.O.S. Profissionais</button></div></div>`;
    const p=b.querySelector('#bm3Picker');picker(p,name);b.querySelector('[data-bm3-close]').onclick=close;
    b.querySelector('[data-bm3-save]').onclick=()=>{const client=b.querySelector('#singleFormClient').value.trim(),sel=p._selection();if(!client){b.querySelector('#singleFormClient').focus();return}if(!sel.confirmed||!sel.services.length){p.querySelector('.bm3-trigger').focus();return}save(client,name,time,sel);close();location.reload()};
    b.querySelector('[data-bm3-sos]').onclick=()=>{const c=p._current(),sel=c.services.length?c:p._selection();write(SOS_CONTEXT_KEY,{date:dateKey(d),time,professional:name,client:b.querySelector('#singleFormClient').value.trim(),serviceIds:sel.ids,services:sel.services.map(s=>({id:s.id,name:s.name,value:Number(s.value||0),category:s.category})),service:sel.services.map(s=>s.name).join(' + '),value:sel.total});location.href='sos.html?origem=agenda&horario=selecionado'};
    open();setTimeout(()=>b.querySelector('#singleFormClient')?.focus(),40)
  }
  const occupied=(t,n)=>state().appointments.some(a=>a.date===dateKey(activeDate)&&a.time===t&&a.professional===n&&a.status!=='cancelado');
  const install=()=>{if(installed)return;installed=true;const agenda=document.querySelector('#agenda');if(!agenda)return;agenda.addEventListener('click',e=>{const c=e.target.closest('td[data-slot]');if(!c)return;const [t,...r]=String(c.dataset.slot).split('-'),n=r.join('-');if(occupied(t,n))return;e.preventDefault();e.stopImmediatePropagation();form(t,n)},true)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
