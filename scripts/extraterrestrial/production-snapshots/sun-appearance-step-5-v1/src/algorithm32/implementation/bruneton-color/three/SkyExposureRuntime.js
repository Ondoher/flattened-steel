import {ShaderPassPerformanceTimer} from '../../../rendering-runtime/three/ShaderPassPerformanceTimer.js';
import {GLSL_DIRECTIVE_PREFIX} from '../../../rendering-runtime/three/consts.js';
import {ShaderSource} from '../../../shader-assembly/base/ShaderSource.js';
import {TimeMath} from '../../../time/TimeMath.js';
import {
	SKY_EXPOSURE_ADAPTING_FIELD_AREA_SQUARE_DEGREES,
	SKY_EXPOSURE_MAXIMUM_FACTOR,
	SKY_EXPOSURE_MAXIMUM_DELTA_TIME_SECONDS,
	SKY_EXPOSURE_MIDDLE_GRAY_RESPONSE,
	SKY_EXPOSURE_MINIMUM_FACTOR,
	SKY_EXPOSURE_PUPIL_FLUX_EXPONENT,
	SKY_EXPOSURE_INCREASING_TIME_CONSTANT_SECONDS,
	SKY_EXPOSURE_REFERENCE_DIFFUSE_REFLECTANCE,
	SKY_EXPOSURE_REFERENCE_OBSERVER_AGE_YEARS,
	SKY_EXPOSURE_REDUCING_TIME_CONSTANT_SECONDS,
} from '../consts.js';

/** Color-owned atmospheric sky field and temporally adapted exposure reduction. */
export class SkyExposureRuntime {
	/** @type {SkyExposurePrivateThreeNamespace} */
	_THREE;
	/** @type {SkyExposureMeterPlan} */
	_plan;
	/** @type {number} */
	_paperFigure1ToneMapK;
	/** @type {SkyExposurePrivateRenderTarget} */
	_sampleTarget;
	/** @type {SkyExposurePrivateRenderTarget} */
	_measurementTarget;
	/** @type {readonly SkyExposurePrivateRenderTarget[]} */
	_coefficientTargets;
	/** @type {number} */
	_currentCoefficientTargetIndex = 0;
	/** @type {boolean} */
	_hasExposureHistory = false;
	/** @type {ShaderRuntimeUniformMap} */
	_runtimeUniforms;
	/** @type {ShaderRuntimeUniformMap} */
	_coefficientUniforms;
	/** @type {SkyExposurePrivateMaterial} */
	_sampleMaterial;
	/** @type {SkyExposurePrivateMaterial} */
	_reductionMaterial;
	/** @type {SkyExposurePrivateMaterial} */
	_coefficientMaterial;
	/** @type {ShaderRuntimePassGeometry} */
	_geometry;
	/** @type {ShaderRuntimePassScene} */
	_sampleScene;
	/** @type {ShaderRuntimePassScene} */
	_reductionScene;
	/** @type {ShaderRuntimePassScene} */
	_coefficientScene;
	/** @type {ShaderRuntimePassCamera} */
	_camera;
	/** @type {ShaderPassPerformanceTimer[]} */
	_performanceTimers;
	/** @type {readonly number[]} */
	_sourceCharacterCounts;
	/** @type {number | null} */
	_preparationDurationSeconds = null;
	/** @type {number} */
	_frameCount = 0;
	/** @type {boolean} */
	_disposed = false;

	/**
	 * Creates the fixed HDR sample field and one-pixel reductions.
	 *
	 * @param {SkyExposureRuntimeConfiguration} configuration - Trusted model, shader, and renderer values.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('SkyExposureRuntime configuration is required.');
		}
		if (typeof configuration.fragmentShaderSource !== 'string' || configuration.fragmentShaderSource.length === 0) {
			throw new TypeError('SkyExposureRuntime requires nonempty assembled fragment shader source.');
		}
		if (!Number.isFinite(configuration.paperFigure1ToneMapK) || configuration.paperFigure1ToneMapK <= 0) {
			throw new RangeError('SkyExposureRuntime paperFigure1ToneMapK must be positive and finite.');
		}
		if (
			configuration.plan?.ringCount !== 4 ||
			configuration.plan?.azimuthCount !== 8 ||
			configuration.plan?.samples.length !== 32
		) {
			throw new RangeError('SkyExposureRuntime requires the fixed 4-by-8 geometry meter plan.');
		}
		this._THREE = /** @type {SkyExposurePrivateThreeNamespace} */ (configuration.THREE);
		this._plan = configuration.plan;
		this._paperFigure1ToneMapK = configuration.paperFigure1ToneMapK;
		this._runtimeUniforms = configuration.uniforms;

		const sampleSource = this._createSampleFragmentShader(configuration.fragmentShaderSource);
		const reductionSource = this._createReductionFragmentShader();
		const coefficientSource = this._createCoefficientFragmentShader();
		this._sourceCharacterCounts = [sampleSource.length, reductionSource.length, coefficientSource.length];

		this._sampleTarget = this._createTarget(
			this._plan.sampleGridSize.width,
			this._plan.sampleGridSize.height,
			'algorithm32-sky-exposure-samples-r32f',
		);
		this._measurementTarget = this._createTarget(1, 1, 'algorithm32-sky-illuminance-r32f');
		this._coefficientTargets = [
			this._createTarget(1, 1, 'algorithm32-sky-exposure-coefficient-r32f-a'),
			this._createTarget(1, 1, 'algorithm32-sky-exposure-coefficient-r32f-b'),
		];

		this._sampleMaterial = this._createMaterial(sampleSource, configuration.uniforms);
		this._reductionMaterial = this._createMaterial(reductionSource, {
			uSkyLuminanceTexture: {value: this._sampleTarget.texture},
		});
		this._coefficientUniforms = {
			uSkyIlluminanceTexture: {value: this._measurementTarget.texture},
			uPreviousSkyExposureCoefficientTexture: {value: this._coefficientTargets[0].texture},
			uSkyExposureDeltaTimeSeconds: {value: 0},
			uSkyExposureHasHistory: {value: false},
		};
		this._coefficientMaterial = this._createMaterial(coefficientSource, this._coefficientUniforms);
		this._geometry = new this._THREE.PlaneGeometry(2, 2);
		this._sampleScene = this._createScene(this._sampleMaterial);
		this._reductionScene = this._createScene(this._reductionMaterial);
		this._coefficientScene = this._createScene(this._coefficientMaterial);
		this._camera = new this._THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		const timerConfiguration = {
			performanceCallback: configuration.performanceCallback,
			sampleIntervalFrames: configuration.performanceSampleIntervalFrames,
			maxPendingQueries: configuration.performanceMaxPendingQueries,
		};
		this._performanceTimers = [
			'algorithm32-sky-exposure-sample',
			'algorithm32-sky-exposure-reduction',
			'algorithm32-sky-exposure-coefficient',
		].map(
			/**
			 * Called by Array.prototype.map to create one pass-local performance timer.
			 * @param passName - The stable pass diagnostic name.
			 * @returns - The configured timer.
			 */ (passName) => new ShaderPassPerformanceTimer({passName, ...timerConfiguration}),
		);
	}

	/** @returns {ShaderRuntimePassTexture} - The published one-pixel coefficient texture. */
	get coefficientTexture() {
		return this._coefficientTargets[this._currentCoefficientTargetIndex].texture;
	}

	/** @returns {SkyExposureRuntimeBindingValues} - The exact Color binding patch. */
	bindingValues() {
		return {'color.skyExposureCoefficientTexture': this.coefficientTexture};
	}

	/** @returns {string} - Fullscreen GLSL3 vertex source. */
	_vertexShader() {
		return `${GLSL_DIRECTIVE_PREFIX}version 300 es
precision highp float;
in vec3 position;
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
	}

	/**
	 * @param {string} source - GLSL source.
	 * @returns {string} - Source without the version directive consumed by Three.
	 */
	_stripGlslVersion(source) {
		return source.replace(new RegExp(`^${GLSL_DIRECTIVE_PREFIX}version\\s+300\\s+es\\s*\\n`), '');
	}

	/**
	 * @param {number} width - Target width in pixels.
	 * @param {number} height - Target height in pixels.
	 * @param {string} name - Diagnostic texture name.
	 * @returns {SkyExposurePrivateRenderTarget} - The R32F target.
	 */
	_createTarget(width, height, name) {
		const target = new this._THREE.WebGLRenderTarget(width, height, {
			format: this._THREE.RedFormat,
			internalFormat: 'R32F',
			type: this._THREE.FloatType,
			depthBuffer: false,
			stencilBuffer: false,
			magFilter: this._THREE.NearestFilter,
			minFilter: this._THREE.NearestFilter,
		});
		target.texture.name = name;
		target.texture.generateMipmaps = false;
		if (this._THREE.NoColorSpace !== undefined) {
			target.texture.colorSpace = this._THREE.NoColorSpace;
		}
		return target;
	}

	/**
	 * @param {string} fragmentShader - Fragment source.
	 * @param {ShaderRuntimeUniformMap} uniforms - Shader uniforms.
	 * @returns {SkyExposurePrivateMaterial} - The private material.
	 */
	_createMaterial(fragmentShader, uniforms) {
		return /** @type {SkyExposurePrivateMaterial} */ (
			new this._THREE.RawShaderMaterial({
				glslVersion: this._THREE.GLSL3 ?? '300 es',
				vertexShader: this._stripGlslVersion(this._vertexShader()),
				fragmentShader: this._stripGlslVersion(fragmentShader),
				uniforms,
				depthTest: false,
				depthWrite: false,
			})
		);
	}

	/**
	 * @param {SkyExposurePrivateMaterial} material - Pass material.
	 * @returns {ShaderRuntimePassScene} - Fullscreen scene.
	 */
	_createScene(material) {
		const scene = new this._THREE.Scene();
		scene.add(new this._THREE.Mesh(this._geometry, material));
		return scene;
	}

	/**
	 * @param {string} source - Accepted complete Algorithm32 fragment source.
	 * @returns {string} - Atmospheric-only one-ray-per-fragment meter source.
	 */
	_createSampleFragmentShader(source) {
		const main = `void main() {
	ivec2 samplePixel = ivec2(floor(gl_FragCoord.xy));
	float cosineElevation = (float(samplePixel.y) + 0.5) / ${this._plan.ringCount}.0;
	float horizontalLength = sqrt(max(0.0, 1.0 - cosineElevation * cosineElevation));
	float azimuthRadians = 2.0 * 3.141592653589793 * (float(samplePixel.x) + 0.5) / ${this._plan.azimuthCount}.0;
	vec3 localDirection = vec3(horizontalLength * cos(azimuthRadians), cosineElevation, horizontalLength * sin(azimuthRadians));
	vec3 direction = normalize(
		GEOMETRY_OBSERVER_RIGHT_DIRECTION * localDirection.x
		+ GEOMETRY_OBSERVER_UP_DIRECTION * localDirection.y
		+ GEOMETRY_OBSERVER_FORWARD_DIRECTION * localDirection.z
	);
	ShaderState state;
	state.ray = ViewRay(uCameraWorldPositionMeters, direction);
	state.bounds = resolveAtmospherePath(state.ray, 0.0, false);
	evaluatePathRadiance(state);
	outColor = vec4(max(spectralRadianceToPhotopicLuminance(state.pathRadiance), 0.0), 0.0, 0.0, 1.0);
}`;

		if (!source.includes('void main() {')) {
			throw new Error('Cannot derive sky-exposure sample shader: assembled shader has no main function.');
		}
		return source.replace(/void main\(\) \{[\s\S]*\}\s*$/u, `${main}\n`);
	}

	/** @returns {string} - One-pixel projected-illuminance reduction source. */
	_createReductionFragmentShader() {
		return `${GLSL_DIRECTIVE_PREFIX}version 300 es
precision highp float;
uniform sampler2D uSkyLuminanceTexture;
out vec4 outColor;
void main() {
	float illuminanceLux = 0.0;
	const float solidAngleSteradians = 2.0 * 3.141592653589793 / ${this._plan.samples.length}.0;
	for (int ringIndex = 0; ringIndex < ${this._plan.ringCount}; ringIndex += 1) {
		float cosineElevation = (float(ringIndex) + 0.5) / ${this._plan.ringCount}.0;
		float projectedSolidAngleSteradians = cosineElevation * solidAngleSteradians;
		for (int azimuthIndex = 0; azimuthIndex < ${this._plan.azimuthCount}; azimuthIndex += 1) {
			illuminanceLux += texelFetch(uSkyLuminanceTexture, ivec2(azimuthIndex, ringIndex), 0).r * projectedSolidAngleSteradians;
		}
	}
	outColor = vec4(max(illuminanceLux, 0.0), 0.0, 0.0, 1.0);
}
`;
	}

	/** @returns {string} - One-pixel target calculation and stop-space temporal adaptation source. */
	_createCoefficientFragmentShader() {
		const referenceIlluminanceLux =
			(Math.PI * -Math.log(1 - SKY_EXPOSURE_MIDDLE_GRAY_RESPONSE)) /
			(this._paperFigure1ToneMapK * SKY_EXPOSURE_REFERENCE_DIFFUSE_REFLECTANCE);
		const illuminanceFloorLux = referenceIlluminanceLux / SKY_EXPOSURE_MAXIMUM_FACTOR;
		const referencePupilDiameterMillimeters = this._resolveSkyExposurePupilDiameter(referenceIlluminanceLux);
		return `${GLSL_DIRECTIVE_PREFIX}version 300 es
precision highp float;
uniform sampler2D uSkyIlluminanceTexture;
uniform sampler2D uPreviousSkyExposureCoefficientTexture;
uniform float uSkyExposureDeltaTimeSeconds;
uniform bool uSkyExposureHasHistory;
out vec4 outColor;
void main() {
	float skyIlluminanceLux = max(texelFetch(uSkyIlluminanceTexture, ivec2(0), 0).r, 0.0);
	float adaptingLuminanceCandelasPerSquareMeter = skyIlluminanceLux / 3.141592653589793;
	float effectiveCornealFlux = adaptingLuminanceCandelasPerSquareMeter * ${ShaderSource.formatFloat(SKY_EXPOSURE_ADAPTING_FIELD_AREA_SQUARE_DEGREES)};
	float fluxResponse = pow(effectiveCornealFlux, ${ShaderSource.formatFloat(SKY_EXPOSURE_PUPIL_FLUX_EXPONENT)});
	float observerAgeYears = ${ShaderSource.formatFloat(SKY_EXPOSURE_REFERENCE_OBSERVER_AGE_YEARS)};
	float constantPupilNumerator = 18.5172 - 0.105569 * observerAgeYears;
	float fluxPupilNumerator = 0.122165 + 0.000138645 * observerAgeYears;
	float pupilDiameterMillimeters;
	if (fluxResponse > 1.0) {
		float inverseFluxResponse = 1.0 / fluxResponse;
		pupilDiameterMillimeters = (
			constantPupilNumerator * inverseFluxResponse + fluxPupilNumerator
		) / (2.0 * inverseFluxResponse + 0.0630635);
	} else {
		pupilDiameterMillimeters = (
			constantPupilNumerator + fluxPupilNumerator * fluxResponse
		) / (2.0 + 0.0630635 * fluxResponse);
	}
	float reciprocalExposureFactor = ${ShaderSource.formatFloat(referenceIlluminanceLux)}
		/ max(skyIlluminanceLux, ${ShaderSource.formatFloat(illuminanceFloorLux)});
	float pupilAreaExposureFactor = pow(
		pupilDiameterMillimeters / ${ShaderSource.formatFloat(referencePupilDiameterMillimeters)},
		2.0
	);
	float targetExposureFactor = clamp(
		min(reciprocalExposureFactor, pupilAreaExposureFactor),
		${ShaderSource.formatFloat(SKY_EXPOSURE_MINIMUM_FACTOR)},
		${ShaderSource.formatFloat(SKY_EXPOSURE_MAXIMUM_FACTOR)}
	);
	float exposureFactor = targetExposureFactor;
	if (uSkyExposureHasHistory) {
		float currentCoefficient = max(
			texelFetch(uPreviousSkyExposureCoefficientTexture, ivec2(0), 0).r,
			${ShaderSource.formatFloat(this._paperFigure1ToneMapK * SKY_EXPOSURE_MINIMUM_FACTOR)}
		);
		float currentStops = log2(currentCoefficient / ${ShaderSource.formatFloat(this._paperFigure1ToneMapK)});
		float targetStops = log2(targetExposureFactor);
		float timeConstantSeconds = targetStops < currentStops
			? ${ShaderSource.formatFloat(SKY_EXPOSURE_REDUCING_TIME_CONSTANT_SECONDS)}
			: ${ShaderSource.formatFloat(SKY_EXPOSURE_INCREASING_TIME_CONSTANT_SECONDS)};
		float blend = 1.0 - exp(-uSkyExposureDeltaTimeSeconds / timeConstantSeconds);
		exposureFactor = exp2(currentStops + (targetStops - currentStops) * blend);
	}
	outColor = vec4(${ShaderSource.formatFloat(this._paperFigure1ToneMapK)} * exposureFactor, 0.0, 0.0, 1.0);
}
`;
	}

	/**
	 * Called by SkyExposureRuntime to evaluate Watson and Yellott's 2012 binocular light-adapted pupil formula for the reference-age observer and upper-hemisphere adapting field.
	 *
	 * @param {number} skyIlluminanceLux - Supplies projected upper-sky illuminance.
	 * @returns {number} - Predicted entrance-pupil diameter in millimeters.
	 */
	_resolveSkyExposurePupilDiameter(skyIlluminanceLux) {
		const adaptingLuminanceCandelasPerSquareMeter = skyIlluminanceLux / Math.PI;
		const effectiveCornealFlux =
			adaptingLuminanceCandelasPerSquareMeter * SKY_EXPOSURE_ADAPTING_FIELD_AREA_SQUARE_DEGREES;
		const fluxResponse = effectiveCornealFlux ** SKY_EXPOSURE_PUPIL_FLUX_EXPONENT;
		const observerAgeYears = SKY_EXPOSURE_REFERENCE_OBSERVER_AGE_YEARS;
		const constantNumerator = 18.5172 - 0.105569 * observerAgeYears;
		const fluxNumerator = 0.122165 + 0.000138645 * observerAgeYears;
		if (fluxResponse > 1) {
			const inverseFluxResponse = 1 / fluxResponse;
			return (constantNumerator * inverseFluxResponse + fluxNumerator) / (2 * inverseFluxResponse + 0.0630635);
		}

		return (constantNumerator + fluxNumerator * fluxResponse) / (2 + 0.0630635 * fluxResponse);
	}

	/**
	 * @param {SkyExposureRuntimeRenderer} renderer - Renderer owning the programs.
	 * @returns {Promise<void>} - Completion after all programs are ready.
	 */
	async prepare(renderer) {
		this._assertUsable();
		const startMilliseconds = TimeMath.nowMilliseconds();
		for (const scene of [this._sampleScene, this._reductionScene, this._coefficientScene]) {
			if (typeof renderer.compileAsync === 'function') {
				await renderer.compileAsync(scene, this._camera);
			} else {
				renderer.compile(scene, this._camera);
			}
		}
		this._preparationDurationSeconds = (TimeMath.nowMilliseconds() - startMilliseconds) / 1000;
	}

	/**
	 * @param {SkyExposureRuntimeRenderer} renderer - Renderer executing the passes.
	 * @param {SkyExposureRenderRequest} request - Current timing input.
	 * @returns {void} - No value.
	 * @throws {RangeError} - When frame time is not finite and nonnegative.
	 */
	render(renderer, request) {
		this._assertUsable();
		if (!Number.isFinite(request.deltaTimeSeconds) || request.deltaTimeSeconds < 0) {
			throw new RangeError('Sky-exposure deltaTimeSeconds must be finite and nonnegative.');
		}
		const deltaTimeSeconds = Math.min(request.deltaTimeSeconds, SKY_EXPOSURE_MAXIMUM_DELTA_TIME_SECONDS);
		const nextCoefficientTargetIndex = 1 - this._currentCoefficientTargetIndex;
		this._coefficientUniforms.uPreviousSkyExposureCoefficientTexture.value = this.coefficientTexture;
		this._coefficientUniforms.uSkyExposureDeltaTimeSeconds.value = deltaTimeSeconds;
		this._coefficientUniforms.uSkyExposureHasHistory.value = this._hasExposureHistory;
		const previousTarget = renderer.getRenderTarget();
		const passes = [
			{target: this._sampleTarget, scene: this._sampleScene},
			{target: this._measurementTarget, scene: this._reductionScene},
			{target: this._coefficientTargets[nextCoefficientTargetIndex], scene: this._coefficientScene},
		];

		try {
			for (let passIndex = 0; passIndex < passes.length; passIndex += 1) {
				const pass = passes[passIndex];
				renderer.setRenderTarget(pass.target);
				const timingSample = this._performanceTimers[passIndex].begin(renderer, {frameCount: this._frameCount});
				try {
					renderer.render(pass.scene, this._camera);
				} finally {
					this._performanceTimers[passIndex].end(renderer, timingSample);
				}
			}
			this._currentCoefficientTargetIndex = nextCoefficientTargetIndex;
			this._hasExposureHistory = true;
			if (this._runtimeUniforms.uSkyExposureCoefficientTexture) {
				this._runtimeUniforms.uSkyExposureCoefficientTexture.value = this.coefficientTexture;
			}
			this._frameCount += 1;
		} finally {
			renderer.setRenderTarget(previousTarget);
		}
	}

	/**
	 * @param {SkyExposureRuntimeRenderer} renderer - Renderer performing explicit readback.
	 * @returns {SkyExposureMeasurementDiagnostics} - Current measurement and coefficient.
	 */
	inspect(renderer) {
		this._assertUsable();
		const measurement = new Float32Array(1);
		const coefficient = new Float32Array(1);
		renderer.readRenderTargetPixels(this._measurementTarget, 0, 0, 1, 1, measurement);
		renderer.readRenderTargetPixels(
			this._coefficientTargets[this._currentCoefficientTargetIndex],
			0,
			0,
			1,
			1,
			coefficient,
		);
		const referenceIlluminanceLux =
			(Math.PI * -Math.log(1 - SKY_EXPOSURE_MIDDLE_GRAY_RESPONSE)) /
			(this._paperFigure1ToneMapK * SKY_EXPOSURE_REFERENCE_DIFFUSE_REFLECTANCE);
		const targetExposureFactor = Math.min(
			SKY_EXPOSURE_MAXIMUM_FACTOR,
			Math.max(
				SKY_EXPOSURE_MINIMUM_FACTOR,
				Math.min(
					referenceIlluminanceLux /
						Math.max(measurement[0], referenceIlluminanceLux / SKY_EXPOSURE_MAXIMUM_FACTOR),
					(this._resolveSkyExposurePupilDiameter(measurement[0]) /
						this._resolveSkyExposurePupilDiameter(referenceIlluminanceLux)) **
						2,
				),
			),
		);
		return {
			skyIlluminanceLux: measurement[0],
			targetExposureFactor,
			currentExposureFactor: coefficient[0] / this._paperFigure1ToneMapK,
			effectiveDisplayCoefficient: coefficient[0],
			referenceIlluminanceLux,
			illuminanceFloorLux: referenceIlluminanceLux / SKY_EXPOSURE_MAXIMUM_FACTOR,
			minimumExposureFactor: SKY_EXPOSURE_MINIMUM_FACTOR,
			maximumExposureFactor: SKY_EXPOSURE_MAXIMUM_FACTOR,
			temporalMode: 'smoothed',
		};
	}

	/** @returns {SkyExposureRuntimeDiagnostics} - Resource diagnostics without readback. */
	getDiagnostics() {
		return {
			kind: 'algorithm32-sky-exposure-runtime',
			status: this._disposed ? 'disposed' : 'ready',
			sampleGridSize: this._plan.sampleGridSize,
			sampleTextureFormat: 'R32F',
			coefficientTextureFormat: 'R32F',
			temporalMode: 'smoothed',
			frameCount: this._frameCount,
			sampleShaderSourceCharacterCount: this._sourceCharacterCounts[0],
			reductionShaderSourceCharacterCount: this._sourceCharacterCounts[1],
			coefficientShaderSourceCharacterCount: this._sourceCharacterCounts[2],
			preparationDurationSeconds: this._preparationDurationSeconds,
		};
	}

	/** @returns {void} - No value. */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('Cannot use a disposed sky-exposure runtime.');
		}
	}

	/** Release every privately owned GPU resource exactly once. */
	dispose() {
		if (this._disposed) {
			return;
		}
		this._disposed = true;
		for (const timer of this._performanceTimers) {
			timer.dispose();
		}
		this._sampleMaterial.dispose();
		this._reductionMaterial.dispose();
		this._coefficientMaterial.dispose();
		this._geometry.dispose?.();
		this._sampleTarget.dispose();
		this._measurementTarget.dispose();
		for (const target of this._coefficientTargets) {
			target.dispose();
		}
	}
}
