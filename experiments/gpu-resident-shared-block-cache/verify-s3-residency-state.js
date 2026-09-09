#!/usr/bin/env node

import AtlasResidencyState from './browser/AtlasResidencyState.js';
import {frameRecord} from './browser/S3FramePathContract.js';
import {AtlasProbePath, DenseProbePath, sameFloat32} from './browser/S3ProbePaths.js';

const fail = (value, message) => { if (!value) throw new Error(message); };
const state = new AtlasResidencyState(24);
const blocks90 = [10, 11, 24, 25, 39, 40, 41, 54, 55, 56, 69, 70, 71, 84, 85, 86];
const blocks91 = [...blocks90, 26];
const first = state.plan(blocks90, blocks91);
fail(first.added.length === 17 && first.evicted.length === 0, 'Cold forward plan does not retain required plus predicted blocks.');
state.commit(first);
const next = state.plan(blocks91, [...blocks91, 12]);
fail(next.reused.length === 17 && next.added.length === 1, 'Adjacent prefetch plan does not reuse all current scene blocks.');
const record = frameRecord('atlas', 91, next, {decodedBlocks: next.added.length, uploadedBlocks: next.added.length, cpuDecodeMilliseconds: 0, gpuUploadMilliseconds: 0, frameBoundarySwitchMilliseconds: 0, selectionElapsedMilliseconds: 0});
fail(record.reusedBlocks === 17 && record.uploadedBlocks === 1, 'Shared frame record does not preserve atlas reuse measurements.');
const dense = new DenseProbePath(new Float32Array([0, 1.5, -0, 42]));
const atlas = new AtlasProbePath(new Map([[10, new Float32Array([0, 1.5])], [11, new Float32Array([-0, 42])]]));
for (const [denseOrdinal, location] of [[0, {block: 10, ordinal: 0}], [1, {block: 10, ordinal: 1}], [2, {block: 11, ordinal: 0}], [3, {block: 11, ordinal: 1}]]) fail(sameFloat32(dense.probe(denseOrdinal), atlas.probe(location)), 'Dense and atlas probes differ.');
process.stdout.write(`${JSON.stringify({accepted: true, coldAdded: first.added.length, adjacentReused: next.reused.length, adjacentAdded: next.added.length, commonProbeContract: true}, null, 2)}\n`);
