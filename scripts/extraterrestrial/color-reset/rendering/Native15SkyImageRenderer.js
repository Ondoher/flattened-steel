import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {
	CR3_NATIVE15_LINEAR_SRGB_WEIGHTS,
	CR3_PRESENTATION_NATIVE15_BASIS_HASH,
} from '../color/Cr3NeutralSurfacePresentation.js';
import {
	hashTypedArraySha256,
	Native15BatchedSkyTransportSampler,
	summarizeDirectionMajorField,
} from './Native15BatchedSkyTransportSampler.js';

const NATIVE15_CHANNEL_COUNT = 15;
const RGB_CHANNEL_COUNT = 3;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function acceptFiniteUnitDirection(value, label) {
	if ((!Array.isArray(value) && !ArrayBuffer.isView(value)) || value.length !== 3) {
		throw new TypeError(`${label} must contain exactly three values.`);
	}
	const copy = Array.from(value);
	if (!copy.every(Number.isFinite)) throw new TypeError(`${label} values must be finite.`);
	const length = Math.hypot(...copy);
	if (!(length > 0)) throw new RangeError(`${label} must be nonzero.`);
	return copy.map((component) => component / length);
}

function acceptFiniteValues(value, count, label) {
	if ((!Array.isArray(value) && !ArrayBuffer.isView(value)) || value.length !== count) {
		throw new TypeError(`${label} must contain exactly ${count} values.`);
	}
	const copy = Float64Array.from(value);
	if (!Array.from(copy).every(Number.isFinite)) {
		throw new TypeError(`${label} values must be finite.`);
	}
	return copy;
}

function acceptProjection(projection) {
	if (
		!projection ||
		!Number.isSafeInteger(projection.width) ||
		!Number.isSafeInteger(projection.height) ||
		projection.width <= 0 ||
		projection.height <= 0
	) {
		throw new TypeError('Sky image projection requires positive integer dimensions.');
	}
	if (!(projection.directionsLocal instanceof Float32Array)) {
		throw new TypeError('Sky image projection directions must be a Float32Array.');
	}
	if (
		!Number.isSafeInteger(projection.directionCount) ||
		projection.directionCount <= 0 ||
		projection.directionsLocal.length !== projection.directionCount * 3
	) {
		throw new RangeError('Sky image projection direction count does not match its direction field.');
	}
	const pixelCount = projection.width * projection.height;
	if (projection.pixelCount !== pixelCount) {
		throw new RangeError('Sky image projection pixel count does not match its dimensions.');
	}
	if (
		projection.pixelDirectionIndices !== null &&
		(!(projection.pixelDirectionIndices instanceof Int32Array) ||
			projection.pixelDirectionIndices.length !== pixelCount)
	) {
		throw new TypeError('Sky image pixel-direction mapping must be null or a pixel-sized Int32Array.');
	}
	if (projection.pixelDirectionIndices === null && projection.directionCount !== pixelCount) {
		throw new RangeError('Identity pixel-direction mapping requires one direction per pixel.');
	}
	return projection;
}

function projectNative15Field(values, radianceScale) {
	if (!(values instanceof Float32Array) || values.length % NATIVE15_CHANNEL_COUNT !== 0) {
		throw new TypeError('Native15 projection input must be a direction-major Float32Array.');
	}
	if (!Number.isFinite(radianceScale) || radianceScale < 0) {
		throw new RangeError('Sky-image radianceScale must be finite and nonnegative.');
	}
	const directionCount = values.length / NATIVE15_CHANNEL_COUNT;
	const linearSrgb = new Float32Array(directionCount * RGB_CHANNEL_COUNT);
	for (let directionIndex = 0; directionIndex < directionCount; directionIndex += 1) {
		const nativeOffset = directionIndex * NATIVE15_CHANNEL_COUNT;
		let red = 0;
		let green = 0;
		let blue = 0;
		for (let channelIndex = 0; channelIndex < NATIVE15_CHANNEL_COUNT; channelIndex += 1) {
			const value = values[nativeOffset + channelIndex] * radianceScale;
			red += value * CR3_NATIVE15_LINEAR_SRGB_WEIGHTS.red[channelIndex];
			green += value * CR3_NATIVE15_LINEAR_SRGB_WEIGHTS.green[channelIndex];
			blue += value * CR3_NATIVE15_LINEAR_SRGB_WEIGHTS.blue[channelIndex];
		}
		linearSrgb.set([red, green, blue], directionIndex * RGB_CHANNEL_COUNT);
	}
	return linearSrgb;
}

function expandDirectionFieldToPixels(directionValues, projection, channelCount) {
	const pixels = new Float32Array(projection.pixelCount * channelCount);
	if (projection.pixelDirectionIndices === null) {
		pixels.set(directionValues);
		return pixels;
	}
	for (let pixelIndex = 0; pixelIndex < projection.pixelCount; pixelIndex += 1) {
		const directionIndex = projection.pixelDirectionIndices[pixelIndex];
		if (directionIndex < 0) continue;
		if (directionIndex >= projection.directionCount) {
			throw new RangeError('Sky image pixel-direction mapping is outside the direction field.');
		}
		const sourceOffset = directionIndex * channelCount;
		pixels.set(directionValues.subarray(sourceOffset, sourceOffset + channelCount), pixelIndex * channelCount);
	}
	return pixels;
}

function encodeCurrentBrunetonRgba8(linearSrgbPixels, projection, colorModel) {
	const rgba = new Uint8ClampedArray(projection.pixelCount * 4);
	for (let pixelIndex = 0; pixelIndex < projection.pixelCount; pixelIndex += 1) {
		const directionIndex =
			projection.pixelDirectionIndices === null ? pixelIndex : projection.pixelDirectionIndices[pixelIndex];
		const rgbaOffset = pixelIndex * 4;
		if (directionIndex < 0) {
			const outside = projection.outsidePixel ?? [0, 0, 0, 255];
			rgba.set(outside, rgbaOffset);
			continue;
		}
		const linearOffset = pixelIndex * RGB_CHANNEL_COUNT;
		const display = colorModel.linearSrgbToDisplayRgb([
			linearSrgbPixels[linearOffset],
			linearSrgbPixels[linearOffset + 1],
			linearSrgbPixels[linearOffset + 2],
		]);
		rgba[rgbaOffset] = display[0] * 255;
		rgba[rgbaOffset + 1] = display[1] * 255;
		rgba[rgbaOffset + 2] = display[2] * 255;
		rgba[rgbaOffset + 3] = 255;
	}
	return rgba;
}

function roundHalfAwayFromZero(value) {
	return value < 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}

function distributeFloydSteinbergError(dither, targetPixelIndex, error, weight) {
	const targetOffset = targetPixelIndex * RGB_CHANNEL_COUNT;
	for (let channelIndex = 0; channelIndex < RGB_CHANNEL_COUNT; channelIndex += 1) {
		dither[targetOffset + channelIndex] += error[channelIndex] * weight;
	}
}

/**
 * Reproduce the paper Figure 9 row-major Floyd-Steinberg encoder. The input
 * has already passed the one Bruneton exponential; no additional sRGB OETF is
 * applied here.
 */
export function encodeFigure9FloydSteinbergRgba8(linearSrgbPixels, projection, colorModel) {
	if (projection.width !== 1024 || projection.height !== 576 || projection.pixelDirectionIndices !== null) {
		throw new Error('Figure 9 error diffusion requires the exact 1024 by 576 identity-mapped pinhole.');
	}
	const rgba = new Uint8ClampedArray(projection.pixelCount * 4);
	const dither = new Float64Array(projection.pixelCount * RGB_CHANNEL_COUNT);
	for (let row = 0; row < projection.height; row += 1) {
		for (let column = 0; column < projection.width; column += 1) {
			const pixelIndex = column + row * projection.width;
			const linearOffset = pixelIndex * RGB_CHANNEL_COUNT;
			const rgbaOffset = pixelIndex * 4;
			const display = colorModel.linearSrgbToDisplayRgb([
				linearSrgbPixels[linearOffset],
				linearSrgbPixels[linearOffset + 1],
				linearSrgbPixels[linearOffset + 2],
			]);
			const quantized = [0, 0, 0];
			const error = [0, 0, 0];
			for (let channelIndex = 0; channelIndex < RGB_CHANNEL_COUNT; channelIndex += 1) {
				const value = display[channelIndex] * 255 + dither[linearOffset + channelIndex];
				quantized[channelIndex] = roundHalfAwayFromZero(value);
				error[channelIndex] = value - quantized[channelIndex];
				rgba[rgbaOffset + channelIndex] = quantized[channelIndex];
			}
			rgba[rgbaOffset + 3] = 255;
			if (column + 1 < projection.width) {
				distributeFloydSteinbergError(dither, pixelIndex + 1, error, 7 / 16);
			}
			if (row + 1 < projection.height) {
				if (column > 0) {
					distributeFloydSteinbergError(dither, pixelIndex + projection.width - 1, error, 3 / 16);
				}
				distributeFloydSteinbergError(dither, pixelIndex + projection.width, error, 5 / 16);
				if (column + 1 < projection.width) {
					distributeFloydSteinbergError(dither, pixelIndex + projection.width + 1, error, 1 / 16);
				}
			}
		}
	}
	return rgba;
}

function findDiskDirections(directionsLocal, disk) {
	const sourceDirection = acceptFiniteUnitDirection(disk.directionToSourceLocal, 'Direct-disk direction to source');
	if (!Number.isFinite(disk.angularRadiusRadians) || disk.angularRadiusRadians <= 0) {
		throw new RangeError('Direct-disk angular radius must be positive and finite.');
	}
	if (disk.angularRadiusRadians >= Math.PI / 2) {
		throw new RangeError('Direct-disk angular radius must be below pi/2.');
	}
	if (disk.minimumUpComponent !== undefined && !Number.isFinite(disk.minimumUpComponent)) {
		throw new TypeError('Direct-disk minimumUpComponent must be finite when supplied.');
	}
	const cosineRadius = Math.cos(disk.angularRadiusRadians);
	const indices = [];
	for (let directionIndex = 0; directionIndex < directionsLocal.length / 3; directionIndex += 1) {
		const offset = directionIndex * 3;
		const x = directionsLocal[offset];
		const y = directionsLocal[offset + 1];
		const z = directionsLocal[offset + 2];
		if (disk.minimumUpComponent !== undefined && z < disk.minimumUpComponent) continue;
		const inverseLength = 1 / Math.hypot(x, y, z);
		const cosine = (x * sourceDirection[0] + y * sourceDirection[1] + z * sourceDirection[2]) * inverseLength;
		if (cosine > cosineRadius) indices.push(directionIndex);
	}
	return {
		sourceDirection,
		indices,
		cosineRadius,
	};
}

function subsetDirections(directionsLocal, indices) {
	const subset = new Float32Array(indices.length * 3);
	for (let index = 0; index < indices.length; index += 1) {
		const sourceOffset = indices[index] * 3;
		subset.set(directionsLocal.subarray(sourceOffset, sourceOffset + 3), index * 3);
	}
	return subset;
}

function inferDiskDefinition(model, requestedDisk) {
	const definition = model.lightSource?.celestialSourceDefinition;
	const angularRadiusRadians = requestedDisk.angularRadiusRadians ?? definition?.angularRadius?.value;
	const surfaceRadianceValues = requestedDisk.surfaceRadianceValues ?? definition?.surfaceRadiance?.values;
	const surfaceRadianceBasisHash =
		requestedDisk.surfaceRadianceBasisHash ??
		definition?.surfaceRadiance?.basis?.contentHash ??
		definition?.surfaceRadiance?.basisHash;
	return {
		...requestedDisk,
		angularRadiusRadians,
		surfaceRadianceValues,
		surfaceRadianceBasisHash,
	};
}

/**
 * Render exact-cache Q30 Native15 sky directions into raw spectral and
 * Bruneton pre-display linear-sRGB fields. Image encoding is a convenience
 * derivative; raw fields and their hashes remain available to the runner.
 */
export class Native15SkyImageRenderer {
	constructor(request) {
		this._model = request?.model ?? request?.algorithm32?._model;
		if (!this._model) throw new TypeError('Native15 sky image renderer requires an installed model.');
		this._sampler = request?.transportSampler ?? new Native15BatchedSkyTransportSampler(request);
		this._colorModel = request?.colorModel ?? new BrunetonColorDisplayModel();
		requireCondition(
			this._model.spectral?.basis?.contentHash === CR3_PRESENTATION_NATIVE15_BASIS_HASH,
			'Native15 sky image renderer requires the accepted production-v1 Native15 basis.',
		);
	}

	/** Render one projection. */
	async render(request) {
		const projection = acceptProjection(request?.projection);
		const radianceScale = request.radianceScale ?? 1;
		if (!Number.isFinite(radianceScale) || radianceScale < 0) {
			throw new RangeError('Sky-image radianceScale must be finite and nonnegative.');
		}
		const pathSample = await this._sampler.sampleDirections({
			directionsLocal: projection.directionsLocal,
			outputKinds: ['path-radiance'],
			signal: request.signal,
			onProgress: request.onTransportProgress,
			yieldBetweenBatches: request.yieldBetweenBatches,
		});
		const pathRadianceValues = pathSample.pathRadianceValues;
		requireCondition(pathRadianceValues, 'Sky path-radiance readback is missing.');
		const preDisplayRadianceValues = pathRadianceValues.slice();
		let directDisk = null;

		if (request.directSolarDisk) {
			const disk = inferDiskDefinition(this._model, request.directSolarDisk);
			const blend = disk.blend ?? 'add';
			if (blend !== 'add' && blend !== 'replace') {
				throw new RangeError('Direct-disk blend must be "add" or "replace".');
			}
			const selection = findDiskDirections(projection.directionsLocal, disk);
			const transmittedRadianceValues =
				disk.transmittedRadianceValues === undefined
					? null
					: acceptFiniteValues(
							disk.transmittedRadianceValues,
							NATIVE15_CHANNEL_COUNT,
							'Direct-disk transmitted radiance',
						);
			let surfaceRadianceValues = null;
			let transmittanceSample = null;
			if (transmittedRadianceValues === null) {
				surfaceRadianceValues = acceptFiniteValues(
					disk.surfaceRadianceValues,
					NATIVE15_CHANNEL_COUNT,
					'Direct-disk surface radiance',
				);
				if (
					disk.surfaceRadianceBasisHash !== undefined &&
					disk.surfaceRadianceBasisHash !== CR3_PRESENTATION_NATIVE15_BASIS_HASH
				) {
					throw new Error('Direct-disk surface radiance is not on the accepted Native15 basis.');
				}
			}

			if (selection.indices.length > 0 && transmittedRadianceValues === null) {
				transmittanceSample = await this._sampler.sampleDirections({
					directionsLocal: subsetDirections(projection.directionsLocal, selection.indices),
					outputKinds: ['transmittance'],
					signal: request.signal,
					onProgress: request.onDiskTransportProgress,
					yieldBetweenBatches: request.yieldBetweenBatches,
				});
			}

			for (let diskIndex = 0; diskIndex < selection.indices.length; diskIndex += 1) {
				const directionIndex = selection.indices[diskIndex];
				const targetOffset = directionIndex * NATIVE15_CHANNEL_COUNT;
				const transmittanceOffset = diskIndex * NATIVE15_CHANNEL_COUNT;
				for (let channelIndex = 0; channelIndex < NATIVE15_CHANNEL_COUNT; channelIndex += 1) {
					const directValue =
						transmittedRadianceValues === null
							? surfaceRadianceValues[channelIndex] *
								transmittanceSample.transmittanceValues[transmittanceOffset + channelIndex]
							: transmittedRadianceValues[channelIndex];
					preDisplayRadianceValues[targetOffset + channelIndex] =
						blend === 'replace'
							? directValue
							: preDisplayRadianceValues[targetOffset + channelIndex] + directValue;
				}
			}

			directDisk = {
				blend,
				angularRadiusRadians: disk.angularRadiusRadians,
				directionToSourceLocal: selection.sourceDirection,
				cosineRadius: selection.cosineRadius,
				minimumUpComponent: disk.minimumUpComponent ?? null,
				directionCount: selection.indices.length,
				directionIndices: Uint32Array.from(selection.indices),
				radianceInput:
					transmittedRadianceValues === null
						? 'surface-radiance times per-ray Q30 transmittance'
						: 'caller-supplied transmitted radiance',
				surfaceRadianceValues,
				transmittedRadianceValues,
				transmittanceSample,
			};
		}

		const directionLinearSrgbValues = projectNative15Field(preDisplayRadianceValues, radianceScale);
		const pixelLinearSrgbValues = expandDirectionFieldToPixels(
			directionLinearSrgbValues,
			projection,
			RGB_CHANNEL_COUNT,
		);
		const brunetonDisplayEncoding = request.brunetonDisplayEncoding ?? 'current-uint8-clamped';
		if (
			brunetonDisplayEncoding !== 'current-uint8-clamped' &&
			brunetonDisplayEncoding !== 'figure9-floyd-steinberg'
		) {
			throw new RangeError('Unsupported Bruneton display encoding.');
		}
		const brunetonDisplayRgba8 =
			request.includeBrunetonDisplayRgba8 === false
				? null
				: brunetonDisplayEncoding === 'figure9-floyd-steinberg'
					? encodeFigure9FloydSteinbergRgba8(pixelLinearSrgbValues, projection, this._colorModel)
					: encodeCurrentBrunetonRgba8(pixelLinearSrgbValues, projection, this._colorModel);
		const pixelDirectionIndicesHash = projection.pixelDirectionIndices
			? await hashTypedArraySha256(projection.pixelDirectionIndices)
			: null;
		const hashes = {
			projectionDirectionsLocalF32: pathSample.hashes.directionsLocalF32,
			projectionModelDirectionsF32: pathSample.hashes.modelDirectionsF32,
			pixelDirectionIndicesI32: pixelDirectionIndicesHash,
			pathRadianceNative15F32: pathSample.hashes.pathRadianceF32,
			preDisplayRadianceNative15F32: await hashTypedArraySha256(preDisplayRadianceValues),
			directionLinearSrgbF32: await hashTypedArraySha256(directionLinearSrgbValues),
			pixelLinearSrgbF32: await hashTypedArraySha256(pixelLinearSrgbValues),
			brunetonDisplayRgba8: brunetonDisplayRgba8 ? await hashTypedArraySha256(brunetonDisplayRgba8) : null,
			directDiskDirectionIndicesU32: directDisk ? await hashTypedArraySha256(directDisk.directionIndices) : null,
		};

		return {
			schemaId: 'algorithm32-color-reset-native15-sky-image-v1',
			projectionId: projection.id,
			width: projection.width,
			height: projection.height,
			pixelCount: projection.pixelCount,
			directionCount: projection.directionCount,
			basisHash: CR3_PRESENTATION_NATIVE15_BASIS_HASH,
			projectionIdE8: CR3_NATIVE15_LINEAR_SRGB_WEIGHTS.id,
			colorId: this._colorModel.id,
			radianceScale,
			brunetonDisplayEncoding,
			pathRadianceValues,
			preDisplayRadianceValues,
			directionLinearSrgbValues,
			pixelLinearSrgbValues,
			brunetonDisplayRgba8,
			directDisk,
			transport: pathSample,
			hashes,
			statistics: {
				pathRadiance: pathSample.statistics.pathRadiance,
				preDisplayRadiance: summarizeDirectionMajorField(preDisplayRadianceValues, NATIVE15_CHANNEL_COUNT),
				directionLinearSrgb: summarizeDirectionMajorField(directionLinearSrgbValues, RGB_CHANNEL_COUNT),
				pixelLinearSrgb: summarizeDirectionMajorField(pixelLinearSrgbValues, RGB_CHANNEL_COUNT),
			},
			derivation: {
				transport: 'unchanged installed exact scene cache and quadratic-near-observer Q30 path integration',
				directDisk: directDisk?.radianceInput ?? 'none',
				projection: 'unchanged production-v1 Bruneton E8 Native15 radiance-to-linear-sRGB rows',
				scale: `one spectral- and pixel-independent multiplier ${radianceScale}`,
				display: brunetonDisplayRgba8
					? brunetonDisplayEncoding === 'figure9-floyd-steinberg'
						? 'unchanged production-v1 Bruneton Figure 1 exponential, then author-code Figure 9 row-major Floyd-Steinberg RGB8 error diffusion; no extra OETF'
						: 'unchanged production-v1 Bruneton Figure 1 exponential, then Uint8ClampedArray quantization; no extra OETF'
					: 'not evaluated',
			},
		};
	}
}

/** Project a retained direction-major Native15 field without rerunning transport. */
export function projectNative15SkyFieldToLinearSrgb(values, radianceScale = 1) {
	return projectNative15Field(values, radianceScale);
}

/** Expand a retained direction field through one exact paper raster mapping. */
export function expandSkyDirectionFieldToPixels(values, projection, channelCount) {
	return expandDirectionFieldToPixels(values, acceptProjection(projection), channelCount);
}
