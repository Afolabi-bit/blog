# Bloggr — End-to-End QA Test Plan (Manual Confirmation Only)

> **Branch under test:** `feat/phase-1-feed-and-reading`  
> **API base:** `https://go-blog-k1kn.onrender.com`  
> **Test URL:** `http://localhost:3000`  
> **Severity:** 🔴 BLOCKER · 🟡 MAJOR · 🟢 MINOR  
> **Automated & Code Audits:** All previously confirmed items (Registration, Login, Sign Out, Feed, Profiles, Static Metadata, Schemas, etc.) have been verified and cleared out. Only tests strictly requiring human manual verification remain below.

---

## 0. Pre-Test Setup

Before starting:

1. Confirm the dev server is running on `http://localhost:3000`.
2. Open Chrome DevTools → Network tab.
3. Have test accounts ready:
   - **Admin** — can access `/admin`
   - **Author** — can access `/dashboard`, `/dashboard/create`
   - **Reader** — can access `/settings/author-request`
4. Confirm API server is awake: `https://go-blog-k1kn.onrender.com/health`.

---

## 1. Article Reader & Scrolling

| #   | Action                      | Expected result                                                            | Severity | Status  |
| --- | --------------------------- | -------------------------------------------------------------------------- | -------- | ------- |
| A5  | Scroll through long article | ArticleActionBar stays sticky (sidebar on desktop / bottom bar on mobile)   | 🟡       | Pending |
| N3  | Scroll down any page        | Navbar hides smoothly on scroll-down; reveals on scroll-up                 | 🟡       | Pending |

---

## 2. Comments (Live Account Verification)

Log in as a user and visit any published post (e.g. `/post/daves-architectural-insights-3`):

| #   | Action                         | Expected result                                                            | Severity | Status  |
| --- | ------------------------------ | -------------------------------------------------------------------------- | -------- | ------- |
| C4  | Submit valid comment           | Comment appears in list; comment count increments                          | 🔴       | Pending |
| C8  | Submit a reply to a comment    | Reply appears nested under parent comment                                  | 🔴       | Pending |
| C11 | Delete as post author or admin | Delete button visible on other users' comments; confirming removes comment | 🟡       | Pending |

---

## 3. Dashboard & Post Editor

### 3.1 Author Dashboard (`/dashboard`)

| #   | Action                       | Expected result                                           | Severity | Status  |
| --- | ---------------------------- | --------------------------------------------------------- | -------- | ------- |
| D2  | Visit `/dashboard` as author | Dashboard loads with real author stats grid and post list | 🔴       | Pending |

### 3.2 Editor Interactions & Shortcuts (`/dashboard/create`)

| #   | Action                            | Expected result                                                | Severity | Status  |
| --- | --------------------------------- | -------------------------------------------------------------- | -------- | ------- |
| E5  | Select text, click Bold           | Text becomes bold; button shows `aria-pressed="true"`          | 🔴       | Pending |
| E6  | Press `Ctrl+B`                    | Bold toggles on/off                                            | 🔴       | Pending |
| E7  | Press `Ctrl+I`                    | Italic toggles on/off                                          | 🔴       | Pending |
| E8  | Press `Ctrl+K`                    | Link dialog opens with accessible title "Add link"             | 🔴       | Pending |
| E10 | Enter valid URL, click "Add link" | Link inserted; "Remove link" removes it                        | 🟡       | Pending |
| E11 | Select text in editor             | Floating BubbleMenu appears with Bold/Italic/Link buttons       | 🟡       | Pending |
| E31 | Edit existing published post      | Post loads in `/dashboard/edit/[id]` with content, tags, cover | 🔴       | Pending |

---

## 4. Settings (`/settings`)

| #   | Action                                     | Expected result                                 | Severity | Status  |
| --- | ------------------------------------------ | ----------------------------------------------- | -------- | ------- |
| S6  | Update bio and click "Save Changes"        | Success toast; new bio persists on page refresh | 🔴       | Pending |
| S10 | Enter correct current + valid new password | Password changed successfully with feedback     | 🔴       | Pending |

---

## 5. Admin Console (`/admin`)

Log in as **Admin**:

| #    | Action                                     | Expected result                                                                                      | Severity | Status  |
| ---- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- | ------- |
| AD6  | Feature toggle — no existing featured post | Post becomes featured; toggle switches to active                                                     | 🔴       | Pending |
| AD8  | Confirm replace featured                   | AlertDialog appears ("This will replace current featured post"); confirming swaps the featured post  | 🔴       | Pending |
| AD10 | Confirm delete post                        | Danger AlertDialog appears; confirming removes post from table                                       | 🔴       | Pending |
| AD13 | Delete a comment in Comments tab           | Danger AlertDialog appears; confirming removes comment                                               | 🔴       | Pending |
| AD16 | Click "Approve" on Author Application      | Application status updates to approved; success toast                                                | 🔴       | Pending |
| AD17 | Click "Reject" with a reason               | Review notes saved in API payload; application rejected                                              | 🔴       | Pending |
| AD18 | Click "Reject" without a reason            | Rejection succeeds even if review notes are left blank                                               | 🟡       | Pending |

---

## 6. Error & Network Throttling Cases

| #    | Scenario                                      | Expected behaviour                                                 | Severity | Status  |
| ---- | --------------------------------------------- | ------------------------------------------------------------------ | -------- | ------- |
| ERR3 | Block like API in DevTools (simulate offline) | Optimistic update reverts; toast "Couldn't save like — try again." | 🔴       | Pending |
| ERR5 | Cover image upload — network drops mid-upload | Error message shown, progress bar stops                            | 🟡       | Pending |
| ERR6 | Admin feature toggle — API fails              | Toast error; toggle state reverts                                  | 🟡       | Pending |

---

## 7. Responsive & Cross-Browser

Verify layout across viewports:

| #   | Page      | 320 px (Mobile)                     | 640 px (Tablet) | 1024 px+ (Desktop)           |
| --- | --------- | ----------------------------------- | --------------- | ---------------------------- |
| RB1 | Home Feed | Single col, no horizontal scroll    | 2-col grid      | 3-col, sticky TagRail        |
| RB2 | Article   | Full-width readable                 | Centred column  | 72 ch prose max-width        |
| RB3 | Dashboard | Stats 2-col                         | Stats 4-col     | Full layout                  |
| RB4 | Editor    | Toolbar wraps or docks fixed-bottom | Top toolbar     | Top toolbar + settings panel |
| RB5 | Settings  | Tabs scroll horizontally            | Full tabs       | Full layout                  |
| RB6 | Admin     | Table scrolls horizontally          | Normal          | Normal                       |

- Check at **200% zoom** (no horizontal document scroll, no overlapping text).
- Check in **Chrome, Edge, Firefox, and Safari** (macOS or iOS).

---

## 8. Accessibility Deep-Dive

### 8.1 Keyboard-Only Navigation
Navigate using only `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Escape`:
- [ ] **K1**: Home: click "Load more", filter by tag, search, open a post
- [ ] **K2**: Post reader: like, write a comment, reply to a comment, dismiss reply
- [ ] **K3**: Login form: fill in and submit
- [ ] **K4**: Dashboard: click "Write a post", navigate to create, open delete dialog, cancel
- [ ] **K5**: Editor: format text with toolbar, open/close link dialog, dismiss BubbleMenu
- [ ] **K6**: Settings: navigate all tabs, open "Sign out of all devices" dialog, cancel
- [ ] **K7**: Admin: navigate tabs, open review Sheet, close with Escape

### 8.2 Screen Reader — NVDA on Windows
Turn on NVDA (`Ctrl+Alt+N`) and verify speech announcements:
- [ ] **SR1**: Like button (unliked) announces `"Like post, button"`
- [ ] **SR2**: Like button (liked) announces `"Unlike post, button, pressed"`
- [ ] **SR3**: Autosave saving state announces `"Saving…"` without losing editor focus
- [ ] **SR4**: Autosave saved state announces `"Saved {time}"`
- [ ] **SR5**: Comment count update announces new count without focus displacement
- [ ] **SR6**: Form errors announce immediately on submit
- [ ] **SR7**: Editor toolbar announces `"Text formatting, toolbar"` upon keyboard entry
- [ ] **SR8**: AlertDialog announcements read title and description before action buttons

### 8.3 Reduced Motion
In Windows Settings → Accessibility → Visual effects → turn **Animation effects OFF**:
- [ ] **RM1**: Feed card hover: no scale/bounce animation
- [ ] **RM2**: Navbar hide/show: instant, no slide
- [ ] **RM3**: FeaturedPostHero: no entrance animation
- [ ] **RM4**: Like button: no spring animation on click
- [ ] **RM5**: Skeleton loading: no pulsing animation

---

## 9. Performance Snapshot

Run Chrome DevTools → Lighthouse in incognito (Mobile preset):

| Page                | Performance Target | Accessibility Target | SEO Target |
| ------------------- | ------------------ | -------------------- | ---------- |
| `/`                 | ≥ 90               | ≥ 95                 | ≥ 95       |
| `/post/[slug]`      | ≥ 90               | ≥ 95                 | ≥ 95       |
| `/dashboard/create` | ≥ 85               | ≥ 95                 | —          |

---

## 10. Bug Report Template

```markdown
### Bug [B-###]
**Test ID:** (e.g. C4)
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

## 11. QA Sign-Off Checklist

```
[x] All automated and code-audited tests passed
[x] npx tsc --noEmit = exit 0 (Clean)
[x] npm run lint = 0 errors
[x] SEO metadata, JSON-LD schemas verified
[x] /robots.txt and /sitemap.xml verified
[ ] Sticky scrolling & navbar scroll hide verified (A5, N3)
[ ] Live authenticated comments verified (C4, C8, C11)
[ ] Author dashboard & edit post verified (D2, E31)
[ ] Tiptap editor shortcuts verified (E5–E8, E10–E11)
[ ] Profile bio & password update verified (S6, S10)
[ ] Admin live actions verified (AD6, AD8, AD10, AD13, AD16–AD18)
[ ] DevTools offline & error simulations verified (ERR3, ERR5, ERR6)
[ ] Responsive 320px/640px/1024px & 200% zoom verified (RB1–RB6)
[ ] Keyboard navigation K1–K7 verified
[ ] NVDA screen reader SR1–SR8 verified
[ ] Reduced motion RM1–RM5 verified
[ ] Lighthouse scores meet targets
```
