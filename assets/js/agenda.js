const AGENDA_STATE_KEY = 'beautymove.mvp.state';

const AGENDA_PROFESSIONALS = [
  { name: 'Ana', specialty: 'Cabelos' },
  { name: 'Bruna', specialty: 'Cabelos' },
  { name: 'Paula', specialty: 'Mãos e Pés' },
  { name: 'Carla', specialty: 'Estética' }
];

const AGENDA_SERVICES = [
  { name: 'Corte', duration: 60, value: 80 },
  { name: 'Escova', duration: 30, value: 60 },
  { name: 'Coloração', duration: 120, value: 150 },
  { name: 'Luzes', duration: 180, value: 250 },
  { name: 'Corte feminino', duration: 60, value: 80 },
  { name: 'Corte masculino', duration: 45, value: 50 },
  { name: 'Manicure', duration: 60, value: 55 },
  { name: 'Pedicure', duration: 60, value: 65 },
  { name: 'Limpeza de pele', duration: 75, value: 120 },
  { name: 'Design de sobrancelhas', duration: 45, value: 60 }
];

function agendaReadState() {
  try {
    const value = JSON.parse(localStorage.getItem(AGENDA_STATE_KEY) || 'null');
    return { appointments: [], opportunities: [], transactions: [], ...(value || {}) };
  } catch {
    return { appointments: [], opportunities: [], transactions: [] };
  }
}
function agendaSaveState(state) { localStorage.setItem(AGENDA_STATE_KEY, JSON.stringify(state)); }
function agendaId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function agendaDateKey(date) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
function agendaFormatDate(date) { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(date); }
function agendaFormatCurrency(value) { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function agendaEscape(value) { return String(value ?? '').replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' })[char]); }
function agendaMinutes(time) { const [hours, minutes] = String(time).split(':').map(Number); return hours * 60 + minutes; }
function agendaTime(minutes) { const hours = String(Math.floor(minutes / 60)).padStart(2, '0'); const mins = String(minutes % 60).padStart(2, '0'); return `${hours}:${mins}`; }
function agendaDurationLabel(minutes) { const hours = Math.floor(minutes / 60); const rest = minutes % 60; if (!hours) return `${rest}min`; if (!rest) return `${hours}h`; return `${hours}h ${rest}min`; }
function agendaNormalizeDate(value) { return value || agendaDateKey(new Date()); }
function agendaServiceSummary(appointment) { if (Array.isArray(appointment.services) && appointment.services.length) return appointment.services; if (appointment.service) return [{ name: appointment.service, duration: Number(appointment.duration) || 60, value: Number(appointment.value) || 0 }]; return []; }
function agendaAppointmentDuration(appointment) { return agendaServiceSummary(appointment).reduce((sum, service) => sum + (Number(service.duration) || 0), 0) || Number(appointment.duration) || 30; }
function agendaAppointmentValue(appointment) { return agendaServiceSummary(appointment).reduce((sum, service) => sum + (Number(service.value) || 0), 0) || Number(appointment.value) || 0; }
function agendaAppointmentEnd(appointment) { return agendaTime(agendaMinutes(appointment.time) + agendaAppointmentDuration(appointment)); }
function agendaStatusClass(status) { return ({ agendado: 'status-scheduled', confirmado: 'status-scheduled', aguardando: 'status-scheduled', em_andamento: 'status-progress', chegou: 'status-progress', concluido: 'status-finished', finalizado: 'status-finished', cancelado: 'status-canceled', sos: 'status-sos' })[status] || 'status-scheduled'; }
function agendaStatusLabel(status) { return ({ agendado: 'Agendado', confirmado: 'Agendado', aguardando: 'Agendado', em_andamento: 'Em andamento', chegou: 'Em andamento', concluido: 'Finalizado', finalizado: 'Finalizado', cancelado: 'Cancelado', sos: 'S.O.S.' })[status] || 'Agendado'; }
function agendaBuildTimes(interval) { const times = []; for (let minutes = 8 * 60; minutes <= 18 * 60; minutes += interval) times.push(agendaTime(minutes)); return times; }
function agendaOpenModal(modal) { modal?.classList.add('is-open'); modal?.setAttribute('aria-hidden', 'false'); }
function agendaCloseModal(modal) { modal?.classList.remove('is-open'); modal?.setAttribute('aria-hidden', 'true'); }

function agendaInit() {
  if (document.body.dataset.role !== 'salao') return;
  const grid = document.querySelector('#agendaGrid'); const dateLabel = document.querySelector('#agendaDate'); const intervalSelect = document.querySelector('#agendaInterval'); const datePicker = document.querySelector('#agendaDatePicker'); const appointmentModal = document.querySelector('#appointmentModal'); const sosModal = document.querySelector('#sosModal'); const detailsModal = document.querySelector('#detailsModal'); const servicesModal = document.querySelector('#servicesModal'); const notice = document.querySelector('#agendaNotice'); const appointmentForm = document.querySelector('#appointmentForm'); const sosForm = document.querySelector('#sosForm'); const serviceList = document.querySelector('#serviceList'); const serviceTotal = document.querySelector('#serviceTotal'); const serviceDuration = document.querySelector('#serviceDuration'); const modalTitle = document.querySelector('#appointmentTitle'); const modalMode = document.querySelector('#appointmentMode'); const professionalField = document.querySelector('#appointmentProfessional'); const timeField = document.querySelector('#appointmentTime'); const clientField = document.querySelector('#appointmentClient'); const statusField = document.querySelector('#appointmentStatus'); const valueField = document.querySelector('#appointmentValue'); const durationField = document.querySelector('#appointmentDuration'); const appointmentIdField = document.querySelector('#appointmentId'); const selectedServicesField = document.querySelector('#selectedServices'); const detailContent = document.querySelector('#detailsContent'); const detailActions = document.querySelector('#detailsActions'); const sosClient = document.querySelector('#sosClient'); const sosService = document.querySelector('#sosService'); const sosTime = document.querySelector('#sosTime'); const sosProfessional = document.querySelector('#sosProfessional'); const sosSpecialty = document.querySelector('#sosSpecialty');
  let currentDate = new Date(); let currentAppointmentId = null; let editingServicesFor = null; let temporaryServices = [];

  function showNotice(message) { if (!notice) return; notice.textContent = message; notice.hidden = false; window.clearTimeout(showNotice.timer); showNotice.timer = window.setTimeout(() => { notice.hidden = true; }, 3500); }
  function getState() { return agendaReadState(); }

  function openAppointmentModal({ date = agendaDateKey(currentDate), time = '08:00', professional = 'Ana', appointment = null, mode = 'new' } = {}) {
    appointmentIdField.value = appointment?.id || ''; modalMode.textContent = mode === 'reschedule' ? 'ALTERAR HORÁRIO' : mode === 'edit' ? 'EDITAR ATENDIMENTO' : 'NOVO AGENDAMENTO'; modalTitle.textContent = mode === 'reschedule' ? 'Alterar horário' : mode === 'edit' ? 'Editar atendimento' : 'Agendar cliente'; professionalField.value = appointment?.professional || professional; timeField.value = appointment?.time || time; clientField.value = appointment?.client || ''; statusField.value = appointment?.status || 'agendado'; valueField.value = String(agendaAppointmentValue(appointment || {})).replace('.', ','); durationField.value = agendaAppointmentDuration(appointment || {}) || 0; temporaryServices = agendaServiceSummary(appointment || {}); selectedServicesField.value = JSON.stringify(temporaryServices); agendaOpenModal(appointmentModal); clientField.focus();
  }

  function openDetailsModal(appointment) {
    currentAppointmentId = appointment.id;
    const services = agendaServiceSummary(appointment); const totalDuration = agendaAppointmentDuration(appointment); const totalValue = agendaAppointmentValue(appointment); const end = agendaAppointmentEnd(appointment); const isSos = appointment.source === 'sos';
    detailContent.innerHTML = `<div class="detail-topline"><div><span class="detail-label">Cliente</span><strong>${agendaEscape(appointment.client || 'Cliente')}</strong></div><div><span class="detail-label">Profissional</span><strong>${agendaEscape(appointment.professional || 'A definir')}</strong></div><span class="agenda-status ${agendaStatusClass(isSos ? 'sos' : appointment.status)}">${isSos ? 'S.O.S.' : agendaStatusLabel(appointment.status)}</span></div><div class="detail-meta-grid"><div><span class="detail-label">Data</span><strong>${agendaEscape(agendaFormatDate(new Date(`${appointment.date}T12:00:00`)))}</strong></div><div><span class="detail-label">Horário</span><strong>${agendaEscape(appointment.time)} – ${agendaEscape(end)}</strong></div><div><span class="detail-label">Duração</span><strong>${agendaDurationLabel(totalDuration)}</strong></div><div><span class="detail-label">Valor</span><strong>${agendaFormatCurrency(totalValue)}</strong></div></div><div class="detail-section"><h3>Serviços</h3><div class="service-detail-list">${services.length ? services.map((service) => `<div><span>${agendaEscape(service.name)}</span><span>${agendaDurationLabel(Number(service.duration) || 0)} · ${agendaFormatCurrency(service.value)}</span></div>`).join('') : '<div>Nenhum serviço informado.</div>'}</div></div><div class="detail-note">O horário calculado é informativo e não impede encaixes. Toda célula da agenda continua acionável.</div>`;
    detailActions.innerHTML = `<button type="button" class="action-button" data-detail-action="reschedule">Alterar horário</button><button type="button" class="action-button" data-detail-action="professional">Alterar profissional</button><button type="button" class="action-button" data-detail-action="services">Incluir / remover serviços</button><button type="button" class="action-button action-success" data-detail-action="arrived">Registrar chegada</button><button type="button" class="action-button action-danger" data-detail-action="finish">Finalizar atendimento</button><button type="button" class="action-button action-cancel" data-detail-action="cancel">Cancelar atendimento</button><button type="button" class="action-button action-finance" data-detail-action="finance">Financeiro</button>`;
    detailActions.dataset.sosId = ''; agendaOpenModal(detailsModal);
  }

  function renderServiceSelector(appointment) {
    const selected = new Set((appointment ? agendaServiceSummary(appointment) : temporaryServices).map((service) => service.name));
    serviceList.innerHTML = AGENDA_SERVICES.map((service) => `<label class="service-option"><input type="checkbox" value="${agendaEscape(service.name)}" data-service-name="${agendaEscape(service.name)}" ${selected.has(service.name) ? 'checked' : ''}><span><strong>${agendaEscape(service.name)}</strong><small>${agendaDurationLabel(service.duration)} · ${agendaFormatCurrency(service.value)}</small></span></label>`).join('');
    function updateTotals() { const chosen = AGENDA_SERVICES.filter((service) => serviceList.querySelector(`[data-service-name="${CSS.escape(service.name)}"]`)?.checked); serviceTotal.textContent = agendaFormatCurrency(chosen.reduce((sum, service) => sum + service.value, 0)); serviceDuration.textContent = agendaDurationLabel(chosen.reduce((sum, service) => sum + service.duration, 0)); }
    serviceList.querySelectorAll('input').forEach((input) => input.addEventListener('change', updateTotals)); updateTotals();
  }

  function saveSelectedServices() {
    const state = getState(); const appointment = editingServicesFor ? state.appointments.find((item) => item.id === editingServicesFor) : null; const selected = AGENDA_SERVICES.filter((service) => serviceList.querySelector(`[data-service-name="${CSS.escape(service.name)}"]`)?.checked);
    if (!selected.length) { showNotice('Selecione pelo menos um serviço.'); return; }
    const normalized = selected.map((service) => ({ ...service }));
    if (appointment) { appointment.services = normalized; appointment.service = selected.map((service) => service.name).join(' + '); appointment.value = selected.reduce((sum, service) => sum + service.value, 0); appointment.duration = selected.reduce((sum, service) => sum + service.duration, 0); agendaSaveState(state); showNotice('Serviços atualizados. A duração e o valor foram recalculados.'); }
    else { temporaryServices = normalized; selectedServicesField.value = JSON.stringify(temporaryServices); valueField.value = String(selected.reduce((sum, service) => sum + service.value, 0)).replace('.', ','); durationField.value = selected.reduce((sum, service) => sum + service.duration, 0); showNotice('Serviços selecionados para o novo atendimento.'); }
    editingServicesFor = null; agendaCloseModal(servicesModal); render();
  }

  function render() {
    if (!grid) return; const interval = Number(intervalSelect.value || 30); const state = getState(); const dateKey = agendaDateKey(currentDate); dateLabel.textContent = agendaFormatDate(currentDate); datePicker.value = dateKey; const times = agendaBuildTimes(interval); const appointments = state.appointments.filter((item) => agendaNormalizeDate(item.date) === dateKey && item.status !== 'cancelado'); const sosItems = state.opportunities.filter((item) => agendaNormalizeDate(item.date) === dateKey && (item.source === 'sos' || item.status === 'aberta' || item.status === 'aceita'));
    grid.innerHTML = `<div class="agenda-scroll-v2"><table class="agenda-grid"><thead><tr><th class="time-col">Horário</th>${AGENDA_PROFESSIONALS.map((professional) => `<th><span class="specialty-label">${agendaEscape(professional.specialty)}</span><span class="professional-name">${agendaEscape(professional.name)}</span></th>`).join('')}<th class="sos-col"><span class="sos-title">S.O.S.</span><button type="button" class="sos-header-button" id="requestSosButton">Solicitar S.O.S.</button></th></tr></thead><tbody>${times.map((time) => `<tr><th class="time-col">${time}</th>${AGENDA_PROFESSIONALS.map((professional) => renderCell(time, professional, appointments)).join('')}${renderSosCell(time, sosItems)}</tr>`).join('')}</tbody></table></div>`;
    grid.querySelector('#requestSosButton')?.addEventListener('click', () => openSosModal()); grid.querySelectorAll('[data-agenda-cell]').forEach((cell) => cell.addEventListener('click', () => handleCellClick(cell))); updateMetrics(appointments, sosItems);
  }

  function renderCell(time, professional, appointments) {
    const cellKey = `${time}-${professional.name}`; const cellAppointments = appointments.filter((appointment) => appointment.professional === professional.name && agendaMinutes(time) >= agendaMinutes(appointment.time) && agendaMinutes(time) < agendaMinutes(appointmentEnd(appointment))); const appointment = cellAppointments[0];
    if (!appointment) return `<td data-agenda-cell data-slot="${agendaEscape(cellKey)}" data-time="${time}" data-professional="${agendaEscape(professional.name)}" class="free-cell">Livre</td>`;
    const start = appointment.time === time; const isSos = appointment.source === 'sos'; const status = isSos ? 'sos' : appointment.status;
    return `<td data-agenda-cell data-slot="${agendaEscape(cellKey)}" data-time="${time}" data-professional="${agendaEscape(professional.name)}" data-appointment-id="${agendaEscape(appointment.id)}" class="appointment-cell ${agendaStatusClass(status)} ${start ? 'appointment-start' : 'appointment-continuation'}">${start ? `<strong>${agendaEscape(appointment.client || 'Cliente')}</strong><span>${agendaEscape(appointment.service || 'Serviço')}</span><small>${agendaEscape(appointment.time)} – ${agendaEscape(agendaAppointmentEnd(appointment))} · ${agendaDurationLabel(agendaAppointmentDuration(appointment))}</small>` : `<span>${agendaEscape(appointment.client || 'Cliente')} · até ${agendaEscape(agendaAppointmentEnd(appointment))}</span>`}</td>`;
  }

  function renderSosCell(time, sosItems) {
    const minute = agendaMinutes(time); const item = sosItems.find((entry) => minute >= agendaMinutes(entry.time || '08:00') && minute < agendaMinutes(entry.time || '08:00') + 120); if (!item) return `<td data-agenda-cell data-time="${time}" data-sos-cell="true" class="sos-free-cell">Livre</td>`; const accepted = item.acceptedBy || item.professional || 'Aguardando profissional'; return `<td data-agenda-cell data-time="${time}" data-sos-id="${agendaEscape(item.id)}" class="sos-cell"><strong>${agendaEscape(item.client || 'Solicitação S.O.S.')}</strong><span>${agendaEscape(item.service || item.specialty || 'Necessidade')}</span><small>Profissional: ${agendaEscape(accepted)}</small></td>`;
  }

  function handleCellClick(cell) {
    const appointmentId = cell.dataset.appointmentId; if (appointmentId) { const appointment = getState().appointments.find((item) => item.id === appointmentId); if (appointment) openDetailsModal(appointment); return; }
    if (cell.dataset.sosId) { const item = getState().opportunities.find((entry) => entry.id === cell.dataset.sosId); if (item) openSosDetails(item); return; }
    if (cell.dataset.sosCell) { openSosModal(cell.dataset.time); return; }
    openAppointmentModal({ date: agendaDateKey(currentDate), time: cell.dataset.time, professional: cell.dataset.professional });
  }

  function openSosModal(time = '08:00') { sosTime.value = time; sosClient.value = ''; sosService.value = ''; sosProfessional.value = ''; sosSpecialty.value = 'Cabelos'; agendaOpenModal(sosModal); sosClient.focus(); }

  function openSosDetails(item) {
    detailContent.innerHTML = `<div class="detail-topline"><div><span class="detail-label">Cliente</span><strong>${agendaEscape(item.client || 'A definir')}</strong></div><div><span class="detail-label">Profissional</span><strong>${agendaEscape(item.acceptedBy || item.professional || 'Aguardando')}</strong></div><span class="agenda-status status-sos">S.O.S.</span></div><div class="detail-meta-grid"><div><span class="detail-label">Data</span><strong>${agendaEscape(item.date)}</strong></div><div><span class="detail-label">Horário</span><strong>${agendaEscape(item.time)}</strong></div><div><span class="detail-label">Especialidade</span><strong>${agendaEscape(item.specialty || 'Não definida')}</strong></div><div><span class="detail-label">Status</span><strong>${agendaEscape(item.status === 'aberta' ? 'Em busca' : 'Profissional selecionado')}</strong></div></div><div class="detail-note">Esta solicitação permanece identificada em roxo porque sua origem é o S.O.S. Profissionais.</div>`;
    detailActions.innerHTML = `<button type="button" class="action-button" data-sos-detail="edit">Alterar solicitação</button><button type="button" class="action-button action-cancel" data-sos-detail="cancel">Cancelar S.O.S.</button>`; currentAppointmentId = null; detailActions.dataset.sosId = item.id; agendaOpenModal(detailsModal);
  }

  function updateMetrics(appointments, sosItems) { const el = (id) => document.querySelector(`#${id}`); if (el('metricAppointments')) el('metricAppointments').textContent = appointments.length; if (el('metricProgress')) el('metricProgress').textContent = appointments.filter((item) => ['em_andamento', 'chegou'].includes(item.status)).length; if (el('metricSos')) el('metricSos').textContent = sosItems.length; if (el('metricCanceled')) el('metricCanceled').textContent = getState().appointments.filter((item) => item.date === agendaDateKey(currentDate) && item.status === 'cancelado').length; }

  document.querySelector('#prevDay')?.addEventListener('click', () => { currentDate.setDate(currentDate.getDate() - 1); render(); }); document.querySelector('#nextDay')?.addEventListener('click', () => { currentDate.setDate(currentDate.getDate() + 1); render(); }); document.querySelector('#todayBtn')?.addEventListener('click', () => { currentDate = new Date(); render(); }); document.querySelector('#newAppointmentBtn')?.addEventListener('click', () => openAppointmentModal({ time: '08:00', professional: 'Ana' })); intervalSelect?.addEventListener('change', render); datePicker?.addEventListener('change', () => { const [y, m, d] = datePicker.value.split('-').map(Number); currentDate = new Date(y, m - 1, d); render(); });
  document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => { agendaCloseModal(appointmentModal); agendaCloseModal(sosModal); agendaCloseModal(detailsModal); agendaCloseModal(servicesModal); })); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { agendaCloseModal(appointmentModal); agendaCloseModal(sosModal); agendaCloseModal(detailsModal); agendaCloseModal(servicesModal); } });

  const populateTimeOptions = () => { const options = agendaBuildTimes(30).map((time) => `<option value="${time}">${time}</option>`).join(''); if (timeField) timeField.innerHTML = options; if (sosTime) sosTime.innerHTML = options; }; populateTimeOptions();
  document.querySelector('#openServicesFromAppointment')?.addEventListener('click', () => { editingServicesFor = null; renderServiceSelector(null); agendaOpenModal(servicesModal); }); appointmentForm?.addEventListener('reset', () => { temporaryServices = []; selectedServicesField.value = '[]'; });

  appointmentForm?.addEventListener('submit', (event) => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(appointmentForm).entries()); const state = getState(); let selectedServices = []; try { selectedServices = JSON.parse(data.selectedServices || '[]'); } catch { selectedServices = []; }
    const services = selectedServices.length ? selectedServices : [{ name: data.serviceName || 'Serviço', duration: Number(data.appointmentDuration) || 30, value: Number(String(data.appointmentValue || data.value || 0).replace(',', '.')) || 0 }]; const payload = { date: agendaDateKey(currentDate), time: data.appointmentTime, professional: data.professional, client: data.client, services, service: services.map((service) => service.name).join(' + '), duration: services.reduce((sum, service) => sum + Number(service.duration || 0), 0), value: services.reduce((sum, service) => sum + Number(service.value || 0), 0), status: data.status || 'agendado', source: 'salao' };
    if (data.id) { const appointment = state.appointments.find((item) => item.id === data.id); if (appointment) Object.assign(appointment, payload, { id: data.id }); showNotice('Atendimento atualizado.'); } else { state.appointments.push({ ...payload, id: agendaId('apt') }); showNotice('Cliente adicionado à agenda.'); }
    agendaSaveState(state); agendaCloseModal(appointmentModal); appointmentForm.reset(); render();
  });

  sosForm?.addEventListener('submit', (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(sosForm).entries()); const state = getState(); state.opportunities.push({ id: agendaId('sos'), date: agendaDateKey(currentDate), time: data.time, client: data.client, service: data.service, specialty: data.specialty, radius: data.radius || '', professional: data.professional || '', status: 'aberta', source: 'sos', createdAt: new Date().toISOString() }); agendaSaveState(state); agendaCloseModal(sosModal); sosForm.reset(); showNotice('Solicitação S.O.S. criada e identificada na coluna S.O.S.'); render(); });

  detailActions?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-detail-action]'); const sosButton = event.target.closest('[data-sos-detail]'); const state = getState();
    if (sosButton) { const id = detailActions.dataset.sosId; const item = state.opportunities.find((entry) => entry.id === id); if (!item) return; if (sosButton.dataset.sosDetail === 'cancel') { item.status = 'cancelada'; agendaSaveState(state); agendaCloseModal(detailsModal); showNotice('Solicitação S.O.S. cancelada.'); render(); } return; }
    if (!button || !currentAppointmentId) return; const appointment = state.appointments.find((item) => item.id === currentAppointmentId); if (!appointment) return; const action = button.dataset.detailAction;
    if (action === 'reschedule') { agendaCloseModal(detailsModal); openAppointmentModal({ appointment, mode: 'reschedule' }); }
    if (action === 'professional') { agendaCloseModal(detailsModal); openAppointmentModal({ appointment, mode: 'edit' }); professionalField.focus(); }
    if (action === 'services') { editingServicesFor = appointment.id; renderServiceSelector(appointment); agendaOpenModal(servicesModal); }
    if (action === 'arrived') { appointment.status = 'em_andamento'; appointment.arrivedAt = new Date().toISOString(); agendaSaveState(state); agendaCloseModal(detailsModal); showNotice('Chegada registrada.'); render(); }
    if (action === 'finish') { appointment.status = 'finalizado'; appointment.finishedAt = new Date().toISOString(); agendaSaveState(state); agendaCloseModal(detailsModal); showNotice('Atendimento finalizado.'); render(); }
    if (action === 'cancel') { appointment.status = 'cancelado'; agendaSaveState(state); agendaCloseModal(detailsModal); showNotice('Atendimento cancelado. O horário continua disponível para encaixe.'); render(); }
    if (action === 'finance') showNotice(`Financeiro do atendimento: ${agendaFormatCurrency(agendaAppointmentValue(appointment))}.`);
  });

  document.querySelector('#saveServicesButton')?.addEventListener('click', saveSelectedServices); document.querySelector('#addServiceButton')?.addEventListener('click', () => { const firstUnchecked = serviceList.querySelector('input:not(:checked)'); if (firstUnchecked) { firstUnchecked.checked = true; firstUnchecked.dispatchEvent(new Event('change')); } });
  render();
}

document.addEventListener('DOMContentLoaded', agendaInit);
