import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const validator = path.join(root, 'scripts', 'validate_demo_video_manifest.mjs');
const manifestPath = path.join(
  root,
  'docs',
  '10-operations',
  'demo-video-manifest.json'
);

function validate(candidate = manifestPath) {
  return spawnSync(process.execPath, [validator, candidate], {
    cwd: root,
    encoding: 'utf8',
  });
}

async function mutateManifest(mutator) {
  const directory = await mkdtemp(path.join(tmpdir(), 'pathfinder-demo-manifest-'));
  const candidate = path.join(directory, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  mutator(manifest);
  await writeFile(candidate, `${JSON.stringify(manifest, null, 2)}\n`);
  return candidate;
}

test('the canonical 90-second manifest is screen, narration, and cursor aligned', () => {
  const result = validate();

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /5 contiguous storyboard beats/);
  assert.match(result.stdout, /90 seconds/);
  assert.match(result.stdout, /cursor cues satisfy the visibility contract/);
  assert.match(result.stdout, /production stack is locked and watermark-free/);
});

test('a different voice-clone provider fails the locked production stack', async () => {
  const candidate = await mutateManifest(manifest => {
    manifest.productionStack.voiceClone.provider = 'MiniMax';
  });
  const result = validate(candidate);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ElevenLabs/);
});

test('a watermarked asset source fails the locked production stack', async () => {
  const candidate = await mutateManifest(manifest => {
    manifest.productionStack.assetLayer.watermarkFree = false;
  });
  const result = validate(candidate);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /watermark-free/);
});

test('a timeline gap fails validation', async () => {
  const candidate = await mutateManifest(manifest => {
    manifest.beats[1].startSeconds = 17;
  });
  const result = validate(candidate);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /gap or overlap/);
});

test('an unsupported outcome claim fails validation', async () => {
  const candidate = await mutateManifest(manifest => {
    manifest.beats[4].narration += ' Pathfinder is proven to reduce recidivism.';
  });
  const result = validate(candidate);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unsupported claim/);
});

test('a rushed or invisible click cue fails validation', async () => {
  const candidate = await mutateManifest(manifest => {
    const click = manifest.beats[1].cursorCues.find(cue => cue.click);
    click.movementMs = 150;
    click.preClickDwellMs = 0;
    click.ringDurationMs = 0;
  });
  const result = validate(candidate);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /movementMs/);
  assert.match(result.stderr, /preClickDwellMs/);
  assert.match(result.stderr, /ringDurationMs/);
});
