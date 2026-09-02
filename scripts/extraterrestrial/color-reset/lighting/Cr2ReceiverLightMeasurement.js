import {ReceiverEnvironmentLightTransportSampler} from '../controls/production-v1/src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportSampler.js';
import {RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE} from '../controls/production-v1/src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightQuadrature.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../controls/production-v1/src/algorithm32/spectral-values/index.js';
import {
	CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE,
	CR2_RECEIVER_DIFFUSE_ROTATED_QUADRATURE,
} from './Cr2ReceiverDiffuseQuadrature.js';
import {Cr2ReceiverDiffuseTransportSampler} from './Cr2ReceiverDiffuseTransportSampler.js';

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function packetWithProvenance(packet, provenanceIdentity) {
	return /** @type {SpectralIrradiancePacket} */ (new SpectralPacket({
		basis: packet.basis,
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		semantics: packet.semantics,
		values: packet.values,
		provenanceIdentity,
	}));
}

function scaleIrradiance(packet, scale, provenanceIdentity) {
	requireCondition(Number.isFinite(scale) && scale >= 0, 'CR2 irradiance scale must be finite and nonnegative.');
	return /** @type {SpectralIrradiancePacket} */ (new SpectralPacket({
		basis: packet.basis,
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		semantics: packet.semantics,
		values: packet.values.map((value) => value * scale),
		provenanceIdentity,
	}));
}

function addIrradiance(left, right, provenanceIdentity) {
	SpectralPacket.assertCompatible(left, right, {
		sameQuantity: true,
		sameUnits: true,
		sameSemantics: true,
	});
	return /** @type {SpectralIrradiancePacket} */ (new SpectralPacket({
		basis: left.basis,
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		semantics: left.semantics,
		values: left.values.map((value, index) => value + right.values[index]),
		provenanceIdentity,
	}));
}

function reduceRadiances(calculator, radiances, samples, provenanceIdentity) {
	requireCondition(radiances.length === samples.length, 'CR2 diffuse radiance/quadrature counts differ.');
	const reduced = calculator.measureEnvironmentIrradiance({
		samples: radiances.map((spectralRadiance, index) => ({
			spectralRadiance,
			irradianceWeightSteradians: samples[index].irradianceWeightSteradians,
		})),
	});
	return packetWithProvenance(reduced, provenanceIdentity);
}

function photopicRecord(calculator, packet) {
	const result = calculator.measureDirectIrradiance(packet);
	return {
		illuminance: {...result.photopicDirectIlluminance},
		equivalentLuminance: {...result.adaptingLuminanceProxy},
	};
}

function packetRecord(packet) {
	return packet.toJSON();
}

function basisRecord(basis) {
	return {
		contentHash: basis.contentHash,
		semantics: basis.semantics,
		channelCount: basis.channelCount,
		channels: basis.channels.map((channel) => ({
			name: channel.name,
			center: {...channel.center},
			width: {...channel.width},
		})),
	};
}

function maximumDifference(left, right) {
	requireCondition(left.length === right.length, 'CR2 comparison vectors differ in length.');
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
	return {maximumAbsoluteDifference, maximumRelativeDifference, differingValueCount};
}

function compareRadianceBatches(left, right) {
	requireCondition(left.length === right.length, 'CR2 radiance batches differ in length.');
	let maximumAbsoluteDifference = 0;
	let maximumRelativeDifference = 0;
	let differingValueCount = 0;
	for (let index = 0; index < left.length; index += 1) {
		const difference = maximumDifference(left[index].values, right[index].values);
		maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, difference.maximumAbsoluteDifference);
		maximumRelativeDifference = Math.max(maximumRelativeDifference, difference.maximumRelativeDifference);
		differingValueCount += difference.differingValueCount;
	}
	return {
		population: left.length * left[0].values.length,
		maximumAbsoluteDifference,
		maximumRelativeDifference,
		differingValueCount,
	};
}

function symmetricRelativeDifference(left, right) {
	const denominator = Math.abs(left) + Math.abs(right);
	return denominator === 0 ? 0 : 2 * Math.abs(left - right) / denominator;
}

function rotationSensitivity(primary, rotated, calculator, significanceFloor) {
	const channels = primary.values.map((primaryValue, index) => {
		const rotatedValue = rotated.values[index];
		const meanValue = 0.5 * (Math.abs(primaryValue) + Math.abs(rotatedValue));
		return {
			channelIndex: index,
			primaryValue,
			rotatedValue,
			meanValue,
			absoluteDifference: Math.abs(primaryValue - rotatedValue),
			symmetricRelativeDifference: symmetricRelativeDifference(primaryValue, rotatedValue),
			significant: meanValue >= significanceFloor,
		};
	});
	const primaryPhotopic = photopicRecord(calculator, primary);
	const rotatedPhotopic = photopicRecord(calculator, rotated);
	return {
		channels,
		photopic: {
			primaryLux: primaryPhotopic.illuminance.value,
			rotatedLux: rotatedPhotopic.illuminance.value,
			symmetricRelativeDifference: symmetricRelativeDifference(
				primaryPhotopic.illuminance.value,
				rotatedPhotopic.illuminance.value,
			),
		},
	};
}

function flattenPrimaryRadiances(radiances) {
	const channelCount = radiances[0].values.length;
	const bytes = new Uint8Array(radiances.length * channelCount * 4);
	const view = new DataView(bytes.buffer);
	let byteOffset = 0;
	for (const radiance of radiances) {
		for (const value of radiance.values) {
			view.setFloat32(byteOffset, value, true);
			byteOffset += 4;
		}
	}
	return bytes;
}

function observerUpAndSourceProjection(model) {
	const observerPosition = model.geometry.resolveViewRaySegment({direction: [0, 0, 1]}).ray.origin;
	const coordinates = observerPosition.coordinates;
	const length = Math.hypot(...coordinates);
	const localUp = length > 0 ? coordinates.map((value) => value / length) : [0, 0, 1];
	const sourceRelativePosition = model.geometry.resolveSourceRelativePosition({position: observerPosition});
	const directSample = model.lightSource.sampleDirectLighting({sourceRelativePosition});
	const cosine = directSample.directionToLight.reduce(
		(sum, value, index) => sum + value * localUp[index],
		0,
	);
	return {
		observerPosition,
		localUp,
		directionToLight: [...directSample.directionToLight],
		sourceCenterCosineToLocalUp: cosine,
		horizontalProjectionFactor: Math.max(0, cosine),
		sourceCenterElevationDegrees: Math.asin(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI,
	};
}

/**
 * Measure direct-normal, projected-horizontal direct, diffuse-horizontal, and
 * total-horizontal receiver light without publishing an adapting luminance or
 * changing the installed Color model.
 */
export async function measureCr2ReceiverLight({
	THREE,
	renderer,
	backend,
	algorithm32,
	handle,
	sceneId,
	cacheIdentity,
	stability,
}) {
	const model = algorithm32._model;
	const calculator = algorithm32._localLightLevelCalculator;
	const scatteringCache = handle._buildResult?.scatteringCache;
	requireCondition(model && calculator, 'CR2 requires the installed Algorithm32 physical model.');
	requireCondition(scatteringCache, 'CR2 requires an installed scattering cache.');
	const acceptedConfig = algorithm32.config;
	const colorBefore = {
		configVersion: acceptedConfig.version,
		colorId: acceptedConfig.config.color.id,
		brightnessProxy: {...algorithm32.brightnessProxy},
	};
	const directLevel = calculator.measureConfiguredDirectSource({
		geometry: model.geometry,
		atmosphere: model.atmosphere,
		observation: acceptedConfig.config.observation,
		celestialSources: model.celestialSources,
	});
	const directNormal = directLevel.directSpectralIrradiance;
	const sourceProjection = observerUpAndSourceProjection(model);
	const directHorizontal = scaleIrradiance(
		directNormal,
		sourceProjection.horizontalProjectionFactor,
		`color-reset-cr2-direct-horizontal:${directNormal.contentHash}:${sourceProjection.horizontalProjectionFactor}`,
	);

	const measurementModel = Object.create(model);
	Object.defineProperty(measurementModel, 'celestialSources', {value: null, enumerable: true});
	const primarySampler = new Cr2ReceiverDiffuseTransportSampler({
		THREE,
		renderer,
		backend,
		model: measurementModel,
		scatteringCache,
		quadrature: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE,
	});
	const rotatedSampler = new Cr2ReceiverDiffuseTransportSampler({
		THREE,
		renderer,
		backend,
		model: measurementModel,
		scatteringCache,
		quadrature: CR2_RECEIVER_DIFFUSE_ROTATED_QUADRATURE,
	});
	const primarySample = await primarySampler.sample();
	const repeatSample = await primarySampler.sample();
	const rotatedSample = await rotatedSampler.sample();
	const diffusePrimary = reduceRadiances(
		calculator,
		primarySample.radiances,
		CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.samples,
		`color-reset-cr2-diffuse-horizontal:${sceneId}:${CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.id}`,
	);
	const diffuseRepeat = reduceRadiances(
		calculator,
		repeatSample.radiances,
		CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.samples,
		`color-reset-cr2-diffuse-horizontal-repeat:${sceneId}:${CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.id}`,
	);
	const diffuseRotated = reduceRadiances(
		calculator,
		rotatedSample.radiances,
		CR2_RECEIVER_DIFFUSE_ROTATED_QUADRATURE.samples,
		`color-reset-cr2-diffuse-horizontal-rotated:${sceneId}:${CR2_RECEIVER_DIFFUSE_ROTATED_QUADRATURE.id}`,
	);
	const canonicalSampler = new ReceiverEnvironmentLightTransportSampler({
		THREE,
		renderer,
		backend,
		model: measurementModel,
		scatteringCache,
	});
	const canonicalRadiances = await canonicalSampler.sample();
	const diffuseCanonical32 = reduceRadiances(
		calculator,
		canonicalRadiances,
		RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE,
		`color-reset-cr2-diffuse-horizontal-production32:${sceneId}`,
	);
	const totalHorizontal = addIrradiance(
		directHorizontal,
		diffusePrimary,
		`color-reset-cr2-total-horizontal:${sceneId}:${directHorizontal.contentHash}:${diffusePrimary.contentHash}`,
	);
	const colorAfter = {
		configVersion: algorithm32.config.version,
		colorId: algorithm32.config.config.color.id,
		brightnessProxy: {...algorithm32.brightnessProxy},
	};
	const directPhotopic = photopicRecord(calculator, directNormal);
	const directHorizontalPhotopic = photopicRecord(calculator, directHorizontal);
	const diffusePhotopic = photopicRecord(calculator, diffusePrimary);
	const totalPhotopic = photopicRecord(calculator, totalHorizontal);
	return {
		rawPrimaryBytes: flattenPrimaryRadiances(primarySample.radiances),
		publicResult: {
			schemaId: 'algorithm32-color-reset-cr2-scene-measurement-v1',
			sceneId,
			cacheIdentity,
			spectralBasis: basisRecord(directNormal.basis),
			orientation: {
				directNormal: 'plane normal to source-center direction',
				directHorizontal: 'local horizontal plane through center-direction projection',
				diffuseHorizontal: 'local horizontal plane through upper-hemisphere cosine integral',
				totalHorizontal: 'direct-horizontal plus diffuse-horizontal',
				...sourceProjection,
				observerPosition: {
					coordinates: [...sourceProjection.observerPosition.coordinates],
					units: sourceProjection.observerPosition.units,
				},
			},
			packets: {
				directNormal: packetRecord(directNormal),
				directHorizontal: packetRecord(directHorizontal),
				diffuseHorizontal: packetRecord(diffusePrimary),
				totalHorizontal: packetRecord(totalHorizontal),
				diffuseRepeat: packetRecord(diffuseRepeat),
				diffuseRotated: packetRecord(diffuseRotated),
				diffuseProduction32: packetRecord(diffuseCanonical32),
			},
			photopic: {
				directNormal: directPhotopic,
				directHorizontal: directHorizontalPhotopic,
				diffuseHorizontal: diffusePhotopic,
				totalHorizontal: totalPhotopic,
				currentDirectSourceProxy: colorBefore.brightnessProxy,
				directProxyAbsoluteDifference:
					Math.abs(directPhotopic.equivalentLuminance.value - colorBefore.brightnessProxy.value),
			},
			quadrature: {
				primary: {
					id: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.id,
					sampleCount: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.sampleCount,
					muSampleCount: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.muSampleCount,
					azimuthSampleCount: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.azimuthSampleCount,
					lowestElevationDegrees: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.lowestElevationDegrees,
					weightSumSteradians: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.weightSumSteradians,
					shaderSourceHash: primarySample.shaderSourceHash,
				},
				rotated: {
					id: CR2_RECEIVER_DIFFUSE_ROTATED_QUADRATURE.id,
					sampleCount: CR2_RECEIVER_DIFFUSE_ROTATED_QUADRATURE.sampleCount,
					weightSumSteradians: CR2_RECEIVER_DIFFUSE_ROTATED_QUADRATURE.weightSumSteradians,
					shaderSourceHash: rotatedSample.shaderSourceHash,
				},
				productionCrossCheck: {
					id: 'algorithm32-receiver-environment-light-cosine-hammersley-32-v1',
					sampleCount: RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length,
				},
			},
			stability: {
				rawPrimaryRepeat: compareRadianceBatches(primarySample.radiances, repeatSample.radiances),
				integratedPrimaryRepeat: maximumDifference(diffusePrimary.values, diffuseRepeat.values),
				rotation: rotationSensitivity(
					diffusePrimary,
					diffuseRotated,
					calculator,
					stability.rotationChannelSignificanceFloor,
				),
				production32VsPrimary: maximumDifference(diffuseCanonical32.values, diffusePrimary.values),
			},
			colorState: {
				before: colorBefore,
				after: colorAfter,
				unchanged: JSON.stringify(colorBefore) === JSON.stringify(colorAfter),
			},
		},
	};
}
