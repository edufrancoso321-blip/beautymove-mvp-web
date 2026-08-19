# BeautyMove — Foundation Inventory

Date: 2026-08-18
Branch: foundation/housekeeping-2026-08-18

## Verified findings

### Agenda runtime
- `agenda-v1.html` renders an Agenda shell and loads a single `assets/js/agenda.js` controller, but the repository also contains a separate `assets/js/agenda-operations.js` implementation and multiple Agenda-specific correction/controller assets.
- `agenda.js` currently persists Agenda state through `localStorage` (`beautymove.mvp.state` and `beautymove.mvp.agenda.hours`).
- The repository also contains a Firebase/Firestore data bridge and Firestore security rules for appointments, opportunities, transactions, salons, professionals and clients.
- Therefore the current system has two persistence paths for operational Agenda data: local cache/state and Firestore synchronization.

### Technical debt
The repository contains multiple Agenda assets with overlapping responsibility, including correction/stable/fix/controller variants. These must be mapped by actual references before any deletion or consolidation.

### Deployment validation
The current quality workflow validates JavaScript syntax only. It does not validate DOM behavior, browser layout, data synchronization, or regression behavior.

## Stabilization decisions

1. Preserve `main` as production.
2. Continue all foundation work on this branch.
3. Do not delete Agenda assets based on filenames alone.
4. Establish one canonical Agenda runtime before removing legacy assets.
5. Treat Firestore as the authoritative persisted operational data source; localStorage may only be an explicitly defined cache/fallback, never an independent source of truth.
6. Add validation gates before merging foundation work.

## Next consolidation target

Trace every script and stylesheet loaded by the production salon page, identify the authoritative Agenda controller and every overlapping runtime patch, then consolidate only after dependency tracing.
