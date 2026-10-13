import DistanceMath from '../../../math/DistanceMath.js';
import {CanonicalValueHash} from '../../../value-identity/CanonicalValueHash.js';
import {SpectralBasis, SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../../spectral-values/index.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	DEFAULT_NATIVE_NUMERICAL_PROFILE,
} from '../../../profiles/native-15/native-15-profile.js';
import {CanonicalAtmosphere} from '../../canonical-atmosphere/CanonicalAtmosphere.js';
import {FlatEarthGeometry} from '../../flat-earth/FlatEarthGeometry.js';
import {LocalSunLightSource} from '../LocalSunLightSource.js';
import {CanonicalExponentialCacheColumn} from '../../canonical-atmosphere/cache/CanonicalExponentialCacheColumn.js';
import FlatHorizonPartitionedDirectionDomain from '../../../sampling-domains/direction/horizon-partitioned/FlatHorizonPartitionedDirectionDomain.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../sampling-domains/direction/cubed-sphere/consts.js';
import {LOCAL_SUN_COMPACT_TRANSPORT_POLICY} from './compact-transport-consts.js';
import LocalSunFieldPacking from './LocalSunFieldPacking.js';

/** Complete explicit compact cache-construction profile; ordinary runtime execution remains a separate integration gate. */
export class LocalSunCompactConstructionProfile {
	/** Discriminant rejected by ordinary sampled/rectangular profile consumers. @readonly @type {'local-sun-compact-construction-profile'} */
	kind = 'local-sun-compact-construction-profile';
	/** Named candidate policy. @readonly @type {string} */
	id = 'local-sun-compact-v9-native15-n4-v1';
	/** Construction contract revision. @readonly @type {number} */
	revision = 1;
	/** Accepted existing physical owners. @readonly @type {LocalSunCompactProfileModels} */
	models;
	/** Exact Native15 interpretation and source packet. @readonly @type {Algorithm32ExecutionSpectralProfile} */
	spectral;
	/** Complete tagged numerical choices, with no inapplicable sampled source count. @readonly @type {LocalSunCompactNumericalPolicies} */
	numerical;
	/** Real ragged positions, qualified directions and logical packings. @readonly @type {LocalSunCompactConstructionDomains} */
	domains;
	/** Complete normalized executable facts; descriptive only. @readonly @type {string} */
	contentHash;
	/** Input derivation, separate from executable compatibility. @readonly @type {string} */
	provenanceIdentity;

	/** Called by construction and consumer ingress to derive identity from actual accepted physical/numerical facts.
	 *
	 * @returns {string} - Canonical identity; caller labels never execute configuration.
	 */
	_currentIdentity() {
		let {geometry, atmosphere, lightSource} = this.models;
		let source = lightSource.configuration;
		return CanonicalValueHash.sha256Value({
			implementation: 'compact-construction-profile-v1',
			id: this.id,
			revision: this.revision,
			basis: this.spectral.basis.contentHash,
			selectedSourcePacket: this.spectral.sourceIrradianceDensity.values,
			groundBoundary: this.models.groundBoundary,
			source: {
				position: source.position,
				radius: source.radius,
				referenceDistance: source.referenceDistance,
				scale: source.referenceSpectralIncidentScale,
				falloff: source.distanceFalloff,
				irradiance: source.sourceIrradiance.values,
			},
			geometry: {
				source: geometry.configuration.sourcePosition,
				height: geometry.configuration.localLightSourceHeight,
				top: geometry.configuration.topAltitude,
				projectionRadius: geometry.configuration.projectionRadius,
			},
			medium: {
				constants: atmosphere.constants,
				rayleigh: atmosphere.seaLevelRayleighScattering.values,
				mie: atmosphere.seaLevelMieExtinction.values,
			},
			topology: {
				id: this.domains.topology.id,
				nodes: this.domains.topology.nodes,
				bands: this.domains.topology.bands,
				rows: this.domains.topology.rows,
				coverage: this.domains.topology.coverageRadius,
			},
			directions: {
				incoming: this.domains.incomingDirections.id,
				incomingVectors: this.domains.incomingDirections.unitVectors,
				incomingWeights: this.domains.incomingDirections.integrationWeights,
				outgoing: this.domains.outgoingDirections.id,
				outgoingVectors: this.domains.outgoingDirections.unitVectors,
			},
			positions: this.domains.positions,
			packings: {radiance: this.domains.radiancePacking, scattering: this.domains.scatteringDensityPacking},
			numerical: this.numerical,
		});
	}

	/** Creates a complete construction selection from bound physical models and explicit topology seeds.
	 * Shared spectral, medium, phase and order facts come from their existing owners. Changed physical families remain unsupported here.
	 *
	 * @param {LocalSunCompactConstructionProfileDefinition} definition - Physical owners and complete topology seed controls.
	 * @throws {TypeError} - Owner family, spectral semantics or ingress shape is unsupported.
	 * @throws {RangeError} - Physical configuration, pairing, source support or seed controls are incompatible.
	 */
	constructor(definition) {
		if (!definition || typeof definition !== 'object' || Array.isArray(definition))
			throw new TypeError('Complete compact construction profile inputs required.');
		if (
			Object.keys(definition).some(
				(key) =>
					![
						'geometry',
						'atmosphere',
						'lightSource',
						'groundBoundary',
						'topologyControls',
						'provenanceIdentity',
						'maximumScatteringOrder',
					].includes(key),
			)
		)
			throw new TypeError('Compact construction rejects unknown or inapplicable overrides.');
		let {geometry, atmosphere, lightSource, topologyControls, provenanceIdentity} = definition;
		let maximumScatteringOrder =
			definition.maximumScatteringOrder ??
			DEFAULT_NATIVE_NUMERICAL_PROFILE.cacheConstruction.maximumScatteringOrder;
		if (![1, 2, 4].includes(maximumScatteringOrder))
			throw new RangeError('Supported compact orders are N1, N2 and N4.');
		this.id = 'local-sun-compact-v9-native15-n' + maximumScatteringOrder + '-v1';
		if (
			!(geometry instanceof FlatEarthGeometry) ||
			!(atmosphere instanceof CanonicalAtmosphere) ||
			!(lightSource instanceof LocalSunLightSource)
		)
			throw new TypeError('Existing flat geometry, canonical atmosphere and local source owners required.');
		if (definition.groundBoundary !== null)
			throw new RangeError('Compact candidate requires explicit black ground.');
		if (typeof provenanceIdentity !== 'string' || !provenanceIdentity.trim())
			throw new TypeError('Compact construction input provenance required.');
		if (
			!topologyControls ||
			Object.keys(topologyControls).some(
				(key) =>
					!['coverageRadius', 'altitudes', 'bandRadii', 'boundaryExtinctionLengthMultiples'].includes(key),
			)
		)
			throw new TypeError('Explicit compact seed controls required; extinction is derived from the medium.');
		new CanonicalExponentialCacheColumn(atmosphere);
		let canonical = new CanonicalAtmosphere();
		if (
			CanonicalValueHash.sha256Value(atmosphere.constants) !==
				CanonicalValueHash.sha256Value(canonical.constants) ||
			CanonicalValueHash.sha256Value(atmosphere.seaLevelRayleighScattering.values) !==
				CanonicalValueHash.sha256Value(canonical.seaLevelRayleighScattering.values) ||
			CanonicalValueHash.sha256Value(atmosphere.seaLevelMieExtinction.values) !==
				CanonicalValueHash.sha256Value(canonical.seaLevelMieExtinction.values)
		)
			throw new RangeError('Changed compact medium requires independent qualification.');
		let source = lightSource.configuration;
		SpectralBasis.assertCompatible(atmosphere.spectralBasis, NATIVE_15_SPECTRAL_BASIS, 'Compact profile basis');
		let packet = SpectralPacket.assert(source.sourceIrradiance, {
			basis: atmosphere.spectralBasis,
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		});
		if (!source.distanceFalloff || packet.values.some((value) => value < 0))
			throw new RangeError('Compact candidate requires nonnegative inverse-square source input.');
		DistanceMath.assertDistance(source.radius, 'Compact profile radius');
		if (
			geometry.resolveSourceRelativePosition({position: source.position}).distanceFromSource.value !== 0 ||
			DistanceMath.toMeters(geometry.configuration.localLightSourceHeight) -
				DistanceMath.toMeters(source.radius) <=
				DistanceMath.toMeters(geometry.configuration.topAltitude)
		)
			throw new RangeError('Paired finite source entirely above slab required.');
		DistanceMath.assertDistance(topologyControls.coverageRadius, 'Compact cylinder coverage');
		let topology = geometry.createCompactLocalSunCacheTopology({
			sourceHeight: geometry.configuration.localLightSourceHeight,
			atmosphereTop: geometry.configuration.topAltitude,
			coverageRadius: topologyControls.coverageRadius,
			altitudes: topologyControls.altitudes,
			bandRadii: topologyControls.bandRadii,
			boundaryExtinctionLengthMultiples: topologyControls.boundaryExtinctionLengthMultiples,
			boundaryExtinction: topologyControls.altitudes.map((altitude) => ({
				value: Math.max(
					...atmosphere.sampleMedium(
						geometry.resolveAtmosphereCoordinate({
							coordinates: [
								source.position.coordinates[0],
								source.position.coordinates[1],
								DistanceMath.toMeters(altitude),
							],
							units: 'meters',
						}),
					).extinction.values,
				),
				units: /** @type {const} */ ('m^-1'),
			})),
			provenanceIdentity,
		});
		let positions = {
			id: topology.id + ':physical-positions',
			count: topology.positionCount,
			nodes: topology.nodes.map((node) => ({
				index: node.index,
				coordinate: node.altitude,
				role: 'compact-physical-node',
				metadata: {
					position: geometry.resolveCompactLocalSunCacheNodePosition({topology, positionIndex: node.index}),
					rowIndex: node.rowIndex,
					bandId: node.bandId,
					horizontalDistance: node.horizontalDistance,
					sourceDistance: node.sourceDistance,
				},
			})),
		};
		let incoming = new FlatHorizonPartitionedDirectionDomain();
		let outgoing = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER;
		this.models = {geometry, atmosphere, lightSource, groundBoundary: null};
		this.spectral = {
			basis: atmosphere.spectralBasis,
			sourceIrradianceDensity: /** @type {SpectralIrradiancePacket} */ (packet),
		};
		this.numerical = {
			sourcePathTransmittance: {kind: /** @type {const} */ ('analytic-exponential-column-v1')},
			cacheTransport: {
				kind: /** @type {const} */ ('local-squared-rayleigh-column-v1'),
				...LOCAL_SUN_COMPACT_TRANSPORT_POLICY,
			},
			viewPath: {kind: /** @type {const} */ ('local-positive-column-v1'), intervalCount: 15},
			maximumScatteringOrder,
			precision: {cpu: /** @type {const} */ ('binary64'), gpu: /** @type {const} */ ('scalar-r32f')},
		};
		this.domains = {
			kind: /** @type {const} */ ('local-sun-compact-construction-domains'),
			topology,
			positions,
			incomingDirections: incoming,
			outgoingDirections: outgoing,
			radiancePacking: new LocalSunFieldPacking({
				id: topology.id + ':polar40az48-L',
				directionCount: incoming.directionCount,
				positionCount: positions.count,
				wavelengthCount: atmosphere.spectralBasis.channelCount,
			}),
			scatteringDensityPacking: new LocalSunFieldPacking({
				id: topology.id + ':W27-J',
				directionCount: outgoing.directionCount,
				positionCount: positions.count,
				wavelengthCount: atmosphere.spectralBasis.channelCount,
			}),
		};
		this.provenanceIdentity = provenanceIdentity;
		this.contentHash = this._currentIdentity();
	}

	/** Call this method at consumer ingress to reject fabricated profiles or changed retained physical facts.
	 *
	 * @param {unknown} profile - Complete candidate construction profile.
	 * @returns {LocalSunCompactConstructionProfile} - Genuine accepted profile with current identity.
	 * @throws {TypeError} - The value is not this explicit construction capability.
	 * @throws {RangeError} - Retained physical facts changed after construction.
	 */
	static assert(profile) {
		if (!(profile instanceof LocalSunCompactConstructionProfile))
			throw new TypeError('Genuine compact cache-construction profile required.');
		if (profile._currentIdentity() !== profile.contentHash)
			throw new RangeError('Compact physical facts changed; replacement profile required.');
		return profile;
	}

	/** Call this method to estimate full-field spectral payloads before allocation, including declared retained/other GPU resources.
	 * Estimates do not authorize construction, qualify a field, measure actual memory or claim a complete runtime capability.
	 *
	 * @param {LocalSunCompactResourceEstimateRequest} request - Complete declared additional owned bytes and retained field count.
	 * @returns {LocalSunCompactResourceEstimate} - Logical FP32 GPU subtotal/ceiling and binary64 CPU retained-field estimate.
	 * @throws {RangeError} - Accounting values are negative, nonintegral, unsafe or have incompatible units.
	 */
	estimateResources(request) {
		LocalSunCompactConstructionProfile.assert(this);
		let retained = request.retainedScatteringFields;
		let other = request.otherOwnedGpuBytes;
		if (
			!Number.isSafeInteger(retained) ||
			retained < 0 ||
			other?.units !== 'bytes' ||
			!Number.isSafeInteger(other.value) ||
			other.value < 0
		)
			throw new RangeError('Complete safe nonnegative owned-byte accounting required.');
		let scatteringScalars = this.domains.scatteringDensityPacking.scalarCount;
		let radianceScalars = this.domains.radiancePacking.scalarCount;
		let phase = this.domains.incomingDirections.directionCount * this.domains.outgoingDirections.directionCount * 4;
		let order = this.numerical.maximumScatteringOrder;
		let construction =
			order === 1 ? 2 * scatteringScalars * 4 : 3 * scatteringScalars * 4 + radianceScalars * 4 + phase;
		let total = construction + retained * scatteringScalars * 4 + other.value;
		if (!Number.isSafeInteger(total)) throw new RangeError('Safe allocation estimate required.');
		let bytes = /** @type {const} */ ('bytes');
		return {
			scatteringFieldBytes: {value: scatteringScalars * 4, units: bytes},
			incomingRadianceBytes: {value: radianceScalars * 4, units: bytes},
			phaseBytes: {value: phase, units: bytes},
			newConstructionSubtotalBytes: {value: construction, units: bytes},
			retainedScatteringBytes: {value: retained * scatteringScalars * 4, units: bytes},
			otherOwnedGpuBytes: {...other},
			totalOwnedGpuEstimateBytes: {value: total, units: bytes},
			ownedGpuCeilingBytes: {value: 1600000000, units: bytes},
			estimateFitsCeiling: total <= 1600000000,
			fullCpuRetainedSpectralBytes: {
				value: ((order + 1) * scatteringScalars + (order - 1) * radianceScalars) * 8,
				units: bytes,
			},
			spectralBuffersAllocated: 0,
		};
	}
}
