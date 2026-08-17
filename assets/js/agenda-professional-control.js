/* Controle operacional das profissionais dentro da Agenda. */
(function(){
  const KEY='beautymove.mvp.professional.daily-status';
  const PROFESSIONALS=['Ana','Bruna','Paula','Carla'];
  const statusMap={
    unregistered:{label:'Sem registro',className:'unregistered'},
    working:{label:'Trabalhando',className:'working'},
    late:{label:'Atrasada',className:'late'},
    absent:{label:'Ausente',className:'absent'},
    unavailable:{label:'Indisponível',className:'unavailable'}
  };
  let activeModal=null;
  let renderingHeaders=false;
  let gridObserver=null;
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
  function getAppointments(name){
    try{
      const state=JSON.parse(localStorage.getItem('beautymove.mvp.state')||'null')||{};
      return (state.appointments||[]).filter(a=>a.date===dateKey()&&a.professional===name&&a.status!=='cancelado').sort((a,b)=>String(a.time).localeCompare(String(b.time)));
    }catch{return [];}
  }

  function ensureModal(){
    let modal=document.getElementById('professionalControlModal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.className='modal professional-control-modal';
    modal.id='professionalControlModal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<div class="modal-backdrop" data-prof-close></div>
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="professionalControlTitle">
        <button class="modal-close" type="button" aria-label="Fechar" data-prof-close>×</button>
        <div class="eyebrow">CONTROLE DA PROFISSIONAL</div>
        <h2 id="professionalControlTitle">Profissional</h2>
        <p class="modal-intro" id="professionalControlIntro">Controle operacional da profissional no dia.</p>
        <div id="professionalControlBody"></div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-prof-close]').forEach(el=>el.addEventListener('click',closeModal));
    return modal;
  }

  function closeModal(){
    const modal=document.getElementById('professionalControlModal');
    if(!modal)return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    activeModal=null;
  }

  function openModal(name){
    if(!PROFESSIONALS.includes(name))return;
    const modal=ensureModal();
    const body=modal.querySelector('#professionalControlBody');
    const title=modal.querySelector('#professionalControlTitle');
    const intro=modal.querySelector('#professionalControlIntro');
    const status=statusMap[getStatus(name)]||statusMap.unregistered;
    const appointments=getAppointments(name);
    title.textContent=name;
    intro.textContent='Controle a situação da profissional e veja os atendimentos afetados no dia.';
    body.innerHTML=`
      <div class="professional-status-card">
        <div class="status-main ${status.className}"><i class="status-dot" aria-hidden="true"></i><div><div class="status-label">${status.label}</div><div class="status-date">${dateKey().split('-').reverse().join('/')}</div></div></div>
      </div>
      <div class="professional-actions">
        <button class="professional-action action-success" data-prof-action="working">Marcar presença<small>Confirma que a profissional veio trabalhar.</small></button>
        <button class="professional-action action-warning" data-prof-action="late">Registrar atraso<small>Indica que chegou ou chegará atrasada.</small></button>
        <button class="professional-action action-danger" data-prof-action="absent">Registrar ausência<small>Marca a profissional como ausente no dia selecionado.</small></button>
        <button class="professional-action" data-prof-action="unavailable">Marcar indisponível<small>Bloqueia a disponibilidade operacional no dia selecionado.</small></button>
        <button class="professional-action action-primary" data-prof-action="appointments">Ver atendimentos do dia<small>${appointments.length} atendimento(s) encontrado(s).</small></button>
        ${status.className==='absent'&&appointments.length?'<button class="professional-action action-primary" data-prof-action="replacement">Buscar substituto<small>Encaminha os atendimentos afetados para o fluxo S.O.S. Profissionais.</small></button>':''}
      </div>
      ${status.className==='absent'&&appointments.length?'<div class="absence-warning">Esta ausência afeta atendimentos programados para o dia selecionado.</div>':''}
      <div class="professional-day-list" id="professionalDayList" hidden></div>`;
    body.querySelectorAll('[data-prof-action]').forEach(btn=>btn.addEventListener('click',()=>handleAction(name,btn.dataset.profAction)));
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    activeModal=modal;
  }

  function handleAction(name,action){
    if(['working','late','absent','unavailable'].includes(action)){
      const data=read();
      data[keyFor(name)]=action;
      save(data);
      renderHeaderStatuses();
      openModal(name);
      return;
    }
    if(action==='appointments'){
      const list=document.getElementById('professionalDayList');
      if(!list)return;
      const appointments=getAppointments(name);
      list.hidden=false;
      list.innerHTML=`<h3>Atendimentos do dia</h3>${appointments.length?appointments.map(a=>`<div class="professional-appointment-row"><div><strong>${escapeHtml(a.client||'Cliente')}</strong><span>${escapeHtml(a.service||'Serviço')}</span></div><span>${escapeHtml(a.time||'')} ${typeof agendaAppointmentEnd==='function'?'– '+escapeHtml(agendaAppointmentEnd(a)):''}</span></div>`).join(''):'<div class="professional-appointment-row"><span>Nenhum atendimento programado.</span></div>'}`;
      return;
    }
    if(action==='replacement'){
      closeModal();
      const sos=document.querySelector('.sos-header-button');
      if(sos)sos.click();
      else if(typeof window.openSosModal==='function')window.openSosModal();
      else{
        const notice=document.getElementById('agendaNotice');
        if(notice){notice.textContent='Ausência registrada. Abra o S.O.S. Profissionais para buscar um substituto.';notice.hidden=false;setTimeout(()=>notice.hidden=true,4500);}
      }
    }
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
      const s=statusMap[getStatus(name)]||statusMap.unregistered;
      let statusEl=th.querySelector('.professional-day-status');
      if(!statusEl){statusEl=document.createElement('span');statusEl.className='professional-day-status';th.appendChild(statusEl);}
      statusEl.className=`professional-day-status is-${s.className}`;
      statusEl.innerHTML=`<i class="status-dot" aria-hidden="true"></i>${s.label}`;
      if(!th.dataset.profControlBound){
        th.dataset.profControlBound='1';
        th.addEventListener('click',e=>{if(e.target.closest('button,a'))return;openModal(name);});
        th.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openModal(name);}});
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
      if(PROFESSIONALS.includes(name))openModal(name);
    });
  }

  function queueHeaderRender(){
    if(renderQueued)return;
    renderQueued=true;
    requestAnimationFrame(()=>{
      renderQueued=false;
      renderHeaderStatuses();
    });
  }

  function mutationNeedsHeaderRender(mutations){
    return mutations.some(m=>{
      if(m.type!=='childList')return false;
      return [...m.addedNodes,...m.removedNodes].some(node=>{
        if(node.nodeType!==1)return false;
        const el=node;
        return el.matches('table,thead,tbody,tr') || !!el.querySelector?.('.professional-name');
      });
    });
  }

  function observeGrid(){
    const grid=document.querySelector('#agendaGrid');
    if(!grid)return;
    renderHeaderStatuses();
    if(gridObserver)gridObserver.disconnect();
    gridObserver=new MutationObserver(mutations=>{
      if(renderingHeaders)return;
      if(mutationNeedsHeaderRender(mutations))queueHeaderRender();
    });
    gridObserver.observe(grid,{childList:true,subtree:true});
    bindProfessionalFilter();
  }

  document.addEventListener('DOMContentLoaded',()=>setTimeout(observeGrid,250));
})();
