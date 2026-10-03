# Bloggr — End-to-End QA Test Plan

> **Branch under test:** `feat/phase-1-feed-and-reading`
> **API base:** `https://go-blog-k1kn.onrender.com`
> **Test URL:** `http://localhost:3000`
> **Severity:** 🔴 BLOCKER · 🟡 MAJOR · 🟢 MINOR

---

## 0. Pre-Test Setup

Before starting any test suite:

1. Kill any running dev servers in other terminals.
2. Run `npm run dev` in a fresh terminal — wait for "Ready" message.
3. Open Chrome DevTools → Network tab — keep it open throughout.
4. Open a **second browser profile** (or incognito) for the unauthenticated user persona.
5. Have three test accounts ready:
   - **Admin** — can access `/admin`
   - **Author** — can access `/dashboard`, `/dashboard/create`
   - **Reader** — can access `/settings/author-request`
6. Confirm the API server is awake: visit `https://go-blog-k1kn.onrender.com/health`. If cold, wait ~30 s and retry.

---

## 1. Authentication Flows

### 1.1 Registration

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| R1 | Visit `/register` as unauthenticated user | Page loads, single `<h1>` visible, no console errors | 🔴 |
| R2 | Submit empty form | All required field errors shown simultaneously; `role="alert"` error summary at top | 🔴 |
| R3 | Submit mismatched passwords | Password mismatch error on confirm field, no network request sent | 🔴 |
| R4 | Submit invalid email format | Field-level email format error, no network request | 🟡 |
| R5 | Submit valid new account | Redirect to `/` or `/login`; verify no `role` field in request payload (DevTools → Network) | 🔴 |
| R6 | Submit duplicate email | API error displayed on form, no full page crash | 🔴 |
| R7 | Navigate to `/register` while logged in | Redirected away from register page | 🟡 |

### 1.2 Login

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| L1 | Visit `/login` as unauthenticated user | Page loads cleanly | 🔴 |
| L2 | Submit empty form | Field errors on email + password | 🔴 |
| L3 | Submit wrong password | Error message on form, NOT a page crash — error is specific | 🔴 |
| L4 | Submit valid credentials (reader) | Redirect to `/`, navbar shows avatar/user menu, no skeleton after 3 s | 🔴 |
| L5 | Submit valid credentials (author) | Redirect to `/`, navbar shows "Write" button and "Dashboard" link | 🔴 |
| L6 | Submit valid credentials (admin) | Redirect to `/`, navbar shows admin-accessible items | 🔴 |
| L7 | Visit `/login?redirect=/post/some-slug` then log in | After login, redirected to `/post/some-slug` | 🟡 |
| L8 | Refresh page while logged in | Session persists — navbar still shows authenticated state | 🔴 |

### 1.3 Sign Out

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| SO1 | Click avatar → "Sign out" | Logged out, redirected to `/`, navbar shows Login/Register | 🔴 |
| SO2 | After sign out, manually visit `/dashboard` | Redirected to `/login?redirect=/dashboard` | 🔴 |
| SO3 | After sign out, manually visit `/admin` | Redirected to `/login?redirect=/admin` | 🔴 |
| SO4 | Settings → Security → "Sign out of all devices" | AlertDialog opens; confirming calls `POST /auth/logout` with no body; user signed out | 🔴 |

---

## 2. Public Feed (`/`)

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| F1 | Visit `/` as unauthenticated user | Feed loads with posts, no errors | 🔴 |
| F2 | Check featured hero | If featured: full-bleed hero with title in Source Serif 4. If none: no hero, no error | 🔴 |
| F3 | Click "Load more" at feed bottom | Next batch of posts appended; button disappears when `has_next === false` | 🔴 |
| F4 | Type in search box | Results update after ~300 ms debounce; URL changes to `?q=<query>` | 🔴 |
| F5 | Clear search | Feed returns to default; `?q=` param removed | 🟡 |
| F6 | Click a tag in the TagRail | Feed filters to that tag; URL becomes `?tag=<name>`; search input clears | 🔴 |
| F7 | Perform a search then click a tag | Search clears; tag filter takes over | 🟡 |
| F8 | Resize to 320 px viewport | Single column, no horizontal scroll, TagRail scrollable | 🔴 |
| F9 | Tab through entire feed with keyboard only | Every card, tag pill, "Load more" reachable and activatable without mouse | 🔴 |
| F10 | API returns empty results | Alert: "No posts yet. Check back soon." — no crash, no blank page | 🟡 |

---

## 3. Article Reader (`/post/[slug]`)

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| A1 | Click any post card from feed | Post page loads with correct title in `<h1>`, cover image, byline, content | 🔴 |
| A2 | Inspect page `<h1>` count | Exactly one `<h1>` (the post title). Content `##` rendered as `<h2>` | 🔴 |
| A3 | Verify URL matches post slug | If API slug differs from URL, page 307-redirects to canonical URL | 🟡 |
| A4 | Visit `/post/nonexistent-slug` | "Page not found." + "Go home" link | 🔴 |
| A5 | Scroll through long article | ArticleActionBar stays sticky (sidebar on desktop / bottom bar on mobile) | 🟡 |
| A6 | Click like button (unauthenticated) | Redirect to `/login?redirect=/post/<slug>` | 🔴 |
| A7 | Click like button (authenticated) | Like count increments immediately (optimistic); heart fills; count reconciled on API success | 🔴 |
| A8 | Click unlike on a liked post | Count decrements immediately; heart unfills | 🔴 |
| A9 | Verify code block copy button | Clicking "Copy code" copies to clipboard; `aria-label` changes to "Copied" | 🟡 |
| A10 | View source → DevTools → Elements | `<article>` wraps content; `<script type="application/ld+json">` Article schema present with `headline`, `datePublished`, `author` | 🟡 |
| A11 | View page `<title>` and meta description | `<title>` = `"{post.title} — Bloggr"`. Meta description = post excerpt | 🟡 |
| A12 | Simulate API failure on load | Error boundary: "Something went wrong loading this page." + "Try again" button | 🔴 |

---

## 4. Comment Section

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| C1 | View comment section (unauthenticated) | Comment list visible; composer shows "Sign in" prompt | 🔴 |
| C2 | View comment section (authenticated) | Textarea with placeholder, character count, "Post comment" submit button | 🔴 |
| C3 | Submit empty comment | Form blocked; no API call | 🔴 |
| C4 | Submit valid comment | Comment appears in list; comment count increments | 🔴 |
| C5 | Exceed character limit | Counter turns red or input blocked at limit | 🟡 |
| C6 | Click "Reply" on a comment | Reply composer opens below that comment; textarea auto-focuses | 🔴 |
| C7 | Press Escape in reply composer | Composer dismisses | 🔴 |
| C8 | Submit a reply | Reply appears nested under parent comment | 🔴 |
| C9 | Delete own comment | AlertDialog: "Delete this comment? This cannot be undone." Confirm removes comment | 🔴 |
| C10 | Delete another user's comment (not author/admin) | Delete button not visible | 🔴 |
| C11 | Delete as post author or admin | Delete button visible; works | 🟡 |
| C12 | Click "Load more comments" | Next page appended; button disappears when no more | 🟡 |
| C13 | Simulate comment load failure | "Comments couldn't load. Try refreshing." + Retry button | 🔴 |

---

## 5. Author Profile (`/authors/[id]`)

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| AP1 | Click author name from any post | Author profile loads with avatar, name, bio, role badge, post count | 🔴 |
| AP2 | Inspect page metadata | `<title>` = `"{author.full_name} — Bloggr"`. JSON-LD `Person` schema in `<script>` | 🟡 |
| AP3 | Author has posts | Post grid renders correctly | 🔴 |
| AP4 | Author has no posts | "{name} has not published any public articles yet. Check back soon." | 🟡 |
| AP5 | Visit `/authors/nonexistent-id` | "Page not found." not-found page | 🔴 |

---

## 6. Dashboard (`/dashboard`)

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| D1 | Visit `/dashboard` as reader | Redirected to `/login?redirect=/dashboard` | 🔴 |
| D2 | Visit `/dashboard` as author | Dashboard loads with stats grid and post list | 🔴 |
| D3 | Stats grid layout | 2 columns on mobile, 4 columns at 640 px+ | 🟡 |
| D4 | Click "Write a post" CTA | Navigates to `/dashboard/create` | 🔴 |
| D5 | No posts yet | "You haven't written anything yet. Write your first post." + CTA | 🟡 |
| D6 | Delete a post | AlertDialog opens; confirmed → post removed from list | 🔴 |
| D7 | Click "Edit" on a post | Navigates to `/dashboard/edit/[id]` | 🔴 |

---

## 7. Post Editor

### 7.1 Loading & Access

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| E1 | Visit `/dashboard/create` as unauthenticated user | Redirected to login | 🔴 |
| E2 | Visit `/dashboard/create` as author | Editor skeleton loads, then Tiptap editor appears | 🔴 |
| E3 | DevTools → Network → filter "JS" | Tiptap loaded as a separate dynamic chunk, not bundled in first-load JS | 🟡 |

### 7.2 Toolbar & Formatting

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| E4 | Inspect toolbar markup | `role="toolbar"` and `aria-label="Text formatting"` present | 🔴 |
| E5 | Select text, click Bold | Text becomes bold; button shows `aria-pressed="true"` | 🔴 |
| E6 | Press `Ctrl+B` | Bold toggles | 🔴 |
| E7 | Press `Ctrl+I` | Italic toggles | 🔴 |
| E8 | Press `Ctrl+K` | Link dialog opens with accessible title "Add link" | 🔴 |
| E9 | Enter `javascript:alert(1)` in link dialog | Link rejected; URL validation blocks bare `javascript:` scheme | 🔴 |
| E10 | Enter valid URL, click "Add link" | Link inserted; "Remove link" removes it | 🟡 |
| E11 | Select text → BubbleMenu appears | Bold/Italic/Link buttons visible | 🟡 |
| E12 | Press Escape with BubbleMenu open | BubbleMenu dismisses | 🔴 |
| E13 | Insert code block | Language `<select>` with accessible `<label>Language</label>` | 🔴 |
| E14 | On mobile (< 640 px viewport) | Toolbar docks to bottom of viewport above keyboard | 🔴 |

### 7.3 Autosave

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| E15 | Type in editor body | After 2 s inactivity, status shows "Saving…" then "Saved {time}" | 🔴 |
| E16 | Before autosave fires | Status shows "Unsaved changes" amber dot | 🔴 |
| E17 | Inspect status region | `<div role="status" aria-live="polite">` wraps autosave status | 🔴 |
| E18 | Block API call in DevTools (simulate 403) | Alert: "Your session expired. Copy your work before leaving." + "Copy content" button | 🔴 |

### 7.4 Cover Image

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| E19 | Upload image > 5 MB | "Image too large (max 5 MB)" | 🔴 |
| E20 | Upload unsupported format | "Unsupported format. Use JPEG, PNG, WebP, or GIF." | 🔴 |
| E21 | Upload valid JPEG < 5 MB | Progress bar fills, preview appears with remove button | 🔴 |
| E22 | Drag and drop valid image onto dropzone | Same result as E21 | 🟡 |
| E23 | Click remove on cover preview | Cover removed, dropzone reappears | 🟡 |

### 7.5 Tags & Title

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| E24 | Click title input | Placeholder "Post title" visible; font is Source Serif 4 | 🔴 |
| E25 | Type a tag, press Enter or comma | Tag chip appears | 🔴 |
| E26 | Press Backspace in empty tag input | Last tag chip removed | 🟡 |
| E27 | Add more than 10 tags | Input blocked after 10 | 🟡 |
| E28 | Type in tag input | Autocomplete suggestions from API appear | 🟡 |

### 7.6 Save & Publish

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| E29 | Click "Save" with empty title | Validation error on title field | 🔴 |
| E30 | Click "Publish" with valid content | Status set to published; success toast "Published" (no exclamation mark) | 🔴 |
| E31 | Edit existing published post | Post loads with existing content, tags, and cover | 🔴 |
| E32 | Open existing legacy HTML post | Banner: "This post was written in an older format." | 🟡 |

---

## 8. Settings (`/settings`)

### 8.1 Profile Tab

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| S1 | Visit `/settings` as authenticated user | Profile tab open by default | 🔴 |
| S2 | Inspect full_name field | Warning: "Please confirm your first and last name." visible | 🟡 |
| S3 | Upload avatar > 2 MB | "Image too large (max 2 MB)" | 🔴 |
| S4 | Upload invalid avatar format | "Unsupported format. Use JPEG, PNG, WebP, or GIF." | 🔴 |
| S5 | Upload valid avatar | Preview updates; success feedback | 🔴 |
| S6 | Update bio and save | Success toast; data persists on page refresh | 🔴 |

### 8.2 Security Tab

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| S7 | Enter wrong current password | Field error: "Current password is incorrect" — no page refresh, no logout | 🔴 |
| S8 | Enter mismatched new passwords | "Passwords don't match" | 🔴 |
| S9 | Enter new password shorter than 8 chars | "Minimum 8 characters" | 🔴 |
| S10 | Enter correct current + valid new password | Password changed; success feedback | 🔴 |
| S11 | Click "Sign out of all devices" | AlertDialog: "Sign out of all devices? You'll need to sign in again everywhere." Confirm signs out | 🔴 |

### 8.3 Author Request Tab (Reader only)

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| S12 | Visit `/settings` as reader | Third tab "Author Request" visible | 🔴 |
| S13 | Visit `/settings/author-request` as author/admin | Redirected away | 🔴 |
| S14 | Submit application with empty fields | Error summary with `role="alert"` at top | 🔴 |
| S15 | Submit valid application | State: "Application under review." with submitted date | 🔴 |
| S16 | View pending state | Clock icon, "Application under review.", "We'll notify you by email when a decision is made." | 🔴 |
| S17 | View rejected state within cooldown | Review notes shown, "You can reapply on {date}." form hidden | 🔴 |
| S18 | View approved state | "You are an approved author." + link to `/dashboard` | 🔴 |

---

## 9. Admin Console (`/admin`)

### 9.1 Access Control

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| AD1 | Visit `/admin` as reader | Redirected to login or 403 | 🔴 |
| AD2 | Visit `/admin` as author | Redirected to login or 403 | 🔴 |
| AD3 | Visit `/admin` as admin | Console loads with 3 tabs: Posts, Comments, Author Applications | 🔴 |

### 9.2 Posts Tab

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| AD4 | Posts table loads | Title, author, status, date, actions columns visible | 🔴 |
| AD5 | Type in title search | Filters by title only (not content/tags); debounced | 🔴 |
| AD6 | Feature toggle — no existing featured post | Post becomes featured; toggle updates | 🔴 |
| AD7 | Feature toggle — existing featured post | AlertDialog: "This will replace the current featured post. Continue?" — outline styling, NOT danger red | 🔴 |
| AD8 | Confirm replace featured | Old post loses featured; new post gains it | 🔴 |
| AD9 | Click delete on a post | AlertDialog: "Permanently delete '{title}'? This cannot be undone." — danger styling | 🔴 |
| AD10 | Confirm delete | Post removed from table | 🔴 |
| AD11 | Status badge for draft/published/featured | Each visually distinct; "featured" uses `accent-solid` background | 🟡 |

### 9.3 Comments Tab

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| AD12 | Comments tab loads | Post title, author, content preview visible per comment | 🔴 |
| AD13 | Delete a comment | AlertDialog with danger styling; confirm removes it | 🔴 |

### 9.4 Author Applications Tab

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| AD14 | Applications list loads | Pending applications shown first | 🔴 |
| AD15 | Click "Review" on an application | Sheet opens: "Review application — {user_name}", bio, motivation, sample links | 🔴 |
| AD16 | Click "Approve" | Status updates; toast confirms | 🔴 |
| AD17 | Click "Reject" with a reason | Submitting sends `review_notes` in API payload | 🔴 |
| AD18 | Click "Reject" without a reason | Rejection still succeeds (reason optional) | 🟡 |

---

## 10. Navigation & Shell

| # | Action | Expected result | Severity |
|---|--------|-----------------|----------|
| N1 | Press Tab at top of any page | Skip link "Skip to main content" appears and receives focus | 🔴 |
| N2 | Activate skip link | Focus jumps to `<main id="main-content">` | 🔴 |
| N3 | Scroll down the page | Navbar hides; reveals on scroll-up | 🟡 |
| N4 | Open mobile nav (hamburger) | Sheet opens with SR-only title "Navigation" | 🔴 |
| N5 | Click theme toggle | Cycles system → light → dark → system | 🟡 |
| N6 | Inspect theme toggle `aria-label` | "Switch to {next} theme" updates on each click | 🔴 |
| N7 | Kill API, refresh any page | Footer: "Some features may be unavailable." | 🟡 |
| N8 | DevTools → Offline mode | Offline banner: "No internet connection. Some features won't work." | 🔴 |
| N9 | Dismiss offline banner | Banner disappears; reappears on next offline event | 🟡 |
| N10 | Active page link in Navbar | Active link has `aria-current="page"` | 🔴 |
| N11 | First API call takes > 3 s | Banner: "The server is warming up — this takes about 30 seconds." Once per session | 🟡 |

---

## 11. Responsive & Cross-Browser

Run each scenario at the listed viewport widths:

| # | Page | 320 px | 640 px | 1024 px+ |
|---|------|--------|--------|----------|
| RB1 | Home Feed | Single col, no horizontal scroll | 2-col grid | 3-col, sticky TagRail |
| RB2 | Article | Full-width readable | Centred column | 72 ch prose max-width |
| RB3 | Dashboard | Stats 2-col | Stats 4-col | Full layout |
| RB4 | Editor | Toolbar wraps or docks fixed-bottom | Top toolbar | Top toolbar + settings panel |
| RB5 | Settings | Tabs scroll horizontally | Full tabs | Full layout |
| RB6 | Admin | Table scrolls horizontally | Normal | Normal |

**Browsers to verify (latest stable):**

- Chrome — primary
- Firefox
- Safari (macOS or iOS 16+)
- Edge

**200% zoom:** On every page — no horizontal scroll, no clipped text, no overlapping elements.

---

## 12. Accessibility Deep-Dive

### 12.1 Keyboard-Only Navigation

Complete each flow using **only Tab, Shift+Tab, Enter, Space, Arrow keys, and Escape** — no mouse:

| # | Flow |
|---|------|
| K1 | Home: click "Load more", filter by tag, search, open a post |
| K2 | Post reader: like, write a comment, reply to a comment, dismiss reply |
| K3 | Login form: fill in and submit |
| K4 | Dashboard: click "Write a post", navigate to create, open delete dialog, cancel |
| K5 | Editor: format text with toolbar, open/close link dialog, dismiss BubbleMenu |
| K6 | Settings: navigate all tabs, open "Sign out of all devices" dialog, cancel |
| K7 | Admin: navigate tabs, open review Sheet, close with Escape |

### 12.2 Screen Reader — NVDA on Windows

Enable NVDA. Verify these elements **announce correctly**:

| # | Element | Expected announcement |
|---|---------|----------------------|
| SR1 | Like button (unliked) | "Like post, button" |
| SR2 | Like button (liked) | "Unlike post, button, pressed" |
| SR3 | Autosave "Saving…" status | "Saving…" announced without focus change |
| SR4 | Autosave "Saved" status | "Saved 10:32" announced |
| SR5 | Comment count after posting | New count announced without focus change |
| SR6 | Error summary on form | Error list read immediately on submission |
| SR7 | Editor toolbar | "Text formatting, toolbar" on entry |
| SR8 | AlertDialog on delete | Title and description read before action buttons |

### 12.3 Reduced Motion

Go to **Windows → Settings → Accessibility → Visual effects → Animation effects** — turn OFF.

| # | Check |
|---|-------|
| RM1 | Feed card hover: no scale or transition animation |
| RM2 | Navbar hide/show: instant, no slide |
| RM3 | FeaturedPostHero: no entrance animation |
| RM4 | Like button: no spring animation on click |
| RM5 | Skeleton loading: no pulsing animation |

---

## 13. SEO & Structured Data

Open each URL, view source (`Ctrl+U`), and verify:

| # | Page | `<title>` | Meta description | JSON-LD `@type` |
|---|------|-----------|-----------------|-----------------|
| SEO1 | `/` | "Bloggr — Distraction-Free Reading and Publishing" | Present | — |
| SEO2 | `/post/[slug]` | "{post.title} — Bloggr" | Post excerpt | `BlogPosting` with `headline`, `author`, `datePublished` |
| SEO3 | `/authors/[id]` | "{author.full_name} — Bloggr" | Author bio | `Person` with `name`, `description` |

Additional checks:

- Visit `/robots.txt` — disallow entries for `/dashboard/`, `/admin/`, `/settings/`
- Visit `/sitemap.xml` — XML listing all published post URLs

---

## 14. Error & Edge Cases

| # | Scenario | Expected behaviour | Severity |
|---|----------|-------------------|----------|
| ERR1 | Visit unknown URL `/xyz` | "Page not found." + "Go home" link | 🔴 |
| ERR2 | Force a render error (inject JS error) | "Something went wrong loading this page." + "Try again" | 🔴 |
| ERR3 | Block like API in DevTools | Optimistic update reverts; toast "Couldn't save like — try again." | 🔴 |
| ERR4 | Feed API fails on initial load | Empty state or error alert — NOT a blank page | 🔴 |
| ERR5 | Cover image upload — network drops mid-upload | Error shown, progress bar stops | 🟡 |
| ERR6 | Admin feature toggle — API fails | Toast error; toggle state reverts | 🟡 |
| ERR7 | Publish editor with no title | Inline validation error before any API call | 🔴 |

---

## 15. Performance Snapshot

Run Chrome DevTools → Lighthouse in incognito, throttled to **Mobile** preset:

| Page | Performance | Accessibility | SEO |
|------|-------------|---------------|-----|
| `/` | ≥ 90 | ≥ 95 | ≥ 95 |
| `/post/[slug]` | ≥ 90 | ≥ 95 | ≥ 95 |
| `/dashboard/create` | ≥ 85 | ≥ 95 | — |

DevTools → Network → "JS" filter on first page load:

- `/` First Load JS ≤ 250 kB (build output: 249 kB ✅)
- `/dashboard/create` Tiptap chunk loads **only** after navigating there, not on home page

---

## 16. Bug Report Template

```
### Bug [B-###]
**Test ID:** (e.g. C5)
**Severity:** 🔴 BLOCKER / 🟡 MAJOR / 🟢 MINOR
**Page/Route:**
**User role:** Reader / Author / Admin / Unauthenticated
**Steps to reproduce:**
  1.
  2.
  3.
**Expected:**
**Actual:**
**Screenshot/Video:**
**Browser + OS:**
```

---

## 17. QA Sign-Off Checklist

```
[ ] All BLOCKER tests passed with no failures
[ ] All MAJOR tests passed or documented with accepted workaround
[ ] npx tsc --noEmit = exit 0
[ ] npm run lint = 0 errors
[ ] Lighthouse scores meet targets on at least one post page
[ ] Keyboard flows K1–K7 complete
[ ] NVDA screen reader SR1–SR8 verified
[ ] Reduced-motion RM1–RM5 verified
[ ] Responsive checked at 320 px, 640 px, 1024 px+
[ ] SEO metadata and JSON-LD verified (SEO1–SEO3)
[ ] /robots.txt and /sitemap.xml return correct content
[ ] Working tree clean: git status = nothing to commit
[ ] Bug report document updated with all findings
```
