# SaaS Vision

## Goal

Package the learning platform as a **white-label SaaS** sellable to other sports and training organizations — not only darts.

## Principles

1. **Tenant-neutral admin** — shared admin chrome must not hardcode sport-specific copy ("darts", "365daysdarts").
2. **Data-driven branding** — logo, site name, colors, footer content editable from `/admin/settings`.
3. **Configurable marketing site** — CMS page builder with dynamic routes; no developer needed for new pages.
4. **Role clarity** — admins use `/admin` directly; role preview is explicit, not the primary navigation.
5. **Mobile-first admin** — all admin surfaces usable on phones/tablets.

## Current Tenant Config (defaults)

Stored in MongoDB singleton docs:

- `BrandingSetting` — brand name, logos
- `ThemeSetting` — CSS color tokens
- `SeoSetting` — global meta, OG, favicon
- `FooterSetting` — tagline, links, social

Defaults fall back to current 365daysdarts branding until changed in admin.

## Future (out of scope for current phases)

- Multi-tenant isolation (tenantId on all collections)
- Custom domains per tenant
- Stripe Connect / per-tenant billing
- Sport-specific course templates

## Agent Notes

When adding UI in `/admin` or shared layout components:

- Use settings services for display names/logos
- Avoid hardcoding Hungarian darts-specific strings in reusable components
- Sport-specific seed content belongs in `default-pages.ts`, not in admin shell
