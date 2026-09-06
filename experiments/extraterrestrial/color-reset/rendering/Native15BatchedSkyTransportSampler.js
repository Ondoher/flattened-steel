import {DIRECTION_TEXTURE_VALUE_KEY} from '../controls/production-v1/src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportShader.js';
import {Cr2ReceiverDiffuseTransportSampler} from '../lighting/Cr2ReceiverDiffuseTransportSampler.js';
import {Native15SkyTransportShader, SKY_TRANSPORT_OUTPUT_KINDS} from './Native15SkyTransportShader.js';
import {CR3_PRESENTATION_NATIVE15_BASIS_HASH} from '../color/Cr3NeutralSurfacePresentation.js';

const DEFAULT_MAX_DIRECTIONS_PER_BATCH = 4096;
const DIRECTION_COMPONENT_COUNT = 3;
const READBACK_COMPONENT_COUNT = 4;
const READBACK_SENTINEL = new Float32Array([-10101.25, -20202.5, -30303.75, -40404]);
const WEBGL_ERROR_DRAIN_LIMIT = 32;

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec3 position;
out vec2 screenTextureCoordinates;
void main() {
	screenTextureCoordinates = position.xy * 0.5 + 0.5;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function abortError(message) {
	if (typeof DOMException === 'function') return new DOMException(message, 'AbortError');
	const error = new Error(message);
	error.name = 'AbortError';
	return error;
}

function nowMilliseconds() {
	return globalThis.performance?.now?.() ?? Date.now();
}

function yieldToHost() {
	return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}

function acceptDirections(value) {
	let directions;
	if (ArrayBuffer.isView(value)) {
		directions = new Float32Array(value.length);
		directions.set(value);
	} else if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
		directions = new Float32Array(value.length * DIRECTION_COMPONENT_COUNT);
		for (let index = 0; index < value.length; index += 1) {
			const direction = value[index];
			if (!Array.isArray(direction) || direction.length !== DIRECTION_COMPONENT_COUNT) {
				throw new TypeError('Each observer-local sky direction must contain exactly three values.');
			}
			directions.set(direction, index * DIRECTION_COMPONENT_COUNT);
		}
	} else if (Array.isArray(value)) {
		directions = Float32Array.from(value);
	} else {
		throw new TypeError('Sky directions must be a flat numerical array or an array of triples.');
	}
	if (directions.length === 0 || directions.length % DIRECTION_COMPONENT_COUNT !== 0) {
		throw new RangeError('Sky directions must contain one or more complete triples.');
	}
	for (let offset = 0; offset < directions.length; offset += DIRECTION_COMPONENT_COUNT) {
		const x = directions[offset];
		const y = directions[offset + 1];
		const z = directions[offset + 2];
		if (![x, y, z].every(Number.isFinite)) {
			throw new TypeError('Sky direction values must be finite.');
		}
		const length = Math.hypot(x, y, z);
		if (!(length > 0) || Math.abs(length - 1) > 1e-4) {
			throw new RangeError('Sky directions must be unit vectors within 1e-4.');
		}
	}
	return directions;
}

function acceptOutputKinds(value) {
	const kinds = value ?? ['path-radiance'];
	if (!Array.isArray(kinds) || kinds.length === 0) {
		throw new TypeError('Sky transport outputKinds must be a nonempty array.');
	}
	const accepted = [];
	for (const kind of kinds) {
		if (kind !== 'path-radiance' && kind !== 'transmittance') {
			throw new RangeError(`Unsupported sky transport output kind: ${kind}.`);
		}
		if (!accepted.includes(kind)) accepted.push(kind);
	}
	return accepted;
}

function nativeByteOrder() {
	const bytes = new Uint8Array(new Uint16Array([0x0102]).buffer);
	return bytes[0] === 0x02 ? 'little-endian' : 'big-endian';
}

function drainWebglErrors(context) {
	const errors = [];
	for (let index = 0; index < WEBGL_ERROR_DRAIN_LIMIT; index += 1) {
		const error = context.getError();
		if (error === context.NO_ERROR) return errors;
		errors.push(error);
	}
	throw new Error(`Native15 sky transport WebGL error drain exceeded ${WEBGL_ERROR_DRAIN_LIMIT} entries.`);
}

function requireNoWebglErrors(context, operation) {
	const errors = drainWebglErrors(context);
	requireCondition(
		errors.length === 0,
		`Native15 sky transport ${operation} produced WebGL error codes [${errors.join(', ')}].`,
	);
}

function requireRunnableMaterialPrograms(renderer, material, operation) {
	const materialProperties = renderer.properties?.get?.(material);
	const programs = new Set();
	if (materialProperties?.currentProgram) programs.add(materialProperties.currentProgram);
	for (const program of materialProperties?.programs?.values?.() ?? []) programs.add(program);
	for (const program of programs) {
		const diagnostics = program?.diagnostics;
		if (diagnostics?.runnable === false) {
			const compilerLogs = [
				diagnostics.programLog,
				diagnostics.vertexShader?.log,
				diagnostics.fragmentShader?.log,
			]
				.filter((value) => typeof value === 'string' && value.trim() !== '')
				.join(' | ');
			throw new Error(
				`Native15 sky transport ${operation} shader program is not runnable: ${compilerLogs || 'no compiler log'}`,
			);
		}
	}
}

function requireValidReadback(pixels, activeCount, operation) {
	let clearColorPixelCount = 0;
	for (let pixelIndex = 0; pixelIndex < activeCount; pixelIndex += 1) {
		const offset = pixelIndex * READBACK_COMPONENT_COUNT;
		let matchesSentinel = true;
		for (let componentIndex = 0; componentIndex < READBACK_COMPONENT_COUNT; componentIndex += 1) {
			const value = pixels[offset + componentIndex];
			requireCondition(
				Number.isFinite(value),
				`Native15 sky transport ${operation} readback contains a non-finite value at pixel ${pixelIndex}, component ${componentIndex}.`,
			);
			if (value !== READBACK_SENTINEL[componentIndex]) matchesSentinel = false;
		}
		requireCondition(
			!matchesSentinel,
			`Native15 sky transport ${operation} left the GPU draw sentinel at pixel ${pixelIndex}.`,
		);
		if (pixels[offset] === 0 && pixels[offset + 1] === 0 && pixels[offset + 2] === 0 && pixels[offset + 3] === 1) {
			clearColorPixelCount += 1;
		}
	}
	requireCondition(
		clearColorPixelCount !== activeCount,
		`Native15 sky transport ${operation} returned the uniform WebGL clear field (0, 0, 0, 1).`,
	);
}

/** Compute the SHA-256 of the exact visible bytes of one typed array. */
export async function hashTypedArraySha256(value) {
	if (!ArrayBuffer.isView(value)) throw new TypeError('SHA-256 input must be a typed array.');
	requireCondition(globalThis.crypto?.subtle, 'Web Crypto SHA-256 is unavailable.');
	const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
	const digest = await globalThis.crypto.subtle.digest(
		'SHA-256',
		bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
	);
	return Array.from(new Uint8Array(digest), (component) => component.toString(16).padStart(2, '0')).join('');
}

/** Summarize one direction-major scalar field without changing it. */
export function summarizeDirectionMajorField(values, channelCount) {
	if (!(values instanceof Float32Array) || values.length % channelCount !== 0) {
		throw new TypeError('Direction-major field must be a channel-aligned Float32Array.');
	}
	const byChannel = Array.from({length: channelCount}, (_, channelIndex) => ({
		channelIndex,
		minimum: Number.POSITIVE_INFINITY,
		maximum: Number.NEGATIVE_INFINITY,
		sum: 0,
		finiteCount: 0,
		nonFiniteCount: 0,
		negativeCount: 0,
		zeroCount: 0,
	}));
	for (let index = 0; index < values.length; index += 1) {
		const value = values[index];
		const summary = byChannel[index % channelCount];
		if (!Number.isFinite(value)) {
			summary.nonFiniteCount += 1;
			continue;
		}
		summary.finiteCount += 1;
		summary.sum += value;
		summary.minimum = Math.min(summary.minimum, value);
		summary.maximum = Math.max(summary.maximum, value);
		if (value < 0) summary.negativeCount += 1;
		if (value === 0) summary.zeroCount += 1;
	}
	for (const summary of byChannel) {
		summary.mean = summary.finiteCount > 0 ? summary.sum / summary.finiteCount : null;
		if (summary.finiteCount === 0) {
			summary.minimum = null;
			summary.maximum = null;
		}
	}
	return {
		directionCount: values.length / channelCount,
		channelCount,
		valueCount: values.length,
		finiteCount: byChannel.reduce((sum, item) => sum + item.finiteCount, 0),
		nonFiniteCount: byChannel.reduce((sum, item) => sum + item.nonFiniteCount, 0),
		negativeCount: byChannel.reduce((sum, item) => sum + item.negativeCount, 0),
		zeroCount: byChannel.reduce((sum, item) => sum + item.zeroCount, 0),
		byChannel,
	};
}

/**
 * Arbitrary-direction, direction-major Native15 readback over the unchanged
 * CR2/production Q30 path. A fixed-width GPU ingress is reused across chunks,
 * so image fields larger than the WebGL texture-width limit remain supported.
 */
export class Native15BatchedSkyTransportSampler extends Cr2ReceiverDiffuseTransportSampler {
	constructor(request) {
		const model = request?.model ?? request?.algorithm32?._model;
		const scatteringCache = request?.scatteringCache ?? request?.handle?._buildResult?.scatteringCache;
		if (!model) throw new TypeError('Native15 sky transport requires an installed Algorithm32 model.');
		if (!scatteringCache) {
			throw new TypeError('Native15 sky transport requires the installed scene scattering cache.');
		}
		const rendererLimit = request?.renderer?.capabilities?.maxTextureSize ?? DEFAULT_MAX_DIRECTIONS_PER_BATCH;
		const requestedLimit = request?.maxDirectionsPerBatch ?? DEFAULT_MAX_DIRECTIONS_PER_BATCH;
		if (!Number.isSafeInteger(requestedLimit) || requestedLimit <= 0) {
			throw new RangeError('maxDirectionsPerBatch must be a positive safe integer.');
		}
		const maximumDirectionsPerBatch = Math.min(requestedLimit, rendererLimit);
		super({
			...request,
			model,
			scatteringCache,
			quadrature: {
				id: 'color-reset-native15-batched-sky-transport-ingress-v1',
				sampleCount: maximumDirectionsPerBatch,
				samples: [],
			},
		});
		if (
			model.spectral?.basis?.channelCount !== 15 ||
			model.spectral.basis.contentHash !== CR3_PRESENTATION_NATIVE15_BASIS_HASH
		) {
			throw new Error('Native15 sky transport requires the accepted production-v1 Native15 basis.');
		}
		this._maximumDirectionsPerBatch = maximumDirectionsPerBatch;
	}

	/** Maximum GPU ingress width used by this sampler. */
	get maximumDirectionsPerBatch() {
		return this._maximumDirectionsPerBatch;
	}

	_mapDirectionsToModel(directionsLocal) {
		const directionCount = directionsLocal.length / DIRECTION_COMPONENT_COUNT;
		const modelDirections = new Float32Array(directionCount * DIRECTION_COMPONENT_COUNT);
		for (let index = 0; index < directionCount; index += 1) {
			const offset = index * DIRECTION_COMPONENT_COUNT;
			const directionSceneLocal = /** @type {UnitVector3} */ ([
				directionsLocal[offset],
				directionsLocal[offset + 2],
				directionsLocal[offset + 1],
			]);
			const modelDirection =
				this._model.geometry.mapObserverLocalSceneDirectionToModelDirection(directionSceneLocal);
			modelDirections.set(modelDirection, offset);
		}
		return modelDirections;
	}

	_createReusableDirectionTexture(modelDirections, batchCapacity) {
		const THREE = this._THREE;
		const values = new Float32Array(batchCapacity * 4);
		const first = modelDirections.subarray(0, 3);
		for (let index = 0; index < batchCapacity; index += 1) {
			values.set(first, index * 4);
			values[index * 4 + 3] = 1;
		}
		const texture = new THREE.DataTexture(values, batchCapacity, 1, THREE.RGBAFormat, THREE.FloatType);
		texture.internalFormat = 'RGBA32F';
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.needsUpdate = true;
		return texture;
	}

	_writeDirectionBatch(directionTexture, modelDirections, startIndex, batchCount) {
		const values = directionTexture.image.data;
		let finalOffset = startIndex * DIRECTION_COMPONENT_COUNT;
		for (let localIndex = 0; localIndex < batchCount; localIndex += 1) {
			const sourceOffset = (startIndex + localIndex) * DIRECTION_COMPONENT_COUNT;
			const targetOffset = localIndex * 4;
			values[targetOffset] = modelDirections[sourceOffset];
			values[targetOffset + 1] = modelDirections[sourceOffset + 1];
			values[targetOffset + 2] = modelDirections[sourceOffset + 2];
			values[targetOffset + 3] = 1;
			finalOffset = sourceOffset;
		}
		for (let localIndex = batchCount; localIndex < values.length / 4; localIndex += 1) {
			const targetOffset = localIndex * 4;
			values[targetOffset] = modelDirections[finalOffset];
			values[targetOffset + 1] = modelDirections[finalOffset + 1];
			values[targetOffset + 2] = modelDirections[finalOffset + 2];
			values[targetOffset + 3] = 1;
		}
		directionTexture.needsUpdate = true;
	}

	/** Sample path radiance and, when requested, Q30 view transmittance. */
	async sampleDirections(request) {
		if (request?.signal?.aborted) throw abortError('Native15 sky transport was aborted.');
		const startedMilliseconds = nowMilliseconds();
		const directionsLocal = acceptDirections(request?.directionsLocal);
		const outputKinds = acceptOutputKinds(request?.outputKinds);
		const directionCount = directionsLocal.length / DIRECTION_COMPONENT_COUNT;
		const batchCapacity = Math.min(directionCount, this._maximumDirectionsPerBatch);
		const batchCount = Math.ceil(directionCount / batchCapacity);
		const channelCount = this._model.spectral.basis.channelCount;
		const modelDirections = this._mapDirectionsToModel(directionsLocal);
		const pathRadianceValues = outputKinds.includes('path-radiance')
			? new Float32Array(directionCount * channelCount)
			: null;
		const transmittanceValues = outputKinds.includes('transmittance')
			? new Float32Array(directionCount * channelCount)
			: null;
		const outputArrays = new Map([
			['path-radiance', pathRadianceValues],
			['transmittance', transmittanceValues],
		]);
		const outputCodes = {
			'path-radiance': SKY_TRANSPORT_OUTPUT_KINDS.PATH_RADIANCE,
			transmittance: SKY_TRANSPORT_OUTPUT_KINDS.TRANSMITTANCE,
		};
		const channelsPerPass = 4;
		const passesPerOutputKind = Math.ceil(channelCount / channelsPerPass);

		const THREE = this._THREE;
		const context = this._renderer.getContext();
		requireCondition(
			typeof context?.clearBufferfv === 'function',
			'Native15 sky transport requires a WebGL2 floating-point color-buffer clear.',
		);
		requireNoWebglErrors(context, 'preflight');
		const assembly = new Native15SkyTransportShader(batchCapacity).create({
			model: this._model,
			scatteringCache: this._cache,
		});
		const directionTexture = this._createReusableDirectionTexture(modelDirections, batchCapacity);
		const uniforms = this._createUniforms(assembly, directionTexture);
		const cacheUniforms = {};
		for (const contribution of assembly.contributions) {
			for (const texture of contribution.textures) {
				if (texture.valueKey !== DIRECTION_TEXTURE_VALUE_KEY) {
					cacheUniforms[texture.valueKey] = uniforms[texture.name];
				}
			}
		}
		this._backend.installRuntimeBindings({
			bindings: this._cache.getRuntimeBindings(),
			uniforms: cacheUniforms,
		});

		const material = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3 ?? '300 es',
			vertexShader: VERTEX_SHADER.replace(/^#version 300 es\s*/u, ''),
			fragmentShader: assembly.fragmentShaderSource.replace(/^#version 300 es\s*/u, ''),
			uniforms,
			depthTest: false,
			depthWrite: false,
			blending: THREE.NoBlending,
		});
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
		);
		const scene = new THREE.Scene();
		const mesh = new THREE.Mesh(geometry, material);
		mesh.frustumCulled = false;
		scene.add(mesh);
		const camera = new THREE.Camera();
		const target = new THREE.WebGLRenderTarget(batchCapacity, 1, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			depthBuffer: false,
			stencilBuffer: false,
		});
		target.texture.internalFormat = 'RGBA32F';
		const previousTarget = this._renderer.getRenderTarget();
		const previousAutoClear = this._renderer.autoClear;
		const pixels = new Float32Array(batchCapacity * 4);
		let completedPassCount = 0;
		const totalPassCount = batchCount * outputKinds.length * passesPerOutputKind;
		try {
			this._renderer.autoClear = false;
			if (typeof this._renderer.compileAsync === 'function') {
				await this._renderer.compileAsync(scene, camera);
			} else {
				this._renderer.compile(scene, camera);
			}
			requireRunnableMaterialPrograms(this._renderer, material, 'compile');
			requireNoWebglErrors(context, 'compile');
			for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
				if (request.signal?.aborted) throw abortError('Native15 sky transport was aborted.');
				const startIndex = batchIndex * batchCapacity;
				const activeCount = Math.min(batchCapacity, directionCount - startIndex);
				this._writeDirectionBatch(directionTexture, modelDirections, startIndex, activeCount);
				for (const outputKind of outputKinds) {
					uniforms.uColorResetSkyTransportOutputKind.value = outputCodes[outputKind];
					const output = outputArrays.get(outputKind);
					for (let channelIndex = 0; channelIndex < channelCount; channelIndex += channelsPerPass) {
						if (request.signal?.aborted) throw abortError('Native15 sky transport was aborted.');
						uniforms.uReceiverEnvironmentOutputChannel.value = channelIndex;
						this._renderer.setRenderTarget(target);
						context.clearBufferfv(context.COLOR, 0, READBACK_SENTINEL);
						const operation = `batch ${batchIndex}, ${outputKind}, channels ${channelIndex}-${Math.min(channelIndex + channelsPerPass - 1, channelCount - 1)}`;
						requireNoWebglErrors(context, `${operation} sentinel clear`);
						this._renderer.render(scene, camera);
						requireRunnableMaterialPrograms(this._renderer, material, operation);
						requireNoWebglErrors(context, `${operation} draw`);
						pixels.fill(Number.NaN);
						this._renderer.readRenderTargetPixels(target, 0, 0, batchCapacity, 1, pixels);
						requireNoWebglErrors(context, `${operation} readback`);
						requireValidReadback(pixels, activeCount, operation);
						for (let localIndex = 0; localIndex < activeCount; localIndex += 1) {
							for (
								let componentIndex = 0;
								componentIndex < channelsPerPass && channelIndex + componentIndex < channelCount;
								componentIndex += 1
							) {
								output[(startIndex + localIndex) * channelCount + channelIndex + componentIndex] =
									pixels[localIndex * 4 + componentIndex];
							}
						}
						completedPassCount += 1;
						if (request.onProgress) {
							await request.onProgress({
								batchIndex,
								batchCount,
								outputKind,
								channelIndex,
								completedPassCount,
								totalPassCount,
							});
						}
					}
				}
				if (request.yieldBetweenBatches !== false && batchIndex + 1 < batchCount) {
					await yieldToHost();
				}
			}
		} finally {
			this._renderer.autoClear = previousAutoClear;
			this._renderer.setRenderTarget(previousTarget);
			target.dispose();
			geometry.dispose();
			material.dispose();
			directionTexture.dispose();
		}

		const hashes = {
			directionsLocalF32: await hashTypedArraySha256(directionsLocal),
			modelDirectionsF32: await hashTypedArraySha256(modelDirections),
			pathRadianceF32: pathRadianceValues ? await hashTypedArraySha256(pathRadianceValues) : null,
			transmittanceF32: transmittanceValues ? await hashTypedArraySha256(transmittanceValues) : null,
		};
		return {
			schemaId: 'algorithm32-color-reset-native15-batched-sky-transport-v1',
			implementationId: 'color-reset-cr2-q30-arbitrary-direction-safe4096-v2',
			basisHash: this._model.spectral.basis.contentHash,
			channelCount,
			directionCount,
			batchCapacity,
			batchCount,
			outputKinds,
			shaderSourceHash: assembly.sourceHash,
			directionsLocal,
			modelDirections,
			pathRadianceValues,
			transmittanceValues,
			hashes,
			statistics: {
				pathRadiance: pathRadianceValues
					? summarizeDirectionMajorField(pathRadianceValues, channelCount)
					: null,
				transmittance: transmittanceValues
					? summarizeDirectionMajorField(transmittanceValues, channelCount)
					: null,
			},
			storage: {
				byteOrder: nativeByteOrder(),
				scalarType: 'float32',
				layout: 'direction-major then Native15 channel',
			},
			elapsedMilliseconds: nowMilliseconds() - startedMilliseconds,
		};
	}
}
