/* BeautyMove MVP — canonical data boundary. */
window.BeautyMoveData = (() => {
  const STATE_KEY = 'beautymove.mvp.state';
  const PROFILE_KEY = 'beautymove.mvp.profile';
  const AGENDA_HOURS_KEY = 'beautymove.mvp.agenda.hours';
  const EMPTY_STATE = Object.freeze({
    appointments: [], opportunities: [], transactions: [],
    professionals: [], salons: [], clients: [], users: []
  });

  const clone = (value) => {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? clone(fallback) : JSON.parse(raw);
    } catch {
      return clone(fallback);
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeState(value) {
    const source = value && typeof value === 'object' ? value : {};
    const state = { ...source };
    state.appointments = Array.isArray(source.appointments) ? source.appointments : [];
    state.opportunities = Array.isArray(source.opportunities) ? source.opportunities : [];
    state.transactions = Array.isArray(source.transactions) ? source.transactions : [];
    state.professionals = Array.isArray(source.professionals) ? source.professionals : [];
    state.salons = Array.isArray(source.salons) ? source.salons : [];
    state.clients = Array.isArray(source.clients) ? source.clients : [];
    state.users = Array.isArray(source.users) ? source.users : [];
    return state;
  }

  function getState() {
    return normalizeState(read(STATE_KEY, EMPTY_STATE));
  }

  function emit(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function saveState(state, reason = 'state-updated') {
    const normalized = normalizeState(state);
    write(STATE_KEY, normalized);
    emit('beautymove:state-changed', { reason, state: clone(normalized) });
    return clone(normalized);
  }

  function updateState(mutator, reason = 'state-updated') {
    const state = getState();
    const result = mutator(state);
    return saveState(result && typeof result === 'object' ? result : state, reason);
  }

  function id(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function getAgendaHours() {
    const fallback = { open: '08:00', close: '18:00' };
    const week = Array.from({ length: 7 }, () => ({ ...fallback }));
    const saved = read(AGENDA_HOURS_KEY, null);
    if (!Array.isArray(saved) || saved.length !== 7) return week;
    return saved.map((item) => ({
      open: item?.open || fallback.open,
      close: item?.close || fallback.close
    }));
  }

  function saveAgendaHours(hours) {
    const normalized = Array.isArray(hours) && hours.length === 7
      ? hours.map((item) => ({ open: item?.open || '08:00', close: item?.close || '18:00' }))
      : getAgendaHours();
    write(AGENDA_HOURS_KEY, normalized);
    emit('beautymove:agenda-hours-changed', { hours: clone(normalized) });
    return clone(normalized);
  }

  function normalizeService(service) {
    const source = service && typeof service === 'object' ? service : {};
    const result = { ...source };
    result.name = String(source.name || source.service || '').trim();
    result.duration = Math.max(0, Number(source.duration) || 0);
    result.value = Math.max(0, Number(source.value ?? source.price) || 0);
    return result;
  }

  function servicesFromAppointment(appointment) {
    const source = appointment || {};
    if (Array.isArray(source.services) && source.services.length) {
      return source.services.map(normalizeService).filter(item => item.name);
    }
    if (source.service) {
      const item = normalizeService({ name: source.service, duration: source.duration, value: source.value });
      return item.name ? [item] : [];
    }
    return [];
  }

  function summarizeServices(services) {
    const items = Array.isArray(services) ? services.map(normalizeService).filter(item => item.name) : [];
    return {
      services: clone(items),
      duration: items.reduce((sum, item) => sum + item.duration, 0),
      value: items.reduce((sum, item) => sum + item.value, 0),
      label: items.map(item => item.name).join(' + ')
    };
  }

  function createOfferSnapshot(services, context = {}) {
    const summary = summarizeServices(services);
    return clone({
      ...context,
      services: summary.services,
      service: summary.label,
      duration: summary.duration,
      offeredValue: summary.value,
      value: summary.value,
      snapshotAt: context.snapshotAt || new Date().toISOString()
    });
  }

  return {
    mode: () => window.BEAUTYMOVE_BACKEND_ENABLED ? 'firebase' : 'local',
    keys: Object.freeze({ state: STATE_KEY, profile: PROFILE_KEY, agendaHours: AGENDA_HOURS_KEY }),
    id,
    getProfile: () => read(PROFILE_KEY, null),
    saveProfile: (profile) => {
      write(PROFILE_KEY, profile);
      emit('beautymove:profile-changed', { profile: clone(profile) });
      return clone(profile);
    },
    getState,
    saveState,
    updateState,
    getAgendaHours,
    saveAgendaHours,
    normalizeService,
    servicesFromAppointment,
    summarizeServices,
    createOfferSnapshot,
    subscribe: (handler) => {
      if (typeof handler !== 'function') return () => {};
      const listener = (event) => handler(event.detail);
      window.addEventListener('beautymove:state-changed', listener);
      return () => window.removeEventListener('beautymove:state-changed', listener);
    }
  };
})();
