# ❄️ Eve 1.0 — Autonomous AI Research Assistant

> A premium, voice-first AI research application powered by **Groq (Llama 3.1 + Whisper)** and **ElevenLabs**, built with **Next.js 16**.  
> Eve is a fully hands-free research agent — she listens for your wake word, searches the web, reads webpages, and speaks her answers back to you.

---

## ✨ Feature Overview

### 🧠 AI & Research
- **Llama 3.1 8B Instant via Groq** — Ultra-fast LPU-powered AI inference for near-instant responses
- **Autonomous Agent Loop** — Eve autonomously chains `search_web` and `read_webpage` tool calls to research answers before responding (up to 2 iterations on free tier, 4 on Pro)
- **DuckDuckGo Web Search** — Real-time, privacy-respecting search scraping via Cheerio HTML parsing
- **Jina Reader Webpage Scraping** — Deep-reads the full text of any URL for richer context
- **Source Citations** — AI responses include source URLs from pages read during research
- **AI Image Generation (Hugging Face)** — Eve can generate high-fidelity images using FLUX.1-schnell via an internal secure API proxy

### 🎙️ Voice Pipeline (Fully Hands-Free)
- **Always-On Wake Word Detection** — Continuous audio monitoring with wake words: `"Eve"`, `"Hey Eve"`, `"Hi Eve"`, `"Okay Eve"`
- **Voice Activity Detection (VAD)** — Web Audio API + RMS analysis to detect real speech onset and silence (2s silence timeout, 15s force cutoff)
- **Groq Whisper Large v3 Turbo** — Cloud speech-to-text transcription for highly accurate voice input
- **ElevenLabs TTS** — Premium neural text-to-speech using the `eleven_turbo_v2_5` model and the Rachel voice
- **Browser TTS Fallback** — Automatically falls back to `SpeechSynthesisUtterance` if ElevenLabs is unavailable
- **Anti-Feedback Loop** — Mic is automatically muted while Eve is speaking to prevent her from hearing herself
- **Session Mode** — After the first exchange, Eve stays awake and listens continuously without needing the wake word again
- **Stop Commands** — Say `"Stop listening"` or `"Eve stop"` to deactivate the mic

### 🔐 Authentication (Supabase Auth)
- **Email + Password Sign Up / Sign In** — Secure Supabase Auth with user metadata (name, phone)
- **3D Sign In / Sign Up Page** — Premium glassmorphic auth UI with mouse-tracking 3D tilt card and animated background
- **Per-User Chat History** — All conversations are scoped to the authenticated user via `user_id` + Row Level Security
- **Smooth Mode Toggle** — Inline Sign In ↔ Sign Up switching with Framer Motion field animations
- **Persistent Sessions** — Supabase handles secure token storage and refresh automatically
- **Profile Management** — Dedicated `/profile` route for users to update their name, email, phone, and password
- **Sign Out** — Clears both Supabase session and local cache, returns user to the landing page

### 🗄️ Chat History (Dual-Layer Persistence)
- **Per-User localStorage Cache** — Sessions namespaced to each user ID for zero-latency access (`eve_session_{userId}_{id}`)
- **Supabase Cloud Sync** — Sessions upserted to Supabase PostgreSQL with `user_id` scoped queries + RLS
- **Graceful Degradation** — If Supabase is unavailable, falls back transparently to localStorage
- **Auto-Sync on Load** — On login, sessions are pulled from Supabase and merged into the local cache
- **Auto-Title Derivation** — Conversation titles auto-generated from the first user message
- **History Sidebar** — Slide-in panel showing all past sessions with timestamps and message counts; supports session switching and deletion

### 🎨 UI & Design
- **3D Landing Page** — Full-screen hero with particle field animation, 3D tilt feature cards, chat preview mockup, and scroll-reactive navbar
- **Premium Glassmorphism** — Frosted-glass panels throughout using `backdrop-blur` and `bg-white/5`
- **3D Tilt Cards** — Mouse-tracking perspective transforms (`perspective`, `rotateX/Y`) on all feature and auth cards
- **3D Vortex Canvas Background** — High-performance animated particle system using `simplex-noise` in the chat view
- **Framer Motion Animations** — Smooth enter/exit animations on messages, UI states, and auth form fields
- **SpotlightCard** — ReactBits cursor-tracking glow on interactive elements
- **Sticky Fixed Header** — Hamburger menu and user pill remain fixed regardless of scroll
- **User Menu Dropdown** — Shows display name, email, and sign-out button in top-right corner
- **Monochrome Aesthetic** — Strict black, white, zinc, and gray palette — no color noise
- **Responsive Layout** — Works on desktop, tablet, and mobile (`h-[100dvh]`)

### 🔒 Architecture & Security
- **All API keys server-side only** — Groq, ElevenLabs keys never exposed to the browser
- **Row Level Security (RLS)** — Supabase policies ensure users can only access their own data
- **Client-side Auth Guard** — `/chat` route verifies session on every load; unauthenticated users are redirected to `/auth`
- **Next.js App Router API Routes** — Secure server-side proxy for all external service calls
- **No vendor lock-in** — Works offline (browser TTS + localStorage) without ElevenLabs or Supabase keys

---

## 🗺️ Route Structure

| Route | Page | Auth Required |
|---|---|---|
| `/` | 3D Landing page | Public |
| `/auth?mode=signin` | Sign In (pre-selected) | Public |
| `/auth?mode=signup` | Sign Up (pre-selected) | Public |
| `/chat` | Chat UI | ✅ Protected |

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

# Required for auth + cloud history
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Required for AI Image Generation
HUGGINGFACE_API_KEY="your_huggingface_api_key"
```

> 💡 **Only `GROQ_API_KEY` is required.** Auth and Supabase are needed for per-user history. Without ElevenLabs, Eve falls back to browser TTS.

### 4. Set up Supabase

In your Supabase project → **SQL Editor**, run:

```sql
-- Create sessions table
CREATE TABLE chat_sessions (
  id          text PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text,
  messages    jsonb,
  is_deleted  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Per-user policies
CREATE POLICY "Users can view own sessions"
  ON chat_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON chat_sessions FOR DELETE USING (auth.uid() = user_id);
```

Then in **Authentication → Providers**, ensure the **Email** provider is enabled.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the 3D landing page.

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts         # Groq Llama 3.1 agent loop with tool calling
│   │   ├── transcribe/route.ts   # Groq Whisper Large v3 Turbo speech-to-text
│   │   ├── tts/route.ts          # ElevenLabs text-to-speech with audio streaming
│   │   └── image/route.ts        # Hugging Face FLUX image generation proxy
│   ├── auth/page.tsx             # 3D Sign In / Sign Up page (Supabase Auth)
│   ├── profile/page.tsx          # User settings and profile management
│   ├── chat/page.tsx             # Protected chat UI (requires auth)
│   ├── page.tsx                  # 3D Landing page (public)
│   ├── layout.tsx                # Next.js root layout & metadata
│   └── globals.css               # Design tokens & glassmorphism utilities
├── components/
│   ├── AnimatedBackground.tsx    # 3D Vortex simplex-noise canvas animation
│   ├── chat/
│   │   ├── ChatContainer.tsx     # Core state: messages, sessions, voice, TTS, auth
│   │   ├── ChatInput.tsx         # Text input bar with SpotlightCard
│   │   ├── ChatMessage.tsx       # Message bubbles with markdown + source citations
│   │   └── HistorySidebar.tsx    # Slide-in session history panel
│   └── reactbits/
│       ├── SpotlightCard.tsx     # Cursor-tracking glow effect component
│       ├── BlurText.tsx          # Animated text blur-in component
│       └── AuroraBackground.tsx  # Animated aurora gradient background
├── hooks/
│   ├── useAuth.ts                # Supabase auth state + signOut
│   ├── useVoice.ts               # VAD + wake word detection + Whisper transcription
│   ├── useSpeech.ts              # ElevenLabs TTS with browser fallback
│   └── useMouse.ts               # Mouse position tracking for SpotlightCard
├── lib/
│   ├── ai_model.ts               # Groq Llama 3.1 + agentic tool loop
│   ├── search.ts                 # DuckDuckGo scraper via Cheerio
│   ├── readWebpage.ts            # Jina Reader URL content extractor
│   ├── chatStorage.ts            # Per-user localStorage + Supabase dual-layer storage
│   └── supabase.ts               # Supabase client singleton
├── middleware.ts                 # Route middleware (auth guard)
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
| **`@supabase/supabase-js`** | Auth + cloud database for per-user chat history |
| **`@huggingface/inference`** | FLUX.1-schnell image generation |
| **`framer-motion`** | UI animations & 3D auth form transitions |
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

- Up to **2 iterations** on Vercel free tier (optimized for 9s timeout)
- Each `read_webpage` result is saved as a source citation shown in the UI
- If the loop exceeds the limit or encounters an error, a clean fallback response is generated

---

## 🔐 Authentication Flow

```
Landing Page (/)
      │
      ├── "Sign In"    ──▶  /auth?mode=signin
      └── "Get Started" ──▶  /auth?mode=signup
                                    │
                          Supabase Auth (email + password)
                                    │
                          ┌─────────┴──────────┐
                          │                    │
                     Success               Email confirm required
                          │                    │
                   /chat (full UI)       Show success message
                                              │
                                        Sign in → /chat
```

- On sign-out: Supabase session cleared + localStorage wiped → redirect to `/`
- Visiting `/chat` without a session → client-side redirect to `/auth`

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

This project is **optimized for Vercel's Hobby (free) plan** out of the box:

| Setting | Value | Reason |
|---|---|---|
| `maxDuration` (all API routes) | `9s` | Vercel Hobby hard-kills at 10s |
| `maxIterations` (agent loop) | `2` | Keeps research chains within time budget |
| `max_tokens` (LLM responses) | `768` | Faster inference = more headroom |

> 💡 On **Vercel Pro** ($20/mo), raise `maxDuration` → `60`, `maxIterations` → `4`, `max_tokens` → `1024`.

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
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes (for auth) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes (for auth) |
| `ELEVENLABS_API_KEY` | ⚡ Optional |
| `ELEVENLABS_VOICE_ID` | ⚡ Optional |

**4. Deploy**

Click **Deploy** — Eve will be live at your `.vercel.app` URL within ~2 minutes.

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Groq developer API key for Llama 3.1 + Whisper |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL for auth + cloud history |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon key for auth + cloud history |
| `ELEVENLABS_API_KEY` | ⚡ Optional | ElevenLabs API key for premium voice output |
| `ELEVENLABS_VOICE_ID` | ⚡ Optional | ElevenLabs voice ID (default: Rachel) |

> ⚠️ Supabase is now needed for auth. Without it, sign-up/sign-in won't work. Without ElevenLabs, Eve falls back to browser TTS.

---

## 📄 License

MIT — free to use and modify.
