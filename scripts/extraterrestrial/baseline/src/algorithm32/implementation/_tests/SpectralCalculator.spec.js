import { readFileSync } from 'node:fs';

import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralBasis,
	createSpectralPacket,
} from '../../quantities/index.js';
import { SpectralCalculator } from '../SpectralCalculator.js';

const analyticInvariants = JSON.parse(readFileSync(
	new URL('../../fixtures/analytic-invariants.json', import.meta.url),
	'utf8',
));

/**
 * Find one analytic fixture row by stable id.
 *
 * @param {string} id - Identifies the fixture row.
 * @returns {ProductionFixtureRow} The matching fixture row.
 */
function findAnalyticRow(id) {
	const row = analyticInvariants.rows.find((candidate) => candidate.id === id);

	if (!row) {
		throw new Error(`Missing analytic fixture row: ${id}`);
	}

	return row;
}

/**
 * Create a nominal spectral basis for focused analytic packets.
 *
 * @param {readonly Wavelength[]} wavelengths - Supplies ordered centers.
 * @param {string} [id] - Supplies the basis id.
 * @returns {SpectralBasis} The spectral basis.
 */
function createAnalyticBasis(wavelengths, id = 'spectral-calculator-analytic-basis') {
	return createSpectralBasis({
		id,
		channels: wavelengths.map((center, index) => ({
			id: `${id}-channel-${index}`,
			center,
			width: {
				value: wavelengths.length === 1
					? 1
					: Math.abs(center.value - wavelengths[index === 0 ? 1 : index - 1].value),
				units: center.units,
			},
		})),
	});
}

/**
 * Create one typed packet for a focused calculator operation.
 *
 * @param {SpectralBasis} basis - Supplies the packet basis.
 * @param {SpectralQuantity} quantity - Supplies the quantity.
 * @param {SpectralUnits} units - Supplies the units.
 * @param {readonly number[]} values - Supplies channel values.
 * @param {string} provenanceIdentity - Supplies value provenance.
 * @returns {SpectralPacket} The packet.
 */
function packet(basis, quantity, units, values, provenanceIdentity) {
	return createSpectralPacket({
		basis,
		quantity,
		units,
		values,
		provenanceIdentity,
	});
}

/**
 * Assert that numeric arrays match within an absolute tolerance.
 *
 * @param {ArrayLike<number>} actual - Supplies the actual numeric values.
 * @param {readonly number[]} expected - Supplies the expected numeric values.
 * @param {number} tolerance - Supplies the accepted absolute tolerance.
 * @returns {void}
 */
function expectArrayCloseTo(actual, expected, tolerance) {
	expect(actual.length).toBe(expected.length);

	for (const [index, expectedValue] of expected.entries()) {
		expect(Math.abs(actual[index] - expectedValue)).toBeLessThanOrEqual(tolerance);
	}
}

describe('SpectralCalculator', () => {
	it('defaults only absent dependencies and rejects explicit null', () => {
		expect(() => new SpectralCalculator()).not.toThrow();
		expect(() => new SpectralCalculator(null)).toThrowError(/dependencies/);
	});

	it('builds endpoint/trapezoid path integration points', () => {
		const calculator = new SpectralCalculator();
		const points = calculator.buildEndpointTrapezoidPathIntegrationPoints({
			ray: {
				origin: { coordinates: [0, 0, 0], units: 'meters' },
				direction: [0, 0, 1],
			},
			startDistance: { value: 0.002, units: 'kilometers' },
			endDistance: { value: 0.01, units: 'kilometers' },
		}, 4);

		expect(points).toEqual([
			{ pointIndex: 0, distanceAlongRay: { value: 2, units: 'meters' }, intervalLengthFromPrevious: { value: 0, units: 'meters' }, trapezoidWeight: 0.5, measure: { value: 1, units: 'meters' } },
			{ pointIndex: 1, distanceAlongRay: { value: 4, units: 'meters' }, intervalLengthFromPrevious: { value: 2, units: 'meters' }, trapezoidWeight: 1, measure: { value: 2, units: 'meters' } },
			{ pointIndex: 2, distanceAlongRay: { value: 6, units: 'meters' }, intervalLengthFromPrevious: { value: 2, units: 'meters' }, trapezoidWeight: 1, measure: { value: 2, units: 'meters' } },
			{ pointIndex: 3, distanceAlongRay: { value: 8, units: 'meters' }, intervalLengthFromPrevious: { value: 2, units: 'meters' }, trapezoidWeight: 1, measure: { value: 2, units: 'meters' } },
			{ pointIndex: 4, distanceAlongRay: { value: 10, units: 'meters' }, intervalLengthFromPrevious: { value: 2, units: 'meters' }, trapezoidWeight: 0.5, measure: { value: 1, units: 'meters' } },
		]);
	});

	it('computes typed vacuum source transmittance from the analytic fixture', () => {
		const fixture = findAnalyticRow('transmittance.vacuum.finite-path');
		const basis = createAnalyticBasis(fixture.input.wavelengths);
		const calculator = new SpectralCalculator({ spectralBasis: basis });
		const opticalDepth = packet(
			basis,
			SPECTRAL_QUANTITIES.OPTICAL_DEPTH,
			SPECTRAL_UNITS.DIMENSIONLESS,
			[fixture.expected.opticalDepth.value],
			'fixture:transmittance-vacuum-optical-depth',
		);

		// Source: analytic-invariants row transmittance.vacuum.finite-path; PBRT Transmittance. [1]
		const transmittance = calculator.computeSourceTransmittance(opticalDepth);

		expect(transmittance.quantity).toBe(SPECTRAL_QUANTITIES.TRANSMITTANCE);
		expect(transmittance.units).toBe(SPECTRAL_UNITS.DIMENSIONLESS);
		expect(transmittance.basis).toBe(basis);
		expect(transmittance.values).toEqual([fixture.expected.transmittance.value]);
	});

	it('computes typed multi-wavelength trapezoid transmittance', () => {
		const fixture = findAnalyticRow('transmittance.homogeneous.multi-wavelength');
		const basis = createAnalyticBasis(fixture.input.wavelengths);
		const calculator = new SpectralCalculator({ spectralBasis: basis });
		const extinction = packet(
			basis,
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			fixture.input.extinctionCoefficient.map((entry) => entry.value / 1000),
			'fixture:homogeneous-extinction',
		);

		// Source: analytic-invariants row transmittance.homogeneous.multi-wavelength; PBRT Transmittance and Volume Scattering Processes. [1][2]
		const transmittance = calculator.computeTrapezoidSegmentTransmittance(
			extinction,
			extinction,
			fixture.input.distance,
		);

		expect(transmittance.quantity).toBe(SPECTRAL_QUANTITIES.TRANSMITTANCE);
		expect(transmittance.units).toBe(SPECTRAL_UNITS.DIMENSIONLESS);
		expectArrayCloseTo(
			transmittance.values,
			fixture.expected.transmittance.value,
			fixture.tolerance.transmittance.value,
		);
	});

	it('computes typed direct in-scattering from the analytic fixture', () => {
		const fixture = findAnalyticRow('in-scattering.one-sample.scalar-product');
		const basis = createAnalyticBasis(fixture.assumptions.wavelengths);
		const calculator = new SpectralCalculator({ spectralBasis: basis });
		const scattering = calculator.computeDirectScattering(
			packet(
				basis,
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				[fixture.input.scatteringCoefficient.value / 1000],
				'fixture:direct-rayleigh-scattering',
			),
			packet(
				basis,
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				[0],
				'fixture:direct-mie-scattering',
			),
			{ value: fixture.input.phase.value, units: 'sr^-1' },
			{ value: 0, units: 'sr^-1' },
		);

		// Source: analytic-invariants row in-scattering.one-sample.scalar-product; PBRT Volume Scattering Processes and Phase Functions. [2][3]
		const directInScattering = calculator.computeDirectInScattering(
			packet(basis, SPECTRAL_QUANTITIES.TRANSMITTANCE, SPECTRAL_UNITS.DIMENSIONLESS, [fixture.input.viewTransmittance], 'fixture:view-transmittance'),
			packet(basis, SPECTRAL_QUANTITIES.TRANSMITTANCE, SPECTRAL_UNITS.DIMENSIONLESS, [fixture.input.sourceTransmittance], 'fixture:source-transmittance'),
			packet(basis, SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, SPECTRAL_UNITS.IRRADIANCE_DENSITY, [fixture.input.sourceIrradiance], 'fixture:source-irradiance'),
			scattering,
			fixture.input.stepLength,
		);

		expect(directInScattering.quantity).toBe(SPECTRAL_QUANTITIES.RADIANCE_DENSITY);
		expect(directInScattering.units).toBe(SPECTRAL_UNITS.RADIANCE_DENSITY);
		expectArrayCloseTo(
			directInScattering.values,
			[fixture.expected.spectralRadiance.value],
			fixture.tolerance.spectralRadiance.value,
		);
	});

	it('integrates exactly one cumulative-cache lookup per path sample', () => {
		const basis = createAnalyticBasis([{ value: 550, units: 'nanometers' }]);
		const extinction = packet(
			basis,
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			[Math.log(2)],
			'cumulative-view-extinction',
		);
		const positionStencils = [
			{ indices: [0], weights: [1] },
			{ indices: [0, 1], weights: [0.25, 0.75] },
			{ indices: [1], weights: [1] },
		];
		const directionStencil = { indices: [3, 4, 5, 6], weights: [0.1, 0.2, 0.3, 0.4] };
		let positionIndex = 0;
		const geometry = {
			resolveAtmosphereCoordinate: jasmine.createSpy('resolveAtmosphereCoordinate')
				.and.callFake((position) => ({ altitude: position.coordinates[2] })),
			resolveScatteringCachePositionStencil:
				jasmine.createSpy('resolveScatteringCachePositionStencil')
					.and.callFake(() => positionStencils[positionIndex++]),
			resolveScatteringCacheDirectionStencil:
				jasmine.createSpy('resolveScatteringCacheDirectionStencil')
					.and.returnValue(directionStencil),
		};
		const atmosphere = {
			sampleMedium: jasmine.createSpy('sampleMedium').and.returnValue({ extinction }),
		};
		const densityValues = [10, 20, 30];
		let densityIndex = 0;
		const sampleResolved = jasmine.createSpy('sampleResolved').and.callFake(() =>
			packet(
				basis,
				SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
				SPECTRAL_UNITS.SCATTERING_DENSITY,
				[densityValues[densityIndex++]],
				`cumulative-density-${densityIndex}`,
			));
		const scatteringCache = /** @type {CpuScatteringCache} */ (
			/** @type {unknown} */ ({
				descriptor: {
					field: {
						contentHash: 'cumulative-field-test-hash',
						positionDomain: { kind: 'metadata-only-decoy' },
						directionDomain: { kind: 'metadata-only-decoy' },
					},
				},
				sampleResolved,
				dispose() {},
			})
		);
		const calculator = new SpectralCalculator({
			geometry,
			atmosphere,
			spectralBasis: basis,
		});
		const viewRaySegment = {
			ray: {
				origin: { coordinates: [0, 0, 0], units: 'meters' },
				direction: [0, 0, 1],
			},
			startDistance: { value: 0, units: 'meters' },
			endDistance: { value: 2, units: 'meters' },
		};
		const path = calculator.buildEndpointTrapezoidPathIntegrationPoints(
			viewRaySegment,
			2,
		);

		const result = calculator.computeRadiance(
			viewRaySegment,
			path,
			{ scatteringCache },
		);

		expect(result.pathRadiance.values[0]).toBeCloseTo(18.75, 12);
		expect(result.transmittance.values[0]).toBeCloseTo(0.25, 12);
		expect(sampleResolved).toHaveBeenCalledTimes(path.length);
		expect(geometry.resolveScatteringCachePositionStencil)
			.toHaveBeenCalledTimes(path.length);
		expect(geometry.resolveScatteringCacheDirectionStencil)
			.toHaveBeenCalledTimes(path.length);

		for (const [index, sampleCall] of sampleResolved.calls.allArgs().entries()) {
			expect(sampleCall[0]).toEqual({
				positionStencil: positionStencils[index],
				directionStencil,
			});
		}
		for (const [index, positionCall] of geometry.resolveScatteringCachePositionStencil
			.calls.allArgs().entries()) {
			expect(positionCall[0]).toEqual(jasmine.objectContaining({
				position: {
					coordinates: [0, 0, index],
					units: 'meters',
				},
			}));
		}
		for (const [index, directionCall] of geometry.resolveScatteringCacheDirectionStencil
			.calls.allArgs().entries()) {
			expect(directionCall[0]).toEqual({
				position: {
					coordinates: [0, 0, index],
					units: 'meters',
				},
				physicalOutgoingDirection: [0, 0, 1],
			});
		}
	});

	it('rejects raw arrays, unitless distance scalars, and unitless phase scalars', () => {
		const basis = createAnalyticBasis([{ value: 550, units: 'nanometers' }]);
		const calculator = new SpectralCalculator({ spectralBasis: basis });
		const extinction = packet(
			basis,
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			[0],
			'test:extinction',
		);
		const scattering = packet(
			basis,
			SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			[0],
			'test:scattering',
		);

		expect(() => calculator.computeSourceTransmittance([0]))
			.toThrowError(/SpectralPacket/);
		expect(() => calculator.computeTrapezoidSegmentTransmittance(
			extinction,
			extinction,
			1,
		)).toThrowError(/intervalLength/);
		expect(() => calculator.computeDirectScattering(scattering, scattering, 1, 1))
			.toThrowError(/rayleighPhase/);
	});
});
