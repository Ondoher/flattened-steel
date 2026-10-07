import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {ColorResetSlope078P9ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p9/ColorResetSlope078P9ColorDisplayModel.js';
import {BrunetonColorDisplayModel} from '../../../src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {COLOR_RESET_SLOPE_078_P2_CURVE} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/consts.js';
import {
	DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
	DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
	DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
} from '../../../src/algorithm32/implementation/distant-sun/cache/consts.js';

/** Actual target allocation and CPU/GLSL display proof, independent of film encoding. */
export class TheHoursGpuProof {
	/**
	 * Called by the shader proof to compile a retained production source block.
	 *
	 * @param {WebGL2RenderingContext} context - Proof context.
	 * @param {number} kind - Shader stage enumeration.
	 * @param {string} source - Complete production-derived source.
	 * @returns {WebGLShader} - Compiled shader; failure throws.
	 */
	_shader(context, kind, source) {
		const shader = context.createShader(kind);
		context.shaderSource(shader, source);
		context.compileShader(shader);
		if (!context.getShaderParameter(shader, context.COMPILE_STATUS))
			throw new Error(context.getShaderInfoLog(shader));
		return shader;
	}

	/**
	 * Called by the display proof to obtain a global analytic bound on negative gain elasticity.
	 *
	 * @returns {TheHoursMonotonicProof} - Three intervals covering all nonnegative illuminance.
	 */
	_monotonicity() {
		const curve = COLOR_RESET_SLOPE_078_P2_CURVE;
		const pivot = curve.adaptationPivotIlluminanceLux,
			middle = 500,
			scale = Math.sqrt(1 + curve.sunsetAmplitude);
		if (curve.sunsetRolloffPower !== 2 || middle > curve.sunsetTransitionIlluminanceLux * Math.sqrt(scale))
			throw new Error(
				'P2 analytic interval proof needs its registered power and increasing base-elasticity intervals.',
			);
		const bounds = [
			{
				lowerLux: 0,
				upperLux: pivot,
				negativeElasticityUpperBound: this._baseElasticity(pivot) + curve.adaptationExponent,
			},
			{
				lowerLux: pivot,
				upperLux: middle,
				negativeElasticityUpperBound: this._baseElasticity(middle) + this._adaptationBound(pivot),
			},
			{
				lowerLux: middle,
				upperLux: null,
				negativeElasticityUpperBound:
					(curve.sunsetRolloffPower * (scale - 1)) / (scale + 1) + this._adaptationBound(middle),
			},
		];
		if (!bounds.every((interval) => interval.negativeElasticityUpperBound < 1))
			throw new Error('P2 analytic brightness proof failed.');
		return {equation: 'd(E*gain)/dE = gain * (1 + d(log gain)/d(log E)); dark endpoint gain > 0', bounds};
	}

	/** Called by the interval proof to bound the negative elasticity of the common sunset term.
	 * @param {number} illuminance - Nonnegative physical lux.
	 * @returns {number} - Exact sunset-term negative elasticity.
	 */
	_baseElasticity(illuminance) {
		const curve = COLOR_RESET_SLOPE_078_P2_CURVE,
			square = (illuminance / curve.sunsetTransitionIlluminanceLux) ** curve.sunsetRolloffPower;
		return (
			(curve.sunsetRolloffPower * curve.sunsetAmplitude * square) /
			((1 + square) * (1 + curve.sunsetAmplitude + square))
		);
	}

	/** Called by the interval proof to bound adaptation's decreasing negative elasticity.
	 * @param {number} illuminance - Nonnegative physical lux.
	 * @returns {number} - Conservative adaptation negative-elasticity bound.
	 */
	_adaptationBound(illuminance) {
		const curve = COLOR_RESET_SLOPE_078_P2_CURVE;
		return (
			curve.adaptationExponent /
			(1 +
				((illuminance + curve.adaptationFloorIlluminanceLux) / curve.adaptationPivotIlluminanceLux) **
					(1 / curve.adaptationSoftnessLogUnits))
		);
	}

	/**
	 * Call this method to measure the exact browser/GPU target and qualify two baseline-sized atlases.
	 * Allocation, framebuffer, readback or context failures throw. Both textures coexist
	 * throughout all 48 layer probes and are released before the live replay starts.
	 *
	 * @returns {TheHoursGpuBudgetProof} - Actual target and admitted unchanged byte ceiling.
	 */
	budget() {
		const context = new OffscreenCanvas(1, 1).getContext('webgl2');
		if (!context || !context.getExtension('EXT_color_buffer_float'))
			throw new Error('The Hours requires float framebuffer support.');
		const extension = context.getExtension('WEBGL_debug_renderer_info');
		const renderer = extension ? String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : '';
		const hardware = renderer.match(/ANGLE \((?:[^,]+), (.+?) \(/u)?.[1];
		const chrome = navigator.userAgent.match(/Chrome\/(\d+)\./u)?.[1];
		if (!hardware || !chrome || !/Direct3D11.*D3D11/u.test(renderer))
			throw new Error('The measured two-atlas policy requires the declared ANGLE D3D11 target.');
		const framebuffer = context.createFramebuffer();
		const textures = [];
		try {
			for (let atlas = 0; atlas < 2; atlas += 1) {
				const texture = context.createTexture();
				textures.push(texture);
				context.bindTexture(context.TEXTURE_2D_ARRAY, texture);
				context.texStorage3D(
					context.TEXTURE_2D_ARRAY,
					1,
					context.RGBA32F,
					DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
					DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
					24,
				);
			}
			context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
			const pixel = new Float32Array(4);
			for (let atlas = 0; atlas < 2; atlas += 1)
				for (let layer = 0; layer < 24; layer += 1) {
					context.framebufferTextureLayer(
						context.FRAMEBUFFER,
						context.COLOR_ATTACHMENT0,
						textures[atlas],
						0,
						layer,
					);
					if (context.checkFramebufferStatus(context.FRAMEBUFFER) !== context.FRAMEBUFFER_COMPLETE)
						throw new Error('Two-atlas framebuffer incomplete.');
					context.clearColor(atlas / 2, layer / 24, 0.25, 1);
					context.clear(context.COLOR_BUFFER_BIT);
					context.readPixels(0, 0, 1, 1, context.RGBA, context.FLOAT, pixel);
					if (
						Math.abs(pixel[0] - atlas / 2) > 1e-6 ||
						Math.abs(pixel[1] - layer / 24) > 1e-6 ||
						context.getError() !== context.NO_ERROR
					)
						throw new Error('Two-atlas layer probe failed.');
				}
			if (context.isContextLost()) throw new Error('Two-atlas proof lost its GPU context.');
			return {
				renderer,
				targetId: `${hardware} / Chrome ${chrome} / ANGLE D3D11`,
				maximumBytes: 48 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
				layersProbed: 48,
			};
		} finally {
			for (const texture of textures) context.deleteTexture(texture);
			context.deleteFramebuffer(framebuffer);
			context.getExtension('WEBGL_lose_context')?.loseContext();
		}
	}

	/**
	 * Call this method to compare actual production display GLSL and binary64 CPU values.
	 * The relative gain allowance is 0.00002 and final display allowance is 0.000002.
	 * All shaders use the unmodified production constants/encoding contribution blocks.
	 *
	 * @returns {TheHoursGpuColorProof} - Global analytic proof and measured CPU/GPU errors.
	 */
	color() {
		const context = new OffscreenCanvas(1, 1).getContext('webgl2');
		if (!context || !context.getExtension('EXT_color_buffer_float'))
			throw new Error('Display proof requires floating-point readback.');
		const framebuffer = context.createFramebuffer(),
			texture = context.createTexture();
		context.bindTexture(context.TEXTURE_2D, texture);
		context.texStorage2D(context.TEXTURE_2D, 1, context.RGBA32F, 1, 1);
		context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
		context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, texture, 0);
		context.viewport(0, 0, 1, 1);
		const results = [];
		try {
			for (const model of [
				new ColorResetSlope078P2ColorDisplayModel(),
				new ColorResetSlope078P9ColorDisplayModel(),
				new BrunetonColorDisplayModel(),
			]) {
				const contribution = model.createShaderContribution(
					/** @type {ShaderContributionRequest} */ (
						/** @type {unknown} */ ({
							model: {profile: {spectral: {basis: NATIVE_15_SPECTRAL_BASIS}}, celestialSources: null},
						})
					),
				);
				const blocks = contribution.functions
					.filter((block) => ['color-display-constants', 'color-encode-helper'].includes(block.id))
					.map((block) => block.code)
					.join('\n');
				const gainExpression =
					model instanceof ColorResetSlope078P9ColorDisplayModel
						? 'colorResetDisplayGain(uColorResetTotalHorizontalIlluminanceLux)'
						: '1.0';
				const vertex = this._shader(
					context,
					context.VERTEX_SHADER,
					'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}',
				);
				const fragment = this._shader(
					context,
					context.FRAGMENT_SHADER,
					`#version 300 es\nprecision highp float;uniform float uColorResetTotalHorizontalIlluminanceLux;out vec4 outputColor;\n${blocks}\nvoid main(){outputColor=vec4(${gainExpression}, encodeDisplayOutput(vec3(-2.0,3.0,1000.0)).rgb);}`,
				);
				const program = context.createProgram();
				context.attachShader(program, vertex);
				context.attachShader(program, fragment);
				context.linkProgram(program);
				if (!context.getProgramParameter(program, context.LINK_STATUS))
					throw new Error(context.getProgramInfoLog(program));
				context.useProgram(program);
				const uniform = context.getUniformLocation(program, 'uColorResetTotalHorizontalIlluminanceLux');
				let maximumGainRelativeError = 0,
					maximumDisplayAbsoluteError = 0;
				const values = [
					0,
					...Array.from({length: 261}, (_value, index) => 10 ** (-6 + index / 20)),
					385,
					500,
					980,
				];
				for (const lux of values) {
					context.uniform1f(uniform, lux);
					context.drawArrays(context.TRIANGLES, 0, 3);
					const pixel = new Float32Array(4);
					context.readPixels(0, 0, 1, 1, context.RGBA, context.FLOAT, pixel);
					/** Exact physical display input. @type {UnitValue<'lux'>} */
					const illuminance = {value: lux, units: 'lux'};
					const gain =
						model instanceof ColorResetSlope078P9ColorDisplayModel ? model.displayGain(illuminance) : 1;
					const rgb =
						model instanceof ColorResetSlope078P9ColorDisplayModel
							? model.linearSrgbToDisplayRgb([-2, 3, 1000], illuminance)
							: model.linearSrgbToDisplayRgb([-2, 3, 1000]);
					maximumGainRelativeError = Math.max(maximumGainRelativeError, Math.abs(pixel[0] - gain) / gain);
					maximumDisplayAbsoluteError = Math.max(
						maximumDisplayAbsoluteError,
						...rgb.map((value, channel) => Math.abs(pixel[channel + 1] - value)),
					);
				}
				context.deleteProgram(program);
				context.deleteShader(vertex);
				context.deleteShader(fragment);
				if (
					maximumGainRelativeError > 0.00002 ||
					maximumDisplayAbsoluteError > 0.000002 ||
					context.getError() !== context.NO_ERROR
				)
					throw new Error(`CPU/GLSL disagreement for ${model.id}.`);
				results.push({
					model: model.id,
					samples: values.length,
					maximumGainRelativeError,
					maximumDisplayAbsoluteError,
				});
			}
			return {monotonicity: this._monotonicity(), models: results};
		} finally {
			context.deleteTexture(texture);
			context.deleteFramebuffer(framebuffer);
			context.getExtension('WEBGL_lose_context')?.loseContext();
		}
	}
}
