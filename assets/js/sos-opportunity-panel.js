/* BeautyMove — Central de Oportunidades S.O.S. */
(function () {
  'use strict';
  const STATUS_KEY = 'beautymove.mvp.professional.daily-status';
  const STATE_KEY = 'beautymove.mvp.state';
  const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value || fallback; } catch (_) { return fallback; } };
  const minutes = (value) => { const parts = String(value || '00:00').split(':').map(Number); return (parts[0] || 0) * 60 + (parts[1] || 0); };
  const today = () => { const picker = document.getElementById('agendaDatePicker'); return picker && picker.value ? picker.value : new Date().toISOString().slice(0, 10); };
  const escapeHtml = (value) => String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const appointmentEnd = (appointment) => minutes(appointment.time) + Math.max(30, Number(appointment.duration) || 60);

  function getAffectedAppointments() {
    const date = today();
    const statuses = read(STATUS_KEY, {});
    const state = read(STATE_KEY, { appointments: [] });
    const appointments = Array.isArray(state.appointments) ? state.appointments : [];
    const result = [];
    appointments.forEach((appointment) => {
      if (!appointment || appointment.date !== date || appointment.status === 'cancelado') return;
      const record = statuses[date + '::' + appointment.professional];
      if (!record || !['absent', 'late'].includes(record.status)) return;
      let affected = false;
      if (record.status === 'late') affected = minutes(appointment.time) < minutes(record.lateStart || '00:00');
      else if (record.absenceType === 'during_day') affected = appointmentEnd(appointment) > minutes(record.absenceStart || '23:59');
      else affected = true;
      if (affected) result.push({ ...appointment, occurrence: record, kind: record.status === 'late' ? 'Atraso' : 'Ausência' });
    });
    return result.sort((a, b) => minutes(a.time) - minutes(b.time));
  }

  function ensureWorkspace() {
    const grid = document.getElementById('agendaGrid');
    if (!grid) return null;
    let workspace = document.getElementById('agendaWorkspace');
    if (!workspace) {
      workspace = document.createElement('div');
      workspace.id = 'agendaWorkspace';
      workspace.className = 'agenda-workspace';
      grid.parentNode.insertBefore(workspace, grid);
      workspace.appendChild(grid);
    }
    return workspace;
  }

  function ensurePanel() {
    const workspace = ensureWorkspace();
    if (!workspace) return null;
    let panel = document.getElementById('sosOpportunityPanel');
    if (!panel) {
      panel = document.createElement('aside');
      panel.id = 'sosOpportunityPanel';
      panel.setAttribute('aria-label', 'Central de Oportunidades S.O.S.');
      workspace.appendChild(panel);
    } else if (panel.parentElement !== workspace) workspace.appendChild(panel);
    return panel;
  }

  const candidates = [
    ['Juliana Costa', '4,9', '15 min', '2,3 km'],
    ['Lucas Ferreira', '4,8', '18 min', '3,1 km'],
    ['Bianca Rodrigues', '4,7', '22 min', '4,2 km'],
    ['Carla Menezes', '4,6', '25 min', '4,8 km'],
    ['Rafael Santos', '4,5', '28 min', '5,0 km']
  ];

  function candidateList() {
    return candidates.map((candidate) => `<div class="sos-op-candidate"><div class="sos-op-avatar-placeholder">${escapeHtml(candidate[0].charAt(0))}</div><div class="sos-op-candidate-main"><div class="sos-op-candidate-name">${escapeHtml(candidate[0])} <span>★ ${candidate[1]}</span></div><div class="sos-op-candidate-data">◷ ${candidate[2]} &nbsp; · &nbsp; ⌖ ${candidate[3]}</div><div class="sos-op-available">● Disponível</div></div><button type="button" class="sos-op-select" data-professional="${escapeHtml(candidate[0])}">Selecionar</button></div>`).join('');
  }

  function render() {
    const panel = ensurePanel();
    if (!panel) return;
    const affected = getAffectedAppointments();
    if (!affected.length) {
      panel.innerHTML = `<div class="sos-op-shell"><header class="sos-op-header"><div class="sos-op-kicker"><span class="sos-op-bolt">⚡</span> S.O.S. EM AÇÃO</div><div class="sos-op-subtitle">Central de Oportunidades</div><div class="sos-op-state"><span></span>Central pronta</div></header><div class="sos-op-body"><div class="sos-op-empty"><div class="sos-op-empty-icon">✓</div><strong>Tudo sob controle</strong><span>Nenhum atendimento afetado neste momento.</span></div><div class="sos-op-principle"><strong>A Agenda identifica. O S.O.S. resolve.</strong><span>Quando uma ocorrência comprometer um atendimento, a oportunidade aparecerá automaticamente aqui.</span></div></div></div>`;
      return;
    }
    const first = affected[0];
    const service = first.service || 'Atendimento afetado';
    const reason = first.kind + (first.occurrence.absenceReason ? ' · ' + first.occurrence.absenceReason : '');
    panel.innerHTML = `<div class="sos-op-shell active"><header class="sos-op-header active"><div class="sos-op-kicker"><span class="sos-op-bolt">⚡</span> S.O.S. EM AÇÃO</div><div class="sos-op-subtitle">Central de Oportunidades</div><div class="sos-op-state active"><span></span>${affected.length} atendimento${affected.length > 1 ? 's' : ''} afetado${affected.length > 1 ? 's' : ''}</div></header><div class="sos-op-body"><section class="sos-op-alert"><div class="sos-op-alert-label">AÇÃO NECESSÁRIA</div><strong>${escapeHtml(service)}</strong><div>${escapeHtml(first.client || 'Cliente')} · ${escapeHtml(first.time)} · ${escapeHtml(first.professional)}</div><small>${escapeHtml(reason)}</small></section><div class="sos-op-search-state"><span class="sos-op-search-dot"></span><strong>Buscando profissionais</strong><small>Central S.O.S. em operação</small></div><div class="sos-op-candidates-title">Profissionais disponíveis</div><div id="sosCandidates">${candidateList()}</div></div><footer class="sos-op-footer">✓ Profissionais verificados pela plataforma</footer></div>`;
    panel.querySelectorAll('.sos-op-select').forEach((button) => button.addEventListener('click', () => { const notice = document.getElementById('agendaNotice'); if (!notice) return; notice.textContent = button.dataset.professional + ' selecionada para esta oportunidade S.O.S.'; notice.hidden = false; clearTimeout(window.__bmSosNotice); window.__bmSosNotice = setTimeout(() => { notice.hidden = true; }, 4000); }));
  }

  function boot() {
    ensureWorkspace();
    render();
    let signature = '';
    setInterval(() => { const current = JSON.stringify([today(), localStorage.getItem(STATUS_KEY), localStorage.getItem(STATE_KEY)]); if (current !== signature) { signature = current; render(); } }, 700);
    document.getElementById('agendaDatePicker')?.addEventListener('change', render);
    document.getElementById('prevDay')?.addEventListener('click', () => setTimeout(render, 150));
    document.getElementById('nextDay')?.addEventListener('click', () => setTimeout(render, 150));
    document.getElementById('todayBtn')?.addEventListener('click', () => setTimeout(render, 150));
    document.addEventListener('beautymove:planchange', render);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 250), { once: true }); else setTimeout(boot, 250);
})();
