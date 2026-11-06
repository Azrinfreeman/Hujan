import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resourceRoot, stateRoot } from './app-paths.js';
import { UserError } from './errors.js';
import { maxPersonalityChars } from './personality.js';

export const presetOrder = ['casual-ms','friendly-en','professional-en','playful-en','sabah-roast'] as const;
export const defaultPreset = 'casual-ms';
export type PresetInfo = { id: string; title: string; description: string; example: string; mature: boolean; text: string };
export type PersonalityState = {
  preset: string; text: string; customText: string; applied: boolean; externalEdit: boolean; revision: string;
  max: number; presets: PresetInfo[];
};
type SelectionRecord = { version: 1; preset: string; customText: string; appliedSha256: string; updatedAt: string };

const sha = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
const loneSurrogate = new RegExp('[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]');

export function parsePreset(id: string, document: string): PresetInfo {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(document);
  if (!match) throw new UserError(`Personality template ${id} is malformed.`);
  const fields: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator > 0) fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  const text = match[2]!.replace(/\r\n/g, '\n').trim();
  if (fields.id !== id || !fields.title || fields.title.length > 60 || !fields.description || fields.description.length > 200
    || !fields.example || fields.example.length > 200 || !text || text.length > maxPersonalityChars) {
    throw new UserError(`Personality template ${id} is invalid.`);
  }
  return { id, title: fields.title, description: fields.description, example: fields.example, mature: fields.mature === 'true', text };
}

export function loadPresets(directory = join(resourceRoot, 'assets/personalities')): PresetInfo[] {
  return presetOrder.map(id => parsePreset(id, readFileSync(join(directory, `${id}.md`), 'utf8')));
}

export function validPersonalityText(value: unknown): string {
  if (typeof value !== 'string') throw new UserError('Personality text must be text.');
  const text = value.replace(/\r\n?/g, '\n').trim();
  if (text.length > maxPersonalityChars) throw new UserError(`Personality text must be at most ${maxPersonalityChars} characters.`);
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text) || loneSurrogate.test(text)) throw new UserError('Personality text contains characters that cannot be saved.');
  return text;
}

function readText(path: string): string | undefined {
  try {
    if (!existsSync(path)) return undefined;
    if (statSync(path).size > maxPersonalityChars * 4) return undefined;
    return readFileSync(path, 'utf8').replace(/\r\n?/g, '\n').trim();
  } catch { return undefined; }
}

function writeAtomic(path: string, content: string) {
  mkdirSync(join(path, '..'), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, content, { encoding: 'utf8', mode: 0o600 });
  renameSync(temp, path);
}

/**
 * Owns the dashboard's personality choice. PERSONALITY.md stays the single live
 * file the AI worker reads on every request; this store only decides its content.
 */
export class PersonalityStore {
  readonly livePath: string;
  readonly recordPath: string;
  private templates: PresetInfo[];
  constructor(root = stateRoot, templates: PresetInfo[] = loadPresets()) {
    this.livePath = join(root, 'PERSONALITY.md');
    this.recordPath = join(root, 'data/dashboard/personality.json');
    this.templates = templates;
  }
  private record(): SelectionRecord | undefined {
    try {
      if (!existsSync(this.recordPath) || statSync(this.recordPath).size > maxPersonalityChars * 6) return undefined;
      const value = JSON.parse(readFileSync(this.recordPath, 'utf8')) as SelectionRecord;
      if (value?.version !== 1 || typeof value.preset !== 'string' || typeof value.customText !== 'string' || typeof value.appliedSha256 !== 'string') return undefined;
      return value;
    } catch { return undefined; }
  }
  state(): PersonalityState {
    const live = readText(this.livePath);
    const record = this.record();
    const info = (preset: string, text: string, customText: string, applied: boolean, externalEdit: boolean): PersonalityState => ({
      preset, text, customText, applied, externalEdit, max: maxPersonalityChars, presets: this.templates,
      revision: sha(`${record?.updatedAt ?? ''}\n${live ?? '\u0000absent'}`).slice(0, 24),
    });
    if (!record) {
      if (live) return info('custom', live, live, true, false);
      const template = this.templates.find(item => item.id === defaultPreset)!;
      return info(defaultPreset, template.text, '', false, false);
    }
    if (live === undefined) return info(record.preset, this.textFor(record.preset, record.customText), record.customText, false, false);
    if (sha(live) !== record.appliedSha256) return info('custom', live, record.customText || live, true, true);
    return info(record.preset, live, record.customText, true, false);
  }
  private textFor(preset: string, customText: string) {
    return preset === 'none' ? '' : preset === 'custom' ? customText : this.templates.find(item => item.id === preset)?.text ?? customText;
  }
  apply(input: { preset?: unknown; text?: unknown; revision?: unknown }): PersonalityState {
    if (typeof input.revision !== 'string' || input.revision !== this.state().revision) {
      throw new UserError('Personality changed in another window or file. Reload before saving.');
    }
    const requested = typeof input.preset === 'string' ? input.preset : '';
    if (requested !== 'none' && requested !== 'custom' && !this.templates.some(item => item.id === requested)) throw new UserError('Choose a listed personality.');
    const previous = this.record();
    let preset: string, text: string, customText = previous?.customText ?? '';
    if (requested === 'none') { preset = 'none'; text = ''; }
    else {
      text = validPersonalityText(input.text);
      if (!text) throw new UserError('Write a personality, or choose "No personality".');
      const template = this.templates.find(item => item.id === requested);
      if (template && template.text === text) preset = template.id;
      else { preset = 'custom'; customText = text; }
    }
    writeAtomic(this.livePath, text ? `${text}\n` : '');
    const record: SelectionRecord = { version: 1, preset, customText, appliedSha256: sha(text), updatedAt: new Date().toISOString() };
    writeAtomic(this.recordPath, JSON.stringify(record));
    return this.state();
  }
}
