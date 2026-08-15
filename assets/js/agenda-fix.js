(function () {
  if (document.body?.dataset?.role !== 'salao') return;

  const STATE_KEY = 'beautymove.mvp.state';
  const SERVICES_KEY = 'beautymove.mvp.services';
  const PROFESSIONALS_KEY = 'beautymove.mvp.professionals';
  const SOS_CONTEXT_KEY = 'beautymove.mvp.sosContext';
  const TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
  const DEFAULT_SERVICES = [
    { id:'svc-corte-feminino', name:'Corte feminino', category:'Cabelos', value:80, status:'ativo' },
    { id:'svc-corte-masculino', name:'Corte masculino', category:'Cabelos', value:50, status:'ativo' },
    { id:'svc-escova', name:'Escova', category:'Cabelos', value:60, status:'ativo' },
    { id:'svc-hidratacao', name:'Hidratação', category:'Cabelos', value:70, status:'ativo' },
    { id:'svc-coloracao', name:'Coloração', category:'Cabelos', value:150, status:'ativo' },
    { id:'svc-luzes', name:'Luzes', category:'Cabelos', value:220, status:'ativo' },
    { id:'svc-maos', name:'Mãos', category:'Mãos e Pés', value:40, status:'ativo' },
    { id:'svc-pes', name:'Pés', category:'Mãos e Pés', value:45, status:'ativo' },
    { id:'svc-maos-pes', name:'Mãos e pés', category:'Mãos e Pés', value:80, status:'ativo' },
    { id:'svc-esmaltacao', name:'Esmaltação', category:'Mãos e Pés', value:35, status:'ativo' },
    { id:'svc-limpeza-pele', name:'Limpeza de pele', category:'Estética', value:120, status:'ativo' },
    { id:'svc-design-facial', name:'Design facial', category:'Estética', value:70, status:'ativo' },
    { id:'svc-virilha', name:'Virilha', category:'Depilação', value:55, status:'ativo' },
    { id:'svc-axila', name:'Axila', category:'Depilação', value:35, status:'ativo' },
    { id:'svc-buco', name:'Buço', category:'Depilação', value:25, status:'ativo' },
    { id:'svc-pernas', name:'Pernas', category:'Depilação', value:70, status:'ativo' },
    { id:'svc-design-sobrancelhas', name:'Design de sobrancelhas', category:'Sobrancelhas', value:45, status:'ativo' },
    { id:'svc-henna', name:'Design com henna', category:'Sobrancelhas', value:60, status:'ativo' }
  ];
  const DEFAULT_PROFESSIONALS = [
    { name:'Ana', specialty:'Cabelos' }, { name:'Bruna', specialty:'Cabelos' },
    { name:'Paula', specialty:'Mãos e Pés' }, { name:'Carla', specialty:'Estética' }
  ];

  const esc = value => String(value ?? '').replace(/[&<>\'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const dateKey = date => { const d=date||new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const getState = () => ({appointments:[], opportunities:[], transactions:[], ...read(STATE_KEY,{})});
  const saveState = state => write(STATE_KEY,state);
  const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

  let selectedDate = new Date();
  let sourceSlot = null;

  function getServices() {
    const saved = read(SERVICES_KEY, null);
    if (!Array.isArray(saved) || !saved.length) {
      write(SERVICES_KEY, DEFAULT_SERVICES);
      return [...DEFAULT_SERVICES];
    }
    const byId = new Map(saved.map(s => [s.id, s]));
    DEFAULT_SERVICES.forEach(s => { if (!byId.has(s.id)) byId.set(s.id, {...s}); });
    const merged = [...byId.values()];
    if (merged.length !== saved.length) write(SERVICES_KEY, merged);
    return merged;
  }

  function getProfessionals() {
    const saved = read(PROFESSIONALS_KEY, null);
    return Array.isArray(saved) && saved.length ? saved : [...DEFAULT_PROFESSIONALS];
  }

  function getProfessional(name) {
    return getProfessionals().find(p => p.name === name) || {};
  }

  function servicesForProfessional(name) {
    const specialty = getProfessional(name).specialty;
    const services = getServices().filter(s => s.status !== 'inativo');
    return specialty ? services.filter(s => s.category === specialty) : services;
  }

  function ensureDateField() {
    const form = document.querySelector('#appointmentForm');
    const professional = document.querySelector('#professionalName');
    if (!form || !professional) return;
    if (!document.querySelector('#appointmentDate')) {
      const field = document.createElement('div');
      field.className = 'field';
      field.innerHTML = '<label for="appointmentDate">Data</label><input id="appointmentDate" name="appointmentDate" readonly aria-readonly="true">';
      professional.closest('.field')?.insertAdjacentElement('afterend', field);
    }
    const actions = form.querySelector('.form-actions');
    if (actions && !document.querySelector('#appointmentSosBtn')) {
      const sos = document.createElement('button');
      sos.type = 'button';
      sos.id = 'appointmentSosBtn';
      sos.className = 'sos-subtle compact';
      sos.textContent = 'S.O.S. Profissionais';
      actions.insertBefore(sos, actions.querySelector('[type="submit"]'));
      sos.addEventListener('click', sendToSos);
    }
  }

  function closeAppointment() {
    const modal = document.querySelector('#appointmentModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
  }

  function openAppointment(time, professional) {
    const modal = document.querySelector('#appointmentModal');
    const form = document.querySelector('#appointmentForm');
    if (!modal || !form) return;
    ensureDateField();

    sourceSlot = { time: time || '', professional: professional || '' };
    const prof = document.querySelector('#professionalName');
    const client = document.querySelector('#clientName');
    const timeField = document.querySelector('#appointmentTime');
    const dateField = document.querySelector('#appointmentDate');
    const value = document.querySelector('#serviceValue');

    const list = getProfessionals();
    prof.innerHTML = list.map(p => `<option value="${esc(p.name)}" ${p.name === professional ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    timeField.innerHTML = TIMES.map(t => `<option value="${t}" ${t === time ? 'selected' : ''}>${t}</option>`).join('');
    dateField.value = selectedDate.toLocaleDateString('pt-BR');
    client.value = '';
    value.value = '';

    buildServicePicker(prof.value, []);
    prof.onchange = () => buildServicePicker(prof.value, []);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    setTimeout(() => client.focus(), 30);
  }

  function buildServicePicker(professional, initialIds) {
    const container = document.querySelector('#servicePicker');
    if (!container) return;
    const services = servicesForProfessional(professional);
    let committed = [...new Set(initialIds || [])].filter(id => services.some(s => s.id === id));
    let draft = [...committed];

    const selected = ids => services.filter(s => ids.includes(s.id));
    const total = ids => selected(ids).reduce((sum,s) => sum + Number(s.value || 0), 0);
    const label = ids => {
      const items = selected(ids);
      if (!items.length) return 'Selecione os serviços';
      if (items.length === 1) return items[0].name;
      return `${items.length} serviços selecionados`;
    };

    container.dataset.valueTarget = '#serviceValue';
    container.innerHTML = `
      <button type="button" class="service-picker-trigger" aria-expanded="false">
        <span class="service-picker-label">${esc(label(committed))}</span>
        <span class="service-picker-arrow">⌄</span>
      </button>
      <div class="service-picker-menu" hidden>
        <div class="service-picker-options">
          ${services.map(s => `<label class="service-option"><input type="checkbox" value="${esc(s.id)}" ${committed.includes(s.id) ? 'checked' : ''}><span>${esc(s.name)}</span><strong>${money(s.value)}</strong></label>`).join('')}
        </div>
        <div class="service-picker-menu-actions">
          <button type="button" class="secondary compact" data-service-cancel>Cancelar</button>
          <button type="button" class="primary compact" data-service-confirm>Confirmar seleção</button>
        </div>
      </div>`;

    const trigger = container.querySelector('.service-picker-trigger');
    const menu = container.querySelector('.service-picker-menu');
    const value = document.querySelector('#serviceValue');

    function updateCommitted() {
      const items = selected(committed);
      container.querySelector('.service-picker-label').textContent = label(committed);
      if (value) value.value = items.length ? total(committed).toFixed(2).replace('.', ',') : '';
    }

    function closeMenu(cancelDraft) {
      if (cancelDraft) draft = [...committed];
      menu.hidden = true;
      trigger.setAttribute('aria-expanded','false');
      menu.querySelectorAll('input').forEach(input => { input.checked = draft.includes(input.value); });
    }

    trigger.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      if (menu.hidden) {
        draft = [...committed];
        menu.hidden = false;
        trigger.setAttribute('aria-expanded','true');
      } else {
        closeMenu(true);
      }
    };

    menu.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', () => {
        if (input.checked && !draft.includes(input.value)) draft.push(input.value);
        if (!input.checked) draft = draft.filter(id => id !== input.value);
      });
    });

    menu.querySelector('[data-service-confirm]').onclick = e => {
      e.preventDefault();
      committed = [...draft];
      updateCommitted();
      closeMenu(false);
    };

    menu.querySelector('[data-service-cancel]').onclick = e => {
      e.preventDefault();
      closeMenu(true);
    };

    container._getSelected = () => {
      const items = selected(committed);
      return { ids:[...committed], services:items, total:total(committed) };
    };

    updateCommitted();
  }

  function sendToSos() {
    const professional = document.querySelector('#professionalName')?.value || sourceSlot?.professional || '';
    const time = document.querySelector('#appointmentTime')?.value || sourceSlot?.time || '';
    const client = document.querySelector('#clientName')?.value?.trim() || '';
    const picker = document.querySelector('#servicePicker');
    const selection = picker?._getSelected() || {ids:[],services:[],total:0} : {ids:[],services:[],total:0};
    if (!selection.services.length) {
      alert('Selecione e confirme pelo menos um serviço antes de acionar o S.O.S.');
      return;
    }
    write(SOS_CONTEXT_KEY, {
      date: dateKey(selectedDate), time, professional, client,
      source:'agenda', serviceIds:selection.ids,
      services:selection.services.map(s => ({id:s.id,name:s.name,value:Number(s.value),category:s.category})),
      service:selection.services.map(s => s.name).join(' + '), value:selection.total
    });
    window.location.href = 'sos.html?origem=agenda&horario=selecionado';
  }

  function submitAppointment(e) {
    e.preventDefault();
    e.stopPropagation();
    const form = e.currentTarget;
    const client = document.querySelector('#clientName')?.value.trim();
    const professional = document.querySelector('#professionalName')?.value;
    const time = document.querySelector('#appointmentTime')?.value;
    const picker = document.querySelector('#servicePicker');
    const selection = picker?._getSelected() || {ids:[],services:[],total:0} : {ids:[],services:[],total:0};

    if (!client) { alert('Informe o nome da cliente.'); return; }
    if (!professional || !time) { alert('Informe profissional e horário.'); return; }
    if (!selection.services.length) { alert('Selecione e confirme pelo menos um serviço.'); return; }

    const prof = getProfessional(professional);
    if (prof.specialty && selection.services.some(s => s.category !== prof.specialty)) {
      alert('Os serviços selecionados não correspondem à especialidade da profissional.');
      return;
    }

    const state = getState();
    const currentDate = dateKey(selectedDate);
    const occupied = state.appointments.some(a => a.date === currentDate && a.time === time && a.professional === professional && a.status !== 'cancelado');
    if (occupied) { alert('Este horário já está ocupado para esta profissional.'); return; }

    const snapshot = selection.services.map(s => ({id:s.id,name:s.name,value:Number(s.value),category:s.category}));
    state.appointments.push({
      id:makeId('apt'), date:currentDate, time, professional,
      client, service:snapshot.map(s => s.name).join(' + '),
      serviceId:snapshot[0]?.id || null, serviceIds:snapshot.map(s => s.id),
      services:snapshot, value:Number(selection.total), status:'agendado', source:'salao'
    });
    saveState(state);
    closeAppointment();
    if (typeof window.renderAppointments === 'function') window.renderAppointments();
    document.querySelector('#agendaBody')?.dispatchEvent(new Event('beautymove:refresh'));
    window.location.reload();
  }

  function interceptClicks() {
    document.addEventListener('click', e => {
      const slot = e.target.closest?.('[data-slot]');
      if (slot) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const [time, ...rest] = slot.dataset.slot.split('-');
        const professional = rest.join('-');
        const state = getState();
        const currentDate = dateKey(selectedDate);
        const appointment = state.appointments.find(a => a.date === currentDate && a.time === time && a.professional === professional && a.status !== 'cancelado');
        if (!appointment) openAppointment(time, professional);
        return;
      }

      const button = e.target.closest?.('#newAppointmentBtn, #quickAppointmentBtn');
      if (button) {
        e.preventDefault();
        e.stopImmediatePropagation();
        selectedDate = new Date();
        openAppointment('', '');
      }
    }, true);

    document.addEventListener('click', e => {
      document.querySelectorAll('.service-picker-menu:not([hidden])').forEach(menu => {
        const picker = menu.closest('.service-picker');
        if (picker && !picker.contains(e.target)) {
          const trigger = picker.querySelector('.service-picker-trigger');
          menu.querySelector('[data-service-cancel]')?.click();
          trigger?.setAttribute('aria-expanded','false');
        }
      });
    });
  }

  function injectStyles() {
    if (document.querySelector('#agendaFixStyles')) return;
    const style = document.createElement('style');
    style.id = 'agendaFixStyles';
    style.textContent = `
      #appointmentModal .modal-card { max-width: 700px; }
      #appointmentModal .modal-intro { margin-bottom: 18px; }
      #appointmentModal .service-picker-menu { padding: 8px; }
      #appointmentModal .service-picker-options { max-height: 230px; overflow:auto; }
      #appointmentModal .service-picker-menu-actions { display:flex; justify-content:flex-end; gap:8px; padding:10px 2px 2px; border-top:1px solid #eee8f5; margin-top:6px; }
      #appointmentModal .service-picker-menu-actions .primary { background:#7438ff; color:#fff; border-color:#7438ff; }
      #appointmentModal .service-picker-menu-actions .primary:hover { background:#6330df; border-color:#6330df; }
      #appointmentModal .form-actions { align-items:center; }
      #appointmentSosBtn { border:1px solid #7438ff; background:#7438ff; color:#fff; font-weight:700; }
      #appointmentSosBtn:hover { background:#6330df; border-color:#6330df; }
    `;
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    ensureDateField();
    const form = document.querySelector('#appointmentForm');
    if (form) form.addEventListener('submit', submitAppointment, true);
    document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeAppointment, true));
    interceptClicks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
