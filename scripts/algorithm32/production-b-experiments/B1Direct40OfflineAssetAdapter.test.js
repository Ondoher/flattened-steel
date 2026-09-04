import assert from 'node:assert/strict';
import test from 'node:test';

import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';
import {CAPTURE_TIMES, SPECTRUM} from '../../experiments/b1-directional-sky-radiance/benchmark-domain.js';
import B1Direct40OfflineAssetAdapter from './B1Direct40OfflineAssetAdapter.js';
import {DistantSunProfileCompilerInputs} from './DistantSunProfileCompilerInputs.js';

function adapter() {
	return new B1Direct40OfflineAssetAdapter({chromePath: process.execPath});
}

const CONDITION = Object.freeze({id: 'b1-09:30', localTime: '09:30', fittedAzimuthDegrees: 179.5});

test('maps one canonical condition to the exact direct-40 profile without resampling', () => {
	const profile = adapter()._createProfile(CONDITION);
	const input = DistantSunProfileCompilerInputs.createInputSet(profile);
	assert.equal(profile.spectral.basis.channelCount, 40);
	assert.deepEqual(
		profile.spectral.basis.channels.map((channel) => channel.center.value),
		Array.from({length: 40}, (_unused, index) => SPECTRUM.minimumNm + SPECTRUM.spacingNm * index),
	);
	assert.deepEqual(
		input.buildRequest.transportSpec.domains.spectrum.channels.map((channel) => channel.centerNanometers),
		profile.spectral.basis.channels.map((channel) => channel.center.value),
	);
	assert.deepEqual(
		input.buildRequest.transportSpec.source.spectralIrradianceDensity,
		profile.spectral.sourceIrradianceDensity.values,
	);
});

test('encodes all 40 exact W27 seam layers without changing representative values', () => {
	const domain = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER;
	const logical = new Float32Array(40 * domain.directionCount);
	for (let layer = 0; layer < 40; layer += 1) {
		for (let direction = 0; direction < domain.directionCount; direction += 1) {
			logical[layer * domain.directionCount + direction] = layer * 10_000 + direction;
		}
	}
	const encoded = adapter()._encodeExactSeams(Buffer.from(logical.buffer), 1, 40);
	const unique = new Float32Array(
		encoded.payload.buffer,
		encoded.payload.byteOffset,
		encoded.payload.byteLength / Float32Array.BYTES_PER_ELEMENT,
	);
	assert.equal(unique.length, 40 * domain.uniqueDirectionCount);
	for (let logicalIndex = 0; logicalIndex < domain.directionCount; logicalIndex += 1) {
		const uniqueIndex = domain.logicalToUniqueDirectionIndices[logicalIndex];
		const representative = domain.logicalToUniqueDirectionIndices.indexOf(uniqueIndex);
		assert.equal(unique[39 * domain.uniqueDirectionCount + uniqueIndex], 390_000 + representative);
	}
	assert.equal(encoded.logicalToUniqueIndex.byteLength, 4374 * Uint16Array.BYTES_PER_ELEMENT);
});

test('rejects noncanonical conditions and incomplete set construction before execution', async () => {
	assert.throws(
		() => adapter()._createProfile({...CONDITION, localTime: '09:31', id: 'b1-09:31'}),
		/canonical fitted condition/u,
	);
	await assert.rejects(
		adapter().compileSet({
			outputDirectory: 'unused',
			conditions: CAPTURE_TIMES.slice(0, 16).map((localTime) => ({
				id: `b1-${localTime}`,
				localTime,
				fittedAzimuthDegrees: 180,
			})),
			productionRevision: 'test',
		}),
		/ordered 17-condition set/u,
	);
});
