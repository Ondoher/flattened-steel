import {Cr4gSlopeLimitedPreToneExposureColorDisplayModel} from '../color/Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';
import {composeCr6cLinearRgb} from '../stellar/Cr6cOnePixelBrightnessCalibrationV2.js';
import {
	acceptViewPresentationFilterConfiguration,
	applySourceLinearViewPresentationFilters,
} from '../stellar/ViewPresentationFilterRegistry.js';
import {
	HUMAN_LOW_LIGHT_CHROMA_FILTER,
	HUMAN_LOW_LIGHT_CHROMA_FILTER_ID,
	combinedVisualMagnitude,
	humanLowLightLinearLuminance,
} from '../stellar/HumanLowLightChromaFilter.js';
import {
	HUMAN_MESOPIC_LUMINANCE_FILTER,
	HUMAN_MESOPIC_LUMINANCE_FILTER_ID,
	createNative15ScotopicLuminanceWeights,
} from '../stellar/HumanMesopicLuminanceFilter.js';
import {
	cr6hProjectCatalogDirection,
	createCr6hTransmittanceInterpolator,
} from '../stellar/Cr6hBrightest2000Appearance.js';

const FILTERS = new Map([
	[HUMAN_MESOPIC_LUMINANCE_FILTER_ID, HUMAN_MESOPIC_LUMINANCE_FILTER],
	[HUMAN_LOW_LIGHT_CHROMA_FILTER_ID, HUMAN_LOW_LIGHT_CHROMA_FILTER],
]);
const WIDTH = 640;
const HEIGHT = 400;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

async function sha256Hex(bytes) {
	const digest = await crypto.subtle.digest('SHA-256', bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
	return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

async function fetchVerified(record, label) {
	const response = await fetch(record.url);
	requireCondition(response.ok, `${label} fetch failed.`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	requireCondition(bytes.byteLength === record.byteLength, `${label} byte length changed.`);
	requireCondition(await sha256Hex(bytes) === record.sha256, `${label} SHA-256 changed.`);
	return bytes;
}

async function uploadBytes(path, bytes, contentType = 'image/png') {
	const response = await fetch(`/artifact/${path}`, {method: 'POST', headers: {'content-type': contentType}, body: bytes});
	requireCondition(response.ok, `CR6H upload failed for ${path}.`);
	return {path, byteLength: bytes.byteLength, sha256: await sha256Hex(bytes)};
}

function dataUrlBytes(dataUrl) {
	const binary = atob(dataUrl.slice(dataUrl.indexOf(';base64,') + 8));
	return Uint8Array.from(binary, (value) => value.charCodeAt(0));
}

function rgbaCanvas(rgba, width = WIDTH, height = HEIGHT) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false, colorSpace: 'srgb'});
	context.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
	return canvas;
}

async function pngCanvas(bytes) {
	const bitmap = await createImageBitmap(new Blob([bytes], {type: 'image/png'}), {colorSpaceConversion: 'none', premultiplyAlpha: 'none'});
	const canvas = document.createElement('canvas');
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	canvas.getContext('2d', {alpha: false, colorSpace: 'srgb'}).drawImage(bitmap, 0, 0);
	bitmap.close();
	return canvas;
}

function float32(bytes, expectedLength, label) {
	requireCondition(bytes.byteLength === expectedLength * 4, `${label} byte length changed.`);
	return new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

function median(values) {
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function physicalSkyMedian(sky, mask) {
	const values = [];
	for (let pixel = 0; pixel < mask.length; pixel += 1) if (mask[pixel] === 0) values.push(sky[pixel * 4 + 3]);
	return median(values);
}

function projectNative15(values, weights) {
	const rgb = [0, 0, 0];
	for (let index = 0; index < 15; index += 1) {
		rgb[0] += values[index] * weights.r[index];
		rgb[1] += values[index] * weights.g[index];
		rgb[2] += values[index] * weights.b[index];
	}
	return rgb;
}

function displayReplay(displayModel, sky, stars, illuminanceLux) {
	const gain = displayModel.displayGain({value: illuminanceLux, units: 'lux'});
	const toneMapK = displayModel.displayConstants.paperFigure1ToneMapK;
	const rgba = new Uint8ClampedArray(sky.length);
	for (let pixel = 0; pixel < sky.length / 4; pixel += 1) {
		const offset = pixel * 4;
		const linear = composeCr6cLinearRgb(sky.subarray(offset, offset + 3), stars.subarray(offset, offset + 3), 24);
		for (let channel = 0; channel < 3; channel += 1) {
			rgba[offset + channel] = Math.round(clamp(1 - Math.exp(-Math.max(linear[channel] * gain, 0) * toneMapK), 0, 1) * 255);
		}
		rgba[offset + 3] = 255;
	}
	return rgba;
}

function buildCandidateScene({configuration, scene, ledgerScene, roster, packets, sky, mask, weights, scotopicWeights, displayModel, interpolateTransmittance}) {
	const groups = new Map();
	for (let memberIndex = 0; memberIndex < roster.length; memberIndex += 1) {
		const member = roster[memberIndex];
		let projection;
		let transported;
		if (memberIndex < 500) {
			const authority = ledgerScene.members[memberIndex];
			requireCondition(authority.memberId === member.memberId, 'CR6H production prefix order changed.');
			projection = {
				insideViewport: authority.insideViewport,
				aboveLocalHorizon: authority.aboveLocalHorizon,
				projectedTopLeftPixel: authority.projectedTopLeftPixel,
				localEnu: authority.localDirectionEastNorthUp,
			};
			transported = authority.transportedNative15StellarValue;
		} else {
			projection = cr6hProjectCatalogDirection(member.direction, scene, configuration);
			if (projection.insideViewport) {
				const transmittance = interpolateTransmittance(projection.localEnu[2]);
				transported = packets[memberIndex].spectralIrradiance.map((value, channel) => value * transmittance[channel]);
			}
		}
		if (!projection.insideViewport || !projection.aboveLocalHorizon) continue;
		const [x, y] = projection.projectedTopLeftPixel;
		const pixel = y * WIDTH + x;
		if (mask[pixel] !== 0) continue;
		const group = groups.get(pixel) ?? {pixel, x, y, packet: new Array(15).fill(0), magnitudes: [], memberIndices: []};
		for (let channel = 0; channel < 15; channel += 1) group.packet[channel] += transported[channel];
		group.magnitudes.push(member.visualMagnitude);
		group.memberIndices.push(memberIndex);
		groups.set(pixel, group);
	}
	const stars = new Float32Array(WIDTH * HEIGHT * 4);
	const adaptationLuminanceCdM2 = physicalSkyMedian(sky, mask);
	const filterConfiguration = {schemaId: configuration.presentation.registryId, filters: configuration.presentation.filters};
	acceptViewPresentationFilterConfiguration(filterConfiguration, FILTERS);
	for (const group of groups.values()) {
		const sourceRgb = projectNative15(group.packet, weights);
		const effectiveVisualMagnitude = combinedVisualMagnitude(group.magnitudes);
		const filtered = applySourceLinearViewPresentationFilters(sourceRgb, {
			target: 'stellar',
			visualMagnitude: effectiveVisualMagnitude,
			photopicLuminance: humanLowLightLinearLuminance(sourceRgb),
			transportedNative15: group.packet,
			scotopicWeights,
			adaptationLuminanceCdM2,
		}, filterConfiguration, FILTERS);
		const offset = group.pixel * 4;
		for (let channel = 0; channel < 3; channel += 1) stars[offset + channel] = Math.fround(filtered[channel]);
		stars[offset + 3] = 1;
	}
	const finalRgba = displayReplay(displayModel, sky, stars, scene.totalHorizontalIlluminanceLux);
	const skyRgba = displayReplay(displayModel, sky, new Float32Array(stars.length), scene.totalHorizontalIlluminanceLux);
	let robustPixelCount = 0;
	let fourCodePixelCount = 0;
	let eightCodePixelCount = 0;
	let saturatedStellarPixelCount = 0;
	let exactWhiteStellarPixelCount = 0;
	let addedRobustPixelCount = 0;
	let peakCode = 0;
	for (const group of groups.values()) {
		const offset = group.pixel * 4;
		const delta = [0, 1, 2].map((channel) => Math.abs(finalRgba[offset + channel] - skyRgba[offset + channel]));
		const maximum = Math.max(...delta);
		peakCode = Math.max(peakCode, maximum);
		if (maximum >= 2) {
			robustPixelCount += 1;
			if (group.memberIndices.some((index) => index >= 500)) addedRobustPixelCount += 1;
		}
		if (maximum >= 4) fourCodePixelCount += 1;
		if (maximum >= 8) eightCodePixelCount += 1;
		if ([0, 1, 2].some((channel) => finalRgba[offset + channel] === 255)) saturatedStellarPixelCount += 1;
		if ([0, 1, 2].every((channel) => finalRgba[offset + channel] === 255)) exactWhiteStellarPixelCount += 1;
	}
	return {
		finalRgba,
		stats: {
			sceneId: scene.id,
			adaptationLuminanceCdM2,
			occupiedPixelCount: groups.size,
			robustPixelCount,
			fourCodePixelCount,
			eightCodePixelCount,
			addedRobustPixelCount,
			peakCode,
			saturatedStellarPixelCount,
			exactWhiteStellarPixelCount,
			onePixelFootprint: true,
		},
	};
}

function cadenceCanvas(canvases, title) {
	const canvas = document.createElement('canvas');
	canvas.width = WIDTH * 4;
	canvas.height = HEIGHT * 2 + 54;
	const context = canvas.getContext('2d', {alpha: false});
	context.fillStyle = '#07111f'; context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f5f7ff'; context.font = 'bold 24px sans-serif'; context.fillText(title, 18, 34);
	canvases.forEach((item, index) => context.drawImage(item, index % 4 * WIDTH, 54 + Math.floor(index / 4) * HEIGHT));
	return canvas;
}

function matrixCanvas(control, candidate) {
	const canvas = document.createElement('canvas');
	canvas.width = WIDTH * 4;
	canvas.height = HEIGHT * 4 + 70;
	const context = canvas.getContext('2d', {alpha: false});
	context.fillStyle = '#07111f'; context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f5f7ff'; context.font = 'bold 25px sans-serif'; context.fillText('CR6H 500 control (top) and brightest-2,000 candidate (bottom)', 18, 38);
	control.forEach((item, index) => context.drawImage(item, index % 4 * WIDTH, 70 + Math.floor(index / 4) * HEIGHT));
	candidate.forEach((item, index) => context.drawImage(item, index % 4 * WIDTH, 70 + (2 + Math.floor(index / 4)) * HEIGHT));
	return canvas;
}

function countPlot(stats) {
	const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 650;
	const context = canvas.getContext('2d', {alpha: false});
	context.fillStyle = '#07111f'; context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f5f7ff'; context.font = 'bold 28px sans-serif'; context.fillText('CR6H brightest-2,000 visible one-pixel counts', 34, 45);
	const maximum = Math.max(...stats.map(({occupiedPixelCount}) => occupiedPixelCount));
	stats.forEach((record, index) => {
		const x = 80 + index * 135;
		const occupiedHeight = record.occupiedPixelCount / maximum * 430;
		const robustHeight = record.robustPixelCount / maximum * 430;
		context.fillStyle = '#294b70'; context.fillRect(x, 550 - occupiedHeight, 82, occupiedHeight);
		context.fillStyle = '#62e6b5'; context.fillRect(x + 20, 550 - robustHeight, 42, robustHeight);
		context.fillStyle = '#c5d6ef'; context.font = '13px sans-serif'; context.fillText(record.sceneId.replace('sunset-', ''), x - 8, 580);
		context.fillText(`${record.robustPixelCount}/${record.occupiedPixelCount}`, x + 8, 530 - occupiedHeight);
	});
	return canvas;
}

export async function runCr6hBrightest2000AppearanceBrowser() {
	const configuration = await fetch('/browser/configuration.json').then((response) => response.json());
	const [ledgerBytes, rosterBytes, packetsBytes, cieBytes] = await Promise.all([
		fetchVerified(configuration.inputs.ledger, 'CR6H ledger'),
		fetchVerified(configuration.inputs.roster, 'CR6H roster'),
		fetchVerified(configuration.inputs.packets, 'CR6H packets'),
		fetchVerified(configuration.inputs.cie, 'CR6H CIE data'),
	]);
	const ledger = JSON.parse(new TextDecoder().decode(ledgerBytes));
	const roster = JSON.parse(new TextDecoder().decode(rosterBytes)).members;
	const packets = JSON.parse(new TextDecoder().decode(packetsBytes)).packets;
	requireCondition(roster.length === 2000 && packets.length === 2000, 'CR6H complete roster changed.');
	const displayModel = new Cr4gSlopeLimitedPreToneExposureColorDisplayModel({curve: configuration.frozenSkyDisplay});
	const weights = displayModel._displayLinearSrgbByChannel;
	const scotopicWeights = createNative15ScotopicLuminanceWeights(new TextDecoder().decode(cieBytes));
	const interpolateTransmittance = createCr6hTransmittanceInterpolator(ledger.scenes);
	const controls = [];
	const candidates = [];
	const stats = [];
	const uploads = [];
	for (let sceneIndex = 0; sceneIndex < configuration.scenes.length; sceneIndex += 1) {
		const scene = configuration.scenes[sceneIndex];
		const ledgerScene = ledger.scenes[sceneIndex];
		requireCondition(ledgerScene.sceneId === scene.id, 'CR6H scene order changed.');
		const [skyBytes, maskBytes, controlBytes] = await Promise.all([
			fetchVerified(scene.skyField, `${scene.id} sky`),
			fetchVerified(scene.sceneHitMask, `${scene.id} mask`),
			fetchVerified(scene.controlPng, `${scene.id} control`),
		]);
		const sky = float32(skyBytes, WIDTH * HEIGHT * 4, `${scene.id} sky`);
		const mask = maskBytes;
		const candidate = buildCandidateScene({configuration, scene, ledgerScene, roster, packets, sky, mask, weights, scotopicWeights, displayModel, interpolateTransmittance});
		const controlPath = `${configuration.outputs.controlPrefix}${scene.id}.png`;
		const candidatePath = `${configuration.outputs.candidatePrefix}${scene.id}.png`;
		uploads.push(await uploadBytes(controlPath, controlBytes));
		const candidateCanvas = rgbaCanvas(candidate.finalRgba);
		uploads.push(await uploadBytes(candidatePath, dataUrlBytes(candidateCanvas.toDataURL('image/png'))));
		controls.push(await pngCanvas(controlBytes));
		candidates.push(candidateCanvas);
		stats.push(candidate.stats);
		await window.colorResetProgress(`scene-${sceneIndex + 1}-complete`);
	}
	const figures = [
		[configuration.outputs.controlCadence, cadenceCanvas(controls, 'CR6H accepted 500-star half-mesopic control')],
		[configuration.outputs.candidateCadence, cadenceCanvas(candidates, 'CR6H brightest-2,000 half-mesopic candidate')],
		[configuration.outputs.decisionMatrix, matrixCanvas(controls, candidates)],
		[configuration.outputs.countPlot, countPlot(stats)],
	];
	for (const [path, canvas] of figures) uploads.push(await uploadBytes(path, dataUrlBytes(canvas.toDataURL('image/png'))));
	return {
		schemaId: 'algorithm32-color-reset-cr6h-brightest-2000-appearance-browser-result-v1',
		renderComplete: true,
		allDeclaredImagesUploaded: true,
		uploadOrder: uploads.map(({path}) => path),
		uploads,
		stats,
		memberCount: roster.length,
		transportApproximation: configuration.transportApproximation,
	};
}
