/* Controle operacional das profissionais dentro da Agenda. */
(function(){
  const KEY='beautymove.mvp.professional.daily-status';
  const PROFESSIONALS=['Ana','Bruna','Paula','Carla'];
  const STATUS={
    unregistered:{label:'Sem registro',cls:'unregistered'},
    working:{label:'Presença registrada',cls:'working'},
    late:{label:'Atraso registrado',cls:'late'},
    absent:{label:'Ausência registrada',cls:'absent'}
  };
  let popover=null;
  let lastGridSignature='';
  let booted=false;

  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}};
  const save=data=>localStorage.setItem(KEY,JSON.stringify(data));
  function dateKey(){
    const p=document.getElementById('agendaDatePicker');
    if(p&&p.value)return p.value;
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  const keyFor=name=>`${dateKey()}::${name}`;
  function record(name){const v=read()[keyFor(name)];return typeof v==='string'?{status:v}:v||{status:'unregistered'};}
  function now(){const d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
  function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  function closePopover(){if(popover){popover.remove();popover=null;}}

  function styles(){
    if(document.getElementById('professionalControlPopoverStyles'))return;
    const s=document.createElement('style');s.id='professionalControlPopoverStyles';
    s.textContent=`
      .professional-control-popover{position:fixed;z-index:10050;width:min(340px,calc(100vw - 20px));background:#fff;border:1px solid #e5def4;border-radius:12px;box-shadow:0 14px 34px rgba(32,18,65,.16);padding:14px;color:#17131f;font-family:inherit}
      .professional-control-popover .popover-title{font-size:17px;font-weight:800;margin:0 0 2px}.professional-control-popover .popover-date{font-size:11px;color:#6f6878;margin-bottom:10px}
      .professional-control-popover .popover-status{font-size:11px;padding:8px 10px;border-radius:8px;background:#faf9fc;margin-bottom:10px;color:#5f5968}
      .professional-control-popover .popover-actions{display:grid;gap:7px}.professional-control-popover button{font:inherit;text-align:left;cursor:pointer;background:#fff;border:1px solid #e4dfeb;border-radius:9px;padding:9px 11px}.professional-control-popover button:hover{background:#faf8ff;border-color:#7b3ff2}
      .professional-control-popover button strong{display:block;font-size:13px}.professional-control-popover button small{display:block;font-size:10px;color:#746d7d;margin-top:2px}
      .professional-control-popover .action-success{border-color:#b9dfca}.professional-control-popover .action-success strong{color:#147a4d}.professional-control-popover .action-warning{border-color:#ecd49c}.professional-control-popover .action-warning strong{color:#a86a00}.professional-control-popover .action-danger{border-color:#efc2c2}.professional-control-popover .action-danger strong{color:#c62828}
      .professional-control-popover .absence-panel{margin-top:10px;padding-top:10px;border-top:1px solid #eee8f2}.professional-control-popover .absence-panel label{display:block;font-size:11px;font-weight:600;color:#5f5968;margin-bottom:5px}
      .professional-control-popover .absence-panel select,.professional-control-popover .absence-panel input,.professional-control-popover .absence-panel textarea{width:100%;box-sizing:border-box;border:1px solid #ddd6e6;border-radius:8px;padding:8px;font:inherit;font-size:12px;background:#fff;margin-bottom:8px}.professional-control-popover .absence-panel textarea{min-height:52px;resize:vertical}
      .professional-control-popover .absence-panel .confirm-absence{width:100%;background:#7139ef;color:#fff;border-color:#7139ef;text-align:center;margin-top:2px}.professional-control-popover .absence-panel .cancel-absence{width:100%;text-align:center;margin-top:6px}
      .professional-control-popover .occurrence-summary{margin-top:9px;padding:8px 9px;border-radius:8px;background:#fff7f5;border:1px solid #f3d2cd;font-size:10px;color:#6f6878}.professional-control-popover .occurrence-summary strong{display:block;color:#b42318;font-size:11px}.professional-control-popover .edit-occurrence{width:100%;text-align:center;margin-top:7px}
      .professional-day-status{display:inline-flex;align-items:center;gap:5px;margin-top:6px;font-size:11px;font-weight:600;color:#667085}.professional-day-status .status-dot{width:7px;height:7px;border-radius:50%;background:#98a2b3}.professional-day-status.is-working .status-dot{background:#159957}.professional-day-status.is-late .status-dot{background:#d97706}.professional-day-status.is-absent .status-dot{background:#d92d20}
      .professional-header-control{cursor:pointer;position:relative}.professional-header-control:hover{background:#faf8ff}.professional-absent-period{background:#fff7f5!important}.professional-absence-marker{display:block;margin-top:4px;font-size:10px;font-weight:700;color:#b42318;line-height:1.2}
    `;
    document.head.appendChild(s);
  }

  function place(pop,anchor){
    const a=anchor||document.getElementById('professionalFilter');if(!a)return;
    const r=a.getBoundingClientRect();const w=Math.min(340,window.innerWidth-20);let left=r.left+r.width/2-w/2;left=Math.max(10,Math.min(left,window.innerWidth-w-10));
    const estimated=430;let top=r.bottom+8;if(top+estimated>window.innerHeight)top=Math.max(10,r.top-estimated-8);pop.style.left=`${left}px`;pop.style.top=`${top}px`;
  }

  function renderAbsenceForm(pop,existing){
    const panel=pop.querySelector('#absencePanel');if(!panel)return;
    panel.hidden=false;
    const type=panel.querySelector('#absenceType').value;
    const during=type==='during_day';
    panel.querySelector('#interruptionFields').hidden=!during;
    panel.querySelector('#otherReasonField').hidden=panel.querySelector('#absenceReason').value!=='Outro motivo';
    if(existing&&existing.absenceType){
      panel.querySelector('#absenceType').value=existing.absenceType;
      panel.querySelector('#interruptionFields').hidden=existing.absenceType!=='during_day';
    }
  }

  function openControl(name,anchor){
    if(!PROFESSIONALS.includes(name))return;
    styles();closePopover();
    const rec=record(name);const st=STATUS[rec.status]||STATUS.unregistered;const date=dateKey().split('-').reverse().join('/');
    const summary=rec.absenceType?`<div class="occurrence-summary"><strong>${rec.absenceType==='during_day'?'Interrupção do expediente':'Ausência registrada'}</strong><span>${esc(rec.absenceReason||'Sem motivo informado')}${rec.absenceStart?` · a partir de ${esc(rec.absenceStart)}`:''}</span></div><button type="button" class="edit-occurrence" data-edit-occurrence>Alterar ocorrência</button>`:'';
    const p=document.createElement('div');popover=p;p.className='professional-control-popover';p.setAttribute('role','dialog');
    p.innerHTML=`<div class="popover-title">${esc(name)}</div><div class="popover-date">Controle do dia · ${date}</div><div class="popover-status">Status: <strong>${st.label}</strong></div><div class="popover-actions"><button type="button" class="action-success" data-prof-action="working"><strong>Marcar presença</strong><small>Registra a entrada da profissional.</small></button><button type="button" class="action-warning" data-prof-action="late"><strong>Registrar atraso</strong><small>Registra chegada fora do horário.</small></button><button type="button" class="action-danger" data-prof-action="absent"><strong>Registrar ausência</strong><small>Não compareceu ou interrompeu o expediente.</small></button></div>${summary}<div class="absence-panel" id="absencePanel" hidden><label for="absenceType">Tipo de ausência</label><select id="absenceType"><option value="full_no_show">Não compareceu</option><option value="full_notice">Ausência com aviso prévio</option><option value="during_day">Interrupção do expediente</option></select><div id="interruptionFields" hidden><label for="absenceStart">Horário de saída</label><input id="absenceStart" type="time" value="${esc(rec.absenceStart||now())}"><label for="absenceReason">Motivo</label><select id="absenceReason"><option>Emergência médica</option><option>Mal-estar</option><option>Imprevisto pessoal</option><option>Outro motivo</option></select><div id="otherReasonField" hidden><label for="otherReason">Justificativa</label><textarea id="otherReason" placeholder="Descreva o motivo."></textarea></div></div><button type="button" class="confirm-absence" data-confirm-absence>Salvar</button><button type="button" class="cancel-absence" data-cancel-absence>Cancelar</button></div>`;
    document.body.appendChild(p);place(p,anchor);

    p.querySelectorAll('[data-prof-action]').forEach(b=>b.addEventListener('click',()=>{
      const a=b.dataset.profAction,current=record(name);
      if(a==='absent'){renderAbsenceForm(p,current);return;}
      if(a==='working')saveRecord(name,{status:'working',presenceStart:current.presenceStart||now(),presenceEnd:null,absenceType:null,absenceStart:null,absenceReason:null});
      if(a==='late')saveRecord(name,{status:'late',lateStart:now(),absenceType:null,absenceStart:null,absenceReason:null});
    }));
    p.querySelector('#absenceType')?.addEventListener('change',()=>renderAbsenceForm(p,record(name)));
    p.querySelector('#absenceReason')?.addEventListener('change',()=>renderAbsenceForm(p,record(name)));
    p.querySelector('[data-confirm-absence]')?.addEventListener('click',()=>{
      const type=p.querySelector('#absenceType').value,current=record(name);
      if(type==='during_day'){
        const start=p.querySelector('#absenceStart').value||now();const reason=p.querySelector('#absenceReason').value;const other=p.querySelector('#otherReason')?.value.trim()||'';
        saveRecord(name,{status:'absent',absenceType:type,absenceStart:start,absenceReason:reason==='Outro motivo'?(other||'Outro motivo'):reason,presenceStart:current.presenceStart||'09:00',presenceEnd:start});
      }else saveRecord(name,{status:'absent',absenceType:type,absenceStart:null,absenceReason:type==='full_notice'?'Ausência com aviso prévio':'Não compareceu',presenceEnd:null});
    });
    p.querySelector('[data-cancel-absence]')?.addEventListener('click',()=>p.querySelector('#absencePanel').hidden=true);
    p.querySelector('[data-edit-occurrence]')?.addEventListener('click',()=>{const cur=record(name);p.querySelector('#absenceType').value=cur.absenceType||'full_no_show';renderAbsenceForm(p,cur);if(cur.absenceType==='during_day')p.querySelector('#absenceStart').value=cur.absenceStart||now();});
  }

  function saveRecord(name,patch){
    const data=read();
    data[keyFor(name)]={...record(name),...patch,updatedAt:new Date().toISOString()};
    save(data);closePopover();
    refreshHeaders(true);
    setTimeout(()=>openControl(name,document.getElementById('professionalFilter')),0);
  }

  function refreshHeaders(force=false){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    const names=[...grid.querySelectorAll('thead .professional-name')].map(x=>x.textContent.trim()).join('|');
    const signature=`${dateKey()}::${names}::${JSON.stringify(read())}`;
    if(!force&&signature===lastGridSignature)return;
    lastGridSignature=signature;
    grid.querySelectorAll('thead th:not(.time-col):not(.sos-col)').forEach(th=>{
      const name=th.querySelector('.professional-name')?.textContent.trim();if(!PROFESSIONALS.includes(name))return;
      th.classList.add('professional-header-control');th.setAttribute('tabindex','0');th.setAttribute('role','button');
      const s=STATUS[record(name).status]||STATUS.unregistered;
      let el=th.querySelector('.professional-day-status');
      if(!el){el=document.createElement('span');el.className='professional-day-status';th.appendChild(el);}
      el.className=`professional-day-status is-${s.cls}`;el.innerHTML=`<i class="status-dot" aria-hidden="true"></i>${s.label}`;
      if(!th.dataset.profControlBound){
        th.dataset.profControlBound='1';
        th.addEventListener('click',e=>{if(!e.target.closest('button,a'))openControl(name,document.getElementById('professionalFilter'));});
        th.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openControl(name,document.getElementById('professionalFilter'));}});
      }
    });
    renderAgendaMarkers();
  }

  function renderAgendaMarkers(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    grid.querySelectorAll('.professional-absence-marker').forEach(e=>e.remove());
    grid.querySelectorAll('.professional-absent-period').forEach(e=>e.classList.remove('professional-absent-period'));
    const headers=[...grid.querySelectorAll('thead th')];
    const rows=[...grid.querySelectorAll('tbody tr')];
    const firstTime=rows[0]?.querySelector('th.time-col')?.textContent.trim()||'';
    rows.forEach(row=>{
      const time=row.querySelector('th.time-col')?.textContent.trim();if(!time)return;
      headers.forEach((th,index)=>{
        const name=th.querySelector('.professional-name')?.textContent.trim();if(!PROFESSIONALS.includes(name))return;
        const rec=record(name);if(rec.status!=='absent'||!rec.absenceType)return;
        const during=rec.absenceType==='during_day';if(during&&!rec.absenceStart)return;
        const affected=during?Number(time.slice(0,2))*60+Number(time.slice(3,5))>=Number(rec.absenceStart.slice(0,2))*60+Number(rec.absenceStart.slice(3,5)):true;if(!affected)return;
        const cell=row.children[index];if(!cell)return;cell.classList.add('professional-absent-period');
        const showMarker=during?time===rec.absenceStart:time===firstTime;
        if(showMarker){const marker=document.createElement('span');marker.className='professional-absence-marker';marker.textContent=during?`Ausente desde ${rec.absenceStart} · ${rec.absenceReason||'Ocorrência registrada'}`:(rec.absenceType==='full_notice'?'Ausência com aviso prévio':'Não compareceu');cell.appendChild(marker);}
      });
    });
  }

  function bindFilter(){
    const f=document.getElementById('professionalFilter');if(!f||f.dataset.controlBound)return;
    f.dataset.controlBound='1';
    f.addEventListener('change',()=>{const n=f.value.trim();if(PROFESSIONALS.includes(n))openControl(n,f);});
    f.addEventListener('click',()=>{const n=f.value.trim();if(PROFESSIONALS.includes(n))setTimeout(()=>openControl(n,f),0);});
  }

  document.addEventListener('click',e=>{if(popover&&!popover.contains(e.target)&&!e.target.closest('#professionalFilter'))closePopover();});
  window.addEventListener('resize',()=>{if(popover)place(popover,document.getElementById('professionalFilter'));});
  window.addEventListener('scroll',()=>{if(popover)place(popover,document.getElementById('professionalFilter'));},true);

  function boot(){
    if(booted)return;booted=true;styles();bindFilter();refreshHeaders(true);
    setInterval(()=>refreshHeaders(false),1000);
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));
})();