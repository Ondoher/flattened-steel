import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
import {StrobingRun} from './StrobingRun.js';

/** Bounded, deterministic media conversion and display-code measurement. */
export class StrobingMedia {
	/** @param {StrobingRun} run Newly allocated output owner. */
	constructor(run) {
		this.run = run;
	}

	/**
	 * Execute the pinned media binary and retain command/error evidence.
	 * @param {string} name Safe operation name.
	 * @param {string[]} args FFmpeg arguments, passed without a shell.
	 * @param {(chunk: Buffer) => void} [consume] Streaming stdout consumer.
	 * @returns {Promise<void>}
	 */
	async execute(name, args, consume = () => {}) {
		if (typeof ffmpeg !== 'string') throw new Error('FFmpeg binary is unavailable for this platform.');
		const executable = await StrobingRun.checkedPath(
			StrobingRun.repositoryRoot,
			path.relative(StrobingRun.repositoryRoot, ffmpeg),
		);
		await this.run.writeJson(`${name}-command.json`, {
			executable,
			arguments: args,
			binary: await StrobingRun.identity(
				StrobingRun.repositoryRoot,
				path.relative(StrobingRun.repositoryRoot, executable),
			),
		});
		const child = spawn(executable, ['-hide_banner', '-nostdin', ...args], {
			windowsHide: true,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		let stderr = '';
		child.stderr.on('data', (chunk) => {
			stderr = (stderr + chunk.toString()).slice(-2_000_000);
		});
		const completion = new Promise((resolve, reject) => {
			child.once('error', reject);
			child.once('close', (code) =>
				code === 0
					? resolve(undefined)
					: reject(new Error(`FFmpeg ${name} exited ${code}: ${stderr.slice(-3000)}`)),
			);
		});
		// Attach a rejection handler before reading the stream to avoid an unhandled exit.
		void completion.catch(() => {});
		try {
			for await (const chunk of child.stdout) consume(chunk);
			await completion;
		} finally {
			if (child.exitCode === null) child.kill();
			await writeFile(path.join(this.run.directory, `${name}-stderr.txt`), stderr, {flag: 'wx'});
		}
	}

	/**
	 * Measure every decoded frame at the same resolution and masks as the parent diagnosis.
	 * @param {string} name Evidence operation name.
	 * @param {string[]} inputArguments Validated image-sequence or video input arguments.
	 * @param {number} expectedFrames Required complete frame count.
	 * @returns {Promise<StrobingPixelFrame[]>}
	 */
	async measure(name, inputArguments, expectedFrames) {
		const width = 320,
			height = 180,
			frameBytes = width * height * 3;
		let pending = Buffer.alloc(0);
		/** @type {Buffer | undefined} */ let previous;
		/** @type {Buffer | undefined} */ let beforePrevious;
		/** @type {StrobingPixelFrame[]} */ const frames = [];
		await this.execute(
			name,
			[
				...inputArguments,
				'-an',
				'-vf',
				'scale=320:180:flags=area,showinfo',
				'-pix_fmt',
				'rgb24',
				'-fps_mode',
				'passthrough',
				'-f',
				'rawvideo',
				'pipe:1',
			],
			(chunk) => {
				pending = Buffer.concat([pending, chunk]);
				while (pending.length >= frameBytes) {
					const frame = Buffer.from(pending.subarray(0, frameBytes));
					pending = pending.subarray(frameBytes);
					/** @type {StrobingPixelFrame} */ const result = {frameIndex: frames.length, regions: {}};
					for (const [region, from, to] of [
						['full', 0, height],
						['upper', 0, 60],
						['horizon', 60, 120],
						['lower', 120, 180],
					]) {
						let red = 0,
							green = 0,
							blue = 0,
							adjacent = 0,
							curvature = 0;
						for (let offset = Number(from) * width * 3; offset < Number(to) * width * 3; offset += 3) {
							red += frame[offset];
							green += frame[offset + 1];
							blue += frame[offset + 2];
							for (let channel = 0; channel < 3; channel += 1) {
								if (previous)
									adjacent += Math.abs(frame[offset + channel] - previous[offset + channel]);
								if (previous && beforePrevious)
									curvature += Math.abs(
										frame[offset + channel] -
											2 * previous[offset + channel] +
											beforePrevious[offset + channel],
									);
							}
						}
						const count = (Number(to) - Number(from)) * width;
						result.regions[region] = {
							meanRed: red / count,
							meanGreen: green / count,
							meanBlue: blue / count,
							meanLuma: (0.2126 * red + 0.7152 * green + 0.0722 * blue) / count,
							adjacentRgbMeanAbsolute: previous ? adjacent / (3 * count) : null,
							previousFrameRgbCurvature: beforePrevious ? curvature / (3 * count) : null,
						};
					}
					frames.push(result);
					beforePrevious = previous;
					previous = frame;
					if (frames.length > expectedFrames) throw new Error('Decoded more frames than the declared input.');
				}
			},
		);
		if (pending.length !== 0 || frames.length !== expectedFrames)
			throw new Error(
				`Decoded ${frames.length} frames with ${pending.length} trailing bytes; expected ${expectedFrames}.`,
			);
		await this.run.writeJson(`${name}-pixels.json`, {width, height, pixelFormat: 'rgb24', frames});
		return frames;
	}

	/**
	 * Compare cache-adjacent and stable temporal curvature without changing pinned thresholds.
	 * @param {StrobingPixelFrame[]} pixels Ordered decoded measurements.
	 * @param {StrobingMeasuredSceneFrame[]} scene Matching cache/astronomy trace.
	 * @returns {StrobingTemporalResult}
	 */
	static evaluate(pixels, scene) {
		if (pixels.length !== scene.length) throw new Error('Scene and pixel traces do not align.');
		const boundaries = scene.flatMap((frame, index) =>
			index > 0 &&
			(frame.sharedScene ?? frame.cacheIdentity) !==
				(scene[index - 1].sharedScene ?? scene[index - 1].cacheIdentity)
				? [index]
				: [],
		);
		/** @type {StrobingTemporalResult} */ const result = {boundaries, regions: {}, pass: true};
		for (const name of ['full', 'upper', 'horizon', 'lower']) {
			const events = pixels.slice(1, -1).map((frame, offset) => {
				const index = offset + 1;
				const incoming = frame.regions[name].meanLuma - pixels[index - 1].regions[name].meanLuma;
				const outgoing = pixels[index + 1].regions[name].meanLuma - frame.regions[name].meanLuma;
				return {
					index,
					luma: frame.regions[name].meanLuma,
					incoming,
					outgoing,
					reversal: incoming * outgoing < 0,
					curvature: Math.abs(outgoing - incoming),
					cacheAdjacent: boundaries.includes(index) || boundaries.includes(index + 1),
					rgbCurvature: pixels[index + 1].regions[name].previousFrameRgbCurvature,
				};
			});
			const adjacent = events.filter((event) => event.cacheAdjacent),
				stable = events.filter((event) => !event.cacheAdjacent);
			if (!adjacent.length || !stable.length)
				throw new Error('Control lacks cache boundaries or stable intervals.');
			const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
			const boundaryMean = mean(adjacent.map((event) => event.curvature));
			const stableMean = mean(stable.map((event) => event.curvature));
			const ratio = stableMean === 0 ? (boundaryMean === 0 ? 1 : Number.MAX_VALUE) : boundaryMean / stableMean;
			const strongest = [...events]
				.sort((a, b) => b.curvature - a.curvature)
				.slice(0, Math.min(40, Math.ceil(events.length / 10)));
			const reversingBoundaryPeaks = strongest.filter((event) => event.cacheAdjacent && event.reversal).length;
			// One publication can produce extrema on both sides of a single pulse.
			// Recurrence counts distinct physical publications, retaining every raw extremum.
			const reversingPublications = [
				...new Set(
					strongest
						.filter((event) => event.cacheAdjacent && event.reversal)
						.flatMap((event) =>
							boundaries.filter((boundary) => boundary === event.index || boundary === event.index + 1),
						),
				),
			];
			result.regions[name] = {
				boundaryMean,
				stableMean,
				ratio,
				strongest,
				reversingBoundaryPeaks,
				reversingPublications,
				boundaryFraction: adjacent.length / events.length,
				pass: ratio <= 1.5 && reversingPublications.length <= 1,
			};
			result.pass &&= result.regions[name].pass;
		}
		return result;
	}
}
