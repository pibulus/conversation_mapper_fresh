# 🧠 Conversation Mapper

> Turn messy meeting recordings into organized topic maps, action items, and
> summaries - automatically.

**Conversation Mapper** uses AI to transform unstructured conversations (audio
or text) into structured knowledge: transcripts with speaker detection,
auto-generated action items, topic relationship graphs, and customizable
exports.

## ✨ Key Features

### 🎤 Audio → Structure

- **Record or upload** audio files
- **Automatic transcription** with speaker diarization
- **AI-powered analysis** extracts topics, action items, summaries
- **Real-time visualizer** during recording

### 🤖 AI Self-Checkoff (The Magic Feature)

User says: _"I finished writing that report"_ → AI automatically marks "Write
report" action item as ✓ Complete

The AI compares new audio/text against existing action items and updates their
status with reasoning.

### 🕸️ Interactive Topic Graph (EmojimapViz)

- **Non-chronological visualization** of conversation topics
- **Emoji-based nodes** with relationship edges
- **Force-directed layout** for organic topic clustering
- Helps participants circle back to interrupted topics

### 📤 Flexible Export

Transform the same conversation into multiple formats:

- Blog posts
- Technical documentation
- Meeting summaries
- Haiku poems (why not?)
- Custom prompts

### 🎨 Beautiful, Responsive UI

- **Mesh gradient backgrounds** (animated SVG)
- **Clean Svelte-inspired aesthetic**
- **Fully responsive** mobile layout
- **Dark/light theme** with system detection
- **Draggable cards** for customizable layout

## 🚀 Quick Start

### Prerequisites

- **Deno** (v1.40+):
  [Install Deno](https://deno.land/manual/getting_started/installation)
- **AI API Key**: [Get API key](https://aistudio.google.com/app/apikey) or
  [OpenRouter key](https://openrouter.ai/keys)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd conversation_mapper_fresh
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your AI API key:
   ```bash
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_api_key_here
   API_AUTH_TOKEN=choose_a_secret_value
   # Optional: harden server routes & sessions
   ALLOWED_ORIGINS=http://localhost:8003
   API_RATE_LIMIT=60
   API_RATE_WINDOW_MS=60000
   API_SESSION_TTL_MS=14400000
   API_COOKIE_SECURE=false
   GEMINI_DELETE_RETRIES=3
   GEMINI_DELETE_RETRY_DELAY_MS=2000
   # Override the default Gemini model if needed
   # GEMINI_MODEL=gemini-2.5-flash-lite
   # Or use OpenRouter
   # AI_PROVIDER=openrouter
   # OPENROUTER_API_KEY=your_openrouter_api_key_here
   # OPENROUTER_MODEL=google/gemini-2.5-flash-lite
   ```

3. **Start the development server**
   ```bash
   deno task start
   ```

   The app will be available at `http://localhost:8003`

4. **First API call**

   When you trigger any AI-powered feature from the UI, the browser will prompt
   you for the `API_AUTH_TOKEN`. Paste the same value you set in `.env`—it’s
   only used to open a short-lived HttpOnly session cookie, so it’s never stored
   in LocalStorage and you’ll be prompted again when the session expires.

   Whenever you stop a clip that’s at least 30 seconds long, we automatically
   save a `.webm` backup in your Downloads folder so you can re-upload if
   anything goes wrong.

### First Use

1. **Record** a conversation or **upload** an audio file
2. Wait for AI processing (usually 10-30 seconds)
3. **Explore** the dashboard:
   - 📝 Transcript with speakers
   - 📊 AI-generated summary
   - ✅ Action items with assignees
   - 🕸️ Topic relationship graph
4. **Export** to different formats using the drawer
5. **Share** conversations with shareable links

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development guide for future coding sessions
- **[core/README.md](./core/README.md)** - Framework-agnostic AI logic
  documentation
- **[AUDIT_HISTORY.md](./AUDIT_HISTORY.md)** - Consolidated historical audit
  notes

## 🏗️ Architecture

```
/core/                  # Framework-agnostic AI logic
  ├── ai/              # AI provider wrappers & prompts
  ├── orchestration/   # Parallel processing flows
  ├── types/           # TypeScript type definitions
  ├── storage/         # localStorage & share services
  └── export/          # Format transformers

/islands/              # Interactive Preact components (Fresh)
/components/           # Shared UI components
/routes/               # Fresh routes & API endpoints
/signals/              # Global state (Preact signals)
/utils/                # Utility functions
/services/             # Server-side API/auth/audio helpers
```

The core AI logic (`/core/`) is extracted into pure TypeScript and can be used
in **any framework** (React, Vue, Svelte, etc.). Fresh is just the current UI
implementation.

## 🛠️ Development

### Available Commands

```bash
deno task start      # Start dev server (port 8003)
deno task build      # Build for production
deno task preview    # Preview production build
deno task check      # Run linting and type checking
```

### Tech Stack

- **Framework**: [Fresh](https://fresh.deno.dev/) (Deno + Preact)
- **AI**: Google Gemini by default, OpenRouter optional
- **Visualization**: [D3.js](https://d3js.org/) (force-directed graphs)
- **State**: [Preact Signals](https://preactjs.com/guide/v10/signals/)
- **Storage**: LocalStorage + IndexedDB
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 🎯 Use Cases

- **Meeting notes**: Automatic transcription and action item extraction
- **Interview analysis**: Topic mapping and speaker tracking
- **Podcast summaries**: Generate blog posts from audio
- **Brainstorming sessions**: Visualize topic relationships
- **Status updates**: AI detects completed tasks from follow-up conversations

## 🔐 Privacy

- All processing happens through the configured AI provider
- Conversations stored locally in browser (localStorage)
- Shareable links use compressed data in URL (no server storage)
- No analytics or tracking

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details

## 🤝 Contributing

[Add contributing guidelines if you want contributions]

## 🙏 Acknowledgments

Built with:

- [Fresh](https://fresh.deno.dev/) - The next-gen web framework
- [Google Gemini](https://ai.google.dev/) - Multimodal AI API
- [OpenRouter](https://openrouter.ai/) - Optional OpenAI-compatible AI gateway
- [D3.js](https://d3js.org/) - Data visualization

---

**Made with ☕ and lots of conversations**
