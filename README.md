# ❄️ Eve 1.0 — Autonomous AI Research Assistant

> A premium, voice-first AI chat application powered by **Groq (Llama 3.1 + Whisper)** and **ElevenLabs**, built with **Next.js 16**.  
> Eve is a fully hands-free research agent — she listens for your wake word, searches the web, reads webpages, and speaks her answers back to you.

---

## ✨ Feature Overview

### 🧠 AI & Research
- **Llama 3.1 8B Instant via Groq** — Ultra-fast LPU-powered AI inference for near-instant responses
- **Autonomous Agent Loop** — Eve autonomously chains `search_web` and `read_webpage` tool calls to research answers before responding (up to 4 iterations)
- **DuckDuckGo Web Search** — Real-time, privacy-respecting search scraping via Cheerio HTML parsing
- **Jina Reader Webpage Scraping** — Deep-reads the full text of any URL for richer context
- **Source Citations** — AI responses include source URLs from pages read during research

### 🎙️ Voice Pipeline (Fully Hands-Free)
- **Always-On Wake Word Detection** — Continuous audio monitoring with wake words: `"Eve"`, `"Hey Eve"`, `"Hi Eve"`, `"Okay Eve"`
- **Voice Activity Detection (VAD)** — Web Audio API + RMS analysis to detect real speech onset and silence (2s silence timeout, 15s force cutoff)
- **Groq Whisper Large v3 Turbo** — Cloud speech-to-text transcription for highly accurate voice input
- **ElevenLabs TTS** — Premium neural text-to-speech using the `eleven_turbo_v2_5` model and the Rachel voice
- **Browser TTS Fallback** — Automatically falls back to `SpeechSynthesisUtterance` if ElevenLabs is unavailable
- **Anti-Feedback Loop** — Mic is automatically muted while Eve is speaking to prevent her from hearing herself
- **Session Mode** — After the first exchange, Eve stays awake and listens continuously without needing the wake word again
- **Stop Commands** — Say `"Stop listening"` or `"Eve stop"` to deactivate the mic

### 🗄️ Chat History (Dual-Layer Persistence)
- **localStorage Cache** — All sessions are instantly saved and read locally for zero-latency offline access
- **Supabase Cloud Sync** — Sessions are asynchronously synced to a Supabase PostgreSQL database; data persists across devices
- **Graceful Degradation** — If Supabase is unavailable, falls back transparently to localStorage
- **Auto-Sync on Load** — On startup, sessions are pulled from Supabase and merged into the local cache
- **Auto-Title Derivation** — Conversation titles are auto-generated from the first user message
- **History Sidebar** — Slide-in panel showing all past sessions with timestamps and message counts; supports session switching and deletion

### 🎨 UI & Design
- **Full Glassmorphism** — Premium frosted-glass panels throughout using `backdrop-blur` and `bg-white/5`
- **3D Vortex Canvas Background** — High-performance animated particle system using `simplex-noise`
- **Framer Motion Animations** — Smooth enter/exit animations on messages and UI states
- **SpotlightCard** — ReactBits cursor-tracking glow on interactive elements
- **Sticky Fixed Header** — Hamburger menu and Eve branding remain fixed regardless of scroll position
- **Monochrome Aesthetic** — Strict black, white, zinc, and gray palette — no color noise
- **Scrollbar-hidden Chat Area** — Clean, borderless scrollable message history
- **Responsive Layout** — Fluid design working correctly on desktop, tablet, and mobile (`h-[100dvh]`)

### 🔒 Architecture & Security
- **All API keys server-side only** — Groq, ElevenLabs, and Supabase anon key never exposed to the browser
- **Next.js App Router API Routes** — Secure server-side proxy for all external service calls
- **No vendor lock-in** — Works offline (with browser TTS fallback + localStorage) without Supabase or ElevenLabs keys

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/custom-ai-chatbot.git
cd custom-ai-chatbot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root:

```env
# Required — AI inference
GROQ_API_KEY="your_groq_api_key"

# Optional — Premium voice output (falls back to browser TTS if not set)
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
ELEVENLABS_VOICE_ID="21m00Tcm4TlvDq8ikWAM"   # Default: Rachel

# Optional — Cloud chat history sync (falls back to localStorage if not set)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

> 💡 **Only `GROQ_API_KEY` is required.** All other services are optional and have built-in fallbacks.

### 4. (Optional) Set up Supabase

If you want persistent cross-device history, create a `chat_sessions` table in your Supabase project:

```sql
create table chat_sessions (
  id          text primary key,
  title       text,
  messages    jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts         # Groq Llama 3.1 agent loop with tool calling
│   │   ├── transcribe/route.ts   # Groq Whisper Large v3 Turbo speech-to-text
│   │   └── tts/route.ts          # ElevenLabs text-to-speech with audio streaming
│   ├── page.tsx                  # Root layout with background and chat container
│   ├── layout.tsx                # Next.js root layout & metadata
│   └── globals.css               # Design tokens & glassmorphism utilities
├── components/
│   ├── AnimatedBackground.tsx    # 3D Vortex simplex-noise canvas animation
│   ├── chat/
│   │   ├── ChatContainer.tsx     # Core state: messages, sessions, voice, TTS
│   │   ├── ChatInput.tsx         # Text input bar with SpotlightCard
│   │   ├── ChatMessage.tsx       # Message bubbles with markdown + source citations
│   │   └── HistorySidebar.tsx    # Slide-in session history panel
│   └── reactbits/
│       └── SpotlightCard.tsx     # Cursor-tracking glow effect component
├── hooks/
│   ├── useVoice.ts               # VAD + wake word detection + Whisper transcription
│   ├── useSpeech.ts              # ElevenLabs TTS with browser fallback
│   └── useMouse.ts               # Mouse position tracking for SpotlightCard
├── lib/
│   ├── ai_model.ts               # Groq Llama 3.1 + agentic tool loop
│   ├── search.ts                 # DuckDuckGo scraper via Cheerio
│   ├── readWebpage.ts            # Jina Reader URL content extractor
│   ├── chatStorage.ts            # localStorage + Supabase dual-layer storage
│   └── supabase.ts               # Supabase client singleton
└── types/
    └── chat.ts                   # TypeScript interfaces (Message, Attachment, Source)
```

---

## 📦 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Framework & secure API routing |
| **Tailwind CSS v4** | Utility-first styling |
| **`groq-sdk`** | Llama 3.1 inference + Whisper transcription |
| **ElevenLabs REST API** | Neural text-to-speech |
| **`@supabase/supabase-js`** | Cloud database for chat history |
| **`framer-motion`** | UI enter/exit animations |
| **`simplex-noise`** | Vortex background math |
| **`cheerio`** | DuckDuckGo HTML search result parsing |
| **`lucide-react`** | Icon library |
| **`react-markdown`** | Renders Eve's markdown responses |

---

## 🤖 Agentic Research Loop

When Eve receives a question requiring facts, the `/api/chat` route runs an autonomous loop:

```
User Question
      │
      ▼
  Llama 3.1  ──── decides to ──▶  search_web(query)
      │                                   │
      │◀────── search results ────────────┘
      │
      ├──── decides to ──▶  read_webpage(url)
      │                            │
      │◀──── full page text ───────┘
      │
      ▼
 Final Answer + Sources  ──▶  User
```

- Up to **4 tool-call iterations** per response
- Each `read_webpage` result is saved as a source citation shown in the UI
- If the loop exceeds the limit or encounters an error, a clean fallback response is generated

---

## 🎙️ Voice Architecture

```
Microphone
    │
    ▼
Web Audio API (VAD — 50ms polling, RMS threshold 1.5)
    │
    ├── No speech → keep listening for wake word
    │
    └── Speech detected → start MediaRecorder
            │
            ▼
        Audio Blob (webm/opus)
            │
            ▼
    POST /api/transcribe  ──▶  Groq Whisper Large v3 Turbo
            │
            ▼
        Transcript text
            │
            ├── Wake word not heard → discard
            │
            └── Wake word / session mode → send to chat
                        │
                        ▼
                  AI Response text
                        │
                        ▼
              POST /api/tts  ──▶  ElevenLabs (or browser fallback)
                        │
                        ▼
                   Audio playback
                   (mic muted during playback)
```

---

## 🚢 Deployment (Vercel Free Tier)

This project is **optimized for Vercel's Hobby (free) plan** out of the box. The following limits have been pre-configured:

| Setting | Value | Reason |
|---|---|---|
| `maxDuration` (all API routes) | `9s` | Vercel Hobby hard-kills at 10s |
| `maxIterations` (agent loop) | `2` | Keeps research chains within the time budget |
| `max_tokens` (LLM responses) | `768` | Faster inference = more headroom |

> 💡 If you upgrade to **Vercel Pro** ($20/mo), you can safely raise `maxDuration` to `60`, `maxIterations` to `4`, and `max_tokens` to `1024` for deeper research responses.

### Step-by-step deploy

**1. Push to GitHub**

```bash
git add .
git commit -m "feat: production-ready Eve 1.0"
git push
```

**2. Import on Vercel**

- Go to [vercel.com/new](https://vercel.com/new)
- Click **"Import Git Repository"** and select your repo
- Framework will be auto-detected as **Next.js**

**3. Add Environment Variables**

Under **Settings → Environment Variables**, add:

| Variable | Required |
|---|---|
| `GROQ_API_KEY` | ✅ Yes |
| `ELEVENLABS_API_KEY` | ⚡ Optional |
| `ELEVENLABS_VOICE_ID` | ⚡ Optional |
| `NEXT_PUBLIC_SUPABASE_URL` | ⚡ Optional |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚡ Optional |

**4. Deploy**

Click **Deploy** — Eve will be live at your `.vercel.app` URL within ~2 minutes.

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Groq developer API key for Llama 3.1 + Whisper |
| `ELEVENLABS_API_KEY` | ⚡ Optional | ElevenLabs API key for premium voice output |
| `ELEVENLABS_VOICE_ID` | ⚡ Optional | Specific ElevenLabs voice ID (default: Rachel) |
| `NEXT_PUBLIC_SUPABASE_URL` | ⚡ Optional | Supabase project URL for cloud history sync |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚡ Optional | Supabase anon key for cloud history sync |

> ⚠️ Only `GROQ_API_KEY` is required. Without ElevenLabs, Eve falls back to browser TTS. Without Supabase, chat history is stored locally in the browser.

---

## 📄 License

MIT — free to use and modify.
