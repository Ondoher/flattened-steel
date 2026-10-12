import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../sampling-domains/direction/cubed-sphere/consts.js';
import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER} from '../../../sampling-domains/direction/fibonacci/consts.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/native-15/native-15-profile.js';
import {
	LOCAL_SUN_CONSTRUCTION_DOMAIN_ID,
	LOCAL_SUN_DEFAULT_RHO_NODE_COUNT,
	LOCAL_SUN_DEFAULT_Z_NODE_COUNT,
	LOCAL_SUN_RADIANCE_PACKING_ID,
	LOCAL_SUN_SCATTERING_DENSITY_PACKING_ID,
} from './consts.js';
import LocalSunFieldPacking from './LocalSunFieldPacking.js';
import {LocalSunCompactConstructionProfile} from './LocalSunCompactConstructionProfile.js';

/**
 * Coherent executable z-by-rho, reflection-completed Fibonacci-68, and cubed-sphere
 * selection for local-Sun CPU and GPU fields.
 */
export default class LocalSunConstructionDomainSelection {
	/** Executable outgoing-direction owner. @type {CubedSphereDirectionDomain} */
	_outgoingDirectionDomainOwner;

	/** Construction-domain contract kind. @readonly @type {"local-sun-construction-domain-selection"} */
	kind;
	/** Unique identifier for the construction-domain selection. @readonly @type {string} */
	id;
	/** Executable position domain. @readonly @type {LocalSunPositionDomainOwner} */
	positionDomain;
	/** Z-major, rho-fast flattened position nodes. @readonly @type {readonly PositionDomainNode[]} */
	positionNodes;
	/** Ordered altitude nodes. @readonly @type {readonly Distance[]} */
	zNodes;
	/** Ordered radial nodes. @readonly @type {readonly Distance[]} */
	rhoNodes;
	/** Number of altitude nodes. @readonly @type {number} */
	zCount;
	/** Number of radial nodes. @readonly @type {number} */
	rhoCount;
	/** Number of flattened position nodes. @readonly @type {number} */
	positionCount;
	/** Executable spectral basis. @readonly @type {SpectralBasis} */
	spectralBasis;
	/** Number of executable spectral channels. @readonly @type {number} */
	spectralChannelCount;
	/** Executable incoming-direction domain. @readonly @type {LocalSunIncomingDirectionDomain} */
	incomingDirectionDomain;
	/** Source-oriented Fibonacci incoming unit vectors. @readonly @type {readonly UnitVector3[]} */
	incomingUnitVectors;
	/** Source-oriented Fibonacci solid-angle weights. @readonly @type {SolidAngleWeights} */
	incomingIntegrationWeights;
	/** Number of executable incoming directions. @readonly @type {number} */
	incomingDirectionCount;
	/** Executable outgoing-direction domain. @readonly @type {CubedSphereDirectionDomain} */
	outgoingDirectionDomain;
	/** Cubed-sphere outgoing unit vectors. @readonly @type {readonly UnitVector3[]} */
	outgoingUnitVectors;
	/** Number of executable outgoing directions. @readonly @type {number} */
	outgoingDirectionCount;
	/** Positive-axis cubed-sphere face-center addresses. @readonly @type {CubedSpherePositiveFaceCenterIndices} */
	outgoingPositiveFaceCenterIndices;
	/** Executable incoming-radiance packing. @readonly @type {LocalSunFieldPacking} */
	radiancePacking;
	/** Executable outgoing scattering-density packing. @readonly @type {LocalSunFieldPacking} */
	scatteringDensityPacking;

	/**
	 * Creates one source-owned construction-domain selection.
	 *
	 * @param {LocalSunConstructionDomainSelectionDefinition} definition - The executable owners and identities.
	 */
	constructor(definition) {
		this.kind = 'local-sun-construction-domain-selection';
		this.id = definition.id;
		this.positionDomain = definition.positionDomainOwner;
		this.positionNodes = definition.positionDomainOwner.nodes;
		this.zNodes = definition.positionDomainOwner.zNodes;
		this.rhoNodes = definition.positionDomainOwner.rhoNodes;
		this.zCount = definition.positionDomainOwner.zCount;
		this.rhoCount = definition.positionDomainOwner.rhoCount;
		this.positionCount = definition.positionDomainOwner.count;
		this.spectralBasis = definition.spectralBasis;
		this.spectralChannelCount = definition.spectralBasis.channelCount;
		this.incomingDirectionDomain = definition.incomingDirectionDomainOwner;
		this.incomingUnitVectors = definition.incomingDirectionDomainOwner.unitVectors;
		this.incomingIntegrationWeights = definition.incomingDirectionDomainOwner.integrationWeights;
		this.incomingDirectionCount = definition.incomingDirectionDomainOwner.directionCount;
		this.outgoingDirectionDomain = definition.outgoingDirectionDomainOwner;
		this.outgoingUnitVectors = definition.outgoingDirectionDomainOwner.unitVectors;
		this.outgoingDirectionCount = definition.outgoingDirectionDomainOwner.directionCount;
		this.outgoingPositiveFaceCenterIndices = definition.outgoingDirectionDomainOwner.positiveFaceCenterIndices;
		this.radiancePacking = new LocalSunFieldPacking({
			id: definition.radiancePackingId,
			directionCount: this.incomingDirectionCount,
			positionCount: this.positionCount,
			wavelengthCount: this.spectralChannelCount,
		});
		this.scatteringDensityPacking = new LocalSunFieldPacking({
			id: definition.scatteringDensityPackingId,
			directionCount: this.outgoingDirectionCount,
			positionCount: this.positionCount,
			wavelengthCount: this.spectralChannelCount,
		});
		this._outgoingDirectionDomainOwner = definition.outgoingDirectionDomainOwner;
	}

	/**
	 * Call this method to resolve one source-local outgoing direction through
	 * the selected W domain.
	 *
	 * @param {UnitVector3} direction - The source-local direction.
	 * @returns {ScatteringCacheDirectionStencil} - The four-tap W stencil.
	 */
	resolveOutgoingDirectionStencil(direction) {
		return this._outgoingDirectionDomainOwner.resolveStencil(direction);
	}

	/**
	 * Call this method to derive the selected production domain from active flat
	 * geometry and optional convergence overrides. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {LocalSunConstructionDomainGeometry} geometry - The z-by-rho geometry owner.
	 * @param {LocalSunConstructionDomainGeometryOptions} [options] - The convergence overrides.
	 * @returns {LocalSunConstructionDomainSelection} - The coherent selection.
	 */
	static fromGeometry(geometry, options = {}) {
		const positionDomainOwner = geometry.createLocalSunCachePositionDomain({
			...(options.zCount === undefined ? {} : {zCount: options.zCount}),
			...(options.rhoCount === undefined ? {} : {rhoCount: options.rhoCount}),
		});
		const isDefaultGrid =
			positionDomainOwner.zCount === LOCAL_SUN_DEFAULT_Z_NODE_COUNT &&
			positionDomainOwner.rhoCount === LOCAL_SUN_DEFAULT_RHO_NODE_COUNT;
		const gridIdentity = `z${positionDomainOwner.zCount}` + `-rho${positionDomainOwner.rhoCount}`;

		return new LocalSunConstructionDomainSelection({
			id:
				options.id ??
				(isDefaultGrid
					? LOCAL_SUN_CONSTRUCTION_DOMAIN_ID
					: `algorithm32-local-sun-${gridIdentity}-reflection-completed-fibonacci68-w27-v1`),
			positionDomainOwner,
			incomingDirectionDomainOwner:
				options.incomingDirectionDomainOwner ?? REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
			outgoingDirectionDomainOwner:
				options.outgoingDirectionDomainOwner ?? CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			spectralBasis: options.spectralBasis ?? NATIVE_15_SPECTRAL_BASIS,
			radiancePackingId:
				options.radiancePackingId ??
				(isDefaultGrid
					? LOCAL_SUN_RADIANCE_PACKING_ID
					: `algorithm32-local-sun-${gridIdentity}-reflection-completed-fibonacci68-radiance-packing-v1`),
			scatteringDensityPackingId:
				options.scatteringDensityPackingId ??
				(isDefaultGrid
					? LOCAL_SUN_SCATTERING_DENSITY_PACKING_ID
					: `algorithm32-local-sun-${gridIdentity}-w27-scattering-density-packing-v1`),
		});
	}

	/**
	 * Construct the finite-source adapter directly from one accepted aggregate profile.
	 *
	 * @param {Algorithm32ExecutionProfile} profile - Complete accepted execution profile.
	 * @returns {LocalSunConstructionDomainSelection} - Profile-sized executable selection.
	 */
	static fromProfile(profile) {
		if (profile?.kind !== 'algorithm32-execution-profile')
			throw new TypeError(
				'Sampled rectangular execution profile required; use fromCompactProfile for compact construction.',
			);
		let positions = /** @type {LocalSunPositionDomainOwner} */ (profile.domains.positions);
		if (
			!Array.isArray(positions.zNodes) ||
			!Array.isArray(positions.rhoNodes) ||
			positions.zNodes.length !== positions.zCount ||
			positions.rhoNodes.length !== positions.rhoCount ||
			positions.zCount * positions.rhoCount !== positions.count
		)
			throw new RangeError(
				'Rectangular local position axes required; compact positions cannot enter this builder.',
			);
		const identityPrefix = `${profile.id}-local-sun`;

		return new LocalSunConstructionDomainSelection({
			id: `${identityPrefix}-construction-domains-v1`,
			positionDomainOwner: /** @type {LocalSunPositionDomainOwner} */ (profile.domains.positions),
			incomingDirectionDomainOwner: /** @type {LocalSunIncomingDirectionDomain} */ (
				profile.domains.incomingDirections
			),
			outgoingDirectionDomainOwner: /** @type {CubedSphereDirectionDomain} */ (
				profile.domains.outgoingDirections
			),
			spectralBasis: profile.spectral.basis,
			radiancePackingId: `${identityPrefix}-radiance-packing-v1`,
			scatteringDensityPackingId: `${identityPrefix}-scattering-density-packing-v1`,
		});
	}

	/** Call this method to select the genuine compact profile's ragged domains without rectangular adaptation or field allocation.
	 *
	 * @param {unknown} profile - Complete explicit compact cache-construction profile.
	 * @returns {LocalSunCompactConstructionDomains} - Accepted actual domains and logical packings.
	 * @throws {TypeError} - The profile is not a genuine compact capability.
	 * @throws {RangeError} - Retained physical facts changed after construction.
	 */
	static fromCompactProfile(profile) {
		return LocalSunCompactConstructionProfile.assert(profile).domains;
	}
}
