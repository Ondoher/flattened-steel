import {ProductionGpuHost} from '../../experiments/b1-directional-sky-radiance/ProductionGpuHost.js';

const OFFICIAL_PROFILE_URL =
	'/scripts/experiments/b1-directional-sky-radiance/production-profile.js';
const OZONE_PROFILE_URL =
	'/experiments/extraterrestrial/ozone/BrunetonOzoneB1Profile.js';
const DEFAULT_INCOMING_DIRECTION_VARIANT = 'reflection-completed-ordinary-68';
const INCOMING_DIRECTION_CONTROLS = Object.freeze({
	[DEFAULT_INCOMING_DIRECTION_VARIANT]: Object.freeze({
		domainId: 'b1-reflection-completed-ordinary-fibonacci-68-v1',
		directionCount: 68,
	}),
	'ordinary-fibonacci-34': Object.freeze({
		domainId: 'algorithm32-fibonacci-34-incoming-v1',
		directionCount: 34,
	}),
});

/**
 * Contained browser host that leaves the official B1 GPU implementation
 * read-only and replaces only its production-profile module resolution.
 */
export class OzoneB1ProductionGpuHost extends ProductionGpuHost {
	/**
	 * @param {{progressLogPath?: string, incomingDirectionVariant?: string}} [options]
	 * - Browser-host controls.
	 */
	constructor(options = {}) {
		const {
			incomingDirectionVariant = DEFAULT_INCOMING_DIRECTION_VARIANT,
			...hostOptions
		} = options;
		const incomingDirectionControl = INCOMING_DIRECTION_CONTROLS[incomingDirectionVariant];
		if (!incomingDirectionControl) {
			throw new RangeError(
				`Unsupported contained ozone B1 incoming-direction variant: ${incomingDirectionVariant}.`,
			);
		}
		super(hostOptions);
		this._incomingDirectionVariant = incomingDirectionVariant;
		this._incomingDirectionControl = incomingDirectionControl;
	}

	_entryDocument() {
		const incomingDirectionVariant = JSON.stringify(this._incomingDirectionVariant);
		return `<!doctype html>
<html><head><meta charset="utf-8">
<script type="importmap">${JSON.stringify({
	imports: {
		three: '/node_modules/three/build/three.module.js',
		[OFFICIAL_PROFILE_URL]: OZONE_PROFILE_URL,
	},
})}</script>
</head><body><script type="module">
import {disposeGpuSession, generateGpuCondition, initializeGpuSession} from '/scripts/experiments/b1-directional-sky-radiance/production-gpu-browser.js';
import {createBrunetonProductionProfile} from '${OFFICIAL_PROFILE_URL}';
const configuredIncomingDirectionVariant = ${incomingDirectionVariant};
function describeProfileControl(profile) {
	const seaLevelMedium = profile.models.atmosphere.sampleMedium({
		altitude: {value: 0, units: 'meters'}
	});
	return {
		incomingDirectionVariant: configuredIncomingDirectionVariant,
		profileId: profile.id,
		engineLocalProfileContentHash: profile.contentHash,
		atmosphereId: profile.models.atmosphere.id,
		ozoneAbsorptionEnabled: profile.models.atmosphere.constants.ozoneAbsorptionEnabled,
		ozoneComposition: profile.ozoneComposition ?? null,
		spectralBasisContentHash: profile.spectral.basis.contentHash,
		sourceRadiometryContentHash: profile.spectral.sourceIrradianceDensity.contentHash,
		groundAlbedoContentHash: profile.models.groundBoundary.albedo.contentHash,
		atmosphereConstants: profile.models.atmosphere.constants,
		seaLevelMedium: {
			rayleighScattering: Array.from(seaLevelMedium.rayleighScattering.values),
			mieExtinction: Array.from(seaLevelMedium.mieExtinction.values)
		},
		domains: {
			positions: {id: profile.domains.positions.id, count: profile.domains.positions.count},
			incomingDirections: {
				id: profile.domains.incomingDirections.id,
				directionCount: profile.domains.incomingDirections.directionCount
			},
			outgoingDirections: {
				id: profile.domains.outgoingDirections.id,
				directionCount: profile.domains.outgoingDirections.directionCount
			}
		},
		numerical: profile.numerical,
		sourcePlacement: profile.models.sourcePlacement
	};
}
const profileProbe = createBrunetonProductionProfile({
	time: '10:15',
	fittedAzimuthDegrees: 0,
	maximumScatteringOrder: 4,
	incomingDirectionVariant: configuredIncomingDirectionVariant
});
globalThis.algorithm32B1OzoneProfilePresence = {
	incomingDirectionVariant: configuredIncomingDirectionVariant,
	profileId: profileProbe.id,
	incomingDirectionDomain: profileProbe.domains.incomingDirections.id,
	incomingDirectionCount: profileProbe.domains.incomingDirections.directionCount
};
globalThis.algorithm32B1OzoneProfileProbe = describeProfileControl(profileProbe);
globalThis.algorithm32B1DisposeGpuSession = disposeGpuSession;
globalThis.algorithm32B1GenerateGpuCondition = async (request) => {
	if (request.incomingDirectionVariant !== configuredIncomingDirectionVariant) {
		throw new RangeError('B1 request incoming-direction variant differs from the configured ozone host.');
	}
	const profile = createBrunetonProductionProfile(request);
	const result = await generateGpuCondition(request);
	return {
		...result,
		profileControl: describeProfileControl(profile)
	};
};
globalThis.algorithm32B1InitializeGpuSession = initializeGpuSession;
globalThis.algorithm32B1DisposeJ2AngularGpuSession = () => {};
globalThis.algorithm32B1GpuReady = true;
</script></body></html>`;
	}

	async open() {
		await super.open();
		const {presence, probe} = await this._page.evaluate(
			() => ({
				presence: globalThis.algorithm32B1OzoneProfilePresence,
				probe: globalThis.algorithm32B1OzoneProfileProbe,
			}),
		);
		if (
			presence?.incomingDirectionVariant !== this._incomingDirectionVariant
			|| presence.profileId !== probe?.profileId
			|| presence.incomingDirectionDomain !== this._incomingDirectionControl.domainId
			|| presence.incomingDirectionCount !== this._incomingDirectionControl.directionCount
			|| probe?.domains?.incomingDirections?.id !== this._incomingDirectionControl.domainId
			|| probe?.domains?.incomingDirections?.directionCount
				!== this._incomingDirectionControl.directionCount
			|| probe?.ozoneAbsorptionEnabled !== true
			|| probe?.incomingDirectionVariant !== this._incomingDirectionVariant
			|| typeof probe.profileId !== 'string'
			|| !probe.profileId.includes('ozone')
			|| typeof probe.atmosphereId !== 'string'
			|| !probe.atmosphereId.includes('ozone')
		) {
			throw new Error(
				'B1 browser import-map control did not resolve the contained ozone profile.',
			);
		}
		this.ozoneProfilePresence = Object.freeze(presence);
		this.ozoneProfileProbe = Object.freeze(probe);
	}
}
