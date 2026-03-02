# IMPL PLAN: Connect Routes & Build Missing Pages

## Context
The application has a rich backend (Modules 1-16) but the frontend is incomplete.
- **Broken Links**: Sidebar links to `/dashboard/admin` but the page does not exist.
- **Missing Links**: Core modules like `Placements`, `Invoices`, `Integrations`, `Documents` have backend services but no frontend pages or Sidebar links.

## Goal
"Connect the routes" by:
1.  Creating the missing frontend pages.
2.  Updating the Sidebar to include them.
3.  Connecting the new pages to the existing backend actions/services.

## Scope (Phased)

### Phase 1: Core Business Logic (High Priority)
- **Placements** (`module8`)
    - [ ] [NEW] `app/(dashboard)/dashboard/placements/page.tsx` (List)
    - [ ] [NEW] `app/(dashboard)/dashboard/placements/[id]/page.tsx` (Details/Edit)
    - [ ] [MODIFY] `components/layout/Sidebar.tsx` (Add Link)
    - *Logic*: Connect to `module8-placement.ts` / `placement.service.ts`.
- **Invoices** (`module14`)
    - [ ] [NEW] `app/(dashboard)/dashboard/invoices/page.tsx`
    - [ ] [MODIFY] `components/layout/Sidebar.tsx` (Add Link)
    - *Logic*: Connect to `module14-invoice.ts`.

### Phase 2: Admin & System (Fixing Broken Routes)
- **Admin Dashboard**
    - [ ] [NEW] `app/(dashboard)/dashboard/admin/page.tsx`
    - *Purpose*: Fix the broken Sidebar link.
- **Integrations** (`module13`)
    - [ ] [NEW] `app/(dashboard)/dashboard/integrations/page.tsx` (or under Admin)
    - *Logic*: Connect to `module13-integrations.ts`.

### Phase 3: Supporting Modules (Time Permitting)
- **Documents**, **Automation**, **Workflows**.
- Add links if critical, else accessible via context (e.g., Documents inside Candidates).

## Proposed Changes (Phase 1 & 2 Focus)

### 1. Sidebar Update (`components/layout/Sidebar.tsx`)
- Add `Placements` (Role: ADMIN, RECRUITER, COORDINATOR).
- Add `Invoices` (Role: ADMIN, COORDINATOR).
- Ensure `Admin` link works (requires Page creation).

### 2. Page Implementation Standard
For each new page (`Placements`, `Invoices`):
- **Header**: Title + "Create New" button.
- **Table**: Interactive table (using `InteractiveTableRow` or similar) fetching data via Server Action.
- **Search/Filter**: Basic filtering.
- **State**: Use URL search params for state management.

## Verification Plan

### Automated
- **Build**: `npm run build` must pass.
- **Lint**: `npm run lint` must pass.

### Manual Verification
1.  **Sidebar**: Verify all links appear for Admin.
2.  **Navigation**: Click "Placements" -> Should see empty state or list (not 404).
3.  **Navigation**: Click "Admin" -> Should see Admin Dashboard (not 404).
4.  **Network**: Verify `createPlacementAction` or `getPlacements` is called when interacting.

## Risk
- **UI/UX Consistency**: New pages must match `DESIGN_SYSTEM_2.0.md`. I will use existing components (`AppShell`, `InteractiveTableRow`) to ensure consistency.

---
**ARCHITECT LOCK:** Plan created. I cannot proceed until you type **'APPROVED'**.
