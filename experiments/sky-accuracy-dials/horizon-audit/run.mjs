import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun, identity, readRepository, storage, verifyRun} from '../io/files.mjs';
import {readParent, pinProductionClosure, requireUnusedStage} from '../hypotheses/common.mjs';
import {colorimetry, ciePath} from '../horizon/diagnosis-color.mjs';
import {LocalSunCompactProfileSelection} from '../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js';
import {LocalSunCompactCpuAssembly} from '../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactCpuAssembly.js';
import {LocalSunCompactReconstruction} from '../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js';
import {SphericalEarthGeometry} from '../../../src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {DistantSunLightSource} from '../../../src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER as f68} from '../../../src/algorithm32/sampling-domains/index.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE, NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/native-15/native-15-profile.js';
import {altitude, along, bounds, columns, domeExit, dot, flatColumn, integrate, replay, roots, source, unit} from './math.mjs';
import {angularRule, incomingSource} from './angular.mjs';

/** Maximum relative discrepancy, retaining absolute error separately in result rows.
 * @param {number[]} a @param {number[]} b @returns {number}
 */
function relative(a, b) {return Math.max(...a.map((x, c) => Math.abs(x - b[c]) / Math.max(1e-12, Math.abs(b[c]))));}

/** Copy numeric GLSL geometry constants from the authenticated installed shader.
 * @param {string} shader @param {string} name @returns {number}
 */
function scalar(shader, name) {
	const match = shader.match(new RegExp('const float ' + name + ' = ([^;]+);'));
	assert.ok(match, 'Missing geometry constant ' + name);
	const value = Number(match[1]); assert.ok(Number.isFinite(value)); return value;
}

/** Freeze a physical unit direction at a stated elevation and Sun-relative azimuth.
 * @param {number[]} sun @param {number} elevation @param {number} heading @returns {number[]}
 */
function direction(sun, elevation, heading) {
	const h = heading * Math.PI / 180, e = elevation * Math.PI / 180, toward = unit([sun[0], sun[1], 0]);
	return [Math.cos(e) * (toward[0] * Math.cos(h) - toward[1] * Math.sin(h)),
		Math.cos(e) * (toward[1] * Math.cos(h) + toward[0] * Math.sin(h)), Math.sin(e)];
}

/** Sparse actual physical-J reconstruction on the same topology; memoization never allocates a full cache.
 * @param {LocalSunCompactConstructionProfile} profile @returns {HorizonAuditLookupSampler}
 */
function sparseLookup(profile) {
	const reconstruction = new LocalSunCompactReconstruction({geometry: profile.models.geometry, atmosphere: profile.models.atmosphere, topology: profile.domains.topology});
	const assembly = LocalSunCompactCpuAssembly.fromCompactProfile(profile);
	return (point, v) => {
		const position = {coordinates: /** @type {SkyVector3} */ ([point[0], point[1], point[2]]), units: /** @type {const} */ ('meters')};
		const taps = reconstruction.resolveStencil({position, physicalOutgoingDirection: /** @type {SkyVector3} */ ([v[0], v[1], v[2]])});
		const values = Array(15).fill(0);
		for (const tap of taps) for (let i = 0; i < tap.directionStencil.indices.length; i++) {
			const node = assembly.samplePrimaryScatteringDensity({positionIndex: tap.positionIndex, directionIndex: tap.directionStencil.indices[i]});
			for (let c = 0; c < 15; c++) values[c] += Math.fround(node.values[c]) * tap.positionWeight * tap.directionStencil.weights[i] * tap.spectralScales[c];
		}
		assert.ok(values.every(Number.isFinite));
		return {values, taps};
	};
}

/** Execute H16-H20 once, preserving setup repairs and scientifically unsupported cells.
 * @returns {void} New immutable accepted report, or a sealed failure that the caller must inspect before repair.
 */
function main() {
	const spent = requireUnusedStage('h16-h20-audit', true), started = Date.now(), deadline = started + 1200000 - spent, before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const observation = ['local', 'distant'].map(mode => /** @type {HorizonAuditObservation} */ (readParent('00239-horizon-stages', mode + '-observation.json', parents)));
	const prior = /** @type {HorizonAuditReference} */ (readParent('00240-horizon-ref', 'reference.json', parents));
	const geometryPacket = /** @type {HorizonAuditGeometryPacket} */ (readParent('00246-h5-n1-geometry', 'geometry.json', parents));
	readParent('00261-h13-flat-r2', 'flat.json', parents);
	const shaders = ['local', 'distant'].map(mode => {
		const path = 'tmp/experiments/sky-accuracy-dials/runs/00239-horizon-stages/' + mode + '-shader.glsl.gz';
		parents.push(identity(path)); return gunzipSync(readRepository(path)).toString();
	});
	const closure = ['src/algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js',
		'src/algorithm32/implementation/local-sun/cache/LocalSunCompactCpuAssembly.js',
		'src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js',
		'src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js',
		'src/algorithm32/implementation/distant-sun/DistantSunLightSource.js'];
	pinProductionClosure(closure, parents);
	for (const path of ['src/flat32/SphericalDistantMode.js', 'src/flat32/FlatLocalMode.js', 'src/flat32/Flat32Bootstrap.js',
		'src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js',
		'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/horizon-diagnosis-plan.md', ciePath]) parents.push(identity(path));
	const run = createRun('h16-h20-audit', {parents, operation: 'Independent immediate-horizon endpoints, sparse lookup, fixed-source view integration, sparse P2 incoming angular comparison and retained composition audit.',
		parameters: {maximumMilliseconds: 1200000, maximumRetainedBytes: 12 * 1024 ** 2, previousFailureMilliseconds: spent,
			elevations: [.05, .25, 1, 3, 20], headings: [0, 90, 180], maximumGpuAttempts: 1,
			predictions: 'Endpoint/support/accumulation defects amplify low rays; incoming deficit must be attributable to angles/species; composition cannot explain pre-display neutrality.',
			limitations: 'No full cache, N4 descendant regeneration, matched libRadtran horizon outputs or production edit.'}});
	let lastGuard = 0;
	/** Enforce the common deadline and flush progress during synchronous CPU work. @returns {void} */
	function guard() {
		assert.ok(Date.now() < deadline - 5000, 'H16-H20 compute allowance reached.');
		if (Date.now() - lastGuard > 15000) {run.guard(); lastGuard = Date.now(); run.progress('compute', 'H16-H20 bounded CPU work remains active.');}
	}
	try {
		console.log(JSON.stringify({run: run.path, started: new Date(started).toISOString()}));
		const profile = new LocalSunCompactProfileSelection().create({observation: observation[0].facts.state.observation,
			observerPosition: {coordinates: [0, 0, 5], units: 'meters'}, viewRayLimit: {value: 1926774, units: 'meters'}, maximumScatteringOrder: 1});
		assert.equal(prior.physical.g, .7); assert.equal(prior.physical.albedo, .8);
		assert.equal(prior.physical.mieHeight, 1200); assert.equal(prior.physical.rayleighHeight, 8000);
		assert.deepEqual(prior.physical.rayleigh, [...profile.models.atmosphere.seaLevelRayleighScattering.values]);
		assert.deepEqual(prior.physical.mie, [...profile.models.atmosphere.seaLevelMieExtinction.values]);
		assert.deepEqual(prior.physical.sourceIrradiance, [...profile.spectral.sourceIrradianceDensity.values]);
		assert.deepEqual(prior.physical.sourcePosition, [...profile.models.lightSource.configuration.position.coordinates].map(x => x || 0));
		assert.equal(DEFAULT_NATIVE_PRODUCTION_PROFILE.physical.atmosphere.mie.angstromAlpha.value, .8);
		assert.equal(DEFAULT_NATIVE_PRODUCTION_PROFILE.physical.atmosphere.mie.angstromBeta.value, .04);
		const centerMatch = shaders[0].match(/GEOMETRY_OBSERVER_DOME_CENTER_METERS = vec3\(0.0, 0.0, ([^)]+)\)/);
		assert.ok(centerMatch);
		const localSun = unit(prior.physical.sourcePosition.map((x, i) => x - (i === 2 ? 5 : 0)));
		/** @type {HorizonAuditInput[]} */ const inputs = ['flat', 'spherical'].map((geometry, i) => ({...prior.physical,
			geometry: /** @type {HorizonDiagnosticGeometry} */ (geometry), sourceKind: i === 0 ? 'finite' : 'parallel',
			direction: [0, 0, 1], sourceDirection: i === 0 ? localSun : geometryPacket.distantDirection,
			radius: 6360000, topAltitude: i === 0 ? scalar(shaders[0], 'GEOMETRY_TOP_ALTITUDE_METERS') : scalar(shaders[1], 'GEOMETRY_TOP_RADIUS_METERS') - 6360000,
			incidentScale: 1, domeCenterZ: Number(centerMatch[1]), domeRadius: scalar(shaders[0], 'GEOMETRY_OBSERVER_DOME_RADIUS_METERS')}));
		const spherical = new SphericalEarthGeometry({bottomRadius: {value: 6360000, units: 'meters'}, topRadius: {value: 6420000, units: 'meters'}, observerHeight: {value: 5, units: 'meters'}});
		spherical.configureLightSource({lightSource: new DistantSunLightSource({angularRadius: {value: .26667, units: 'degrees'}}), observation: observation[1].facts.state.observation,
			placement: {kind: 'distant-direction', directionToLight: /** @type {SkyVector3} */ ([inputs[1].sourceDirection[0], inputs[1].sourceDirection[1], inputs[1].sourceDirection[2]])}});
		const lookup = sparseLookup(profile);
		const registration = inputs.flatMap((input, mode) => [.05, .25, 1, 3, 20].flatMap(elevation => [0, 90, 180].map(heading => {
			const v = direction(input.sourceDirection, elevation, heading), origin = [0, 0, mode === 0 ? 5 : 6360005];
			const physical = bounds(input, origin, v), dome = mode === 0 ? domeExit(input, origin, v) : physical.top;
			return {mode, elevation, heading, origin, direction: v, physical, dome, length: Math.min(physical.distance, dome)};
		})));
		run.write('registration.json', {inputs, rays: registration, viewIntervals: [15, 30], groundBoundary: 'canonical-black in both app modes',
			uncertainty: 'Freeze absolute comparison floor 1e-12 W m^-2 sr^-1 nm^-1 and 4x independent 8/16 refinement per channel before candidate deltas; geometry allowance 4 Float32 relative ulps of distance.',
			angularPoints: [5, 250], angularChannels: [2, 7, 12], angularCounts: [8, 16], incomingColumnAndViewGaussCount: 8,
			questions: [
				'Use CPU sparse observations because they suffice for N1 and avoid a new app/cache build; no GPU proof claimed.',
				'Keep app black ground distinct from paper benchmark ground; material matches paper, app geometry/order/ground do not establish a paper score.',
				'Use two sparse N1-driven P2 sources for H19; no retained current N4 incoming field exists to qualify later orders.',
				'Retain the installed observer dome as baseline and label its removal an explicit domain sensitivity.',
			]});
		// Independent analytic controls precede all hypothesis/candidate comparisons.
		const constantLength = 12345, constantExtinction = .00003;
		const constantAnalytic = -Math.expm1(-constantLength * constantExtinction) / constantExtinction;
		const constantNumeric = flatColumn(0, 1, constantLength, 1 / constantExtinction);
		assert.ok(Math.abs(constantNumeric - constantAnalytic) < 1e-10);
		assert.ok(Math.abs(flatColumn(25, 0, 10000, 1200) - Math.exp(-25 / 1200) * 10000) < 1e-10);
		run.write('controls.json', {constantAnalytic, constantNumeric, horizontalColumn: flatColumn(25, 0, 10000, 1200),
			materialVerified: true, geometryDistanceRelativeAllowance: 4 * 2 ** -23, spectralAbsoluteFloor: 1e-12});
		const endpointRows = [], accumulationRows = [], supportRows = [], pathRows = [];
		for (const row of registration) {
			guard(); const input = inputs[row.mode], v = row.direction, origin = row.origin;
			run.progress('H16-H18', 'Audit mode ' + row.mode + ', elevation ' + row.elevation + ', heading ' + row.heading + '.');
			const low = integrate(input, origin, v, 0, row.length, 8), high = integrate(input, origin, v, 0, row.length, 16);
			const allowance = high.spectrum.map((x, c) => 4 * Math.abs(x - low.spectrum[c]) + 1e-12);
			const extended = row.mode === 0 ? integrate(input, origin, v, row.length, Math.min(4 * row.length, row.physical.top), 16) : null;
			const fullTail = row.mode === 0 ? integrate(input, origin, v, row.length, row.physical.top, 16) : null;
			const fullTailLow = row.mode === 0 ? integrate(input, origin, v, row.length, row.physical.top, 8) : null;
			const retained = observation[row.mode].rays.find(r => r.uv[0] === .5 && r.elevationDegrees === row.elevation);
			const installed = row.heading === 180 && retained ? retained.stages[3][3] : null;
			// A matched captured ray has small Float32 direction differences: compute its endpoint on that exact direction separately.
			const capturedV = retained ? retained.stages[3].slice(0, 3) : v;
			const capturedPhysical = bounds(input, origin, capturedV), capturedIndependent = row.mode === 0 ? Math.min(capturedPhysical.distance, domeExit(input, origin, capturedV)) : capturedPhysical.distance;
			endpointRows.push({...row, installedMeters: installed, capturedIndependentMeters: installed === null ? null : capturedIndependent,
				capturedDifferenceMeters: installed === null ? null : installed - capturedIndependent,
				comparisonAllowanceMeters: 4 * 2 ** -23 * row.length,
				spectrum: high.spectrum, allowance, refinementRelative: relative(low.spectrum, high.spectrum),
				tail4x: extended?.spectrum ?? null, fullTail: fullTail?.spectrum ?? null,
				tailRefinementAbsolute: fullTail?.spectrum.map((x, c) => Math.abs(x - fullTailLow.spectrum[c])) ?? null,
				color: colorimetry(high.spectrum, 'bin-integrated'),
				withoutDomeColor: fullTail ? colorimetry(high.spectrum.map((x, c) => x + fullTail.spectrum[c]), 'bin-integrated') : null});
			if (row.heading !== 180 || ![.05, 3, 20].includes(row.elevation)) continue;
			const counts = row.mode === 0 ? [15, 30, 60] : [30, 60, 120];
			accumulationRows.push({mode: row.mode, elevation: row.elevation, reference: high.spectrum, allowance,
				replay: counts.map(count => {const spectrum = replay(input, origin, v, row.length, count); return {count, spectrum, signedDifference: spectrum.map((x, c) => x - high.spectrum[c]), maximumRelative: relative(spectrum, high.spectrum), color: colorimetry(spectrum, 'bin-integrated')};})});
			const cuts = [0, 250, 1000, 5000, 20000, 100000, 500000, row.length].filter((x, i, all) => x <= row.length && all.indexOf(x) === i).sort((a, b) => a - b);
			pathRows.push({mode: row.mode, elevation: row.elevation, samples: cuts.map(t => ({distance: t, point: along(origin, v, t), viewColumns: columns(input, origin, v, t), source: source(input, along(origin, v, t), v),
				cumulativeSpectrum: integrate(input, origin, v, 0, t, 16).spectrum}))});
			for (const t of [0, 1000, 10000]) {
				const point = along(origin, v, t), position = {coordinates: /** @type {SkyVector3} */ ([point[0], point[1], point[2]]), units: /** @type {const} */ ('meters')};
				const physicalDirection = /** @type {SkyVector3} */ ([v[0], v[1], v[2]]);
				const geometry = row.mode === 0 ? profile.models.geometry : spherical;
				const local = geometry.expressScatteringCacheDirection({position, physicalOutgoingDirection: physicalDirection});
				const roundTrip = geometry.expressPhysicalScatteringCacheDirection({position, cacheDirection: local});
				const exact = source(input, point, v).species.reduce((a, b) => a.map((x, c) => x + b[c]));
				const value = row.mode === 0 ? lookup(point, v) : null;
				supportRows.push({mode: row.mode, elevation: row.elevation, distance: t, point, altitude: altitude(input, point), local, roundTrip,
					roundTripAbsolute: Math.max(...v.map((x, i) => Math.abs(x - roundTrip[i]))), exact,
					lookup: value, relativeSourceDifference: value ? relative(value.values, exact) : null,
					distantSourceGap: row.mode === 1 ? 'Current N4 packed values not retained; coordinate round-trip is not N4 lookup accuracy.' : null});
			}
		}
		run.write('endpoints.json', endpointRows); run.write('accumulation.json', accumulationRows); run.write('support.json', supportRows); run.write('paths.json', pathRows);
		run.progress('H19', 'Sparse actual-angle versus boundary-split incoming N1 comparison; no full recurrence.');
		const angularRows = [];
		for (let mode = 0; mode < 2; mode++) for (const z of [5, 250]) {
			guard(); const original = inputs[mode], v = direction(original.sourceDirection, 3, 180), origin = [0, 0, mode === 0 ? 5 : 6360005];
			const t = mode === 0 ? (z - 5) / v[2] : roots(origin, v, original.radius + z).filter(x => x >= 0).at(-1);
			const point = along(origin, v, t), channels = [2, 7, 12];
			const input = {...original, rayleigh: channels.map(c => original.rayleigh[c]), mie: channels.map(c => original.mie[c]), sourceIrradiance: channels.map(c => original.sourceIrradiance[c])};
			const domain = mode === 0 ? profile.domains.incomingDirections : f68;
			const geometry = mode === 0 ? profile.models.geometry : spherical;
			const actualDirections = domain.unitVectors.map(cacheDirection => [...geometry.expressPhysicalScatteringCacheDirection({position: {coordinates: /** @type {SkyVector3} */ ([point[0], point[1], point[2]]), units: 'meters'}, cacheDirection})]);
			// Spherical incoming F68 and outgoing W27 use distinct frames; use the actual incoming owner.
			if (mode === 1) actualDirections.splice(0, actualDirections.length, ...domain.unitVectors.map(cacheDirection => [...spherical.expressPhysicalIncomingRadianceDirection(cacheDirection)]));
			const baseline = incomingSource(input, point, v, actualDirections, [...domain.integrationWeights.values], guard);
			const variants = [8, 16].map(count => {const rule = angularRule(input, point, count); return incomingSource(input, point, v, rule.directions, rule.weights, guard);});
			angularRows.push({mode, altitude: z, point, direction: v, wavelengths: channels.map(c => NATIVE_15_SPECTRAL_BASIS.channels[c].center.value), baseline, variants,
				limit: 'Pure-P2 source from the same continuous N1 definition, with fixed finite incoming path quadrature. Not current N4 field truth, ground-material sensitivity or propagated color.'});
			run.progress('H19', 'Finished sparse receiver mode ' + mode + ', altitude ' + z + ' m.');
		}
		run.write('incoming.json', angularRows);
		const compositionRows = observation.flatMap((packet, mode) => packet.rays.filter(r => r.uv[0] === .5).map(r => ({mode, elevation: r.elevationDegrees,
			hit: r.stages[4][0], hasSceneEndpoint: r.stages[4][2], pathRgb: r.stages[2].slice(0, 3), composedRgb: r.stages[1].slice(0, 3), displayRgb: r.stages[0].slice(0, 3),
			compositionDelta: r.stages[1].slice(0, 3).map((x, c) => x - r.stages[2][c]),
			limit: 'Retained installed stages at fixed saved illuminance; no new black-background rendering or hit-mask intervention.'})));
		run.write('composition.json', compositionRows);
		const boundaryRows = inputs.flatMap((input, mode) => {
			const horizon = mode === 0 ? 0 : -Math.acos(input.radius / (input.radius + 5)) * 180 / Math.PI;
			return [horizon - .00001, horizon + .00001, -Math.asin(1e-6) * 180 / Math.PI - 1e-7, -Math.asin(1e-6) * 180 / Math.PI + 1e-7,
				Math.asin(1e-6) * 180 / Math.PI - 1e-7, Math.asin(1e-6) * 180 / Math.PI + 1e-7].map(e => {
				const origin = [0, 0, mode === 0 ? 5 : 6360005], v = direction(input.sourceDirection, e, 180);
				return {mode, elevation: e, physical: bounds(input, origin, v), topBranch: v[2] > 1e-6, groundBranch: v[2] < -1e-6,
					limit: 'Independent geometry plus source-traced branch predicate; raster hit masks not re-rendered.'};
			});
		});
		run.write('boundaries.json', boundaryRows);
		const elapsedMilliseconds = Date.now() - started;
		const facts = {elapsedMilliseconds, gpuAttempts: 0, before, after: storage(), rays: registration.length, supportQueries: supportRows.length,
			angularReceivers: angularRows.length, maximumEndpointDifferenceMeters: Math.max(...endpointRows.map(r => Math.abs(r.capturedDifferenceMeters ?? 0))),
			maximumDirectionRoundTrip: Math.max(...supportRows.map(r => r.roundTripAbsolute)),
			limits: ['Distant N4 cache values and propagated corrected orders unmeasured.', 'No new display/depth or GPU arithmetic proof.', 'No matched libRadtran horizon score.']};
		run.write('summary.json', facts);
		guard(); const seal = run.finish('accepted', facts); verifyRun(run.path);
		assert.ok(storage().retainedBytes - before.retainedBytes <= 12 * 1024 ** 2);
		console.log(JSON.stringify({run: run.path, seal, ...facts}));
	} catch (error) {run.finish('failed', {error: String(error), elapsedMilliseconds: Date.now() - started, deadlineHit: Date.now() >= deadline - 5000}); throw error;}
}

main();
