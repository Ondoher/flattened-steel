#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import * as THREE from 'three';

import {CanonicalAtmosphere} from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
	FIGURE1_DISPLAY_CONSTANTS,
} from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {FlatEarthGeometry} from '../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import {SphericalEarthGeometry} from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../candidate/src/algorithm32/quantities/index.js';
import {
	DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
	BrunetonExtraterrestrialVisibilityColorDisplayModel,
} from './BrunetonExtraterrestrialVisibilityColorDisplayModel.js';
import {
	deriveFiniteSourceIncidentIrradiance,
	deriveSourceLocalLuminance,
} from './SourceDerivedLocalLuminance.js';

const REPOSITORY_ROOT = path.resolve(
	fileURLToPath(new URL('../../../', import.meta.url)),
);
const EXPERIMENT_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial');
const RETAINED_RUN_ROOT = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'extraterrestrial',
	'runs',
	'000466-bruneton-source-luminance-lift-spherical-comparison',
);
const RETAINED_RUN_ID =
	'000466-bruneton-source-luminance-lift-spherical-comparison';
const RETAINED_ARTIFACT_SET_SHA256 =
	'62f912ac0fdbfac432b58e3c094a76a3a792f6afbda12de2ee6af7a5fddbd250';
const REC709_LUMINANCE = Object.freeze([0.2126, 0.7152, 0.0722]);
const SOURCE_EXPOSURE_CURVE = Object.freeze({
	brightThreshold: 5,
	darkThreshold: 0.001,
	maximumExposureGain: 131072,
});
const DISPLAY_SHOULDER_POWER = 8;
const RETAINED_ARTIFACTS = Object.freeze({
	'browser/config.json':
		'fd7d6772644ea810a7c331e92e85e53495cdf7ea9e252df8ee9eb466a21d54d7',
	'browser/sunset-plus-one-hour-matrix.u16':
		'e6d8296b3f12bc9bf5868369eadd8d84d12c1055c3d70b7cf3e98974bad3ebf9',
	'browser/sunset-plus-one-hour-palette.f32':
		'dcb3bd4923503da3259904bdacecf451dd3a3c1ed3c1dd991f78675f8630a6c9',
	'browser/sunset-plus-two-hours-matrix.u16':
		'0e5f8c2969f0cf779531ee4519ee594fbaa5c2a0ffebcb0be2b1d4bfac54f5d3',
	'browser/sunset-plus-two-hours-palette.f32':
		'90c94db9102616d4df92b4fcfcb6296720ca2bb569a916fb703872ff1bfebc82',
});

const distance = (value) => ({value, units: 'meters'});
const position = (coordinates) => ({coordinates, units: 'meters'});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function requireNear(actual, expected, tolerance, message) {
	requireCondition(
		Number.isFinite(actual)
			&& Number.isFinite(expected)
			&& Math.abs(actual - expected) <= tolerance,
		`${message}: expected ${expected}, received ${actual}.`,
	);
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function readJson(filePath) {
	return JSON.parse(readFileSync(filePath, 'utf8'));
}

function readVerifiedRetainedArtifact(manifest, relativePath) {
	const expectedSha256 = RETAINED_ARTIFACTS[relativePath];
	requireCondition(expectedSha256, `Unexpected retained artifact: ${relativePath}`);
	const record = manifest.artifacts.find(
		(artifact) => artifact.path === relativePath,
	);
	requireCondition(record, `Retained manifest omits ${relativePath}.`);
	requireCondition(
		record.sha256 === expectedSha256,
		`Retained manifest hash changed for ${relativePath}.`,
	);
	const bytes = readFileSync(path.join(RETAINED_RUN_ROOT, relativePath));
	requireCondition(
		bytes.byteLength === record.byteLength,
		`Retained artifact length changed for ${relativePath}.`,
	);
	requireCondition(
		sha256(bytes) === expectedSha256,
		`Retained artifact bytes changed for ${relativePath}.`,
	);
	return bytes;
}

function decodeUint16LittleEndian(bytes) {
	requireCondition(bytes.byteLength % 2 === 0, 'Uint16 artifact is misaligned.');
	const values = new Uint16Array(bytes.byteLength / 2);
	for (let index = 0; index < values.length; index += 1) {
		values[index] = bytes.readUInt16LE(index * 2);
	}
	return values;
}

function decodeFloat32LittleEndian(bytes) {
	requireCondition(bytes.byteLength % 4 === 0, 'Float32 artifact is misaligned.');
	const values = new Float32Array(bytes.byteLength / 4);
	for (let index = 0; index < values.length; index += 1) {
		values[index] = bytes.readFloatLE(index * 4);
	}
	return values;
}

function photopicLuminance(rgb) {
	return rgb.reduce(
		(sum, value, channel) => sum + value * REC709_LUMINANCE[channel],
		0,
	);
}

function displayBytes(rgb) {
	return rgb.map((value) => Math.round(Math.max(0, Math.min(1, value)) * 255));
}

function directionFromUpEastNorth(direction) {
	const [up, east, north] = direction;
	return new THREE.Vector3(east, north, up).normalize();
}

function configureSphericalCamera(camera, scene, observerHeightMeters) {
	camera.up.set(0, 1, 0);
	camera.position.set(0, observerHeightMeters, 0);
	const azimuth = THREE.MathUtils.degToRad(scene.viewAzimuthDegrees);
	const elevation = THREE.MathUtils.degToRad(scene.viewElevationDegrees);
	camera.lookAt(
		1000 * Math.sin(azimuth) * Math.cos(elevation),
		observerHeightMeters + 1000 * Math.sin(elevation),
		-1000 * Math.cos(azimuth) * Math.cos(elevation),
	);
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld(true);
}

function createRadiancePacket(values, provenanceIdentity) {
	return createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values,
		provenanceIdentity,
	});
}

function createColor(sourceDerivedLocalLuminance) {
	return new BrunetonExtraterrestrialVisibilityColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
		sourceDerivedLocalLuminance,
		sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
		extraterrestrialDisplayHeadroom:
			DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
	});
}

function viewDirectionForTopLeftPixel({
	camera,
	geometry,
	pixelIndex,
	width,
	height,
}) {
	const x = pixelIndex % width;
	const y = Math.floor(pixelIndex / width);
	const point = new THREE.Vector3(
		((x + 0.5) / width) * 2 - 1,
		1 - ((y + 0.5) / height) * 2,
		0.5,
	).unproject(camera);
	const sceneDirection = point.sub(camera.position).normalize();
	return geometry.mapObserverLocalSceneDirectionToModelDirection(
		sceneDirection.toArray(),
	);
}

function retainedStellarEntries({
	manifest,
	config,
	scene,
	sphericalFixture,
	sphericalGeometry,
	atmosphere,
}) {
	const product = config.products[scene.id];
	requireCondition(product, `Missing retained product for ${scene.id}.`);
	const matrix = decodeUint16LittleEndian(readVerifiedRetainedArtifact(
		manifest,
		`browser/${scene.id}-matrix.u16`,
	));
	const palette = decodeFloat32LittleEndian(readVerifiedRetainedArtifact(
		manifest,
		`browser/${scene.id}-palette.f32`,
	));
	requireCondition(
		matrix.length === product.viewport.width * product.viewport.height,
		`${scene.id} retained matrix shape changed.`,
	);
	requireCondition(
		palette.length === product.paletteEntryCount * 15,
		`${scene.id} retained palette shape changed.`,
	);

	const directionToSource = directionFromUpEastNorth(
		scene.directionToSourceUpEastNorth,
	);
	const geometry = new SphericalEarthGeometry({
		...sphericalGeometry,
		observerHeight: distance(sphericalFixture.camera.observerHeightMeters),
		observerUpDirection: [0, 0, 1],
		sceneFrame: {kind: 'observer-local'},
		directionToSource: directionToSource.toArray(),
		cacheAltitudeBinCount: 48,
	});
	const camera = new THREE.PerspectiveCamera(
		sphericalFixture.camera.verticalFovDegrees,
		product.viewport.width / product.viewport.height,
		0.1,
		400000,
	);
	configureSphericalCamera(
		camera,
		scene,
		sphericalFixture.camera.observerHeightMeters,
	);
	const receiver = position([
		0,
		0,
		sphericalGeometry.bottomRadius.value
			+ sphericalFixture.camera.observerHeightMeters,
	]);
	const sourceTransport = atmosphere.integrateOpticalDepth(
		geometry.resolveAtmospherePath({
			ray: {
				origin: receiver,
				direction: directionToSource.toArray(),
			},
		}),
	);
	const sourceLight = deriveSourceLocalLuminance({
		incidentIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY.values,
		transmittance: sourceTransport.transmittance.values,
	});
	const color = createColor(sourceLight.luminanceCdPerSquareMeter);
	const pixelByEntry = Array.from(
		{length: product.stellarPaletteEntryCount},
		() => [],
	);
	for (let pixelIndex = 0; pixelIndex < matrix.length; pixelIndex += 1) {
		const entry = matrix[pixelIndex];
		if (entry > 0 && entry < product.stellarPaletteEntryCount) {
			pixelByEntry[entry].push(pixelIndex);
		}
	}

	const entries = [];
	for (let entry = 1; entry < product.stellarPaletteEntryCount; entry += 1) {
		requireCondition(
			pixelByEntry[entry].length === 1,
			`${scene.id} stellar entry ${entry} is not one retained screen pixel.`,
		);
		const pixelIndex = pixelByEntry[entry][0];
		const direction = viewDirectionForTopLeftPixel({
			camera,
			geometry,
			pixelIndex,
			width: product.viewport.width,
			height: product.viewport.height,
		});
		const transport = atmosphere.integrateOpticalDepth(
			geometry.resolveAtmospherePath({
				ray: {origin: receiver, direction},
			}),
		);
		requireCondition(
			transport.blockedByGround === false,
			`${scene.id} retained stellar entry ${entry} became ground blocked.`,
		);
		const boundaryRadiance = Array.from(
			palette.slice(entry * 15, (entry + 1) * 15),
		);
		const transportedRadiance = boundaryRadiance.map(
			(value, channel) => value * transport.transmittance.values[channel],
		);
		const linearSrgb = color.radianceToLinearSrgb(createRadiancePacket(
			transportedRadiance,
			`${RETAINED_RUN_ID}:${scene.id}:stellar-entry-${entry}`,
		));
		const audit = color.auditExtraterrestrialLinearSrgb(linearSrgb);
		const outputPhotopicLuminance = photopicLuminance(
			audit.displayLinearSrgb,
		);
		entries.push({
			entry,
			pixelIndex,
			inputPhotopicLuminance: audit.inputPhotopicLuminance,
			mappedPhotopicLuminance: audit.mappedPhotopicLuminance,
			outputPhotopicLuminance,
			exposedPeak: audit.exposedPeak,
			headroomScale: audit.headroomScale,
			displayLinearSrgb: audit.displayLinearSrgb,
			displayBytes: displayBytes(audit.displayLinearSrgb),
		});
	}

	return {
		color,
		entries,
		sourceLight,
		sourceBlockedByGround: sourceTransport.blockedByGround,
	};
}

function countPhotopicOrderInversions(entries) {
	let comparisons = 0;
	let inversions = 0;
	for (let left = 0; left < entries.length; left += 1) {
		for (let right = left + 1; right < entries.length; right += 1) {
			const inputDifference = entries[left].inputPhotopicLuminance
				- entries[right].inputPhotopicLuminance;
			if (inputDifference === 0) continue;
			comparisons += 1;
			const outputDifference = entries[left].outputPhotopicLuminance
				- entries[right].outputPhotopicLuminance;
			if (Math.sign(inputDifference) !== Math.sign(outputDifference)) {
				inversions += 1;
			}
		}
	}
	return {comparisons, inversions};
}

function summarizeRetainedStellarEntries(sceneId, replay) {
	const {entries, color, sourceLight, sourceBlockedByGround} = replay;
	requireCondition(entries.length === 32, `${sceneId} no longer has 32 stars.`);
	requireCondition(sourceBlockedByGround, `${sceneId} source is no longer below ground.`);
	requireCondition(
		sourceLight.luminanceCdPerSquareMeter === 0,
		`${sceneId} source-local luminance is no longer exact zero.`,
	);
	requireCondition(
		color.exposureGain === SOURCE_EXPOSURE_CURVE.maximumExposureGain,
		`${sceneId} did not reach the common dark endpoint.`,
	);

	const order = countPhotopicOrderInversions(entries);
	requireCondition(order.comparisons > 0, `${sceneId} has no brightness comparisons.`);
	requireCondition(order.inversions === 0, `${sceneId} changed stellar brightness rank.`);
	const distinctRgb = new Set(entries.map((entry) => entry.displayBytes.join(',')));
	const exactWhiteCount = entries.filter(
		(entry) => entry.displayBytes.every((value) => value === 255),
	).length;
	const visibleCount = entries.filter(
		(entry) => Math.max(...entry.displayBytes) > 0,
	).length;
	const peakBytes = entries.map((entry) => Math.max(...entry.displayBytes));
	const maximumPeakByte = Math.max(...peakBytes);
	const continuousPeak = Math.max(
		...entries.flatMap((entry) => entry.displayLinearSrgb),
	);
	requireCondition(distinctRgb.size === 32, `${sceneId} collapsed retained RGB distinctions.`);
	requireCondition(exactWhiteCount === 0, `${sceneId} produced a white star.`);
	requireCondition(
		continuousPeak < DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
		`${sceneId} exhausted the fixed display headroom.`,
	);
	requireCondition(maximumPeakByte <= 242, `${sceneId} exceeded byte headroom.`);
	if (sceneId === 'sunset-plus-one-hour') {
		requireCondition(visibleCount === 32, 'The +1h retained set lost a visible star.');
		requireCondition(maximumPeakByte >= 230, 'The +1h retained peak is too dim.');
	}
	if (sceneId === 'sunset-plus-two-hours') {
		requireCondition(visibleCount >= 31, 'The +2h retained set lost too many visible stars.');
		requireCondition(maximumPeakByte >= 170, 'The +2h retained peak is too dim.');
	}

	return {
		sceneId,
		entryCount: entries.length,
		sourceDerivedLocalLuminance: sourceLight.luminanceCdPerSquareMeter,
		exposureGain: color.exposureGain,
		inputPhotopicLuminanceRange: [
			Math.min(...entries.map((entry) => entry.inputPhotopicLuminance)),
			Math.max(...entries.map((entry) => entry.inputPhotopicLuminance)),
		],
		outputPhotopicLuminanceRange: [
			Math.min(...entries.map((entry) => entry.outputPhotopicLuminance)),
			Math.max(...entries.map((entry) => entry.outputPhotopicLuminance)),
		],
		continuousPeak,
		maximumPeakByte,
		visibleCount,
		distinctRgbCount: distinctRgb.size,
		exactWhiteCount,
		photopicOrder: order,
	};
}

function auditCpuEquation(color, linearSrgb) {
	const audit = color.auditExtraterrestrialLinearSrgb(linearSrgb);
	if (audit.inputPhotopicLuminance === 0) {
		requireCondition(
			audit.displayLinearSrgb.every((value) => value === 0),
			'Zero CPU response was not exact zero.',
		);
		return audit;
	}
	const expectedMappedLuminance = 1 - Math.exp(
		-audit.inputPhotopicLuminance
			* color.displayConstants.paperFigure1ToneMapK
			* color.exposureGain,
	);
	requireNear(
		audit.mappedPhotopicLuminance,
		expectedMappedLuminance,
		1e-15,
		'CPU photopic response changed',
	);
	const expectedScale = expectedMappedLuminance / audit.inputPhotopicLuminance;
	const expectedExposed = audit.positiveLinearSrgb.map(
		(value) => value * expectedScale,
	);
	const expectedPeak = Math.max(...expectedExposed);
	const expectedHeadroomScale = (
		1 + (expectedPeak / DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM)
			** DISPLAY_SHOULDER_POWER
	) ** (-1 / DISPLAY_SHOULDER_POWER);
	for (let channel = 0; channel < 3; channel += 1) {
		requireNear(
			audit.exposedLinearSrgb[channel],
			expectedExposed[channel],
			1e-14,
			`CPU exposed channel ${channel} changed`,
		);
		requireNear(
			audit.displayLinearSrgb[channel],
			expectedExposed[channel] * expectedHeadroomScale,
			1e-14,
			`CPU display channel ${channel} changed`,
		);
	}
	return audit;
}

function auditShaderContract() {
	const color = createColor(0);
	const descriptor = color.describe();
	const identityMetadata =
		descriptor.displayConversion.metadata.extraterrestrialVisibility;
	const contribution = color.createShaderContribution({
		descriptor: {
			color: {
				fingerprint: 'cpu-smoke-color-descriptor',
				compatibilityTags: [],
			},
		},
	});
	const constants = contribution.functions.find(
		(block) => block.id
			=== 'color-bruneton-extraterrestrial-visibility-constants',
	);
	const compose = contribution.functions.find(
		(block) => block.id
			=== 'color-bruneton-extraterrestrial-visibility-compose',
	);
	const main = contribution.mainHooks.find(
		(block) => block.id === 'color-main-compose',
	);
	requireCondition(constants && compose && main, 'External-ledger shader blocks are incomplete.');
	const shaderConstant = (name) => {
		const match = constants.code.match(
			new RegExp(`const float ${name} = ([^;]+);`),
		);
		requireCondition(match, `Shader constant ${name} is missing.`);
		return Number(match[1]);
	};
	requireCondition(
		shaderConstant('SOURCE_DERIVED_EXPOSURE_GAIN')
			=== SOURCE_EXPOSURE_CURVE.maximumExposureGain
			&& shaderConstant('EXTRATERRESTRIAL_DISPLAY_HEADROOM')
				=== DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM
			&& shaderConstant('EXTRATERRESTRIAL_DISPLAY_SHOULDER_POWER')
				=== DISPLAY_SHOULDER_POWER,
		'Shader constants disagree with the CPU policy.',
	);
	requireCondition(
		compose.code.includes('spectralRadianceToLinearSrgb(state.pathRadiance)')
			&& compose.code.includes('spectralRadianceToLinearSrgb(state.celestialRadiance)')
			&& compose.code.includes('dot(')
			&& compose.code.includes('mappedExtraterrestrialLuminance')
			&& compose.code.includes('extraterrestrialHeadroomScale'),
		'Shader no longer implements the two-ledger photopic response.',
	);
	const externalSection = compose.code.slice(
		compose.code.indexOf('vec3 extraterrestrialLinearSrgb'),
	);
	requireCondition(
		!externalSection.includes('state.transmittance'),
		'Shader applies atmosphere transmittance twice to the external ledger.',
	);
	requireCondition(
		main.code === 'state.outputRgba = encodeBrunetonExtraterrestrialVisibility(state);',
		'Shader main hook no longer selects the external-ledger encoder.',
	);
	requireCondition(
		contribution.diagnostics.exposureGain === color.exposureGain
			&& contribution.diagnostics.extraterrestrialDisplayHeadroom
				=== DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
		'Shader diagnostics disagree with the CPU policy.',
	);
	requireCondition(
		identityMetadata.sourceDerivedLocalLuminance
			=== color.sourceDerivedLocalLuminance
			&& identityMetadata.exposureGain === color.exposureGain
			&& identityMetadata.displayHeadroom
				=== color.extraterrestrialDisplayHeadroom
			&& identityMetadata.displayShoulderPower
				=== DISPLAY_SHOULDER_POWER
			&& JSON.stringify(identityMetadata.sourceExposureCurve)
				=== JSON.stringify(SOURCE_EXPOSURE_CURVE),
		'Color identity metadata disagrees with the compiled policy.',
	);
	const configuredFingerprint = (configuration) =>
		new BrunetonExtraterrestrialVisibilityColorDisplayModel({
			displayConstants: FIGURE1_DISPLAY_CONSTANTS,
			sourceDerivedLocalLuminance:
				configuration.sourceDerivedLocalLuminance ?? 0,
			sourceExposureCurve: {
				...SOURCE_EXPOSURE_CURVE,
				...(configuration.sourceExposureCurve ?? {}),
			},
			extraterrestrialDisplayHeadroom:
				configuration.extraterrestrialDisplayHeadroom
					?? DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
		}).describe().fingerprint;
	const identityFingerprints = [
		descriptor.fingerprint,
		configuredFingerprint({sourceDerivedLocalLuminance: 0.0005}),
		configuredFingerprint({sourceExposureCurve: {brightThreshold: 6}}),
		configuredFingerprint({sourceExposureCurve: {darkThreshold: 0.0005}}),
		configuredFingerprint({sourceExposureCurve: {maximumExposureGain: 65536}}),
		configuredFingerprint({extraterrestrialDisplayHeadroom: 0.9}),
	];
	requireCondition(
		createColor(0).describe().fingerprint === descriptor.fingerprint
			&& new Set(identityFingerprints).size === identityFingerprints.length,
		'Color compatibility identity omits a material configuration input.',
	);

	return {
		contributionId: contribution.id,
		colorFingerprint: descriptor.fingerprint,
		identityVariantCount: identityFingerprints.length,
		exposureGain: contribution.diagnostics.exposureGain,
		displayHeadroom:
			contribution.diagnostics.extraterrestrialDisplayHeadroom,
		responseCoordinate:
			contribution.diagnostics.extraterrestrialResponseCoordinate,
		composition: contribution.diagnostics.composition,
	};
}

function auditZeroAndBoundedCpuBehavior() {
	const color = createColor(0);
	const baseLinearSrgb = [-0.25, 0.5, 1000];
	const expectedBruneton = color.linearSrgbToDisplayRgb(baseLinearSrgb);
	const composed = color.composeExtraterrestrialVisibilityDisplayRgb({
		baseLinearSrgb,
		extraterrestrialLinearSrgb: [0, 0, 0],
	});
	for (let channel = 0; channel < 3; channel += 1) {
		requireCondition(
			Object.is(composed[channel], expectedBruneton[channel]),
			`Zero external channel ${channel} changed exact Bruneton output.`,
		);
	}

	const cases = [
		[0, 0, 0],
		[-1, 2, -3],
		[1e-12, 2e-12, 3e-12],
		[1, 1, 1],
		[1e20, 2e20, 3e20],
	];
	const audits = cases.map((sample) => auditCpuEquation(color, sample));
	for (const audit of audits) {
		requireCondition(
			audit.displayLinearSrgb.every(
				(value) => Number.isFinite(value)
					&& value >= 0
					&& value < DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
			),
			'CPU external response is not finite and headroom bounded.',
		);
	}

	return {
		exactZeroBruneton: composed,
		boundedCaseCount: audits.length,
		maximumBoundedChannel: Math.max(
			...audits.flatMap((audit) => audit.displayLinearSrgb),
		),
	};
}

function auditSameChromaLadder() {
	const color = createColor(0);
	const chroma = [0.8, 0.5, 0.2];
	const scales = [0.00001, 0.0001, 0.001, 0.003, 0.01, 0.03, 0.1];
	const ladder = scales.map((scale) => {
		const input = chroma.map((value) => value * scale);
		const audit = auditCpuEquation(color, input);
		return {
			scale,
			outputPhotopicLuminance: photopicLuminance(audit.displayLinearSrgb),
			displayLinearSrgb: audit.displayLinearSrgb,
		};
	});
	for (let index = 1; index < ladder.length; index += 1) {
		requireCondition(
			ladder[index].outputPhotopicLuminance
				> ladder[index - 1].outputPhotopicLuminance,
			'Same-chroma brightness ladder is not strictly monotone.',
		);
	}
	const inputGreenToRed = chroma[1] / chroma[0];
	const inputBlueToRed = chroma[2] / chroma[0];
	for (const rung of ladder) {
		requireNear(
			rung.displayLinearSrgb[1] / rung.displayLinearSrgb[0],
			inputGreenToRed,
			2e-15,
			'Same-chroma green/red ratio changed',
		);
		requireNear(
			rung.displayLinearSrgb[2] / rung.displayLinearSrgb[0],
			inputBlueToRed,
			2e-15,
			'Same-chroma blue/red ratio changed',
		);
	}

	return {
		rungCount: ladder.length,
		inputChroma: chroma,
		outputPhotopicLuminance: ladder.map(
			(rung) => rung.outputPhotopicLuminance,
		),
	};
}

function auditFlat180({fixture, atmosphere}) {
	const state = fixture.states.find((candidate) => candidate.id === 'flat-180');
	requireCondition(state, 'Flat 180 fixture state is missing.');
	const source = {...fixture.source, centerMeters: state.centerMeters};
	const observerMeters = [0, 0, 5];
	const geometry = new FlatEarthGeometry({
		observerPosition: position(observerMeters),
		sourcePosition: position(source.centerMeters),
		topAltitude: distance(fixture.geometry.topAltitudeMeters),
		cacheRadialMaximum: distance(state.cacheRadialMaximumMeters),
		sceneSkyRayLimit: distance(
			fixture.geometry.observerDomeMaxViewRayMeters,
		),
		observerCenteredDome: {
			centerPolicy: 'observer-centered',
			apexAltitude: distance(fixture.geometry.observerDomeApexMeters),
			maxObserverViewRayExtent: distance(
				fixture.geometry.observerDomeMaxViewRayMeters,
			),
		},
	});
	const toSource = source.centerMeters.map(
		(value, index) => value - observerMeters[index],
	);
	const sourceDistanceMeters = Math.hypot(...toSource);
	const directionToSource = toSource.map(
		(value) => value / sourceDistanceMeters,
	);
	const sourceTransport = atmosphere.integrateOpticalDepth(
		geometry.resolveAtmospherePath({
			ray: {
				origin: position(observerMeters),
				direction: directionToSource,
			},
			endDistance: distance(sourceDistanceMeters - source.radiusMeters),
		}),
	);
	requireCondition(!sourceTransport.blockedByGround, 'Flat 180 source became blocked.');
	const incident = deriveFiniteSourceIncidentIrradiance({
		surfaceRadiance: source.surfaceRadianceValues,
		radiusMeters: source.radiusMeters,
		distanceMeters: sourceDistanceMeters,
	});
	const sourceLight = deriveSourceLocalLuminance({
		incidentIrradiance: incident.values,
		transmittance: sourceTransport.transmittance.values,
	});
	const color = createColor(sourceLight.luminanceCdPerSquareMeter);
	requireCondition(color.exposureGain === 1, 'Flat 180 is not on exact gain one.');
	requireNear(
		sourceLight.luminanceCdPerSquareMeter,
		79.7074846684,
		1e-9,
		'Flat 180 source-derived luminance changed',
	);
	const transportedSurfaceRadiance = source.surfaceRadianceValues.map(
		(value, channel) => value * sourceTransport.transmittance.values[channel],
	);
	const inputLinearSrgb = color.radianceToLinearSrgb(createRadiancePacket(
		transportedSurfaceRadiance,
		'union-glacier-flat-local-flat-180-transported-source',
	));
	const audit = auditCpuEquation(color, inputLinearSrgb);
	const output = audit.displayLinearSrgb;
	requireCondition(
		inputLinearSrgb[0] > inputLinearSrgb[1]
			&& inputLinearSrgb[1] > inputLinearSrgb[2],
		'Flat 180 transported source is no longer warm.',
	);
	for (const channel of output) {
		requireCondition(
			channel >= 0
				&& channel < DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
			'Flat 180 source exhausted display headroom.',
		);
	}
	const inputRatios = [
		inputLinearSrgb[1] / inputLinearSrgb[0],
		inputLinearSrgb[2] / inputLinearSrgb[0],
	];
	const outputRatios = [output[1] / output[0], output[2] / output[0]];
	requireNear(outputRatios[0], inputRatios[0], 2e-15, 'Flat 180 green/red ratio changed');
	requireNear(outputRatios[1], inputRatios[1], 2e-15, 'Flat 180 blue/red ratio changed');
	requireCondition(outputRatios[0] < 0.5, 'Flat 180 green/red ratio is no longer warm.');
	requireCondition(outputRatios[1] < 0.11, 'Flat 180 blue/red ratio is no longer warm.');
	const bytes = displayBytes(output);
	requireCondition(bytes[0] >= 240 && bytes[0] <= 242, 'Flat 180 red headroom changed.');
	requireCondition(!bytes.every((value) => value === 255), 'Flat 180 source became white.');

	return {
		sourceDerivedLocalLuminance: sourceLight.luminanceCdPerSquareMeter,
		exposureGain: color.exposureGain,
		inputLinearSrgb,
		inputPhotopicLuminance: audit.inputPhotopicLuminance,
		mappedPhotopicLuminance: audit.mappedPhotopicLuminance,
		exposedLinearSrgb: audit.exposedLinearSrgb,
		headroomScale: audit.headroomScale,
		displayLinearSrgb: output,
		displayBytes: bytes,
		inputGreenToRed: inputRatios[0],
		inputBlueToRed: inputRatios[1],
		outputGreenToRed: outputRatios[0],
		outputBlueToRed: outputRatios[1],
	};
}

/**
 * Execute the CPU-only self-verifying proof. It reads sealed evidence but does
 * not allocate a run, write an artifact, construct Algorithm32, or start WebGL.
 */
export function smokeBrunetonExtraterrestrialVisibilityColor() {
	const manifestPath = path.join(RETAINED_RUN_ROOT, 'artifact-manifest.json');
	const manifestBytes = readFileSync(manifestPath);
	const manifest = JSON.parse(manifestBytes.toString('utf8'));
	requireCondition(manifest.runId === RETAINED_RUN_ID, 'Retained run id changed.');
	requireCondition(manifest.conclusion === 'accepted', 'Retained run is not sealed accepted evidence.');
	requireCondition(
		manifest.artifactSetSha256 === RETAINED_ARTIFACT_SET_SHA256,
		'Retained artifact-set identity changed.',
	);
	const config = JSON.parse(
		readVerifiedRetainedArtifact(manifest, 'browser/config.json').toString('utf8'),
	);
	const sphericalFixturePath = path.join(
		EXPERIMENT_ROOT,
		'fixtures',
		'subjective-globe-context-scenes-v1.json',
	);
	const sphericalGeometryPath = path.join(
		EXPERIMENT_ROOT,
		'fixtures',
		'g4-cpu-sun-disk-transport-v1.json',
	);
	const flatFixturePath = path.join(
		EXPERIMENT_ROOT,
		'fixtures',
		'union-glacier-flat-local-closest-approach-v1.json',
	);
	const sphericalFixture = readJson(sphericalFixturePath);
	const sphericalGeometryFixture = readJson(sphericalGeometryPath);
	const flatFixture = readJson(flatFixturePath);
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const retained = ['sunset-plus-one-hour', 'sunset-plus-two-hours'].map(
		(sceneId) => {
			const scene = config.scenes.find((candidate) => candidate.id === sceneId);
			requireCondition(scene, `Retained scene ${sceneId} is missing.`);
			return summarizeRetainedStellarEntries(sceneId, retainedStellarEntries({
				manifest,
				config,
				scene,
				sphericalFixture,
				sphericalGeometry: sphericalGeometryFixture.geometry,
				atmosphere,
			}));
		},
	);
	const cpu = auditZeroAndBoundedCpuBehavior();
	const sameChroma = auditSameChromaLadder();
	const shader = auditShaderContract();
	const flat180 = auditFlat180({fixture: flatFixture, atmosphere});

	return {
		smokeId: 'bruneton-extraterrestrial-visibility-color-cpu-smoke-v1',
		accepted: true,
		equation: {
			input: 'R=max(linearRGB(already-transported celestial radiance),0)',
			photopicLuminance: 'Y=dot(R,[0.2126,0.7152,0.0722])',
			mappedLuminance: 'Ym=1-exp(-K*G*Y)',
			exposedRgb: 'A=R*(Ym/Y)',
			headroom: 'S=(1+(max(A)/H)^8)^(-1/8); E=A*S',
			composition: 'D=B+(1-B)*E',
		},
		parameters: {
			sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
			displayHeadroom: DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
			displayShoulderPower: DISPLAY_SHOULDER_POWER,
		},
		retainedSource: {
			runId: RETAINED_RUN_ID,
			artifactSetSha256: RETAINED_ARTIFACT_SET_SHA256,
			manifestSha256: sha256(manifestBytes),
			verifiedArtifacts: Object.entries(RETAINED_ARTIFACTS).map(
				([artifactPath, artifactSha256]) => ({
					path: artifactPath,
					sha256: artifactSha256,
				}),
			),
		},
		fixtureIdentities: {
			sphericalPresentation: {
				path: path.relative(REPOSITORY_ROOT, sphericalFixturePath).replaceAll('\\', '/'),
				sha256: sha256(readFileSync(sphericalFixturePath)),
			},
			sphericalGeometry: {
				path: path.relative(REPOSITORY_ROOT, sphericalGeometryPath).replaceAll('\\', '/'),
				sha256: sha256(readFileSync(sphericalGeometryPath)),
			},
			flatPresentation: {
				path: path.relative(REPOSITORY_ROOT, flatFixturePath).replaceAll('\\', '/'),
				sha256: sha256(readFileSync(flatFixturePath)),
			},
		},
		cpu,
		shader,
		sameChroma,
		retained,
		flat180,
	};
}

const invokedDirectly = process.argv[1]
	&& pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
	process.stdout.write(
		`${JSON.stringify(smokeBrunetonExtraterrestrialVisibilityColor(), null, 2)}\n`,
	);
}
