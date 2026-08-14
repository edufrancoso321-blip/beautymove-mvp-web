const STORAGE_KEY = 'beautymove.mvp.profile';

function getProfile() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
  catch { return null; }
}

function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function roleLabel(role) {
  return ({
    salao: 'Salão',
    profissional: 'Profissional',
    cliente: 'Cliente'
  })[role] || '';
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

  if (title) title.textContent = role === 'salao' ? 'Agenda do salão' : `Área do ${roleLabel(role).toLowerCase()}`;
  if (subtitle) subtitle.textContent = `Olá, ${name}. Esta é a base operacional do seu BeautyMove.`;
}

document.addEventListener('DOMContentLoaded', () => {
  bindRoleButtons();
  setupRegistration();
  setupDashboard();
});
