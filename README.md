# 🧠 Conversation Mapper

> Turn messy meeting recordings into organized topic maps, action items, and summaries - automatically.

**Conversation Mapper** uses AI to transform unstructured conversations (audio or text) into structured knowledge: transcripts with speaker detection, auto-generated action items, topic relationship graphs, and customizable exports.

## ✨ Key Features

### 🎤 Audio → Structure
- **Record or upload** audio files
- **Automatic transcription** with speaker diarization
- **AI-powered analysis** extracts topics, action items, summaries
- **Real-time visualizer** during recording

### 🤖 AI Self-Checkoff (The Magic Feature)
User says: *"I finished writing that report"*
→ AI automatically marks "Write report" action item as ✓ Complete

The AI compares new audio/text against existing action items and updates their status with reasoning.

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
- **Deno** (v1.40+): [Install Deno](https://deno.land/manual/getting_started/installation)
- **Google Gemini API Key**: [Get API key](https://aistudio.google.com/app/apikey)

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

   Edit `.env` and add your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the development server**
   ```bash
   deno task start
   ```

   The app will be available at `http://localhost:8003`

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

- **[WHAT_IS_THIS.md](./WHAT_IS_THIS.md)** - Detailed feature overview
- **[core/README.md](./core/README.md)** - Framework-agnostic AI logic documentation
- **[FEATURE_PARITY.md](./FEATURE_PARITY.md)** - Comparison with Svelte version
- **[AUDIO_RECORDING.md](./AUDIO_RECORDING.md)** - Audio recording implementation
- **[SPEAKER_DIARIZATION.md](./SPEAKER_DIARIZATION.md)** - Speaker detection details
- **[GLOSSARY.md](./GLOSSARY.md)** - Terms and concepts

## 🏗️ Architecture

```
/core/                  # Framework-agnostic AI logic
  ├── ai/              # Gemini API wrapper & prompts
  ├── orchestration/   # Parallel processing flows
  ├── types/           # TypeScript type definitions
  ├── storage/         # localStorage & share services
  └── export/          # Format transformers

/islands/              # Interactive Preact components (Fresh)
/components/           # Shared UI components
/routes/               # Fresh routes & API endpoints
/signals/              # Global state (Preact signals)
/utils/                # Utility functions
/theme-system/         # Theme configuration
```

The core AI logic (`/core/`) is extracted into pure TypeScript and can be used in **any framework** (React, Vue, Svelte, etc.). Fresh is just the current UI implementation.

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
- **AI**: [Google Gemini](https://ai.google.dev/) (gemini-2.0-flash-exp)
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

- All processing happens through Google Gemini API
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
- [D3.js](https://d3js.org/) - Data visualization

---

**Made with ☕ and lots of conversations**
