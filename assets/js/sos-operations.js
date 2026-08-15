(function () {
  if (!document.querySelector('#sosForm')) return;

  const CONTEXT_KEY = 'beautymove.mvp.sosContext';
  const SERVICES_KEY = 'beautymove.mvp.services';
  const context = (() => { try { return JSON.parse(localStorage.getItem(CONTEXT_KEY) || 'null'); } catch { return null; } })();
  const field = id => document.querySelector(id);
  const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const getServices = () => {
    try { return JSON.parse(localStorage.getItem(SERVICES_KEY) || '[]'); } catch { return []; }
  };

  const serviceInput = field('#service');
  const valueInput = field('#value');
  const services = getServices().filter(item => item.status !== 'inativo');

  if (serviceInput && services.length) {
    const select = document.createElement('select');
    select.id = 'service';
    select.name = 'service';
    select.required = true;
    select.innerHTML = '<option value="">Selecione o serviço</option>' + services.map(service => `<option value="${esc(service.id)}">${esc(service.name)} — ${money(service.value)}</option>`).join('');
    serviceInput.replaceWith(select);

    const syncValue = () => {
      const service = services.find(item => item.id === select.value);
      if (valueInput && !context?.appointmentId) valueInput.value = service ? Number(service.value).toFixed(2).replace('.', ',') : '';
    };
    select.addEventListener('change', syncValue);
    window.__beautymoveSosService = () => services.find(item => item.id === select.value) || null;

    if (context?.serviceId && services.some(item => item.id === context.serviceId)) select.value = context.serviceId;
    else if (context?.service) {
      const match = services.find(item => item.name.toLowerCase() === String(context.service).toLowerCase());
      if (match) select.value = match.id;
    }
  }

  if (context) {
    if (field('#date') && context.date) field('#date').value = context.date;
    if (field('#time') && context.time) field('#time').value = context.time;
    if (field('#value') && context.value != null) {
      field('#value').value = Number(context.value).toFixed(2).replace('.', ',');
      field('#value').readOnly = true;
      field('#value').setAttribute('aria-readonly', 'true');
      field('#value').style.background = '#f8f7fb';
      field('#value').style.cursor = 'not-allowed';
    } else if (window.__beautymoveSosService) {
      const selected = window.__beautymoveSosService();
      if (selected && field('#value')) field('#value').value = Number(selected.value).toFixed(2).replace('.', ',');
    }
    const intro = document.querySelector('.form-head p');
    if (intro) intro.textContent = `S.O.S. vinculado ao atendimento de ${context.client || 'cliente'} às ${context.time || ''}. O serviço e o valor permanecem vinculados ao atendimento original.`;
  }

  const form = document.querySelector('#sosForm');
  form?.addEventListener('submit', event => {
    if (context?.appointmentId && window.__beautymoveSosService) {
      const selected = window.__beautymoveSosService();
      if (selected) {
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'serviceId';
        hidden.value = selected.id;
        form.appendChild(hidden);
      }
    }
  }, true);

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