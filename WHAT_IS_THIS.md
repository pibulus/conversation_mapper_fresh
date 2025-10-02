# 🧠 Conversation Mapper - What It Does

## The Elevator Pitch
**Turn messy meeting recordings into organized topic maps, action items, and summaries - automatically.**

## The User Flow

1. **Upload** audio file or paste conversation text
2. **AI processes** in parallel:
   - Transcribes audio (with speaker detection)
   - Extracts action items with assignees/dates
   - Generates topic graph (emoji nodes + relationships)
   - Creates summary
   - **🌟 AI Self-Checkoff**: Listens to new input and auto-completes tasks
3. **Display** in draggable masonry dashboard:
   - 📝 Transcript
   - 📊 Summary
   - ✅ Action Items (with AI checkoff)
   - 🎤 Audio Recordings
   - 🕸️ EmojimapViz (overlay graph)
4. **Export** to multiple formats (blog, manual, haiku, etc.)

## The Magic Feature: AI Self-Checkoff

User says: *"I finished writing that report"*
→ AI automatically marks "Write report" action item as ✓ Complete

**How**: AI compares new audio/text against existing action items and updates status with reasoning.

## The Components

### Dashboard (4 Draggable Cards)
1. **Transcript** - Full conversation with speakers
2. **Summary** - AI-generated overview
3. **Action Items** - Tasks with assignees, dates, AI checkoff
4. **Audio Recordings** - Playback of uploaded files

### Overlay
**EmojimapViz** - Non-chronological topic graph
- Shows relationships between topics (not timeline)
- Prevents speaker interruptions
- Visual aid for circling back to topics

## The Tech

- **AI**: Google Gemini for all analysis
- **Storage**: IndexedDB (local) + Supabase (cloud)
- **Layout**: Muuri (masonry + drag-drop)
- **Viz**: D3.js for topic graph
- **Framework**: Fresh (Deno) with Islands

## The Nervous System (Already Extracted!)

All AI logic is in `/core/`:
- `ai/prompts.ts` - All Gemini prompts
- `ai/gemini.ts` - AI service wrapper
- `orchestration/` - Parallel processing
- `export/` - Transform to different formats
- `types/` - Full TypeScript definitions

## Why This Exists

**Problem**: Meetings generate messy notes, forgotten tasks, interrupted topics
**Solution**: AI creates structure, tracks completion, visualizes relationships

**Target User**: Anyone who records meetings and wants automatic organization

---

*The nervous system is extracted. Now we rebuild the body in Fresh.*
