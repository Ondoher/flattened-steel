import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, {describe} from 'node:test';

import {
	AnimationTrace,
	BoundedChunkSink,
	DeterministicCanvasRecorder,
	DiagnosticPlayerDocument,
	DiagnosticTimeline,
	FixedCadenceReplay,
	MediabunnyCanvasOutput,
} from './index.js';
import {ArtifactManifest} from './node.js';

const fixture = JSON.parse(
	await import('node:fs/promises').then(({readFile}) =>
		readFile(new URL('./fixtures/s9-fov55-trace-slice.json', import.meta.url), 'utf8'),
	),
);

describe('Animation evidence', () => {
	describe('Trace capture and cadence', () => {
		test('sealed S9 trace slice reproduces the oracle fixed-cadence holds and jumps', () => {
			const mapping = FixedCadenceReplay.latestFrameAtOrBefore({
				sourceFrames: fixture.frames,
				outputFrameCount: 12,
				outputFramesPerSecond: 60,
				getSourceTimestampMicroseconds: (frame) => frame.animationCallbackMicroseconds,
				getSourceFrameId: (frame) => frame.frameId,
				projectState: (frame) => ({cacheSceneDegrees: frame.cacheSceneDegrees, transition: frame.transition}),
				mappingEquationId: 's9-trace-latest-callback-not-after-slot-v1',
			});
			assert.deepEqual(
				mapping.map((entry) => entry.sourceFrameId),
				fixture.oracle.firstTwelveSourceFrameIds,
			);
			assert.deepEqual(
				mapping.map((entry) => entry.timestampMicroseconds),
				[0, 16667, 33333, 50000, 66667, 83333, 100000, 116667, 133333, 150000, 166667, 183333],
			);
			assert.equal(mapping[1].heldFromPreviousSlot, true);
			assert.equal(mapping[2].measuredFrameAdvance, 2);
			assert.deepEqual(
				FixedCadenceReplay.latestFrameAtOrBefore({
					...{
						sourceFrames: fixture.frames,
						outputFrameCount: 12,
						outputFramesPerSecond: 60,
						getSourceTimestampMicroseconds: (frame) => frame.animationCallbackMicroseconds,
						getSourceFrameId: (frame) => frame.frameId,
						projectState: (frame) => ({
							cacheSceneDegrees: frame.cacheSceneDegrees,
							transition: frame.transition,
						}),
					},
				}),
				FixedCadenceReplay.latestFrameAtOrBefore({
					sourceFrames: fixture.frames,
					outputFrameCount: 12,
					outputFramesPerSecond: 60,
					getSourceTimestampMicroseconds: (frame) => frame.animationCallbackMicroseconds,
					getSourceFrameId: (frame) => frame.frameId,
					projectState: (frame) => ({
						cacheSceneDegrees: frame.cacheSceneDegrees,
						transition: frame.transition,
					}),
				}),
			);
		});

		test('synthetic callback tracing and GPU sample association stay caller-owned', async () => {
			const callbacks = [100, 116.7, 133.4];
			let callbackIndex = 0;
			const frames = await AnimationTrace.capture({
				durationMicroseconds: 33_400,
				requestFrame: (callback) => {
					queueMicrotask(() => callback(callbacks[callbackIndex++]));
					return callbackIndex;
				},
				nowMilliseconds: () => callbacks[Math.min(callbackIndex, callbacks.length - 1)],
				stateAt: (elapsed) => ({elapsed}),
				render: (state, frameId) => ({frameId, state}),
			});
			assert.deepEqual(
				frames.map((frame) => frame.animationCallbackMicroseconds),
				[0, 16700, 33400],
			);
			const annotated = AnimationTrace.associateSamples(
				frames,
				[
					{frame: 0, kind: 'cpu'},
					{frame: 0, kind: 'gpu'},
					{frame: 2, kind: 'gpu'},
				],
				(frame) => frame.frameId,
				(sample) => sample.frame,
			);
			assert.deepEqual(
				annotated.map((frame) => frame.associatedSamples?.length),
				[2, 0, 1],
			);
			assert.equal(AnimationTrace.summarizeCadence(frames, 60).expectedPresentationSlotCount, 3);
		});
	});

	describe('Deterministic recording', () => {
		test('deterministic recorder renders changed states, retains holds, and finalizes output', async () => {
			const mapping = FixedCadenceReplay.latestFrameAtOrBefore({
				sourceFrames: fixture.frames,
				outputFrameCount: 12,
				outputFramesPerSecond: 60,
				getSourceTimestampMicroseconds: (frame) => frame.animationCallbackMicroseconds,
				getSourceFrameId: (frame) => frame.frameId,
				projectState: (frame) => frame,
			});
			let calls = [];
			const canvas = {};
			const recorder = new DeterministicCanvasRecorder({
				mapping,
				framesPerSecond: 60,
				presentationCanvas: canvas,
				videoOutput: {
					start: () => calls.push('start'),
					addFrame: (_canvas, timestamp, duration, options) => calls.push({timestamp, duration, options}),
					finalize: () => calls.push('finalize'),
					getResult: () => ({packetCount: mapping.length}),
				},
				render: (entry) => calls.push(`render:${entry.sourceFrameId}`),
				capture: (entry) => `capture:${entry.slotIndex}`,
				captureSlots: new Set([0, 11]),
			});
			const result = await recorder.record();
			assert.equal(result.frameCount, 12);
			assert.equal(result.renderedSourceStateCount, 8);
			assert.equal(result.heldOutputSlotCount, 4);
			assert.deepEqual(
				result.captures.map((entry) => entry.result),
				['capture:0', 'capture:11'],
			);
			assert.equal(calls.filter((entry) => typeof entry === 'object').length, 12);
			assert.equal(calls.at(-1), 'finalize');
		});

		for (const failingStage of ['start', 'render', 'capture', 'addFrame', 'finalize']) {
			test(`recording failure at ${failingStage} aborts its owned output and preserves the cause`, async () => {
				const failure = new Error(`Failed ${failingStage}`);
				let calls = [];
				const operation = (stage) => {
					calls.push(stage);
					if (stage === failingStage) throw failure;
				};
				const recorder = new DeterministicCanvasRecorder({
					mapping: [{slotIndex: 0, timestampMicroseconds: 0}],
					framesPerSecond: 30,
					presentationCanvas: {},
					videoOutput: {
						start: () => operation('start'),
						addFrame: () => operation('addFrame'),
						finalize: () => operation('finalize'),
						getResult: () => operation('getResult'),
						abort: (reason) => {
							assert.equal(reason, failure);
							calls.push('abort');
						},
					},
					render: () => operation('render'),
					capture: () => operation('capture'),
					captureSlots: new Set([0]),
				});
				await assert.rejects(recorder.record(), (error) => error === failure);
				assert.equal(calls.at(-1), 'abort');
				assert.equal(calls.filter((stage) => stage === 'abort').length, 1);
				assert.equal(calls.includes('getResult'), false);
			});
		}

		test('recording cleanup failure retains both the original and cleanup causes', async () => {
			const failure = new Error('Render failed'),
				cleanupFailure = new Error('Encoder cancellation failed');
			const recorder = new DeterministicCanvasRecorder({
				mapping: [{slotIndex: 0, timestampMicroseconds: 0}],
				framesPerSecond: 30,
				presentationCanvas: {},
				videoOutput: {
					start() {},
					addFrame() {},
					finalize() {},
					getResult() {},
					abort() {
						throw cleanupFailure;
					},
				},
				render() {
					throw failure;
				},
			});
			await assert.rejects(
				recorder.record(),
				(error) =>
					error instanceof AggregateError &&
					error.errors[0] === failure &&
					error.errors[1] === cleanupFailure,
			);
		});
	});

	describe('Bounded output transport', () => {
		test('bounded chunk sink preserves bytes, bounds memory, finalizes, and propagates failure', async () => {
			let batches = [];
			let finalized = false;
			const sink = new BoundedChunkSink({
				maximumBatchBytes: 5,
				publishBatch: (bytes, index) => batches.push({index, bytes: [...bytes]}),
				finalize: () => {
					finalized = true;
				},
			});
			const writer = sink.writable().getWriter();
			await writer.write(Uint8Array.from([1, 2, 3]));
			await writer.write(Uint8Array.from([4, 5, 6, 7, 8, 9, 10, 11]));
			await writer.close();
			assert.deepEqual(batches, [
				{index: 0, bytes: [1, 2, 3, 4, 5]},
				{index: 1, bytes: [6, 7, 8, 9, 10]},
				{index: 2, bytes: [11]},
			]);
			assert.equal(finalized, true);
			assert.deepEqual(sink.diagnostics(), {
				batchCount: 3,
				totalByteLength: 11,
				maximumBufferedBytes: 5,
				finalized: true,
			});

			const failing = new BoundedChunkSink({
				maximumBatchBytes: 2,
				publishBatch: () => {
					throw new Error('transport failed');
				},
				finalize: () => undefined,
			});
			await assert.rejects(
				failing
					.writable()
					.getWriter()
					.write(Uint8Array.from([1, 2])),
				/transport failed/u,
			);
		});
	});

	describe('Encoder lifecycle', () => {
		test('Mediabunny adapter uses injected policy and exposes final packet evidence', async () => {
			let calls = [];
			class FakeOutput {
				constructor(options) {
					this.options = options;
					calls.push('construct-output');
				}
				addVideoTrack() {
					calls.push('add-track');
				}
				setMetadataTags() {
					calls.push('metadata');
				}
				async start() {
					calls.push('start');
				}
				async finalize() {
					calls.push('finalize');
				}
				async getMimeType() {
					return 'video/mp4';
				}
			}
			class FakeSource {
				constructor(_canvas, options) {
					this.options = options;
					options.onEncoderConfig({codec: 'avc1.test'});
				}
				async add(timestamp, duration, options) {
					calls.push({timestamp, duration, options});
					this.options.onEncodedPacket({
						type: 'key',
						microsecondTimestamp: timestamp * 1e6,
						microsecondDuration: duration * 1e6,
						sequenceNumber: 0,
						byteLength: 10,
					});
				}
			}
			class FakeValue {
				constructor(options) {
					Object.assign(this, options);
				}
			}
			const canvas = {};
			const output = new MediabunnyCanvasOutput({
				mediabunny: {
					Output: FakeOutput,
					CanvasSource: FakeSource,
					AppendOnlyStreamTarget: FakeValue,
					Mp4OutputFormat: FakeValue,
					Quality: FakeValue,
				},
				canvas,
				writable: new WritableStream(),
				framesPerSecond: 60,
				codec: 'avc',
				fullCodecString: 'avc1.test',
				bitrate: 1_000_000,
				metadata: {title: 'synthetic'},
			});
			await output.start();
			await output.addFrame(canvas, 0, 1 / 60, {keyFrame: true});
			await output.finalize();
			assert.equal(output.getResult().mimeType, 'video/mp4');
			assert.equal(output.getResult().packets.length, 1);
			assert.deepEqual(calls.slice(0, 4), ['construct-output', 'add-track', 'metadata', 'start']);
			assert.equal(calls.at(-1), 'finalize');
		});

		test('Mediabunny adapter cancels partially started output exactly once', async () => {
			const failure = new Error('Encoder startup failed');
			let cancellationCalls = 0;
			class FakeOutput {
				addVideoTrack() {}
				async start() {
					throw failure;
				}
				async cancel() {
					cancellationCalls += 1;
				}
			}
			class FakeValue {}
			const output = new MediabunnyCanvasOutput({
				mediabunny: {
					Output: FakeOutput,
					CanvasSource: FakeValue,
					AppendOnlyStreamTarget: FakeValue,
					Mp4OutputFormat: FakeValue,
					Quality: FakeValue,
				},
				canvas: {},
				writable: new WritableStream(),
				framesPerSecond: 30,
				codec: 'avc',
				bitrate: 1_000_000,
			});
			await assert.rejects(output.start(), (error) => error === failure);
			await output.abort();
			await output.abort();
			assert.equal(cancellationCalls, 1);
			assert.throws(() => output.getResult(), /has not finalized/u);
		});
	});

	describe('Diagnostic presentation', () => {
		test('diagnostic timeline and player disclose holds, caller markers, and provenance', () => {
			const mapping = FixedCadenceReplay.latestFrameAtOrBefore({
				sourceFrames: fixture.frames,
				outputFrameCount: 12,
				outputFramesPerSecond: 60,
				getSourceTimestampMicroseconds: (frame) => frame.animationCallbackMicroseconds,
				getSourceFrameId: (frame) => frame.frameId,
				projectState: (frame) => frame,
			});
			const timeline = DiagnosticTimeline.build(mapping, {
				markers: (entry) => (entry.state.transition ? ['state-transition'] : []),
				details: (entry) => ({cacheSceneDegrees: entry.state.cacheSceneDegrees}),
			});
			assert.deepEqual(DiagnosticTimeline.summarize(timeline), {
				slotCount: 12,
				heldSlotCount: 4,
				sourceJumpCount: 1,
				holdGroupCount: 4,
				maximumHoldGroupSlotCount: 2,
			});
			const html = DiagnosticPlayerDocument.create({
				title: 'Synthetic <diagnostic>',
				subtitle: '60 Hz replay',
				idealVideoUrl: './ideal.mp4',
				traceVideoUrl: './trace.mp4',
				timeline,
				disclosure: 'Recording time is not animation performance.',
				provenance: fixture.parent,
			});
			assert.match(html, /Synthetic &lt;diagnostic&gt;/u);
			assert.match(html, /held-presentation-slot/u);
			assert.match(html, /Recording time is not animation performance/u);
		});
	});

	describe('Artifact authentication', () => {
		test('artifact manifests are sorted and content-addressed', async () => {
			const root = await mkdtemp(path.join(os.tmpdir(), 'animation-evidence-'));
			await mkdir(path.join(root, 'nested'));
			await writeFile(path.join(root, 'z.txt'), 'z');
			await writeFile(path.join(root, 'nested', 'a.txt'), 'a');
			const first = await ArtifactManifest.create(root);
			const second = await ArtifactManifest.create(root);
			assert.deepEqual(first, second);
			assert.deepEqual(
				first.artifacts.map((entry) => entry.path),
				['nested/a.txt', 'z.txt'],
			);
			await ArtifactManifest.verify(root, first);
			await writeFile(path.join(root, 'z.txt'), 'changed');
			await assert.rejects(ArtifactManifest.verify(root, first), /Artifact entries differ/u);
		});
	});
});
