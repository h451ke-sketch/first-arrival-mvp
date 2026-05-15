# First Arrival: Down Under

A language learning simulation game for Chinese international students in Australia. Practice real-life English conversations with AI-powered NPCs across an interactive map of a university town.

## Tech Stack

- **React Native + Expo SDK 54** — cross-platform mobile app (iOS / Android) and **Web** (`expo start --web` / static export to `dist/`)
- **TypeScript + NativeWind** — typed codebase with Tailwind-style styling
- **Zustand** — state management (game progress, conversations, settings)
- **DeepSeek API** — AI-generated NPC dialogue and conversation analysis
- **Deepgram API** — speech-to-text (voice input) and text-to-speech (NPC voices)

## Quick Start

### Prerequisites

- Node.js v18+
- npm
- Expo Go app on your phone (or iOS Simulator / Android Emulator)

### Installation

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

### API Keys

Keys are read from environment variables at build time (`EXPO_PUBLIC_*`). They are **not** committed in `app.json`.

```bash
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_DEEPGRAM_API_KEY and EXPO_PUBLIC_DEEPSEEK_API_KEY
```

`EXPO_PUBLIC_*` values are inlined into the JS bundle (same as any client-side secret). Do not use them for server-only credentials; use a backend proxy if you need true secrecy.

Users can also add their own DeepSeek key in the in-app Settings screen (bypasses the free-session limit when set).

### Deploy Web (static hosting)

Build a production web bundle:

```bash
npm run build:web
```

Output directory: **`dist/`** (contains `index.html`, hashed JS, and assets). Upload this folder or point your host’s “output directory” to `dist`.

#### Tencent EdgeOne Pages

1. Connect this repo or upload the `dist` folder (see [EdgeOne Pages — build guide](https://pages.edgeone.ai/zh/document/build-guide)).
2. **Install command:** `npm ci` (or `npm install`).
3. **Build command:** `npm run build:web`.
4. **Output directory:** `dist`.
5. **Environment variables (build time):** add the same names as in `.env.example` (`EXPO_PUBLIC_DEEPGRAM_API_KEY`, `EXPO_PUBLIC_DEEPSEEK_API_KEY`, optional `EXPO_PUBLIC_GEMINI_API_KEY`). Without them, STT/TTS and default DeepSeek calls will fail in production.

**Note:** Deepgram / DeepSeek are called from the **user’s browser**. EdgeOne only serves static files; it does not proxy those APIs. If some users have poor reachability to overseas APIs, add your own backend or CDN rules as needed.

#### Vercel (optional)

Same idea: build command `npm run build:web`, output directory `dist`, set `EXPO_PUBLIC_*` in Project → Settings → Environment Variables for the Production environment.

## Features

- Interactive dual-map system (main city map + college campus map)
- Voice conversations with 8 NPCs using real-time STT + AI responses
- NPC text-to-speech with distinct voice models per character
- Affinity/relationship system per NPC (starts at 0, max +10 gain per conversation)
- Language feedback and cultural tips after each conversation
- Task/quest system that unlocks new locations
- Conversation history with AI-generated summaries
- 20 free sessions included; users can add their own DeepSeek key for unlimited use
- Video support for NPC avatars (Jack has a looping muted video)

## NPCs

| Name | Role | Location |
|---|---|---|
| Jack | Barista | Campus Cafe (unlocked by default) |
| Mia | Student Center Staff | Student Center |
| Ethan | Tutor | Classroom |
| Mark | Bank Teller | Bank |
| Lily | Doctor | Medical Centre |
| Mindy | Counsellor | Counseling Room |
| Michael | Supermarket Staff | Supermarket |
| Cecilia | Apartment Receptionist | Apartment |

All locations unlock after completing the first task (ordering coffee from Jack).

## Project Structure

```
src/
├── components/
│   ├── VoiceRecorder.tsx     # Hold-to-record mic button
│   └── ChatBubble.tsx        # Message bubble component
├── screens/
│   ├── MapScreen.tsx         # Main city map
│   ├── CollegeMapScreen.tsx  # Campus sub-map
│   ├── DialogueScreen.tsx    # NPC conversation + voice input
│   ├── SummaryScreen.tsx     # Post-conversation feedback
│   ├── SettingsScreen.tsx    # Audio, API key, session counter
│   ├── TasksScreen.tsx       # Active / completed tasks
│   ├── ContactsScreen.tsx    # NPC relationship overview
│   ├── ConversationHistoryScreen.tsx
│   └── HelpScreen.tsx
├── services/
│   ├── deepseek.ts           # NPC response + conversation summary (AI)
│   ├── deepgram.ts           # STT (speech → text) + TTS (NPC voices)
│   └── audioService.ts       # BGM and voice audio management
├── store/
│   ├── gameStore.ts          # Locations, tasks, NPC affinity
│   ├── conversationStore.ts  # Active + historical conversations
│   ├── audioStore.ts         # BGM / voice volume settings
│   └── settingsStore.ts      # User API key + session count
├── data/
│   ├── npcs.ts               # NPC definitions and personalities
│   ├── locations.ts          # Map location data
│   └── tasks.ts              # Task definitions and rewards
├── types/
│   ├── npc.ts
│   ├── conversation.ts
│   ├── game.ts
│   ├── task.ts
│   └── navigation.ts
└── navigation/
    └── AppNavigator.tsx
assets/
├── npcs/                     # NPC avatars (.jpg) + Jack's video (.mp4)
├── locations/                # Location thumbnail images
├── audio/                    # BGM.mp3
├── MAP.png                   # Main city map background
└── CollegeMAP.png            # Campus map background
```

## How to Play

1. Launch the app → main city map appears
2. Tap **Campus Cafe** (the only unlocked location)
3. Jack greets you — hold the mic button and speak in English
4. Release to send — your speech is transcribed, Jack responds with voice
5. Tap **End** to finish — get a summary with language and cultural tips
6. Complete the coffee task → all other locations unlock
7. Visit each location to meet new NPCs and practice different real-life scenarios

## Affinity System

- Every NPC starts at 0 affinity
- Positive responses earn affinity; rude or confusing language loses it
- Maximum +10 affinity gain per conversation session
- Affinity only changes if you actually speak (opening a conversation without speaking has no effect)

## Session Limit

- 20 free voice sessions included (uses developer API keys)
- Add your own DeepSeek API key in Settings → unlimited sessions
- Session count is stored locally on device

## API Costs (Developer Keys)

| Service | Usage | Approx. Cost |
|---|---|---|
| Deepgram STT | Per minute of audio | ~$0.0043/min |
| Deepgram TTS | Per character | ~$0.015/1k chars |
| DeepSeek Chat | Per 1M tokens | ~$0.27 input / $1.10 output |

## Contributors

- **Design & UX**: Qianya Nie
- **Development**: Yuhan Qi

## License

Private project — All rights reserved
