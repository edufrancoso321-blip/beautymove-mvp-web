const STORAGE_KEY = 'beautymove.mvp.profile';

function getProfile() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
  catch { return null; }
}

function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

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

function continueToRole(role) {
  window.location.href = `${role}.html`;
}

function bindRoleButtons() {
  document.querySelectorAll('[data-role]').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = `cadastro.html?perfil=${button.dataset.role}`;
    });
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

function setupSalonAgenda() {
  if (document.body.dataset.role !== 'salao') return;

  const modal = document.querySelector('#appointmentModal');
  const openButtons = [document.querySelector('#newAppointmentBtn'), document.querySelector('#quickAppointmentBtn')].filter(Boolean);
  const closeButtons = modal?.querySelectorAll('[data-close-modal]') || [];
  const form = document.querySelector('#appointmentForm');
  const dateLabel = document.querySelector('#agendaDate');
  let currentDate = new Date();

  const formatDate = (date) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date);
  const renderDate = () => { if (dateLabel) dateLabel.textContent = formatDate(currentDate); };
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
      const [time] = cell.dataset.slot.split('-');
      const timeField = document.querySelector('#appointmentTime');
      if (timeField && [...timeField.options].some((option) => option.value === time)) timeField.value = time;
      openModal();
    });
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const target = [...document.querySelectorAll('[data-slot]')].find((cell) => cell.dataset.slot === `${data.appointmentTime}-${data.professionalName}` && cell.textContent.trim() === 'Livre');
    if (target) {
      target.classList.add('appointment');
      target.innerHTML = `<strong>${data.clientName}</strong><span>${data.serviceName}</span>`;
    }
    closeModal();
    form.reset();
  });

  renderDate();
}

document.addEventListener('DOMContentLoaded', () => {
  bindRoleButtons();
  setupRegistration();
  setupDashboard();
  setupSalonAgenda();
});
