/* BeautyMove — Agenda S.O.S.
 * Contrato: a Agenda principal é a autoridade vertical e de data.
 * A Agenda S.O.S. compartilha exatamente a mesma escala temporal.
 * Não cria painel paralelo nem agenda duplicada.
 */
(function(){
  'use strict';
  const STATE='beautymove.mvp.state', HOURS_KEY='beautymove.mvp.agenda.hours';
  const ROW_HEIGHT=68, MAIN_HEADER_OFFSET=24, MAIN_HEADER_TOTAL=82;
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const mins=v=>{const p=String(v||'00:00').split(':').map(Number);return(p[0]||0)*60+(p[1]||0)};
  const time=v=>`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
  const durationOf=o=>Array.isArray(o?.services)&&o.services.length?o.services.reduce((n,s)=>n+Number(s.durationMinutes||s.duration||30),0):Number(o?.durationMinutes||o?.duration||30);
  const mainDate=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const interval=()=>Number(document.getElementById('agendaInterval')?.value||60);
  function configuredHours(){const week=read(HOURS_KEY,null),d=new Date(`${mainDate()}T12:00:00`);if(Array.isArray(week)&&week[d.getDay()])return{open:week[d.getDay()].open||'08:00',close:week[d.getDay()].close||'18:00'};return{open:'08:00',close:'18:00'}}
  function render(){
    const grid=document.getElementById('sosAgendaGrid');if(!grid)return;
    const h=configuredHours(),start=mins(h.open),end=mins(h.close),step=interval(),slots=Math.ceil(Math.max(step,end-start)/step),height=slots*ROW_HEIGHT,scrollHeight=height+MAIN_HEADER_TOTAL,day=mainDate(),state=read(STATE,{opportunities:[]});
    const items=(Array.isArray(state.opportunities)?state.opportunities:[]).filter(o=>o?.date===day&&!['cancelada','cancelado','resolvida','resolvido','finalizada'].includes(String(o.status||'').toLowerCase()));
    const blocks=items.map(o=>{const s=mins(o.time),d=durationOf(o),top=MAIN_HEADER_OFFSET+Math.max(0,(s-start)*ROW_HEIGHT/step),eventHeight=Math.max(36,d*ROW_HEIGHT/step-4),label=o.status==='aberta'?'Aguardando profissional':o.sentTo||o.acceptedBy||'Em andamento';return`<button class="sos-event" style="top:${top}px;height:${eventHeight}px" data-id="${esc(o.id)}"><strong>${esc(o.client||'Oportunidade S.O.S.')}</strong><span>${esc(o.service||o.specialty||'Necessidade')}</span><small>${esc(o.time)} – ${esc(time(s+d))} · ${d} min</small><small>${esc(label)}</small></button>`;}).join('');
    grid.innerHTML=`<div class="sos-grid" style="height:${scrollHeight}px"><div class="sos-lane">${blocks||'<div class="sos-empty" style="top:44px">Nenhuma oportunidade S.O.S. para esta data.</div>'}</div></div>`;
    grid.querySelectorAll('.sos-event').forEach(b=>b.addEventListener('click',()=>select(b.dataset.id)));
    window.dispatchEvent(new CustomEvent('beautymove:sos-agenda-rendered'));
  }
  function select(id){const b=document.querySelector(`#sosAgendaGrid .sos-event[data-id="${CSS.escape(String(id||''))}"]`);if(!b)return;document.querySelectorAll('#sosAgendaGrid .sos-event.is-selected').forEach(x=>x.classList.remove('is-selected'));b.classList.add('is-selected');b.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});}
  function boot(){
    const style=document.createElement('style');style.id='bmSosAgendaBaseStyles';style.textContent=`#sosAgendaGrid{position:relative!important}#sosAgendaGrid .sos-grid{display:block;width:100%;min-width:0;position:relative}#sosAgendaGrid .sos-lane{position:relative;width:100%;height:100%;min-width:0;background:repeating-linear-gradient(to bottom,#ece9f0 0,#ece9f0 1px,transparent 1px,transparent ${ROW_HEIGHT}px);background-position-y:${MAIN_HEADER_OFFSET}px}#sosAgendaGrid .sos-event{position:absolute;left:8px;right:8px;box-sizing:border-box;border:0;border-left:4px solid #7438ff;border-radius:8px;background:#f2eaff;padding:8px 10px;text-align:left;cursor:pointer;color:#211b29;overflow:hidden}#sosAgendaGrid .sos-event strong,#sosAgendaGrid .sos-event span,#sosAgendaGrid .sos-event small{display:block}#sosAgendaGrid .sos-event strong{font-size:14px}#sosAgendaGrid .sos-event span{font-size:12px;margin-top:3px}#sosAgendaGrid .sos-event small{font-size:10px;margin-top:3px;color:#5d5269}#sosAgendaGrid .sos-empty{position:absolute;left:20px;color:#7b7382;font-size:13px}#sosAgendaGrid .sos-event.is-selected{outline:3px solid rgba(116,56,255,.22);box-shadow:0 0 0 1px #7438ff}`;document.head.appendChild(style);
    document.getElementById('agendaDatePicker')?.addEventListener('change',render);document.getElementById('prevDay')?.addEventListener('click',()=>setTimeout(render,0));document.getElementById('nextDay')?.addEventListener('click',()=>setTimeout(render,0));document.getElementById('todayBtn')?.addEventListener('click',()=>setTimeout(render,0));document.getElementById('agendaInterval')?.addEventListener('change',render);window.addEventListener('beautymove:agenda-date-changed',()=>setTimeout(render,0));window.addEventListener('storage',e=>{if(e.key===STATE||e.key===HOURS_KEY)render()});window.addEventListener('beautymove:sos-changed',render);window.addEventListener('beautymove:sos-selected',e=>{if(e.detail?.id)setTimeout(()=>select(e.detail.id),40)});render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
