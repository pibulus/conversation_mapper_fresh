# 🎨 CONVERSATION MAPPER - CLEANUP ROADMAP

**Status**: Phase 1 (Foundation) Complete ✅
**Next**: Phase 2 (Component Unification) - Est. 2-3 hours
**Created**: 2025-11-17
**Session**: Theme system rebuild + design system audit

---

## WHAT WAS DONE (This Session)

### ✅ Theme System Rebuild
- **NUKED** broken theme randomizer (746 lines deleted)
- Removed all dynamic theme code (services/themes.ts, themeStore.ts, ThemeShuffler component)
- Simplified to clean warm gradient: cream → peach → warm white
- Kept risograph color splashes (fluro pink, peach, lavender)

### ✅ CSS Variable System (Foundation)
Added to `static/styles.css`:

**Typography Scale**
- `--font-size-xs` through `--font-size-3xl` (8 sizes, modular scale)
- Ready to replace 406 hardcoded size units

**Warm Shadow System**
- `--shadow-xs` through `--shadow-xl-warm` (5 sizes)
- `--shadow-slab` for neo-brutalist buttons
- ALL use `rgba(30, 23, 20, ...)` warm brown instead of pure black

**Warm Surface Colors**
- `--surface-cream`, `--surface-cream-hover`
- `--surface-white-warm` (warmest near-white)
- `--surface-glass-warm` (warm glassmorphism)

**Warm Borders**
- `--border-cream`, `--border-cream-medium`, `--border-cream-strong`
- Graduated opacity for hierarchy

### ✅ Fixed Existing Variables
- Updated `--glass-bg` to use `--surface-glass-warm`
- Fixed all shadow variables to use warm brown
- Glassmorphism now has cream tint

### ✅ Comprehensive Audits Created
- `COLOR_AUDIT.md` - Full color/styling analysis
- `CONSISTENCY_AUDIT.md` - Typography, spacing, buttons, architecture

---

## WHAT NEEDS DOING (Next Session)

### 🎯 PHASE 2: Component Color Unification (2-3 hours)

**Priority Order** (by visual impact):

#### 1. ActionItemsCard.tsx (~45 min)
**File**: `components/ActionItemsCard.tsx`
**Impact**: HIGH - most visible, worst offender

**Issues**:
- 20+ hardcoded Tailwind colors (`bg-white`, `bg-gray-50`, `hover:bg-purple-50`)
- Cold black shadows: `'2px 2px 0 rgba(0,0,0,0.1)'`
- Generic white buttons

**Fix**:
```tsx
// REPLACE
class="bg-white hover:bg-gray-50"
// WITH
class="bg-[var(--surface-cream)] hover:bg-[var(--surface-cream-hover)]"

// OR create Tailwind utilities in tailwind.config (better):
extend: {
  colors: {
    'cream': 'var(--surface-cream)',
    'cream-dark': 'var(--surface-cream-hover)',
  }
}
// Then use: class="bg-cream hover:bg-cream-dark"

// REPLACE shadows
boxShadow: '2px 2px 0 rgba(0,0,0,0.1)'
// WITH
boxShadow: 'var(--shadow-sm)'
```

**Specific lines** (from audit):
- Line 379-380: Buttons in header
- Line 450: Item cards
- Line 532: Assignee dropdown
- Line 550, 562, 732: Dropdown items (PURPLE hovers!)
- Line 608-610: Delete button

#### 2. SummaryCard.tsx (~20 min)
**File**: `components/SummaryCard.tsx`

**Issues**:
- Missing variable: `var(--color-accent-rgb)` used but never defined
- `bg-white` backgrounds
- Generic shadows

**Fix**:
1. Add to `styles.css`: `--color-accent-rgb: 232, 131, 156;` (from `#E8839C`)
2. Replace `bg-white` with `bg-[var(--surface-cream)]`
3. Use `var(--shadow-md)` for shadows

#### 3. TranscriptCard.tsx (~15 min)
**File**: `components/TranscriptCard.tsx`

**Issues**: Same pattern as SummaryCard

**Fix**: Same replacements

#### 4. Dashboard Card CSS (~10 min)
**File**: `static/styles.css` lines 955-965

Currently glassmorphism is updated, but might need header color adjustment if pink feels too strong.

**Optional tweaks**:
```css
.dashboard-card-header {
  /* Option A: Keep pink accent */
  background: var(--color-accent);

  /* Option B: Subtle warm cream with border */
  background: var(--surface-cream-hover);
  border-bottom: 2px solid var(--border-cream-medium);
  color: var(--soft-black);  /* instead of white */
}
```

---

### 🎯 PHASE 3: Button System (1 hour)

**Current mess**: 4 different button patterns
1. `.mapper-slab-button` (CSS class, neo-brutalist)
2. Inline `style` props
3. Tailwind classes
4. `onMouseEnter` hacks (breaks mobile!)

**Goal**: Create unified `.btn` system

**New System** (add to `styles.css`):

```css
/* ===================================================================
   BUTTON SYSTEM - Unified interaction pattern
   ================================================================ */

.btn {
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-base);
  font-weight: 600;
  border-radius: var(--border-radius);
  border: var(--border-width) solid var(--soft-black);
  background: var(--surface-cream);
  color: var(--soft-black);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn:hover {
  background: var(--surface-cream-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-xs);
}

/* Variants */
.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-slab {
  box-shadow: var(--shadow-slab);
  border-width: 2.5px;
}

.btn-slab:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 rgba(30, 23, 20, 0.25);
}

.btn-slab:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(30, 23, 20, 0.25);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: var(--font-size-sm);
}

.btn-xs {
  padding: 0.25rem 0.75rem;
  font-size: var(--font-size-xs);
}

.btn-ghost {
  background: transparent;
  border-color: var(--border-cream-medium);
  box-shadow: none;
}
```

**Then replace**:
- 12+ inline button styles across components
- Remove `onMouseEnter`/`onMouseLeave` hacks (accessibility issue!)
- Standardize to `class="btn btn-primary"` etc.

---

### 🎯 PHASE 4: Typography Unification (30 min)

**Current**: 406 hardcoded size units scattered everywhere

**Fix**: Use the new variables

```tsx
// REPLACE
<h2 style={{ fontSize: '1.5rem' }}>

// WITH
<h2 style={{ fontSize: 'var(--font-size-2xl)' }}>

// OR (better) create semantic classes:
.heading-page { font-size: var(--font-size-2xl); }
.heading-card { font-size: var(--font-size-xl); }
.text-body { font-size: var(--font-size-base); }
.text-small { font-size: var(--font-size-sm); }
```

---

### 🎯 PHASE 5: Dead Code Cleanup (30 min)

**Tasks**:
1. Remove unused Tailwind classes from components
2. Delete commented-out code blocks
3. Clean up unused imports
4. Remove duplicate utility functions

**Files** (from consistency audit):
- `islands/ConversationList.tsx` - 270 lines, all inline styles
- `islands/UploadIsland.tsx` - Duplicate recording logic
- `components/` - Various unused imports

---

## AUTONOMOUS DECISION-MAKING GUIDE

**You have permission to**:
- Make judgment calls on color choices (stay within warm palette)
- Reorganize CSS for clarity
- Extract repeated patterns into utilities
- Delete obviously dead code
- Improve accessibility (remove onMouseEnter hacks)

**Ask Pablo before**:
- Changing component architecture
- Removing features (even if they look unused)
- Major visual changes (header layouts, card structures)
- Extracting hooks/utilities if it requires new files

**Key Principles**:
- **Warm > Cold**: Always choose warm tints over generic whites/greys
- **Variables > Hardcodes**: Always prefer CSS variables
- **Classes > Inline**: Move inline styles to CSS classes
- **Accessibility**: No hover-only interactions, proper ARIA
- **80/20**: Fix the most visible stuff first

---

## TESTING CHECKLIST

After each phase, verify:

- [ ] No console errors
- [ ] Dashboard cards look cohesive
- [ ] Action items have consistent styling
- [ ] Buttons work on mobile (no broken hover states)
- [ ] Warm gradient background visible
- [ ] No pure white/cold grey visible
- [ ] Typography feels consistent
- [ ] Shadows all have warm brown tone

**Visual test**: Load the app, upload a conversation, check all views look unified.

---

## QUICK REFERENCE

**Warm Palette**:
- Text: `var(--soft-black)` #1E1714
- Secondary text: `var(--soft-brown)` #3A2A22
- Backgrounds: `var(--surface-cream)` #FFF7EF
- Hover: `var(--surface-cream-hover)` #FAF3E9
- Borders: `var(--border-cream-medium)` rgba(30,23,20,0.18)
- Shadows: `var(--shadow-md)` uses warm brown

**Accent Colors** (use sparingly):
- Primary: `var(--color-accent)` #E8839C (pink)
- Electric: `var(--accent-electric)` #ff5c8d (hot pink)

**Typography**:
- Hero: `var(--font-size-3xl)` 2rem
- Page Title: `var(--font-size-2xl)` 1.5rem
- Card Title: `var(--font-size-xl)` 1.25rem
- Body: `var(--font-size-base)` 0.9375rem
- Small: `var(--font-size-sm)` 0.875rem

**Shadows**:
- Subtle: `var(--shadow-sm)`
- Cards: `var(--shadow-md)`
- Elevated: `var(--shadow-lg)`
- Hero: `var(--shadow-xl-warm)`
- Buttons: `var(--shadow-slab)` (neo-brutalist)

---

## FILES TO PRIORITIZE

**High Impact** (fix these first):
1. `components/ActionItemsCard.tsx` - 20+ hardcodes
2. `components/SummaryCard.tsx` - broken variable
3. `components/TranscriptCard.tsx` - consistency
4. `static/styles.css` - add button system

**Medium Impact**:
5. `islands/ConversationList.tsx` - 270 lines inline styles
6. `islands/DashboardIsland.tsx` - card layout
7. `islands/UploadIsland.tsx` - buttons

**Low Impact** (cleanup):
8. Various islands - typography
9. Dead code removal
10. Utility extraction

---

## COMMIT STRATEGY

**This session's commit**:
```
refactor: 🎨 Add unified design system + warm gradient theme

- Delete broken theme randomizer (746 lines)
- Add typography scale (8 sizes)
- Add warm shadow system (5 sizes)
- Add warm surface/border colors
- Fix glassmorphism to use cream tint
- Create COLOR_AUDIT.md + CONSISTENCY_AUDIT.md
- Simplify to single warm gradient background

Foundation ready for component color unification.
```

**Next session commits** (suggested):
1. `refactor: 🎨 Unify ActionItemsCard colors (warm palette)`
2. `refactor: 🎨 Fix SummaryCard + TranscriptCard colors`
3. `feat: ✨ Add unified button system (.btn + variants)`
4. `refactor: 🎨 Replace inline button styles across components`
5. `refactor: 🎨 Unify typography scale`
6. `chore: 🧹 Remove dead code and unused CSS`

---

## SUCCESS METRICS

**When done, you should have**:
- ✅ No hardcoded colors in components
- ✅ All shadows use warm brown tone
- ✅ Consistent button system
- ✅ Typography uses scale variables
- ✅ No cold white/grey anywhere
- ✅ Cohesive warm pastel aesthetic
- ✅ Mobile-friendly (no hover-only interactions)
- ✅ Maintainable (variables, not hardcodes)

**Estimated total time**: 4-5 hours
**Completed**: 1.5 hours (Phase 1)
**Remaining**: 2.5-3.5 hours

---

## NOTES FROM PABLO

- **Aesthetic**: Warm, creamy, pastel punk with risograph energy
- **No pure white**: Always use warm cream tints
- **No absolute black**: Use soft-black #1E1714
- **No cold colors**: Avoid blues, greens, pure greys
- **Modular**: Simple, tasteful, easy to maintain
- **Utilitarian**: Functional but with personality

---

*Good luck! The foundation is solid. Just need to apply it consistently.*
