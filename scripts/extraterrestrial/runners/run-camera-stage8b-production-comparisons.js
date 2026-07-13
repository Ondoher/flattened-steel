#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';

import FIXTURE from '../fixtures/camera-stage8b-production-comparison-v1.json' with { type: 'json' };
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

const COMMAND = 'node scripts/extraterrestrial/runners/run-camera-stage8b-production-comparisons.js';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'camera-stage8b-production-comparison-v1.json');
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function requireCondition(value, message) {
  if (!value) throw new Error(message);
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

function paeth(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

function decodePng(bytes) {
  requireCondition(bytes.subarray(0, 8).equals(PNG_SIGNATURE), 'PNG signature is invalid.');
  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  let interlace;
  const idat = [];
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  requireCondition(
    width > 0 && height > 0 && bitDepth === 8 && colorType === 6 && interlace === 0,
    'Only non-interlaced 8-bit RGBA PNG inputs are supported.',
  );
  const packed = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  requireCondition(packed.length === (stride + 1) * height, 'PNG scanline length is invalid.');
  const rgba = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = packed[y * (stride + 1)];
    requireCondition(filter >= 0 && filter <= 4, 'PNG filter is unsupported.');
    for (let x = 0; x < stride; x += 1) {
      const encoded = packed[y * (stride + 1) + 1 + x];
      const left = x >= 4 ? rgba[y * stride + x - 4] : 0;
      const up = y > 0 ? rgba[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= 4 ? rgba[(y - 1) * stride + x - 4] : 0;
      const predictor = filter === 0
        ? 0
        : filter === 1
          ? left
          : filter === 2
            ? up
            : filter === 3
              ? Math.floor((left + up) / 2)
              : paeth(left, up, upperLeft);
      rgba[y * stride + x] = (encoded + predictor) & 255;
    }
  }
  return { width, height, rgba };
}

function encodePng(width, height, rgbaTopDown) {
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
    rgbaTopDown.copy(rows, target + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(rows, { level: 9 })),
    pngChunk('IEND'),
  ]);
}

function composePair(production, camera) {
  requireCondition(
    production.width === camera.width && production.height === camera.height,
    'Production and camera image dimensions differ.',
  );
  const divider = FIXTURE.layout.dividerPixels;
  const outputWidth = production.width * 2 + divider;
  const output = Buffer.alloc(outputWidth * production.height * 4);
  const dividerPixel = Buffer.from(FIXTURE.layout.dividerRgba);
  for (let y = 0; y < production.height; y += 1) {
    const inputStart = y * production.width * 4;
    const outputStart = y * outputWidth * 4;
    production.rgba.copy(output, outputStart, inputStart, inputStart + production.width * 4);
    for (let x = 0; x < divider; x += 1) {
      dividerPixel.copy(output, outputStart + (production.width + x) * 4);
    }
    camera.rgba.copy(
      output,
      outputStart + (production.width + divider) * 4,
      inputStart,
      inputStart + camera.width * 4,
    );
  }
  const left = Buffer.alloc(production.rgba.length);
  const right = Buffer.alloc(camera.rgba.length);
  for (let y = 0; y < production.height; y += 1) {
    const outputStart = y * outputWidth * 4;
    const targetStart = y * production.width * 4;
    output.copy(left, targetStart, outputStart, outputStart + production.width * 4);
    output.copy(
      right,
      targetStart,
      outputStart + (production.width + divider) * 4,
      outputStart + outputWidth * 4,
    );
  }
  requireCondition(left.equals(production.rgba), 'Production pixels changed during composition.');
  requireCondition(right.equals(camera.rgba), 'Camera pixels changed during composition.');
  return {
    width: outputWidth,
    height: production.height,
    png: encodePng(outputWidth, production.height, output),
  };
}

async function loadRun(runId, artifactSetSha256, label) {
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

async function loadArtifact(source, relativePath) {
  const entry = source.manifest.artifacts.find((artifact) => artifact.path === relativePath);
  requireCondition(entry, `${source.manifest.runId} lacks ${relativePath}.`);
  const absolutePath = path.join(source.root, ...relativePath.split('/'));
  requireCondition(await sha256File(absolutePath) === entry.sha256, `${relativePath} changed.`);
  return {
    bytes: await readFile(absolutePath),
    parent: {
      runId: source.manifest.runId,
      artifactSetSha256: source.manifest.artifactSetSha256,
      path: relativePath,
      sha256: entry.sha256,
      byteLength: entry.byteLength,
    },
  };
}

function exposureFile(stop) {
  return `ev-${stop >= 0 ? '+' : ''}${stop}.png`;
}

async function main() {
  const run = await initializeRunRecord({
    slug: 'camera-stage8b-production-comparisons',
    command: COMMAND,
    inputs: {
      fixture: 'scripts/extraterrestrial/fixtures/camera-stage8b-production-comparison-v1.json',
      cameraRun: FIXTURE.cameraRun,
      productionRuns: FIXTURE.productionRuns,
      scope: 'pixel-preserving side-by-side presentation only; no rendering, color transform, resampling, or source modification',
    },
    provenance: {
      operation: 'decode verified RGBA8 PNG sources; concatenate production left, fixed divider, Stage 8b camera right; re-encode losslessly',
      derivationPolicy: 'retain every parent identity and hash, exact layout, compositor identity, output paths, and immutable result identity',
    },
    environment: { node: process.version, platform: process.platform },
    references: {
      plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md',
      architecture: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
    },
  });
  try {
    await assertRepositoryIdentity();
    const policy = await loadContainmentPolicy();
    const before = await createProtectedTrackedInventory(policy);
    await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
    const [cameraSource, productionSources] = await Promise.all([
      loadRun(FIXTURE.cameraRun.runId, FIXTURE.cameraRun.artifactSetSha256, 'Stage 8b camera run'),
      Promise.all(FIXTURE.productionRuns.map((source) => loadRun(
        source.runId,
        source.artifactSetSha256,
        `${source.viewId} production run`,
      ))),
    ]);

    const comparisons = [];
    const parents = [];
    for (const productionConfig of FIXTURE.productionRuns) {
      const productionSource = productionSources.find(
        (source) => source.manifest.runId === productionConfig.runId,
      );
      for (const conditionId of FIXTURE.conditions) {
        const productionArtifact = await loadArtifact(
          productionSource,
          `renders/${conditionId}.png`,
        );
        const production = decodePng(productionArtifact.bytes);
        parents.push(productionArtifact.parent);
        for (const stop of FIXTURE.stops) {
          const cameraPath = `renders/${productionConfig.viewId}/${conditionId}/${exposureFile(stop)}`;
          const cameraArtifact = await loadArtifact(cameraSource, cameraPath);
          const camera = decodePng(cameraArtifact.bytes);
          const pair = composePair(production, camera);
          const outputPath = `comparisons/${productionConfig.viewId}/${conditionId}/${exposureFile(stop)}`;
          await run.writeArtifact(outputPath, pair.png);
          parents.push(cameraArtifact.parent);
          comparisons.push({
            viewId: productionConfig.viewId,
            conditionId,
            stop,
            outputPath,
            widthPixels: pair.width,
            heightPixels: pair.height,
            production: productionArtifact.parent,
            camera: cameraArtifact.parent,
            layout: FIXTURE.layout,
            pixelIdentityVerified: true,
          });
        }
      }
    }
    requireCondition(comparisons.length === 32, 'The complete 32-image comparison set was not produced.');
    requireCondition(comparisons.every((comparison) => comparison.widthPixels === 1298 && comparison.heightPixels === 401), 'A comparison has unexpected dimensions.');
    requireCondition(comparisons.every((comparison) => comparison.pixelIdentityVerified), 'A source pixel identity check failed.');

    const derivation = {
      schemaId: 'camera-stage8b-production-comparison-derivation-v1',
      parents,
      operation: {
        equation: 'outputRow = productionRGBA8 || 16px [32,32,32,255] divider || cameraRGBA8',
        decode: 'lossless PNG inflate and reversal of PNG filters 0-4',
        encode: 'lossless RGBA8 non-interlaced PNG with filter 0 and zlib level 9',
        resampling: false,
        colorOperation: false,
      },
      implementation: {
        runner: 'scripts/extraterrestrial/runners/run-camera-stage8b-production-comparisons.js',
        runnerSha256: await sha256File(import.meta.filename),
        fixture: 'scripts/extraterrestrial/fixtures/camera-stage8b-production-comparison-v1.json',
        fixtureSha256: await sha256File(FIXTURE_PATH),
        node: process.version,
      },
      resultPaths: comparisons.map((comparison) => comparison.outputPath),
      resultIdentityOwner: 'artifact-manifest.json',
    };
    const proof = {
      proofId: 'camera-stage8b-production-comparisons-v1',
      accepted: true,
      assertions: [
        'All 32 Stage 8b renders have a matching accepted production reference.',
        'Every comparison is 1298 x 401 with production left and Stage 8b camera right.',
        'Decoded source pixels are byte-identical after composition; no scaling or color operation occurs.',
      ],
      summary: {
        comparisonCount: comparisons.length,
        views: FIXTURE.productionRuns.map((source) => source.viewId),
        conditions: FIXTURE.conditions,
        stops: FIXTURE.stops,
        outputWidthPixels: 1298,
        outputHeightPixels: 401,
      },
      claimLimit: 'Presentation comparison only; production and Stage 8b scientific claims remain owned by their source runs.',
    };
    await run.writeJsonArtifact('evidence/comparisons.json', {
      schemaId: 'camera-stage8b-production-comparisons-v1',
      comparisons,
    });
    await run.writeJsonArtifact('evidence/derivation.json', derivation);
    await run.writeJsonArtifact('evidence/proof.json', proof);

    const closure = await buildStaticModuleClosure({
      candidateRoot: EXPERIMENT_ROOT,
      entryFiles: ['runners/run-camera-stage8b-production-comparisons.js'],
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
    assertFileInventoriesEqual(before, after, 'Stage 8b comparison protected inventory');
    proof.containment = {
      protectedFiles: after.fileCount,
      closureFileCount: closure.files.length,
      closureEdgeCount: closure.edges.length,
    };
    const manifest = await run.finalize({
      conclusion: 'accepted',
      result: proof,
      report: `# ${run.runId}: production / Stage 8b side-by-side comparisons

Conclusion: **accepted as pixel-preserving presentation evidence**.

All ${comparisons.length} comparisons place the accepted production GPU image
on the left and the matching Stage 8b fixed-exposure image on the right,
separated by a ${FIXTURE.layout.dividerPixels}-pixel neutral divider. Source
pixels are unchanged; no resampling or color operation occurs.
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
        report: `# ${run.runId}: production / Stage 8b side-by-side comparisons

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
