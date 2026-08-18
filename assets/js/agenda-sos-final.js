/* BeautyMove — S.O.S. selector stable + multi-service */
(function(){
'use strict';
const STATE_KEY='beautymove.mvp.state',SERVICES_KEY='beautymove.mvp.services';
const DEFAULT_SERVICES=[
{id:'cab-corte-fem',specialty:'Cabelos',name:'Corte feminino',clientPrice:80,professionalOffer:40,duration:60,active:true},
{id:'cab-escova',specialty:'Cabelos',name:'Escova',clientPrice:60,professionalOffer:30,duration:30,active:true},
{id:'cab-coloracao',specialty:'Cabelos',name:'Coloração',clientPrice:150,professionalOffer:75,duration:120,active:true},
{id:'cab-luzes',specialty:'Cabelos',name:'Luzes',clientPrice:250,professionalOffer:125,duration:180,active:true},
{id:'cab-corte-masc',specialty:'Cabelos',name:'Corte masculino',clientPrice:50,professionalOffer:25,duration:45,active:true},
{id:'mp-manicure',specialty:'Mãos e Pés',name:'Manicure',clientPrice:55,professionalOffer:28,duration:60,active:true},
{id:'mp-pedicure',specialty:'Mãos e Pés',name:'Pedicure',clientPrice:65,professionalOffer:33,duration:60,active:true},
{id:'est-limpeza',specialty:'Estética',name:'Limpeza de pele',clientPrice:120,professionalOffer:60,duration:75,active:true},
{id:'sob-design',specialty:'Sobrancelhas',name:'Design de sobrancelhas',clientPrice:60,professionalOffer:30,duration:45,active:true},
{id:'dep-facial',specialty:'Depilação',name:'Depilação facial',clientPrice:45,professionalOffer:23,duration:30,active:true},
{id:'dep-axilas',specialty:'Depilação',name:'Depilação de axilas',clientPrice:35,professionalOffer:18,duration:20,active:true},
{id:'dep-pernas',specialty:'Depilação',name:'Depilação de pernas',clientPrice:80,professionalOffer:40,duration:45,active:true}];
const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[]};}catch(_){return{appointments:[],opportunities:[]};}};
const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
const date=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function services(){try{const v=JSON.parse(localStorage.getItem(SERVICES_KEY)||'null');if(Array.isArray(v)&&v.length)return v;}catch(_){}localStorage.setItem(SERVICES_KEY,JSON.stringify(DEFAULT_SERVICES));return DEFAULT_SERVICES.slice();}
function loadColumnIdentity(){if(document.getElementById('beautymoveSosColumnIdentity'))return;const l=document.createElement('link');l.id='beautymoveSosColumnIdentity';l.rel='stylesheet';l.href='assets/css/agenda-sos-column-identity.css?v=20260818-3';document.head.appendChild(l);}
function accepted(){const s=read(),appointments=Array.isArray(s.appointments)?s.appointments:[],opportunities=Array.isArray(s.opportunities)?s.opportunities:[];return opportunities.filter(o=>o&&o.date===date()&&o.source==='sos'&&o.status==='resolved'&&o.acceptedBy&&!o.cancelled).map(o=>{const a=o.appointmentId?appointments.find(x=>x&&x.id===o.appointmentId):null;return{...o,appointment:a||null,client:o.client||a?.client||'Cliente',service:o.service||a?.service||'Atendimento',time:o.time||a?.time||'08:00',acceptedBy:o.acceptedBy};}).filter(o=>o.time);}
function restoreAppointments(){const s=read();let changed=false;(s.appointments||[]).forEach(a=>{if(a?.sosAcceptedBy&&a?.sosOriginalProfessional&&a.professional!==a.sosOriginalProfessional){a.professional=a.sosOriginalProfessional;changed=true;}});if(changed)localStorage.setItem(STATE_KEY,JSON.stringify(s));}
function sync(){const grid=document.getElementById('agendaGrid');if(!grid)return;const items=accepted();grid.querySelectorAll('td.sos-cell-found').forEach(c=>{c.className='sos-free-cell';c.innerHTML='Livre';c.removeAttribute('data-sos-id');c.removeAttribute('data-appointment-id');});grid.querySelectorAll('td[data-sos-cell="true"]').forEach(c=>{const item=items.find(x=>x.time===c.dataset.time);if(!item)return;c.className='sos-cell sos-cell-found';c.dataset.sosId=item.id||'';c.dataset.appointmentId=item.appointment?.id||'';c.innerHTML=`<strong>${esc(item.client)}</strong><span>${esc(item.service)}</span><small>${esc(item.acceptedBy)}</small><div class="sos-found-status">✓ Profissional ${/a$/i.test(item.acceptedBy||'')?'confirmada':'confirmado'}</div>`;});}
function setupServiceSelector(){
 const specialty=document.getElementById('sosSpecialty'),current=document.getElementById('sosService'),form=document.getElementById('sosForm');
 if(!specialty||!current||!form)return;
 if(current.dataset.catalogReady==='multi')return;
 const wrap=current.closest('.field');
 const trigger=document.createElement('button');trigger.type='button';trigger.id='sosService';trigger.className='sos-service-multi-trigger';trigger.innerHTML='<span id="sosServiceLabel">Selecionar serviços</span><span aria-hidden="true">▾</span>';
 const menu=document.createElement('div');menu.className='sos-service-multi-menu';menu.id='sosServiceMenu';
 const hidden=document.createElement('input');hidden.type='hidden';hidden.id='sosServiceValue';hidden.name='service';hidden.required=true;hidden.dataset.catalogReady='multi';
 current.replaceWith(trigger);wrap.appendChild(hidden);wrap.appendChild(menu);
 let info=wrap.querySelector('.sos-service-pricing');
 if(!info){info=document.createElement('div');info.className='sos-service-pricing';info.innerHTML='<div><span>Valor para cliente</span><strong id="sosClientPrice">—</strong></div><div><span>Oferta ao profissional</span><strong id="sosProfessionalOffer">—</strong></div><div><span>Tempo estimado</span><strong id="sosServiceDuration">—</strong></div>';wrap.appendChild(info);}
 const clientPrice=info.querySelector('#sosClientPrice'),offer=info.querySelector('#sosProfessionalOffer'),duration=info.querySelector('#sosServiceDuration'),label=document.getElementById('sosServiceLabel');
 const styleId='beautymoveSosMultiServiceStyle';
 if(!document.getElementById(styleId)){const style=document.createElement('style');style.id=styleId;style.textContent=`
.sos-service-multi-trigger{width:100%;height:44px;border:1px solid #d9d3e2;border-radius:9px;background:#fff;padding:0 12px;display:flex;align-items:center;justify-content:space-between;text-align:left;font-weight:700;color:#17131f;cursor:pointer}
.sos-service-multi-trigger:focus{outline:none;border-color:#7138ff;box-shadow:0 0 0 3px #f1eaff}
.sos-service-multi-menu{display:none;position:absolute;left:0;right:0;top:49px;z-index:20;background:#fff;border:1px solid #d9d3e2;border-radius:10px;padding:7px;box-shadow:0 15px 35px rgba(20,10,30,.14);max-height:260px;overflow:auto}
.sos-service-multi-menu.open{display:block}
.sos-service-multi-option{display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:8px;cursor:pointer}
.sos-service-multi-option:hover{background:#faf8ff}
.sos-service-multi-option input{margin-top:2px;accent-color:#7138ff;width:16px;height:16px}
.sos-service-multi-option span{display:flex;flex-direction:column;gap:3px;font-size:12px}
.sos-service-multi-option small{color:#716c78;font-size:10px}
.sos-service-selected{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.sos-service-chip{padding:5px 8px;background:#f1eaff;border:1px solid #e1d4f5;border-radius:7px;color:#573487;font-size:10px;font-weight:700}
.sos-service-multi-menu-empty{padding:12px;color:#716c78;font-size:12px}
`;document.head.appendChild(style);}
 if(getComputedStyle(wrap).position==='static')wrap.style.position='relative';
 let selected=[];
 function update(){
   const totalClient=selected.reduce((sum,s)=>sum+Number(s.clientPrice||0),0),totalOffer=selected.reduce((sum,s)=>sum+Number(s.professionalOffer||0),0),totalDuration=selected.reduce((sum,s)=>sum+Number(s.duration||0),0);
   hidden.value=selected.map(s=>s.name).join(' + ');
   label.textContent=selected.length?`${selected.length} serviço${selected.length>1?'s':''} selecionado${selected.length>1?'s':''}`:'Selecionar serviços';
   clientPrice.textContent=selected.length?money(totalClient):'—';offer.textContent=selected.length?money(totalOffer):'—';duration.textContent=selected.length?`${totalDuration} min`:'—';
   let chips=wrap.querySelector('.sos-service-selected');if(!chips){chips=document.createElement('div');chips.className='sos-service-selected';wrap.appendChild(chips);}chips.innerHTML=selected.map(s=>`<span class="sos-service-chip">${esc(s.name)}</span>`).join('');
   form.dataset.sosSelectedServices=JSON.stringify(selected);
 }
 function populate(){
   selected=[];update();const list=services().filter(s=>s.active&&s.specialty===specialty.value);
   menu.innerHTML=list.length?list.map((s,i)=>`<label class="sos-service-multi-option"><input type="checkbox" value="${esc(s.id||s.name)}" data-index="${i}"><span><strong>${esc(s.name)}</strong><small>${money(s.clientPrice)} para cliente · ${money(s.professionalOffer)} oferta · ${s.duration} min</small></span></label>`).join(''):'<div class="sos-service-multi-menu-empty">Nenhum serviço ativo cadastrado para esta especialidade.</div>';
   menu.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{const listNow=services().filter(s=>s.active&&s.specialty===specialty.value);const item=listNow[Number(input.dataset.index)];if(!item)return;if(input.checked)selected=[...selected.filter(s=>s.id!==item.id),item];else selected=selected.filter(s=>s.id!==item.id);update();}));
 }
 trigger.addEventListener('click',e=>{e.stopPropagation();menu.classList.toggle('open');});
 document.addEventListener('click',e=>{if(!wrap.contains(e.target))menu.classList.remove('open');});
 specialty.addEventListener('change',populate);populate();
 if(form.dataset.sosSnapshotReady==='true')return;
 form.dataset.sosSnapshotReady='true';
 form.addEventListener('submit',()=>{const chosen=selected.slice();if(!chosen.length)return;const snapshot={clientPrice:chosen.reduce((sum,s)=>sum+Number(s.clientPrice||0),0),professionalOffer:chosen.reduce((sum,s)=>sum+Number(s.professionalOffer||0),0),duration:chosen.reduce((sum,s)=>sum+Number(s.duration||0),0),specialty:specialty.value,service:chosen.map(s=>s.name).join(' + '),services:chosen.map(s=>({id:s.id,name:s.name,clientPrice:Number(s.clientPrice||0),professionalOffer:Number(s.professionalOffer||0),duration:Number(s.duration||0)}))};
   const hiddenSnapshot=(id,name,value)=>{let h=document.getElementById(id);if(!h){h=document.createElement('input');h.type='hidden';h.id=id;h.name=name;form.appendChild(h);}h.value=value;};
   hiddenSnapshot('sosClientPriceSnapshot','clientPriceSnapshot',snapshot.clientPrice);hiddenSnapshot('sosProfessionalOfferSnapshot','professionalOfferSnapshot',snapshot.professionalOffer);hiddenSnapshot('sosDurationSnapshot','durationSnapshot',snapshot.duration);hiddenSnapshot('sosSpecialtySnapshot','specialtySnapshot',snapshot.specialty);hiddenSnapshot('sosServicesSnapshot','servicesSnapshot',JSON.stringify(snapshot.services));
   setTimeout(()=>freezeLatestOpportunity(snapshot),450);
 },true);
}
function freezeLatestOpportunity(snapshot){const s=read(),items=Array.isArray(s.opportunities)?s.opportunities:[];const matches=items.filter(o=>o&&o.source==='sos'&&o.date===date()&&o.service===snapshot.service);const o=matches[matches.length-1];if(!o)return;o.clientPriceSnapshot=snapshot.clientPrice;o.professionalOfferSnapshot=snapshot.professionalOffer;o.durationSnapshot=snapshot.duration;o.specialtySnapshot=snapshot.specialty;o.servicesSnapshot=snapshot.services;o.offerFrozenAt=new Date().toISOString();localStorage.setItem(STATE_KEY,JSON.stringify(s));}
function linkServicesNav(){document.querySelectorAll('.salon-nav a').forEach(a=>{if(a.textContent.trim()==='Serviços')a.href='servicos.html';});}
function boot(){loadColumnIdentity();services();restoreAppointments();linkServicesNav();setupServiceSelector();let signature='';const tick=()=>{const s=JSON.stringify([date(),localStorage.getItem(STATE_KEY),document.getElementById('agendaGrid')?.innerHTML.length||0]);if(s!==signature){signature=s;sync();}};setTimeout(tick,700);setInterval(()=>{restoreAppointments();tick();setupServiceSelector();},800);window.addEventListener('beautymove:sos-accepted',()=>{signature='';setTimeout(tick,100);});['prevDay','nextDay','todayBtn','agendaDatePicker'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>{signature='';setTimeout(tick,250);}));document.getElementById('agendaDatePicker')?.addEventListener('change',()=>{signature='';setTimeout(tick,150);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
