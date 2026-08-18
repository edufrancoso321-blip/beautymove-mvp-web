/* BeautyMove — Agenda metrics.
 *
 * The legacy Agenda controller is currently the single renderer of the four
 * bottom metrics. This module remains as the compatibility boundary during
 * the migration, but deliberately does NOT write #metricSos itself.
 *
 * Reason: two independent renderers writing the same DOM node caused the
 * S.O.S. metric to oscillate between 0 and 1 while the S.O.S. panel correctly
 * showed an active opportunity.
 */
(function(){
  'use strict';
  if (window.__BEAUTYMOVE_AGENDA_METRICS_BOUNDARY__) return;
  window.__BEAUTYMOVE_AGENDA_METRICS_BOUNDARY__ = true;
})();
