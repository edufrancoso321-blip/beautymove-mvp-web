const PROFILE_KEY = 'beautymove.mvp.profile';
const STATE_KEY = 'beautymove.mvp.state';

const EMPTY_STATE = { appointments: [], opportunities: [], transactions: [] };

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

function getProfile() { return readJson(PROFILE_KEY, null); }
function saveProfile(profile) { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
function getState() { return { ...EMPTY_STATE, ...readJson(STATE_KEY, EMPTY_STATE) }; }
function saveState(state) { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
function updateState(mutator) { const state = getState(); mutator(state); saveState(state); return state; }
function makeId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function roleLabel(role) {
  return ({ salao: 'Salão', profissional: 'Profissional', cliente: 'Cliente' })[role] || '';
}

function roleFromQuery() {
  const value = new URLSearchParams(window.location.search).get('perfil');
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('sala')) return 'salao';
  if (normalized.includes('prof')) return 'profissional';
  if (normalized.includes('clien')) return 'cliente';
  return null;
}

function continueToRole(role) { window.location.href = `${role}.html`; }

function bindRoleButtons() {
  document.querySelectorAll('[data-role]').forEach((button) => {
    button.addEventListener('click', () => { window.location.href = `cadastro.html?perfil=${button.dataset.role}`; });
  });
}

function setupRegistration() {
  const role = roleFromQuery();
  const form = document.querySelector('#registrationForm');
  const title = document.querySelector('#registrationTitle');
  const description = document.querySelector('#registrationDescription');
  const roleField = document.querySelector('#role');
  if (!form || !role) return;

  const labels = {
    salao: ['Cadastre seu salão', 'Comece pelo cadastro básico do estabelecimento.'],
    profissional: ['Cadastre seu perfil profissional', 'Comece pelo cadastro básico para receber oportunidades.'],
    cliente: ['Cadastre seu perfil', 'Comece pelo cadastro básico para usar o BeautyMove.']
  };
  title.textContent = labels[role][0];
  description.textContent = labels[role][1];
  roleField.value = role;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.role = role;
    saveProfile(data);
    continueToRole(role);
  });
}

function setupDashboard() {
  const role = document.body.dataset.role;
  if (!role) return;
  const profile = getProfile();
  const title = document.querySelector('#dashboardTitle');
  const subtitle = document.querySelector('#dashboardSubtitle');
  const name = profile?.nome || profile?.nomeSalao || roleLabel(role);
  if (title && role !== 'salao') title.textContent = `Área do ${roleLabel(role).toLowerCase()}`;
  if (subtitle && role !== 'salao') subtitle.textContent = `Olá, ${name}. Esta é a base operacional do seu BeautyMove.`;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function setupSalonAgenda() {
  if (document.body.dataset.role !== 'salao') return;
  const modal = document.querySelector('#appointmentModal');
  const openButtons = [document.querySelector('#newAppointmentBtn'), document.querySelector('#quickAppointmentBtn')].filter(Boolean);
  const closeButtons = modal?.querySelectorAll('[data-close-modal]') || [];
  const form = document.querySelector('#appointmentForm');
  const dateLabel = document.querySelector('#agendaDate');
  let currentDate = new Date();

  const formatDate = (date) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date);
  const renderDate = () => { if (dateLabel) dateLabel.textContent = formatDate(currentDate); renderAppointments(); };
  const openModal = () => { if (modal) { modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); document.querySelector('#clientName')?.focus(); } };
  const closeModal = () => { if (modal) { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); } };

  openButtons.forEach((button) => button.addEventListener('click', openModal));
  closeButtons.forEach((button) => button.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
  document.querySelector('#prevDay')?.addEventListener('click', () => { currentDate.setDate(currentDate.getDate() - 1); renderDate(); });
  document.querySelector('#nextDay')?.addEventListener('click', () => { currentDate.setDate(currentDate.getDate() + 1); renderDate(); });
  document.querySelector('#todayBtn')?.addEventListener('click', () => { currentDate = new Date(); renderDate(); });

  document.querySelectorAll('[data-slot]').forEach((cell) => {
    cell.addEventListener('click', () => {
      const time = cell.dataset.slot.split('-')[0];
      const timeField = document.querySelector('#appointmentTime');
      if (timeField && [...timeField.options].some((option) => option.value === time)) timeField.value = time;
      openModal();
    });
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const state = updateState((next) => {
      next.appointments.push({
        id: makeId('apt'), date: localDateKey(currentDate), time: data.appointmentTime,
        professional: data.professionalName, client: data.clientName, service: data.serviceName,
        value: Number(String(data.serviceValue || '').replace(',', '.')) || 0, status: 'agendado', source: 'salao'
      });
    });
    renderAppointments(state);
    closeModal();
    form.reset();
  });

  function renderAppointments(state = getState()) {
    const date = localDateKey(currentDate);
    document.querySelectorAll('[data-slot]').forEach((cell) => {
      cell.classList.remove('appointment');
      cell.innerHTML = 'Livre';
    });
    state.appointments.filter((appointment) => appointment.date === date).forEach((appointment) => {
      const cell = document.querySelector(`[data-slot="${CSS.escape(appointment.time + '-' + appointment.professional)}"]`);
      if (!cell) return;
      cell.classList.add('appointment');
      cell.innerHTML = `<strong>${escapeHtml(appointment.client)}</strong><span>${escapeHtml(appointment.service)}</span>`;
    });
  }

  renderDate();
}

function setupSos() {
  const form = document.querySelector('#sosForm');
  if (!form) return;
  const results = document.querySelector('#results');
  const notice = document.querySelector('#sosNotice');
  const mapButton = document.querySelector('#mapButton');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const opportunity = Object.fromEntries(new FormData(form).entries());
    opportunity.id = makeId('opp');
    opportunity.status = 'aberta';
    opportunity.createdAt = new Date().toISOString();
    updateState((state) => state.opportunities.push(opportunity));
    results.hidden = false;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (notice) { notice.hidden = false; notice.textContent = 'Busca criada. O salão pode enviar a oportunidade aos profissionais compatíveis.'; }
  });

  document.querySelectorAll('.select-professional').forEach((button) => {
    button.addEventListener('click', () => {
      const cards = [...document.querySelectorAll('.select-professional')];
      const professional = button.closest('.card')?.querySelector('h2')?.textContent?.trim() || 'Profissional';
      const latest = getState().opportunities.at(-1);
      if (latest) updateState((state) => {
        const item = state.opportunities.find((entry) => entry.id === latest.id);
        if (item) item.invited = [...new Set([...(item.invited || []), professional])];
      });
      button.disabled = true;
      button.textContent = 'Oportunidade enviada';
      if (notice) { notice.hidden = false; notice.textContent = `Oportunidade enviada para ${professional}. Aguarde a aceitação.`; }
      cards.forEach((other) => { if (other !== button) other.disabled = true; });
    });
  });

  mapButton?.addEventListener('click', () => {
    if (notice) { notice.hidden = false; notice.textContent = 'A visualização no mapa será conectada à geolocalização real na próxima camada técnica.'; }
  });
}

function setupProfessional() {
  if (document.body.dataset.role !== 'profissional') return;
  const profile = getProfile();
  const name = profile?.nome || 'Profissional';
  const state = getState();
  const opportunities = document.querySelector('#professionalOpportunities');
  const appointments = document.querySelector('#professionalAppointments');
  const total = document.querySelector('#professionalFinanceTotal');
  if (!opportunities) return;

  const render = () => {
    const open = getState().opportunities.filter((item) => item.status === 'aberta');
    opportunities.innerHTML = open.length ? open.map((item) => `
      <article class="card opportunity-card">
        <div><span class="eyebrow">NOVA OPORTUNIDADE</span><h3>${escapeHtml(item.service)}</h3><p>${escapeHtml(item.specialty)} · ${escapeHtml(item.date)} · ${escapeHtml(item.time)}</p><p>${escapeHtml(item.radius)} · R$ ${escapeHtml(item.value)}</p></div>
        <button class="primary compact" type="button" data-accept-opportunity="${item.id}">Aceitar</button>
      </article>`).join('') : '<div class="notice">Nenhuma oportunidade disponível no momento.</div>';

    const mine = getState().appointments.filter((item) => item.professional === name || item.professional === 'Profissional');
    appointments.innerHTML = mine.length ? mine.map((item) => `<tr><td>${escapeHtml(item.time)}</td><td>${escapeHtml(item.salao || 'Salão')}</td><td>${escapeHtml(item.client)}</td><td>${escapeHtml(item.service)}</td><td><span class="status">${escapeHtml(item.status || 'Agendado')}</span></td></tr>`).join('') : '<tr><td colspan="5">Nenhum agendamento confirmado.</td></tr>';
    const amount = mine.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    if (total) total.textContent = amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    opportunities.querySelectorAll('[data-accept-opportunity]').forEach((button) => button.addEventListener('click', () => acceptOpportunity(button.dataset.acceptOpportunity)));
  };

  function acceptOpportunity(id) {
    updateState((next) => {
      const opportunity = next.opportunities.find((item) => item.id === id);
      if (!opportunity || opportunity.status !== 'aberta') return;
      opportunity.status = 'aceita';
      opportunity.acceptedBy = name;
      next.appointments.push({
        id: makeId('apt'), date: opportunity.date, time: opportunity.time, professional: name,
        salao: 'Salão BeautyMove', client: opportunity.client || 'Cliente', service: opportunity.service,
        value: Number(String(opportunity.value || '').replace(',', '.')) || 0, status: 'confirmado', source: 'sos'
      });
      next.transactions.push({ id: makeId('txn'), appointmentId: next.appointments.at(-1).id, type: 'receita', value: Number(String(opportunity.value || '').replace(',', '.')) || 0, status: 'previsto' });
    });
    render();
  }
  render();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

document.addEventListener('DOMContentLoaded', () => {
  bindRoleButtons();
  setupRegistration();
  setupDashboard();
  setupSalonAgenda();
  setupSos();
  setupProfessional();
});
