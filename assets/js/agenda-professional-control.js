/* Controle operacional das profissionais dentro da Agenda. */
(function(){
  const KEY='beautymove.mvp.professional.daily-status';
  const PROFESSIONALS=['Ana','Bruna','Paula','Carla'];
  const statusMap={
    unregistered:{label:'Sem registro',className:'unregistered'},
    working:{label:'Presença registrada',className:'working'},
    late:{label:'Atraso registrado',className:'late'},
    absent:{label:'Ausência registrada',className:'absent'}
  };
  let activePopover=null;
  let gridObserver=null;
  let renderingHeaders=false;
  let renderQueued=false;

  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}}
  function save(data){localStorage.setItem(KEY,JSON.stringify(data));}
  function dateKey(){
    const p=document.getElementById('agendaDatePicker');
    if(p?.value)return p.value;
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function keyFor(name){return `${dateKey()}::${name}`;}
  function getRecord(name){
    const value=read()[keyFor(name)];
    return typeof value==='string'?{status:value}:value||{status:'unregistered'};
  }
  function nowTime(){
    const d=new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  function minutes(time){const [h,m]=String(time||'00:00').split(':').map(Number);return h*60+m;}
  function escapeHtml(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  function removePopover(){if(activePopover){activePopover.remove();activePopover=null;}}

  function positionPopover(popover,anchor){
    const r=anchor.getBoundingClientRect();
    const width=Math.min(340,window.innerWidth-20);
    let left=r.left+r.width/2-width/2;
    left=Math.max(10,Math.min(left,window.innerWidth-width-10));
    let top=r.bottom+8;
    if(top+430>window.innerHeight)top=Math.max(10,r.top-438);
    popover.style.width=`${width}px`;
    popover.style.left=`${left}px`;
    popover.style.top=`${top}px`;
  }

  function ensureStyles(){
    if(document.getElementById('professionalControlPopoverStyles'))return;
    const style=document.createElement('style');
    style.id='professionalControlPopoverStyles';
    style.textContent=`
      .professional-control-popover{position:fixed;z-index:10050;background:#fff;border:1px solid #e5def4;border-radius:12px;box-shadow:0 14px 34px rgba(32,18,65,.16);padding:14px;color:#17131f;font-family:inherit}
      .professional-control-popover .popover-title{font-size:17px;font-weight:800;margin:0 0 2px}
      .professional-control-popover .popover-date{font-size:11px;color:#6f6878;margin-bottom:10px}
      .professional-control-popover .popover-status{font-size:11px;padding:8px 10px;border-radius:8px;background:#faf9fc;margin-bottom:10px;color:#5f5968}
      .professional-control-popover .popover-actions{display:grid;gap:7px}
      .professional-control-popover button{font:inherit;text-align:left;cursor:pointer;background:#fff;border:1px solid #e4dfeb;border-radius:9px;padding:9px 11px}
      .professional-control-popover button:hover{background:#faf8ff;border-color:#7b3ff2}
      .professional-control-popover button strong{display:block;font-size:13px}
      .professional-control-popover button small{display:block;font-size:10px;color:#746d7d;margin-top:2px}
      .professional-control-popover .action-success{border-color:#b9dfca}.professional-control-popover .action-success strong{color:#147a4d}
      .professional-control-popover .action-warning{border-color:#ecd49c}.professional-control-popover .action-warning strong{color:#a86a00}
      .professional-control-popover .action-danger{border-color:#efc2c2}.professional-control-popover .action-danger strong{color:#c62828}
      .professional-control-popover .absence-panel{margin-top:10px;padding-top:10px;border-top:1px solid #eee8f2}
      .professional-control-popover .absence-panel label{display:block;font-size:11px;font-weight:600;color:#5f5968;margin-bottom:5px}
      .professional-control-popover .absence-panel select,.professional-control-popover .absence-panel input,.professional-control-popover .absence-panel textarea{width:100%;box-sizing:border-box;border:1px solid #ddd6e6;border-radius:8px;padding:8px;font:inherit;font-size:12px;background:#fff;margin-bottom:8px}
      .professional-control-popover .absence-panel textarea{min-height:52px;resize:vertical}
      .professional-control-popover .absence-panel .confirm-absence{width:100%;background:#7139ef;color:#fff;border-color:#7139ef;text-align:center;margin-top:2px}
      .professional-control-popover .absence-panel .cancel-absence{width:100%;text-align:center;margin-top:6px}
      .professional-control-popover .occurrence-summary{margin-top:9px;padding:8px 9px;border-radius:8px;background:#fff7f5;border:1px solid #f3d2cd;font-size:10px;color:#6f6878}
      .professional-control-popover .occurrence-summary strong{display:block;color:#b42318;font-size:11px}
      .professional-control-popover .edit-occurrence{width:100%;text-align:center;margin-top:7px}
      .professional-day-status{display:inline-flex;align-items:center;gap:5px;margin-top:6px;font-size:11px;font-weight:600;color:#667085}
      .professional-day-status .status-dot{width:7px;height:7px;border-radius:50%;background:#98a2b3}
      .professional-day-status.is-working .status-dot{background:#159957}.professional-day-status.is-late .status-dot{background:#d97706}.professional-day-status.is-absent .status-dot{background:#d92d20}
      .professional-header-control{cursor:pointer;position:relative}.professional-header-control:hover{background:#faf8ff}
      .professional-absent-period{background:#fff7f5!important}.professional-absence-marker{display:block;margin-top:4px;font-size:10px;font-weight:700;color:#b42318;line-height:1.2}
    `;
    document.head.appendChild(style);
  }

  function renderAbsencePanel(pop,name,record){
    const panel=pop.querySelector('#absencePanel');
    if(!panel)return;
    panel.hidden=false;
    const type=panel.querySelector('#absenceType').value;
    const interruption=type==='during_day';
    panel.querySelector('#interruptionFields').hidden=!interruption;
    panel.querySelector('#otherReasonField').hidden=panel.querySelector('#absenceReason').value!=='Outro motivo';
  }

  function openControl(name,anchor){
    if(!PROFESSIONALS.includes(name))return;
    ensureStyles();
    removePopover();
    const record=getRecord(name);
    const status=statusMap[record.status]||statusMap.unregistered;
    const date=dateKey().split('-').reverse().join('/');
    const occurrence=record.absenceType?`<div class="occurrence-summary"><strong>${record.absenceType==='during_day'?'Interrupção do expediente':'Ausência registrada'}</strong><span>${escapeHtml(record.absenceReason||'Sem motivo informado')}${record.absenceStart?` · a partir de ${escapeHtml(record.absenceStart)}`:''}</span></div><button type="button" class="edit-occurrence" data-edit-occurrence>Alterar ocorrência</button>`:'';
    const pop=document.createElement('div');
    pop.className='professional-control-popover';
    pop.setAttribute('role','dialog');
    pop.setAttribute('aria-label',`Controle de ${name}`);
    pop.innerHTML=`
      <div class="popover-title">${escapeHtml(name)}</div>
      <div class="popover-date">Controle do dia · ${date}</div>
      <div class="popover-status">Status: <strong>${status.label}</strong></div>
      <div class="popover-actions">
        <button type="button" class="action-success" data-prof-action="working"><strong>Marcar presença</strong><small>Registra a entrada da profissional.</small></button>
        <button type="button" class="action-warning" data-prof-action="late"><strong>Registrar atraso</strong><small>Registra chegada fora do horário.</small></button>
        <button type="button" class="action-danger" data-prof-action="absent"><strong>Registrar ausência</strong><small>Não compareceu ou interrompeu o expediente.</small></button>
      </div>
      ${occurrence}
      <div class="absence-panel" id="absencePanel" hidden>
        <label for="absenceType">Tipo de ausência</label>
        <select id="absenceType">
          <option value="full_no_show">Não compareceu</option>
          <option value="full_notice">Ausência com aviso prévio</option>
          <option value="during_day">Interrupção do expediente</option>
        </select>
        <div id="interruptionFields" hidden>
          <label for="absenceStart">Horário de saída</label>
          <input id="absenceStart" type="time" value="${escapeHtml(record.absenceStart||nowTime())}">
          <label for="absenceReason">Motivo</label>
          <select id="absenceReason">
            <option>Emergência médica</option>
            <option>Mal-estar</option>
            <option>Imprevisto pessoal</option>
            <option>Outro motivo</option>
          </select>
          <div id="otherReasonField" hidden>
            <label for="otherReason">Justificativa</label>
            <textarea id="otherReason" placeholder="Descreva o motivo."></textarea>
          </div>
        </div>
        <button type="button" class="confirm-absence" data-confirm-absence>Salvar</button>
        <button type="button" class="cancel-absence" data-cancel-absence>Cancelar</button>
      </div>`;

    document.body.appendChild(pop);
    activePopover=pop;
    positionPopover(pop,anchor||document.getElementById('professionalFilter'));

    pop.querySelectorAll('[data-prof-action]').forEach(btn=>btn.addEventListener('click',()=>{
      const action=btn.dataset.profAction;
      if(action==='absent'){renderAbsencePanel(pop,name,record);return;}
      const current=getRecord(name);
      if(action==='working'){
        saveRecord(name,{status:'working',presenceStart:current.presenceStart||nowTime(),presenceEnd:null,absenceType:null,absenceStart:null,absenceReason:null});
      }else if(action==='late'){
        saveRecord(name,{status:'late',lateStart:nowTime(),absenceType:null,absenceStart:null,absenceReason:null});
      }
    }));

    pop.querySelector('#absenceType')?.addEventListener('change',()=>renderAbsencePanel(pop,name,record));
    pop.querySelector('#absenceReason')?.addEventListener('change',()=>renderAbsencePanel(pop,name,record));
    pop.querySelector('[data-confirm-absence]')?.addEventListener('click',()=>{
      const type=pop.querySelector('#absenceType').value;
      const current=getRecord(name);
      if(type==='during_day'){
        const start=pop.querySelector('#absenceStart').value||nowTime();
        const reason=pop.querySelector('#absenceReason').value;
        const other=pop.querySelector('#otherReason')?.value.trim()||'';
        saveRecord(name,{status:'absent',absenceType:type,absenceStart:start,absenceReason:reason==='Outro motivo'?(other||'Outro motivo'):reason,presenceStart:current.presenceStart||'09:00',presenceEnd:start});
      }else{
        saveRecord(name,{status:'absent',absenceType:type,absenceStart:null,absenceReason:type==='full_notice'?'Ausência com aviso prévio':'Não compareceu',presenceEnd:null});
      }
    });
    pop.querySelector('[data-cancel-absence]')?.addEventListener('click',()=>{
      pop.querySelector('#absencePanel').hidden=true;
    });
    pop.querySelector('[data-edit-occurrence]')?.addEventListener('click',()=>{
      renderAbsencePanel(pop,name,getRecord(name));
      const current=getRecord(name);
      if(current.absenceType)pop.querySelector('#absenceType').value=current.absenceType;
      renderAbsencePanel(pop,name,current);
      if(current.absenceType==='during_day')pop.querySelector('#absenceStart').value=current.absenceStart||nowTime();
    });
  }

  function saveRecord(name,record){
    const data=read();
    data[keyFor(name)]={...getRecord(name),...record,updatedAt:new Date().toISOString()};
    save(data);
    renderHeaderStatuses();
    renderAgendaMarkers();
    removePopover();
    openControl(name,document.getElementById('professionalFilter'));
  }

  function renderHeaderStatuses(){
    const grid=document.querySelector('#agendaGrid');
    if(!grid||renderingHeaders)return;
    renderingHeaders=true;
    grid.querySelectorAll('thead th:not(.time-col):not(.sos-col)').forEach(th=>{
      const nameEl=th.querySelector('.professional-name');
      if(!nameEl)return;
      const name=nameEl.textContent.trim();
      if(!PROFESSIONALS.includes(name))return;
      th.classList.add('professional-header-control');
      th.setAttribute('tabindex','0');
      th.setAttribute('role','button');
      th.setAttribute('aria-label',`Abrir controle de ${name}`);
      const s=statusMap[getRecord(name).status]||statusMap.unregistered;
      let statusEl=th.querySelector('.professional-day-status');
      if(!statusEl){statusEl=document.createElement('span');statusEl.className='professional-day-status';th.appendChild(statusEl);}
      statusEl.className=`professional-day-status is-${s.className}`;
      statusEl.innerHTML=`<i class="status-dot" aria-hidden="true"></i>${s.label}`;
      if(!th.dataset.profControlBound){
        th.dataset.profControlBound='1';
        th.addEventListener('click',e=>{if(e.target.closest('button,a'))return;openControl(name,document.getElementById('professionalFilter'));});
        th.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openControl(name,document.getElementById('professionalFilter'));}});
      }
    });
    renderingHeaders=false;
  }

  function renderAgendaMarkers(){
    const grid=document.querySelector('#agendaGrid');
    if(!grid)return;
    grid.querySelectorAll('.professional-absence-marker').forEach(el=>el.remove());
    grid.querySelectorAll('.professional-absent-period').forEach(el=>el.classList.remove('professional-absent-period'));
    grid.querySelectorAll('tbody tr').forEach(row=>{
      const timeCell=row.querySelector('th.time-col');
      if(!timeCell)return;
      const time=timeCell.textContent.trim();
      [...grid.querySelectorAll('thead th')].forEach((th,index)=>{
        const name=th.querySelector('.professional-name')?.textContent.trim();
        if(!name||!PROFESSIONALS.includes(name))return;
        const record=getRecord(name);
        if(!record.absenceStart||record.absenceType!=='during_day'||minutes(time)<minutes(record.absenceStart))return;
        const cell=row.children[index];
        if(!cell)return;
        cell.classList.add('professional-absent-period');
        const marker=document.createElement('span');
        marker.className='professional-absence-marker';
        marker.textContent=`Ausente desde ${record.absenceStart} · ${record.absenceReason||'Ocorrência registrada'}`;
        cell.appendChild(marker);
      });
    });
  }

  function bindProfessionalFilter(){
    const filter=document.getElementById('professionalFilter');
    if(!filter||filter.dataset.controlBound)return;
    filter.dataset.controlBound='1';
    filter.addEventListener('change',()=>{
      const name=filter.value.trim();
      if(PROFESSIONALS.includes(name))openControl(name,filter);
    });
    filter.addEventListener('click',()=>{
      const name=filter.value.trim();
      if(PROFESSIONALS.includes(name))setTimeout(()=>openControl(name,filter),0);
    });
  }

  function queueRender(){
    if(renderQueued)return;
    renderQueued=true;
    requestAnimationFrame(()=>{renderQueued=false;renderHeaderStatuses();renderAgendaMarkers();});
  }

  function observeGrid(){
    const grid=document.querySelector('#agendaGrid');
    if(!grid)return;
    renderHeaderStatuses();
    renderAgendaMarkers();
    bindProfessionalFilter();
    if(gridObserver)gridObserver.disconnect();
    gridObserver=new MutationObserver(()=>queueRender());
    gridObserver.observe(grid,{childList:true,subtree:true});
  }

  document.addEventListener('click',e=>{
    if(activePopover&&!activePopover.contains(e.target)&&!e.target.closest('#professionalFilter'))removePopover();
  });
  window.addEventListener('resize',()=>{if(activePopover)positionPopover(activePopover,document.getElementById('professionalFilter'));});
  window.addEventListener('scroll',()=>{if(activePopover)positionPopover(activePopover,document.getElementById('professionalFilter'));},true);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(observeGrid,250));
})();
