(function () {
  if (document.body.dataset.role !== 'salao') return;

  const SOS_CONTEXT_KEY = 'beautymove.mvp.sosContext';
  const PROFESSIONALS_KEY = 'beautymove.mvp.professionals';
  const SERVICES_KEY = 'beautymove.mvp.services';

  const DEFAULT_SERVICES = [
    { id: 'svc-corte', name: 'Corte', category: 'Cabelos', value: 80, status: 'ativo' },
    { id: 'svc-coloracao', name: 'Coloração', category: 'Cabelos', value: 150, status: 'ativo' },
    { id: 'svc-manicure', name: 'Manicure', category: 'Mãos e Pés', value: 55, status: 'ativo' },
    { id: 'svc-pedicure', name: 'Pedicure', category: 'Mãos e Pés', value: 60, status: 'ativo' },
    { id: 'svc-limpeza-pele', name: 'Limpeza de pele', category: 'Estética', value: 120, status: 'ativo' }
  ];

  const esc = value => String(value ?? '').replace(/[&<>'\"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
  const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const state = () => window.getState ? getState() : { appointments: [], opportunities: [], transactions: [] };
  const save = mutator => window.updateState ? updateState(mutator) : null;
  const open = modal => { modal?.classList.add('is-open'); modal?.setAttribute('aria-hidden', 'false'); };
  const close = modal => { modal?.classList.remove('is-open'); modal?.setAttribute('aria-hidden', 'true'); };

  function getServices() {
    try {
      const stored = JSON.parse(localStorage.getItem(SERVICES_KEY) || 'null');
      if (Array.isArray(stored) && stored.length) return stored;
    } catch (_) {}
    localStorage.setItem(SERVICES_KEY, JSON.stringify(DEFAULT_SERVICES));
    return [...DEFAULT_SERVICES];
  }

  function saveServices(list) {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(list));
  }

  function getProfessionals() {
    try {
      const stored = JSON.parse(localStorage.getItem(PROFESSIONALS_KEY) || 'null');
      if (Array.isArray(stored) && stored.length) return stored;
    } catch (_) {}
    return [
      { name: 'Ana', specialty: 'Cabelos' },
      { name: 'Bruna', specialty: 'Cabelos' },
      { name: 'Paula', specialty: 'Mãos e Pés' },
      { name: 'Carla', specialty: 'Estética' }
    ];
  }

  function saveProfessionals(list) {
    localStorage.setItem(PROFESSIONALS_KEY, JSON.stringify(list));
  }

  const detailModal = document.querySelector('#appointmentDetailModal');
  const financeModal = document.querySelector('#financeModal');
  const professionalModal = document.querySelector('#professionalModal');
  const appointmentModal = document.querySelector('#appointmentModal');
  const detailBody = document.querySelector('#appointmentDetailBody');
  const financeBody = document.querySelector('#financeBody');

  document.addEventListener('click', event => {
    if (event.target.closest('[data-close-operation-modal]')) {
      close(detailModal); close(financeModal); close(professionalModal);
    }
  });

  function setupServiceCatalog() {
    const form = document.querySelector('#appointmentForm');
    const oldField = document.querySelector('#serviceName');
    const valueField = document.querySelector('#serviceValue');
    if (!form || !oldField || !valueField) return;

    const select = document.createElement('select');
    select.id = 'serviceName';
    select.name = 'serviceName';
    select.required = true;
    select.autocomplete = 'off';
    oldField.replaceWith(select);

    function refreshOptions(keepValue = '') {
      const services = getServices().filter(service => service.status !== 'inativo');
      select.innerHTML = '<option value="">Selecione o serviço</option>' + services
        .map(service => `<option value="${esc(service.id)}">${esc(service.name)} — ${money(service.value)}</option>`)
        .join('');
      if (keepValue && services.some(service => service.id === keepValue)) select.value = keepValue;
      syncValue();
    }

    function syncValue() {
      const service = getServices().find(item => item.id === select.value);
      valueField.value = service ? Number(service.value).toFixed(2).replace('.', ',') : '';
      valueField.readOnly = true;
      valueField.setAttribute('aria-readonly', 'true');
      valueField.placeholder = 'Selecione o serviço';
    }

    select.addEventListener('change', event => {
      event.stopPropagation();
      syncValue();
    });

    refreshOptions();
    window.__beautymoveRefreshServices = () => refreshOptions(select.value);

    const section = document.createElement('section');
    section.className = 'section service-catalog-section';
    section.innerHTML = `
      <div class="section-head">
        <div>
          <div class="eyebrow">CADASTRO DO SALÃO</div>
          <h2>Tabela de serviços e valores</h2>
          <p>O valor atual é usado em novos agendamentos. Alterações futuras não mudam solicitações já registradas.</p>
        </div>
      </div>
      <div class="table-shell">
        <table class="data-table service-catalog-table">
          <thead><tr><th>Serviço</th><th>Categoria</th><th>Valor</th><th>Ação</th></tr></thead>
          <tbody id="serviceCatalogBody"></tbody>
        </table>
      </div>`;

    document.querySelector('#agenda')?.parentElement?.insertBefore(section, document.querySelector('.operational-section'));
    const body = section.querySelector('#serviceCatalogBody');

    function renderCatalog() {
      body.innerHTML = getServices().map(service => `
        <tr>
          <td><strong>${esc(service.name)}</strong></td>
          <td>${esc(service.category)}</td>
          <td>${money(service.value)}</td>
          <td><button type="button" class="secondary compact" data-edit-service="${esc(service.id)}">Alterar valor</button></td>
        </tr>`).join('');

      body.querySelectorAll('[data-edit-service]').forEach(button => button.addEventListener('click', () => {
        const services = getServices();
        const service = services.find(item => item.id === button.dataset.editService);
        if (!service) return;
        const nextValue = window.prompt(`Novo valor para ${service.name}:`, String(Number(service.value).toFixed(2).replace('.', ',')));
        if (nextValue === null) return;
        const numeric = Number(String(nextValue).replace(/\./g, '').replace(',', '.'));
        if (!Number.isFinite(numeric) || numeric < 0) return;
        service.value = numeric;
        saveServices(services);
        window.__beautymoveRefreshServices?.();
        renderCatalog();
      }));
    }

    renderCatalog();
  }

  function currentAgendaDate() {
    return window.__beautymoveAgendaDate ? window.__beautymoveAgendaDate() : localDateKey();
  }

  function findAppointment(cell) {
    const slot = cell?.dataset?.slot || '';
    const separator = slot.indexOf('-');
    if (separator < 0) return null;
    const time = slot.slice(0, separator);
    const professional = slot.slice(separator + 1);
    return state().appointments.find(item => item.date === currentAgendaDate() && item.time === time && item.professional === professional) || null;
  }

  function renderAgenda() {
    const appointments = state().appointments;
    document.querySelectorAll('[data-slot]').forEach(cell => {
      const appointment = appointments.find(item => {
        const slot = cell.dataset.slot || '';
        return item.date === currentAgendaDate() && `${item.time}-${item.professional}` === slot;
      });
      if (appointment) {
        cell.classList.add('appointment');
        cell.innerHTML = `<strong>${esc(appointment.client)}</strong><span>${esc(appointment.service)}</span>`;
      } else if (!cell.classList.contains('appointment')) {
        cell.innerHTML = 'Livre';
      }
    });
  }

  function openFreeSlot(cell) {
    const time = (cell.dataset.slot || '').split('-')[0];
    const timeField = document.querySelector('#appointmentTime');
    if (timeField && [...timeField.options].some(option => option.value === time)) timeField.value = time;
    open(appointmentModal);
    document.querySelector('#clientName')?.focus();
  }

  function showDetail(appointment) {
    const status = appointment.status || 'agendado';
    const label = { agendado:'Agendado', confirmado:'Confirmado', em_atendimento:'Em atendimento', concluido:'Finalizado', cancelado:'Cancelado' }[status] || status;
    let actions = '';
    if (status === 'agendado' || status === 'confirmado') {
      actions = `<button class="secondary compact" type="button" data-action="cancel">Cancelar</button><button class="secondary compact" type="button" data-action="sos">Acionar S.O.S.</button><button class="primary compact" type="button" data-action="start">Iniciar atendimento</button>`;
    } else if (status === 'em_atendimento') {
      actions = `<button class="primary compact" type="button" data-action="finish">Finalizar atendimento</button>`;
    } else if (status === 'concluido') {
      actions = `<button class="primary compact" type="button" data-action="finance">Abrir financeiro</button>`;
    }

    detailBody.innerHTML = `
      <div class="operation-detail">
        <div class="operation-summary"><span class="eyebrow">ATENDIMENTO</span><h2>${esc(appointment.client)}</h2><p>${esc(appointment.service)} · ${esc(appointment.professional)} · ${esc(appointment.time)}</p><span class="status">${esc(label)}</span></div>
        <div class="operation-info"><div><small>Profissional</small><strong>${esc(appointment.professional)}</strong></div><div><small>Serviço</small><strong>${esc(appointment.service)}</strong></div><div><small>Valor</small><strong>${money(appointment.value)}</strong></div></div>
        <div class="operation-actions">${actions}</div>
      </div>`;

    detailBody.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => handleAction(button.dataset.action, appointment.id)));
    open(detailModal);
  }

  function handleAction(action, id) {
    const appointment = state().appointments.find(item => item.id === id);
    if (!appointment) return;

    if (action === 'cancel') {
      save(next => { const item = next.appointments.find(entry => entry.id === id); if (item) item.status = 'cancelado'; });
      close(detailModal);
      renderAgenda();
      return;
    }

    if (action === 'start') {
      save(next => { const item = next.appointments.find(entry => entry.id === id); if (item) { item.status = 'em_atendimento'; item.startedAt = new Date().toISOString(); } });
      showDetail({ ...appointment, status: 'em_atendimento' });
      renderAgenda();
      return;
    }

    if (action === 'finish') {
      save(next => { const item = next.appointments.find(entry => entry.id === id); if (item) { item.status = 'concluido'; item.finishedAt = new Date().toISOString(); } });
      const updated = state().appointments.find(item => item.id === id);
      close(detailModal);
      openFinance(updated);
      renderAgenda();
      return;
    }

    if (action === 'finance') {
      close(detailModal);
      openFinance(appointment);
      return;
    }

    if (action === 'sos') {
      localStorage.setItem(SOS_CONTEXT_KEY, JSON.stringify({
        appointmentId: id, client: appointment.client, service: appointment.service,
        serviceId: appointment.serviceId || null, value: Number(appointment.value || 0),
        date: appointment.date, time: appointment.time, professional: appointment.professional
      }));
      window.location.href = 'sos.html?origem=agenda';
    }
  }

  function openFinance(appointment) {
    if (!appointment) return;
    const value = Number(appointment.value || 0);
    financeBody.innerHTML = `
      <div class="operation-detail">
        <div class="operation-summary"><span class="eyebrow">FECHAMENTO FINANCEIRO</span><h2>${esc(appointment.client)}</h2><p>${esc(appointment.service)} · ${esc(appointment.professional)}</p></div>
        <div class="finance-grid"><div><small>Serviço</small><strong>${esc(appointment.service)}</strong></div><div><small>Valor registrado</small><strong>${money(value)}</strong></div></div>
        <div class="field"><label for="financePaymentStatus">Status financeiro</label><select id="financePaymentStatus"><option value="pendente">Pendente</option><option value="recebido">Recebido</option></select></div>
        <div class="form-actions"><button class="secondary" type="button" data-close-operation-modal>Fechar</button><button class="primary" type="button" id="saveFinanceBtn">Salvar fechamento</button></div>
      </div>`;

    financeBody.querySelector('#saveFinanceBtn').addEventListener('click', () => {
      const paymentStatus = financeBody.querySelector('#financePaymentStatus').value;
      save(next => {
        const item = next.appointments.find(entry => entry.id === appointment.id);
        if (item) item.financeStatus = paymentStatus;
        const existing = next.transactions.find(transaction => transaction.appointmentId === appointment.id);
        if (existing) { existing.value = value; existing.status = paymentStatus; }
        else next.transactions.push({ id: makeId('txn'), appointmentId: appointment.id, type: 'receita', value, status: paymentStatus });
      });
      close(financeModal);
    });

    open(financeModal);
  }

  function setupAppointmentForm() {
    const form = document.querySelector('#appointmentForm');
    if (!form) return;

    form.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const data = Object.fromEntries(new FormData(form).entries());
      const service = getServices().find(item => item.id === data.serviceName);
      if (!service) {
        document.querySelector('#serviceName')?.focus();
        return;
      }

      const appointment = {
        id: makeId('apt'),
        date: currentAgendaDate(),
        time: data.appointmentTime,
        professional: data.professionalName,
        client: data.clientName.trim(),
        service: service.name,
        serviceId: service.id,
        value: Number(service.value),
        status: 'agendado',
        source: 'salao'
      };

      save(next => next.appointments.push(appointment));
      form.reset();
      close(appointmentModal);
      renderAgenda();
    }, true);
  }

  function setupCells() {
    document.querySelectorAll('[data-slot]').forEach(cell => cell.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const appointment = findAppointment(cell);
      if (appointment) showDetail(appointment);
      else openFreeSlot(cell);
    }, true));
  }

  function setupProfessional() {
    document.querySelector('#addProfessionalBtn')?.addEventListener('click', () => open(professionalModal));
    document.querySelector('#professionalForm')?.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const data = Object.fromEntries(new FormData(event.target).entries());
      const list = getProfessionals();
      if (data.name?.trim() && !list.some(person => person.name.toLowerCase() === data.name.trim().toLowerCase())) {
        list.push({ name: data.name.trim(), specialty: data.specialty });
        saveProfessionals(list);
      }
      close(professionalModal);
      event.target.reset();
    }, true);
  }

  function setupDateBridge() {
    window.__beautymoveAgendaDate = function () {
      const label = document.querySelector('#agendaDate')?.textContent || '';
      const match = label.match(/(\d{1,2}) de (.+)/i);
      const now = new Date();
      if (!match) return localDateKey(now);
      const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      const month = months.indexOf(match[2].toLowerCase());
      return month < 0 ? localDateKey(now) : localDateKey(new Date(now.getFullYear(), month, Number(match[1])));
    };

    ['prevDay', 'nextDay', 'todayBtn'].forEach(id => document.querySelector(`#${id}`)?.addEventListener('click', () => {
      setTimeout(renderAgenda, 0);
    }));
  }

  setupDateBridge();
  setupServiceCatalog();
  setupAppointmentForm();
  setupCells();
  setupProfessional();
  renderAgenda();
})();