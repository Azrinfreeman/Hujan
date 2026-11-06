import { resolve, join, relative, isAbsolute } from 'node:path';

export const appURL = 'hujan://app/';
export const allowedOperations = new Set(['status','settings','saveSettings','personality','savePersonality','localSpeechStatus','localSpeechSetup','localSpeechCancel','voiceSummaryStatus','management','freshManagement','start','stop','operation',
  'clearStaleLocks','testDiscord','testAI','testAIResponse','registerCommands','authStatus','authConnect','authSwitch','authDisconnect','authCancel','importSelect','importCommit','openExternal']);
export function validSender(event, window) {
  return !!window && event.sender === window.webContents && event.senderFrame === window.webContents.mainFrame
    && event.senderFrame.url.split('#')[0] === appURL;
}
export function validateRequest(operation, argument) {
  if (!allowedOperations.has(operation) || !argument || typeof argument !== 'object' || Array.isArray(argument)
    || Buffer.byteLength(JSON.stringify(argument)) > 16384) throw new Error('Invalid desktop request.');
  if (operation === 'operation') {
    if (Object.keys(argument).length !== 1 || typeof argument.id !== 'string' || !/^[a-f\d-]{36}$/.test(argument.id)) throw new Error('Invalid operation ID.');
  } else if (operation === 'importCommit') {
    if (Object.keys(argument).length !== 1 || typeof argument.ticket !== 'string' || !/^[a-f\d-]{36}$/.test(argument.ticket)) throw new Error('Invalid import ticket.');
  } else if (operation === 'openExternal') {
    if (Object.keys(argument).length !== 1 || typeof argument.url !== 'string' || argument.url.length > 2048) throw new Error('Invalid external destination.');
  } else if (operation !== 'saveSettings' && operation !== 'savePersonality' && Object.keys(argument).length) throw new Error('This action does not accept arguments.');
}
const resources = new Map([['/','index.html'],['/app.js','app.js'],['/styles.css','styles.css'],['/transport.js','transport.js'],['/hujan.png','hujan.png']]);
export function resourcePath(url, root) {
  const parsed=new URL(url);
  if (parsed.protocol !== 'hujan:' || parsed.host !== 'app' || parsed.username || parsed.password || parsed.search) return;
  const name=resources.get(parsed.pathname);
  if (!name) return;
  const path=join(root,name), rel=relative(resolve(root),resolve(path));
  return !isAbsolute(rel) && !rel.startsWith('..') ? path : undefined;
}
export function externalURL(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.host !== 'discord.com' || url.username || url.password || url.hash) throw new Error('Unsupported external destination.');
  if (url.pathname === '/developers/applications' || url.pathname.startsWith('/developers/applications/')) return url.href;
  if (url.pathname !== '/oauth2/authorize') throw new Error('Unsupported external destination.');
  const params = url.searchParams;
  if (!/^\d{17,20}$/.test(params.get('client_id') ?? '')) throw new Error('Invalid invite application.');
  if (params.get('scope') !== 'bot applications.commands') throw new Error('Invalid invite scope.');
  if (!/^\d{1,20}$/.test(params.get('permissions') ?? '')) throw new Error('Invalid invite permissions.');
  for (const key of params.keys()) if (!['client_id','scope','permissions','guild_id','disable_guild_select'].includes(key)) throw new Error('Unsupported invite option.');
  if (params.has('guild_id') && !/^\d{17,20}$/.test(params.get('guild_id') ?? '')) throw new Error('Invalid invite server.');
  if (params.has('disable_guild_select') && !['true','false'].includes(params.get('disable_guild_select'))) throw new Error('Invalid invite option.');
  return url.href;
}
export function authURL(value) {
  const url=new URL(value);
  if (url.protocol !== 'https:' || url.host !== 'auth.openai.com' || url.pathname !== '/api/accounts/authorize' || url.username || url.password || url.hash) throw new Error('Unsupported sign-in destination.');
  return url.href;
}
