# Architecture Overview

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Auth | NextAuth v4 (Google OAuth, JWT sessions) |
| Database | MongoDB via Mongoose |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Payments | Stripe (subscriptions) |
| Media | GridFS (`uploads` bucket) |

## Route Map

### Public / marketing

| Path | Handler |
|------|---------|
| `/` | `src/app/page.tsx` → CMS slug `home` |
| `/*` | `src/app/[...slug]/page.tsx` → CMS by slug |
| `/courses`, `/courses/[id]/learn` | Course catalog & player |
| `/login`, `/register` | Auth pages |

### Role dashboards

| Path | Role |
|------|------|
| `/dashboard` | student, lecturer, business (role-specific UI) |
| `/admin/*` | admin only (unified admin shell) |
| `/lecturer/*` | lecturer + admin |
| `/dashboard/content` | legacy CMS redirect → `/admin/content` |

### API

- `/api/auth/[...nextauth]` — NextAuth
- `/api/upload`, `/api/upload/chunk` — file upload
- `/api/media`, `/api/media/[id]` — media serve/list
- `/api/stripe/*` — checkout & webhooks

## Data Models (`src/models/`)

| Model | Purpose |
|-------|---------|
| `User` | Auth, role, subscription, progress |
| `Course`, `Module`, `Chapter`, `Page` | Learning content hierarchy |
| `Question`, `ExamResult` | Assessments |
| `Dolgozat`, `OptionSelector` | Assignments & selectors |
| `ContentPage` | Marketing CMS pages (blocks) |
| `SeoSetting`, `BrandingSetting`, `ThemeSetting`, `FooterSetting` | Site-wide settings |
| `Notification` | User notifications |

## Server Actions (`src/actions/`)

- `admin-actions.ts` — users, roles, subscriptions
- `course-actions.ts` — course CRUD & structure
- `content-actions.ts` — CMS pages & blocks
- `site-settings-actions.ts` — SEO, branding, theme, footer
- `business-actions.ts`, `exam-actions.ts`, etc.

## Auth & Authorization

- Session: JWT with `id`, `role`, `subscriptionStatus`
- Helpers: `src/lib/authz.ts` — `requireRole()`, `requireAdmin()`, etc.
- Middleware: `src/middleware.ts` — protects `/dashboard`, `/admin`, `/lecturer`
- Admin bypass: admins can access `/lecturer/*` routes

## CMS Architecture (Phase 3)

- **PageContentService** (`src/services/page-content.ts`) — draft/publish contract inspired by tWeb
- **ContentPage** model — slug, blocks, meta (SEO), draft/published snapshots
- **Block registry** (`src/lib/content/types.ts`) — typed blocks with Zod validation
- **Renderer** (`src/components/content/MarketingBlockRenderer.tsx`) — public block rendering

## Media

Upload flow: client → `/api/upload/chunk` → GridFS → URL `/api/media/{id}`

Used by: course editor, CMS blocks, site settings (logos), course thumbnails.
