import * as THREE from 'three';

import {createDistantSunSceneState} from '../controls/production-v1/src/flat32/DistantSunSceneState.js';
import {
	CR3_NATIVE15_LINEAR_PROJECTION_ID,
	CR3_NEUTRAL_SURFACE_PRESENTATION_CONTRACT,
	createCr3NeutralSurfaceColorModel,
	projectCr3Native15ValuesToLinearSrgb,
} from '../color/Cr3NeutralSurfacePresentation.js';
import {
	CR3_NATIVE15_BASIS_HASH,
	CR3_NEUTRAL_LAMBERTIAN_CONTRACT,
	Cr3NeutralLambertianLighting,
	decodeCr2ReceiverDiffuseRadianceField,
	irradiancePacketFromCr2Record,
} from '../lighting/Cr3NeutralLambertianLighting.js';

const MODE_IDS = Object.freeze(['direct-only', 'diffuse-only', 'combined']);
const MODE_RESPONSE_KEYS = Object.freeze({
	'direct-only': 'direct',
	'diffuse-only': 'diffuse',
	combined: 'combined',
});
const MODE_LABELS = Object.freeze({
	'direct-only': 'Direct only',
	'diffuse-only': 'Diffuse sky only',
	combined: 'Direct + diffuse',
});
const CR2_PARENT_ROUTE = '/cr2/';
const CR1_PARENT_ROUTE = '/cr1/';
const RAW_SHADER_ID = 'color-reset-cr3-neutral-geometry-rgby-raw-shader-v1';

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
	return Math.min(maximum, Math.max(minimum, value));
}

function maximumDifference(left, right) {
	requireCondition(left.length === right.length, 'CR3 comparison arrays must have equal length.');
	let maximumAbsoluteDifference = 0;
	let maximumRelativeDifference = 0;
	let differingValueCount = 0;
	for (let index = 0; index < left.length; index += 1) {
		const absolute = Math.abs(left[index] - right[index]);
		const relative = absolute / Math.max(Math.abs(left[index]), Math.abs(right[index]), 1e-30);
		maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, absolute);
		maximumRelativeDifference = Math.max(maximumRelativeDifference, relative);
		if (absolute !== 0) differingValueCount += 1;
	}
	return {
		exact: differingValueCount === 0,
		maximumAbsoluteDifference,
		maximumRelativeDifference,
		differingValueCount,
	};
}

function dataUrlBytes(dataUrl) {
	const match = /^data:image\/png;base64,(.+)$/u.exec(dataUrl);
	if (!match) throw new Error('CR3 image did not produce a PNG data URL.');
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
		throw new Error('CR3 artifact upload failed for ' + artifactPath + ': HTTP ' + response.status + '.');
	}
	return bytes.byteLength;
}

async function uploadPng(artifactPath, dataUrl) {
	return uploadBytes(artifactPath, dataUrlBytes(dataUrl), 'image/png');
}

async function sha256(bytes) {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
	);
	return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

async function fetchVerifiedBytes(url, expectedSha256, expectedByteLength, label) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(label + ' fetch failed: HTTP ' + response.status + '.');
	const bytes = new Uint8Array(await response.arrayBuffer());
	requireCondition(
		expectedByteLength === undefined || bytes.byteLength === expectedByteLength,
		label + ' byte length changed.',
	);
	const actualSha256 = await sha256(bytes);
	requireCondition(actualSha256 === expectedSha256, label + ' SHA-256 changed.');
	return {bytes, sha256: actualSha256};
}

async function fetchVerifiedJson(url, expectedSha256, label) {
	const fetched = await fetchVerifiedBytes(url, expectedSha256, undefined, label);
	return {
		...fetched,
		value: JSON.parse(new TextDecoder().decode(fetched.bytes)),
	};
}

function loadImageFromBytes(bytes) {
	return new Promise((resolvePromise, reject) => {
		const url = URL.createObjectURL(new Blob([bytes], {type: 'image/png'}));
		const image = new Image();
		image.onload = () => {
			URL.revokeObjectURL(url);
			resolvePromise(image);
		};
		image.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('CR3 could not decode a parent PNG.'));
		};
		image.src = url;
	});
}

async function decodeBackplate(bytes, width, height) {
	const image = await loadImageFromBytes(bytes);
	requireCondition(image.naturalWidth === width && image.naturalHeight === height, 'CR3 backplate dimensions changed.');
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {willReadFrequently: true});
	requireCondition(context, 'CR3 backplate requires a 2D canvas context.');
	context.drawImage(image, 0, 0);
	const pixels = new Uint8ClampedArray(context.getImageData(0, 0, width, height).data);
	canvas.remove();
	return pixels;
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

function invertMatrix3(matrix) {
	const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
	const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
	requireCondition(Number.isFinite(determinant) && Math.abs(determinant) > Number.EPSILON, 'CR3 Color matrix is not invertible.');
	return [
		[(e * i - f * h) / determinant, (c * h - b * i) / determinant, (b * f - c * e) / determinant],
		[(f * g - d * i) / determinant, (a * i - c * g) / determinant, (c * d - a * f) / determinant],
		[(d * h - e * g) / determinant, (b * g - a * h) / determinant, (a * e - b * d) / determinant],
	];
}

function dot3(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function normalize3(value) {
	const length = Math.hypot(value[0], value[1], value[2]);
	requireCondition(length > 0, 'CR3 direction must be nonzero.');
	return [value[0] / length, value[1] / length, value[2] / length];
}

function sceneToModelBasisFromGeometry(geometry) {
	const sceneOfModelX = geometry.expressCelestialDirectionInScene([1, 0, 0]);
	const sceneOfModelY = geometry.expressCelestialDirectionInScene([0, 1, 0]);
	const sceneOfModelZ = geometry.expressCelestialDirectionInScene([0, 0, 1]);
	return Object.freeze({
		x: Object.freeze([sceneOfModelX[0], sceneOfModelY[0], sceneOfModelZ[0]]),
		y: Object.freeze([sceneOfModelX[1], sceneOfModelY[1], sceneOfModelZ[1]]),
		z: Object.freeze([sceneOfModelX[2], sceneOfModelY[2], sceneOfModelZ[2]]),
		derivation: 'transpose the orthonormal model-to-observer-local scene transform returned by geometry.expressCelestialDirectionInScene for the three model unit axes',
	});
}

function drainWebglErrors(context) {
	const errors = [];
	for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) errors.push(error);
	return errors;
}

function flipRgbaRows(values, width, height) {
	const result = new values.constructor(values.length);
	const rowLength = width * 4;
	for (let y = 0; y < height; y += 1) {
		const sourceOffset = (height - 1 - y) * rowLength;
		result.set(values.subarray(sourceOffset, sourceOffset + rowLength), y * rowLength);
	}
	return result;
}

function createRawResponseMaterial() {
	return new THREE.RawShaderMaterial({
		name: RAW_SHADER_ID,
		glslVersion: THREE.GLSL3,
		vertexShader: `precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
in vec3 position;
in vec4 cr3Response;
out vec4 vResponse;
void main() {
	vResponse = cr3Response;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
		fragmentShader: `precision highp float;
in vec4 vResponse;
layout(location = 0) out vec4 outColor;
void main() {
	outColor = vResponse;
}`,
		depthTest: true,
		depthWrite: true,
		side: THREE.FrontSide,
		toneMapped: false,
	});
}

function createMaskMaterial(code) {
	return new THREE.RawShaderMaterial({
		name: 'color-reset-cr3-object-mask-' + code,
		glslVersion: THREE.GLSL3,
		vertexShader: `precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
in vec3 position;
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
		fragmentShader: `precision highp float;
layout(location = 0) out vec4 outColor;
void main() {
	outColor = vec4(${(code / 255).toPrecision(17)}, 0.0, 0.0, 1.0);
}`,
		depthTest: true,
		depthWrite: true,
		side: THREE.FrontSide,
		toneMapped: false,
	});
}

function createPlaneGeometry({right, forward, scale, specification}) {
	const halfWidth = specification.widthMeters / scale / 2;
	const near = specification.nearEdgeForwardMeters / scale;
	const far = near + specification.depthMeters / scale;
	const y = specification.centerHeightMeters / scale;
	const point = (rightScale, forwardScale) => [
		right.x * rightScale + forward.x * forwardScale,
		y,
		right.z * rightScale + forward.z * forwardScale,
	];
	const positions = [
		...point(-halfWidth, near),
		...point(halfWidth, near),
		...point(-halfWidth, far),
		...point(halfWidth, far),
	];
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute('normal', new THREE.Float32BufferAttribute([
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
	], 3));
	geometry.setIndex([0, 1, 2, 2, 1, 3]);
	geometry.computeBoundingSphere();
	return geometry;
}

function createGeometryBundle(configuration, renderer) {
	const width = configuration.camera.widthPixels;
	const height = configuration.camera.heightPixels;
	const scale = configuration.camera.sceneScaleMetersPerSceneUnit;
	const view = cameraDirection(configuration.camera);
	const forward = new THREE.Vector3(view.x, 0, view.z).normalize();
	const up = new THREE.Vector3(0, 1, 0);
	const right = new THREE.Vector3().crossVectors(forward, up).normalize();
	const camera = new THREE.PerspectiveCamera(
		configuration.camera.verticalFieldOfViewDegrees,
		width / height,
		configuration.camera.nearSceneUnits,
		configuration.camera.farSceneUnits,
	);
	camera.position.set(0, configuration.observer.heightMeters / scale, 0);
	camera.lookAt(camera.position.clone().add(view));
	camera.updateMatrixWorld(true);

	const planeGeometry = createPlaneGeometry({
		right,
		forward,
		scale,
		specification: configuration.neutralGeometry.plane,
	});
	const sphereSpecification = configuration.neutralGeometry.sphere;
	const sphereGeometry = new THREE.SphereGeometry(
		sphereSpecification.radiusMeters / scale,
		32,
		16,
	);
	const rawMaterial = createRawResponseMaterial();
	const plane = new THREE.Mesh(planeGeometry, rawMaterial);
	plane.name = configuration.neutralGeometry.plane.id;
	const sphere = new THREE.Mesh(sphereGeometry, rawMaterial);
	sphere.name = sphereSpecification.id;
	sphere.position.set(
		forward.x * sphereSpecification.centerForwardMeters / scale + right.x * sphereSpecification.centerRightMeters / scale,
		sphereSpecification.centerHeightMeters / scale,
		forward.z * sphereSpecification.centerForwardMeters / scale + right.z * sphereSpecification.centerRightMeters / scale,
	);
	const scene = new THREE.Scene();
	scene.background = null;
	scene.add(plane, sphere);
	const rawTarget = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: true,
		stencilBuffer: false,
	});
	rawTarget.texture.colorSpace = THREE.NoColorSpace;
	const maskTarget = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.UnsignedByteType,
		depthBuffer: true,
		stencilBuffer: false,
	});
	maskTarget.texture.colorSpace = THREE.NoColorSpace;
	return {
		width,
		height,
		scale,
		view,
		forward,
		right,
		camera,
		scene,
		plane,
		sphere,
		rawMaterial,
		rawTarget,
		maskTarget,
		maskMaterials: {
			plane: createMaskMaterial(1),
			sphere: createMaskMaterial(2),
		},
		renderer,
	};
}

function renderGeometryMask(bundle) {
	const {renderer, scene, camera, plane, sphere, maskTarget, width, height} = bundle;
	const previousPlaneMaterial = plane.material;
	const previousSphereMaterial = sphere.material;
	plane.material = bundle.maskMaterials.plane;
	sphere.material = bundle.maskMaterials.sphere;
	renderer.setRenderTarget(maskTarget);
	renderer.setClearColor(0x000000, 0);
	renderer.clear(true, true, true);
	renderer.render(scene, camera);
	const bottomUp = new Uint8Array(width * height * 4);
	renderer.readRenderTargetPixels(maskTarget, 0, 0, width, height, bottomUp);
	const topDown = flipRgbaRows(bottomUp, width, height);
	const mask = new Uint8Array(width * height);
	const counts = {backplate: 0, plane: 0, sphere: 0, invalid: 0};
	for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
		const code = topDown[pixelIndex * 4];
		mask[pixelIndex] = code;
		if (code === 0) counts.backplate += 1;
		else if (code === 1) counts.plane += 1;
		else if (code === 2) counts.sphere += 1;
		else counts.invalid += 1;
	}
	plane.material = previousPlaneMaterial;
	sphere.material = previousSphereMaterial;
	renderer.setRenderTarget(null);
	return {mask, counts};
}

function setResponseAttributes(bundle, responseArrays, mode) {
	for (const kind of ['plane', 'sphere']) {
		const geometry = bundle[kind].geometry;
		geometry.setAttribute('cr3Response', new THREE.BufferAttribute(responseArrays[mode][kind], 4));
		geometry.attributes.cr3Response.needsUpdate = true;
	}
}

function renderRawResponse(bundle, responseArrays, mode) {
	const {renderer, scene, camera, plane, sphere, rawMaterial, rawTarget, width, height} = bundle;
	setResponseAttributes(bundle, responseArrays, mode);
	plane.material = rawMaterial;
	sphere.material = rawMaterial;
	renderer.setRenderTarget(rawTarget);
	renderer.setClearColor(0x000000, 0);
	renderer.clear(true, true, true);
	renderer.render(scene, camera);
	const bottomUp = new Float32Array(width * height * 4);
	renderer.readRenderTargetPixels(rawTarget, 0, 0, width, height, bottomUp);
	renderer.setRenderTarget(null);
	return flipRgbaRows(bottomUp, width, height);
}

function responseArraysForGeometry(bundle, lighting, luminanceWeights) {
	const arrays = Object.fromEntries(MODE_IDS.map((mode) => [mode, {
		plane: new Float32Array(bundle.plane.geometry.attributes.position.count * 4),
		sphere: new Float32Array(bundle.sphere.geometry.attributes.position.count * 4),
	}]));
	let binary64MaximumAbsoluteDifference = 0;
	let binary64MaximumRelativeDifference = 0;
	let spectralMaximumAbsoluteDifference = 0;
	let spectralMaximumRelativeDifference = 0;
	let spectralDifferingValueCount = 0;
	let evaluatedVertexCount = 0;
	const fill = (kind) => {
		const normalAttribute = bundle[kind].geometry.attributes.normal;
		for (let vertexIndex = 0; vertexIndex < normalAttribute.count; vertexIndex += 1) {
			const normal = [
				normalAttribute.getX(vertexIndex),
				normalAttribute.getY(vertexIndex),
				normalAttribute.getZ(vertexIndex),
			];
			const response = lighting.evaluateNative15ResponseValues(normal);
			evaluatedVertexCount += 1;
			spectralMaximumAbsoluteDifference = Math.max(
				spectralMaximumAbsoluteDifference,
				response.combinedDifference.maximumAbsoluteDifference,
			);
			spectralMaximumRelativeDifference = Math.max(
				spectralMaximumRelativeDifference,
				response.combinedDifference.maximumRelativeDifference,
			);
			spectralDifferingValueCount += response.combinedDifference.differingValueCount;
			const projected = {};
			for (const mode of MODE_IDS) {
				const rgb = projectCr3Native15ValuesToLinearSrgb(
					response.outgoingRadianceValues[MODE_RESPONSE_KEYS[mode]],
				);
				projected[mode] = rgb;
				const offset = vertexIndex * 4;
				arrays[mode][kind][offset] = rgb[0];
				arrays[mode][kind][offset + 1] = rgb[1];
				arrays[mode][kind][offset + 2] = rgb[2];
				arrays[mode][kind][offset + 3] = dot3(luminanceWeights, rgb);
			}
			const projectedSum = projected['direct-only'].map(
				(value, index) => value + projected['diffuse-only'][index],
			);
			const projectedDifference = maximumDifference(projected.combined, projectedSum);
			binary64MaximumAbsoluteDifference = Math.max(
				binary64MaximumAbsoluteDifference,
				projectedDifference.maximumAbsoluteDifference,
			);
			binary64MaximumRelativeDifference = Math.max(
				binary64MaximumRelativeDifference,
				projectedDifference.maximumRelativeDifference,
			);
		}
	};
	fill('plane');
	fill('sphere');
	return {
		arrays,
		spectral: {
			maximumAbsoluteDifference: spectralMaximumAbsoluteDifference,
			maximumRelativeDifference: spectralMaximumRelativeDifference,
			differingValueCount: spectralDifferingValueCount,
			evaluatedVertexCount,
			exact: spectralDifferingValueCount === 0,
		},
		binary64: {
			maximumAbsoluteDifference: binary64MaximumAbsoluteDifference,
			maximumRelativeDifference: binary64MaximumRelativeDifference,
			exact: binary64MaximumAbsoluteDifference === 0,
		},
	};
}

function analyzeFloat32Fields(fields, mask) {
	const direct = fields['direct-only'];
	const diffuse = fields['diffuse-only'];
	const combined = fields.combined;
	let maximumAbsoluteDifference = 0;
	let maximumRelativeDifference = 0;
	let differingValueCount = 0;
	const modes = Object.fromEntries(MODE_IDS.map((mode) => [mode, {
		nonzeroGeometryPixelCount: 0,
		negativeGeometryChannelCount: 0,
		maximumPhotopicLuminanceCdPerSquareMeter: 0,
		meanPhotopicLuminanceCdPerSquareMeter: 0,
		maximumAbsoluteLinearChannel: 0,
	}]));
	let geometryPixelCount = 0;
	for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
		if (mask[pixelIndex] === 0) continue;
		geometryPixelCount += 1;
		const offset = pixelIndex * 4;
		for (const mode of MODE_IDS) {
			const field = fields[mode];
			const record = modes[mode];
			let nonzero = false;
			for (let channel = 0; channel < 3; channel += 1) {
				const value = field[offset + channel];
				nonzero ||= value !== 0;
				if (value < 0) record.negativeGeometryChannelCount += 1;
				record.maximumAbsoluteLinearChannel = Math.max(record.maximumAbsoluteLinearChannel, Math.abs(value));
			}
			if (nonzero) record.nonzeroGeometryPixelCount += 1;
			const luminance = field[offset + 3];
			record.maximumPhotopicLuminanceCdPerSquareMeter = Math.max(
				record.maximumPhotopicLuminanceCdPerSquareMeter,
				luminance,
			);
			record.meanPhotopicLuminanceCdPerSquareMeter += luminance;
		}
		for (let channel = 0; channel < 4; channel += 1) {
			const expected = direct[offset + channel] + diffuse[offset + channel];
			const actual = combined[offset + channel];
			const absolute = Math.abs(actual - expected);
			const relative = absolute / Math.max(Math.abs(actual), Math.abs(expected), 1e-30);
			maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, absolute);
			maximumRelativeDifference = Math.max(maximumRelativeDifference, relative);
			if (absolute !== 0) differingValueCount += 1;
		}
	}
	for (const record of Object.values(modes)) {
		record.meanPhotopicLuminanceCdPerSquareMeter /= Math.max(1, geometryPixelCount);
		record.finite = [
			record.maximumPhotopicLuminanceCdPerSquareMeter,
			record.meanPhotopicLuminanceCdPerSquareMeter,
			record.maximumAbsoluteLinearChannel,
		].every(Number.isFinite);
		record.pixelCount = geometryPixelCount;
		record.maximumAbsoluteValue = record.maximumAbsoluteLinearChannel;
	}
	return {
		geometryPixelCount,
		modes,
		combinedDifference: {
			exact: differingValueCount === 0,
			maximumAbsoluteDifference,
			maximumRelativeDifference,
			differingValueCount,
		},
	};
}

function modeArtifactPath(configuration, mode, sceneId) {
	const expected = `captures/cr3-${mode}-${sceneId}.png`;
	requireCondition(configuration.outputs.individualFrames.includes(expected), 'CR3 fixture does not declare ' + expected + '.');
	return expected;
}

function formatNumber(value) {
	if (!Number.isFinite(value)) return 'nonfinite';
	if (value === 0) return '0';
	if (Math.abs(value) >= 1000 || Math.abs(value) < 0.01) return value.toExponential(3);
	return value.toFixed(3);
}

function makePrimaryPanel({configuration, scene, mode, backplate, mask, field, colorModel}) {
	const width = configuration.camera.widthPixels;
	const contentHeight = configuration.camera.heightPixels;
	const headerHeight = configuration.presentation.panel.headerHeightPixels;
	const content = new Uint8ClampedArray(backplate);
	let outsideMaskDifferingByteCount = 0;
	let outsideMaskMaximumCodeDifference = 0;
	let nonblackGeometryPixelCount = 0;
	let maximumGeometryCode = 0;
	for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
		const byteOffset = pixelIndex * 4;
		if (mask[pixelIndex] === 0) continue;
		const display = colorModel.linearSrgbToDisplayRgb([
			field[byteOffset],
			field[byteOffset + 1],
			field[byteOffset + 2],
		]);
		let nonblack = false;
		for (let channel = 0; channel < 3; channel += 1) {
			const code = Math.round(clamp(display[channel], 0, 1) * 255);
			content[byteOffset + channel] = code;
			maximumGeometryCode = Math.max(maximumGeometryCode, code);
			nonblack ||= code !== 0;
		}
		content[byteOffset + 3] = 255;
		if (nonblack) nonblackGeometryPixelCount += 1;
	}
	for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
		if (mask[pixelIndex] !== 0) continue;
		const offset = pixelIndex * 4;
		for (let channel = 0; channel < 4; channel += 1) {
			const difference = Math.abs(content[offset + channel] - backplate[offset + channel]);
			if (difference !== 0) outsideMaskDifferingByteCount += 1;
			outsideMaskMaximumCodeDifference = Math.max(outsideMaskMaximumCodeDifference, difference);
		}
	}
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = contentHeight + headerHeight;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR3 panel requires a 2D canvas context.');
	context.fillStyle = '#10141c';
	context.fillRect(0, 0, width, headerHeight);
	context.fillStyle = '#f4f7fb';
	context.font = 'bold 14px sans-serif';
	context.fillText(scene.label + ' — ' + MODE_LABELS[mode], 12, 16);
	context.fillStyle = '#b9c6d8';
	context.font = '11px monospace';
	context.fillText(
		`Z ${scene.solarZenithDegrees.toFixed(3)}°  direct-h ${formatNumber(scene.directHorizontalLux)} lux  diffuse-h ${formatNumber(scene.diffuseHorizontalLux)} lux  total-h ${formatNumber(scene.totalHorizontalLux)} lux`,
		12,
		32,
	);
	context.putImageData(new ImageData(content, width, contentHeight), 0, headerHeight);
	return {
		canvas,
		dataUrl: canvas.toDataURL('image/png'),
		width,
		height: canvas.height,
		contentPixels: content,
		summary: {
			finite: Number.isFinite(maximumGeometryCode),
			nonblackGeometryPixelCount,
			maximumGeometryCode,
			geometryQuantizedBlack: nonblackGeometryPixelCount === 0,
		},
		skyReplay: {
			passed: outsideMaskDifferingByteCount === 0,
			maximumOutsideMaskCodeDifference: outsideMaskMaximumCodeDifference,
			outsideMaskDifferingByteCount,
			outsideMaskMaximumCodeDifference,
			exact: outsideMaskDifferingByteCount === 0,
		},
	};
}

function rendererLinearToDisplayChannel(value) {
	const checked = clamp(value, 0, 1);
	return checked <= 0.0031308 ? checked * 12.92 : 1.055 * checked ** (1 / 2.4) - 0.055;
}

function makeFixedScalePanel(configuration, scene, mode, field, mask) {
	const width = configuration.camera.widthPixels;
	const contentHeight = configuration.camera.heightPixels;
	const headerHeight = configuration.presentation.panel.headerHeightPixels;
	const pixels = new Uint8ClampedArray(width * contentHeight * 4);
	const diagnostic = configuration.presentation.fixedScaleDiagnostic;
	let negativeChannelCount = 0;
	let jointPeakScalePixelCount = 0;
	for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
		const offset = pixelIndex * 4;
		pixels[offset + 3] = 255;
		if (mask[pixelIndex] === 0) {
			pixels[offset] = 5;
			pixels[offset + 1] = 7;
			pixels[offset + 2] = 10;
			continue;
		}
		const luminance = field[offset + 3];
		if (!(luminance > 0)) continue;
		const logValue = Math.log10(Math.max(luminance, 10 ** diagnostic.minimumLog10Luminance));
		const target = clamp(
			(logValue - diagnostic.minimumLog10Luminance) /
				(diagnostic.maximumLog10Luminance - diagnostic.minimumLog10Luminance),
			0,
			1,
		);
		let rgb = [field[offset], field[offset + 1], field[offset + 2]].map((value) => value * target / luminance);
		negativeChannelCount += rgb.filter((value) => value < 0).length;
		rgb = rgb.map((value) => Math.max(0, value));
		const peak = Math.max(...rgb);
		if (peak > 1) {
			rgb = rgb.map((value) => value / peak);
			jointPeakScalePixelCount += 1;
		}
		for (let channel = 0; channel < 3; channel += 1) {
			pixels[offset + channel] = Math.round(rendererLinearToDisplayChannel(rgb[channel]) * 255);
		}
	}
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = contentHeight + headerHeight;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR3 fixed-scale panel requires a 2D context.');
	context.fillStyle = '#10141c';
	context.fillRect(0, 0, width, headerHeight);
	context.fillStyle = '#f4f7fb';
	context.font = 'bold 14px sans-serif';
	context.fillText(scene.label + ' — ' + MODE_LABELS[mode], 12, 16);
	context.fillStyle = '#b9c6d8';
	context.font = '11px monospace';
	context.fillText(
		`fixed log10 Y [${diagnostic.minimumLog10Luminance}, ${diagnostic.maximumLog10Luminance}] cd m^-2; no scene/mode normalization`,
		12,
		32,
	);
	context.putImageData(new ImageData(pixels, width, contentHeight), 0, headerHeight);
	return {canvas, negativeChannelCount, jointPeakScalePixelCount};
}

function makeSheet({title, subtitle, panels, sceneOrder, modeOrder, configuration}) {
	const panelWidth = configuration.presentation.panel.widthPixels;
	const panelHeight = configuration.presentation.panel.heightPixels;
	const titleHeight = configuration.presentation.contactSheet.titleHeightPixels;
	const canvas = document.createElement('canvas');
	canvas.width = panelWidth * sceneOrder.length;
	canvas.height = titleHeight + panelHeight * modeOrder.length;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR3 sheet requires a 2D canvas context.');
	context.fillStyle = '#080b10';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#ffffff';
	context.font = 'bold 24px sans-serif';
	context.fillText(title, 18, 28);
	context.fillStyle = '#aebbd0';
	context.font = '13px sans-serif';
	context.fillText(subtitle, 18, 50);
	for (let row = 0; row < modeOrder.length; row += 1) {
		for (let column = 0; column < sceneOrder.length; column += 1) {
			const key = modeOrder[row] + ':' + sceneOrder[column];
			const panel = panels.get(key);
			requireCondition(panel, 'CR3 sheet is missing panel ' + key + '.');
			context.drawImage(panel, column * panelWidth, titleHeight + row * panelHeight);
		}
	}
	return {canvas, dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height};
}

function drawSpectralCurve(context, values, rectangle, color, minimumLog10, maximumLog10) {
	context.strokeStyle = color;
	context.lineWidth = 2;
	context.beginPath();
	for (let index = 0; index < values.length; index += 1) {
		const logValue = Math.log10(Math.max(values[index], 10 ** minimumLog10));
		const fraction = clamp((logValue - minimumLog10) / (maximumLog10 - minimumLog10), 0, 1);
		const x = rectangle.x + index / Math.max(1, values.length - 1) * rectangle.width;
		const y = rectangle.y + rectangle.height * (1 - fraction);
		if (index === 0) context.moveTo(x, y);
		else context.lineTo(x, y);
	}
	context.stroke();
}

function makeAdditivityFigure(sceneRecords) {
	const width = 1800;
	const height = 1080;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR3 additivity figure requires a 2D context.');
	context.fillStyle = '#090d13';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#ffffff';
	context.font = 'bold 25px sans-serif';
	context.fillText('CR3 linear additivity and Native15 neutral-surface probes', 24, 34);
	context.fillStyle = '#aebbd0';
	context.font = '13px sans-serif';
	context.fillText('All curves use one fixed log10 outgoing-radiance range [-12, 4]; additivity is evaluated before nonlinear display.', 24, 57);
	const rowHeight = 245;
	for (let sceneIndex = 0; sceneIndex < sceneRecords.length; sceneIndex += 1) {
		const scene = sceneRecords[sceneIndex];
		const y = 78 + sceneIndex * rowHeight;
		context.fillStyle = sceneIndex % 2 === 0 ? '#101722' : '#0d141d';
		context.fillRect(18, y, width - 36, rowHeight - 12);
		context.fillStyle = '#ffffff';
		context.font = 'bold 18px sans-serif';
		context.fillText(scene.label, 36, y + 28);
		context.fillStyle = '#c4d0df';
		context.font = '12px monospace';
		context.fillText(`Z=${scene.solarZenithDegrees.toFixed(6)}°  direct-h=${formatNumber(scene.photopic.directHorizontalLux)} lux  diffuse-h=${formatNumber(scene.photopic.diffuseHorizontalLux)} lux`, 36, y + 52);
		context.fillText(`plane replay exact=${scene.planeDiffuseReplay.exact}  spectral max |combined-(direct+diffuse)|=${scene.linearAdditivity.spectralMaximumAbsoluteDifference.toExponential(3)}`, 36, y + 76);
		context.fillText(`stored RGBy max abs=${scene.linearAdditivity.float32Field.maximumAbsoluteDifference.toExponential(3)}  max rel=${scene.linearAdditivity.float32Field.maximumRelativeDifference.toExponential(3)}`, 36, y + 98);
		const rectangle = {x: 620, y: y + 24, width: 1120, height: 170};
		context.strokeStyle = '#34445a';
		context.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
		for (let grid = -12; grid <= 4; grid += 4) {
			const gy = rectangle.y + rectangle.height * (1 - (grid + 12) / 16);
			context.strokeStyle = '#1e2a39';
			context.beginPath();
			context.moveTo(rectangle.x, gy);
			context.lineTo(rectangle.x + rectangle.width, gy);
			context.stroke();
			context.fillStyle = '#8393a8';
			context.fillText(String(grid), rectangle.x - 28, gy + 4);
		}
		const packets = scene.planeDiffuseReplay.response.packets;
		drawSpectralCurve(context, packets.directRadiance.values, rectangle, '#ff6b6b', -12, 4);
		drawSpectralCurve(context, packets.diffuseRadiance.values, rectangle, '#4dd7e5', -12, 4);
		drawSpectralCurve(context, packets.combinedRadiance.values, rectangle, '#86e88f', -12, 4);
		context.fillStyle = '#ff6b6b';
		context.fillText('direct', 36, y + 137);
		context.fillStyle = '#4dd7e5';
		context.fillText('diffuse', 112, y + 137);
		context.fillStyle = '#86e88f';
		context.fillText('combined', 198, y + 137);
		context.fillStyle = '#aebbd0';
		context.fillText('Native15 centers: 375.7 nm → 814.3 nm', rectangle.x, rectangle.y + rectangle.height + 21);
	}
	return {canvas, dataUrl: canvas.toDataURL('image/png'), width, height};
}

function packetSnapshot(parentScene) {
	return JSON.stringify({
		directNormal: parentScene.measurement.packets.directNormal,
		directHorizontal: parentScene.measurement.packets.directHorizontal,
		diffuseHorizontal: parentScene.measurement.packets.diffuseHorizontal,
		totalHorizontal: parentScene.measurement.packets.totalHorizontal,
	});
}

async function incidentInputSnapshot(directNormal, rawField) {
	const rawBytes = new Uint8Array(
		rawField.values.buffer,
		rawField.values.byteOffset,
		rawField.values.byteLength,
	);
	return {
		directNormalContentHash: directNormal.contentHash,
		directNormalValues: Array.from(directNormal.values),
		rawFieldValuesSha256: await sha256(rawBytes),
		rawFieldProvenanceIdentity: rawField.provenanceIdentity,
		rawFieldValueCount: rawField.values.length,
	};
}

function publicProbe(response) {
	const linearSrgb = {
		direct: projectCr3Native15ValuesToLinearSrgb(response.packets.directRadiance.values),
		diffuse: projectCr3Native15ValuesToLinearSrgb(response.packets.diffuseRadiance.values),
		combined: projectCr3Native15ValuesToLinearSrgb(response.packets.combinedRadiance.values),
	};
	const summedLinear = linearSrgb.direct.map((value, index) => value + linearSrgb.diffuse[index]);
	return {
		schemaId: response.schemaId,
		normalScene: response.normalScene,
		directCosine: response.directCosine,
		reflectance: response.reflectance,
		lambertianEquation: response.lambertianEquation,
		packets: response.packets,
		linearSrgb,
		combinedDifference: response.combinedDifference,
		linearCombinedDifference: maximumDifference(linearSrgb.combined, summedLinear),
	};
}

function validateConfiguration(configuration) {
	requireCondition(
		configuration.schemaId === 'algorithm32-color-reset-cr3-browser-config-v1',
		'CR3 browser configuration schema changed.',
	);
	requireCondition(configuration.scenes?.length === 4, 'CR3 requires exactly four scenes.');
	requireCondition(
		JSON.stringify(configuration.presentation.contactSheet.columnOrder) === JSON.stringify(configuration.scenes.map((scene) => scene.id)),
		'CR3 scene and contact-sheet column order differ.',
	);
	requireCondition(
		JSON.stringify(configuration.presentation.contactSheet.rowOrder) === JSON.stringify(MODE_IDS),
		'CR3 mode order changed.',
	);
	requireCondition(configuration.outputs?.individualFrames?.length === 12, 'CR3 requires twelve individual frames.');
	requireCondition(configuration.outputs?.imageUploadOrder?.length === 15, 'CR3 requires fifteen images.');
	requireCondition(configuration.outputs?.rawLinearFields?.length === 4, 'CR3 requires four raw linear fields.');
	requireCondition(
		configuration.outputs.rawLinearFieldByteLengthEach ===
			configuration.camera.widthPixels * configuration.camera.heightPixels * 3 * 4 * Float32Array.BYTES_PER_ELEMENT,
		'CR3 raw linear-field byte length changed.',
	);
	requireCondition(
		configuration.material?.basisContentHash === CR3_NATIVE15_BASIS_HASH &&
			configuration.material.channelCount === 15 &&
			configuration.material.reflectanceValues.every((value) => value === 0.18),
		'CR3 neutral material contract changed.',
	);
	requireCondition(
		configuration.incidentLight?.quadrature?.sampleCount === CR3_NEUTRAL_LAMBERTIAN_CONTRACT.directionCount &&
			configuration.incidentLight.channelCount === CR3_NEUTRAL_LAMBERTIAN_CONTRACT.channelCount,
		'CR3 incident-light contract changed.',
	);
	const uploads = [
		...configuration.outputs.rawLinearFields,
		configuration.outputs.geometryMask,
		...configuration.outputs.imageUploadOrder,
	];
	requireCondition(uploads.length === 20 && new Set(uploads).size === 20, 'CR3 upload declarations changed or contain duplicates.');
}

/** Render the CR3 neutral-geometry direct/diffuse proof from immutable CR1/CR2 parents. */
export async function runCr3NeutralGeometryAmbientProofBrowser() {
	const configuration = await fetch('/browser/config.json').then((response) => response.json());
	validateConfiguration(configuration);
	await window.colorResetProgress('cr3-parent-inputs-started');

	const measurementFetch = await fetchVerifiedJson(
		CR2_PARENT_ROUTE + configuration.parentReceiverLight.measurementAnalysis.path,
		configuration.parentReceiverLight.measurementAnalysis.sha256,
		'CR3 CR2 measurement analysis',
	);
	const measurementAnalysis = measurementFetch.value;
	requireCondition(
		measurementAnalysis.schemaId === 'algorithm32-color-reset-cr2-browser-result-v1',
		'CR3 CR2 measurement schema changed.',
	);
	const parentSceneById = new Map(measurementAnalysis.scenes.map((scene) => [scene.sceneId, scene]));
	const colorModel = createCr3NeutralSurfaceColorModel();
	const linearSrgbToXyz = invertMatrix3(colorModel.displayConstants.xyzToLinearSrgbMatrix);
	const photopicLuminanceWeights = linearSrgbToXyz[1];

	const canvas = document.createElement('canvas');
	canvas.width = configuration.camera.widthPixels;
	canvas.height = configuration.camera.heightPixels;
	const context = canvas.getContext('webgl2', {
		alpha: true,
		antialias: false,
		depth: true,
		stencil: false,
		preserveDrawingBuffer: true,
	});
	if (!context) throw new Error('CR3 requires WebGL2.');
	requireCondition(context.getExtension('EXT_color_buffer_float'), 'CR3 requires EXT_color_buffer_float.');
	const renderer = new THREE.WebGLRenderer({canvas, context, alpha: true, antialias: false});
	renderer.setPixelRatio(1);
	renderer.setSize(canvas.width, canvas.height, false);
	const geometryBundle = createGeometryBundle(configuration, renderer);
	const geometryMask = renderGeometryMask(geometryBundle);
	const geometryMaskSha256 = await sha256(geometryMask.mask);
	const rawShaderSourceHash = 'sha256:' + await sha256(new TextEncoder().encode(
		geometryBundle.rawMaterial.vertexShader + '\n' + geometryBundle.rawMaterial.fragmentShader,
	));
	const panelMap = new Map();
	const fixedScalePanelMap = new Map();
	const pendingPrimaryImages = new Map();
	const rawLinearFields = [];
	const sceneRecords = [];

	try {
		for (let sceneIndex = 0; sceneIndex < configuration.scenes.length; sceneIndex += 1) {
			const scene = configuration.scenes[sceneIndex];
			const parentScene = parentSceneById.get(scene.id);
			requireCondition(parentScene, 'CR3 parent measurement is missing ' + scene.id + '.');
			requireCondition(parentScene.cacheIdentity === scene.cacheIdentity, 'CR3 parent cache identity changed for ' + scene.id + '.');
			const packetsBefore = packetSnapshot(parentScene);
			const rawFetch = await fetchVerifiedBytes(
				CR2_PARENT_ROUTE + scene.rawDiffuseRadiance.path,
				scene.rawDiffuseRadiance.sha256,
				scene.rawDiffuseRadiance.byteLength,
				'CR3 CR2 raw radiance ' + scene.id,
			);
			const backplateFetch = await fetchVerifiedBytes(
				CR1_PARENT_ROUTE + scene.skyBackplate.path,
				scene.skyBackplate.sha256,
				scene.skyBackplate.byteLength,
				'CR3 CR1 Bruneton backplate ' + scene.id,
			);
			const backplate = await decodeBackplate(
				backplateFetch.bytes,
				configuration.camera.widthPixels,
				configuration.camera.heightPixels,
			);
			const sceneState = createDistantSunSceneState({
				observation: {
					instant: scene.timeIso,
					location: {
						latitude: {value: configuration.location.latitudeDegrees, units: 'degrees'},
						longitude: {value: configuration.location.longitudeDegrees, units: 'degrees'},
					},
				},
				observerHeight: {value: configuration.observer.heightMeters, units: 'meters'},
				observerUpDirection: configuration.observer.upDirectionModel,
			});
			requireCondition(
				Math.abs(sceneState.solarZenithDegrees - scene.solarZenithDegrees) <= 1e-12 &&
				maximumDifference(sceneState.directionToSourceModel, scene.directionToSourceModel).maximumAbsoluteDifference <= 1e-12,
				'CR3 scene-state replay changed for ' + scene.id + '.',
			);
			const directionToSourceScene = sceneState.geometry.expressCelestialDirectionInScene(
				sceneState.directionToSourceModel,
			);
			const sceneToModelBasis = sceneToModelBasisFromGeometry(sceneState.geometry);
			const rawField = decodeCr2ReceiverDiffuseRadianceField(
				rawFetch.bytes,
				`color-reset-cr2:${configuration.parentReceiverLight.runId}:${scene.rawDiffuseRadiance.path}:${rawFetch.sha256}`,
			);
			const directNormal = irradiancePacketFromCr2Record(
				parentScene.measurement.packets.directNormal,
				'CR3 ' + scene.id + ' directNormal',
			);
			const incidentInputsBefore = await incidentInputSnapshot(directNormal, rawField);
			const lighting = new Cr3NeutralLambertianLighting({
				sceneId: scene.id,
				directNormalIrradiance: directNormal,
				diffuseRadianceField: rawField,
				directionToSourceModel: sceneState.directionToSourceModel,
				sceneToModelBasis,
				reflectance: configuration.material.reflectanceValues[0],
			});
			const planeReplay = lighting.evaluateUpPlaneReplay({
				horizontalProjectionFactor: parentScene.measurement.orientation.horizontalProjectionFactor,
				directHorizontal: parentScene.measurement.packets.directHorizontal,
				diffuseHorizontal: parentScene.measurement.packets.diffuseHorizontal,
				totalHorizontal: parentScene.measurement.packets.totalHorizontal,
			});
			const sphereCenter = geometryBundle.sphere.position.toArray();
			const cameraFacingNormal = normalize3([
				geometryBundle.camera.position.x - sphereCenter[0],
				geometryBundle.camera.position.y - sphereCenter[1],
				geometryBundle.camera.position.z - sphereCenter[2],
			]);
			const probes = {
				planeUp: publicProbe(planeReplay.response),
				sphereSourceFacing: publicProbe(lighting.evaluateSpectralResponse(directionToSourceScene)),
				sphereCameraFacing: publicProbe(lighting.evaluateSpectralResponse(cameraFacingNormal)),
			};
			const responseArrays = responseArraysForGeometry(
				geometryBundle,
				lighting,
				photopicLuminanceWeights,
			);
			const fields = {};
			for (const mode of MODE_IDS) fields[mode] = renderRawResponse(geometryBundle, responseArrays.arrays, mode);
			const fieldAnalysis = analyzeFloat32Fields(fields, geometryMask.mask);
			const rawValueCount =
				configuration.camera.widthPixels * configuration.camera.heightPixels * MODE_IDS.length * 4;
			const rawPackedBytes = new Uint8Array(rawValueCount * Float32Array.BYTES_PER_ELEMENT);
			const rawPackedView = new DataView(rawPackedBytes.buffer);
			for (let pixelIndex = 0; pixelIndex < configuration.camera.widthPixels * configuration.camera.heightPixels; pixelIndex += 1) {
				for (let modeIndex = 0; modeIndex < MODE_IDS.length; modeIndex += 1) {
					const field = fields[MODE_IDS[modeIndex]];
					for (let channelIndex = 0; channelIndex < 4; channelIndex += 1) {
						const valueIndex = (pixelIndex * MODE_IDS.length + modeIndex) * 4 + channelIndex;
						rawPackedView.setFloat32(
							valueIndex * Float32Array.BYTES_PER_ELEMENT,
							field[pixelIndex * 4 + channelIndex],
							true,
						);
					}
				}
			}
			const rawArtifactPath = configuration.outputs.rawLinearFields[sceneIndex];
			const rawByteLength = await uploadBytes(
				rawArtifactPath,
				rawPackedBytes,
				'application/octet-stream',
			);
			const rawRecord = {
				artifactPath: rawArtifactPath,
				byteLength: rawByteLength,
				sceneId: scene.id,
				storage: 'little-endian float32',
				layout: configuration.outputs.rawLinearFieldLayout,
				orientation: 'top-down row-major pixels; within each pixel, fixture mode order then RGBY channels',
				width: configuration.camera.widthPixels,
				height: configuration.camera.heightPixels,
				valueCount: rawValueCount,
				finite: Object.values(fieldAnalysis.modes).every((record) => record.finite),
				modeOrder: MODE_IDS,
				channelOrder: ['linear-r', 'linear-g', 'linear-b', 'photopic-y'],
				linearRgbProjectionId: CR3_NATIVE15_LINEAR_PROJECTION_ID,
				photopicLuminanceWeights,
				units: ['cd m^-2', 'cd m^-2', 'cd m^-2', 'cd m^-2'],
				analysis: fieldAnalysis,
				derivation: 'rasterize the fixed neutral plane and sphere as signed E8 linear RGB plus CIE photopic Y for direct-only, diffuse-only, and combined Native15 Lambertian response; repack top-down pixel-major, then mode, then RGBY with explicit little-endian DataView writes',
			};
			rawLinearFields.push(rawRecord);
			await window.colorResetProgress('cr3-raw-' + scene.id);

			const frameRecords = {};
			for (const mode of MODE_IDS) {
				const panel = makePrimaryPanel({
					configuration,
					scene,
					mode,
					backplate,
					mask: geometryMask.mask,
					field: fields[mode],
					colorModel,
				});
				const artifactPath = modeArtifactPath(configuration, mode, scene.id);
				panelMap.set(mode + ':' + scene.id, panel.canvas);
				pendingPrimaryImages.set(artifactPath, {
					artifactPath,
					kind: 'primary-bruneton-neutral-geometry',
					sceneId: scene.id,
					mode,
					dataUrl: panel.dataUrl,
					width: panel.width,
					height: panel.height,
					derivation: 'copy exact decoded CR1 Bruneton backplate, replace only mask pixels with the CR2-derived neutral Lambertian E8 plus unchanged Figure 1 display response, and prepend a label header',
				});
				const fixedPanel = makeFixedScalePanel(configuration, scene, mode, fields[mode], geometryMask.mask);
				fixedScalePanelMap.set(mode + ':' + scene.id, fixedPanel.canvas);
				frameRecords[mode] = {
					artifactPath,
					colorId: colorModel.id,
					shaderSourceHash: rawShaderSourceHash,
					projectionId: CR3_NATIVE15_LINEAR_PROJECTION_ID,
					rawShaderId: RAW_SHADER_ID,
					rendererLinearResponse: fieldAnalysis.modes[mode],
					display: panel.summary,
					objectMask: {
						artifactPath: configuration.outputs.geometryMask,
						sha256: geometryMaskSha256,
						counts: geometryMask.counts,
					},
					skyReplay: panel.skyReplay,
					fixedScaleDiagnostic: {
						negativeChannelCount: fixedPanel.negativeChannelCount,
						jointPeakScalePixelCount: fixedPanel.jointPeakScalePixelCount,
					},
				};
			}

			const spectralDifferences = Object.values(probes).map((probe) => probe.combinedDifference);
			const spectralMaximumAbsoluteDifference = Math.max(
				responseArrays.spectral.maximumAbsoluteDifference,
				...spectralDifferences.map((entry) => entry.maximumAbsoluteDifference),
			);
			const spectralMaximumRelativeDifference = Math.max(
				responseArrays.spectral.maximumRelativeDifference,
				...spectralDifferences.map((entry) => entry.maximumRelativeDifference),
			);
			const packetsAfter = packetSnapshot(parentScene);
			const incidentInputsAfter = await incidentInputSnapshot(directNormal, rawField);
			const parentPacketHashesExact =
				directNormal.contentHash === scene.directNormalPacketContentHash &&
				parentScene.measurement.packets.directHorizontal.contentHash === scene.directHorizontalPacketContentHash &&
				parentScene.measurement.packets.diffuseHorizontal.contentHash === scene.diffuseHorizontalPacketContentHash &&
				parentScene.measurement.packets.totalHorizontal.contentHash === scene.totalHorizontalPacketContentHash;
			const parentPacketSerializationUnchanged = packetsBefore === packetsAfter;
			const incidentStateUnchanged =
				JSON.stringify(incidentInputsBefore) === JSON.stringify(incidentInputsAfter);
			const planeResponsePhotopic = Object.freeze({
				direct: dot3(photopicLuminanceWeights, probes.planeUp.linearSrgb.direct),
				diffuse: dot3(photopicLuminanceWeights, probes.planeUp.linearSrgb.diffuse),
				combined: dot3(photopicLuminanceWeights, probes.planeUp.linearSrgb.combined),
			});
			sceneRecords.push({
				sceneId: scene.id,
				label: scene.label,
				timeIso: scene.timeIso,
				solarZenithDegrees: scene.solarZenithDegrees,
				cacheStatus: scene.cacheStatus,
				cacheIdentity: scene.cacheIdentity,
				directionToSourceModel: sceneState.directionToSourceModel,
				directionToSourceScene,
				sceneToModelBasis,
				photopic: {
					directNormalLux: scene.directNormalLux,
					directHorizontalLux: scene.directHorizontalLux,
					diffuseHorizontalLux: scene.diffuseHorizontalLux,
					totalHorizontalLux: scene.totalHorizontalLux,
				},
				parentReplay: {
					passed: parentPacketHashesExact && parentPacketSerializationUnchanged && incidentStateUnchanged,
					exact: parentPacketHashesExact && parentPacketSerializationUnchanged && incidentStateUnchanged,
					parentRunId: configuration.parentReceiverLight.runId,
					measurementAnalysisSha256: measurementFetch.sha256,
					rawRadiance: {
						path: scene.rawDiffuseRadiance.path,
						sha256: rawFetch.sha256,
						byteLength: rawFetch.bytes.byteLength,
					},
					backplate: {
						parentRunId: configuration.skyControl.runId,
						path: scene.skyBackplate.path,
						sha256: backplateFetch.sha256,
						byteLength: backplateFetch.bytes.byteLength,
					},
					directNormalPacketContentHash: directNormal.contentHash,
					expectedPacketContentHashes: {
						directNormal: scene.directNormalPacketContentHash,
						directHorizontal: scene.directHorizontalPacketContentHash,
						diffuseHorizontal: scene.diffuseHorizontalPacketContentHash,
						totalHorizontal: scene.totalHorizontalPacketContentHash,
					},
					packetSerializationUnchanged: parentPacketSerializationUnchanged,
					actualIncidentInputsBefore: incidentInputsBefore,
					actualIncidentInputsAfter: incidentInputsAfter,
				},
				planeDiffuseReplay: planeReplay,
				planeResponsePhotopic,
				linearAdditivity: {
					spectral: {
						passed:
							spectralMaximumAbsoluteDifference <= configuration.thresholds.spectralAdditivityAbsoluteToleranceWPerSquareMeterSteradianNanometer ||
							spectralMaximumRelativeDifference <= configuration.thresholds.spectralAdditivityRelativeTolerance,
						maximumAbsoluteDifference: spectralMaximumAbsoluteDifference,
						maximumRelativeDifference: spectralMaximumRelativeDifference,
						evaluatedVertexCount: responseArrays.spectral.evaluatedVertexCount,
						retainedProbeCount: spectralDifferences.length,
						vertexResponses: responseArrays.spectral,
					},
					binary64LinearRgb: {
						passed:
							responseArrays.binary64.maximumAbsoluteDifference <= configuration.thresholds.binary64LinearRgbAdditivityAbsoluteTolerance ||
							responseArrays.binary64.maximumRelativeDifference <= configuration.thresholds.binary64LinearRgbAdditivityRelativeTolerance,
						...responseArrays.binary64,
					},
					float32LinearField: {
						passed:
							fieldAnalysis.combinedDifference.maximumAbsoluteDifference <= configuration.thresholds.float32LinearFieldAbsoluteTolerance ||
							fieldAnalysis.combinedDifference.maximumRelativeDifference <= configuration.thresholds.float32LinearFieldRelativeTolerance,
						...fieldAnalysis.combinedDifference,
					},
					spectralMaximumAbsoluteDifference,
					spectralMaximumRelativeDifference,
					binary64: responseArrays.binary64,
					float32Field: fieldAnalysis.combinedDifference,
					probes,
				},
				incidentStateUnchanged,
				objectMasksEqual: true,
				geometry: {
					planeId: configuration.neutralGeometry.plane.id,
					sphereId: configuration.neutralGeometry.sphere.id,
					maskCounts: geometryMask.counts,
					cameraFacingSphereNormal: cameraFacingNormal,
				},
				frames: frameRecords,
				colorState: {
					before: {colorId: colorModel.id, projectionId: CR3_NATIVE15_LINEAR_PROJECTION_ID},
					after: {colorId: colorModel.id, projectionId: CR3_NATIVE15_LINEAR_PROJECTION_ID},
					unchanged: true,
				},
				webglErrors: drainWebglErrors(context),
				contextLost: context.isContextLost(),
			});
		}

		const maskByteLength = await uploadBytes(
			configuration.outputs.geometryMask,
			geometryMask.mask,
			'application/octet-stream',
		);
		const maskRecord = {
			artifactPath: configuration.outputs.geometryMask,
			byteLength: maskByteLength,
			width: configuration.camera.widthPixels,
			height: configuration.camera.heightPixels,
			storage: 'top-down R8 object class; 0 backplate, 1 plane, 2 sphere',
			counts: geometryMask.counts,
			valuesValid: geometryMask.counts.invalid === 0,
			backplatePixelCount: geometryMask.counts.backplate,
			planePixelCount: geometryMask.counts.plane,
			spherePixelCount: geometryMask.counts.sphere,
			identityAcrossPrimaryFrames: true,
			derivation: 'rasterize the fixed front-facing plane and sphere once with depth testing and object-class fragment codes; reuse this exact top-down R8 mask for every scene and mode',
		};
		await window.colorResetProgress('cr3-geometry-mask');

		const images = [];
		for (const artifactPath of configuration.outputs.individualFrames) {
			const pending = pendingPrimaryImages.get(artifactPath);
			requireCondition(pending, 'CR3 primary panel is missing ' + artifactPath + '.');
			const byteLength = await uploadPng(artifactPath, pending.dataUrl);
			images.push({...pending, dataUrl: undefined, byteLength});
			await window.colorResetProgress('cr3-image-' + pending.mode + '-' + pending.sceneId);
		}

		const fixedScaleSheet = makeSheet({
			title: 'CR3 fixed-scale pre-display response',
			subtitle: 'One log10 photopic-luminance scale for every scene and mode; diagnostic only, never a Color or lighting input.',
			panels: fixedScalePanelMap,
			sceneOrder: configuration.presentation.contactSheet.columnOrder,
			modeOrder: configuration.presentation.contactSheet.rowOrder,
			configuration,
		});
		const fixedScaleByteLength = await uploadPng(
			configuration.outputs.fixedScaleDiagnostic,
			fixedScaleSheet.dataUrl,
		);
		images.push({
			artifactPath: configuration.outputs.fixedScaleDiagnostic,
			kind: 'fixed-scale-predisplay-response',
			byteLength: fixedScaleByteLength,
			width: fixedScaleSheet.width,
			height: fixedScaleSheet.height,
			derivation: 'map every object pixel through the fixture-fixed common log10 photopic-luminance scale, preserve signed RGB ratios with one scalar, clamp negative display channels, apply only joint peak containment, and standard-sRGB encode',
		});
		await window.colorResetProgress('cr3-image-fixed-scale');

		const additivityFigure = makeAdditivityFigure(sceneRecords);
		const additivityByteLength = await uploadPng(
			configuration.outputs.additivityAndSpectralDiagnostic,
			additivityFigure.dataUrl,
		);
		images.push({
			artifactPath: configuration.outputs.additivityAndSpectralDiagnostic,
			kind: 'linear-additivity-and-spectral-probes',
			byteLength: additivityByteLength,
			width: additivityFigure.width,
			height: additivityFigure.height,
			derivation: 'plot plane-up direct, diffuse, and combined Native15 outgoing-radiance probes on one fixed log scale and annotate pre-display spectral/binary64/float32 additivity facts',
		});
		await window.colorResetProgress('cr3-image-additivity');

		const contactSheet = makeSheet({
			title: 'CR3 neutral-geometry ambient proof',
			subtitle: 'Exact CR1 Bruneton skies; CR2 direct and 4096-direction diffuse Native15 light; neutral 18% Lambertian plane and sphere.',
			panels: panelMap,
			sceneOrder: configuration.presentation.contactSheet.columnOrder,
			modeOrder: configuration.presentation.contactSheet.rowOrder,
			configuration,
		});
		const contactSheetByteLength = await uploadPng(
			configuration.outputs.contactSheet,
			contactSheet.dataUrl,
		);
		images.push({
			artifactPath: configuration.outputs.contactSheet,
			kind: 'chronological-neutral-geometry-contact-sheet',
			byteLength: contactSheetByteLength,
			width: contactSheet.width,
			height: contactSheet.height,
			derivation: 'assemble the twelve already-rendered primary panels in fixture-fixed mode rows and chronological scene columns; no panel rescaling or recoloring',
		});

		const postPresentationMeasurementFetch = await fetchVerifiedJson(
			CR2_PARENT_ROUTE + configuration.parentReceiverLight.measurementAnalysis.path,
			configuration.parentReceiverLight.measurementAnalysis.sha256,
			'CR3 post-presentation CR2 measurement analysis',
		);
		const postPresentationSceneById = new Map(
			postPresentationMeasurementFetch.value.scenes.map((scene) => [scene.sceneId, scene]),
		);
		for (let sceneIndex = 0; sceneIndex < sceneRecords.length; sceneIndex += 1) {
			const sceneRecord = sceneRecords[sceneIndex];
			const fixtureScene = configuration.scenes[sceneIndex];
			const postPresentationParentScene = postPresentationSceneById.get(sceneRecord.sceneId);
			requireCondition(
				postPresentationParentScene,
				'CR3 post-presentation parent measurement is missing ' + sceneRecord.sceneId + '.',
			);
			const postPresentationRawFetch = await fetchVerifiedBytes(
				CR2_PARENT_ROUTE + fixtureScene.rawDiffuseRadiance.path,
				fixtureScene.rawDiffuseRadiance.sha256,
				fixtureScene.rawDiffuseRadiance.byteLength,
				'CR3 post-presentation CR2 raw radiance ' + sceneRecord.sceneId,
			);
			const postPresentationRawField = decodeCr2ReceiverDiffuseRadianceField(
				postPresentationRawFetch.bytes,
				`color-reset-cr2:${configuration.parentReceiverLight.runId}:${fixtureScene.rawDiffuseRadiance.path}:${postPresentationRawFetch.sha256}`,
			);
			const postPresentationDirectNormal = irradiancePacketFromCr2Record(
				postPresentationParentScene.measurement.packets.directNormal,
				'CR3 ' + sceneRecord.sceneId + ' directNormal',
			);
			const postPresentationIncidentInputs = await incidentInputSnapshot(
				postPresentationDirectNormal,
				postPresentationRawField,
			);
			const freshIncidentReplayExact =
				JSON.stringify(sceneRecord.parentReplay.actualIncidentInputsBefore) ===
				JSON.stringify(postPresentationIncidentInputs);
			const freshParentPacketSerializationExact =
				packetSnapshot(postPresentationParentScene) ===
				packetSnapshot(parentSceneById.get(sceneRecord.sceneId));
			sceneRecord.parentReplay.postPresentationMeasurementAnalysisSha256 =
				postPresentationMeasurementFetch.sha256;
			sceneRecord.parentReplay.actualIncidentInputsPostPresentation =
				postPresentationIncidentInputs;
			sceneRecord.parentReplay.freshPostPresentationRehydration = true;
			sceneRecord.parentReplay.freshIncidentReplayExact = freshIncidentReplayExact;
			sceneRecord.parentReplay.freshParentPacketSerializationExact =
				freshParentPacketSerializationExact;
			sceneRecord.parentReplay.passed =
				sceneRecord.parentReplay.passed &&
				freshIncidentReplayExact &&
				freshParentPacketSerializationExact;
			sceneRecord.parentReplay.exact = sceneRecord.parentReplay.passed;
			sceneRecord.incidentStateUnchanged =
				sceneRecord.incidentStateUnchanged &&
				freshIncidentReplayExact &&
				freshParentPacketSerializationExact;
		}
		await window.colorResetProgress('decision-plate-complete');
		const diffuseAndTotalPlaneStrictlyFalling = sceneRecords.every((scene, index) =>
			index === 0 || (
				sceneRecords[index - 1].planeResponsePhotopic.diffuse > scene.planeResponsePhotopic.diffuse &&
				sceneRecords[index - 1].planeResponsePhotopic.combined > scene.planeResponsePhotopic.combined
			),
		);

		return {
			schemaId: 'algorithm32-color-reset-cr3-browser-result-v1',
			software: {
				browserUserAgent: navigator.userAgent,
				threeRevision: THREE.REVISION,
				webglApi: context.getParameter(context.VERSION),
				renderer: context.getParameter(
					context.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER,
				),
				extColorBufferFloat: true,
			},
			parentReceiverLight: {
				runId: configuration.parentReceiverLight.runId,
				artifactSetSha256: configuration.parentReceiverLight.artifactSetSha256,
				measurementAnalysis: {
					path: configuration.parentReceiverLight.measurementAnalysis.path,
					sha256: measurementFetch.sha256,
				},
			},
			skyControl: {
				runId: configuration.skyControl.runId,
				artifactSetSha256: configuration.skyControl.artifactSetSha256,
				colorId: colorModel.id,
			},
			lightingContract: CR3_NEUTRAL_LAMBERTIAN_CONTRACT,
			material: configuration.material,
			presentation: {
				id: configuration.presentation.primary.id,
				colorId: colorModel.id,
				contract: CR3_NEUTRAL_SURFACE_PRESENTATION_CONTRACT,
			},
			surfaceResponseContract: {
				owner: 'Cr3NeutralLambertianLighting',
				acceptedBehaviorInputs: [
					'directNormalIrradiance',
					'diffuseRadianceField',
					'directionToSourceModel',
					'sceneToModelBasis',
					'surfaceNormalScene',
					'neutralReflectance',
				],
				forbiddenBehaviorInputsAbsent: true,
				sceneIdUse: 'provenance identity only; never read by the numerical response',
			},
			sequence: {
				diffuseAndTotalPlaneStrictlyFalling,
				derivation: 'strictly compare the CR3 up-plane diffuse and combined photopic outgoing-radiance responses in declared scene order',
			},
			colorProjection: {
				id: CR3_NATIVE15_LINEAR_PROJECTION_ID,
				basisHash: CR3_NATIVE15_BASIS_HASH,
				colorId: colorModel.id,
				linearSrgbToXyzMatrix: linearSrgbToXyz,
				photopicLuminanceWeights,
			},
			geometry: {
				coordinateFrame: configuration.neutralGeometry.coordinateFrame,
				sphere: configuration.neutralGeometry.sphere,
				plane: configuration.neutralGeometry.plane,
				camera: configuration.camera,
				mask: maskRecord,
			},
			rawLinearFields,
			images,
			scenes: sceneRecords,
			dimensions: {
				viewport: {width: configuration.camera.widthPixels, height: configuration.camera.heightPixels},
				contactSheet: {width: contactSheet.width, height: contactSheet.height},
				fixedScaleDiagnostic: {width: fixedScaleSheet.width, height: fixedScaleSheet.height},
				additivityFigure: {width: additivityFigure.width, height: additivityFigure.height},
			},
			errors: sceneRecords.flatMap((scene) => scene.webglErrors.map((code) => ({sceneId: scene.sceneId, kind: 'webgl-error', code}))),
			runtimeEnvironment: {
				webgl2: true,
				contextLost: context.isContextLost(),
				renderer: context.getParameter(
					context.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER,
				),
			},
			contextLost: context.isContextLost(),
		};
	} finally {
		for (const value of panelMap.values()) value.remove();
		for (const value of fixedScalePanelMap.values()) value.remove();
		geometryBundle.plane.geometry.dispose();
		geometryBundle.sphere.geometry.dispose();
		geometryBundle.rawMaterial.dispose();
		geometryBundle.maskMaterials.plane.dispose();
		geometryBundle.maskMaterials.sphere.dispose();
		geometryBundle.rawTarget.dispose();
		geometryBundle.maskTarget.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		canvas.remove();
	}
}
