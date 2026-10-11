import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {column, attenuationWeights} from './shell-runtime-math.js';
import {createShellAtmosphere} from './shell-runtime.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS as constants} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../src/algorithm32/profiles/index.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../src/algorithm32/spectral-values/index.js';

/** Derive interpretable distance/order/color facts from immutable traces only.
 * @returns {Promise<void>} - New immutable summary; no cache build or renderer change.
 */
async function main() {
	const run = await ExperimentRun.create('band-summary');
	try {
		const parents = await Promise.all(process.argv.slice(2).map((name) => readParent(name, 'band-trace.json')));
		if (parents.length < 1 || parents.length > 2) throw new Error('One or two completed trace parents required.');
		const color = new ColorResetSlope078P2ColorDisplayModel();
		const sea = createShellAtmosphere().sampleMedium({altitude: {value: 0, units: 'meters'}});
		const optical = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ ds) =>
			sea.rayleighScattering.values.map(
				(v, c) =>
					v * column(a, b, ds, constants.rayleighScaleHeight.value) +
					sea.mieExtinction.values[c] * column(a, b, ds, constants.mieScaleHeight.value),
			);
		const geometryParents = await Promise.all(
			['00482-p3-shell-v3a', '00484-p3-shell-v3a'].map((name) => readParent(name, 'recipe.json')),
		);
		const sourceGeometry = geometryParents.map((parent) => {
			/** @type {LocalSunShellCaptureRequest} */ const recipe = JSON.parse(
				new TextDecoder().decode(parent.bytes),
			);
			const geometry = recipe.state.geometry,
				observer = geometry.observerPosition.coordinates,
				source = geometry.sourcePosition.coordinates,
				distance = Math.hypot(...source.map((v, i) => v - observer[i])),
				length = ((geometry.topAltitude.value - observer[2]) * distance) / (source[2] - observer[2]);
			if (!(
				source[2] > geometry.topAltitude.value &&
				observer[2] >= 0 &&
				observer[2] < geometry.topAltitude.value
			))
				throw new Error('Source geometry is outside the pinned above-atmosphere slab case.');
			const tau = optical(observer[2], geometry.topAltitude.value, length);
			return {
				parent: parent.run,
				state: parent.run === '00482-p3-shell-v3a' ? 'flat-0' : 'flat-180',
				instant: recipe.state.observation.instant,
				observerMeters: observer,
				sourceMeters: source,
				sourceDistanceMeters: distance,
				sourceElevationDegrees: (Math.asin((source[2] - observer[2]) / distance) * 180) / Math.PI,
				atmosphericPathMeters: length,
				transmittance438And626: [2, 8].map((c) => Math.exp(-tau[c])),
			};
		});
		const summaries = [];
		for (const parent of parents) {
			/** @type {LocalSunBandTraceResult} */ const trace = JSON.parse(new TextDecoder().decode(parent.bytes));
			if (
				trace.schema !== 'local-sun-lower-band-trace-v1' ||
				trace.closure.failures ||
				trace.cpuGpu.failures ||
				trace.maximumPixelByteDifference > 2
			)
				throw new Error('Trace is not closed against its actual pixel.');
			const widths = trace.wavelengthsNm.map((w, c) =>
				Math.max(0, Math.min(700, w + trace.widthsNm[c] / 2) - Math.max(400, w - trace.widthsNm[c] / 2)),
			);
			const energy = (/** @type {readonly number[]} */ spectrum) =>
				spectrum.reduce((sum, v, c) => sum + v * widths[c], 0);
			const rgb = (/** @type {readonly number[]} */ values) =>
				color.radianceToLinearSrgb(
					/** @type {SpectralRadiancePacket} */ (
						new SpectralPacket({
							basis: NATIVE_15_SPECTRAL_BASIS,
							quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
							units: SPECTRAL_UNITS.RADIANCE_DENSITY,
							values,
							provenanceIdentity: 'band-trace-derived-rgb-v1',
						})
					),
				);
			const rows = trace.rays.map((ray) => {
				const total = energy(ray.totalSpectrum);
				/** Exact partial mass of the renderer's linearly interpolated optical-depth source function.
				 * @param {number} distance - Camera-to-cut distance, meters.
				 * @returns {number} - Integrated visible-band radiance through this cut.
				 */
				const massThrough = (distance) => {
					let sum = 0;
					for (let i = 0; i < ray.intervals.length; i++) {
						const interval = ray.intervals[i];
						if (distance >= interval.upperMeters) {
							sum += interval.byOrder.reduce((s, o) => s + energy(o), 0);
							continue;
						}
						if (distance <= interval.lowerMeters) break;
						const a = ray.points[i],
							b = ray.points[i + 1],
							ds = distance - a.distanceMeters,
							z = a.positionMeters[2] + ray.direction[2] * ds;
						const fullTau = optical(
								a.positionMeters[2],
								b.positionMeters[2],
								b.distanceMeters - a.distanceMeters,
							),
							cutTau = optical(a.positionMeters[2], z, ds);
						for (let c = 0; c < 15; c++) {
							const [lower, upper] = attenuationWeights(Math.max(0, cutTau[c]));
							for (let order = 0; order < 4; order++) {
								const sa = a.densities[order][c] / Math.max(a.extinction[c], 1e-30),
									sb = b.densities[order][c] / Math.max(b.extinction[c], 1e-30);
								const sc = sa + ((sb - sa) * cutTau[c]) / Math.max(fullTau[c], 1e-30);
								sum += widths[c] * Math.exp(-a.viewOpticalDepth[c]) * (lower * sa + upper * sc);
							}
						}
						break;
					}
					return sum;
				};
				const quantiles = [0.5, 0.9, 0.99].map((fraction) => {
					let lo = ray.segment.startDistance.value,
						hi = ray.segment.endDistance.value;
					for (let i = 0; i < 45; i++) {
						const mid = (lo + hi) / 2;
						if (massThrough(mid) < fraction * total) lo = mid;
						else hi = mid;
					}
					return {fraction, distanceMeters: (lo + hi) / 2};
				});
				if (Math.abs(massThrough(ray.segment.endDistance.value) - total) > 1e-10 * Math.max(total, 1e-30))
					throw new Error('Distance attribution does not close.');
				const median = quantiles[0].distanceMeters,
					z = ray.segment.ray.origin.coordinates[2] + ray.direction[2] * median;
				const sun = ray.points[0],
					viewTau = optical(ray.segment.ray.origin.coordinates[2], z, median);
				return {
					pixel: ray.pixel,
					elevationDegrees: (Math.asin(ray.direction[2]) * 180) / Math.PI,
					visibleRadiance: total,
					orderFractions: ray.orderSpectra.map((s) => energy(s) / total),
					lastScatterQuantiles: quantiles,
					fractionBeyond100km: 1 - massThrough(100000) / total,
					observerSourceAtmosphericPathMeters: sun.sourceAtmosphericLengthMeters,
					observerSourceTransmittance438And626: [2, 8].map((c) => Math.exp(-sun.sourceOpticalDepth[c])),
					viewMedianTransmittance438And626: [2, 8].map((c) => Math.exp(-viewTau[c])),
					linearRgb: ray.linearRgb,
					continuousPrimaryLinearRgb: rgb(ray.continuousJ1Spectrum),
					cachedPrimaryLinearRgb: rgb(ray.orderSpectra[0]),
					noViewAttenuationLinearRgb: rgb(ray.noViewAttenuationSpectrum),
					continuousToCachedPrimaryEnergyRatio:
						energy(ray.continuousJ1Spectrum) / energy(ray.orderSpectra[0]),
					pixelBytes: ray.pixelBytes,
				};
			});
			summaries.push({parent: parent.run, instant: trace.state, rows});
			await run.write(parent.run + '-band-trace.json', parent.bytes);
		}
		const inputs = [];
		for (const relative of [
			'experiments/local-sun-cache-reuse/summarize-band-trace.js',
			'experiments/local-sun-cache-reuse/shell-runtime-math.js',
			'experiments/local-sun-cache-reuse/shell-runtime.js',
			'src/algorithm32/implementation/canonical-atmosphere/consts.js',
			'src/algorithm32/profiles/native-15/consts.js',
			'src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js',
			'src/algorithm32/implementation/color-reset-slope-078-p2/consts.js',
			'src/algorithm32/implementation/color-reset-slope-078-p9/ColorResetSlope078P9ColorDisplayModel.js',
			'src/algorithm32/implementation/color-reset-slope-078-p9/consts.js',
			'src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js',
			'src/algorithm32/implementation/bruneton-color/consts.js',
			'package-lock.json',
		]) {
			const file = path.join(repositoryRoot, relative);
			await checkPath(repositoryRoot, file);
			inputs.push({path: relative, sha256: hash(await readFile(file))});
		}
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					parents: parents.map(({bytes, ...identity}) => identity),
					geometryParents: geometryParents.map(({bytes, ...identity}) => identity),
					inputs,
					tools: {node: process.version},
					operation:
						'Integrate Native15 bins over 400-700nm; divide per-order radiance by total. Solve positive partial optical-depth interval mass by 45 bisections for 50/90/99-percent last-scatter distances. Project retained spectra through unchanged p2 CIE matrix. Derive observer-to-source slab length as (H-z)*|S-O|/(h-z), then apply analytic exponential-medium columns and Beer-Lambert transmission.',
					parameters: {
						visibleIntervalNm: [400, 700],
						quantiles: [0.5, 0.9, 0.99],
						selectedChannelsNm: [438.3333333333333, 626.3333333333333],
					},
					limitation:
						'Distance estimates resolve the current discrete linear-in-optical-depth operator, not upstream photon histories or physical approximation error bars.',
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'local-sun-band-trace-summary-v1',
					summaries,
					sourceGeometry,
					units: 'distance meters; visible radiance W m^-2 sr^-1; transmittance/fractions dimensionless; projected linear RGB before display encoding',
				},
				null,
				'\t',
			),
		);
		await run.finish('accepted');
		console.log(JSON.stringify({run: run.name, summaries}));
	} catch (error) {
		await run.finish('failed', String(error));
		throw error;
	}
}
await main();
