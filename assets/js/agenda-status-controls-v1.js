/* BeautyMove — agenda status controls v1
   Allows status changes/cancellation and preserves appointment duration without blocking overlaps.
*/
(function () {
  if (document.body?.dataset?.role !== 'salao') return;

  const STATE_KEY = 'beautymove.mvp.state';
  const SERVICES_KEY = 'beautymove.mvp.services';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money = value => Number(value || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const mins = value => { const [h,m] = String(value || '00:00').split(':').map(Number); return h * 60 + m; };
  const time = value => `${String(Math.floor(value / 60)).padStart(2,'0')}:${String(value % 60).padStart(2,'0')}`;
  const dateKey = date => { const d = date || new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const services = () => read(SERVICES_KEY, []);
  const serviceMap = () => new Map(services().map(s => [s.id, s]));
  const appointmentServices = a => {
    if (Array.isArray(a?.services) && a.services.length) return a.services;
    const map = serviceMap();
    if (Array.isArray(a?.serviceIds) && a.serviceIds.length) return a.serviceIds.map(id => map.get(id)).filter(Boolean);
    if (a?.serviceId && map.has(a.serviceId)) return [map.get(a.serviceId)];
    return a?.service ? [{ name:a.service, value:Number(a.value || 0) }] : [];
  };
  const durationFor = s => Number(s?.durationMinutes || s?.duration || s?.estimatedMinutes || s?.durationMin || 0) || 30;
  const duration = a => Number(a?.durationMinutes || a?.duration || a?.estimatedMinutes || a?.durationMin || 0) || appointmentServices(a).reduce((sum,s) => sum + durationFor(s), 0) || 30;
  const timing = a => { const start = mins(a.time), d = duration(a); return { start, end:start+d, duration:d, endTime:time(start+d) }; };
  const currentAgendaDate = () => {
    const text = document.querySelector('#agendaDate')?.textContent?.trim();
    if (text === 'Hoje') return dateKey();
    const match = String(text || '').match(/(\d{2})\/(\d{2})/);
    return match ? `${new Date().getFullYear()}-${match[2]}-${match[1]}` : dateKey();
  };
  const getState = () => ({ appointments:[], opportunities:[], transactions:[], ...read(STATE_KEY,{}) });
  const saveState = state => write(STATE_KEY, state);

  function findAppointment(date, professional, slotTime) {
    const minute = mins(slotTime);
    return getState().appointments.find(a => {
      if (a.status === 'cancelado' || a.date !== date || a.professional !== professional) return false;
      const t = timing(a); return minute >= t.start && minute < t.end;
    }) || null;
  }
  function openModal() { const el = document.querySelector('#appointmentDetailModal'); if (el) { el.classList.add('is-open'); el.setAttribute('aria-hidden','false'); } }
  function closeModal() { const el = document.querySelector('#appointmentDetailModal'); if (el) { el.classList.remove('is-open'); el.setAttribute('aria-hidden','true'); } }

  function renderStatus(a) {
    const labels = { agendado:'Aguardando chegada', confirmado:'Confirmado', em_atendimento:'Cliente chegou', concluido:'Finalizado', cancelado:'Cancelado' };
    const statusClass = a.status === 'em_atendimento' ? 'status-arrived' : a.status === 'concluido' ? 'status-finished' : '';
    const svcs = appointmentServices(a), total = Number(a.value || svcs.reduce((sum,s) => sum + Number(s.value || 0), 0)), t = timing(a);
    const body = document.querySelector('#appointmentDetailBody'); if (!body) return;
    let actions = '';
    if (a.status === 'agendado' || a.status === 'confirmado') actions = `<button class="primary compact" type="button" data-status-op="arrived">Cliente chegou</button><button class="secondary compact" type="button" data-status-op="cancel">Cancelar agendamento</button>`;
    else if (a.status === 'em_atendimento') actions = `<button class="primary compact" type="button" data-status-op="finish">Finalizar atendimento</button><button class="secondary compact" type="button" data-status-op="cancel">Cancelar agendamento</button>`;
    else if (a.status === 'concluido') actions = `<button class="secondary compact" type="button" data-status-op="reopen">Reabrir atendimento</button>`;
    body.innerHTML = `<div class="operation-detail"><div class="operation-summary"><span class="eyebrow">ATENDIMENTO</span><h2>${esc(a.client)}</h2><p>${esc(a.professional)} · ${esc(a.date)} · ${esc(a.time)} – ${esc(t.endTime)} · ${Math.floor(t.duration/60) ? `${Math.floor(t.duration/60)}h${t.duration%60 ? ` ${t.duration%60}min` : ''}` : `${t.duration}min`}</p><span class="status ${statusClass}">${esc(labels[a.status] || a.status || 'Agendado')}</span></div><div class="operation-info"><div><small>Profissional</small><strong>${esc(a.professional)}</strong></div><div><small>Serviços</small><strong>${esc(svcs.map(s => s.name).join(' + ') || '—')}</strong></div><div><small>Valor total</small><strong>${money(total)}</strong></div></div><div class="operation-actions">${actions}</div></div>`;
    body.querySelector('[data-status-op="arrived"]')?.addEventListener('click', () => updateStatus(a.id, 'em_atendimento'));
    body.querySelector('[data-status-op="finish"]')?.addEventListener('click', () => updateStatus(a.id, 'concluido'));
    body.querySelector('[data-status-op="reopen"]')?.addEventListener('click', () => updateStatus(a.id, 'em_atendimento'));
    body.querySelector('[data-status-op="cancel"]')?.addEventListener('click', () => cancelAppointment(a.id));
    openModal();
  }
  function updateStatus(id, status) {
    const state = getState(), appointment = state.appointments.find(a => a.id === id); if (!appointment) return;
    appointment.status = status;
    if (status === 'em_atendimento') appointment.arrivedAt = new Date().toISOString();
    if (status === 'concluido') appointment.finishedAt = new Date().toISOString();
    saveState(state); closeModal(); window.dispatchEvent(new CustomEvent('beautymove:agenda-updated')); setTimeout(decorateAppointments, 0);
  }
  function cancelAppointment(id) {
    const state = getState(), appointment = state.appointments.find(a => a.id === id); if (!appointment) return;
    if (!window.confirm(`Cancelar o agendamento de ${appointment.client}?`)) return;
    appointment.status = 'cancelado'; appointment.cancelledAt = new Date().toISOString();
    saveState(state); closeModal(); window.dispatchEvent(new CustomEvent('beautymove:agenda-updated')); setTimeout(decorateAppointments, 0);
  }

  // The appointment form created by agenda-single-form-fix-v3 used to reject overlaps.
  // The salon must be allowed to create encaixes, so this capture handler saves the appointment directly.
  function bindSingleFormSave() {
    if (document.documentElement.dataset.bmOverlapSaveBound === '1') return;
    document.documentElement.dataset.bmOverlapSaveBound = '1';
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-bm3-save]');
      if (!button) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const body = document.querySelector('#appointmentDetailBody');
      const picker = body?.querySelector('#bm3Picker');
      const clientField = body?.querySelector('#singleFormClient');
      if (!picker || !clientField) return;
      const client = clientField.value.trim(), selection = picker._selection?.();
      if (!client) { clientField.focus(); return; }
      if (!selection?.confirmed || !selection.services?.length) { picker.querySelector('.bm3-trigger')?.focus(); return; }
      const summary = body.querySelector('.operation-summary p')?.textContent || '';
      const match = summary.match(/^(.+?) · (\d{2}\/\d{2}\/\d{4}) · (\d{2}:\d{2})$/);
      if (!match) return;
      const professional = match[1].trim(), [day,month,year] = match[2].split('/'), date = `${year}-${month}-${day}`, startTime = match[3];
      const state = getState();
      const durationMin = Number(selection.durationMin || selection.services.reduce((sum,s) => sum + durationFor(s), 0)) || 30;
      const snap = selection.services.map(s => ({ id:s.id, name:s.name, value:Number(s.value||0), category:s.category, durationMin:Number(s.durationMin || durationFor(s)) }));
      state.appointments.push({ id:`apt-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, date, time:startTime, professional, client, service:snap.map(s=>s.name).join(' + '), serviceId:snap[0]?.id||null, serviceIds:snap.map(s=>s.id), services:snap, value:Number(selection.total||0), durationMin, endTime:time(mins(startTime)+durationMin), status:'agendado', source:'salao' });
      saveState(state); closeModal(); window.dispatchEvent(new CustomEvent('beautymove:agenda-updated')); window.location.reload();
    }, true);
  }

  function bindAppointmentCells() {
    const agenda = document.querySelector('#agendaBody'); if (!agenda || agenda.dataset.bmStatusBound === '1') return;
    agenda.dataset.bmStatusBound = '1';
    agenda.addEventListener('click', event => {
      const cell = event.target.closest('[data-slot]'); if (!cell) return;
      const [slot,...rest] = String(cell.dataset.slot).split('-'), professional = rest.join('-'), appointment = findAppointment(currentAgendaDate(), professional, slot);
      if (!appointment) return;
      event.preventDefault(); event.stopImmediatePropagation(); renderStatus(appointment);
    }, true);
  }
  function decorateAppointments() {
    const date = currentAgendaDate();
    document.querySelectorAll('#agendaBody [data-slot]').forEach(cell => {
      const [slot,...rest] = String(cell.dataset.slot).split('-'), professional = rest.join('-'), a = findAppointment(date, professional, slot);
      cell.classList.remove('bm-status-arrived','bm-status-finished','bm-status-pending');
      if (!a) return;
      if (a.status === 'em_atendimento') cell.classList.add('bm-status-arrived');
      else if (a.status === 'concluido') cell.classList.add('bm-status-finished');
      else cell.classList.add('bm-status-pending');
      cell.style.cursor = 'pointer';
    });
  }
  function init() {
    bindAppointmentCells(); bindSingleFormSave(); decorateAppointments();
    window.addEventListener('beautymove:agenda-updated', decorateAppointments);
    const agenda = document.querySelector('#agendaBody');
    if (agenda) new MutationObserver(() => { bindAppointmentCells(); decorateAppointments(); }).observe(agenda, { childList:true, subtree:true });
    setTimeout(() => { bindAppointmentCells(); bindSingleFormSave(); decorateAppointments(); }, 400);
    setTimeout(() => { bindAppointmentCells(); bindSingleFormSave(); decorateAppointments(); }, 1200);
  }
  const style = document.createElement('style');
  style.textContent = `#agendaBody td.bm-status-arrived { background:#e8f7ed !important; border-left:3px solid #2e9d57 !important; } #agendaBody td.bm-status-finished { background:#fdeaea !important; border-left:3px solid #c43b3b !important; } #agendaBody td.bm-status-pending { cursor:pointer !important; } .status-arrived { background:#e8f7ed !important; color:#267a45 !important; } .status-finished { background:#fdeaea !important; color:#a62f2f !important; }`;
  document.head.appendChild(style);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
