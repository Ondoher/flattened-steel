#!/usr/bin/env node

import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import {CanonicalAtmosphere} from '../../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/native-15/native-15-profile.js';
import WavelengthMath from '../../../src/algorithm32/math/WavelengthMath.js';
import {
	BRUNETON_OZONE_COMPOSITION,
	BrunetonOzoneCanonicalAtmosphere,
} from '../atmospheres/BrunetonOzoneCanonicalAtmosphere.js';
import {
	BRUNETON_OZONE_AUTHORITY,
	ozoneAbsorptionExtinctionPerMeter,
} from './BrunetonOzoneReference.js';

const ALTITUDE_ZERO = Object.freeze({value: 0, units: 'meters'});
const ALTITUDE_TEN_KILOMETERS = Object.freeze({value: 10000, units: 'meters'});
const ALTITUDE_SEVENTEEN_POINT_FIVE_KILOMETERS = Object.freeze({value: 17500, units: 'meters'});
const ALTITUDE_TWENTY_FIVE_KILOMETERS = Object.freeze({value: 25000, units: 'meters'});
const ALTITUDE_FORTY_KILOMETERS = Object.freeze({value: 40000, units: 'meters'});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function requireEqual(actual, expected, message) {
	requireCondition(Object.is(actual, expected), `${message}: expected ${expected}, received ${actual}.`);
}

function requireArrayEqual(actual, expected, message) {
	requireCondition(actual.length === expected.length, `${message}: length changed.`);
	for (let index = 0; index < actual.length; index += 1) {
		requireEqual(actual[index], expected[index], `${message}[${index}]`);
	}
}

function occurrenceCount(source, token) {
	return source.split(token).length - 1;
}

function collectShaderSources(value, result = []) {
	if (Array.isArray(value)) {
		for (const entry of value) collectShaderSources(entry, result);
		return result;
	}
	if (value === null || typeof value !== 'object') return result;
	for (const [key, entry] of Object.entries(value)) {
		if ((key === 'source' || key === 'code') && typeof entry === 'string') result.push(entry);
		else collectShaderSources(entry, result);
	}
	return result;
}

function cacheContext(kind, groundReflection = false) {
	return {
		kind,
		order: kind === 'primary-j1' || kind === 'direct-l1' ? 1 : 2,
		inputs: [],
		output: null,
		options: {maximumScatteringOrder: 4, transportIntervalCount: 40},
		domains: {},
		pathIntervalCount: 20,
		...(groundReflection ? {groundReflection: {kind: 'focused-smoke'}} : {}),
	};
}

function alignedConfigurationFrom(atmosphere) {
	const seaLevel = atmosphere.sampleMedium({altitude: ALTITUDE_ZERO});
	return {
		constants: atmosphere.constants,
		spectralBasis: atmosphere.spectralBasis,
		seaLevelRayleighScattering: seaLevel.rayleighScattering,
		seaLevelMieExtinction: seaLevel.mieExtinction,
	};
}

function enabledConfiguration(configuration) {
	return {
		...configuration,
		constants: {...configuration.constants, ozoneAbsorptionEnabled: true},
		ozoneComposition: BRUNETON_OZONE_COMPOSITION,
	};
}

function assertDisabledEquivalence(configuration, label) {
	const base = new CanonicalAtmosphere(configuration);
	const disabled = new BrunetonOzoneCanonicalAtmosphere(configuration);
	requireEqual(disabled.id, base.id, `${label} disabled atmosphere id`);
	requireEqual(disabled.ozoneAbsorptionEnabled, false, `${label} disabled flag`);
	requireEqual(disabled.ozonePeakAbsorptionCoefficients.length, 0, `${label} disabled coefficient count`);
	requireEqual(
		JSON.stringify(disabled.sampleMedium({altitude: ALTITUDE_TWENTY_FIVE_KILOMETERS})),
		JSON.stringify(base.sampleMedium({altitude: ALTITUDE_TWENTY_FIVE_KILOMETERS})),
		`${label} disabled CPU medium`,
	);
	requireEqual(
		JSON.stringify(disabled.createShaderContribution()),
		JSON.stringify(base.createShaderContribution()),
		`${label} disabled runtime contribution`,
	);

	for (const kind of ['primary-j1', 'direct-l1', 'scatter', 'transport', 'accumulate']) {
		const context = cacheContext(kind);
		requireEqual(
			JSON.stringify(disabled.createCacheModule(context)),
			JSON.stringify(base.createCacheModule(context)),
			`${label} disabled ${kind} cache module`,
		);
	}
	const celestialContext = {output: null, sourcePathIntervalCount: 20};
	requireEqual(
		JSON.stringify(disabled.createDistantSunCelestialCacheModule(celestialContext)),
		JSON.stringify(base.createDistantSunCelestialCacheModule(celestialContext)),
		`${label} disabled distant-celestial cache module`,
	);
}

function assertBasisProjection(atmosphere, label) {
	requireCondition(Object.isFrozen(atmosphere.ozonePeakAbsorptionCoefficients), `${label} coefficients must be frozen.`);
	requireEqual(
		atmosphere.ozonePeakAbsorptionCoefficients.length,
		atmosphere.spectralBasis.channelCount,
		`${label} coefficient count`,
	);
	for (let index = 0; index < atmosphere.spectralBasis.channelCount; index += 1) {
		const wavelengthNanometers = WavelengthMath.toNanometers(
			atmosphere.spectralBasis.channels[index].center,
		);
		const expected = ozoneAbsorptionExtinctionPerMeter(25000, wavelengthNanometers);
		requireEqual(
			atmosphere.ozonePeakAbsorptionCoefficients[index],
			expected,
			`${label} aligned ozone coefficient ${index}`,
		);
	}
}

function assertEnabledCpu(base, ozone, label) {
	requireCondition(ozone.id !== base.id, `${label} ozone id must be distinct.`);
	requireEqual(ozone.ozoneAbsorptionEnabled, true, `${label} enabled flag`);
	requireEqual(
		ozone.ozoneIdentity.compositionContentHash,
		BRUNETON_OZONE_COMPOSITION.contentHash,
		`${label} composition identity`,
	);
	assertBasisProjection(ozone, label);

	for (const altitude of [ALTITUDE_ZERO, ALTITUDE_TEN_KILOMETERS, ALTITUDE_FORTY_KILOMETERS]) {
		const sample = ozone.sampleMedium({altitude});
		requireCondition(sample.absorption.values.every((value) => value === 0), `${label} ozone boundary must be zero.`);
	}
	requireEqual(
		ozone.ozoneDensityAtAltitude(ALTITUDE_SEVENTEEN_POINT_FIVE_KILOMETERS),
		0.5,
		`${label} rising density midpoint`,
	);
	requireEqual(
		ozone.ozoneDensityAtAltitude(ALTITUDE_TWENTY_FIVE_KILOMETERS),
		1,
		`${label} density peak`,
	);

	const basePeak = base.sampleMedium({altitude: ALTITUDE_TWENTY_FIVE_KILOMETERS});
	const ozonePeak = ozone.sampleMedium({altitude: ALTITUDE_TWENTY_FIVE_KILOMETERS});
	requireArrayEqual(ozonePeak.rayleighScattering.values, basePeak.rayleighScattering.values, `${label} Rayleigh`);
	requireArrayEqual(ozonePeak.mieScattering.values, basePeak.mieScattering.values, `${label} Mie scattering`);
	requireArrayEqual(ozonePeak.mieExtinction.values, basePeak.mieExtinction.values, `${label} Mie extinction`);
	requireArrayEqual(ozonePeak.scattering.values, basePeak.scattering.values, `${label} total scattering`);
	requireArrayEqual(
		ozonePeak.absorption.values,
		ozone.ozonePeakAbsorptionCoefficients,
		`${label} ozone absorption`,
	);
	for (let index = 0; index < ozonePeak.extinction.values.length; index += 1) {
		requireEqual(
			ozonePeak.extinction.values[index],
			basePeak.extinction.values[index] + ozonePeak.absorption.values[index],
			`${label} total extinction ${index}`,
		);
	}
	requireEqual(
		JSON.stringify(ozone.samplePhase({viewDirection: [0, 0, 1], incomingDirection: [1, 0, 0]})),
		JSON.stringify(base.samplePhase({viewDirection: [0, 0, 1], incomingDirection: [1, 0, 0]})),
		`${label} phase functions`,
	);
}

function assertEnabledRuntime(base, ozone, label) {
	const baseContribution = base.createShaderContribution();
	const ozoneContribution = ozone.createShaderContribution();
	const baseSource = collectShaderSources(baseContribution).join('\n');
	const ozoneSource = collectShaderSources(ozoneContribution).join('\n');
	requireCondition(ozoneSource !== baseSource, `${label} runtime source must change.`);
	requireEqual(occurrenceCount(ozoneSource, 'float ozoneAbsorption ='), 1, `${label} runtime absorption definition`);
	requireEqual(occurrenceCount(ozoneSource, '+ ozoneAbsorption;'), 1, `${label} runtime extinction addition`);
	requireEqual(occurrenceCount(ozoneSource, 'medium.scattering.channels[channelIndex] ='), 1, `${label} scattering assignment`);
	requireCondition(!ozoneSource.includes('ozoneScattering'), `${label} must not add ozone scattering.`);
}

function assertEnabledCacheModules(base, ozone, label) {
	for (const kind of ['primary-j1', 'direct-l1', 'scatter', 'transport']) {
		const context = cacheContext(kind);
		const baseModule = base.createCacheModule(context);
		const ozoneModule = ozone.createCacheModule(context);
		const source = collectShaderSources(ozoneModule).join('\n');
		requireCondition(ozoneModule.contentHash !== baseModule.contentHash, `${label} ${kind} module identity must change.`);
		requireEqual(occurrenceCount(source, 'float cacheOzoneAbsorption('), 1, `${label} ${kind} cache absorption definition`);
		requireEqual(occurrenceCount(source, '+ cacheOzoneAbsorption('), 1, `${label} ${kind} cache extinction addition`);
		requireCondition(!source.includes('cacheOzoneScattering'), `${label} ${kind} must not add ozone scattering.`);
	}

	const reflectiveContext = cacheContext('scatter', true);
	const reflectiveSource = collectShaderSources(ozone.createCacheModule(reflectiveContext)).join('\n');
	requireCondition(
		reflectiveSource.includes('cacheFiniteSegmentTransmittance'),
		`${label} reflected scatter must retain finite-segment transport.`,
	);
	requireCondition(
		reflectiveSource.includes('cacheOzoneAbsorption'),
		`${label} reflected scatter must use ozone-bearing extinction.`,
	);

	const accumulateSource = collectShaderSources(ozone.createCacheModule(cacheContext('accumulate'))).join('\n');
	requireEqual(occurrenceCount(accumulateSource, 'cacheOzoneAbsorption'), 0, `${label} accumulate ozone source`);

	const celestialContext = {output: null, sourcePathIntervalCount: 20};
	const baseCelestial = base.createDistantSunCelestialCacheModule(celestialContext);
	const ozoneCelestial = ozone.createDistantSunCelestialCacheModule(celestialContext);
	const celestialSource = collectShaderSources(ozoneCelestial).join('\n');
	requireCondition(
		ozoneCelestial.contentHash !== baseCelestial.contentHash,
		`${label} distant-celestial module identity must change.`,
	);
	requireEqual(
		occurrenceCount(celestialSource, 'float cacheOzoneAbsorption('),
		1,
		`${label} distant-celestial absorption definition`,
	);
	requireCondition(
		celestialSource.includes('cacheCelestialPathTransmittance'),
		`${label} distant-celestial path transport must remain present.`,
	);
}

function main() {
	const b1Profile = createBrunetonProductionProfile({
		time: '10:15',
		fittedAzimuthDegrees: 0,
		maximumScatteringOrder: 4,
		incomingDirectionVariant: 'reflection-completed-ordinary-68',
	});
	const direct40Configuration = alignedConfigurationFrom(b1Profile.models.atmosphere);
	const native15Configuration = {
		constants: b1Profile.models.atmosphere.constants,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	};

	assertDisabledEquivalence(direct40Configuration, 'Direct40');
	assertDisabledEquivalence(native15Configuration, 'Native15');

	for (const [label, configuration] of [
		['Direct40', direct40Configuration],
		['Native15', native15Configuration],
	]) {
		const base = new CanonicalAtmosphere(configuration);
		const ozone = new BrunetonOzoneCanonicalAtmosphere(enabledConfiguration(configuration));
		assertEnabledCpu(base, ozone, label);
		assertEnabledRuntime(base, ozone, label);
		assertEnabledCacheModules(base, ozone, label);
	}

	process.stdout.write(`${JSON.stringify({
		schemaId: 'contained-bruneton-ozone-canonical-atmosphere-audit-v1',
		status: 'passed',
		authorityId: BRUNETON_OZONE_AUTHORITY.id,
		compositionContentHash: BRUNETON_OZONE_COMPOSITION.contentHash,
		bases: ['Direct40', 'Native15'],
		cachePasses: ['primary-j1', 'direct-l1', 'scatter', 'transport', 'accumulate', 'distant-celestial'],
	}, null, 2)}\n`);
}

main();
