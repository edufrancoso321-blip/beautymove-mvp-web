(function () {
  if (!document.querySelector('#sosForm')) return;

  const CONTEXT_KEY = 'beautymove.mvp.sosContext';
  const context = (() => { try { return JSON.parse(localStorage.getItem(CONTEXT_KEY) || 'null'); } catch { return null; } })();
  const field = id => document.querySelector(id);

  if (context) {
    if (field('#service') && context.service) field('#service').value = context.service;
    if (field('#date') && context.date) field('#date').value = context.date;
    if (field('#time') && context.time) field('#time').value = context.time;
    const intro = document.querySelector('.form-head p');
    if (intro) intro.textContent = `S.O.S. vinculado ao atendimento de ${context.client || 'cliente'} às ${context.time || ''}. Escolha um profissional para substituir ou complementar o atendimento.`;
  }

  document.querySelectorAll('.select-professional').forEach(button => button.addEventListener('click', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const professional = button.closest('.card')?.querySelector('h2')?.textContent?.trim() || 'Profissional';
    const state = getState();
    const latest = state.opportunities.at(-1);
    if (latest) {
      updateState(next => {
        const opportunity = next.opportunities.find(item => item.id === latest.id);
        if (opportunity) { opportunity.status = 'aceita'; opportunity.acceptedBy = professional; }
        if (context?.appointmentId) {
          const appointment = next.appointments.find(item => item.id === context.appointmentId);
          if (appointment) {
            appointment.professional = professional;
            appointment.status = 'confirmado';
            appointment.source = 'sos';
          }
        }
      });
    } else if (context?.appointmentId) {
      updateState(next => {
        const appointment = next.appointments.find(item => item.id === context.appointmentId);
        if (appointment) { appointment.professional = professional; appointment.status = 'confirmado'; appointment.source = 'sos'; }
      });
    }
    localStorage.removeItem(CONTEXT_KEY);
    button.disabled = true;
    button.textContent = 'Profissional confirmado';
    setTimeout(() => { window.location.href = 'salao.html'; }, 500);
  }, true));
})();
