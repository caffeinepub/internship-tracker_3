# Design Brief — Phase 6

**Purpose:** Refine design system for GitHub-style code tracking, WhatsApp-style chat, and resume-style profiles. Production-ready, mobile-first platform for internship management.

**Tone:** Bold, intentional, productive. Engineered aesthetic — GitHub + VS Code + WhatsApp. Clear visual hierarchy, familiar interactions, premium polish.

**Differentiation:** Distinct chat bubble positioning (mine right/teal, theirs left/gray), GitHub-style diff lines (green additions, red deletions), VS Code-inspired file tree with icons, resume cards with skill badges and profile photos.

---

## Palette

| Token | OKLCH | Role |
|-------|-------|------|
| `--background` | `0.975 0.005 240` | Page background (warm off-white) |
| `--foreground` | `0.18 0.025 250` | Primary text (deep navy) |
| `--primary` | `0.24 0.055 262` | Main actions, focus states (navy) |
| `--accent` | `0.72 0.14 200` | Chat user bubbles, highlights, links (teal) |
| `--success` | `0.65 0.18 145` | Diff additions, positive states (green) |
| `--destructive` | `0.577 0.245 27.325` | Diff deletions, warnings (red) |
| `--chat-peer` | `0.92 0.01 250` | Chat peer bubbles (light gray) |
| `--code-bg` | `0.96 0.004 240` | Code block backgrounds |
| `--diff-context` | `0.9 0.01 250` | Diff context lines (muted) |

---

## Typography

| Family | Role | Use Case |
|--------|------|----------|
| BricolageGrotesque | Display | Headings, nav labels, profile names |
| Satoshi | Body | Body text, descriptions, labels |
| JetBrainsMono | Code | Code blocks, diff lines, file paths |

---

## Elevation & Structural Zones

| Zone | Treatment | Purpose |
|------|-----------|---------|
| Sidebar | `bg-sidebar` (`0.21 0.055 262`) + `border-r` | Navigation, persistent, dark |
| Header | `bg-background` + `border-b` | Page title, breadcrumbs, actions |
| Content (light) | `bg-background` | Main content area, default surface |
| Content (card) | `bg-card` + `shadow-card` | Sections, panels, isolated content |
| Code/Diff | `bg-code-bg` + `shadow-code` + `border` | Technical content, read-only |
| Footer | `bg-muted/30` + `border-t` | Secondary info, low emphasis |

---

## Chat UI (WhatsApp Style)

- **User messages:** `.chat-bubble-user` — `bg-accent` teal, right-aligned, rounded corners with sharp top-right
- **Peer messages:** `.chat-bubble-peer` — `bg-muted` light gray, left-aligned, rounded corners with sharp top-left
- **Timestamps:** `text-muted-foreground` small, centered below message pairs
- **Avatars:** 32px circles with initials or photo, left (peer) or right (user)
- **File/media previews:** Inline thumbnails, tap to expand (mobile), click to expand (desktop)
- **Responsive:** Full-width input on mobile, split layout on desktop (message list left, input bottom)

---

## Code Diff Viewer (GitHub Style)

- **Additions:** `.diff-line-added` — `bg-diff-addition-bg` light green, `border-l-2 border-diff-addition` green left border, `text-diff-addition` green text, prefixed with `+`
- **Deletions:** `.diff-line-removed` — `bg-diff-deletion-bg` light red, `border-l-2 border-diff-deletion` red left border, `text-diff-deletion` red text, prefixed with `-`
- **Context:** `.diff-line-context` — `bg-diff-context` muted, `text-muted-foreground`, prefixed with ` ` (space)
- **Line numbers:** Monospace, `text-muted-foreground`, sticky on scroll
- **Code block:** `.code-block` — `bg-code-bg`, `border border-border`, monospace, syntax highlighting via Prism or Monaco

---

## Resume/Profile Card

- **Layout:** Vertical stack on mobile, 2-column on desktop (photo left, info right)
- **Photo:** Rounded circle, 80px mobile / 120px desktop, `border-2 border-accent`
- **Name:** BricolageGrotesque, `text-2xl`, `text-foreground`
- **Bio:** Satoshi, `text-sm`, `text-muted-foreground`, max 2 lines
- **Skills:** `.skill-badge` — `bg-accent/10`, `text-accent`, `border border-accent/20`, inline-flex, wrap
- **Links:** `text-accent`, hover: `underline`, `text-sm`
- **Background:** `bg-card`, `shadow-card`, `rounded-lg`, `p-6`

---

## File Tree (VS Code Style)

- **Folder icon:** `text-accent`, rotate on expand
- **File icons:** `.file-icon` — `text-accent`, semantic per type (code, image, video, document)
- **Collapsible:** `flex flex-col`, nesting indented by `pl-2` per level
- **Hover:** `bg-muted/50`
- **Selected:** `bg-accent/20`, `text-accent`
- **Truncate:** Long names ellipsis, tooltip on hover
- **Responsive:** Scrollable horizontal on mobile, full-width on desktop

---

## Spacing & Rhythm

- **Base unit:** `0.25rem` (4px). Multiples: `1, 2, 3, 4, 6, 8, 12, 16` (0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4 rem)
- **Sidebar:** Compact `px-3 py-2` for nav items, `gap-2` between icon + label
- **Content:** `p-6` default, `p-4` on mobile, `p-8` on large screens
- **Cards:** `p-4` interior, `gap-3` between elements
- **Chat:** `gap-2` between bubbles, `p-3` bubble interior, `mb-6` message group margin

---

## Component Patterns

- **Buttons:** Primary (`bg-primary`), Secondary (`bg-secondary`), Ghost (`bg-transparent border border-border`). Icons centered, labels centered or right. Mobile: full-width or stacked.
- **Input:** `bg-input`, `border-input`, `focus:ring-2 focus:ring-accent`, `py-2 px-3`. Mobile: full-width.
- **Tables:** Striped rows (`even:bg-muted/30`), sticky header, horizontal scroll on mobile.
- **Modals:** `fixed inset-0 bg-black/50 z-50`, centered content card, close button top-right.
- **Tabs:** Underline style, `border-b-2 border-transparent hover:border-border active:border-accent`.

---

## Motion & Interaction

- **Fade-in:** `.animate-fade-in` — `0.3s ease-out` for components on mount
- **Slide-up:** `.animate-slide-up` — `0.3s ease-out` for modals, notifications
- **Hover:** `opacity-80` or `scale-105` on interactive elements, `0.2s ease-out` transition
- **Focus:** `outline-2 outline-accent` on keyboard navigation
- **Loading:** Pulse animation on skeleton screens (use existing Tailwind `animate-pulse`)

---

## Dark Mode

- **Not implemented in Phase 6.** Light theme fixed. Dark mode deferred to Phase 7.

---

## Responsive Breakpoints

- **Mobile:** `<640px` — Full-width, stacked layout, bottom nav for chat
- **Tablet:** `640px–1024px` — Split sidebar + content, side-by-side chat
- **Desktop:** `>1024px` — Full layout, expanded panels, horizontal scroll for code

---

## Constraints

- **No decorative gradients.** Use solid OKLCH colors only.
- **No drop shadows beyond `shadow-card`, `shadow-chat`, `shadow-code`.** Depth via layering and borders.
- **All colors from CSS tokens.** No arbitrary hex, RGB, or named colors.
- **Font sizes:** `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px), `text-3xl` (30px).
- **Border radius:** Standard `rounded-lg` (`0.5rem`), tight `rounded-md` (`0.375rem`) for code, full `rounded-full` for avatars.

---

## Signature Detail

**Chat bubble differentiation:** User bubbles (accent teal, right-aligned, sharp TR corner) vs. peer bubbles (muted gray, left-aligned, sharp TL corner) creates immediate spatial recognition. Combined with avatars and timestamps, produces WhatsApp-familiar UX.

**Diff visualization:** Color + icon + border + syntax highlighting creates four-layer visual system. Accessibility maintained via color + shape (prefix: `+`, `-`, ` `).

**File tree with semantic icons:** Each file type (`.js`, `.css`, `.png`, etc.) has distinct accent-colored icon. Collapsible folders + indentation create clear hierarchy. Hovers/selection use accent color subtly.

---

**Last updated:** Phase 6 design direction
