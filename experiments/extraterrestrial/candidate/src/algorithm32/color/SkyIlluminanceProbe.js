import { GLSL_DIRECTIVE_PREFIX } from '../implementation/consts.js';
import { formatShaderFloat, formatShaderFloatArray } from '../shader/shaderContribution.js';

/** Color-owned one-pixel HDR reduction over Geometry's upper-sky quadrature. */
export class SkyIlluminanceProbe {
	/** @type {import('three').WebGLRenderTarget} */
	_target;
	/** @type {import('three').RawShaderMaterial} */
	_material;
	/** @type {import('three').Scene} */
	_scene;
	/** @type {import('three').OrthographicCamera} */
	_camera;
	/** @type {import('three').PlaneGeometry} */
	_geometry;
	/** @type {import('three').WebGLRenderTarget} */
	_sampleTarget;
	/** @type {import('three').RawShaderMaterial} */
	_sampleMaterial;
	/** @type {import('three').Scene} */
	_sampleScene;
	/** @type {boolean} */
	_disposed = false;

	/**
	 * @param {{ readonly THREE: typeof import('three'), readonly fragmentShaderSource: string, readonly uniforms: Record<string, { value: unknown }>, readonly plan: ReturnType<import('../geometries/SkyIlluminanceProbePlan.js').createSkyIlluminanceProbePlan> }} configuration
	 */
	constructor(configuration) {
		const { THREE, plan } = configuration;
		if (!plan?.samples?.length) {
			throw new TypeError('Sky illuminance probe requires a nonempty geometry plan.');
		}
	const source = this._createProbeFragmentShader(configuration.fragmentShaderSource, plan);
		this._target = new THREE.WebGLRenderTarget(1, 1, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			depthBuffer: false,
			stencilBuffer: false,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
		});
		this._target.texture.name = 'algorithm32-sky-irradiance-rgba32f';
		this._target.texture.generateMipmaps = false;
		this._target.texture.colorSpace = THREE.NoColorSpace;
		this._sampleTarget = new THREE.WebGLRenderTarget(plan.samples.length, 1, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			depthBuffer: false,
			stencilBuffer: false,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
		});
		this._sampleTarget.texture.name = 'algorithm32-sky-illuminance-sample-log-rgba32f';
		this._sampleTarget.texture.generateMipmaps = false;
		this._sampleTarget.texture.colorSpace = THREE.NoColorSpace;
		this._material = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3 ?? '300 es',
			vertexShader: this._stripGlslVersion(this._vertexShader()),
			fragmentShader: this._stripGlslVersion(source),
			uniforms: configuration.uniforms,
			depthTest: false,
			depthWrite: false,
		});
		this._sampleMaterial = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3 ?? '300 es',
			vertexShader: this._stripGlslVersion(this._vertexShader()),
			fragmentShader: this._stripGlslVersion(this._createSampleProbeFragmentShader(configuration.fragmentShaderSource, plan)),
			uniforms: configuration.uniforms,
			depthTest: false,
			depthWrite: false,
		});
		this._geometry = new THREE.PlaneGeometry(2, 2);
		this._scene = new THREE.Scene();
		this._scene.add(new THREE.Mesh(this._geometry, this._material));
		this._sampleScene = new THREE.Scene();
		this._sampleScene.add(new THREE.Mesh(this._geometry, this._sampleMaterial));
		this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	}

	get texture() {
		return this._target.texture;
	}

	_vertexShader() {
		return `${GLSL_DIRECTIVE_PREFIX}version 300 es
precision highp float;
in vec3 position;
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
	}

	_stripGlslVersion(source) {
		return source.replace(new RegExp(`^${GLSL_DIRECTIVE_PREFIX}version\\s+300\\s+es\\s*\\n`), '');
	}

	_createProbeFragmentShader(source, plan) {
		const directions = plan.samples.flatMap((sample) => sample.localDirection);
		const weights = plan.samples.map((sample) => sample.projectedSolidAngleSteradians);
		const main = `void main() {
	float illuminanceLux = 0.0;
	vec3 irradianceLinearSrgb = vec3(0.0);
	for (int sampleIndex = 0; sampleIndex < ${plan.samples.length}; sampleIndex += 1) {
		vec3 localDirection = vec3(
			SKY_PROBE_LOCAL_DIRECTIONS[sampleIndex * 3],
			SKY_PROBE_LOCAL_DIRECTIONS[sampleIndex * 3 + 1],
			SKY_PROBE_LOCAL_DIRECTIONS[sampleIndex * 3 + 2]
		);
		vec3 direction = normalize(
			GEOMETRY_OBSERVER_RIGHT_DIRECTION * localDirection.x
			+ GEOMETRY_OBSERVER_UP_DIRECTION * localDirection.y
			+ GEOMETRY_OBSERVER_FORWARD_DIRECTION * localDirection.z
		);
		ShaderState state;
		state.ray = ViewRay(uCameraWorldPositionMeters, direction);
		state.bounds = resolveAtmospherePath(state.ray, 0.0, false);
		evaluatePathRadiance(state);
		float projectedSolidAngle = SKY_PROBE_PROJECTED_SOLID_ANGLE[sampleIndex];
		illuminanceLux += spectralRadianceToPhotopicLuminance(state.pathRadiance)
			* projectedSolidAngle;
		irradianceLinearSrgb += spectralRadianceToLinearSrgb(state.pathRadiance)
			* projectedSolidAngle;
	}
	outColor = vec4(max(illuminanceLux, 0.0), max(irradianceLinearSrgb, vec3(0.0)));
}`;
		const constants = `const int SKY_PROBE_SAMPLE_COUNT = ${plan.samples.length};
const float SKY_PROBE_LOCAL_DIRECTIONS[${directions.length}] = float[${directions.length}](${formatShaderFloatArray(directions)});
const float SKY_PROBE_PROJECTED_SOLID_ANGLE[${weights.length}] = float[${weights.length}](${formatShaderFloatArray(weights)});
`;
		if (!source.includes('void main() {')) {
			throw new Error('Cannot derive sky probe shader: assembled shader has no main function.');
		}
		return source.replace(/void main\(\) \{[\s\S]*\}\s*$/, `${constants}\n${main}\n`);
	}

	_createSampleProbeFragmentShader(source, plan) {
		const directions = plan.samples.flatMap((sample) => sample.localDirection);
		const main = `void main() {
	int sampleIndex = int(floor(gl_FragCoord.x));
	vec3 localDirection = vec3(
		SKY_PROBE_LOCAL_DIRECTIONS[sampleIndex * 3],
		SKY_PROBE_LOCAL_DIRECTIONS[sampleIndex * 3 + 1],
		SKY_PROBE_LOCAL_DIRECTIONS[sampleIndex * 3 + 2]
	);
	vec3 direction = normalize(
		GEOMETRY_OBSERVER_RIGHT_DIRECTION * localDirection.x
		+ GEOMETRY_OBSERVER_UP_DIRECTION * localDirection.y
		+ GEOMETRY_OBSERVER_FORWARD_DIRECTION * localDirection.z
	);
	ShaderState state;
	state.ray = ViewRay(uCameraWorldPositionMeters, direction);
	state.bounds = resolveAtmospherePath(state.ray, 0.0, false);
	evaluatePathRadiance(state);
	float luminance = spectralRadianceToPhotopicLuminance(state.pathRadiance);
	float isPositive = luminance > 0.0 ? 1.0 : 0.0;
	// Encode before readback so the diagnostic retains dark but nonzero results.
	outColor = vec4(isPositive, log2(max(luminance, 1.0e-30)), 0.0, 1.0);
}`;
		const constants = `const float SKY_PROBE_LOCAL_DIRECTIONS[${directions.length}] = float[${directions.length}](${formatShaderFloatArray(directions)});
`;
		if (!source.includes('void main() {')) {
			throw new Error('Cannot derive sky probe sample shader: assembled shader has no main function.');
		}
		return source.replace(/void main\(\) \{[\s\S]*\}\s*$/, `${constants}\n${main}\n`);
	}

	/** Render the live atmospheric-only meter before the display pass. */
	render(renderer) {
		if (this._disposed) throw new Error('Cannot render a disposed sky illuminance probe.');
		const previousTarget = renderer.getRenderTarget();
		try {
			renderer.setRenderTarget(this._target);
			renderer.clear();
			renderer.render(this._scene, this._camera);
		} finally {
			renderer.setRenderTarget(previousTarget);
		}
	}

	/** Render one log-luminance diagnostic sample for every geometry-provided sky ray. */
	renderSampleLogLuminance(renderer) {
		if (this._disposed) throw new Error('Cannot render a disposed sky illuminance probe.');
		const previousTarget = renderer.getRenderTarget();
		try {
			renderer.setRenderTarget(this._sampleTarget);
			renderer.clear();
			renderer.render(this._sampleScene, this._camera);
		} finally {
			renderer.setRenderTarget(previousTarget);
		}
	}

	getDiagnostics() {
		return {
			status: this._disposed ? 'disposed' : 'ready',
			format: 'RGBA32F',
			width: 1,
			height: 1,
		};
	}

	/** Read the HDR photopic meter for contained Geometry-lighting qualification. */
	readIlluminanceLux(renderer) {
		if (this._disposed) throw new Error('Cannot read a disposed sky illuminance probe.');
		const values = new Float32Array(4);
		renderer.readRenderTargetPixels(this._target, 0, 0, 1, 1, values);
		return values[0];
	}

	/** Read sampled sky diffuse irradiance in the Color scene-linear RGB basis. */
	readIrradianceLinearSrgb(renderer) {
		if (this._disposed) throw new Error('Cannot read a disposed sky illuminance probe.');
		const values = new Float32Array(4);
		renderer.readRenderTargetPixels(this._target, 0, 0, 1, 1, values);
		return [values[1], values[2], values[3]];
	}

	/** Read per-ray atmospheric path-luminance diagnostics for contained qualification only. */
	readSampleLogLuminance(renderer) {
		if (this._disposed) throw new Error('Cannot read a disposed sky illuminance probe.');
		this.renderSampleLogLuminance(renderer);
		const values = new Float32Array(this._sampleTarget.width * 4);
		renderer.readRenderTargetPixels(this._sampleTarget, 0, 0, this._sampleTarget.width, 1, values);
		return Array.from({ length: this._sampleTarget.width }, (_, index) => ({
			positive: values[index * 4] > 0.5,
			log2PhotopicLuminance: values[index * 4 + 1],
		}));
	}

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._material.dispose();
		this._sampleMaterial.dispose();
		this._geometry.dispose();
		this._target.dispose();
		this._sampleTarget.dispose();
	}
}
