import assert from 'node:assert/strict';
import test from 'node:test';
import {CAPTURE_TIMES} from '../../experiments/b1-directional-sky-radiance/benchmark-domain.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import DistantSunBrunetonView from './DistantSunBrunetonView.js';
import DistantSunPointLocalCacheInventory from './DistantSunPointLocalCacheInventory.js';
import {DistantSunPointLocalProfileCompilerInputs} from './DistantSunPointLocalProfileCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';

test('production Q30 geometry closes every interpolation stencil and conserves a constant zenith density', () => {
	const scenes = CAPTURE_TIMES.map((time, index) => ({id: `b1-${index}`, time, fittedAzimuthDegrees: 90}));
	const profiles = scenes.map((scene) => createBrunetonProductionProfile({...scene, maximumScatteringOrder: 4}));
	const input = DistantSunPointLocalProfileCompilerInputs.createBatch(profiles, {
		ids: scenes.map((scene) => scene.id),
	});
	const inventory = new DistantSunPointLocalCacheInventory().create(
		input.buildRequest,
		input.scenes,
		input.wavelengths,
	);
	const packet = {
		buildRequest: input.buildRequest,
		scenes: inventory.scenes,
		layout: {logicalDirectionCount: 4374, channelCount: 40, wavelengthIndexes: [...input.wavelengths]},
	};
	const view = new DistantSunBrunetonView();
	const samples = view.prepare(packet, scenes);
	assert.equal(samples.flat(2).length, 17 * 81 * 30);
	for (const sample of samples.flat(2)) {
		assert.ok(sample.step > 0 && sample.altitude > 0);
		assert.ok(Math.abs(sample.taps.reduce((sum, tap) => sum + tap.weight, 0) - 1) < 1e-12);
		assert.ok(sample.taps.every((tap) => Number.isInteger(tap.index) && tap.index >= 0 && tap.weight >= 0));
	}
	const transparent = structuredClone(input.buildRequest);
	transparent.transportSpec.domains.spectrum.channels[0].rayleighScatteringPerMeter = 0;
	transparent.transportSpec.domains.spectrum.channels[0].mieExtinctionPerMeter = 0;
	const constant = new Float32Array(inventory.scenes[0].keys.length * 4374).fill(1);
	const radiance = view.integrate(constant, samples[0][40], transparent, 0);
	assert.ok(
		Math.abs(radiance - 60000) < 1e-7,
		'Unit density with no extinction integrates to the 60 km zenith path.',
	);
	const ozonePacket = structuredClone(packet);
	ozonePacket.buildRequest.transportSpec.atmosphere.ozone.absorptionEnabled = true;
	assert.throws(() => view.prepare(ozonePacket, scenes));
});

test('Q30 applies midpoint attenuation on both halves of each interval and rejects invalid cache radiance', () => {
	const view = new DistantSunBrunetonView();
	const request = {
		transportSpec: {
			atmosphere: {rayleighScaleHeightMeters: 8000, mieScaleHeightMeters: 1200},
			domains: {spectrum: {channels: [{rayleighScatteringPerMeter: 0.1, mieExtinctionPerMeter: 0}]}},
		},
	};
	const samples = [
		{step: 2, altitude: 0, taps: [{index: 0, weight: 1}]},
		{step: 3, altitude: 0, taps: [{index: 1, weight: 1}]},
	];
	const actual = view.integrate(new Float32Array([4, 7]), samples, request, 0);
	const expected = 8 * Math.exp(-0.1) + 21 * Math.exp(-0.35);
	assert.ok(Math.abs(actual - expected) < 1e-13);
	assert.throws(() => view.integrate(new Float32Array([NaN, 7]), samples, request, 0), /invalid radiance/);
});

test('candidate Q30 closes the complete solar cubic halo for every B1 ray and conserves constant density', () => {
	const scenes = CAPTURE_TIMES.map((time, index) => ({id: `b1-${index}`, time, fittedAzimuthDegrees: 90}));
	const profiles = scenes.map((scene) => createBrunetonProductionProfile({...scene, maximumScatteringOrder: 4}));
	const input = DistantSunPointLocalProfileCompilerInputs.createBatch(profiles, {
		ids: scenes.map((scene) => scene.id),
		numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial(),
		solarInterpolation: 'monotone-cubic',
	});
	const inventory = new DistantSunPointLocalCacheInventory().create(
		input.buildRequest,
		input.scenes,
		input.wavelengths,
	);
	const packet = {
		buildRequest: input.buildRequest,
		scenes: inventory.scenes,
		coordinates: inventory.coordinates,
		layout: {
			logicalDirectionCount: inventory.logicalDirectionCount,
			uniqueDirectionCount: inventory.uniqueDirectionCount,
			channelCount: 40,
			wavelengthIndexes: [...input.wavelengths],
		},
	};
	const view = new DistantSunBrunetonView();
	const samples = view.prepare(packet, scenes);
	assert.equal(samples.flat(2).length, 17 * 81 * 30);
	const count = inventory.coordinates.length * inventory.uniqueDirectionCount;
	let fractional = 0;
	for (const sample of samples.flat(2)) {
		assert.equal(sample.taps, undefined);
		assert.ok(Math.abs(sample.cubic.reduce((sum, altitude) => sum + altitude.weight, 0) - 1) < 1e-12);
		for (const altitude of sample.cubic) {
			assert.ok(altitude.fraction >= 0 && altitude.fraction <= 1);
			if (altitude.fraction > 0 && altitude.fraction < 1) fractional++;
			for (const taps of [altitude.previous, altitude.lower, altitude.upper, altitude.next]) {
				assert.ok(taps, 'All registered B1 samples are interior solar queries and require four knots.');
				assert.ok(Math.abs(taps.reduce((sum, tap) => sum + tap.weight, 0) - 1) < 1e-12);
				assert.ok(
					taps.every(
						(tap) => Number.isInteger(tap.index) && tap.index >= 0 && tap.index < count && tap.weight >= 0,
					),
				);
			}
		}
	}
	assert.ok(fractional > 17 * 81 * 30);
	const transparent = structuredClone(input.buildRequest);
	transparent.transportSpec.domains.spectrum.channels[0].rayleighScatteringPerMeter = 0;
	transparent.transportSpec.domains.spectrum.channels[0].mieExtinctionPerMeter = 0;
	const constant = new Float32Array(count).fill(1);
	assert.ok(Math.abs(view.integrate(constant, samples[0][40], transparent, 0) - 60000) < 1e-7);
});

test('bounded near-ground Q30 requires explicit matching scene IDs and retains the full qualification gate', () => {
	const scenes = [{id: 'b1-09:30', time: '09:30', fittedAzimuthDegrees: 90}];
	const profile = createBrunetonProductionProfile({...scenes[0], positionDomain: 'native51-near-ground'});
	const input = DistantSunPointLocalProfileCompilerInputs.createBatch([profile], {
		ids: scenes.map((scene) => scene.id),
		numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial(),
		solarInterpolation: 'monotone-cubic',
	});
	const inventory = new DistantSunPointLocalCacheInventory().create(
		input.buildRequest,
		input.scenes,
		input.wavelengths,
	);
	const packet = {
		buildRequest: input.buildRequest,
		scenes: inventory.scenes,
		coordinates: inventory.coordinates,
		layout: {
			logicalDirectionCount: 4374,
			uniqueDirectionCount: 4058,
			channelCount: 40,
			wavelengthIndexes: [...input.wavelengths],
		},
	};
	const view = new DistantSunBrunetonView();
	assert.throws(() => view.prepare(packet, scenes), /all 17/);
	assert.throws(() => view.prepare(packet, scenes, {sceneIds: []}), /nonempty/);
	assert.throws(() => view.prepare(packet, scenes, {sceneIds: ['b1-09:30', 'b1-09:30']}), /unique/);
	assert.throws(() => view.prepare(packet, scenes, {sceneIds: ['b1-10:15']}));
	const samples = view.prepare(packet, scenes, {sceneIds: ['b1-09:30']});
	assert.equal(samples.flat(2).length, 81 * 30);
	const transparent = structuredClone(input.buildRequest);
	transparent.transportSpec.domains.spectrum.channels[0].rayleighScatteringPerMeter = 0;
	transparent.transportSpec.domains.spectrum.channels[0].mieExtinctionPerMeter = 0;
	const constant = new Float32Array(inventory.coordinates.length * inventory.uniqueDirectionCount).fill(1);
	assert.ok(Math.abs(view.integrate(constant, samples[0][40], transparent, 0) - 60000) < 1e-7);
});

test('candidate Q30 applies directional reconstruction before shared harmonic cubic and altitude blending', () => {
	const view = new DistantSunBrunetonView();
	const request = {
		transportSpec: {
			atmosphere: {rayleighScaleHeightMeters: 8000, mieScaleHeightMeters: 1200},
			domains: {spectrum: {channels: [{rayleighScatteringPerMeter: 0, mieExtinctionPerMeter: 0}]}},
		},
	};
	const values = new Float32Array([0, 0, 0, 4, 10, 4, 10, 8, 8, 6, 4, 0]);
	const directional = (index) => [
		{index, weight: 0.5},
		{index: index + 1, weight: 0.5},
	];
	const single = (index) => [{index, weight: 1}];
	const samples = [
		{
			step: 1,
			altitude: 0,
			cubic: [
				{
					weight: 0.3,
					fraction: 0.25,
					previous: directional(0),
					lower: directional(2),
					upper: directional(4),
					next: directional(6),
				},
				{
					weight: 0.7,
					fraction: 0.25,
					previous: single(8),
					lower: single(9),
					upper: single(10),
					next: single(11),
				},
			],
		},
	];
	const t = 0.25;
	const basis = [2 * t ** 3 - 3 * t ** 2 + 1, t ** 3 - 2 * t ** 2 + t, -2 * t ** 3 + 3 * t ** 2, t ** 3 - t ** 2];
	const lowerAltitude = basis[0] * 2 + basis[1] * (20 / 7) + basis[2] * 7 + basis[3] * (20 / 7);
	const upperAltitude = basis[0] * 6 - basis[1] * 2 + basis[2] * 4 - basis[3] * (8 / 3);
	assert.ok(
		Math.abs(view.integrate(values, samples, request, 0) - (0.3 * lowerAltitude + 0.7 * upperAltitude)) < 1e-13,
	);
});
