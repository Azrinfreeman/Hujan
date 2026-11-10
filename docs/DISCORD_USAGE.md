# Discord usage

Back to the [README](../README.md).


| Action | Command |
| --- | --- |
| Ask Hujan | `/ask prompt:...` or mention Hujan with a question |
| Private AI answer | `/ask prompt:... private:true` |
| Attach a screenshot | `/ask image:...` with an optional prompt, or tag Hujan in a message with one attachment |
| Explain a selected message | Reply to that message, mention Hujan and say what to explain |
| Clear your AI context in this channel | `/reset` |
| Change a member’s server nickname | `/nickname member:@Ali name:Raja Tidur` |
| Check AI connection | `/status` |
| Join your voice channel | `/sleep join mode:rain`, `sunny` or `silent` |
| Change ambience | `/sleep rain on`, `/sleep sunny on` |
| Quietly remain in voice | `/sleep rain off` or `/sleep sunny off` |
| Choose a rain scene | `/sleep rain style scene:...` or `/sleep rain mild-thunder` |
| Check voice/audio | `/sleep status` |
| Leave and disable automatic restoration | `/sleep leave` |

AI replies are typed, including in voice-channel text chat. Optional voice transcription requires the explicit listening controls in [Voice summaries](VOICE_SUMMARIES.md); it is disabled by default. No AI speech is generated. Public AI delivery is one message containing question, answer and, for own uploads, image preview. Long text uses one `response.txt` attachment. Ambience on/off deliberately keeps the sleep bot’s private acknowledgment plus one public announcement.

## Nickname changes

Only the configured owner (`OWNER_DISCORD_ID`) and members with **Manage Nicknames** may request changes, within the configured AI guild/channel/role access rules. These change a **server nickname**, not a global Discord account username.

Use `/nickname member:@Ali name:Raja Tidur` for a private acknowledgment, or ask through `/ask`/a direct bot mention:

```text
@Hujan tolong tukar nickname @Ali jadi "Raja Tidur"
@HujanAI bah bolehkan kalau kau tukar nama @Ali kepada Raja Tidur
@Hujan rename @Ali to "Raja Tidur"
```

Select real Discord mentions for your bot and the target member. Chat requests need one explicitly mentioned target and one exact nickname after `to`, `kepada` or `jadi`; quotes are optional. Sabahan courtesy openings such as `bah bolehkan kalau kau` are supported. Hujan cannot pick a different member/name, rename someone from quoted context or previous history, or act on a hypothetical/negative request. For other phrasing, use `/nickname`. Names must contain 1–32 characters without control characters or line breaks.

Hujan needs **Manage Nicknames**, and its highest role must be above the target’s highest role, following [Discord’s permission hierarchy](https://docs.discord.com/developers/topics/permissions#permission-hierarchy). The server owner cannot be renamed by a bot. Other moderators must also outrank their target, except when changing their own nickname; the configured bot owner is explicitly authorized but still subject to the bot’s Discord hierarchy limits. Current actor/bot permissions, member roles and configured access restrictions are fetched again immediately before an action.

Chat requests provide one exact function capability to the worker. A completed AI function call is validated against it, then the frontend performs only a nickname PATCH and returns a confirmed application result. No model-written “done” message triggers a change. Duplicate worker calls share the same action promise; durable frontend event claims prevent replayed actions after restart. Slash nickname changes do not require AI availability. A four-request action queue and two-second per-member cooldown bound direct action load.

The result is acknowledged only after Discord confirms the requested nickname. Successful changes show the requester, target member and new nickname publicly in the requesting channel. Public AI/mention replies carry this confirmation themselves; `/nickname` and private `/ask` also post one public confirmation after completing their private acknowledgment. Mentions are displayed without pinging members. Failed, replayed and already-set requests do not post an announcement. If posting fails after the rename succeeds, the private result explains that the name changed but its announcement could not be posted. An interrupted/failed request can have an uncertain result; check the member’s current nickname before sending a new request. Discord’s audit reason records the requesting member and source event. An AI private answer does not make the resulting server nickname private.

Hujan needs View Channel, Send Messages, Read Message History, Attach Files and Embed Links for the full chat experience; Connect and Speak for ambience. Enable **Message Content Intent on Hujan’s Bot page** in Discord Developer Portal to read selected ordinary messages through REST. The gateway deliberately subscribes only to Guilds, GuildMessages and GuildVoiceStates; bot mentions arrive through Discord’s mention exception. No channel-history sweep is performed. Voice recording occurs only after the explicit voice-summary setup and participant consent above.

## Access and context

AI settings preserve server access, configured AI guild/channel/role restrictions, **gpt-6-luna / reasoning high** and context-first optional web search.

## Personality

Choose the bot's personality in the dashboard under **Settings → Personality**. Built-in templates are Casual Malay (default), Friendly assistant, Professional and concise, Witty and playful, and Sabah Malay roast (marked mature, so check it suits your community). You can also paste or write any text of your own, up to 8,000 characters.

Saving applies from the next reply with no restart. The chosen text is written to `PERSONALITY.md` in the state folder, which you can still edit by hand; the dashboard detects a hand edit, shows it as Custom, and keeps your own text when you switch templates. Templates live in `assets/personalities/` and the dashboard never modifies them. Concurrent saves use a revision check, so a stale browser tab cannot silently overwrite a newer choice. Editing the original project's personality does not update this copy.

Only the server owner, members with Administrator/Manage Server, or `CONTROLLER_ROLE_IDS` can change sleep sessions. Ordinary members may use permitted AI commands and view sleep status. AI output cannot execute voice controls: members use the deterministic `/sleep` commands themselves.

History is isolated by guild, channel, requesting member and public/private visibility. Context includes that member’s earlier Hujan questions/answers and an explicitly selected same-channel reply chain; it does not ingest their ordinary channel messages. A direct attachment takes priority over a referenced image. Another member’s referenced image is analyzed but is not reposted. Image bytes and download URLs are not retained in history. Public output and supplied context are sent to the existing connected AI account; everyone shares its allowance.

Web search is optional: Hujan uses supplied text, images, references and history first, then searches when missing public facts are needed. Having context does not prohibit searching; having no context does not force it. The existing OAuth subscription adapter is preserved, with no paid API-key fallback.

