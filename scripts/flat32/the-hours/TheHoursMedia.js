import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
import Files from '../../algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';

/** Pinned independent encoder and unchanged regional decoded-pixel measurements. */
export class TheHoursMedia {
	/** Creates a media owner for one new proof run.
	 *
	 * @param {TheHoursRunCapability} run - Active contained output owner.
	 */
	constructor(run) {
		this._run = run;
	}

	/** Call this method to execute one pinned media operation and retain exact command/tool identities.
	 *
	 * @param {string} name - Safe unique operation name.
	 * @param {readonly string[]} argumentsList - Arguments passed without a shell.
	 * @param {(chunk: Buffer) => void} [consume] - Bounded streaming stdout consumer.
	 * @returns {Promise<void>} - Successful process completion and retained diagnostics.
	 */
	async execute(name, argumentsList, consume = () => {}) {
		if (!/^[a-z][a-z0-9-]*$/u.test(name) || typeof ffmpeg !== 'string')
			throw new Error('Invalid media operation or unavailable binary.');
		const files = new Files(this._run.repositoryRoot);
		const relative = path.relative(this._run.repositoryRoot, ffmpeg).replaceAll('\\', '/');
		const executable = await files.resolve(relative),
			bytes = await readFile(executable);
		await this._run.writeJson(`${name}-command.json`, {
			executable: relative,
			arguments: ['-hide_banner', '-nostdin', ...argumentsList],
			binary: {byteLength: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')},
		});
		const child = spawn(executable, ['-hide_banner', '-nostdin', ...argumentsList], {
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
		void completion.catch(() => {});
		try {
			for await (const chunk of child.stdout) consume(chunk);
			await completion;
		} finally {
			if (child.exitCode === null) child.kill();
			await this._run.write(`${name}-stderr.txt`, stderr);
		}
	}

	/** Call this method to measure every decoded frame with the original masks and arithmetic.
	 * The default 320 by 180 area reduction preserves the retained encoded detector.
	 * Native lossless validation passes the original dimensions, avoiding resampling.
	 *
	 * @param {string} name - Unique operation identity.
	 * @param {readonly string[]} inputArguments - Checked image sequence or video input arguments.
	 * @param {number} expectedFrames - Required complete presentation count.
	 * @param {TheHoursMediaDimensions} [dimensions] - Native dimensions or the original encoded detector scale.
	 * @returns {Promise<TheHoursPixelFrame[]>} - Every decoded regional measurement.
	 */
	async measure(name, inputArguments, expectedFrames, dimensions = {width: 320, height: 180}) {
		const {width, height} = dimensions,
			frameBytes = width * height * 3;
		if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || height % 3 !== 0)
			throw new Error('Invalid decoded measurement dimensions.');
		let pending = Buffer.alloc(0);
		/** Prior decoded pixels. @type {Buffer | undefined} */ let previous;
		/** Pixels two presentations earlier. @type {Buffer | undefined} */ let beforePrevious;
		/** Complete retained regional source measurements. @type {TheHoursPixelFrame[]} */ let frames = [];
		await this.execute(
			name,
			[
				...inputArguments,
				'-an',
				'-vf',
				`scale=${width}:${height}:flags=area,showinfo`,
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
					/** One exact ordered decoded frame. @type {TheHoursPixelFrame} */ let result = {
						frameIndex: frames.length,
						regions: {},
					};
					for (const [region, from, to] of [
						['full', 0, height],
						['upper', 0, height / 3],
						['horizon', height / 3, (2 * height) / 3],
						['lower', (2 * height) / 3, height],
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
				`Decoded ${frames.length} frames and ${pending.length} trailing bytes; expected ${expectedFrames}.`,
			);
		await this._run.writeJson(`${name}-pixels.json`, {width, height, pixelFormat: 'rgb24', frames});
		return frames;
	}
}
