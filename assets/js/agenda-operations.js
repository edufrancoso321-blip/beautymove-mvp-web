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
  const getProfessionals = () => {
    try { return JSON.parse(localStorage.getItem(PROFESSIONALS_KEY) || 'null') || [
      { name: 'Ana', specialty: 'Cabelos' },
      { name: 'Bruna', specialty: 'Cabelos' },
      { name: 'Paula', specialty: 'Mãos e Pés' },
      { name: 'Carla', specialty: 'Estética' }
    ]; } catch { return []; }
  };
  const saveProfessionals = (list) => localStorage.setItem(PROFESSIONALS_KEY, JSON.stringify(list));
  const getServices = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(SERVICES_KEY) || 'null');
      if (Array.isArray(stored) && stored.length) return stored;
    } catch {}
    localStorage.setItem(SERVICES_KEY, JSON.stringify(DEFAULT_SERVICES));
    return [...DEFAULT_SERVICES];
  };
  const saveServices = (list) => localStorage.setItem(SERVICES_KEY, JSON.stringify(list));
  const state = () => window.getState ? getState() : { appointments: [], opportunities: [], transactions: [] };
  const save = (mutator) => window.updateState ? updateState(mutator) : null;
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const detailModal = document.querySelector('#appointmentDetailModal');
  const financeModal = document.querySelector('#financeModal');
  const professionalModal = document.querySelector('#professionalModal');
  const detailBody = document.querySelector('#appointmentDetailBody');
  const financeBody = document.querySelector('#financeBody');

  function open(modal) { modal?.classList.add('is-open'); modal?.setAttribute('aria-hidden', 'false'); }
  function close(modal) { modal?.classList.remove('is-open'); modal?.setAttribute('aria-hidden', 'true'); }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-close-operation-modal]')) {
      close(detailModal); close(financeModal); close(professionalModal);
    }
  });

  function setupServiceCatalog() {
    const services = getServices();
    const appointmentForm = document.querySelector('#appointmentForm');
    const serviceField = document.querySelector('#serviceName');
    const valueField = document.querySelector('#serviceValue');
    if (!appointmentForm || !serviceField || !valueField) return;

    const select = document.createElement('select');
    select.id = 'serviceName';
    select.name = 'serviceName';
    select.required = true;
    select.innerHTML = '<option value="">Selecione o serviço</option>' + services.filter(s => s.status !== 'inativo').map(service => `<option value="${esc(service.id)}">${esc(service.name)} — ${money(service.value)}</option>`).join('');
    serviceField.replaceWith(select);

    valueField.readOnly = true;
    valueField.setAttribute('aria-readonly', 'true');
    valueField.placeholder = 'Selecione o serviço';
    valueField.style.background = '#f8f7fb';
    valueField.style.cursor = 'not-allowed';

    const syncValue = () => {
      const service = getServices().find(item => item.id === select.value);
      valueField.value = service ? Number(service.value).toFixed(2).replace('.', ',') : '';
    };
    select.addEventListener('change', syncValue);

    const section = document.createElement('section');
    section.className = 'section service-catalog-section';
    section.innerHTML = `<div class="section-head"><div><div class="eyebrow">CADASTRO DO SALÃO</div><h2>Tabela de serviços e valores</h2><p>O valor definido aqui é usado nos novos agendamentos. Alterações futuras não mudam solicitações ou atendimentos já registrados.</p></div></div><div class="table-shell"><table class="data-table service-catalog-table"><thead><tr><th>Serviço</th><th>Categoria</th><th>Valor</th><th>Ação</th></tr></thead><tbody id="serviceCatalogBody"></tbody></table></div>`;
    document.querySelector('#agenda')?.parentElement?.insertBefore(section, document.querySelector('.operational-section'));
    const body = section.querySelector('#serviceCatalogBody');

    function renderCatalog() {
      const current = getServices();
      body.innerHTML = current.map(service => `<tr><td><strong>${esc(service.name)}</strong></td><td>${esc(service.category)}</td><td><span data-service-value-label="${esc(service.id)}">${money(service.value)}</span></td><td><button type="button" class="secondary compact" data-edit-service="${esc(service.id)}">Alterar valor</button></td></tr>`).join('');
      body.querySelectorAll('[data-edit-service]').forEach(button => button.addEventListener('click', () => {
        const id = button.dataset.editService;
        const currentServices = getServices();
        const service = currentServices.find(item => item.id === id);
        if (!service) return;
        const nextValue = window.prompt(`Novo valor para ${service.name}:`, String(Number(service.value).toFixed(2).replace('.', ',')));
        if (nextValue === null) return;
        const numeric = Number(String(nextValue).replace(/\./g, '').replace(',', '.'));
        if (!Number.isFinite(numeric) || numeric < 0) return;
        service.value = numeric;
        saveServices(currentServices);
        setupServiceOptions();
        renderCatalog();
      }));
    }
    function setupServiceOptions() {
      const current = getServices();
      select.innerHTML = '<option value="">Selecione o serviço</option>' + current.filter(s => s.status !== 'inativo').map(service => `<option value="${esc(service.id)}">${esc(service.name)} — ${money(service.value)}</option>`).join('');
      syncValue();
    }
    window.__beautymoveRefreshServices = setupServiceOptions;
    renderCatalog();
  }

  function findAppointmentFromCell(cell) {
    const slot = cell?.dataset?.slot || '';
    const dash = slot.indexOf('-');
    const time = dash > -1 ? slot.slice(0, dash) : '';
    const professional = dash > -1 ? slot.slice(dash + 1) : '';
    const date = window.__beautymoveAgendaDate ? window.__beautymoveAgendaDate() : localDateKey();
    const existing = state().appointments.find(a => a.date === date && a.time === time && a.professional === professional);
    if (existing) return existing;

    if (cell.classList.contains('appointment')) {
      const client = cell.querySelector('strong')?.textContent?.trim() || 'Cliente';
      const service = cell.querySelector('span')?.textContent?.trim() || 'Serviço';
      const serviceCatalog = getServices().find(item => item.name.toLowerCase() === service.toLowerCase());
      const demo = { id: `agenda-${date}-${time}-${professional}`, date, time, professional, client, service, serviceId: serviceCatalog?.id || null, value: serviceCatalog ? Number(serviceCatalog.value) : 0, status: 'agendado', source: 'agenda-demo' };
      save(next => { if (!next.appointments.some(a => a.id === demo.id)) next.appointments.push(demo); });
      return demo;
    }
    return null;
  }

  function showFreeSlot(cell) {
    const time = (cell.dataset.slot || '').split('-')[0];
    const timeField = document.querySelector('#appointmentTime');
    if (timeField && [...timeField.options].some(o => o.value === time)) timeField.value = time;
    const modal = document.querySelector('#appointmentModal');
    modal?.classList.add('is-open'); modal?.setAttribute('aria-hidden', 'false');
    document.querySelector('#clientName')?.focus();
  }

  function renderDetail(appointment) {
    const status = appointment.status || 'agendado';
    const statusLabel = { agendado: 'Agendado', confirmado: 'Confirmado', em_atendimento: 'Em atendimento', concluido: 'Finalizado', cancelado: 'Cancelado' }[status] || status;
    let actions = '';
    if (status === 'agendado' || status === 'confirmado') {
      actions = `<button class="secondary compact" type="button" data-action="cancel">Cancelar</button><button class="secondary compact" type="button" data-action="sos">Acionar S.O.S.</button><button class="primary compact" type="button" data-action="start">Iniciar atendimento</button>`;
    } else if (status === 'em_atendimento') {
      actions = `<button class="primary compact" type="button" data-action="finish">Finalizar atendimento</button>`;
    } else if (status === 'concluido') {
      actions = `<button class="primary compact" type="button" data-action="finance">Abrir financeiro</button>`;
    }
    detailBody.innerHTML = `<div class="operation-detail"><div class="operation-summary"><span class="eyebrow">ATENDIMENTO</span><h2>${esc(appointment.client)}</h2><p>${esc(appointment.service)} · ${esc(appointment.professional)} · ${esc(appointment.time)}</p><span class="status">${esc(statusLabel)}</span></div><div class="operation-info"><div><small>Profissional</small><strong>${esc(appointment.professional)}</strong></div><div><small>Serviço</small><strong>${esc(appointment.service)}</strong></div><div><small>Valor</small><strong>${money(appointment.value)}</strong></div></div><div class="operation-actions">${actions}</div></div>`;
    detailBody.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => handleAction(btn.dataset.action, appointment.id)));
    open(detailModal);
  }

  function handleAction(action, id) {
    const current = state().appointments.find(a => a.id === id);
    if (!current) return;
    if (action === 'cancel') { save(next => { const a = next.appointments.find(x => x.id === id); if (a) a.status = 'cancelado'; }); close(detailModal); window.location.reload(); return; }
    if (action === 'start') { save(next => { const a = next.appointments.find(x => x.id === id); if (a) { a.status = 'em_atendimento'; a.startedAt = new Date().toISOString(); } }); renderDetail({ ...current, status: 'em_atendimento' }); return; }
    if (action === 'finish') { save(next => { const a = next.appointments.find(x => x.id === id); if (a) { a.status = 'concluido'; a.finishedAt = new Date().toISOString(); } }); const updated = state().appointments.find(a => a.id === id); close(detailModal); openFinance(updated); return; }
    if (action === 'finance') { close(detailModal); openFinance(current); return; }
    if (action === 'sos') { localStorage.setItem(SOS_CONTEXT_KEY, JSON.stringify({ appointmentId: id, client: current.client, service: current.service, serviceId: current.serviceId || null, value: Number(current.value || 0), date: current.date, time: current.time, professional: current.professional })); window.location.href = 'sos.html?origem=agenda'; }
  }

  function openFinance(appointment) {
    const value = Number(appointment.value || 0);
    financeBody.innerHTML = `<div class="operation-detail"><div class="operation-summary"><span class="eyebrow">FECHAMENTO FINANCEIRO</span><h2>${esc(appointment.client)}</h2><p>${esc(appointment.service)} · ${esc(appointment.professional)}</p></div><div class="finance-grid"><div><small>Serviço</small><strong>${esc(appointment.service)}</strong></div><div><small>Valor registrado</small><strong>${money(value)}</strong></div></div><div class="field"><label for="financePaymentStatus">Status financeiro</label><select id="financePaymentStatus"><option value="pendente">Pendente</option><option value="recebido">Recebido</option></select></div><div class="form-actions"><button class="secondary" type="button" data-close-operation-modal>Fechar</button><button class="primary" type="button" id="saveFinanceBtn">Salvar fechamento</button></div></div>`;
    financeBody.querySelector('#saveFinanceBtn').addEventListener('click', () => {
      const paymentStatus = financeBody.querySelector('#financePaymentStatus').value;
      save(next => {
        const a = next.appointments.find(x => x.id === appointment.id);
        if (a) a.financeStatus = paymentStatus;
        const existing = next.transactions.find(t => t.appointmentId === appointment.id);
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
      if (!service) return;
      const currentDate = window.__beautymoveAgendaDate ? window.__beautymoveAgendaDate() : localDateKey();
      const appointment = { id: makeId('apt'), date: currentDate, time: data.appointmentTime, professional: data.professionalName, client: data.clientName, service: service.name, serviceId: service.id, value: Number(service.value), status: 'agendado', source: 'salao' };
      save(next => next.appointments.push(appointment));
      window.__beautymoveRefreshServices?.();
      form.reset();
      document.querySelector('#appointmentModal')?.classList.remove('is-open');
      document.querySelector('#appointmentModal')?.setAttribute('aria-hidden', 'true');
      window.location.reload();
    }, true);
  }

  document.querySelectorAll('[data-slot]').forEach(cell => cell.addEventListener('click', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const appointment = findAppointmentFromCell(cell);
    if (appointment) renderDetail(appointment); else showFreeSlot(cell);
  }, true));

  document.querySelector('#addProfessionalBtn')?.addEventListener('click', () => open(professionalModal));
  document.querySelector('#professionalForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    const list = getProfessionals();
    if (!list.some(p => p.name.toLowerCase() === data.name.trim().toLowerCase())) list.push({ name: data.name.trim(), specialty: data.specialty });
    saveProfessionals(list);
    close(professionalModal); event.target.reset();
    window.location.reload();
  });

  window.__beautymoveAgendaDate = function () {
    const label = document.querySelector('#agendaDate')?.textContent || '';
    const now = new Date();
    const match = label.match(/(\d{1,2}) de (.+)/i);
    if (!match) return localDateKey(now);
    const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const month = months.indexOf(match[2].toLowerCase());
    if (month < 0) return localDateKey(now);
    return localDateKey(new Date(now.getFullYear(), month, Number(match[1])));
  };

  setupServiceCatalog();
  setupAppointmentForm();
})();