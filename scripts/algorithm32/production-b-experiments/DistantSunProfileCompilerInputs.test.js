import assert from 'node:assert/strict';
import test from 'node:test';

import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import {DistantSunSceneCacheCompilerInputs} from '../solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js';
import {createDistantSunSceneCacheCommonShaderSource} from '../solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
import {
	DistantSunProfileCompilerInputs,
	DISTANT_SUN_PROFILE_COMPILER_IDENTITY,
} from './DistantSunProfileCompilerInputs.js';

function profile(overrides = {}) {
	return createBrunetonProductionProfile({
		time: '09:30',
		fittedAzimuthDegrees: 179.5,
		maximumScatteringOrder: 4,
		...overrides,
	});
}

test('maps the exact direct-40 execution profile into the reusable production recurrence request', () => {
	const selected = profile();
	const result = DistantSunProfileCompilerInputs.createInputSet(selected);
	const spec = result.buildRequest.transportSpec;

	assert.equal(result.compilerIdentity, DISTANT_SUN_PROFILE_COMPILER_IDENTITY);
	assert.equal(result.profileIdentity.contentHash, selected.contentHash);
	assert.match(result.numericalIdentity, /^sha256:[a-f0-9]{64}$/u);
	assert.equal(spec.domains.position.count, 48);
	assert.equal(spec.domains.solarZenith.count, 1);
	assert.equal(spec.domains.incoming.directionCount, 68);
	assert.equal(spec.domains.outgoing.faceWidth, 27);
	assert.equal(spec.domains.outgoing.directionCount, 4374);
	assert.equal(spec.domains.spectrum.channels.length, 40);
	assert.equal(spec.shaderProfile.coordinateContract, 'production-source-aligned-v1');
	assert.deepEqual(spec.numerical, {
		sourcePathTransmittanceIntervalCount: 20,
		transportIntervalCount: 40,
		maximumScatteringOrder: 4,
	});
	assert.equal(spec.atmosphere.ozone.absorptionEnabled, false);
	assert.ok(spec.atmosphere.ozone.crossSectionTable.values.every((value) => value === 0));
	assert.deepEqual(
		spec.domains.spectrum.channels.map((channel) => channel.rayleighScatteringPerMeter),
		selected.models.atmosphere.seaLevelRayleighScattering.values,
	);
	assert.deepEqual(
		spec.domains.spectrum.channels.map((channel) => channel.mieExtinctionPerMeter),
		selected.models.atmosphere.seaLevelMieExtinction.values,
	);
	assert.deepEqual(
		spec.domains.spectrum.channels.map((channel) => channel.groundAlbedo),
		selected.models.groundBoundary.albedo.values,
	);
});

test('selects the exact production source direction and source-aligned W27/F68 frames in shader source', () => {
	const selected = profile();
	const spec = DistantSunProfileCompilerInputs.createInputSet(selected).buildRequest.transportSpec;
	const source = createDistantSunSceneCacheCommonShaderSource({
		wavelengthNanometers: 550,
		sourceIrradiance: 1,
		ozoneCrossSection: 0,
		coordinateContract: spec.shaderProfile.coordinateContract,
		sourceDirection: spec.source.directionToLight,
		positionAltitudesMeters: [0],
		solarZenithDegrees: [spec.domains.solarZenith.nodes[0].solarZenithDegrees],
	});
	const formattedDirection = spec.source.directionToLight
		.map((value) => Number(value).toExponential(17).replace('e+', 'e'))
		.join(', ');

	assert.ok(source.includes(`const vec3 SOURCE_DIRECTION = vec3(${formattedDirection});`));
	assert.ok(source.includes('return vec3(0.0, 0.0, radius);'));
	assert.ok(source.includes('xAxis = SOURCE_DIRECTION;'));
	assert.ok(source.includes('return productionLocalToWorld(localDirection, true);'));
	assert.ok(source.includes('return productionLocalToWorld(localDirection, false);'));
	assert.ok(source.includes('return normalize(productionWorldToW27(worldDirection));'));
	assert.ok(source.includes('dot(normalize(point), SOURCE_DIRECTION)'));
	assert.ok(source.includes('floor(normalized * float(POSITION_COUNT))'));
	assert.ok(source.includes('return rayBlockedByGround(origin, direction);'));
	assert.ok(source.includes('return !rayBlockedByGround(point, SOURCE_DIRECTION);'));
	assert.ok(source.includes('return 2;'));
	assert.ok(source.includes('float groundIncomingContribution('));
	assert.ok(source.includes('abs(uCoordinate - roundedU) <= 1e-10'));
	assert.ok(source.includes('float constantTerm = height * (radius + BOTTOM_RADIUS);'));
	assert.ok(source.includes('float constantTerm = (radius - TOP_RADIUS) * (radius + TOP_RADIUS);'));
	assert.ok(source.includes('halfLinear >= 0.0 ? -constantTerm / (halfLinear + root)'));
	assert.ok(source.includes('void compensatedAdd(float value, inout float sum, inout float compensation)'));
	assert.ok(source.includes('float radialOffset = point.z - BOTTOM_RADIUS;'));
	assert.ok(source.includes('float altitudeMeters = altitudeAtPoint(point);'));
	assert.ok(source.includes('distanceMeters = denominator == 0.0 ? 0.0 : max(0.0, constantTerm / denominator);'));
	assert.ok(!source.includes('float solarZenith = radians(float(solarZenithIndex) + 0.5);'));
});

test('retains the deployed receiver-local coordinate contract as the offline compiler default', () => {
	const source = createDistantSunSceneCacheCommonShaderSource({
		wavelengthNanometers: 550,
		sourceIrradiance: 1,
		ozoneCrossSection: 0,
	});

	assert.ok(source.includes('float angle = radians(SOLAR_ZENITH_DEGREES[solarZenithIndex]);'));
	assert.ok(source.includes('float solarZenith = radians(float(solarZenithIndex) + 0.5);'));
	assert.ok(source.includes('vec3 direction = localToWorld(point, localDirection);'));
	assert.ok(source.includes('return direction;'));
	assert.ok(source.includes('return worldToLocal(point, worldDirection);'));
	assert.ok(source.includes('POSITION_ALTITUDES[index + 1]'));
	assert.ok(source.includes('return branchBreaks(origin, direction, lengthMeters, breaks);'));
	assert.ok(!source.includes('float groundIncomingContribution('));
	assert.ok(source.includes('abs(uCoordinate - roundedU) <= 1e-5'));
	assert.ok(source.includes('if (abs(radius - BOTTOM_RADIUS) <= 1.0)'));
});

test('changes the profile-driven numerical identity when a physical condition changes', () => {
	const first = DistantSunProfileCompilerInputs.createInputSet(profile({fittedAzimuthDegrees: 179.5}));
	const second = DistantSunProfileCompilerInputs.createInputSet(profile({fittedAzimuthDegrees: 170}));

	assert.notEqual(first.profileIdentity.contentHash, second.profileIdentity.contentHash);
	assert.notEqual(first.numericalIdentity, second.numericalIdentity);
	assert.notDeepEqual(
		first.buildRequest.transportSpec.source.directionToLight,
		second.buildRequest.transportSpec.source.directionToLight,
	);
});

test('rejects unsupported orders, incoming domains, and ozone profiles before browser compilation', () => {
	assert.throws(
		() => DistantSunProfileCompilerInputs.createInputSet(profile({maximumScatteringOrder: 3})),
		/cumulative J4/u,
	);
	assert.throws(
		() =>
			DistantSunProfileCompilerInputs.createInputSet(
				profile({incomingDirectionVariant: 'ordinary-fibonacci-34'}),
			),
		/Native48\/F68\/W27/u,
	);
	const ozoneProfile = profile();
	const changedAtmosphere = Object.create(Object.getPrototypeOf(ozoneProfile.models.atmosphere));
	Object.assign(changedAtmosphere, ozoneProfile.models.atmosphere, {
		_constants: {...ozoneProfile.models.atmosphere.constants, ozoneAbsorptionEnabled: true},
	});
	assert.throws(
		() =>
			DistantSunProfileCompilerInputs.createInputSet({
				...ozoneProfile,
				models: {...ozoneProfile.models, atmosphere: changedAtmosphere},
			}),
		/ozone cross-section/u,
	);
});

test('preserves Native48 Native15 no-ozone compiler request and ledger identities', () => {
	const scene = DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene();
	const input = DistantSunSceneCacheCompilerInputs.createInputSet(scene);

	assert.equal(
		CanonicalValueHash.sha256Value(input.buildRequest),
		// P1 deliberately removed enabled ozone; P2 qualified this canonical no-ozone request.
		'sha256:e3daaf2ee2600caef707c3c1106ae6c03b25577b9f075316511c3c0962645e4b',
	);
	assert.equal(input.buildRequest.transportSpec.atmosphere.ozone.absorptionEnabled, false);
	assert.ok(input.buildRequest.transportSpec.atmosphere.ozone.crossSectionTable.values.every((value) => value === 0));
	assert.equal(
		CanonicalValueHash.sha256Value(input.ledger.toRecord()),
		'sha256:b5e38741359b0e60ce6155a47941a000192c7aec1b6240d48bf3ab3bb032f671',
	);
});
