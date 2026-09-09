#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const CONTROL = 'experiments/gpu-resident-shared-block-cache/controls/s0-s2-animation-atlas-contract-v2.json';
const runs = ['1788887946682-s4-exact-atlas', '1788907211015-s5-animation-measurement'];
const fail = (value, message) => { if (!value) throw new Error(message); };
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

for (const runId of runs) for (const name of ['command.txt', 'inputs.json', 'provenance.json', 'environment.json', 'progress.jsonl', 'browser-result.json', 'result.json']) fail((await stat(path.join(OUTPUT_ROOT, 'runs', runId, name))).isFile(), `${runId} lacks ${name}.`);
const control = await readFile(path.join(REPOSITORY_ROOT, ...CONTROL.split('/')));
const s4 = JSON.parse(await readFile(path.join(OUTPUT_ROOT, 'runs', runs[0], 'result.json')));
const s5 = JSON.parse(await readFile(path.join(OUTPUT_ROOT, 'runs', runs[1], 'result.json')));
fail(s4.accepted && s4.browser.mismatches === 0 && Object.values(s4.browser.lifecycleControls).every(Boolean), 'S4 exactness or lifecycle evidence failed.');
const frames = s5.browser.frames;
fail(s5.accepted && frames.length === 6, 'S5 frame evidence is incomplete.');
fail(frames[1].reusedBlocks === 17 && frames[1].uploadedBlocks === 1 && frames[2].reusedBlocks === 18 && frames[2].uploadedBlocks === 0 && frames[3].reusedBlocks === 17 && frames[3].uploadedBlocks === 0, 'S5 adjacent reuse evidence differs from the frozen sequence.');
fail(frames[2].denseTextureAddressable === false, 'S5 dense capacity finding is absent.');
fail(
	s5.nodeMeasurement.nodeZstandardMilliseconds > 0 &&
		s5.nodeMeasurement.nodeInverseShuffleMilliseconds > 0 &&
		s5.nodeMeasurement.peakRssBytes > 0 &&
		s5.summary.totalEncodedTransferBytes > 0 &&
		s5.summary.totalDenseGpuUploadMilliseconds > 0 &&
		s5.summary.peakBrowserMainBytes > 0,
	'S5 separated decoder, transfer, dense GPU baseline, or peak-memory evidence is incomplete.',
);
fail(frames[2].denseTileCount === 2, 'S5 tiled dense 92-degree baseline changed.');
fail(s5.summary.adjacentReuseAccepted === true, 'S5 adjacent-reuse conclusion changed.');
process.stdout.write(`${JSON.stringify({accepted: true, control: {path: CONTROL, sha256: sha256(control)}, exactnessRun: runs[0], measurementRun: runs[1], classification: 'accepted-contained-experiment-evidence', reason: 'Canonical S5 v2 separates Zstandard, inverse shuffle, transfer, dense reconstruction/upload, predictor outcomes, and browser/Node peak memory while retaining the fixed 24-block residency budget.'}, null, 2)}\n`);
