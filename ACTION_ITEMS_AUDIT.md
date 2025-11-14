# ActionItemsCard Audit

**File:** `components/ActionItemsCard.tsx`
**Size:** 671 lines
**Grade:** B+ (88/100)

## ✅ What's Working Well

- **Clean separation** - Well-encapsulated component
- **Full CRUD** - Add, edit, delete, update all work
- **Drag & drop** - Manual reordering functional
- **Sort modes** - 3 modes (manual, assignee, date)
- **Search/filter** - Works correctly
- **State management** - All encapsulated

## ⚠️ Issues Found

### 🔴 CRITICAL (Mobile UX)

1. **Modal not mobile-friendly** (line 582)
   - Uses `max-w-md` which is too wide on small screens
   - Should use `mx-4` or similar for mobile breathing room
   - ✅ **Already fixed** with `mx-4` on modal div

2. **Dropdown overflow on mobile** (line 446)
   - Assignee dropdown might overflow viewport
   - Should check position and flip up if needed
   - **Impact:** Medium - usable but not ideal

### 🟡 MEDIUM (Performance)

3. **No memoization** (lines 81-122)
   - `sortedActionItems` recalculates on every render
   - Should use `useComputed` from signals
   - **Impact:** Low for < 50 items, noticeable > 100 items

4. **Drag handlers recreated** (lines 236-267)
   - New function references on every render
   - Minor perf hit, not critical
   - **Impact:** Low

### 🟢 LOW (Code Quality)

5. **Unused import** (line 8)
   - `Signal` imported but never used
   - **Fix:** Remove import
   - **Impact:** None (tree-shaking will handle)

6. **No keyboard shortcuts** (modal)
   - Missing Enter to submit
   - Missing Escape to cancel in modal
   - **Impact:** Accessibility/UX

## 🎯 Recommended Fixes (Priority Order)

### Quick Wins (< 30 min):
1. ✅ Remove unused `Signal` import
2. Add keyboard shortcuts (Enter/Escape)
3. Use `useComputed` for sorted items

### Nice to Have (< 1 hour):
4. Smart dropdown positioning (flip up if near bottom)
5. Touch event optimization for mobile drag

### Not Urgent:
- Memoize drag handlers (minimal benefit)
- Virtual scrolling (only needed for 100+ items)

## 📊 Overall Assessment

**Verdict:** Solid component, no critical bugs. Mobile works but could be smoother.

**Recommendation:** Focus on keyboard shortcuts (accessibility win) and then move to other quick wins in the app (mobile polish elsewhere, lazy loading viz).
