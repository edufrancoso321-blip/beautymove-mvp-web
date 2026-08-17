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
    const picker=document.getElementById('agendaDatePicker');
    if(picker?.value)return picker.value;
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function keyFor(name){return `${dateKey()}::${name}`;}
  function getStatus(name){return read()[keyFor(name)]||'unregistered';}
  function escapeHtml(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}

  function removePopover(){
    if(activePopover){activePopover.remove();activePopover=null;}
  }

  function positionPopover(popover,anchor){
    const r=anchor.getBoundingClientRect();
    const gap=8;
    const width=Math.min(360,Math.max(300,window.innerWidth-r.left-16));
    popover.style.width=`${width}px`;
    popover.style.left=`${Math.max(8,Math.min(r.left,window.innerWidth-width-8))}px`;
    popover.style.top=`${r.bottom+gap}px`;
  }

  function ensurePopoverStyles(){
    if(document.getElementById('professionalControlPopoverStyles'))return;
    const style=document.createElement('style');
    style.id='professionalControlPopoverStyles';
    style.textContent=`
      .professional-control-popover{position:fixed;z-index:10050;background:#fff;border:1px solid #e5def4;border-radius:12px;box-shadow:0 14px 34px rgba(32,18,65,.16);padding:16px;color:#17131f;font-family:inherit;}
      .professional-control-popover .popover-title{font-size:17px;font-weight:800;margin:0 0 3px;}
      .professional-control-popover .popover-date{font-size:12px;color:#6f6878;margin-bottom:12px;}
      .professional-control-popover .popover-status{font-size:12px;padding:8px 10px;border-radius:8px;background:#faf9fc;margin-bottom:12px;color:#5f5968;}
      .professional-control-popover .popover-actions{display:grid;gap:8px;}
      .professional-control-popover button{font:inherit;text-align:left;cursor:pointer;background:#fff;border:1px solid #e4dfeb;border-radius:9px;padding:10px 12px;}
      .professional-control-popover button:hover{background:#faf8ff;border-color:#7b3ff2;}
      .professional-control-popover button strong{display:block;font-size:14px;}
      .professional-control-popover button small{display:block;font-size:11px;color:#746d7d;margin-top:2px;}
      .professional-control-popover .action-success{border-color:#b9dfca;}.professional-control-popover .action-success strong{color:#147a4d;}
      .professional-control-popover .action-warning{border-color:#ecd49c;}.professional-control-popover .action-warning strong{color:#a86a00;}
      .professional-control-popover .action-danger{border-color:#efc2c2;}.professional-control-popover .action-danger strong{color:#c62828;}
      .professional-control-popover .absence-options{margin-top:10px;padding-top:10px;border-top:1px solid #eee8f2;}
      .professional-control-popover .absence-options h4{font-size:12px;margin:0 0 8px;color:#4d4657;}
      .professional-control-popover .absence-choice{display:flex;align-items:center;gap:8px;padding:7px 4px;font-size:12px;cursor:pointer;}
      .professional-control-popover .absence-choice input{accent-color:#7139ef;}
      .professional-control-popover textarea{width:100%;box-sizing:border-box;min-height:58px;resize:vertical;border:1px solid #ddd6e6;border-radius:8px;padding:8px;font:inherit;font-size:12px;margin-top:7px;}
      .professional-control-popover .confirm-absence{width:100%;margin-top:8px;background:#7139ef;color:#fff;border-color:#7139ef;text-align:center;}
      .professional-control-popover .confirm-absence:hover{background:#6330dc;color:#fff;}
    `;
    document.head.appendChild(style);
  }

  function openControl(name,anchor){
    if(!PROFESSIONALS.includes(name))return;
    ensurePopoverStyles();
    removePopover();
    const pop=document.createElement('div');
    pop.className='professional-control-popover';
    pop.setAttribute('role','dialog');
    pop.setAttribute('aria-label',`Controle de ${name}`);
    const status=statusMap[getStatus(name)]||statusMap.unregistered;
    const date=dateKey().split('-').reverse().join('/');
    pop.innerHTML=`
      <div class="popover-title">${escapeHtml(name)}</div>
      <div class="popover-date">Controle de hoje · ${date}</div>
      <div class="popover-status">Status: <strong>${status.label}</strong></div>
      <div class="popover-actions">
        <button type="button" class="action-success" data-prof-action="working"><strong>Marcar presença</strong><small>Confirma que veio trabalhar normalmente.</small></button>
        <button type="button" class="action-warning" data-prof-action="late"><strong>Registrar atraso</strong><small>Registra que veio, mas chegou atrasada.</small></button>
        <button type="button" class="action-danger" data-prof-action="absent"><strong>Registrar ausência</strong><small>Registra a ausência no dia selecionado.</small></button>
      </div>
      <div class="absence-options" id="absenceOptions" hidden>
        <h4>Motivo da ausência</h4>
        <label class="absence-choice"><input type="radio" name="absenceReason" value="aviso_previo" checked> Ausência com aviso prévio</label>
        <label class="absence-choice"><input type="radio" name="absenceReason" value="nao_compareceu"> Não compareceu</label>
        <label class="absence-choice"><input type="radio" name="absenceReason" value="outro"> Outro motivo</label>
        <textarea id="absenceJustification" placeholder="Justificativa / observação (opcional)"></textarea>
        <button type="button" class="confirm-absence" data-confirm-absence>Registrar ausência</button>
      </div>`;
    document.body.appendChild(pop);
    positionPopover(pop,anchor||document.getElementById('professionalFilter'));
    activePopover=pop;

    pop.querySelectorAll('[data-prof-action]').forEach(btn=>btn.addEventListener('click',()=>{
      const action=btn.dataset.profAction;
      if(action==='absent'){
        pop.querySelector('#absenceOptions').hidden=false;
        pop.querySelector('#absenceOptions').scrollIntoView({block:'nearest'});
        return;
      }
      setStatus(name,action);
    }));
    pop.querySelector('[data-confirm-absence]')?.addEventListener('click',()=>{
      const reason=pop.querySelector('input[name="absenceReason"]:checked')?.value||'aviso_previo';
      const justification=pop.querySelector('#absenceJustification')?.value.trim()||'';
      const data=read();
      data[keyFor(name)]={status:'absent',reason,justification,updatedAt:new Date().toISOString()};
      save(data);
      renderHeaderStatuses();
      removePopover();
    });
  }

  function setStatus(name,action){
    const data=read();
    data[keyFor(name)]={status:action,updatedAt:new Date().toISOString()};
    save(data);
    renderHeaderStatuses();
    removePopover();
  }

  function getStoredStatus(name){
    const raw=getStatus(name);
    if(typeof raw==='string')return raw;
    return raw?.status||'unregistered';
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
      const s=statusMap[getStoredStatus(name)]||statusMap.unregistered;
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

  function bindProfessionalFilter(){
    const filter=document.getElementById('professionalFilter');
    if(!filter||filter.dataset.controlBound)return;
    filter.dataset.controlBound='1';
    filter.addEventListener('change',()=>{
      const name=filter.value.trim();
      if(PROFESSIONALS.includes(name))openControl(name,filter);
    });
  }

  function queueHeaderRender(){
    if(renderQueued)return;
    renderQueued=true;
    requestAnimationFrame(()=>{renderQueued=false;renderHeaderStatuses();});
  }

  function mutationNeedsHeaderRender(mutations){
    return mutations.some(m=>m.type==='childList'&&[...m.addedNodes,...m.removedNodes].some(node=>{
      if(node.nodeType!==1)return false;
      return node.matches('table,thead,tbody,tr')||!!node.querySelector?.('.professional-name');
    }));
  }

  function observeGrid(){
    const grid=document.querySelector('#agendaGrid');
    if(!grid)return;
    renderHeaderStatuses();
    if(gridObserver)gridObserver.disconnect();
    gridObserver=new MutationObserver(mutations=>{if(!renderingHeaders&&mutationNeedsHeaderRender(mutations))queueHeaderRender();});
    gridObserver.observe(grid,{childList:true,subtree:true});
    bindProfessionalFilter();
  }

  document.addEventListener('click',e=>{
    if(activePopover&&!activePopover.contains(e.target)&&!e.target.closest('#professionalFilter'))removePopover();
  });
  window.addEventListener('resize',()=>{if(activePopover)positionPopover(activePopover,document.getElementById('professionalFilter'));});
  window.addEventListener('scroll',()=>{if(activePopover)positionPopover(activePopover,document.getElementById('professionalFilter'));},true);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(observeGrid,250));
})();
