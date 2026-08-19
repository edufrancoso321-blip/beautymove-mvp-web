# BeautyMove — Agenda Consolidation Baseline

Date: 2026-08-19
Branch: `foundation/agenda-consolidation-2026-08-19`

## Objective

Stabilize the salon Agenda by removing competing runtime layers and establishing one production page/controller/style path.

## Runtime baseline

`salao.html` now loads only:

- `assets/css/styles.css`
- `assets/css/agenda-canonical.css`
- `assets/js/plan-access.js`
- `assets/js/agenda.js`

All previous Agenda `fix`, `final`, `stable`, `correction`, `isolation`, `sticky` and duplicate controller assets are no longer loaded by the salon Agenda page.

## Responsibility model

- `agenda.js`: authoritative Agenda controller for the page.
- `agenda-canonical.css`: authoritative Agenda presentation layer for the page.
- `plan-access.js`: plan/access gate only.
- `localStorage` remains the current operational persistence mechanism in this baseline; Firebase migration is a separate controlled task and must not be mixed into UI stabilization.

## Important safety rule

No legacy Agenda file is deleted solely because of its filename. Unused assets remain in the repository until repository-wide references are verified. This prevents accidental breakage in other pages.

## Acceptance gate before merging to `main`

1. Load the published branch in a real browser.
2. Create a normal appointment.
3. Open the created appointment and confirm the correct client/time/professional.
4. Edit/reschedule the appointment.
5. Change status to in-progress and finished.
6. Cancel the normal appointment and confirm only that appointment changes.
7. Create an S.O.S. request.
8. Open and cancel the S.O.S. and confirm no normal appointment changes.
9. Switch date, interval and professional filter.
10. Open/close service selection and schedule settings.
11. Hard refresh and repeat the isolation checks.
12. Verify mobile layout.

The branch is not considered production-ready until these browser regression checks pass.
