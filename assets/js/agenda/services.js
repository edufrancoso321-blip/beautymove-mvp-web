/* BeautyMove Agenda — canonical service/offer contract.
 * Pure helpers only: no DOM, no localStorage, no side effects.
 * Existing fields are preserved so legacy appointments remain compatible.
 */
window.BeautyMoveAgendaServices = (() => {
  'use strict';

  const number = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

  function normalizeService(service) {
    const source = service && typeof service === 'object' ? service : {};
    const result = { ...source };
    result.name = String(source.name || source.service || '').trim();
    result.duration = Math.max(0, number(source.duration, 0));
    result.value = Math.max(0, number(source.value ?? source.price, 0));
    if (source.price != null && result.value === 0) result.value = Math.max(0, number(source.price));
    return result;
  }

  function servicesFromAppointment(appointment) {
    const source = appointment || {};
    if (Array.isArray(source.services) && source.services.length) {
      return source.services.map(normalizeService).filter(item => item.name);
    }
    if (source.service) {
      return [normalizeService({
        name: source.service,
        duration: source.duration,
        value: source.value
      })].filter(item => item.name);
    }
    return [];
  }

  function summarize(services) {
    const items = Array.isArray(services) ? services.map(normalizeService).filter(item => item.name) : [];
    return {
      services: clone(items),
      duration: items.reduce((sum, item) => sum + item.duration, 0),
      value: items.reduce((sum, item) => sum + item.value, 0),
      label: items.map(item => item.name).join(' + ')
    };
  }

  function appointmentServiceSnapshot(appointment) {
    const source = appointment || {};
    const summary = summarize(servicesFromAppointment(source));
    return {
      services: summary.services,
      service: summary.label || String(source.service || ''),
      duration: summary.duration || number(source.duration, 0),
      value: summary.value || number(source.value, 0)
    };
  }

  /*
   * Creates an immutable-in-practice offer snapshot at SOS request time.
   * Later catalog changes must never mutate this object.
   */
  function createOfferSnapshot(services, context = {}) {
    const summary = summarize(services);
    const snapshot = {
      ...context,
      services: summary.services,
      service: summary.label,
      duration: summary.duration,
      offeredValue: summary.value,
      value: summary.value,
      snapshotAt: context.snapshotAt || new Date().toISOString()
    };
    return clone(snapshot);
  }

  return Object.freeze({
    normalizeService,
    servicesFromAppointment,
    summarize,
    appointmentServiceSnapshot,
    createOfferSnapshot
  });
})();
