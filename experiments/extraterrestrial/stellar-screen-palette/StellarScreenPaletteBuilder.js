import {
	STELLAR_PROJECTION_CLASSIFICATIONS,
	STELLAR_SCREEN_PALETTE_CONTRACT,
} from './contracts.js';
import {
	pixelSolidAngleSteradians,
	projectCatalogMembers,
} from './StellarScreenProjector.js';

const CHANNEL_COUNT = 15;
const MAXIMUM_UINT16_NONZERO_INDEX = 65535;

function requireIdentity(value, label) {
	if (typeof value !== 'string' || value.length === 0) {
		throw new TypeError(`${label} must be a nonempty string.`);
	}
	return value;
}

export function describeScreenPaletteViewIdentity({catalogFrameId, observation, camera}) {
	return Object.freeze({
		catalogFrameId: requireIdentity(catalogFrameId, 'Catalog-frame identity'),
		observation: Object.freeze({
			instant: requireIdentity(observation?.instant, 'Observation instant'),
			latitudeRadians: observation?.latitudeRadians,
			longitudeRadians: observation?.longitudeRadians,
		}),
		camera: Object.freeze({
			frameId: camera?.frameId,
			viewportConventionId: camera?.viewportConventionId,
			azimuthRadians: camera?.azimuthRadians,
			elevationRadians: camera?.elevationRadians,
			verticalFieldOfViewRadians: camera?.verticalFieldOfViewRadians,
			viewport: camera?.viewport,
		}),
	});
}

function requireSpectrum(value, memberId) {
	if ((!Array.isArray(value) && !ArrayBuffer.isView(value)) || value.length !== CHANNEL_COUNT) {
		throw new TypeError(`Member ${memberId} must contain exactly 15 spectral values.`);
	}
	const accepted = Array.from(value, (channel, channelIndex) => {
		if (typeof channel !== 'number' || !Number.isFinite(channel) || channel < 0) {
			throw new RangeError(
				`Member ${memberId} channel ${channelIndex} must be finite and nonnegative.`,
			);
		}
		return channel;
	});
	return accepted;
}

function addChannels(target, targetOffset, values) {
	for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
		target[targetOffset + channelIndex] += values[channelIndex];
	}
}

function addScaledChannels(target, values, scale) {
	for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
		target[channelIndex] += values[channelIndex] * scale;
	}
}

function classificationCounts(results) {
	const counts = Object.fromEntries(
		Object.values(STELLAR_PROJECTION_CLASSIFICATIONS).map((classification) => [classification, 0]),
	);
	for (const result of results) counts[result.classification] += 1;
	return counts;
}

/** Build one exact, view-dependent Uint16 matrix and native-15 palette. */
export class StellarScreenPaletteBuilder {
	constructor({maximumExpectedOccupiedPixelCount = MAXIMUM_UINT16_NONZERO_INDEX} = {}) {
		if (
			!Number.isSafeInteger(maximumExpectedOccupiedPixelCount)
			|| maximumExpectedOccupiedPixelCount < 0
		) {
			throw new RangeError('Maximum expected occupied-pixel count must be a nonnegative integer.');
		}
		if (maximumExpectedOccupiedPixelCount > MAXIMUM_UINT16_NONZERO_INDEX) {
			throw new RangeError(
				'Uint16 construction cannot address more than 65,535 occupied pixels; select a wider builder.',
			);
		}
		this.maximumExpectedOccupiedPixelCount = maximumExpectedOccupiedPixelCount;
	}

	build({
		members,
		catalogFrameId,
		observation,
		camera,
		sourceIdentity,
		numericalIdentity,
		palettePolicyIdentity = 'exact-one-entry-per-occupied-pixel-v1',
	}) {
		if (!Array.isArray(members)) throw new TypeError('Screen-palette members must be an array.');
		if (members.length > this.maximumExpectedOccupiedPixelCount) {
			throw new RangeError(
				'Member count exceeds the declared Uint16 occupied-pixel capacity bound.',
			);
		}
		const identities = Object.freeze({
			source: requireIdentity(sourceIdentity, 'Source identity'),
			view: describeScreenPaletteViewIdentity({catalogFrameId, observation, camera}),
			numerical: requireIdentity(numericalIdentity, 'Numerical identity'),
			schema: STELLAR_SCREEN_PALETTE_CONTRACT.schemaId,
			palettePolicy: requireIdentity(palettePolicyIdentity, 'Palette-policy identity'),
		});
		const spectra = members.map((member, memberIndex) => requireSpectrum(
			member.spectralIrradiance,
			member.id ?? member.memberId ?? memberIndex,
		));
		const projected = projectCatalogMembers({members, catalogFrameId, observation, camera});
		const matrix = new Uint16Array(camera.viewport.width * camera.viewport.height);
		const workingEntries = [new Float64Array(CHANNEL_COUNT)];
		const solidAngles = [0];
		const inputIrradiance = new Float64Array(CHANNEL_COUNT);
		let eligibleMemberCount = 0;
		let zeroRadiometryMemberCount = 0;
		let collisionMemberCount = 0;

		for (const result of projected) {
			if (result.classification !== STELLAR_PROJECTION_CLASSIFICATIONS.OCCUPIED_PIXEL) continue;
			const sourceSpectrum = spectra[result.memberIndex];
			if (sourceSpectrum.every((value) => value === 0)) {
				zeroRadiometryMemberCount += 1;
				continue;
			}
			eligibleMemberCount += 1;
			addScaledChannels(inputIrradiance, sourceSpectrum, 1);
			const pixelIndex = result.pixel.linearIndex;
			let paletteIndex = matrix[pixelIndex];
			if (paletteIndex === 0) {
				paletteIndex = workingEntries.length;
				if (paletteIndex > MAXIMUM_UINT16_NONZERO_INDEX) {
					throw new RangeError('Uint16 palette capacity exhausted during construction.');
				}
				matrix[pixelIndex] = paletteIndex;
				workingEntries.push(new Float64Array(CHANNEL_COUNT));
				solidAngles.push(pixelSolidAngleSteradians(result.pixel.x, result.pixel.y, camera));
			} else {
				collisionMemberCount += 1;
			}
			const radiance = sourceSpectrum.map((value) => value / solidAngles[paletteIndex]);
			addChannels(workingEntries[paletteIndex], 0, radiance);
		}

		const paletteEntryCount = workingEntries.length;
		const workingPalette = new Float64Array(paletteEntryCount * CHANNEL_COUNT);
		for (let paletteIndex = 0; paletteIndex < paletteEntryCount; paletteIndex += 1) {
			workingPalette.set(workingEntries[paletteIndex], paletteIndex * CHANNEL_COUNT);
		}
		const palette = Float32Array.from(workingPalette);
		const exactOutputIrradiance = new Float64Array(CHANNEL_COUNT);
		const packedOutputIrradiance = new Float64Array(CHANNEL_COUNT);
		let maximumAbsolutePackingResidual = 0;
		let maximumRelativePackingResidual = 0;
		for (let paletteIndex = 1; paletteIndex < paletteEntryCount; paletteIndex += 1) {
			const solidAngle = solidAngles[paletteIndex];
			for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
				const offset = paletteIndex * CHANNEL_COUNT + channelIndex;
				const exact = workingPalette[offset];
				const packed = palette[offset];
				const absoluteResidual = Math.abs(packed - exact);
				maximumAbsolutePackingResidual = Math.max(
					maximumAbsolutePackingResidual,
					absoluteResidual,
				);
				if (exact > 0) {
					maximumRelativePackingResidual = Math.max(
						maximumRelativePackingResidual,
						absoluteResidual / exact,
					);
				}
				exactOutputIrradiance[channelIndex] += exact * solidAngle;
				packedOutputIrradiance[channelIndex] += packed * solidAngle;
			}
		}
		const exactConservationResidual = Array.from(inputIrradiance, (value, channelIndex) =>
			exactOutputIrradiance[channelIndex] - value);
		const packedConservationResidual = Array.from(inputIrradiance, (value, channelIndex) =>
			packedOutputIrradiance[channelIndex] - value);

		return Object.freeze({
			contract: STELLAR_SCREEN_PALETTE_CONTRACT,
			identities,
			viewport: camera.viewport,
			pixelIndex: matrix,
			palette,
			metadata: Object.freeze({
				memberCount: members.length,
				classificationCounts: Object.freeze(classificationCounts(projected)),
				eligibleMemberCount,
				zeroRadiometryMemberCount,
				occupiedPixelCount: paletteEntryCount - 1,
				collisionMemberCount,
				paletteEntryCount,
				matrixBytes: matrix.byteLength,
				paletteBytes: palette.byteLength,
				inputIrradiance: Object.freeze(Array.from(inputIrradiance)),
				exactOutputIrradiance: Object.freeze(Array.from(exactOutputIrradiance)),
				packedOutputIrradiance: Object.freeze(Array.from(packedOutputIrradiance)),
				exactConservationResidual: Object.freeze(exactConservationResidual),
				packedConservationResidual: Object.freeze(packedConservationResidual),
				maximumAbsolutePackingResidual,
				maximumRelativePackingResidual,
			}),
			memberResults: projected,
		});
	}
}

export const _test = Object.freeze({
	CHANNEL_COUNT,
	MAXIMUM_UINT16_NONZERO_INDEX,
});
