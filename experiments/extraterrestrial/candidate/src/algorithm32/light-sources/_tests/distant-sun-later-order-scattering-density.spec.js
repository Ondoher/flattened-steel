import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../../constants/Algorithm32CanonicalData.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	FIBONACCI_34_DIRECTION_DOMAIN,
	NATIVE_48_POSITION_DOMAIN,
} from '../../domains/index.js';
import { SphericalEarthGeometry } from '../../geometries/SphericalEarthGeometry.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../../profiles/index.js';
import VectorMath from '../../utils/VectorMath.js';
import {
	createDistantSunCpuPureRadianceField,
} from '../DistantSunCpuFields.js';
import {
	createDistantSunLaterOrderScatteringKernel,
} from '../distant-sun-later-order-scattering-density.js';
import {
	ALGORITHM32_STAR_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
} from '../../transport/consts.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from '../consts.js';

describe('distant-Sun later-order scattering adapter', () => {
	it('maps both direction domains physically and preserves zero-medium calls', () => {
		const directionToLight = /** @type {UnitVector3} */ ([0, 0, 1]);
		const implementation = new SphericalEarthGeometry({
			bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
			topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
			observerHeight: { value: 2, units: 'meters' },
			observerUpDirection: [0, 0, 1],
			directionToSource: directionToLight,
			cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN.count,
			cacheBoundaryAltitude: { value: 2, units: 'meters' },
		});
		const mappedDirectionCounts = { fibonacci34: 0, w27: 0 };
		let positionBuildCount = 0;
		const geometry = {
			resolveAtmosphereCoordinate: (position) =>
				implementation.resolveAtmosphereCoordinate(position),
			resolveScatteringCacheConstructionPosition(positionNode) {
				positionBuildCount += 1;
				return implementation
					.resolveScatteringCacheConstructionPosition(
						positionNode,
					);
			},
			expressPhysicalIncomingRadianceDirection(cacheDirection) {
				mappedDirectionCounts.fibonacci34 += 1;
				return implementation
					.expressPhysicalIncomingRadianceDirection(
						cacheDirection,
					);
			},
			expressPhysicalOutgoingScatteringDirection(cacheDirection) {
				mappedDirectionCounts.w27 += 1;
				return implementation
					.expressPhysicalOutgoingScatteringDirection(
						cacheDirection,
					);
			},
		};
		const zeroSpectrum = Array(15).fill(0);
		const targetOutgoingIndex = 1822;
		const targetPhaseCall = targetOutgoingIndex
			* FIBONACCI_34_DIRECTION_DOMAIN.count;
		let mediumSampleCount = 0;
		let phaseCallCount = 0;
		let calculatorCallCount = 0;
		let targetPhysicalDot = null;
		const atmosphere = {
			sampleMedium() {
				mediumSampleCount += 1;
				return {
					rayleighScattering: zeroSpectrum,
					mieScattering: zeroSpectrum,
				};
			},
			samplePhase({ viewDirection, incomingDirection }) {
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
			computeDirectScattering() {
				calculatorCallCount += 1;
				return zeroSpectrum;
			},
		};
		const positionDomain = {
			count: 1,
			nodes: [NATIVE_48_POSITION_DOMAIN.nodes[0]],
		};
		const basis = { channelCount: 15 };
		let radianceReadCount = 0;
		let scatteringWriteCount = 0;
		const previousRadiance = {
			descriptor: {
				basis,
				positionDomain,
				directionDomain: FIBONACCI_34_DIRECTION_DOMAIN,
			},
			scalarCount: FIBONACCI_34_DIRECTION_DOMAIN.count * basis.channelCount,
			readScalar() {
				radianceReadCount += 1;
				return 0;
			},
			readScalarAtOffset() {
				throw new Error('dense offsets are not used by physical scattering.');
			},
		};
		const outputScattering = {
			descriptor: {
				basis,
				positionDomain,
				directionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN,
				provenanceIdentity:
					ALGORITHM32_STAR_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
			},
			scalarCount:
				CUBED_SPHERE_W27_DIRECTION_DOMAIN.count * basis.channelCount,
			writeScalar() {
				scatteringWriteCount += 1;
			},
			writeScalarAtOffset() {
				throw new Error('dense offsets are not used by physical scattering.');
			},
			fill() {},
		};
		const kernel = createDistantSunLaterOrderScatteringKernel({
			geometry,
			atmosphere,
			calculator,
			directionToLight,
			scatteringOrder: 2,
			domainSelection: createOnePositionDomainSelection(),
		});
		expect(positionBuildCount).toBe(1);

		kernel.buildPureScatteringOrder({ previousRadiance, outputScattering });

		const rawLocalDot = VectorMath.dot(
			FIBONACCI_34_DIRECTION_DOMAIN.unitVectors[0],
			CUBED_SPHERE_W27_DIRECTION_DOMAIN.unitVectors[targetOutgoingIndex],
		);
		expect(Math.abs(rawLocalDot)).toBeLessThan(1e-15);
		expect(targetPhysicalDot).toBeCloseTo(1, 14);
		expect(phaseCallCount).toBe(
			CUBED_SPHERE_W27_DIRECTION_DOMAIN.count
				* FIBONACCI_34_DIRECTION_DOMAIN.count,
		);
		expect(calculatorCallCount).toBe(phaseCallCount);
		expect(mediumSampleCount).toBe(1);
		expect(mappedDirectionCounts).toEqual({
			fibonacci34: FIBONACCI_34_DIRECTION_DOMAIN.count + 1,
			w27: CUBED_SPHERE_W27_DIRECTION_DOMAIN.count,
		});
		expect(positionBuildCount).toBe(1);
		expect(radianceReadCount).toBe(
			FIBONACCI_34_DIRECTION_DOMAIN.count * basis.channelCount,
		);
		expect(scatteringWriteCount).toBe(
			CUBED_SPHERE_W27_DIRECTION_DOMAIN.count * basis.channelCount,
		);
	});

	it('rejects the selected Star near-polar non-orthogonal cubed-sphere basis', () => {
		const sourceVector = [1e-8, 0, 1];
		const sourceLength = Math.hypot(...sourceVector);
		const directionToLight = /** @type {UnitVector3} */ (sourceVector.map(
			(component) => component / sourceLength,
		));
		const geometry = new SphericalEarthGeometry({
			bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
			topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
			observerHeight: { value: 2, units: 'meters' },
			observerUpDirection: [0, 0, 1],
			directionToSource: directionToLight,
			cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN.count,
			cacheBoundaryAltitude: { value: 2, units: 'meters' },
		});

		expect(() => createDistantSunLaterOrderScatteringKernel({
			geometry,
			atmosphere: {
				sampleMedium() {},
				samplePhase() {},
			},
			calculator: {
				computeDirectScattering() {},
			},
			directionToLight,
			scatteringOrder: 2,
		})).toThrowError(/cubed-sphere basis axes must be mutually orthogonal/u);
	});

	it('adds direct J2 ground radiance with source and return-path attenuation', () => {
		const lit = evaluateGroundContribution({
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
		const expected = 4 * 0.5 * 1 * 0.5 * 0.25
			* FIBONACCI_34_DIRECTION_DOMAIN.integrationWeights.values[0];

		expect(lit.value).toBeCloseTo(expected, 14);
		expect(lit.value).toBeGreaterThan(0);
		expect(lit.sourcePathCount).toBe(1);
		expect(lit.returnPathCount).toBe(1);
		expect(occluded.value).toBe(0);
		expect(occluded.sourcePathCount).toBe(1);
		expect(backFacing.value).toBe(0);
		expect(backFacing.sourcePathCount).toBe(0);
	});

	it('uses exact unit transmittance for a zero-length ground return path', () => {
		const result = evaluateGroundContribution({
			scatteringOrder: 2,
			normal: [1, 0, 0],
			sourceTransmittance: 0.5,
			groundToPositionTransmittance: 0,
			groundHitDistance: 0,
		});
		const expected = 4 * 0.5 * 1 * 0.5
			* FIBONACCI_34_DIRECTION_DOMAIN.integrationWeights.values[0];

		expect(result.value).toBeCloseTo(expected, 14);
		expect(result.returnPathCount).toBe(0);
	});

	it('illuminates J3 from pure L1 and J4 from pure L2', () => {
		const illuminationDirectionIndex = 1;
		const normal = FIBONACCI_34_DIRECTION_DOMAIN
			.unitVectors[illuminationDirectionIndex];
		const expected = 3 * 0.5 * 1
			* FIBONACCI_34_DIRECTION_DOMAIN.integrationWeights
				.values[illuminationDirectionIndex]
			* 0.25
			* FIBONACCI_34_DIRECTION_DOMAIN.integrationWeights.values[0];

		for (const { scatteringOrder, illuminationOrder } of [
			{ scatteringOrder: 3, illuminationOrder: 1 },
			{ scatteringOrder: 4, illuminationOrder: 2 },
		]) {
			const groundIlluminationRadiance =
				createDistantSunCpuPureRadianceField({
					id: `test-ground-illumination-pure-l${illuminationOrder}`,
					order: illuminationOrder,
				});
			const illuminationWriter = groundIlluminationRadiance.createWriter();
			illuminationWriter.fill(0);
			for (let wavelengthIndex = 0;
				wavelengthIndex < NATIVE_15_SPECTRAL_BASIS.channelCount;
				wavelengthIndex += 1) {
				illuminationWriter.writeScalar({
					positionIndex: 0,
					directionIndex: illuminationDirectionIndex,
					wavelengthIndex,
				}, 3);
			}
			groundIlluminationRadiance.seal();
			const result = evaluateGroundContribution({
				scatteringOrder,
				normal,
				sourceTransmittance: 0,
				groundToPositionTransmittance: 0.25,
				groundIlluminationRadiance,
			});

			expect(result.value).withContext(`J${scatteringOrder}`)
				.toBeCloseTo(expected, 14);
			expect(result.value).withContext(`J${scatteringOrder}`)
				.toBeGreaterThan(0);
			expect(result.sourceLightingCount).toBe(0);
			expect(result.positionStencilCount).toBe(1);
		}
	});

	it('keeps J2, J3, and J4 bit-identical for omitted and zero BRDF ground', () => {
		for (const scatteringOrder of [2, 3, 4]) {
			const illuminationOrder = scatteringOrder - 2;
			const groundIlluminationRadiance = scatteringOrder === 2
				? null
				: createGroundIlluminationField(illuminationOrder, 7, 1);
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

			expect(explicitZero.value).withContext(`J${scatteringOrder}`)
				.toBe(omitted.value);
		}
	});

	it('uses the construction lookup rather than final-view position interpolation', () => {
		const directionIndex = 1;
		const field = createDistantSunCpuPureRadianceField({
			id: 'test-weighted-ground-illumination-l1',
			order: 1,
		});
		const writer = field.createWriter();
		writer.fill(0);
		for (let wavelengthIndex = 0;
			wavelengthIndex < NATIVE_15_SPECTRAL_BASIS.channelCount;
			wavelengthIndex += 1) {
			writer.writeScalar({
				positionIndex: 0,
				directionIndex,
				wavelengthIndex,
			}, 2);
			writer.writeScalar({
				positionIndex: 1,
				directionIndex,
				wavelengthIndex,
			}, 10);
		}
		field.seal();
		const result = evaluateGroundContribution({
			scatteringOrder: 3,
			normal: FIBONACCI_34_DIRECTION_DOMAIN.unitVectors[directionIndex],
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
		const expected = 10 * 0.5
			* FIBONACCI_34_DIRECTION_DOMAIN.integrationWeights.values[directionIndex]
			* 0.25
			* FIBONACCI_34_DIRECTION_DOMAIN.integrationWeights.values[0];

		expect(result.value).toBeCloseTo(expected, 14);
		expect(result.constructionPositionStencilCount).toBe(1);
		expect(result.finalViewPositionStencilCount).toBe(0);
	});
});

/**
 * Evaluate one selected incoming ground ray through a one-position Jk kernel.
 *
 * @param {object} options - Supplies order, transport, and illumination facts.
 * @param {2 | 3 | 4} options.scatteringOrder - Supplies J2, J3, or J4.
 * @param {UnitVector3} options.normal - Supplies the ground normal.
 * @param {number} options.sourceTransmittance - Supplies source-to-hit survival.
 * @param {number} options.groundToPositionTransmittance - Supplies hit-to-position survival.
 * @param {CpuDirectionalSpectralFieldContract | null} [options.groundIlluminationRadiance] - Supplies pure L1 for J3.
 * @param {boolean} [options.reflectiveGround] - Selects explicit ground when not false.
 * @param {number} [options.brdfValue] - Supplies the explicit BRDF scalar.
 * @param {number} [options.previousRadianceValue] - Supplies existing pure L(k-1).
 * @param {ScatteringCachePositionStencil} [options.positionStencil] - Supplies ground-position weights.
 * @param {ScatteringCachePositionStencil} [options.finalViewPositionStencil] - Supplies a distinct final-view policy.
 * @param {number} [options.groundHitDistance] - Supplies the ground-hit distance.
 * @returns {{
 *   value: number,
 *   sourcePathCount: number,
 *   returnPathCount: number,
 *   sourceLightingCount: number,
 *   positionStencilCount: number,
 *   constructionPositionStencilCount: number,
 *   finalViewPositionStencilCount: number,
 * }} Return the selected output and operation counts.
 */
function evaluateGroundContribution(options) {
	const directionToLight = /** @type {UnitVector3} */ ([1, 0, 0]);
	const targetIncomingDirection =
		FIBONACCI_34_DIRECTION_DOMAIN.unitVectors[0];
	const physicalPosition = {
		coordinates: [10, 0, 0],
		units: /** @type {const} */ ('meters'),
	};
	const hit = {
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
		resolveAtmosphereCoordinate: () => ({
			altitude: { value: 0, units: /** @type {const} */ ('meters') },
		}),
		resolveScatteringCacheConstructionPosition: () => physicalPosition,
		expressPhysicalIncomingRadianceDirection: (cacheDirection) =>
			cacheDirection,
		expressPhysicalOutgoingScatteringDirection: (cacheDirection) =>
			cacheDirection,
		resolveGroundIntersection(ray) {
			return ray.direction.every((component, index) =>
				component === targetIncomingDirection[index])
				? hit
				: null;
		},
		resolveAtmospherePath(request) {
			if (request.endDistance === undefined) {
				counts.sourcePath += 1;
				return { kind: 'source-path' };
			}
			counts.returnPath += 1;
			return { kind: 'return-path' };
		},
		resolveScatteringCachePositionStencil() {
			counts.finalViewPositionStencil += 1;
			return options.finalViewPositionStencil
				?? { indices: [0], weights: [1] };
		},
		resolveScatteringCacheConstructionPositionStencil() {
			counts.constructionPositionStencil += 1;
			return options.positionStencil ?? { indices: [0], weights: [1] };
		},
	};
	const atmosphere = {
		sampleMedium: () => ({
			rayleighScattering: {},
			mieScattering: {},
		}),
		samplePhase: () => ({ rayleighPhase: {}, miePhase: {} }),
		integrateOpticalDepth(path) {
			const value = path.kind === 'source-path'
				? options.sourceTransmittance
				: options.groundToPositionTransmittance;
			return { transmittance: { values: Array(15).fill(value) } };
		},
	};
	const lightSource = {
		sampleDirectLighting() {
			counts.sourceLighting += 1;
			return {
				sourceIrradiance: { values: Array(15).fill(4) },
				directionToLight,
			};
		},
		resolveSourcePathLimit: () => ({
			maxDistance: null,
			reason: 'test-distant-source',
		}),
	};
	const boundary = {
		id: 'test-lambertian-ground',
		describe: () => ({
			id: 'test-lambertian-ground',
			contentHash: 'sha256:test-lambertian-ground',
		}),
		evaluateBrdf: () => ({
			values: Array(15).fill(options.brdfValue ?? 0.5),
		}),
	};
	const positionDomain = {
		count: 1,
		nodes: [NATIVE_48_POSITION_DOMAIN.nodes[0]],
	};
	const outputDirectionDomain = {
		...CUBED_SPHERE_W27_DIRECTION_DOMAIN,
		count: 1,
		unitVectors: [CUBED_SPHERE_W27_DIRECTION_DOMAIN.unitVectors[0]],
	};
	let outputValue = 0;
	const commonKernelRequest = {
		geometry,
		atmosphere,
		calculator: {
			computeDirectScattering: () => ({ values: Array(15).fill(1) }),
		},
		directionToLight,
		scatteringOrder: options.scatteringOrder,
		groundIlluminationRadiance:
			options.groundIlluminationRadiance ?? null,
		domainSelection: createOnePositionDomainSelection(),
	};
	const kernel = options.reflectiveGround === false
		? createDistantSunLaterOrderScatteringKernel({
			...commonKernelRequest,
			groundBoundary: null,
		})
		: createDistantSunLaterOrderScatteringKernel({
			...commonKernelRequest,
			groundBoundary: boundary,
			lightSource,
			sourceTransmittanceIntervalCount: 3,
		});

	kernel.buildPureScatteringOrder({
		previousRadiance: {
			descriptor: {
				basis: NATIVE_15_SPECTRAL_BASIS,
				positionDomain,
				directionDomain: FIBONACCI_34_DIRECTION_DOMAIN,
			},
			scalarCount: FIBONACCI_34_DIRECTION_DOMAIN.count * 15,
			readScalar: ({ directionIndex }) => directionIndex === 0
				? options.previousRadianceValue ?? 0
				: 0,
			readScalarAtOffset: () => 0,
		},
		outputScattering: {
			descriptor: {
				basis: NATIVE_15_SPECTRAL_BASIS,
				positionDomain,
				directionDomain: outputDirectionDomain,
				provenanceIdentity:
					ALGORITHM32_STAR_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
			},
			scalarCount: 15,
			writeScalar({ wavelengthIndex }, value) {
				if (wavelengthIndex === 0) {
					outputValue = value;
				}
			},
			writeScalarAtOffset() {},
			fill() {},
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
 * Retain production angular facts while bounding physical-position work.
 *
 * @returns {DistantSunConstructionDomainSelection} The bounded executable selection.
 */
function createOnePositionDomainSelection() {
	const selected =
		DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

	return /** @type {DistantSunConstructionDomainSelection} */ ({
		...selected,
		positionNodes: [selected.positionNodes[0]],
		positionCount: 1,
	});
}

/**
 * Create one sealed pure radiance field for higher-order ground tests.
 *
 * @param {number} order - Supplies the pure L order.
 * @param {number} value - Supplies the selected scalar value.
 * @param {number} directionIndex - Supplies the selected exact direction.
 * @returns {CpuDirectionalSpectralFieldContract} Return the sealed field.
 */
function createGroundIlluminationField(order, value, directionIndex) {
	const field = createDistantSunCpuPureRadianceField({
		id: `test-ground-illumination-pure-l${order}`,
		order,
	});
	const writer = field.createWriter();
	writer.fill(0);
	for (let wavelengthIndex = 0;
		wavelengthIndex < NATIVE_15_SPECTRAL_BASIS.channelCount;
		wavelengthIndex += 1) {
		writer.writeScalar({
			positionIndex: 0,
			directionIndex,
			wavelengthIndex,
		}, value);
	}
	field.seal();

	return field;
}
