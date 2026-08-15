/* BeautyMove — agenda duration engine
 * Single responsibility: calculate service duration, occupy the correct time range,
 * prevent overlaps, and expose estimated duration in service selectors.
 */
(function () {
  if (document.body?.dataset?.role !== 'salao') return;

  const STATE_KEY = 'beautymove.mvp.state';
  const SERVICES_KEY = 'beautymove.mvp.services';
  const TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
  const STEP = 30;

  const DEFAULT_DURATION = {
    'svc-corte-feminino': 60,
    'svc-corte-masculino': 60,
    'svc-escova': 30,
    'svc-hidratacao': 60,
    'svc-coloracao': 120,
    'svc-luzes': 180,
    'svc-maos': 60,
    'svc-pes': 60,
    'svc-maos-pes': 90,
    'svc-esmaltacao': 45,
    'svc-limpeza-pele': 60,
    'svc-design-facial': 45,
    'svc-virilha': 30,
    'svc-axila': 20,
    'svc-buco': 15,
    'svc-pernas': 45,
    'svc-design-sobrancelhas': 30,
    'svc-henna': 45
  };

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  const services = () => {
    const saved = read(SERVICES_KEY, []);
    return Array.isArray(saved) ? saved : [];
  };

  const durationForService = service => {
    const explicit = Number(service?.durationMinutes || service?.duration || service?.estimatedMinutes || 0);
    if (explicit > 0) return explicit;
    if (DEFAULT_DURATION[service?.id]) return DEFAULT_DURATION[service.id];
    const n = String(service?.name || '').toLowerCase();
    if (n.includes('luzes') || n.includes('mechas')) return 180;
    if (n.includes('coloração') || n.includes('coloracao')) return 120;
    if (n.includes('escova')) return 30;
    if (n.includes('corte')) return 60;
    if (n.includes('hidrata')) return 60;
    if (n.includes('virilha')) return 30;
    if (n.includes('axila')) return 20;
    if (n.includes('buço') || n.includes('buco')) return 15;
    if (n.includes('sobrancel')) return 30;
    return 60;
  };

  const fmtDuration = minutes => {
    const m = Math.max(0, Number(minutes) || 0);
    const h = Math.floor(m / 60), min = m % 60;
    if (h && min) return `${h}h ${min}min`;
    if (h) return `${h}h`;
    return `${min}min`;
  };

  const toMinutes = time => {
    const [h,m] = String(time).split(':').map(Number);
    return h * 60 + m;
  };
  const toTime = minutes => {
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  const serviceMap = () => new Map(services().map(s => [s.id, s]));

  const appointmentServices = appointment => {
    if (Array.isArray(appointment?.services) && appointment.services.length) return appointment.services;
    const map = serviceMap();
    if (Array.isArray(appointment?.serviceIds) && appointment.serviceIds.length) {
      return appointment.serviceIds.map(id => map.get(id)).filter(Boolean);
    }
    if (appointment?.serviceId && map.has(appointment.serviceId)) return [map.get(appointment.serviceId)];
    if (appointment?.service) {
      return String(appointment.service).split(' + ').map(name => ({name}));
    }
    return [];
  };

  const appointmentDuration = appointment => {
    const explicit = Number(appointment?.durationMinutes || appointment?.duration || appointment?.estimatedMinutes || 0);
    if (explicit > 0) return explicit;
    return appointmentServices(appointment).reduce((sum, service) => sum + durationForService(service), 0);
  };

  const timing = appointment => {
    const start = toMinutes(appointment.time);
    const duration = Math.max(STEP, appointmentDuration(appointment));
    return { start, end: start + duration, duration, endTime: toTime(start + duration) };
  };

  const currentDate = () => {
    const text = document.querySelector('#agendaDate')?.textContent?.trim();
    return text;
  };

  function decorateServiceMenus(root = document) {
    const map = serviceMap();
    root.querySelectorAll('.service-option').forEach(option => {
      const input = option.querySelector('input');
      const strong = option.querySelector('strong');
      if (!input || !strong) return;
      const service = map.get(input.value);
      if (!service) return;
      const price = strong.dataset.bmPrice || strong.textContent;
      strong.dataset.bmPrice = price;
      strong.innerHTML = `${esc(price)} <small style="font-weight:600;color:#6f35e8;display:block;text-align:right">${fmtDuration(durationForService(service))}</small>`;
    });
  }

  function decorateAppointmentCells() {
    const state = read(STATE_KEY, {appointments:[]});
    const appointments = Array.isArray(state.appointments) ? state.appointments.filter(a => a.status !== 'cancelado') : [];
    const date = document.querySelector('#agendaDate')?.textContent?.trim();
    const dateIso = (() => {
      const d = new Date();
      const today = d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
      if (date === 'Hoje') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const match = String(date || '').match(/(\d{2})\/(\d{2})/);
      return match ? `${d.getFullYear()}-${match[2]}-${match[1]}` : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();

    document.querySelectorAll('#agendaBody [data-slot]').forEach(cell => {
      const [time, ...rest] = String(cell.dataset.slot).split('-');
      const professional = rest.join('-');
      const minute = toMinutes(time);
      const appointment = appointments.find(a => {
        if (a.date !== dateIso || a.professional !== professional) return false;
        const t = timing(a);
        return minute >= t.start && minute < t.end;
      });
      if (!appointment) return;

      const t = timing(appointment);
      const isStart = minute === t.start;
      cell.classList.add('bm-duration-occupied');
      cell.classList.remove('appointment');
      cell.style.background = isStart ? '#f0e9ff' : '#faf8ff';
      cell.style.borderLeft = isStart ? '3px solid #7438ff' : '3px solid #e4dcf7';
      cell.style.cursor = 'not-allowed';
      cell.innerHTML = isStart
        ? `<strong>${esc(appointment.client)}</strong><span>${esc(appointmentServices(appointment).map(s => s.name).join(' + '))}</span><small style="display:block;margin-top:3px;color:#6f35e8;font-weight:700">${esc(appointment.time)} – ${esc(t.endTime)} · ${fmtDuration(t.duration)}</small>`
        : `<span style="font-size:12px;color:#7b6f8e;font-weight:600">Ocupado até ${esc(t.endTime)}</span>`;
    });
  }

  function refresh() {
    decorateServiceMenus();
    decorateAppointmentCells();
  }

  function protectOverlap(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'appointmentForm') return;
    const picker = document.querySelector('#servicePicker');
    const professional = document.querySelector('#professionalName')?.value;
    const time = document.querySelector('#appointmentTime')?.value;
    const selection = picker?._getSelected?.();
    if (!professional || !time || !selection?.services?.length) return;
    const duration = selection.services.reduce((sum,s) => sum + durationForService(s), 0);
    const start = toMinutes(time), end = start + duration;
    const state = read(STATE_KEY,{appointments:[]});
    const current = new Date();
    const dateIso = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
    const conflict = (state.appointments || []).some(a => {
      if (a.status === 'cancelado' || a.professional !== professional || a.date !== dateIso) return false;
      const t = timing(a);
      return start < t.end && end > t.start;
    });
    if (conflict) {
      event.preventDefault();
      event.stopImmediatePropagation();
      alert(`Esse profissional já possui um atendimento nesse período.\n\nHorário solicitado: ${time} – ${toTime(end)}.`);
    }
  }

  function init() {
    document.addEventListener('submit', protectOverlap, true);
    const observer = new MutationObserver(() => {
      refresh();
    });
    const body = document.querySelector('#appointmentDetailBody');
    const agenda = document.querySelector('#agendaBody');
    if (body) observer.observe(body,{childList:true,subtree:true});
    if (agenda) observer.observe(agenda,{childList:true,subtree:true});
    setTimeout(refresh, 300);
    setTimeout(refresh, 1000);
    setTimeout(refresh, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
