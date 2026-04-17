# Aura — AI Companion

A premium emotional AI companion. Detects mood from text, responds with adaptive tone, suggests contextual actions, and syncs across web and mobile via Firebase.

---

## Architecture

```
aura/
├── apps/
│   ├── web/                    # Next.js 14 — main web interface
│   └── mobile/                 # Expo / React Native — iOS & Android
├── packages/
│   ├── emotion-engine/         # Shared mood detection + suggestion engine
│   └── shared-types/           # Shared TypeScript interfaces
├── firebase/                   # Firestore rules, indexes, storage rules
├── turbo.json                  # Monorepo pipeline
└── package.json
```

---

## Prerequisites

- Node.js >= 20
- pnpm >= 8 (`npm i -g pnpm`)
- Firebase CLI (`npm i -g firebase-tools`)
- Expo CLI (`npm i -g expo-cli`) — for mobile
- An [Anthropic API key](https://console.anthropic.com/)
- A [Firebase project](https://console.firebase.google.com/)

---

## 1. Clone & Install

```bash
git clone <your-repo>
cd aura
pnpm install
```

---

## 2. Environment Setup

```bash
cp .env.example apps/web/.env.local
```

Fill in all values in `apps/web/.env.local`:
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com/)
- Firebase values — from Firebase Console → Project Settings → Your Apps

For mobile, also fill `apps/mobile/.env`:
```bash
cp .env.example apps/mobile/.env
```

---

## 3. Firebase Setup

```bash
firebase login
firebase use --add   # select your project

# Deploy Firestore rules + indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy storage rules
firebase deploy --only storage
```

Enable **Firebase Authentication** in the console (Anonymous auth at minimum).

---

## 4. Run Locally

**Web:**
```bash
pnpm dev
# Opens at http://localhost:3000
```

**Mobile:**
```bash
cd apps/mobile
pnpm start
# Scan QR with Expo Go app
```

---

## 5. Deploy Web to Vercel

```bash
pnpm build

# Or deploy via Vercel CLI
npx vercel --prod

# Set environment variables in Vercel Dashboard:
# Settings → Environment Variables
# Add: ANTHROPIC_API_KEY, NEXT_PUBLIC_FIREBASE_*
```

---

## 6. Build Mobile (Production)

```bash
cd apps/mobile

# iOS
npx eas build --platform ios

# Android
npx eas build --platform android

# Both
npx eas build --platform all
```

Set `EXPO_PUBLIC_API_URL` to your deployed Vercel URL before building.

---

## System Overview

### Emotion Engine (`packages/emotion-engine`)
- **`detector.ts`** — Pattern-based mood scoring with linguistic signals (capitalization, punctuation, sentence length, ellipsis, exclamation count). Outputs `Mood`, `confidence`, and `signals`. Also exports `detectMoodTrend()` for multi-message patterns.
- **`suggestions.ts`** — Context-aware suggestions keyed by mood + time of day + trend + day of week. Returns typed `Suggestion` objects with icon, type, urgency.

### Real-Time Sync (`lib/syncManager.ts`)
- `saveMessage()` — Writes to Firestore, queues offline if network unavailable
- `listenMessages()` — `onSnapshot` listener: pushes updates to Zustand in real time
- `listenMoodHistory()` — Real-time mood history sync across devices
- `listenConversations()` — Real-time conversation list
- `flushOfflineQueue()` — Batch-commits queued messages when connectivity restores

### Chat API (`/api/chat`)
1. Detects mood from latest user message
2. Builds mood-adaptive system prompt (6 tone variants)
3. Calls `claude-sonnet-4-20250514` with injected context
4. Extracts follow-up prompts from response JSON
5. Returns: `reply`, `mood`, `moodConfidence`, `suggestion`, `followUpPrompts`

### Orb
- Breathing animation at rest (4s cycle)
- Thinking animation when AI is generating (fast pulse)
- Listening animation during voice input
- Color and glow transition on mood change (1.2s ease)

---

## Mood Reference

| Mood     | Trigger signals                         | Orb color  |
|----------|-----------------------------------------|------------|
| `sad`    | sadness words, ellipsis, isolation lang | #7b9fd4    |
| `low`    | lowercase start, hedged lang, short msg | #8b8fc4    |
| `neutral`| no strong signals                       | #7ab8c4    |
| `calm`   | calm/peace/relax words                  | #5ecfa8    |
| `happy`  | positive words, gratitude               | #8fc47a    |
| `excited`| caps, multiple exclamations, wow words  | #c47a8f    |

---

## Firestore Data Model

```
users/{userId}/
  conversations/{convId}/
    messages/{msgId}
      role: 'user' | 'assistant'
      text: string
      mood: Mood
      clientTimestamp: number
      timestamp: Timestamp (server)
      synced: boolean
  moodHistory/{YYYY-MM-DD}
    mood: Mood
    conversationId: string
    timestamp: Timestamp
```