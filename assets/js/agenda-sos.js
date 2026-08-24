/* BeautyMove — Agenda S.O.S. independente
 * Fonte: oportunidades S.O.S. do estado do salão.
 * Não renderiza nem altera a Agenda Profissionais.
 */
(function(){
  'use strict';
  const STATE='beautymove.mvp.state';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const mins=v=>{const p=String(v||'00:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0)};
  const time=v=>`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const durationOf=o=>Array.isArray(o?.services)&&o.services.length?o.services.reduce((n,s)=>n+Number(s.durationMinutes||s.duration||30),0):Number(o?.durationMinutes||o?.duration||30);
  const dateKey=()=>document.querySelector('#sosAgendaDate')?.value||new Date().toISOString().slice(0,10);
  function render(){
    const grid=document.querySelector('#sosAgendaGrid'); if(!grid)return;
    const start=8*60,end=22*60,row=60,day=dateKey();
    const state=read(STATE,{appointments:[],opportunities:[]});
    const items=(Array.isArray(state.opportunities)?state.opportunities:[]).filter(o=>o?.date===day&&!['cancelada','cancelado','resolvida','resolvido'].includes(String(o.status||'').toLowerCase()));
    const rows=Array.from({length:14},(_,i)=>`<div class="sos-time"><strong>${time(start+i*60)}</strong></div>`).join('');
    const blocks=items.map(o=>{const s=mins(o.time),d=durationOf(o),top=Math.max(0,s-start)*row/60,height=Math.max(36,d*row/60-4);const stateLabel=o.status==='aberta'?'Aguardando profissional':o.sentTo||o.acceptedBy||'Em andamento';return `<button class="sos-event" style="top:${top}px;height:${height}px" data-id="${esc(o.id)}"><strong>${esc(o.client||'Oportunidade S.O.S.')}</strong><span>${esc(o.service||o.specialty||'Necessidade')}</span><small>${esc(o.time)} – ${esc(time(s+d))} · ${d} min</small><small>${esc(stateLabel)}</small></button>`}).join('');
    grid.innerHTML=`<div class="sos-grid" style="height:${14*row}px"><div class="sos-times">${rows}</div><div class="sos-lane">${blocks||'<div class="sos-empty">Nenhuma oportunidade S.O.S. para esta data.</div>'}</div></div>`;
    grid.querySelectorAll('.sos-event').forEach(btn=>btn.addEventListener('click',()=>select(btn.dataset.id)));
  }
  function select(id){
    const btn=document.querySelector(`#sosAgendaGrid .sos-event[data-id="${CSS.escape(String(id||''))}"]`);if(!btn)return;
    document.querySelectorAll('#sosAgendaGrid .sos-event.is-selected').forEach(el=>el.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    btn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
  }
  function boot(){
    const style=document.createElement('style');style.textContent=`#sosAgendaGrid .sos-grid{display:grid;grid-template-columns:88px minmax(520px,1fr);min-width:608px}.sos-times{background:#fff;border-right:1px solid #ece9f0}.sos-time{height:60px;box-sizing:border-box;border-bottom:1px solid #ece9f0;padding:10px 8px;text-align:center;color:#2c2733;font-size:12px}.sos-lane{position:relative;background:repeating-linear-gradient(to bottom,#ece9f0 0,#ece9f0 1px,transparent 1px,transparent 60px)}.sos-event{position:absolute;left:8px;right:8px;box-sizing:border-box;border:0;border-left:4px solid #7438ff;border-radius:8px;background:#f2eaff;padding:8px 10px;text-align:left;cursor:pointer;color:#211b29}.sos-event strong,.sos-event span,.sos-event small{display:block}.sos-event strong{font-size:14px}.sos-event span{font-size:12px;margin-top:3px}.sos-event small{font-size:10px;margin-top:3px;color:#5d5269}.sos-empty{position:absolute;top:20px;left:20px;color:#7b7382;font-size:13px}.sos-event.is-selected{outline:3px solid rgba(116,56,255,.22);box-shadow:0 0 0 1px #7438ff}@media(max-width:780px){#sosAgendaGrid{max-height:calc(100vh - 220px)}}`;document.head.appendChild(style);
    document.querySelector('#sosAgendaDate')?.addEventListener('change',render);
    document.querySelector('#sosAgendaPrev')?.addEventListener('click',()=>move(-1));
    document.querySelector('#sosAgendaNext')?.addEventListener('click',()=>move(1));
    document.querySelector('#sosAgendaToday')?.addEventListener('click',()=>{const d=new Date();document.querySelector('#sosAgendaDate').value=d.toISOString().slice(0,10);render()});
    window.addEventListener('storage',e=>{if(e.key===STATE)render()});
    window.addEventListener('beautymove:sos-changed',render);
    window.addEventListener('beautymove:sos-selected',e=>{if(e.detail?.id){setTimeout(()=>select(e.detail.id),40)}});
    render();
  }
  function move(delta){const el=document.querySelector('#sosAgendaDate');if(!el)return;const d=new Date(`${el.value||new Date().toISOString().slice(0,10)}T12:00:00`);d.setDate(d.getDate()+delta);el.value=d.toISOString().slice(0,10);render()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
