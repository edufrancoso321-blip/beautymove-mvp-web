/* BeautyMove — Correção S.O.S.: favoritos + múltiplos serviços */
(function(){
'use strict';
const STATE_KEY='beautymove.mvp.state';
const SERVICES_KEY='beautymove.mvp.services';
const FAVORITES_KEY='beautymove.mvp.favorite-professionals';
const DEFAULT_SERVICES=[
{id:'cab-corte-fem',specialty:'Cabelos',name:'Corte feminino',clientPrice:80,professionalOffer:40,duration:60,active:true},
{id:'cab-escova',specialty:'Cabelos',name:'Escova',clientPrice:60,professionalOffer:30,duration:30,active:true},
{id:'cab-coloracao',specialty:'Cabelos',name:'Coloração',clientPrice:150,professionalOffer:75,duration:120,active:true},
{id:'cab-luzes',specialty:'Cabelos',name:'Luzes',clientPrice:250,professionalOffer:125,duration:180,active:true},
{id:'mp-manicure',specialty:'Mãos e Pés',name:'Manicure',clientPrice:55,professionalOffer:28,duration:60,active:true},
{id:'mp-pedicure',specialty:'Mãos e Pés',name:'Pedicure',clientPrice:65,professionalOffer:33,duration:60,active:true},
{id:'est-limpeza',specialty:'Estética',name:'Limpeza de pele',clientPrice:120,professionalOffer:60,duration:75,active:true},
{id:'sob-design',specialty:'Sobrancelhas',name:'Design de sobrancelhas',clientPrice:60,professionalOffer:30,duration:45,active:true},
{id:'dep-facial',specialty:'Depilação',name:'Depilação facial',clientPrice:45,professionalOffer:23,duration:30,active:true}];
const DEFAULT_FAVORITES=[
{name:'Juliana Costa',specialty:'Cabelos',available:true},
{name:'Lucas Ferreira',specialty:'Cabelos',available:true},
{name:'Bianca Rodrigues',specialty:'Cabelos',available:true}
];
const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback;}catch(_){return fallback;}};
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const date=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
const services=()=>{const v=read(SERVICES_KEY,null);if(Array.isArray(v)&&v.length)return v;write(SERVICES_KEY,DEFAULT_SERVICES);return DEFAULT_SERVICES.slice();};
const favorites=()=>{const v=read(FAVORITES_KEY,null);if(Array.isArray(v)&&v.length)return v;write(FAVORITES_KEY,DEFAULT_FAVORITES);return DEFAULT_FAVORITES.slice();};
function css(){if(document.getElementById('bmSosCorrectionCss'))return;const s=document.createElement('style');s.id='bmSosCorrectionCss';s.textContent=`
#sosProfessional{display:none!important}
.bm-sos-favorites{display:flex;flex-direction:column;gap:7px;margin-top:-2px}
.bm-sos-favorites-select{width:100%;height:44px;border:1px solid #d9d3e2;border-radius:9px;background:#fff;padding:0 12px;font-weight:700;color:#17131f}
.bm-sos-favorites-help{font-size:10px;line-height:1.35;color:#716c78;background:#f7f2ff;border-radius:7px;padding:7px 9px}
.bm-sos-search-other{width:max-content;border:0;background:transparent;color:#6633d7;font-weight:800;font-size:11px;padding:0;cursor:pointer}
.bm-sos-service-wrap{position:relative}
.bm-sos-service-trigger{width:100%;height:44px;border:1px solid #d9d3e2;border-radius:9px;background:#fff;padding:0 12px;display:flex;align-items:center;justify-content:space-between;text-align:left;font-weight:700;color:#17131f;cursor:pointer}
.bm-sos-service-menu{display:none;position:absolute;left:0;right:0;top:49px;z-index:80;background:#fff;border:1px solid #d9d3e2;border-radius:10px;padding:7px;box-shadow:0 15px 35px rgba(20,10,30,.16);max-height:240px;overflow:auto}
.bm-sos-service-menu.open{display:block}
.bm-sos-service-option{display:flex;gap:9px;padding:9px;border-radius:8px;cursor:pointer}
.bm-sos-service-option:hover{background:#faf8ff}
.bm-sos-service-option input{margin-top:2px;width:16px;height:16px;accent-color:#7138ff}
.bm-sos-service-option span{display:flex;flex-direction:column;gap:2px;font-size:12px}
.bm-sos-service-option small{font-size:10px;color:#716c78}
.bm-sos-service-footer{display:flex;justify-content:space-between;align-items:center;padding:8px 4px 2px;border-top:1px solid #eee8f5;margin-top:5px}
.bm-sos-service-count{font-size:10px;color:#716c78}
.bm-sos-service-done{border:0;border-radius:7px;background:#7138ff;color:#fff;padding:7px 10px;font-weight:800;font-size:10px;cursor:pointer}
.bm-sos-service-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
.bm-sos-service-chip{padding:5px 7px;background:#f1eaff;border:1px solid #e1d4f5;border-radius:7px;color:#573487;font-size:10px;font-weight:700}
`;document.head.appendChild(s);}
function setupFavorites(){
 const old=document.getElementById('sosProfessional');if(!old)return;
 const field=old.closest('.field');if(!field)return;
 let wrap=document.getElementById('bmSosFavorites');
 if(!wrap){wrap=document.createElement('div');wrap.id='bmSosFavorites';wrap.className='field bm-sos-favorites';field.after(wrap);}
 field.style.display='none';
 const list=favorites().filter(f=>!f.specialty||f.specialty===(document.getElementById('sosSpecialty')?.value||''));
 wrap.innerHTML=`<label for="bmSosFavoriteSelect">Preferência de profissional</label><select id="bmSosFavoriteSelect" class="bm-sos-favorites-select"><option value="">⭐ Favoritos do salão</option>${list.map(f=>`<option value="${esc(f.name)}" ${f.available===false?'disabled':''}>${esc(f.name)}${f.available===false?' — indisponível':''}</option>`).join('')}</select><button type="button" id="bmSosSearchOther" class="bm-sos-search-other">Buscar outros profissionais</button><div class="bm-sos-favorites-help">Primeiro tentamos seus favoritos compatíveis. Se nenhum estiver disponível, a busca da plataforma entra em ação.</div>`;
 const select=wrap.querySelector('#bmSosFavoriteSelect');
 select.addEventListener('change',()=>{old.value=select.value;});
 wrap.querySelector('#bmSosSearchOther').addEventListener('click',()=>{select.value='';old.value='';const notice=document.getElementById('agendaNotice');if(notice){notice.textContent='Busca ampliada: a plataforma procurará outros profissionais disponíveis.';notice.hidden=false;setTimeout(()=>notice.hidden=true,3500);}});
 const specialty=document.getElementById('sosSpecialty');specialty?.addEventListener('change',setupFavorites,{once:true});
}
function setupServices(){
 const old=document.getElementById('sosService'),form=document.getElementById('sosForm'),specialty=document.getElementById('sosSpecialty');if(!old||!form||!specialty)return;
 if(document.getElementById('bmSosServiceWrap'))return;
 const wrap=old.closest('.field');if(!wrap)return;
 const trigger=document.createElement('button');trigger.type='button';trigger.id='bmSosServiceTrigger';trigger.className='bm-sos-service-trigger';trigger.innerHTML='<span>Selecionar serviços</span><span>▾</span>';
 const menu=document.createElement('div');menu.id='bmSosServiceMenu';menu.className='bm-sos-service-menu';
 const hidden=document.createElement('input');hidden.type='hidden';hidden.id='bmSosServiceValue';hidden.name='service';hidden.required=true;
 const wrap2=document.createElement('div');wrap2.id='bmSosServiceWrap';wrap2.className='bm-sos-service-wrap';wrap2.append(trigger,menu,hidden);
 old.replaceWith(wrap2);
 let selected=[];
 function update(){
  const label=trigger.querySelector('span');const total=selected.reduce((n,s)=>n+Number(s.clientPrice||0),0),offer=selected.reduce((n,s)=>n+Number(s.professionalOffer||0),0),duration=selected.reduce((n,s)=>n+Number(s.duration||0),0);
  hidden.value=selected.map(s=>s.name).join(' + ');label.textContent=selected.length?`${selected.length} serviço${selected.length>1?'s':''} selecionado${selected.length>1?'s':''}`:'Selecionar serviços';
  menu.querySelector('.bm-sos-service-count').textContent=selected.length?`${money(total)} · ${duration} min`:'Selecione um ou mais serviços';
  let chips=wrap.querySelector('.bm-sos-service-chips');if(!chips){chips=document.createElement('div');chips.className='bm-sos-service-chips';wrap.appendChild(chips);}chips.innerHTML=selected.map(s=>`<span class="bm-sos-service-chip">${esc(s.name)}</span>`).join('');
  form.dataset.selectedSosServices=JSON.stringify(selected);
  form.dataset.sosClientPrice=String(total);form.dataset.sosProfessionalOffer=String(offer);form.dataset.sosDuration=String(duration);
 }
 function populate(){
  selected=[];const list=services().filter(s=>s.active!==false&&s.specialty===specialty.value);
  menu.innerHTML=(list.length?list.map((s,i)=>`<label class="bm-sos-service-option"><input type="checkbox" data-i="${i}"><span><strong>${esc(s.name)}</strong><small>${money(s.clientPrice)} · oferta ${money(s.professionalOffer)} · ${s.duration} min</small></span></label>`).join(''):'<div style="padding:10px;font-size:11px">Nenhum serviço cadastrado para esta especialidade.</div>')+`<div class="bm-sos-service-footer"><span class="bm-sos-service-count">Selecione um ou mais serviços</span><button type="button" class="bm-sos-service-done">Concluir</button></div>`;
  menu.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{const item=list[Number(input.dataset.i)];if(!item)return;if(input.checked)selected.push(item);else selected=selected.filter(s=>s.id!==item.id);update();}));
  menu.querySelector('.bm-sos-service-done')?.addEventListener('click',()=>menu.classList.remove('open'));
  update();
 }
 trigger.addEventListener('click',e=>{e.stopPropagation();menu.classList.toggle('open');});
 document.addEventListener('click',e=>{if(!wrap2.contains(e.target))menu.classList.remove('open');});
 specialty.addEventListener('change',populate);populate();
}
function submitOverride(){
 const form=document.getElementById('sosForm');if(!form||form.dataset.bmOverride==='1')return;form.dataset.bmOverride='1';
 form.addEventListener('submit',function(e){
  e.preventDefault();e.stopImmediatePropagation();
  const client=document.getElementById('sosClient')?.value.trim(),service=document.getElementById('bmSosServiceValue')?.value.trim(),specialty=document.getElementById('sosSpecialty')?.value||'',time=document.getElementById('sosTime')?.value||'08:00',professional=document.getElementById('sosProfessional')?.value.trim()||'';
  if(!client){document.getElementById('sosClient')?.focus();return;}
  if(!service){const b=document.getElementById('bmSosServiceTrigger');b?.focus();alert('Selecione pelo menos um serviço.');return;}
  const chosen=JSON.parse(form.dataset.selectedSosServices||'[]');
  const state=read(STATE_KEY,{appointments:[],opportunities:[],transactions:[]});state.appointments=Array.isArray(state.appointments)?state.appointments:[];state.opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
  const id=`sos-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const opportunity={id,date:date(),time,client,service,specialty,professional:professional||'',source:'sos',status:'searching',radius:document.getElementById('sosRadius')?.value||'5 km',services:chosen,clientPriceSnapshot:Number(form.dataset.sosClientPrice||0),professionalOfferSnapshot:Number(form.dataset.sosProfessionalOffer||0),durationSnapshot:Number(form.dataset.sosDuration||0),createdAt:new Date().toISOString(),searchMode:professional?'favorite':'platform'};
  state.opportunities.push(opportunity);write(STATE_KEY,state);
  document.getElementById('sosModal')?.classList.remove('is-open');document.getElementById('sosModal')?.setAttribute('aria-hidden','true');
  window.dispatchEvent(new CustomEvent('beautymove:sos-created',{detail:opportunity}));
 },true);
}
function boot(){if(document.body?.dataset.role!=='salao')return;css();setupFavorites();setupServices();submitOverride();setTimeout(()=>{setupFavorites();setupServices();},500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
