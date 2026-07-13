import {DistantSunFieldPacking} from './DistantSunFieldPacking.js';

/** Object that owns one coherent executable construction-domain selection for distant-Sun CPU and GPU fields. */
export default class DistantSunConstructionDomainSelection {
	/**
	 * Outgoing direction domain owner value.
	 *
	 *  @type {CubedSphereDirectionDomain}
	 *
	 */
	_outgoingDirectionDomainOwner;

	/**
	 * Kind value.
	 *
	 *  @readonly @type {"distant-sun-construction-domain-selection"}
	 *
	 */
	kind;
	/**
	 * Id value.
	 *
	 *  @readonly @type {string}
	 *
	 */
	id;
	/**
	 * Position domain value.
	 *
	 *  @readonly @type {SphericalNativePositionDomain}
	 *
	 */
	positionDomain;
	/**
	 * Position nodes value.
	 *
	 *  @readonly @type {readonly PositionDomainNode[]}
	 *
	 */
	positionNodes;
	/**
	 * Position count value.
	 *
	 *  @readonly @type {number}
	 *
	 */
	positionCount;
	/**
	 * Bottom radius value.
	 *
	 *  @readonly @type {Distance}
	 *
	 */
	bottomRadius;
	/**
	 * Top radius value.
	 *
	 *  @readonly @type {Distance}
	 *
	 */
	topRadius;
	/**
	 * Incoming direction domain value.
	 *
	 *  @readonly @type {Fibonacci34DirectionDomain}
	 *
	 */
	incomingDirectionDomain;
	/**
	 * Incoming unit vectors value.
	 *
	 *  @readonly @type {readonly UnitVector3[]}
	 *
	 */
	incomingUnitVectors;
	/**
	 * Incoming integration weights value.
	 *
	 *  @readonly @type {SolidAngleWeights}
	 *
	 */
	incomingIntegrationWeights;
	/**
	 * Incoming direction count value.
	 *
	 *  @readonly @type {number}
	 *
	 */
	incomingDirectionCount;
	/**
	 * Outgoing direction domain value.
	 *
	 *  @readonly @type {CubedSphereDirectionDomain}
	 *
	 */
	outgoingDirectionDomain;
	/**
	 * Outgoing unit vectors value.
	 *
	 *  @readonly @type {readonly UnitVector3[]}
	 *
	 */
	outgoingUnitVectors;
	/**
	 * Outgoing direction count value.
	 *
	 *  @readonly @type {number}
	 *
	 */
	outgoingDirectionCount;
	/**
	 * Outgoing positive face center indices value.
	 *
	 *  @readonly @type {CubedSpherePositiveFaceCenterIndices}
	 *
	 */
	outgoingPositiveFaceCenterIndices;
	/**
	 * Spectral basis value.
	 *
	 *  @readonly @type {SpectralBasis}
	 *
	 */
	spectralBasis;
	/**
	 * Spectral channel count value.
	 *
	 *  @readonly @type {number}
	 *
	 */
	spectralChannelCount;
	/**
	 * Radiance packing value.
	 *
	 *  @readonly @type {DistantSunFieldPacking}
	 *
	 */
	radiancePacking;
	/**
	 * Scattering density packing value.
	 *
	 *  @readonly @type {DistantSunFieldPacking}
	 *
	 */
	scatteringDensityPacking;

	/**
	 * Creates one coherent construction-domain selection and its executable packings.
	 *
	 * @param {DistantSunConstructionDomainSelectionDefinition} definition - Supplies
	 * position, incoming, outgoing, spectral, and packing owners.
	 *
	 */
	constructor(definition) {
		this.kind = 'distant-sun-construction-domain-selection';
		this.id = definition.id;
		this.positionDomain = definition.positionDomainOwner;
		this.positionNodes = definition.positionDomainOwner.nodes;
		this.positionCount = definition.positionDomainOwner.count;
		this.bottomRadius = definition.positionDomainOwner.bottomRadius;
		this.topRadius = definition.positionDomainOwner.topRadius;
		this.incomingDirectionDomain = definition.incomingDirectionDomainOwner;
		this.incomingUnitVectors = definition.incomingDirectionDomainOwner.unitVectors;
		this.incomingIntegrationWeights = definition.incomingDirectionDomainOwner.integrationWeights;
		this.incomingDirectionCount = definition.incomingDirectionDomainOwner.directionCount;
		this.outgoingDirectionDomain = definition.outgoingDirectionDomainOwner;
		this.outgoingUnitVectors = definition.outgoingDirectionDomainOwner.unitVectors;
		this.outgoingDirectionCount = definition.outgoingDirectionDomainOwner.directionCount;
		this.outgoingPositiveFaceCenterIndices = definition.outgoingDirectionDomainOwner.positiveFaceCenterIndices;
		this.spectralBasis = definition.spectralBasis;
		this.spectralChannelCount = definition.spectralBasis.channelCount;
		this.radiancePacking = new DistantSunFieldPacking({
			id: definition.radiancePackingId,
			directionCount: this.incomingDirectionCount,
			positionCount: this.positionCount,
			wavelengthCount: this.spectralChannelCount,
		});
		this.scatteringDensityPacking = new DistantSunFieldPacking({
			id: definition.scatteringDensityPackingId,
			directionCount: this.outgoingDirectionCount,
			positionCount: this.positionCount,
			wavelengthCount: this.spectralChannelCount,
		});
		this._outgoingDirectionDomainOwner = definition.outgoingDirectionDomainOwner;
	}

	/**
	 * Call this method to resolve one source-local outgoing reconstruction stencil.
	 *
	 * @param {UnitVector3} direction - Supplies a source-local unit direction.
	 * @returns {ScatteringCacheDirectionStencil} - The selected outgoing taps.
	 */
	resolveOutgoingDirectionStencil(direction) {
		return this._outgoingDirectionDomainOwner.resolveStencil(direction);
	}

	/**
	 * Construct the distant-source adapter directly from one accepted aggregate profile.
	 *
	 * @param {Algorithm32ExecutionProfile} profile - Complete accepted execution profile.
	 * @returns {DistantSunConstructionDomainSelection} - Profile-sized executable selection.
	 */
	static fromProfile(profile) {
		const identityPrefix = `${profile.id}-distant-sun`;

		return new DistantSunConstructionDomainSelection({
			id: `${identityPrefix}-construction-domains-v1`,
			positionDomainOwner: /** @type {SphericalNativePositionDomain} */ (profile.domains.positions),
			incomingDirectionDomainOwner: profile.domains.incomingDirections,
			outgoingDirectionDomainOwner: /** @type {CubedSphereDirectionDomain} */ (
				profile.domains.outgoingDirections
			),
			spectralBasis: profile.spectral.basis,
			radiancePackingId: `${identityPrefix}-radiance-packing-v1`,
			scatteringDensityPackingId: `${identityPrefix}-scattering-density-packing-v1`,
		});
	}
}
