import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Cr4gSlopeLimitedPreToneExposureColorDisplayModel} from '../color/Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';
import {Algorithm32} from '../controls/production-v1/src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {CanonicalAtmosphere} from '../controls/production-v1/src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {DistantSunLightSource} from '../controls/production-v1/src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {Algorithm32Bindings} from '../controls/production-v1/src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {STELLAR_ONE_PIXEL_PRESENTATION} from '../controls/production-v1/src/algorithm32/implementation/star-field/StellarPointPresentation.js';
import {StellarPointSetSource} from '../controls/production-v1/src/algorithm32/implementation/star-field/StellarPointSetSource.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../controls/production-v1/src/algorithm32/profiles/index.js';
import {ShaderSource} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderSource.js';
import {ThreeCacheBackend} from '../controls/production-v1/src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {createDistantSunSceneState} from '../controls/production-v1/src/flat32/DistantSunSceneState.js';
import {measureCr2ReceiverLight} from '../lighting/Cr2ReceiverLightMeasurement.js';
import {
	CR6_STELLAR_CONTRAST_DIAGNOSTIC_CHANNEL_GROUPS,
	CR6_STELLAR_CONTRAST_DIAGNOSTIC_COLOR_ID,
	CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODES,
	CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODE_VALUE_KEY,
	Cr6StellarContrastDiagnosticColorDisplayModel,
} from '../stellar/Cr6StellarContrastDiagnosticColorDisplayModel.js';

const RESULT_SCHEMA_ID = 'algorithm32-color-reset-cr6-stellar-contrast-onset-browser-result-v2';
const FIXTURE_SCHEMA_ID = 'algorithm32-color-reset-cr6-stellar-contrast-onset-input-v1';
const CHANNEL_COUNT = 15;
const RGB_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);
const MAIN_CADENCE_IDS = Object.freeze([
	'sunset',
	'sunset-plus-10-minutes',
	'sunset-plus-30-minutes',
	'sunset-plus-60-minutes',
	'sunset-plus-90-minutes',
	'sunset-plus-120-minutes',
]);
const MEASUREMENT_STABILITY = Object.freeze({
	repeatAbsoluteIrradianceFloor: 1e-10,
	repeatRelativeIrradianceDifference: 0.000001,
	rotationMaximumSymmetricRelativePhotopicDifference: 0.02,
	rotationChannelSignificanceFloor: 1e-9,
	rotationMaximumSymmetricRelativeChannelDifference: 0.05,
	rotationMaximumAbsoluteSubfloorChannelDifference: 5e-11,
	directProxyMaximumAbsoluteDifferenceCdPerSquareMeter: 1e-8,
	darkMaximumAbsoluteValue: 1e-12,
});
const FIGURE_KEYS = Object.freeze([
	'finalCompositeCadence',
	'completeDecisionMatrix',
	'fixedMemberOnsetLocalContrast',
	'brightnessColorOrder',
	'transitionDifference',
	'eligibilityCollisionHorizonMaskAudit',
]);
const MILLISECONDS_PER_DAY = 86_400_000;
const UNIX_EPOCH_JULIAN_DATE = 2_440_587.5;
const TWO_PI = 2 * Math.PI;
const ARCSECONDS_TO_RADIANS = Math.PI / (180 * 3600);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

function normalizeRadians(value) {
	return ((value % TWO_PI) + TWO_PI) % TWO_PI;
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const markerIndex = dataUrl.indexOf(marker);
	requireCondition(markerIndex >= 0, 'CR6 PNG data URL is not base64 encoded.');
	const binary = atob(dataUrl.slice(markerIndex + marker.length));
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

function typedArrayBytes(values) {
	return new Uint8Array(values.buffer.slice(values.byteOffset, values.byteOffset + values.byteLength));
}

async function sha256Hex(bytes) {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	const digest = await crypto.subtle.digest(
		'SHA-256',
		view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength),
	);
	return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

async function uploadBytes(artifactPath, bytes, contentType) {
	const response = await fetch('/artifact/' + artifactPath, {
		method: 'POST',
		headers: {'content-type': contentType},
		body: bytes,
	});
	requireCondition(response.ok, `CR6 artifact upload failed for ${artifactPath}: HTTP ${response.status}.`);
	return {
		artifactPath,
		byteLength: bytes.byteLength,
		sha256: await sha256Hex(bytes),
		contentType,
	};
}

async function uploadJson(artifactPath, value) {
	return uploadBytes(artifactPath, new TextEncoder().encode(JSON.stringify(value, null, 2) + '\n'), 'application/json');
}

function canvasPngBytes(canvas) {
	return dataUrlBytes(canvas.toDataURL('image/png'));
}

function rgbaCanvas(rgba, width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: true, colorSpace: 'srgb'});
	requireCondition(context, 'CR6 could not allocate a 2D image canvas.');
	context.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
	return canvas;
}

function drainWebglErrors(context) {
	const errors = [];
	for (let index = 0; index < 32; index += 1) {
		const error = context.getError();
		if (error === context.NO_ERROR) return errors;
		errors.push(error);
	}
	throw new Error('CR6 WebGL error drain exceeded 32 entries.');
}

function flipRows(values, width, height, components = 4) {
	const result = new values.constructor(values.length);
	const rowLength = width * components;
	for (let y = 0; y < height; y += 1) {
		const sourceOffset = (height - 1 - y) * rowLength;
		result.set(values.subarray(sourceOffset, sourceOffset + rowLength), y * rowLength);
	}
	return result;
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

function sceneInputCapture(composer) {
	const capture = composer.passes.find(
		(pass) => pass.getDiagnostics?.().kind === 'algorithm32-scene-input-capture-pass',
	);
	requireCondition(capture?._hitTarget, 'CR6 could not inspect the geometry scene-hit target.');
	return capture;
}

function celestialGenerationPass(composer) {
	const pass = composer.passes.find((candidate) =>
		candidate.stages?.some?.((stage) => stage.id === 'celestial-generation.stellar-point-index'),
	);
	requireCondition(pass?._stellar, 'CR6 could not inspect the installed stellar generation pass.');
	return pass;
}

function readSceneHitMask(renderer, composer, width, height) {
	const bottomUp = new Uint8Array(width * height * 4);
	renderer.readRenderTargetPixels(sceneInputCapture(composer)._hitTarget, 0, 0, width, height, bottomUp);
	const topDown = flipRows(bottomUp, width, height);
	const mask = new Uint8Array(width * height);
	let skyPixelCount = 0;
	let geometryPixelCount = 0;
	let noncanonicalPixelCount = 0;
	for (let pixel = 0; pixel < mask.length; pixel += 1) {
		const value = topDown[pixel * 4];
		mask[pixel] = value;
		if (value === 0) skyPixelCount += 1;
		else if (value === 255) geometryPixelCount += 1;
		else noncanonicalPixelCount += 1;
	}
	requireCondition(
		skyPixelCount > 0 && geometryPixelCount > 0 && noncanonicalPixelCount === 0,
		'CR6 scene-hit mask is degenerate or noncanonical.',
	);
	return {bytes: mask, skyPixelCount, geometryPixelCount, noncanonicalPixelCount};
}

function readGpuStellarMemberProjections(renderer, stellar) {
	const sourceTable = stellar._sourceTable;
	const sourceTexture = stellar._sourceTexture;
	const geometryContribution = stellar._geometryContribution;
	const activeUniforms = stellar._pointUniforms;
	requireCondition(
		sourceTable && sourceTexture && geometryContribution && activeUniforms,
		'CR6 could not inspect the active GPU stellar projection inputs.',
	);
	requireCondition(
		Object.is(activeUniforms.uStellarGenerationSource?.value, sourceTexture),
		'CR6 GPU projection readback did not receive the active stellar source texture.',
	);
	const layout = sourceTable.layout;
	const geometryUniformSource = geometryContribution.uniforms
		.map((uniform) => `uniform ${uniform.type} ${uniform.name};`)
		.join('\n');
	const uniforms = {
		uStellarGenerationSource: activeUniforms.uStellarGenerationSource,
	};
	for (const declaration of geometryContribution.uniforms) {
		requireCondition(
			activeUniforms[declaration.name],
			`CR6 GPU projection readback is missing active uniform ${declaration.name}.`,
		);
		uniforms[declaration.name] = activeUniforms[declaration.name];
	}
	const vertexShader = `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform highp sampler2D uStellarGenerationSource;
${geometryUniformSource}

${geometryContribution.source}

flat out highp vec4 vStellarProjectionReadback;

void main() {
	int memberIndex = gl_VertexID;
	vec3 catalogDirection = vec3(
		texelFetch(uStellarGenerationSource, ivec2(${layout.directionOffset}, memberIndex), 0).r,
		texelFetch(uStellarGenerationSource, ivec2(${layout.directionOffset + 1}, memberIndex), 0).r,
		texelFetch(uStellarGenerationSource, ivec2(${layout.directionOffset + 2}, memberIndex), 0).r
	);
	StellarProjectionResult projection = stellarProjectCatalogDirection(catalogDirection);
	vStellarProjectionReadback = vec4(
		vec2(projection.topLeftPixel),
		projection.occupied ? 1.0 : 0.0,
		projection.localDirectionEastNorthUp.z
	);
	float clipX = (2.0 * (float(memberIndex) + 0.5) / ${ShaderSource.formatFloat(layout.memberCount)}) - 1.0;
	gl_Position = vec4(clipX, 0.0, 0.0, 1.0);
	gl_PointSize = 1.0;
}`;
	const fragmentShader = `
precision highp float;
precision highp int;

flat in highp vec4 vStellarProjectionReadback;
layout(location = 0) out highp vec4 outStellarProjectionReadback;

void main() {
	outStellarProjectionReadback = vStellarProjectionReadback;
}`;
	const target = new THREE.WebGLRenderTarget(layout.memberCount, 1, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		generateMipmaps: false,
		depthBuffer: false,
		stencilBuffer: false,
	});
	target.texture.name = 'algorithm32-cr6-gpu-stellar-member-projection-readback';
	target.texture.internalFormat = 'RGBA32F';
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3 ?? '300 es',
		vertexShader,
		fragmentShader,
		uniforms,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NoBlending,
	});
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute(
		'position',
		new THREE.BufferAttribute(new Float32Array(layout.memberCount * 3), 3),
	);
	const points = new THREE.Points(geometry, material);
	points.frustumCulled = false;
	const scene = new THREE.Scene();
	const camera = new THREE.Camera();
	scene.add(points);
	const previousTarget = renderer.getRenderTarget?.() ?? null;
	const previousAutoClear = renderer.autoClear;
	const values = new Float32Array(layout.memberCount * 4);
	try {
		renderer.autoClear = false;
		renderer.setRenderTarget(target);
		const context = renderer.getContext();
		context.clearBufferfv(context.COLOR, 0, new Float32Array([0, 0, -1, 0]));
		renderer.render(scene, camera);
		renderer.readRenderTargetPixels(target, 0, 0, layout.memberCount, 1, values);
	} finally {
		renderer.autoClear = previousAutoClear;
		renderer.setRenderTarget(previousTarget);
		geometry.dispose();
		material.dispose();
		target.dispose();
	}
	let nonfiniteValueCount = 0;
	for (const value of values) if (!Number.isFinite(value)) nonfiniteValueCount += 1;
	requireCondition(nonfiniteValueCount === 0, 'CR6 GPU projection readback contains nonfinite values.');
	const projections = [];
	let coveredMemberCount = 0;
	for (let memberIndex = 0; memberIndex < layout.memberCount; memberIndex += 1) {
		const offset = memberIndex * 4;
		const pixelX = values[offset];
		const pixelY = values[offset + 1];
		const occupiedValue = values[offset + 2];
		const localDirectionUp = values[offset + 3];
		requireCondition(
			Number.isFinite(pixelX) && Number.isFinite(pixelY) &&
			Number.isFinite(occupiedValue) && Number.isFinite(localDirectionUp),
			`CR6 GPU projection readback member ${memberIndex} is nonfinite.`,
		);
		requireCondition(
			occupiedValue === 0 || occupiedValue === 1,
			`CR6 GPU projection readback member ${memberIndex} has a noncanonical occupancy.`,
		);
		coveredMemberCount += 1;
		const insideViewport = occupiedValue === 1;
		if (insideViewport) {
			requireCondition(
				Number.isInteger(pixelX) && Number.isInteger(pixelY) &&
				pixelX >= 0 && pixelX < stellar._viewportSize.width &&
				pixelY >= 0 && pixelY < stellar._viewportSize.height,
				`CR6 GPU projection readback member ${memberIndex} has an invalid occupied pixel.`,
			);
		}
		projections.push({
			aboveLocalHorizon: localDirectionUp > 0,
			insideViewport,
			projectedTopLeftPixel: insideViewport ? [pixelX, pixelY] : null,
			localDirectionUp,
		});
	}
	return {
		projections,
		evidence: {
			authority: 'exact-active-gpu-stellar-geometry-member-readback-v1',
			execution: 'one-member-per-point vertex projection into an RGBA32F member row',
			memberCount: layout.memberCount,
			coveredMemberCount,
			readbackLayout: ['topLeftPixelX', 'topLeftPixelY', 'occupied01', 'localDirectionUp'],
			nonfiniteValueCount,
			sourceTextureName: sourceTexture.name,
			geometryIdentity: geometryContribution.identity,
			uniformNames: Object.keys(uniforms),
		},
	};
}

function captureDiagnosticMode({bindingValues, mode, context, renderer, composer, width, height}) {
	bindingValues[CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODE_VALUE_KEY] = mode;
	composer.renderToScreen = false;
	try {
		composer.render(0);
		requireCondition(composer.writeBuffer?.texture?.type === THREE.FloatType, 'CR6 diagnostic target is not FloatType.');
		const bottomUp = new Float32Array(width * height * 4);
		renderer.readRenderTargetPixels(composer.writeBuffer, 0, 0, width, height, bottomUp);
		const values = flipRows(bottomUp, width, height);
		let nonfiniteValueCount = 0;
		for (const value of values) if (!Number.isFinite(value)) nonfiniteValueCount += 1;
		return {
			mode,
			values,
			nonfiniteValueCount,
			webglErrors: drainWebglErrors(context),
			contextLost: context.isContextLost(),
		};
	} finally {
		composer.renderToScreen = true;
	}
}

function readStellarGenerationResources(renderer, composer, width, height) {
	const joint = celestialGenerationPass(composer);
	const stellar = joint._stellar;
	requireCondition(stellar._activePair && stellar._sourceTable, 'CR6 stellar generation did not publish active resources.');
	const indexBottomUp = new Uint16Array(width * height);
	renderer.readRenderTargetPixels(stellar._activePair.screenIndexTarget, 0, 0, width, height, indexBottomUp);
	const screenIndex = flipRows(indexBottomUp, width, height, 1);
	const paletteWidth = stellar._layout.entryCapacity;
	const paletteHeight = stellar._layout.channelCount;
	const palette = new Float32Array(paletteWidth * paletteHeight);
	renderer.readRenderTargetPixels(
		stellar._activePair.paletteTarget,
		0,
		0,
		paletteWidth,
		paletteHeight,
		palette,
	);
	const sourceTable = stellar._sourceTable;
	const sourceValues = sourceTable.copyValues();
	const gpuProjectionReadback = readGpuStellarMemberProjections(renderer, stellar);
	return {
		screenIndex,
		palette,
		paletteWidth,
		paletteHeight,
		sourceValues,
		gpuMemberProjections: gpuProjectionReadback.projections,
		sourceTable: {
			identity: sourceTable.identity,
			sourceIdentity: sourceTable.sourceIdentity,
			frame: sourceTable.frame,
			epoch: sourceTable.epoch,
			memberIds: sourceTable.memberIds,
			layout: sourceTable.layout,
		},
		generation: {
			id: stellar._activeGeneration.id,
			compatibility: stellar._activeGeneration.compatibility,
			layout: {...stellar._layout},
			policyIdentity: stellar._stages[0].policyIdentity,
			numericalPolicy: stellar._stages[0].numericalPolicy,
			pointStageSourceHash: stellar._stages[0].sourceHash,
			paletteStageSourceHash: stellar._stages[1].sourceHash,
			geometryIdentity: stellar._geometryContribution.identity,
			modelViewProjectionMatrix: stellar._pointUniforms.uStellarModelViewProjectionMatrix.value.toArray(),
			memberProjectionReadback: gpuProjectionReadback.evidence,
			publication: {
				completion: stellar._activeGeneration.completion,
				screenIndex: {
					id: stellar._activeGeneration.screenIndex.id,
					format: stellar._activeGeneration.screenIndex.format,
					width: stellar._activeGeneration.screenIndex.width,
					height: stellar._activeGeneration.screenIndex.height,
				},
				palette: {
					id: stellar._activeGeneration.palette.id,
					format: stellar._activeGeneration.palette.format,
					width: stellar._activeGeneration.palette.width,
					height: stellar._activeGeneration.palette.height,
				},
			},
			diagnostics: (() => {
				const diagnostics = stellar.getDiagnostics();
				return {
					status: diagnostics.status,
					generationCount: diagnostics.generationCount,
					failedGenerationCount: diagnostics.failedGenerationCount,
					reusedFrameCount: diagnostics.reusedFrameCount,
					contextLossCount: diagnostics.contextLossCount,
					createdTargetCount: diagnostics.createdTargetCount,
					disposedTargetCount: diagnostics.disposedTargetCount,
					lastError: diagnostics.lastError,
					dirtyReason: diagnostics.publicationState.dirtyReason,
				};
			})(),
			jointTransactionId: joint.publicationState.active?.transactionId ?? null,
		},
	};
}

function sampleLinearRedTexture(values, width, height, u, v) {
	const texelX = u * width - 0.5;
	const texelY = v * height - 0.5;
	const x0 = Math.floor(texelX);
	const y0 = Math.floor(texelY);
	const fractionX = texelX - x0;
	const fractionY = texelY - y0;
	const x1 = x0 + 1;
	const y1 = y0 + 1;
	const clampedX0 = clamp(x0, 0, width - 1);
	const clampedX1 = clamp(x1, 0, width - 1);
	const clampedY0 = clamp(y0, 0, height - 1);
	const clampedY1 = clamp(y1, 0, height - 1);
	const bottom = values[clampedY0 * width + clampedX0] * (1 - fractionX) +
		values[clampedY0 * width + clampedX1] * fractionX;
	const top = values[clampedY1 * width + clampedX0] * (1 - fractionX) +
		values[clampedY1 * width + clampedX1] * fractionX;
	return bottom * (1 - fractionY) + top * fractionY;
}

function readSunCoverageOverlap(renderer, composer, stellarOccupied, width, height) {
	const joint = celestialGenerationPass(composer);
	const sun = joint._sun;
	const bindings = sun?.bindingValues?.();
	requireCondition(
		sun?._activeTarget && sun?._activeGeneration && bindings,
		'CR6 Sun generation did not publish active coverage resources.',
	);
	const tileResolution = bindings['runtime.celestial.sunTileResolution'];
	const screenCenterPixels = bindings['runtime.celestial.sunScreenCenterPixels'];
	const tileSamplesPerPixel = bindings['runtime.celestial.sunTileSamplesPerPixel'];
	requireCondition(
		Array.isArray(tileResolution) && tileResolution.length === 2 &&
		Array.isArray(screenCenterPixels) && screenCenterPixels.length === 2 &&
		Number.isFinite(tileSamplesPerPixel) && tileSamplesPerPixel > 0,
		'CR6 Sun coverage binding values are invalid.',
	);
	const tileWidth = tileResolution[0];
	const tileHeight = tileResolution[1];
	const coverageBottomUp = new Float32Array(tileWidth * tileHeight);
	renderer.readRenderTargetPixels(
		sun._activeTarget,
		0,
		0,
		tileWidth,
		tileHeight,
		coverageBottomUp,
	);
	let positiveSunCoveragePixelCount = 0;
	let starPositiveSunCoverageOverlapPixelCount = 0;
	let maximumCoverageAtOccupiedStellarPixel = 0;
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const screenPixelCenterX = x + 0.5;
			const screenPixelCenterY = height - y - 0.5;
			const tileTexelCenterX =
				(screenPixelCenterX - screenCenterPixels[0]) * tileSamplesPerPixel + 0.5 * tileWidth;
			const tileTexelCenterY =
				(screenPixelCenterY - screenCenterPixels[1]) * tileSamplesPerPixel + 0.5 * tileHeight;
			const u = tileTexelCenterX / tileWidth;
			const v = tileTexelCenterY / tileHeight;
			const coverage = u <= 0 || u >= 1 || v <= 0 || v >= 1
				? 0
				: clamp(sampleLinearRedTexture(coverageBottomUp, tileWidth, tileHeight, u, v), 0, 1);
			if (!(coverage > 0)) continue;
			positiveSunCoveragePixelCount += 1;
			const pixel = y * width + x;
			if (stellarOccupied[pixel] === 0) continue;
			starPositiveSunCoverageOverlapPixelCount += 1;
			maximumCoverageAtOccupiedStellarPixel = Math.max(maximumCoverageAtOccupiedStellarPixel, coverage);
		}
	}
	const diagnostics = sun.getDiagnostics();
	return {
		claimPolicy: sun._activeGeneration.claimPolicy,
		policyIdentity: diagnostics.policyIdentity,
		generationId: sun._activeGeneration.id,
		coverageResourceId: sun._activeGeneration.coverage.id,
		coverageFormat: sun._activeGeneration.coverage.format,
		screenCenterPixels: [...screenCenterPixels],
		tileResolutionPixels: [...tileResolution],
		tileSamplesPerPixel,
		positiveSunCoveragePixelCount,
		starPositiveSunCoverageOverlapPixelCount,
		maximumCoverageAtOccupiedStellarPixel,
		samplingEquation:
			'Exact CPU replay of CelestialScreenPaletteConsumerShaderContribution screen-pixel center mapping and LINEAR R32F tile lookup.',
	};
}

function reconstructTransportedStarField(groupCaptures, pixelCount) {
	const values = new Float32Array(pixelCount * CHANNEL_COUNT);
	const occupied = new Uint8Array(pixelCount);
	let occupancyDisagreementCount = 0;
	for (const [groupIndex, group] of CR6_STELLAR_CONTRAST_DIAGNOSTIC_CHANNEL_GROUPS.entries()) {
		const capture = groupCaptures[groupIndex];
		requireCondition(capture.mode === group.mode, 'CR6 stellar diagnostic channel-group order changed.');
		for (let pixel = 0; pixel < pixelCount; pixel += 1) {
			const sourceOffset = pixel * 4;
			const occupancy = capture.values[sourceOffset + 3] > 0.5 ? 1 : 0;
			if (groupIndex === 0) occupied[pixel] = occupancy;
			else if (occupied[pixel] !== occupancy) occupancyDisagreementCount += 1;
			for (let groupChannel = 0; groupChannel < 3; groupChannel += 1) {
				values[pixel * CHANNEL_COUNT + group.channelIndices[groupChannel]] =
					capture.values[sourceOffset + groupChannel];
			}
		}
	}
	return {values, occupied, occupancyDisagreementCount};
}

function precessCatalogDirection(catalogDirection, julianCenturiesSinceJ2000) {
	const [x, y, zValue] = catalogDirection;
	const length = Math.hypot(x, y, zValue);
	const direction = [x / length, y / length, zValue / length];
	const rightAscension = normalizeRadians(Math.atan2(direction[1], direction[0]));
	const declination = Math.asin(clamp(direction[2], -1, 1));
	const t = julianCenturiesSinceJ2000;
	const t2 = t * t;
	const t3 = t2 * t;
	const t4 = t3 * t;
	const t5 = t4 * t;
	const zeta = (2.650545 + 2306.083227 * t + 0.2988499 * t2 + 0.01801828 * t3 - 0.000005971 * t4 - 0.0000003173 * t5) * ARCSECONDS_TO_RADIANS;
	const z = (-2.650545 + 2306.077181 * t + 1.0927348 * t2 + 0.01826837 * t3 - 0.000028596 * t4 - 0.0000002904 * t5) * ARCSECONDS_TO_RADIANS;
	const theta = (2004.191903 * t - 0.4294934 * t2 - 0.04182264 * t3 - 0.000007089 * t4 - 0.0000001274 * t5) * ARCSECONDS_TO_RADIANS;
	const shiftedRightAscension = rightAscension + zeta;
	const a = Math.cos(declination) * Math.sin(shiftedRightAscension);
	const b = Math.cos(theta) * Math.cos(declination) * Math.cos(shiftedRightAscension) - Math.sin(theta) * Math.sin(declination);
	const c = Math.sin(theta) * Math.cos(declination) * Math.cos(shiftedRightAscension) + Math.cos(theta) * Math.sin(declination);
	const meanRightAscension = normalizeRadians(Math.atan2(a, b) + z);
	const meanDeclination = Math.asin(clamp(c, -1, 1));
	const cosineDeclination = Math.cos(meanDeclination);
	return [
		cosineDeclination * Math.cos(meanRightAscension),
		cosineDeclination * Math.sin(meanRightAscension),
		Math.sin(meanDeclination),
	];
}

function catalogDirectionToLocalEnu(catalogDirection, sceneSpec, location) {
	const milliseconds = Date.parse(sceneSpec.timeIso);
	requireCondition(Number.isFinite(milliseconds), `${sceneSpec.id} has an invalid observation time.`);
	const julianDate = milliseconds / MILLISECONDS_PER_DAY + UNIX_EPOCH_JULIAN_DATE;
	const zeroHoursJulianDate = Math.floor(julianDate - 0.5) + 0.5;
	const daysAtZeroHoursSinceJ2000 = zeroHoursJulianDate - 2_451_545;
	const hoursSinceZero = (julianDate - zeroHoursJulianDate) * 24;
	const t = (julianDate - 2_451_545) / 36_525;
	const mean = precessCatalogDirection(catalogDirection, t);
	const rightAscension = Math.atan2(mean[1], mean[0]);
	const declination = Math.asin(clamp(mean[2], -1, 1));
	const gmstHours = 6.697375 + 0.065707485828 * daysAtZeroHoursSinceJ2000 + 1.0027379 * hoursSinceZero + 0.0854103 * t + 0.0000258 * t * t;
	const localMeanSiderealTime = normalizeRadians(gmstHours * Math.PI / 12 + location.longitudeDegrees * Math.PI / 180);
	const hourAngle = normalizeRadians(localMeanSiderealTime - rightAscension);
	const latitude = location.latitudeDegrees * Math.PI / 180;
	const cosineDeclination = Math.cos(declination);
	const east = -cosineDeclination * Math.sin(hourAngle);
	const north = Math.sin(declination) * Math.cos(latitude) - cosineDeclination * Math.cos(hourAngle) * Math.sin(latitude);
	const up = Math.sin(declination) * Math.sin(latitude) + cosineDeclination * Math.cos(hourAngle) * Math.cos(latitude);
	const length = Math.hypot(east, north, up);
	return [east / length, north / length, up / length];
}

function projectCatalogMember(catalogDirection, sceneSpec, configuration, matrixArray) {
	const localEnu = catalogDirectionToLocalEnu(catalogDirection, sceneSpec, configuration.location);
	const aboveLocalHorizon = localEnu[2] > 0;
	if (!aboveLocalHorizon) {
		return {aboveLocalHorizon, insideViewport: false, projectedTopLeftPixel: null, ndc: null, localDirectionEastNorthUp: localEnu};
	}
	const matrix = new THREE.Matrix4().fromArray(matrixArray);
	const clip = new THREE.Vector4(localEnu[0], localEnu[2], -localEnu[1], 0).applyMatrix4(matrix);
	if (!(clip.w > 0)) {
		return {aboveLocalHorizon, insideViewport: false, projectedTopLeftPixel: null, ndc: null, localDirectionEastNorthUp: localEnu};
	}
	const ndc = [clip.x / clip.w, clip.y / clip.w];
	const screen = [
		(ndc[0] + 1) * 0.5 * configuration.viewport.widthPixels,
		(1 - ndc[1]) * 0.5 * configuration.viewport.heightPixels,
	];
	const insideViewport = screen[0] >= 0 && screen[0] < configuration.viewport.widthPixels && screen[1] >= 0 && screen[1] < configuration.viewport.heightPixels;
	return {
		aboveLocalHorizon,
		insideViewport,
		projectedTopLeftPixel: insideViewport ? [Math.floor(screen[0]), Math.floor(screen[1])] : null,
		ndc,
		localDirectionEastNorthUp: localEnu,
	};
}

function projectNative15(values, weights) {
	const rgb = [0, 0, 0];
	for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
		rgb[0] += values[channel] * weights.r[channel];
		rgb[1] += values[channel] * weights.g[channel];
		rgb[2] += values[channel] * weights.b[channel];
	}
	return rgb;
}

function photopicNative15(values, weights) {
	let luminance = 0;
	for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) luminance += values[channel] * weights[channel];
	return luminance;
}

function encodedLuminance(rgb8) {
	return rgb8[0] * RGB_WEIGHTS[0] + rgb8[1] * RGB_WEIGHTS[1] + rgb8[2] * RGB_WEIGHTS[2];
}

function displayRgb8(displayModel, linearRgb, illuminance) {
	return displayModel.linearSrgbToDisplayRgb(linearRgb, illuminance).map((value) => Math.round(clamp(value, 0, 1) * 255));
}

function f32BoundaryPacket(sourcePacket, scale) {
	const result = new Array(CHANNEL_COUNT);
	const f32Scale = Math.fround(scale);
	for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
		result[channel] = Math.fround(Math.fround(sourcePacket[channel]) * f32Scale);
	}
	return result;
}

function accumulateF32BoundaryPackets(sourcePackets, scale) {
	const result = new Array(CHANNEL_COUNT).fill(0);
	const f32Scale = Math.fround(scale);
	for (const sourcePacket of sourcePackets) {
		for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
			result[channel] = Math.fround(
				result[channel] + Math.fround(sourcePacket[channel]) * f32Scale,
			);
		}
	}
	return result;
}

const FLOAT32_BIT_BUFFER = new ArrayBuffer(4);
const FLOAT32_BIT_FLOAT_VIEW = new Float32Array(FLOAT32_BIT_BUFFER);
const FLOAT32_BIT_UINT_VIEW = new Uint32Array(FLOAT32_BIT_BUFFER);

function float32BitPattern(value) {
	FLOAT32_BIT_FLOAT_VIEW[0] = Math.fround(value);
	return FLOAT32_BIT_UINT_VIEW[0];
}

function float32OrderedUlpKey(value) {
	const bits = float32BitPattern(value);
	return (bits & 0x80000000) === 0
		? 0x80000000 + bits
		: 0x80000000 - (bits & 0x7fffffff);
}

function float32UlpDistance(left, right) {
	return Math.abs(float32OrderedUlpKey(left) - float32OrderedUlpKey(right));
}

function float32PacketBitComparison(left, right) {
	let mismatchedChannelCount = 0;
	for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
		if (float32BitPattern(left[channel]) !== float32BitPattern(right[channel])) {
			mismatchedChannelCount += 1;
		}
	}
	return {exact: mismatchedChannelCount === 0, mismatchedChannelCount};
}

function packetAt(values, pixel) {
	return Array.from(values.subarray(pixel * CHANNEL_COUNT, (pixel + 1) * CHANNEL_COUNT));
}

function rgbAt(values, pixel) {
	return Array.from(values.subarray(pixel * 4, pixel * 4 + 3));
}

function rgb8At(values, pixel) {
	return Array.from(values.subarray(pixel * 4, pixel * 4 + 3));
}

async function fetchVerifiedBytes(prefix, declaration, label) {
	const response = await fetch(prefix + declaration.path);
	requireCondition(response.ok, `${label} fetch failed with HTTP ${response.status}.`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	requireCondition(bytes.byteLength === declaration.byteLength, `${label} byte length changed.`);
	const sha256 = await sha256Hex(bytes);
	requireCondition(sha256 === declaration.sha256, `${label} SHA-256 changed.`);
	return {bytes, evidence: {path: declaration.path, byteLength: bytes.byteLength, sha256, verified: true}};
}

async function decodePng(bytes, width, height, label) {
	const bitmap = await createImageBitmap(new Blob([bytes], {type: 'image/png'}), {
		colorSpaceConversion: 'none',
		premultiplyAlpha: 'none',
	});
	try {
		requireCondition(bitmap.width === width && bitmap.height === height, `${label} dimensions changed.`);
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d', {alpha: true, willReadFrequently: true, colorSpace: 'srgb'});
		requireCondition(context, `CR6 could not decode ${label}.`);
		context.imageSmoothingEnabled = false;
		context.drawImage(bitmap, 0, 0);
		const rgba = new Uint8ClampedArray(context.getImageData(0, 0, width, height).data);
		canvas.remove();
		return rgba;
	} finally {
		bitmap.close();
	}
}

function compareRgbCodes(actual, expected, mask = null) {
	requireCondition(actual.length === expected.length, 'CR6 RGB comparison lengths differ.');
	let maximumRgbCodeDifference = 0;
	let squaredDifferenceSum = 0;
	let differingChannelCount = 0;
	let comparedChannelCount = 0;
	for (let pixel = 0; pixel < actual.length / 4; pixel += 1) {
		if (mask !== null && mask[pixel] !== 0) continue;
		for (let channel = 0; channel < 3; channel += 1) {
			const difference = Math.abs(actual[pixel * 4 + channel] - expected[pixel * 4 + channel]);
			if (difference !== 0) differingChannelCount += 1;
			maximumRgbCodeDifference = Math.max(maximumRgbCodeDifference, difference);
			squaredDifferenceSum += difference * difference;
			comparedChannelCount += 1;
		}
	}
	return {
		maximumRgbCodeDifference,
		rmse: comparedChannelCount === 0 ? 0 : Math.sqrt(squaredDifferenceSum / comparedChannelCount),
		differingChannelCount,
		comparedChannelCount,
	};
}

function compareStarProjection(cpuStarLinear, cpuStarPhotopicY, gpuStarCapture, occupied) {
	let maximumAbsoluteLinearRgbDifference = 0;
	let maximumAbsolutePhotopicYDifference = 0;
	let comparedOccupiedPixelCount = 0;
	let nonfiniteValueCount = 0;
	for (let pixel = 0; pixel < occupied.length; pixel += 1) {
		if (occupied[pixel] === 0) continue;
		comparedOccupiedPixelCount += 1;
		for (let channel = 0; channel < 3; channel += 1) {
			const cpu = cpuStarLinear[pixel * 4 + channel];
			const gpu = gpuStarCapture.values[pixel * 4 + channel];
			if (!Number.isFinite(cpu) || !Number.isFinite(gpu)) nonfiniteValueCount += 1;
			else maximumAbsoluteLinearRgbDifference = Math.max(
				maximumAbsoluteLinearRgbDifference,
				Math.abs(cpu - gpu),
			);
		}
		const cpuY = cpuStarPhotopicY[pixel];
		const gpuY = gpuStarCapture.values[pixel * 4 + 3];
		if (!Number.isFinite(cpuY) || !Number.isFinite(gpuY)) nonfiniteValueCount += 1;
		else maximumAbsolutePhotopicYDifference = Math.max(
			maximumAbsolutePhotopicYDifference,
			Math.abs(cpuY - gpuY),
		);
	}
	return {
		maximumAbsoluteLinearRgbDifference,
		maximumAbsolutePhotopicYDifference,
		comparedOccupiedPixelCount,
		nonfiniteValueCount,
	};
}

function validateConfiguration(fixture) {
	requireCondition(fixture.schemaId === FIXTURE_SCHEMA_ID, 'CR6 browser fixture schema changed.');
	requireCondition(fixture.scenes.length === 8, 'CR6 requires exactly eight predeclared scenes.');
	requireCondition(
		exactJson(fixture.scenes.map(({id}) => id), fixture.presentation.sceneOrder),
		'CR6 scene order changed.',
	);
	requireCondition(
		exactJson(fixture.outputs.perSceneKinds.map(({pathSuffix}) => pathSuffix), fixture.presentation.perSceneImageOrder),
		'CR6 per-scene image order changed.',
	);
	requireCondition(
		exactJson(Object.keys(fixture.outputs.figures), FIGURE_KEYS),
		'CR6 figure order changed.',
	);
	requireCondition(fixture.outputs.requestedImageUploadOrder.length === 38, 'CR6 must declare exactly 38 images.');
	const expectedImages = fixture.scenes.flatMap((scene) =>
		fixture.outputs.perSceneKinds.map(({pathSuffix}) => `captures/cr6-${scene.id}-${pathSuffix}.png`),
	).concat(FIGURE_KEYS.map((key) => fixture.outputs.figures[key]));
	requireCondition(exactJson(expectedImages, fixture.outputs.requestedImageUploadOrder), 'CR6 requested image order changed.');
	const viewport = fixture.viewport;
	const physical = fixture.physicalControls;
	requireCondition(
		viewport.widthPixels === fixture.presentation.layout.panelWidthPixels &&
			viewport.heightPixels === fixture.presentation.layout.panelHeightPixels &&
			viewport.widthPixels === 640 && viewport.heightPixels === 400 &&
			viewport.verticalFieldOfViewDegrees === 78 &&
			physical.maximumScatteringOrder === 4 &&
			physical.pathIntervalCount === 30 &&
			physical.pathSampleDistribution === 'quadratic-near-observer-v1' &&
			physical.spectralBasis === 'algorithm32-native15',
		'CR6 fixed viewport or physical Q30 controls changed.',
	);
	requireCondition(
		fixture.stellarCandidate.presentationIdentity === STELLAR_ONE_PIXEL_PRESENTATION.id &&
			fixture.stellarCandidate.irradianceToBoundaryRadianceScale ===
				STELLAR_ONE_PIXEL_PRESENTATION.irradianceToBoundaryRadianceScale,
		'CR6 stellar presentation identity changed.',
	);
	for (const scene of fixture.scenes) {
		requireCondition(
			scene.cacheExpectation.status === 'ready' || scene.cacheExpectation.status === 'dark',
			`${scene.id} cache status changed.`,
		);
		requireCondition(
			scene.cacheExpectation.status === 'dark' ? scene.sceneCacheAsset === undefined : Boolean(scene.sceneCacheAsset),
			`${scene.id} resolved cache asset disagrees with its status.`,
		);
	}
	return fixture;
}

function compileShader(context, type, source, label) {
	const shader = context.createShader(type);
	requireCondition(shader, `CR6 could not allocate ${label}.`);
	context.shaderSource(shader, source);
	context.compileShader(shader);
	if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
		const log = context.getShaderInfoLog(shader);
		context.deleteShader(shader);
		throw new Error(`CR6 ${label} compilation failed: ${log}`);
	}
	return shader;
}

function createDisplayReplay(context, displayModel, width, height) {
	const curve = displayModel.curve;
	const vertex = compileShader(context, context.VERTEX_SHADER, `#version 300 es
precision highp float;
void main() {
	vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0)
		: (gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0));
	gl_Position = vec4(position, 0.0, 1.0);
}`, 'display replay vertex shader');
	const fragment = compileShader(context, context.FRAGMENT_SHADER, `#version 300 es
precision highp float;
uniform sampler2D uLinearRgb;
uniform float uIlluminanceLux;
out vec4 outColor;
float hill(float E) {
	float ratio = max(E, 0.0) / ${ShaderSource.formatFloat(curve.sunsetTransitionIlluminanceLux)};
	return ${ShaderSource.formatFloat(curve.sunsetAmplitude)} / (1.0 + pow(ratio, ${ShaderSource.formatFloat(curve.sunsetRolloffPower)}));
}
float softplus(float value) { return max(value, 0.0) + log(1.0 + exp(-abs(value))); }
float gain(float E) {
	float e = max(E, 0.0);
	float base = 1.0 + hill(e);
	float ratio = log(${ShaderSource.formatFloat(curve.adaptationPivotIlluminanceLux)} / (e + ${ShaderSource.formatFloat(curve.adaptationFloorIlluminanceLux)}));
	float softened = ${ShaderSource.formatFloat(curve.adaptationSoftnessLogUnits)} * softplus(ratio / ${ShaderSource.formatFloat(curve.adaptationSoftnessLogUnits)});
	return base * exp(${ShaderSource.formatFloat(curve.adaptationExponent)} * softened);
}
void main() {
	vec3 linearRgb = texelFetch(uLinearRgb, ivec2(gl_FragCoord.xy), 0).rgb * gain(uIlluminanceLux);
	outColor = vec4(clamp(vec3(1.0) - exp(-max(linearRgb, vec3(0.0)) * ${ShaderSource.formatFloat(displayModel.displayConstants.paperFigure1ToneMapK)}), vec3(0.0), vec3(1.0)), 1.0);
}`, 'display replay fragment shader');
	const program = context.createProgram();
	requireCondition(program, 'CR6 could not allocate display replay program.');
	context.attachShader(program, vertex);
	context.attachShader(program, fragment);
	context.linkProgram(program);
	context.deleteShader(vertex);
	context.deleteShader(fragment);
	if (!context.getProgramParameter(program, context.LINK_STATUS)) {
		const log = context.getProgramInfoLog(program);
		context.deleteProgram(program);
		throw new Error(`CR6 display replay link failed: ${log}`);
	}
	const texture = context.createTexture();
	const framebuffer = context.createFramebuffer();
	const outputTexture = context.createTexture();
	const vertexArray = context.createVertexArray();
	requireCondition(texture && framebuffer && outputTexture && vertexArray, 'CR6 display replay allocation failed.');
	context.bindTexture(context.TEXTURE_2D, texture);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
	context.bindTexture(context.TEXTURE_2D, outputTexture);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
	context.texImage2D(context.TEXTURE_2D, 0, context.RGBA32F, width, height, 0, context.RGBA, context.FLOAT, null);
	context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
	context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, outputTexture, 0);
	const framebufferStatus = context.checkFramebufferStatus(context.FRAMEBUFFER);
	requireCondition(framebufferStatus === context.FRAMEBUFFER_COMPLETE, 'CR6 display replay framebuffer is incomplete.');
	context.bindFramebuffer(context.FRAMEBUFFER, null);
	return {context, program, texture, framebuffer, outputTexture, vertexArray, width, height, framebufferStatus};
}

function renderDisplayReplay(replay, topDownLinearRgba, illuminance) {
	const {context, width, height} = replay;
	const bottomUp = flipRows(topDownLinearRgba, width, height);
	context.bindTexture(context.TEXTURE_2D, replay.texture);
	context.texImage2D(context.TEXTURE_2D, 0, context.RGBA32F, width, height, 0, context.RGBA, context.FLOAT, bottomUp);
	context.bindFramebuffer(context.FRAMEBUFFER, replay.framebuffer);
	context.viewport(0, 0, width, height);
	context.disable(context.BLEND);
	context.disable(context.DEPTH_TEST);
	context.disable(context.CULL_FACE);
	context.useProgram(replay.program);
	context.bindVertexArray(replay.vertexArray);
	context.activeTexture(context.TEXTURE0);
	context.bindTexture(context.TEXTURE_2D, replay.texture);
	context.uniform1i(context.getUniformLocation(replay.program, 'uLinearRgb'), 0);
	context.uniform1f(context.getUniformLocation(replay.program, 'uIlluminanceLux'), illuminance.value);
	context.drawArrays(context.TRIANGLES, 0, 3);
	const floatBottomUp = new Float32Array(width * height * 4);
	context.readPixels(0, 0, width, height, context.RGBA, context.FLOAT, floatBottomUp);
	const floatTopDown = flipRows(floatBottomUp, width, height);
	const rgba = new Uint8ClampedArray(width * height * 4);
	let nonfiniteValueCount = 0;
	for (let index = 0; index < floatTopDown.length; index += 1) {
		const value = floatTopDown[index];
		if (!Number.isFinite(value)) nonfiniteValueCount += 1;
		rgba[index] = index % 4 === 3 ? 255 : Math.round(clamp(value, 0, 1) * 255);
	}
	context.bindVertexArray(null);
	context.bindFramebuffer(context.FRAMEBUFFER, null);
	return {rgba, floatTopDown, nonfiniteValueCount, errors: drainWebglErrors(context)};
}

function disposeDisplayReplay(replay) {
	const context = replay.context;
	context.deleteVertexArray(replay.vertexArray);
	context.deleteTexture(replay.texture);
	context.deleteTexture(replay.outputTexture);
	context.deleteFramebuffer(replay.framebuffer);
	context.deleteProgram(replay.program);
}

function median(values) {
	if (values.length === 0) return null;
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function starFreeRingMedianRgb8(skyRgba, sceneMask, occupied, width, height, x, y) {
	const channels = [[], [], []];
	for (let dy = -2; dy <= 2; dy += 1) {
		for (let dx = -2; dx <= 2; dx += 1) {
			if (dx === 0 && dy === 0) continue;
			const sampleX = x + dx;
			const sampleY = y + dy;
			if (sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height) continue;
			const pixel = sampleY * width + sampleX;
			if (sceneMask[pixel] !== 0 || occupied[pixel] !== 0) continue;
			for (let channel = 0; channel < 3; channel += 1) channels[channel].push(skyRgba[pixel * 4 + channel]);
		}
	}
	if (channels[0].length === 0) return null;
	return {rgb8: channels.map(median), sampleCount: channels[0].length};
}

function composeSceneProducts({
	skyField,
	gpuStarField,
	transportedStars,
	photopicWeights,
	sceneMask,
	displayModel,
	illuminance,
	width,
	height,
}) {
	const pixelCount = width * height;
	const skyLinear = new Float32Array(pixelCount * 4);
	const finalLinear = new Float32Array(pixelCount * 4);
	const gpuFinalLinear = new Float32Array(pixelCount * 4);
	const starLinear = new Float32Array(pixelCount * 4);
	const starPhotopicY = new Float32Array(pixelCount);
	const skyOnly = new Uint8ClampedArray(pixelCount * 4);
	const finalComposite = new Uint8ClampedArray(pixelCount * 4);
	const normalizedStarDiagnostic = new Uint8ClampedArray(pixelCount * 4);
	const localContrastOverlay = new Uint8ClampedArray(pixelCount * 4);
	const linearWeights = displayModel._displayLinearSrgbByChannel;
	for (let pixel = 0; pixel < pixelCount; pixel += 1) {
		const skyRgb = rgbAt(skyField, pixel);
		const starPacket = transportedStars.occupied[pixel] ? packetAt(transportedStars.values, pixel) : null;
		const starRgb = starPacket === null ? [0, 0, 0] : projectNative15(starPacket, linearWeights);
		const starY = starPacket === null ? 0 : photopicNative15(starPacket, photopicWeights);
		const combined = skyRgb.map((value, channel) => value + starRgb[channel]);
		for (let channel = 0; channel < 3; channel += 1) {
			skyLinear[pixel * 4 + channel] = skyRgb[channel];
			starLinear[pixel * 4 + channel] = starRgb[channel];
			finalLinear[pixel * 4 + channel] = combined[channel];
			gpuFinalLinear[pixel * 4 + channel] =
				skyRgb[channel] + gpuStarField[pixel * 4 + channel];
		}
		starPhotopicY[pixel] = starY;
		skyLinear[pixel * 4 + 3] = 1;
		starLinear[pixel * 4 + 3] = 1;
		finalLinear[pixel * 4 + 3] = 1;
		gpuFinalLinear[pixel * 4 + 3] = 1;
		const skyCodes = displayRgb8(displayModel, skyRgb, illuminance);
		const finalCodes = displayRgb8(displayModel, combined, illuminance);
		for (let channel = 0; channel < 3; channel += 1) {
			skyOnly[pixel * 4 + channel] = skyCodes[channel];
			finalComposite[pixel * 4 + channel] = finalCodes[channel];
			localContrastOverlay[pixel * 4 + channel] = Math.round(skyCodes[channel] * 0.28);
		}
		for (const output of [skyOnly, finalComposite, normalizedStarDiagnostic, localContrastOverlay]) {
			output[pixel * 4 + 3] = 255;
		}
		if (transportedStars.occupied[pixel]) {
			const positive = starRgb.map((value) => Math.max(value, 0));
			const peak = Math.max(...positive);
			const normalized = peak > 0 ? positive.map((value) => Math.round(255 * value / peak)) : [128, 128, 128];
			for (let channel = 0; channel < 3; channel += 1) {
				normalizedStarDiagnostic[pixel * 4 + channel] = normalized[channel];
			}
		}
	}
	const pixelFacts = new Map();
	for (let pixel = 0; pixel < pixelCount; pixel += 1) {
		if (!transportedStars.occupied[pixel]) continue;
		const x = pixel % width;
		const y = Math.floor(pixel / width);
		const skyRgb8 = rgb8At(skyOnly, pixel);
		const finalRgb8 = rgb8At(finalComposite, pixel);
		const deltaRgb8 = finalRgb8.map((value, channel) => value - skyRgb8[channel]);
		const ring = starFreeRingMedianRgb8(skyOnly, sceneMask, transportedStars.occupied, width, height, x, y);
		const deltaEncodedLuminanceCodes = encodedLuminance(finalRgb8) - encodedLuminance(skyRgb8);
		const ringY = ring === null ? null : encodedLuminance(ring.rgb8);
		const weberContrastReportOnly = ringY === null ? null : deltaEncodedLuminanceCodes / Math.max(ringY, 1);
		const maximumAbsoluteDeltaRgbCode = Math.max(...deltaRgb8.map(Math.abs));
		const heat = maximumAbsoluteDeltaRgbCode === 0
			? [80, 80, 80]
			: [
				Math.round(255 * clamp(Math.log2(maximumAbsoluteDeltaRgbCode + 1) / 4, 0, 1)),
				Math.round(255 * clamp(1 - Math.abs(Math.log2(maximumAbsoluteDeltaRgbCode + 1) / 4 - 0.5) * 2, 0, 1)),
				Math.round(255 * clamp(1 - Math.log2(maximumAbsoluteDeltaRgbCode + 1) / 4, 0, 1)),
			];
		for (let channel = 0; channel < 3; channel += 1) localContrastOverlay[pixel * 4 + channel] = heat[channel];
		pixelFacts.set(pixel, {
			pixel: [x, y],
			skyOnlyRgb8: skyRgb8,
			starFreeFiveByFiveRingMedianRgb8: ring?.rgb8 ?? null,
			starFreeFiveByFiveRingSampleCount: ring?.sampleCount ?? 0,
			finalCompositeRgb8: finalRgb8,
			deltaRgb8,
			deltaEncodedLuminanceCodes,
			weberContrastReportOnly,
			maximumAbsoluteDeltaRgbCode,
		});
	}
	return {
		skyLinear,
		starLinear,
		starPhotopicY,
		finalLinear,
		gpuFinalLinear,
		images: {skyOnly, normalizedStarDiagnostic, finalComposite, localContrastOverlay},
		pixelFacts,
	};
}

function palettePacket(palette, paletteWidth, entryIndex) {
	const packet = new Array(CHANNEL_COUNT);
	for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
		packet[channel] = palette[channel * paletteWidth + entryIndex];
	}
	return packet;
}

function maximumRelativePacketDifference(left, right) {
	let maximumDifference = 0;
	let scale = 0;
	for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
		maximumDifference = Math.max(maximumDifference, Math.abs(left[channel] - right[channel]));
		scale = Math.max(scale, Math.abs(left[channel]), Math.abs(right[channel]));
	}
	return scale === 0 ? 0 : maximumDifference / scale;
}

function buildMemberLedger({
	configuration,
	sceneSpec,
	resources,
	transportedStars,
	gpuStarField,
	products,
	sceneMask,
	diagnosticModel,
}) {
	const width = configuration.viewport.widthPixels;
	const height = configuration.viewport.heightPixels;
	const sourceLayout = resources.sourceTable.layout;
	const projections = [];
	const cpuProjections = [];
	const groups = new Map();
	requireCondition(
		resources.gpuMemberProjections.length === sourceLayout.memberCount,
		`${sceneSpec.id} GPU projection readback member count changed.`,
	);
	for (let memberIndex = 0; memberIndex < sourceLayout.memberCount; memberIndex += 1) {
		const sourceOffset = memberIndex * sourceLayout.componentCount;
		const direction = Array.from(
			resources.sourceValues.subarray(
				sourceOffset + sourceLayout.directionOffset,
				sourceOffset + sourceLayout.directionOffset + sourceLayout.directionComponentCount,
			),
		);
		const cpuProjection = projectCatalogMember(
			direction,
			sceneSpec,
			configuration,
			resources.generation.modelViewProjectionMatrix,
		);
		const projection = resources.gpuMemberProjections[memberIndex];
		cpuProjections.push(cpuProjection);
		projections.push(projection);
		if (!projection.insideViewport) continue;
		const key = projection.projectedTopLeftPixel.join(',');
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(memberIndex);
	}
	const photopicWeights = diagnosticModel._photopicYByChannel(NATIVE_15_SPECTRAL_BASIS);
	const linearWeights = diagnosticModel._displayLinearSrgbByChannel;
	const groupFacts = new Map();
	let canonicalCollisionMaximumRelativeDifference = 0;
	let canonicalCollisionPaletteBitMismatchGroupCount = 0;
	let canonicalCollisionPaletteBitMismatchChannelCount = 0;
	let gpuProjectionRepresentativeIndexMismatchCount = 0;
	let collisionPixelCount = 0;
	const expectedCompletePalette = new Float32Array(resources.palette.length);
	for (const [key, memberIndices] of groups) {
		const [x, y] = key.split(',').map(Number);
		const pixel = y * width + x;
		const representativeMemberIndex = memberIndices[0];
		const expectedEntryIndex = representativeMemberIndex + 1;
		const actualEntryIndex = resources.screenIndex[pixel];
		const sourcePackets = memberIndices.map((memberIndex) => {
			const sourceOffset = memberIndex * sourceLayout.componentCount + sourceLayout.spectralOffset;
			return Array.from(resources.sourceValues.subarray(sourceOffset, sourceOffset + CHANNEL_COUNT));
		});
		const boundaryPackets = sourcePackets.map((sourcePacket) => f32BoundaryPacket(
			sourcePacket,
			configuration.stellarCandidate.irradianceToBoundaryRadianceScale,
		));
		const expectedAggregateBoundary = accumulateF32BoundaryPackets(
			sourcePackets,
			configuration.stellarCandidate.irradianceToBoundaryRadianceScale,
		);
		const actualPaletteBoundary = palettePacket(resources.palette, resources.paletteWidth, actualEntryIndex);
		const expectedPaletteBoundary = palettePacket(resources.palette, resources.paletteWidth, expectedEntryIndex);
		const paletteBitComparison = float32PacketBitComparison(
			expectedAggregateBoundary,
			expectedPaletteBoundary,
		);
		const measuredRelativeDifference = maximumRelativePacketDifference(
			expectedAggregateBoundary,
			expectedPaletteBoundary,
		);
		const relativeDifference = paletteBitComparison.exact
			? 0
			: Math.max(measuredRelativeDifference, Number.MIN_VALUE);
		canonicalCollisionMaximumRelativeDifference = Math.max(
			canonicalCollisionMaximumRelativeDifference,
			relativeDifference,
		);
		if (!paletteBitComparison.exact) {
			canonicalCollisionPaletteBitMismatchGroupCount += 1;
			canonicalCollisionPaletteBitMismatchChannelCount += paletteBitComparison.mismatchedChannelCount;
		}
		if (actualEntryIndex !== expectedEntryIndex) {
			gpuProjectionRepresentativeIndexMismatchCount += 1;
		}
		for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
			expectedCompletePalette[channel * resources.paletteWidth + expectedEntryIndex] =
				expectedAggregateBoundary[channel];
		}
		if (memberIndices.length > 1) collisionPixelCount += 1;
		groupFacts.set(key, {
			pixel,
			memberIndices,
			boundaryPackets,
			representativeMemberIndex,
			expectedEntryIndex,
			actualEntryIndex,
			expectedAggregateBoundary,
			actualPaletteBoundary,
			expectedPaletteBoundary,
			screenIndexGroupKeyAndRepresentativeExact: actualEntryIndex === expectedEntryIndex,
			palettePacketBitExact: paletteBitComparison.exact,
			palettePacketBitMismatchChannelCount: paletteBitComparison.mismatchedChannelCount,
			canonicalCollisionRelativeDifference: relativeDifference,
		});
	}
	let completePaletteBitMismatchValueCount = 0;
	let completePaletteMaximumDifference = 0;
	let completePaletteScale = 0;
	let canonicalPaletteMaximumUlpDifference = 0;
	for (let index = 0; index < resources.palette.length; index += 1) {
		const expected = expectedCompletePalette[index];
		const actual = resources.palette[index];
		if (float32BitPattern(expected) !== float32BitPattern(actual)) {
			completePaletteBitMismatchValueCount += 1;
		}
		completePaletteMaximumDifference = Math.max(
			completePaletteMaximumDifference,
			Math.abs(expected - actual),
		);
		completePaletteScale = Math.max(completePaletteScale, Math.abs(expected), Math.abs(actual));
		canonicalPaletteMaximumUlpDifference = Math.max(
			canonicalPaletteMaximumUlpDifference,
			float32UlpDistance(expected, actual),
		);
	}
	const completePaletteMeasuredRelativeDifference = completePaletteScale === 0
		? 0
		: completePaletteMaximumDifference / completePaletteScale;
	const completePaletteRelativeDifference = completePaletteBitMismatchValueCount === 0
		? 0
		: Math.max(completePaletteMeasuredRelativeDifference, Number.MIN_VALUE);
	canonicalCollisionMaximumRelativeDifference = Math.max(
		canonicalCollisionMaximumRelativeDifference,
		completePaletteRelativeDifference,
	);
	const members = [];
	for (let memberIndex = 0; memberIndex < sourceLayout.memberCount; memberIndex += 1) {
		const projection = projections[memberIndex];
		const cpuProjection = cpuProjections[memberIndex];
		const sourceOffset = memberIndex * sourceLayout.componentCount;
		const sourceIrradiance = Array.from(
			resources.sourceValues.subarray(
				sourceOffset + sourceLayout.spectralOffset,
				sourceOffset + sourceLayout.spectralOffset + CHANNEL_COUNT,
			),
		);
		const boundarySourcePacket = f32BoundaryPacket(
			sourceIrradiance,
			configuration.stellarCandidate.irradianceToBoundaryRadianceScale,
		);
		let collisionMemberIds = [];
		let representativeMemberId = null;
		let actualRepresentativeMemberId = null;
		let screenIndexAtProjectedPixel = 0;
		let wholePixelSceneVisible = false;
		let transportedNative15StellarValue = new Array(CHANNEL_COUNT).fill(0);
		let aggregateTransportedNative15StellarValue = new Array(CHANNEL_COUNT).fill(0);
		let actualPaletteBoundaryPacket = new Array(CHANNEL_COUNT).fill(0);
		let expectedAggregateBoundaryPacket = new Array(CHANNEL_COUNT).fill(0);
		let inferredViewPathTransmittance = new Array(CHANNEL_COUNT).fill(0);
		let central = null;
		let collisionCount = 0;
		let canonicalCollisionRelativeDifference = null;
		let palettePacketBitExact = null;
		let palettePacketBitMismatchChannelCount = null;
		let screenIndexGroupKeyAndRepresentativeExact = null;
		if (projection.insideViewport) {
			const key = projection.projectedTopLeftPixel.join(',');
			const group = groupFacts.get(key);
			const pixel = group.pixel;
			collisionCount = group.memberIndices.length;
			collisionMemberIds = group.memberIndices.map((index) => resources.sourceTable.memberIds[index]);
			representativeMemberId = resources.sourceTable.memberIds[group.representativeMemberIndex];
			screenIndexAtProjectedPixel = group.actualEntryIndex;
			actualRepresentativeMemberId = group.actualEntryIndex === 0
				? null
				: resources.sourceTable.memberIds[group.actualEntryIndex - 1] ?? null;
			wholePixelSceneVisible = sceneMask[pixel] === 0;
			aggregateTransportedNative15StellarValue = packetAt(transportedStars.values, pixel);
			actualPaletteBoundaryPacket = group.actualPaletteBoundary;
			expectedAggregateBoundaryPacket = group.expectedAggregateBoundary;
			canonicalCollisionRelativeDifference = group.canonicalCollisionRelativeDifference;
			palettePacketBitExact = group.palettePacketBitExact;
			palettePacketBitMismatchChannelCount = group.palettePacketBitMismatchChannelCount;
			screenIndexGroupKeyAndRepresentativeExact = group.screenIndexGroupKeyAndRepresentativeExact;
			for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
				const boundary = actualPaletteBoundaryPacket[channel];
				inferredViewPathTransmittance[channel] =
					wholePixelSceneVisible && boundary !== 0
						? aggregateTransportedNative15StellarValue[channel] / boundary
						: 0;
				transportedNative15StellarValue[channel] = Math.fround(
					boundarySourcePacket[channel] * inferredViewPathTransmittance[channel],
				);
			}
			central = products.pixelFacts.get(pixel) ?? null;
		}
		const preDisplayStarLinearRgb = projectNative15(transportedNative15StellarValue, linearWeights);
		const preDisplayStarLuminance = photopicNative15(transportedNative15StellarValue, photopicWeights);
		const eligibleForIndividualOnset =
			projection.aboveLocalHorizon &&
			projection.insideViewport &&
			wholePixelSceneVisible &&
			collisionCount === 1 &&
			screenIndexAtProjectedPixel === memberIndex + 1;
		const gpuPreDisplayStarLinearRgb = projection.insideViewport
			? Array.from(gpuStarField.subarray(
				(projection.projectedTopLeftPixel[1] * width + projection.projectedTopLeftPixel[0]) * 4,
				(projection.projectedTopLeftPixel[1] * width + projection.projectedTopLeftPixel[0]) * 4 + 3,
			))
			: null;
		members.push({
			memberId: resources.sourceTable.memberIds[memberIndex],
			canonicalMemberIndex: memberIndex,
			catalogDirection: Array.from(
				resources.sourceValues.subarray(
					sourceOffset + sourceLayout.directionOffset,
					sourceOffset + sourceLayout.directionOffset + sourceLayout.directionComponentCount,
				),
			),
			projectedTopLeftPixel: projection.projectedTopLeftPixel,
			projectionAuthority: resources.generation.memberProjectionReadback.authority,
			projectionNdc: cpuProjection.ndc,
			localDirectionEastNorthUp: cpuProjection.localDirectionEastNorthUp,
			gpuProjectionLocalDirectionUp: projection.localDirectionUp,
			cpuProjectionDiagnostic: {
				projectedTopLeftPixel: cpuProjection.projectedTopLeftPixel,
				insideViewport: cpuProjection.insideViewport,
				aboveLocalHorizon: cpuProjection.aboveLocalHorizon,
				projectionNdc: cpuProjection.ndc,
				localDirectionEastNorthUp: cpuProjection.localDirectionEastNorthUp,
				insideViewportMatchesGpu: cpuProjection.insideViewport === projection.insideViewport,
				aboveLocalHorizonMatchesGpu:
					cpuProjection.aboveLocalHorizon === projection.aboveLocalHorizon,
				projectedPixelDeltaFromGpu:
					cpuProjection.insideViewport && projection.insideViewport
						? [
							cpuProjection.projectedTopLeftPixel[0] - projection.projectedTopLeftPixel[0],
							cpuProjection.projectedTopLeftPixel[1] - projection.projectedTopLeftPixel[1],
						]
						: null,
				projectedPixelExact:
					exactJson(cpuProjection.projectedTopLeftPixel, projection.projectedTopLeftPixel),
				localDirectionUpDifferenceFromGpu:
					cpuProjection.localDirectionEastNorthUp[2] - projection.localDirectionUp,
			},
			insideViewport: projection.insideViewport,
			aboveLocalHorizon: projection.aboveLocalHorizon,
			wholePixelSceneVisible,
			eligibleForIndividualOnset,
			collisionGroupMemberIds: collisionMemberIds,
			collisionCount,
			collisionRepresentativeMemberId: representativeMemberId,
			actualScreenIndexRepresentativeMemberId: actualRepresentativeMemberId,
			screenIndexAtProjectedPixel,
			representativeMatchesCanonical:
				!projection.insideViewport || actualRepresentativeMemberId === representativeMemberId,
			sourceSpectralIrradianceDensityNative15: sourceIrradiance,
			boundarySourcePacket,
			expectedAggregateBoundaryPacket,
			actualPaletteBoundaryPacket,
			palettePacketBitExact,
			palettePacketBitMismatchChannelCount,
			screenIndexGroupKeyAndRepresentativeExact,
			canonicalCollisionRelativeDifference,
			inferredViewPathTransmittance,
			transportedNative15StellarValue,
			aggregateTransportedNative15StellarValue,
			preDisplayStarLinearRgb,
			preDisplayStarLuminance,
			gpuPreDisplayStarLinearRgb,
			cpuGpuPreDisplayStarMaximumAbsoluteDifference:
				eligibleForIndividualOnset && gpuPreDisplayStarLinearRgb !== null
					? Math.max(...preDisplayStarLinearRgb.map(
						(value, channel) => Math.abs(value - gpuPreDisplayStarLinearRgb[channel]),
					))
					: null,
			sourceColorAxis:
				(preDisplayStarLinearRgb[0] - preDisplayStarLinearRgb[2]) /
				Math.max(Math.abs(preDisplayStarLinearRgb[0]) + Math.abs(preDisplayStarLinearRgb[2]), 1e-12),
			skyOnlyRgb8AtExactPixel: central?.skyOnlyRgb8 ?? null,
			starFreeFiveByFiveRingMedianRgb8: central?.starFreeFiveByFiveRingMedianRgb8 ?? null,
			starFreeFiveByFiveRingSampleCount: central?.starFreeFiveByFiveRingSampleCount ?? 0,
			finalCompositeRgb8: central?.finalCompositeRgb8 ?? null,
			deltaRgb8: central?.deltaRgb8 ?? null,
			deltaEncodedLuminanceCodes: central?.deltaEncodedLuminanceCodes ?? null,
			weberContrastReportOnly: central?.weberContrastReportOnly ?? null,
			maximumAbsoluteDeltaRgbCode: central?.maximumAbsoluteDeltaRgbCode ?? null,
			encodedOnset: eligibleForIndividualOnset && central !== null
				? central.maximumAbsoluteDeltaRgbCode >= 1
				: null,
			robustOnset: eligibleForIndividualOnset && central !== null
				? central.maximumAbsoluteDeltaRgbCode >= 2
				: null,
		});
	}
	let actualOccupiedPixelCount = 0;
	let actualSceneVisibleOccupiedPixelCount = 0;
	let orphanActualRepresentativePixelCount = 0;
	const actualOccupiedPixelKeys = new Set();
	for (let pixel = 0; pixel < resources.screenIndex.length; pixel += 1) {
		if (resources.screenIndex[pixel] === 0) continue;
		actualOccupiedPixelCount += 1;
		if (sceneMask[pixel] === 0) actualSceneVisibleOccupiedPixelCount += 1;
		const x = pixel % width;
		const y = Math.floor(pixel / width);
		const key = `${x},${y}`;
		actualOccupiedPixelKeys.add(key);
		if (!groups.has(key)) orphanActualRepresentativePixelCount += 1;
	}
	let gpuProjectionOccupiedPixelSetMismatchCount = 0;
	for (const key of groups.keys()) {
		if (!actualOccupiedPixelKeys.has(key)) gpuProjectionOccupiedPixelSetMismatchCount += 1;
	}
	for (const key of actualOccupiedPixelKeys) {
		if (!groups.has(key)) gpuProjectionOccupiedPixelSetMismatchCount += 1;
	}
	return {
		members,
		summary: {
			memberCount: members.length,
			aboveLocalHorizonCount: members.filter(({aboveLocalHorizon}) => aboveLocalHorizon).length,
			insideViewportCount: members.filter(({insideViewport}) => insideViewport).length,
			wholePixelSceneVisibleCount: members.filter(({wholePixelSceneVisible}) => wholePixelSceneVisible).length,
			collisionFreeEligibleCount: members.filter(({eligibleForIndividualOnset}) => eligibleForIndividualOnset).length,
			collisionPixelCount,
			actualOccupiedPixelCount,
			actualSceneVisibleOccupiedPixelCount,
			orphanActualRepresentativePixelCount,
			representativeMismatchCount: members.filter(({representativeMatchesCanonical}) => !representativeMatchesCanonical).length,
			canonicalCollisionPaletteBitMismatchGroupCount,
			canonicalCollisionPaletteBitMismatchChannelCount,
			completePaletteBitExact: completePaletteBitMismatchValueCount === 0,
			completePaletteBitMismatchValueCount,
			completePaletteComparedValueCount: resources.palette.length,
			completePaletteRelativeDifference,
			canonicalPaletteComparedScalarCount: resources.palette.length,
			canonicalPaletteBitMismatchCount: completePaletteBitMismatchValueCount,
			canonicalPaletteMaximumUlpDifference,
			gpuProjectionOccupiedPixelSetMismatchCount,
			gpuProjectionRepresentativeIndexMismatchCount,
			gpuProjectionNonfiniteValueCount:
				resources.generation.memberProjectionReadback.nonfiniteValueCount,
			gpuProjectionMemberCoverageCount:
				resources.generation.memberProjectionReadback.coveredMemberCount,
			gpuProjectionGroupCount: groups.size,
			canonicalCollisionMaximumRelativeDifference,
			cpuGpuInsideViewportMismatchCount: members.filter(
				({cpuProjectionDiagnostic}) => !cpuProjectionDiagnostic.insideViewportMatchesGpu,
			).length,
			cpuGpuAboveLocalHorizonMismatchCount: members.filter(
				({cpuProjectionDiagnostic}) => !cpuProjectionDiagnostic.aboveLocalHorizonMatchesGpu,
			).length,
			cpuGpuProjectedPixelMismatchCount: members.filter(
				({insideViewport, cpuProjectionDiagnostic}) =>
					insideViewport && cpuProjectionDiagnostic.insideViewport &&
					!cpuProjectionDiagnostic.projectedPixelExact,
			).length,
		},
	};
}

function perSceneImagePath(configuration, scene, kind) {
	const declaration = configuration.outputs.perSceneKinds.find(({key}) => key === kind);
	requireCondition(declaration, `CR6 output kind ${kind} is not declared.`);
	return `captures/cr6-${scene.id}-${declaration.pathSuffix}.png`;
}

function perSceneDataPath(configuration, sceneId, key) {
	const pattern = configuration.outputs.perSceneDataPathPatterns[key];
	requireCondition(typeof pattern === 'string' && pattern.includes('{sceneId}'), `CR6 data path ${key} changed.`);
	return pattern.replace('{sceneId}', sceneId);
}

async function acquireLiveScene(configuration, sceneSpec, diagnosticModel, displayModel, controlPng) {
	const cameraSpec = configuration.viewport;
	const physical = configuration.physicalControls;
	const width = cameraSpec.widthPixels;
	const height = cameraSpec.heightPixels;
	const pixelCount = width * height;
	const cacheStatus = sceneSpec.cacheExpectation.status;
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: true,
		stencil: false,
		preserveDrawingBuffer: true,
	});
	requireCondition(context, 'CR6 live acquisition requires WebGL2.');
	requireCondition(context.getExtension('EXT_color_buffer_float'), 'CR6 requires EXT_color_buffer_float.');
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
	camera.position.set(0, configuration.observer.heightMeters / physical.sceneScaleMetersPerSceneUnit, 0);
	camera.lookAt(camera.position.clone().add(cameraDirection(cameraSpec)));
	camera.updateMatrixWorld(true);
	const sceneScale = {value: physical.sceneScaleMetersPerSceneUnit, units: 'meters-per-scene-unit'};
	const sceneDepthMax = {value: physical.sceneDepthMaxMeters, units: 'meters'};
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
	const backend = new ThreeCacheBackend({THREE, renderer});
	const sceneState = createDistantSunSceneState({
		observation: {
			instant: sceneSpec.timeIso,
			location: {
				latitude: {value: configuration.location.latitudeDegrees, units: 'degrees'},
				longitude: {value: configuration.location.longitudeDegrees, units: 'degrees'},
			},
		},
		observerHeight: {value: configuration.observer.heightMeters, units: 'meters'},
		observerUpDirection: configuration.observer.upDirection,
	});
	const zenithTolerance =
		sceneSpec.id === configuration.transitionBracket.belowSceneId ||
		sceneSpec.id === configuration.transitionBracket.aboveSceneId
			? configuration.transitionBracket.maximumRecomputedSolarZenithResidualDegrees
			: 1e-12;
	requireCondition(
		Math.abs(sceneState.solarZenithDegrees - sceneSpec.solarZenithDegrees) <= zenithTolerance,
		`${sceneSpec.id} solar zenith changed from its predeclared value.`,
	);
	const geometry = sceneState.geometry;
	const lightSource = new DistantSunLightSource({
		angularRadius: {value: physical.sourceAngularRadiusRadians, units: 'radians'},
		...(cacheStatus === 'ready' ? {sceneCacheAsset: sceneSpec.sceneCacheAsset} : {}),
		darkScattering: cacheStatus === 'dark',
	});
	const celestialSources = {
		id: 'flat32-spherical-distant-sun',
		family: 'spherical-sun-stars-radial-v1',
		sun: lightSource,
		stars: new StellarPointSetSource(),
	};
	const algorithm32 = new Algorithm32({
		lightSource,
		atmosphere: new CanonicalAtmosphere(),
		geometry,
		groundBoundary: null,
		celestialSources,
		color: diagnosticModel,
		observation: sceneState.observation,
		sourcePlacement: {
			kind: 'distant-direction',
			directionToLight: sceneState.directionToSourceModel,
		},
		execution: {
			pathIntervalCount: physical.pathIntervalCount,
			pathSampleDistribution: {kind: physical.pathSampleDistribution},
			maximumScatteringOrder: physical.maximumScatteringOrder,
		},
	});
	const acceptedConfig = algorithm32.config.config;
	requireCondition(
		Object.is(acceptedConfig.observation, geometry.configuration.observation),
		`${sceneSpec.id} split the configured observation identity before stellar setup.`,
	);
	requireCondition(
		acceptedConfig.celestialSources?.family === 'spherical-sun-stars-radial-v1' &&
			acceptedConfig.celestialSources?.stars !== null,
		`${sceneSpec.id} lost the required spherical Sun-and-stars roster before stellar setup.`,
	);
	const groundEndpoints = geometry.createThreeEndpointObjects({
		name: `cr6-${sceneSpec.id}-spherical-ground`,
		sceneScale,
		widthSegments: physical.groundWidthSegments,
		heightSegments: physical.groundHeightSegments,
		visualMaterialColor: 0x000000,
		groundVisualMesh: {kind: 'local-spherical-patch'},
	});
	scene.add(...groundEndpoints.visualObjects);
	const bindingValues = Algorithm32Bindings.create(THREE, sceneDepthMax);
	bindingValues[CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODE_VALUE_KEY] =
		CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODES.SKY_LINEAR_RGBY;
	Algorithm32Bindings.update({bindingValues, camera, props: {config: algorithm32.config.config, sceneScale}});
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
		const cacheIdentity = sceneSpec.cacheIdentity ??
			sceneSpec.sceneCacheAsset?.loadRequest?.cacheIdentity ??
			'algorithm32-distant-sun-shared-dark-v1';
		const measurement = await measureCr2ReceiverLight({
			THREE,
			renderer,
			backend,
			algorithm32,
			handle,
			sceneId: sceneSpec.id,
			cacheIdentity,
			stability: MEASUREMENT_STABILITY,
		});
		const illuminance = measurement.publicResult.photopic.totalHorizontal.illuminance;
		requireCondition(
			illuminance.units === 'lux' && Number.isFinite(illuminance.value) && illuminance.value >= 0,
			`${sceneSpec.id} produced invalid total-horizontal illuminance.`,
		);
		const skyCapture = captureDiagnosticMode({
			bindingValues,
			mode: CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODES.SKY_LINEAR_RGBY,
			context,
			renderer,
			composer,
			width,
			height,
		});
		const groupCaptures = CR6_STELLAR_CONTRAST_DIAGNOSTIC_CHANNEL_GROUPS.map(({mode: diagnosticMode}) =>
			captureDiagnosticMode({
				bindingValues,
				mode: diagnosticMode,
				context,
				renderer,
				composer,
				width,
				height,
			}),
		);
		const starProjectionCapture = captureDiagnosticMode({
			bindingValues,
			mode: CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODES.STAR_LINEAR_RGBY,
			context,
			renderer,
			composer,
			width,
			height,
		});
		requireCondition(
			[skyCapture, ...groupCaptures, starProjectionCapture].every(
				({nonfiniteValueCount}) => nonfiniteValueCount === 0,
			),
			`${sceneSpec.id} diagnostic capture contains nonfinite values.`,
		);
		const sceneMask = readSceneHitMask(renderer, composer, width, height);
		const resources = readStellarGenerationResources(renderer, composer, width, height);
		const transportedStars = reconstructTransportedStarField(groupCaptures, pixelCount);
		const sunCoverageOverlap = readSunCoverageOverlap(
			renderer,
			composer,
			transportedStars.occupied,
			width,
			height,
		);
		const photopicWeights = diagnosticModel._photopicYByChannel(NATIVE_15_SPECTRAL_BASIS);
		const products = composeSceneProducts({
			skyField: skyCapture.values,
			gpuStarField: starProjectionCapture.values,
			transportedStars,
			photopicWeights,
			sceneMask: sceneMask.bytes,
			displayModel,
			illuminance,
			width,
			height,
		});
		const replay = createDisplayReplay(context, displayModel, width, height);
		let skyReplay;
		let finalReplay;
		try {
			skyReplay = renderDisplayReplay(replay, products.skyLinear, illuminance);
			finalReplay = renderDisplayReplay(replay, products.gpuFinalLinear, illuminance);
		} finally {
			disposeDisplayReplay(replay);
			renderer.resetState();
		}
		const ledger = buildMemberLedger({
			configuration,
			sceneSpec,
			resources,
			transportedStars,
			gpuStarField: starProjectionCapture.values,
			products,
			sceneMask: sceneMask.bytes,
			diagnosticModel,
		});
		const dataPayloads = [
			['stellarScreenIndex', typedArrayBytes(resources.screenIndex), 'application/octet-stream'],
			['stellarPalette', typedArrayBytes(resources.palette), 'application/octet-stream'],
			['skyLinearRgbY', typedArrayBytes(skyCapture.values), 'application/octet-stream'],
			['sceneHitMask', sceneMask.bytes, 'application/octet-stream'],
		].map(([key, bytes, contentType]) => ({key, bytes, contentType}));
		const debugRendererInfo = context.getExtension('WEBGL_debug_renderer_info');
		const rendererIdentity = context.getParameter(
			debugRendererInfo?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER,
		);
		const terminalWebglErrors = drainWebglErrors(context);
		const parentIlluminance = Number.isFinite(sceneSpec.totalHorizontalIlluminance?.value)
			? {
				declared: sceneSpec.totalHorizontalIlluminance,
				absoluteDifferenceLux: Math.abs(illuminance.value - sceneSpec.totalHorizontalIlluminance.value),
			}
			: null;
		const controlReplay = controlPng === null
			? {available: false}
			: {
				available: true,
				parentRunId: configuration.parents.cr4k.runId,
				parentArtifact: controlPng.evidence,
				...compareRgbCodes(products.images.skyOnly, controlPng.rgba),
				skyOnly: compareRgbCodes(products.images.skyOnly, controlPng.rgba, sceneMask.bytes),
			};
		return {
			publicResult: {
				sceneId: sceneSpec.id,
				label: sceneSpec.label,
				timeIso: sceneSpec.timeIso,
				offsetMinutes: sceneSpec.offsetMinutes,
				solarZenithDegrees: sceneState.solarZenithDegrees,
				solarElevationDegrees: 90 - sceneState.solarZenithDegrees,
				cache: {status: cacheStatus, identity: cacheIdentity, expectation: sceneSpec.cacheExpectation},
				totalHorizontalIlluminance: illuminance,
				declaredIlluminanceComparison: parentIlluminance,
				displayGain: displayModel.displayGain(illuminance),
				displayGainDerivativePerLux: displayModel.displayGainDerivative(illuminance),
				receiverLight: measurement.publicResult,
				ground: groundEndpoints.metadata,
				sceneMask: {
					skyPixelCount: sceneMask.skyPixelCount,
					geometryPixelCount: sceneMask.geometryPixelCount,
					noncanonicalPixelCount: sceneMask.noncanonicalPixelCount,
				},
				stellarSource: resources.sourceTable,
				stellarGeneration: resources.generation,
				stellarDiagnostics: {
					colorId: CR6_STELLAR_CONTRAST_DIAGNOSTIC_COLOR_ID,
					modeRenderCount: 7,
					modeIds: [
						skyCapture.mode,
						...groupCaptures.map(({mode: captureMode}) => captureMode),
						starProjectionCapture.mode,
					],
					occupancyDisagreementCount: transportedStars.occupancyDisagreementCount,
					occupiedPixelCount: transportedStars.occupied.reduce((sum, value) => sum + value, 0),
					positiveSunCoveragePixelCount: sunCoverageOverlap.positiveSunCoveragePixelCount,
					starPositiveSunCoverageOverlapPixelCount:
						sunCoverageOverlap.starPositiveSunCoverageOverlapPixelCount,
					sunCoverageOverlap,
				},
				memberLedger: ledger.members,
				memberLedgerSummary: ledger.summary,
				dataArtifacts: [],
				cpuGpuParity: {
					gpuParityPath: configuration.metrics.gpuParityPath,
					gpuStellarProjectionFeedsGpuFinal: true,
					starProjection: compareStarProjection(
						products.starLinear,
						products.starPhotopicY,
						starProjectionCapture,
						transportedStars.occupied,
					),
					skyOnly: compareRgbCodes(products.images.skyOnly, skyReplay.rgba),
					finalComposite: compareRgbCodes(products.images.finalComposite, finalReplay.rgba),
				},
				controlReplay,
				gpu: {
					api: context.getParameter(context.VERSION),
					renderer: rendererIdentity,
					d3d11: /d3d11/iu.test(String(rendererIdentity)),
					extColorBufferFloat: true,
					composerBufferType: 'FloatType',
					composerColorSpace: 'NoColorSpace',
					modeErrors: [skyCapture, ...groupCaptures, starProjectionCapture].map(
						({mode: captureMode, webglErrors}) => ({
						mode: captureMode,
						webglErrors,
					}),
					),
					replayErrors: [...skyReplay.errors, ...finalReplay.errors],
					terminalErrors: terminalWebglErrors,
					contextLost: context.isContextLost(),
					runtimeSourceHash: handle.getDiagnostics()?.runtime?.sourceHash ?? null,
				},
				runtimeDiagnostics: handle.getDiagnostics(),
			},
			internal: {
				images: products.images,
				sceneMask: sceneMask.bytes,
				stellarOccupied: transportedStars.occupied,
				screenIndex: resources.screenIndex,
				palette: resources.palette,
				paletteWidth: resources.paletteWidth,
				paletteHeight: resources.paletteHeight,
				dataPayloads,
			},
		};
	} finally {
		handle?.dispose();
		for (const object of groundEndpoints.visualObjects) {
			object.geometry?.dispose();
			object.material?.dispose();
		}
		algorithm32.dispose();
		backend.dispose();
		composer.dispose();
		target.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		canvas.remove();
	}
}

function geometricMeanPositive(values) {
	if (values.length === 0 || values.some((value) => !(value > 0))) return 0;
	return Math.exp(values.reduce((sum, value) => sum + Math.log(value), 0) / values.length);
}

function onsetIndex(entries, threshold) {
	for (let index = 0; index < entries.length; index += 1) {
		const entry = entries[index];
		if (entry.eligibleForIndividualOnset && entry.maximumAbsoluteDeltaRgbCode >= threshold) return index;
	}
	return null;
}

function buildFixedMemberTracks(configuration, scenes) {
	const ledgersByScene = new Map(scenes.map((scene) => [scene.sceneId, new Map(
		scene.memberLedger.map((member) => [member.memberId, member]),
	)]));
	const memberIds = scenes[0].stellarSource.memberIds;
	const fixedIds = memberIds.filter((memberId) => scenes.every((scene) => {
		const member = ledgersByScene.get(scene.sceneId).get(memberId);
		return member.aboveLocalHorizon && member.insideViewport && member.wholePixelSceneVisible &&
			member.collisionCount === 1 && member.screenIndexAtProjectedPixel === member.canonicalMemberIndex + 1;
	}));
	const mainScenes = MAIN_CADENCE_IDS.map((sceneId) => scenes.find((scene) => scene.sceneId === sceneId));
	const preDisplayRanks = fixedIds.map((memberId) => {
		const entries = mainScenes.map((scene) => ledgersByScene.get(scene.sceneId).get(memberId));
		return {
			memberId,
			brightnessScore: geometricMeanPositive(entries.map(({preDisplayStarLuminance}) => preDisplayStarLuminance)),
		};
	}).sort((left, right) => right.brightnessScore - left.brightnessScore || left.memberId.localeCompare(right.memberId));
	const quartileById = new Map(preDisplayRanks.map((rank, index) => [
		rank.memberId,
		Math.min(3, Math.floor(index * 4 / preDisplayRanks.length)),
	]));
	const scoreById = new Map(preDisplayRanks.map((rank) => [rank.memberId, rank.brightnessScore]));
	const thresholds = configuration.metrics.reportedCodeThresholds;
	const tracks = preDisplayRanks.map(({memberId}) => {
		const allEntries = scenes.map((scene) => ({
			sceneId: scene.sceneId,
			offsetMinutes: scene.offsetMinutes,
			...ledgersByScene.get(scene.sceneId).get(memberId),
		}));
		const mainEntries = MAIN_CADENCE_IDS.map((sceneId) => allEntries.find((entry) => entry.sceneId === sceneId));
		const encodedIndex = onsetIndex(mainEntries, 1);
		const robustIndex = onsetIndex(mainEntries, 2);
		let conditionalNoRegressionViolationCount = 0;
		for (let index = 1; index < mainEntries.length; index += 1) {
			const previous = mainEntries[index - 1];
			const current = mainEntries[index];
			if (!previous.eligibleForIndividualOnset || !current.eligibleForIndividualOnset) continue;
			const previousBackground = previous.skyOnlyRgb8AtExactPixel === null
				? null : encodedLuminance(previous.skyOnlyRgb8AtExactPixel);
			const currentBackground = current.skyOnlyRgb8AtExactPixel === null
				? null : encodedLuminance(current.skyOnlyRgb8AtExactPixel);
			if (previousBackground === null || currentBackground === null) continue;
			if (currentBackground <= previousBackground && current.preDisplayStarLuminance >= previous.preDisplayStarLuminance) {
				if ((previous.robustOnset && !current.robustOnset) ||
					current.maximumAbsoluteDeltaRgbCode < previous.maximumAbsoluteDeltaRgbCode) {
					conditionalNoRegressionViolationCount += 1;
				}
			}
		}
		return {
			memberId,
			brightnessScore: scoreById.get(memberId),
			brightnessQuartile: quartileById.get(memberId),
			encodedOnsetSceneIndex: encodedIndex,
			encodedOnsetSceneId: encodedIndex === null ? null : MAIN_CADENCE_IDS[encodedIndex],
			robustOnsetSceneIndex: robustIndex,
			robustOnsetSceneId: robustIndex === null ? null : MAIN_CADENCE_IDS[robustIndex],
			thresholdOnsets: Object.fromEntries(thresholds.map((threshold) => {
				const index = onsetIndex(mainEntries, threshold);
				return [String(threshold), {sceneIndex: index, sceneId: index === null ? null : MAIN_CADENCE_IDS[index]}];
			})),
			conditionalNoRegressionViolationCount,
			scenes: allEntries.map((entry) => ({
				sceneId: entry.sceneId,
				offsetMinutes: entry.offsetMinutes,
				projectedTopLeftPixel: entry.projectedTopLeftPixel,
				preDisplayStarLuminance: entry.preDisplayStarLuminance,
				preDisplayStarLinearRgb: entry.preDisplayStarLinearRgb,
				gpuPreDisplayStarLinearRgb: entry.gpuPreDisplayStarLinearRgb,
				cpuGpuPreDisplayStarMaximumAbsoluteDifference:
					entry.cpuGpuPreDisplayStarMaximumAbsoluteDifference,
				sourceColorAxis: entry.sourceColorAxis,
				skyOnlyRgb8AtExactPixel: entry.skyOnlyRgb8AtExactPixel,
				starFreeFiveByFiveRingMedianRgb8: entry.starFreeFiveByFiveRingMedianRgb8,
				finalCompositeRgb8: entry.finalCompositeRgb8,
				deltaRgb8: entry.deltaRgb8,
				deltaEncodedLuminanceCodes: entry.deltaEncodedLuminanceCodes,
				weberContrastReportOnly: entry.weberContrastReportOnly,
				maximumAbsoluteDeltaRgbCode: entry.maximumAbsoluteDeltaRgbCode,
				encodedOnset: entry.encodedOnset,
				robustOnset: entry.robustOnset,
			})),
		};
	});
	const onsetIndices = tracks.map(({robustOnsetSceneIndex}) => robustOnsetSceneIndex).filter((value) => value !== null);
	const quartileMedianOnset = (quartile) => median(tracks
		.filter((track) => track.brightnessQuartile === quartile)
		.map(({robustOnsetSceneIndex}) => robustOnsetSceneIndex ?? MAIN_CADENCE_IDS.length));
	const darkSceneId = configuration.gates.darkSceneOrderingAndColor.sceneId;
	const darkScene = scenes.find((scene) => scene.sceneId === darkSceneId);
	const darkEntries = tracks.map((track) => ({
		track,
		entry: track.scenes.find((scene) => scene.sceneId === darkSceneId),
	}));
	const topDeltaY = darkEntries.filter(({track}) => track.brightnessQuartile === 0)
		.map(({entry}) => entry.deltaEncodedLuminanceCodes);
	const bottomDeltaY = darkEntries.filter(({track}) => track.brightnessQuartile === 3)
		.map(({entry}) => entry.deltaEncodedLuminanceCodes);
	const colorSorted = [...darkEntries].sort((left, right) => right.entry.sourceColorAxis - left.entry.sourceColorAxis);
	const colorQuartileSize = Math.max(1, Math.ceil(colorSorted.length / 4));
	const redQuartile = colorSorted.slice(0, colorQuartileSize);
	const blueQuartile = colorSorted.slice(-colorQuartileSize);
	const displayDeltaColorAxis = (entry) => {
		const delta = entry.deltaRgb8;
		return (delta[0] - delta[2]) / Math.max(Math.abs(delta[0]) + Math.abs(delta[2]), 1);
	};
	const whitePixels = new Set();
	const resolvedTriples = new Set();
	for (const {entry} of darkEntries) {
		if (entry.robustOnset) resolvedTriples.add(entry.deltaRgb8.join(','));
		if (entry.finalCompositeRgb8.every((value) => value === 255)) whitePixels.add(entry.projectedTopLeftPixel.join(','));
	}
	return {
		schemaId: 'algorithm32-color-reset-cr6-fixed-member-tracks-v2',
		selection: configuration.metrics.fixedCohort.selection,
		selectionObservedCandidateDisplay: false,
		mainCadenceSceneIds: [...MAIN_CADENCE_IDS],
		preDisplayBrightnessRanking: preDisplayRanks.map((rank) => ({...rank, brightnessQuartile: quartileById.get(rank.memberId)})),
		tracks,
		metrics: {
			fixedCohortCount: tracks.length,
			distinctRobustOnsetIntervalCount: new Set(onsetIndices).size,
			laterRobustCrossingCount: onsetIndices.filter((index) => index > 0).length,
			topBrightnessQuartileMedianRobustOnsetIndex: quartileMedianOnset(0),
			bottomBrightnessQuartileMedianRobustOnsetIndex: quartileMedianOnset(3),
			conditionalNoRegressionViolationCount: tracks.reduce(
				(sum, track) => sum + track.conditionalNoRegressionViolationCount,
				0,
			),
		},
		darkSceneMetrics: {
			sceneId: darkSceneId,
			robustFixedMemberCount: darkEntries.filter(({entry}) => entry.robustOnset).length,
			topBrightnessQuartileMedianDeltaY8: median(topDeltaY),
			bottomBrightnessQuartileMedianDeltaY8: median(bottomDeltaY),
			sourceRedBlueQuartileMedianOrder: {
				red: median(redQuartile.map(({entry}) => entry.sourceColorAxis)),
				blue: median(blueQuartile.map(({entry}) => entry.sourceColorAxis)),
			},
			displayDeltaRedBlueQuartileMedianOrder: {
				red: median(redQuartile.map(({entry}) => displayDeltaColorAxis(entry))),
				blue: median(blueQuartile.map(({entry}) => displayDeltaColorAxis(entry))),
			},
			exactWhiteStellarAddedPixelCount: whitePixels.size,
			distinctResolvedDisplayDeltaRgbTripleCount: resolvedTriples.size,
			darkSceneOccupiedPixelCount: darkScene.memberLedgerSummary.actualSceneVisibleOccupiedPixelCount,
		},
	};
}

function maximumRgbArrayDifference(left, right) {
	if (left === null || right === null) return null;
	return Math.max(...left.map((value, channel) => Math.abs(value - right[channel])));
}

function buildTransitionAnalysis(configuration, scenes) {
	const below = scenes.find((scene) => scene.sceneId === configuration.transitionBracket.belowSceneId);
	const above = scenes.find((scene) => scene.sceneId === configuration.transitionBracket.aboveSceneId);
	const aboveById = new Map(above.memberLedger.map((member) => [member.memberId, member]));
	const perMember = [];
	let projectedPixelMismatchCount = 0;
	let eligibilityMismatchCount = 0;
	let collisionMembershipMismatchCount = 0;
	let robustMembershipMismatchCount = 0;
	let maximumStarPaletteRelativeDifference = 0;
	let maximumPerStarDisplayedDeltaRgbCodeDifference = 0;
	for (const left of below.memberLedger) {
		const right = aboveById.get(left.memberId);
		const projectedPixelExact = exactJson(left.projectedTopLeftPixel, right.projectedTopLeftPixel);
		const eligibilityExact = left.eligibleForIndividualOnset === right.eligibleForIndividualOnset;
		const collisionMembershipExact = exactJson(left.collisionGroupMemberIds, right.collisionGroupMemberIds);
		const robustMembershipExact = left.robustOnset === right.robustOnset;
		if (!projectedPixelExact) projectedPixelMismatchCount += 1;
		if (!eligibilityExact) eligibilityMismatchCount += 1;
		if (!collisionMembershipExact) collisionMembershipMismatchCount += 1;
		if (!robustMembershipExact) robustMembershipMismatchCount += 1;
		const paletteRelativeDifference = maximumRelativePacketDifference(
			left.actualPaletteBoundaryPacket,
			right.actualPaletteBoundaryPacket,
		);
		maximumStarPaletteRelativeDifference = Math.max(maximumStarPaletteRelativeDifference, paletteRelativeDifference);
		const displayedDeltaDifference = maximumRgbArrayDifference(left.deltaRgb8, right.deltaRgb8);
		if (displayedDeltaDifference !== null) {
			maximumPerStarDisplayedDeltaRgbCodeDifference = Math.max(
				maximumPerStarDisplayedDeltaRgbCodeDifference,
				displayedDeltaDifference,
			);
		}
		perMember.push({
			memberId: left.memberId,
			projectedPixelExact,
			eligibilityExact,
			collisionMembershipExact,
			robustMembershipExact,
			paletteRelativeDifference,
			displayedDeltaRgbMaximumCodeDifference: displayedDeltaDifference,
		});
	}
	let sceneMaskMismatchCount = 0;
	for (let pixel = 0; pixel < below._internal.sceneMask.length; pixel += 1) {
		if (below._internal.sceneMask[pixel] !== above._internal.sceneMask[pixel]) sceneMaskMismatchCount += 1;
	}
	const skyDifference = compareRgbCodes(
		below._internal.images.skyOnly,
		above._internal.images.skyOnly,
	);
	const presentationFactorMismatchCount =
		configuration.stellarCandidate.runtimeVisibilityFactor === 1 ? 0 : 1;
	return {
		schemaId: 'algorithm32-color-reset-cr6-transition-analysis-v2',
		belowSceneId: below.sceneId,
		aboveSceneId: above.sceneId,
		timestampSeparationMilliseconds: Date.parse(above.timeIso) - Date.parse(below.timeIso),
		perMember,
		facts: {
			projectedPixelsExact: projectedPixelMismatchCount === 0,
			eligibilityExact: eligibilityMismatchCount === 0,
			collisionMembershipExact: collisionMembershipMismatchCount === 0,
			sceneMaskExact: sceneMaskMismatchCount === 0,
			presentationFactorExact: presentationFactorMismatchCount === 0,
			robustMembershipExact: robustMembershipMismatchCount === 0,
		},
		metrics: {
			projectedPixelMismatchCount,
			eligibilityMismatchCount,
			collisionMembershipMismatchCount,
			sceneMaskMismatchCount,
			presentationFactorMismatchCount,
			maximumStarPaletteRelativeDifference,
			robustMembershipMismatchCount,
			maximumPerStarDisplayedDeltaRgbCodeDifference,
			maximumSkyOnlyRgbCodeDifference: skyDifference.maximumRgbCodeDifference,
			skyOnlyRgbCodeRmse: skyDifference.rmse,
		},
	};
}

function createFigure(width, height, title, subtitle = '') {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false, colorSpace: 'srgb'});
	requireCondition(context, 'CR6 could not allocate figure canvas.');
	context.fillStyle = '#08101c';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#f5f7fb';
	context.font = '700 24px system-ui, sans-serif';
	context.fillText(title, 20, 30);
	if (subtitle) {
		context.fillStyle = '#aebed2';
		context.font = '13px system-ui, sans-serif';
		context.fillText(subtitle, 20, 51);
	}
	context.imageSmoothingEnabled = false;
	return {canvas, context};
}

function putPanel(context, rgba, width, height, x, y, label) {
	context.fillStyle = '#dce7f5';
	context.font = '12px system-ui, sans-serif';
	context.fillText(label, x, y + 20);
	context.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), x, y + 32);
}

function drawGridFigure(configuration, scenes, rowDefinitions, layoutKey, title, subtitle) {
	const layout = configuration.presentation.layout;
	const declared = layout[layoutKey];
	const {canvas, context} = createFigure(declared.expectedWidthPixels, declared.expectedHeightPixels, title, subtitle);
	const startY = layout.outerPaddingPixels + layout.titleHeightPixels;
	for (const [row, definition] of rowDefinitions.entries()) {
		for (const [column, scene] of scenes.entries()) {
			const x = layout.outerPaddingPixels + column * (layout.panelWidthPixels + layout.columnGapPixels);
			const y = startY + row * (layout.panelLabelHeightPixels + layout.panelHeightPixels + layout.rowGapPixels);
			putPanel(
				context,
				definition.image(scene),
				layout.panelWidthPixels,
				layout.panelHeightPixels,
				x,
				y,
				`${scene.label} - ${definition.label}`,
			);
		}
	}
	return canvas;
}

function buildAuditImage(scene, width, height) {
	const rgba = new Uint8ClampedArray(width * height * 4);
	for (let pixel = 0; pixel < width * height; pixel += 1) rgba[pixel * 4 + 3] = 255;
	for (const member of scene.memberLedger) {
		if (!member.insideViewport) continue;
		const [x, y] = member.projectedTopLeftPixel;
		const pixel = y * width + x;
		let color;
		if (!member.representativeMatchesCanonical) color = [255, 0, 255];
		else if (!member.wholePixelSceneVisible) color = [255, 48, 48];
		else if (member.collisionCount > 1) color = [255, 196, 0];
		else if (member.eligibleForIndividualOnset) color = [48, 255, 112];
		else color = [72, 128, 255];
		for (let channel = 0; channel < 3; channel += 1) rgba[pixel * 4 + channel] = color[channel];
	}
	return rgba;
}

function differenceImage(left, right, amplification = 1, signed = false) {
	requireCondition(left.length === right.length, 'CR6 difference image sizes differ.');
	const result = new Uint8ClampedArray(left.length);
	for (let index = 0; index < left.length; index += 4) {
		for (let channel = 0; channel < 3; channel += 1) {
			const difference = right[index + channel] - left[index + channel];
			if (!signed) result[index + channel] = Math.round(clamp(Math.abs(difference) * amplification, 0, 255));
			else if (difference >= 0) {
				result[index + channel] = channel === 2 ? 0 : Math.round(clamp(difference * amplification, 0, 255));
			} else {
				result[index + channel] = channel === 0 ? 0 : Math.round(clamp(-difference * amplification, 0, 255));
			}
		}
		result[index + 3] = 255;
	}
	return result;
}

function drawAxes(context, rectangle, xLabel, yLabel) {
	context.strokeStyle = '#66809d';
	context.lineWidth = 1;
	context.beginPath();
	context.moveTo(rectangle.x, rectangle.y);
	context.lineTo(rectangle.x, rectangle.y + rectangle.height);
	context.lineTo(rectangle.x + rectangle.width, rectangle.y + rectangle.height);
	context.stroke();
	context.fillStyle = '#b9c9dc';
	context.font = '13px system-ui, sans-serif';
	context.fillText(xLabel, rectangle.x + rectangle.width / 2 - 70, rectangle.y + rectangle.height + 48);
	context.save();
	context.translate(rectangle.x - 62, rectangle.y + rectangle.height / 2 + 70);
	context.rotate(-Math.PI / 2);
	context.fillText(yLabel, 0, 0);
	context.restore();
}

function trackColor(sourceColorAxis, alpha = 0.42) {
	const red = Math.round(64 + 191 * clamp((sourceColorAxis + 1) / 2, 0, 1));
	const blue = Math.round(64 + 191 * clamp((1 - sourceColorAxis) / 2, 0, 1));
	return `rgba(${red},150,${blue},${alpha})`;
}

function drawFixedMemberTrackFigure(configuration, fixedMemberTracks) {
	const layout = configuration.presentation.layout.fixedMemberOnsetLocalContrast;
	const {canvas, context} = createFigure(
		layout.expectedWidthPixels,
		layout.expectedHeightPixels,
		'Fixed-member local contrast and onset',
		'All-eight-scene eligible, unmasked, collision-free cohort; 2-code line is engineering resolution, not a human threshold',
	);
	const rectangle = {x: 105, y: 105, width: 1435, height: 690};
	drawAxes(context, rectangle, 'Sunset cadence', 'max |final - sky|, RGB codes');
	const maximumDelta = Math.max(
		8,
		...fixedMemberTracks.tracks.flatMap((track) => track.scenes
			.filter(({sceneId}) => MAIN_CADENCE_IDS.includes(sceneId))
			.map(({maximumAbsoluteDeltaRgbCode}) => maximumAbsoluteDeltaRgbCode ?? 0)),
	);
	const yScale = (value) => rectangle.y + rectangle.height -
		Math.log2(1 + Math.max(value, 0)) / Math.log2(1 + maximumDelta) * rectangle.height;
	for (const threshold of configuration.metrics.reportedCodeThresholds) {
		context.strokeStyle = threshold === 2 ? '#f8d56b' : '#334b66';
		context.setLineDash(threshold === 2 ? [8, 5] : [3, 5]);
		context.beginPath();
		context.moveTo(rectangle.x, yScale(threshold));
		context.lineTo(rectangle.x + rectangle.width, yScale(threshold));
		context.stroke();
		context.fillStyle = threshold === 2 ? '#f8d56b' : '#8299b2';
		context.fillText(`${threshold} code`, rectangle.x + 5, yScale(threshold) - 4);
	}
	context.setLineDash([]);
	for (const track of fixedMemberTracks.tracks) {
		const main = MAIN_CADENCE_IDS.map((sceneId) => track.scenes.find((scene) => scene.sceneId === sceneId));
		const sourceColorAxis = main.reduce((sum, entry) => sum + entry.sourceColorAxis, 0) / main.length;
		context.strokeStyle = trackColor(sourceColorAxis);
		context.lineWidth = track.brightnessQuartile === 0 ? 1.8 : 0.8;
		context.beginPath();
		for (const [index, entry] of main.entries()) {
			const x = rectangle.x + index / (main.length - 1) * rectangle.width;
			const y = yScale(entry.maximumAbsoluteDeltaRgbCode ?? 0);
			if (index === 0) context.moveTo(x, y);
			else context.lineTo(x, y);
		}
		context.stroke();
	}
	context.fillStyle = '#c7d5e6';
	context.font = '12px system-ui, sans-serif';
	for (let index = 0; index < MAIN_CADENCE_IDS.length; index += 1) {
		const scene = configuration.scenes.find(({id}) => id === MAIN_CADENCE_IDS[index]);
		const x = rectangle.x + index / (MAIN_CADENCE_IDS.length - 1) * rectangle.width;
		context.fillText(scene.label, x - 45, rectangle.y + rectangle.height + 22);
	}
	context.fillText(`Fixed cohort: ${fixedMemberTracks.metrics.fixedCohortCount} members`, rectangle.x + 10, rectangle.y + 22);
	return canvas;
}

function drawBrightnessColorFigure(configuration, fixedMemberTracks) {
	const layout = configuration.presentation.layout.brightnessColorOrder;
	const {canvas, context} = createFigure(
		layout.expectedWidthPixels,
		layout.expectedHeightPixels,
		'Brightness and stellar-color ordering',
		'Pre-display transported brightness rank versus +120-minute displayed increment; point color is transported red-blue axis',
	);
	const rectangle = {x: 110, y: 105, width: 1420, height: 690};
	drawAxes(context, rectangle, 'log10 transported photopic one-pixel brightness score', '+120 minute delta Y8');
	const records = fixedMemberTracks.tracks.map((track) => ({
		track,
		dark: track.scenes.find(({sceneId}) => sceneId === configuration.gates.darkSceneOrderingAndColor.sceneId),
	}));
	const logValues = records.map(({track}) => Math.log10(Math.max(track.brightnessScore, 1e-30)));
	const yValues = records.map(({dark}) => dark.deltaEncodedLuminanceCodes ?? 0);
	const minX = Math.min(...logValues, -30);
	const maxX = Math.max(...logValues, minX + 1);
	const minY = Math.min(...yValues, 0);
	const maxY = Math.max(...yValues, minY + 1);
	for (const [index, {track, dark}] of records.entries()) {
		const x = rectangle.x + (logValues[index] - minX) / (maxX - minX) * rectangle.width;
		const y = rectangle.y + rectangle.height - (yValues[index] - minY) / (maxY - minY) * rectangle.height;
		context.fillStyle = trackColor(dark.sourceColorAxis, track.brightnessQuartile === 0 ? 0.95 : 0.62);
		context.beginPath();
		context.arc(x, y, track.brightnessQuartile === 0 ? 4 : 2.6, 0, TWO_PI);
		context.fill();
	}
	context.fillStyle = '#c7d5e6';
	context.font = '12px system-ui, sans-serif';
	context.fillText('Blue <- transported spectral color -> Red', rectangle.x + rectangle.width - 280, rectangle.y + 22);
	return canvas;
}

function drawTransitionFigure(configuration, scenes) {
	const below = scenes.find((scene) => scene.sceneId === configuration.transitionBracket.belowSceneId);
	const above = scenes.find((scene) => scene.sceneId === configuration.transitionBracket.aboveSceneId);
	const rows = [
		{
			label: 'sky-only',
			panels: [below._internal.images.skyOnly, above._internal.images.skyOnly,
				differenceImage(below._internal.images.skyOnly, above._internal.images.skyOnly, 16),
				differenceImage(below._internal.images.skyOnly, above._internal.images.skyOnly, 16, true)],
		},
		{
			label: 'final composite',
			panels: [below._internal.images.finalComposite, above._internal.images.finalComposite,
				differenceImage(below._internal.images.finalComposite, above._internal.images.finalComposite, 16),
				differenceImage(below._internal.images.finalComposite, above._internal.images.finalComposite, 16, true)],
		},
		{
			label: 'eligibility / contrast',
			panels: [buildAuditImage(below, configuration.viewport.widthPixels, configuration.viewport.heightPixels),
				buildAuditImage(above, configuration.viewport.widthPixels, configuration.viewport.heightPixels),
				below._internal.images.localContrastOverlay, above._internal.images.localContrastOverlay],
		},
	];
	const panelLabels = ['below 108 deg', 'above 108 deg', '|above - below| x16', 'signed / paired diagnostic'];
	const common = configuration.presentation.layout;
	const declared = common.transitionDifference;
	const {canvas, context} = createFigure(
		declared.expectedWidthPixels,
		declared.expectedHeightPixels,
		'Consecutive-millisecond 108-degree transition',
		'Difference amplification is diagnostic only; stars retain the same presentation equation on both sides',
	);
	const startY = common.outerPaddingPixels + common.titleHeightPixels;
	for (const [row, definition] of rows.entries()) {
		for (let column = 0; column < 4; column += 1) {
			const x = common.outerPaddingPixels + column * (common.panelWidthPixels + common.columnGapPixels);
			const y = startY + row * (common.panelLabelHeightPixels + common.panelHeightPixels + common.rowGapPixels);
			putPanel(context, definition.panels[column], common.panelWidthPixels, common.panelHeightPixels, x, y,
				`${definition.label} - ${panelLabels[column]}`);
		}
	}
	return canvas;
}

function expectedFrozenCurve(configuration) {
	const source = configuration.frozenSkyDisplay;
	return {
		id: source.id,
		sunsetAmplitude: source.sunsetAmplitude,
		sunsetTransitionIlluminanceLux: source.sunsetTransitionIlluminanceLux,
		sunsetRolloffPower: source.sunsetRolloffPower,
		adaptationPivotIlluminanceLux: source.adaptationPivotIlluminanceLux,
		adaptationFloorIlluminanceLux: source.adaptationFloorIlluminanceLux,
		adaptationSoftnessLogUnits: source.adaptationSoftnessLogUnits,
		adaptationExponent: source.adaptationExponent,
	};
}

async function loadControlPngs(configuration) {
	const width = configuration.viewport.widthPixels;
	const height = configuration.viewport.heightPixels;
	const controls = new Map();
	for (const declaration of configuration.parents.cr4k.controlPngs) {
		const input = await fetchVerifiedBytes('/cr4k/', declaration, `CR6 ${declaration.sceneId} CR4K control PNG`);
		controls.set(declaration.sceneId, {
			evidence: input.evidence,
			rgba: await decodePng(input.bytes, width, height, `CR6 ${declaration.sceneId} CR4K control PNG`),
		});
	}
	return controls;
}

/** Render all CR6 images before publishing data/evidence; leave every scientific gate to the Node runner. */
export async function runCr6StellarContrastOnsetBrowser() {
	const configurationResponse = await fetch('/browser/configuration.json');
	requireCondition(configurationResponse.ok, 'CR6 browser configuration fetch failed.');
	const configuration = validateConfiguration(await configurationResponse.json());
	requireCondition(
		new Uint8Array(new Uint16Array([1]).buffer)[0] === 1,
		'CR6 retained binary artifacts require a little-endian browser.',
	);
	await window.colorResetProgress('parent-input-started');
	const controls = await loadControlPngs(configuration);
	const diagnosticModel = new Cr6StellarContrastDiagnosticColorDisplayModel();
	const displayModel = new Cr4gSlopeLimitedPreToneExposureColorDisplayModel({
		curve: expectedFrozenCurve(configuration),
	});
	const uploadedImages = [];
	const uploadedDataArtifacts = [];
	const uploadedEvidence = [];
	const imageUploadOrder = [];
	const panelIdentities = [];
	const imageDerivations = [];
	const dataDerivations = [];
	const sceneRecords = [];
	const uploadImage = async (artifactPath, source, identity, derivation) => {
		const temporaryCanvas = source instanceof HTMLCanvasElement
			? null
			: rgbaCanvas(source, configuration.viewport.widthPixels, configuration.viewport.heightPixels);
		const bytes = canvasPngBytes(temporaryCanvas ?? source);
		temporaryCanvas?.remove();
		const upload = await uploadBytes(artifactPath, bytes, 'image/png');
		uploadedImages.push(upload);
		imageUploadOrder.push(artifactPath);
		panelIdentities.push({...identity, artifactPath, output: upload});
		imageDerivations.push({...derivation, artifactPath, result: upload});
		await window.colorResetProgress(`image-${imageUploadOrder.length}`);
		return upload;
	};
	for (const sceneSpec of configuration.scenes) {
		const acquired = await acquireLiveScene(
			configuration,
			sceneSpec,
			diagnosticModel,
			displayModel,
			controls.get(sceneSpec.id) ?? null,
		);
		const scene = {...acquired.publicResult, _internal: acquired.internal};
		for (const {key} of configuration.outputs.perSceneKinds) {
			const artifactPath = perSceneImagePath(configuration, sceneSpec, key);
			const upload = await uploadImage(
				artifactPath,
				scene._internal.images[key],
				{
					panelId: `${scene.sceneId}-${key}`,
					sceneId: scene.sceneId,
					role: key,
					fullResolution: true,
				},
				{
					operation: key === 'normalizedStarDiagnostic'
						? configuration.presentation.normalizedStarDiagnostic
						: configuration.stellarCandidate.compositionEquation,
					sceneId: scene.sceneId,
					cache: scene.cache,
					totalHorizontalIlluminance: scene.totalHorizontalIlluminance,
					displayModelId: displayModel.id,
					diagnosticColorId: diagnosticModel.id,
					generationId: scene.stellarGeneration.id,
					presentationIdentity: configuration.stellarCandidate.presentationIdentity,
				},
			);
			if (!scene.outputs) scene.outputs = {};
			scene.outputs[key] = upload;
		}
		sceneRecords.push(scene);
	}

	const fixedMemberTracks = buildFixedMemberTracks(configuration, sceneRecords);
	const transitionAnalysis = buildTransitionAnalysis(configuration, sceneRecords);
	const auditImages = new Map(sceneRecords.map((scene) => [
		scene.sceneId,
		buildAuditImage(scene, configuration.viewport.widthPixels, configuration.viewport.heightPixels),
	]));
	const figures = [
		{
			key: 'finalCompositeCadence',
			canvas: drawGridFigure(
				configuration,
				sceneRecords,
				[{label: 'final composite', image: (scene) => scene._internal.images.finalComposite}],
				'finalCompositeCadence',
				configuration.presentation.title,
				configuration.presentation.subtitle,
			),
			operation: 'Copy the eight full-resolution final-composite frames at 1:1 into the declared chronological row.',
		},
		{
			key: 'completeDecisionMatrix',
			canvas: drawGridFigure(
				configuration,
				sceneRecords,
				[
					{label: 'sky-only', image: (scene) => scene._internal.images.skyOnly},
					{label: 'normalized star diagnostic - non-final', image: (scene) => scene._internal.images.normalizedStarDiagnostic},
					{label: 'final composite', image: (scene) => scene._internal.images.finalComposite},
					{label: 'local contrast overlay - diagnostic', image: (scene) => scene._internal.images.localContrastOverlay},
				],
				'completeDecisionMatrix',
				'CR6 complete decision matrix',
				configuration.presentation.subtitle,
			),
			operation: 'Copy all 32 full-resolution scene/kind frames at 1:1 into the declared eight-column by four-row matrix.',
		},
		{
			key: 'fixedMemberOnsetLocalContrast',
			canvas: drawFixedMemberTrackFigure(configuration, fixedMemberTracks),
			operation: 'Plot report-only fixed-member exact-pixel display deltas across the six primary cadence scenes.',
		},
		{
			key: 'brightnessColorOrder',
			canvas: drawBrightnessColorFigure(configuration, fixedMemberTracks),
			operation: 'Plot pre-display transported brightness score against dark-scene display increment with transported spectral color.',
		},
		{
			key: 'transitionDifference',
			canvas: drawTransitionFigure(configuration, sceneRecords),
			operation: 'Place the consecutive-millisecond below/above frames, amplified differences, and eligibility diagnostics at native resolution.',
		},
		{
			key: 'eligibilityCollisionHorizonMaskAudit',
			canvas: drawGridFigure(
				configuration,
				sceneRecords,
				[{label: 'green eligible; yellow collision; red scene mask; magenta mismatch', image: (scene) => auditImages.get(scene.sceneId)}],
				'eligibilityCollisionHorizonMaskAudit',
				'Eligibility, collision, horizon, and mask audit',
				'Below-horizon and off-frame members are retained in the JSON ledger; only projected pixels can appear here.',
			),
			operation: 'Render the geometry, collision, screen-index representative, and whole-pixel scene-mask classifications without changing candidate visibility.',
		},
	];
	for (const figure of figures) {
		const artifactPath = configuration.outputs.figures[figure.key];
		await uploadImage(
			artifactPath,
			figure.canvas,
			{panelId: figure.key, role: 'CR6 declared figure', nativePanelPixels: configuration.presentation.nativePanelPixels},
			{
				operation: figure.operation,
				inputArtifacts: sceneRecords.flatMap(({outputs}) => Object.values(outputs)),
				layout: configuration.presentation.layout[figure.key],
				imageSmoothing: configuration.presentation.imageSmoothing,
			},
		);
		figure.canvas.remove();
	}
	requireCondition(
		exactJson(imageUploadOrder, configuration.outputs.requestedImageUploadOrder),
		'CR6 requested image upload order changed.',
	);
	await window.colorResetProgress('decision-plate-complete');

	for (const scene of sceneRecords) {
		const artifactsByKey = {};
		for (const payload of scene._internal.dataPayloads) {
			const artifactPath = perSceneDataPath(configuration, scene.sceneId, payload.key);
			const upload = await uploadBytes(artifactPath, payload.bytes, payload.contentType);
			uploadedDataArtifacts.push(upload);
			artifactsByKey[payload.key] = upload;
			dataDerivations.push({
				artifactPath,
				operation: payload.key === 'stellarScreenIndex'
					? 'Read the active production R16UI generation target and flip framebuffer rows to top-left order.'
					: payload.key === 'stellarPalette'
						? 'Read the active production entry-by-Native15 R32F palette in channel-major framebuffer order.'
						: payload.key === 'skyLinearRgbY'
							? 'Capture diagnostic mode zero: signed E8 sky RGB plus direct CIE photopic Y.'
							: 'Extract the whole-pixel R8 scene-hit mask from the geometry-owned capture target.',
				sceneId: scene.sceneId,
				generationId: scene.stellarGeneration.id,
				result: upload,
			});
		}
		scene.dataArtifacts = artifactsByKey;
		scene.sceneMask.artifact = artifactsByKey.sceneHitMask;
	}

	const memberLedgerEvidence = {
		schemaId: 'algorithm32-color-reset-cr6-member-ledger-v2',
		memberDomain: configuration.metrics.memberLedger.memberDomain,
		candidate: configuration.stellarCandidate,
		sourceIdentity: sceneRecords[0].stellarSource,
		scenes: sceneRecords.map((scene) => ({
			sceneId: scene.sceneId,
			timeIso: scene.timeIso,
			solarZenithDegrees: scene.solarZenithDegrees,
			cache: scene.cache,
			generationId: scene.stellarGeneration.id,
			gpuProjectionReadback: scene.stellarGeneration.memberProjectionReadback,
			summary: scene.memberLedgerSummary,
			members: scene.memberLedger,
		})),
		derivation: {
			projection: 'Authoritative one-member-per-point GPU vertex readback reuses the exact active stellar source texture, geometry contribution, and uniform objects. The CPU binary64 projection is retained only as a report-only residual diagnostic.',
			boundary: 'For each GPU-projected pixel and Native15 channel, canonical members are accumulated in ascending member order with acc = f32(acc + f32(sourceIrradiance) * f32(presentationScale)), matching the installed GLSL multiply-add recurrence.',
			palette: `The complete ${sceneRecords[0].stellarGeneration.layout.entryCapacity} by ${sceneRecords[0].stellarGeneration.layout.channelCount} R32F palette, including zero and nonrepresentative entries, is compared bit-for-bit against the GPU-grouped fused-recurrence expectation.`,
			transport: configuration.stellarCandidate.transportEquation,
			composition: configuration.stellarCandidate.compositionEquation,
			localBackground: configuration.metrics.localBackground,
		},
	};
	const memberLedgerUpload = await uploadJson(
		configuration.outputs.evidence.memberLedger,
		memberLedgerEvidence,
	);
	uploadedEvidence.push(memberLedgerUpload);
	const memberLedgerParentIdentity = {
		artifactPath: memberLedgerUpload.artifactPath,
		schemaId: memberLedgerEvidence.schemaId,
		byteLength: memberLedgerUpload.byteLength,
		sha256: memberLedgerUpload.sha256,
	};
	fixedMemberTracks.derivation = {
		parentMemberLedger: memberLedgerParentIdentity,
		selection:
			'Filter canonical members by authoritative GPU inside-viewport and above-horizon facts, whole-pixel scene visibility, and collision-free canonical representation in all eight scenes; candidate display values are not observed.',
		brightnessRanking:
			'Geometric mean of positive transported photopic one-pixel stellar luminance over the six main cadence scenes, sorted descending with member id as the deterministic tie break.',
		quartiles:
			'For zero-based brightness rank i among n fixed members, quartile = min(3, floor(i * 4 / n)).',
		onsets:
			'Encoded and robust onset are the first eligible main-cadence entries with maximum absolute encoded RGB delta at least one and two codes respectively.',
		resultSchemaId: fixedMemberTracks.schemaId,
	};
	const fixedMemberTracksUpload = await uploadJson(
		configuration.outputs.evidence.fixedMemberTracks,
		fixedMemberTracks,
	);
	uploadedEvidence.push(fixedMemberTracksUpload);
	transitionAnalysis.derivation = {
		parentMemberLedger: memberLedgerParentIdentity,
		belowSceneId: configuration.transitionBracket.belowSceneId,
		aboveSceneId: configuration.transitionBracket.aboveSceneId,
		operation:
			'Join all canonical members by member id across the consecutive-millisecond below/above ledgers; compare authoritative GPU pixels, individual eligibility, collision member ids, robust status, R32F palette packets, displayed deltas, complete R8 scene masks, and sky-only encoded RGB.',
		resultSchemaId: transitionAnalysis.schemaId,
	};
	const transitionAnalysisUpload = await uploadJson(
		configuration.outputs.evidence.transitionAnalysis,
		transitionAnalysis,
	);
	uploadedEvidence.push(transitionAnalysisUpload);
	const evidenceDerivations = {
		memberLedger: memberLedgerEvidence.derivation,
		fixedMemberTracks: fixedMemberTracks.derivation,
		transitionAnalysis: transitionAnalysis.derivation,
	};

	const canonicalCollisionMaximumRelativeDifference = Math.max(
		...sceneRecords.map(({memberLedgerSummary}) => memberLedgerSummary.canonicalCollisionMaximumRelativeDifference),
	);
	const sourceIdentities = new Set(sceneRecords.map(({stellarSource}) => stellarSource.identity));
	const starPositiveSunCoverageOverlapPixelCount = sceneRecords.reduce(
		(sum, scene) => sum + scene.stellarDiagnostics.starPositiveSunCoverageOverlapPixelCount,
		0,
	);
	const representativeMismatchCount = sceneRecords.reduce(
		(sum, scene) => sum + scene.memberLedgerSummary.representativeMismatchCount,
		0,
	);
	const orphanActualRepresentativePixelCount = sceneRecords.reduce(
		(sum, scene) => sum + scene.memberLedgerSummary.orphanActualRepresentativePixelCount,
		0,
	);
	const canonicalPaletteComparedScalarCount = sceneRecords.reduce(
		(sum, scene) => sum + scene.memberLedgerSummary.canonicalPaletteComparedScalarCount,
		0,
	);
	const canonicalPaletteBitMismatchCount = sceneRecords.reduce(
		(sum, scene) => sum + scene.memberLedgerSummary.canonicalPaletteBitMismatchCount,
		0,
	);
	const canonicalPaletteMaximumUlpDifference = Math.max(
		...sceneRecords.map((scene) => scene.memberLedgerSummary.canonicalPaletteMaximumUlpDifference),
	);
	const gpuProjectionOccupiedPixelSetMismatchCount = sceneRecords.reduce(
		(sum, scene) => sum + scene.memberLedgerSummary.gpuProjectionOccupiedPixelSetMismatchCount,
		0,
	);
	const gpuProjectionRepresentativeIndexMismatchCount = sceneRecords.reduce(
		(sum, scene) => sum + scene.memberLedgerSummary.gpuProjectionRepresentativeIndexMismatchCount,
		0,
	);
	const gpuProjectionNonfiniteValueCount = sceneRecords.reduce(
		(sum, scene) => sum + scene.memberLedgerSummary.gpuProjectionNonfiniteValueCount,
		0,
	);
	const gpuProjectionMemberCoverageCount = sceneRecords.reduce(
		(sum, scene) => sum + scene.memberLedgerSummary.gpuProjectionMemberCoverageCount,
		0,
	);
	const gpuProjectionGroupCount = sceneRecords.reduce(
		(sum, scene) => sum + scene.memberLedgerSummary.gpuProjectionGroupCount,
		0,
	);
	const candidateEvidence = {
		candidateId: configuration.stellarCandidate.id,
		presentationIdentity: STELLAR_ONE_PIXEL_PRESENTATION.id,
		pointResponse: configuration.stellarCandidate.pointResponse,
		collisionRepresentative: configuration.stellarCandidate.collisionRepresentative,
		collisionAccumulation: configuration.stellarCandidate.collisionAccumulation,
		runtimeVisibilityFactor: configuration.stellarCandidate.runtimeVisibilityFactor,
		equationIdentityExact:
			STELLAR_ONE_PIXEL_PRESENTATION.id === configuration.stellarCandidate.presentationIdentity &&
			STELLAR_ONE_PIXEL_PRESENTATION.irradianceToBoundaryRadianceScale ===
				configuration.stellarCandidate.irradianceToBoundaryRadianceScale &&
			sourceIdentities.size === 1,
		canonicalCollisionMaximumRelativeDifference,
		canonicalPaletteComparedScalarCount,
		canonicalPaletteBitMismatchCount,
		canonicalPaletteMaximumUlpDifference,
		canonicalPaletteBitExact: canonicalPaletteBitMismatchCount === 0,
		completePaletteComparedValueCount: canonicalPaletteComparedScalarCount,
		gpuProjectionOccupiedPixelSetMismatchCount,
		gpuProjectionRepresentativeIndexMismatchCount,
		gpuProjectionNonfiniteValueCount,
		gpuProjectionMemberCoverageCount,
		gpuProjectionGroupCount,
		representativeMismatchCount,
		orphanActualRepresentativePixelCount,
		starPositiveSunCoverageOverlapPixelCount,
		forbiddenPresentationInputsObserved: [],
	};
	const frozenColorEvidence = {
		modelId: displayModel.id,
		curve: displayModel.curve,
		curveExact: exactJson(displayModel.curve, expectedFrozenCurve(configuration)),
		sharedStarAndSkyEvaluation: true,
		extraExposureOrChromaticOperation: false,
	};
	const gpuSummary = {
		sceneCount: sceneRecords.length,
		apiValues: [...new Set(sceneRecords.map(({gpu}) => gpu.api))],
		rendererValues: [...new Set(sceneRecords.map(({gpu}) => gpu.renderer))],
		d3d11SceneCount: sceneRecords.filter(({gpu}) => gpu.d3d11).length,
		extColorBufferFloatEveryScene: sceneRecords.every(({gpu}) => gpu.extColorBufferFloat),
		contextLostAnyScene: sceneRecords.some(({gpu}) => gpu.contextLost),
		acquisitionWebglErrors: sceneRecords.flatMap(({gpu, sceneId}) =>
			gpu.modeErrors.flatMap(({mode, webglErrors}) => webglErrors.map((error) => ({sceneId, mode, error})))),
		replayErrors: sceneRecords.flatMap(({gpu, sceneId}) => gpu.replayErrors.map((error) => ({sceneId, error}))),
		terminalWebglErrors: sceneRecords.flatMap(({gpu, sceneId}) => gpu.terminalErrors.map((error) => ({sceneId, error}))),
		runtimeBuildCountByScene: sceneRecords.map(({sceneId}) => ({sceneId, count: 1})),
		diagnosticModeRenderCountByScene: sceneRecords.map(({sceneId, stellarDiagnostics}) => ({
			sceneId,
			count: stellarDiagnostics.modeRenderCount,
		})),
	};
	return {
		schemaId: RESULT_SCHEMA_ID,
		renderComplete: true,
		integrityGateEvaluated: false,
		scientificGateEvaluated: false,
		appearanceAccepted: false,
		ownerAppearanceReviewRequired: true,
		automaticCandidateSelection: false,
		productionClaim: false,
		allDeclaredImagesUploaded: uploadedImages.length === configuration.outputs.requestedImageUploadOrder.length,
		allDeclaredDataArtifactsUploaded: uploadedDataArtifacts.length === configuration.scenes.length * 4,
		allDeclaredBrowserEvidenceUploaded: uploadedEvidence.length === 3,
		claimBoundary: configuration.claimBoundary,
		candidateEvidence,
		frozenSkyDisplay: configuration.frozenSkyDisplay,
		frozenColorEvidence,
		sceneOrder: configuration.presentation.sceneOrder,
		scenes: sceneRecords.map(({_internal, ...scene}) => scene),
		fixedMemberTracks,
		transitionAnalysis,
		gpuSummary,
		requestedImageCount: configuration.outputs.requestedImageUploadOrder.length,
		uploadedImageCount: uploadedImages.length,
		imageUploadOrder,
		uploadedImages,
		uploadedDataArtifacts,
		uploadedEvidence,
		evidenceDerivations,
		panelIdentities,
		imageDerivations,
		dataDerivations,
		software: {browserUserAgent: navigator.userAgent, webCrypto: 'SubtleCrypto SHA-256'},
	};
}
