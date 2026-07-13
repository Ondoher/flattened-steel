const PI_TOLERANCE = 1e-12;

function requireFiniteNonnegative(value, label) {
	if (!Number.isFinite(value) || value < 0) {
		throw new RangeError(`${label} must be finite and nonnegative.`);
	}
	return value;
}

function addCompensated(state, value) {
	const adjusted = value - state.compensation;
	const next = state.sum + adjusted;
	state.compensation = (next - state.sum) - adjusted;
	state.sum = next;
}

/**
 * Derive receiver-local diffuse sky irradiance from an atmosphere-owned,
 * camera-independent upper-hemisphere radiance dataset.
 */
export class ReceiverLocalDiffuseSkyCalculator {
	constructor({channelCount = 15, projectedSolidAngleTolerance = PI_TOLERANCE} = {}) {
		if (!Number.isInteger(channelCount) || channelCount < 1) {
			throw new RangeError('Diffuse sky channelCount must be a positive integer.');
		}
		if (!Number.isFinite(projectedSolidAngleTolerance) || projectedSolidAngleTolerance < 0) {
			throw new RangeError('Diffuse sky projectedSolidAngleTolerance must be finite and nonnegative.');
		}
		this.channelCount = channelCount;
		this.projectedSolidAngleTolerance = projectedSolidAngleTolerance;
	}

	measure(samples) {
		if (!Array.isArray(samples) || samples.length === 0) {
			throw new TypeError('Diffuse sky measurement requires a nonempty sample array.');
		}

		const spectral = Array.from({length: this.channelCount}, () => ({sum: 0, compensation: 0}));
		const illuminance = {sum: 0, compensation: 0};
		const projectedSolidAngle = {sum: 0, compensation: 0};
		let minimumLuminance = Number.POSITIVE_INFINITY;
		let maximumLuminance = 0;

		for (const [sampleIndex, sample] of samples.entries()) {
			if (sample?.role !== 'upper-hemisphere' || sample.geometryClassification !== 'valid-sky-ray') {
				throw new TypeError(`Diffuse sky sample ${sampleIndex} is not a valid upper-hemisphere sky ray.`);
			}
			if (!Array.isArray(sample.pathRadiance) || sample.pathRadiance.length !== this.channelCount) {
				throw new TypeError(`Diffuse sky sample ${sampleIndex} must contain ${this.channelCount} path-radiance channels.`);
			}
			const weight = requireFiniteNonnegative(
				sample.projectedSolidAngleSteradians,
				`Diffuse sky sample ${sampleIndex} projected solid angle`,
			);
			const luminance = requireFiniteNonnegative(
				sample.derived?.pathRadiance?.luminanceCdPerSquareMeter,
				`Diffuse sky sample ${sampleIndex} photopic luminance`,
			);

			addCompensated(projectedSolidAngle, weight);
			addCompensated(illuminance, luminance * weight);
			minimumLuminance = Math.min(minimumLuminance, luminance);
			maximumLuminance = Math.max(maximumLuminance, luminance);
			for (let channelIndex = 0; channelIndex < this.channelCount; channelIndex += 1) {
				const radiance = requireFiniteNonnegative(
					sample.pathRadiance[channelIndex],
					`Diffuse sky sample ${sampleIndex} channel ${channelIndex} radiance`,
				);
				addCompensated(spectral[channelIndex], radiance * weight);
			}
		}

		if (Math.abs(projectedSolidAngle.sum - Math.PI) > this.projectedSolidAngleTolerance) {
			throw new RangeError(
				`Diffuse sky projected solid angle must integrate to pi; received ${projectedSolidAngle.sum}.`,
			);
		}

		return Object.freeze({
			schemaId: 'receiver-local-diffuse-sky-measurement-v1',
			sampleCount: samples.length,
			projectedSolidAngleSteradians: projectedSolidAngle.sum,
			diffuseSpectralIrradiance: Object.freeze({
				quantity: 'spectral-irradiance-density',
				units: 'W m^-2 nm^-1',
				values: Object.freeze(spectral.map((channel) => channel.sum)),
			}),
			photopicDiffuseIlluminance: Object.freeze({value: illuminance.sum, units: 'lux'}),
			adaptingLuminanceProxy: Object.freeze({
				value: illuminance.sum / Math.PI,
				units: 'cd m^-2',
				equation: 'receiver-local atmospheric path-radiance hemisphere integral E_v / pi',
			}),
			sampleLuminanceRange: Object.freeze({minimum: minimumLuminance, maximum: maximumLuminance, units: 'cd m^-2'}),
			includedContributions: Object.freeze(['atmospheric-path-radiance']),
			excludedContributions: Object.freeze(['direct-celestial-radiance', 'stellar-radiance', 'scene-geometry-radiance']),
		});
	}
}
