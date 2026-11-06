import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { desktopStateRoot, stateRoot } from '../src/app-paths.js';

test('desktop state root prefers the renamed folder but preserves a pre-rename installation', () => {
  const base = mkdtempSync(join(tmpdir(), 'hujan-state-root-'));
  const saved = process.env.LOCALAPPDATA;
  process.env.LOCALAPPDATA = base;
  try {
    // Fresh install: neither folder exists yet.
    assert.equal(desktopStateRoot(), join(base, 'Hujan'));
    // Pre-rename install: only the legacy folder exists, so keep using it.
    mkdirSync(join(base, 'RainBot'));
    assert.equal(desktopStateRoot(), join(base, 'RainBot'));
    // Once the renamed folder exists, it wins over the legacy folder.
    mkdirSync(join(base, 'Hujan'));
    assert.equal(desktopStateRoot(), join(base, 'Hujan'));
  } finally {
    process.env.LOCALAPPDATA = saved;
    rmSync(base, { recursive: true, force: true });
  }
});

test('desktop state root falls back to the source state root when LOCALAPPDATA is absent', () => {
  const saved = process.env.LOCALAPPDATA;
  delete process.env.LOCALAPPDATA;
  try {
    assert.equal(desktopStateRoot(), stateRoot);
  } finally {
    if (saved !== undefined) process.env.LOCALAPPDATA = saved;
  }
});
