# 🚀 pRash Hub — Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- GitHub account with this repo pushed
- Vercel account (free tier works)
- API keys for at least one provider (Gemini recommended as minimum)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "🚀 Initial commit - pRash Hub"
git remote add origin https://github.com/kprsnt2/pRash_AGY_Opus.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo: `kprsnt2/pRash_AGY_Opus`
3. Framework: **Next.js** (auto-detected)
4. Root Directory: `.` (leave default)
5. Click **Deploy**

### Step 3: Add Environment Variables
Go to **Project Settings → Environment Variables** and add:

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_PASSWORD` | ✅ Yes | Login password for the app |
| `OPENAI_API_KEY` | ⚡ Primary | OpenAI API key ([platform.openai.com](https://platform.openai.com)) |
| `OPENAI_MODEL` | Optional | Default: `gpt-4o-mini` |
| `GOOGLE_API_KEY` | ✅ Yes | Google AI key ([aistudio.google.com](https://aistudio.google.com)) — also used for Privacy Mode |
| `GOOGLE_MODEL` | Optional | Default: `gemini-2.0-flash` |
| `GROQ_API_KEY` | Optional | Groq key ([console.groq.com](https://console.groq.com)) |
| `GROQ_MODEL` | Optional | Default: `llama-3.3-70b-versatile` |
| `NVIDIA_API_KEY` | Optional | NVIDIA NIM key ([build.nvidia.com](https://build.nvidia.com)) |
| `NVIDIA_MODEL` | Optional | Default: `meta/llama-3.1-70b-instruct` |

> **Tip:** You only need `APP_PASSWORD` + `GOOGLE_API_KEY` to get started. Add others for fallback.

### Step 4: Redeploy
After adding env vars, go to **Deployments** → click **⋮** on latest → **Redeploy**.

---

## Alternative: Deploy to Cloudflare Pages

### Option A: Direct Deploy
```bash
npm run build
npx wrangler pages deploy .next
```

### Option B: Git Integration
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Pages**
2. Connect GitHub repo
3. Build command: `npm run build`
4. Output directory: `.next`
5. Add environment variables
6. Deploy

> **Note:** Cloudflare Pages has some limitations with Next.js edge functions. Vercel is recommended for full compatibility.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env file and add your keys
cp .env.example .env.local

# Run dev server
npm run dev

# Open http://localhost:3000
```

---

## Model Fallback Chain

```
┌─────────────┐    fail    ┌─────────────┐    fail    ┌─────────┐    fail    ┌─────────┐
│   OpenAI    │ ─────────► │   Gemini    │ ─────────► │  Groq   │ ─────────► │ NVIDIA  │
│ gpt-4o-mini │            │ 2.0-flash   │            │ llama   │            │  llama  │
└─────────────┘            └─────────────┘            └─────────┘            └─────────┘

🔒 Privacy Mode ON → Gemini ONLY (no data shared with OpenAI)
```

---

## Updating Models
When new models drop (GPT-5, etc.), just update the env vars:
```
OPENAI_MODEL=gpt-5-mini
GOOGLE_MODEL=gemini-3.0-flash
```
No code changes needed! Redeploy after updating.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank screen | Check browser console for errors. Ensure env vars are set. |
| "All models failed" | At least one API key must be valid. Check keys in Vercel dashboard. |
| Streaming not working | Ensure you're not behind a proxy that buffers responses. |
| File upload fails | Max file size is ~10MB per file (base64 encoding). |
| Login not working | Check `APP_PASSWORD` env var is set correctly. |

---

## Architecture

```
pRash Hub
├── Next.js 14 (App Router)
├── Tailwind CSS (Dark/Light mode)
├── Vercel AI SDK (Multi-provider streaming)
├── LocalStorage (Chat history, no database needed)
└── Password Auth (Simple, personal use)
```

---

## 🤖 Agents (22 Total)

### Personal
- 🤖 **Jarvis** — General all-purpose AI assistant
- 🌙 **DreamWeaver** — Bedtime stories for kids
- 🙏 **SoulSage** — Spiritual & life guidance
- 🔥 **FlavorForge** — Recipes & cooking
- 🗣️ **LinguaFlip** — Multi-language translator
- 👶 **ParentPal** — Parenting advice

### Education
- ⚡ **BrainSpark** — Study helper & explainer
- 🧙 **PrintWiz** — Worksheet generator
- 🎯 **NumberNinja** — Math tutor
- 🎭 **DebateChamp** — Critical thinking & debates

### Health
- 💊 **MediScan** — Prescription & report analyzer
- 🦋 **MindMender** — Psychological wellness
- 🏋️ **IronPulse** — Fitness & nutrition

### Professional
- 🐉 **DataDragon** — Data analysis & BI tools
- 🥷 **CodeNinja** — Programming assistant
- 💸 **MoneyMonk** — Personal finance
- ✍️ **InkMaster** — Email & content writer
- 🚀 **ResumeRocket** — Resume & career help
- ⚖️ **LegalEagle** — Basic legal understanding

### Daily Life
- ✈️ **TripCraft** — Travel planning
- 🔧 **HomeFixHero** — DIY & home repairs
- 🛒 **ShopSavvy** — Product comparisons & deals
