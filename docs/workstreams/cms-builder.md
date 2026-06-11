# Workstream: CMS Website Builder

## Goal

True website builder: create pages at runtime, dynamic routing, extended blocks, editable SEO/branding/theme from one admin.

## Done

- [x] `PageContentService` pattern in `src/services/page-content.ts`
- [x] Extended block types: `container`, `card`, `form`
- [x] Dynamic routing: `app/page.tsx` (home) + `app/[...slug]/page.tsx`
- [x] Removed hardcoded marketing route files (CMS serves all slugs)
- [x] Site settings models: Seo, Branding, Theme, Footer
- [x] `/admin/settings` for global SEO, branding, theme, footer
- [x] Per-page SEO meta on `ContentPage`
- [x] Publish revalidates correct paths
- [x] Drag-and-drop block reorder in CMS editor

## Blocked

_None_

## Migration Notes

- Existing seeded slugs in `MARKETING_PAGE_SEEDS` continue to work via dynamic routes
- Static `app/dartsosoknak/...` files removed — content comes from DB or seeds
