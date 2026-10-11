import path from 'node:path';
import {readFile, access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {Input, FilePathSource, ALL_FORMATS, EncodedPacketSink} from 'mediabunny';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, outputRoot, checkPath, hash, hashFile} from './run-boundary.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';

/** Independently decode every presentation and qualify the frozen film/guard pair.
 * @returns {Promise<void>} - New evidence and compact review copy; parent files stay immutable.
 */
async function main() {
	await requireHeavyExecution();
	const run = await ExperimentRun.create('p6-film-report');
	let failure = null;
	try {
		if (process.argv.length !== 4) throw new Error('Film run and matching resource run required.');
		const [filmName, guardName] = process.argv.slice(2),
			parents = [];
		/** Authenticate complete parent inventory and parse one small artifact.
		 * @param {string} name - Sealed accepted run name.
		 * @param {string} artifact - JSON input inside that run.
		 * @returns {Promise<unknown>} - Parsed artifact validated by the specific gates below.
		 */
		async function load(name, artifact) {
			const parent = await readParent(name, artifact);
			parents.push({...parent, bytes: undefined});
			return JSON.parse(new TextDecoder().decode(parent.bytes));
		}
		const recipe = /** @type {LocalSunFilmRecipe} */ (await load(filmName, 'recipe.json'));
		const result = /** @type {LocalSunFilmHostResult} */ (await load(filmName, 'result.json')),
			input = /** @type {LocalSunFilmHostInputs} */ (await load(filmName, 'inputs.json')),
			trace = /** @type {LocalSunFilmHostTrace} */ (await load(filmName, 'trace.json')),
			guard = /** @type {LocalSunFilmGuardResult} */ (await load(guardName, 'result.json')),
			guardInput = /** @type {LocalSunFilmGuardInputs} */ (await load(guardName, 'inputs.json'));
		if (recipe.stage === 'stills' || !['motion', 'preview', 'final'].includes(recipe.stage))
			throw new Error('Media qualification requires an encoded film stage.');
		const expectedFrames = recipe.framesPerSecond * recipe.segmentDurationSeconds,
			width = recipe.viewportSize.width,
			height = recipe.viewportSize.height;
		if (
			recipe.stage === 'final' &&
			(width !== 1920 ||
				height !== 1080 ||
				recipe.framesPerSecond !== 30 ||
				recipe.segmentDurationSeconds !== 90 ||
				expectedFrames !== 2700)
		)
			throw new Error('Final recipe differs from the frozen 1080p delivery.');
		if (
			result.schema !== 'local-sun-p6-film-v1' ||
			result.frames !== expectedFrames ||
			result.glError !== 0 ||
			result.cacheCount !== 1 ||
			result.cleanup?.resources !== 0 ||
			result.cleanup?.errors?.length !== 0 ||
			result.cleanup?.persistentSceneDisposed !== true
		)
			throw new Error('Film render/lifecycle gates failed.');
		if (
			guard.schema !== 'host-resource-bound-v1' ||
			guard.exitCode !== 0 ||
			guard.failure ||
			!guard.resourceQualified ||
			guardInput.launcher.script !== 'run-film.js' ||
			guardInput.launcher.arguments.join() !== '--stage=' + recipe.stage ||
			!guardInput.command.includes('--p6-film') ||
			guardInput.limits.maximumBytes > 12288 * 1048576 ||
			guardInput.limits.reserveBytes < 4096 * 1048576 ||
			guardInput.limits.maximumMilliseconds > (recipe.stage === 'final' ? 45 : 10) * 60000 ||
			input.resourceOwnership.run !== guardName
		)
			throw new Error('Film resource guard does not match capture.');
		for (const identity of input.sources) {
			const file = path.resolve(repositoryRoot, identity.path);
			const actual = await hashFile(repositoryRoot, file);
			if (actual.sha256 !== identity.sha256 || actual.byteLength !== identity.byteLength)
				throw new Error('Captured source changed: ' + identity.path);
		}
		const profile = path.join(outputRoot, 'runs', filmName, 'profile');
		await checkPath(outputRoot, profile);
		try {
			await access(profile);
			throw new Error('Disposable profile remains.');
		} catch (error) {
			if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
		}
		/** @type {LocalSunFilmTraceRow[]} */ const rows = trace.rows;
		if (
			trace.schema !== 'local-sun-p6-trace-v1' ||
			!Array.isArray(rows) ||
			rows.length !== expectedFrames + (recipe.stage === 'motion' ? 0 : 1)
		)
			throw new Error('Complete exact-state trace is absent.');
		const frames = rows.slice(0, expectedFrames),
			frameIds = new Set(),
			cacheIds = new Set();
		let priorInstant = -Infinity,
			priorPhase = -Infinity,
			bearing = 0,
			previousBearing = 0;
		for (const [index, row] of rows.entries()) {
			if (
				![
					row.slot,
					row.timestampMicroseconds,
					row.filmSeconds,
					row.sourceProgress,
					row.sourcePhaseDegrees,
					row.sunRadiusPixels,
					row.expectedSunRadiusPixels,
					row.verticalFieldOfViewDegrees,
					row.sunAzimuthDegrees,
					row.sourceRadiusMeters,
					...row.sunCenterPixels,
				].every(Number.isFinite) ||
				!Number.isFinite(Date.parse(row.observation.instant))
			)
				throw new Error('Nonfinite or incomplete trace row at ' + index);
			if (
				row.slot !== index ||
				row.glError !== 0 ||
				!row.cacheReused ||
				Math.abs(row.sunRadiusPixels - row.expectedSunRadiusPixels) > 1e-6 ||
				row.sourceRadiusMeters !== 25749.504
			)
				throw new Error('GPU trace geometry/cache gate failed at ' + index);
			if (frameIds.has(row.frameIdentity)) throw new Error('Repeated rendered-state identity.');
			frameIds.add(row.frameIdentity);
			cacheIds.add(row.cacheIdentity);
			const instant = Date.parse(row.observation.instant);
			if (instant < priorInstant || row.sourcePhaseDegrees < priorPhase) throw new Error('Source time reversed.');
			priorInstant = instant;
			priorPhase = row.sourcePhaseDegrees;
			if (row.filmSeconds >= 10 && row.filmSeconds <= 80 && Math.abs(row.verticalFieldOfViewDegrees - 18) > 1e-8)
				throw new Error('Circuit FOV changed.');
			if (
				index < expectedFrames &&
				(row.timestampMicroseconds !== Math.round((index * 1000000) / recipe.framesPerSecond) ||
					Math.abs(row.filmSeconds - (recipe.segmentStartSeconds + index / recipe.framesPerSecond)) > 1e-9)
			)
				throw new Error('Ideal camera time/cadence mismatch.');
			if (index) bearing += ((row.sunAzimuthDegrees - previousBearing + 540) % 360) - 180;
			previousBearing = row.sunAzimuthDegrees;
		}
		if (cacheIds.size !== 1) throw new Error('Compatible canonical cache identity changed.');
		if (
			recipe.stage !== 'motion' &&
			(Math.abs(Math.abs(bearing) - 360) > 0.2 ||
				rows.at(-1).sourcePhaseDegrees !== 540 ||
				rows.at(-1).filmSeconds !== 90)
		)
			throw new Error('Complete orbit/endpoint absent.');
		const native = path.join(outputRoot, 'runs', filmName, 'native.mp4');
		await checkPath(outputRoot, native);
		const media = new Input({source: new FilePathSource(native), formats: ALL_FORMATS});
		let metadata;
		try {
			const track = await media.getPrimaryVideoTrack();
			if (!track) throw new Error('Missing video track.');
			metadata = {
				durationSeconds: await media.computeDuration(),
				codec: track.codec,
				width: track.codedWidth,
				height: track.codedHeight,
				packetCount: 0,
				maximumTimestampErrorSeconds: 0,
			};
			if (
				metadata.codec !== 'avc' ||
				metadata.width !== width ||
				metadata.height !== height ||
				Math.abs(metadata.durationSeconds - recipe.segmentDurationSeconds) > 1e-5 ||
				(await media.getAudioTracks()).length
			)
				throw new Error('Encoded metadata differs from silent film recipe.');
			const timestamps = [];
			for await (const packet of new EncodedPacketSink(track).packets(undefined, undefined, {metadataOnly: true}))
				timestamps.push(packet.timestamp);
			timestamps.sort((a, b) => a - b);
			metadata.packetCount = timestamps.length;
			for (const [index, time] of timestamps.entries())
				metadata.maximumTimestampErrorSeconds = Math.max(
					metadata.maximumTimestampErrorSeconds,
					Math.abs(time - index / recipe.framesPerSecond),
				);
			if (metadata.packetCount !== expectedFrames || metadata.maximumTimestampErrorSeconds > 2e-6)
				throw new Error('Encoded packet cadence/frame count mismatch.');
		} finally {
			media.dispose();
		}
		if (typeof ffmpeg !== 'string') throw new Error('Existing pinned ffmpeg-static executable unavailable.');
		const executablePath = ffmpeg;
		await checkPath(repositoryRoot, executablePath);
		const decoderIdentity = {
			path: path.relative(repositoryRoot, executablePath).replaceAll('\\', '/'),
			...(await hashFile(repositoryRoot, executablePath)),
		};
		/** Execute one checked media operation with bounded streaming output, preserving tool identity.
		 * @param {string} name - Unique new operation name.
		 * @param {string[]} args - Shell-free ffmpeg arguments.
		 * @param {(bytes:Buffer)=>void} [consume] - Bounded streaming decoder consumer.
		 * @returns {Promise<void>} - Successful child completion and retained diagnostics.
		 */
		async function execute(name, args, consume = () => {}) {
			await run.write(
				name + '-command.json',
				JSON.stringify({tool: decoderIdentity, arguments: ['-hide_banner', '-nostdin', ...args]}, null, '\t'),
			);
			const child = spawn(executablePath, ['-hide_banner', '-nostdin', ...args], {
				cwd: repositoryRoot,
				windowsHide: true,
				stdio: ['ignore', 'pipe', 'pipe'],
			});
			let stderr = '';
			child.stderr.on('data', (bytes) => {
				stderr = (stderr + String(bytes)).slice(-262144);
			});
			const done = new Promise((resolve, reject) => {
				child.once('error', reject);
				child.once('close', (code) =>
					code === 0
						? resolve(undefined)
						: reject(new Error('FFmpeg ' + name + ' failed ' + code + ': ' + stderr.slice(-4000))),
				);
			});
			void done.catch(() => {});
			try {
				for await (const bytes of child.stdout) consume(bytes);
				await done;
			} finally {
				if (child.exitCode === null) {
					child.kill();
					await done.catch(() => {});
				}
				await run.write(name + '-stderr.txt', stderr);
			}
		}
		/** @type {LocalSunFilmDecodedRow[]} */ const decoded = [];
		const frameBytes = width * height * 3;
		let pending = Buffer.alloc(0),
			previous,
			duplicateFrames = 0,
			minimumSolarContrast = Infinity;
		await execute(
			'decode-native',
			[
				'-v',
				'error',
				'-i',
				native,
				'-an',
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
					const pixels = Buffer.from(pending.subarray(0, frameBytes));
					pending = pending.subarray(frameBytes);
					const index = decoded.length,
						row = frames[index];
					if (!row) throw new Error('Decoder produced excess frames.');
					let luma = 0,
						adjacent = 0,
						count = 0;
					for (let offset = 0; offset < frameBytes; offset += 3 * 64) {
						luma += 0.2126 * pixels[offset] + 0.7152 * pixels[offset + 1] + 0.0722 * pixels[offset + 2];
						if (previous)
							for (let channel = 0; channel < 3; channel++)
								adjacent += Math.abs(pixels[offset + channel] - previous[offset + channel]);
						count++;
					}
					const cx = row.sunCenterPixels[0],
						cy = height - 1 - row.sunCenterPixels[1],
						radius = row.sunRadiusPixels,
						bound = Math.max(5, Math.ceil(radius * 2.5));
					let background = 0,
						backgroundCount = 0,
						peak = 0;
					/** Read native RGB luma at a bounded pixel.
					 * @param {number} x - Raster column.
					 * @param {number} y - Raster row.
					 * @returns {number} - Byte-scale luminance.
					 */
					const sample = (x, y) => {
						const offset = (y * width + x) * 3;
						return 0.2126 * pixels[offset] + 0.7152 * pixels[offset + 1] + 0.0722 * pixels[offset + 2];
					};
					for (
						let y = Math.max(0, Math.floor(cy - bound));
						y <= Math.min(height - 1, Math.ceil(cy + bound));
						y++
					)
						for (
							let x = Math.max(0, Math.floor(cx - bound));
							x <= Math.min(width - 1, Math.ceil(cx + bound));
							x++
						) {
							const distance = Math.hypot(x - cx, y - cy),
								value = sample(x, y);
							if (distance < Math.max(1, radius * 0.6)) peak = Math.max(peak, value);
							if (distance > radius * 1.6 && distance < radius * 2.5) {
								background += value;
								backgroundCount++;
							}
						}
					if (!backgroundCount) throw new Error('Sun background annulus is unavailable.');
					background /= backgroundCount;
					const contrast = peak - background;
					minimumSolarContrast = Math.min(minimumSolarContrast, contrast);
					if (contrast < 5) throw new Error('Decoded Sun lacks local contrast at frame ' + index);
					const threshold = background + contrast * 0.5;
					let diameter = 0;
					for (let y = Math.max(0, Math.floor(cy - 1)); y <= Math.min(height - 1, Math.ceil(cy + 1)); y++) {
						let from = Infinity,
							to = -Infinity;
						for (
							let x = Math.max(0, Math.floor(cx - radius * 1.5 - 2));
							x <= Math.min(width - 1, Math.ceil(cx + radius * 1.5 + 2));
							x++
						)
							if (sample(x, y) >= threshold) {
								from = Math.min(from, x);
								to = Math.max(to, x);
							}
						if (Number.isFinite(from)) diameter = Math.max(diameter, to - from + 1);
					}
					const digest = hash(pixels);
					if (decoded.at(-1)?.sha256 === digest) duplicateFrames++;
					decoded.push({
						frame: index,
						meanLuma: luma / count,
						adjacentMeanAbsolute: previous ? adjacent / (count * 3) : null,
						sha256: digest,
						solarCoreDiameterPixels: diameter,
					});
					previous = pixels;
				}
			},
		);
		if (pending.length || decoded.length !== expectedFrames)
			throw new Error('Decoder did not produce every complete frame.');
		const circuit = frames
				.map((row, index) => ({row, decoded: decoded[index]}))
				.filter(({row}) => row.filmSeconds >= 10 && row.filmSeconds <= 80),
			near = circuit.reduce(
				(best, current) => (!best || current.row.sunRadiusPixels > best.row.sunRadiusPixels ? current : best),
				null,
			),
			far = circuit.reduce(
				(best, current) => (!best || current.row.sunRadiusPixels < best.row.sunRadiusPixels ? current : best),
				null,
			);
		const measuredRatio =
				near && far ? near.decoded.solarCoreDiameterPixels / far.decoded.solarCoreDiameterPixels : null,
			expectedRatio = near && far ? near.row.sunRadiusPixels / far.row.sunRadiusPixels : null;
		if (
			recipe.stage === 'final' &&
			(!near ||
				!far ||
				near.decoded.solarCoreDiameterPixels < 20 ||
				far.decoded.solarCoreDiameterPixels < 8 ||
				Math.abs(measuredRatio / expectedRatio - 1) > 0.15)
		)
			throw new Error('Final decoded near/far disc-size gate failed.');
		if (
			decoded.some(
				(row, index) =>
					row.solarCoreDiameterPixels <= 0 ||
					Math.abs(row.solarCoreDiameterPixels - 2 * frames[index].sunRadiusPixels) > 3,
			)
		)
			throw new Error('Decoded solar edge deviates from geometric support.');
		await run.write(
			'decoded.json',
			JSON.stringify(
				{
					schema: 'local-sun-p6-decoded-v1',
					method: 'Full native RGB24 decode. Everyframe SHA256 and 1-in-64 sampled scene luma/difference. Solar core horizontal width at half contrast above annulus1.6R..2.5R, maximum across center±1rows.',
					frames: decoded,
					duplicatePixelFrames: duplicateFrames,
					minimumSolarContrast,
					near,
					far,
					measuredRatio,
					expectedRatio,
				},
				null,
				'\t',
			),
		);
		const review = path.join(run.root, 'review.mp4');
		await checkPath(run.root, review);
		await execute('review-copy', [
			'-v',
			'error',
			'-n',
			'-i',
			native,
			'-an',
			'-vf',
			'scale=960:540:flags=lanczos',
			'-c:v',
			'libx264',
			'-preset',
			'medium',
			'-crf',
			'23',
			'-pix_fmt',
			'yuv420p',
			'-movflags',
			'+faststart',
			review,
		]);
		const sources = [];
		for (const name of [
			'qualify-film.js',
			'ExperimentRun.js',
			'parent-evidence.js',
			'run-boundary.js',
			'heavy-execution-admission.js',
		]) {
			const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			sources.push({
				path: path.relative(repositoryRoot, file).replaceAll('\\', '/'),
				...(await hashFile(repositoryRoot, file)),
			});
		}
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'local-sun-p6-film-qualification-input-v1',
					command: process.argv,
					parents,
					sources,
					node: process.version,
					decoder: decoderIdentity,
					operation:
						'Authenticate parents/source closure; verify exact-state trace and MP4 packet timestamps; independently decode every native frame and measure local solar support; encode a review derivative into this new run.',
					native: await hashFile(outputRoot, native),
					review: await hashFile(run.root, review),
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'local-sun-p6-film-qualification-v1',
					qualified: true,
					filmRun: filmName,
					guardRun: guardName,
					stage: recipe.stage,
					metadata,
					decodedFrames: decoded.length,
					sourceWindingDegrees: bearing,
					nearDiameterPixels: near?.decoded.solarCoreDiameterPixels,
					farDiameterPixels: far?.decoded.solarCoreDiameterPixels,
					measuredRatio,
					expectedRatio,
					duplicatePixelFrames: duplicateFrames,
					minimumSolarContrast,
					resources: {
						peakPrivateBytes: guard.peakPrivateBytes,
						peakWorkingSetBytes: guard.peakWorkingSetBytes,
						minimumFreeBytes: guard.minimumFreeBytes,
					},
					limitations:
						'Sampled scene-motion statistics and thresholded solar edges supplement cinematic inspection. Distinct render states may quantize to equal pixel frames near eased boundaries. Source-review validation and owner creative acceptance remain separate.',
				},
				null,
				'\t',
			),
		);
	} catch (error) {
		failure = error instanceof Error ? error.stack : String(error);
		process.exitCode = 1;
		console.error(failure);
	} finally {
		await run.finish(failure ? 'failed' : 'accepted', failure);
		console.log(run.name);
	}
}
await main();
