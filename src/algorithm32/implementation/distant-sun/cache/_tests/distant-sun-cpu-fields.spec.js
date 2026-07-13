import {
	createNativeProductionProfile,
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
} from '../../../../profiles/index.js';
import {DistantSunLightSource} from '../../DistantSunLightSource.js';
import {
	DISTANT_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY,
	NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from '../consts.js';

describe('distant-Sun binary64 CPU fields', /** Called by Jasmine to register the named test suite. */ () => {
	it('publishes direct L1 with source-owned radiance packing and caller-selected identity', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const atmosphere = createNullPathAtmosphere();
		const geometry = createNullPathGeometry();
		const field = source.buildCpuPrimaryRadianceField({
			model: createCpuModel(source, atmosphere, geometry, DEFAULT_NATIVE_PRODUCTION_PROFILE),
			id: 'test-distant-l1',
			provenanceIdentity: 'test-distant-l1-provenance',
		});

		expect(field.id).toBe('test-distant-l1');
		expect(field.order).toEqual({kind: 'pure', value: 1});
		expect(field.scalarCount).toBe(
			NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION.radiancePacking.scalarCount,
		);
		expect(field.provenanceIdentity).toBe('test-distant-l1-provenance');
		expect(field.isSealed).toBeTrue();
	});

	it('publishes distinct pure and cumulative J1 fields through the provider result', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const atmosphere = createNullPathAtmosphere();
		const geometry = createNullPathGeometry();
		const profile = createNativeProductionProfile({
			id: 'test-distant-cpu-j1-profile',
			revision: 1,
			maximumScatteringOrder: 1,
		});
		const progress = [];
		const result = source.buildCpuScatteringCache({
			model: createCpuModel(source, atmosphere, geometry, profile),
			onProgress: (value) => progress.push(value),
		});
		const pureScatteringField = result.pureScatteringDensityByOrder[0];
		const cumulative = result.cumulativeScatteringDensity;

		expect(pureScatteringField.order).toEqual({kind: 'pure', value: 1});
		expect(cumulative.order).toEqual({kind: 'cumulative-through', value: 1, included: [1]});
		expect(pureScatteringField.scalarCount).toBe(
			NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION.scatteringDensityPacking.scalarCount,
		);
		expect(cumulative.scalarCount).toBe(pureScatteringField.scalarCount);
		expect(pureScatteringField.id).not.toBe(cumulative.id);
		expect(pureScatteringField.provenanceIdentity).toBe(DISTANT_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY);
		expect(pureScatteringField.isSealed).toBeTrue();
		expect(cumulative.isSealed).toBeTrue();
		expect(progress.at(-1)).toEqual({phase: 'accumulation', order: 1, completed: 4, total: 4});
		expect(progress.filter((value) => value.phase === 'primary-scattering').length).toBe(4);
	});

	it('selects omitted cache depth and transport count from the supplied profile', /** Called by Jasmine to exercise the named behavior. */ () => {
		const profile = createNativeProductionProfile({
			id: 'test-distant-cpu-profile-defaults',
			revision: 2,
			maximumScatteringOrder: 1,
			transportIntervalCount: 7,
		});
		const source = createDistantSource();
		const atmosphere = createNullPathAtmosphere();
		const geometry = createNullPathGeometry();
		const result = source.buildCpuScatteringCache({
			model: createCpuModel(source, atmosphere, geometry, profile),
		});

		expect(result.maximumScatteringOrder).toBe(1);
		expect(result.pureScatteringDensityByOrder.length).toBe(1);
		expect(result.pureRadianceByOrder).toEqual([]);
		expect(result.options.maximumScatteringOrder).toBe(1);
		expect(result.options.transportIntervalCount).toBe(7);
	});
});

/**
 * Called by this module to create the configured source used by CPU field publication tests.
 *
 * @returns {DistantSunLightSource} - The configured distant source.
 *
 */
function createDistantSource() {
	const source = new DistantSunLightSource({
		angularRadius: {value: 0.004, units: 'radians'},
	});
	source.configureGeometryPlacement({kind: 'distant-direction', directionToLight: [1, 0, 0]});

	return source;
}

/**
 * Called by this module to create a focused aggregate CPU execution model.
 *
 * @param {DistantSunLightSource} source - Configured source.
 * @param {DistantSunPrimaryScatteringAtmosphere} atmosphere - Atmosphere double.
 * @param {DistantSunCpuCacheBlackGroundRequestN4['geometry']} geometry - Geometry double.
 * @param {NativeProductionProfile} numericalProfile - Native numerical template.
 * @returns {SharedModel} - Focused aggregate model.
 */
function createCpuModel(source, atmosphere, geometry, numericalProfile) {
	const domains = NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	return /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			lightSource: source,
			atmosphere,
			geometry,
			groundBoundary: null,
			profile: {
				...numericalProfile,
				id: `${numericalProfile.id}-execution`,
				spectral: {
					...numericalProfile.spectral,
					basis: NATIVE_15_SPECTRAL_BASIS,
					sourceIrradianceDensity: source.sourceIrradiance,
				},
				models: {lightSource: source, atmosphere, geometry, groundBoundary: null},
				domains: {
					positions: domains.positionDomain,
					incomingDirections: domains.incomingDirectionDomain,
					outgoingDirections: domains.outgoingDirectionDomain,
				},
			},
		})
	);
}

/**
 * Called by this module to create an atmosphere that fails if a null cache ray reaches physical sampling.
 *
 * @returns {DistantSunPrimaryScatteringAtmosphere} - The guarded atmosphere fixture.
 *
 */

function createNullPathAtmosphere() {
	return /** @type {DistantSunPrimaryScatteringAtmosphere} */ (
		/** @type {unknown} */ ({
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			/**
			 * Call this method to sample medium.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ sampleMedium() {
				throw new Error('null cache rays must not sample the medium.');
			},
			/**
			 * Call this method to integrate optical depth.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ integrateOpticalDepth() {
				throw new Error('null cache rays must not integrate optical depth.');
			},
			/**
			 * Call this method to sample phase.
			 * @returns - The result produced by the operation.
			 */ samplePhase() {
				return {
					rayleighPhase: {value: 0, units: 'sr^-1'},
					miePhase: {value: 0, units: 'sr^-1'},
				};
			},
		})
	);
}

/**
 * Called by this module to create geometry whose selected cache rays all miss the atmosphere.
 *
 * @returns {DistantSunCpuCacheBlackGroundRequestN4['geometry']} - The null-path geometry fixture.
 *
 */
function createNullPathGeometry() {
	return /** @type {DistantSunCpuCacheBlackGroundRequestN4['geometry']} */ (
		/** @type {unknown} */ ({
			/**
			 * Call this method to resolve cache build ray.
			 * @returns - The result produced by the operation.
			 */ resolveCacheBuildRay() {
				return null;
			},
			/**
			 * Call this method to resolve atmosphere coordinate.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ resolveAtmosphereCoordinate() {
				throw new Error('null cache rays have no atmosphere coordinate.');
			},
			/**
			 * Call this method to resolve atmosphere path.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ resolveAtmospherePath() {
				throw new Error('null cache rays have no atmosphere path.');
			},
			/**
			 * Call this method to resolve source relative position.
			 * @param position - The position value accepted by the operation.
			 * @returns - The result produced by the operation.
			 */ resolveSourceRelativePosition(position) {
				return position;
			},
			/**
			 * Call this method to express physical incoming radiance direction.
			 * @param direction - The direction value accepted by the operation.
			 * @returns - The result produced by the operation.
			 */ expressPhysicalIncomingRadianceDirection(direction) {
				return direction;
			},
			/**
			 * Call this method to resolve scattering cache construction position.
			 * @param positionNode - The position node value accepted by the operation.
			 * @returns - The result produced by the operation.
			 */ resolveScatteringCacheConstructionPosition(positionNode) {
				return positionNode.position;
			},
			/**
			 * Call this method to express physical outgoing scattering direction.
			 * @param direction - The direction value accepted by the operation.
			 * @returns - The result produced by the operation.
			 */ expressPhysicalOutgoingScatteringDirection(direction) {
				return direction;
			},
			/**
			 * Call this method to resolve scattering cache construction position stencil.
			 * @returns - The result produced by the operation.
			 */ resolveScatteringCacheConstructionPositionStencil() {
				return {indices: [0], weights: [1]};
			},
			/**
			 * Call this method to express scattering cache direction.
			 * @param direction - The direction value accepted by the operation.
			 * @returns - The result produced by the operation.
			 */ expressScatteringCacheDirection(direction) {
				return direction;
			},
		})
	);
}
