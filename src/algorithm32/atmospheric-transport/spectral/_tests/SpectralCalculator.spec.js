import {readFileSync} from 'node:fs';

import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralBasis, SpectralPacket} from '../../../spectral-values/index.js';
import {SpectralCalculator} from '../SpectralCalculator.js';

/** Analytic invariants constant. */
const analyticInvariants = JSON.parse(
	readFileSync(new URL('../../../reference-evidence/fixtures/analytic-invariants.json', import.meta.url), 'utf8'),
);

/**
 * Called by this module to find one analytic fixture row by stable id.
 *
 * @param {string} id - Identifies the fixture row.
 * @returns {ProductionFixtureRow} - The matching fixture row.
 * @throws {Error} - When the operation cannot complete its caller-observable contract.
 */
function findAnalyticRow(id) {
	const row = analyticInvariants.rows.find(
		/**
		 * Called by Array.prototype.find to test one collection value for selection.
		 * @param candidate - The candidate value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (candidate) => candidate.id === id,
	);

	if (!row) {
		throw new Error(`Missing analytic fixture row: ${id}`);
	}

	return row;
}

/**
 * Called by this module to create a nominal spectral basis for focused analytic packets. Conditional result values are selected from the accepted input and current state.
 *
 * @param {readonly Wavelength[]} wavelengths - Supplies ordered centers.
 * @param {string} [id] - Supplies the basis id.
 * @returns {SpectralBasis} - The spectral basis.
 */
function createAnalyticBasis(wavelengths, id = 'spectral-calculator-analytic-basis') {
	return new SpectralBasis({
		id,
		channels: wavelengths.map(
			/**
			 * Called by Array.prototype.map to transform one collection value. Conditional result values are selected from the accepted input and current state.
			 * @param center - The center value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (center, index) => ({
				id: `${id}-channel-${index}`,
				center,
				width: {
					value:
						wavelengths.length === 1
							? 1
							: Math.abs(center.value - wavelengths[index === 0 ? 1 : index - 1].value),
					units: center.units,
				},
			}),
		),
	});
}

/**
 * Called by this module to create one typed packet for a focused calculator operation.
 *
 * @param {SpectralBasis} basis - Supplies the packet basis.
 * @param {SpectralQuantity} quantity - Supplies the quantity.
 * @param {SpectralUnits} units - Supplies the units.
 * @param {readonly number[]} values - Supplies channel values.
 * @param {string} provenanceIdentity - Supplies value provenance.
 * @returns {SpectralPacket} - The packet.
 */
function packet(basis, quantity, units, values, provenanceIdentity) {
	return new SpectralPacket({
		basis,
		quantity,
		units,
		values,
		provenanceIdentity,
	});
}

/**
 * Called by this module to create the aggregate-model surface used by focused calculator checks.
 *
 * @param {SpectralBasis} basis - Selected spectral basis.
 * @param {Partial<SharedModel>} [components] - Optional physical component doubles.
 * @returns {SharedModel} - Focused aggregate model.
 */
function createCalculatorModel(basis, components = {}) {
	return /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			...components,
			profile: {
				spectral: {basis},
				numerical: {sourcePathTransmittance: {intervalCount: 15}},
			},
		})
	);
}

/**
 * Called by this module to assert that numeric arrays match within an absolute tolerance.
 *
 * @param {ArrayLike<number>} actual - Supplies the actual numeric values.
 * @param {readonly number[]} expected - Supplies the expected numeric values.
 * @param {number} tolerance - Supplies the accepted absolute tolerance.
 * @returns {void} -
 */
function expectArrayCloseTo(actual, expected, tolerance) {
	expect(actual.length).toBe(expected.length);

	for (const [index, expectedValue] of expected.entries()) {
		expect(Math.abs(actual[index] - expectedValue)).toBeLessThanOrEqual(tolerance);
	}
}

describe('SpectralCalculator', /** Called by Jasmine to register the named test suite. */ () => {
	it('retains the aggregate execution model', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = createAnalyticBasis([{value: 550, units: 'nanometers'}]);
		const model = createCalculatorModel(basis);
		const calculator = new SpectralCalculator({model});

		expect(calculator.dependencies.model).toBe(model);
	});

	it('builds endpoint/trapezoid path integration points', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = createAnalyticBasis([{value: 550, units: 'nanometers'}]);
		const calculator = new SpectralCalculator({model: createCalculatorModel(basis)});
		const points = calculator.buildEndpointTrapezoidPathIntegrationPoints(
			{
				ray: {
					origin: {coordinates: [0, 0, 0], units: 'meters'},
					direction: [0, 0, 1],
				},
				startDistance: {value: 0.002, units: 'kilometers'},
				endDistance: {value: 0.01, units: 'kilometers'},
			},
			4,
		);

		expect(points).toEqual([
			{
				pointIndex: 0,
				distanceAlongRay: {value: 2, units: 'meters'},
				intervalLengthFromPrevious: {value: 0, units: 'meters'},
				trapezoidWeight: 0.5,
				measure: {value: 1, units: 'meters'},
			},
			{
				pointIndex: 1,
				distanceAlongRay: {value: 4, units: 'meters'},
				intervalLengthFromPrevious: {value: 2, units: 'meters'},
				trapezoidWeight: 1,
				measure: {value: 2, units: 'meters'},
			},
			{
				pointIndex: 2,
				distanceAlongRay: {value: 6, units: 'meters'},
				intervalLengthFromPrevious: {value: 2, units: 'meters'},
				trapezoidWeight: 1,
				measure: {value: 2, units: 'meters'},
			},
			{
				pointIndex: 3,
				distanceAlongRay: {value: 8, units: 'meters'},
				intervalLengthFromPrevious: {value: 2, units: 'meters'},
				trapezoidWeight: 1,
				measure: {value: 2, units: 'meters'},
			},
			{
				pointIndex: 4,
				distanceAlongRay: {value: 10, units: 'meters'},
				intervalLengthFromPrevious: {value: 2, units: 'meters'},
				trapezoidWeight: 0.5,
				measure: {value: 1, units: 'meters'},
			},
		]);
	});

	it('builds exact quadratic-boundary midpoint integration points', () => {
		const basis = createAnalyticBasis([{value: 550, units: 'nanometers'}]);
		const calculator = new SpectralCalculator({model: createCalculatorModel(basis)});
		const points = calculator.buildQuadraticMidpointPathIntegrationPoints(
			{
				ray: {origin: {coordinates: [0, 0, 0], units: 'meters'}, direction: [0, 0, 1]},
				startDistance: {value: 2, units: 'meters'},
				endDistance: {value: 10, units: 'meters'},
			},
			2,
		);

		expect(points).toEqual([
			jasmine.objectContaining({
				integrationKind: 'quadratic-midpoint',
				distanceAlongRay: {value: 3, units: 'meters'},
				measure: {value: 2, units: 'meters'},
			}),
			jasmine.objectContaining({
				integrationKind: 'quadratic-midpoint',
				distanceAlongRay: {value: 7, units: 'meters'},
				measure: {value: 6, units: 'meters'},
			}),
		]);
	});

	it('computes typed vacuum source transmittance from the analytic fixture', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fixture = findAnalyticRow('transmittance.vacuum.finite-path');
		const basis = createAnalyticBasis(fixture.input.wavelengths);
		const calculator = new SpectralCalculator({model: createCalculatorModel(basis)});
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

	it('computes typed multi-wavelength trapezoid transmittance', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fixture = findAnalyticRow('transmittance.homogeneous.multi-wavelength');
		const basis = createAnalyticBasis(fixture.input.wavelengths);
		const calculator = new SpectralCalculator({model: createCalculatorModel(basis)});
		const extinction = packet(
			basis,
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			fixture.input.extinctionCoefficient.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param entry - The entry value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (entry) => entry.value / 1000,
			),
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

	it('computes typed direct in-scattering from the analytic fixture', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fixture = findAnalyticRow('in-scattering.one-sample.scalar-product');
		const basis = createAnalyticBasis(fixture.assumptions.wavelengths);
		const calculator = new SpectralCalculator({model: createCalculatorModel(basis)});
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
			{value: fixture.input.phase.value, units: 'sr^-1'},
			{value: 0, units: 'sr^-1'},
		);

		// Source: analytic-invariants row in-scattering.one-sample.scalar-product; PBRT Volume Scattering Processes and Phase Functions. [2][3]
		const directInScattering = calculator.computeDirectInScattering(
			packet(
				basis,
				SPECTRAL_QUANTITIES.TRANSMITTANCE,
				SPECTRAL_UNITS.DIMENSIONLESS,
				[fixture.input.viewTransmittance],
				'fixture:view-transmittance',
			),
			packet(
				basis,
				SPECTRAL_QUANTITIES.TRANSMITTANCE,
				SPECTRAL_UNITS.DIMENSIONLESS,
				[fixture.input.sourceTransmittance],
				'fixture:source-transmittance',
			),
			packet(
				basis,
				SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				SPECTRAL_UNITS.IRRADIANCE_DENSITY,
				[fixture.input.sourceIrradiance],
				'fixture:source-irradiance',
			),
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

	it('integrates exactly one cumulative-cache lookup per path sample', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = createAnalyticBasis([{value: 550, units: 'nanometers'}]);
		const extinction = packet(
			basis,
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			[Math.log(2)],
			'cumulative-view-extinction',
		);
		const positionStencils = [
			{indices: [0], weights: [1]},
			{indices: [0, 1], weights: [0.25, 0.75]},
			{indices: [1], weights: [1]},
		];
		const directionStencil = {indices: [3, 4, 5, 6], weights: [0.1, 0.2, 0.3, 0.4]};
		let positionIndex = 0;
		const geometry = {
			resolveAtmosphereCoordinate: jasmine.createSpy('resolveAtmosphereCoordinate').and.callFake(
				/**
				 * Called by the Jasmine spy to handle one callback invocation.
				 * @param position - The position value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (position) => ({
					altitude: position.coordinates[2],
				}),
			),
			resolveScatteringCachePositionStencil: jasmine
				.createSpy('resolveScatteringCachePositionStencil')
				.and.callFake(
					/**
					 * Called by the Jasmine spy to handle one callback invocation.
					 * @returns - The callback result returned to its caller.
					 */ () => positionStencils[positionIndex++],
				),
			resolveScatteringCacheDirectionStencil: jasmine
				.createSpy('resolveScatteringCacheDirectionStencil')
				.and.returnValue(directionStencil),
		};
		const atmosphere = {
			sampleMedium: jasmine.createSpy('sampleMedium').and.returnValue({extinction}),
		};
		const densityValues = [10, 20, 30];
		let densityIndex = 0;
		const sampleCumulativeScatteringDensity = jasmine.createSpy('sampleCumulativeScatteringDensity').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param request - The physical sample request.
			 * @returns - The callback result returned to its caller.
			 */ (request) => {
				request.geometry.resolveScatteringCachePositionStencil({
					position: request.context.position,
					atmosphereCoordinate: request.context.atmosphereCoordinate,
				});
				request.geometry.resolveScatteringCacheDirectionStencil({
					position: request.context.position,
					physicalOutgoingDirection: request.context.physicalOutgoingDirection,
				});
				return packet(
					basis,
					SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
					SPECTRAL_UNITS.SCATTERING_DENSITY,
					[densityValues[densityIndex++]],
					`cumulative-density-${densityIndex}`,
				);
			},
		);
		const scatteringCache = /** @type {CpuScatteringCache} */ (
			/** @type {unknown} */ ({
				sampleProvenanceIdentity: 'cumulative-field-test-hash',
				sampleCumulativeScatteringDensity,
				/** Call this method to dispose. */ dispose() {},
			})
		);
		const calculator = new SpectralCalculator({
			model: createCalculatorModel(basis, {geometry, atmosphere}),
		});
		const viewRaySegment = {
			ray: {
				origin: {coordinates: [0, 0, 0], units: 'meters'},
				direction: [0, 0, 1],
			},
			startDistance: {value: 0, units: 'meters'},
			endDistance: {value: 2, units: 'meters'},
		};
		const path = calculator.buildEndpointTrapezoidPathIntegrationPoints(viewRaySegment, 2);

		const result = calculator.computeRadiance(viewRaySegment, path, {scatteringCache});

		expect(result.pathRadiance.values[0]).toBeCloseTo(18.75, 12);
		expect(result.transmittance.values[0]).toBeCloseTo(0.25, 12);
		expect(sampleCumulativeScatteringDensity).toHaveBeenCalledTimes(path.length);
		expect(geometry.resolveScatteringCachePositionStencil).toHaveBeenCalledTimes(path.length);
		expect(geometry.resolveScatteringCacheDirectionStencil).toHaveBeenCalledTimes(path.length);

		for (const [index, sampleCall] of sampleCumulativeScatteringDensity.calls.allArgs().entries()) {
			expect(sampleCall[0]).toEqual({
				context: {
					position: {coordinates: [0, 0, index], units: 'meters'},
					atmosphereCoordinate: {altitude: index},
					physicalOutgoingDirection: [0, 0, 1],
				},
				geometry,
			});
		}
		for (const [index, positionCall] of geometry.resolveScatteringCachePositionStencil.calls.allArgs().entries()) {
			expect(positionCall[0]).toEqual(
				jasmine.objectContaining({
					position: {
						coordinates: [0, 0, index],
						units: 'meters',
					},
				}),
			);
		}
		for (const [index, directionCall] of geometry.resolveScatteringCacheDirectionStencil.calls
			.allArgs()
			.entries()) {
			expect(directionCall[0]).toEqual({
				position: {
					coordinates: [0, 0, index],
					units: 'meters',
				},
				physicalOutgoingDirection: [0, 0, 1],
			});
		}
	});

	it('rejects raw arrays, unitless distance scalars, and unitless phase scalars', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = createAnalyticBasis([{value: 550, units: 'nanometers'}]);
		const calculator = new SpectralCalculator({model: createCalculatorModel(basis)});
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

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => calculator.computeSourceTransmittance([0]),
		).toThrowError(/SpectralPacket/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => calculator.computeTrapezoidSegmentTransmittance(extinction, extinction, 1),
		).toThrowError(/intervalLength/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => calculator.computeDirectScattering(scattering, scattering, 1, 1),
		).toThrowError(/rayleighPhase/);
	});
});
