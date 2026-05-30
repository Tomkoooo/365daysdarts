# SaaS Rewrite — Phases

Living roadmap. Update status and changelog when work progresses.

## Status Legend

- `pending` — not started
- `in_progress` — active work
- `done` — complete
- `blocked` — waiting on dependency

## Phases

| Phase | Scope | Status | Notes |
|-------|-------|--------|-------|
| 0 | Docs + `.cursor` rules | done | Foundation for agent handoff |
| 1 | Role management cleanup | done | `/admin` routes, authz helper, JWT refresh |
| 2 | Admin UX rewrite | done | Shell, mobile fixes, course editor improvements |
| 3 | CMS website builder | done | Dynamic routes, new blocks, site settings |

## Changelog

### 2026-05-30

- Phase 0: docs (`docs/`) and `.cursor/rules/` created
- Phase 1: `/admin/*` shell, `src/lib/authz.ts`, admin redirect from `/dashboard`, role preview at `/admin/preview/[role]`
- Phase 2: responsive admin panels, mobile UX fixes, course editor collapse/search/metadata/publish
- Phase 3: `PageContentService`, dynamic `[...slug]` routing, container/card/form blocks, dnd-kit reorder, site settings at `/admin/settings`
- Production build verified (`npm run build`)
- Follow-up: data-driven Navbar/Footer from site settings, JWT session refresh on self role change, removed legacy `AdminDashboard`

## How Agents Should Update This File

1. Change phase status in the table above
2. Add a dated changelog entry with what changed
3. Update the relevant `docs/workstreams/*.md` file
