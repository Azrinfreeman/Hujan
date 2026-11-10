# Operations and self-hosting

Back to the [README](../README.md).

## Start and stop

Rain and sunny ambience default to **20%** recording level. `RAIN_VOLUME=0.2` in `.env` controls both modes; restart the bot after changing it. Rain thunder scales with the same setting.

Requires Windows, Node.js `>=24.19.0 <25`, and local configuration through Settings or a private `.env`. Existing ChatGPT authorization and dashboard-saved credentials are protected with Windows CurrentUser DPAPI.

```powershell
cd path\to\Hujan
npm start
```

Keep the terminal open. Press Ctrl+C to stop both processes. If the background deployment is already running, a second start is intentionally rejected by the frontend lock. Use the existing process or stop its **verified** PID first. No automatic Windows startup/service is installed.

Do not start either original bot alongside the combined runtime. The original sleep project has no compatible ownership guard and would share the same Discord token; the original assistant project would consume the same connected AI grant through a different credential copy.

Local operational status is written every 10 seconds to `data/runtime-status.json`: Discord readiness, AI state, active voice/player state, frontend memory, interval CPU and event-loop delay. The file does not contain member messages, tokens or account identities. It is a local snapshot, not a substitute for checking that its PID is still running. Startup output goes to `data/bot.stdout.log` and `data/bot.stderr.log` for the hidden deployment.

## Local web dashboard

Run `npm run dashboard`, then open [Hujan workspace](http://127.0.0.1:3210). Choose **Connect workspace** and enter the single-use local access code printed in the terminal. The code expires after 10 minutes; the browser session lasts 12 hours. Restarting the dashboard issues a new code and does not stop the bot. Keep the dashboard terminal open; Ctrl+C closes the dashboard.

The responsive Material Design-inspired interface includes Overview, Ambience, searchable Commands, System Health, and Settings, with light/dark themes. It refreshes operational status every 10 seconds and marks stale or stopped runtimes offline. No additional dependencies or frontend build are required.

**Start bot** launches this installation once. **Stop bot** requests cooperative shutdown of the verified frontend and its AI worker, preserving saved sleep sessions for the next start. The process state is separate from Discord/AI readiness. Closing the dashboard leaves the bot running; reopening it reconnects to its verified local control channel. Stop disconnects voice and interrupts active AI work. Controls never force-stop processes or silently delete bot/auth locks.

An older instance without the new control channel appears as **Externally managed**. Stop it through its existing terminal or the documented verified operational procedure, then start the updated bot once using `npm start` or the dashboard. Do not launch a second copy or remove a lock just because a snapshot is stale. If startup/shutdown cannot be verified, controls fail closed and show recovery guidance.

If a crash leaves `.lock` files blocking `npm start` or **Start bot**, open the desktop app or connect to the dashboard and click **Clear stale locks** in the status notice. This explicitly removes frontend, AI, and legacy runtime locks only after verifying that their recorded processes have exited. It refuses recovery if a process is running, ownership is invalid, or process inspection fails. Then click **Start bot** or retry `npm start`. Settings and dependency lockfiles are not deleted.

Settings cover Discord identity/token, AI provider/model, access restrictions, controller roles, and shared ambience volume. **Save changes** writes a new local revision and never restarts the bot; running instances show **Restart required** until you explicitly Stop and Start. Existing secrets appear only as Configured, with Replace/Remove actions. Newly entered credentials are cleared after saving or leaving Settings.

New to Discord configuration? Choose **Help me set up** in Settings → Discord for a seven-step illustrated guide: create the application, copy the bot token, enable Message Content Intent, open a generated invite link, turn on Developer Mode, and copy the application, server and owner IDs. The guide only fills in the settings form; saving, DPAPI protection and connection testing still use the normal controls.

Ambience and other Discord actions still copy slash commands; the bot's Discord permissions remain authoritative. **Test saved connection** validates saved configuration without starting the bot or registering commands. In API-key mode it checks authentication/model catalog only, not inference. **Test AI response · may use API credit** is an explicit, bounded request; saving, loading pages, and catalog tests never perform paid inference.

The server binds only to `127.0.0.1`. Administrative routes require the local owner session, same-origin checks, CSRF protection, bounded requests, and rate limits. The read-only operational snapshot remains sanitized; raw credentials, conversation history, and logs are never served. This is a local owner interface, not remote hosting or isolation from other programs running as your Windows user. Set `DASHBOARD_PORT` in your terminal to use another port; it is not loaded from `.env` by the dashboard launcher.

### Self-hosting with your own bot and API key

The supported setup is **Windows, one installation per owner and configured AI server**. Each host supplies their own Discord application/token and AI connection. Individual Discord-member API keys, shared tenant accounts, other AI vendors, Linux, and Docker are not implemented.

1. Use Node.js `>=24.19.0 <25`, install this project's pinned dependencies, and retain its bundled `assets/` files. Copy source and example configuration only; never distribute another owner's `.env`, `data/`, credentials, or conversations.
2. Run `npm run dashboard`, connect the owner browser session, and open Settings. Supply your Discord bot token, matching application ID, server ID, and owner ID. Install that bot into your server with the documented chat/voice permissions; enable Message Content intent for selected-message reading.
3. Choose **OpenAI API key**, enter your own key and a Responses-compatible model available to your API project, and save. Reasoning and optional web search must be supported by that model; API web search is off by default. Model catalog access does not prove inference or tool compatibility. API usage belongs to your API project; it does not use this installation owner's existing ChatGPT grant.
4. Alternatively, retain **Existing ChatGPT connection**. With the bot stopped, run `npm run auth -- login` under your Windows account. The existing authorization flow and account eligibility rules remain unchanged.
5. Run `npm run register` explicitly once configuration is saved. It reads the same effective settings, upserts the seven commands, and preserves unrelated commands. Saving or starting never registers commands automatically.
6. Click Start bot. Verify Discord/AI readiness and use the existing Discord pilot checks before relying on unattended playback.

API requests follow OpenAI's [server-side authentication guidance](https://developers.openai.com/api/reference/overview#authentication) and [Responses-based text generation](https://developers.openai.com/api/docs/guides/text). Credentials never go in frontend bundles or browser storage, and provider failures never trigger automatic switching between API billing and the existing ChatGPT connection.

### Configuration storage and recovery

Startup, registration, and auth now share one configuration bootstrap. Precedence is **explicit inherited deployment environment → saved dashboard settings → legacy `.env` → defaults**. Existing `.env` files are not automatically rewritten or migrated. Externally overridden fields are disabled in Settings. Relative configured data/asset paths resolve against this installation.

`data/dashboard/settings.json` contains non-secret values and references a versioned `secrets-<revision>.dpapi` file protected by Windows CurrentUser DPAPI. Saving commits the encrypted file before atomically replacing the settings manifest, and retains `settings.previous.json` plus its encrypted credential reference. The existing `data/ai/chatgpt.dpapi` grant remains separate. Moving installations to another Windows user/machine requires entering credentials again. Explicit Remove overrides a legacy secret instead of silently restoring it from `.env`.

On settings corruption, stop any verified bot first and restore a consistent `settings.previous.json` with its referenced encrypted file under the same Windows account. A leftover `settings.lock` or `supervisor.lock` requires confirming that its owner is no longer active before recovery. Never remove frontend/AI locks based only on sandboxed visibility. The supervisor records launched PIDs even before startup completes, so a timed-out launch cannot be blindly duplicated. Inspect the existing process and local `data/bot.stdout.log` / `data/bot.stderr.log` before retrying.

## Storage and ownership

| Location | Purpose |
| --- | --- |
| `.env` | Sleep bot token/identity, AI restrictions/model, controller/audio settings |
| `data/dashboard/settings.json`, `settings.previous.json` | Current and previous managed settings manifests; no plaintext secrets |
| `data/dashboard/secrets-<revision>.dpapi` | Versioned encrypted Discord/API credentials referenced by a settings manifest |
| `data/dashboard/control.dpapi`, `runtime.json`, `supervisor.json` | Protected local-control credential and verified runtime/launch identities |
| `data/frontend/<application-id>/runtime.lock` | Exclusive Discord frontend owner |
| `data/frontend/<application-id>/nickname-events.sqlite` | Durable nickname action event claims; reset does not erase them |
| `data/ai/runtime.lock` | AI worker or auth command owner |
| `data/ai/chatgpt.dpapi`, `host-id` | Existing encrypted authorization and host binding |
| `data/ai/conversations.sqlite` | Scoped text history and durable event claims |
| `data/sleep/sessions.sqlite` | Voice session/channel/mode/style/persistence |
| `data/backups/` | Command manifests and consistent pre-cutover database/credential snapshots |

The `.env`, data, logs and node_modules are ignored. History databases are unencrypted local files; DPAPI protects credentials only. Preserve this Windows account and protect local access. Never publish `.env`, data or a whole runtime folder.

Before deleting a stale lock, inspect **unrestricted** Windows processes and their working directories. Sandboxed inspection previously missed active bots and led to duplicate handlers. `scripts/process-directory.ps1 -ProcessIds <pid>` reads only the directory metadata of an identified 64-bit process; it does not print environment variables. Verify the PID and exact project/entry point again before stopping it.

## Maintenance and verification

```powershell
npm run check
npm test
npm run register
```

Registration upserts these seven commands in the configured AI guild individually; it preserves unrelated commands and existing global scopes. Do not run the original projects’ bulk command registrars against the combined application.

Stop the combined runtime before `npm run auth -- status`, `models`, `login`, `test` or `logout`. These share the AI lock. Reauthorization is necessary only if the current grant cannot refresh. A live auth test consumes the connected plan allowance; normal tests use fixtures/stubs and do not contact Discord or perform live inference.

The migration utility uses SQLite’s backup API, verifies `PRAGMA quick_check`, preserves sources, and refuses to overwrite targets. `scripts/state-transfer.ts --rehearsal` exercises copies. Actual migration requires both original runtimes to be verified stopped and `--originals-stopped`; the source AI lock must already be absent. This utility does not stop processes or delete locks.

See [`PROJECT_STATE.md`](../PROJECT_STATE.md) for the deployment snapshot, test count, current caveats and pilot checklist. Automated audio tests verify frames/loops and controller/state behavior. Human listening while overlapping text/image requests remains necessary before relying on unattended overnight playback.

## Rollback

1. Verify and stop the combined frontend and worker. Confirm both PIDs are gone before touching locks. Preserve a consistent backup of the **current** combined databases and encrypted credential blob first.
2. Copy the newest `data/ai/chatgpt.dpapi` and `host-id` back to the original assistant project's `data/` under the same Windows account. OAuth refresh rotation may make the pre-cutover original credential stale. Do not decrypt or paste it. To retain post-cutover chats/sleep changes, use a consistent SQLite backup to the original state paths while all consumers are stopped; otherwise explicitly choose the pre-cutover snapshots and accept losing newer state.
3. Restore the recorded pre-cutover guild commands. The exact snapshot path is recorded as `preCutoverCommandBackup` in `data/deployment.json`. Preview with `node --env-file=.env --import tsx scripts/restore-commands.ts <snapshot-path>`, then add `--apply` during rollback. It upserts saved definitions and removes only the newly added AI command names absent from that snapshot, preserving unrelated commands/global scopes. The original assistant application’s commands were never modified.
4. Start one original sleep instance from `E:\Projects\2026Projject\DiscordSleepBot` and one original assistant bot from its original folder. Verify their working directories, Discord identities and ownership. Do not start the combined runtime alongside them.

Neither original project’s application code is modified by this integration. Runtime snapshots and encrypted copied grants are private and should not be redistributed.
