import { fileURLToPath } from 'node:url';
import { join, resolve, isAbsolute } from 'node:path';
import { existsSync } from 'node:fs';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const packaged = import.meta.url.endsWith('.js');
for (const key of ['HUJAN_STATE_ROOT', 'HUJAN_RESOURCE_ROOT']) {
  if (process.env[key] && !isAbsolute(process.env[key]!)) throw new Error(`${key} must be absolute.`);
}
export const resourceRoot = process.env.HUJAN_RESOURCE_ROOT || sourceRoot;
export const stateRoot = process.env.HUJAN_STATE_ROOT || sourceRoot;
export const runtimeArguments = packaged ? [] : ['--import', 'tsx'];
export function runtimeEntry(root: string, entry: string) {
  return resolve(process.env.HUJAN_RESOURCE_ROOT || root, packaged ? entry.replace(/\.ts$/, '.js') : entry);
}
export const defaultAssets = join(resourceRoot, 'assets');
export const runtimePathKeys = ['HUJAN_STATE_ROOT', 'HUJAN_RESOURCE_ROOT'] as const;

/**
 * Desktop profile folder for this Windows user. New installations use the
 * renamed `%LOCALAPPDATA%\Hujan` folder; an existing pre-rename installation
 * keeps its `%LOCALAPPDATA%\RainBot` folder so its saved credentials and
 * downloaded speech model stay usable without re-import or re-download.
 */
export function desktopStateRoot(): string {
  const base = process.env.LOCALAPPDATA;
  if (!base) return stateRoot;
  const current = join(base, 'Hujan');
  const legacy = join(base, 'RainBot');
  return existsSync(current) || !existsSync(legacy) ? current : legacy;
}
