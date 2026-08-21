# Re-skin: "Playful Geometric" Design System

## Context

The Campus Event & Club Management app is currently built in an "archival" editorial
style (navy `#1E3A5F` + cream, Playfair Display headings, Inter body). The user has
manually authored a new design spec in `src/imports/pasted_text/design-tokens.ts`
(and an identical `design-tokens-1.ts`) and asked to re-skin the app to it.

The new **Playful Geometric** system (Memphis-inspired, "Stable Grid, Wild
Decoration") is: warm-cream ground `#FFFDF5`, slate-800 text `#1E293B`, a
violet/pink/amber/mint "confetti" palette, Outfit headings + Plus Jakarta Sans body,
chunky 2px borders, **hard offset "pop" shadows** (no blur), pill "candy" buttons,
"sticker" cards, and bouncy elastic motion.

Goal: change the app's *look and feel* only. No functional/behavioral changes to
auth, routing, the role-request flow, notifications, or the mock store.

## Approach

Re-skinning is done in two layers:

1. **Token layer (auto-propagates)** — Because `src/styles/theme.css` maps every
   token through `@theme inline` (`--color-primary: var(--primary)`, etc.), editing
   the `:root` values and `--radius` instantly re-skins the entire `ui/*` kit and all
   token-class usage in `App.tsx` (`bg-primary`, `bg-card`, `border-border`,
   `bg-sidebar`, `text-muted-foreground`, `rounded-lg/md/xl`, etc.). This is the bulk
   of the surface and requires no per-component edits.

2. **Hand-edit layer (bypasses tokens)** — Three things do NOT flow through tokens
   and must be edited directly: the fonts, the ~32 inline `fontFamily: "'Playfair
   Display'..."` styles in `App.tsx`, and the ~70 hardcoded raw-palette classes
   (`bg-green-*`, `text-amber-*`, `bg-purple-*`, `bg-blue-*`) concentrated in a few
   color-map objects. Plus new signature styling (hard shadows, chunky borders, pill
   buttons) added to the shared `ui` primitives so it appears everywhere at once.

Dark mode is out of scope of the new spec (light-only). Keep the `.dark` block present
and functional by re-deriving it from the new palette (violet primary, deeper slate
ground) so nothing breaks, but the design target is light mode.

## Files to Modify

### 1. `src/styles/fonts.css`
Replace the Google Fonts `@import` (Playfair/Inter/JetBrains Mono) with **Outfit**
(400;500;600;700;800) + **Plus Jakarta Sans** (400;500;600;700). Keep JetBrains Mono
(126 `font-mono` uses read well for stats/IDs in this system).

### 2. `src/styles/theme.css` (primary token file)
- **`:root`**: map new tokens →
  `--background:#FFFDF5`, `--foreground:#1E293B`, `--card:#FFFFFF`,
  `--primary:#8B5CF6`, `--primary-foreground:#FFFFFF`, `--secondary:#F472B6` (hot
  pink) with `--secondary-foreground:#1E293B`, `--muted:#F1F5F9`,
  `--muted-foreground:#64748B`, `--accent:#FBBF24` (amber) /
  `--accent-foreground:#1E293B`, `--border:#1E293B` (chunky dark border is a signature),
  `--input-background:#FFFFFF`, `--ring:#8B5CF6`, `--destructive:#EF4444`.
- Add reusable "confetti" brand tokens: `--tertiary:#FBBF24`, `--quaternary:#34D399`,
  and a `--border-soft:#E2E8F0` for hairlines / soft sticker shadows. Map them in
  `@theme inline` (`--color-tertiary`, `--color-quaternary`, `--color-border-soft`).
- **Sidebar tokens**: recolor navy → deep violet. `--sidebar:#6D28D9`,
  `--sidebar-foreground` light, `--sidebar-primary:#FBBF24` (amber active),
  `--sidebar-accent` translucent white.
- **`--radius`**: bump to `1rem` (16px) so `rounded-md/lg/xl` land chunky. Buttons
  override to `rounded-full` directly.
- **charts 1–5**: repoint to violet/pink/amber/mint/red.
- **`@layer base`**: body/inputs `font-family` → `'Plus Jakarta Sans'`; `h1–h4` →
  `'Outfit'` weight `700`. Make the base `label` rule bold + `uppercase tracking-wide`
  so labels globally match the spec. Recolor scrollbar thumb to violet.
- **`.dark`**: re-derive from the new palette so it stays coherent (not archival navy).

### 3. `src/app/components/ui/button.tsx` ("Candy Button")
Edit `buttonVariants` cva base: `rounded-full border-2 border-foreground font-bold` +
hard shadow `shadow-[4px_4px_0px_0px_var(--foreground)]
hover:shadow-[6px_6px_0px_0px_var(--foreground)] hover:-translate-x-0.5
hover:-translate-y-0.5 active:shadow-[2px_2px_0px_0px_var(--foreground)]
active:translate-x-0.5 active:translate-y-0.5` and bouncy
`transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]`.
`default`=violet candy; `secondary`/`outline`=transparent + `hover:bg-accent` (amber
fill), no shadow; keep `ghost`/`link` shadow-less for toolbar/menu use. Bump default/lg
min-height toward 48px. **Preserve the existing `React.forwardRef` + `displayName`** —
required for the Radix `DropdownMenuTrigger asChild` dropdowns (bell/avatar/role
switcher). Do not revert.

### 4. `src/app/components/ui/card.tsx` ("Sticker Card")
`Card`: `border-2 border-foreground rounded-xl
shadow-[8px_8px_0px_0px_var(--border-soft)]` + `motion-safe:hover:-rotate-1
motion-safe:hover:scale-[1.02] transition-transform
ease-[cubic-bezier(0.34,1.56,0.64,1)]`. Keep props/structure identical so all existing
`<Card>` usages inherit it.

### 5. `src/app/components/ui/input.tsx`
`border-2 rounded-lg bg-input-background` with `focus-visible:border-ring
focus-visible:shadow-[4px_4px_0px_0px_var(--ring)]`. (Label styling handled globally
in theme.css base layer.)

### 6. `src/app/components/ui/badge.tsx`
Add `border-2 border-foreground rounded-full font-semibold` to the base so status
badges read as stickers.

### 7. `src/app/App.tsx` (hand-edit surface)
- **Fonts**: replace all ~32 inline `style={{ fontFamily: "'Playfair Display', serif" }}`
  with `"'Outfit', sans-serif"` (reps: lines 863, 1117, 1188, 2260, 3369, …). Sonner
  `toastOptions` fontFamily (~3870) → Plus Jakarta Sans.
- **Hardcoded palette → confetti tokens**: recolor the color-map objects so status/
  category semantics map onto the new palette (keep green=success, amber=pending; add
  a violet+pink+mint rotation for categories):
  - category color lookup (~431–434), `StatCard` color map (~617–618),
  - notification-type icon color map (~2372–2378),
  - status banners/badges at the audited clusters (~497, 584, 1479, 1600, 1856, 1928,
    2162, 2605, 3028, 3114, 3357, 3544, 3611, 3701).
  Prefer semantic tokens (`bg-secondary`, `bg-accent`, `text-primary`) or the new
  `tertiary/quaternary` utilities over raw `*-500` classes. Leave the four Google-brand
  hex values in `GoogleIcon` untouched.
- **Signature decoration (light touch)**: add pop-shadow + 2px border to primary CTAs
  and hero/auth panels; a dot-grid or confetti-shape layer behind `AuthBrandPanel`
  (~1105) and the dashboard hero; amber accent circle behind the login heading. Keep
  dense admin tables/rosters clean per "Stable Grid, Wild Decoration" — decoration
  around content, not inside data tables.
- **Icons**: set Lucide `strokeWidth={2.5}` on prominent standalone icons (nav, stat
  cards, empty states); leave text-adjacent icons as-is.

### 8. Motion / a11y
Prefer `motion-safe:` variants + existing `tw-animate-css` utilities. Add a small
`@layer utilities` `@keyframes wiggle` / `pop-in` only if needed, guarded by
`prefers-reduced-motion`.

## Out of Scope
No changes to `store.ts`, contexts, routing, RBAC, the role-request feature, or any
data/behavior. Purely visual. `globals.css` stays empty. Do not touch protected files
or `__figma__entrypoint__.ts`.

## Verification
- App runs in the Figma Make preview (dev server already running — do not start/build).
- Visual walk of every role via the role switcher: login/register, student dashboard,
  event feed/detail (register/waitlist/cancel), club directory/detail, notifications
  bell + page, club-admin dashboard/event form/rosters/requests, super-admin console,
  role-request flow. Confirm each screen reads in the new palette/fonts with no
  leftover navy/Playfair/serif and no orphan `green/amber/purple/blue-*` swatches.
- Confirm bell, avatar menu, and role-switcher dropdowns still open (Radix `asChild` +
  forwardRef Button intact).
- Check hard-shadow buttons/cards, pill buttons, focus-shadow inputs, uppercase bold
  labels; hover wiggle on cards; contrast of slate-800 text on cream/white.
- Responsive pass at ~mobile and desktop: shadows/decoration reduce, buttons stay
  ≥48px, floating shapes don't overlap text; `prefers-reduced-motion` disables wiggle.
