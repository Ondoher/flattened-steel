import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../../implementation/canonical-atmosphere/consts.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
} from '../../../../sampling-domains/index.js';
import {SphericalEarthGeometry} from '../../../../implementation/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../../profiles/index.js';
import VectorMath from '../../../../math/VectorMath.js';
import {ALGORITHM32_PRODUCTION_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY} from '../../../../atmospheric-transport/consts.js';
import {CpuDirectionalSpectralField} from '../../../../light-source-support/cache/CpuDirectionalSpectralField.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
} from '../consts.js';
import {DistantSunCpuMultipleScatteringEvaluator} from '../DistantSunCpuMultipleScatteringEvaluator.js';

describe('distant-Sun later-order scattering adapter', /** Called by Jasmine to register the named test suite. */ () => {
	it('maps both direction domains physically and preserves zero-medium calls', /** Called by Jasmine to exercise the named behavior. */ () => {
		const implementation = new SphericalEarthGeometry({
			bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
			topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
			observerHeight: {value: 2, units: 'meters'},
			observerUpDirection: [0, 0, 1],
			cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN_OWNER.count,
			cacheBoundaryAltitude: {value: 2, units: 'meters'},
		});
		configureGeometry(implementation);
		const directionToLight = implementation.configuration.directionToSource;
		const mappedDirectionCounts = {fibonacci68: 0, w27: 0};
		let positionBuildCount = 0;
		const geometry = {
			/**
			 * Called by geometry to resolve atmosphere coordinate.
			 * @param position - The position value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolveAtmosphereCoordinate: (position) => implementation.resolveAtmosphereCoordinate(position),
			/**
			 * Call this method to resolve scattering cache construction position.
			 * @param positionNode - The position node value accepted by the operation.
			 * @returns - The result produced by the operation.
			 */ resolveScatteringCacheConstructionPosition(positionNode) {
				positionBuildCount += 1;
				return implementation.resolveScatteringCacheConstructionPosition(positionNode);
			},
			/**
			 * Call this method to express physical incoming radiance direction.
			 * @param cacheDirection - The cache direction value accepted by the operation.
			 * @returns - The result produced by the operation.
			 */ expressPhysicalIncomingRadianceDirection(cacheDirection) {
				mappedDirectionCounts.fibonacci68 += 1;
				return implementation.expressPhysicalIncomingRadianceDirection(cacheDirection);
			},
			/**
			 * Call this method to express physical outgoing scattering direction.
			 * @param cacheDirection - The cache direction value accepted by the operation.
			 * @returns - The result produced by the operation.
			 */ expressPhysicalOutgoingScatteringDirection(cacheDirection) {
				mappedDirectionCounts.w27 += 1;
				return implementation.expressPhysicalOutgoingScatteringDirection(cacheDirection);
			},
		};
		const zeroSpectrum = Array(15).fill(0);
		const targetOutgoingIndex = 1822;
		const targetPhaseCall =
			targetOutgoingIndex * REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount;
		let mediumSampleCount = 0;
		let phaseCallCount = 0;
		let calculatorCallCount = 0;
		let targetPhysicalDot = null;
		const atmosphere = {
			/**
			 * Call this method to sample medium.
			 * @returns - The result produced by the operation.
			 */ sampleMedium() {
				mediumSampleCount += 1;
				return {
					rayleighScattering: zeroSpectrum,
					mieScattering: zeroSpectrum,
				};
			},
			/**
			 * Call this method to sample phase.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The result produced by the operation.
			 */ samplePhase({viewDirection, incomingDirection}) {
				if (phaseCallCount === targetPhaseCall) {
					targetPhysicalDot = VectorMath.dot(viewDirection, incomingDirection);
				}
				phaseCallCount += 1;
				return {
					phase: zeroSpectrum,
					rayleighPhase: 0,
					miePhase: 0,
				};
			},
		};
		const calculator = {
			/**
			 * Call this method to compute direct scattering.
			 * @returns - The result produced by the operation.
			 */ computeDirectScattering() {
				calculatorCallCount += 1;
				return zeroSpectrum;
			},
		};
		let radianceReadCount = 0;
		let scatteringWriteCount = 0;
		const previousRadiance = {
			id: 'later-order-frame-previous-radiance',
			provenanceIdentity: 'later-order-frame-previous-radiance',
			order: {kind: 'pure', value: 1},
			scalarCount: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount * 15,
			/**
			 * Call this method to read scalar.
			 * @returns - The result produced by the operation.
			 */ readScalar() {
				radianceReadCount += 1;
				return 0;
			},
			/**
			 * Call this method to read scalar at offset.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ readScalarAtOffset() {
				throw new Error('dense offsets are not used by physical scattering.');
			},
		};
		const outputScattering = {
			id: 'later-order-frame-output-scattering',
			provenanceIdentity: ALGORITHM32_PRODUCTION_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
			order: {kind: 'pure', value: 2},
			scalarCount: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount * 15,
			/** Call this method to write scalar. */ writeScalar() {
				scatteringWriteCount += 1;
			},
			/**
			 * Call this method to write scalar at offset.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ writeScalarAtOffset() {
				throw new Error('dense offsets are not used by physical scattering.');
			},
			/** Call this method to fill. */ fill() {},
		};
		const kernel = createMultipleScatteringEvaluator(directionToLight).createLaterOrderScatteringKernel({
			geometry,
			atmosphere,
			calculator,
			scatteringOrder: 2,
			domainSelection: createOnePositionDomainSelection(),
		});
		expect(positionBuildCount).toBe(1);

		kernel.buildPureScatteringOrder({previousRadiance, outputScattering});

		const rawLocalDot = VectorMath.dot(
			REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.unitVectors[0],
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unitVectors[targetOutgoingIndex],
		);
		const expectedPhysicalDot = VectorMath.dot(
			implementation.expressPhysicalOutgoingScatteringDirection(
				CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unitVectors[targetOutgoingIndex],
			),
			implementation.expressPhysicalIncomingRadianceDirection(
				REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.unitVectors[0],
			),
		);
		expect(Math.abs(rawLocalDot)).toBeLessThan(1e-15);
		expect(targetPhysicalDot).toBeCloseTo(expectedPhysicalDot, 14);
		expect(phaseCallCount).toBe(
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount *
				REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount,
		);
		expect(calculatorCallCount).toBe(phaseCallCount);
		expect(mediumSampleCount).toBe(1);
		expect(mappedDirectionCounts).toEqual({
			fibonacci68: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount + 1,
			w27: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount,
		});
		expect(positionBuildCount).toBe(1);
		expect(radianceReadCount).toBe(
			REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount *
				NATIVE_15_SPECTRAL_BASIS.channelCount,
		);
		expect(scatteringWriteCount).toBe(
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount * NATIVE_15_SPECTRAL_BASIS.channelCount,
		);
	});

	it('rejects the selected production near-polar non-orthogonal cubed-sphere basis', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = new SphericalEarthGeometry({
			bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
			topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
			observerHeight: {value: 2, units: 'meters'},
			observerUpDirection: [0, 0, 1],
			cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN_OWNER.count,
			cacheBoundaryAltitude: {value: 2, units: 'meters'},
		});
		configureGeometry(geometry, {
			instant: '2026-03-20T12:00:00.000Z',
			location: {
				latitude: {value: -0.4610330930446514, units: 'degrees'},
				longitude: {value: 2.041020260375753, units: 'degrees'},
			},
		});
		const directionToLight = geometry.configuration.directionToSource;

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createMultipleScatteringEvaluator(directionToLight).createLaterOrderScatteringKernel({
					geometry,
					atmosphere: {
						/** Call this method to sample medium. */ sampleMedium() {},
						/** Call this method to sample phase. */ samplePhase() {},
					},
					calculator: {
						/** Call this method to compute direct scattering. */ computeDirectScattering() {},
					},
					domainSelection: DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
					scatteringOrder: 2,
				}),
		).toThrowError(/cubed-sphere basis axes must be mutually orthogonal/u);
	});

	it('adds direct J2 ground radiance with source and return-path attenuation', /** Called by Jasmine to exercise the named behavior. */ () => {
		const illuminatedContribution = evaluateGroundContribution({
			scatteringOrder: 2,
			normal: [1, 0, 0],
			sourceTransmittance: 0.5,
			groundToPositionTransmittance: 0.25,
		});
		const occluded = evaluateGroundContribution({
			scatteringOrder: 2,
			normal: [1, 0, 0],
			sourceTransmittance: 0,
			groundToPositionTransmittance: 0.25,
		});
		const backFacing = evaluateGroundContribution({
			scatteringOrder: 2,
			normal: [-1, 0, 0],
			sourceTransmittance: 0.5,
			groundToPositionTransmittance: 0.25,
		});
		const expected =
			4 *
			0.5 *
			1 *
			0.5 *
			0.25 *
			REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.integrationWeights.values[0];

		expect(illuminatedContribution.value).toBeCloseTo(expected, 14);
		expect(illuminatedContribution.value).toBeGreaterThan(0);
		expect(illuminatedContribution.sourcePathCount).toBe(1);
		expect(illuminatedContribution.returnPathCount).toBe(1);
		expect(occluded.value).toBe(0);
		expect(occluded.sourcePathCount).toBe(1);
		expect(backFacing.value).toBe(0);
		expect(backFacing.sourcePathCount).toBe(0);
	});

	it('uses exact unit transmittance for a zero-length ground return path', /** Called by Jasmine to exercise the named behavior. */ () => {
		const result = evaluateGroundContribution({
			scatteringOrder: 2,
			normal: [1, 0, 0],
			sourceTransmittance: 0.5,
			groundToPositionTransmittance: 0,
			groundHitDistance: 0,
		});
		const expected =
			4 * 0.5 * 1 * 0.5 * REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.integrationWeights.values[0];

		expect(result.value).toBeCloseTo(expected, 14);
		expect(result.returnPathCount).toBe(0);
	});

	it('illuminates J3 from pure L1 and J4 from pure L2', /** Called by Jasmine to exercise the named behavior. */ () => {
		const illuminationDirectionIndex = 1;
		const normal = REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.unitVectors[illuminationDirectionIndex];
		const expected =
			3 *
			0.5 *
			1 *
			REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.integrationWeights.values[
				illuminationDirectionIndex
			] *
			0.25 *
			REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.integrationWeights.values[0];

		for (const {scatteringOrder, illuminationOrder} of [
			{scatteringOrder: 3, illuminationOrder: 1},
			{scatteringOrder: 4, illuminationOrder: 2},
		]) {
			const groundIlluminationRadiance = createTestPureRadianceField({
				id: `test-ground-illumination-pure-l${illuminationOrder}`,
				order: illuminationOrder,
			});
			const illuminationWriter = groundIlluminationRadiance.createWriter();
			illuminationWriter.fill(0);
			for (
				let wavelengthIndex = 0;
				wavelengthIndex < NATIVE_15_SPECTRAL_BASIS.channelCount;
				wavelengthIndex += 1
			) {
				illuminationWriter.writeScalar(
					{
						positionIndex: 0,
						directionIndex: illuminationDirectionIndex,
						wavelengthIndex,
					},
					3,
				);
			}
			groundIlluminationRadiance.seal();
			const result = evaluateGroundContribution({
				scatteringOrder,
				normal,
				sourceTransmittance: 0,
				groundToPositionTransmittance: 0.25,
				groundIlluminationRadiance,
			});

			expect(result.value).withContext(`J${scatteringOrder}`).toBeCloseTo(expected, 14);
			expect(result.value).withContext(`J${scatteringOrder}`).toBeGreaterThan(0);
			expect(result.sourceLightingCount).toBe(0);
			expect(result.positionStencilCount).toBe(1);
		}
	});

	it('keeps J2, J3, and J4 bit-identical for omitted and zero BRDF ground', /** Called by Jasmine to exercise the named behavior. */ () => {
		for (const scatteringOrder of [2, 3, 4]) {
			const illuminationOrder = scatteringOrder - 2;
			const groundIlluminationRadiance =
				scatteringOrder === 2 ? null : createGroundIlluminationField(illuminationOrder, 7, 1);
			const common = {
				scatteringOrder,
				normal: /** @type {UnitVector3} */ ([1, 0, 0]),
				sourceTransmittance: 0.5,
				groundToPositionTransmittance: 0.25,
				groundIlluminationRadiance,
				previousRadianceValue: 5,
			};
			const omitted = evaluateGroundContribution({
				...common,
				reflectiveGround: false,
			});
			const explicitZero = evaluateGroundContribution({
				...common,
				reflectiveGround: true,
				brdfValue: 0,
			});

			expect(explicitZero.value).withContext(`J${scatteringOrder}`).toBe(omitted.value);
		}
	});

	it('uses the construction lookup rather than final-view position interpolation', /** Called by Jasmine to exercise the named behavior. */ () => {
		const directionIndex = 1;
		const field = createTestPureRadianceField({
			id: 'test-weighted-ground-illumination-l1',
			order: 1,
		});
		const writer = field.createWriter();
		writer.fill(0);
		for (let wavelengthIndex = 0; wavelengthIndex < NATIVE_15_SPECTRAL_BASIS.channelCount; wavelengthIndex += 1) {
			writer.writeScalar(
				{
					positionIndex: 0,
					directionIndex,
					wavelengthIndex,
				},
				2,
			);
			writer.writeScalar(
				{
					positionIndex: 1,
					directionIndex,
					wavelengthIndex,
				},
				10,
			);
		}
		field.seal();
		const result = evaluateGroundContribution({
			scatteringOrder: 3,
			normal: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.unitVectors[directionIndex],
			sourceTransmittance: 1,
			groundToPositionTransmittance: 0.25,
			groundIlluminationRadiance: field,
			positionStencil: {
				indices: [1],
				weights: [1],
			},
			finalViewPositionStencil: {
				indices: [0],
				weights: [1],
			},
		});
		const expected =
			10 *
			0.5 *
			REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.integrationWeights.values[directionIndex] *
			0.25 *
			REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.integrationWeights.values[0];

		expect(result.value).toBeCloseTo(expected, 14);
		expect(result.constructionPositionStencilCount).toBe(1);
		expect(result.finalViewPositionStencilCount).toBe(0);
	});
});

/** Configure spherical geometry through its construction-time placement seam. */
function configureGeometry(
	geometry,
	observation = {
		instant: '2026-03-20T12:00:00.000Z',
		location: {
			latitude: {value: 0, units: 'degrees'},
			longitude: {value: -90, units: 'degrees'},
		},
	},
) {
	geometry.configureLightSource({
		lightSource: {
			geometryPlacementKind: 'distant-direction',
			configureGeometryPlacement() {},
		},
		observation,
	});
}

/**
 * Called by this module to evaluate one selected incoming ground ray through a one-position Jk kernel.
 *
 * @param {DistantSunGroundContributionEvaluationOptions} options - Supplies order, transport, and illumination facts.
 * @returns {DistantSunGroundContributionEvaluationResult} - Return the selected output and operation counts.
 */
function evaluateGroundContribution(options) {
	const directionToLight = /** @type {UnitVector3} */ ([1, 0, 0]);
	const targetIncomingDirection = REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.unitVectors[0];
	const physicalPosition = {
		coordinates: [10, 0, 0],
		units: /** @type {const} */ ('meters'),
	};
	const groundIntersection = {
		position: {
			coordinates: [0, 0, 0],
			units: /** @type {const} */ ('meters'),
		},
		normal: options.normal,
		distance: {
			value: options.groundHitDistance ?? 2,
			units: /** @type {const} */ ('meters'),
		},
	};
	const counts = {
		sourcePath: 0,
		returnPath: 0,
		sourceLighting: 0,
		constructionPositionStencil: 0,
		finalViewPositionStencil: 0,
	};
	const geometry = {
		/**
		 * Called by geometry to resolve atmosphere coordinate.
		 * @returns - The callback result returned to its caller.
		 */ resolveAtmosphereCoordinate: () => ({
			altitude: {value: 0, units: /** @type {const} */ ('meters')},
		}),
		/**
		 * Called by geometry to resolve scattering cache construction position.
		 * @returns - The callback result returned to its caller.
		 */ resolveScatteringCacheConstructionPosition: () => physicalPosition,
		/**
		 * Called by geometry to express physical incoming radiance direction.
		 * @param cacheDirection - The cache direction value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ expressPhysicalIncomingRadianceDirection: (cacheDirection) => cacheDirection,
		/**
		 * Called by geometry to express physical outgoing scattering direction.
		 * @param cacheDirection - The cache direction value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ expressPhysicalOutgoingScatteringDirection: (cacheDirection) => cacheDirection,
		/**
		 * Call this method to resolve ground intersection. Conditional result values are selected from the accepted input and current state.
		 * @param groundPathRay - The ray value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ resolveGroundIntersection(groundPathRay) {
			return groundPathRay.direction.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param component - The component value accepted by the operation.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (component, index) => component === targetIncomingDirection[index],
			)
				? groundIntersection
				: null;
		},
		/**
		 * Call this method to resolve atmosphere path. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
		 * @param request - The request accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ resolveAtmospherePath(request) {
			if (request.endDistance === undefined) {
				counts.sourcePath += 1;
				return {kind: 'source-path'};
			}
			counts.returnPath += 1;
			return {kind: 'return-path'};
		},
		/**
		 * Call this method to resolve scattering cache position stencil.
		 * @returns - The result produced by the operation.
		 */ resolveScatteringCachePositionStencil() {
			counts.finalViewPositionStencil += 1;
			return options.finalViewPositionStencil ?? {indices: [0], weights: [1]};
		},
		/**
		 * Call this method to resolve scattering cache construction position stencil.
		 * @returns - The result produced by the operation.
		 */ resolveScatteringCacheConstructionPositionStencil() {
			counts.constructionPositionStencil += 1;
			return options.positionStencil ?? {indices: [0], weights: [1]};
		},
	};
	const atmosphere = {
		/**
		 * Called by atmosphere to sample medium.
		 * @returns - The callback result returned to its caller.
		 */ sampleMedium: () => ({
			rayleighScattering: {},
			mieScattering: {},
		}),
		/**
		 * Called by atmosphere to sample phase.
		 * @returns - The callback result returned to its caller.
		 */ samplePhase: () => ({rayleighPhase: {}, miePhase: {}}),
		/**
		 * Call this method to integrate optical depth.
		 * @param path - The path value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ integrateOpticalDepth(path) {
			const value =
				path.kind === 'source-path' ? options.sourceTransmittance : options.groundToPositionTransmittance;
			return {transmittance: {values: Array(15).fill(value)}};
		},
	};
	const lightSource = {
		/**
		 * Call this method to sample direct lighting.
		 * @returns - The result produced by the operation.
		 */ sampleDirectLighting() {
			counts.sourceLighting += 1;
			return {
				sourceIrradiance: {values: Array(15).fill(4)},
				directionToLight,
			};
		},
		/**
		 * Called by light source to resolve source path limit.
		 * @returns - The callback result returned to its caller.
		 */ resolveSourcePathLimit: () => ({
			maxDistance: null,
			reason: 'test-distant-source',
		}),
	};
	const boundary = {
		id: 'test-lambertian-ground',
		/**
		 * Called by boundary to evaluate brdf.
		 * @returns - The callback result returned to its caller.
		 */ evaluateBrdf: () => ({
			values: Array(15).fill(options.brdfValue ?? 0.5),
		}),
	};
	let outputValue = 0;
	const commonKernelRequest = {
		geometry,
		atmosphere,
		calculator: {
			/**
			 * Called by common kernel request to compute direct scattering.
			 * @returns - The callback result returned to its caller.
			 */ computeDirectScattering: () => ({
				values: Array(15).fill(1),
			}),
		},
		scatteringOrder: options.scatteringOrder,
		groundIlluminationRadiance: options.groundIlluminationRadiance ?? null,
		domainSelection: createOnePositionDomainSelection(),
	};
	const evaluator = createMultipleScatteringEvaluator(directionToLight, lightSource);
	const kernel =
		options.reflectiveGround === false
			? evaluator.createLaterOrderScatteringKernel({
					...commonKernelRequest,
					groundBoundary: null,
				})
			: evaluator.createLaterOrderScatteringKernel({
					...commonKernelRequest,
					groundBoundary: boundary,
					sourceTransmittanceIntervalCount: 3,
				});

	kernel.buildPureScatteringOrder({
		previousRadiance: {
			id: 'reflective-ground-previous-radiance',
			provenanceIdentity: 'reflective-ground-previous-radiance',
			order: {
				kind: 'pure',
				value: options.scatteringOrder - 1,
			},
			scalarCount: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount * 15,
			/**
			 * Called by evaluate ground contribution to read scalar. Conditional result values are selected from the accepted input and current state.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ readScalar: ({directionIndex}) => (directionIndex === 0 ? (options.previousRadianceValue ?? 0) : 0),
			/**
			 * Called by evaluate ground contribution to read scalar at offset.
			 * @returns - The callback result returned to its caller.
			 */ readScalarAtOffset: () => 0,
		},
		outputScattering: {
			id: 'reflective-ground-output-scattering',
			provenanceIdentity: ALGORITHM32_PRODUCTION_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
			order: {
				kind: 'pure',
				value: options.scatteringOrder,
			},
			scalarCount: 15,
			/**
			 * Call this method to write scalar.
			 * @param input1 - The destructured input accepted by the operation.
			 * @param value - The value accepted by the operation.
			 */ writeScalar({wavelengthIndex}, value) {
				if (wavelengthIndex === 0) {
					outputValue = value;
				}
			},
			/** Call this method to write scalar at offset. */ writeScalarAtOffset() {},
			/** Call this method to fill. */ fill() {},
		},
	});

	return {
		value: outputValue,
		sourcePathCount: counts.sourcePath,
		returnPathCount: counts.returnPath,
		sourceLightingCount: counts.sourceLighting,
		positionStencilCount: counts.constructionPositionStencil,
		constructionPositionStencilCount: counts.constructionPositionStencil,
		finalViewPositionStencilCount: counts.finalViewPositionStencil,
	};
}

/**
 * Called by this module to retain production angular facts while bounding physical-position work.
 *
 * @returns {DistantSunConstructionDomainSelection} - The bounded executable selection.
 */
function createOnePositionDomainSelection() {
	const selected = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

	return /** @type {DistantSunConstructionDomainSelection} */ ({
		...selected,
		positionNodes: [selected.positionNodes[0]],
		positionCount: 1,
	});
}

/**
 * Called by this module to create one configured evaluator around the source facts exercised by a test.
 *
 * @param {UnitVector3} directionToLight - The configured physical source direction.
 * @param {DistantSunGroundReflectionLightSource} [source] - The optional reflective-ground source.
 * @returns {DistantSunCpuMultipleScatteringEvaluator} - The configured evaluator.
 *
 */
function createMultipleScatteringEvaluator(directionToLight, source) {
	const capturedSource =
		source ??
		/** @type {DistantSunGroundReflectionLightSource} */ ({
			/**
			 * Call this method to sample direct lighting.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ sampleDirectLighting() {
				throw new Error('omitted-ground evaluation must not sample direct lighting.');
			},
			/**
			 * Call this method to resolve source path limit.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ resolveSourcePathLimit() {
				throw new Error('omitted-ground evaluation must not resolve a source path.');
			},
		});

	return new DistantSunCpuMultipleScatteringEvaluator(
		/** @type {DistantSunCacheProviderSource} */ (/** @type {unknown} */ (capturedSource)),
		/** @type {DistantSunLightSourceConfig} */ (/** @type {unknown} */ ({directionToLight})),
		{createPureRadianceField: createTestPureRadianceField},
	);
}

/**
 * Called by this module to create mutable distant-Sun radiance storage for one test fixture.
 *
 * @param {DistantSunCpuPureFieldDefinition} definition - The fixture field facts.
 * @returns {CpuDirectionalSpectralFieldContract} - The mutable fixture field.
 *
 */
function createTestPureRadianceField(definition) {
	const domainSelection = definition.domainSelection ?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

	return new CpuDirectionalSpectralField({
		id: definition.id,
		provenanceIdentity: definition.provenanceIdentity ?? DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
		order: {kind: 'pure', value: definition.order},
		packing: domainSelection.radiancePacking,
	});
}

/**
 * Called by this module to create one sealed pure radiance field for higher-order ground tests.
 *
 * @param {number} order - Supplies the pure L order.
 * @param {number} value - Supplies the selected scalar value.
 * @param {number} directionIndex - Supplies the selected exact direction.
 * @returns {CpuDirectionalSpectralFieldContract} - Return the sealed field.
 */
function createGroundIlluminationField(order, value, directionIndex) {
	const field = createTestPureRadianceField({
		id: `test-ground-illumination-pure-l${order}`,
		order,
	});
	const writer = field.createWriter();
	writer.fill(0);
	for (let wavelengthIndex = 0; wavelengthIndex < NATIVE_15_SPECTRAL_BASIS.channelCount; wavelengthIndex += 1) {
		writer.writeScalar(
			{
				positionIndex: 0,
				directionIndex,
				wavelengthIndex,
			},
			value,
		);
	}
	field.seal();

	return field;
}
