import {LocalSunCacheProvider} from './cache/LocalSunCacheProvider.js';
import {LocalSunCacheController} from './cache/LocalSunCacheController.js';
import {LocalSunShaderContributor} from './LocalSunShaderContributor.js';
import {LocalSunSceneLightingAdapter} from './three/LocalSunSceneLightingAdapter.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralMath,
	SpectralPacket as SpectralPacketClass,
} from '../../spectral-values/index.js';
import {NATIVE_SOURCE_IRRADIANCE_DENSITY} from '../../profiles/index.js';
import {LOCAL_SUN_SOURCE_TRANSMITTANCE_INTERVAL_COUNT} from './consts.js';
import DistanceMath from '../../math/DistanceMath.js';
import {LightSourceRequestValues} from '../../light-source-support/LightSourceRequestValues.js';
import {CelestialSourceSupport} from '../../celestial-source-support/CelestialSourceSupport.js';
import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {FlatFiniteSunCacheController} from './celestial/FlatFiniteSunCacheController.js';

/**
 * Finite local-Sun physical source and public integration facade.
 *
 * @implements {LightSourceModel}
 * @implements {GeometryConfigurableLightSource}
 * @implements {FiniteLocalSunCelestialSource}
 * @implements {CelestialSourceProvider}
 * @implements {FlatFiniteSunCacheModuleContributor}
 */
export class LocalSunLightSource {
	/** @type {FiniteLocalSunSourceDefinition | null} */
	_celestialSourceDefinition;
	/**
	 * Normalized physical source configuration retained by reference.
	 * @type {LocalSunLightSourceConfiguration | null}
	 */
	_configuration;
	/**
	 * Source-owned cache construction and attachment provider.
	 * @type {LocalSunCacheProvider | null}
	 */
	_cacheProvider;
	/**
	 * Source-owned final-view shader contribution provider.
	 * @type {LocalSunShaderContributor | null}
	 */
	_shaderContributor;
	/**
	 * Source-owned endpoint scene-lighting adapter.
	 * @type {LocalSunSceneLightingAdapter | null}
	 */
	_sceneLightingAdapter;

	/**
	 * Creates a finite local Sun with normalized physical and integration facts.
	 *
	 * @param {LocalSunLightSourceConfig} configuration - The source key,
	 * finite-source calibration and scale.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	constructor(configuration) {
		const {
			sourceKey,
			referenceDistance,
			referenceSpectralIncidentScale,
			radius,
			distanceFalloff = true,
			sourceTransmittanceIntervalCount = LOCAL_SUN_SOURCE_TRANSMITTANCE_INTERVAL_COUNT,
		} = configuration;
		const sourceIrradiance = /** @type {SpectralIrradiancePacket} */ (
			SpectralPacketClass.assert(configuration.sourceIrradiance ?? NATIVE_SOURCE_IRRADIANCE_DENSITY, {
				quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			})
		);

		if (!sourceKey || typeof sourceKey !== 'string') {
			throw new TypeError('LocalSunLightSource requires sourceKey.');
		}
		DistanceMath.assertDistance(referenceDistance, 'LocalSunLightSource referenceDistance');
		DistanceMath.assertDistance(radius, 'LocalSunLightSource radius');
		const referenceDistanceMeters = DistanceMath.toMeters(referenceDistance);
		const radiusMeters = DistanceMath.toMeters(radius);

		if (!Number.isFinite(referenceSpectralIncidentScale)) {
			throw new TypeError('LocalSunLightSource distance, scale, and radius must be finite.');
		}
		if (typeof distanceFalloff !== 'boolean') {
			throw new TypeError('LocalSunLightSource distanceFalloff must be boolean.');
		}
		if (!Number.isInteger(sourceTransmittanceIntervalCount) || sourceTransmittanceIntervalCount < 1) {
			throw new RangeError('LocalSunLightSource sourceTransmittanceIntervalCount must be a positive integer.');
		}
		if (referenceDistanceMeters <= 0 || referenceSpectralIncidentScale < 0 || radiusMeters < 0) {
			throw new RangeError('LocalSunLightSource distance, scale, and radius must be in valid ranges.');
		}
		if (sourceIrradiance.values.some((value) => value < 0)) {
			throw new RangeError('LocalSunLightSource sourceIrradiance values must be nonnegative.');
		}

		const normalizedConfiguration = {
			sourceKey,
			sourceIrradiance,
			referenceDistance: DistanceMath.inMeters(referenceDistanceMeters),
			referenceSpectralIncidentScale,
			radius: DistanceMath.inMeters(radiusMeters),
			distanceFalloff,
			sourceTransmittanceIntervalCount,
		};
		this._intrinsicConfiguration = normalizedConfiguration;
		this._configuration = null;
		this._celestialSourceDefinition = null;
		this._cacheProvider = null;
		this._shaderContributor = null;
		this._sceneLightingAdapter = null;
	}

	/**
	 * Called by the celestial capability to derive one uniform-disk radiance
	 * definition from the existing reference irradiance calibration.
	 *
	 * @returns {FiniteLocalSunSourceDefinition} - The shared local-Sun definition.
	 */
	_requireCelestialSourceDefinition() {
		if (this._celestialSourceDefinition !== null) {
			return this._celestialSourceDefinition;
		}
		const configuration = this._requireConfiguration('celestialSourceDefinition');
		const radiusMeters = configuration.radius.value;
		const referenceDistanceMeters = configuration.referenceDistance.value;
		if (!(radiusMeters > 0) || !(referenceDistanceMeters > radiusMeters)) {
			throw new RangeError(
				'LocalSunLightSource celestial support requires a positive radius below its reference distance.',
			);
		}
		const radiusRatio = radiusMeters / referenceDistanceMeters;
		const referenceSolidAngleSteradians = 2 * Math.PI * (1 - Math.sqrt(Math.max(0, 1 - radiusRatio * radiusRatio)));
		const surfaceRadiance = /** @type {SpectralRadiancePacket} */ (
			new SpectralPacketClass({
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				basis: configuration.sourceIrradiance.basis,
				semantics: configuration.sourceIrradiance.semantics,
				values: configuration.sourceIrradiance.values.map(
					/**
					 * Called by Array.prototype.map to derive uniform source radiance.
					 * @param {number} value - One reference irradiance-density channel.
					 * @returns {number} - The corresponding surface-radiance channel.
					 */
					(value) => (value * configuration.referenceSpectralIncidentScale) / referenceSolidAngleSteradians,
				),
				provenanceIdentity: `derived:finite-local-sun-radiance:${configuration.sourceIrradiance.contentHash}:distance-${referenceDistanceMeters}:radius-${radiusMeters}:scale-${configuration.referenceSpectralIncidentScale}`,
			})
		);
		this._celestialSourceDefinition = {
			id: this.id,
			kind: this.kind,
			radius: configuration.radius,
			centerHeight: DistanceMath.inMeters(configuration.position.coordinates[2]),
			surfaceRadiance,
			profile: 'uniform-disk',
		};
		return this._celestialSourceDefinition;
	}

	/**
	 * Called by LocalSunLightSource to require successful geometry placement.
	 *
	 * @param {string} operation - The placement-dependent operation.
	 * @returns {LocalSunLightSourceConfiguration} - The bound source configuration.
	 * @throws {Error} - When geometry placement has not completed.
	 */
	_requireConfiguration(operation) {
		if (this._configuration === null) {
			throw new Error(`LocalSunLightSource ${operation} requires geometry placement.`);
		}

		return this._configuration;
	}

	/** Placement family accepted from geometry. */
	get geometryPlacementKind() {
		return /** @type {const} */ ('finite-position');
	}

	/** @returns {SpectralIrradiancePacket} - The retained source irradiance density. */
	get sourceIrradiance() {
		return this._intrinsicConfiguration.sourceIrradiance;
	}

	/**
	 * Call this method to install the geometry-resolved finite source position exactly once.
	 *
	 * @param {GeometryResolvedLightSourcePlacement} placement - The geometry-resolved placement.
	 * @returns {void} - No value.
	 */
	configureGeometryPlacement(placement) {
		if (placement?.kind !== 'finite-position') {
			throw new TypeError('LocalSunLightSource requires finite-position geometry placement.');
		}
		DistanceMath.assertPosition(placement.position, 'LocalSunLightSource geometry position');
		const position = DistanceMath.positionInMeters(DistanceMath.toMetersPosition(placement.position));
		if (this._configuration !== null) {
			if (
				this._configuration.position.coordinates.every((value, index) => value === position.coordinates[index])
			) {
				return;
			}
			throw new Error('LocalSunLightSource cannot replace its geometry placement.');
		}
		const configuration = {
			...this._intrinsicConfiguration,
			position,
		};
		const cacheProvider = new LocalSunCacheProvider({source: this, configuration});
		const shaderContributor = new LocalSunShaderContributor(configuration);
		const sceneLightingAdapter = new LocalSunSceneLightingAdapter({source: this, configuration});

		this._configuration = configuration;
		this._cacheProvider = cacheProvider;
		this._shaderContributor = shaderContributor;
		this._sceneLightingAdapter = sceneLightingAdapter;
	}

	/**
	 * Immutable normalized source configuration snapshot.
	 *
	 * @returns {LocalSunLightSourceConfiguration} - The source configuration.
	 */
	get configuration() {
		return this._requireConfiguration('configuration');
	}

	/**
	 * Configured source model identity used for compatibility.
	 *
	 * @returns {string} - The source identity.
	 */
	get id() {
		return this._intrinsicConfiguration.sourceKey;
	}

	/** Finite local-Sun celestial-source discriminator. */
	get kind() {
		return /** @type {const} */ ('finite-local-sun');
	}

	/** Shared atmospheric and visible finite-Sun definition. */
	get celestialSourceDefinition() {
		return this._requireCelestialSourceDefinition();
	}

	/** @returns {CelestialSourceIdentity} - Canonical identity of the finite local Sun. */
	describeCelestialSourceIdentity() {
		const definition = this.celestialSourceDefinition;
		return CelestialSourceSupport.describeIdentity({
			id: definition.id,
			kind: definition.kind,
			profile: definition.profile,
			radiusMeters: definition.radius.value,
			centerHeightMeters: definition.centerHeight.value,
			surfaceRadiance: definition.surfaceRadiance.contentHash,
		});
	}

	/**
	 * Call this method to expose the configured finite center as placement input.
	 *
	 * @param {GeometryObservation} observation - Construction-time observation.
	 * @returns {CelestialSourcePlacementState} - Geometry-neutral placement state.
	 */
	createCelestialPlacementState(observation) {
		return {
			sourceId: this.id,
			kind: this.kind,
			frame: 'celestial-rh-v1',
			epoch: {instant: observation.instant, timeScale: 'utc'},
			position: this.configuration.position,
		};
	}

	/**
	 * Call this method to describe the source-owned finite-Sun cache fragment.
	 *
	 * @param {CelestialCacheBuildRequest} _request - Accepted construction context.
	 * @returns {CelestialCacheFragmentSpec} - Logical finite-Sun fragment facts.
	 */
	createCelestialCacheFragment(_request) {
		return CelestialSourceSupport.describeFragment(this.celestialSourceDefinition);
	}

	/**
	 * Call this method to create one attachment-owned Flat finite-Sun controller.
	 *
	 * @param {FlatFiniteSunCacheControllerConfiguration} request - Configured model and backend.
	 * @returns {FlatFiniteSunCacheController} - Dedicated finite-Sun controller.
	 */
	createFlatFiniteSunCacheController(request) {
		this._requireConfiguration('createFlatFiniteSunCacheController');
		return new FlatFiniteSunCacheController(request);
	}

	/**
	 * Call this method to declare source radiance for the one-texel GPU field.
	 *
	 * @param {FlatFiniteSunCacheModuleContext} context - Exact construction context.
	 * @returns {CacheBuildModule} - Source-owned radiance module.
	 */
	createFlatFiniteSunCacheModule(context) {
		const surfaceRadiance = this.celestialSourceDefinition.surfaceRadiance;
		if (context.output.storage.layers !== surfaceRadiance.values.length) {
			throw new RangeError('Flat finite-Sun field does not match source spectral channels.');
		}
		return CacheBuildModules.createBuildModule({
			id: 'algorithm32-flat-finite-sun-radiance-module-v1',
			owner: 'lightSource',
			provides: ['lightSource.flatFiniteSunRadiance'],
			requires: [],
			bindings: [
				{
					spec: {
						id: 'flat-finite-sun-surface-radiance',
						name: 'uFlatFiniteSunSurfaceRadiance',
						kind: 'uniform',
						shaderType: `float[${surfaceRadiance.values.length}]`,
						frequency: 'build',
					},
					value: surfaceRadiance,
				},
			],
			blocks: [
				{
					id: 'flat-finite-sun-radiance-main',
					phase: 'main',
					order: 0,
					source: 'a32CacheOutput = uFlatFiniteSunSurfaceRadiance[a32CacheWavelengthLayer];',
				},
			],
		});
	}

	/**
	 * Call this method to declare the local point Sun during final-view assembly.
	 *
	 * @returns {ShaderContribution} - The fresh source-owned runtime declaration.
	 */
	createShaderContribution() {
		this._requireConfiguration('createShaderContribution');
		return this._shaderContributor.createShaderContribution();
	}

	/**
	 * Call this method to create one local-Sun cache controller for a renderer attachment.
	 *
	 * @param {CacheControllerRequest} request - The backend and scheduler.
	 * @returns {LocalSunCacheController} - The attachment-owned controller.
	 */
	createCacheController({model, backend, scheduler}) {
		this._requireConfiguration('createCacheController');
		return this._cacheProvider.createCacheController({model, backend, scheduler});
	}

	/**
	 * Call this method to build one complete nonresident local-Sun binary64 cache result.
	 *
	 * @param {LocalSunCpuCacheRequest} request - The flat geometry, atmosphere, identity, and order.
	 * @returns {LocalSunCpuCacheResult} - The completed N1, N2, or N4 result.
	 */
	buildCpuScatteringCache(request) {
		this._requireConfiguration('buildCpuScatteringCache');
		return this._cacheProvider.buildCpuScatteringCache(request);
	}

	/**
	 * Call this method to sample direct lighting from the finite source. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {LocalSunPhysicalSampleRequest} [request] - The source-relative sample facts.
	 * @returns {DirectLightingSample} - The direct lighting sample.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	sampleDirectLighting(request = {}) {
		const configuration = this._requireConfiguration('sampleDirectLighting');
		const sourceRelativePosition = request.sourceRelativePosition;

		if (!sourceRelativePosition) {
			throw new TypeError('LocalSunLightSource.sampleDirectLighting requires sourceRelativePosition.');
		}

		const distanceFromSource = sourceRelativePosition.distanceFromSource;
		const hasDistanceFromSource = distanceFromSource != null;
		let distanceFromSourceMeters = null;

		if (hasDistanceFromSource) {
			DistanceMath.assertDistance(
				distanceFromSource,
				'LocalSunLightSource sourceRelativePosition.distanceFromSource',
			);
			distanceFromSourceMeters = DistanceMath.toMeters(distanceFromSource);
		}

		const directionToLight = LightSourceRequestValues.normalizeDirection(
			sourceRelativePosition.directionToSource,
			'sourceRelativePosition.directionToSource',
		);
		const radiusMeters = configuration.radius.value;
		const referenceDistanceMeters = configuration.referenceDistance.value;
		const safeDistanceMeters = Math.max(
			radiusMeters,
			hasDistanceFromSource ? distanceFromSourceMeters : referenceDistanceMeters,
		);
		const falloffScale = configuration.distanceFalloff ? (referenceDistanceMeters / safeDistanceMeters) ** 2 : 1;
		const incidentScale = configuration.referenceSpectralIncidentScale * falloffScale;
		const sourceIrradiance = /** @type {SpectralIrradiancePacket} */ (
			SpectralMath.scaleSpectralPacket(configuration.sourceIrradiance, incidentScale)
		);

		return {
			sourceIrradiance,
			directionToLight,
			metadata: {
				sourceKey: configuration.sourceKey,
				distanceFromSource: hasDistanceFromSource ? DistanceMath.inMeters(distanceFromSourceMeters) : null,
				safeDistance: DistanceMath.inMeters(safeDistanceMeters),
				radius: configuration.radius,
				referenceDistance: configuration.referenceDistance,
				referenceSpectralIncidentScale: configuration.referenceSpectralIncidentScale,
				falloffScale,
				incidentScale,
				distanceClampedToRadius: safeDistanceMeters !== distanceFromSourceMeters,
				spectralScaleKind: 'neutral-no-tint',
			},
		};
	}

	/**
	 * Call this method to resolve neutral local scene-light scales for the finite source.
	 *
	 * @param {LightSourceSceneLightScalesRequest} [request] - The source-relative observer facts.
	 * @returns {LightSourceSceneLightScales} - The direct and ambient light scales.
	 */
	resolveSceneLightScales(request = {}) {
		this._requireConfiguration('resolveSceneLightScales');
		return this._sceneLightingAdapter.resolveSceneLightScales(request);
	}

	/**
	 * Call this method to add or create source-owned endpoint scene lighting.
	 *
	 * @param {LightSourceThreeLightingRequest} request - The Three constructors, optional scene, and lighting facts.
	 * @returns {LightSourceThreeLightingObjects} - The source-owned Three lights.
	 */
	addSceneLighting(request) {
		this._requireConfiguration('addSceneLighting');
		return this._sceneLightingAdapter.addSceneLighting(request);
	}

	/**
	 * Call this method to configure an app-authored Three object tree for source shadows.
	 *
	 * @param {unknown} object - The Three object to configure.
	 * @param {LocalSunThreeShadowConfigurationRequest} [request] - The shadow flag overrides.
	 * @returns {unknown} - The configured object.
	 */
	configureThreeShadowObject(object, request = {}) {
		this._requireConfiguration('configureThreeShadowObject');
		return this._sceneLightingAdapter.configureThreeShadowObject(object, request);
	}

	/**
	 * Call this method to resolve the finite source path limit for one sample. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {LocalSunPhysicalSampleRequest} [request] - The source-relative sample facts.
	 * @returns {SourcePathLimit} - The source path limit.
	 */
	resolveSourcePathLimit(request = {}) {
		this._requireConfiguration('resolveSourcePathLimit');
		const distance = request.sourceRelativePosition?.distanceFromSource;

		if (distance != null) {
			DistanceMath.assertDistance(distance, 'LocalSunLightSource sourceRelativePosition.distanceFromSource');
		}

		const hasDistance = distance != null;
		const distanceMeters = hasDistance ? DistanceMath.toMeters(distance) : null;

		return {
			maxDistance: hasDistance ? DistanceMath.inMeters(Math.max(0, distanceMeters)) : null,
			reason: 'finite-local-source-distance',
		};
	}
}
