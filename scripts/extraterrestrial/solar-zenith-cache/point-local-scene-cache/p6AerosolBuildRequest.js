import {createPocBuildRequest} from
	'../san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseScatteringSceneSequence.js';

export const P6_AEROSOL_VARIANTS = Object.freeze([
	Object.freeze({id: 'aerosol-0x', multiplier: 0}),
	Object.freeze({id: 'aerosol-0p25x', multiplier: 0.25}),
	Object.freeze({id: 'aerosol-0p5x', multiplier: 0.5}),
	Object.freeze({id: 'aerosol-1x', multiplier: 1}),
]);

/** Create the Native48 solar-noon request with only aerosol loading changed. */
export function createP6AerosolBuildRequest(variant) {
	if (!P6_AEROSOL_VARIANTS.includes(variant)) {
		throw new RangeError('P6 aerosol variant is not one of the frozen sweep values.');
	}
	const solarNoon = SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find(
		(scene) => scene.id === 'solar-noon',
	);
	const base = createPocBuildRequest({
		id: `p6-${variant.id}-base-v1`,
		scenePageDefinitions: [{id: `p6-${variant.id}-solar-noon`, scene: solarNoon}],
	});
	const canonicalBeta = base.transportSpec.atmosphere.mieAngstromBeta;
	const atmosphere = Object.freeze({
		...base.transportSpec.atmosphere,
		id: `${base.transportSpec.atmosphere.id}-${variant.id}`,
		mieAngstromBeta: canonicalBeta * variant.multiplier,
		aerosolLoadingControl: Object.freeze({
			canonicalBeta,
			multiplier: variant.multiplier,
			mieScatteringAndExtinctionScaledTogether: true,
			retainedAlpha: base.transportSpec.atmosphere.mieAngstromAlpha,
			retainedSingleScatteringAlbedo:
				base.transportSpec.atmosphere.mieSingleScatteringAlbedo,
			retainedPhaseFunctionG: base.transportSpec.atmosphere.miePhaseFunctionG,
		}),
	});
	const transportSpec = Object.freeze({
		...base.transportSpec,
		id: `p6-solar-noon-${variant.id}-n4-transport-v1`,
		atmosphere,
	});
	return Object.freeze({...base,
		id: `p6-solar-noon-${variant.id}-native48-c4-w39-v1`,
		transportSpec,
	});
}

