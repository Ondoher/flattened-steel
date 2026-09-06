import { readFileSync } from 'node:fs';

import { CanonicalAtmosphere } from '../../atmospheres/CanonicalAtmosphere.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from '../../constants/Algorithm32CanonicalData.js';
import {
	STAR_PARITY_DISTANT_SUN_TRANSPORT_INTERVAL_COUNT,
} from '../fixtures/star-parity-consts.js';
import { SphericalEarthGeometry } from '../../geometries/SphericalEarthGeometry.js';
import { SpectralCalculator } from '../../implementation/SpectralCalculator.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../profiles/index.js';
import { DistantSunLightSource } from '../DistantSunLightSource.js';
import {
	buildDistantSunCpuPrimaryScatteringDensity,
} from '../distant-sun-primary-scattering-density.js';
import {
	buildDistantSunCpuTransportedRadiance,
} from '../distant-sun-scattering-density-transport.js';

const SELECTED_STAR_SOURCE_SHA256 =
	'98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a';
const SELECTED_STAR_L1_PROVENANCE_IDENTITY =
	`algorithm32-star-create-l1-field-direct-sha256-${SELECTED_STAR_SOURCE_SHA256}`;
const payload = JSON.parse(readFileSync(new URL(
	'../../fixtures/algorithm32-star-legacy-34-j2-compatibility.json',
	import.meta.url,
), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL(
	'../fixtures/algorithm32-star-legacy-l1-parity.json',
	import.meta.url,
), 'utf8'));

/**
 * Construct the local production collaborators for the selected-Star scene.
 *
 * @returns {{
 *   atmosphere: CanonicalAtmosphere,
 *   geometry: SphericalEarthGeometry,
 *   lightSource: DistantSunLightSource,
 *   calculator: SpectralCalculator,
 * }} The direct-L1 fixture collaborators.
 */
function createSelectedStarFixture() {
	const directionToLight = payload.scene.directionToLight;
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
		topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
		observerHeight: { value: 2, units: 'meters' },
		observerUpDirection: [0, 0, 1],
		directionToSource: directionToLight,
		cacheAltitudeBinCount: manifest.controls.altitudeBinCount,
		cacheBoundaryAltitude: { value: 2, units: 'meters' },
		sourceTransmittanceIntervalCount:
			manifest.controls.sourceTransmittanceIntervalCount,
	});
	const lightSource = new DistantSunLightSource({
		directionToLight,
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: { value: 0, units: 'radians' },
	});
	const calculator = new SpectralCalculator({
		geometry,
		atmosphere,
		lightSource,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		executionControls: {
			pathIntervalCount: manifest.controls.pathIntervalCount,
			sourceTransmittanceIntervalCount:
				manifest.controls.sourceTransmittanceIntervalCount,
		},
	});

	return { atmosphere, geometry, lightSource, calculator };
}

/**
 * Compare one production radiance field with the preserved selected-Star L1.
 *
 * @param {object} field - Supplies a sealed native-48/Fibonacci-34 field.
 * @returns {object} The comparison metrics needed by the parity diagnostic.
 */
function compareWithSelectedStarL1(field) {
	const reader = field.createReader();
	let comparedScalarCount = 0;
	let sumSquaredAbsoluteError = 0;
	let maximumAbsoluteError = 0;
	let maximumRelativeError = 0;
	let countOverFivePercent = 0;
	let countOverTenPercent = 0;
	let countOverTwentyFivePercent = 0;

	for (const caseId of manifest.extraction.caseIds) {
		const expectedCase = payload.cases.find((entry) => entry.id === caseId);

		for (const incomingSample of expectedCase.incomingSamples) {
			for (let wavelengthIndex = 0;
				wavelengthIndex < incomingSample.radiance.length;
				wavelengthIndex += 1) {
				const expected = incomingSample.radiance[wavelengthIndex];
				const actual = reader.readScalar({
					positionIndex: expectedCase.altitudeBinIndex,
					directionIndex: incomingSample.sampleIndex,
					wavelengthIndex,
				});
				const absoluteError = Math.abs(actual - expected);
				const relativeError = expected === 0
					? 0
					: absoluteError / Math.abs(expected);

				comparedScalarCount += 1;
				sumSquaredAbsoluteError += absoluteError ** 2;
				maximumAbsoluteError = Math.max(maximumAbsoluteError, absoluteError);
				maximumRelativeError = Math.max(maximumRelativeError, relativeError);
				if (relativeError > 0.05) countOverFivePercent += 1;
				if (relativeError > 0.10) countOverTenPercent += 1;
				if (relativeError > 0.25) countOverTwentyFivePercent += 1;
			}
		}
	}

	return {
		comparedScalarCount,
		maximumAbsoluteError,
		maximumRelativeError,
		rmsAbsoluteError: Math.sqrt(
			sumSquaredAbsoluteError / comparedScalarCount,
		),
		countOverFivePercent,
		countOverTenPercent,
		countOverTwentyFivePercent,
	};
}

describe('distant-Sun direct primary-radiance construction', () => {
	it('reproduces all 1,530 selected-Star direct L1 values', () => {
		expect(manifest.authority.selectedImplementation).toBe(
			'scripts/algorithm32-star/src/n-order-cache/build-cpu-distant-n-order-cache.js',
		);
		expect(manifest.authority.selectedImplementationSha256)
			.toBe(SELECTED_STAR_SOURCE_SHA256);

		const fixture = createSelectedStarFixture();
		const field = fixture.lightSource.buildCpuPrimaryRadianceField({
			atmosphere: fixture.atmosphere,
			geometry: fixture.geometry,
			transportIntervalCount:
				STAR_PARITY_DISTANT_SUN_TRANSPORT_INTERVAL_COUNT,
		});
		const reader = field.createReader();
		const firstMismatches = [];
		let mismatchCount = 0;
		let comparedScalarCount = 0;

		for (const caseId of manifest.extraction.caseIds) {
			const expectedCase = payload.cases.find((entry) => entry.id === caseId);

			for (const incomingSample of expectedCase.incomingSamples) {
				for (let wavelengthIndex = 0;
					wavelengthIndex < incomingSample.radiance.length;
					wavelengthIndex += 1) {
					const expected = incomingSample.radiance[wavelengthIndex];
					const actual = reader.readScalar({
						positionIndex: expectedCase.altitudeBinIndex,
						directionIndex: incomingSample.sampleIndex,
						wavelengthIndex,
					});
					const absoluteError = Math.abs(actual - expected);
					const relativeError = expected === 0
						? 0
						: absoluteError / Math.abs(expected);
					const accepted = absoluteError
						<= manifest.acceptance.maximumAbsoluteError
						|| relativeError <= manifest.acceptance.maximumRelativeError;

					comparedScalarCount += 1;
					if (!accepted) {
						mismatchCount += 1;
						if (firstMismatches.length < 10) {
							firstMismatches.push({
								caseId,
								directionIndex: incomingSample.sampleIndex,
								wavelengthIndex,
								expected,
								actual,
								absoluteError,
								relativeError,
							});
						}
					}
				}
			}
		}

		expect(comparedScalarCount).toBe(manifest.extraction.uniqueScalarCount);
		expect({ mismatchCount, firstMismatches }).toEqual({
			mismatchCount: 0,
			firstMismatches: [],
		});
		expect(field.isSealed).toBeTrue();
		expect(field.descriptor.quantity).toBe('spectral-radiance-density');
		expect(field.descriptor.order).toEqual({ kind: 'pure', value: 1 });
		expect(field.descriptor.provenanceIdentity)
			.toBe(SELECTED_STAR_L1_PROVENANCE_IDENTITY);
	});

	it('records the material mismatch when stored-field transport is applied to J1', () => {
		const fixture = createSelectedStarFixture();
		const pureJ1 = buildDistantSunCpuPrimaryScatteringDensity({
			atmosphere: fixture.atmosphere,
			geometry: fixture.geometry,
			lightSource: fixture.lightSource,
			profile: DEFAULT_NATIVE_PRODUCTION_PROFILE,
		});
		const transportedJ1 = buildDistantSunCpuTransportedRadiance({
			scatteringDensity: pureJ1,
			geometry: fixture.geometry,
			atmosphere: fixture.atmosphere,
			calculator: fixture.calculator,
			transportIntervalCount:
				STAR_PARITY_DISTANT_SUN_TRANSPORT_INTERVAL_COUNT,
			id: 'algorithm32-stage33-diagnostic-transported-j1',
		});
		const actual = compareWithSelectedStarL1(transportedJ1);
		const expected = manifest.productionPortComparison.transportedStoredJ1;

		expect(actual.comparedScalarCount)
			.toBe(manifest.productionPortComparison.comparedScalarCount);
		expect(actual.maximumAbsoluteError)
			.toBeCloseTo(expected.maximumAbsoluteError, 14);
		expect(actual.maximumRelativeError)
			.toBeCloseTo(expected.maximumRelativeError, 14);
		expect(actual.rmsAbsoluteError)
			.toBeCloseTo(expected.rmsAbsoluteError, 14);
		expect(actual.countOverFivePercent).toBe(expected.countOverFivePercent);
		expect(actual.countOverTenPercent).toBe(expected.countOverTenPercent);
		expect(actual.countOverTwentyFivePercent)
			.toBe(expected.countOverTwentyFivePercent);
		expect(actual.maximumAbsoluteError)
			.toBeGreaterThan(manifest.acceptance.maximumAbsoluteError);
		expect(actual.maximumRelativeError)
			.toBeGreaterThan(manifest.acceptance.maximumRelativeError);
		expect(manifest.productionPortComparison.decision).toContain(
			'Generic stored-field Jk-to-Lk transport begins at J2-to-L2',
		);
	});
});
