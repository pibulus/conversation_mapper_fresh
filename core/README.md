# 🧠 Conversation Mapper Core - The Nervous System

> Framework-agnostic AI orchestration logic extracted from SvelteKit

## What Is This?

This is the **nervous system** of conversation mapper - the core AI logic that makes everything work. It's been extracted into pure TypeScript so it can be used in **any framework** (Fresh, SvelteKit, React, Vue, etc.).

The framework is just bones. The nervous system is where the electricity happens.

## Core Features

### ✨ AI Self-Checkoff
The magic feature: AI listens to new audio/text and automatically updates existing action item statuses.

*"I just finished that task!"* → ✓ Automatically marked as completed

### 🕸️ Conversation Graph
Non-chronological topic extraction with emojis, colors, and relationships. Prevents speaker interruptions by visualizing all topics so participants can circle back later.

### ⚡ Parallel Processing
Topics, action items, and status checks run simultaneously for fast analysis and efficient API usage.

### 📤 Flexible Export
Same conversation, many formats: blog posts, technical manuals, haikus, meeting summaries, etc.

## Structure

```
/core/
├── ai/
│   ├── prompts.ts              # All AI prompts as constants
│   ├── gemini.ts               # Gemini API wrapper
│   └── index.ts
├── types/
│   ├── action-item.ts          # Action item with AI checkoff
│   ├── conversation.ts         # Conversation data structure
│   ├── edge.ts                 # Topic relationship
│   ├── node.ts                 # Topic node with emoji/color
│   ├── transcript.ts           # Transcript segment
│   └── index.ts
├── orchestration/
│   ├── conversation-flow.ts    # Main flow: Audio/Text → AI → Data
│   ├── parallel-analysis.ts    # Parallel AI coordinator
│   └── index.ts
├── export/
│   ├── formats.ts              # Pre-defined export formats
│   ├── transformer.ts          # Conversation transformer
│   └── index.ts
└── index.ts                     # Main entry point
```

## Usage

### 1. Setup AI Service

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createGeminiService } from './core';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
const aiService = createGeminiService(model);
```

### 2. Process Audio Input

```typescript
import { processAudio } from './core';

const result = await processAudio(
  aiService,
  audioBlob,
  conversationId,
  existingActionItems // Optional - for AI self-checkoff
);

// Result contains:
// - conversation (title, transcript)
// - transcript (text, speakers)
// - nodes (topic nodes with emojis)
// - edges (topic relationships)
// - actionItems (extracted tasks)
// - statusUpdates (AI checkoff results)
```

### 3. Process Text Input

```typescript
import { processText } from './core';

const result = await processText(
  aiService,
  text,
  conversationId,
  speakers, // Optional
  existingActionItems // Optional - for AI self-checkoff
);
```

### 4. Generate Summary

```typescript
import { generateSummary } from './core';

const summary = await generateSummary(aiService, conversationText);
```

### 5. Export Conversation

```typescript
import { transformConversation, EXPORT_FORMATS } from './core';

// Use predefined format
const blogPost = await transformConversation(
  aiService,
  'BLOG',
  conversationText
);

// Or use custom prompt
import { transformWithCustomPrompt } from './core';

const custom = await transformWithCustomPrompt(
  aiService,
  'Turn this into a pirate shanty',
  conversationText
);
```

## Available Export Formats

- `BLOG` - Engaging blog post
- `TECHNICAL_MANUAL` - Step-by-step manual
- `MEETING_SUMMARY` - Professional meeting notes
- `HAIKU` - 5-7-5 syllable poetry
- `BULLET_POINTS` - Concise summary
- `EMAIL` - Professional email
- `PRESENTATION` - Markdown slides
- `TWEET_THREAD` - Twitter thread
- `STORY` - Narrative format
- `FAQ` - Questions and answers
- `EXECUTIVE_SUMMARY` - One-page summary
- `LESSON_PLAN` - Educational format

## Type Definitions

All types are fully typed with TypeScript:

```typescript
import type {
  Conversation,
  Node,
  Edge,
  ActionItem,
  Transcript,
  ConversationGraph,
  AIService
} from './core';
```

## The Flow

```
Audio/Text Input
    ↓
[1] Transcription (if audio)
    ↓
[2] PARALLEL AI ANALYSIS
    ├── Title Generation
    ├── Topic/Node Extraction (conversation graph)
    ├── Action Item Extraction
    └── AI Self-Checkoff (check existing items)
    ↓
[3] Return Structured Data
    ↓
[4] Your Framework Handles Storage & UI
```

## Integration Examples

### Fresh (Deno)
```typescript
import { processAudio } from '@/core/index.ts';
// Use in route handlers or islands
```

### SvelteKit
```typescript
import { processAudio } from '$lib/core';
// Use in load functions or server endpoints
```

### React/Next.js
```typescript
import { processAudio } from '@/core';
// Use in API routes or server components
```

## Why Extract the Nervous System?

The SvelteKit version was a prototype that proved the concept. But the real value isn't the framework - it's the AI orchestration, the prompts, the timing, the *feel*.

This extraction means:
- ✅ Use in any framework
- ✅ Test the logic independently
- ✅ Reuse in other meeting/conversation tools
- ✅ Create modular building blocks
- ✅ The nervous system stays intact while we rebuild the body

**Minerals don't care what rock they're in.**

Quartz is quartz in granite or sandstone. This AI orchestration doesn't care if it's wrapped in Svelte or Fresh. It just... computes. Analyzes. Responds.

---

*The nervous system is the value. The framework is just bones.*
