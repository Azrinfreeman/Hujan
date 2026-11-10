# Hujan

> *Hujan* is Malay for "rain."

A self-hosted Discord companion for Windows. One bot gives your server an AI assistant with a personality you choose, rain and sleep ambience for voice channels, and consent-gated voice summaries transcribed on your own machine.

## What it does

- **AI assistant** with five built-in personalities (casual Malay by default, friendly, professional, playful, Sabah roast) or your own text. Ask questions, explain a message, send a screenshot, or rename a member by mentioning the bot. It runs on a ChatGPT subscription or your own OpenAI API key.
- **Sleep ambience.** `/sleep join mode:rain|sunny|silent` streams rain, sunny birdsong and distant thunder into a voice channel from local audio files.
- **Local voice summaries.** After everyone consents, Hujan keeps a rolling five-minute window, transcribes it offline with Whisper `large-v3-q5_0` (Vulkan or CPU), and posts a summary. There is no per-minute transcription fee. Marked experimental.
- **Windows desktop app.** Electron app with a tray icon, Start/Stop, protected settings and a bundled Node runtime.
- **Local dashboard.** Owner-only web UI at `127.0.0.1` for settings, ambience, commands and health.

## Requirements

- Windows (credentials are protected with DPAPI; Linux and Docker are not supported)
- Node.js `>=24.19.0 <25` (not needed for the desktop installer)
- A Discord application and bot token you control
- An OpenAI API key, or an existing ChatGPT connection

## Quick start

```powershell
git clone https://github.com/Azrinfreeman/Hujan.git
cd Hujan
npm install
npm run dashboard
```

1. Open <http://127.0.0.1:3210> and enter the one-time access code printed in the terminal.
2. Go to **Settings** and add your Discord token, application ID, server ID and owner ID. **Help me set up** walks through creating the bot.
3. Choose **OpenAI API key** and enter a key and model, or keep **Existing ChatGPT connection** and run `npm run auth -- login` with the bot stopped.
4. Register the slash commands once: `npm run register`
5. Click **Start bot**, or run `npm start`.

Prefer an app? Build the installer with `npm run desktop:make`. See [WINDOWS_APP.md](WINDOWS_APP.md). The current installer is unsigned.

## Commands

| Command | What it does |
| --- | --- |
| `/ask prompt:… [private] [image]` | Ask Hujan; mentioning the bot works too |
| `/reset` | Clear your AI context in this channel |
| `/nickname member:@Ali name:…` | Change a member's server nickname |
| `/status` | Check the AI connection |
| `/sleep join\|leave\|status` | Join, leave or inspect voice ambience |
| `/sleep rain\|sunny on\|off` | Switch ambience; `off` stays in voice quietly |
| `/voice-summary start\|consent\|summarize\|withdraw` | Consent-gated voice summaries |

The full list, permissions and nickname rules are in [docs/DISCORD_USAGE.md](docs/DISCORD_USAGE.md).

## Personalities

Pick one under **Settings → Personality**. Changes apply on the next reply, with no restart. The text lives in `PERSONALITY.md`, so you can edit it by hand. Templates are in [`assets/personalities/`](assets/personalities).

## Design notes

- **Process isolation.** AI inference, image conversion and DPAPI work run in a supervised child process that never sees Discord credentials or API keys. This is not an OS sandbox: both processes run as the same Windows user.
- **Credentials.** Encrypted with Windows DPAPI and stored as versioned revisions with atomic replacement and rollback.
- **Tool safety.** Each request gets one exact function capability, and the result is validated before any Discord change.
- **No replayed actions.** SQLite event claims and mention nonces prevent repeats after a restart.
- **Privacy.** Voice audio stays in memory, and logs never contain audio or transcripts. Summaries do send the transcript text to your chosen AI provider.

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Start/stop, dashboard, self-hosting, settings recovery, storage, maintenance, rollback |
| [docs/DISCORD_USAGE.md](docs/DISCORD_USAGE.md) | Commands, nicknames, access rules, personality, context |
| [docs/VOICE_SUMMARIES.md](docs/VOICE_SUMMARIES.md) | Consent flow, local Whisper setup, limits, Malay WER/CER evaluation |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Components, worker IPC, failure behavior |
| [WINDOWS_APP.md](WINDOWS_APP.md) | Installer, import, build and recovery |
| [PROJECT_STATE.md](PROJECT_STATE.md) | Deployment snapshot, caveats, pilot checklist |
| [DESIGN.md](DESIGN.md) | Dashboard design notes |

## Development

```powershell
npm run check   # TypeScript
npm test        # automated tests
```

Never commit `.env`, `data/` or any credentials. Asset attribution is in [assets/SOURCE.md](assets/SOURCE.md).
