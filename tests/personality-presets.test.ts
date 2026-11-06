import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PersonalityStore, loadPresets, parsePreset, validPersonalityText, presetOrder } from '../src/personality-presets.js';
import { readPersonality, maxPersonalityChars } from '../src/personality.js';

const fixture = () => { const root = mkdtempSync(join(tmpdir(), 'personality-')); return { root, store: new PersonalityStore(root), done: () => rmSync(root, { recursive: true, force: true }) }; };

test('bundled templates load, are valid and within the personality limit', () => {
  const presets = loadPresets();
  assert.deepEqual(presets.map(item => item.id), [...presetOrder]);
  for (const item of presets) assert.ok(item.text.length > 20 && item.text.length <= maxPersonalityChars, item.id);
  assert.equal(presets.find(item => item.id === 'sabah-roast')!.mature, true);
  assert.equal(presets.filter(item => item.mature).length, 1);
  assert.throws(() => parsePreset('x', 'no front matter'), /malformed/);
  assert.throws(() => parsePreset('x', '---\nid: y\ntitle: t\ndescription: d\nexample: e\n---\nbody'), /invalid/);
});

test('fresh install defaults to casual Malay but is not applied until saved', () => {
  const { store, done } = fixture();
  try {
    const state = store.state();
    assert.equal(state.preset, 'casual-ms'); assert.equal(state.applied, false); assert.equal(state.customText, '');
    assert.ok(!existsSync(store.livePath));
    const saved = store.apply({ preset: 'casual-ms', text: state.text, revision: state.revision });
    assert.equal(saved.preset, 'casual-ms'); assert.equal(saved.applied, true);
    assert.equal(readPersonality(store.livePath), state.text);
  } finally { done(); }
});

test('an existing PERSONALITY.md becomes custom and is unchanged until the owner saves', () => {
  const { store, done } = fixture();
  try {
    writeFileSync(store.livePath, 'Existing owner personality.\n');
    const state = store.state();
    assert.equal(state.preset, 'custom'); assert.equal(state.text, 'Existing owner personality.'); assert.equal(state.applied, true);
    assert.equal(readFileSync(store.livePath, 'utf8'), 'Existing owner personality.\n');
  } finally { done(); }
});

test('templates, custom text and no personality are applied, and custom text is preserved across switches', () => {
  const { store, done } = fixture();
  try {
    let state = store.state();
    state = store.apply({ preset: 'custom', text: 'Be a pirate.', revision: state.revision });
    assert.equal(state.preset, 'custom'); assert.equal(readPersonality(store.livePath), 'Be a pirate.');
    const friendly = state.presets.find(item => item.id === 'friendly-en')!;
    state = store.apply({ preset: 'friendly-en', text: friendly.text, revision: state.revision });
    assert.equal(state.preset, 'friendly-en'); assert.equal(state.customText, 'Be a pirate.');
    state = store.apply({ preset: 'friendly-en', text: `${friendly.text}\nAlso say hello.`, revision: state.revision });
    assert.equal(state.preset, 'custom'); assert.match(readPersonality(store.livePath), /Also say hello/);
    state = store.apply({ preset: 'none', text: 'ignored', revision: state.revision });
    assert.equal(state.preset, 'none'); assert.equal(readPersonality(store.livePath), ''); assert.equal(state.applied, true);
    assert.equal(state.customText, `${friendly.text}\nAlso say hello.`);
  } finally { done(); }
});

test('outside edits are detected and a stale revision cannot overwrite them', () => {
  const { store, done } = fixture();
  try {
    let state = store.state();
    state = store.apply({ preset: 'custom', text: 'Mine.', revision: state.revision });
    writeFileSync(store.livePath, 'Edited by hand.\n');
    const edited = store.state();
    assert.equal(edited.externalEdit, true); assert.equal(edited.preset, 'custom'); assert.equal(edited.text, 'Edited by hand.');
    assert.throws(() => store.apply({ preset: 'custom', text: 'Stale.', revision: state.revision }), /Reload/);
    assert.equal(readFileSync(store.livePath, 'utf8'), 'Edited by hand.\n');
    const after = store.apply({ preset: 'custom', text: 'Fresh.', revision: edited.revision });
    assert.equal(after.externalEdit, false);
  } finally { done(); }
});

test('invalid personality input is rejected without changing the live file', () => {
  const { store, done } = fixture();
  try {
    const state = store.state();
    store.apply({ preset: 'custom', text: 'Keep me.', revision: state.revision });
    const revision = store.state().revision;
    const bad = [
      { preset: 'custom', text: 'x'.repeat(maxPersonalityChars + 1), revision }, { preset: 'custom', text: 'bad\u0000text', revision },
      { preset: 'custom', text: '\ud800', revision }, { preset: 'custom', text: '   ', revision }, { preset: 'custom', text: 5, revision },
      { preset: 'unknown', text: 'x', revision }, { preset: 'custom', text: 'x', revision: 'wrong' },
    ];
    for (const input of bad) assert.throws(() => store.apply(input as never), Error);
    assert.equal(readPersonality(store.livePath), 'Keep me.');
    assert.equal(validPersonalityText('a\r\nb '), 'a\nb');
  } finally { done(); }
});
