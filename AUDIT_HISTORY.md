# Audit History

This file preserves historical audit notes from the Fresh migration era and
records which findings are still relevant. It is not a current task board.

## Historical Audit Index

| Historical file              | Old grade | Current status  | Notes                                                       |
| ---------------------------- | --------- | --------------- | ----------------------------------------------------------- |
| ACTION_ITEMS_AUDIT.md        | B+        | Partly relevant | Action item UI and dedup concerns still useful context      |
| ACTION_ITEMS_SYSTEM_AUDIT.md | A-/94     | Partly relevant | AI self-checkoff remains core behavior                      |
| APPEND_AUDIO_AUDIT.md        | -         | Mostly resolved | Summary append and two-way status changes now implemented   |
| ARCHITECTURE.md              | Stale     | Superseded      | Replaced by `README.md` and `CLAUDE.md`                     |
| AUDIO_RECORDING.md           | -         | Superseded      | Recording flow is now covered by app code and `CLAUDE.md`   |
| CLEANUP_ROADMAP.md           | -         | Partly relevant | Inline style/token debt remains                             |
| COLOR_AUDIT.md               | -         | Partly relevant | Theme/style debt remains, exact counts are historical       |
| CONSISTENCY_AUDIT.md         | -         | Partly relevant | UI consistency concerns remain                              |
| FEATURE_PARITY.md            | 99%       | Superseded      | Migration parity is no longer the active question           |
| GLOSSARY.md                  | -         | Superseded      | `CLAUDE.md` now carries the current architecture map        |
| MOBILE_AUDIT.md              | A         | Partly relevant | Real-device responsive QA remains useful                    |
| NAVIGATION_AUDIT.md          | C+ -> A   | Mostly resolved | Earlier focus/keyboard fixes were incorporated              |
| OLD_PROMPT_AUDIT.md          | 95%       | Superseded      | Prompt behavior now lives in `core/ai/prompts.ts` and tests |
| SPEAKER_DIARIZATION.md       | -         | Superseded      | Speaker extraction is part of current AI flow               |
| VISUAL_THEME_ANALYSIS.md     | Stale     | Superseded      | Referenced removed theme experiments                        |
| WHAT_IS_THIS.md              | -         | Superseded      | Product summary is now in `README.md`                       |

## Resolved Since The Audits

- Historical audit files were consolidated into this single record.
- `api/joke.ts` was removed.
- Core tests were added and currently cover prompts, orchestration, Gemini, and
  OpenRouter behavior.
- README model/provider references were updated.
- Append summaries now append an update instead of replacing the previous
  summary.
- Append status updates support both `completed` and `pending`.
- OpenRouter provider support was added, with Gemini retained as fallback.

## Still Relevant

1. **Inline style and design-token debt**: Many UI files still rely on hardcoded
   inline style values. This makes theme consistency and responsive polish
   harder than it should be.
2. **Semantic action-item deduplication**: Append merging still compares
   normalized descriptions. Semantically equivalent tasks with different wording
   can become duplicates.
3. **Legacy Gemini naming**: `/api/gemini` and `utils/geminiService.ts` now
   behave as provider-neutral export helpers but still carry old names.
4. **Theme behavior clarity**: The app has theme variables and local theme
   restore code, but system dark-mode behavior is not a clearly supported
   feature.
5. **Real-device audio QA**: OpenRouter audio works in a generated local sample;
   browser-recorded `audio/webm` should be checked on desktop and iPhone.

## Documentation Status

- `README.md`: Product overview, setup, common usage.
- `CLAUDE.md`: Current development guide and architecture map.
- `core/README.md`: Provider-neutral core API and flow.
- `AUDIT_HISTORY.md`: Historical record and remaining audit-derived risks.
