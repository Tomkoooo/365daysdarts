# ADR-0001: CMS — Extract from tWeb vs Fork

## Status

Accepted

## Context

The marketing CMS in 365daysdarts is block-based but limited: no dynamic page routing, no site settings (SEO/branding/theme), fixed block types, and hardcoded Navbar/Footer.

The tWeb engine (`webshop-engine` / github.com/tomkoooo/tweb) has mature patterns: `PageContentService`, draft/publish JSON, site settings services, block CMS with visual editor.

Options:

1. **Fork tWeb** — inherit full engine including commerce (Stripe, orders, shipping)
2. **Extract core ideas** — port CMS patterns into 365daysdarts without commerce baggage
3. **Build from scratch** — no tWeb reference

## Decision

**Extract core ideas into 365daysdarts.**

## Rationale

- Both repos share Next.js 16 + MongoDB + Tailwind v4 + shadcn
- 365daysdarts is a **learning platform**, not a webshop — commerce code adds noise
- tWeb does **not** support runtime page creation; the website builder is net-new work either way
- Portable pieces: `PageContentService` pattern, settings singleton models, block registry + Zod validation

## Consequences

- Port `PageContentService`-style draft/publish to `ContentPage` model
- Add `SeoSetting`, `BrandingSetting`, `ThemeSetting`, `FooterSetting` models + services
- Add dynamic `[...slug]` routing for CMS pages
- Extend block types (container, card, form) beyond tWeb's homepage blocks
- Do **not** port: Stripe shop, cart, templates registry, deployment config, plugins

## References

- tWeb: `/Users/tomko/programing/webshop-engine`
- Current CMS: `src/models/ContentPage.ts`, `src/actions/content-actions.ts`
