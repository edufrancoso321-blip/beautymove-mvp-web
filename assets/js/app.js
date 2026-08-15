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
function localDateKey(date = new Date()) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
function formatCurrency(value) { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'\"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function roleLabel(role) { return ({ salao:'Salão', profissional:'Profissional', cliente:'Cliente' })[role] || ''; }
function roleFromQuery() { const value = new URLSearchParams(window.location.search).get('perfil') || ''; const v = value.toLowerCase(); if (v.includes('sala')) return 'salao'; if (v.includes('prof')) return 'profissional'; if (v.includes('clien')) return 'cliente'; return null; }

function bindRoleButtons() {
  document.querySelectorAll('button[data-role], a[data-role], [role="button"][data-role]').forEach(button => button.addEventListener('click', () => { window.location.href = `cadastro.html?perfil=${button.dataset.role}`; }));
}
function setupRegistration() {
  const role = roleFromQuery(); const form = document.querySelector('#registrationForm');
  if (!form || !role) return;
  const title = document.querySelector('#registrationTitle'); const description = document.querySelector('#registrationDescription'); const roleField = document.querySelector('#role');
  const labels = { salao:['Cadastre seu salão','Comece pelo cadastro básico do estabelecimento.'], profissional:['Cadastre seu perfil profissional','Comece pelo cadastro básico para receber oportunidades.'], cliente:['Cadastre seu perfil','Comece pelo cadastro básico para usar o BeautyMove.'] };
  if (title) title.textContent = labels[role][0]; if (description) description.textContent = labels[role][1]; if (roleField) roleField.value = role;
  if (form.dataset.appBound === 'true') return; form.dataset.appBound = 'true';
  form.addEventListener('submit', event => { event.preventDefault(); const data = Object.fromEntries(new FormData(form).entries()); data.role = role; saveProfile(data); window.location.href = `${role}.html`; });
}
function setupDashboard() {
  const role = document.body?.dataset?.role; if (!role) return;
  const profile = getProfile(); const title = document.querySelector('#dashboardTitle'); const subtitle = document.querySelector('#dashboardSubtitle');
  const name = profile?.nome || profile?.nomeSalao || roleLabel(role);
  if (title && role !== 'salao' && role !== 'cliente') title.textContent = `Área do ${roleLabel(role).toLowerCase()}`;
  if (subtitle && role !== 'salao') subtitle.textContent = `Olá, ${name}. Esta é a base operacional do seu BeautyMove.`;
}

function setupSos() {
  const form = document.querySelector('#sosForm'); if (!form || form.dataset.appBound === 'true') return; form.dataset.appBound = 'true';
  const results = document.querySelector('#results'); const notice = document.querySelector('#sosNotice');
  form.addEventListener('submit', event => { event.preventDefault(); const opportunity = Object.fromEntries(new FormData(form).entries()); opportunity.id = makeId('opp'); opportunity.status = 'aberta'; opportunity.createdAt = new Date().toISOString(); updateState(state => state.opportunities.push(opportunity)); if (results) { results.hidden = false; results.scrollIntoView({ behavior:'smooth', block:'start' }); } if (notice) { notice.hidden = false; notice.textContent = 'Busca criada. O salão pode enviar a oportunidade aos profissionais compatíveis.'; } });
  document.querySelectorAll('.select-professional').forEach(button => button.addEventListener('click', () => {
    const professional = button.closest('.card')?.querySelector('h2')?.textContent?.trim() || 'Profissional'; const latest = getState().opportunities.at(-1);
    if (latest) updateState(state => { const item = state.opportunities.find(entry => entry.id === latest.id); if (item) item.invited = [...new Set([...(item.invited || []), professional])]; });
    button.disabled = true; button.textContent = 'Oportunidade enviada'; if (notice) { notice.hidden = false; notice.textContent = `Oportunidade enviada para ${professional}. Aguarde a aceitação.`; }
  }));
  document.querySelector('#mapButton')?.addEventListener('click', () => { if (notice) { notice.hidden = false; notice.textContent = 'A visualização no mapa será conectada à geolocalização real na próxima camada técnica.'; } });
}

function setupProfessional() {
  if (document.body?.dataset?.role !== 'profissional') return;
  const profile = getProfile(); const name = profile?.nome || 'Profissional'; const opportunities = document.querySelector('#professionalOpportunities'); const appointments = document.querySelector('#professionalAppointments');
  if (!opportunities) return;
  const render = () => {
    const state = getState(); const open = state.opportunities.filter(item => item.status === 'aberta'); const mine = state.appointments.filter(item => item.professional === name || item.professional === 'Profissional');
    const count = document.querySelector('#professionalOpportunityCount'); const today = document.querySelector('#professionalTodayCount'); const total = document.querySelector('#professionalFinanceTotal'); const detail = document.querySelector('#professionalFinanceTotalDetail');
    if (count) count.textContent = String(open.length); if (today) today.textContent = String(mine.filter(item => item.date === localDateKey()).length);
    opportunities.innerHTML = open.length ? open.map(item => `<article class="card opportunity-card"><div><span class="eyebrow">NOVA OPORTUNIDADE</span><h3>${escapeHtml(item.service)}</h3><p>${escapeHtml(item.specialty)} · ${escapeHtml(item.date)} · ${escapeHtml(item.time)}</p><p>${escapeHtml(item.radius || '')} · ${formatCurrency(String(item.value || '').replace(',', '.'))}</p></div><button class="primary compact" type="button" data-accept-opportunity="${escapeHtml(item.id)}">Aceitar</button></article>`).join('') : '<div class="notice">Nenhuma oportunidade disponível no momento.</div>';
    if (appointments) appointments.innerHTML = mine.length ? mine.map(item => `<tr><td>${escapeHtml(item.time)}</td><td>${escapeHtml(item.salao || 'Salão')}</td><td>${escapeHtml(item.client)}</td><td>${escapeHtml(item.service)}</td><td><span class="status">${escapeHtml(item.status || 'Agendado')}</span></td></tr>`).join('') : '<tr><td colspan="5">Nenhum agendamento confirmado.</td></tr>';
    const amount = mine.reduce((sum, item) => sum + (Number(item.value) || 0), 0); if (total) total.textContent = formatCurrency(amount); if (detail) detail.textContent = formatCurrency(amount);
    opportunities.querySelectorAll('[data-accept-opportunity]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.acceptOpportunity;
      updateState(next => { const opportunity = next.opportunities.find(item => item.id === id); if (!opportunity || opportunity.status !== 'aberta') return; opportunity.status = 'aceita'; opportunity.acceptedBy = name; const appointment = { id:makeId('apt'), date:opportunity.date, time:opportunity.time, professional:name, salao:'Salão BeautyMove', client:opportunity.client || 'Cliente', service:opportunity.service, value:Number(String(opportunity.value || '').replace(',', '.')) || 0, status:'confirmado', source:'sos' }; next.appointments.push(appointment); next.transactions.push({ id:makeId('txn'), appointmentId:appointment.id, type:'receita', value:appointment.value, status:'previsto' }); });
      render();
    }));
  }; render();
}

function setupClient() {
  if (document.body?.dataset?.role !== 'cliente') return;
  const profile = getProfile(); const results = document.querySelector('#clientResults'); const appointments = document.querySelector('#clientAppointments'); const searchForm = document.querySelector('#clientSearchForm'); const bookingForm = document.querySelector('#clientBookingForm'); const modal = document.querySelector('#clientBookingModal');
  const professionals = [
    { name:'Mariana', specialty:'Cabelos', service:'Corte', rating:4.89, distance:3.2, value:80, salon:'Studio BeautyMove' },
    { name:'Fernanda', specialty:'Cabelos', service:'Coloração', rating:4.78, distance:5.7, value:150, salon:'Espaço Bella' },
    { name:'Juliana', specialty:'Mãos e Pés', service:'Manicure', rating:4.72, distance:8.1, value:55, salon:'Ateliê da Beleza' },
    { name:'Carla', specialty:'Estética', service:'Limpeza de pele', rating:4.91, distance:6.4, value:120, salon:'Studio Carla' }
  ];
  let selectedProfessional = null;
  const closeModal = () => { modal?.classList.remove('is-open'); modal?.setAttribute('aria-hidden','true'); };
  document.querySelectorAll('[data-close-client-modal]').forEach(button => button.addEventListener('click', closeModal));
  function renderResults(list = professionals) {
    if (!results) return;
    results.innerHTML = list.length ? list.map(item => `<article class="card client-result"><div class="result-top"><div><div class="eyebrow">${escapeHtml(item.specialty)}</div><h2>${escapeHtml(item.name)}</h2></div><strong class="rating">${item.rating.toFixed(2)} ★★★★★</strong></div><p>${escapeHtml(item.service)} · ${escapeHtml(item.salon)}</p><p>${item.distance.toFixed(1)} km · ${formatCurrency(item.value)}</p><button class="primary compact" type="button" data-book-professional="${escapeHtml(item.name)}">Agendar</button></article>`).join('') : '<div class="notice">Nenhum profissional encontrado com esses filtros.</div>';
    results.querySelectorAll('[data-book-professional]').forEach(button => button.addEventListener('click', () => { selectedProfessional = professionals.find(item => item.name === button.dataset.bookProfessional); if (!selectedProfessional) return; document.querySelector('#bookingProfessional').value = selectedProfessional.name; document.querySelector('#bookingService').value = selectedProfessional.service; document.querySelector('#bookingValue').value = String(selectedProfessional.value); modal?.classList.add('is-open'); modal?.setAttribute('aria-hidden','false'); }));
  }
  function renderAppointments() {
    const mine = getState().appointments.filter(item => item.client === (profile?.nome || 'Cliente') || item.client === 'Cliente');
    const upcoming = document.querySelector('#clientUpcomingCount'); const history = document.querySelector('#clientHistoryCount'); const favorite = document.querySelector('#clientFavoriteCount');
    if (upcoming) upcoming.textContent = String(mine.filter(item => item.date >= localDateKey() && item.status !== 'cancelado').length); if (history) history.textContent = String(mine.filter(item => item.status === 'concluido').length); if (favorite) favorite.textContent = '0';
    if (appointments) appointments.innerHTML = mine.length ? mine.map(item => `<tr><td>${escapeHtml(item.date)}</td><td>${escapeHtml(item.time)}</td><td>${escapeHtml(item.professional)}</td><td>${escapeHtml(item.service)}</td><td>${formatCurrency(item.value)}</td><td><span class="status">${escapeHtml(item.status || 'Agendado')}</span></td></tr>`).join('') : '<tr><td colspan="6">Nenhum agendamento.</td></tr>';
  }
  searchForm?.addEventListener('submit', event => { event.preventDefault(); const data = Object.fromEntries(new FormData(searchForm).entries()); const list = professionals.filter(item => (!data.specialty || item.specialty === data.specialty) && (!data.service || item.service.toLowerCase().includes(String(data.service).toLowerCase()) || item.specialty.toLowerCase().includes(String(data.service).toLowerCase()))); renderResults(list); });
  bookingForm?.addEventListener('submit', event => { event.preventDefault(); if (!selectedProfessional) return; const data = Object.fromEntries(new FormData(bookingForm).entries()); updateState(next => next.appointments.push({ id:makeId('apt'), date:data.date, time:data.time, professional:data.professional, client:profile?.nome || 'Cliente', service:data.service, value:Number(data.value) || 0, status:'solicitado', notes:data.notes || '', salao:selectedProfessional.salon, source:'cliente' })); closeModal(); bookingForm.reset(); renderAppointments(); });
  renderResults(); renderAppointments();
}

document.addEventListener('DOMContentLoaded', () => { bindRoleButtons(); setupRegistration(); setupDashboard(); setupSos(); setupProfessional(); setupClient(); });
