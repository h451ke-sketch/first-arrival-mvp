# Setup Guide — First Arrival

Step-by-step guide to get the project running from scratch.

---

## Step 1: Install Node.js

Download and install the LTS version from https://nodejs.org/

Verify:
```bash
node --version   # v18 or higher
npm --version
```

---

## Step 2: Install Dependencies

Navigate to the project folder and run:

```bash
cd first-arrival-mvp
npm install
```

This takes a few minutes the first time.

---

## Step 3: API Keys

The project uses two external APIs:

### Deepgram (Speech Recognition + NPC Voice)
- Sign up at https://console.deepgram.com/
- New accounts receive $200 free credit
- Go to **API Keys** → create a new key
- Key format: `decc6b...` (40-char hex string)

### DeepSeek (AI Dialogue)
- Sign up at https://platform.deepseek.com/
- Go to **API Keys** → create a new key
- Key format: `sk-xxxxxxxxxxxxxxxx`

### Configure Keys in app.json

Open `app.json` and update the `extra` section:

```json
"extra": {
  "deepgramApiKey": "YOUR_DEEPGRAM_KEY_HERE",
  "deepseekApiKey": "YOUR_DEEPSEEK_KEY_HERE"
}
```

Save the file.

> ⚠️ These keys are bundled into the app binary. Do not commit `app.json` with real keys to a public repository.

---

## Step 4: Assets Checklist

All required assets should already be in the project. Verify the following files exist:

**NPC images** (`assets/npcs/`):
- `jack.jpg`, `mia.jpg`, `ethan.jpg`, `mark.jpg`
- `lily.jpg`, `mindy.jpg`, `michael.jpg`, `cecilia.jpg`
- `jack.mp4` (looping video for Jack — used instead of static image)

**Location thumbnails** (`assets/locations/`):
- `cafe.png`, `classroom.png`, `student-center.png`, `counseling.png`
- `medical.png`, `main_school.png`, `main_bank.png`
- `main_supermarket.png`, `main_apartment.png`

**Maps & audio**:
- `assets/MAP.png`
- `assets/CollegeMAP.png`
- `assets/audio/BGM.mp3`

If any file is missing, the bundler will error on startup with a clear message about which file is not found.

---

## Step 5: Run the App

```bash
npx expo start
```

Choose how to run it:

| Option | Command / Action |
|---|---|
| **Expo Go on phone** | Scan QR code with Expo Go app |
| **Android emulator** | Press `a` in terminal |
| **iOS simulator** (Mac only) | Press `i` in terminal |

First load takes longer as the JS bundle compiles.

---

## Step 6: Test the App

1. **Map screen loads** — you should see Campus Cafe as the only unlocked location
2. **Tap Campus Cafe** — Jack's dialogue screen opens with a video of Jack
3. **Allow microphone permission** when prompted
4. **Hold the mic button** — say something like *"Hi, can I get a coffee please?"*
5. **Release** — speech is transcribed → DeepSeek generates Jack's response → Deepgram speaks it
6. **Tap End** — summary screen shows language tips and cultural feedback
7. **Complete the task** (order a coffee) → all other locations unlock

---

## Troubleshooting

### Module not found / build error
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### Microphone permission denied
- **iOS**: Settings → Privacy & Security → Microphone → enable Expo Go
- **Android**: Settings → Apps → Expo Go → Permissions → Microphone

### Network timeout / API errors
1. Check internet connection
2. Confirm API keys are correct in `app.json`
3. Check service status:
   - Deepgram: https://status.deepgram.com/
   - DeepSeek: https://status.deepseek.com/

### DeepSeek API errors
- Key should start with `sk-`
- Check remaining balance at https://platform.deepseek.com/usage

### Deepgram API errors
- Check credit balance at https://console.deepgram.com/
- Verify the key is active

### Metro bundler won't connect
- Ensure phone and computer are on the same WiFi
- Try: `npx expo start --tunnel` (slower but works across networks)

### Audio not working on iOS
- The app uses `expo-av` for audio. Make sure you haven't denied audio permissions.
- Try shaking the device to reload.

---

## In-App Settings

Users can configure the following in the Settings screen (⚙️ icon on the map):

- **BGM volume** — background music level
- **Voice volume** — NPC speech volume
- **DeepSeek API Key** — add your own key to remove the 20-session limit
- **Reset All Progress** — clears tasks, affinity, and conversation history

---

## Development Tips

**Clear cache if things seem stale:**
```bash
npx expo start --clear
```

**View logs:**
Logs print to the terminal running `expo start`. Shake device → open developer menu for additional options.

**Hot reload:**
Any saved file change reloads automatically. If something breaks, shake device → Reload.

---

**Estimated first-time setup:** 20–40 minutes
