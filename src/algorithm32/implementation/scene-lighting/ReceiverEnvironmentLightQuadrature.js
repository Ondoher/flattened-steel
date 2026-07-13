/** Fixed sample count for the receiver-local environmental-light reduction. */
export const RECEIVER_ENVIRONMENT_SAMPLE_COUNT = 32;

/**
 * Build a deterministic cosine-weighted upper-hemisphere quadrature in a
 * receiver-local frame whose positive Z axis is local up.
 *
 * With cosine-weighted sampling, every radiance sample has irradiance weight
 * pi/N. The fixed set is camera-independent and shared by CPU and GPU paths.
 *
 * @returns {readonly ReceiverEnvironmentLightDirectionSample[]} - Frozen local directions and weights.
 */
function createReceiverEnvironmentLightQuadrature() {
	const samples = [];
	for (let index = 0; index < RECEIVER_ENVIRONMENT_SAMPLE_COUNT; index += 1) {
		const first = (index + 0.5) / RECEIVER_ENVIRONMENT_SAMPLE_COUNT;
		let bits = index;
		let inverseBaseTwo = 0;
		let place = 0.5;
		while (bits > 0) {
			inverseBaseTwo += (bits & 1) * place;
			bits >>= 1;
			place *= 0.5;
		}
		const radius = Math.sqrt(first);
		const azimuth = 2 * Math.PI * inverseBaseTwo;
		samples.push(
			Object.freeze({
				directionLocal: /** @type {UnitVector3} */ (
					Object.freeze([
						radius * Math.cos(azimuth),
						radius * Math.sin(azimuth),
						Math.sqrt(1 - first),
					])
				),
				irradianceWeightSteradians: Math.PI / RECEIVER_ENVIRONMENT_SAMPLE_COUNT,
			}),
		);
	}
	return Object.freeze(samples);
}

/** Canonical camera-independent receiver-local environmental-light quadrature. */
export const RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE = createReceiverEnvironmentLightQuadrature();
