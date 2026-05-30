# Workstream: Admin UX

## Goal

Mobile-first `/admin` shell replacing cramped `AdminDashboard`. Fix audited UX defects.

## Done

- [x] Responsive admin shell with sidebar (drawer on mobile)
- [x] Sections: Overview, Users, Courses, Content, Settings, Preview
- [x] User list: search, role filter, pagination, card layout on mobile
- [x] Hover-only controls → always visible / dropdown menus (course editor, MediaManager)
- [x] ModuleSettings responsive grid
- [x] Course editor: collapse modules/chapters, search filter
- [x] Course cover upload via MediaManager + post-create metadata edit
- [x] Publish button wired to `updateCourse({ isPublished })`

## Blocked

_None_

## Files

- `src/app/admin/` — admin routes
- `src/components/admin/` — shell, nav, shared admin UI
