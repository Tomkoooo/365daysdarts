# Workstream: Role Management

## Goal

Admins navigate `/admin` directly. Role preview is explicit, not the primary entry gate. JWT reflects role changes without full re-login.

## Done

- [x] `src/lib/authz.ts` — centralized permission helpers
- [x] JWT `trigger: "update"` in `src/lib/auth.ts` refreshes role from DB
- [x] Admin routes under `/admin/*` (middleware guard now meaningful)
- [x] Dashboard redirects admins to `/admin`
- [x] Role preview via `/admin/preview/[role]` with clear banner + exit
- [x] Removed `viewMode` as primary navigation from old AdminDashboard

## Blocked

_None_

## Notes

- `DevModeRoleSwitcher` remains for `DEV_MODE=true` local development only
- Admin "preview as role" is UI-only — session stays `admin`; server actions still see admin role
- Full server-side impersonation is a future enhancement if needed
