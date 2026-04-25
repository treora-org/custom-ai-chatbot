# ❄️ Eve 1.0 — Premium AI Research Assistant

> A premium, minimalist AI chat application powered by **Google Gemini 1.5 Flash** and built with **Next.js 16**.  
> Featuring a stunning animated Vortex canvas background, glassmorphism UI, voice interaction, and multi-modal file analysis.

---

## ✨ Features

- 🧠 **Google Gemini 1.5 Flash** — Ultra-fast, intelligent AI responses via the official Google Generative AI SDK
- 🌀 **Vortex Canvas Background** — High-performance, interactive 3D simplex-noise particle animation
- 🪟 **Full Glassmorphism UI** — Premium frosted glass containers, buttons, and chat bubbles
- 💡 **Spotlight Interactive Elements** — Integrated ReactBits spotlight glow effects tracking your cursor
- 📎 **Multi-Modal File Upload** — Upload images (JPG, PNG, WebP, GIF), PDFs, and text files for Eve to analyze
- 🌐 **Webpage Reading** — Eve can natively scrape and read URLs provided in the chat via Jina AI
- 🎙️ **Voice Interaction** — Web Speech API integration for wake-word detection ("Hey Eve") and voice synthesis
- 🗄️ **Persistent Chat History** — Seamless local storage implementation keeping track of your past conversations
- 🎨 **Pure Monochrome Aesthetic** — Strict black, white, and zinc/gray color palette — no color noise
- 📱 **Mobile Optimized** — Responsive fluid layouts and precise `h-[100dvh]` handling for mobile browsers
- 🔒 **Privacy-First Architecture** — All API calls routed through Next.js server-side; API key never exposed to client

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

### 3. Set up your API key

Create a `.env.local` file in the root of the project:

```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
```

> Get your free API key at [Google AI Studio](https://aistudio.google.com/app/apikey). The Gemini 1.5 Flash model has a generous free tier.

### 4. Run the development server

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
│   │   ├── chat/route.ts      # Secure server-side Gemini API proxy
│   │   └── tts/route.ts       # Text-to-speech API handler
│   ├── page.tsx               # Main page with layout and background
│   ├── layout.tsx             # Root layout & metadata
│   └── globals.css            # Design tokens & glassmorphism utilities
├── components/
│   ├── AnimatedBackground.tsx # 3D Vortex canvas particle animation
│   ├── chat/
│   │   ├── ChatContainer.tsx  # Core chat logic & state layout
│   │   ├── ChatInput.tsx      # Input bar with file upload
│   │   ├── ChatMessage.tsx    # Message bubbles with markdown rendering
│   │   └── HistorySidebar.tsx # Sidebar for past sessions management
│   └── reactbits/
│       └── SpotlightCard.tsx  # Mouse-tracking glow components
├── hooks/
│   ├── useVoice.ts            # Web Speech API wake-word detection hook
│   └── useMouse.ts            # Mouse tracking hook for Spotlight
├── lib/
│   ├── gemini.ts              # Google Gemini AI service layer
│   ├── chatStorage.ts         # LocalStorage history database
│   └── readWebpage.ts         # Jina Reader web scraping utility
└── types/
    └── chat.ts                # TypeScript interfaces
```

---

## 📦 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Framework & secure API routing |
| **Tailwind CSS v4** | Utility styling |
| **`@google/generative-ai`** | Gemini 1.5 Flash SDK |
| **`framer-motion`** | UI animations |
| **`simplex-noise`** | Vortex background math |
| **`lucide-react`** | Icons (Snowflake, Menu, etc.) |
| **`react-markdown`** | Renders Eve's markdown responses |

---

## 📁 File Upload Support

Eve can natively **see** and **read** your files using Gemini's multi-modal capabilities:

| File Type | Supported Formats |
|---|---|
| **Images** | JPG, PNG, WebP, GIF (max 20MB each) |
| **Documents** | PDF |
| **Text/Code** | `.txt`, `.md`, `.js`, `.ts`, `.py`, `.json`, `.csv` |

> ⚠️ HEIC (iPhone) photos are **not supported** by the Gemini API. Convert them to JPG before uploading.

---

## 🚢 Deployment (Vercel — Free)

1. Push your repo to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Add your `GEMINI_API_KEY` under **Settings → Environment Variables**.
4. Deploy! Your app will be live 24/7 for free.

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Google AI Studio API key (required) |

---

## 📄 License

MIT — free to use and modify.
