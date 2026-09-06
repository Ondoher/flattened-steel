const AZIMUTH_SAMPLE_COUNT = 64;
const MU_SAMPLE_COUNT = 64;

/** Number of directions in each refined CR2 receiver-light quadrature. */
export const CR2_RECEIVER_DIFFUSE_SAMPLE_COUNT = AZIMUTH_SAMPLE_COUNT * MU_SAMPLE_COUNT;

/**
 * Build one deterministic midpoint product quadrature over the local upper
 * hemisphere. The integration coordinates are azimuth phi and
 * mu=cos(zenith). Each radiance receives the physical irradiance weight
 * mu*dmu*dphi, so the complete weight sum is pi steradians.
 *
 * Uniform mu rings deliberately retain near-horizon samples that the compact
 * production cosine-Hammersley diagnostic does not resolve. A half-cell
 * azimuth rotation supplies an independent orientation-sensitivity check.
 */
function createQuadrature(id, azimuthCellOffset) {
	const samples = [];
	const deltaMu = 1 / MU_SAMPLE_COUNT;
	const deltaAzimuth = 2 * Math.PI / AZIMUTH_SAMPLE_COUNT;
	for (let muIndex = 0; muIndex < MU_SAMPLE_COUNT; muIndex += 1) {
		const mu = (muIndex + 0.5) * deltaMu;
		const horizontalRadius = Math.sqrt(Math.max(0, 1 - mu * mu));
		for (let azimuthIndex = 0; azimuthIndex < AZIMUTH_SAMPLE_COUNT; azimuthIndex += 1) {
			const azimuth = (azimuthIndex + azimuthCellOffset) * deltaAzimuth;
			samples.push(Object.freeze({
				index: samples.length,
				muIndex,
				azimuthIndex,
				mu,
				azimuthRadians: azimuth,
				directionLocal: /** @type {UnitVector3} */ (Object.freeze([
					horizontalRadius * Math.cos(azimuth),
					horizontalRadius * Math.sin(azimuth),
					mu,
				])),
				irradianceWeightSteradians: mu * deltaMu * deltaAzimuth,
			}));
		}
	}
	const weightSumSteradians = samples.reduce(
		(sum, sample) => sum + sample.irradianceWeightSteradians,
		0,
	);
	return Object.freeze({
		id,
		azimuthSampleCount: AZIMUTH_SAMPLE_COUNT,
		muSampleCount: MU_SAMPLE_COUNT,
		sampleCount: samples.length,
		azimuthCellOffset,
		lowestElevationDegrees: Math.asin(0.5 / MU_SAMPLE_COUNT) * 180 / Math.PI,
		weightSumSteradians,
		samples: Object.freeze(samples),
	});
}

/** Refined CR2 measurement authority. */
export const CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE = createQuadrature(
	'color-reset-cr2-receiver-diffuse-mu64-azimuth64-primary-v1',
	0.5,
);

/** Same refined domain rotated by half one azimuth cell. */
export const CR2_RECEIVER_DIFFUSE_ROTATED_QUADRATURE = createQuadrature(
	'color-reset-cr2-receiver-diffuse-mu64-azimuth64-half-cell-rotation-v1',
	1,
);

