import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {createRun, identity, readRepository, verifyRun} from './io/files.mjs';

/** Decode an sRGB display component to display-linear light, not scene radiance.
 * @param {number} byte @returns {number}
 */
function linear(byte) {
	const value = byte / 255;
	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** Measure a camera-elevation band in the central half of a matched capture.
 * @param {ReturnType<typeof PNG.sync.read>} image @param {number} minimum
 * @param {number} maximum @param {number} pitchDegrees @param {number} verticalFovDegrees
 * @returns {AltitudeImageBand}
 */
function band(image, minimum, maximum, pitchDegrees, verticalFovDegrees) {
	const pitch = (pitchDegrees * Math.PI) / 180;
	const tangent = Math.tan((verticalFovDegrees * Math.PI) / 360);
	const rgb = [0, 0, 0];
	let count = 0,
		luminance = 0;
	for (let y = 0; y < image.height; y++) {
		const v = (1 - (2 * (y + 0.5)) / image.height) * tangent;
		for (let x = image.width / 4; x < (3 * image.width) / 4; x++) {
			const u = (((2 * (x + 0.5)) / image.width - 1) * tangent * image.width) / image.height;
			const elevation =
				(Math.asin((Math.sin(pitch) + v * Math.cos(pitch)) / Math.sqrt(1 + u * u + v * v)) * 180) / Math.PI;
			if (elevation < minimum || elevation >= maximum) continue;
			const offset = (y * image.width + x) * 4;
			const values = [0, 1, 2].map((c) => image.data[offset + c]);
			values.forEach((value, c) => {
				rgb[c] += value;
			});
			luminance += 0.2126 * linear(values[0]) + 0.7152 * linear(values[1]) + 0.0722 * linear(values[2]);
			count++;
		}
	}
	assert.ok(count > 0, 'Empty image band.');
	return {
		count,
		rgb: rgb.map((value) => value / count),
		luminance: luminance / count,
		redBlueRatio: rgb[0] / rgb[2],
		chroma: (Math.max(...rgb) - Math.min(...rgb)) / Math.max(...rgb),
	};
}

/** Verify sealed capture evidence and derive image/order metrics in a new immutable run.
 * @returns {void} Writes a new sealed report; rejects mismatched inputs and preserves failures.
 */
function main() {
	assert.equal(process.argv.length, 3, 'Pass the exact parent capture run.');
	const parent = process.argv[2],
		seal = verifyRun(parent);
	const names = ['candidate.json', 'production.json', 'inputs.json', 'production-noon.png', 'candidate-noon.png'];
	const parents = [seal, ...names.map((name) => identity(`${parent}/${name}`))];
	const run = createRun('altitude-report', {
		parents,
		operation:
			'Decode matched sRGB PNGs to display-linear luminance by exact camera elevation; compare stored pure-order source-density probes without re-running numerical compilation.',
		parameters: {
			parent,
			bandsDegrees: [
				[0.25, 1],
				[3, 5],
				[20, 25],
			],
			horizontalRegion: 'central half',
			weights: [0.2126, 0.7152, 0.0722],
			reference: 'production',
			units: 'display-linear normalized luminance; source densities separately',
			sourceDirectionLocal: [0, 0, 1],
		},
	});
	let failure = null;
	try {
		const read = (name) => JSON.parse(readRepository(`${parent}/${name}`).toString());
		const candidate = read('candidate.json'),
			production = read('production.json');
		const domains = read('inputs.json').control.baseline.transportSpec.domains;
		assert.ok(candidate.unchangedFirstTwoOrders && candidate.parity.maximumRelative === 0);
		const a = PNG.sync.read(readRepository(`${parent}/production-noon.png`));
		const b = PNG.sync.read(readRepository(`${parent}/candidate-noon.png`));
		assert.equal(a.width, b.width);
		assert.equal(a.height, b.height);
		assert.equal(a.width, production.viewport.width);
		assert.equal(a.height, production.viewport.height);
		const bands = [
			[0.25, 1],
			[3, 5],
			[20, 25],
		].map(([minimum, maximum]) => {
			const baseline = band(
				a,
				minimum,
				maximum,
				production.camera.pitchDegrees,
				production.camera.verticalFovDegrees,
			);
			const variant = band(
				b,
				minimum,
				maximum,
				production.camera.pitchDegrees,
				production.camera.verticalFovDegrees,
			);
			assert.equal(baseline.count, variant.count);
			return {
				minimum,
				maximum,
				baseline,
				candidate: variant,
				luminanceChangePercent: 100 * (variant.luminance / baseline.luminance - 1),
			};
		});
		const nodes = candidate.samples.map((sample) => {
			const altitudeIndex = sample.coordinate.y % 48,
				zenithIndex = Math.floor(sample.coordinate.y / 48);
			return {
				altitudeMeters: domains.position.nodes[altitudeIndex].altitudeMeters,
				solarZenithDegrees: domains.solarZenith.nodes[zenithIndex].solarZenithDegrees,
			};
		});
		const near = nodes
			.map((node, index) => ({...node, index}))
			.filter(
				(node) =>
					node.altitudeMeters <= 3125 &&
					Math.abs(node.solarZenithDegrees - production.solarZenithDegrees) < 2,
			);
		assert.ok(near.length);
		let unchanged = 0;
		const orders = candidate.orderProbes.map((channel) => ({
			channel: channel.channel,
			wavelengthNanometers: domains.spectrum.channels[channel.channel].centerNanometers,
			orders: channel.baseline.map((values, order) => {
				let baselineSum = 0,
					candidateSum = 0,
					maximumRelative = 0;
				for (let i = 0; i < values.length; i++) {
					const value = channel.candidate[order][i];
					assert.ok(Number.isFinite(value) && value >= 0 && Number.isFinite(values[i]) && values[i] >= 0);
					if (order < 2) {
						assert.equal(value, values[i]);
						unchanged++;
					}
					baselineSum += values[i];
					candidateSum += value;
					maximumRelative = Math.max(
						maximumRelative,
						Math.abs(value - values[i]) / Math.max(1e-30, Math.abs(values[i])),
					);
				}
				const baselineNear = near.reduce((sum, node) => sum + values[node.index], 0);
				const candidateNear = near.reduce((sum, node) => sum + channel.candidate[order][node.index], 0);
				return {
					order: order + 1,
					baselineSum,
					candidateSum,
					changePercent: 100 * (candidateSum / baselineSum - 1),
					maximumRelative,
					nearNoonLowAltitudeChangePercent: 100 * (candidateNear / baselineNear - 1),
				};
			}),
		}));
		const metrics = {
			bands,
			orders,
			unchanged,
			nearNodes: near,
			probeCount: nodes.length,
			notes: [
				'All source probes point receiver-local +Z (zenith); these are not horizon radiances.',
				'Sums over required cache nodes are deterministic diagnostic summaries, not physical angular integrals.',
				'Image luminance is after the fixed production presentation transform, not raw scene radiance or paper RMSE.',
				'No matched independent N4 oracle, new paper scores or twilight qualification is supplied.',
			],
		};
		run.write('metrics.json', metrics);
		console.log(JSON.stringify({bands, unchanged, nearNodeCount: near.length, channel7: orders[7]}));
	} catch (error) {
		failure = String(error);
		run.write('failure.json', {failure});
	} finally {
		run.cleanup();
		run.finish(failure ? 'failed' : 'accepted', {failure});
	}
	verifyRun(run.path);
	console.log(JSON.stringify({run: run.path, failure}));
	if (failure) process.exitCode = 1;
}
main();
