import {FlatGeometryCacheModuleProvider} from './FlatGeometryCacheModuleProvider.js';
import {FlatGeometryShaderContributor} from './FlatGeometryShaderContributor.js';
import {FlatStellarGenerationShaderContributor} from './FlatStellarGenerationShaderContributor.js';
import {FlatScatteringCacheGeometry} from './FlatScatteringCacheGeometry.js';
import {FlatGeometrySceneAdapter} from './three/FlatGeometrySceneAdapter.js';
import {FlatSynchronizer} from './synchronization/FlatSynchronizer.js';
import {GeometryDirections} from '../../geometry-support/GeometryDirections.js';
import {SolarPosition} from '../../geometry-support/solar/SolarPosition.js';
import AngleMath from '../../math/AngleMath.js';
import DistanceMath from '../../math/DistanceMath.js';
import VectorMath from '../../math/VectorMath.js';
import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../sampling-domains/index.js';
import {
	FLAT_ATMOSPHERE_PATH_DEFAULT_INTERVAL_COUNT,
	FLAT_GEOMETRY_BOUNDARY_EPSILON,
	FLAT_LOCAL_CACHE_DEFAULT_RHO_NODE_FRACTIONS,
	FLAT_LOCAL_CACHE_DEFAULT_Z_NODE_FRACTIONS,
	FLAT_LOCAL_CACHE_RADIAL_MINIMUM,
	FLAT_LOCAL_CACHE_RHO_ZERO_RADIAL_DIRECTION,
	FLAT_OBSERVER_LOCAL_SCENE_FRAME,
} from './consts.js';

/**
 * Flat z-up geometry for local-source atmosphere transport.
 *
 * @implements {GeometryModel}
 * @implements {CacheBuildContributor}
 * @implements {CacheTransportDataProvider<FlatCacheTransportDataRequest>}
 * @implements {CelestialGeometryCapability}
 * @implements {StellarScreenPaletteGeometryCapability}
 */
export class FlatEarthGeometry {
	/** Flat finite-local-Sun celestial capability family. */
	get celestialCapabilityFamily() {
		return /** @type {const} */ ('flat-local-finite-sun-v1');
	}

	/** Call this method to identify the fixed simulated stellar projection.
	 * @returns {FlatStellarEpochRelativeTransformIdentity} - Complete placement policy.
	 */
	describeStellarEpochRelativeTransform() {
		this._assertConfigured();
		return new FlatStellarGenerationShaderContributor(
			this._configuration,
			this._configuration.observation,
		).describeTransform();
	}
	/** Call this method to contribute geometry-owned flat-star GPU placement.
	 * @param {Readonly<{observation:GeometryObservation}>} request - Exact frame observation.
	 * @returns {StellarGenerationGeometryShaderContribution} - CPU-matched placement operations.
	 */
	createStellarGenerationShaderContribution(request) {
		this._assertConfigured();
		if (
			CanonicalValueHash.sha256Value(request.observation) !==
			CanonicalValueHash.sha256Value(this._configuration.observation)
		)
			throw new RangeError('Flat stellar observation must match configured geometry.');
		return new FlatStellarGenerationShaderContributor(
			this._configuration,
			request.observation,
		).createContribution();
	}
	/** Call this method to resolve the matching flat-star CPU presentation direction.
	 * @param {UnitVector3} direction - Accepted catalog unit direction.
	 * @returns {UnitVector3} - Receiver-relative east/north/up direction.
	 */
	resolveStellarCatalogDirection(direction) {
		this._assertConfigured();
		return new FlatStellarGenerationShaderContributor(
			this._configuration,
			this._configuration.observation,
		).resolveDirection(direction);
	}

	/** Call this method to conservatively admit every ray in one symmetric perspective view cone.
	 * @param {FlatCompactViewSupportRequest} request - Physical camera, cone and selected compact coverage.
	 * @returns {LocalSunFrameSupportRay} - Worst outward-direction ray for controller admission.
	 */
	resolveCompactViewSupport(request) {
		this._assertConfigured();
		const origin = DistanceMath.toMetersPosition(request.origin),
			source = this._configuration.sourcePosition.coordinates;
		const forward = VectorMath.normalize(request.forward),
			halfAngle = AngleMath.toRadians(request.halfAngle);
		if (!Number.isFinite(halfAngle) || halfAngle < 0 || halfAngle >= Math.PI / 2)
			throw new RangeError('Supported perspective cone required.');
		const x = origin[0] - source[0],
			y = origin[1] - source[1],
			radius = Math.hypot(x, y);
		const outward = /** @type {UnitVector3} */ (radius === 0 ? [1, 0, 0] : [x / radius, y / radius, 0]);
		const cosine = Math.max(-1, Math.min(1, forward[0] * outward[0] + forward[1] * outward[1]));
		const separation = Math.acos(cosine),
			maximumCosine = Math.cos(Math.max(0, separation - halfAngle));
		const extent = DistanceMath.toMeters(
			this._configuration.observerCenteredDome?.maxObserverViewRayExtent ??
				this._configuration.sceneSkyRayLimit ??
				this._configuration.topAltitude,
		);
		const maximumRadius = Math.sqrt(
			Math.max(radius * radius, radius * radius + extent * extent + 2 * radius * extent * maximumCosine),
		);
		if (maximumRadius > DistanceMath.toMeters(request.coverageRadius))
			throw new RangeError('Requested perspective cone exits complete compact cache support.');
		let direction = outward;
		if (separation > halfAngle) {
			const tangent = [outward[0] - forward[0] * cosine, outward[1] - forward[1] * cosine, -forward[2] * cosine];
			let tangentLength = Math.hypot(...tangent);
			if (tangentLength < 1e-12) {
				const axis = Math.abs(forward[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
				tangent[0] = axis[0] - forward[0] * (forward[0] * axis[0] + forward[2] * axis[2]);
				tangent[1] = -forward[1] * (forward[0] * axis[0] + forward[2] * axis[2]);
				tangent[2] = axis[2] - forward[2] * (forward[0] * axis[0] + forward[2] * axis[2]);
				tangentLength = Math.hypot(...tangent);
			}
			const normalized = VectorMath.normalize([
				forward[0] * Math.cos(halfAngle) + (tangent[0] * Math.sin(halfAngle)) / tangentLength,
				forward[1] * Math.cos(halfAngle) + (tangent[1] * Math.sin(halfAngle)) / tangentLength,
				forward[2] * Math.cos(halfAngle) + (tangent[2] * Math.sin(halfAngle)) / tangentLength,
			]);
			direction = [normalized[0], normalized[1], normalized[2]];
		}
		return {origin: request.origin, direction};
	}

	/** Canonicalize sub-nanometer projection roundoff near an exact meter. */
	_canonicalProjectionMeters(value) {
		const nearestMeter = Math.round(value);
		const tolerance =
			Number.EPSILON * Math.max(1, Math.abs(value), this._shapeConfiguration.projectionRadius.value) * 16;
		return Math.abs(value - nearestMeter) <= tolerance ? nearestMeter : value;
	}

	/** Require construction-time light-source placement. */
	_assertConfigured() {
		if (this._configuration === null) {
			throw new Error('FlatEarthGeometry requires configureLightSource() before this operation.');
		}
	}

	/**
	 * Resolve the finite source center from one geographic observation.
	 *
	 * @param {GeometryObservation} observation - The normalized observation.
	 * @returns {Position} - The finite source center in flat model space.
	 */
	_resolveLocalSourcePosition(observation) {
		const sourceLocation = SolarPosition.resolveSubsolarLocation(observation.instant);
		const projectionRadiusMeters = this._shapeConfiguration.projectionRadius.value;
		const project = (location) => {
			const latitudeRadians = AngleMath.toRadians(location.latitude);
			const longitudeRadians = AngleMath.toRadians(location.longitude);
			const radiusMeters = projectionRadiusMeters * (Math.PI / 2 - latitudeRadians);
			return [radiusMeters * Math.sin(longitudeRadians), radiusMeters * Math.cos(longitudeRadians)];
		};
		const observerProjection = project(observation.location);
		const sourceProjection = project(sourceLocation);
		const globalX = sourceProjection[0] - observerProjection[0];
		const globalY = sourceProjection[1] - observerProjection[1];
		const observerLongitudeRadians = AngleMath.toRadians(observation.location.longitude);
		const eastMeters = globalX * Math.cos(observerLongitudeRadians) - globalY * Math.sin(observerLongitudeRadians);
		const northMeters =
			-globalX * Math.sin(observerLongitudeRadians) - globalY * Math.cos(observerLongitudeRadians);
		return DistanceMath.positionInMeters([
			this._canonicalProjectionMeters(eastMeters),
			this._canonicalProjectionMeters(northMeters),
			this._shapeConfiguration.localLightSourceHeight.value,
		]);
	}

	/**
	 * Resolve one flat-world observation instant without exposing private synchronization support.
	 *
	 * @param {FlatEarthObservationInstantRequest} request - The date, location, and event selection.
	 * @returns {string} - The selected canonical UTC instant.
	 */
	static resolveObservationInstant(request) {
		return new FlatSynchronizer().calibrateToWorld().resolveObservationInstant(request);
	}

	/**
	 * Called by FlatEarthGeometry to derive the configured final-view-only observer dome. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {readonly number[]} observerPositionMeters - The observer position.
	 * @param {FlatObserverCenteredDomeConfig | null} domeConfig - The dome config.
	 * @returns {FlatObserverCenteredDomeFacts | null} - The derived dome facts.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_deriveObserverCenteredDomeFacts(observerPositionMeters, domeConfig) {
		if (!domeConfig) {
			return null;
		}

		const {centerPolicy = 'observer-centered', apexAltitude, maxObserverViewRayExtent} = domeConfig;
		DistanceMath.assertDistance(apexAltitude, 'observerCenteredDome.apexAltitude');
		DistanceMath.assertDistance(maxObserverViewRayExtent, 'observerCenteredDome.maxObserverViewRayExtent');
		const apexAltitudeMeters = DistanceMath.toMeters(apexAltitude);
		const maxObserverViewRayExtentMeters = DistanceMath.toMeters(maxObserverViewRayExtent);
		const observerAltitudeMeters = observerPositionMeters[2];

		if (centerPolicy !== 'observer-centered') {
			throw new RangeError('FlatEarthGeometry only supports observer-centered dome policy.');
		}
		if (apexAltitudeMeters <= observerAltitudeMeters) {
			throw new RangeError('observerCenteredDome.apexAltitude must be above the observer.');
		}
		if (maxObserverViewRayExtentMeters <= 0) {
			throw new RangeError('observerCenteredDome.maxObserverViewRayExtent must be positive.');
		}

		const centerZ =
			(apexAltitudeMeters ** 2 - observerAltitudeMeters ** 2 - maxObserverViewRayExtentMeters ** 2) /
			(2 * (apexAltitudeMeters - observerAltitudeMeters));
		const sphereRadiusMeters = apexAltitudeMeters - centerZ;
		if (!Number.isFinite(centerZ) || sphereRadiusMeters <= 0) {
			throw new RangeError('observerCenteredDome produced an invalid derived sphere.');
		}

		return {
			centerPolicy,
			apexAltitude: DistanceMath.inMeters(apexAltitudeMeters),
			maxObserverViewRayExtent: DistanceMath.inMeters(maxObserverViewRayExtentMeters),
			observerAltitude: DistanceMath.inMeters(observerAltitudeMeters),
			sphereCenter: DistanceMath.positionInMeters([
				observerPositionMeters[0],
				observerPositionMeters[1],
				centerZ,
			]),
			sphereRadius: DistanceMath.inMeters(sphereRadiusMeters),
		};
	}

	/**
	 * Called by FlatEarthGeometry to scale one selected dimensionless node-placement profile to its bound.
	 *
	 * @param {number} maximumMeters - The configured upper endpoint.
	 * @param {FlatEarthGeometryNodePlacementFractions} fractions - The ordered
	 * numerator/denominator fractions.
	 *
	 * @returns {readonly Distance[]} - The ordered unit-bearing nodes.
	 */
	_scaledDistanceNodes(maximumMeters, fractions) {
		return fractions.map(([numerator, denominator]) =>
			DistanceMath.inMeters((maximumMeters * numerator) / denominator),
		);
	}

	/**
	 * Called by FlatEarthGeometry to normalize one optional explicit cache axis. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {readonly Distance[] | undefined} values - The explicit nodes.
	 * @param {number} maximumMeters - The allowed maximum.
	 * @param {FlatEarthGeometryNodePlacementFractions} defaultFractions - The
	 * selected default node-placement fractions.
	 *
	 * @param {string} label - The diagnostic label.
	 * @returns {readonly Distance[]} - The normalized ordered nodes.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_cacheAxisNodes(values, maximumMeters, defaultFractions, label) {
		if (values === undefined) {
			return this._scaledDistanceNodes(maximumMeters, defaultFractions);
		}
		if (!Array.isArray(values) || values.length < 2) {
			throw new RangeError(`${label} must contain at least two nodes.`);
		}

		let previousMeters = Number.NEGATIVE_INFINITY;
		return values.map((distance, index) => {
			DistanceMath.assertDistance(distance, `${label}[${index}]`);
			const meters = DistanceMath.toMeters(distance);
			if (meters < 0 || meters > maximumMeters || meters <= previousMeters) {
				throw new RangeError(`${label} must be strictly increasing within the selected domain.`);
			}
			previousMeters = meters;
			return DistanceMath.inMeters(meters);
		});
	}

	/**
	 * Creates flat Earth geometry for one observer, local source, and atmosphere domain.
	 *
	 * @param {FlatEarthGeometryConfig} configuration - The observer,
	 * source, atmosphere domain, and integration policy.
	 *
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('FlatEarthGeometry configuration is required.');
		}

		const {
			observerPosition = {coordinates: [0, 0, 2], units: 'meters'},
			topAltitude,
			localLightSourceHeight,
			projectionRadius,
			sceneSkyRayLimit = null,
			observerCenteredDome = null,
			runtimeDiagnosticLimit = 50,
			cacheAltitudeNodes,
			cacheRadialNodes,
		} = configuration;

		DistanceMath.assertPosition(observerPosition, 'observerPosition');
		DistanceMath.assertDistance(topAltitude, 'topAltitude');
		DistanceMath.assertDistance(localLightSourceHeight, 'localLightSourceHeight');
		DistanceMath.assertDistance(projectionRadius, 'projectionRadius');
		if (sceneSkyRayLimit !== null) {
			DistanceMath.assertDistance(sceneSkyRayLimit, 'sceneSkyRayLimit');
		}
		const observerPositionMeters = DistanceMath.toMetersPosition(observerPosition);
		const topAltitudeMeters = DistanceMath.toMeters(topAltitude);
		const localLightSourceHeightMeters = DistanceMath.toMeters(localLightSourceHeight);
		const projectionRadiusMeters = DistanceMath.toMeters(projectionRadius);
		const sceneSkyRayLimitMeters = sceneSkyRayLimit === null ? null : DistanceMath.toMeters(sceneSkyRayLimit);

		if (!Number.isFinite(topAltitudeMeters) || topAltitudeMeters <= 0) {
			throw new RangeError('FlatEarthGeometry requires a positive topAltitude.');
		}
		if (!Number.isFinite(localLightSourceHeightMeters) || localLightSourceHeightMeters <= 0) {
			throw new RangeError('FlatEarthGeometry requires a positive localLightSourceHeight.');
		}
		if (!Number.isFinite(projectionRadiusMeters) || projectionRadiusMeters <= 0) {
			throw new RangeError('FlatEarthGeometry requires a positive projectionRadius.');
		}

		if (
			sceneSkyRayLimitMeters !== null &&
			(!Number.isFinite(sceneSkyRayLimitMeters) || sceneSkyRayLimitMeters < 0)
		) {
			throw new RangeError('FlatEarthGeometry sceneSkyRayLimit must be null or non-negative.');
		}

		const normalizedCacheAltitudeNodes = this._cacheAxisNodes(
			cacheAltitudeNodes,
			topAltitudeMeters,
			FLAT_LOCAL_CACHE_DEFAULT_Z_NODE_FRACTIONS,
			'cacheAltitudeNodes',
		);
		if (
			normalizedCacheAltitudeNodes[0].value !== 0 ||
			normalizedCacheAltitudeNodes[normalizedCacheAltitudeNodes.length - 1].value !== topAltitudeMeters
		) {
			throw new RangeError('cacheAltitudeNodes must include ground zero and topAltitude endpoints.');
		}
		this._shapeConfiguration = {
			observerPosition: DistanceMath.positionInMeters(observerPositionMeters),
			topAltitude: DistanceMath.inMeters(topAltitudeMeters),
			localLightSourceHeight: DistanceMath.inMeters(localLightSourceHeightMeters),
			projectionRadius: DistanceMath.inMeters(projectionRadiusMeters),
			sceneSkyRayLimit: sceneSkyRayLimitMeters === null ? null : DistanceMath.inMeters(sceneSkyRayLimitMeters),
			observerCenteredDome: this._deriveObserverCenteredDomeFacts(observerPositionMeters, observerCenteredDome),
			runtimeDiagnosticLimit,
			observerLocalSceneFrame: FLAT_OBSERVER_LOCAL_SCENE_FRAME,
			cacheAltitudeNodes: normalizedCacheAltitudeNodes,
			cacheAltitudeNodesExplicit: cacheAltitudeNodes !== undefined,
			cacheRadialNodesExplicit: cacheRadialNodes !== undefined,
			cacheRadialFallbackDirection: /** @type {UnitVector3} */ ([...FLAT_LOCAL_CACHE_RHO_ZERO_RADIAL_DIRECTION]),
			cacheRadialNodes,
		};
		/** @type {FlatEarthGeometryConfiguration | null} */
		this._configuration = null;
		this._binding = null;
		this._scatteringCacheGeometry = null;
		this._runtimeDiagnostics = [];
		this._cacheModuleProvider = null;
		this._shaderContributor = null;
		this._sceneAdapter = null;
	}

	/**
	 * Configure one finite local source from the construction-time observation.
	 *
	 * @param {GeometryLightSourceConfigurationRequest} request - The source and observation.
	 */
	configureLightSource(request) {
		if (request.lightSource.geometryPlacementKind !== 'finite-position') {
			throw new RangeError('FlatEarthGeometry requires a finite-position light source.');
		}
		if (request.placement !== undefined && request.placement.kind !== 'finite-position') {
			throw new RangeError('FlatEarthGeometry explicit placement must be a finite position.');
		}
		let sourcePosition;
		if (request.placement === undefined) {
			sourcePosition = this._resolveLocalSourcePosition(request.observation);
		} else {
			const explicitPlacement = /** @type {Readonly<{kind: 'finite-position', position: Position}>} */ (
				request.placement
			);
			DistanceMath.assertPosition(explicitPlacement.position, 'FlatEarthGeometry source placement');
			sourcePosition = DistanceMath.positionInMeters(DistanceMath.toMetersPosition(explicitPlacement.position));
		}
		const placement = /** @type {Readonly<{kind: 'finite-position', position: Position}>} */ (
			request.placement ?? {
				kind: 'finite-position',
				position: sourcePosition,
			}
		);
		if (this._binding !== null) {
			const sameObservation =
				this._binding.lightSource === request.lightSource &&
				this._binding.observation.instant === request.observation.instant &&
				AngleMath.toDegrees(this._binding.observation.location.latitude) ===
					AngleMath.toDegrees(request.observation.location.latitude) &&
				AngleMath.toDegrees(this._binding.observation.location.longitude) ===
					AngleMath.toDegrees(request.observation.location.longitude);
			const boundPositionMeters = DistanceMath.toMetersPosition(this._binding.placement.position);
			const samePlacement = boundPositionMeters.every(
				(value, index) => value === sourcePosition.coordinates[index],
			);
			if (sameObservation && samePlacement) return this._binding.placement;
			throw new Error('FlatEarthGeometry light-source placement is already configured.');
		}

		const observerCoordinates = this._shapeConfiguration.observerPosition.coordinates;
		const sourceCoordinates = sourcePosition.coordinates;
		const horizontalDistanceMeters = Math.hypot(
			sourceCoordinates[0] - observerCoordinates[0],
			sourceCoordinates[1] - observerCoordinates[1],
		);
		const cacheRadialMaximumMeters = Math.max(
			DistanceMath.toMeters(FLAT_LOCAL_CACHE_RADIAL_MINIMUM),
			horizontalDistanceMeters,
		);
		const normalizedCacheRadialNodes = this._cacheAxisNodes(
			this._shapeConfiguration.cacheRadialNodes,
			cacheRadialMaximumMeters,
			FLAT_LOCAL_CACHE_DEFAULT_RHO_NODE_FRACTIONS,
			'cacheRadialNodes',
		);
		if (
			normalizedCacheRadialNodes[0].value !== 0 ||
			normalizedCacheRadialNodes[normalizedCacheRadialNodes.length - 1].value !== cacheRadialMaximumMeters
		) {
			throw new RangeError('cacheRadialNodes must include rho zero and cacheRadialMaximum endpoints.');
		}
		const configuration = {
			...this._shapeConfiguration,
			sourcePosition,
			sourceSubpoint: DistanceMath.positionInMeters([sourceCoordinates[0], sourceCoordinates[1], 0]),
			cacheRadialNodes: normalizedCacheRadialNodes,
			cacheRadialMaximum: DistanceMath.inMeters(cacheRadialMaximumMeters),
			observation: request.observation,
		};
		const scatteringCacheGeometry = new FlatScatteringCacheGeometry(
			configuration,
			this,
			request.domains?.outgoingDirections ?? CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		);
		const cacheModuleProvider = new FlatGeometryCacheModuleProvider(configuration);
		const shaderContributor = new FlatGeometryShaderContributor(configuration);
		const sceneAdapter = new FlatGeometrySceneAdapter(configuration);

		request.lightSource.configureGeometryPlacement(placement);
		this._configuration = configuration;
		this._binding = {lightSource: request.lightSource, observation: request.observation, placement};
		this._scatteringCacheGeometry = scatteringCacheGeometry;
		this._cacheModuleProvider = cacheModuleProvider;
		this._shaderContributor = shaderContributor;
		this._sceneAdapter = sceneAdapter;

		return placement;
	}

	/**
	 * The immutable normalized geometry configuration.
	 *
	 * @returns {FlatEarthGeometryConfiguration} - The normalized configuration.
	 */
	get configuration() {
		this._assertConfigured();
		return this._configuration;
	}

	/** Call this method to create an independently bound live geometry through public configuration.
	 *
	 * @param {FlatLocalFrameGeometryRequest} request - Exact observation, source, receiver and optional explicit placement.
	 * @returns {FlatEarthGeometry} - Independent geometry; this geometry remains unchanged.
	 */
	createLocalFrameGeometry(request) {
		this._assertConfigured();
		const instant = new Date(request.observation.instant);
		if (
			typeof request.observation.instant !== 'string' ||
			!Number.isFinite(instant.getTime()) ||
			instant.toISOString() !== request.observation.instant
		)
			throw new TypeError('Canonical exact UTC observation required.');
		const latitude = AngleMath.toDegrees(request.observation.location.latitude);
		const longitude = AngleMath.toDegrees(request.observation.location.longitude);
		if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
			throw new RangeError('Live observation location is outside geographic bounds.');
		const facts = this._configuration;
		const geometry = new FlatEarthGeometry({
			observerPosition: request.receiverPosition,
			topAltitude: facts.topAltitude,
			localLightSourceHeight: facts.localLightSourceHeight,
			projectionRadius: facts.projectionRadius,
			sceneSkyRayLimit: facts.sceneSkyRayLimit,
			observerCenteredDome: facts.observerCenteredDome,
			runtimeDiagnosticLimit: facts.runtimeDiagnosticLimit,
			...(facts.cacheAltitudeNodesExplicit ? {cacheAltitudeNodes: facts.cacheAltitudeNodes} : {}),
		});
		geometry.configureLightSource({
			lightSource: request.lightSource,
			observation: {
				instant: request.observation.instant,
				location: {
					latitude: {...request.observation.location.latitude},
					longitude: {...request.observation.location.longitude},
				},
			},
			...(request.sourcePosition === undefined
				? {}
				: {placement: {kind: 'finite-position', position: request.sourcePosition}}),
		});
		return geometry;
	}

	/**
	 * The bounded runtime diagnostics recorded by tolerant paths.
	 *
	 * @returns {readonly unknown[]} - The runtime diagnostics.
	 */
	get runtimeDiagnostics() {
		return [...this._runtimeDiagnostics];
	}

	/**
	 * The compatibility identifier for this configured geometry model.
	 *
	 * @returns {string} - The geometry id.
	 */
	get id() {
		return 'flat-earth-geometry';
	}

	/** @param {Algorithm32ExecutionDomains} domains - Accepted execution domains. */
	configureExecutionDomains(domains) {
		this._assertConfigured();
		this._scatteringCacheGeometry.configureExecutionDomains(domains);
		this._shaderContributor.configureExecutionDomains(domains);
	}

	/**
	 * Call this method to create the selected flattened z-major, rho-minor local position domain.
	 *
	 * @param {FlatLocalCachePositionDomainRequest} [request] - The optional
	 * generated-axis count overrides.
	 *
	 * @returns {FlatLocalCachePositionDomain} - The executable domain packet.
	 */
	createLocalSunCachePositionDomain(request = {}) {
		return this._scatteringCacheGeometry.createLocalSunCachePositionDomain(request);
	}

	/** Call this method to create geometry-owned compact positions and complete spatial support.
	 *
	 * @param {FlatCompactTopologyRequest} request - Complete source-centered topology and profile-derived refinement.
	 * @returns {FlatCompactTopology} - Executable ragged positions, stencils and amplitude bounds.
	 * @throws {RangeError} - Controls or paired geometry height/slab are incompatible.
	 * @throws {Error} - The finite source has not been configured on this geometry.
	 */
	createCompactLocalSunCacheTopology(request) {
		if (this._scatteringCacheGeometry === null)
			throw new Error('Configure the finite source before creating compact topology.');
		return this._scatteringCacheGeometry.createCompactLocalSunCacheTopology(request);
	}

	/**
	 * Call this method to build packed local Jk-to-Lk transport data.
	 *
	 * The radial source frame is recomputed at every path sample. Position and
	 * direction interpolation therefore contribute arbitrary combined taps
	 * rather than the spherical cache's one-position specialization.
	 *
	 * @param {FlatCacheTransportDataRequest} request - The physical collaborators.
	 * @returns {CacheTransportData} - The reusable packed transport data.
	 */
	createTransportData(request) {
		return this._scatteringCacheGeometry.createTransportData(request);
	}

	/**
	 * Call this method to enumerate active local transport rows without creating
	 * the fixed-width packed transport payload.
	 *
	 * @param {FlatCacheTransportDataRequest} request - The physical transport inputs.
	 * @param {FlatTransportQueryTapVisitor} visit - The receiver of each active query row.
	 * @returns {void} - No value.
	 */
	forEachTransportQueryTap(request, visit) {
		this._scatteringCacheGeometry.forEachTransportQueryTap(request, visit);
	}

	/**
	 * Call this method to build active-only CSR transport data for the Flat/local
	 * interim path without creating a fixed-width packed payload.
	 *
	 * @param {FlatCacheTransportDataRequest} request - The physical transport inputs.
	 * @returns {FlatIndexedTransportData} - The active-only transport representation.
	 */
	createIndexedTransportData(request) {
		return this._scatteringCacheGeometry.createIndexedTransportData(request);
	}

	/**
	 * Call this method to create GPU-bindable R32F resources for active-only
	 * Flat/local CSR transport data.
	 *
	 * @param {FlatCacheTransportDataRequest} request - The physical transport inputs.
	 * @returns {FlatIndexedTransportGpuData} - The indexed GPU transport resources.
	 */
	createIndexedTransportGpuData(request) {
		return this._scatteringCacheGeometry.createIndexedTransportGpuData(request);
	}

	/**
	 * Call this method to create flat construction coordinates and symbols for one cache pass.
	 *
	 * @param {CacheBuildContext} context - The logical pass.
	 * @returns {CacheBuildModule} - The geometry-owned construction module.
	 */
	createCacheModule(context) {
		return this._cacheModuleProvider.createCacheModule(context);
	}

	/**
	 * Called by FlatEarthGeometry to record one bounded runtime diagnostic.
	 *
	 * @param {string} id - The diagnostic identifier.
	 * @param {string} severity - The diagnostic severity.
	 * @param {string} message - The human-readable diagnostic message.
	 * @param {Record<string, unknown>} details - The structured diagnostic details.
	 * @returns {void} - No value.
	 */
	_diagnose(id, severity, message, details) {
		if (this._runtimeDiagnostics.length >= this._configuration.runtimeDiagnosticLimit) {
			return;
		}

		this._runtimeDiagnostics.push({
			id,
			severity,
			message,
			details: {...details},
		});
	}

	/**
	 * Call this method to resolve distance to the top atmosphere plane. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {Position} origin - The origin.
	 * @param {UnitVector3} direction - The direction.
	 * @returns {number | null} - The distance to boundary, or null.
	 */
	distanceToTopAtmosphereBoundary(origin, direction) {
		const originVector = DistanceMath.acceptPositionInMeters(origin, 'Top boundary origin');
		const directionVector = GeometryDirections.normalizeDirection(direction, 'Top boundary direction');

		if (directionVector[2] <= FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return null;
		}

		const distance = (this._configuration.topAltitude.value - originVector[2]) / directionVector[2];

		if (distance >= -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return Math.max(0, distance);
		}

		return null;
	}

	/**
	 * Call this method to resolve distance to the ground plane. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {Position} origin - The origin.
	 * @param {UnitVector3} direction - The direction.
	 * @returns {number | null} - The distance to boundary, or null.
	 */
	distanceToGroundBoundary(origin, direction) {
		const originVector = DistanceMath.acceptPositionInMeters(origin, 'Ground boundary origin');
		const directionVector = GeometryDirections.normalizeDirection(direction, 'Ground boundary direction');

		if (directionVector[2] >= -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return null;
		}

		const distance = -originVector[2] / directionVector[2];

		if (distance >= -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return Math.max(0, distance);
		}

		return null;
	}

	/**
	 * Call this method to resolve the nearest flat-ground hit along a physical ray. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {Ray} viewRay - The physical ray.
	 * @returns {GroundIntersection | null} - The ground hit or null.
	 */
	resolveGroundIntersection(viewRay) {
		const origin = DistanceMath.acceptPositionInMeters(viewRay.origin, 'Ground intersection origin');
		const direction = GeometryDirections.normalizeDirection(viewRay.direction, 'Ground intersection direction');
		const distance = this.distanceToGroundBoundary(DistanceMath.positionInMeters(origin), direction);
		if (distance === null) {
			return null;
		}

		const hitPosition = VectorMath.addScaled(origin, direction, distance);
		hitPosition[2] = 0;

		return {
			position: DistanceMath.positionInMeters(hitPosition),
			normal: [0, 0, 1],
			distance: DistanceMath.inMeters(distance),
		};
	}

	/**
	 * Call this method to resolve distance to the observer-centered dome boundary when configured.
	 *
	 * @param {Position} origin - The origin.
	 * @param {UnitVector3} direction - The direction.
	 * @returns {number | null} - The distance to boundary, or null.
	 */
	distanceToObserverCenteredDomeBoundary(origin, direction) {
		const dome = this._configuration.observerCenteredDome;

		if (!dome) {
			return null;
		}

		const originVector = DistanceMath.acceptPositionInMeters(origin, 'Dome boundary origin');
		const directionVector = GeometryDirections.normalizeDirection(direction, 'Dome boundary direction');
		const offsetFromCenter = VectorMath.subtract(originVector, dome.sphereCenter.coordinates);
		const halfLinearCoefficient = VectorMath.dot(offsetFromCenter, directionVector);
		const constantTerm = VectorMath.dot(offsetFromCenter, offsetFromCenter) - dome.sphereRadius.value ** 2;
		const discriminant = halfLinearCoefficient ** 2 - constantTerm;

		if (discriminant < -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return null;
		}

		const root = Math.sqrt(Math.max(0, discriminant));
		const near = -halfLinearCoefficient - root;
		const farIntersectionDistance = -halfLinearCoefficient + root;

		if (
			constantTerm <= FLAT_GEOMETRY_BOUNDARY_EPSILON &&
			farIntersectionDistance >= -FLAT_GEOMETRY_BOUNDARY_EPSILON
		) {
			return Math.max(0, farIntersectionDistance);
		}

		if (near >= -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return Math.max(0, near);
		}

		if (farIntersectionDistance >= -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return Math.max(0, farIntersectionDistance);
		}

		return null;
	}

	/**
	 * Called by FlatEarthGeometry to resolve the nearest configured flat-atmosphere exit distance. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {readonly number[]} origin - The normalized ray origin in meters.
	 * @param {UnitVector3} direction - The normalized ray direction.
	 * @param {string} operationKind - The requesting operation for diagnostics.
	 * @returns {number} - The non-negative exit distance in meters.
	 */
	_resolveFlatExitDistance(origin, direction, operationKind) {
		const originPosition = DistanceMath.positionInMeters(origin);
		const candidates = [
			this.distanceToGroundBoundary(originPosition, direction),
			this.distanceToTopAtmosphereBoundary(originPosition, direction),
			this.distanceToObserverCenteredDomeBoundary(originPosition, direction),
		].filter((distance) => distance !== null);

		if (candidates.length > 0) {
			return Math.min(...candidates);
		}

		if (this._configuration.sceneSkyRayLimit !== null) {
			this._diagnose(
				'flat-ray-parallel-no-boundary-hit',
				'warning',
				'Flat ray found no configured ground/top/dome boundary; using supplied no-hit cap.',
				{
					operationKind,
					sceneSkyRayLimit: this._configuration.sceneSkyRayLimit,
				},
			);

			return this._configuration.sceneSkyRayLimit.value;
		}

		this._diagnose(
			'flat-ray-parallel-default-top-cap',
			'warning',
			'Flat ray found no configured ground/top/dome boundary or explicit cap; using topAltitude as the default finite view extent.',
			{
				operationKind,
				topAltitude: this._configuration.topAltitude,
			},
		);

		return this._configuration.topAltitude.value;
	}

	/**
	 * Call this method to resolve flat model-space position into altitude-only atmosphere
	 * coordinates.
	 *
	 * @param {Position} position - The
	 * model-space position.
	 *
	 * @returns {AtmosphereCoordinate} - The atmosphere coordinate.
	 */
	resolveAtmosphereCoordinate(position) {
		const vector = DistanceMath.acceptPositionInMeters(position, 'Flat atmosphere position');
		const altitudeMeters = vector[2];
		const sourceSubpoint = this._configuration.sourceSubpoint.coordinates;
		const rhoMeters = Math.hypot(vector[0] - sourceSubpoint[0], vector[1] - sourceSubpoint[1]);

		if (
			altitudeMeters < -FLAT_GEOMETRY_BOUNDARY_EPSILON ||
			altitudeMeters > this._configuration.topAltitude.value + FLAT_GEOMETRY_BOUNDARY_EPSILON
		) {
			this._diagnose(
				'flat-atmosphere-coordinate-out-of-domain',
				'warning',
				'Flat atmosphere coordinate is outside the supplied atmosphere/profile domain.',
				{
					altitude: DistanceMath.inMeters(altitudeMeters),
					topAltitude: this._configuration.topAltitude,
				},
			);
		}

		return {
			altitude: DistanceMath.inMeters(altitudeMeters),
			rho: DistanceMath.inMeters(rhoMeters),
		};
	}

	/**
	 * Called by FlatEarthGeometry to build trapezoidal atmosphere-path samples over a normalized ray segment.
	 *
	 * @param {FlatEarthGeometryNormalizedMeterRay} viewRay - The normalized physical ray.
	 * @param {number} startDistanceMeters - The segment start in meters.
	 * @param {number} endDistanceMeters - The segment end in meters.
	 * @param {number} sampleCount - The positive interval count.
	 * @returns {readonly AtmospherePathSample[]} - The weighted path samples.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_buildAtmospherePathSamples(viewRay, startDistanceMeters, endDistanceMeters, sampleCount) {
		if (!Number.isInteger(sampleCount) || sampleCount < 1) {
			throw new RangeError('Atmosphere path sampleCount must be a positive integer.');
		}

		const intervalLengthMeters = (endDistanceMeters - startDistanceMeters) / sampleCount;
		const samples = [];

		for (let pointIndex = 0; pointIndex <= sampleCount; pointIndex += 1) {
			const isEndpoint = pointIndex === 0 || pointIndex === sampleCount;
			const distance = startDistanceMeters + intervalLengthMeters * pointIndex;
			const position = VectorMath.addScaled(viewRay.origin, viewRay.direction, distance);

			samples.push({
				atmosphereCoordinate: this.resolveAtmosphereCoordinate(DistanceMath.positionInMeters(position)),
				intervalLengthFromPrevious: DistanceMath.inMeters(pointIndex === 0 ? 0 : intervalLengthMeters),
				measure: DistanceMath.inMeters(intervalLengthMeters * (isEndpoint ? 0.5 : 1)),
			});
		}

		return samples;
	}

	/**
	 * Call this method to create the geometry-owned flat shader contribution.
	 *
	 * @param {ShaderContributionRequest} [request] - Optional configured-model context selecting its actual compact or rectangular domain.
	 * @returns {ShaderContribution} - The geometry shader contribution.
	 */
	createShaderContribution(request) {
		return this._shaderContributor.createShaderContribution(
			request?.model.profile.compactConstruction !== undefined,
		);
	}

	/**
	 * Call this method to resolve a finite view ray segment for atmosphere transport.
	 *
	 * @param {GeometryViewRayRequest} [request] - The ray request facts.
	 * @returns {RaySegment} - The clipped ray segment.
	 */
	resolveViewRaySegment(request = {}) {
		const origin = DistanceMath.acceptPositionInMeters(
			request.origin === undefined ? this._configuration.observerPosition : request.origin,
			'Flat view ray origin',
		);
		const direction = GeometryDirections.normalizeDirection(
			request.direction === undefined ? [0, 0, 1] : request.direction,
			'Flat view ray direction',
		);
		let endDistanceMeters = this._resolveFlatExitDistance(origin, direction, 'view-ray');

		if (!this._configuration.observerCenteredDome && this._configuration.sceneSkyRayLimit !== null) {
			endDistanceMeters = Math.min(endDistanceMeters, this._configuration.sceneSkyRayLimit.value);
		}

		const requestedEndDistanceMeters = DistanceMath.optionalMeters(request.endDistance, 'endDistance');

		if (Number.isFinite(requestedEndDistanceMeters)) {
			endDistanceMeters = Math.min(endDistanceMeters, requestedEndDistanceMeters);
		}

		return {
			ray: {
				origin: DistanceMath.positionInMeters(origin),
				direction,
			},
			startDistance: DistanceMath.inMeters(0),
			endDistance: DistanceMath.inMeters(Math.max(0, endDistanceMeters)),
		};
	}

	/**
	 * Call this method to resolve a model-space ray into an atmosphere path. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {AtmospherePathRequest} request - The path request facts.
	 * @returns {AtmospherePath} - The atmosphere path.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	resolveAtmospherePath(request) {
		const viewRay = request.ray;
		const origin = DistanceMath.toMetersPosition(viewRay.origin);
		const direction = GeometryDirections.normalizeTrustedDirection(
			viewRay.direction,
			'Flat atmosphere path direction',
		);
		const startDistanceMeters =
			request.startDistance === undefined ? 0 : DistanceMath.toMeters(request.startDistance);
		const sourceLimitMeters =
			request.sourcePathLimit?.maxDistance === null || request.sourcePathLimit === undefined
				? null
				: DistanceMath.toMeters(request.sourcePathLimit.maxDistance);
		const explicitEndDistanceMeters =
			request.endDistance === undefined ? null : DistanceMath.toMeters(request.endDistance);
		const requestedLimitMeters = explicitEndDistanceMeters ?? sourceLimitMeters;
		let candidateEndDistanceMeters = requestedLimitMeters;
		let boundaryKind = requestedLimitMeters === null ? null : 'requested-limit';
		const originPosition = DistanceMath.positionInMeters(origin);
		const topDistance = this.distanceToTopAtmosphereBoundary(originPosition, direction);
		const groundDistance = this.distanceToGroundBoundary(originPosition, direction);

		const physicalBoundaries = [
			{kind: 'ground', distance: groundDistance},
			{kind: 'top-atmosphere', distance: topDistance},
		];
		for (const boundary of physicalBoundaries) {
			const domainDistance = boundary.distance;
			if (
				domainDistance !== null &&
				domainDistance >= startDistanceMeters - FLAT_GEOMETRY_BOUNDARY_EPSILON &&
				(candidateEndDistanceMeters === null || domainDistance < candidateEndDistanceMeters)
			) {
				candidateEndDistanceMeters = domainDistance;
				boundaryKind = boundary.kind;
			}
		}

		if (candidateEndDistanceMeters === null) {
			throw new RangeError(
				'Reusable flat atmosphere path is unbounded; provide a finite source or endpoint limit.',
			);
		}

		const endDistanceMeters = Math.max(startDistanceMeters, candidateEndDistanceMeters);
		const sampleCount =
			request.sampleCount === undefined ? FLAT_ATMOSPHERE_PATH_DEFAULT_INTERVAL_COUNT : request.sampleCount;
		const samples = this._buildAtmospherePathSamples(
			{origin, direction},
			startDistanceMeters,
			endDistanceMeters,
			sampleCount,
		);
		const start =
			samples[0]?.atmosphereCoordinate ?? this.resolveAtmosphereCoordinate(DistanceMath.positionInMeters(origin));
		const endingAtmosphereCoordinate = samples[samples.length - 1]?.atmosphereCoordinate ?? start;
		const groundOccludedRequestedEndpoint =
			boundaryKind === 'ground' &&
			requestedLimitMeters !== null &&
			candidateEndDistanceMeters < requestedLimitMeters - FLAT_GEOMETRY_BOUNDARY_EPSILON;

		return {
			start,
			end: endingAtmosphereCoordinate,
			length: DistanceMath.inMeters(Math.max(0, endDistanceMeters - startDistanceMeters)),
			samples,
			blockedByGround: groundOccludedRequestedEndpoint,
			metadata: {
				startDistance: DistanceMath.inMeters(startDistanceMeters),
				endDistance: DistanceMath.inMeters(endDistanceMeters),
				boundaryKind,
				terminatedByGround: boundaryKind === 'ground',
				terminatedByTop: boundaryKind === 'top-atmosphere',
				groundOccludedRequestedEndpoint,
				observerDomeApplied: false,
				topDistance: topDistance === null ? null : DistanceMath.inMeters(topDistance),
				groundDistance: groundDistance === null ? null : DistanceMath.inMeters(groundDistance),
				sourceLimit: sourceLimitMeters === null ? null : DistanceMath.inMeters(sourceLimitMeters),
			},
		};
	}

	/**
	 * Call this method to resolve a sample point into local source-relative facts.
	 *
	 * @param {GeometrySourceRelativePositionRequest} [request] - The position facts.
	 * @returns {SourceRelativePosition} - The source-relative packet.
	 */
	resolveSourceRelativePosition(request = /** @type {GeometrySourceRelativePositionRequest} */ ({})) {
		const position = DistanceMath.toMetersPosition(request.position);
		const sourcePositionMeters = this._configuration.sourcePosition.coordinates;
		const sourceSubpointMeters = this._configuration.sourceSubpoint.coordinates;
		const toSource = VectorMath.subtract(sourcePositionMeters, position);
		const distanceFromSourceMeters = VectorMath.length(toSource);
		const directionToSourceVector =
			distanceFromSourceMeters <= FLAT_GEOMETRY_BOUNDARY_EPSILON
				? [0, 0, 1]
				: VectorMath.scale(toSource, 1 / distanceFromSourceMeters);
		const directionToSource = /** @type {UnitVector3} */ ([
			directionToSourceVector[0],
			directionToSourceVector[1],
			directionToSourceVector[2],
		]);
		const sourceSubpointDelta = VectorMath.subtract(position, sourceSubpointMeters);

		const directionFromSourceVector = VectorMath.scale(directionToSource, -1);
		const directionFromSource = /** @type {UnitVector3} */ ([
			directionFromSourceVector[0],
			directionFromSourceVector[1],
			directionFromSourceVector[2],
		]);

		return {
			directionFromSource,
			directionToSource,
			distanceFromSource: DistanceMath.inMeters(distanceFromSourceMeters),
			radialDistanceFromSourceSubpoint: DistanceMath.inMeters(
				Math.hypot(sourceSubpointDelta[0], sourceSubpointDelta[1]),
			),
			altitude: DistanceMath.inMeters(position[2]),
			metadata: {
				sourcePosition: this._configuration.sourcePosition,
				sourceSubpoint: this._configuration.sourceSubpoint,
			},
		};
	}

	/** @returns {CelestialContributionDomainDescription} - The one-texel source-relative domain. */
	describeCelestialContributionDomain() {
		this._assertConfigured();
		const facts = {
			id: 'flat-local-finite-sun-source-relative-domain-v1',
			family: /** @type {const} */ ('flat-local-finite-sun-v1'),
			altitudeNodes: [DistanceMath.inMeters(0)],
			directionCoordinates: [0],
		};
		return {...facts, contentHash: CanonicalValueHash.sha256Value(facts)};
	}

	/**
	 * Call this method to resolve the configured local-Sun center in Flat model space.
	 *
	 * @param {CelestialPlacementResolutionRequest} request - Accepted roster and observation.
	 * @returns {readonly CelestialResolvedPlacement[]} - Sole finite-Sun placement.
	 */
	resolveCelestialPlacements(request) {
		this._assertConfigured();
		if (request.roster.family !== 'flat-local-finite-sun-v1') {
			throw new RangeError('FlatEarthGeometry requires the flat-local-finite-sun-v1 roster.');
		}
		const definition = request.roster.localSun.celestialSourceDefinition;
		if (definition.centerHeight.value !== this._configuration.sourcePosition.coordinates[2]) {
			throw new RangeError('Flat finite-Sun definition center height must match geometry placement.');
		}
		return [{sourceId: definition.id, kind: 'finite-local-sun', center: this._configuration.sourcePosition}];
	}

	/**
	 * Call this method to describe the sole source-relative construction sample.
	 *
	 * @param {CelestialBuildSampleRequest} request - Domain, placement, and coordinates.
	 * @returns {CelestialBuildSample} - Geometry-owned finite-source sample.
	 */
	createCelestialBuildSample(request) {
		if (
			request.domain.family !== 'flat-local-finite-sun-v1' ||
			request.placement.kind !== 'finite-local-sun' ||
			request.receiverIndex !== 0 ||
			request.directionIndex !== 0
		) {
			throw new RangeError('Flat finite-Sun construction sample requires its sole source-relative coordinate.');
		}
		const receiverPosition = this._configuration.observerPosition;
		const relative = this.resolveSourceRelativePosition({position: receiverPosition});
		const sourcePath = this.resolveAtmospherePath({
			ray: {origin: receiverPosition, direction: relative.directionToSource},
			sourcePathLimit: {maxDistance: relative.distanceFromSource, reason: 'finite-local-source-distance'},
		});
		return {
			sourceId: request.placement.sourceId,
			receiverPosition,
			directionToSource: relative.directionToSource,
			atmosphereCoordinate: this.resolveAtmosphereCoordinate(receiverPosition),
			sourcePath,
			supported: true,
		};
	}

	/**
	 * Call this method to create immutable Flat finite-Sun query facts.
	 *
	 * @param {CelestialSourceRoster} roster - Accepted Flat roster.
	 * @param {readonly CelestialResolvedPlacement[]} placements - Geometry placements.
	 * @returns {FlatFiniteSunCelestialQueryPacket} - Complete query packet.
	 */
	createCelestialQueryPacket(roster, placements) {
		if (roster.family !== 'flat-local-finite-sun-v1' || placements.length !== 1) {
			throw new RangeError('Flat finite-Sun query requires one matching placement.');
		}
		const placement = placements[0];
		if (placement.kind !== 'finite-local-sun' || placement.sourceId !== roster.localSun.id) {
			throw new RangeError('Flat finite-Sun query placement does not match its roster source.');
		}
		const domain = this.describeCelestialContributionDomain();
		const facts = {
			family: /** @type {const} */ ('flat-local-finite-sun-v1'),
			domainIdentity: domain.contentHash,
			observation: this._configuration.observation,
			receiverPosition: this._configuration.observerPosition,
			sun: {placement},
		};
		return {...facts, contentHash: CanonicalValueHash.sha256Value(facts)};
	}

	/**
	 * Call this method to publish no additional stencil for the source-relative field.
	 *
	 * @param {CelestialCacheShaderContributionRequest} _request - Trusted query request.
	 * @returns {ShaderContribution} - Empty geometry-owned celestial contribution.
	 */
	createCelestialCacheShaderContribution(_request) {
		return {
			id: 'geometry-flat-finite-sun-source-relative-query',
			owner: 'geometry',
			provides: [],
			requires: [],
			defines: [],
			uniforms: [],
			textures: [],
			functions: [],
			mainHooks: [],
			bindingRequirements: [],
			diagnostics: {family: 'flat-local-finite-sun-v1'},
		};
	}

	/**
	 * Call this method to resolve bilinear final-view interpolation over the selected z/rho grid.
	 *
	 * @param {FlatScatteringCachePositionStencilRequest} request - The
	 * physical coordinates and an optional matching position domain.
	 *
	 * @returns {ScatteringCachePositionStencil} - The weighted taps, with up to four entries.
	 */
	resolveScatteringCachePositionStencil(request) {
		return this._scatteringCacheGeometry.resolveScatteringCachePositionStencil(request);
	}

	/**
	 * Call this method to resolve bilinear construction interpolation over the selected z/rho grid.
	 *
	 * @param {FlatScatteringCachePositionStencilRequest} request - The
	 * physical coordinates and an optional matching position domain.
	 *
	 * @returns {ScatteringCachePositionStencil} - The weighted taps, with up to four entries.
	 */
	resolveScatteringCacheConstructionPositionStencil(request) {
		return this._scatteringCacheGeometry.resolveScatteringCacheConstructionPositionStencil(request);
	}

	/**
	 * Call this method to express a physical outgoing direction in the radial/tangent/vertical frame.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - The physical
	 * position and direction.
	 *
	 * @returns {UnitVector3} - The source-local direction.
	 */
	expressScatteringCacheDirection(request) {
		return this._scatteringCacheGeometry.expressScatteringCacheDirection(request);
	}

	/**
	 * Call this method to resolve a physical outgoing direction through W27 reconstruction.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - The physical
	 * position and direction.
	 *
	 * @returns {ScatteringCacheDirectionStencil} - The up to four W27 taps.
	 */
	resolveScatteringCacheDirectionStencil(request) {
		return this._scatteringCacheGeometry.resolveScatteringCacheDirectionStencil(request);
	}

	/** Call this method to resolve geometry-owned compact spatial and per-tap W27 angular support.
	 * Axis taps use the retained canonical-meridian limit; ordinary taps use the query radial frame.
	 *
	 * @param {FlatCompactReconstructionRequest} request - Paired compact topology and physical query.
	 * @returns {readonly FlatCompactReconstructionTap[]} - Positive spatial taps with separate angular support.
	 * @throws {RangeError} - Topology pairing or complete query support is invalid.
	 * @throws {TypeError} - Physical position or topology bounds lack finite supported distance units.
	 * @throws {Error} - A finite source has not been configured.
	 */
	resolveCompactLocalSunCacheStencil(request) {
		if (this._scatteringCacheGeometry === null)
			throw new Error('Configure the finite source before compact reconstruction.');
		return this._scatteringCacheGeometry.resolveCompactLocalSunCacheStencil(request);
	}

	/** Call this method to resolve an allocated compact node's canonical physical position.
	 *
	 * @param {FlatCompactNodePositionRequest} request - Paired topology and allocated address.
	 * @returns {Position} - Geometry-owned physical node position.
	 * @throws {RangeError} - Pairing, address or complete support is invalid.
	 * @throws {TypeError} - Physical dimensions lack supported finite units.
	 * @throws {Error} - A finite source has not been configured.
	 */
	resolveCompactLocalSunCacheNodePosition(request) {
		if (this._scatteringCacheGeometry === null)
			throw new Error('Configure the finite source before compact node placement.');
		return this._scatteringCacheGeometry.resolveCompactLocalSunCacheNodePosition(request);
	}

	/**
	 * Call this method to express one radial-frame cache direction in physical model space.
	 *
	 * @param {FlatScatteringCacheFramedDirectionRequest} request - The
	 * physical position and source-local direction.
	 *
	 * @returns {UnitVector3} - The physical direction.
	 */
	expressPhysicalScatteringCacheDirection(request) {
		return this._scatteringCacheGeometry.expressPhysicalScatteringCacheDirection(request);
	}

	/** Call this method to create a geometry-owned compact ray and boundary-aware sample transform.
	 *
	 * @param {FlatCompactRayRequest} request - Paired compact support and physical ray.
	 * @returns {FlatCompactRay} - Finite supported ray, with explicit physical/shortened boundary semantics.
	 * @throws {RangeError} - Pairing, support, direction or shortening is invalid.
	 */
	resolveCompactLocalSunCacheRay(request) {
		if (!this._configuration || !this._scatteringCacheGeometry)
			throw new RangeError('Configured finite source required for compact rays.');
		return this._scatteringCacheGeometry.resolveCompactLocalSunCacheRay(request);
	}

	/**
	 * Call this method to resolve a source-owned cache coordinate into its reusable physical ray.
	 *
	 * Ground-bound rays retain the atmosphere segment up to their hit. The
	 * observer dome and scene cap never enter this reusable construction path.
	 *
	 * @param {CacheBuildCoordinate} coordinate - The cache coordinate.
	 * @returns {RaySegment} - The finite construction segment.
	 */
	resolveCacheBuildRay(coordinate) {
		return this._scatteringCacheGeometry.resolveCacheBuildRay(coordinate);
	}

	/**
	 * Call this method to map an observer-local scene point to flat model-space meters.
	 *
	 * @param {ScenePosition} point - The observer-local point.
	 * @param {GeometrySceneScaleRequest} [request] - The scale facts.
	 * @returns {Position} - The model-space position.
	 */
	mapObserverLocalScenePointToModelPosition(point, request = {}) {
		return this._sceneAdapter.mapObserverLocalScenePointToModelPosition(point, request);
	}

	/**
	 * Call this method to map an observer-local scene direction to flat model-space direction.
	 *
	 * @param {UnitVector3} direction - The observer-local direction.
	 * @returns {UnitVector3} - The model-space direction.
	 */
	mapObserverLocalSceneDirectionToModelDirection(direction) {
		return this._sceneAdapter.mapObserverLocalSceneDirectionToModelDirection(direction);
	}

	/**
	 * Call this method to map an app-authored ground offset to the configured Three scene point.
	 *
	 * @param {ScenePosition} offset - The horizontal scene offset.
	 * @param {GeometryGroundOffsetScenePointRequest} [request] - The optional height above ground.
	 * @returns {ScenePosition} - The configured Three scene point.
	 */
	mapGroundOffsetToScenePoint(offset, request = {}) {
		return this._sceneAdapter.mapGroundOffsetToScenePoint(offset, request);
	}

	/**
	 * Call this method to project a scene point to the flat ground plane along a scene direction.
	 *
	 * @param {ScenePosition} point - The scene point to project.
	 * @param {unknown} direction - The scene projection direction.
	 * @returns {ScenePosition} - The projected ground point in scene units.
	 */
	projectScenePointToGroundAlongDirection(point, direction) {
		return this._sceneAdapter.projectScenePointToGroundAlongDirection(point, direction);
	}

	/**
	 * Call this method to map a flat model-space position to an observer-local scene point.
	 *
	 * @param {Position} position - The model-space position.
	 * @param {GeometrySceneScaleRequest} [request] - The scale facts.
	 * @returns {ScenePosition} - The observer-local scene point.
	 */
	mapModelPositionToObserverLocalScenePoint(position, request = {}) {
		return this._sceneAdapter.mapModelPositionToObserverLocalScenePoint(position, request);
	}

	/**
	 * Call this method to create geometry-owned Three ground endpoint objects.
	 *
	 * @param {GeometryThreeEndpointObjectsRequest} [request] - The scene
	 * scale, material, segmentation, and metadata overrides.
	 *
	 * @returns {GeometryThreeEndpointObjects} - The geometry-owned endpoint objects.
	 */
	createThreeEndpointObjects(request = {}) {
		return this._sceneAdapter.createThreeEndpointObjects(request);
	}

	/**
	 * Call this method to resolve the scene-depth capture cap for geometry-owned flat endpoints.
	 *
	 * @param {GeometrySceneDepthMaxRequest} [request] - The optional
	 * endpoint extent and minimum cap policy.
	 *
	 * @returns {Distance} - The scene-depth cap.
	 */
	resolveSceneDepthMax(request = {}) {
		return this._sceneAdapter.resolveSceneDepthMax(request);
	}
}
