# 365daysdarts Learning Platform

Next.js learning platform with role-based dashboards, course authoring, and a block-based marketing CMS.

## Documentation

All architecture, roadmap, and agent handoff docs live in [`docs/`](docs/):

| Doc | Purpose |
|-----|---------|
| [Architecture Overview](docs/architecture/OVERVIEW.md) | Routes, models, auth, CMS |
| [SaaS Vision](docs/architecture/SAAS_VISION.md) | Multi-sport white-label direction |
| [Roadmap / Phases](docs/roadmap/PHASES.md) | Living implementation status |
| [Workstreams](docs/workstreams/) | Per-area progress scratchpads |

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

See [docs/deployment.md](docs/deployment.md) and [docs/google-oauth-setup.md](docs/google-oauth-setup.md).

## Admin

Admins use `/admin` (not `/dashboard`). CMS content: `/admin/content`. Site settings: `/admin/settings`.

## Agent Rules

Cursor rules in [`.cursor/rules/`](.cursor/rules/) define architecture, UI/UX, SaaS, and CMS conventions for AI agents.
