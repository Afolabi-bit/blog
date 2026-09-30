# Bloggr Frontend — Implementation Plan

> **Stack confirmed:** Next.js 15 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui (new-york style, radix base, lucide icons, Tailwind v4 `@theme inline`).
> **Token storage decision (v1):** `localStorage` for refresh token; access token in memory via React context.
> **Skills in play:** `shadcn` for component installation and composition; `better-interface` (orchestrator of `better-accessibility`, `better-layout`, `better-writing`, `better-typography`, `better-colors`, `better-ui`) for UI quality reviews at each milestone.

---

## 0. Ground Rules (always applied)

### shadcn skill rules enforced throughout
- Use `gap-*` not `space-y-*` / `space-x-*`.
- Use `size-*` when width = height.
- Never override shadcn semantic colors with raw values (`bg-blue-500`). Use `bg-primary`, `text-muted-foreground`, etc.
- Use `cn()` for all conditional classes.
- Every `Dialog` / `Sheet` / `Drawer` **must** have an accessible `Title` (use `sr-only` if hidden).
- `Avatar` always ships with `AvatarFallback`.
- Loading states: `Skeleton` component — never custom `animate-pulse` divs.
- Empty states: `Empty` component or `Alert` — never custom styled divs.
- Toasts: `sonner` (project is Radix-based).
- Run `npx shadcn@latest docs <component>` and fetch URLs before touching any component.
- Check `components/ui/` for installed components before `npx shadcn@latest add`.

### better-interface rules enforced throughout
Each milestone ends with a domain review in this order:
1. `better-accessibility` → focus rings, ARIA, keyboard nav, contrast.
2. `better-layout` → grouping, reading order, breakpoints.
3. `better-writing` → copy, labels, error messages.
4. `better-typography` → scale, line-height, font roles.
5. `better-colors` → token hygiene, contrast pairs, dark mode.
6. `better-ui` → border radius, motion, icon weight, shadow.

Report at most 15 findings per review. Fix all `HIGH` before proceeding to the next milestone.

---

## 1. Design Token Strategy

### 1.1 What we have today
`app/globals.css` ships the default shadcn neutral palette (no chromatic accent). Both `:root` (light) and `.dark` blocks exist. Theme switching is via `.dark` class — this matches the PRD's "no flash on load" requirement (class set before hydration via a theme script injected in `<head>`).

### 1.2 Token additions needed

Extend `app/globals.css` inside the existing `:root` and `.dark` blocks **without** creating a second notation. We keep `oklch()` throughout — it is already the project's system.

```css
/* Light */
:root {
  /* Surfaces */
  --bg-page:       oklch(0.979 0.003 90);   /* #FBFAF7 warm paper */
  --bg-surface:    oklch(1 0 0);            /* #FFFFFF pure card */
  --text-body:     oklch(0.178 0.006 60);   /* #1C1B19 ink */
  --text-muted:    oklch(0.487 0.013 60);   /* #6B6860 caption */

  /* Accent — ink-indigo */
  --accent-solid:  oklch(0.44 0.24 268);    /* #3D3BF3 */
  --accent-fg:     oklch(1 0 0);

  /* Warm accent — likes/highlights */
  --accent-warm:   oklch(0.62 0.19 40);     /* #E8590C */

  /* Status */
  --status-success: oklch(0.56 0.16 145);   /* #2F9E44 */
  --status-warning: oklch(0.70 0.19 65);    /* #F08C00 */
  --status-danger:  oklch(0.55 0.22 27);    /* #E03131 */
}

/* Dark */
.dark {
  --bg-page:      oklch(0.135 0.003 260);   /* #111113 */
  --bg-surface:   oklch(0.165 0.005 260);   /* #1A1A1E */
  --text-body:    oklch(0.923 0.005 90);    /* #ECEAE4 */
  --text-muted:   oklch(0.644 0.010 90);    /* #9A978F */
  --accent-solid:  oklch(0.67 0.17 272);    /* #8C8BFF */
}
```

Wire into `@theme inline`:
```css
@theme inline {
  --color-bg-page:        var(--bg-page);
  --color-bg-surface:     var(--bg-surface);
  --color-text-body:      var(--text-body);
  --color-text-muted:     var(--text-muted);
  --color-accent-solid:   var(--accent-solid);
  --color-accent-fg:      var(--accent-fg);
  --color-accent-warm:    var(--accent-warm);
  --color-status-success: var(--status-success);
  --color-status-warning: var(--status-warning);
  --color-status-danger:  var(--status-danger);
}
```

> **better-colors rule:** Primitives are not referenced in components. Components only see semantic tokens. `--accent-solid` is *always* interactive; never apply it to static text.

### 1.3 Typography tokens (Google Fonts via `next/font`)

| Role | Font | CSS variable |
|------|------|-------------|
| Display / article body | Source Serif 4 | `--font-serif` |
| UI / metadata | Geist Sans | `--font-sans` (replaces system stack) |
| Code blocks | JetBrains Mono | `--font-mono` |

Load all three in `app/layout.tsx` with `next/font/google`. Wire into `@theme inline`. Use `display: 'swap'` and `subsets: ['latin']`.

### 1.4 Type scale

```css
@theme inline {
  --text-2xs: 0.75rem;    /* 12px — timestamps, badges */
  --text-xs:  0.875rem;   /* 14px — meta, captions */
  --text-sm:  1rem;       /* 16px — body, UI */
  --text-md:  1.125rem;   /* 18px — lead, card titles */
  --text-lg:  1.25rem;    /* 20px — article body */
  --text-xl:  1.5rem;     /* 24px — section headers */
  --text-2xl: 2rem;       /* 32px — page titles */
  --text-3xl: 3rem;       /* 48px — hero */
  --text-4xl: 4rem;       /* 64px — display */
  --leading-article: 1.7;
  --leading-tight:   1.2;
}
```

> **better-typography rule:** Article body: `font-serif leading-article text-lg`. UI: `font-sans`. Code: `font-mono`. Never mix roles on the same element.

### 1.5 Radius & motion tokens

```css
@theme inline {
  --radius-card: 0.625rem;  /* 10px — cards, inputs */
  --radius-pill: 999px;     /* tags, avatars */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
}
```

> **better-ui rule:** Outer card → inner element radius must be concentric (outer = inner + padding gap).

---

## 2. Theme System (Light / Dark / System)

### 2.1 No-flash inline script

Inject before any `<body>` children in `app/layout.tsx`:

```ts
const themeScript = `
  (function() {
    var stored = localStorage.getItem('bloggr-theme') || 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === 'dark' || (stored === 'system' && prefersDark);
    if (isDark) document.documentElement.classList.add('dark');
  })();
`;
```

Use `dangerouslySetInnerHTML` on a `<script>` tag — safe because there is no user input.

### 2.2 ThemeProvider context

`lib/theme.tsx` — React context providing `theme`, `setTheme`, `resolvedTheme`. Listens to `prefers-color-scheme` media query. On change: **suppress transitions** (inject `*{transition:none!important}`, force reflow, restore next frame) then toggle `.dark` on `<html>`.

### 2.3 ThemeToggle component

Cycle button: System → Light → Dark → System. Icon cross-fades with `scale(0.25→1) opacity(0→1) blur(4px→0px)` using `cubic-bezier(0.2, 0, 0, 1)`. Implemented as shadcn `Button variant="ghost" size="icon"`.

---

## 3. Component Installation Plan (shadcn)

Run `npx shadcn@latest info --json` first to verify project context. Then add in dependency order:

### Phase 1 — Shell (M0)
```bash
npx shadcn@latest add avatar badge button card dialog drawer input label separator sheet skeleton textarea toggle-group tooltip
```

### Phase 2 — Navigation & Overlays (M0)
```bash
npx shadcn@latest add command dropdown-menu navigation-menu popover tabs
```

### Phase 3 — Forms (M1–M2)
```bash
npx shadcn@latest add checkbox radio-group select switch
```

### Phase 4 — Layout (M3)
```bash
npx shadcn@latest add accordion collapsible resizable scroll-area progress
```

### Phase 5 — Admin (M4)
```bash
npx shadcn@latest add alert-dialog table pagination
```

After **every batch**:
1. `npx shadcn@latest docs <components>` → fetch URLs → read API.
2. Verify composition rules (see shadcn skill §Critical Rules).
3. Fix any hardcoded paths or icon imports that don't match `lucide-react`.

---

## 4. API Client Layer

### 4.1 `lib/api.ts`

Axios instance from `FRONTEND_GUIDE.md §2.2` (already correct). Additions:
- **`unwrap<T>(res): T`** — extracts `res.data.data`, throws `ApiError` carrying `message` from envelope.
- **`class ApiError extends Error { status: number }`** — mapped in response interceptor.
- **Cold-start detection** — first request > 3 s emits `CustomEvent('bloggr:cold-start')` for Navbar banner.

> Note: `GET /health` returns a non-standard envelope `{ ok, service, database, time }`. Do NOT pass through `unwrap()`.

### 4.2 `lib/query-client.ts`

```ts
defaultOptions: {
  queries: {
    staleTime: 60_000,
    retry: (count, err) => count < 2 && err.status >= 500,
    refetchOnWindowFocus: true,
  }
}
```

Override per-query: post detail `5 * 60_000`, likes/comments `0`.

### 4.3 `lib/query-keys.ts`

```ts
export const keys = {
  posts:     (filters?) => ['posts', filters] as const,
  post:      (slug)     => ['post', slug] as const,
  likes:     (id)       => ['likes', id] as const,
  comments:  (id)       => ['comments', id] as const,
  myPosts:   ()         => ['my-posts'] as const,
  admin:     (sub)      => ['admin', sub] as const,
  user:      ()         => ['user'] as const,
  authorReq: ()         => ['author-request'] as const,
};
```

---

## 5. Auth & Session Architecture

### 5.1 `lib/auth-context.tsx`
- Access token: React ref (memory only).
- Refresh token: `localStorage`.
- On mount: if `refresh_token` exists → call `GET /user/iam` to hydrate user (skeleton Navbar during flight).
- Exposes: `user`, `role`, `login()`, `logout()`, `refresh()`.
- **Cross-tab sync:** `storage` event on `refresh_token` removal → clear state → redirect to `/login`.

### 5.2 `middleware.ts` (already exists)
Extend to protect by role:
- `/editor*`, `/dashboard` → author + admin.
- `/admin*` → admin.
- `/settings/author-request` → reader.
- 403 → branded 403 page.

### 5.3 `components/general/RoleGuard.tsx`
Client component. Checks `AuthContext.role`. Insufficient → renders `ForbiddenPage` (not a redirect, to avoid SSR loops).

---

## 6. Core Shared Components

All in `components/general/` unless noted.

| Component | shadcn base | Key notes |
|-----------|------------|-----------|
| `Navbar` | `NavigationMenu` + `DropdownMenu` | Hide on scroll-down, show on scroll-up. `⌘K` opens CommandPalette. Skeleton while `GET /user/iam` loads. Cold-start "Waking up…" banner. |
| `Footer` | — | API health banner only on `GET /health` failure. |
| `PostCard` | `Card` | Variants: `standard`, `featured`, `compact`. Cover via `next/image` + blur. Gradient fallback from `post.id` hash. Read-time = words / 200. Excerpt = markdown stripped, 160 chars. Max 3 `TagPill`s. |
| `TagPill` | `Badge variant="secondary"` rounded-full | Links to `/?tag=`. Active: `--accent-solid` bg. |
| `Avatar` | `Avatar` | Always `AvatarFallback` (initials). |
| `LikeButton` | `Button variant="ghost"` | `aria-pressed`. Optimistic update. Pop animation. Anonymous → sign-in `Dialog`. |
| `StatusBadge` | `Badge` | `draft→warning`, `published→success`, `pending→muted`, `approved→success`, `rejected→danger`. |
| `CommentThread` | Custom | Flat API → tree client-side. Depth ≤ 3. Orphans at root with "in reply to…". |
| `MarkdownRenderer` | — | `react-markdown` + `rehype-sanitize` + `rehype-highlight`. Lazy `highlight.js`. Images: lazy + zoomable. Code: copy button. |
| `MarkdownEditor` | `Textarea` | Toolbar (`InputGroup` buttons + `Tooltip`). Split-view: `Resizable` desktop, `Tabs` mobile. |
| `CoverUploader` | — | `react-dropzone`. Validation (JPEG/PNG/WebP/GIF ≤ 5 MB). `Progress` bar. |
| `EmptyState` | `Alert` | Icon, one-line text, one CTA button. |
| `ConfirmDialog` | `AlertDialog` | Required before all destructive actions. Admin delete: typed-title confirmation. |
| `ThemeToggle` | `Button variant="ghost" size="icon"` | Cycle: system → light → dark. |
| `CommandPalette` | `Command` inside `Dialog` | `⌘K`. Search syncs `?search=` URL param. |
| `SkeletonPostCard` | `Skeleton` | Mirrors `PostCard` layout exactly. |
| `ReadingProgressBar` | CSS | `position: fixed; top: 0`. Tracks `window.scrollY`. |
| `OfflineBanner` | `Alert` | `navigator.onLine` + `online`/`offline` events. |

---

## 7. Route-by-Route Build Plan

### M0 — Foundations (est. 1.5 wks)

**Goal:** design tokens, auth end-to-end, Navbar + Footer shell, themes with no flash.

1. **`app/globals.css`** — add semantic token extensions (§1.2). Update `--background` to match `--bg-page` in `:root`.
2. **`app/layout.tsx`** — load 3 fonts via `next/font`. Inject no-flash theme script. Wrap in `QueryClientProvider + AuthProvider + ThemeProvider`.
3. **`lib/api.ts`** — interceptor + `unwrap()` + `ApiError` + cold-start event.
4. **`lib/auth-context.tsx`** — full auth context.
5. **`middleware.ts`** — role-based route protection.
6. **`components/general/Navbar.tsx`** — skeleton while loading, full shell.
7. **`components/general/Footer.tsx`** — static links + health banner.
8. **`components/general/ThemeToggle.tsx`** — cycle with icon cross-fade.
9. **shadcn batches 1 & 2** (§3).
10. **`app/login/page.tsx`** + **`app/register/page.tsx`** — `FieldGroup + Field + Input + Button`. Zod validation. Password toggle. Strength hint on register.

**M0 Review (better-interface):**
- Scope: login, register, Navbar (all viewports, both themes).
- Require: focus rings, no missing ARIA labels, heading hierarchy, contrast ≥ 4.5:1, no `space-y-*`, theme toggle suppresses transitions correctly.
- **Block on any HIGH.**

---

### M1 — Reading (est. 2 wks)

**Goal:** public feed, filters, search, article page with SEO.

1. **`app/page.tsx`** — Hero (anon only). Featured card + grid. `useInfiniteQuery`. `?tag=` + `?search=` via `useSearchParams`. Skeleton → empty → error states.
2. **`components/general/PostCard.tsx`** — 3 variants. `next/image` blur. Gradient fallback. Read-time. Excerpt. `TagPill`s.
3. **`app/post/[slug]/page.tsx`** — SSR + `generateMetadata`. Open Graph + JSON-LD. Draft banner. `ReadingProgressBar`. ToC (H2/H3). Share menu.
4. **`components/post/MarkdownRenderer.tsx`** — `react-markdown + rehype-sanitize + rehype-highlight`. Code copy button.
5. **`components/post/ArticleHeader.tsx`** — title, author, date, read time, tags, cover.

**New deps:**
```bash
npm install @tanstack/react-query react-markdown rehype-sanitize rehype-highlight
```

**M1 Review:** scope = home feed + article page (both themes, 320px / 768px / 1280px). Block on any HIGH.

---

### M2 — Engagement (est. 1.5 wks)

**Goal:** likes + comment tree, anonymous gating.

1. **`components/post/LikeButton.tsx`** — `useQuery + useMutation`. Optimistic update + rollback. Pop animation. `aria-pressed`. Anonymous → sign-in `Dialog`.
2. **`components/post/CommentThread.tsx`** — `Map<id, Comment>` tree builder. Depth capped at 3. Load-more cursor. "Author" badge.
3. **`components/post/CommentComposer.tsx`** — Textarea + counter. `⌘/Ctrl+Enter`. Optimistic insert. Anon: sign-in prompt `Alert`.
4. **`components/post/ReplyComposer.tsx`** — Inline under target. Sends `parent_id`. Collapse on cancel/success.
5. **Delete comment** — `AlertDialog` confirm. Decrements count. Tree removes node; children shown under `[deleted]` placeholder.

**M2 Review:** scope = like button, comment thread, composers (both themes, mobile). Block on any HIGH.

---

### M3 — Authoring (est. 2.5 wks)

**Goal:** distraction-free editor, autosave, dashboard.

1. **`app/editor/page.tsx`** + **`app/editor/[id]/page.tsx`** — RoleGuard (author + admin). Bundle lazy-loaded.
2. **`components/editor/MarkdownEditor.tsx`** — Title `Input`. Markdown `Textarea`. Toolbar buttons. `Resizable` split desktop, `Tabs` mobile. Optional `/` slash-command menu.
3. **`components/editor/CoverUploader.tsx`** — `react-dropzone`. Validation. `Progress` bar. Preview + remove/replace.
4. **`components/editor/TagInput.tsx`** — Enter/comma to add. Backspace to remove. Dedupe + normalize. Suggestions from prior tags.
5. **`components/editor/SettingsPanel.tsx`** — `Collapsible` right-panel: cover, tags, status.
6. **Autosave** — 5-s debounce → `localStorage`. On mount: "Restore unsaved changes?" `Dialog`.
7. **Unsaved guard** — `beforeunload` + router event. Warn on title change for published post.
8. **Status indicator** — "Saved · 2 min ago" / "Saving…" / "Offline, changes kept locally".
9. **`app/dashboard/page.tsx`** — `GET /api/my-posts`. Table. `DropdownMenu` row actions. `ToggleGroup` segment filter. Summary cards. Empty state.

**New deps:**
```bash
npm install react-dropzone
```

**M3 Review:** scope = editor + dashboard (all viewports). Block on any HIGH.

---

### M4 — Roles & Admin (est. 2 wks)

**Goal:** author application flow, admin queues, settings.

1. **`app/settings/author-request/page.tsx`** — Reader-only. Mount → `GET /user/author-request`. Branch: `404` → form; `pending` → read-only banner; `approved` → celebration + re-fetch `/user/iam`; `rejected` → notice + `review_notes`. Handle `409` / `400` inline.
2. **`app/settings/page.tsx`** — `Tabs`: Profile / Security / Appearance / Sessions.
3. **`app/admin/author-requests/page.tsx`** — `Tabs` Pending / Approved / Rejected. Review `Sheet`: Approve / Reject + note. Optimistic removal. Toast. Handle "request has already been processed".
4. **`app/admin/posts/page.tsx`** — Filters. Table. Typed-title confirmation delete.
5. **`app/admin/page.tsx`** — Overview: counts + activity.
6. **Error pages** — `not-found.tsx` (already exists, needs branding), `app/403/page.tsx`, `app/500/page.tsx`.

**M4 Review:** scope = settings (all tabs), author-request (all 4 states), admin queues. Block on any HIGH.

---

### M5 — Polish & Launch (est. 1.5 wks)

1. **Performance:** `next build --analyze`. Editor behind `dynamic(() => import(...), { ssr: false })`. `next/image` responsive `sizes`. ISR `revalidate: 60` on feed + articles.
2. **Accessibility audit** — skip-to-content, `<main>` on every route, heading order, touch targets ≥ 44 px, `prefers-reduced-motion`, axe-core in dev.
3. **SEO** — `sitemap.ts`, `robots.ts`, canonical in `generateMetadata`, social preview verification.
4. **Error boundaries** — `error.tsx` per route (message + Retry + Home).
5. **Observability (optional)** — Sentry + Web Vitals + analytics events.
6. **Final better-interface review** — all 5 key flows from PRD §12, run in browser. Require: 0 HIGH, ≤ 5 MEDIUM.

---

## 8. Responsive Strategy

| Breakpoint | Prefix | Behavior |
|-----------|--------|----------|
| < 640px | (base) | Single column, hamburger `Sheet`, sticky bottom action bar on article |
| 640px | `sm:` | Two-column feed grid |
| 1024px | `lg:` | Tag rail sidebar, sticky like/comment rail on article, editor split-view |

Build mobile-first. Bottom action bar: `env(safe-area-inset-bottom)` padding.

---

## 9. State & Caching Summary

| Query | Key | Stale time | Invalidated by |
|-------|-----|-----------|----------------|
| Feed | `['posts', filters]` | 60 s | Post create/update/delete |
| Post detail | `['post', slug]` | 5 min | Post update |
| Like status | `['likes', id]` | 0 (refetch on focus) | Like toggle |
| Comments | `['comments', id]` | 0 | Comment create/delete |
| My posts | `['my-posts']` | 60 s | Post create/update/delete |
| Admin | `['admin', sub]` | 30 s | Relevant admin mutations |
| User | `['user']` | 5 min | Profile update, logout |
| Author request | `['author-request']` | 5 min | Submit mutation |

---

## 10. Key Gotchas (from FRONTEND_GUIDE.md)

1. **Register = camelCase** (`firstName`, `lastName`); **Profile update = snake_case** (`first_name`, `last_name`). Use separate Zod schemas.
2. **Avatar upload** is author/admin only. Readers: show URL input or block with a notice.
3. **Slug regenerates on title change** for published posts → `Alert` warning before save.
4. **Flat comment pagination with `parent_id`** → orphan handling: reply before its parent → render at root with "in reply to [@name]". Resolve on refetch.
5. **Cold-start on Render** → 3-second threshold → "Waking up the server…" banner. Non-blocking.
6. **`GET /health`** returns non-standard envelope `{ ok, service, database, time }`. Do NOT pass through `unwrap()`.
7. **`POST /auth/logout`** — with `refresh_token` body = revoke this session; without body = revoke all.
8. **Admin author-request review** — handle `"request has already been processed"` gracefully (toast "Already reviewed").

---

## 11. .gitignore Rule

Add to `.gitignore` to prevent skill files from being committed:

```
# Agent skills (local dev tooling — do not commit)
.agents/
```

---

## 12. Execution Checklist

```
[ ] M0: Tokens + fonts + auth + Navbar + login/register
    [ ] better-interface M0 review → 0 HIGH before M1
[ ] M1: Feed + article page + SEO
    [ ] better-interface M1 review → 0 HIGH before M2
[ ] M2: Likes + comments
    [ ] better-interface M2 review → 0 HIGH before M3
[ ] M3: Editor + dashboard
    [ ] better-interface M3 review → 0 HIGH before M4
[ ] M4: Settings + author-request + admin
    [ ] better-interface M4 review → 0 HIGH before M5
[ ] M5: Perf + a11y + SEO + error boundaries + final review
    [ ] better-interface M5 review → 0 HIGH, <= 5 MEDIUM
[ ] Ship
```
