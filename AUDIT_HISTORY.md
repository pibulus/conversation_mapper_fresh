# Audit History

> November 2025 audits of the Conversation Mapper codebase. Key actionable findings are captured in `CLAUDE.md` Known Issues. This file preserves the historical record.

## Audit Summary

| File | Grade | Key Finding |
|------|-------|-------------|
| ACTION_ITEMS_AUDIT.md | B+ | CRUD, drag-drop, sorting, mobile issues in ActionItemsCard |
| ACTION_ITEMS_SYSTEM_AUDIT.md | A-/94 | AI self-checkoff praised; deduplication logic naive |
| APPEND_AUDIO_AUDIT.md | — | 7 issues: summary replacement (not merge), metadata type errors, one-way status updates |
| ARCHITECTURE.md | ⚠️ Stale | Referenced `/theme-system/` dir and `JuicyThemes.tsx` — both deleted |
| AUDIO_RECORDING.md | — | Feature parity confirmed; append flow documented |
| CLEANUP_ROADMAP.md | — | 406 hardcoded inline style values bypassing CSS token system |
| COLOR_AUDIT.md | — | Cold shadows, inconsistent Tailwind usage; 406+ `px` values |
| CONSISTENCY_AUDIT.md | — | 16 scattered font sizes, 4 button patterns, recording logic duplicated |
| FEATURE_PARITY.md | 99% | Svelte → Fresh migration complete; URL-only sharing noted |
| GLOSSARY.md | — | Islands, components, API routes reference guide |
| MOBILE_AUDIT.md | A | Neo-brutalist borders/shadows not fully responsive <375px |
| NAVIGATION_AUDIT.md | C+ → A | ESC-to-close, Enter-to-submit, focus trap all implemented |
| OLD_PROMPT_AUDIT.md | 95% | Implementation matches original spec; exceeds it in component extraction |
| SPEAKER_DIARIZATION.md | — | Auto-detected, badged, used in action item assignment |
| VISUAL_THEME_ANALYSIS.md | ⚠️ Stale | 8.5/10; references deleted `theme-system/` and `JuicyThemes.tsx` |
| WHAT_IS_THIS.md | — | Elevator pitch; AI self-checkoff "killer feature" documented |

## Top Actionable Findings (still open)

1. **406+ hardcoded `px`/`rem` inline style values** — CSS tokens defined in `static/styles.css` `:root` are not used consistently. Theming and responsive behavior suffer.
2. **Append flow issues** — Summary is replaced not merged; `statusUpdates` only flow forward (completed items can't be re-opened via append).
3. **Naive deduplication** — Action item dedup relies on string matching; semantically similar items can slip through.
4. **No dark mode detection** — `prefers-color-scheme: dark` not respected.
