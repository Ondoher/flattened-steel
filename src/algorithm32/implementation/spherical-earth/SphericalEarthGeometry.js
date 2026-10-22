import {SphericalGeometryCacheModuleProvider} from './SphericalGeometryCacheModuleProvider.js';
import {SphericalGeometryShaderContributor} from './SphericalGeometryShaderContributor.js';
import {SphericalStellarGenerationShaderContributor} from './SphericalStellarGenerationShaderContributor.js';
import {SphericalScatteringCacheGeometry} from './SphericalScatteringCacheGeometry.js';
import {SphericalGeometrySceneAdapter} from './three/SphericalGeometrySceneAdapter.js';
import {SphericalCelestialContributionDomain} from './celestial/SphericalCelestialContributionDomain.js';
import {GeometryDirections} from '../../geometry-support/GeometryDirections.js';
import {SolarPosition} from '../../geometry-support/solar/SolarPosition.js';
import AngleMath from '../../math/AngleMath.js';
import DistanceMath from '../../math/DistanceMath.js';
import VectorMath from '../../math/VectorMath.js';
import {
	SPHERICAL_CELESTIAL_CAPABILITY_FAMILY,
	SPHERICAL_GROUND_BOUNDARY_ROUNDOFF_ULPS,
	SPHERICAL_MODEL_SPACE_SCENE_FRAME,
} from './consts.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
} from '../../sampling-domains/index.js';

/**
 * Spherical radial geometry for distant-source atmosphere transport.
 *
 * @implements {GeometryModel}
 * @implements {CacheBuildContributor}
 * @implements {CacheTransportDataProvider}
 * @implements {CelestialGeometryCapability}
 * @implements {StellarScreenPaletteGeometryCapability}
 * @implements {DistantSunCelestialCacheModuleContributor}
 */
export class SphericalEarthGeometry {
	/**
	 * Called by spherical source transforms to express one global Z-up body direction in the configured model frame.
	 *
	 * @param {UnitVector3} bodyDirection - Global right-handed Z-up direction.
	 * @param {GeometryObservation} observation - Configured receiver observation.
	 * @returns {UnitVector3} - Model-space direction.
	 */
	expressCelestialDirectionInModel(bodyDirection, observation) {
		const observerLatitudeRadians = AngleMath.toRadians(observation.location.latitude);
		const observerLongitudeRadians = AngleMath.toRadians(observation.location.longitude);
		const observerSurfaceDirection = [
			Math.cos(observerLatitudeRadians) * Math.cos(observerLongitudeRadians),
			Math.cos(observerLatitudeRadians) * Math.sin(observerLongitudeRadians),
			Math.sin(observerLatitudeRadians),
		];
		const eastDirection = [-Math.sin(observerLongitudeRadians), Math.cos(observerLongitudeRadians), 0];
		const northDirection = [
			-Math.sin(observerLatitudeRadians) * Math.cos(observerLongitudeRadians),
			-Math.sin(observerLatitudeRadians) * Math.sin(observerLongitudeRadians),
			Math.cos(observerLatitudeRadians),
		];
		const upComponent = VectorMath.dot(bodyDirection, observerSurfaceDirection);
		const eastComponent = VectorMath.dot(bodyDirection, eastDirection);
		const northComponent = VectorMath.dot(bodyDirection, northDirection);
		const sceneFrame = this._shapeConfiguration.sceneFrame;
		const modelDirection = VectorMath.add(
			VectorMath.add(
				VectorMath.scale(sceneFrame.up, upComponent),
				VectorMath.scale(sceneFrame.right, eastComponent),
			),
			VectorMath.scale(sceneFrame.forward, -northComponent),
		);
		const normalizedDirection = VectorMath.normalize(modelDirection);

		return /** @type {UnitVector3} */ ([normalizedDirection[0], normalizedDirection[1], normalizedDirection[2]]);
	}

	/** Express one model-space celestial direction in the configured Three scene axes. */
	expressCelestialDirectionInScene(modelDirection) {
		GeometryDirections.directionTuple(modelDirection, 'modelDirection');
		const frame = this._shapeConfiguration.sceneFrame;
		const sceneDirection = VectorMath.normalize([
			VectorMath.dot(modelDirection, frame.right),
			VectorMath.dot(modelDirection, frame.up),
			VectorMath.dot(modelDirection, frame.forward),
		]);

		return /** @type {UnitVector3} */ ([sceneDirection[0], sceneDirection[1], sceneDirection[2]]);
	}

	/**
	 * Called by construction-time binding to resolve the distant source in the
	 * configured model frame.
	 *
	 * @param {GeometryObservation} observation - The normalized observation.
	 * @returns {UnitVector3} - The model-space direction toward the source.
	 */
	_resolveDirectionToSource(observation) {
		const sourceLocation = SolarPosition.resolveSubsolarLocation(observation.instant);
		const sourceLatitudeRadians = AngleMath.toRadians(sourceLocation.latitude);
		const sourceLongitudeRadians = AngleMath.toRadians(sourceLocation.longitude);
		const sourceBodyDirection = /** @type {UnitVector3} */ ([
			Math.cos(sourceLatitudeRadians) * Math.cos(sourceLongitudeRadians),
			Math.cos(sourceLatitudeRadians) * Math.sin(sourceLongitudeRadians),
			Math.sin(sourceLatitudeRadians),
		]);

		return this.expressCelestialDirectionInModel(sourceBodyDirection, observation);
	}

	/**
	 * Resolve the live distant-Sun placement and observer solar zenith from one
	 * observation before binding a source. This is the authoritative placement
	 * calculation used by both Flat32 cache selection and configureLightSource().
	 *
	 * @param {GeometryObservation} observation - The normalized observation.
	 * @returns {Readonly<{directionToSourceModel: UnitVector3, observerSolarZenith: Angle}>} - Live scene state.
	 */
	resolveDistantSunSceneState(observation) {
		const directionToSourceModel = this._resolveDirectionToSource(observation);
		const solarZenithCosine = Math.max(
			-1,
			Math.min(1, VectorMath.dot(directionToSourceModel, this._shapeConfiguration.observerUpDirection)),
		);

		return Object.freeze({
			directionToSourceModel,
			observerSolarZenith: AngleMath.inRadians(Math.acos(solarZenithCosine)),
		});
	}

	/** Require construction-time light-source placement. */
	_assertConfigured() {
		if (this._configuration === null) {
			throw new Error('SphericalEarthGeometry requires configureLightSource() before this operation.');
		}
	}
	/**
	 * Called by SphericalEarthGeometry construction to derive the observer-local scene frame.
	 *
	 * @param {UnitVector3} observerUpDirection - The observer up direction.
	 * @returns {SphericalEarthSceneFrame} - The derived observer-local frame.
	 */
	_makeObserverLocalSceneFrame(observerUpDirection) {
		const reference = /** @type {UnitVector3} */ (
			Math.abs(VectorMath.dot(observerUpDirection, [0, 0, 1])) < 0.95 ? [0, 0, 1] : [0, 1, 0]
		);
		const tangentVector = VectorMath.normalize(
			VectorMath.add(
				reference,
				VectorMath.scale(observerUpDirection, -VectorMath.dot(reference, observerUpDirection)),
			),
		);
		const tangent = /** @type {UnitVector3} */ ([tangentVector[0], tangentVector[1], tangentVector[2]]);
		const rightVector = VectorMath.normalize(VectorMath.cross(tangent, observerUpDirection));
		const forwardVector = VectorMath.scale(tangent, -1);

		return {
			kind: 'observer-local',
			up: observerUpDirection,
			right: /** @type {UnitVector3} */ [rightVector[0], rightVector[1], rightVector[2]],
			forward: /** @type {UnitVector3} */ [forwardVector[0], forwardVector[1], forwardVector[2]],
		};
	}

	/**
	 * Called by SphericalEarthGeometry construction to select the executable scene-to-model frame.
	 *
	 * @param {unknown} sceneFrame - The configured frame mode.
	 * @param {SphericalEarthSceneFrame} observerLocalSceneFrame - The derived observer-local frame.
	 * @returns {SphericalEarthSceneFrame} - The selected executable frame.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_normalizeSceneFrame(sceneFrame, observerLocalSceneFrame) {
		if (sceneFrame == null) {
			return observerLocalSceneFrame;
		}
		if (typeof sceneFrame !== 'object' || Array.isArray(sceneFrame)) {
			throw new TypeError('SphericalEarthGeometry sceneFrame must be an object.');
		}
		const candidate = /** @type {SphericalEarthSceneFrameConfig} */ (sceneFrame);

		if (candidate.kind === 'observer-local') {
			return observerLocalSceneFrame;
		}
		if (candidate.kind === 'model-space') {
			return SPHERICAL_MODEL_SPACE_SCENE_FRAME;
		}
		throw new RangeError('SphericalEarthGeometry sceneFrame.kind must be "observer-local" or "model-space".');
	}

	/**
	 * Creates spherical Earth geometry for the configured radii, observer, source, and cache policy.
	 *
	 * @param {SphericalEarthGeometryConfig} configuration - The radii, observer, source, cache, and integration policy.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('SphericalEarthGeometry configuration is required.');
		}

		const {
			bottomRadius,
			topRadius,
			observerHeight = {value: 0, units: 'meters'},
			observerUpDirection = [0, 0, 1],
			sceneFrame = null,
			cacheAltitudeBinCount = 1,
			cacheBoundaryAltitude = {value: 0, units: 'meters'},
			sourceTransmittanceIntervalCount = 10,
		} = configuration;

		DistanceMath.assertDistance(bottomRadius, 'bottomRadius');
		DistanceMath.assertDistance(topRadius, 'topRadius');
		DistanceMath.assertDistance(observerHeight, 'observerHeight');
		DistanceMath.assertDistance(cacheBoundaryAltitude, 'cacheBoundaryAltitude');
		const bottomRadiusMeters = DistanceMath.toMeters(bottomRadius);
		const topRadiusMeters = DistanceMath.toMeters(topRadius);
		const observerHeightMeters = DistanceMath.toMeters(observerHeight);
		const cacheBoundaryAltitudeMeters = DistanceMath.toMeters(cacheBoundaryAltitude);

		if (bottomRadiusMeters <= 0 || topRadiusMeters <= bottomRadiusMeters) {
			throw new RangeError('SphericalEarthGeometry requires positive radii with top above bottom.');
		}

		if (!Number.isInteger(cacheAltitudeBinCount) || cacheAltitudeBinCount < 1) {
			throw new RangeError('SphericalEarthGeometry cacheAltitudeBinCount must be a positive integer.');
		}

		if (!Number.isInteger(sourceTransmittanceIntervalCount) || sourceTransmittanceIntervalCount < 1) {
			throw new RangeError('SphericalEarthGeometry sourceTransmittanceIntervalCount must be a positive integer.');
		}

		const normalizedObserverUpDirection = GeometryDirections.normalizeDirection(
			observerUpDirection,
			'observerUpDirection',
		);
		const observerLocalSceneFrame = this._makeObserverLocalSceneFrame(normalizedObserverUpDirection);

		this._shapeConfiguration = {
			bottomRadius: DistanceMath.inMeters(bottomRadiusMeters),
			topRadius: DistanceMath.inMeters(topRadiusMeters),
			observerHeight: DistanceMath.inMeters(observerHeightMeters),
			observerUpDirection: normalizedObserverUpDirection,
			observerLocalSceneFrame,
			sceneFrame: this._normalizeSceneFrame(sceneFrame, observerLocalSceneFrame),
			cacheAltitudeBinCount,
			cacheBoundaryAltitude: DistanceMath.inMeters(cacheBoundaryAltitudeMeters),
			sourceTransmittanceIntervalCount,
		};
		/** @type {SphericalEarthGeometryConfiguration | null} */
		this._configuration = null;
		this._binding = null;
		this._scatteringCacheGeometry = null;
		this._cacheModuleProvider = null;
		this._shaderContributor = null;
		this._sceneAdapter = null;
		this._celestialContributionDomain = null;
	}

	/**
	 * Configure one distant source from the construction-time observation.
	 *
	 * @param {GeometryLightSourceConfigurationRequest} request - The source and observation.
	 */
	configureLightSource(request) {
		if (request.lightSource.geometryPlacementKind !== 'distant-direction') {
			throw new RangeError('SphericalEarthGeometry requires a distant-direction light source.');
		}
		if (request.placement !== undefined && request.placement.kind !== 'distant-direction') {
			throw new RangeError('SphericalEarthGeometry explicit placement must be a distant direction.');
		}
		const placement = /** @type {Readonly<{kind: 'distant-direction', directionToLight: UnitVector3}>} */ (
			request.placement ?? {
				kind: 'distant-direction',
				directionToLight: this.resolveDistantSunSceneState(request.observation).directionToSourceModel,
			}
		);
		GeometryDirections.directionTuple(placement.directionToLight, 'SphericalEarthGeometry directionToLight');
		if (request.placement !== undefined && Math.abs(VectorMath.length(placement.directionToLight) - 1) > 1e-12) {
			throw new RangeError('SphericalEarthGeometry explicit directionToLight must be a unit vector.');
		}
		const directionToSource =
			request.placement === undefined
				? GeometryDirections.normalizeDirection(
						placement.directionToLight,
						'SphericalEarthGeometry directionToLight',
					)
				: placement.directionToLight;
		if (this._binding !== null) {
			const sameObservation =
				this._binding.lightSource === request.lightSource &&
				this._binding.observation.instant === request.observation.instant &&
				AngleMath.toDegrees(this._binding.observation.location.latitude) ===
					AngleMath.toDegrees(request.observation.location.latitude) &&
				AngleMath.toDegrees(this._binding.observation.location.longitude) ===
					AngleMath.toDegrees(request.observation.location.longitude);
			const samePlacement = this._binding.placement.directionToLight.every(
				(value, index) => value === directionToSource[index],
			);
			if (sameObservation && samePlacement) return this._binding.placement;
			throw new Error('SphericalEarthGeometry light-source placement is already configured.');
		}

		const configuration = {...this._shapeConfiguration, directionToSource, observation: request.observation};
		const positionDomain = request.domains?.positions ?? NATIVE_48_POSITION_DOMAIN_OWNER;
		const outgoingDirectionDomain = request.domains?.outgoingDirections ?? CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER;
		const scatteringCacheGeometry = new SphericalScatteringCacheGeometry(
			configuration,
			positionDomain,
			outgoingDirectionDomain,
		);
		const cacheModuleProvider = new SphericalGeometryCacheModuleProvider(configuration, scatteringCacheGeometry);
		const shaderContributor = new SphericalGeometryShaderContributor(configuration, positionDomain);
		const sceneAdapter = new SphericalGeometrySceneAdapter(configuration);
		const celestialContributionDomain = new SphericalCelestialContributionDomain({
			geometry: this,
			bottomRadius: configuration.bottomRadius,
			topRadius: configuration.topRadius,
			observerHeight: configuration.observerHeight,
			observation: configuration.observation,
			lightSource: request.lightSource,
			directionToSource: configuration.directionToSource,
		});

		const normalizedPlacement =
			request.placement === undefined
				? /** @type {Readonly<{kind: 'distant-direction', directionToLight: UnitVector3}>} */ ({
						kind: 'distant-direction',
						directionToLight: directionToSource,
					})
				: placement;
		request.lightSource.configureGeometryPlacement(normalizedPlacement);
		this._configuration = configuration;
		this._binding = {
			lightSource: request.lightSource,
			observation: request.observation,
			placement: normalizedPlacement,
		};
		this._scatteringCacheGeometry = scatteringCacheGeometry;
		this._cacheModuleProvider = cacheModuleProvider;
		this._shaderContributor = shaderContributor;
		this._sceneAdapter = sceneAdapter;
		this._celestialContributionDomain = celestialContributionDomain;

		return normalizedPlacement;
	}

	/** Call this method to stage a same-shape live observation and observer elevation while retaining this geometry owner.
	 * Observer elevation is a runtime sampling position; it does not change the cached medium or sphere.
	 * @param {SphericalEarthGeometry} prepared - Independently configured candidate geometry.
	 * @param {GeometryLightSourceConfigurationRequest['lightSource']} lightSource - Stable source owner.
	 * @returns {() => void} - Assignment-only publication after caller-owned source direction changes.
	 */
	prepareSharedPublication(prepared, lightSource) {
		this._assertConfigured();
		prepared._assertConfigured();
		if (
			JSON.stringify({...this._shapeConfiguration, observerHeight: undefined}) !==
			JSON.stringify({...prepared._shapeConfiguration, observerHeight: undefined})
		)
			throw new RangeError(
				'Live shared-cache publication cannot change physical geometry or coordinate domains.',
			);
		const configuration = prepared._configuration;
		const domain = new SphericalCelestialContributionDomain({
			geometry: this,
			bottomRadius: configuration.bottomRadius,
			topRadius: configuration.topRadius,
			observerHeight: configuration.observerHeight,
			observation: configuration.observation,
			lightSource,
			directionToSource: configuration.directionToSource,
		});
		return () => {
			this._shapeConfiguration = prepared._shapeConfiguration;
			this._configuration = configuration;
			this._binding = {...prepared._binding, lightSource};
			this._scatteringCacheGeometry = prepared._scatteringCacheGeometry;
			this._cacheModuleProvider = prepared._cacheModuleProvider;
			this._shaderContributor = prepared._shaderContributor;
			this._sceneAdapter = prepared._sceneAdapter;
			this._celestialContributionDomain = domain;
		};
	}

	/**
	 * The immutable normalized geometry configuration.
	 *
	 * @returns {SphericalEarthGeometryConfiguration} - The normalized configuration.
	 */
	get configuration() {
		this._assertConfigured();
		return this._configuration;
	}

	/**
	 * The compatibility identifier for this configured geometry model.
	 *
	 * @returns {string} - The geometry identifier.
	 */
	get id() {
		return 'spherical-earth-geometry';
	}

	/** Spherical distant-Sun and stellar-point-set celestial capability family. */
	get celestialCapabilityFamily() {
		return SPHERICAL_CELESTIAL_CAPABILITY_FAMILY;
	}

	/** @returns {StellarEpochRelativeTransformIdentity} - Accepted fixed-observation stellar transform. */
	describeStellarEpochRelativeTransform() {
		return {
			precession: 'iau-2000-three-angle',
			siderealTime: 'usno-mean-sidereal-time',
			ut1Approximation: 'utc-as-ut1',
			terrestrialTimeApproximation: 'utc-as-tt',
			localFrame: 'east-north-up-rh-v1',
		};
	}

	/**
	 * Create geometry-owned stellar transform and projection shader operations.
	 *
	 * @param {Readonly<{readonly observation: GeometryObservation}>} request - Exact configured observation snapshot.
	 * @returns {StellarGenerationGeometryShaderContribution} - Geometry-owned generation-stage operations.
	 */
	createStellarGenerationShaderContribution(request) {
		this._assertConfigured();
		if (!Object.is(request.observation, this._configuration.observation)) {
			throw new RangeError('Spherical stellar generation requires the exact configured observation snapshot.');
		}

		return new SphericalStellarGenerationShaderContributor({
			geometry: this._configuration,
			observation: request.observation,
		}).createContribution();
	}

	/** @returns {CelestialContributionDomainDescription} - Geometry-owned spherical celestial domain. */
	describeCelestialContributionDomain() {
		this._assertConfigured();
		return this._celestialContributionDomain.describe();
	}

	/**
	 * Call this method to resolve spherical celestial sources in roster order.
	 *
	 * @param {CelestialPlacementResolutionRequest} request - Accepted roster and construction-time observation.
	 * @returns {readonly CelestialResolvedPlacement[]} - Sun followed by the optional stellar point set.
	 */
	resolveCelestialPlacements(request) {
		this._assertConfigured();
		return this._celestialContributionDomain.resolvePlacements(request);
	}

	/**
	 * Call this method to derive one spherical celestial construction sample.
	 *
	 * @param {CelestialBuildSampleRequest} request - Domain, placement, and coordinate indices.
	 * @returns {CelestialBuildSample} - Geometry-owned construction sample.
	 */
	createCelestialBuildSample(request) {
		this._assertConfigured();
		return this._celestialContributionDomain.createBuildSample(request);
	}

	/**
	 * Call this method to create the geometry-owned distant-Sun celestial cache module.
	 *
	 * @param {DistantSunCelestialCacheModuleContext} context - Exact celestial construction context.
	 * @returns {CacheBuildModule} - Geometry-owned cache module.
	 */
	createDistantSunCelestialCacheModule(context) {
		this._assertConfigured();
		return this._celestialContributionDomain.createDistantSunCelestialCacheModule(context);
	}

	/**
	 * Call this method to assemble one deterministic spherical celestial query packet.
	 *
	 * @param {CelestialSourceRoster} roster - Accepted spherical roster.
	 * @param {readonly CelestialResolvedPlacement[]} placements - Geometry-resolved placements in roster order.
	 * @returns {CelestialQueryPacket} - Complete spherical query packet.
	 */
	createCelestialQueryPacket(roster, placements) {
		this._assertConfigured();
		return this._celestialContributionDomain.createQueryPacket(roster, placements);
	}

	/**
	 * Call this method to contribute the geometry-owned celestial-cache stencil representation.
	 *
	 * @param {CelestialCacheShaderContributionRequest} request - Configured model and geometry query facts.
	 * @returns {ShaderContribution} - Spherical celestial-cache stencil type contribution.
	 */
	createCelestialCacheShaderContribution(request) {
		this._assertConfigured();
		return this._celestialContributionDomain.createCelestialCacheShaderContribution(request);
	}

	/**
	 * Internal geometry-owner seam used to place one celestial construction receiver.
	 *
	 * @param {Distance} altitude - Altitude above spherical ground.
	 * @returns {Position} - Retained-frame model position.
	 */
	createCelestialReceiverPositionAtAltitude(altitude) {
		this._assertConfigured();
		return DistanceMath.positionInMeters(this._originAtAltitude(DistanceMath.toMeters(altitude)));
	}

	/**
	 * Internal geometry-owner seam used to derive the local spherical horizon.
	 *
	 * @param {Position} position - Receiver position.
	 * @returns {number} - Horizon radial direction cosine.
	 */
	resolveCelestialHorizonRadialCosine(position) {
		this._assertConfigured();
		const receiver = DistanceMath.acceptPositionInMeters(position, 'Celestial horizon receiver');
		const radiusMeters = VectorMath.length(receiver);
		return -Math.sqrt(Math.max(0, 1 - (this._configuration.bottomRadius.value / radiusMeters) ** 2));
	}

	/**
	 * Internal geometry-owner seam that reuses current spherical contact classification.
	 *
	 * @param {Position} position - Receiver position.
	 * @param {UnitVector3} direction - Receiver-to-source direction.
	 * @returns {boolean} - Whether spherical ground blocks the direction.
	 */
	isCelestialDirectionGroundBlocked(position, direction) {
		this._assertConfigured();
		return this.distanceToGroundBoundary(position, direction) !== null;
	}

	/** @param {Algorithm32ExecutionDomains} domains - Accepted execution domains. */
	configureExecutionDomains(domains) {
		this._assertConfigured();
		this._scatteringCacheGeometry.configureExecutionDomains(domains);
		this._shaderContributor.configureExecutionDomains(domains);
	}

	/**
	 * Call this method to build geometry-resolved packed Jk-to-Lk transport data.
	 *
	 * @param {CacheTransportDataRequest} request - The physical transport collaborators.
	 * @returns {CacheTransportData} - The reusable packed transport data.
	 */
	createTransportData(request) {
		return this._scatteringCacheGeometry.createTransportData(request);
	}

	/**
	 * Call this method to create spherical construction coordinates and symbols for one cache pass.
	 *
	 * @param {CacheBuildContext} context - The resolved logical pass.
	 * @returns {CacheBuildModule} - The geometry-owned construction module.
	 */
	createCacheModule(context) {
		return this._cacheModuleProvider.createCacheModule(context);
	}

	/**
	 * Call this method to resolve distance to the top atmosphere sphere.
	 *
	 * @param {Position} origin - The ray origin.
	 * @param {UnitVector3} direction - The ray direction.
	 * @returns {number} - The distance to the boundary.
	 */
	distanceToTopAtmosphereBoundary(origin, direction) {
		const originVector = DistanceMath.acceptPositionInMeters(origin, 'Top boundary origin');
		const directionVector = GeometryDirections.normalizeDirection(direction, 'Top boundary direction');
		const radius = VectorMath.length(originVector);
		const radialDirectionCosine = VectorMath.dot(originVector, directionVector) / radius;
		const discriminant =
			radius * radius * (radialDirectionCosine * radialDirectionCosine - 1) +
			this._configuration.topRadius.value * this._configuration.topRadius.value;

		return Math.max(0, -radius * radialDirectionCosine + Math.sqrt(Math.max(0, discriminant)));
	}

	/**
	 * Call this method to resolve distance to the ground sphere when the ray hits it.
	 *
	 * @param {Position} origin - The ray origin.
	 * @param {UnitVector3} direction - The ray direction.
	 * @returns {number | null} - The distance to the boundary, or null.
	 */
	distanceToGroundBoundary(origin, direction) {
		const originVector = DistanceMath.acceptPositionInMeters(origin, 'Ground boundary origin');
		const directionVector = GeometryDirections.normalizeDirection(direction, 'Ground boundary direction');
		const radius = VectorMath.length(originVector);
		const radialDirectionCosine = VectorMath.dot(originVector, directionVector) / radius;
		// An inward ray starting on the surface intersects at zero before any root subtraction.
		if (radius === this._configuration.bottomRadius.value && radialDirectionCosine < 0) {
			return 0;
		}
		const discriminant =
			radius * radius * (radialDirectionCosine * radialDirectionCosine - 1) +
			this._configuration.bottomRadius.value * this._configuration.bottomRadius.value;

		if (radialDirectionCosine >= 0 || discriminant < 0) {
			return null;
		}

		const distance = -radius * radialDirectionCosine - Math.sqrt(discriminant);
		const boundaryTolerance =
			SPHERICAL_GROUND_BOUNDARY_ROUNDOFF_ULPS *
			Number.EPSILON *
			Math.max(1, this._configuration.bottomRadius.value, radius);

		return distance >= -boundaryTolerance ? Math.max(0, distance) : null;
	}

	/**
	 * Call this method to resolve the nearest spherical ground hit along a physical ray. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {Ray} viewRay - The physical ray.
	 * @returns {GroundIntersection | null} - The geometry-owned ground hit, or null.
	 */
	resolveGroundIntersection(viewRay) {
		const origin = DistanceMath.acceptPositionInMeters(viewRay.origin, 'Ground intersection origin');
		const direction = GeometryDirections.normalizeDirection(viewRay.direction, 'Ground intersection direction');
		const distance = this.distanceToGroundBoundary(DistanceMath.positionInMeters(origin), direction);

		if (distance === null) {
			return null;
		}

		const hitPosition = VectorMath.addScaled(origin, direction, distance);
		const normalVector = VectorMath.normalize(hitPosition);
		const normal = /** @type {UnitVector3} */ ([normalVector[0], normalVector[1], normalVector[2]]);

		return {
			position: DistanceMath.positionInMeters(hitPosition),
			normal,
			distance: DistanceMath.inMeters(distance),
		};
	}

	/**
	 * Called by spherical ray resolution to select the first atmosphere or ground boundary.
	 *
	 * @param {readonly number[]} origin - The normalized ray origin in meters.
	 * @param {UnitVector3} direction - The normalized ray direction.
	 * @returns {number} - The non-negative exit distance in meters.
	 */
	_resolveAtmosphereExitDistance(origin, direction) {
		const originPosition = DistanceMath.positionInMeters(origin);
		const topDistance = this.distanceToTopAtmosphereBoundary(originPosition, direction);
		const groundDistance = this.distanceToGroundBoundary(originPosition, direction);

		if (groundDistance !== null && groundDistance >= 0 && groundDistance < topDistance) {
			return groundDistance;
		}

		return topDistance;
	}

	/**
	 * Called by spherical path and cache construction to place one altitude along observer up.
	 *
	 * @param {number} altitudeMeters - The altitude above ground in meters.
	 * @returns {readonly number[]} - The model position in meters.
	 */
	_originAtAltitude(altitudeMeters) {
		return VectorMath.scale(
			this._configuration.observerUpDirection,
			this._configuration.bottomRadius.value + altitudeMeters,
		);
	}

	/**
	 * Call this method to resolve model-space position into altitude-only atmosphere coordinates.
	 *
	 * @param {Position} position - The model-space position.
	 * @returns {AtmosphereCoordinate} - The atmosphere coordinate.
	 */
	resolveAtmosphereCoordinate(position) {
		const vector = DistanceMath.acceptPositionInMeters(position, 'Atmosphere position');

		return {
			altitude: DistanceMath.inMeters(VectorMath.length(vector) - this._configuration.bottomRadius.value),
		};
	}

	/**
	 * Call this method to reconstruct one executable native construction position.
	 *
	 * @param {PositionDomainNode} positionNode - The selected altitude node.
	 * @returns {Position} - The physical construction position.
	 */
	resolveScatteringCacheConstructionPosition(positionNode) {
		return this._scatteringCacheGeometry.resolveScatteringCacheConstructionPosition(positionNode);
	}

	/**
	 * Call this method to express a model-space position relative to the observer-side ground anchor.
	 *
	 * @param {Position} position - The model-space position.
	 * @returns {Position} - The ground-anchor-relative position in meters.
	 */
	resolveGroundRelativePosition(position) {
		const modelPositionMeters = DistanceMath.acceptPositionInMeters(position, 'Ground-relative model position');
		const groundAnchorMeters = VectorMath.scale(
			this._configuration.observerUpDirection,
			this._configuration.bottomRadius.value,
		);

		return DistanceMath.positionInMeters(VectorMath.subtract(modelPositionMeters, groundAnchorMeters));
	}

	/**
	 * Called by atmosphere-path resolution to build trapezoidal samples over a normalized ray segment.
	 *
	 * @param {SphericalAtmospherePathRay} viewRay - The normalized physical ray.
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
	 * Called by atmosphere-path resolution to build a zero-length path blocked by spherical ground.
	 *
	 * @param {readonly number[]} position - The physical position in meters.
	 * @returns {AtmospherePath} - The blocked path.
	 */
	_blockedPath(position) {
		const coordinate = this.resolveAtmosphereCoordinate(DistanceMath.positionInMeters(position));

		return {
			start: coordinate,
			end: coordinate,
			length: DistanceMath.inMeters(0),
			samples: [],
			blockedByGround: true,
		};
	}

	/**
	 * Call this method to resolve an altitude into the retained construction cache bin.
	 *
	 * @param {number} altitudeMeters - The altitude in meters.
	 * @returns {number} - The cache altitude bin index.
	 */
	altitudeToCacheBinIndex(altitudeMeters) {
		return this._scatteringCacheGeometry.altitudeToCacheBinIndex(altitudeMeters);
	}

	/**
	 * Call this method to create the geometry-owned spherical shader contribution.
	 *
	 * @returns {ShaderContribution} - The geometry shader contribution.
	 */
	createShaderContribution() {
		return this._shaderContributor.createShaderContribution();
	}

	/**
	 * Call this method to resolve a finite view ray segment for atmosphere transport.
	 *
	 * @param {GeometryViewRayRequest} [request] - The ray request facts.
	 * @returns {RaySegment} - The clipped ray segment.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	resolveViewRaySegment(request = {}) {
		const originValue = request.origin;
		const origin =
			originValue === undefined
				? this._originAtAltitude(this._configuration.observerHeight.value)
				: DistanceMath.acceptPositionInMeters(originValue, 'View ray origin');
		const direction = GeometryDirections.normalizeDirection(
			request.direction === undefined ? [0, 0, 1] : request.direction,
			'View ray direction',
		);
		const groundBoundaryMode = request.groundBoundaryMode === undefined ? 'clip' : request.groundBoundaryMode;

		if (!['clip', 'scene-hit-owned'].includes(groundBoundaryMode)) {
			throw new RangeError('groundBoundaryMode must be "clip" or "scene-hit-owned".');
		}

		let endDistanceMeters =
			groundBoundaryMode === 'scene-hit-owned'
				? this.distanceToTopAtmosphereBoundary(DistanceMath.positionInMeters(origin), direction)
				: this._resolveAtmosphereExitDistance(origin, direction);
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
	 * Call this method to resolve a model-space ray into an atmosphere path. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {AtmospherePathRequest} request - The path request facts.
	 * @returns {AtmospherePath} - The atmosphere path.
	 */
	resolveAtmospherePath(request) {
		const viewRay = request.ray;
		const origin = DistanceMath.toMetersPosition(viewRay.origin);
		const direction = GeometryDirections.normalizeTrustedDirection(viewRay.direction, 'Atmosphere path direction');
		const startDistanceMeters =
			request.startDistance === undefined ? 0 : DistanceMath.toMeters(request.startDistance);
		let endDistanceMeters = request.endDistance === undefined ? null : DistanceMath.toMeters(request.endDistance);

		if (endDistanceMeters === null) {
			const originPosition = DistanceMath.positionInMeters(origin);
			const groundDistance = this.distanceToGroundBoundary(originPosition, direction);

			if (groundDistance !== null && groundDistance >= 0) {
				return this._blockedPath(origin);
			}

			endDistanceMeters = this.distanceToTopAtmosphereBoundary(originPosition, direction);
		}

		const sourceLimitMeters =
			request.sourcePathLimit?.maxDistance === null || request.sourcePathLimit === undefined
				? null
				: DistanceMath.toMeters(request.sourcePathLimit.maxDistance);
		if (sourceLimitMeters !== null) {
			endDistanceMeters = Math.min(endDistanceMeters, sourceLimitMeters);
		}

		const sampleCount =
			request.sampleCount === undefined
				? this._configuration.sourceTransmittanceIntervalCount
				: request.sampleCount;
		const samples = this._buildAtmospherePathSamples(
			{origin, direction},
			startDistanceMeters,
			Math.max(startDistanceMeters, endDistanceMeters),
			sampleCount,
		);
		const start =
			samples[0]?.atmosphereCoordinate ?? this.resolveAtmosphereCoordinate(DistanceMath.positionInMeters(origin));
		const endingAtmosphereCoordinate = samples[samples.length - 1]?.atmosphereCoordinate ?? start;

		return {
			start,
			end: endingAtmosphereCoordinate,
			length: DistanceMath.inMeters(Math.max(0, endDistanceMeters - startDistanceMeters)),
			samples,
			metadata: {
				startDistance: DistanceMath.inMeters(startDistanceMeters),
				endDistance: DistanceMath.inMeters(endDistanceMeters),
			},
		};
	}

	/**
	 * Call this method to resolve the configured distant source-relative directions.
	 *
	 * @param {GeometrySourceRelativePositionRequest} [_request] - The accepted source-relative request.
	 * @returns {SourceRelativePosition} - The source-relative packet.
	 */
	resolveSourceRelativePosition(_request = /** @type {GeometrySourceRelativePositionRequest} */ ({})) {
		const directionToSource = this._configuration.directionToSource;
		const directionFromSourceVector = VectorMath.scale(directionToSource, -1);
		const directionFromSource = /** @type {UnitVector3} */ ([
			directionFromSourceVector[0],
			directionFromSourceVector[1],
			directionFromSourceVector[2],
		]);

		return {
			directionFromSource,
			directionToSource,
			distanceFromSource: null,
		};
	}

	/**
	 * Call this method to resolve final-view interpolation over the actual Native-48 altitude nodes.
	 *
	 * @param {ScatteringCachePositionStencilRequest} request - The physical position and atmosphere coordinate.
	 * @returns {ScatteringCachePositionStencil} - The resolved physical position stencil.
	 */
	resolveScatteringCachePositionStencil(request) {
		return this._scatteringCacheGeometry.resolveScatteringCachePositionStencil(request);
	}

	/**
	 * Call this method to resolve the retained containing-altitude-bin construction lookup.
	 *
	 * @param {ScatteringCachePositionStencilRequest} request - The physical position and atmosphere coordinate.
	 * @returns {ScatteringCachePositionStencil} - The exact construction tap.
	 */
	resolveScatteringCacheConstructionPositionStencil(request) {
		return this._scatteringCacheGeometry.resolveScatteringCacheConstructionPositionStencil(request);
	}

	/**
	 * Call this method to express a physical direction in the executable W27 frame.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - The physical position and outgoing direction.
	 * @returns {UnitVector3} - The source-local direction.
	 */
	expressScatteringCacheDirection(request) {
		return this._scatteringCacheGeometry.expressScatteringCacheDirection(request);
	}

	/**
	 * Call this method to resolve a physical outgoing direction through W27 reconstruction.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - The physical position and outgoing direction.
	 * @returns {ScatteringCacheDirectionStencil} - The W27 stencil.
	 */
	resolveScatteringCacheDirectionStencil(request) {
		return this._scatteringCacheGeometry.resolveScatteringCacheDirectionStencil(request);
	}

	/**
	 * Call this method to express one W27 scattering direction in physical model space.
	 *
	 * @param {ScatteringCacheFramedDirectionRequest} request - The executable cache direction.
	 * @returns {UnitVector3} - The physical direction.
	 */
	expressPhysicalScatteringCacheDirection(request) {
		return this._scatteringCacheGeometry.expressPhysicalScatteringCacheDirection(request);
	}

	/**
	 * Call this method to express one incoming-radiance direction in physical model space.
	 *
	 * @param {UnitVector3} cacheDirection - The Fibonacci direction.
	 * @returns {UnitVector3} - The physical direction.
	 */
	expressPhysicalIncomingRadianceDirection(cacheDirection) {
		return this._scatteringCacheGeometry.expressPhysicalIncomingRadianceDirection(cacheDirection);
	}

	/**
	 * Call this method to express one outgoing-scattering direction in physical model space.
	 *
	 * @param {UnitVector3} cacheDirection - The W27 direction.
	 * @returns {UnitVector3} - The physical direction.
	 */
	expressPhysicalOutgoingScatteringDirection(cacheDirection) {
		return this._scatteringCacheGeometry.expressPhysicalOutgoingScatteringDirection(cacheDirection);
	}

	/**
	 * Call this method to map an observer-local scene point into spherical model space.
	 *
	 * @param {ScenePosition} point - The observer-local point.
	 * @param {GeometrySceneScaleRequest} [request] - The scene-scale facts.
	 * @returns {Position} - The model-space position.
	 */
	mapObserverLocalScenePointToModelPosition(point, request = {}) {
		return this._sceneAdapter.mapObserverLocalScenePointToModelPosition(point, request);
	}

	/**
	 * Call this method to map an observer-local scene direction into spherical model space.
	 *
	 * @param {UnitVector3} direction - The observer-local direction.
	 * @returns {UnitVector3} - The model-space direction.
	 */
	mapObserverLocalSceneDirectionToModelDirection(direction) {
		return this._sceneAdapter.mapObserverLocalSceneDirectionToModelDirection(direction);
	}

	/**
	 * Call this method to resolve a cache-owned coordinate into its construction ray. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {CacheBuildCoordinate} coordinate - The cache coordinate.
	 * @returns {RaySegment | null} - The ray segment, or null when ground-blocked.
	 */
	resolveCacheBuildRay(coordinate) {
		const altitudeMeters = DistanceMath.toMeters(coordinate.altitude);
		const incomingDirection = coordinate.incomingDirection;

		const origin = this._originAtAltitude(altitudeMeters);
		const direction = GeometryDirections.normalizeTrustedDirection(
			incomingDirection,
			'Cache build incomingDirection',
		);
		const originPosition = DistanceMath.positionInMeters(origin);
		const groundDistance = this.distanceToGroundBoundary(originPosition, direction);

		if (groundDistance !== null && groundDistance >= 0) {
			return null;
		}

		return {
			ray: {origin: originPosition, direction},
			startDistance: DistanceMath.inMeters(0),
			endDistance: DistanceMath.inMeters(this.distanceToTopAtmosphereBoundary(originPosition, direction)),
		};
	}

	/**
	 * Call this method to map an app-authored ground offset into the configured Three scene.
	 *
	 * @param {ScenePosition} offset - The horizontal scene offset.
	 * @param {GeometryGroundOffsetScenePointRequest} [request] - The scene scale and optional height.
	 * @returns {ScenePosition} - The configured Three scene point.
	 */
	mapGroundOffsetToScenePoint(offset, request = {}) {
		return this._sceneAdapter.mapGroundOffsetToScenePoint(offset, request);
	}

	/**
	 * Call this method to project a scene point to the local spherical ground.
	 *
	 * @param {ScenePosition} point - The scene point to project.
	 * @param {unknown} direction - The scene projection direction.
	 * @param {GeometryGroundProjectionRequest} [request] - The scene scale and locality guards.
	 * @returns {ScenePosition} - The projected local ground point.
	 */
	projectScenePointToGroundAlongDirection(point, direction, request = {}) {
		return this._sceneAdapter.projectScenePointToGroundAlongDirection(point, direction, request);
	}

	/**
	 * Call this method to create geometry-owned Three ground endpoint objects.
	 *
	 * @param {GeometryThreeEndpointObjectsRequest} [request] - The scene-scale, material, segmentation, and metadata options.
	 * @returns {GeometryThreeEndpointObjects} - The geometry-owned endpoint objects.
	 */
	createThreeEndpointObjects(request = {}) {
		return this._sceneAdapter.createThreeEndpointObjects(request);
	}

	/**
	 * Call this method to resolve the scene-depth cap for spherical endpoints.
	 *
	 * @param {GeometrySceneDepthMaxRequest} [request] - The optional camera and minimum-cap policy.
	 * @returns {Distance} - The scene-depth cap.
	 */
	resolveSceneDepthMax(request = {}) {
		return this._sceneAdapter.resolveSceneDepthMax(request);
	}
}
