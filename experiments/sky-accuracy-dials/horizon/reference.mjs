import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun, identity, readRepository, verifyRun} from '../io/files.mjs';
import {LocalSunCompactProfileSelection} from '../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

/** Exact exponential density column along an upward straight segment.
 * @param {number} altitude Initial altitude in meters.
 * @param {number} verticalCosine Vertical unit-direction component.
 * @param {number} length Segment length in meters.
 * @param {number} height Scale height in meters.
 * @returns {number} Integrated density in meters.
 */
function column(altitude, verticalCosine, length, height) {
	const x = length * verticalCosine / height;
	return Math.exp(-altitude / height) * length * (Math.abs(x) < 1e-9 ? 1 - x / 2 + x * x / 6 : -Math.expm1(-x) / x);
}

/** Independently integrate continuous point-source single scattering, with exact source/view extinction columns.
 * @param {HorizonContinuousInputs} inputs Matched physical inputs and exact observed ray.
 * @param {number} intervals Even composite-Simpson interval count.
 * @param {HorizonScatteringComponent} [component] Emission partition with unchanged total extinction.
 * @returns {number[]} Native15 radiance in W m^-2 sr^-1 nm^-1.
 */
function continuous(inputs, intervals, component = 'total') {
	const {direction, length, sourcePosition, sourceIrradiance, rayleigh, mie, albedo, g, rayleighHeight, mieHeight, referenceDistance} = inputs;
	const values = Array(15).fill(0);
	for (let index = 0; index <= intervals; index++) {
		const distance = length * index / intervals;
		const position = [distance * direction[0], distance * direction[1], 5 + distance * direction[2]];
		const toSun = sourcePosition.map((value, axis) => value - position[axis]);
		const sourceDistance = Math.hypot(...toSun);
		const sourceDirection = toSun.map((value) => value / sourceDistance);
		const cosine = direction.reduce((sum, value, axis) => sum + value * sourceDirection[axis], 0);
		const pR = 3 * (1 + cosine * cosine) / (16 * Math.PI);
		const pM = 3 * (1 - g * g) * (1 + cosine * cosine) / (8 * Math.PI * (2 + g * g) * (1 + g * g - 2 * g * cosine) ** 1.5);
		const sourceLength = (100000 - position[2]) / sourceDirection[2];
		assert.ok(sourceLength >= -0.01 && sourceDirection[2] > 0);
		const sourceR = column(position[2], sourceDirection[2], Math.max(0, sourceLength), rayleighHeight);
		const sourceM = column(position[2], sourceDirection[2], Math.max(0, sourceLength), mieHeight);
		const viewR = column(5, direction[2], distance, rayleighHeight);
		const viewM = column(5, direction[2], distance, mieHeight);
		const rhoR = Math.exp(-position[2] / rayleighHeight), rhoM = Math.exp(-position[2] / mieHeight);
		const weight = index === 0 || index === intervals ? 1 : index % 2 ? 4 : 2;
		for (let channel = 0; channel < 15; channel++) {
			const extinction = rayleigh[channel] * (sourceR + viewR) + mie[channel] * (sourceM + viewM);
			const density = (component === 'mie' ? 0 : rayleigh[channel] * rhoR * pR) + (component === 'rayleigh' ? 0 : albedo * mie[channel] * rhoM * pM);
			values[channel] += weight * sourceIrradiance[channel] * (referenceDistance / sourceDistance) ** 2 * Math.exp(-extinction) * density;
		}
	}
	return values.map((value) => value * length / (3 * intervals));
}

/** Execute a bounded, cache-free N1 comparison against the accepted live local observations.
 * @returns {void} Seals input identities, signed spectral differences and convergence measurements.
 */
function main() {
	const parent = process.argv[2];
	assert.ok(parent, 'An explicit sealed paired observation run is required.');
	const seal = verifyRun(parent);
	const observationPath = `${parent}/local-observation.json`;
	const shaderPath = `${parent}/local-shader.glsl.gz`;
	const referenceParent = process.argv[3];
	const previous = referenceParent ? JSON.parse(readRepository(`${referenceParent}/reference.json`).toString('utf8')) : null;
	const previousSeal = referenceParent ? verifyRun(referenceParent) : null;
	const observation = JSON.parse(readRepository(observationPath).toString('utf8'));
	assert.deepEqual(observation.facts.uniforms.uCameraWorldPositionMeters, [0, 0, 5]);
	assert.equal(observation.facts.state.modeKind, 'flat-local');
	const shader = gunzipSync(readRepository(shaderPath)).toString('utf8');
	const profile = new LocalSunCompactProfileSelection().create({observation: observation.facts.state.observation,
		observerPosition: {coordinates: [0, 0, 5], units: 'meters'}, viewRayLimit: {value: 1926774, units: 'meters'}, maximumScatteringOrder: 1});
	const {lightSource, atmosphere} = profile.models;
	const configuration = lightSource.configuration;
	const constants = atmosphere.constants;
	assert.equal(constants.ozoneAbsorptionEnabled, false);
	const physical = {sourcePosition: [...configuration.position.coordinates], sourceIrradiance: [...profile.spectral.sourceIrradianceDensity.values],
		rayleigh: [...atmosphere.seaLevelRayleighScattering.values], mie: [...atmosphere.seaLevelMieExtinction.values],
		albedo: constants.mieSingleScatteringAlbedo, g: constants.miePhaseFunctionG, rayleighHeight: constants.rayleighScaleHeight.value,
		mieHeight: constants.mieScaleHeight.value, referenceDistance: configuration.referenceDistance.value};
	const weights = ['R', 'G', 'B'].map((channel) => {
		const match = shader.match(new RegExp(`DISPLAY_LINEAR_SRGB_${channel}_BY_CHANNEL\\[15\\] = float\\[15\\]\\(([^)]+)\\)`));
		assert.ok(match, 'Exact installed Native15 color projection required.');
		return match[1].split(',').map(Number);
	});
	if (previous) {assert.equal(JSON.stringify(previous.physical), JSON.stringify(physical), 'Serialized physical inputs differ.'); assert.deepEqual(previous.weights, weights);}
	const parents = [seal, identity(observationPath), identity(shaderPath), identity('experiments/sky-accuracy-dials/horizon/reference.mjs'),
		identity('src/algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js'), identity('src/algorithm32/implementation/canonical-atmosphere/consts.js')];
	const recipe = {parents, operation: 'H2 independent continuous local N1 using composite Simpson 2048/4096, exact exponential source/view columns, current finite point-source dilution and phase equations; compare signed Native15 differences to installed cache.',
		parameters: {maximumMilliseconds: 120000, maximumEvidenceBytes: 2 * 1024 ** 2,
			prediction: 'If cache/view approximation removes expected orange, the converged continuous N1 has a redder spectrum. If it remains blue/neutral, the physical-input/model boundary also contributes.',
			limit: 'N1 local only; no distant N4 reference claim, no physical-input fit, no held-shell or interpolated-cache reference.'}};
	if (previousSeal) {
		parents.push(previousSeal, identity(`${referenceParent}/reference.json`));
		recipe.operation = 'Reuse authenticated continuous total N1 and add Rayleigh/Mie emission partitions at unchanged combined extinction; measure exact additive spectra and nonlinear display interaction.';
		recipe.parameters.prediction = 'Neutral total may combine blue Rayleigh and warm Mie; fixed-extinction components must add to the prior total, while their separately mapped RGB values need not add after exponential compression.';
	}
	const run = createRun(previous ? 'horizon-species' : 'horizon-ref', recipe);
	const started = Date.now();
	try {
		run.progress('reference', 'Integrate the same local sky rays independently at 2048 and 4096 intervals.');
		const rows = observation.rays.filter((ray) => ray.uv[0] === 0.5 && ray.stages[4][0] === 0).map((ray) => {
			assert.ok(Date.now() - started < 120000);
			const inputs = {...physical, direction: ray.stages[3].slice(0, 3), length: ray.stages[3][3]};
			const prior = previous?.rows.find((row) => row.elevationDegrees === ray.elevationDegrees);
			if (previous) assert.equal(JSON.stringify(prior.inputs), JSON.stringify(inputs), 'Serialized ray inputs differ.');
			const low = prior?.low ?? continuous(inputs, 2048), high = prior?.high ?? continuous(inputs, 4096);
			const cached = ray.stages.slice(5, 9).flat().slice(0, 15);
			const project = (values) => weights.map((w) => values.reduce((sum, value, index) => sum + value * w[index], 0));
			const rayleighValues = previous ? continuous(inputs, 4096, 'rayleigh') : null;
			const mieValues = previous ? continuous(inputs, 4096, 'mie') : null;
			const rayleighRgb = rayleighValues ? project(rayleighValues) : null;
			const mieRgb = mieValues ? project(mieValues) : null;
			const display = new ColorResetSlope078P2ColorDisplayModel();
			const illuminance = {value: ray.stages[4][3], units: /** @type {const} */ ('lux')};
			const mapped = (values) => display.linearSrgbToDisplayRgb(/** @type {HorizonLinearRgb} */ (values), illuminance);
			const totalDisplay = mapped(project(high));
			const components = previous ? {rayleighValues, mieValues, rayleighRgb, mieRgb,
				maximumAdditiveRelative: Math.max(...high.map((value, index) => Math.abs(rayleighValues[index] + mieValues[index] - value) / Math.max(1e-12, Math.abs(value)))),
				totalDisplay, rayleighDisplay: mapped(rayleighRgb), mieDisplay: mapped(mieRgb),
				displayInteraction: totalDisplay.map((value, index) => value - mapped(rayleighRgb)[index] - mapped(mieRgb)[index])} : null;
			return {elevationDegrees: ray.elevationDegrees, inputs, low, high, cached, signedDifference: cached.map((value, index) => value - high[index]),
				maximumRefinementRelative: Math.max(...high.map((value, index) => Math.abs(low[index] - value) / Math.max(Math.abs(value), 1e-12))),
				cachedRgb: project(cached), referenceRgb: project(high), observedRgb: ray.stages[2].slice(0, 3), components};
		});
		assert.equal(rows.length, 6);
		assert.ok(rows.every((row) => row.maximumRefinementRelative < 0.0001), 'Continuous reference not sufficiently refined.');
		if (previous) assert.ok(rows.every((row) => row.components.maximumAdditiveRelative < 1e-10), 'Source partitions do not add to total.');
		run.write('reference.json', {physical, weights, rows, elapsedMilliseconds: Date.now() - started});
		run.finish('accepted', {rows: rows.length, elapsedMilliseconds: Date.now() - started});
		verifyRun(run.path);
		console.log(JSON.stringify({run: run.path, rows: rows.map((row) => ({elevation: row.elevationDegrees, cachedRgb: row.cachedRgb, referenceRgb: row.referenceRgb, refinement: row.maximumRefinementRelative}))}));
	} catch (error) {run.finish('failed', {error: String(error)}); throw error;}
}

main();
