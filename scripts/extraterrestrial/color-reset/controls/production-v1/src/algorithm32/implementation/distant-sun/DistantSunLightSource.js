import {DistantSunCacheProvider} from './cache/DistantSunCacheProvider.js';
import DistantSunSceneCacheAssetLoader from './cache/DistantSunSceneCacheAssetLoader.js';
import DistantSunSceneCacheController from './cache/DistantSunSceneCacheController.js';
import DistantSunDarkCacheController from './cache/DistantSunDarkCacheController.js';
import {DistantSunShaderContributor} from './DistantSunShaderContributor.js';
import {DistantSunSceneLightingAdapter} from './three/DistantSunSceneLightingAdapter.js';
import {LightSourceRequestValues} from '../../light-source-support/LightSourceRequestValues.js';
import {NATIVE_SOURCE_IRRADIANCE_DENSITY} from '../../profiles/index.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket as SpectralPacketClass,
} from '../../spectral-values/index.js';
import AngleMath from '../../math/AngleMath.js';
import VectorMath from '../../math/VectorMath.js';
import {CelestialSourceSupport} from '../../celestial-source-support/CelestialSourceSupport.js';
import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {DistantSunCelestialCacheController} from './celestial/DistantSunCelestialCacheController.js';

/**
 * Physical distant-Sun source facade for atmospheric and endpoint lighting.
 *
 * @implements {LightSourceModel}
 * @implements {GeometryConfigurableLightSource}
 * @implements {DistantSunCelestialSource}
 * @implements {CelestialSourceProvider}
 * @implements {DistantSunCelestialCacheModuleContributor}
 */
export class DistantSunLightSource {
	/**
	 * Lazily derived celestial view of this atmospheric Sun.
	 * @type {DistantSunCelestialSourceDefinition | null}
	 */
	_celestialSourceDefinition;
	/**
	 * Immutable normalized source configuration.
	 * @type {DistantSunLightSourceConfiguration | null}
	 */
	_configuration;
	/**
	 * Source-owned cache construction and lifecycle provider.
	 * @type {DistantSunCacheProvider | null}
	 */
	_cacheProvider;
	/**
	 * Source-owned final-view shader contributor.
	 * @type {DistantSunShaderContributor | null}
	 */
	_shaderContributor;
	/**
	 * Source-owned Three scene-lighting adapter.
	 * @type {DistantSunSceneLightingAdapter | null}
	 */
	_sceneAdapter;

	/**
	 * Creates an unplaced distant-Sun light source from its apparent size.
	 *
	 * @param {DistantSunLightSourceConfig} configuration - The apparent size.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('DistantSunLightSource configuration is required.');
		}

		const {angularRadius} = configuration;
		const sourceIrradiance = /** @type {SpectralIrradiancePacket} */ (
			SpectralPacketClass.assert(configuration.sourceIrradiance ?? NATIVE_SOURCE_IRRADIANCE_DENSITY, {
				quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			})
		);
		AngleMath.assertAngle(angularRadius, 'DistantSunLightSource angularRadius');
		const angularRadiusRadians = AngleMath.toRadians(angularRadius);

		if (angularRadiusRadians < 0) {
			throw new TypeError('DistantSunLightSource angularRadius must be finite and non-negative.');
		}
		if (sourceIrradiance.values.some((value) => value < 0)) {
			throw new RangeError('DistantSunLightSource sourceIrradiance values must be nonnegative.');
		}
		if (configuration.darkScattering !== undefined && typeof configuration.darkScattering !== 'boolean') {
			throw new TypeError('DistantSunLightSource darkScattering must be boolean when supplied.');
		}
		if (configuration.darkScattering === true && configuration.sceneCacheAsset !== undefined) {
			throw new TypeError('DistantSunLightSource cannot select both a scene-cache asset and dark scattering.');
		}

		this._configuration = null;
		this._celestialSourceDefinition = null;
		this._cacheProvider = null;
		this._shaderContributor = null;
		this._sceneAdapter = null;
		this._intrinsicConfiguration = {
			sourceIrradiance,
			angularRadius: AngleMath.inRadians(angularRadiusRadians),
			sceneCacheAsset: configuration.sceneCacheAsset,
			darkScattering: configuration.darkScattering === true,
		};
	}

	/**
	 * Called by the celestial capability to derive the uniform disk radiance
	 * exactly once without changing the atmospheric source configuration.
	 *
	 * @returns {DistantSunCelestialSourceDefinition} - The shared Sun's celestial definition.
	 * @throws {RangeError} - When the atmospheric source has zero apparent support.
	 */
	_requireCelestialSourceDefinition() {
		if (this._celestialSourceDefinition !== null) {
			return this._celestialSourceDefinition;
		}

		const angularRadius = this._intrinsicConfiguration.angularRadius;
		if (!(angularRadius.value > 0)) {
			throw new RangeError('DistantSunLightSource celestial support requires a positive angular radius.');
		}

		const solidAngleSteradians = 2 * Math.PI * (1 - Math.cos(angularRadius.value));
		const surfaceRadiance = /** @type {SpectralRadiancePacket} */ (
			new SpectralPacketClass({
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				basis: this.sourceIrradiance.basis,
				semantics: this.sourceIrradiance.semantics,
				values: this.sourceIrradiance.values.map(
					/**
					 * Called by Array.prototype.map to convert apparent irradiance to uniform surface radiance.
					 * @param value - One apparent irradiance-density channel.
					 * @returns - The corresponding uniform radiance-density channel.
					 */
					(value) => value / solidAngleSteradians,
				),
				provenanceIdentity: `derived:distant-uniform-sun-radiance:${this.sourceIrradiance.contentHash}:radius-${angularRadius.value}`,
			})
		);
		this._celestialSourceDefinition = {
			id: this.id,
			kind: this.kind,
			angularRadius,
			surfaceRadiance,
			profile: 'uniform-disk',
		};

		return this._celestialSourceDefinition;
	}

	/**
	 * Called by DistantSunLightSource to require successful geometry placement.
	 *
	 * @param {string} operation - The placement-dependent operation.
	 * @returns {DistantSunLightSourceConfiguration} - The bound source configuration.
	 * @throws {Error} - When geometry placement has not completed.
	 */
	_requireConfiguration(operation) {
		if (this._configuration === null) {
			throw new Error(`DistantSunLightSource ${operation} requires geometry placement.`);
		}

		return this._configuration;
	}

	/** Placement family accepted from geometry. */
	get geometryPlacementKind() {
		return /** @type {const} */ ('distant-direction');
	}

	/** @returns {SpectralIrradiancePacket} - The retained source irradiance density. */
	get sourceIrradiance() {
		return this._intrinsicConfiguration.sourceIrradiance;
	}

	/**
	 * Call this method to install the geometry-resolved distant direction exactly once.
	 *
	 * @param {GeometryResolvedLightSourcePlacement} placement - The geometry-resolved placement.
	 * @returns {void} - No value.
	 */
	configureGeometryPlacement(placement) {
		if (placement?.kind !== 'distant-direction') {
			throw new TypeError('DistantSunLightSource requires distant-direction geometry placement.');
		}
		const directionToLight = LightSourceRequestValues.normalizeDirection(
			placement.directionToLight,
			'DistantSunLightSource geometry directionToLight',
		);
		if (this._configuration !== null) {
			if (this._configuration.directionToLight.every((value, index) => value === directionToLight[index])) {
				return;
			}
			throw new Error('DistantSunLightSource cannot replace its geometry placement.');
		}
		const configuration = {
			...this._intrinsicConfiguration,
			directionToLight,
		};
		const cacheProvider = new DistantSunCacheProvider(this, configuration);
		const shaderContributor = new DistantSunShaderContributor(configuration);
		const sceneAdapter = new DistantSunSceneLightingAdapter(this, configuration);

		this._configuration = configuration;
		this._cacheProvider = cacheProvider;
		this._shaderContributor = shaderContributor;
		this._sceneAdapter = sceneAdapter;
	}

	/**
	 * Immutable normalized source configuration.
	 *
	 * @returns {DistantSunLightSourceConfiguration} - The source configuration.
	 */
	get configuration() {
		return this._requireConfiguration('configuration');
	}

	/**
	 * Compatibility identifier for the configured source model.
	 *
	 * @returns {string} - The source identifier.
	 */
	get id() {
		return 'distant-sun';
	}

	/** Distant uniform-Sun celestial-source discriminator. */
	get kind() {
		return /** @type {const} */ ('distant-uniform-sun');
	}

	/** @returns {DistantSunCelestialSourceDefinition} - The shared atmospheric and celestial Sun definition. */
	get celestialSourceDefinition() {
		return this._requireCelestialSourceDefinition();
	}

	/** @returns {CelestialSourceIdentity} - Canonical identity of the shared Sun definition. */
	describeCelestialSourceIdentity() {
		const definition = this.celestialSourceDefinition;
		return CelestialSourceSupport.describeIdentity({
			id: definition.id,
			kind: definition.kind,
			profile: definition.profile,
			angularRadiusRadians: definition.angularRadius.value,
			surfaceRadiance: definition.surfaceRadiance.contentHash,
		});
	}

	/**
	 * Call this method to retain the observation from which geometry derives the existing distant direction.
	 *
	 * @param {GeometryObservation} observation - Construction-time observation.
	 * @returns {CelestialSourcePlacementState} - Geometry-neutral distant-Sun placement input.
	 */
	createCelestialPlacementState(observation) {
		return {
			sourceId: this.id,
			kind: this.kind,
			observation,
		};
	}

	/**
	 * Call this method to describe the source-owned logical celestial-cache fragment.
	 *
	 * @param {CelestialCacheBuildRequest} _request - Accepted model and placement context.
	 * @returns {CelestialCacheFragmentSpec} - Logical distant-Sun fragment facts.
	 */
	createCelestialCacheFragment(_request) {
		return CelestialSourceSupport.describeFragment(this.celestialSourceDefinition);
	}

	/**
	 * Call this method to create one attachment-owned distant-Sun celestial controller.
	 *
	 * @param {DistantSunCelestialCacheControllerConfiguration} request - Configured model and external backend.
	 * @returns {DistantSunCelestialCacheController} - Dedicated celestial cache controller.
	 */
	createDistantSunCelestialCacheController(request) {
		this._requireConfiguration('createDistantSunCelestialCacheController');
		return new DistantSunCelestialCacheController(request);
	}

	/**
	 * Create the source-radiance portion of one distant-Sun celestial GPU pass.
	 *
	 * @param {DistantSunCelestialCacheModuleContext} context - Exact celestial construction context.
	 * @returns {CacheBuildModule} - Source-owned direct-radiance module.
	 */
	createDistantSunCelestialCacheModule(context) {
		this._requireConfiguration('createDistantSunCelestialCacheModule');
		const surfaceRadiance = this.celestialSourceDefinition.surfaceRadiance;
		if (context.output.storage.layers !== surfaceRadiance.values.length) {
			throw new RangeError('Distant-Sun celestial GPU field does not match source spectral channels.');
		}
		return CacheBuildModules.createBuildModule({
			id: 'algorithm32-distant-sun-celestial-radiance-module-v1',
			owner: 'lightSource',
			provides: ['lightSource.celestialRadiance'],
			requires: ['geometry.celestialNode', 'atmosphere.celestialTransmittance'],
			blocks: [
				{
					id: 'distant-sun-celestial-radiance-main',
					phase: 'main',
					order: 0,
					source: `int directionIndex = int(gl_FragCoord.x);
int receiverIndex = int(gl_FragCoord.y);
if (!cacheCelestialSupported(directionIndex, receiverIndex)) {
	a32CacheOutput = 0.0;
} else {
	a32CacheOutput = uCelestialSunSurfaceRadiance[a32CacheWavelengthLayer]
		* cacheCelestialPathTransmittance(
			directionIndex,
			receiverIndex,
			a32CacheWavelengthLayer
		);
}`,
				},
			],
			bindings: [
				{
					spec: {
						id: 'distant-sun-celestial-surface-radiance',
						name: 'uCelestialSunSurfaceRadiance',
						kind: 'uniform',
						shaderType: `float[${surfaceRadiance.values.length}]`,
						frequency: 'build',
					},
					value: surfaceRadiance,
				},
			],
		});
	}

	/**
	 * Call this method to create the source-owned construction module for one cache pass.
	 *
	 * @param {CacheBuildContext} context - The resolved logical pass.
	 * @returns {CacheBuildModule} - The source-owned module.
	 */
	createCacheModule(context) {
		this._requireConfiguration('createCacheModule');
		return this._cacheProvider.createCacheModule(context);
	}

	/**
	 * Call this method to create one distant-Sun cache controller for a renderer attachment.
	 *
	 * @param {CacheControllerRequest} request - The renderer-owned backend and scheduler.
	 * @returns {CacheController} - The attachment-owned controller.
	 */
	createCacheController({backend}) {
		const configuration = this._requireConfiguration('createCacheController');
		if (configuration.darkScattering) {
			return new DistantSunDarkCacheController(backend);
		}
		if (!configuration.sceneCacheAsset) {
			throw new Error('Distant-Sun runtime requires an exact prebuilt scene-cache asset.');
		}
		return new DistantSunSceneCacheController({
			backend,
			asset: configuration.sceneCacheAsset,
		});
	}

	/**
	 * Call this method to create one attachment-owned offline scene-cache loader.
	 * Selection and publication remain owned by the later runtime cutover.
	 *
	 * @param {DistantSunSceneCacheAssetLoaderDefinition} request - Backend, static asset root, and optional Web adapters.
	 * @returns {DistantSunSceneCacheAssetLoader} - Exact manifest-backed loader.
	 */
	createSceneCacheAssetLoader(request) {
		this._requireConfiguration('createSceneCacheAssetLoader');
		return new DistantSunSceneCacheAssetLoader(request);
	}

	/**
	 * Call this method to build one complete nonresident CPU scattering result.
	 *
	 * Plain source construction defaults to N=4. An explicit N=1 request builds
	 * only J1 and its cumulative field; N=2 and N=4 use the production physical
	 * later-order scattering and stored-field transport operations.
	 *
	 * @param {DistantSunCpuCacheRequest} request - The aggregate execution model.
	 * @returns {DistantSunCpuCacheResult} - The canonical sealed N=1, N=2, or N=4 build result.
	 */
	buildCpuScatteringCache(request) {
		this._requireConfiguration('buildCpuScatteringCache');
		return this._cacheProvider.buildCpuScatteringCache(request);
	}

	/**
	 * Call this method to build the source-owned direct CPU primary-radiance field.
	 *
	 * This focused seam exposes the selected direct L1 seed for recurrence
	 * diagnostics; it is not an alternate cache-build result contract.
	 *
	 * @param {DistantSunCpuPrimaryRadianceFieldRequest} request - The aggregate model and focused field identities.
	 * @returns {CpuDirectionalSpectralFieldContract} - The sealed pure L1 field.
	 */
	buildCpuPrimaryRadianceField(request) {
		this._requireConfiguration('buildCpuPrimaryRadianceField');
		return this._cacheProvider.buildCpuPrimaryRadianceField(request);
	}

	/**
	 * Call this method to sample direct source lighting at a transport point.
	 *
	 * @returns {DirectLightingSample} - The direct lighting sample.
	 */
	sampleDirectLighting() {
		const configuration = this._requireConfiguration('sampleDirectLighting');
		return {
			sourceIrradiance: configuration.sourceIrradiance,
			directionToLight: configuration.directionToLight,
			metadata: {
				directionFromSource: VectorMath.scale(configuration.directionToLight, -1),
				angularRadius: configuration.angularRadius,
			},
		};
	}

	/**
	 * Call this method to resolve neutral local scene-light scales for the distant source.
	 *
	 * @param {LightSourceSceneLightScalesRequest} [request] - The optional source direction, local up vector, and twilight bounds.
	 * @returns {LightSourceSceneLightScales} - The direct and twilight-aware ambient scales.
	 */
	resolveSceneLightScales(request = {}) {
		this._requireConfiguration('resolveSceneLightScales');
		return this._sceneAdapter.resolveSceneLightScales(request);
	}

	/**
	 * Call this method to add or create source-owned scene lighting for endpoint rendering.
	 *
	 * @param {LightSourceThreeLightingRequest} request - Three, scene, direction, focus, intensity, ambient, and shadow policy.
	 * @returns {LightSourceThreeLightingObjects} - The source-owned Three lights.
	 */
	addSceneLighting(request) {
		this._requireConfiguration('addSceneLighting');
		return this._sceneAdapter.addSceneLighting(request);
	}

	/**
	 * Call this method to configure an app-authored Three object tree for source shadows.
	 *
	 * @param {unknown} object - The Three object to configure.
	 * @param {DistantSunShadowObjectConfiguration} [request] - The shadow flag overrides.
	 * @returns {unknown} - The configured object.
	 */
	configureThreeShadowObject(object, request = {}) {
		this._requireConfiguration('configureThreeShadowObject');
		return this._sceneAdapter.configureThreeShadowObject(object, request);
	}

	/**
	 * Call this method to resolve the source path limit for a directional source.
	 *
	 * @returns {SourcePathLimit} - The source path limit.
	 */
	resolveSourcePathLimit() {
		this._requireConfiguration('resolveSourcePathLimit');
		return {
			maxDistance: null,
			reason: 'distant-source-to-atmosphere-boundary',
		};
	}

	/**
	 * Call this method to create the light-source-owned distant-Sun shader contribution.
	 *
	 * @returns {ShaderContribution} - The light-source shader contribution.
	 */
	createShaderContribution() {
		this._requireConfiguration('createShaderContribution');
		return this._shaderContributor.createShaderContribution();
	}
}
