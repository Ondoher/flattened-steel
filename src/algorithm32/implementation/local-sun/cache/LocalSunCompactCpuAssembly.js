import DistanceMath from '../../../math/DistanceMath.js';
import {
	SpectralPacket as SpectralPacketClass,
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../../../spectral-values/index.js';
import {CanonicalExponentialCacheColumn} from '../../canonical-atmosphere/cache/CanonicalExponentialCacheColumn.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../sampling-domains/direction/cubed-sphere/consts.js';
import FlatHorizonPartitionedDirectionDomain from '../../../sampling-domains/direction/horizon-partitioned/FlatHorizonPartitionedDirectionDomain.js';
import {CpuDirectionalSpectralField} from '../../../light-source-support/cache/CpuDirectionalSpectralField.js';
import {createPhysicalLaterOrderScatteringKernel} from '../../../atmospheric-transport/later-order-scattering-density.js';
import LocalSunFieldPacking from './LocalSunFieldPacking.js';
import LocalSunConstructionLightSource from './LocalSunConstructionLightSource.js';
import {LocalSunShellFactCache} from './LocalSunShellFactCache.js';
import {LocalSunCompactTransport} from './LocalSunCompactTransport.js';
import {LocalSunCompactConstructionProfile} from './LocalSunCompactConstructionProfile.js';
import {SpectralCalculator} from '../../../atmospheric-transport/spectral/SpectralCalculator.js';
import {ScatteringOrderFieldOperations} from '../../../atmospheric-transport/ScatteringOrderFieldOperations.js';

/** Source-owned selected compact CPU reference with physical-order inputs; full-domain construction and runtime activation remain separate. */
export class LocalSunCompactCpuAssembly {
	/** Fixed physical collaborators and shared calculator. @type {LocalSunCompactCpuAssemblyDefinition} */
	_definition;
	/** Actual ragged topology and qualified direction/packing owners. @type {LocalSunCompactCpuDomains} */
	_domains;
	/** Qualified physical-J transport policy. @type {LocalSunCompactTransport} */
	_transport;
	/** Atmosphere-owned analytic source/cache columns. @type {CanonicalExponentialCacheColumn} */
	_column;
	/** Explicit-bounds shell-held source adapter. @type {LocalSunConstructionLightSource} */
	_heldSource;
	/** Lazily retained physical primary spectra; no full-field allocation. @type {Map<number, SpectralPacket>} */
	_primary = new Map();
	/** Requested cumulative order, inherited from a genuine compact profile. @type {SupportedCacheScatteringOrder} */
	_maximumScatteringOrder = 4;

	/** Creates an explicit compact construction composition without changing defaults or physical models.
	 *
	 * @param {LocalSunCompactCpuAssemblyDefinition} definition - Paired physical models, topology and shared phase calculator.
	 * @throws {TypeError} - Physical units, source or spectral collaborator contracts differ.
	 * @throws {RangeError} - Pairing or finite-source/slab support is invalid.
	 */
	constructor(definition) {
		this._definition = definition;
		let {geometry, topology, atmosphere, lightSource} = definition,
			configuration = lightSource.configuration;
		DistanceMath.assertDistance(configuration.radius, 'Compact source radius');
		DistanceMath.assertPosition(configuration.position, 'Compact source placement');
		let source = geometry.resolveSourceRelativePosition({position: configuration.position});
		DistanceMath.assertDistance(source.distanceFromSource, 'Compact source pairing distance');
		if (
			DistanceMath.toMeters(source.distanceFromSource) !== 0 ||
			DistanceMath.toMeters(topology.sourceHeight) - DistanceMath.toMeters(configuration.radius) <=
				DistanceMath.toMeters(topology.atmosphereTop)
		)
			throw new RangeError('Paired finite source entirely above the slab required.');
		this._column = new CanonicalExponentialCacheColumn(atmosphere);
		this._transport = new LocalSunCompactTransport(definition);
		let incoming = new FlatHorizonPartitionedDirectionDomain(),
			outgoing = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER;
		this._domains = {
			topology,
			spectralBasis: atmosphere.spectralBasis,
			incomingDirections: incoming,
			outgoingDirections: outgoing,
			radiancePacking: new LocalSunFieldPacking({
				id: topology.id + ':polar40az48-L',
				directionCount: incoming.directionCount,
				positionCount: topology.positionCount,
				wavelengthCount: atmosphere.spectralBasis.channelCount,
			}),
			scatteringPacking: new LocalSunFieldPacking({
				id: topology.id + ':W27-J',
				directionCount: outgoing.directionCount,
				positionCount: topology.positionCount,
				wavelengthCount: atmosphere.spectralBasis.channelCount,
			}),
		};
		let shellFacts = new LocalSunShellFactCache({
			sourceConfiguration: configuration,
			sourceDistanceBounds: topology.sourceDistanceBounds,
		});
		this._heldSource = new LocalSunConstructionLightSource({source: lightSource, shellFactCache: shellFacts});
	}

	/** Actual compact logical domains and packings; their construction allocates no full spectral field.
	 *
	 * @returns {LocalSunCompactCpuDomains} - Qualified executable owners and real position count.
	 */
	get domains() {
		return this._domains;
	}

	/** Observed lazy primary storage, excluding object overhead and other collaborators.
	 *
	 * @returns {LocalSunCompactPrimaryMemoUsage} - Memoized spectrum count and binary64 spectral payload.
	 */
	get primaryMemoUsage() {
		return {
			spectra: this._primary.size,
			spectralPayload: {value: this._primary.size * 15 * Float64Array.BYTES_PER_ELEMENT, units: 'bytes'},
		};
	}

	/** Call this method to sample physical shell-held primary J1 at one allocated compact/W27 node.
	 * Geometry owns physical positions, directions and finite source-path bounds; atmosphere/source models supply existing physics.
	 *
	 * @param {LocalSunCompactPrimarySampleRequest} request - Allocated compact and W27 addresses.
	 * @returns {SpectralPacket} - Pure J1 in physical scattering-density units and Native15 semantics.
	 * @throws {RangeError} - Address, support or sampled physical values are invalid.
	 * @throws {TypeError} - Medium/source packet contracts differ.
	 */
	samplePrimaryScatteringDensity(request) {
		let offset = this._domains.scatteringPacking.offset({...request, wavelengthIndex: 0}),
			cached = this._primary.get(offset);
		if (cached) return cached;
		let {geometry, atmosphere, topology} = this._definition;
		let position = geometry.resolveCompactLocalSunCacheNodePosition({
			topology,
			positionIndex: request.positionIndex,
		});
		let coordinate = geometry.resolveAtmosphereCoordinate(position),
			medium = atmosphere.sampleMedium(coordinate);
		let lighting = this._heldSource.sampleDirectLighting({
			sourceRelativePosition: geometry.resolveSourceRelativePosition({
				position,
				atmosphereCoordinate: coordinate,
			}),
			spectralBasis: this._domains.spectralBasis,
		});
		let incident = SpectralPacketClass.assert(lighting.sourceIrradiance, {
			basis: this._domains.spectralBasis,
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		});
		let sourceRay = geometry.resolveCompactLocalSunCacheRay({
			topology,
			position,
			physicalDirection: lighting.directionToLight,
		});
		if (sourceRay.boundary !== 'top-atmosphere')
			throw new RangeError('Finite source path must leave the slab through its top.');
		let start = DistanceMath.toMetersPosition(sourceRay.origin),
			end = DistanceMath.toMetersPosition(sourceRay.positionAt(sourceRay.length));
		let outgoing = geometry.expressPhysicalScatteringCacheDirection({
			position,
			cacheDirection: this._domains.outgoingDirections.unitVectors[request.directionIndex],
		});
		let phase = atmosphere.samplePhase({viewDirection: outgoing, incomingDirection: lighting.directionToLight});
		let coefficient = this._definition.calculator.computeDirectScattering(
			medium.rayleighScattering,
			medium.mieScattering,
			phase.rayleighPhase,
			phase.miePhase,
		);
		let values = incident.values.map(
			(value, c) =>
				value *
				Math.exp(
					-this._column.opticalDepth({
						startAltitude: DistanceMath.inMeters(start[2]),
						endAltitude: DistanceMath.inMeters(end[2]),
						length: sourceRay.length,
						wavelengthIndex: c,
					}),
				) *
				coefficient.values[c],
		);
		let packet = new SpectralPacketClass({
			basis: this._domains.spectralBasis,
			quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
			units: SPECTRAL_UNITS.SCATTERING_DENSITY,
			values,
			provenanceIdentity:
				'compact-primary-j1:' +
				topology.provenanceIdentity +
				':' +
				incident.provenanceIdentity +
				':' +
				request.positionIndex +
				':' +
				request.directionIndex,
		});
		this._primary.set(offset, packet);
		return packet;
	}

	/** Call this method to transport lazy physical primary J1 on one selected physical ray.
	 * This stored-primary diagnostic is separate from continuous direct L1; it does not construct an incoming-radiance field.
	 *
	 * @param {LocalSunCompactTransportRayRequest} request - Supported physical origin/direction and optional truncation.
	 * @returns {LocalSunCompactTransportResult} - Qualified selected physical primary-J transport.
	 * @throws {RangeError} - Geometry, spectrum or optical-column support fails.
	 */
	transportPrimaryRay(request) {
		return this._transport.integrate({
			...request,
			reader: {
				/** Called by compact transport to read a finite physical J1 scalar through the actual logical packing.
				 *
				 * @param {DirectionalSpectralFieldCoordinates} address - Allocated compact/W27/Native15 coordinates.
				 * @returns {number} - Physical scattering-density scalar for the declared field interpretation.
				 * @throws {RangeError} - Address or primary physical support is invalid.
				 */
				readScalar: (address) => {
					this._domains.scatteringPacking.offset(address);
					return this.samplePrimaryScatteringDensity(address).values[address.wavelengthIndex];
				},
			},
			provenanceIdentity: 'compact-primary-j1:' + this._definition.topology.provenanceIdentity,
		});
	}

	/** Call this method to build continuous direct L1 without reading shell-held J1 or its memo.
	 * The existing physical source, atmosphere and phase equations remain authoritative.

	 *
	 * @param {LocalSunCompactTransportRayRequest} request - Supported physical ray.
	 * @returns {LocalSunCompactTransportResult} - Positive Column48/Tail64 direct radiance.
	 * @throws {TypeError} - Physical packet or source contracts differ.
	 * @throws {RangeError} - Source path or compact ray is unsupported.
	 */
	transportDirectRay(request) {
		let {geometry, atmosphere, lightSource, topology, calculator} = this._definition;
		return this._transport.integrateContinuousDensity({
			...request,
			provenanceIdentity: 'compact-continuous-direct:' + topology.provenanceIdentity,
			/** Evaluate the unchanged physical direct scattering density at one physical sample.
			 *
			 * @param {LocalSunCompactContinuousDensityRequest} sample - Physical position and outgoing direction.
			 * @returns {SpectralPacket} - Continuous direct density, independent of stored J1.
			 */
			sampleDensity: ({position, physicalDirection}) => {
				let coordinate = geometry.resolveAtmosphereCoordinate(position),
					medium = atmosphere.sampleMedium(coordinate);
				let lighting = lightSource.sampleDirectLighting({
					sourceRelativePosition: geometry.resolveSourceRelativePosition({
						position,
						atmosphereCoordinate: coordinate,
					}),
					spectralBasis: this._domains.spectralBasis,
				});
				let sourceRay = geometry.resolveCompactLocalSunCacheRay({
					topology,
					position,
					physicalDirection: lighting.directionToLight,
				});
				if (sourceRay.boundary !== 'top-atmosphere')
					throw new RangeError('The source path must leave through the atmosphere top.');
				let start = DistanceMath.toMetersPosition(sourceRay.origin),
					end = DistanceMath.toMetersPosition(sourceRay.positionAt(sourceRay.length));
				let phase = atmosphere.samplePhase({
					viewDirection: physicalDirection,
					incomingDirection: lighting.directionToLight,
				});
				let coefficient = calculator.computeDirectScattering(
					medium.rayleighScattering,
					medium.mieScattering,
					phase.rayleighPhase,
					phase.miePhase,
				);
				let incident = SpectralPacketClass.assert(lighting.sourceIrradiance, {
					basis: this._domains.spectralBasis,
					quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
					units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
				});
				return new SpectralPacketClass({
					basis: this._domains.spectralBasis,
					quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
					units: SPECTRAL_UNITS.SCATTERING_DENSITY,
					values: incident.values.map(
						(v, c) =>
							v *
							coefficient.values[c] *
							Math.exp(
								-this._column.opticalDepth({
									startAltitude: DistanceMath.inMeters(start[2]),
									endAltitude: DistanceMath.inMeters(end[2]),
									length: sourceRay.length,
									wavelengthIndex: c,
								}),
							),
					),
					provenanceIdentity: 'continuous-direct:' + incident.provenanceIdentity,
				});
			},
		});
	}

	/** Call this method to transport an identified physical pure or cumulative J field.
	 *
	 * @param {LocalSunCompactTransportRequest} request - Geometry-owned ray and full logical physical field reader.
	 * @returns {LocalSunCompactTransportResult} - Positive selected-order transport.
	 * @throws {TypeError} - Packet or field contracts differ.
	 * @throws {RangeError} - Sampling support is invalid.
	 */
	transportScatteringRay(request) {
		return this._transport.integrate(request);
	}

	/** Called by subset construction to validate unique allocated addresses before small field allocation.
	 *
	 * @param {readonly number[]} indices - Explicit logical selection.
	 * @param {number} count - Full domain extent.
	 * @returns {readonly number[]} - Copied unique bounded selection.
	 * @throws {RangeError} - Selection is empty, repeated, unallocated or exceeds the eight-entry pilot limit.
	 */
	_selection(indices, count) {
		if (
			indices.length === 0 ||
			indices.length > 8 ||
			new Set(indices).size !== indices.length ||
			indices.some((i) => !Number.isSafeInteger(i) || i < 0 || i >= count)
		)
			throw new RangeError('Explicit unique allocated selection of at most eight entries required.');
		return [...indices];
	}

	/** Call this method to build a real selected-position/outgoing pure J2, J3 or J4 field from all qualified incoming radiance samples.
	 * Caller-supplied preceding L remains a separate typed input; this operation does not infer how that physical field was constructed.
	 *
	 * @param {LocalSunCompactScatteringStepRequest} request - Explicit subset and physical incoming-radiance provider.
	 * @returns {LocalSunCompactSelectedScatteringResult} - Sealed subset field, address maps and exact spectral buffer allocation.
	 * @throws {TypeError} - Incoming packet basis, quantity or units differ.
	 * @throws {RangeError} - Selection or incoming values are invalid.
	 */
	buildScatteringStep(request) {
		let order = request.scatteringOrder ?? 2;
		if (![2, 3, 4].includes(order) || order > this._maximumScatteringOrder)
			throw new RangeError('A pure scattering order from two through four is required.');
		let positions = this._selection(request.positionIndices, this._definition.topology.positionCount),
			directions = this._selection(
				request.outgoingDirectionIndices,
				this._domains.outgoingDirections.directionCount,
			);
		let incomingCount = this._domains.incomingDirections.directionCount,
			basis = this._domains.spectralBasis;
		let incomingPacking = new LocalSunFieldPacking({
			id: 'compact-selected-L' + (order - 1) + ':' + positions.join(','),
			directionCount: incomingCount,
			positionCount: positions.length,
			wavelengthCount: basis.channelCount,
		});
		let outgoingPacking = new LocalSunFieldPacking({
			id: 'compact-selected-J' + order + ':' + positions.join(',') + ':' + directions.join(','),
			directionCount: directions.length,
			positionCount: positions.length,
			wavelengthCount: basis.channelCount,
		});
		let previous = new CpuDirectionalSpectralField({
			id: incomingPacking.id,
			provenanceIdentity: request.provenanceIdentity,
			order: {kind: 'pure', value: order - 1},
			packing: incomingPacking,
		});
		let output = new CpuDirectionalSpectralField({
			id: outgoingPacking.id,
			provenanceIdentity: request.provenanceIdentity + ':full-polar40az48-J' + order,
			order: {kind: 'pure', value: order},
			packing: outgoingPacking,
		});
		let writer = previous.createWriter();
		for (let [localPosition, positionIndex] of positions.entries()) {
			for (let directionIndex = 0; directionIndex < incomingCount; directionIndex++) {
				let packet = SpectralPacketClass.assert(
					request.sampleIncomingRadiance({positionIndex, directionIndex}),
					{basis, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY},
				);
				for (let wavelengthIndex = 0; wavelengthIndex < basis.channelCount; wavelengthIndex++)
					writer.writeScalar(
						{positionIndex: localPosition, directionIndex, wavelengthIndex},
						packet.values[wavelengthIndex],
					);
			}
		}
		previous.seal();
		let positionNodes = positions.map((positionIndex, index) => {
			let node = this._definition.topology.positionAt(positionIndex);
			return {
				index,
				coordinate: node.altitude,
				role: 'selected-compact-physical-node',
				metadata: {positionIndex},
			};
		});
		let {geometry, atmosphere, topology, calculator} = this._definition;
		let kernel = createPhysicalLaterOrderScatteringKernel({
			geometry,
			atmosphere,
			calculator,
			scatteringOrder: order,
			positionNodes,
			positionCount: positions.length,
			incomingUnitVectors: this._domains.incomingDirections.unitVectors,
			incomingDirectionCount: incomingCount,
			incomingIntegrationWeights: this._domains.incomingDirections.integrationWeights,
			outgoingUnitVectors: directions.map((i) => this._domains.outgoingDirections.unitVectors[i]),
			outgoingDirectionCount: directions.length,
			spectralBasis: basis,
			spectralChannelCount: basis.channelCount,
			resolvePhysicalPosition: ({positionIndex}) =>
				geometry.resolveCompactLocalSunCacheNodePosition({topology, positionIndex: positions[positionIndex]}),
			resolvePhysicalIncomingDirection: ({position, cacheDirection}) =>
				geometry.expressPhysicalScatteringCacheDirection({position, cacheDirection}),
			resolvePhysicalOutgoingDirection: ({position, cacheDirection}) =>
				geometry.expressPhysicalScatteringCacheDirection({position, cacheDirection}),
		});
		kernel.buildPureScatteringOrder({
			previousRadiance: previous.createReader(),
			outputScattering: output.createWriter(),
		});
		output.seal();
		return {
			positionIndices: positions,
			outgoingDirectionIndices: directions,
			field: output,
			allocatedSpectralBytes: {
				value: (incomingPacking.scalarCount + outgoingPacking.scalarCount) * Float64Array.BYTES_PER_ELEMENT,
				units: 'bytes',
			},
		};
	}

	/** Call this method to construct selected pure J1 through the requested order and their cumulative field.
	 * Complete physical incoming fields remain explicit independent caller inputs; no full-domain CPU build is implied.

	 *
	 * @param {LocalSunCompactSelectedOrdersRequest} request - Selected addresses and identified preceding physical radiance inputs.
	 * @returns {LocalSunCompactSelectedOrdersResult} - Genuine sealed pure and cumulative subset fields.
	 * @throws {TypeError} - Physical radiance interpretation differs.
	 * @throws {RangeError} - Selections or order inputs are unsupported.
	 */
	buildSelectedOrders(request) {
		let positions = this._selection(request.positionIndices, this._domains.topology.positionCount);
		let directions = this._selection(
			request.outgoingDirectionIndices,
			this._domains.outgoingDirections.directionCount,
		);
		let packing = new LocalSunFieldPacking({
			id: 'compact-selected-orders:' + positions.join(',') + ':' + directions.join(','),
			positionCount: positions.length,
			directionCount: directions.length,
			wavelengthCount: this._domains.spectralBasis.channelCount,
		});
		let primary = new CpuDirectionalSpectralField({
			id: packing.id + ':J1',
			provenanceIdentity: request.provenanceIdentity,
			order: {kind: 'pure', value: 1},
			packing,
		});
		let writer = primary.createWriter();
		for (let [p, positionIndex] of positions.entries())
			for (let [d, directionIndex] of directions.entries()) {
				let packet = this.samplePrimaryScatteringDensity({positionIndex, directionIndex});
				for (let c = 0; c < packet.values.length; c++)
					writer.writeScalar({positionIndex: p, directionIndex: d, wavelengthIndex: c}, packet.values[c]);
			}
		primary.seal();
		let pureFields = [primary];
		for (let order = 2; order <= this._maximumScatteringOrder; order++) {
			let result = this.buildScatteringStep({
				positionIndices: positions,
				outgoingDirectionIndices: directions,
				scatteringOrder: /** @type {2 | 3 | 4} */ (order),
				provenanceIdentity: request.provenanceIdentity + ':L' + (order - 1),
				sampleIncomingRadiance: (address) =>
					request.sampleIncomingRadiance({...address, radianceOrder: /** @type {1 | 2 | 3} */ (order - 1)}),
			});
			pureFields.push(/** @type {CpuDirectionalSpectralField} */ (result.field));
		}
		let cumulative = new CpuDirectionalSpectralField({
			id: packing.id + ':cumulative',
			provenanceIdentity: request.provenanceIdentity,
			order: {
				kind: 'cumulative-through',
				value: this._maximumScatteringOrder,
				included: pureFields.map((field) => field.order.value),
			},
			packing,
		});
		ScatteringOrderFieldOperations.accumulatePureScatteringFields({
			pureFields,
			cumulativeField: cumulative,
			packing,
		});
		return {
			positionIndices: positions,
			outgoingDirectionIndices: directions,
			pureFields,
			cumulativeField: cumulative,
			maximumScatteringOrder: this._maximumScatteringOrder,
		};
	}

	/** Call this method to connect the complete compact construction profile to the qualified selected CPU assembly.
	 * The shared physical phase calculator remains an explicit collaborator; no full recurrence or ordinary runtime is started.
	 *
	 * @param {unknown} candidate - Genuine complete compact construction profile.
	 * @param {LaterOrderScatteringCalculator} [calculator] - Optional shared calculator; otherwise the genuine profile basis supplies shared packet arithmetic.
	 * @returns {LocalSunCompactCpuAssembly} - Lazy selected reference using the profile's actual domains and packings.
	 * @throws {TypeError} - Profile or physical collaborator contracts are incompatible.
	 * @throws {RangeError} - Retained facts, placement or spectral support changed.
	 */
	static fromCompactProfile(candidate, calculator = undefined) {
		let profile = LocalSunCompactConstructionProfile.assert(candidate);
		calculator ??= SpectralCalculator.forScatteringBasis(profile.spectral.basis);
		let {geometry, atmosphere, lightSource} = profile.models;
		let domains = profile.domains;
		let assembly = new LocalSunCompactCpuAssembly({
			geometry,
			atmosphere,
			lightSource,
			topology: domains.topology,
			calculator,
		});
		assembly._domains = {
			topology: domains.topology,
			spectralBasis: profile.spectral.basis,
			incomingDirections: domains.incomingDirections,
			outgoingDirections: domains.outgoingDirections,
			radiancePacking: domains.radiancePacking,
			scatteringPacking: domains.scatteringDensityPacking,
		};
		assembly._maximumScatteringOrder = profile.numerical.maximumScatteringOrder;
		return assembly;
	}
}
