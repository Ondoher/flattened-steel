import {
	createBrunetonProductionProfile as createOfficialBrunetonProductionProfile,
	createViewDirection,
// The query-qualified URL deliberately bypasses OzoneB1ProductionGpuHost's
// exact import-map replacement of the unqualified official profile URL. This
// lets this contained wrapper call the read-only base profile without mapping
// its own dependency back onto itself.
} from '../../experiments/b1-directional-sky-radiance/production-profile.js?contained-ozone-base=v1';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {
	BRUNETON_OZONE_COMPOSITION,
	BrunetonOzoneCanonicalAtmosphere,
} from '../atmospheres/BrunetonOzoneCanonicalAtmosphere.js';

export const BRUNETON_OZONE_B1_PROFILE_FAMILY =
	'paper-reflection-completed-ordinary-68-bruneton-ozone-300du';
export const BRUNETON_OZONE_B1_PHYSICAL_PROFILE_ID =
	'algorithm32-paper-comparison-plus-bruneton-earth-demo-ozone-300du-v1';
export const BRUNETON_OZONE_B1_CANDIDATE_LABEL =
	'Algorithm32 F68 + Bruneton 300 DU ozone';
export const BRUNETON_OZONE_B1_FIBONACCI34_PROFILE_FAMILY =
	'paper-ordinary-fibonacci-34-bruneton-ozone-300du';
export const BRUNETON_OZONE_B1_FIBONACCI34_CANDIDATE_LABEL =
	'Algorithm32 F34 + Bruneton 300 DU ozone';

const SUPPORTED_INCOMING_DIRECTION_VARIANTS = new Set([
	'reflection-completed-ordinary-68',
	'ordinary-fibonacci-34',
]);

/**
 * Clone the official read-only B1 profile and replace only its atmosphere with
 * the contained absorption-only Bruneton ozone extension.
 */
export function createBrunetonProductionProfile(options) {
	if (!SUPPORTED_INCOMING_DIRECTION_VARIANTS.has(options?.incomingDirectionVariant)) {
		throw new RangeError(
			'The contained ozone B1 profile requires reflection-completed ordinary Fibonacci-68 or ordinary Fibonacci-34.',
		);
	}
	const base = createOfficialBrunetonProductionProfile(options);
	const baseAtmosphere = base.models.atmosphere;
	const seaLevel = baseAtmosphere.sampleMedium({
		altitude: {value: 0, units: 'meters'},
	});
	const atmosphere = new BrunetonOzoneCanonicalAtmosphere({
		constants: {
			...baseAtmosphere.constants,
			ozoneAbsorptionEnabled: true,
		},
		spectralBasis: baseAtmosphere.spectralBasis,
		seaLevelRayleighScattering: seaLevel.rayleighScattering,
		seaLevelMieExtinction: seaLevel.mieExtinction,
		ozoneComposition: BRUNETON_OZONE_COMPOSITION,
	});
	const ozoneComposition = Object.freeze({
		schemaId: 'b1-bruneton-ozone-composition-binding-v1',
		physicalProfileId: BRUNETON_OZONE_B1_PHYSICAL_PROFILE_ID,
		authorityId: BRUNETON_OZONE_COMPOSITION.id,
		authorityCommit: BRUNETON_OZONE_COMPOSITION.commit,
		authoritySourcePath: BRUNETON_OZONE_COMPOSITION.sourcePath,
		authoritySourceSha256: BRUNETON_OZONE_COMPOSITION.sourceSha256,
		temperatureKelvin: BRUNETON_OZONE_COMPOSITION.temperatureKelvin,
		dobsonUnits: BRUNETON_OZONE_COMPOSITION.dobsonUnits,
		densityProfile: BRUNETON_OZONE_COMPOSITION.profileAltitudesMeters,
		compositionContentHash: BRUNETON_OZONE_COMPOSITION.contentHash,
		atmosphereIdentity: atmosphere.ozoneIdentity,
	});
	const contentHash = CanonicalValueHash.sha256Value({
		baseProfileContentHash: base.contentHash,
		physicalProfileId: BRUNETON_OZONE_B1_PHYSICAL_PROFILE_ID,
		ozoneComposition,
	});

	return {
		...base,
		id: `${base.id.replace(/-v1$/u, '')}-bruneton-ozone-300du-v1`,
		contentHash,
		provenanceIdentity:
			`${base.provenanceIdentity}:bruneton-earth-demo-ozone-300du:${BRUNETON_OZONE_COMPOSITION.contentHash}`,
		models: {...base.models, atmosphere},
		ozoneComposition,
	};
}

export {createViewDirection};
