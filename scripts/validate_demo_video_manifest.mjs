#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultManifest = path.join(
  root,
  'docs',
  '10-operations',
  'demo-video-manifest.json'
);
const manifestPath = path.resolve(process.argv[2] ?? defaultManifest);

const expectedTimeline = [
  ['focus-action', 0, 16],
  ['completion-reroute', 16, 34],
  ['proposed-fact-boundary', 34, 50],
  ['confirmation-reroute', 50, 68],
  ['production-close', 68, 90],
];

const requiredScreenText = new Map([
  ['focus-action', ['Obtain a state identification card', 'Open a checking account']],
  ['completion-reroute', ['You completed an Action', 'Became available']],
  [
    'proposed-fact-boundary',
    [
      "Proposed Facts don't affect your Route until you confirm them.",
      'Apply for a transit pass',
    ],
  ],
  ['confirmation-reroute', ['You confirmed a fact', 'Added to your Route']],
  ['production-close', ['Route History', 'pathfinder.windwardline.com']],
]);

const unsupportedClaims = [
  /proven (?:to )?(?:improve|reduce|increase)/i,
  /reduces? recidivism/i,
  /improves? (?:reentry )?outcomes?/i,
  /validated participant/i,
  /participants? (?:understand|trust)/i,
  /optimal (?:route|ranking|sequence)/i,
  /dependency graph/i,
];

function words(text) {
  return text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? [];
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validate(manifest) {
  const errors = [];

  if (manifest.durationSeconds !== 90) {
    errors.push('durationSeconds must be exactly 90');
  }
  if (manifest.scenarioId !== 'SD-008') {
    errors.push('scenarioId must be SD-008 so the Proposed Fact exists without an improvised mutation');
  }
  if (manifest.storyboardUrl !== 'https://www.figma.com/board/hlrY9M2zrlWVgA9NFAT4GA') {
    errors.push('storyboardUrl must point to the governed Figma storyboard');
  }

  const productionStack = manifest.productionStack ?? {};
  const narrationVoice = productionStack.narrationVoice ?? {};
  if (narrationVoice.provider !== 'ElevenLabs' ||
      narrationVoice.plan !== 'Creator' ||
      narrationVoice.method !== 'Voice Library' ||
      narrationVoice.voice !== 'Michael C. Vincent - Confident, Expressive' ||
      narrationVoice.model !== 'Eleven v3' ||
      narrationVoice.stability !== 'Natural') {
    errors.push('productionStack.narrationVoice must use the ElevenLabs Voice Library voice Michael C. Vincent - Confident, Expressive with Eleven v3 and Natural stability');
  }
  if (narrationVoice.sourceUrl !== 'https://elevenlabs.io/voice-library/adult-male-voices') {
    errors.push('the governed ElevenLabs narration voice must retain its public source URL');
  }
  if (narrationVoice.generationUnit !== 'paragraph-sized segments') {
    errors.push('ElevenLabs narration must be generated in paragraph-sized segments for governed timing and repair');
  }
  if (narrationVoice.exportMode !== 'audio-only') {
    errors.push('ElevenLabs output must be audio-only so editing and export remain governed in DaVinci Resolve');
  }
  if (narrationVoice.licenseVerificationRequired !== true) {
    errors.push('the ElevenLabs Voice Library license and voice record must be verified before final export');
  }

  const screenCapture = productionStack.screenCapture ?? {};
  if (screenCapture.application !== 'OBS Studio and Playwright' ||
      screenCapture.source !== 'real Pathfinder application footage') {
    errors.push('productionStack.screenCapture must use OBS Studio and Playwright with real Pathfinder application footage');
  }

  const finalEdit = productionStack.finalEdit ?? {};
  if (finalEdit.application !== 'DaVinci Resolve' || finalEdit.edition !== 'Free') {
    errors.push('productionStack.finalEdit must use the free edition of DaVinci Resolve');
  }

  const assetLayer = productionStack.assetLayer ?? {};
  if (assetLayer.primaryProvider !== 'Original Pathfinder production assets' || assetLayer.cost !== 'free') {
    errors.push('productionStack.assetLayer must use original Pathfinder production assets');
  }
  if (assetLayer.watermarkFree !== true) {
    errors.push('productionStack.assetLayer must remain watermark-free');
  }
  if (assetLayer.attributionRequired !== false) {
    errors.push('productionStack.assetLayer must not depend on attribution for publication');
  }
  const assetUses = Array.isArray(assetLayer.uses) ? assetLayer.uses : [];
  for (const requiredUse of ['original tonal underscore', 'two restrained click cues', 'native typography and transitions']) {
    if (!assetUses.includes(requiredUse)) {
      errors.push(`productionStack.assetLayer is missing required use: ${requiredUse}`);
    }
  }
  if (assetLayer.thirdPartyStockAssetsUsed !== false) {
    errors.push('the final production must not use third-party stock assets');
  }
  const excludedFromFinalVideo = Array.isArray(productionStack.excludedFromFinalVideo)
    ? productionStack.excludedFromFinalVideo
    : [];
  for (const excluded of ['Artlist Max', 'MiniMax Speech', 'generated Pathfinder UI']) {
    if (!excludedFromFinalVideo.includes(excluded)) {
      errors.push(`productionStack.excludedFromFinalVideo must include ${excluded}`);
    }
  }

  const capture = manifest.capture ?? {};
  if (capture.source !== 'real Pathfinder application footage') {
    errors.push('capture.source must require real Pathfinder application footage');
  }
  if (capture.resolution !== '1920x1080' || capture.framesPerSecond !== 30) {
    errors.push('capture must be 1920x1080 at 30 frames per second');
  }
  if (capture.captureCursor !== true) {
    errors.push('capture.captureCursor must be true');
  }
  if (!isNumber(capture.cursorScale) || capture.cursorScale < 1.5 || capture.cursorScale > 1.75) {
    errors.push('capture.cursorScale must be between 1.5 and 1.75');
  }
  if (capture.clickRingColor !== '#4CA893') {
    errors.push('capture.clickRingColor must use Pathfinder dark-mode spruce #4CA893');
  }
  if (!isNumber(capture.clickRingOpacity) || capture.clickRingOpacity < 0.35 || capture.clickRingOpacity > 0.55) {
    errors.push('capture.clickRingOpacity must be subtle but visible (0.35 to 0.55)');
  }

  if (!Array.isArray(manifest.beats) || manifest.beats.length !== expectedTimeline.length) {
    errors.push(`manifest must contain ${expectedTimeline.length} storyboard beats`);
    return errors;
  }

  const narration = [];
  for (let index = 0; index < expectedTimeline.length; index += 1) {
    const beat = manifest.beats[index];
    const [expectedId, expectedStart, expectedEnd] = expectedTimeline[index];
    if (beat.id !== expectedId) {
      errors.push(`beat ${index + 1} must be ${expectedId}`);
    }
    if (beat.startSeconds !== expectedStart || beat.endSeconds !== expectedEnd) {
      errors.push(`${expectedId} must span ${expectedStart}-${expectedEnd} seconds`);
    }
    if (index > 0 && beat.startSeconds !== manifest.beats[index - 1].endSeconds) {
      errors.push(`${expectedId} creates a timeline gap or overlap`);
    }

    const screenText = Array.isArray(beat.exactScreenText) ? beat.exactScreenText : [];
    for (const required of requiredScreenText.get(expectedId) ?? []) {
      if (!screenText.includes(required)) {
        errors.push(`${expectedId} is missing exact screen text: ${required}`);
      }
    }

    if (typeof beat.narration !== 'string' || beat.narration.trim() === '') {
      errors.push(`${expectedId} must include narration`);
    } else {
      narration.push(beat.narration);
    }

    if (!Array.isArray(beat.cursorCues) || beat.cursorCues.length === 0) {
      errors.push(`${expectedId} must include cursor cues`);
      continue;
    }

    for (const [cueIndex, cue] of beat.cursorCues.entries()) {
      const label = `${expectedId} cursor cue ${cueIndex + 1}`;
      if (!isNumber(cue.atSeconds) || cue.atSeconds < beat.startSeconds || cue.atSeconds >= beat.endSeconds) {
        errors.push(`${label} must occur inside its beat`);
      }
      if (!isNumber(cue.movementMs) || cue.movementMs < 600 || cue.movementMs > 900) {
        errors.push(`${label} movementMs must be 600-900`);
      }
      if (!isNumber(cue.xPercent) || cue.xPercent < 0 || cue.xPercent > 100 ||
          !isNumber(cue.yPercent) || cue.yPercent < 0 || cue.yPercent > 100) {
        errors.push(`${label} must have valid percentage coordinates`);
      }
      if (cue.click === true) {
        if (!isNumber(cue.preClickDwellMs) || cue.preClickDwellMs < 300 || cue.preClickDwellMs > 500) {
          errors.push(`${label} preClickDwellMs must be 300-500`);
        }
        if (!isNumber(cue.postClickDwellMs) || cue.postClickDwellMs < 600 || cue.postClickDwellMs > 1000) {
          errors.push(`${label} postClickDwellMs must be 600-1000`);
        }
        if (!isNumber(cue.ringDurationMs) || cue.ringDurationMs < 250 || cue.ringDurationMs > 350) {
          errors.push(`${label} ringDurationMs must be 250-350`);
        }
        if (typeof cue.narrationCue !== 'string' ||
            !beat.narration.toLowerCase().includes(cue.narrationCue.toLowerCase())) {
          errors.push(`${label} narrationCue must appear naturally in the same beat's narration`);
        }
      }
    }
  }

  const fullNarration = narration.join(' ');
  const wordCount = words(fullNarration).length;
  if (wordCount < 170 || wordCount > 186) {
    errors.push(`narration must contain 170-186 words; found ${wordCount}`);
  }
  for (const pattern of unsupportedClaims) {
    if (pattern.test(fullNarration)) {
      errors.push(`narration contains an unsupported claim matching ${pattern}`);
    }
  }
  if (!/participant controls the Facts/i.test(fullNarration) ||
      !/Route Engine controls sequencing/i.test(fullNarration)) {
    errors.push('narration must state the participant and Route Engine control boundary');
  }

  return errors;
}

try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const errors = validate(manifest);
  const runbook = await readFile(
    path.join(root, 'docs', '10-operations', 'demo-day-runbook.md'),
    'utf8'
  );
  const runbookNarration = runbook.match(
    /<!-- demo-video-narration:start -->([\s\S]*?)<!-- demo-video-narration:end -->/
  )?.[1];
  const normalizedManifestNarration = manifest.beats
    .map(beat => beat.narration)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedRunbookNarration = runbookNarration?.replace(/\s+/g, ' ').trim();
  if (!runbookNarration) {
    errors.push('demo-day-runbook.md is missing the governed narration block');
  } else if (normalizedRunbookNarration !== normalizedManifestNarration) {
    errors.push('runbook narration does not match the demo video manifest');
  }
  if (errors.length > 0) {
    console.error('Demo video manifest validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    const wordCount = words(manifest.beats.map(beat => beat.narration).join(' ')).length;
    console.log('Demo video manifest validation passed');
    console.log('- 5 contiguous storyboard beats span exactly 90 seconds');
    console.log(`- ${wordCount} narration words remain inside the natural pacing budget`);
    console.log('- runbook narration matches the manifest');
    console.log('- exact product copy and the Confirmed-Fact trust boundary are present');
    console.log('- cursor cues satisfy the visibility contract');
    console.log('- production stack is locked and watermark-free');
  }
} catch (error) {
  console.error(`Demo video manifest could not be read: ${error.message}`);
  process.exitCode = 1;
}
