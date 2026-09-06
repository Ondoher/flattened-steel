import {NATIVE_15_SPECTRAL_BASIS} from '../controls/production-v1/src/algorithm32/profiles/native-15/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket,
} from '../controls/production-v1/src/algorithm32/spectral-values/index.js';
import {CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE} from './Cr2ReceiverDiffuseQuadrature.js';

/** One wavelength-independent, dimensionless neutral Lambertian reflectance. */
export const CR3_NEUTRAL_LAMBERTIAN_REFLECTANCE = 0.18;

/** Exact accepted Native15 basis identity used by CR2 and CR3. */
export const CR3_NATIVE15_BASIS_HASH = NATIVE_15_SPECTRAL_BASIS.contentHash;

const CHANNEL_COUNT = NATIVE_15_SPECTRAL_BASIS.channelCount;
const DIRECTION_COUNT = CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.sampleCount;
const RAW_BYTE_LENGTH = DIRECTION_COUNT * CHANNEL_COUNT * Float32Array.BYTES_PER_ELEMENT;
const SOLID_ANGLE_WEIGHT_STERADIANS =
	2 * Math.PI /
	(CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.muSampleCount *
		CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.azimuthSampleCount);
const UP_SCENE = Object.freeze([0, 1, 0]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function requireFiniteVector(values, count, label) {
	if ((!Array.isArray(values) && !ArrayBuffer.isView(values)) || values.length !== count) {
		throw new RangeError(`${label} must contain exactly ${count} values.`);
	}
	const copy = Array.from(values);
	if (!copy.every(Number.isFinite)) throw new TypeError(`${label} values must be finite.`);
	return copy;
}

function requireNonnegativeVector(values, count, label) {
	const copy = requireFiniteVector(values, count, label);
	if (copy.some((value) => value < 0)) throw new RangeError(`${label} values must be nonnegative.`);
	return copy;
}

function normalizeDirection(direction, label) {
	const copy = requireFiniteVector(direction, 3, label);
	const length = Math.hypot(...copy);
	if (!(length > 0)) throw new RangeError(`${label} must have nonzero length.`);
	return Object.freeze(copy.map((value) => value / length));
}

function dot(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function acceptSceneToModelBasis(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError('CR3 lighting requires a scene-to-model direction basis.');
	}
	const basis = Object.freeze({
		x: normalizeDirection(value.x, 'CR3 scene-to-model X axis'),
		y: normalizeDirection(value.y, 'CR3 scene-to-model Y axis'),
		z: normalizeDirection(value.z, 'CR3 scene-to-model Z axis'),
	});
	const pairwiseDots = [dot(basis.x, basis.y), dot(basis.x, basis.z), dot(basis.y, basis.z)];
	if (pairwiseDots.some((entry) => Math.abs(entry) > 1e-12)) {
		throw new RangeError('CR3 scene-to-model direction basis must be orthonormal.');
	}
	return basis;
}

function mapSceneDirectionToModel(directionScene, basis, label) {
	const scene = normalizeDirection(directionScene, label);
	return normalizeDirection([
		scene[0] * basis.x[0] + scene[1] * basis.y[0] + scene[2] * basis.z[0],
		scene[0] * basis.x[1] + scene[1] * basis.y[1] + scene[2] * basis.z[1],
		scene[0] * basis.x[2] + scene[1] * basis.y[2] + scene[2] * basis.z[2],
	], label + ' mapped to model');
}

function scaled(values, scale) {
	return values.map((value) => value * scale);
}

function added(left, right) {
	return left.map((value, index) => value + right[index]);
}

function maximumDifference(left, right) {
	requireCondition(left.length === right.length, 'CR3 comparison vectors must have equal length.');
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

function irradiancePacket(values, provenanceIdentity) {
	return /** @type {SpectralIrradiancePacket} */ (new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		values,
		provenanceIdentity,
	}));
}

function radiancePacket(values, provenanceIdentity) {
	return /** @type {SpectralRadiancePacket} */ (new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		values,
		provenanceIdentity,
	}));
}

function bytesView(value) {
	if (value instanceof Uint8Array) {
		return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
	}
	if (value instanceof ArrayBuffer) return new Uint8Array(value);
	if (ArrayBuffer.isView(value)) {
		return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
	}
	throw new TypeError('CR3 raw CR2 diffuse field must be an ArrayBuffer or typed-array view.');
}

/**
 * Decode one accepted CR2 direction-major Native15 f32le radiance artifact.
 * Values remain the exact binary32 samples written by CR2; no rescaling or
 * display operation occurs here.
 */
export function decodeCr2ReceiverDiffuseRadianceField(value, provenanceIdentity) {
	if (typeof provenanceIdentity !== 'string' || provenanceIdentity.length === 0) {
		throw new TypeError('CR3 raw diffuse field requires a provenance identity.');
	}
	const bytes = bytesView(value);
	if (bytes.byteLength !== RAW_BYTE_LENGTH) {
		throw new RangeError(
			`CR3 raw diffuse field must contain exactly ${RAW_BYTE_LENGTH} bytes; received ${bytes.byteLength}.`,
		);
	}
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const values = new Float32Array(DIRECTION_COUNT * CHANNEL_COUNT);
	for (let index = 0; index < values.length; index += 1) {
		const sample = view.getFloat32(index * Float32Array.BYTES_PER_ELEMENT, true);
		if (!Number.isFinite(sample) || sample < 0) {
			throw new RangeError(`CR3 raw diffuse field value ${index} must be finite and nonnegative.`);
		}
		values[index] = sample;
	}
	return Object.freeze({
		schemaId: 'algorithm32-color-reset-cr3-decoded-cr2-radiance-field-v1',
		provenanceIdentity,
		quadratureId: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.id,
		basisHash: CR3_NATIVE15_BASIS_HASH,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		layout: 'direction-major then Native15 channel',
		storage: 'little-endian float32',
		directionCount: DIRECTION_COUNT,
		channelCount: CHANNEL_COUNT,
		byteLength: bytes.byteLength,
		values,
	});
}

/** Rehydrate and authenticate one CR2 serialized Native15 irradiance packet. */
export function irradiancePacketFromCr2Record(record, label = 'CR2 irradiance packet') {
	if (!record || typeof record !== 'object' || Array.isArray(record)) {
		throw new TypeError(`${label} must be a serialized spectral packet.`);
	}
	if (
		record.kind !== 'algorithm32-spectral-packet' ||
		record.quantity !== SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY ||
		record.units !== SPECTRAL_UNITS.IRRADIANCE_DENSITY ||
		record.basisHash !== CR3_NATIVE15_BASIS_HASH ||
		record.semantics !== NATIVE_15_SPECTRAL_BASIS.semantics
	) {
		throw new TypeError(`${label} does not match the accepted CR2 Native15 irradiance contract.`);
	}
	const packet = irradiancePacket(
		requireNonnegativeVector(record.values, CHANNEL_COUNT, `${label}.values`),
		record.provenanceIdentity,
	);
	if (typeof record.contentHash === 'string' && packet.contentHash !== record.contentHash) {
		throw new Error(`${label} content hash does not reproduce from its serialized values.`);
	}
	return packet;
}

const QUADRATURE_DIRECTIONS = Object.freeze(
	CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.samples.map((sample) => Object.freeze({
		index: sample.index,
		directionScene: Object.freeze([
			sample.directionLocal[0],
			sample.directionLocal[2],
			sample.directionLocal[1],
		]),
		solidAngleWeightSteradians: SOLID_ANGLE_WEIGHT_STERADIANS,
		horizontalIrradianceWeightSteradians: sample.irradianceWeightSteradians,
	})),
);

/** Receiver-local neutral Lambertian lighting derived only from accepted CR2 data. */
export class Cr3NeutralLambertianLighting {
	constructor({
		sceneId,
		directNormalIrradiance,
		diffuseRadianceField,
		directionToSourceModel,
		sceneToModelBasis,
		reflectance = CR3_NEUTRAL_LAMBERTIAN_REFLECTANCE,
	}) {
		if (typeof sceneId !== 'string' || sceneId.length === 0) {
			throw new TypeError('CR3 neutral lighting requires sceneId.');
		}
		const direct = SpectralPacket.assert(directNormalIrradiance, {
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			basis: NATIVE_15_SPECTRAL_BASIS,
		});
		if (!direct.values.every((value) => value >= 0)) {
			throw new RangeError('CR3 direct-normal irradiance must be nonnegative.');
		}
		if (
			!diffuseRadianceField ||
			diffuseRadianceField.schemaId !== 'algorithm32-color-reset-cr3-decoded-cr2-radiance-field-v1' ||
			diffuseRadianceField.quadratureId !== CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.id ||
			diffuseRadianceField.basisHash !== CR3_NATIVE15_BASIS_HASH ||
			diffuseRadianceField.values?.length !== DIRECTION_COUNT * CHANNEL_COUNT
		) {
			throw new TypeError('CR3 neutral lighting requires one decoded accepted CR2 diffuse field.');
		}
		if (!Number.isFinite(reflectance) || reflectance < 0 || reflectance > 1) {
			throw new RangeError('CR3 neutral Lambertian reflectance must be in [0, 1].');
		}

		this.sceneId = sceneId;
		this.reflectance = reflectance;
		this.directNormalIrradiance = direct;
		this.diffuseRadianceField = diffuseRadianceField;
		this.directionToSourceModel = normalizeDirection(directionToSourceModel, 'CR3 directionToSourceModel');
		this.sceneToModelBasis = acceptSceneToModelBasis(sceneToModelBasis);
		this._quadratureDirectionsModel = QUADRATURE_DIRECTIONS.map((sample) => Object.freeze({
			...sample,
			directionModel: mapSceneDirectionToModel(
				sample.directionScene,
				this.sceneToModelBasis,
				`CR3 quadrature direction ${sample.index}`,
			),
		}));
	}

	/** Native15 physical response for geometry vertices before any Color projection. */
	evaluateNative15ResponseValues(normalScene) {
		const normal = normalizeDirection(normalScene, 'CR3 surface normal');
		const normalModel = mapSceneDirectionToModel(normal, this.sceneToModelBasis, 'CR3 surface normal');
		const directCosine = Math.max(0, dot(normalModel, this.directionToSourceModel));
		const directIrradiance = scaled(this.directNormalIrradiance.values, directCosine);
		const diffuseIrradiance = new Float64Array(CHANNEL_COUNT);
		for (const sample of this._quadratureDirectionsModel) {
			const cosine = Math.max(0, dot(normalModel, sample.directionModel));
			if (cosine === 0) continue;
			const weight = cosine * sample.solidAngleWeightSteradians;
			const offset = sample.index * CHANNEL_COUNT;
			for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
				diffuseIrradiance[channelIndex] +=
					this.diffuseRadianceField.values[offset + channelIndex] * weight;
			}
		}
		const lambertianScale = this.reflectance / Math.PI;
		const direct = scaled(directIrradiance, lambertianScale);
		const diffuse = scaled(diffuseIrradiance, lambertianScale);
		const combined = added(direct, diffuse);
		return Object.freeze({
			schemaId: 'algorithm32-color-reset-cr3-native15-lambertian-response-values-v1',
			sceneId: this.sceneId,
			normalScene: normal,
			normalModel,
			directionToSourceModel: this.directionToSourceModel,
			directCosine,
			reflectance: this.reflectance,
			quadratureId: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.id,
			solidAngleWeightSteradians: SOLID_ANGLE_WEIGHT_STERADIANS,
			outgoingRadianceValues: Object.freeze({
				direct: Object.freeze([...direct]),
				diffuse: Object.freeze([...diffuse]),
				combined: Object.freeze(combined),
			}),
			combinedDifference: maximumDifference(combined, added(direct, diffuse)),
		});
	}

	/** Full Native15 response for retained physical probes and plane replay. */
	evaluateSpectralResponse(normalScene) {
		const normal = normalizeDirection(normalScene, 'CR3 surface normal');
		const normalModel = mapSceneDirectionToModel(normal, this.sceneToModelBasis, 'CR3 surface normal');
		const directCosine = Math.max(0, dot(normalModel, this.directionToSourceModel));
		const directIrradianceValues = scaled(this.directNormalIrradiance.values, directCosine);
		const diffuseIrradianceValues = new Float64Array(CHANNEL_COUNT);
		for (const sample of this._quadratureDirectionsModel) {
			const cosine = Math.max(0, dot(normalModel, sample.directionModel));
			if (cosine === 0) continue;
			const weight = cosine * sample.solidAngleWeightSteradians;
			const offset = sample.index * CHANNEL_COUNT;
			for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
				diffuseIrradianceValues[channelIndex] +=
					this.diffuseRadianceField.values[offset + channelIndex] * weight;
			}
		}
		return this._responseFromIrradianceValues({
			normal,
			normalModel,
			directCosine,
			directIrradianceValues,
			diffuseIrradianceValues,
			provenanceSuffix: 'general-normal-solid-angle-integral',
		});
	}

	_responseFromIrradianceValues({
		normal,
		normalModel,
		directCosine,
		directIrradianceValues,
		diffuseIrradianceValues,
		provenanceSuffix,
	}) {
		const prefix = `color-reset-cr3:${this.sceneId}:${provenanceSuffix}`;
		const directIrradiance = irradiancePacket(directIrradianceValues, `${prefix}:direct-irradiance`);
		const diffuseIrradiance = irradiancePacket(diffuseIrradianceValues, `${prefix}:diffuse-irradiance`);
		const combinedIrradiance = irradiancePacket(
			added(directIrradiance.values, diffuseIrradiance.values),
			`${prefix}:combined-irradiance`,
		);
		const lambertianScale = this.reflectance / Math.PI;
		const directRadiance = radiancePacket(
			scaled(directIrradiance.values, lambertianScale),
			`${prefix}:direct-outgoing-radiance`,
		);
		const diffuseRadiance = radiancePacket(
			scaled(diffuseIrradiance.values, lambertianScale),
			`${prefix}:diffuse-outgoing-radiance`,
		);
		const combinedRadiance = radiancePacket(
			added(directRadiance.values, diffuseRadiance.values),
			`${prefix}:combined-outgoing-radiance`,
		);

		return Object.freeze({
			schemaId: 'algorithm32-color-reset-cr3-spectral-lambertian-response-v1',
			sceneId: this.sceneId,
			normalScene: Object.freeze([...normal]),
			normalModel: Object.freeze([...normalModel]),
			directionToSourceModel: this.directionToSourceModel,
			directCosine,
			reflectance: this.reflectance,
			lambertianEquation: 'L_o(lambda,n) = rho/pi * (E_directNormal(lambda) * max(0,n dot s) + integralUpperSky L_i(lambda,omega) * max(0,n dot omega) dOmega)',
			packets: Object.freeze({
				directIrradiance,
				diffuseIrradiance,
				combinedIrradiance,
				directRadiance,
				diffuseRadiance,
				combinedRadiance,
			}),
			combinedDifference: maximumDifference(
				combinedRadiance.values,
				added(directRadiance.values, diffuseRadiance.values),
			),
		});
	}

	/**
	 * Replay the accepted +Y horizontal plane using CR2's original weights and
	 * direct horizontal projection factor. This preserves CR2's binary64
	 * accumulation order and separately compares every supplied parent packet.
	 */
	evaluateUpPlaneReplay({
		horizontalProjectionFactor,
		directHorizontal,
		diffuseHorizontal,
		totalHorizontal,
	}) {
		if (
			!Number.isFinite(horizontalProjectionFactor) ||
			horizontalProjectionFactor < 0 ||
			horizontalProjectionFactor > 1
		) {
			throw new RangeError('CR3 horizontalProjectionFactor must be in [0, 1].');
		}
		const expectedDirect = irradiancePacketFromCr2Record(directHorizontal, 'CR2 directHorizontal');
		const expectedDiffuse = irradiancePacketFromCr2Record(diffuseHorizontal, 'CR2 diffuseHorizontal');
		const expectedTotal = irradiancePacketFromCr2Record(totalHorizontal, 'CR2 totalHorizontal');
		const replayedDirect = scaled(this.directNormalIrradiance.values, horizontalProjectionFactor);
		const replayedDiffuse = new Float64Array(CHANNEL_COUNT);
		for (const sample of QUADRATURE_DIRECTIONS) {
			const offset = sample.index * CHANNEL_COUNT;
			for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
				replayedDiffuse[channelIndex] +=
					this.diffuseRadianceField.values[offset + channelIndex] *
					sample.horizontalIrradianceWeightSteradians;
			}
		}
		const replayedTotal = added(replayedDirect, replayedDiffuse);
		const upModel = mapSceneDirectionToModel(UP_SCENE, this.sceneToModelBasis, 'CR3 up-plane normal');
		const response = this._responseFromIrradianceValues({
			normal: UP_SCENE,
			normalModel: upModel,
			directCosine: horizontalProjectionFactor,
			directIrradianceValues: replayedDirect,
			diffuseIrradianceValues: replayedDiffuse,
			provenanceSuffix: 'up-plane-exact-cr2-replay',
		});
		const directionProjectionFactor = Math.max(0, dot(upModel, this.directionToSourceModel));
		const comparisons = Object.freeze({
			directionProjectionFactor: {
				value: directionProjectionFactor,
				expected: horizontalProjectionFactor,
				absoluteDifference: Math.abs(directionProjectionFactor - horizontalProjectionFactor),
			},
			directHorizontal: maximumDifference(replayedDirect, expectedDirect.values),
			diffuseHorizontal: maximumDifference(replayedDiffuse, expectedDiffuse.values),
			totalHorizontal: maximumDifference(replayedTotal, expectedTotal.values),
			expectedTotalEquation: maximumDifference(
				expectedTotal.values,
				added(expectedDirect.values, expectedDiffuse.values),
			),
		});
		return Object.freeze({
			schemaId: 'algorithm32-color-reset-cr3-up-plane-replay-v1',
			sceneId: this.sceneId,
			normalScene: UP_SCENE,
			horizontalProjectionFactor,
			response,
			comparisons,
			exact:
				comparisons.directHorizontal.exact &&
				comparisons.diffuseHorizontal.exact &&
				comparisons.totalHorizontal.exact &&
				comparisons.expectedTotalEquation.exact,
		});
	}
}

/** Public fixed shape facts used by the CR3 fixture and browser evidence. */
export const CR3_NEUTRAL_LAMBERTIAN_CONTRACT = Object.freeze({
	schemaId: 'algorithm32-color-reset-cr3-neutral-lambertian-contract-v1',
	reflectance: CR3_NEUTRAL_LAMBERTIAN_REFLECTANCE,
	basisHash: CR3_NATIVE15_BASIS_HASH,
	quadratureId: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.id,
	directionCount: DIRECTION_COUNT,
	channelCount: CHANNEL_COUNT,
	rawByteLength: RAW_BYTE_LENGTH,
	solidAngleWeightSteradians: SOLID_ANGLE_WEIGHT_STERADIANS,
	upScene: UP_SCENE,
	incidentUnits: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
	outgoingUnits: SPECTRAL_UNITS.RADIANCE_DENSITY,
});
