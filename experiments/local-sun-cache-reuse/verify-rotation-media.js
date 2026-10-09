import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {Input, ALL_FORMATS, BufferSource} from 'mediabunny';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Inspect every encoded video packet without modifying the sealed capture.
 * This verifies container structure and timing, not decoded visual quality.
 * @returns {Promise<void>} - Sealed source-bound media verification.
 */
async function main() {
	const name = process.argv[2],
		run = await ExperimentRun.create('p2-media');
	let failure = null;
	try {
		const results = [];
		for (const [artifact, expectedFrames, expectedDuration] of [
			['rotation.mp4', 90, 3],
			['blink-17.mp4', 60, 2],
		]) {
			const parent = await readParent(name, String(artifact));
			const input = new Input({formats: ALL_FORMATS, source: new BufferSource(parent.bytes)});
			try {
				const track = await input.getPrimaryVideoTrack();
				if (!track) throw new Error('Missing video track.');
				const stats = await track.computePacketStats(),
					duration = await track.computeDuration();
				if (
					stats.packetCount !== expectedFrames ||
					Math.abs(duration - Number(expectedDuration)) > 1e-6 ||
					Math.abs(stats.averagePacketRate - 30) > 1e-6
				)
					throw new Error(`Incomplete encoded clip: ${artifact}`);
				results.push({
					parent: {...parent, bytes: undefined},
					stats,
					duration,
					codec: track.codec,
					width: track.displayWidth,
					height: track.displayHeight,
				});
			} finally {
				input.dispose();
			}
		}
		const source = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/verify-rotation-media.js');
		await checkPath(repositoryRoot, source);
		const metadata = path.join(repositoryRoot, 'node_modules/mediabunny/package.json');
		await checkPath(repositoryRoot, metadata);
		const metadataBytes = await readFile(metadata);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'local-sun-p2-media-v1',
					results,
					derivation: {
						operation:
							'Mediabunny MP4 demux, count all encoded packets and derive duration and average packet rate; compare 90/60 frames at 30fps, 3/2 seconds.',
						implementation: 'experiments/local-sun-cache-reuse/verify-rotation-media.js',
						sha256: hash(await readFile(source)),
						toolVersion: JSON.parse(metadataBytes.toString('utf8')).version,
						toolMetadataSha256: hash(metadataBytes),
					},
					limitation:
						'Container/packet verification only; no claim of decoded video quality or temporal qualification.',
				},
				null,
				'\t',
			),
		);
	} catch (error) {
		failure = String(error.stack ?? error);
	}
	await run.finish(failure ? 'failed' : 'accepted', failure);
	console.log(JSON.stringify({run: run.name, failure}));
	if (failure) process.exitCode = 1;
}

await main();
