# Conversation Mapper Core

Framework-agnostic AI orchestration for turning conversation text or audio into
structured data.

## Responsibilities

- Build transcripts from audio inputs.
- Extract action items and assignees.
- Detect action item status changes from follow-up context.
- Extract emoji topic nodes and relationship edges.
- Generate summaries, titles, and markdown exports.

Provider-specific SDK details stay behind the `AIService` interface.

## Structure

```text
/core/
├── ai/
│   ├── types.ts                # Provider-neutral AIService and audio types
│   ├── prompts.ts              # Prompt builders
│   ├── helpers.ts              # Shared JSON/speaker parsing helpers
│   ├── openrouter.ts           # OpenRouter chat/audio implementation
│   └── gemini.ts               # Gemini fallback implementation
├── types/
│   ├── action-item.ts
│   ├── conversation.ts
│   ├── edge.ts
│   ├── node.ts
│   ├── transcript.ts
│   └── index.ts
├── orchestration/
│   ├── conversation-flow.ts    # Main Audio/Text -> Data flow
│   ├── parallel-analysis.ts    # Parallel topics/actions/status/summary
│   └── index.ts
├── export/
│   ├── formats.ts
│   ├── transformer.ts
│   └── index.ts
└── index.ts                    # Public exports
```

## Provider Setup

OpenRouter is the primary provider:

```typescript
import { createOpenRouterService } from "./core";

const aiService = createOpenRouterService({
  apiKey: openRouterApiKey,
  model: "google/gemini-2.5-flash-lite",
});
```

Gemini can still be used directly:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGeminiService } from "./core";

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
const aiService = createGeminiService(model);
```

The Fresh server normally uses `services/ai.ts` to select and cache the service
from environment variables.

## Processing Text

```typescript
import { processText } from "./core";

const result = await processText(
  aiService,
  text,
  conversationId,
  speakers,
  existingActionItems,
  existingNodes,
);
```

## Processing Audio

Server routes should create a provider-specific `AudioPart` first. In this app,
that is handled by `services/audio.ts`.

```typescript
import { processAudio } from "./core";
import { uploadAudioFile } from "../services/audio.ts";

const { part: audioPart, fileName } = await uploadAudioFile(file);

try {
  const result = await processAudio(
    aiService,
    audioPart,
    conversationId,
    existingActionItems,
    existingNodes,
  );
} finally {
  await deleteUploadedFile(fileName);
}
```

## Result Shape

`processText()` and `processAudio()` return a `ConversationFlowResult` with:

- `conversation`
- `transcript`
- `nodes`
- `edges`
- `actionItems`
- `summary`
- `statusUpdates`

Topic nodes include `label`, `emoji`, and `color`; edges include source/target
topic IDs and color.

## Flow

```text
Text or provider-specific audio part
    ↓
Transcription, if audio
    ↓
Parallel analysis
    ├── Topic/Node extraction
    ├── Action item extraction
    ├── Existing action status checks
    └── Summary generation
    ↓
Title generation
    ↓
ConversationFlowResult
```

## Export Helpers

```typescript
import {
  EXPORT_FORMATS,
  transformConversation,
  transformWithCustomPrompt,
} from "./core";

const blogPost = await transformConversation(
  aiService,
  "BLOG",
  conversationText,
);

const custom = await transformWithCustomPrompt(
  aiService,
  "Turn this into release notes",
  conversationText,
);
```

## Available Export Formats

- `BLOG`
- `TECHNICAL_MANUAL`
- `MEETING_SUMMARY`
- `HAIKU`
- `BULLET_POINTS`
- `EMAIL`
- `PRESENTATION`
- `TWEET_THREAD`
- `STORY`
- `FAQ`
- `EXECUTIVE_SUMMARY`
- `LESSON_PLAN`

## Test Coverage

Core tests live in `core/tests/` and cover:

- prompt builders
- Gemini response parsing and failure paths
- OpenRouter request formatting
- text/audio orchestration
- parallel analysis behavior

Run them with:

```bash
deno task test
```
