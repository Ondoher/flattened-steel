import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {DistantSunSceneCacheNumerics} from '../solar-zenith-cache/DistantSunSceneCacheNumerics.js';

export const DISTANT_SUN_PROFILE_COMPILER_IDENTITY = 'algorithm32-offline-profile-driven-w27-f68-j4-v8';

const EXPECTED_PROFILE_KIND = 'algorithm32-execution-profile';
const EXPECTED_INCOMING_COUNT = 68;
const EXPECTED_OUTGOING_FACE_WIDTH = 27;
const EXPECTED_OUTGOING_COUNT = 4374;
const EXPECTED_POSITION_COUNT = 48;

function requireProfile(profile) {
	if (!profile || profile.kind !== EXPECTED_PROFILE_KIND) {
		throw new TypeError('Profile-driven distant-Sun compilation requires one complete execution profile.');
	}
	if (profile.models?.lightSource?.kind !== 'distant-uniform-sun') {
		throw new RangeError('Profile-driven distant-Sun compilation requires the distant uniform Sun.');
	}
	if (profile.models?.atmosphere?.id !== 'canonical-atmosphere') {
		throw new RangeError('Profile-driven distant-Sun compilation requires the canonical atmosphere owner.');
	}
	if (profile.models?.geometry?.id !== 'spherical-earth-geometry') {
		throw new RangeError('Profile-driven distant-Sun compilation requires spherical Earth geometry.');
	}
	if (profile.models?.sourcePlacement?.kind !== 'explicit-geometry-placement') {
		throw new RangeError('Profile-driven distant-Sun compilation requires explicit distant-source placement.');
	}
	if (
		profile.domains?.positions?.count !== EXPECTED_POSITION_COUNT ||
		profile.domains?.incomingDirections?.directionCount !== EXPECTED_INCOMING_COUNT ||
		profile.domains?.outgoingDirections?.faceWidth !== EXPECTED_OUTGOING_FACE_WIDTH ||
		profile.domains?.outgoingDirections?.directionCount !== EXPECTED_OUTGOING_COUNT
	) {
		throw new RangeError('Profile-driven distant-Sun compilation requires the Native48/F68/W27 domain shape.');
	}
	if (profile.numerical?.cacheConstruction?.maximumScatteringOrder !== 4) {
		throw new RangeError('Profile-driven distant-Sun compilation currently requires cumulative J4.');
	}
	if (profile.models.atmosphere.constants.ozoneAbsorptionEnabled !== false) {
		throw new RangeError('Profile-driven compilation does not yet own an explicit ozone cross-section packet.');
	}
}

function solarZenithNode(profile) {
	const direction = profile.models.sourcePlacement.placement.directionToLight;
	if (!Array.isArray(direction) || direction.length !== 3) {
		throw new RangeError('Profile-driven compilation requires one explicit distant-source direction.');
	}
	const cosine = Math.max(-1, Math.min(1, direction[2]));
	return Object.freeze({index: 0, solarZenithDegrees: (Math.acos(cosine) * 180) / Math.PI, muS: cosine});
}

function spectrumChannels(profile) {
	const basis = profile.spectral.basis;
	const source = profile.spectral.sourceIrradianceDensity;
	const atmosphere = profile.models.atmosphere;
	const ground = profile.models.groundBoundary.albedo;
	if (
		source.basisHash !== basis.contentHash ||
		atmosphere.seaLevelRayleighScattering.basisHash !== basis.contentHash ||
		atmosphere.seaLevelMieExtinction.basisHash !== basis.contentHash ||
		ground.basisHash !== basis.contentHash
	) {
		throw new RangeError('Profile-driven compiler packets must use the selected spectral basis.');
	}
	return basis.channels.map((channel, index) => ({
		id: channel.id,
		centerNanometers: channel.center.value,
		binWidthNanometers: channel.width.value,
		sourceIrradianceDensityWattsPerSquareMeterPerNanometer: source.values[index],
		rayleighScatteringPerMeter: atmosphere.seaLevelRayleighScattering.values[index],
		mieExtinctionPerMeter: atmosphere.seaLevelMieExtinction.values[index],
		groundAlbedo: ground.values[index],
	}));
}

/** Convert one explicit production profile into the reusable offline recurrence request. */
export const DistantSunProfileCompilerInputs = Object.freeze({
	createInputSet(profile, options = {}) {
		requireProfile(profile);
		const geometryPolicy = DistantSunSceneCacheNumerics.accept(options.numericalPolicy);
		const atmosphere = profile.models.atmosphere;
		const constants = atmosphere.constants;
		const position = profile.domains.positions;
		const incoming = profile.domains.incomingDirections;
		const outgoing = profile.domains.outgoingDirections;
		const zenithNode = solarZenithNode(profile);
		const domains = {
			position: {
				id: position.id,
				count: position.count,
				nodes: position.nodes.map((node) => ({index: node.index, altitudeMeters: node.coordinate.value})),
			},
			solarZenith: {
				id: `${profile.id}:source-zenith`,
				count: 1,
				nodes: [zenithNode],
			},
			incoming: {
				id: incoming.id,
				directionCount: incoming.directionCount,
				unitVectors: incoming.unitVectors,
				integrationWeightsSteradians: incoming.integrationWeights.values,
			},
			outgoing: {
				id: outgoing.id,
				faceWidth: outgoing.faceWidth,
				directionCount: outgoing.directionCount,
				unitVectors: outgoing.unitVectors,
				positiveFaceCenterIndices: outgoing.positiveFaceCenterIndices,
			},
			spectrum: {
				id: profile.spectral.basis.id,
				contentHash: profile.spectral.basis.contentHash,
				channels: spectrumChannels(profile),
			},
		};
		const transportSpec = {
			id: `${profile.id}:offline-transport`,
			shaderProfile: {
				coordinateContract: 'production-source-aligned-v1',
			},
			source: {
				id: profile.models.lightSource.id,
				directionToLight: profile.models.sourcePlacement.placement.directionToLight,
				spectralIrradianceDensity: profile.spectral.sourceIrradianceDensity.values,
			},
			planet: {
				id: profile.models.geometry.id,
				bottomRadiusMeters: constants.bottomRadius.value,
				topRadiusMeters: constants.topRadius.value,
			},
			atmosphere: {
				id: atmosphere.id,
				rayleighScaleHeightMeters: constants.rayleighScaleHeight.value,
				mieScaleHeightMeters: constants.mieScaleHeight.value,
				rayleighCoefficientScalePerMeter: constants.rayleighCoefficientScale,
				mieAngstromAlpha: constants.mieAngstromAlpha,
				mieAngstromBeta: constants.mieAngstromBeta,
				mieSingleScatteringAlbedo: constants.mieSingleScatteringAlbedo,
				miePhaseFunctionG: constants.miePhaseFunctionG,
				ozone: {
					id: 'algorithm32-disabled-ozone-v1',
					absorptionEnabled: false,
					maximumDensityPerCubicMeter: 0,
					crossSectionTable: {
						minimumNanometers: 360,
						maximumNanometers: 830,
						spacingNanometers: 10,
						units: 'm^2',
						values: Array(48).fill(0),
					},
				},
			},
			ground: {id: profile.models.groundBoundary.id},
			numerical: {
				...(geometryPolicy ? {geometryPolicy} : {}),
				sourcePathTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
				transportIntervalCount: profile.numerical.cacheConstruction.transportIntervalCount,
				maximumScatteringOrder: profile.numerical.cacheConstruction.maximumScatteringOrder,
			},
			domains,
		};
		const numericalIdentity = CanonicalValueHash.sha256Value({
			profileContentHash: profile.contentHash,
			numerical: transportSpec.numerical,
			domains: {
				position: domains.position.id,
				solarZenith: domains.solarZenith,
				incoming: domains.incoming.id,
				outgoing: domains.outgoing.id,
				spectrum: domains.spectrum.contentHash,
			},
		});
		return Object.freeze({
			compilerIdentity: DISTANT_SUN_PROFILE_COMPILER_IDENTITY,
			numericalIdentity,
			profileIdentity: Object.freeze({
				id: profile.id,
				contentHash: profile.contentHash,
				schemaRevision: profile.schemaRevision,
				provenanceIdentity: profile.provenanceIdentity,
			}),
			buildRequest: Object.freeze({id: DISTANT_SUN_PROFILE_COMPILER_IDENTITY, transportSpec}),
		});
	},
});
