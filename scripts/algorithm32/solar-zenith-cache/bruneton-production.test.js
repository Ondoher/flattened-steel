import assert from 'node:assert/strict';
import test from 'node:test';
import {CAPTURE_TIMES} from '../../experiments/b1-directional-sky-radiance/benchmark-domain.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import DistantSunBrunetonView from './DistantSunBrunetonView.js';
import DistantSunPointLocalCacheInventory from './DistantSunPointLocalCacheInventory.js';
import {DistantSunPointLocalProfileCompilerInputs} from './DistantSunPointLocalProfileCompilerInputs.js';

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
