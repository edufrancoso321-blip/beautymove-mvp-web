/* Impacto operacional de ausências na Agenda BeautyMove. */
(function(){
  const STATUS_KEY='beautymove.mvp.professional.daily-status';
  const STATE_KEY='beautymove.mvp.state';
  const PEOPLE=['Ana','Bruna','Paula','Carla'];
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f;}catch{return f;}};
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const mins=v=>{const [h,m]=String(v||'00:00').split(':').map(Number);return h*60+m;};
  const dateKey=()=>document.getElementById('agendaDatePicker')?.value||new Date().toISOString().slice(0,10);
  const data=()=>read(STATUS_KEY,{});
  const state=()=>read(STATE_KEY,{appointments:[],opportunities:[],transactions:[]});
  function affected(){
    const d=dateKey(), statuses=data(), s=state();
    const out=[];
    (s.appointments||[]).filter(a=>a.date===d&&a.status!=='cancelado').forEach(a=>{
      const r=statuses[`${d}::${a.professional}`]; if(!r||r.status!=='absent')return;
      const impacted=r.absenceType==='during_day' ? mins(a.time)>=mins(r.absenceStart) : (r.absenceType==='full_no_show'||r.absenceType==='full_notice');
      if(impacted)out.push({...a,absence:r});
    });
    return out;
  }
  function ensureStyles(){
    if(document.getElementById('affectedAppointmentStyles'))return;
    const s=document.createElement('style');s.id='affectedAppointmentStyles';s.textContent=`
      .affected-appointment-cell{box-shadow:inset 4px 0 #d92d20!important;background:#fff7f5!important;cursor:pointer}
      .affected-appointment-cell .affected-label{display:block;margin-top:5px;font-size:10px;font-weight:800;color:#b42318}
      .agenda-impact-banner{margin:8px 0 0;padding:9px 12px;border:1px solid #efc2c2;border-radius:9px;background:#fff7f5;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;color:#6f6878}
      .agenda-impact-banner strong{color:#b42318}.agenda-impact-banner button{border:0;border-radius:7px;background:#7139ef;color:#fff;padding:7px 11px;font-weight:700;cursor:pointer}
      .agenda-impact-modal{position:fixed;inset:0;z-index:10100;display:flex;align-items:center;justify-content:center;background:rgba(20,14,30,.35);padding:18px}
      .agenda-impact-card{width:min(620px,96vw);max-height:86vh;overflow:auto;background:#fff;border:1px solid #e5def4;border-radius:14px;box-shadow:0 18px 45px rgba(32,18,65,.22);padding:18px;font-family:inherit;color:#17131f}
      .agenda-impact-head{display:flex;justify-content:space-between;align-items:flex-start}.agenda-impact-head h2{margin:0;font-size:20px}.agenda-impact-head p{margin:4px 0 14px;font-size:12px;color:#6f6878}.agenda-impact-close{border:0;background:transparent;font-size:24px;cursor:pointer;color:#777}
      .impact-item{border:1px solid #eee4ed;border-radius:10px;padding:11px;margin:8px 0}.impact-item strong{display:block;font-size:14px}.impact-item small{display:block;color:#6f6878;margin-top:2px}.impact-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.impact-actions button{border:1px solid #ddd6e6;background:#fff;border-radius:7px;padding:7px 9px;cursor:pointer;font:inherit;font-size:11px;font-weight:700}.impact-actions .primary{background:#7139ef;color:#fff;border-color:#7139ef}.impact-actions .danger{color:#b42318;border-color:#efc2c2}.impact-transfer{display:none;margin-top:8px}.impact-transfer select{width:100%;padding:8px;border:1px solid #ddd6e6;border-radius:7px}.impact-transfer button{margin-top:6px;width:100%;padding:8px;border:0;border-radius:7px;background:#7139ef;color:#fff;font-weight:700}
    `;document.head.appendChild(s);
  }
  function openModal(list){
    ensureStyles();let old=document.getElementById('agendaImpactModal');if(old)old.remove();
    const m=document.createElement('div');m.id='agendaImpactModal';m.className='agenda-impact-modal';
    m.innerHTML=`<section class="agenda-impact-card" role="dialog" aria-modal="true"><div class="agenda-impact-head"><div><h2>Atendimentos afetados</h2><p>Há ${list.length} atendimento(s) que precisam de uma solução.</p></div><button class="agenda-impact-close" aria-label="Fechar">×</button></div><div id="impactList"></div></section>`;
    document.body.appendChild(m);m.querySelector('.agenda-impact-close').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove();};
    const box=m.querySelector('#impactList');
    list.forEach(a=>{
      const item=document.createElement('div');item.className='impact-item';item.dataset.id=a.id;
      item.innerHTML=`<strong>${esc(a.time)} · ${esc(a.client||'Cliente')}</strong><small>${esc(a.professional)} · ${esc(a.service||'Atendimento')}</small><small>Profissional indisponível: ${esc(a.absence.absenceReason||'ausência registrada')}</small><div class="impact-actions"><button class="primary" data-action="transfer">Transferir</button><button data-action="sos">Acionar S.O.S.</button><button data-action="reschedule">Remarcar</button><button class="danger" data-action="cancel">Cancelar</button></div><div class="impact-transfer"><select><option value="">Selecionar profissional</option>${PEOPLE.filter(p=>p!==a.professional).map(p=>`<option>${p}</option>`).join('')}</select><button data-action="confirm-transfer">Confirmar transferência</button></div>`;
      box.appendChild(item);
      item.querySelector('[data-action="transfer"]').onclick=()=>{item.querySelector('.impact-transfer').style.display='block';};
      item.querySelector('[data-action="confirm-transfer"]').onclick=()=>transfer(a.id,item.querySelector('select').value,m);
      item.querySelector('[data-action="sos"]').onclick=()=>{m.remove();document.getElementById('requestSosButton')?.click();};
      item.querySelector('[data-action="reschedule"]').onclick=()=>{m.remove();document.querySelector(`[data-appointment-id="${CSS.escape(a.id)}"]`)?.click();};
      item.querySelector('[data-action="cancel"]').onclick=()=>cancel(a.id,m);
    });
  }
  function transfer(id,professional,m){if(!professional)return;const s=state(),a=s.appointments.find(x=>x.id===id);if(!a)return;a.professional=professional;localStorage.setItem(STATE_KEY,JSON.stringify(s));m.remove();location.reload();}
  function cancel(id,m){const s=state(),a=s.appointments.find(x=>x.id===id);if(!a)return;a.status='cancelado';localStorage.setItem(STATE_KEY,JSON.stringify(s));m.remove();location.reload();}
  function render(){
    ensureStyles();const list=affected();let banner=document.getElementById('agendaImpactBanner');
    if(!banner){banner=document.createElement('div');banner.id='agendaImpactBanner';banner.className='agenda-impact-banner';const shell=document.getElementById('agendaGrid');shell?.parentNode?.insertBefore(banner,shell);}
    if(list.length){banner.hidden=false;banner.innerHTML=`<span><strong>⚠ ${list.length} atendimento(s) afetado(s)</strong> pela ausência de profissional.</span><button type="button">Resolver atendimentos</button>`;banner.querySelector('button').onclick=()=>openModal(affected());}
    else banner.hidden=true;
    document.querySelectorAll('#agendaGrid [data-appointment-id]').forEach(cell=>{cell.classList.remove('affected-appointment-cell');cell.querySelector('.affected-label')?.remove();const id=cell.dataset.appointmentId,a=list.find(x=>x.id===id);if(a){cell.classList.add('affected-appointment-cell');const l=document.createElement('span');l.className='affected-label';l.textContent='Atendimento afetado · ação necessária';cell.appendChild(l);}});
  }
  function boot(){let last='';const tick=()=>{const signature=JSON.stringify([dateKey(),affected().map(a=>a.id),localStorage.getItem(STATUS_KEY)]);if(signature!==last){last=signature;render();}};tick();setInterval(tick,500);}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,700));
})();
