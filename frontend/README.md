# Sbe Annex — Frontend

> React + TypeScript + Vite frontend for the Sbe Annex academic resource platform. Students can register, browse notes and past papers, read blogs targeted to their group, and submit reviews. Admins access a dedicated dashboard for content moderation and platform management.

**Live site:** https://bbm.giftedtech.co.ke  
**Backend API:** https://bbmback.giftedtech.co.ke  
**Backend repo:** https://github.com/mauricegift/bbmannex-backend

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Pages & Routes](#pages--routes)
4. [Quick Start](#quick-start)
5. [Environment & API Integration](#environment--api-integration)
6. [Authentication](#authentication)
7. [Key Features](#key-features)
8. [Deployment (Vercel)](#deployment-vercel)
9. [Repo Strategy](#repo-strategy)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite (SWC plugin) |
| Styling | Tailwind CSS v3 |
| UI Components | shadcn/ui (Radix UI primitives) |
| Routing | React Router v6 |
| HTTP | Native `fetch` API |
| Rich text | TipTap / RichTextEditor component |
| PDF viewer | Custom `CustomPdfViewer` component |
| Theme | Dark / Light toggle (next-themes) |
| Linting | ESLint + TypeScript ESLint |

---

## Project Structure

```
src/
├── main.tsx                   # App entry point
├── App.tsx                    # Router setup, layout wrapping
├── App.css / index.css        # Global styles
│
├── pages/
│   ├── Index.tsx              # Landing / marketing page
│   ├── Home.tsx               # Authenticated home / feed
│   ├── Dashboard.tsx          # User stats dashboard
│   ├── Notes.tsx              # Notes listing & search
│   ├── PastPapers.tsx         # Past papers listing & search
│   ├── Blog.tsx               # Blog listing & individual posts
│   ├── Profile.tsx            # User profile view / edit
│   ├── Settings.tsx           # Account settings
│   ├── About.tsx              # About the platform
│   ├── Contact.tsx            # Contact form
│   ├── FAQ.tsx                # Frequently asked questions
│   ├── Privacy.tsx            # Privacy policy
│   ├── Terms.tsx              # Terms of service
│   ├── NotFound.tsx           # 404 page
│   │
│   ├── auth/
│   │   ├── Login.tsx          # Login page
│   │   ├── Register.tsx       # Registration (group / specialization dropdown)
│   │   ├── ForgotPassword.tsx # Request password reset
│   │   ├── ResetPassword.tsx  # Complete password reset (link or SMS)
│   │   └── VerifyEmail.tsx    # Email / SMS verification screen
│   │
│   └── admin/
│       └── Admin.tsx          # Admin dashboard (users, notes, papers, blogs, groups)
│
├── components/
│   ├── Navbar.tsx             # Top navigation bar
│   ├── Footer.tsx             # Site footer
│   ├── Layout.tsx             # Page layout wrapper
│   ├── PublicHeader.tsx       # Header for unauthenticated pages
│   ├── NavLink.tsx            # Active-state aware navigation link
│   ├── Breadcrumbs.tsx        # Dynamic breadcrumb trail
│   ├── LoadingSpinner.tsx     # Full-page loading state
│   ├── LogoSpinner.tsx        # Brand-coloured spinner
│   ├── ErrorBoundary.tsx      # React error boundary wrapper
│   ├── PageTransition.tsx     # Animated route transitions
│   ├── ScrollToTop.tsx        # Scroll to top on route change
│   ├── ScrollToTopOnNavigate.tsx
│   ├── PageSkeletons.tsx      # Skeleton loading screens per page type
│   ├── ReviewSection.tsx      # Star rating + review list component
│   ├── ReviewsDialog.tsx      # Modal dialog for writing a review
│   ├── DocumentViewer.tsx     # In-browser document viewer
│   ├── CustomPdfViewer.tsx    # PDF renderer with page controls
│   ├── RichTextEditor.tsx     # TipTap-based blog editor
│   ├── FileUploadWithPreview.tsx  # Desktop file upload with preview
│   ├── MobileFileInput.tsx    # Mobile-optimised file input
│   ├── MobileUploadArea.tsx   # Mobile drag-drop / tap upload area
│   ├── MobileOptimizedCard.tsx    # Touch-friendly card component
│   ├── SpecializationFilter.tsx   # Dropdown filter for specializations
│   ├── theme-provider.tsx     # next-themes context provider
│   ├── theme-toggle.tsx       # Dark / light mode button
│   └── ui/                   # shadcn/ui generated components
│
├── contexts/
│   └── AuthContext.tsx        # Global auth state (user, token, login/logout helpers)
│
├── hooks/
│   ├── use-mobile.tsx         # Responsive mobile breakpoint hook
│   ├── use-toast.ts           # Toast notification hook
│   └── useKeyboardShortcuts.ts  # Global keyboard shortcut handler
│
├── lib/
│   └── utils.ts              # cn() class name utility + misc helpers
│
└── utils/
    └── mobileUpload.ts        # Mobile upload debugging + navigation helpers
```

---

## Pages & Routes

| Route | Component | Auth required |
|---|---|---|
| `/` | `Index` (landing page) | No |
| `/home` | `Home` | Yes |
| `/dashboard` | `Dashboard` | Yes |
| `/notes` | `Notes` | Yes |
| `/past-papers` | `PastPapers` | Yes |
| `/blog` | `Blog` | No (group content filtered) |
| `/profile` | `Profile` | Yes |
| `/settings` | `Settings` | Yes |
| `/about` | `About` | No |
| `/contact` | `Contact` | No |
| `/faq` | `FAQ` | No |
| `/privacy` | `Privacy` | No |
| `/terms` | `Terms` | No |
| `/auth/login` | `Login` | No |
| `/auth/register` | `Register` | No |
| `/auth/forgot-password` | `ForgotPassword` | No |
| `/auth/reset-password` | `ResetPassword` | No |
| `/auth/verify` | `VerifyEmail` | No |
| `/admin` | `Admin` | Admin only |
| `*` | `NotFound` | No |

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/mauricegift/bbm-annex.git
cd bbm-annex

# 2. Install dependencies (uses bun or npm)
bun install
# or: npm install

# 3. Start the dev server
bun run dev
# or: npm run dev

# 4. Open in browser
# http://localhost:8080
```

---

## Environment & API Integration

All API calls go to the backend. In **production on Vercel**, `vercel.json` proxies `/api/*` to `https://bbmback.giftedtech.co.ke/api/*` — no CORS issues, no hardcoded base URLs needed in the frontend code itself.

```json
// vercel.json (production only, not committed to the public repo)
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://bbmback.giftedtech.co.ke/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

In development, make API calls directly to `http://localhost:3192/api/...` or point to the live API.

---

## Authentication

Authentication state is managed globally in `AuthContext.tsx`:

```tsx
const { user, token, login, logout, isAuthenticated } = useAuth();
```

- On login, the JWT is stored in `localStorage` and attached as `Authorization: Bearer <token>` on all subsequent API requests.
- `AuthContext` reads the token on mount and fetches the user profile to hydrate state.
- Protected routes redirect to `/auth/login` if no valid token is found.
- Admin routes additionally check `user.is_admin || user.role === 'super_admin'`.

---

## Key Features

### Registration
- Groups and specializations are fetched **live** from `GET /api/groups` — the dropdown always reflects whatever the admin has configured.
- Year 3 and 4 students must pick a specialization; Years 1–2 may skip it.

### Notes & Past Papers
- Full-text search, group/specialization/year filters.
- Mobile-optimised upload with drag-drop and camera-roll support.
- In-browser PDF viewer with page navigation.
- Star ratings and written reviews per document.

### Blog
- Posts marked as general appear to everyone; group-specific posts only appear to members of that group.
- Admins can create rich-text posts with thumbnail images and set the target audience.

### Admin Panel
- Approve / reject pending notes and past papers.
- Create, edit, and delete blog posts (with group targeting).
- Manage users — promote to admin, suspend, delete.
- Add/remove groups and their specializations without touching code.

### Theme
- Full dark / light mode with system default detection.
- Persisted across sessions via `localStorage`.

---

## Deployment (Vercel)

The project is deployed on **Vercel** connected to the `bbm-annex` GitHub repo.

1. Push to the `main` branch of `bbm-annex` → Vercel auto-builds and deploys.
2. `vercel.json` in the root configures SPA rewrites and API proxying.
3. No extra environment variables are needed in Vercel — the API URL is embedded in `vercel.json`.

**Build command:** `bun run build` (or `npm run build`)  
**Output directory:** `dist`  
**Framework preset:** Vite

---

## Repo Strategy

| Repo | Visibility | Contents | Purpose |
|---|---|---|---|
| `bbm-annex` | Private | Everything including `vercel.json` | Internal development + Vercel deploy source |
| `bbm-annex-frontend` | Public | All source **except** `vercel.json` | Public open-source reference |
| `bbmannex-backend` | Private | Full backend including `.env` | Backend source + secrets |
