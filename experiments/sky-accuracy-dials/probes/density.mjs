import {medium, phase, sourceTransmittance, directDensity} from '../numerics/direct.js';
import {sourceFrame, unit} from '../numerics/math.js';
import {acceptControls} from '../numerics/profile.js';
import {prepareViewPlan, sampleDensity, analyticFirstOrderProbes} from '../numerics/view.js';

/** Construct physically separate J1 lighting and density fields; never divide scalar J.
 * With collimated irradiance E, S_R=E*T_source*p_R and S_M=E*T_source*p_M.
 * Thus J1=beta_R(h)*S_R+beta_M(h)*S_M. The normalized phase definitions are
 * those in the shared physical module and Bruneton's RayleighPhaseFunction and
 * MiePhaseFunction: https://ebruneton.github.io/precomputed_atmospheric_scattering/atmosphere/functions.glsl.html.
 * Separate combined-density fields control for nonlinear interpolation and species
 * storage rounding. Physical density is not included in the lighting fields.
 * @param {SkyTransportSpec} spec - Fixed source, atmosphere and construction domains.
 * @param {Pick<SkyViewPlan, 'coordinates'>} plan - Sparse support of the requested view quadrature.
 * @param {number} channel - Direct40 spectral index.
 * @param {() => void} heartbeat - Caller-owned synchronous progress observation.
 * @returns {SkyDensitySpeciesFields} Four transient sparse Float32 fields.
 */
export function speciesFields(spec, plan, channel, heartbeat) {
	const rayleighLighting = new Float32Array(plan.coordinates.length);
	const mieLighting = new Float32Array(plan.coordinates.length);
	const rayleighDensity = new Float32Array(plan.coordinates.length);
	const mieDensity = new Float32Array(plan.coordinates.length);
	/** @type {Map<string, SkyDensityLightingKnot>} */ const knots = new Map();
	for (const [index, coordinate] of plan.coordinates.entries()) {
		if (index % 2048 === 0) heartbeat();
		const key = `${coordinate.altitudeIndex}:${coordinate.solarIndex}`;
		let knot = knots.get(key);
		if (!knot) {
			const angle = (spec.domains.solarZenith.nodes[coordinate.solarIndex].solarZenithDegrees * Math.PI) / 180;
			const altitude = spec.domains.position.nodes[coordinate.altitudeIndex].altitudeMeters;
			const radius = spec.planet.bottomRadiusMeters + altitude;
			const point = /** @type {SkyVector3} */ ([radius * Math.sin(angle), 0, radius * Math.cos(angle)]);
			knot = {
				frame: sourceFrame(point),
				coefficients: medium(spec, channel, Math.hypot(...point) - spec.planet.bottomRadiusMeters),
				illumination:
					spec.domains.spectrum.channels[channel].sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
					sourceTransmittance(spec, channel, point),
			};
			knots.set(key, knot);
		}
		const local = spec.domains.outgoing.unitVectors[coordinate.directionIndex];
		const axes = knot.frame;
		const world = unit(
			[0, 1, 2].map((axis) => axes[0][axis] * local[0] + axes[1][axis] * local[1] + axes[2][axis] * local[2]),
		);
		const phases = phase(spec, world[2]);
		rayleighLighting[index] = knot.illumination * phases[0];
		mieLighting[index] = knot.illumination * phases[1];
		rayleighDensity[index] = knot.illumination * knot.coefficients[1] * phases[0];
		mieDensity[index] = knot.illumination * knot.coefficients[2] * phases[1];
		if (
			![rayleighLighting[index], mieLighting[index], rayleighDensity[index], mieDensity[index]].every(
				(value) => Number.isFinite(value) && value >= 0,
			)
		)
			throw new RangeError('Separate J1 species fields must be finite and nonnegative.');
	}
	return {rayleighLighting, mieLighting, rayleighDensity, mieDensity};
}

/** Evaluate first-order density reconstruction while preserving explicit view quadrature.
 * Every array uses index (((sceneIndex*9+gridX)*9+gridY)*channelCount+channelOrdinal).
 * Scene and channel order are the supplied order. Exactly one explicit interval
 * count and solar operator are required; prepareViewPlan also owns the selected
 * viewRule when present. Q30 is preserved when the caller requests Q30.
 *
 * This function compares representations against continuous J1 on identical
 * view samples and source quadrature. It does not establish full-continuum
 * convergence, evaluate higher scattering orders, or read measured radiances.
 * The caller owns source/input authentication, storage budgets, frozen-increment
 * combinations, Kider scoring and immutable output. Progress callbacks may throw
 * to abort. Only four compact Float64 boundaries survive channel processing.
 *
 * @param {SkyBuildRequest} buildRequest - Authenticated candidate physical and numerical input.
 * @param {readonly SkyScene[]} scenes - Registered scenes in desired output order.
 * @param {SkyControlInput} input - Explicit single-view controls matching the build request.
 * @param {readonly number[]} channels - Unique Direct40 indexes in desired output order.
 * @param {SkyDensityEvaluationProgressHandler} [onProgress] - Synchronous progress and cancellation callback.
 * @returns {SkyDensityFactorizationEvaluation} Four physically identified first-order radiance arrays.
 */
export function evaluateDensityFactorization(buildRequest, scenes, input, channels, onProgress = () => {}) {
	if (
		!Array.isArray(input?.viewIntervals) ||
		input.viewIntervals.length !== 1 ||
		!Array.isArray(input.solarInterpolations) ||
		input.solarInterpolations.length !== 1
	)
		throw new RangeError('Density factorization requires one explicit view count and one explicit solar operator.');
	if (
		!Array.isArray(channels) ||
		channels.length === 0 ||
		channels.length > 40 ||
		new Set(channels).size !== channels.length ||
		channels.some((channel) => !Number.isInteger(channel) || channel < 0 || channel >= 40)
	)
		throw new RangeError('Density factorization requires unique Direct40 channels.');
	if (typeof onProgress !== 'function') throw new TypeError('Density progress callback must be a function.');
	const controls = acceptControls(input);
	const total = channels.length;
	onProgress({phase: 'prepare', completed: 0, total, message: 'Preparing the explicitly requested density view.'});
	const plan = prepareViewPlan(buildRequest, scenes, controls);
	if (plan.views.length !== 1) throw new RangeError('Density factorization requires exactly one prepared view.');
	const view = plan.views[0];
	const spec = buildRequest.transportSpec;
	const shape = {sceneCount: scenes.length, gridWidth: 9, channelCount: channels.length};
	const count = shape.sceneCount * 81 * shape.channelCount;
	const rawJ1 = new Float64Array(count);
	const splitSpeciesJ1 = new Float64Array(count);
	const factoredJ1 = new Float64Array(count);
	const continuousJ1 = new Float64Array(count);
	for (const [channelOrdinal, channel] of channels.entries()) {
		/** @type {SkyDensityEvaluationProgress} */
		let currentProgress = {
			phase: 'coefficients',
			completed: channelOrdinal,
			total,
			channel,
			message: `Constructing separate physical J1 species for channel ${channel}.`,
		};
		let lastProgress = performance.now();
		onProgress(currentProgress);
		const heartbeat = () => {
			if (performance.now() - lastProgress >= 20000) {
				onProgress(currentProgress);
				lastProgress = performance.now();
			}
		};
		const raw = analyticFirstOrderProbes(buildRequest, plan, channel);
		const fields = speciesFields(spec, plan, channel, heartbeat);
		currentProgress = {
			phase: 'integrate',
			completed: channelOrdinal,
			total,
			channel,
			message: `Integrating four J1 representations for channel ${channel}.`,
		};
		onProgress(currentProgress);
		lastProgress = performance.now();
		for (const ray of view.rays) {
			heartbeat();
			let transmittance = 1,
				rawRadiance = 0,
				splitRadiance = 0,
				factoredRadiance = 0,
				continuousRadiance = 0;
			for (const sample of ray.samples) {
				const coefficients = medium(spec, channel, sample.altitude);
				const halfStep = Math.exp(-0.5 * coefficients[0] * sample.step);
				transmittance *= halfStep;
				const splitDensity =
					sampleDensity(fields.rayleighDensity, sample, view.solarInterpolation) +
					sampleDensity(fields.mieDensity, sample, view.solarInterpolation);
				const factoredDensity =
					coefficients[1] * sampleDensity(fields.rayleighLighting, sample, view.solarInterpolation) +
					coefficients[2] * sampleDensity(fields.mieLighting, sample, view.solarInterpolation);
				// Retain production's (transmittance*density)*step operation order.
				rawRadiance += transmittance * sampleDensity(raw, sample, view.solarInterpolation) * sample.step;
				splitRadiance += transmittance * splitDensity * sample.step;
				factoredRadiance += transmittance * factoredDensity * sample.step;
				continuousRadiance +=
					transmittance * directDensity(spec, channel, sample.point, ray.worldDirection) * sample.step;
				transmittance *= halfStep;
			}
			if (
				![rawRadiance, splitRadiance, factoredRadiance, continuousRadiance].every(
					(value) => Number.isFinite(value) && value >= 0,
				)
			)
				throw new RangeError('Density diagnostic produced invalid first-order radiance.');
			const index = ((ray.sceneIndex * 9 + ray.gridX) * 9 + ray.gridY) * channels.length + channelOrdinal;
			rawJ1[index] = rawRadiance;
			splitSpeciesJ1[index] = splitRadiance;
			factoredJ1[index] = factoredRadiance;
			continuousJ1[index] = continuousRadiance;
		}
		onProgress({
			phase: 'integrate',
			completed: channelOrdinal + 1,
			total,
			channel,
			message: `Completed J1 channel ${channel}.`,
		});
	}
	onProgress({
		phase: 'complete',
		completed: total,
		total,
		message: 'All requested first-order density boundaries are complete.',
	});
	return {
		schemaId: 'sky-density-factorization-evaluation-v1',
		buildRequestId: buildRequest.id,
		scenes: scenes.map((scene) => ({...scene})),
		channels: [...channels],
		controls,
		shape,
		layout: '(((sceneIndex*9+gridX)*9+gridY)*channelCount+channelOrdinal); supplied scene and channel order',
		units: 'W m^-2 sr^-1 nm^-1',
		referenceScope:
			'Continuous J1 evaluated on the same view samples and with the same source-path quadrature; not a full-continuum reference or regenerated higher-order solution.',
		speciesEquations:
			'S_R=E*T_source*p_R; S_M=E*T_source*p_M; J1=beta_R(h)*S_R+beta_M(h)*S_M. Lighting excludes physical density and has units W m^-2 sr^-1 nm^-1.',
		splitControlScope:
			'Separate species are rounded into separate Float32 density fields before reconstruction; split-minus-raw includes cubic nonadditivity and species-storage roundoff.',
		rawJ1,
		splitSpeciesJ1,
		factoredJ1,
		continuousJ1,
	};
}
