#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

import FIXTURE from '../fixtures/camera-fixed-exposure-stage8b-v1.json' with { type: 'json' };
import {
  multiplyMatrixVector,
  projectSpectrum,
} from '../color/RelativeCameraSpectralProfile.js';
import {
  assertNoReparseEntries,
  createProtectedTrackedInventory,
  loadContainmentPolicy,
} from '../harness/lib/containment.js';
import {
  assertFileInventoriesEqual,
  sha256File,
} from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import {
  EXPERIMENT_NODE_MODULES_ROOT,
  EXPERIMENT_PACKAGE_PATH,
  EXPERIMENT_ROOT,
  RUNS_ROOT,
  assertRepositoryIdentity,
} from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-camera-fixed-exposure-stage8b.js';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'camera-fixed-exposure-stage8b-v1.json');
const CONDITIONS = FIXTURE.conditions;

function requireCondition(value, message) {
  if (!value) throw new Error(message);
}

function decodeFloat32(bytes) {
  requireCondition(bytes.byteLength % 4 === 0, 'Float32 readback byte length is invalid.');
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Float32Array(copy.buffer);
}

function spectrumAt(packets, pixel) {
  const values = [];
  for (let channel = 0; channel < 15; channel += 1) {
    values.push(packets[Math.floor(channel / 4)][pixel * 4 + (channel % 4)]);
  }
  return values;
}

function encodeSrgb(value) {
  const bounded = Math.min(1, Math.max(0, value));
  return bounded <= 0.0031308
    ? 12.92 * bounded
    : 1.055 * bounded ** (1 / 2.4) - 0.055;
}

function luminance(rgb) {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function median(values) {
  requireCondition(values.length > 0, 'Exposure anchor contains no positive finite luminance.');
  values.sort((left, right) => left - right);
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? (values[middle - 1] + values[middle]) / 2
    : values[middle];
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function encodePng(width, height, rgbaBottomUp) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const rows = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const target = y * (stride + 1);
    rows[target] = 0;
    const source = (height - 1 - y) * stride;
    rgbaBottomUp.copy(rows, target + 1, source, source + stride);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(rows, { level: 9 })),
    pngChunk('IEND'),
  ]);
}

function samplePixels(input) {
  const centerX = Math.floor(input.widthPixels / 2);
  return {
    'disk-center': Math.floor(input.heightPixels / 2) * input.widthPixels + centerX,
    'upper-quarter': Math.floor(input.heightPixels * 0.75) * input.widthPixels + centerX,
    'top-center': (input.heightPixels - 1) * input.widthPixels + centerX,
  };
}

async function loadRunManifest(runId, artifactSetSha256, label) {
  const root = path.join(RUNS_ROOT, runId);
  await assertNoReparseEntries(root, label);
  const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
  requireCondition(
    manifest.runId === runId
      && manifest.conclusion === 'accepted'
      && manifest.artifactSetSha256 === artifactSetSha256,
    `${label} identity changed.`,
  );
  return { root, manifest };
}

async function loadProfile() {
  const source = await loadRunManifest(
    FIXTURE.stage8a.runId,
    FIXTURE.stage8a.artifactSetSha256,
    'Stage 8a source run',
  );
  const entry = source.manifest.artifacts.find(
    (artifact) => artifact.path === FIXTURE.stage8a.profileArtifact,
  );
  requireCondition(
    entry?.sha256 === FIXTURE.stage8a.profileArtifactSha256,
    'Stage 8a profile manifest identity changed.',
  );
  const profilePath = path.join(source.root, ...FIXTURE.stage8a.profileArtifact.split('/'));
  requireCondition(
    await sha256File(profilePath) === entry.sha256,
    'Stage 8a compiled profile bytes changed.',
  );
  return {
    profile: JSON.parse(await readFile(profilePath, 'utf8')),
    parent: {
      runId: source.manifest.runId,
      artifactSetSha256: source.manifest.artifactSetSha256,
      path: entry.path,
      sha256: entry.sha256,
      byteLength: entry.byteLength,
    },
  };
}

async function loadInputView(input) {
  const source = await loadRunManifest(input.runId, input.artifactSetSha256, `${input.viewId} source run`);
  const packetsByCondition = new Map();
  const parents = [];
  for (const conditionId of CONDITIONS) {
    const packets = [];
    for (let packet = 0; packet < 4; packet += 1) {
      const relativePath = `readbacks/${conditionId}/pre-display-packet-${packet}.f32le`;
      const entry = source.manifest.artifacts.find((artifact) => artifact.path === relativePath);
      requireCondition(entry, `${input.runId} lacks ${relativePath}.`);
      const absolutePath = path.join(source.root, ...relativePath.split('/'));
      requireCondition(await sha256File(absolutePath) === entry.sha256, `${relativePath} changed.`);
      const bytes = await readFile(absolutePath);
      packets.push(decodeFloat32(bytes));
      parents.push({
        runId: input.runId,
        artifactSetSha256: input.artifactSetSha256,
        path: relativePath,
        sha256: entry.sha256,
        byteLength: entry.byteLength,
      });
    }
    packetsByCondition.set(conditionId, packets);
  }
  return { input, packetsByCondition, parents };
}

function cameraLinear(profile, spectrum) {
  const raw = projectSpectrum(profile.cameraNative15Weights, spectrum);
  const xyz = multiplyMatrixVector(profile.sensorToXyzD65Matrix, raw);
  const rgb = multiplyMatrixVector(profile.xyzToLinearRec709D65Matrix, xyz);
  return { raw, xyz, rgb };
}

function deriveExposureAnchor(view, profile) {
  const packets = view.packetsByCondition.get(FIXTURE.exposure.anchorConditionId);
  const pixelCount = view.input.widthPixels * view.input.heightPixels;
  const positiveY = [];
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const { xyz } = cameraLinear(profile, spectrumAt(packets, pixel));
    if (Number.isFinite(xyz[1]) && xyz[1] > 0) positiveY.push(xyz[1]);
  }
  const anchorY = median(positiveY);
  return {
    positivePixelCount: positiveY.length,
    anchorY,
    zeroStopScale: FIXTURE.exposure.middleGray / anchorY,
  };
}

function renderFrame(view, conditionId, profile, zeroStopScale, stop) {
  const packets = view.packetsByCondition.get(conditionId);
  const pixelCount = view.input.widthPixels * view.input.heightPixels;
  const exposureMultiplier = zeroStopScale * 2 ** stop;
  const rgba = Buffer.alloc(pixelCount * 4);
  const samples = {};
  const targets = samplePixels(view.input);
  const summary = {
    conditionId,
    stop,
    exposureMultiplier,
    pixelCount,
    nonFinitePixelCount: 0,
    zeroSpectrumCount: 0,
    rawClippingApplied: false,
    rawClippedPixelCount: 0,
    displayLowClippedPixelCount: 0,
    displayHighClippedPixelCount: 0,
    exactBlackPixelCount: 0,
    exactWhitePixelCount: 0,
    encodedLuminanceSum: 0,
  };
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const spectrum = spectrumAt(packets, pixel);
    if (spectrum.every((value) => value === 0)) summary.zeroSpectrumCount += 1;
    const base = cameraLinear(profile, spectrum);
    const exposedRaw = base.raw.map((value) => value * exposureMultiplier);
    const exposedXyz = base.xyz.map((value) => value * exposureMultiplier);
    const preclipRgb = base.rgb.map((value) => value * exposureMultiplier);
    if (![...exposedRaw, ...exposedXyz, ...preclipRgb].every(Number.isFinite)) {
      summary.nonFinitePixelCount += 1;
    }
    const lowClipped = preclipRgb.some((value) => value < 0);
    const highClipped = preclipRgb.some((value) => value > 1);
    if (lowClipped) summary.displayLowClippedPixelCount += 1;
    if (highClipped) summary.displayHighClippedPixelCount += 1;
    const displayLinear = preclipRgb.map((value) => Math.min(1, Math.max(0, value)));
    const encoded = displayLinear.map(encodeSrgb);
    if (encoded.every((value) => value === 0)) summary.exactBlackPixelCount += 1;
    if (encoded.every((value) => value === 1)) summary.exactWhitePixelCount += 1;
    summary.encodedLuminanceSum += luminance(encoded);
    const offset = pixel * 4;
    rgba[offset] = Math.round(encoded[0] * 255);
    rgba[offset + 1] = Math.round(encoded[1] * 255);
    rgba[offset + 2] = Math.round(encoded[2] * 255);
    rgba[offset + 3] = 255;
    for (const [sampleId, samplePixel] of Object.entries(targets)) {
      if (pixel === samplePixel) {
        samples[sampleId] = {
          pixelIndex: pixel,
          spectrum,
          sensorRaw: base.raw,
          exposedSensorRaw: exposedRaw,
          xyzD65: base.xyz,
          exposedXyzD65: exposedXyz,
          linearRec709D65: base.rgb,
          preclipLinearRec709D65: preclipRgb,
          displayLinearRec709D65: displayLinear,
          encodedSrgb: encoded,
          rawClipped: false,
          displayLowClipped: lowClipped,
          displayHighClipped: highClipped,
        };
      }
    }
  }
  summary.meanEncodedLuminance = summary.encodedLuminanceSum / pixelCount;
  delete summary.encodedLuminanceSum;
  return {
    png: encodePng(view.input.widthPixels, view.input.heightPixels, rgba),
    evidence: { ...summary, samples },
  };
}

function ratio(red, blue) {
  return red / Math.max(1e-30, blue);
}

async function main() {
  const run = await initializeRunRecord({
    slug: 'camera-fixed-exposure-stage8b',
    command: COMMAND,
    inputs: {
      fixture: 'scripts/extraterrestrial/fixtures/camera-fixed-exposure-stage8b-v1.json',
      stage8a: FIXTURE.stage8a,
      sourceRuns: FIXTURE.inputRuns.map(({ runId, artifactSetSha256 }) => ({ runId, artifactSetSha256 })),
      scope: 'fixed relative-exposure full-frame camera presentation; no atmosphere execution, automatic exposure, physical raw clipping, noise, full-well, or production change',
    },
    provenance: {
      method: 'accepted Stage 8a PBRT-style relative camera projection; one complete-wide-noon median-Y anchor; fixed stop bracket; direct Rec.709 clipping and sRGB encoding',
      derivationPolicy: 'retain parents, equations, implementation identity, parameters, per-stage samples, metrics, renders, and result identity',
    },
    environment: { node: process.version, platform: process.platform },
    references: {
      plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md',
      research: 'agents/topics/extraterrestrial/camera-spectral-color-prior-art-research.md',
      architecture: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
    },
  });
  try {
    await assertRepositoryIdentity();
    const policy = await loadContainmentPolicy();
    const before = await createProtectedTrackedInventory(policy);
    await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
    const [{ profile, parent: profileParent }, views] = await Promise.all([
      loadProfile(),
      Promise.all(FIXTURE.inputRuns.map(loadInputView)),
    ]);
    requireCondition(profile.schemaId === 'relative-camera-spectral-profile-v1', 'Stage 8a profile schema changed.');
    const anchorView = views.find((view) => view.input.viewId === FIXTURE.exposure.anchorViewId);
    requireCondition(anchorView, 'Exposure anchor view is absent.');
    const anchor = deriveExposureAnchor(anchorView, profile);
    requireCondition(Number.isFinite(anchor.zeroStopScale) && anchor.zeroStopScale > 0, 'Exposure anchor is invalid.');

    const frames = [];
    for (const view of views) {
      for (const conditionId of CONDITIONS) {
        for (const stop of FIXTURE.exposure.stops) {
          const rendered = renderFrame(view, conditionId, profile, anchor.zeroStopScale, stop);
          await run.writeArtifact(
            `renders/${view.input.viewId}/${conditionId}/ev-${stop >= 0 ? '+' : ''}${stop}.png`,
            rendered.png,
          );
          frames.push({
            viewId: view.input.viewId,
            widthPixels: view.input.widthPixels,
            heightPixels: view.input.heightPixels,
            verticalFovDegrees: view.input.verticalFovDegrees,
            ...rendered.evidence,
          });
        }
      }
    }

    const expectedMultiplier = Object.fromEntries(
      FIXTURE.exposure.stops.map((stop) => [stop, anchor.zeroStopScale * 2 ** stop]),
    );
    const noon = frames.find((frame) => frame.viewId === 'wide' && frame.conditionId === 'solar-noon' && frame.stop === 0);
    const sunset = frames.find((frame) => frame.viewId === 'wide' && frame.conditionId === 'sunset' && frame.stop === 0);
    const noonRatio = ratio(...[noon.samples['disk-center'].preclipLinearRec709D65[0], noon.samples['disk-center'].preclipLinearRec709D65[2]]);
    const sunsetRatio = ratio(...[sunset.samples['disk-center'].preclipLinearRec709D65[0], sunset.samples['disk-center'].preclipLinearRec709D65[2]]);
    const ratioFactor = sunsetRatio / noonRatio;
    const distinctDiskCenterEncodedTripletsByView = Object.fromEntries(views.map((view) => [
      view.input.viewId,
      new Set(frames
        .filter((frame) => frame.viewId === view.input.viewId)
        .map((frame) => frame.samples['disk-center'].encodedSrgb.map((value) => value.toFixed(9)).join(','))).size,
    ]));

    const assertions = [];
    const check = (value, message) => {
      requireCondition(value, message);
      assertions.push(message);
    };
    check(frames.length === views.length * CONDITIONS.length * FIXTURE.exposure.stops.length, 'Every declared view, condition, and stop was rendered.');
    check(frames.every((frame) => frame.nonFinitePixelCount === 0), 'Every camera and display intermediate is finite.');
    check(frames.every((frame) => frame.rawClippingApplied === false && frame.rawClippedPixelCount === 0), 'No unqualified physical raw clipping was applied.');
    check(frames.every((frame) => Math.abs(frame.exposureMultiplier - expectedMultiplier[frame.stop]) <= Math.abs(expectedMultiplier[frame.stop]) * FIXTURE.tolerances.exposureScaleRelative), 'Every frame at a given stop uses the same fixed exposure multiplier.');
    check(frames.every((frame) => frame.zeroSpectrumCount === frame.exactBlackPixelCount), 'Every exact-zero spectrum remains black and no nonzero spectrum collapses to exact black.');
    check(ratioFactor >= FIXTURE.tolerances.minimumSunsetNoonPreclipRedBlueRatioFactor, `Sunset retains stronger preclip red/blue than noon (${ratioFactor}x).`);
    check(Object.values(distinctDiskCenterEncodedTripletsByView).every((count) => count >= FIXTURE.tolerances.minimumDistinctDiskCenterEncodedTripletsPerView), 'Each view retains multiple distinct disk-center encoded colors across the bracket and clock conditions.');

    const proof = {
      proofId: 'camera-fixed-exposure-stage8b-v1',
      acceptedForOwnerReview: true,
      appearanceAccepted: false,
      assertions,
      summary: {
        frameCount: frames.length,
        sourcePixelCount: views.reduce((sum, view) => sum + view.input.widthPixels * view.input.heightPixels * CONDITIONS.length, 0),
        renderedPixelCount: frames.reduce((sum, frame) => sum + frame.pixelCount, 0),
        anchor,
        stops: FIXTURE.exposure.stops,
        wideNoonDiskCenterPreclipRedBlueRatio: noonRatio,
        wideSunsetDiskCenterPreclipRedBlueRatio: sunsetRatio,
        sunsetNoonPreclipRedBlueRatioFactor: ratioFactor,
        distinctDiskCenterEncodedTripletsByView,
        totalDisplayLowClippedPixels: frames.reduce((sum, frame) => sum + frame.displayLowClippedPixelCount, 0),
        totalDisplayHighClippedPixels: frames.reduce((sum, frame) => sum + frame.displayHighClippedPixelCount, 0),
        totalExactWhitePixels: frames.reduce((sum, frame) => sum + frame.exactWhitePixelCount, 0),
      },
      claimLimit: FIXTURE.claimLimit,
      nextDecision: 'project-owner full-context appearance review before Stage 8c',
    };
    const derivation = {
      schemaId: 'camera-stage8b-derivation-v1',
      parents: {
        compiledProfile: profileParent,
        productionSpectra: views.flatMap((view) => view.parents),
      },
      operations: [
        { id: 'relative-camera-projection', equation: 'raw[c] = sum_i L[i] * K[c,i]' },
        { id: 'camera-characterization', equation: 'XYZ_D65 = M_sensor_to_XYZ_D65 * raw' },
        { id: 'exposure-anchor', equation: 'zeroStopScale = 0.18 / median_positive(XYZ_D65.Y over complete wide noon field)' },
        { id: 'fixed-exposure', equation: 'exposed = unexposed * zeroStopScale * 2^stop; identical scale for both views and every clock condition' },
        { id: 'output-conversion', equation: 'linearRec709_D65 = M_XYZ_to_Rec709 * exposedXYZ_D65' },
        { id: 'display-boundary', equation: 'displayLinear = clamp(linearRec709_D65, 0, 1); no raw clipping or tone curve' },
        { id: 'display-encoding', equation: 'IEC 61966-2-1 sRGB transfer function per display channel' },
      ],
      implementations: {
        runner: {
          path: 'scripts/extraterrestrial/runners/run-camera-fixed-exposure-stage8b.js',
          sha256: await sha256File(import.meta.filename),
        },
        profileHelper: {
          path: 'scripts/extraterrestrial/color/RelativeCameraSpectralProfile.js',
          sha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'RelativeCameraSpectralProfile.js')),
        },
        fixture: {
          path: 'scripts/extraterrestrial/fixtures/camera-fixed-exposure-stage8b-v1.json',
          sha256: await sha256File(FIXTURE_PATH),
        },
      },
      tools: { node: process.version },
      parameters: {
        exposure: FIXTURE.exposure,
        development: FIXTURE.development,
      },
      resultPaths: [
        'evidence/stage8b-full-frame.json',
        'evidence/stage8b-proof.json',
        'renders/',
      ],
      resultIdentityOwner: 'artifact-manifest.json',
    };
    await run.writeJsonArtifact('evidence/stage8b-full-frame.json', {
      schemaId: 'camera-stage8b-full-frame-result-v1',
      exposure: { ...FIXTURE.exposure, ...anchor },
      development: FIXTURE.development,
      frames,
    });
    await run.writeJsonArtifact('evidence/derivation.json', derivation);
    await run.writeJsonArtifact('evidence/stage8b-proof.json', proof);

    const closure = await buildStaticModuleClosure({
      candidateRoot: EXPERIMENT_ROOT,
      entryFiles: [
        'runners/run-camera-fixed-exposure-stage8b.js',
        'color/RelativeCameraSpectralProfile.js',
      ],
      packageJsonPath: EXPERIMENT_PACKAGE_PATH,
      nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
      allowedNodeBuiltins: [
        'node:child_process',
        'node:crypto',
        'node:fs',
        'node:fs/promises',
        'node:module',
        'node:os',
        'node:path',
        'node:url',
        'node:util',
        'node:zlib',
      ],
    });
    const after = await createProtectedTrackedInventory(policy);
    assertFileInventoriesEqual(before, after, 'Stage 8b protected inventory');
    proof.containment = {
      protectedFiles: after.fileCount,
      closureFileCount: closure.files.length,
      closureEdgeCount: closure.edges.length,
    };
    const manifest = await run.finalize({
      conclusion: 'accepted',
      result: proof,
      report: `# ${run.runId}: fixed-exposure full-frame camera proof

Conclusion: **technically accepted for project-owner Stage 8b appearance review**.

- Complete production source pixels: ${proof.summary.sourcePixelCount}.
- Rendered bracket pixels: ${proof.summary.renderedPixelCount} across ${proof.summary.frameCount} frames.
- Exposure anchor Y / zero-stop scale: ${anchor.anchorY} / ${anchor.zeroStopScale}.
- Stops: ${FIXTURE.exposure.stops.join(', ')}.
- Wide sunset/noon preclip disk-center red-blue ratio factor: ${ratioFactor}.
- Display low/high clipped pixel totals: ${proof.summary.totalDisplayLowClippedPixels} / ${proof.summary.totalDisplayHighClippedPixels}.
- Exact-white total: ${proof.summary.totalExactWhitePixels}.

Raw clipping is intentionally disabled because Stage 8a's PBRT response has arbitrary relative scale. This run makes no physical sensor or Canon-body claim. Appearance remains for project-owner review.
`,
    });
    process.stdout.write(`${JSON.stringify({
      runId: run.runId,
      conclusion: 'accepted',
      artifactSetSha256: manifest.artifactSetSha256,
      summary: proof.summary,
    }, null, 2)}\n`);
  } catch (error) {
    const detail = { name: error.name, message: error.message, stack: error.stack };
    try {
      await run.writeJsonArtifact('evidence/failure.json', detail);
      const manifest = await run.finalize({
        conclusion: 'failed',
        result: { error: detail },
        report: `# ${run.runId}: fixed-exposure full-frame camera proof

Conclusion: **failed**.

${detail.message}
`,
      });
      process.stderr.write(`${JSON.stringify({
        runId: run.runId,
        conclusion: 'failed',
        artifactSetSha256: manifest.artifactSetSha256,
        error: detail,
      }, null, 2)}\n`);
    } catch {}
    process.exitCode = 1;
  }
}

await main();
