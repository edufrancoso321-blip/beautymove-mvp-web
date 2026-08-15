(function () {
  if (document.body?.dataset?.role !== 'salao') return;

  const STATE_KEY = 'beautymove.mvp.state';
  const SERVICES_KEY = 'beautymove.mvp.services';
  const PROFESSIONALS_KEY = 'beautymove.mvp.professionals';
  const SOS_CONTEXT_KEY = 'beautymove.mvp.sosContext';

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const money = value => Number(value || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const dateKey = date => {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const state = () => ({ appointments:[], opportunities:[], transactions:[], ...read(STATE_KEY,{}) });
  const getProfessionals = () => {
    const saved = read(PROFESSIONALS_KEY, null);
    return Array.isArray(saved) && saved.length ? saved : [
      {name:'Ana', specialty:'Cabelos'}, {name:'Bruna', specialty:'Cabelos'},
      {name:'Paula', specialty:'Mãos e Pés'}, {name:'Carla', specialty:'Estética'}
    ];
  };
  const getServices = () => {
    const saved = read(SERVICES_KEY, []);
    return Array.isArray(saved) ? saved.filter(s => s.status !== 'inativo') : [];
  };
  const getProfessional = name => getProfessionals().find(p => p.name === name) || {};
  const servicesFor = name => {
    const specialty = getProfessional(name).specialty;
    return getServices().filter(s => !specialty || s.category === specialty);
  };

  let activeDate = new Date();
  let installed = false;

  const style = document.createElement('style');
  style.textContent = `
    .single-form-menu { padding:0 !important; overflow:hidden !important; max-height:none !important; }
    .single-form-service-list { max-height:240px; overflow:auto; padding:7px; }
    .service-picker-actions { display:flex; justify-content:flex-end; gap:8px; padding:10px; border-top:1px solid #eee7f5; background:#fff; position:sticky; bottom:0; }
    .single-agenda-form .operation-actions { margin-top:4px; }
    .single-form-actions { align-items:center; }
  `;
  document.head.appendChild(style);

  function openModal() {
    const modal = document.querySelector('#appointmentDetailModal');
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal() {
    const modal = document.querySelector('#appointmentDetailModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
  }

  function renderServiceSelector(container, professional) {
    const services = servicesFor(professional);
    let selectedIds = [];
    let confirmed = false;
    let draftIds = [];

    container.innerHTML = `
      <button type="button" class="service-picker-trigger" aria-expanded="false">
        <span class="service-picker-label">Selecione os serviços</span>
        <span class="service-picker-arrow">⌄</span>
      </button>
      <div class="service-picker-menu single-form-menu" hidden>
        <div class="single-form-service-list">
          ${services.map(s => `
            <label class="service-option">
              <input type="checkbox" value="${esc(s.id)}">
              <span>${esc(s.name)}</span>
              <strong>${money(s.value)}</strong>
            </label>`).join('')}
        </div>
        <div class="service-picker-actions">
          <button type="button" class="secondary compact" data-service-cancel>Cancelar</button>
          <button type="button" class="primary compact" data-service-confirm>Confirmar serviços</button>
        </div>
      </div>`;

    const trigger = container.querySelector('.service-picker-trigger');
    const menu = container.querySelector('.service-picker-menu');
    const label = container.querySelector('.service-picker-label');
    const valueInput = container.closest('.modal-card')?.querySelector('#singleFormServiceValue');

    const total = ids => services.filter(s => ids.includes(s.id)).reduce((sum,s) => sum + Number(s.value || 0), 0);
    const updateSummary = () => {
      const picked = services.filter(s => selectedIds.includes(s.id));
      label.textContent = picked.length === 0 ? 'Selecione os serviços' : picked.length === 1 ? picked[0].name : `${picked.length} serviços selecionados`;
      if (valueInput) valueInput.value = total(selectedIds).toFixed(2).replace('.',',');
    };
    const openMenu = () => {
      draftIds = [...selectedIds];
      menu.querySelectorAll('input').forEach(input => { input.checked = draftIds.includes(input.value); });
      menu.hidden = false;
      trigger.setAttribute('aria-expanded','true');
    };
    const closeMenu = () => {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded','false');
    };

    trigger.onclick = () => menu.hidden ? openMenu() : closeMenu();
    menu.querySelectorAll('input').forEach(input => input.onchange = () => {
      draftIds = input.checked ? [...new Set([...draftIds, input.value])] : draftIds.filter(id => id !== input.value);
    });
    menu.querySelector('[data-service-cancel]').onclick = closeMenu;
    menu.querySelector('[data-service-confirm]').onclick = () => {
      selectedIds = [...draftIds];
      confirmed = true;
      updateSummary();
      closeMenu();
    };

    container._getSelection = () => ({
      confirmed,
      ids: [...selectedIds],
      services: services.filter(s => selectedIds.includes(s.id)),
      total: total(selectedIds)
    });
    updateSummary();
  }

  function saveAppointment({client, professional, date, time, selection}) {
    const s = state();
    const snapshot = selection.services.map(service => ({
      id: service.id,
      name: service.name,
      value: Number(service.value || 0),
      category: service.category
    }));
    s.appointments.push({
      id: `apt-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      date, time, professional, client: client.trim(),
      service: snapshot.map(x => x.name).join(' + '),
      serviceId: snapshot[0]?.id || null,
      serviceIds: snapshot.map(x => x.id),
      services: snapshot,
      value: Number(selection.total || 0),
      status: 'agendado', source: 'salao'
    });
    write(STATE_KEY, s);
  }

  function renderSingleForm(time, professional) {
    const body = document.querySelector('#appointmentDetailBody');
    if (!body) return;
    const date = activeDate;
    const specialty = getProfessional(professional).specialty || 'Serviços';

    body.innerHTML = `
      <div class="operation-detail single-agenda-form">
        <div class="operation-summary">
          <span class="eyebrow">NOVO AGENDAMENTO</span>
          <h2>Agendar cliente</h2>
          <p>${esc(professional)} · ${esc(date.toLocaleDateString('pt-BR'))} · ${esc(time)}</p>
          <span class="status">Horário livre · ${esc(specialty)}</span>
        </div>
        <div class="operation-info">
          <div><small>Profissional</small><strong>${esc(professional)}</strong></div>
          <div><small>Data</small><strong>${esc(date.toLocaleDateString('pt-BR'))}</strong></div>
          <div><small>Horário</small><strong>${esc(time)}</strong></div>
        </div>
        <div class="form-grid compact-form">
          <div class="field full">
            <label for="singleFormClient">Cliente</label>
            <input id="singleFormClient" type="text" placeholder="Nome da cliente" autocomplete="off">
          </div>
          <div class="field full">
            <label>Serviços</label>
            <div class="service-picker" id="singleFormServicePicker"></div>
          </div>
          <div class="field full">
            <label for="singleFormServiceValue">Valor total dos serviços (R$)</label>
            <input id="singleFormServiceValue" readonly aria-readonly="true" value="0,00">
          </div>
        </div>
        <div class="operation-actions single-form-actions">
          <button class="secondary compact" type="button" data-single-cancel>Cancelar</button>
          <button class="primary compact" type="button" data-single-save>Adicionar à agenda</button>
          <button class="sos-subtle compact" type="button" data-single-sos>S.O.S. Profissionais</button>
        </div>
      </div>`;

    const picker = body.querySelector('#singleFormServicePicker');
    renderServiceSelector(picker, professional);

    body.querySelector('[data-single-cancel]').onclick = closeModal;
    body.querySelector('[data-single-save]').onclick = () => {
      const client = body.querySelector('#singleFormClient').value.trim();
      const selection = picker._getSelection();
      if (!client) { body.querySelector('#singleFormClient').focus(); return; }
      if (!selection.confirmed || !selection.services.length) return;
      saveAppointment({ client, professional, date:dateKey(date), time, selection });
      closeModal();
      window.location.reload();
    };
    body.querySelector('[data-single-sos]').onclick = () => {
      const selection = picker._getSelection();
      write(SOS_CONTEXT_KEY, {
        date: dateKey(date), time, professional, source:'agenda-slot',
        serviceIds: selection.ids,
        services: selection.services.map(s => ({id:s.id,name:s.name,value:Number(s.value||0),category:s.category})),
        service: selection.services.map(s => s.name).join(' + '),
        value: selection.total
      });
      window.location.href = 'sos.html?origem=agenda&horario=selecionado';
    };

    openModal();
    setTimeout(() => body.querySelector('#singleFormClient')?.focus(), 40);
  }

  function getSlotFromCell(cell) {
    const [time, ...rest] = String(cell.dataset.slot || '').split('-');
    return { time, professional: rest.join('-') };
  }

  function isOccupied(time, professional) {
    const current = dateKey(activeDate);
    return state().appointments.some(a => a.date === current && a.time === time && a.professional === professional && a.status !== 'cancelado');
  }

  function syncDateFromNavigation(button) {
    if (!button) return;
    const id = button.id;
    if (id === 'todayBtn') activeDate = new Date();
    if (id === 'prevDay') activeDate = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate() - 1);
    if (id === 'nextDay') activeDate = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate() + 1);
  }

  function install() {
    if (installed) return;
    installed = true;
    const agenda = document.querySelector('#agenda');
    if (!agenda) return;

    document.addEventListener('click', event => {
      const navButton = event.target.closest('#todayBtn, #prevDay, #nextDay');
      if (navButton) syncDateFromNavigation(navButton);
    }, true);

    agenda.addEventListener('click', event => {
      const cell = event.target.closest('td[data-slot]');
      if (!cell) return;
      const {time, professional} = getSlotFromCell(cell);
      if (isOccupied(time, professional)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      renderSingleForm(time, professional);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
