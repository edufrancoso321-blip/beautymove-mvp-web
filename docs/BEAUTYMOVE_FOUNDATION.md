# BeautyMove — Foundation Control

## Status

This document is the technical control point for the housekeeping branch created on 2026-08-18.

## Production rule

- `main` is production.
- Structural cleanup is performed outside `main`.
- No experimental fix files are to be added to production as a substitute for fixing the responsible layer.
- A block is complete only after implementation, validation, and regression checks.

## Current technical finding

The Agenda currently has multiple CSS and JavaScript layers whose names indicate successive fixes, finals, stable versions, corrections, and layout patches. `salao.html` directly loads several of these layers at the same time. This is technical debt and is the primary stabilization target.

## Cleanup rule

No existing file is deleted merely because its name looks obsolete. Before removal, its references and runtime responsibility must be verified. Files that are still required remain available until their responsibility has been consolidated.

## Canonical target

The Agenda must converge toward:

1. one authoritative data/controller path;
2. one authoritative structural/layout path;
3. explicit functional modules for S.O.S., services, appointments and settings;
4. one defined scrolling container;
5. Firebase as the source of truth for persisted state;
6. no cascading `fix`/`final` layers that compete for the same DOM responsibility.

## Acceptance gate

The housekeeping branch may only be merged when:

- the current production behavior is preserved or intentionally corrected;
- duplicate responsibilities are removed or consolidated;
- JavaScript syntax checks pass;
- the Firebase/data contract remains intact;
- Agenda, S.O.S. and authentication entry points remain wired;
- the published build is validated before the branch becomes the new production baseline.
