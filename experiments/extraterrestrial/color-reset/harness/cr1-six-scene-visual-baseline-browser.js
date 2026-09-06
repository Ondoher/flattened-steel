import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Cr1LinearFieldDiagnosticColorDisplayModel} from '../color/Cr1LinearFieldDiagnosticColorDisplayModel.js';
import {Algorithm32Bindings} from '../controls/production-v1/src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {BrunetonSourceLuminanceLiftColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-source-luminance-lift-color/BrunetonSourceLuminanceLiftColorDisplayModel.js';
import {ThreeCacheBackend} from '../controls/production-v1/src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {createDistantSunSceneState} from '../controls/production-v1/src/flat32/DistantSunSceneState.js';
import {SphericalDistantMode} from '../controls/production-v1/src/flat32/SphericalDistantMode.js';

const LUMINANCE_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);
const PANEL_KINDS = Object.freeze([
	'bruneton',
	'production-lift',
	'pre-display-luminance',
	'black-saturation-masks',
]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
	return Math.min(maximum, Math.max(minimum, value));
}

function invertMatrix3(matrix) {
	const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
	const determinant =
		a * (e * i - f * h) -
		b * (d * i - f * g) +
		c * (d * h - e * g);
	requireCondition(
		Number.isFinite(determinant) && Math.abs(determinant) > Number.EPSILON,
		'CR1 Bruneton XYZ-to-linear-sRGB matrix must be invertible.',
	);
	return [
		[
			(e * i - f * h) / determinant,
			(c * h - b * i) / determinant,
			(b * f - c * e) / determinant,
		],
		[
			(f * g - d * i) / determinant,
			(a * i - c * g) / determinant,
			(c * d - a * f) / determinant,
		],
		[
			(d * h - e * g) / determinant,
			(b * g - a * h) / determinant,
			(a * e - b * d) / determinant,
		],
	];
}

function multiplyMatrix3Vector(matrix, vector) {
	return matrix.map((row) => row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2]);
}

const BRUNETON_COLOR_SPACE_AUTHORITY = (() => {
	const xyzToLinearSrgbMatrix = new BrunetonColorDisplayModel()
		.displayConstants.xyzToLinearSrgbMatrix
		.map((row) => [...row]);
	return Object.freeze({
		source: 'BrunetonColorDisplayModel.displayConstants.xyzToLinearSrgbMatrix',
		xyzToLinearSrgbMatrix,
		linearSrgbToXyzMatrix: invertMatrix3(xyzToLinearSrgbMatrix),
	});
})();

function dataUrlBytes(dataUrl) {
	const match = /^data:image\/png;base64,(.+)$/u.exec(dataUrl);
	if (!match) throw new Error('CR1 render did not produce a PNG data URL.');
	const binary = atob(match[1]);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

async function uploadBytes(artifactPath, bytes, contentType) {
	const response = await fetch('/artifact/' + artifactPath, {
		method: 'POST',
		headers: {'content-type': contentType},
		body: bytes,
	});
	if (!response.ok) {
		throw new Error('CR1 artifact upload failed for ' + artifactPath + ': HTTP ' + response.status + '.');
	}
	return bytes.byteLength;
}

async function uploadPng(artifactPath, dataUrl) {
	return uploadBytes(artifactPath, dataUrlBytes(dataUrl), 'image/png');
}

function cameraDirection(camera) {
	const azimuth = camera.viewAzimuthDegrees * Math.PI / 180;
	const elevation = camera.viewElevationDegrees * Math.PI / 180;
	const horizontal = Math.cos(elevation);
	return new THREE.Vector3(
		Math.sin(azimuth) * horizontal,
		Math.sin(elevation),
		-Math.cos(azimuth) * horizontal,
	).normalize();
}

function panelPath(kind, sceneId) {
	if (kind === 'bruneton' || kind === 'production-lift') {
		return 'captures/' + kind + '-' + sceneId + '.png';
	}
	if (kind === 'pre-display-luminance') {
		return 'diagnostics/pre-display-luminance-' + sceneId + '.png';
	}
	return 'diagnostics/black-saturation-masks-' + sceneId + '.png';
}

function panelLabel(kind) {
	if (kind === 'bruneton') return 'Unchanged Bruneton';
	if (kind === 'production-lift') return 'Current production lift';
	if (kind === 'pre-display-luminance') return 'Pre-display luminance';
	return 'Black / saturation masks';
}

function resolvePanel(configuration, scene, kind) {
	const expectedPath = panelPath(kind, scene.id);
	const explicit = configuration.panels?.find((candidate) =>
		candidate.sceneId === scene.id &&
		(
			candidate.panelKind === kind ||
			candidate.controlId === kind ||
			candidate.diagnosticId === kind ||
			candidate.artifactPath === expectedPath
		)
	);
	const declaredPaths = new Set(configuration.outputs.individualPngs);
	requireCondition(declaredPaths.has(expectedPath), 'CR1 fixture does not declare panel ' + expectedPath + '.');
	if (explicit) {
		requireCondition(explicit.artifactPath === expectedPath, 'CR1 panel mapping changed for ' + scene.id + '/' + kind + '.');
	}
	return {
		sceneId: scene.id,
		sceneLabel: scene.label,
		panelKind: kind,
		...(kind === 'bruneton' || kind === 'production-lift' ? {controlId: kind} : {}),
		label: explicit?.label ?? panelLabel(kind),
		artifactPath: expectedPath,
	};
}

function rawFieldPath(configuration, sceneId) {
	const expected = 'data/pre-display-linear-rgb-y-' + sceneId + '.f32le';
	requireCondition(
		configuration.outputs.rawFields.includes(expected),
		'CR1 fixture does not declare raw field ' + expected + '.',
	);
	return expected;
}

function hitMaskPath(configuration, sceneId) {
	const expected = 'data/scene-hit-mask-' + sceneId + '.r8';
	requireCondition(
		configuration.outputs.hitMasks.includes(expected),
		'CR1 fixture does not declare scene hit mask ' + expected + '.',
	);
	return expected;
}

function extractR8HitMask(hitTopDown, width, height) {
	requireCondition(
		hitTopDown.length === width * height * 4,
		'CR1 scene hit-target readback has the wrong size.',
	);
	const bytes = new Uint8Array(width * height);
	let skyPixelCount = 0;
	let geometryPixelCount = 0;
	let noncanonicalPixelCount = 0;
	for (let pixel = 0; pixel < width * height; pixel += 1) {
		const value = hitTopDown[pixel * 4];
		bytes[pixel] = value;
		if (value === 0) skyPixelCount += 1;
		else if (value === 255) geometryPixelCount += 1;
		else noncanonicalPixelCount += 1;
	}
	return {bytes, skyPixelCount, geometryPixelCount, noncanonicalPixelCount};
}

function equalBytes(left, right) {
	if (left.length !== right.length) return false;
	for (let index = 0; index < left.length; index += 1) {
		if (left[index] !== right[index]) return false;
	}
	return true;
}

function compareAndRetainHitMasks(frames, field, width, height) {
	const bruneton = extractR8HitMask(frames.bruneton.hitTopDown, width, height);
	const productionLift = extractR8HitMask(
		frames['production-lift'].hitTopDown,
		width,
		height,
	);
	const diagnostic = extractR8HitMask(field.hitTopDown, width, height);
	const equality = {
		brunetonVsProductionLift: equalBytes(bruneton.bytes, productionLift.bytes),
		brunetonVsDiagnostic: equalBytes(bruneton.bytes, diagnostic.bytes),
		productionLiftVsDiagnostic: equalBytes(productionLift.bytes, diagnostic.bytes),
	};
	equality.allEqual = Object.values(equality).every(Boolean);
	const counts = Object.fromEntries(
		Object.entries({bruneton, 'production-lift': productionLift, diagnostic}).map(
			([id, record]) => [id, {
				skyPixelCount: record.skyPixelCount,
				geometryPixelCount: record.geometryPixelCount,
				noncanonicalPixelCount: record.noncanonicalPixelCount,
			}],
		),
	);
	return {
		bytes: diagnostic.bytes,
		equality,
		counts,
		nondegenerate: Object.values(counts).every(
			(record) =>
				record.skyPixelCount > 0 &&
				record.geometryPixelCount > 0 &&
				record.noncanonicalPixelCount === 0,
		),
	};
}

function pixelSummary(pixels, width, height) {
	const sums = [0, 0, 0];
	let nonBlackPixelCount = 0;
	let saturatedPixelCount = 0;
	let maximumChannel = 0;
	for (let index = 0; index < pixels.length; index += 4) {
		const red = pixels[index];
		const green = pixels[index + 1];
		const blue = pixels[index + 2];
		if (red !== 0 || green !== 0 || blue !== 0) nonBlackPixelCount += 1;
		if (red === 255 || green === 255 || blue === 255) saturatedPixelCount += 1;
		sums[0] += red;
		sums[1] += green;
		sums[2] += blue;
		maximumChannel = Math.max(maximumChannel, red, green, blue);
	}
	const centerIndex = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4;
	return {
		width,
		height,
		pixelCount: width * height,
		nonBlackPixelCount,
		blackPixelCount: width * height - nonBlackPixelCount,
		saturatedPixelCount,
		maximumChannel,
		meanRgb: sums.map((sum) => sum / (width * height)),
		centerRgba: Array.from(pixels.slice(centerIndex, centerIndex + 4)),
	};
}

function drainWebglErrors(context) {
	const errors = [];
	for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
		errors.push(error);
	}
	return errors;
}

function sceneInputCapture(composer) {
	const capture = composer.passes.find(
		(pass) => pass.getDiagnostics?.().kind === 'algorithm32-scene-input-capture-pass',
	);
	if (!capture?._depthTarget || !capture?._hitTarget) {
		throw new Error('CR1 could not inspect the geometry scene-input targets.');
	}
	return capture;
}

function flipRgbaRows(pixels, width, height) {
	const topDown = new pixels.constructor(pixels.length);
	const rowLength = width * 4;
	for (let y = 0; y < height; y += 1) {
		const sourceOffset = (height - 1 - y) * rowLength;
		topDown.set(pixels.subarray(sourceOffset, sourceOffset + rowLength), y * rowLength);
	}
	return topDown;
}

function readSceneInputs(renderer, composer, width, height, sceneDepthMax) {
	const capture = sceneInputCapture(composer);
	const x = Math.floor(width / 2);
	const y = Math.floor(height * 0.05);
	const depthRgba = new Uint8Array(4);
	const hitRgba = new Uint8Array(4);
	const hitBottomUp = new Uint8Array(width * height * 4);
	renderer.readRenderTargetPixels(capture._depthTarget, x, y, 1, 1, depthRgba);
	renderer.readRenderTargetPixels(capture._hitTarget, x, y, 1, 1, hitRgba);
	renderer.readRenderTargetPixels(capture._hitTarget, 0, 0, width, height, hitBottomUp);
	const packedDepth = depthRgba[0] * 65536 + depthRgba[1] * 256 + depthRgba[2];
	return {
		hitTopDown: flipRgbaRows(hitBottomUp, width, height),
		probe: {
			screenProbe: {x, yFromBottom: y},
			depthRgba: Array.from(depthRgba),
			hitRgba: Array.from(hitRgba),
			depthMeters: (packedDepth / 16777214) * sceneDepthMax.value,
		},
	};
}

function captureDisplayFrame({
	canvas,
	context,
	renderer,
	composer,
	algorithm32,
	handle,
	width,
	height,
	sceneDepthMax,
}) {
	composer.renderToScreen = true;
	composer.render(0);
	const pixels = new Uint8Array(width * height * 4);
	context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels);
	const sceneInputs = readSceneInputs(renderer, composer, width, height, sceneDepthMax);
	return {
		dataUrl: canvas.toDataURL('image/png'),
		pixels,
		hitTopDown: sceneInputs.hitTopDown,
		summary: pixelSummary(pixels, width, height),
		geometryProbe: sceneInputs.probe,
		colorId: algorithm32.config.config.color.id,
		brightnessProxy: algorithm32.brightnessProxy,
		sourceBrightness: algorithm32.sourceBrightness,
		diagnostics: handle.getDiagnostics(),
		webglErrors: drainWebglErrors(context),
		contextLost: context.isContextLost(),
	};
}

function makeTopDownRgbY(bottomUpRgba, width, height) {
	const values = new Float32Array(width * height * 4);
	const bytes = new Uint8Array(width * height * 4 * Float32Array.BYTES_PER_ELEMENT);
	const view = new DataView(bytes.buffer);
	let finiteRgbPixelCount = 0;
	let nonfiniteRgbPixelCount = 0;
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const source = ((height - 1 - y) * width + x) * 4;
			const target = (y * width + x) * 4;
			const red = bottomUpRgba[source];
			const green = bottomUpRgba[source + 1];
			const blue = bottomUpRgba[source + 2];
			const finite = [red, green, blue].every(Number.isFinite);
			const luminance = finite
				? Math.max(0, red * LUMINANCE_WEIGHTS[0] + green * LUMINANCE_WEIGHTS[1] + blue * LUMINANCE_WEIGHTS[2])
				: Number.NaN;
			if (finite) finiteRgbPixelCount += 1;
			else nonfiniteRgbPixelCount += 1;
			values[target] = red;
			values[target + 1] = green;
			values[target + 2] = blue;
			values[target + 3] = luminance;
			view.setFloat32((target + 0) * 4, red, true);
			view.setFloat32((target + 1) * 4, green, true);
			view.setFloat32((target + 2) * 4, blue, true);
			view.setFloat32((target + 3) * 4, luminance, true);
		}
	}
	return {values, bytes, finiteRgbPixelCount, nonfiniteRgbPixelCount};
}

function captureLinearField({
	context,
	renderer,
	composer,
	algorithm32,
	handle,
	width,
	height,
	sceneDepthMax,
}) {
	composer.renderToScreen = false;
	try {
		composer.render(0);
		requireCondition(
			composer.writeBuffer?.texture?.type === THREE.FloatType,
			'CR1 pre-display field requires a FloatType composer write buffer.',
		);
		const bottomUpRgba = new Float32Array(width * height * 4);
		renderer.readRenderTargetPixels(composer.writeBuffer, 0, 0, width, height, bottomUpRgba);
		const sceneInputs = readSceneInputs(renderer, composer, width, height, sceneDepthMax);
		const encoded = makeTopDownRgbY(bottomUpRgba, width, height);
		return {
			...encoded,
			hitTopDown: sceneInputs.hitTopDown,
			geometryProbe: sceneInputs.probe,
			colorId: algorithm32.config.config.color.id,
			diagnostics: handle.getDiagnostics(),
			webglErrors: drainWebglErrors(context),
			contextLost: context.isContextLost(),
		};
	} finally {
		composer.renderToScreen = true;
	}
}

function percentile(sorted, requestedPercentile) {
	if (sorted.length === 0) return null;
	if (sorted.length === 1) return sorted[0];
	const position = clamp(requestedPercentile, 0, 100) * (sorted.length - 1) / 100;
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	if (lower === upper) return sorted[lower];
	const fraction = position - lower;
	return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

function linearSrgbChromaticity(rgb) {
	if (!rgb.every(Number.isFinite)) return null;
	const [xValue, yValue, zValue] = multiplyMatrix3Vector(
		BRUNETON_COLOR_SPACE_AUTHORITY.linearSrgbToXyzMatrix,
		rgb,
	);
	const total = xValue + yValue + zValue;
	if (!Number.isFinite(total) || total <= 0) return null;
	return {x: xValue / total, y: yValue / total, X: xValue, Y: yValue, Z: zValue};
}

function buildRegionMasks(hitTopDown, width, height, diagnostics) {
	const pixelCount = width * height;
	const fullSky = new Uint8Array(pixelCount);
	const horizonBand = new Uint8Array(pixelCount);
	const upperSky = new Uint8Array(pixelCount);
	const bandHeight = diagnostics.regions.horizonBandPixelsAboveGeometry;
	const upperMinimum = diagnostics.regions.upperSkyMinimumImageFraction;
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const pixel = y * width + x;
			const isGeometry = hitTopDown[pixel * 4] === 255;
			if (!isGeometry) {
				fullSky[pixel] = 1;
				const imageFractionFromBottom = height === 1 ? 1 : (height - 1 - y) / (height - 1);
				if (imageFractionFromBottom >= upperMinimum) upperSky[pixel] = 1;
			}
		}
	}
	for (let x = 0; x < width; x += 1) {
		let firstGeometryY = height;
		for (let y = 0; y < height; y += 1) {
			if (hitTopDown[(y * width + x) * 4] === 255) {
				firstGeometryY = y;
				break;
			}
		}
		const start = Math.max(0, firstGeometryY - bandHeight);
		for (let y = start; y < firstGeometryY; y += 1) {
			const pixel = y * width + x;
			if (fullSky[pixel]) horizonBand[pixel] = 1;
		}
	}
	return {fullSky, horizonBand, upperSky};
}

function summarizeFieldRegion(fieldValues, mask, requestedPercentiles) {
	const luminances = [];
	const sums = [0, 0, 0];
	let pixelCount = 0;
	let nonfiniteRgbPixelCount = 0;
	let zeroLuminancePixelCount = 0;
	for (let pixel = 0; pixel < mask.length; pixel += 1) {
		if (!mask[pixel]) continue;
		const index = pixel * 4;
		const rgb = [fieldValues[index], fieldValues[index + 1], fieldValues[index + 2]];
		const luminance = fieldValues[index + 3];
		pixelCount += 1;
		if (!rgb.every(Number.isFinite) || !Number.isFinite(luminance)) {
			nonfiniteRgbPixelCount += 1;
			continue;
		}
		sums[0] += rgb[0];
		sums[1] += rgb[1];
		sums[2] += rgb[2];
		luminances.push(luminance);
		if (luminance === 0) zeroLuminancePixelCount += 1;
	}
	luminances.sort((left, right) => left - right);
	const finitePixelCount = luminances.length;
	const meanLinearRgb = finitePixelCount === 0
		? [null, null, null]
		: sums.map((sum) => sum / finitePixelCount);
	return {
		pixelCount,
		finitePixelCount,
		nonfiniteRgbPixelCount,
		zeroLuminancePixelCount,
		meanLinearRgb,
		chromaticity: meanLinearRgb.every(Number.isFinite) ? linearSrgbChromaticity(meanLinearRgb) : null,
		percentiles: requestedPercentiles.map((value) => ({
			percentile: value,
			value: percentile(luminances, value),
		})),
	};
}

function summarizeField(field, hitTopDown, width, height, diagnostics) {
	const regions = buildRegionMasks(hitTopDown, width, height, diagnostics);
	let geometryPixelCount = 0;
	for (let pixel = 0; pixel < width * height; pixel += 1) {
		if (hitTopDown[pixel * 4] === 255) geometryPixelCount += 1;
	}
	const fullSky = summarizeFieldRegion(
		field.values,
		regions.fullSky,
		diagnostics.preDisplayField.percentiles,
	);
	return {
		width,
		height,
		storage: diagnostics.preDisplayField.storage,
		units: diagnostics.preDisplayField.units,
		luminanceEquation: diagnostics.preDisplayField.luminanceEquation,
		finiteRgbPixelCount: field.finiteRgbPixelCount,
		nonfiniteRgbPixelCount: field.nonfiniteRgbPixelCount,
		skyPixelCount: fullSky.pixelCount,
		geometryPixelCount,
		zeroLuminanceSkyPixelCount: fullSky.zeroLuminancePixelCount,
		percentiles: fullSky.percentiles,
		meanLinearRgb: fullSky.meanLinearRgb,
		chromaticity: fullSky.chromaticity,
		regions: {
			fullSky,
			horizonBand: summarizeFieldRegion(
				field.values,
				regions.horizonBand,
				diagnostics.preDisplayField.percentiles,
			),
			upperSky: summarizeFieldRegion(
				field.values,
				regions.upperSky,
				diagnostics.preDisplayField.percentiles,
			),
		},
		regionMasks: regions,
	};
}

function parseHexColor(value) {
	requireCondition(/^#[0-9a-f]{6}$/iu.test(value), 'CR1 diagnostic color must be #rrggbb.');
	return [
		Number.parseInt(value.slice(1, 3), 16),
		Number.parseInt(value.slice(3, 5), 16),
		Number.parseInt(value.slice(5, 7), 16),
	];
}

function paletteColor(stops, position) {
	const clamped = clamp(position, 0, 1);
	for (let index = 1; index < stops.length; index += 1) {
		const left = stops[index - 1];
		const right = stops[index];
		if (clamped <= right.position) {
			const width = right.position - left.position;
			const fraction = width === 0 ? 0 : (clamped - left.position) / width;
			return left.rgb.map((value, channel) =>
				Math.round(value * (1 - fraction) + right.rgb[channel] * fraction),
			);
		}
	}
	return [...stops[stops.length - 1].rgb];
}

function rgbaPixelsToPngDataUrl(pixels, width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR1 diagnostic PNG requires a 2D canvas context.');
	context.putImageData(new ImageData(pixels, width, height), 0, 0);
	const dataUrl = canvas.toDataURL('image/png');
	canvas.remove();
	return dataUrl;
}

function heatmapDataUrl(fieldValues, hitTopDown, width, height, heatmap) {
	const pixels = new Uint8ClampedArray(width * height * 4);
	const zeroColor = parseHexColor(heatmap.zeroColor);
	const geometryColor = parseHexColor(heatmap.geometryColor);
	const minimum = heatmap.minimumLog10CdPerSquareMeter;
	const maximum = heatmap.maximumLog10CdPerSquareMeter;
	for (let pixel = 0; pixel < width * height; pixel += 1) {
		const target = pixel * 4;
		let color;
		if (hitTopDown[target] === 255) {
			color = geometryColor;
		} else {
			const luminance = fieldValues[target + 3];
			if (!Number.isFinite(luminance)) color = [255, 0, 255];
			else if (luminance <= 0) color = zeroColor;
			else {
				const position = (Math.log10(luminance) - minimum) / (maximum - minimum);
				color = paletteColor(heatmap.paletteStops, position);
			}
		}
		pixels[target] = color[0];
		pixels[target + 1] = color[1];
		pixels[target + 2] = color[2];
		pixels[target + 3] = 255;
	}
	return rgbaPixelsToPngDataUrl(pixels, width, height);
}

function displayRegionStats(topDownPixels, regionMask) {
	const rgbSums = [0, 0, 0];
	const luminances = [];
	let blackPixelCount = 0;
	let saturatedPixelCount = 0;
	let pixelCount = 0;
	for (let pixel = 0; pixel < regionMask.length; pixel += 1) {
		if (!regionMask[pixel]) continue;
		const index = pixel * 4;
		const rgb = [
			topDownPixels[index] / 255,
			topDownPixels[index + 1] / 255,
			topDownPixels[index + 2] / 255,
		];
		pixelCount += 1;
		if (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0) blackPixelCount += 1;
		if (topDownPixels[index] === 255 || topDownPixels[index + 1] === 255 || topDownPixels[index + 2] === 255) {
			saturatedPixelCount += 1;
		}
		rgbSums[0] += rgb[0];
		rgbSums[1] += rgb[1];
		rgbSums[2] += rgb[2];
		luminances.push(
			rgb[0] * LUMINANCE_WEIGHTS[0] +
			rgb[1] * LUMINANCE_WEIGHTS[1] +
			rgb[2] * LUMINANCE_WEIGHTS[2],
		);
	}
	luminances.sort((left, right) => left - right);
	const meanRgb = pixelCount === 0 ? [null, null, null] : rgbSums.map((sum) => sum / pixelCount);
	return {
		pixelCount,
		blackPixelCount,
		saturatedPixelCount,
		blackPixelFraction: pixelCount === 0 ? null : blackPixelCount / pixelCount,
		saturatedPixelFraction: pixelCount === 0 ? null : saturatedPixelCount / pixelCount,
		meanRgb,
		luminancePercentiles: [0, 5, 25, 50, 75, 95, 100].map((value) => ({
			percentile: value,
			value: percentile(luminances, value),
		})),
	};
}

function displaySkyStats(frame, fieldSummary, width, height) {
	const topDownPixels = flipRgbaRows(frame.pixels, width, height);
	const masks = fieldSummary.regionMasks;
	return {
		fullSky: displayRegionStats(topDownPixels, masks.fullSky),
		horizonBand: displayRegionStats(topDownPixels, masks.horizonBand),
		upperSky: displayRegionStats(topDownPixels, masks.upperSky),
	};
}

function maskCounts(frame, regionMasks, width, height) {
	const pixels = flipRgbaRows(frame.pixels, width, height);
	let blackSkyPixelCount = 0;
	let saturatedSkyPixelCount = 0;
	for (let pixel = 0; pixel < width * height; pixel += 1) {
		if (!regionMasks.fullSky[pixel]) continue;
		const index = pixel * 4;
		if (pixels[index] === 0 && pixels[index + 1] === 0 && pixels[index + 2] === 0) {
			blackSkyPixelCount += 1;
		}
		if (pixels[index] === 255 || pixels[index + 1] === 255 || pixels[index + 2] === 255) {
			saturatedSkyPixelCount += 1;
		}
	}
	return {pixels, blackSkyPixelCount, saturatedSkyPixelCount};
}

function combinedMaskDataUrl(configuration, frames, hitTopDown, width, height) {
	const diagnostics = configuration.diagnostics.combinedMask;
	const geometryColor = parseHexColor(diagnostics.geometryColor);
	const predicateColor = parseHexColor(diagnostics.skyPredicateColor);
	const nonPredicateColor = parseHexColor(diagnostics.skyNonPredicateColor);
	const topDownByControl = {
		bruneton: flipRgbaRows(frames.bruneton.pixels, width, height),
		'production-lift': flipRgbaRows(frames['production-lift'].pixels, width, height),
	};
	const output = new Uint8ClampedArray(width * height * 4);
	const quadrantWidth = Math.floor(width / 2);
	const quadrantHeight = Math.floor(height / 2);
	for (const quadrant of diagnostics.quadrants) {
		const controlPixels = topDownByControl[quadrant.controlId];
		for (let localY = 0; localY < quadrantHeight; localY += 1) {
			for (let localX = 0; localX < quadrantWidth; localX += 1) {
				const sourceX = Math.min(
					width - 1,
					Math.floor((localX + 0.5) * width / quadrantWidth),
				);
				const sourceY = Math.min(
					height - 1,
					Math.floor((localY + 0.5) * height / quadrantHeight),
				);
				const source = (sourceY * width + sourceX) * 4;
				const outputX = quadrant.column * quadrantWidth + localX;
				const outputY = quadrant.row * quadrantHeight + localY;
				const target = (outputY * width + outputX) * 4;
				let color;
				if (hitTopDown[source] === 255) {
					color = geometryColor;
				} else {
					const black =
						controlPixels[source] === 0 &&
						controlPixels[source + 1] === 0 &&
						controlPixels[source + 2] === 0;
					const saturated =
						controlPixels[source] === 255 ||
						controlPixels[source + 1] === 255 ||
						controlPixels[source + 2] === 255;
					const matches = quadrant.predicate.includes('R == 0') ? black : saturated;
					color = matches ? predicateColor : nonPredicateColor;
				}
				output[target] = color[0];
				output[target + 1] = color[1];
				output[target + 2] = color[2];
				output[target + 3] = 255;
			}
		}
	}
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR1 mask panel requires a 2D canvas context.');
	context.imageSmoothingEnabled = false;
	context.putImageData(new ImageData(output, width, height), 0, 0);
	context.strokeStyle = '#808080';
	context.lineWidth = 2;
	context.beginPath();
	context.moveTo(quadrantWidth, 0);
	context.lineTo(quadrantWidth, height);
	context.moveTo(0, quadrantHeight);
	context.lineTo(width, quadrantHeight);
	context.stroke();
	context.font = '13px sans-serif';
	context.textAlign = 'left';
	context.textBaseline = 'top';
	for (const quadrant of diagnostics.quadrants) {
		const x = quadrant.column * quadrantWidth + 5;
		const y = quadrant.row * quadrantHeight + 5;
		const widthText = context.measureText(quadrant.label).width;
		context.fillStyle = 'rgba(0,0,0,0.75)';
		context.fillRect(x - 3, y - 3, widthText + 6, 19);
		context.fillStyle = '#ffffff';
		context.fillText(quadrant.label, x, y);
	}
	const dataUrl = canvas.toDataURL('image/png');
	canvas.remove();
	return dataUrl;
}

function absoluteDifference(left, right, width, height) {
	requireCondition(left.length === right.length, 'CR1 framebuffer lengths differ.');
	const sums = [0, 0, 0];
	const signedSums = [0, 0, 0];
	let maximumDifference = 0;
	let differingPixelCount = 0;
	let overOneCodePixelCount = 0;
	let squaredError = 0;
	let minimumX = width;
	let minimumY = height;
	let maximumX = -1;
	let maximumY = -1;
	for (let index = 0; index < left.length; index += 4) {
		let pixelMaximum = 0;
		for (let channel = 0; channel < 3; channel += 1) {
			const signed = right[index + channel] - left[index + channel];
			const difference = Math.abs(signed);
			sums[channel] += difference;
			signedSums[channel] += signed;
			squaredError += difference * difference;
			maximumDifference = Math.max(maximumDifference, difference);
			pixelMaximum = Math.max(pixelMaximum, difference);
		}
		if (pixelMaximum > 0) {
			differingPixelCount += 1;
			const pixel = index / 4;
			const x = pixel % width;
			const yFromBottom = Math.floor(pixel / width);
			const y = height - 1 - yFromBottom;
			minimumX = Math.min(minimumX, x);
			minimumY = Math.min(minimumY, y);
			maximumX = Math.max(maximumX, x);
			maximumY = Math.max(maximumY, y);
		}
		if (pixelMaximum > 1) overOneCodePixelCount += 1;
	}
	return {
		maximumAbsoluteChannelDifference: maximumDifference,
		meanAbsoluteRgbDifference: sums.map((sum) => sum / (width * height)),
		signedMeanRgbDifference: signedSums.map((sum) => sum / (width * height)),
		rmseRgbCodes: Math.sqrt(squaredError / (width * height * 3)),
		differingPixelCount,
		overOneCodePixelCount,
		differingPixelFraction: differingPixelCount / (width * height),
		boundingBox:
			differingPixelCount === 0
				? null
				: {minimumX, minimumY, maximumX, maximumY},
	};
}

function dot(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function modelDirectionToScene(geometry, direction) {
	const right = geometry.mapObserverLocalSceneDirectionToModelDirection([1, 0, 0]);
	const up = geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0]);
	const forward = geometry.mapObserverLocalSceneDirectionToModelDirection([0, 0, 1]);
	return new THREE.Vector3(dot(direction, right), dot(direction, up), dot(direction, forward)).normalize();
}

function directionalProbeDirections(configuration, geometry, directionToSourceModel) {
	const source = modelDirectionToScene(geometry, directionToSourceModel);
	const horizontal = new THREE.Vector3(source.x, 0, source.z);
	if (horizontal.lengthSq() < 1e-20) {
		const fallback = cameraDirection(configuration.camera);
		horizontal.set(fallback.x, 0, fallback.z);
	}
	horizontal.normalize();
	const horizonDefinition = configuration.diagnostics.directionalProbes.find(
		(probe) => probe.id === 'sunward-horizon',
	);
	const horizonElevation = (horizonDefinition?.elevationDegrees ?? 0.25) * Math.PI / 180;
	const horizon = horizontal.multiplyScalar(Math.cos(horizonElevation));
	horizon.y = Math.sin(horizonElevation);
	horizon.normalize();
	return new Map([
		['sun-center-direction', source],
		['sunward-horizon', horizon],
		['zenith', new THREE.Vector3(0, 1, 0)],
	]);
}

function reconstructPrincipalSceneDirection(camera) {
	const clip = new THREE.Vector4(0, 0, 1, 1).applyMatrix4(camera.projectionMatrixInverse);
	const divisor = Math.max(clip.w, 0.000001);
	const view = new THREE.Vector3(
		clip.x / divisor,
		clip.y / divisor,
		clip.z / divisor,
	).normalize();
	const scene = new THREE.Vector4(view.x, view.y, view.z, 0).applyMatrix4(camera.matrixWorld);
	return new THREE.Vector3(scene.x, scene.y, scene.z).normalize();
}

function directionArray(direction) {
	return [direction.x, direction.y, direction.z];
}

function captureDirectionalProbes({
	configuration,
	context,
	renderer,
	composer,
	camera,
	bindingValues,
	algorithm32,
	sceneScale,
	geometry,
	directionToSourceModel,
}) {
	const originalQuaternion = camera.quaternion.clone();
	const originalUp = camera.up.clone();
	const originalAspect = camera.aspect;
	const directions = directionalProbeDirections(configuration, geometry, directionToSourceModel);
	const results = [];
	composer.renderToScreen = false;
	try {
		composer.setSize(1, 1);
		camera.aspect = 1;
		camera.updateProjectionMatrix();
		for (const definition of configuration.diagnostics.directionalProbes) {
			const targetDirectionScene = directions.get(definition.id);
			requireCondition(
				targetDirectionScene,
				'CR1 directional probe is unsupported: ' + definition.id + '.',
			);
			camera.up.set(0, 1, 0);
			if (Math.abs(targetDirectionScene.dot(camera.up)) > 0.999) camera.up.set(0, 0, -1);
			camera.lookAt(camera.position.clone().add(targetDirectionScene));
			Algorithm32Bindings.update({
				bindingValues,
				camera,
				props: {config: algorithm32.config.config, sceneScale},
			});
			composer.render(0);
			const rgba = new Float32Array(4);
			renderer.readRenderTargetPixels(composer.writeBuffer, 0, 0, 1, 1, rgba);
			const hit = new Uint8Array(4);
			renderer.readRenderTargetPixels(sceneInputCapture(composer)._hitTarget, 0, 0, 1, 1, hit);
			const linearRgb = Array.from(rgba.slice(0, 3));
			const finite = linearRgb.every(Number.isFinite);
			const reconstructedDirectionScene = reconstructPrincipalSceneDirection(camera);
			const targetDirectionModel = geometry.mapObserverLocalSceneDirectionToModelDirection(
				directionArray(targetDirectionScene),
			);
			const reconstructedDirectionModel =
				geometry.mapObserverLocalSceneDirectionToModelDirection(
					directionArray(reconstructedDirectionScene),
				);
			const targetDirectionSceneArray = directionArray(targetDirectionScene);
			const reconstructedDirectionSceneArray = directionArray(reconstructedDirectionScene);
			const directionDot = clamp(
				targetDirectionScene.dot(reconstructedDirectionScene),
				-1,
				1,
			);
			const angularErrorRadians = Math.atan2(
				targetDirectionScene.clone().cross(reconstructedDirectionScene).length(),
				directionDot,
			);
			const maximumAbsoluteDirectionComponentError = Math.max(
				...targetDirectionSceneArray.map(
					(value, index) => Math.abs(value - reconstructedDirectionSceneArray[index]),
				),
			);
			results.push({
				id: definition.id,
				label: definition.label,
				sampling: {
					kind: 'one-by-one-principal-ray',
					viewport: {width: 1, height: 1, units: 'pixels'},
					pixel: {x: 0, yFromBottom: 0},
					textureCoordinates: [0.5, 0.5],
					reconstruction:
						'SphericalGeometryShaderContributor reconstructViewRay at textureCoordinates (0.5, 0.5)',
				},
				targetDirectionScene: targetDirectionSceneArray,
				targetDirectionModel: [...targetDirectionModel],
				reconstructedDirectionScene: reconstructedDirectionSceneArray,
				reconstructedDirectionModel: [...reconstructedDirectionModel],
				directionScene: reconstructedDirectionSceneArray,
				directionModel: [...reconstructedDirectionModel],
				maximumAbsoluteDirectionComponentError,
				angularErrorRadians,
				angularErrorDegrees: angularErrorRadians * 180 / Math.PI,
				linearRgb,
				chromaticity: finite ? linearSrgbChromaticity(linearRgb) : null,
				luminance: finite
					? Math.max(
						0,
						linearRgb[0] * LUMINANCE_WEIGHTS[0] +
						linearRgb[1] * LUMINANCE_WEIGHTS[1] +
						linearRgb[2] * LUMINANCE_WEIGHTS[2],
					)
					: null,
				geometryHit: hit[0] === 255,
				hitRgba: Array.from(hit),
				finite,
			});
		}
	} finally {
		composer.setSize(
			configuration.camera.widthPixels,
			configuration.camera.heightPixels,
		);
		camera.aspect = originalAspect;
		camera.quaternion.copy(originalQuaternion);
		camera.up.copy(originalUp);
		Algorithm32Bindings.update({
			bindingValues,
			camera,
			props: {config: algorithm32.config.config, sceneScale},
		});
		composer.renderToScreen = true;
	}
	return {probes: results, webglErrors: drainWebglErrors(context)};
}

function publicFrame(frame, skyStats) {
	return {
		colorId: frame.colorId,
		brightnessProxy: frame.brightnessProxy,
		sourceBrightness: frame.sourceBrightness,
		summary: frame.summary,
		skyStats,
		geometryProbe: frame.geometryProbe,
		diagnostics: frame.diagnostics,
		webglErrors: frame.webglErrors,
		contextLost: frame.contextLost,
	};
}

function cacheRuntimeFacts(cache) {
	const contribution = cache?.createShaderContribution?.();
	const runtimeBindings = cache?.getRuntimeBindings?.();
	return {
		contributionId: contribution?.id ?? null,
		bindingCount: runtimeBindings?.bindings?.length ?? null,
		backendId: runtimeBindings?.backendId ?? null,
	};
}

async function renderScene(configuration, sceneSpec, panelReady, rawReady, hitMaskReady) {
	const {camera: cameraSpec, observer, location} = configuration;
	const physical = configuration.physicalControls;
	const cacheStatus = sceneSpec.cacheStatus ?? sceneSpec.cacheExpectation?.status;
	requireCondition(cacheStatus === 'ready' || cacheStatus === 'dark', sceneSpec.id + ' has no accepted cache status.');
	requireCondition(
		[
			cameraSpec.nearSceneUnits,
			cameraSpec.farSceneUnits,
			physical.sceneDepthMaxMeters,
			physical.sceneScaleMetersPerSceneUnit,
			physical.sourceAngularRadiusRadians,
		].every((value) => Number.isFinite(value) && value > 0) &&
			cameraSpec.nearSceneUnits < cameraSpec.farSceneUnits &&
			physical.sceneDepthMaxMeters ===
				cameraSpec.farSceneUnits * physical.sceneScaleMetersPerSceneUnit &&
			physical.maximumScatteringOrder === 4 &&
			physical.pathIntervalCount === 30 &&
			physical.pathSampleDistribution === 'quadratic-near-observer-v1',
		'CR1 physical/camera controls are incompatible with the fixed Q30 production path.',
	);
	const width = cameraSpec.widthPixels;
	const height = cameraSpec.heightPixels;
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: true,
		stencil: false,
		preserveDrawingBuffer: true,
	});
	if (!context) throw new Error('CR1 requires WebGL2.');
	const extColorBufferFloat = context.getExtension('EXT_color_buffer_float');
	requireCondition(extColorBufferFloat, 'CR1 requires EXT_color_buffer_float.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.setPixelRatio(1);
	renderer.setSize(width, height, false);
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(
		cameraSpec.verticalFieldOfViewDegrees,
		width / height,
		cameraSpec.nearSceneUnits,
		cameraSpec.farSceneUnits,
	);
	camera.position.set(0, observer.heightMeters / physical.sceneScaleMetersPerSceneUnit, 0);
	camera.lookAt(camera.position.clone().add(cameraDirection(cameraSpec)));
	camera.updateMatrixWorld(true);
	const sceneDepthMax = {value: physical.sceneDepthMaxMeters, units: 'meters'};
	const sceneScale = {value: physical.sceneScaleMetersPerSceneUnit, units: 'meters-per-scene-unit'};
	const target = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: true,
		stencilBuffer: false,
	});
	target.texture.colorSpace = THREE.NoColorSpace;
	const composer = new EffectComposer(renderer, target);
	composer.setPixelRatio(1);
	composer.setSize(width, height);
	composer.addPass(new RenderPass(scene, camera));
	requireCondition(
		composer.readBuffer.texture.type === THREE.FloatType &&
			composer.writeBuffer.texture.type === THREE.FloatType &&
			composer.readBuffer.texture.colorSpace === THREE.NoColorSpace &&
			composer.writeBuffer.texture.colorSpace === THREE.NoColorSpace,
		'CR1 composer buffers are not FloatType/NoColorSpace.',
	);
	const backend = new ThreeCacheBackend({THREE, renderer});
	const observation = {
		instant: sceneSpec.timeIso,
		location: {
			latitude: {value: location.latitudeDegrees, units: 'degrees'},
			longitude: {value: location.longitudeDegrees, units: 'degrees'},
		},
	};
	const sceneState = createDistantSunSceneState({
		observation,
		observerHeight: {value: observer.heightMeters, units: 'meters'},
		observerUpDirection: observer.upDirection,
	});
	requireCondition(
		Math.abs(sceneState.solarZenithDegrees - sceneSpec.solarZenithDegrees) <= 1e-12,
		sceneSpec.id + ' browser solar zenith differs from the runner selection.',
	);
	requireCondition(
		cacheStatus === 'dark' ? sceneSpec.sceneCacheAsset === undefined : sceneSpec.sceneCacheAsset !== undefined,
		sceneSpec.id + ' browser cache selection disagrees with its cache status.',
	);
	const mode = new SphericalDistantMode({
		sceneState,
		sceneScale,
		sourceAngularRadius: {value: physical.sourceAngularRadiusRadians, units: 'radians'},
		maximumScatteringOrder: physical.maximumScatteringOrder,
		celestialSourcesEnabled: false,
		colorDisplayModelConfiguration: {model: 'bruneton-control'},
		...(cacheStatus === 'ready' ? {sceneCacheAsset: sceneSpec.sceneCacheAsset} : {}),
		distantSunCacheState: cacheStatus,
	});
	const algorithm32 = mode.algorithm32;
	const groundEndpoints = mode.geometry.createThreeEndpointObjects({
		name: 'cr1-' + sceneSpec.id + '-spherical-ground',
		sceneScale,
		widthSegments: physical.groundWidthSegments,
		heightSegments: physical.groundHeightSegments,
		visualMaterialColor: 0x000000,
		groundVisualMesh: {kind: 'local-spherical-patch'},
	});
	scene.add(...groundEndpoints.visualObjects);
	const bindingValues = Algorithm32Bindings.create(THREE, sceneDepthMax);
	Algorithm32Bindings.update({
		bindingValues,
		camera,
		props: {config: algorithm32.config.config, sceneScale},
	});
	let handle = null;
	try {
		handle = await algorithm32.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width, height, units: 'pixels'},
			sceneScale,
			sceneDepthMax,
			bindingValues,
			cacheBackend: backend,
		});
		await handle.prepare(renderer);
		const bruneton = captureDisplayFrame({
			canvas,
			context,
			renderer,
			composer,
			algorithm32,
			handle,
			width,
			height,
			sceneDepthMax,
		});
		const initialController = handle._buildResult?.scatteringCacheController;
		const initialCache = handle._buildResult?.scatteringCache;
		const initialCacheRuntime = cacheRuntimeFacts(initialCache);
		await panelReady(sceneSpec, 'bruneton', bruneton.dataUrl, {
			colorId: bruneton.colorId,
			shaderSourceHash: bruneton.diagnostics?.runtime?.sourceHash ?? null,
		});

		const productionModel = new BrunetonSourceLuminanceLiftColorDisplayModel();
		await handle.setConfig({...algorithm32.config.config, color: productionModel});
		const productionLift = captureDisplayFrame({
			canvas,
			context,
			renderer,
			composer,
			algorithm32,
			handle,
			width,
			height,
			sceneDepthMax,
		});
		const afterLiftController = handle._buildResult?.scatteringCacheController;
		const afterLiftCache = handle._buildResult?.scatteringCache;
		await panelReady(sceneSpec, 'production-lift', productionLift.dataUrl, {
			colorId: productionLift.colorId,
			shaderSourceHash: productionLift.diagnostics?.runtime?.sourceHash ?? null,
		});

		await handle.setConfig({
			...algorithm32.config.config,
			color: new Cr1LinearFieldDiagnosticColorDisplayModel(),
		});
		const field = captureLinearField({
			context,
			renderer,
			composer,
			algorithm32,
			handle,
			width,
			height,
			sceneDepthMax,
		});
		const afterDiagnosticController = handle._buildResult?.scatteringCacheController;
		const afterDiagnosticCache = handle._buildResult?.scatteringCache;
		const rawRecord = await rawReady(sceneSpec, field.bytes);
		const fieldSummary = summarizeField(
			field,
			field.hitTopDown,
			width,
			height,
			configuration.diagnostics,
		);
		const heatmap = heatmapDataUrl(
			field.values,
			field.hitTopDown,
			width,
			height,
			configuration.diagnostics.heatmap,
		);
		await panelReady(sceneSpec, 'pre-display-luminance', heatmap, {
			colorId: field.colorId,
			shaderSourceHash: field.diagnostics?.runtime?.sourceHash ?? null,
		});
		const mask = combinedMaskDataUrl(
			configuration,
			{bruneton, 'production-lift': productionLift},
			field.hitTopDown,
			width,
			height,
		);
		await panelReady(sceneSpec, 'black-saturation-masks', mask, {
			colorId: 'derived-display-code-mask-v1',
			shaderSourceHash: null,
		});
		const hitMaskComparison = compareAndRetainHitMasks(
			{bruneton, 'production-lift': productionLift},
			field,
			width,
			height,
		);
		const hitMaskRecord = await hitMaskReady(
			sceneSpec,
			hitMaskComparison.bytes,
			{
				equality: hitMaskComparison.equality,
				counts: hitMaskComparison.counts,
				nondegenerate: hitMaskComparison.nondegenerate,
			},
		);
		const probes = captureDirectionalProbes({
			configuration,
			context,
			renderer,
			composer,
			camera,
			bindingValues,
			algorithm32,
			sceneScale,
			geometry: mode.geometry,
			directionToSourceModel: sceneState.directionToSourceModel,
		});
		const regionMasks = fieldSummary.regionMasks;
		const brunetonMaskCounts = maskCounts(bruneton, regionMasks, width, height);
		const productionMaskCounts = maskCounts(productionLift, regionMasks, width, height);
		const cacheIdentity =
			sceneSpec.cacheIdentity ??
			sceneSpec.sceneCacheAsset?.loadRequest?.cacheIdentity ??
			'algorithm32-distant-sun-shared-dark-v1';
		return {
			publicResult: {
				sceneId: sceneSpec.id,
				label: sceneSpec.label,
				solarZenithDegrees: sceneState.solarZenithDegrees,
				directionToSourceModel: sceneState.directionToSourceModel,
				cacheStatus,
				cacheIdentity,
				ground: groundEndpoints.metadata,
				hitMask: hitMaskRecord,
				gpu: {
					api: context.getParameter(context.VERSION),
					renderer: context.getParameter(
						context.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL ??
							context.RENDERER,
					),
					extColorBufferFloat: true,
					composerBufferType: 'FloatType',
					composerColorSpace: 'NoColorSpace',
				},
				cacheRuntime: initialCacheRuntime,
				cacheReuse: {
					initialCachePublished: Boolean(initialController && initialCache),
					controllerAfterLift:
						Boolean(initialController) && afterLiftController === initialController,
					residentAfterLift: Boolean(initialCache) && afterLiftCache === initialCache,
					controllerAfterDiagnostic:
						Boolean(initialController) && afterDiagnosticController === initialController,
					residentAfterDiagnostic:
						Boolean(initialCache) && afterDiagnosticCache === initialCache,
				},
				frames: {
					bruneton: publicFrame(
						bruneton,
						displaySkyStats(bruneton, fieldSummary, width, height),
					),
					'production-lift': publicFrame(
						productionLift,
						displaySkyStats(productionLift, fieldSummary, width, height),
					),
				},
				displayDifference: absoluteDifference(
					bruneton.pixels,
					productionLift.pixels,
					width,
					height,
				),
				field: {
					colorId: field.colorId,
					rawArtifactPath: rawRecord.artifactPath,
					rawByteLength: rawRecord.byteLength,
					width,
					height,
					storage: fieldSummary.storage,
					units: fieldSummary.units,
					luminanceEquation: fieldSummary.luminanceEquation,
					finiteRgbPixelCount: fieldSummary.finiteRgbPixelCount,
					nonfiniteRgbPixelCount: fieldSummary.nonfiniteRgbPixelCount,
					skyPixelCount: fieldSummary.skyPixelCount,
					geometryPixelCount: fieldSummary.geometryPixelCount,
					zeroLuminanceSkyPixelCount: fieldSummary.zeroLuminanceSkyPixelCount,
					percentiles: fieldSummary.percentiles,
					meanLinearRgb: fieldSummary.meanLinearRgb,
					chromaticity: fieldSummary.chromaticity,
					regions: fieldSummary.regions,
					probes: probes.probes,
					diagnostics: field.diagnostics,
					webglErrors: [...field.webglErrors, ...probes.webglErrors],
					contextLost: field.contextLost,
					cpuDisplayReplay: null,
				},
				masks: {
					geometryPixelCount: fieldSummary.geometryPixelCount,
					bruneton: {
						blackSkyPixelCount: brunetonMaskCounts.blackSkyPixelCount,
						saturatedSkyPixelCount: brunetonMaskCounts.saturatedSkyPixelCount,
					},
					'production-lift': {
						blackSkyPixelCount: productionMaskCounts.blackSkyPixelCount,
						saturatedSkyPixelCount: productionMaskCounts.saturatedSkyPixelCount,
					},
				},
			},
			internal: {
				fieldValues: field.values,
				fullSkyMask: fieldSummary.regionMasks.fullSky,
				brunetonPixels: bruneton.pixels,
				productionLiftPixels: productionLift.pixels,
				brightnessProxy: productionLift.brightnessProxy,
				panelDataUrls: {
					bruneton: bruneton.dataUrl,
					'production-lift': productionLift.dataUrl,
					'pre-display-luminance': heatmap,
					'black-saturation-masks': mask,
				},
			},
		};
	} finally {
		handle?.dispose();
		for (const groundObject of groundEndpoints.visualObjects) {
			groundObject.geometry?.dispose();
			groundObject.material?.dispose();
		}
		mode.dispose();
		backend.dispose();
		composer.dispose();
		target.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		canvas.remove();
	}
}

function cpuDisplayReplay(
	model,
	fieldValues,
	fullSkyMask,
	gpuBottomUp,
	width,
	height,
	brightnessProxy,
) {
	const gpuTopDown = flipRgbaRows(gpuBottomUp, width, height);
	let maximumAbsoluteChannelDifference = 0;
	let overOneCodePixelCount = 0;
	let differingPixelCount = 0;
	let squaredError = 0;
	let nonfinitePredictionPixelCount = 0;
	let skyPixelCount = 0;
	for (let pixel = 0; pixel < width * height; pixel += 1) {
		if (!fullSkyMask[pixel]) continue;
		skyPixelCount += 1;
		const index = pixel * 4;
		const linearRgb = [fieldValues[index], fieldValues[index + 1], fieldValues[index + 2]];
		let predicted;
		try {
			predicted = model.linearSrgbToDisplayRgb(linearRgb, brightnessProxy);
		} catch {
			predicted = [Number.NaN, Number.NaN, Number.NaN];
		}
		if (!predicted.every(Number.isFinite)) {
			nonfinitePredictionPixelCount += 1;
			continue;
		}
		let pixelMaximum = 0;
		for (let channel = 0; channel < 3; channel += 1) {
			const code = Math.round(clamp(predicted[channel], 0, 1) * 255);
			const difference = Math.abs(code - gpuTopDown[index + channel]);
			maximumAbsoluteChannelDifference = Math.max(maximumAbsoluteChannelDifference, difference);
			pixelMaximum = Math.max(pixelMaximum, difference);
			squaredError += difference * difference;
		}
		if (pixelMaximum > 0) differingPixelCount += 1;
		if (pixelMaximum > 1) overOneCodePixelCount += 1;
	}
	return {
		population: 'sky-only from full SceneInputCapture hit mask',
		skyPixelCount,
		skippedGeometryPixelCount: width * height - skyPixelCount,
		maximumAbsoluteChannelDifference,
		overOneCodePixelCount,
		differingPixelCount,
		rmseRgbCodes: skyPixelCount === 0 ? null : Math.sqrt(squaredError / (skyPixelCount * 3)),
		nonfinitePredictionPixelCount,
	};
}

function installCpuDisplayReplay(configuration, sceneRecord) {
	const {
		fieldValues,
		fullSkyMask,
		brunetonPixels,
		productionLiftPixels,
		brightnessProxy,
	} = sceneRecord.internal;
	const width = configuration.camera.widthPixels;
	const height = configuration.camera.heightPixels;
	const bruneton = new BrunetonColorDisplayModel();
	const productionLift = new BrunetonSourceLuminanceLiftColorDisplayModel();
	sceneRecord.publicResult.field.cpuDisplayReplay = {
		input: 'pre-display composeSceneLinearSrgb RGB',
		quantization: 'round(clamp(channel, 0, 1) * 255)',
		bruneton: cpuDisplayReplay(
			bruneton,
			fieldValues,
			fullSkyMask,
			brunetonPixels,
			width,
			height,
		),
		'production-lift': cpuDisplayReplay(
			productionLift,
			fieldValues,
			fullSkyMask,
			productionLiftPixels,
			width,
			height,
			brightnessProxy,
		),
	};
}

function loadImage(source) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('CR1 could not decode image ' + source + '.'));
		image.src = source;
	});
}

async function decodeImageRgba(source, width, height) {
	const image = await loadImage(source);
	requireCondition(
		image.naturalWidth === width && image.naturalHeight === height,
		'CR1 replay image dimensions changed for ' + source + '.',
	);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {willReadFrequently: true});
	requireCondition(context, 'CR1 replay requires a 2D canvas context.');
	context.drawImage(image, 0, 0);
	const pixels = context.getImageData(0, 0, width, height).data;
	canvas.remove();
	return pixels;
}

function rgbaReplayDifference(current, parent, width, height) {
	requireCondition(current.length === parent.length, 'CR1 replay RGBA lengths differ.');
	let maximumAbsoluteChannelDifference = 0;
	let rgbaDifferingPixelCount = 0;
	let squaredError = 0;
	for (let index = 0; index < current.length; index += 4) {
		let pixelMaximum = 0;
		for (let channel = 0; channel < 4; channel += 1) {
			const difference = Math.abs(current[index + channel] - parent[index + channel]);
			maximumAbsoluteChannelDifference = Math.max(maximumAbsoluteChannelDifference, difference);
			pixelMaximum = Math.max(pixelMaximum, difference);
			squaredError += difference * difference;
		}
		if (pixelMaximum > 0) rgbaDifferingPixelCount += 1;
	}
	return {
		exactRgba: rgbaDifferingPixelCount === 0,
		rgbaDifferingPixelCount,
		maximumAbsoluteChannelDifference,
		rmseRgbaCodes: Math.sqrt(squaredError / (width * height * 4)),
	};
}

function parentReplayDefinitions(configuration) {
	if (Array.isArray(configuration.parentReplayPanels)) return configuration.parentReplayPanels;
	return Object.entries(configuration.parentControl.overlappingPanelSha256).map(([key, expectedSha256]) => {
		const [sceneId, controlId] = key.split('/');
		const artifactPath = panelPath(controlId, sceneId);
		return {
			sceneId,
			controlId,
			artifactPath,
			parentArtifactPath: artifactPath,
			expectedSha256,
		};
	});
}

async function compareParentReplay(configuration, sceneRecords) {
	const records = new Map(sceneRecords.map((record) => [record.publicResult.sceneId, record]));
	const width = configuration.camera.widthPixels;
	const height = configuration.camera.heightPixels;
	const replay = [];
	for (const definition of parentReplayDefinitions(configuration)) {
		const scene = records.get(definition.sceneId);
		const currentSource = scene?.internal.panelDataUrls[definition.controlId];
		requireCondition(currentSource, 'CR1 current replay panel is missing for ' + definition.sceneId + '/' + definition.controlId + '.');
		const parentPath = definition.parentArtifactPath.replace(/^\/+/u, '');
		const [current, parent] = await Promise.all([
			decodeImageRgba(currentSource, width, height),
			decodeImageRgba('/parent/' + parentPath, width, height),
		]);
		replay.push({
			...definition,
			width,
			height,
			...rgbaReplayDifference(current, parent, width, height),
		});
	}
	return replay;
}

function fieldPercentile(scene, value) {
	return scene.publicResult.field.percentiles.find((entry) => entry.percentile === value)?.value ?? null;
}

function fieldProbe(scene, id) {
	return scene.publicResult.field.probes.find((entry) => entry.id === id)?.luminance ?? null;
}

function luminancePlotDataUrl(configuration, sceneRecords) {
	const width = 1500;
	const height = 900;
	const margin = {left: 105, right: 40, top: 100, bottom: 170};
	const plotWidth = width - margin.left - margin.right;
	const plotHeight = height - margin.top - margin.bottom;
	const minimum = configuration.diagnostics.heatmap.minimumLog10CdPerSquareMeter;
	const maximum = configuration.diagnostics.heatmap.maximumLog10CdPerSquareMeter;
	const series = [
		{id: 'p5', label: 'Sky p5', color: '#4f80ff', values: sceneRecords.map((scene) => fieldPercentile(scene, 5))},
		{id: 'p50', label: 'Sky p50', color: '#00c080', values: sceneRecords.map((scene) => fieldPercentile(scene, 50))},
		{id: 'p95', label: 'Sky p95', color: '#ff9f1c', values: sceneRecords.map((scene) => fieldPercentile(scene, 95))},
		{
			id: 'sun-center-direction',
			label: 'Sun-center direction',
			color: '#ff4040',
			values: sceneRecords.map((scene) => fieldProbe(scene, 'sun-center-direction')),
		},
		{
			id: 'sunward-horizon',
			label: 'Sunward horizon +0.25 deg',
			color: '#d040d0',
			values: sceneRecords.map((scene) => fieldProbe(scene, 'sunward-horizon')),
		},
		{
			id: 'zenith',
			label: 'True zenith',
			color: '#40bfff',
			values: sceneRecords.map((scene) => fieldProbe(scene, 'zenith')),
		},
	];
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR1 luminance plot requires a 2D canvas context.');
	context.fillStyle = '#101216';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#ffffff';
	context.font = 'bold 26px sans-serif';
	context.textAlign = 'left';
	context.fillText('CR1 pre-display field luminance', margin.left, 42);
	context.font = '15px sans-serif';
	context.fillStyle = '#bfc5cf';
	context.fillText('Fixed log10 cd m^-2 scale; zeros are drawn at the lower boundary.', margin.left, 70);
	const xFor = (index) =>
		sceneRecords.length === 1
			? margin.left + plotWidth / 2
			: margin.left + index * plotWidth / (sceneRecords.length - 1);
	const yFor = (value) => {
		const logValue = Number.isFinite(value) && value > 0 ? Math.log10(value) : minimum;
		return margin.top + (maximum - clamp(logValue, minimum, maximum)) / (maximum - minimum) * plotHeight;
	};
	context.strokeStyle = '#555b66';
	context.fillStyle = '#bfc5cf';
	context.lineWidth = 1;
	context.font = '13px sans-serif';
	context.textAlign = 'right';
	for (let exponent = Math.ceil(minimum); exponent <= Math.floor(maximum); exponent += 1) {
		const y = yFor(10 ** exponent);
		context.beginPath();
		context.moveTo(margin.left, y);
		context.lineTo(margin.left + plotWidth, y);
		context.stroke();
		context.fillText('10^' + exponent, margin.left - 10, y + 4);
	}
	for (const line of series) {
		context.strokeStyle = line.color;
		context.fillStyle = line.color;
		context.lineWidth = 2.5;
		context.beginPath();
		line.values.forEach((value, index) => {
			const x = xFor(index);
			const y = yFor(value);
			if (index === 0) context.moveTo(x, y);
			else context.lineTo(x, y);
		});
		context.stroke();
		line.values.forEach((value, index) => {
			context.beginPath();
			context.arc(xFor(index), yFor(value), 3.5, 0, Math.PI * 2);
			context.fill();
		});
	}
	context.save();
	context.font = '13px sans-serif';
	context.fillStyle = '#ffffff';
	context.textAlign = 'right';
	sceneRecords.forEach((scene, index) => {
		context.save();
		context.translate(xFor(index) + 4, margin.top + plotHeight + 18);
		context.rotate(-Math.PI / 4);
		context.fillText(scene.publicResult.label, 0, 0);
		context.restore();
	});
	context.restore();
	let legendX = margin.left;
	let legendY = height - 40;
	context.font = '14px sans-serif';
	context.textAlign = 'left';
	for (const line of series) {
		context.fillStyle = line.color;
		context.fillRect(legendX, legendY - 10, 22, 4);
		context.fillStyle = '#ffffff';
		context.fillText(line.label, legendX + 30, legendY);
		legendX += 205;
		if (legendX > width - 240) {
			legendX = margin.left;
			legendY += 24;
		}
	}
	const dataUrl = canvas.toDataURL('image/png');
	canvas.remove();
	return {dataUrl, width, height, series: series.map(({id, label, values}) => ({id, label, values}))};
}

async function contactSheetDataUrl(configuration, sceneRecords) {
	const panelWidth = configuration.camera.widthPixels;
	const panelHeight = configuration.camera.heightPixels;
	const labelHeight = 38;
	const columns = PANEL_KINDS.length;
	const rows = sceneRecords.length;
	const canvas = document.createElement('canvas');
	canvas.width = panelWidth * columns;
	canvas.height = (panelHeight + labelHeight) * rows;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR1 contact sheet requires a 2D canvas context.');
	context.fillStyle = '#111111';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#ffffff';
	context.font = '15px sans-serif';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	for (let row = 0; row < rows; row += 1) {
		const scene = sceneRecords[row];
		for (let column = 0; column < columns; column += 1) {
			const kind = PANEL_KINDS[column];
			const image = await loadImage(scene.internal.panelDataUrls[kind]);
			const x = column * panelWidth;
			const y = row * (panelHeight + labelHeight);
			context.fillStyle = '#111111';
			context.fillRect(x, y, panelWidth, labelHeight);
			context.fillStyle = '#ffffff';
			context.fillText(
				scene.publicResult.label + ' - ' + panelLabel(kind),
				x + panelWidth / 2,
				y + labelHeight / 2,
			);
			context.drawImage(image, x, y + labelHeight);
		}
	}
	const dataUrl = canvas.toDataURL('image/png');
	const result = {dataUrl, width: canvas.width, height: canvas.height, labelHeight};
	canvas.remove();
	return result;
}

/** Render and upload the complete seven-condition CR1 baseline before returning any gates. */
export async function runCr1SixSceneVisualBaselineBrowser() {
	const configuration = await fetch('/browser/config.json').then((response) => response.json());
	requireCondition(
		configuration.schemaId === 'algorithm32-color-reset-cr1-browser-config-v1',
		'CR1 browser configuration schema changed.',
	);
	requireCondition(configuration.scenes.length === 7, 'CR1 requires six primary scenes plus one dark control.');
	requireCondition(configuration.outputs.individualPngs.length === 28, 'CR1 requires exactly 28 individual PNGs.');
	requireCondition(configuration.outputs.rawFields.length === 7, 'CR1 requires exactly seven raw RGBY fields.');
	requireCondition(configuration.outputs.hitMasks.length === 7, 'CR1 requires exactly seven R8 hit masks.');
	await window.colorResetProgress('render-started');
	const panelRecords = [];
	const rawRecords = [];
	const hitMaskRecords = [];
	const sceneRecords = [];
	const panelReady = async (scene, kind, dataUrl, metadata) => {
		const panel = resolvePanel(configuration, scene, kind);
		const byteLength = await uploadPng(panel.artifactPath, dataUrl);
		panelRecords.push({
			...panel,
			byteLength,
			...metadata,
			width: configuration.camera.widthPixels,
			height: configuration.camera.heightPixels,
			cacheIdentity:
				scene.cacheIdentity ??
				scene.sceneCacheAsset?.loadRequest?.cacheIdentity ??
				'algorithm32-distant-sun-shared-dark-v1',
			solarZenithDegrees: scene.solarZenithDegrees,
		});
		await window.colorResetProgress('image-' + scene.id + '-' + kind);
	};
	const rawReady = async (scene, bytes) => {
		const artifactPath = rawFieldPath(configuration, scene.id);
		const byteLength = await uploadBytes(artifactPath, bytes, 'application/octet-stream');
		const record = {
			sceneId: scene.id,
			artifactPath,
			byteLength,
			width: configuration.camera.widthPixels,
			height: configuration.camera.heightPixels,
			layout: 'top-down row-major f32le RGBA = linear R, linear G, linear B, photopic Y',
			storage: configuration.diagnostics.preDisplayField.storage,
			populationHitMaskArtifactPath: hitMaskPath(configuration, scene.id),
		};
		rawRecords.push(record);
		return record;
	};
	const hitMaskReady = async (scene, bytes, comparison) => {
		const artifactPath = hitMaskPath(configuration, scene.id);
		const byteLength = await uploadBytes(artifactPath, bytes, 'application/octet-stream');
		const record = {
			sceneId: scene.id,
			artifactPath,
			byteLength,
			width: configuration.camera.widthPixels,
			height: configuration.camera.heightPixels,
			storage: configuration.diagnostics.sceneHitMask.storage,
			encoding: {sky: 0, geometry: 255},
			retainedCapture: 'pre-display-diagnostic',
			derivation: {
				source: configuration.diagnostics.sceneHitMask.source,
				operation: configuration.diagnostics.sceneHitMask.derivation,
			},
			...comparison,
		};
		hitMaskRecords.push(record);
		return record;
	};
	for (const sceneSpec of configuration.scenes) {
		sceneRecords.push(
			await renderScene(configuration, sceneSpec, panelReady, rawReady, hitMaskReady),
		);
	}
	requireCondition(panelRecords.length === 28, 'CR1 browser did not produce exactly 28 individual panels.');
	requireCondition(rawRecords.length === 7, 'CR1 browser did not produce exactly seven raw fields.');
	requireCondition(hitMaskRecords.length === 7, 'CR1 browser did not produce exactly seven hit masks.');

	const plot = luminancePlotDataUrl(configuration, sceneRecords);
	const plotByteLength = await uploadPng(configuration.outputs.plot, plot.dataUrl);
	await window.colorResetProgress('luminance-plot-complete');
	const contactSheet = await contactSheetDataUrl(configuration, sceneRecords);
	const contactSheetByteLength = await uploadPng(
		configuration.outputs.contactSheet,
		contactSheet.dataUrl,
	);
	await window.colorResetProgress('decision-plate-complete');

	for (const scene of sceneRecords) installCpuDisplayReplay(configuration, scene);
	const parentReplay = await compareParentReplay(configuration, sceneRecords);
	return {
		schemaId: 'algorithm32-color-reset-cr1-browser-result-v1',
		software: {
			browserUserAgent: navigator.userAgent,
			threeRevision: THREE.REVISION,
		},
		chromaticityAuthority: {
			source: BRUNETON_COLOR_SPACE_AUTHORITY.source,
			xyzToLinearSrgbMatrix: BRUNETON_COLOR_SPACE_AUTHORITY.xyzToLinearSrgbMatrix.map(
				(row) => [...row],
			),
			linearSrgbToXyzMatrix: BRUNETON_COLOR_SPACE_AUTHORITY.linearSrgbToXyzMatrix.map(
				(row) => [...row],
			),
			operation:
				'linear-sRGB -> inverse recorded Bruneton XYZ-to-linear-sRGB matrix -> XYZ; x=X/(X+Y+Z), y=Y/(X+Y+Z)',
		},
		panels: panelRecords,
		rawFields: rawRecords,
		hitMasks: hitMaskRecords,
		plot: {
			artifactPath: configuration.outputs.plot,
			byteLength: plotByteLength,
			width: plot.width,
			height: plot.height,
			series: plot.series,
		},
		contactSheet: {
			artifactPath: configuration.outputs.contactSheet,
			byteLength: contactSheetByteLength,
			width: contactSheet.width,
			height: contactSheet.height,
			labelHeight: contactSheet.labelHeight,
			panelArtifactPaths: panelRecords.map((panel) => panel.artifactPath),
		},
		scenes: sceneRecords.map((record) => record.publicResult),
		parentReplay,
	};
}
