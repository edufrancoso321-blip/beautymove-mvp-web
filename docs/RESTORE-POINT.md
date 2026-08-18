# Restore Point

## Base preserved before refactor

- Branch: `backup/pre-auditoria-2026-08-18`
- Base commit: `eac11b0769e95dd784194b2315813eab655bad0a`
- Date: 2026-08-18
- Main branch remains unchanged.

## How this is used

If the refactor branch introduces a regression, the project can return to the exact pre-audit state by using the backup branch as the restore reference.

Do not delete this branch until the refactor is validated in the browser and all critical flows pass.
