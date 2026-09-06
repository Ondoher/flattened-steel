import { readFileSync } from 'node:fs';

import { CanonicalAtmosphere } from '../../atmospheres/CanonicalAtmosphere.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from '../../constants/Algorithm32CanonicalData.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../../quantities/index.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../../profiles/native-15-profile.js';
import {
	ALGORITHM32_STAR_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
} from '../consts.js';
import {
	createPhysicalLaterOrderScatteringKernel,
} from '../later-order-scattering-density.js';

const selectedStarFixture = JSON.parse(readFileSync(new URL(
	'../../fixtures/algorithm32-star-legacy-34-j2-compatibility.json',
	import.meta.url,
), 'utf8'));

describe('physical later-order scattering density', () => {
	it('reproduces all preserved unequal-domain L1-to-J2 values and reads L once per position', () => {
		const casesByPosition = Array.from(
			new Set(selectedStarFixture.cases.map((entry) => entry.altitudeBinIndex)),
			(altitudeBinIndex) => selectedStarFixture.cases.filter(
				(entry) => entry.altitudeBinIndex === altitudeBinIndex,
			),
		);
		const incomingDomain = {
			id: 'selected-star-physical-fibonacci-34',
			count: selectedStarFixture.domainIdentity.directionCount,
			unitVectors: selectedStarFixture.domainIdentity.directions,
			integrationWeights: {
				values: selectedStarFixture.domainIdentity.weights,
				units: 'steradians',
			},
		};
		const outgoingDomain = {
			id: 'selected-star-physical-outgoing-three',
			count: casesByPosition[0].length,
			unitVectors: casesByPosition[0].map((entry) => entry.outgoingDirection),
		};
		const positionNodes = casesByPosition.map((entries, positionIndex) => ({
				index: positionIndex,
				coordinate: {
					value: entries[0].altitudeMeters,
					units: 'meters',
				},
			}));
		const positionDomain = {
			count: positionNodes.length,
			nodes: positionNodes,
		};
		const basis = NATIVE_15_SPECTRAL_BASIS;
		const radianceDescriptor = {
			basis,
			positionDomain,
			directionDomain: incomingDomain,
		};
		const scatteringDescriptor = {
			basis,
			positionDomain,
			directionDomain: outgoingDomain,
			provenanceIdentity:
				ALGORITHM32_STAR_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
		};
		const values = Array.from(
			{ length: positionDomain.count },
			() => Array.from(
				{ length: outgoingDomain.count },
				() => new Float64Array(basis.channelCount),
			),
		);
		let readCount = 0;
		let phaseCallCount = 0;
		let directScatteringCallCount = 0;
		const onProgress = jasmine.createSpy('onProgress');
		const previousRadiance = {
			descriptor: radianceDescriptor,
			scalarCount:
				positionDomain.count * incomingDomain.count * basis.channelCount,
			readScalar({ directionIndex, positionIndex, wavelengthIndex }) {
				readCount += 1;
				return casesByPosition[positionIndex][0]
					.incomingSamples[directionIndex].radiance[wavelengthIndex];
			},
			readScalarAtOffset() {
				throw new Error('dense offsets are not used by physical scattering.');
			},
		};
		const outputScattering = {
			descriptor: scatteringDescriptor,
			scalarCount:
				positionDomain.count * outgoingDomain.count * basis.channelCount,
			writeScalar({ directionIndex, positionIndex, wavelengthIndex }, value) {
				values[positionIndex][directionIndex][wavelengthIndex] = value;
			},
			writeScalarAtOffset() {
				throw new Error('dense offsets are not used by physical scattering.');
			},
			fill() {},
		};
		const phaseAtmosphere = new CanonicalAtmosphere({
			constants: CANONICAL_ATMOSPHERE_CONSTANTS,
			spectralBasis: basis,
		});
		const atmosphere = {
			sampleMedium({ positionIndex }) {
				const medium = casesByPosition[positionIndex][0].medium;
				return {
					rayleighScattering: createScatteringCoefficientPacket(
						basis,
						medium.rayleighScatteringPerMeter,
						`fixture-rayleigh:${positionIndex}`,
					),
					mieScattering: createScatteringCoefficientPacket(
						basis,
						medium.mieScatteringPerMeter,
						`fixture-mie:${positionIndex}`,
					),
				};
			},
			samplePhase(request) {
				phaseCallCount += 1;
				return phaseAtmosphere.samplePhase(request);
			},
		};
		const kernelDefinition = {
			geometry: {
				resolveAtmosphereCoordinate(position) {
					return { positionIndex: position.coordinates[0] };
				},
			},
			atmosphere,
			calculator: {
				computeDirectScattering(
					rayleighScattering,
					mieScattering,
					rayleighPhase,
					miePhase,
				) {
					directScatteringCallCount += 1;
					return createSpectralPacket({
						basis,
						quantity: SPECTRAL_QUANTITIES
							.PHASE_WEIGHTED_SCATTERING_COEFFICIENT,
						units: SPECTRAL_UNITS.INVERSE_LENGTH_SOLID_ANGLE,
						values: rayleighScattering.values.map((rayleigh, index) =>
							rayleigh * rayleighPhase.value
								+ mieScattering.values[index] * miePhase.value),
						provenanceIdentity: 'fixture-direct-scattering',
					});
				},
			},
			scatteringOrder: 2,
			positionNodes,
			positionCount: positionNodes.length,
			incomingUnitVectors: incomingDomain.unitVectors,
			incomingDirectionCount: incomingDomain.count,
			incomingIntegrationWeights:
				incomingDomain.integrationWeights,
			outgoingUnitVectors: outgoingDomain.unitVectors,
			outgoingDirectionCount: outgoingDomain.count,
			spectralBasis: basis,
			spectralChannelCount: basis.channelCount,
			onProgress,
			resolvePhysicalPosition({ positionIndex }) {
				return {
					coordinates: [positionIndex, 0, 0],
					units: 'meters',
				};
			},
			resolvePhysicalIncomingDirection: ({ cacheDirection }) => cacheDirection,
			resolvePhysicalOutgoingDirection: ({ cacheDirection }) => cacheDirection,
		};
		const kernel = createPhysicalLaterOrderScatteringKernel(
			kernelDefinition,
		);

		kernel.buildPureScatteringOrder({
			previousRadiance,
			outputScattering,
		});

		let maximumAbsoluteError = 0;
		for (let positionIndex = 0;
			positionIndex < positionDomain.count;
			positionIndex += 1) {
			for (let outgoingIndex = 0;
				outgoingIndex < outgoingDomain.count;
				outgoingIndex += 1) {
				for (let wavelengthIndex = 0;
					wavelengthIndex < basis.channelCount;
					wavelengthIndex += 1) {
					maximumAbsoluteError = Math.max(
						maximumAbsoluteError,
						Math.abs(
							values[positionIndex][outgoingIndex][wavelengthIndex]
								- casesByPosition[positionIndex][outgoingIndex]
									.expectedJ2[wavelengthIndex],
						),
					);
				}
			}
		}

		expect(maximumAbsoluteError).toBeLessThan(2e-19);
		expect(readCount).toBe(
			positionDomain.count * incomingDomain.count
				* basis.channelCount,
		);
		expect(phaseCallCount).toBe(
			positionDomain.count * outgoingDomain.count * incomingDomain.count,
		);
		expect(directScatteringCallCount).toBe(phaseCallCount);
		expect(onProgress.calls.allArgs()).toEqual(
			positionNodes.map((_positionNode, index) => [{
				phase: 'later-order-scattering',
				order: 2,
				completed: index + 1,
				total: positionNodes.length,
			}]),
		);
	});

	it('applies a source-owned incoming-radiance contribution before phase integration', () => {
		const basis = { channelCount: 1 };
		const positionNodes = [
			{ index: 0, coordinate: { value: 0, units: 'meters' } },
		];
		const positionDomain = {
			count: 1,
			nodes: positionNodes,
		};
		const incomingDomain = {
			count: 1,
			unitVectors: [[1, 0, 0]],
			integrationWeights: { values: [2], units: 'steradians' },
		};
		const outgoingDomain = { count: 1, unitVectors: [[0, 1, 0]] };
		let written = null;
		const kernel = createPhysicalLaterOrderScatteringKernel({
			geometry: { resolveAtmosphereCoordinate: () => ({}) },
			atmosphere: {
				sampleMedium: () => ({
					rayleighScattering: {},
					mieScattering: {},
				}),
				samplePhase: () => ({ rayleighPhase: {}, miePhase: {} }),
			},
			calculator: {
				computeDirectScattering: () => ({ values: [3] }),
			},
			scatteringOrder: 2,
			positionNodes,
			positionCount: positionNodes.length,
			incomingUnitVectors: incomingDomain.unitVectors,
			incomingDirectionCount: incomingDomain.count,
			incomingIntegrationWeights:
				incomingDomain.integrationWeights,
			outgoingUnitVectors: outgoingDomain.unitVectors,
			outgoingDirectionCount: outgoingDomain.count,
			spectralBasis: basis,
			spectralChannelCount: basis.channelCount,
			resolvePhysicalPosition: () => ({
				coordinates: [0, 0, 0],
				units: 'meters',
			}),
			resolvePhysicalIncomingDirection: ({ cacheDirection }) => cacheDirection,
			resolvePhysicalOutgoingDirection: ({ cacheDirection }) => cacheDirection,
			contributeIncomingRadiance({ incomingRadiance }) {
				incomingRadiance[0][0] += 7;
			},
		});

		kernel.buildPureScatteringOrder({
			previousRadiance: {
				descriptor: {
					basis,
					positionDomain,
					directionDomain: incomingDomain,
				},
				scalarCount: 1,
				readScalar: () => 5,
				readScalarAtOffset: () => 5,
			},
			outputScattering: {
				descriptor: {
					basis,
					positionDomain,
					directionDomain: outgoingDomain,
					provenanceIdentity:
						ALGORITHM32_STAR_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
				},
				scalarCount: 1,
				writeScalar: (_coordinates, value) => { written = value; },
				writeScalarAtOffset() {},
				fill() {},
			},
		});

		expect(written).toBe(72);
	});
});

/**
 * Wrap fixture coefficient values in the production scattering contract.
 *
 * @param {SpectralBasis} basis - Supplies the ordered wavelength basis.
 * @param {readonly number[]} values - Supplies fixture coefficient values.
 * @param {string} provenanceIdentity - Identifies the fixture value source.
 * @returns {SpectralScatteringCoefficientPacket} The typed coefficient packet.
 */
function createScatteringCoefficientPacket(basis, values, provenanceIdentity) {
	return /** @type {SpectralScatteringCoefficientPacket} */ (createSpectralPacket({
		basis,
		quantity: SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
		units: SPECTRAL_UNITS.INVERSE_LENGTH,
		values,
		provenanceIdentity,
	}));
}
