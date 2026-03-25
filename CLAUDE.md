# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start development server (Vite, localhost:5173)
yarn build        # Type-check (tsc -b) then build for production
yarn lint         # Run ESLint across the codebase
yarn preview      # Preview the production build locally
```

There are no tests configured in this project.

## Architecture

### Stack
- **React 19 + TypeScript** via Vite
- **Routing:** React Router v7
- **State:** Zustand v5 (one store per domain)
- **API:** Axios with a shared `apiClient` in `src/services/api.ts`
- **UI:** Shadcn UI (Radix primitives) + Tailwind CSS + Lucide icons
- **Path alias:** `@/` maps to `src/`

### Auth Flow
OTP-based login — no password. `POST /auth/verify-otp` returns a JWT stored in `localStorage` under the key `admin_token`. The Axios request interceptor in `src/services/api.ts` automatically attaches it as `Authorization: Bearer <token>` on every request. Auth state lives in `useAuthStore` (Zustand), which also reads from localStorage on init so sessions survive page refreshes.

### Route Protection
Two levels of protection:
- `src/routes/ProtectedRoute.tsx` — requires authentication (`isAuthenticated` from `useAuthStore`)
- `src/routes/SuperAdminRoute.tsx` — additionally requires `role === "superadmin"` (use `isSuperAdmin()` exported from `auth.store.ts`)

Unauthenticated users → `/login`. Authenticated non-superadmins hitting a superadmin route → redirect.

### State / Data Fetching Pattern
Two patterns coexist:

**Zustand store pattern** (core domains) — store owns fetching, loading, error, and pagination:
- `useAuthStore` — login/logout, persisted token, `isSuperAdmin()` helper
- `useUsersStore` — user list + user detail (paginated, 20/page)
- `useAnalyticsStore` — dashboard stats and trends
- `useReportedStore` — reported/flagged files (paginated)

**Direct service call pattern** (revenue domain) — pages call `earning.service.ts` functions directly without a store. New revenue pages follow this pattern.

Stores/services use `apiClient` from `src/services/api.ts`. Components subscribe to store slices via selectors.

### Revenue / Earning Domain
All revenue routes are superadmin-only. The `earning.service.ts` (largest service at ~400 lines) covers all endpoints under `/web/earning/`:

| Feature | Endpoints |
|---|---|
| Overview | `/web/earning/overview` |
| Events | `/web/earning/events`, `/web/earning/events/:id` (approve/reject/flag/fraud) |
| Bulk actions | `/web/earning/events/bulk-action` |
| Fraud queue | `/web/earning/events/fraud-queue` |
| Payouts | `/web/earning/payouts`, `/web/earning/payouts/:id` (approve/hold/release/mark-paid/retry) |
| User earning | `/web/earning/users/:userId` (profile, suspend, reinstate, plan-override, block-payouts) |
| Config & Plans | `/web/earning/config`, `/web/earning/plans` |
| Audit log | `/web/earning/audit-log` |

Note: earning service interfaces define fields in **both** snake_case and camelCase (e.g., `event_type`/`eventType`) to handle backend response format variations.

### Key API Endpoints
| Store/Service | Backend path |
|---|---|
| Auth | `/auth/verify-otp` |
| Users list | `/web/admin/users` |
| User detail | `/web/admin/user/:id` |
| User actions (delete/restore/block) | `/web/admin/users/:id` |
| User affiliates | `/web/admin/users/:id/affiliates` |
| User uploads | `/web/admin/users/:id/uploads` |
| Dashboard stats | `/web/analytics/dashboard-stats` |
| Reported items | `/web/admin/reported-items` |

### Dashboard Visibility Config
`src/config/dashboardConfig.ts` exports `ADMIN_DASHBOARD_VISIBILITY` — controls which stats/charts regular admins see vs superadmins. Regular admins have a limited view; superadmins see everything.

### Environment
`VITE_API_URL` in `.env` sets the API base URL (currently `https://api.tenbox.app/api/v1`). The fallback in `api.ts` is `http://localhost:3000/api`. Restart the dev server after changing `.env`.

### Layout
`DashboardLayout` (`src/layouts/`) wraps all protected pages with a collapsible sidebar. The Revenue section in the sidebar is a submenu with 7 items (Overview, Revenue Events, Payouts, Earning Plans, Revenue Config, Activity Feed, Audit Log) — only rendered for superadmins. Pages live in `src/pages/`.

### Utilities
`src/utils/index.ts` exports `bytesToGB()`, `formatDate()` (via date-fns), `formatSize()` (auto-scales to B/KB/MB/GB/TB), `calculateUserStorage()`, and a `SizeUnits` enum. `src/hooks/useDebounce.ts` provides a `useDebounce<T>()` hook (default 400ms delay).
