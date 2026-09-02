import {Reference} from '../../reference-execution/Reference.js';
import {ShaderBuilder} from '../../rendering-runtime/ShaderBuilder.js';
import {SharedModel as SharedModelImplementation} from './model/SharedModel.js';
import {createNativeExecutionProfile, NATIVE_15_SPECTRAL_BASIS} from '../../profiles/index.js';
import {CelestialSourceRoster} from '../../celestial-source-support/CelestialSourceRoster.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../distant-sun/cache/consts.js';
import LocalSunConstructionDomainSelection from '../local-sun/cache/LocalSunConstructionDomainSelection.js';
import {SpectralBasis, SpectralPacket} from '../../spectral-values/index.js';
import {GeometryDirections} from '../../geometry-support/GeometryDirections.js';
import DistanceMath from '../../math/DistanceMath.js';
import VectorMath from '../../math/VectorMath.js';
import AngleMath from '../../math/AngleMath.js';
import {Algorithm32ShaderHandle} from './Algorithm32ShaderHandle.js';
import {LocalLightLevelCalculator} from '../scene-lighting/LocalLightLevelCalculator.js';
import {ReceiverEnvironmentLightController} from '../scene-lighting/ReceiverEnvironmentLightController.js';

/** Supported path sample distributions constant. */
const SUPPORTED_PATH_SAMPLE_DISTRIBUTIONS = new Set([
	'uniform-distance',
	'quadratic-near-observer-v1',
	'tangent-density-adaptive-v1',
	'tangent-density-adaptive-soft-v1',
]);

/**
 * Object that provides the primary production facade for Algorithm32.
 *
 * @implements {Algorithm32Facade}
 * @implements {Algorithm32ShaderHandleFacade}
 */
export class Algorithm32 {
	/**
	 * Value that stores the current accepted configuration.
	 *
	 * @type {Algorithm32ResolvedConfig}
	 *
	 */
	_config;

	/**
	 * Value that stores the current facade-local configuration version.
	 *
	 * @type {number}
	 *
	 */
	_version = 0;

	/**
	 * Value that stores the facade-owned shared model.
	 *
	 * @type {SharedModel}
	 *
	 */
	_model;

	/**
	 * Value that stores the CPU/reference implementation collaborator.
	 *
	 * @type {ReferenceExecution}
	 *
	 */
	_reference;

	/**
	 * Value that stores the facade-owned receiver-local lighting calculator.
	 *
	 * @type {LocalLightLevelCalculator}
	 */
	_localLightLevelCalculator;
	/** @type {ReceiverEnvironmentLightController} */
	_receiverEnvironmentLightController;

	/**
	 * Facade-owned live Color bindings shared by every installed runtime.
	 *
	 * @type {Record<string, unknown>}
	 */
	_colorRuntimeBindingValues = {
		'color.exposureModifier': 1,
		'color.brightnessProxy': 0,
		'color.sceneLuminanceScale': 0,
	};

	/**
	 * Value that stores the runtime shader builder.
	 *
	 * @type {ShaderBuildCoordinator}
	 *
	 */
	_shaderBuilder;

	/**
	 * Value that tracks handles created by this facade.
	 *
	 * @type {Set<Algorithm32ShaderHandle>}
	 *
	 */
	_shaderHandles = new Set();

	/**
	 * Value that tracks whether this facade has been disposed.
	 *
	 * @type {boolean}
	 *
	 */
	_disposed = false;

	/**
	 * Called by algorithm32 to copy facade configuration without cloning consumer-owned model objects. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {Config} config - Supplies configuration to copy.
	 * @returns {Algorithm32ResolvedConfig} - The copied configuration wrapper.
	 */
	_copyConfig(config) {
		if ('profile' in config) {
			return {
				profile: config.profile,
				color: config.color,
				shader: {...(config.shader === undefined ? {} : config.shader)},
			};
		}
		const execution = config.execution === undefined ? {} : config.execution;

		return {
			lightSource: config.lightSource,
			atmosphere: config.atmosphere,
			geometry: config.geometry,
			observation: this._acceptObservation(config.observation),
			sourcePlacement: config.sourcePlacement,
			celestialSources: config.celestialSources ?? null,
			groundBoundary: config.groundBoundary,
			color: config.color,
			execution: {
				...execution,
				maximumScatteringOrder: execution.maximumScatteringOrder ?? 4,
			},
			shader: {...(config.shader === undefined ? {} : config.shader)},
		};
	}

	/**
	 * Called by Algorithm32 to copy only the caller-visible configuration fields.
	 *
	 * @param {Algorithm32ResolvedConfig} config - The accepted internal configuration.
	 * @returns {Config} - The public configuration snapshot value.
	 */
	_copyPublicConfig(config) {
		if ('profile' in config) {
			return {
				profile: config.profile,
				color: config.color,
				shader: config.shader,
			};
		}
		return {
			lightSource: config.lightSource,
			atmosphere: config.atmosphere,
			geometry: config.geometry,
			observation: config.observation,
			sourcePlacement: config.sourcePlacement,
			celestialSources: config.celestialSources,
			groundBoundary: config.groundBoundary,
			color: config.color,
			execution: config.execution,
			shader: config.shader,
		};
	}

	/**
	 * Called by Algorithm32 to validate and normalize one construction-time observation.
	 *
	 * @param {GeometryObservation} observation - The caller-provided observation.
	 * @returns {GeometryObservation} - The normalized observation.
	 * @throws {TypeError} - When the observation shape or instant is invalid.
	 * @throws {RangeError} - When latitude or longitude is outside its canonical range.
	 */
	_acceptObservation(observation) {
		if (!observation || typeof observation !== 'object') {
			throw new TypeError('Algorithm32 observation is required.');
		}
		const instantDate = new Date(observation.instant);
		if (
			typeof observation.instant !== 'string' ||
			Number.isNaN(instantDate.getTime()) ||
			instantDate.toISOString() !== observation.instant
		) {
			throw new TypeError('Algorithm32 observation.instant must be exact canonical ISO-8601 UTC.');
		}
		AngleMath.assertAngle(observation.location?.latitude, 'Algorithm32 observation latitude');
		AngleMath.assertAngle(observation.location?.longitude, 'Algorithm32 observation longitude');
		const latitudeDegrees = AngleMath.toDegrees(observation.location.latitude);
		const longitudeDegrees = AngleMath.toDegrees(observation.location.longitude);
		if (latitudeDegrees < -90 || latitudeDegrees > 90) {
			throw new RangeError('Algorithm32 observation latitude must be in [-90, 90] degrees.');
		}
		if (longitudeDegrees < -180 || longitudeDegrees >= 180) {
			throw new RangeError('Algorithm32 observation longitude must be in [-180, 180) degrees.');
		}

		return {
			instant: observation.instant,
			location: {
				latitude: AngleMath.inDegrees(latitudeDegrees),
				longitude: AngleMath.inDegrees(longitudeDegrees),
			},
		};
	}

	/**
	 * Called by configuration acceptance to allow an omitted interval count or require a positive safe integer.
	 *
	 * @param {number | undefined} value - Supplies the requested interval count.
	 * @param {string} name - Identifies the public configuration property.
	 * @returns {void} - No value.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_assertOptionalIntervalCount(value, name) {
		if (value !== undefined && (!Number.isSafeInteger(value) || value < 1)) {
			throw new RangeError(`Algorithm32 ${name} must be a positive safe integer.`);
		}
	}

	/**
	 * Called by profile ingress to require a positive safe integer.
	 *
	 * @param {number} value - Candidate count.
	 * @param {string} name - Profile field name.
	 */
	_assertProfileIntervalCount(value, name) {
		if (!Number.isSafeInteger(value) || value < 1) {
			throw new RangeError(`Algorithm32 profile ${name} must be a positive safe integer.`);
		}
	}

	/**
	 * Called by profile ingress to validate one direction domain.
	 *
	 * @param {DirectionDomain} domain - Candidate domain.
	 * @param {string} name - Domain role.
	 * @param {boolean} weighted - Whether integration weights are mandatory.
	 */
	_acceptDirectionDomain(domain, name, weighted) {
		if (!domain || typeof domain !== 'object' || typeof domain.id !== 'string' || domain.id.length === 0) {
			throw new TypeError(`Algorithm32 profile ${name} domain must have a nonempty id.`);
		}
		if (
			!Number.isSafeInteger(domain.directionCount) ||
			domain.directionCount < 1 ||
			domain.unitVectors.length !== domain.directionCount
		) {
			throw new RangeError(`Algorithm32 profile ${name} domain count is inconsistent.`);
		}
		for (const direction of domain.unitVectors) {
			GeometryDirections.directionTuple(direction, `Algorithm32 profile ${name} direction`);
			if (Math.abs(VectorMath.length(direction) - 1) > 1e-12) {
				throw new RangeError(`Algorithm32 profile ${name} directions must be unit vectors.`);
			}
		}
		if (weighted) {
			if (
				domain.integrationWeights?.units !== 'steradians' ||
				domain.integrationWeights.values.length !== domain.directionCount ||
				domain.integrationWeights.values.some((value) => !Number.isFinite(value) || value < 0)
			) {
				throw new RangeError(`Algorithm32 profile ${name} weights are inconsistent.`);
			}
			const solidAngle = domain.integrationWeights.values.reduce((sum, value) => sum + value, 0);
			if (Math.abs(solidAngle - 4 * Math.PI) > 1e-10) {
				throw new RangeError(`Algorithm32 profile ${name} weights must integrate to 4*pi steradians.`);
			}
		}
	}

	/**
	 * Called by profile ingress to validate one complete value-agnostic profile before placement creates source resources.
	 *
	 * @param {Algorithm32ExecutionProfile} profile - Candidate profile.
	 */
	_acceptExecutionProfile(profile) {
		if (!profile || typeof profile !== 'object' || profile.kind !== 'algorithm32-execution-profile') {
			throw new TypeError('Algorithm32 explicit profile must be a complete execution profile.');
		}
		for (const [name, value] of [
			['id', profile.id],
			['schemaRevision', profile.schemaRevision],
			['provenanceIdentity', profile.provenanceIdentity],
		]) {
			if (typeof value !== 'string' || value.length === 0) {
				throw new TypeError(`Algorithm32 profile ${name} must be a nonempty string.`);
			}
		}
		if (!Number.isSafeInteger(profile.revision) || profile.revision < 0) {
			throw new RangeError('Algorithm32 profile revision must be a nonnegative safe integer.');
		}
		if (typeof profile.contentHash !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(profile.contentHash)) {
			throw new TypeError('Algorithm32 profile contentHash must use canonical SHA-256 spelling.');
		}
		const basis = SpectralBasis.assert(profile.spectral?.basis, 'Algorithm32 profile spectral basis');
		const sourcePacket = SpectralPacket.assert(profile.spectral?.sourceIrradianceDensity, {
			quantity: 'spectral-irradiance-density',
			units: 'W m^-2 nm^-1',
			basis,
			semantics: basis.semantics,
		});
		if (sourcePacket.values.some((value) => value < 0)) {
			throw new RangeError('Algorithm32 profile source irradiance must be nonnegative.');
		}
		const models = profile.models;
		if (!models || typeof models !== 'object') {
			throw new TypeError('Algorithm32 profile models are required.');
		}
		if (!Object.hasOwn(models, 'celestialSources')) {
			throw new TypeError('Algorithm32 profile models must declare nullable celestialSources.');
		}
		if (models.atmosphere?.spectralBasis?.contentHash !== basis.contentHash) {
			throw new RangeError('Algorithm32 profile atmosphere basis must match the selected basis.');
		}
		if (models.lightSource?.sourceIrradiance?.contentHash !== sourcePacket.contentHash) {
			throw new RangeError('Algorithm32 profile light-source irradiance must match the selected packet.');
		}
		if (typeof models.geometry?.configureLightSource !== 'function') {
			throw new TypeError('Algorithm32 profile geometry must implement configureLightSource.');
		}
		const configurableLightSource = /** @type {LightSourceModel & GeometryConfigurableLightSource} */ (
			models.lightSource
		);
		if (typeof configurableLightSource?.configureGeometryPlacement !== 'function') {
			throw new TypeError('Algorithm32 profile lightSource must implement GeometryConfigurableLightSource.');
		}
		CelestialSourceRoster.accept({
			roster: models.celestialSources,
			lightSource: models.lightSource,
			geometry: models.geometry,
			basis,
		});
		if (models.groundBoundary !== null) {
			const albedo = SpectralPacket.assert(models.groundBoundary?.albedo, {
				quantity: 'spectral-reflectance',
				units: '1',
				basis,
				semantics: basis.semantics,
			});
			if (albedo.values.some((value) => value < 0 || value > 1)) {
				throw new RangeError('Algorithm32 profile ground albedo must be in [0, 1].');
			}
		}
		const sourcePlacement = models.sourcePlacement;
		if (
			sourcePlacement?.kind !== 'geometry-observation' &&
			sourcePlacement?.kind !== 'explicit-geometry-placement'
		) {
			throw new TypeError('Algorithm32 profile source placement kind is not supported.');
		}
		this._acceptObservation(sourcePlacement.observation);
		if (sourcePlacement.kind === 'explicit-geometry-placement') {
			if (sourcePlacement.placement?.kind !== configurableLightSource.geometryPlacementKind) {
				throw new RangeError('Algorithm32 profile explicit placement must match the light-source family.');
			}
			if (sourcePlacement.placement.kind === 'distant-direction') {
				GeometryDirections.directionTuple(
					sourcePlacement.placement.directionToLight,
					'Algorithm32 profile explicit direction',
				);
				if (Math.abs(VectorMath.length(sourcePlacement.placement.directionToLight) - 1) > 1e-12) {
					throw new RangeError('Algorithm32 profile explicit direction must be a unit vector.');
				}
			} else {
				DistanceMath.assertPosition(
					sourcePlacement.placement.position,
					'Algorithm32 profile explicit position',
				);
			}
		}
		const numerical = profile.numerical;
		this._assertProfileIntervalCount(numerical?.viewPath?.intervalCount, 'viewPath.intervalCount');
		this._assertProfileIntervalCount(
			numerical?.sourcePathTransmittance?.intervalCount,
			'sourcePathTransmittance.intervalCount',
		);
		this._assertProfileIntervalCount(
			numerical?.cacheConstruction?.transportIntervalCount,
			'cacheConstruction.transportIntervalCount',
		);
		const maximumScatteringOrder = numerical?.cacheConstruction?.maximumScatteringOrder;
		if (![1, 2, 3, 4, 5].includes(maximumScatteringOrder)) {
			throw new RangeError('Algorithm32 profile maximumScatteringOrder must be in [1, 5].');
		}
		const sampleDistribution = numerical.viewPath.sampleDistribution;
		if (sampleDistribution !== null && !SUPPORTED_PATH_SAMPLE_DISTRIBUTIONS.has(sampleDistribution?.kind)) {
			throw new RangeError('Algorithm32 profile view-path sample distribution is not supported.');
		}
		const domains = profile.domains;
		if (
			!domains?.positions ||
			typeof domains.positions.id !== 'string' ||
			domains.positions.id.length === 0 ||
			!Number.isSafeInteger(domains.positions.count) ||
			domains.positions.count < 1 ||
			domains.positions.nodes.length !== domains.positions.count
		) {
			throw new RangeError('Algorithm32 profile position domain is inconsistent.');
		}
		for (let index = 0; index < domains.positions.nodes.length; index += 1) {
			const node = domains.positions.nodes[index];
			if (node.index !== index) {
				throw new RangeError('Algorithm32 profile position-domain indices must be contiguous.');
			}
			DistanceMath.assertDistance(node.coordinate, 'Algorithm32 profile position coordinate');
		}
		this._acceptDirectionDomain(domains.incomingDirections, 'incoming-direction', true);
		this._acceptDirectionDomain(domains.outgoingDirections, 'outgoing-direction', false);
		if (typeof domains.outgoingDirections.resolveStencil !== 'function') {
			throw new TypeError('Algorithm32 profile outgoing domain must provide reconstruction stencils.');
		}
		const outgoingCapability = /** @type {CubedSphereDirectionDomain} */ (domains.outgoingDirections);
		if (
			outgoingCapability.faceWidth !== 27 ||
			outgoingCapability.faceNodeCount * 6 !== outgoingCapability.directionCount
		) {
			throw new RangeError(
				'Algorithm32 profile outgoing domain must provide the supported W27 reconstruction capability.',
			);
		}
	}

	/**
	 * Called by algorithm32 to create the current configuration snapshot.
	 *
	 * @returns {ConfigSnapshot} - The current configuration snapshot.
	 */
	_createConfigSnapshot() {
		return {
			config: this._copyPublicConfig(this._config),
			version: this._version,
		};
	}

	/**
	 * Called by algorithm32 to accept semantic configuration values at the public facade boundary.
	 *
	 * @param {Config} config - Supplies the candidate configuration.
	 * @returns {void} -
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_acceptConfigValues(config) {
		if (!config || typeof config !== 'object') {
			throw new TypeError('Algorithm32 configuration is required.');
		}
		if ('profile' in config) {
			for (const field of [
				'lightSource',
				'atmosphere',
				'geometry',
				'observation',
				'sourcePlacement',
				'groundBoundary',
				'execution',
				'celestialSources',
			]) {
				if (Object.hasOwn(config, field)) {
					throw new TypeError(
						'Algorithm32 explicit profile cannot be mixed with legacy profile-owned fields.',
					);
				}
			}
			this._acceptExecutionProfile(config.profile);
			this._acceptShaderConfig(config.shader);
			return;
		}
		this._assertOptionalIntervalCount(config.execution?.pathIntervalCount, 'pathIntervalCount');
		this._assertOptionalIntervalCount(
			config.execution?.sourceTransmittanceIntervalCount,
			'sourceTransmittanceIntervalCount',
		);
		const maximumScatteringOrder = config.execution?.maximumScatteringOrder;
		if (
			maximumScatteringOrder !== undefined &&
			maximumScatteringOrder !== 1 &&
			maximumScatteringOrder !== 2 &&
			maximumScatteringOrder !== 4
		) {
			throw new RangeError('Algorithm32 maximumScatteringOrder must be one of 1, 2, or 4.');
		}

		const pathSampleDistribution = config.execution?.pathSampleDistribution;
		if (
			pathSampleDistribution !== undefined &&
			pathSampleDistribution !== null &&
			!SUPPORTED_PATH_SAMPLE_DISTRIBUTIONS.has(pathSampleDistribution.kind)
		) {
			throw new RangeError('Algorithm32 pathSampleDistribution kind is not supported.');
		}
		if (config.sourcePlacement !== undefined) {
			const configurableLightSource = /** @type {LightSourceModel & GeometryConfigurableLightSource} */ (
				config.lightSource
			);
			if (config.sourcePlacement.kind !== configurableLightSource.geometryPlacementKind) {
				throw new RangeError('Algorithm32 sourcePlacement does not match the configured light-source family.');
			}
			if (config.sourcePlacement.kind === 'distant-direction') {
				GeometryDirections.directionTuple(
					config.sourcePlacement.directionToLight,
					'Algorithm32 sourcePlacement directionToLight',
				);
				if (Math.abs(VectorMath.length(config.sourcePlacement.directionToLight) - 1) > 1e-12) {
					throw new RangeError('Algorithm32 sourcePlacement directionToLight must be a unit vector.');
				}
			}
		}

		this._acceptShaderConfig(config.shader);
	}

	/**
	 * Called by facade configuration ingress to validate the public shader options shared by both config forms.
	 *
	 * @param {ShaderRuntimeConfig | undefined} shader - Candidate shader options.
	 */
	_acceptShaderConfig(shader) {
		const deferredDebugViewProperty = ['debug', 'View'].join('');

		if (shader && Object.hasOwn(shader, deferredDebugViewProperty)) {
			throw new TypeError('Shader debug views are deferred and are not part of first production config.');
		}
	}

	/**
	 * Called by legacy Native-15 profile completion to choose the supported source-specific production domains.
	 *
	 * @param {LightSourceModel & GeometryConfigurableLightSource} lightSource - Accepted legacy source.
	 * @param {GeometryModel} geometry - Configured legacy geometry.
	 * @returns {Algorithm32ExecutionDomains} - Native execution domains.
	 */
	_createNativeExecutionDomains(lightSource, geometry) {
		if (lightSource.geometryPlacementKind === 'distant-direction') {
			return {
				positions: DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION.positionDomain,
				incomingDirections: DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION.incomingDirectionDomain,
				outgoingDirections: DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION.outgoingDirectionDomain,
			};
		}
		if (lightSource.geometryPlacementKind === 'finite-position') {
			const localGeometry = /** @type {LocalSunConstructionDomainGeometry} */ (/** @type {unknown} */ (geometry));
			const selection = LocalSunConstructionDomainSelection.fromGeometry(localGeometry, {
				spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			});
			return {
				positions: selection.positionDomain,
				incomingDirections: selection.incomingDirectionDomain,
				outgoingDirections: selection.outgoingDirectionDomain,
			};
		}
		throw new RangeError('Algorithm32 legacy source placement family is not supported.');
	}

	/**
	 * Called by algorithm32 to prepare config and implementation collaborators without publishing them.
	 *
	 * @param {Config} config - Supplies the replacement configuration.
	 * @returns {Algorithm32PreparedConfig} - The staged configuration state.
	 */
	_prepareConfig(config) {
		this._acceptConfigValues(config);
		const acceptedConfig = this._copyConfig(config);
		let profile;
		if ('profile' in acceptedConfig) {
			profile = acceptedConfig.profile;
			const placementSelection = profile.models.sourcePlacement;
			profile.models.geometry.configureLightSource({
				lightSource: /** @type {LightSourceModel & GeometryConfigurableLightSource} */ (
					profile.models.lightSource
				),
				observation: placementSelection.observation,
				...(placementSelection.kind === 'explicit-geometry-placement'
					? {placement: placementSelection.placement}
					: {}),
				domains: profile.domains,
			});
			profile.models.geometry.configureExecutionDomains?.(profile.domains);
		} else {
			if (typeof acceptedConfig.geometry.configureLightSource !== 'function') {
				throw new TypeError('Algorithm32 geometry must implement configureLightSource.');
			}
			const configurableLightSource = /** @type {LightSourceModel & GeometryConfigurableLightSource} */ (
				acceptedConfig.lightSource
			);
			if (typeof configurableLightSource.configureGeometryPlacement !== 'function') {
				throw new TypeError('Algorithm32 lightSource must implement GeometryConfigurableLightSource.');
			}
			const initialDomains =
				configurableLightSource.geometryPlacementKind === 'distant-direction'
					? this._createNativeExecutionDomains(configurableLightSource, acceptedConfig.geometry)
					: null;
			acceptedConfig.geometry.configureLightSource({
				lightSource: configurableLightSource,
				observation: acceptedConfig.observation,
				...(acceptedConfig.sourcePlacement === undefined ? {} : {placement: acceptedConfig.sourcePlacement}),
				...(initialDomains === null ? {} : {domains: initialDomains}),
			});
			CelestialSourceRoster.accept({
				roster: acceptedConfig.celestialSources,
				lightSource: acceptedConfig.lightSource,
				geometry: acceptedConfig.geometry,
				basis: NATIVE_15_SPECTRAL_BASIS,
			});
			profile = createNativeExecutionProfile({
				lightSource: acceptedConfig.lightSource,
				atmosphere: acceptedConfig.atmosphere,
				geometry: acceptedConfig.geometry,
				groundBoundary: acceptedConfig.groundBoundary ?? null,
				observation: acceptedConfig.observation,
				sourcePlacement: acceptedConfig.sourcePlacement,
				celestialSources: acceptedConfig.celestialSources,
				domains:
					initialDomains ??
					this._createNativeExecutionDomains(configurableLightSource, acceptedConfig.geometry),
				execution: acceptedConfig.execution,
			});
			this._acceptExecutionProfile(profile);
			acceptedConfig.geometry.configureExecutionDomains?.(profile.domains);
		}
		const version = this._version + 1;
		const model = new SharedModelImplementation({
			version,
			profile,
		});
		const reference = new Reference({
			model,
		});
		const localLightLevelCalculator = new LocalLightLevelCalculator({
			lightSource: profile.models.lightSource,
		});
		const receiverEnvironmentLightController = new ReceiverEnvironmentLightController({
			calculator: localLightLevelCalculator,
		});
		const brightnessProxy = localLightLevelCalculator.measureBrightnessProxy({
			geometry: profile.models.geometry,
			atmosphere: profile.models.atmosphere,
			observation: profile.models.sourcePlacement.observation,
			celestialSources: profile.models.celestialSources,
		});
		const sourceBrightness = localLightLevelCalculator.measureSourceBrightness({
			geometry: profile.models.geometry,
			observation: profile.models.sourcePlacement.observation,
			celestialSources: profile.models.celestialSources,
		});
		const exposureModifier = localLightLevelCalculator.deriveExposureModifier(brightnessProxy);
		const shaderBuilder = new ShaderBuilder({
			model,
		});

		return {
			baseVersion: this._version,
			version,
			config: acceptedConfig,
			model,
			reference,
			localLightLevelCalculator,
			receiverEnvironmentLightController,
			exposureModifier,
			brightnessProxy: brightnessProxy.value,
			sourceBrightness: sourceBrightness.value,
			shaderBuilder,
			snapshot: {
				config: this._copyPublicConfig(acceptedConfig),
				version,
			},
		};
	}

	/**
	 * Called by algorithm32 to publish one fully prepared configuration after its dependent runtime build has succeeded.
	 *
	 * @param {Algorithm32PreparedConfig} prepared - Supplies staged state.
	 * @returns {ConfigSnapshot} - The accepted configuration snapshot.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_commitPreparedConfig(prepared) {
		this._assertUsable();
		if (prepared.baseVersion !== this._version) {
			throw new Error('Algorithm32 configuration replacement was superseded.');
		}

		const previousReference = this._reference;
		const previousShaderBuilder = this._shaderBuilder;
		this._version = prepared.version;
		this._config = prepared.config;
		this._model = prepared.model;
		this._reference = prepared.reference;
		this._localLightLevelCalculator = prepared.localLightLevelCalculator;
		this._receiverEnvironmentLightController?.dispose();
		this._receiverEnvironmentLightController = prepared.receiverEnvironmentLightController;
		this._colorRuntimeBindingValues['color.exposureModifier'] = prepared.exposureModifier;
		this._colorRuntimeBindingValues['color.brightnessProxy'] = prepared.brightnessProxy;
		this._colorRuntimeBindingValues['color.sceneLuminanceScale'] = prepared.sourceBrightness;
		this._shaderBuilder = prepared.shaderBuilder;
		previousReference?.dispose();
		previousShaderBuilder?.dispose();

		return prepared.snapshot;
	}

	/**
	 * Called by algorithm32 to dispose collaborators belonging to an unpublished configuration.
	 *
	 * @param {Algorithm32PreparedConfig} prepared - Supplies staged state.
	 * @returns {void} -
	 */
	_discardPreparedConfig(prepared) {
		if (prepared.reference !== this._reference) {
			prepared.reference.dispose();
		}
		if (prepared.shaderBuilder !== this._shaderBuilder) {
			prepared.shaderBuilder.dispose();
		}
	}

	/**
	 * Called by algorithm32 to replace config and implementation collaborators synchronously.
	 *
	 * @param {Config} config - Supplies the replacement configuration.
	 * @returns {ConfigSnapshot} - The accepted configuration snapshot.
	 */
	_replaceConfig(config) {
		return this._commitPreparedConfig(this._prepareConfig(config));
	}

	/**
	 * Creates a facade for one configured Algorithm32 simulation/render context.
	 *
	 * @param {Config} config - Supplies the consumer-provided light-source,
	 * atmosphere, and geometry models plus Algorithm32 runtime configuration.
	 *
	 */
	constructor(config) {
		this._replaceConfig(config);
	}

	/**
	 * Called by algorithm32 to create the internal shader build request from public setup fields.
	 *
	 * @param {ShaderSetupRequest} setup - Supplies caller-owned setup handles.
	 * @param {ConfigSnapshot} config - Supplies the accepted config snapshot.
	 * @param {ShaderBuildRequestOptions} [options] - Supplies replacement state
	 * and cancellation.
	 * @returns {ShaderBuildRequest} - The internal build request.
	 */
	_createShaderBuildRequest(setup, config, options = {}) {
		const buildRequest = {
			setup,
			config,
		};

		buildRequest.bindingValues = this._createRuntimeBindingValues(setup?.bindingValues);

		if (options.previousBuildResult !== undefined) {
			buildRequest.previousBuildResult = options.previousBuildResult;
		}
		if (options.signal !== undefined) {
			buildRequest.signal = options.signal;
		}

		return buildRequest;
	}

	/**
	 * Called by Algorithm32 to combine caller-owned live values with facade-owned Color state without mutating either owner.
	 *
	 * @param {Record<string, unknown> | undefined} callerValues - Optional caller-owned live binding record.
	 * @returns {Record<string, unknown>} - Live binding overlay used by runtime refresh.
	 */
	_createRuntimeBindingValues(callerValues) {
		const source = callerValues ?? {};
		if (Object.hasOwn(source, 'color.exposureModifier')) {
			throw new TypeError('color.exposureModifier is owned by the Algorithm32 facade.');
		}
		if (Object.hasOwn(source, 'color.brightnessProxy')) {
			throw new TypeError('color.brightnessProxy is owned by the Algorithm32 facade.');
		}
		if (Object.hasOwn(source, 'color.sceneLuminanceScale')) {
			throw new TypeError('color.sceneLuminanceScale is owned by the Algorithm32 facade.');
		}
		const combined = {};
		for (const key of Object.keys(source)) {
			Object.defineProperty(combined, key, {
				configurable: false,
				enumerable: true,
				get: /** Return the current caller-owned binding value. */ () => source[key],
			});
		}
		Object.defineProperty(combined, 'color.exposureModifier', {
			configurable: false,
			enumerable: true,
			get: /** Return the current facade-owned exposure modifier. */ () =>
				this._colorRuntimeBindingValues['color.exposureModifier'],
		});
		Object.defineProperty(combined, 'color.brightnessProxy', {
			configurable: false,
			enumerable: true,
			get: /** Return the current facade-owned brightness proxy. */ () =>
				this._colorRuntimeBindingValues['color.brightnessProxy'],
		});
		Object.defineProperty(combined, 'color.sceneLuminanceScale', {
			configurable: false,
			enumerable: true,
			get: /** Return the current source-owned scene luminance scale. */ () =>
				this._colorRuntimeBindingValues['color.sceneLuminanceScale'],
		});
		return /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (combined));
	}

	/**
	 * Called by algorithm32 to assert that the facade is still usable.
	 *
	 * @returns {void} -
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('Algorithm32 facade has been disposed.');
		}
	}

	/**
	 * Called by algorithm32 to forget a disposed shader handle.
	 *
	 * @param {Algorithm32ShaderHandle} handle - Supplies the disposed handle.
	 * @returns {void} -
	 */
	_forgetShaderHandle(handle) {
		this._shaderHandles.delete(handle);
	}

	/**
	 * Value that returns the current canonical configuration snapshot. The returned packet is for inspection and compatibility checks, not mutation.
	 *
	 * @returns {ConfigSnapshot} - The current configuration snapshot.
	 */
	get config() {
		this._assertUsable();

		return this._createConfigSnapshot();
	}

	/** Return the current receiver-local Color brightness proxy. */
	get brightnessProxy() {
		this._assertUsable();
		return /** @type {UnitValue<'cd m^-2'>} */ ({
			value: Number(this._colorRuntimeBindingValues['color.brightnessProxy']),
			units: 'cd m^-2',
		});
	}

	/** Return the current configured light-source brightness. */
	get sourceBrightness() {
		this._assertUsable();
		return /** @type {UnitValue<'cd m^-2'>} */ ({
			value: Number(this._colorRuntimeBindingValues['color.sceneLuminanceScale']),
			units: 'cd m^-2',
		});
	}

	/**
	 * Call this method to replace the facade configuration with a new complete configuration. The returned snapshot describes the accepted configuration state and version.
	 *
	 * @param {Config} config - Supplies the replacement Algorithm32
	 * configuration.
	 * @returns {ConfigSnapshot} - The accepted configuration snapshot.
	 */
	setConfig(config) {
		this._assertUsable();

		return this._replaceConfig(config);
	}

	/**
	 * Call this method to publish the unsmoothed global exposure target for one receiver-local adapting luminance.
	 *
	 * @param {UnitValue<'cd m^-2'>} adaptingLuminanceProxy - Current receiver-local adapting luminance.
	 * @returns {LocalExposureAdaptation} - Accepted luminance and derived target modifier.
	 */
	setAdaptingLuminance(adaptingLuminanceProxy) {
		this._assertUsable();
		const exposureModifier = this._localLightLevelCalculator.deriveExposureModifier(adaptingLuminanceProxy);
		this._colorRuntimeBindingValues['color.exposureModifier'] = exposureModifier;
		this._colorRuntimeBindingValues['color.brightnessProxy'] = adaptingLuminanceProxy.value;

		return {
			adaptingLuminanceProxy: {...adaptingLuminanceProxy},
			exposureModifier,
		};
	}

	/** Build and atomically publish the installed receiver-environment measurement. */
	async _publishReceiverEnvironmentLight(request) {
		this._assertUsable();
		const controller = this._receiverEnvironmentLightController;
		const measurement = await controller.build(request);
		if (controller !== this._receiverEnvironmentLightController) {
			throw new Error('Receiver environment-light measurement was superseded.');
		}
		this.setAdaptingLuminance(measurement.brightnessProxy);
		return measurement;
	}

	/**
	 * Call this method to build and attach the runtime shader integration. The returned handle owns Algorithm32-specific shader resources, binding lifecycle, resizing, configuration refresh, and disposal for the installed pass. Setup rejects for invalid configuration, cache construction, shader assembly, or runtime installation failure; supersession rejects with an abort error and callers must discard the rejected handle.
	 *
	 * @param {ShaderSetupRequest} request - Supplies the caller-owned Three
	 * runtime attachment handles.
	 * @returns {Promise<ShaderHandle>} - The installed runtime shader handle.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	async setupShader(request) {
		this._assertUsable();
		const builder = this._shaderBuilder;
		const snapshot = this.config;
		const buildResult = await builder.build(
			this._createShaderBuildRequest(request, snapshot, {
				signal: request.signal,
			}),
		);
		if (this._disposed || builder !== this._shaderBuilder) {
			const disposalErrors = [];
			try {
				buildResult.runtime?.dispose?.();
			} catch (error) {
				disposalErrors.push(error);
			}
			/** @type {Set<ShaderBuildOwnedCacheController>} */
			const cacheControllers = new Set();
			for (const cacheController of [
				buildResult.scatteringCacheController,
				buildResult.distantSunCelestialCacheController,
				buildResult.stellarPointSetCacheController,
				buildResult.flatFiniteSunCacheController,
			]) {
				if (cacheController) {
					cacheControllers.add(cacheController);
				}
			}
			for (const cacheController of cacheControllers) {
				try {
					cacheController.dispose();
				} catch (error) {
					disposalErrors.push(error);
				}
			}
			const supersededError = new Error('Algorithm32 shader setup was superseded.');
			if (disposalErrors.length > 0) {
				throw new AggregateError(
					[supersededError, ...disposalErrors],
					'Algorithm32 shader setup was superseded and resource disposal failed.',
				);
			}
			throw supersededError;
		}
		const handle = new Algorithm32ShaderHandle({
			facade: this,
			setup: request,
			buildResult,
		});
		this._shaderHandles.add(handle);

		return handle;
	}

	/**
	 * Call this method to run one CPU/reference Algorithm32 evaluation request. The returned result contains spectral radiance/transmittance information; it does not contain display-converted color.
	 *
	 * @param {EvaluationRequest} request - Supplies one accepted evaluation
	 * request.
	 * @returns {EvaluationResult} - The spectral evaluation result.
	 */
	evaluate(request) {
		this._assertUsable();

		return this._reference.evaluate(request);
	}

	/**
	 * Call this method to dispose resources owned by this facade.
	 *
	 * @returns {void} -
	 */
	dispose() {
		if (this._disposed) {
			return;
		}

		for (const handle of this._shaderHandles) {
			handle.dispose();
		}

		this._reference?.dispose();
		this._shaderBuilder?.dispose();
		this._receiverEnvironmentLightController?.dispose();
		this._disposed = true;
	}
}
