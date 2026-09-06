import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

import {
	BrunetonColorDisplayModel,
	CanonicalAtmosphere,
	FlatEarthGeometry,
	LocalSunLightSource,
} from '../../../src/algorithm32/implementation/index.js';
import DistanceMath from '../../../src/algorithm32/math/DistanceMath.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../../../src/algorithm32/profiles/native-15/native-15-profile.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../src/algorithm32/spectral-values/index.js';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const output = resolve(
	repositoryRoot,
	'tmp/extraterrestrial/production-integration/flat-local-sun-color/union-glacier-flat180.json',
);
const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
const location = {
	latitude: {value: -79.768036, units: 'degrees'},
	longitude: {value: -83.261666, units: 'degrees'},
};
const observation = {
	instant: FlatEarthGeometry.resolveObservationInstant({
		dateBasis: '2024-12-14T12:00:00.000Z',
		location,
		kind: 'closest-angle',
		angle: {value: 180, units: 'degrees'},
	}),
	location,
};
const observerPosition = {coordinates: [0, 0, 5], units: 'meters'};
const geometry = new FlatEarthGeometry({
	observerPosition,
	topAltitude: {value: 100_000, units: 'meters'},
	localLightSourceHeight: {value: 3_000 * 1_609.344, units: 'meters'},
	projectionRadius: profile.physical.geometry.bottomRadius,
	sceneSkyRayLimit: {value: 1_926_774, units: 'meters'},
	observerCenteredDome: {
		centerPolicy: 'observer-centered',
		apexAltitude: {value: 100_000, units: 'meters'},
		maxObserverViewRayExtent: {value: 1_926_774, units: 'meters'},
	},
});
const source = new LocalSunLightSource({
	sourceKey: 'flat32-local-sun',
	referenceDistance: {value: 4_800_000, units: 'meters'},
	referenceSpectralIncidentScale: 1,
	radius: {value: 25_749.504, units: 'meters'},
	distanceFalloff: true,
	sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
});
geometry.configureLightSource({lightSource: source, observation});

const relative = geometry.resolveSourceRelativePosition({position: observerPosition});
const centerDistanceMeters = relative.distanceFromSource.value;
const bodyEntryDistanceMeters = centerDistanceMeters - source.celestialSourceDefinition.radius.value;
const sourcePath = geometry.resolveAtmospherePath({
	ray: {origin: observerPosition, direction: relative.directionToSource},
	sourcePathLimit: {
		maxDistance: {value: bodyEntryDistanceMeters, units: 'meters'},
		reason: 'finite-local-source-distance',
	},
	sampleCount: profile.numerical.sourcePathTransmittance.intervalCount,
});
const opticalDepth = new Array(profile.spectral.basis.channelCount).fill(0);
for (const sample of sourcePath.samples) {
	const medium = new CanonicalAtmosphere().sampleMedium(sample.atmosphereCoordinate);
	const measureMeters = DistanceMath.toMeters(sample.measure);
	for (let channelIndex = 0; channelIndex < opticalDepth.length; channelIndex += 1) {
		opticalDepth[channelIndex] += medium.extinction.values[channelIndex] * measureMeters;
	}
}
const surfaceRadiance = source.celestialSourceDefinition.surfaceRadiance;
const transportedValues = surfaceRadiance.values.map(
	(value, channelIndex) => value * Math.exp(-opticalDepth[channelIndex]),
);
const transportedRadiance = /** @type {SpectralRadiancePacket} */ (
	new SpectralPacket({
		basis: surfaceRadiance.basis,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values: transportedValues,
		provenanceIdentity: 'diagnostic:union-glacier-flat180-local-sun-center-ray',
	})
);
const color = new BrunetonColorDisplayModel();
const linearSrgb = color.radianceToLinearSrgb(transportedRadiance);
const displayRgb = color.radianceToDisplayRgb(transportedRadiance);
const linearPeak = Math.max(...linearSrgb);
const displayPeak = Math.max(...displayRgb);
const evidence = {
	condition: {location: 'Union Glacier', flatAngleDegrees: 180, observation},
	geometry: {
		sourceCenterMeters: source.configuration.position.coordinates,
		observerToCenterMeters: centerDistanceMeters,
		bodyEntryDistanceMeters,
		apparentAngularRadiusDegrees:
			(Math.asin(source.celestialSourceDefinition.radius.value / centerDistanceMeters) * 180) / Math.PI,
		atmospherePathMeters: sourcePath.length.value,
	},
	transport: {
		opticalDepth,
		transmittance: opticalDepth.map((value) => Math.exp(-value)),
		surfaceRadiance: surfaceRadiance.values,
		transportedRadiance: transportedValues,
	},
	display: {
		linearSrgb,
		linearPeak,
		linearRgbRelativeToPeak: linearSrgb.map((value) => value / linearPeak),
		displayRgb,
		displayPeak,
		displayRgbRelativeToPeak: displayRgb.map((value) => value / displayPeak),
		displayChannelSpread: displayPeak - Math.min(...displayRgb),
	},
};

if (
	![...transportedValues, ...linearSrgb, ...displayRgb].every(Number.isFinite) ||
	displayRgb.some((value) => value < 0 || value > 1)
) {
	throw new Error('Flat/local Sun color diagnostic produced an invalid value.');
}
await mkdir(resolve(output, '..'), {recursive: true});
await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({output, evidence}, null, 2)}\n`);
