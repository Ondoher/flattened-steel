import { DistantSunFieldPacking } from './DistantSunFieldPacking.js';

/**
 * Own one coherent executable construction-domain selection for distant-Sun
 * CPU and GPU fields.
 * Declarative descriptors remain metadata; construction loops consume the
 * separately exposed owner facts.
 */
export default class DistantSunConstructionDomainSelection {
	/** @type {CubedSphereDirectionDomain} */
	_outgoingDirectionDomainOwner;

	/** @readonly @type {"distant-sun-construction-domain-selection"} */
	kind;
	/** @readonly @type {string} */
	id;
	/** @readonly @type {PositionDomainDescriptor} */
	positionDomain;
	/** @readonly @type {readonly PositionDomainNode[]} */
	positionNodes;
	/** @readonly @type {number} */
	positionCount;
	/** @readonly @type {Distance} */
	bottomRadius;
	/** @readonly @type {Distance} */
	topRadius;
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
	/** @readonly @type {SpectralBasis} */
	spectralBasis;
	/** @readonly @type {number} */
	spectralChannelCount;
	/** @readonly @type {DistantSunFieldPacking} */
	radiancePacking;
	/** @readonly @type {DistantSunFieldPacking} */
	scatteringDensityPacking;

	/**
	 * Create one coherent construction-domain selection and its executable
	 * packings.
	 *
	 * @param {DistantSunConstructionDomainSelectionDefinition} definition - Supplies
	 * position, incoming, outgoing, spectral, and packing owners.
	 */
	constructor(definition) {
		this.kind = 'distant-sun-construction-domain-selection';
		this.id = definition.id;
		this.positionDomain = definition.positionDomainOwner.descriptor;
		this.positionNodes = definition.positionDomainOwner.nodes;
		this.positionCount = definition.positionDomainOwner.count;
		this.bottomRadius = definition.positionDomainOwner.bottomRadius;
		this.topRadius = definition.positionDomainOwner.topRadius;
		this.incomingDirectionDomain = definition.incomingDirectionDomain;
		this.incomingUnitVectors = definition.incomingUnitVectors;
		this.incomingIntegrationWeights =
			definition.incomingIntegrationWeights;
		this.incomingDirectionCount =
			definition.incomingUnitVectors.length;
		this.outgoingDirectionDomain =
			definition.outgoingDirectionDomainOwner.descriptor;
		this.outgoingUnitVectors =
			definition.outgoingDirectionDomainOwner.unitVectors;
		this.outgoingDirectionCount =
			definition.outgoingDirectionDomainOwner.directionCount;
		this.outgoingPositiveFaceCenterIndices =
			definition.outgoingDirectionDomainOwner
				.positiveFaceCenterIndices;
		this.spectralBasis = definition.spectralBasis;
		this.spectralChannelCount =
			definition.spectralBasis.channelCount;
		this.radiancePacking =
			new DistantSunFieldPacking({
				id: definition.radiancePackingId,
				directionCount: this.incomingDirectionCount,
				positionCount: this.positionCount,
				wavelengthCount: this.spectralChannelCount,
			});
		this.scatteringDensityPacking =
			new DistantSunFieldPacking({
				id: definition.scatteringDensityPackingId,
				directionCount: this.outgoingDirectionCount,
				positionCount: this.positionCount,
				wavelengthCount: this.spectralChannelCount,
			});
		this._outgoingDirectionDomainOwner =
			definition.outgoingDirectionDomainOwner;
	}

	/**
	 * Resolve one source-local outgoing reconstruction stencil.
	 *
	 * @param {UnitVector3} direction - Supplies a source-local unit direction.
	 * @returns {ScatteringCacheDirectionStencil} The selected outgoing taps.
	 */
	resolveOutgoingDirectionStencil(direction) {
		return this._outgoingDirectionDomainOwner.resolveStencil(direction);
	}

}
