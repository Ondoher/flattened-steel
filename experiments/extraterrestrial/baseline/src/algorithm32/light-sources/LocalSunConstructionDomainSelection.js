import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER,
} from '../domains/consts.js';
import { NATIVE_15_SPECTRAL_BASIS } from
	'../profiles/native-15-profile.js';
import {
	LOCAL_SUN_CONSTRUCTION_DOMAIN_ID,
	LOCAL_SUN_DEFAULT_RHO_NODE_COUNT,
	LOCAL_SUN_DEFAULT_Z_NODE_COUNT,
	LOCAL_SUN_RADIANCE_PACKING_ID,
	LOCAL_SUN_SCATTERING_DENSITY_PACKING_ID,
} from './local-sun-consts.js';
import LocalSunFieldPacking from './LocalSunFieldPacking.js';

/**
 * Own one coherent executable z-by-rho, paired-Fibonacci-34, and cubed-sphere
 * selection for local-Sun CPU and GPU fields.
 */
export default class LocalSunConstructionDomainSelection {
	/** @type {CubedSphereDirectionDomain} */
	_outgoingDirectionDomainOwner;

	/** @readonly @type {"local-sun-construction-domain-selection"} */
	kind;
	/** @readonly @type {string} */
	id;
	/** @readonly @type {PositionDomainDescriptor} */
	positionDomain;
	/** @readonly @type {readonly PositionDomainNode[]} */
	positionNodes;
	/** @readonly @type {readonly Distance[]} */
	zNodes;
	/** @readonly @type {readonly Distance[]} */
	rhoNodes;
	/** @readonly @type {number} */
	zCount;
	/** @readonly @type {number} */
	rhoCount;
	/** @readonly @type {number} */
	positionCount;
	/** @readonly @type {SpectralBasis} */
	spectralBasis;
	/** @readonly @type {number} */
	spectralChannelCount;
	/** @readonly @type {DirectionDomainDescriptor} */
	incomingDirectionDomain;
	/** @readonly @type {readonly UnitVector3[]} */
	incomingUnitVectors;
	/** @readonly @type {SolidAngleWeights} */
	incomingIntegrationWeights;
	/** @readonly @type {number} */
	incomingDirectionCount;
	/** @readonly @type {DirectionDomainDescriptor} */
	outgoingDirectionDomain;
	/** @readonly @type {readonly UnitVector3[]} */
	outgoingUnitVectors;
	/** @readonly @type {number} */
	outgoingDirectionCount;
	/** @readonly @type {CubedSpherePositiveFaceCenterIndices} */
	outgoingPositiveFaceCenterIndices;
	/** @readonly @type {LocalSunFieldPacking} */
	radiancePacking;
	/** @readonly @type {LocalSunFieldPacking} */
	scatteringDensityPacking;

	/**
	 * Create one source-owned construction-domain selection.
	 *
	 * @param {LocalSunConstructionDomainSelectionDefinition} definition - Supplies executable owners.
	 */
	constructor(definition) {
		this.kind = 'local-sun-construction-domain-selection';
		this.id = definition.id;
		this.positionDomain = definition.positionDomainOwner.descriptor;
		this.positionNodes = definition.positionDomainOwner.nodes;
		this.zNodes = definition.positionDomainOwner.zNodes;
		this.rhoNodes = definition.positionDomainOwner.rhoNodes;
		this.zCount = definition.positionDomainOwner.zCount;
		this.rhoCount = definition.positionDomainOwner.rhoCount;
		this.positionCount = definition.positionDomainOwner.count;
		this.spectralBasis = definition.spectralBasis;
		this.spectralChannelCount =
			definition.spectralBasis.channelCount;
		this.incomingDirectionDomain =
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.descriptor;
		this.incomingUnitVectors =
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors;
		this.incomingIntegrationWeights =
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.integrationWeights;
		this.incomingDirectionCount =
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.directionCount;
		this.outgoingDirectionDomain =
			definition.outgoingDirectionDomainOwner.descriptor;
		this.outgoingUnitVectors =
			definition.outgoingDirectionDomainOwner.unitVectors;
		this.outgoingDirectionCount =
			definition.outgoingDirectionDomainOwner.directionCount;
		this.outgoingPositiveFaceCenterIndices =
			definition.outgoingDirectionDomainOwner
				.positiveFaceCenterIndices;
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
		this._outgoingDirectionDomainOwner =
			definition.outgoingDirectionDomainOwner;
	}

	/**
	 * Resolve one source-local outgoing direction through the selected W domain.
	 *
	 * @param {UnitVector3} direction - Supplies a source-local direction.
	 * @returns {ScatteringCacheDirectionStencil} The four-tap W stencil.
	 */
	resolveOutgoingDirectionStencil(direction) {
		return this._outgoingDirectionDomainOwner.resolveStencil(direction);
	}

	/**
	 * Derive the selected production domain from active flat geometry.
	 *
	 * @param {LocalSunConstructionDomainGeometry} geometry - Supplies z-by-rho nodes.
	 * @param {LocalSunConstructionDomainGeometryOptions} [options] - Supplies convergence overrides.
	 * @returns {LocalSunConstructionDomainSelection} The coherent selection.
	 */
	static fromGeometry(geometry, options = {}) {
		const positionDomainOwner = geometry.createLocalSunCachePositionDomain({
			...(options.zCount === undefined
				? {}
				: { zCount: options.zCount }),
			...(options.rhoCount === undefined
				? {}
				: { rhoCount: options.rhoCount }),
		});
		const isDefaultGrid =
			positionDomainOwner.zCount
				=== LOCAL_SUN_DEFAULT_Z_NODE_COUNT
			&& positionDomainOwner.rhoCount
				=== LOCAL_SUN_DEFAULT_RHO_NODE_COUNT;
		const gridIdentity =
			`z${positionDomainOwner.zCount}`
			+ `-rho${positionDomainOwner.rhoCount}`;

		return new LocalSunConstructionDomainSelection({
			id: options.id ?? (
				isDefaultGrid
					? LOCAL_SUN_CONSTRUCTION_DOMAIN_ID
					: `algorithm32-local-sun-${gridIdentity}-paired-fibonacci34-w27-v1`
			),
			positionDomainOwner,
			outgoingDirectionDomainOwner:
				options.outgoingDirectionDomainOwner
				?? CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			spectralBasis: options.spectralBasis
				?? NATIVE_15_SPECTRAL_BASIS,
			radiancePackingId: options.radiancePackingId
				?? (isDefaultGrid
					? LOCAL_SUN_RADIANCE_PACKING_ID
					: `algorithm32-local-sun-${gridIdentity}-paired-fibonacci34-radiance-packing-v1`),
			scatteringDensityPackingId:
				options.scatteringDensityPackingId
				?? (isDefaultGrid
					? LOCAL_SUN_SCATTERING_DENSITY_PACKING_ID
					: `algorithm32-local-sun-${gridIdentity}-w27-scattering-density-packing-v1`),
		});
	}

}
