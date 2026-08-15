(function () {
  if (!document.querySelector('#sosForm')) return;

  const CONTEXT_KEY = 'beautymove.mvp.sosContext';
  const SERVICES_KEY = 'beautymove.mvp.services';
  const context = (() => { try { return JSON.parse(localStorage.getItem(CONTEXT_KEY) || 'null'); } catch { return null; } })();
  const field = id => document.querySelector(id);
  const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const getServices = () => { try { return JSON.parse(localStorage.getItem(SERVICES_KEY) || '[]'); } catch { return []; } };

  const select = field('#service');
  const valueInput = field('#value');
  const storedServices = getServices().filter(item => item.status !== 'inativo');
  const fallbackServices = [
    { id: 'svc-corte', name: 'Corte', value: 80 },
    { id: 'svc-coloracao', name: 'Coloração', value: 150 },
    { id: 'svc-escova', name: 'Escova', value: 60 },
    { id: 'svc-manicure', name: 'Manicure', value: 55 },
    { id: 'svc-pedicure', name: 'Pedicure', value: 60 },
    { id: 'svc-limpeza-pele', name: 'Limpeza de pele', value: 120 }
  ];
  const services = storedServices.length ? storedServices : fallbackServices;

  if (select) {
    select.innerHTML = '<option value="">Selecione o serviço</option>' + services.map(service => `<option value="${esc(service.name)}" data-service-id="${esc(service.id)}">${esc(service.name)} — ${money(service.value)}</option>`).join('');
    const syncValue = () => {
      const selected = services.find(item => item.name === select.value);
      if (!selected || !valueInput || context?.appointmentId) return;
      valueInput.value = Number(selected.value).toFixed(2).replace('.', ',');
      valueInput.readOnly = true;
    };
    select.addEventListener('change', syncValue);
    window.__beautymoveSosService = () => services.find(item => item.name === select.value) || null;

    if (context?.serviceId) {
      const match = services.find(item => item.id === context.serviceId);
      if (match) select.value = match.name;
    } else if (context?.service) {
      const match = services.find(item => item.name.toLowerCase() === String(context.service).toLowerCase());
      if (match) select.value = match.name;
    }
    if (select.value) syncValue();
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
    }
    const intro = document.querySelector('.form-head p');
    if (intro) intro.textContent = `S.O.S. vinculado ao atendimento de ${context.client || 'cliente'} às ${context.time || ''}. O serviço e o valor permanecem vinculados ao atendimento original.`;
  }

  const form = document.querySelector('#sosForm');
  form?.addEventListener('submit', () => {
    const selected = window.__beautymoveSosService?.();
    if (!selected) return;
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'serviceId';
    hidden.value = selected.id;
    form.appendChild(hidden);
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
          if (appointment) { appointment.professional = professional; appointment.status = 'confirmado'; appointment.source = 'sos'; }
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