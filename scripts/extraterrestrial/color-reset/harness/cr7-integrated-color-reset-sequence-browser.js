import {Cr4gSlopeLimitedPreToneExposureColorDisplayModel} from '../color/Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';

const WIDTH = 640;
const HEIGHT = 400;

function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }

async function sha256Hex(bytes) {
	const digest = await crypto.subtle.digest('SHA-256', bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
	return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

async function fetchVerified(record, label) {
	const response = await fetch(record.url);
	requireCondition(response.ok, `${label} fetch failed.`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	requireCondition(bytes.byteLength === record.byteLength && await sha256Hex(bytes) === record.sha256, `${label} identity changed.`);
	return bytes;
}

async function upload(path, bytes) {
	const response = await fetch(`/artifact/${path}`, {method: 'POST', headers: {'content-type': 'image/png'}, body: bytes});
	requireCondition(response.ok, `CR7 upload failed for ${path}.`);
	return {path, byteLength: bytes.byteLength, sha256: await sha256Hex(bytes)};
}

function dataUrlBytes(dataUrl) {
	const binary = atob(dataUrl.slice(dataUrl.indexOf(';base64,') + 8));
	return Uint8Array.from(binary, (value) => value.charCodeAt(0));
}

async function decode(bytes) {
	const bitmap = await createImageBitmap(new Blob([bytes], {type: 'image/png'}), {colorSpaceConversion: 'none', premultiplyAlpha: 'none'});
	const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
	const context = canvas.getContext('2d', {alpha: false, willReadFrequently: true, colorSpace: 'srgb'});
	context.drawImage(bitmap, 0, 0); bitmap.close();
	return {canvas, context, rgba: context.getImageData(0, 0, canvas.width, canvas.height).data};
}

function integrateGeometry(parentRgba, rawGeometryBytes, mask, displayModel, illuminanceLux) {
	const raw = new Float32Array(rawGeometryBytes.buffer.slice(rawGeometryBytes.byteOffset, rawGeometryBytes.byteOffset + rawGeometryBytes.byteLength));
	const rgba = new Uint8ClampedArray(parentRgba);
	const difference = new Uint8ClampedArray(parentRgba.length);
	const gain = displayModel.displayGain({value: illuminanceLux, units: 'lux'});
	const toneMapK = displayModel.displayConstants.paperFigure1ToneMapK;
	let changedGeometryPixelCount = 0;
	let changedNonGeometryPixelCount = 0;
	let saturatedGeometryPixelCount = 0;
	let geometryPixelCount = 0;
	const luminances = [];
	let geometryLuminanceSum = 0;
	let geometryPeakCode = 0;
	for (let pixel = 0; pixel < mask.length; pixel += 1) {
		const offset = pixel * 4;
		if (mask[pixel] !== 0) {
			const rawOffset = (pixel * 3 + 2) * 4;
			geometryPixelCount += 1;
			let changed = false;
			let saturated = false;
			for (let channel = 0; channel < 3; channel += 1) {
				const code = Math.round(clamp(1 - Math.exp(-Math.max(raw[rawOffset + channel] * gain, 0) * toneMapK), 0, 1) * 255);
				if (code !== rgba[offset + channel]) changed = true;
				if (code === 255) saturated = true;
				rgba[offset + channel] = code;
				difference[offset + channel] = code === parentRgba[offset + channel] ? 0 : (channel === 1 ? 220 : 40);
			}
			rgba[offset + 3] = 255; difference[offset + 3] = 255;
			if (changed) changedGeometryPixelCount += 1;
			if (saturated) saturatedGeometryPixelCount += 1;
			const luminance = 0.2126 * rgba[offset] + 0.7152 * rgba[offset + 1] + 0.0722 * rgba[offset + 2];
			luminances.push(luminance);
			geometryLuminanceSum += luminance;
			geometryPeakCode = Math.max(geometryPeakCode, rgba[offset], rgba[offset + 1], rgba[offset + 2]);
		} else {
			difference[offset + 3] = 255;
			if ([0, 1, 2].some((channel) => rgba[offset + channel] !== parentRgba[offset + channel])) changedNonGeometryPixelCount += 1;
		}
	}
	luminances.sort((a, b) => a - b);
	return {
		rgba,
		difference,
		stats: {
			changedGeometryPixelCount,
			changedNonGeometryPixelCount,
			geometryPixelCount,
			saturatedGeometryPixelCount,
			saturatedGeometryFraction: saturatedGeometryPixelCount / geometryPixelCount,
			geometryMedianCode: luminances[Math.floor(luminances.length / 2)],
			geometryMeanCode: geometryLuminanceSum / geometryPixelCount,
			geometryPeakCode,
		},
	};
}

function canvasFromRgba(rgba) {
	const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
	canvas.getContext('2d', {alpha: false}).putImageData(new ImageData(rgba, WIDTH, HEIGHT), 0, 0);
	return canvas;
}

function sheet(canvases, title, columns = 3) {
	const rows = Math.ceil(canvases.length / columns);
	const canvas = document.createElement('canvas'); canvas.width = WIDTH * columns; canvas.height = HEIGHT * rows + 58;
	const context = canvas.getContext('2d', {alpha: false}); context.fillStyle = '#07111f'; context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f5f7ff'; context.font = 'bold 24px sans-serif'; context.fillText(title, 18, 36);
	canvases.forEach((item, index) => context.drawImage(item, index % columns * WIDTH, 58 + Math.floor(index / columns) * HEIGHT));
	return canvas;
}

export async function runCr7IntegratedColorResetSequenceBrowser() {
	const configuration = await fetch('/browser/configuration.json').then((response) => response.json());
	const displayModel = new Cr4gSlopeLimitedPreToneExposureColorDisplayModel({curve: configuration.frozenSkyDisplay});
	const mask = await fetchVerified(configuration.inputs.geometryMask, 'CR7 geometry mask');
	const frames = [];
	const differences = [];
	const stats = [];
	const uploads = [];
	for (let index = 0; index < configuration.scenes.length; index += 1) {
		const scene = configuration.scenes[index];
		const parentBytes = await fetchVerified(scene.parentPng, `${scene.id} parent`);
		let frameBytes = parentBytes;
		let frameCanvas;
		if (scene.rawGeometry) {
			const [decoded, rawGeometry] = await Promise.all([decode(parentBytes), fetchVerified(scene.rawGeometry, `${scene.id} geometry`)]);
			const integrated = integrateGeometry(decoded.rgba, rawGeometry, mask, displayModel, scene.totalHorizontalIlluminanceLux);
			frameCanvas = canvasFromRgba(integrated.rgba);
			frameBytes = dataUrlBytes(frameCanvas.toDataURL('image/png'));
			differences.push(canvasFromRgba(integrated.difference));
			stats.push({sceneId: scene.id, composed: true, ...integrated.stats});
		} else {
			frameCanvas = (await decode(parentBytes)).canvas;
			stats.push({sceneId: scene.id, composed: false, exactParentReplay: true});
		}
		const outputPath = `${configuration.outputs.framePrefix}${scene.id}.png`;
		uploads.push(await upload(outputPath, frameBytes));
		frames.push(frameCanvas);
		await window.colorResetProgress(`frame-${index + 1}-complete`);
	}
	const contact = sheet(frames, 'CR7 integrated color-reset sequence', 3);
	const differenceSheet = sheet(differences, 'CR7 geometry-localized differences', 3);
	uploads.push(await upload(configuration.outputs.contactSheet, dataUrlBytes(contact.toDataURL('image/png'))));
	uploads.push(await upload(configuration.outputs.differenceSheet, dataUrlBytes(differenceSheet.toDataURL('image/png'))));
	return {schemaId: 'algorithm32-color-reset-cr7-integrated-sequence-browser-result-v1', renderComplete: true, uploadOrder: uploads.map(({path}) => path), uploads, stats};
}
