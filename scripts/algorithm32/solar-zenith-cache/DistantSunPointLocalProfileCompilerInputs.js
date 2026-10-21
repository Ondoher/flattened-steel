import {DistantSunPointLocalCacheAerosolOptics as Aerosols} from './DistantSunPointLocalCacheAerosolOptics.js';
import {DistantSunScatteringAccuracy} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunScatteringAccuracy.js';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {SphericalNativePositionDomains} from '../../../src/algorithm32/sampling-domains/index.js';
import {DistantSunSceneCacheCompilerInputs} from './DistantSunSceneCacheCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';

export const DISTANT_SUN_POINT_LOCAL_PROFILE_COMPILER_IDENTITY =
	'algorithm32-offline-point-local-profile-driven-w27-z180-j4-v1';

const EXPECTED_PROFILE_KIND = 'algorithm32-execution-profile';

/**
 * Called by profile projection to accept one complete distant-Sun configuration.
 *
 * @param {DistantSunPointLocalExecutionProfile} profile - External execution profile.
 * @returns {SphericalNativePositionDomain} - Canonical physical altitude owner.
 * @throws {TypeError} - Missing execution-profile contract.
 * @throws {RangeError} - Unsupported physical models, domains, or numerical configuration.
 */
function requireProfile(profile) {
	if (!profile || profile.kind !== EXPECTED_PROFILE_KIND) {
		throw new TypeError('Point-local profile compilation requires one complete execution profile.');
	}
	if (
		profile.models?.lightSource?.kind !== 'distant-uniform-sun' ||
		profile.models?.atmosphere?.id !== 'canonical-atmosphere' ||
		profile.models?.geometry?.id !== 'spherical-earth-geometry' ||
		profile.models?.sourcePlacement?.kind !== 'explicit-geometry-placement'
	) {
		throw new RangeError('Point-local profile compilation requires the canonical distant-Sun model.');
	}
	if (
		profile.domains?.incomingDirections?.directionCount !== 68 ||
		profile.domains?.outgoingDirections?.faceWidth !== 27 ||
		profile.domains?.outgoingDirections?.directionCount !== 4374 ||
		profile.numerical?.cacheConstruction?.maximumScatteringOrder !== 4
	) {
		throw new RangeError('Point-local profile compilation requires F68/W27 cumulative J4.');
	}
	if (profile.models.atmosphere.constants.ozoneAbsorptionEnabled !== false) {
		throw new RangeError('Point-local profile projection currently requires the explicit no-ozone boundary.');
	}
	return SphericalNativePositionDomains.accept(profile.domains.positions);
}

/** Called by point-local compiler assembly to retain matched per-channel physical inputs.
 *
 * @param {DistantSunPointLocalExecutionProfile} profile - Complete canonical distant-Sun execution profile.
 * @returns {DistantSunSceneCacheCompilerChannel[]} - Ordered compiler spectral channel records.
 */
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
		throw new RangeError('Point-local spectral inputs must share the selected basis identity.');
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

/** Project explicit production profiles and their placements into the receiver-local compiler contract. */
export const DistantSunPointLocalProfileCompilerInputs = Object.freeze({
	/**
	 * Call this method to project one scene-independent Z180 construction request.
	 *
	 * @param {DistantSunPointLocalExecutionProfile} profile - Complete production configuration.
	 * @param {DistantSunSceneCacheCompilerOptions} [options] - Explicit candidate controls; a supplied grid selector must match the profile.
	 * @returns {DistantSunPointLocalProfileInputSet} - Accepted construction request and identities.
	 */
	createInputSet(profile, options = {}) {
		const positionDomainOwner = requireProfile(profile);
		if (
			options.positionDomain !== undefined &&
			SphericalNativePositionDomains.select(options.positionDomain) !== positionDomainOwner
		)
			throw new RangeError('Compiler position-domain selection disagrees with the execution profile.');
		const geometryPolicy = DistantSunSceneCacheNumerics.accept(options.numericalPolicy);
		const accuracy = DistantSunScatteringAccuracy.accept(options.scatteringAccuracy);
		if (
			options.solarInterpolation !== undefined &&
			!['linear', 'monotone-cubic'].includes(options.solarInterpolation)
		)
			throw new RangeError('Unsupported compiler solar interpolation.');
		const template = DistantSunSceneCacheCompilerInputs.createInputSet(
			DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene(),
		).buildRequest.transportSpec;
		const atmosphere = profile.models.atmosphere;
		const constants = atmosphere.constants;
		const channels = Aerosols.project(spectrumChannels(profile), options.spectralAerosols);
		const domains = {
			position: {
				id: profile.domains.positions.id,
				count: profile.domains.positions.count,
				nodes: profile.domains.positions.nodes.map((node) => ({
					index: node.index,
					altitudeMeters: node.coordinate.value,
				})),
			},
			solarZenith: template.domains.solarZenith,
			incoming: {
				id: profile.domains.incomingDirections.id,
				directionCount: profile.domains.incomingDirections.directionCount,
				unitVectors: profile.domains.incomingDirections.unitVectors,
				integrationWeightsSteradians: profile.domains.incomingDirections.integrationWeights.values,
			},
			outgoing: {
				id: profile.domains.outgoingDirections.id,
				faceWidth: profile.domains.outgoingDirections.faceWidth,
				directionCount: profile.domains.outgoingDirections.directionCount,
				unitVectors: profile.domains.outgoingDirections.unitVectors,
				positiveFaceCenterIndices: profile.domains.outgoingDirections.positiveFaceCenterIndices,
			},
			spectrum: {
				id: profile.spectral.basis.id,
				contentHash: profile.spectral.basis.contentHash,
				channels,
			},
		};
		const transportSpec = {
			id: `${profile.spectral.basis.id}:point-local-offline-transport`,
			shaderProfile: {coordinateContract: 'scene-cache-receiver-local-v1'},
			source: {
				id: profile.models.lightSource.id,
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
				// Every channel carries its explicit scattering coefficient. Retain the accepted
				// receiver-local fallback so unused shader constants remain compatibility-stable.
				rayleighCoefficientScalePerMeter: template.atmosphere.rayleighCoefficientScalePerMeter,
				mieAngstromAlpha: constants.mieAngstromAlpha,
				mieAngstromBeta: constants.mieAngstromBeta,
				mieSingleScatteringAlbedo: constants.mieSingleScatteringAlbedo,
				miePhaseFunctionG: constants.miePhaseFunctionG,
				ozone: {
					id: 'algorithm32-disabled-ozone-v1',
					absorptionEnabled: false,
					temperatureKelvin: 233,
					dobsonUnits: 0,
					dobsonUnitMoleculesPerSquareMeter: 2.687e20,
					densityIntegralMeters: 15000,
					profileAltitudesMeters: {bottom: 10000, peak: 25000, top: 40000},
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
				...(accuracy === 'legacy' ? {} : {scatteringAccuracy: accuracy}),
				...(geometryPolicy ? {geometryPolicy} : {}),
				...(options.solarInterpolation === 'monotone-cubic'
					? {solarInterpolation: options.solarInterpolation}
					: {}),
				sourcePathTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
				transportIntervalCount: DistantSunScatteringAccuracy.transportIntervals(
					accuracy,
					profile.numerical.cacheConstruction.transportIntervalCount,
				),
				maximumScatteringOrder: profile.numerical.cacheConstruction.maximumScatteringOrder,
			},
			domains,
		};
		const buildRequest = {id: DISTANT_SUN_POINT_LOCAL_PROFILE_COMPILER_IDENTITY, transportSpec};
		return Object.freeze({
			compilerIdentity: DISTANT_SUN_POINT_LOCAL_PROFILE_COMPILER_IDENTITY,
			numericalIdentity: CanonicalValueHash.sha256Value(buildRequest),
			constructionProfileIdentity: Object.freeze({
				id: `${profile.spectral.basis.id}:point-local-construction`,
				contentHash: CanonicalValueHash.sha256Value({
					spectral: profile.spectral,
					atmosphere: profile.models.atmosphere.id,
					geometry: profile.models.geometry.id,
					ground: profile.models.groundBoundary,
					numerical: profile.numerical.cacheConstruction,
					...(accuracy === 'legacy'
						? {}
						: {scatteringAccuracy: accuracy, effectiveNumerical: transportSpec.numerical}),
					...(positionDomainOwner.count === 51 ? {positionDomain: domains.position} : {}),
				}),
			}),
			buildRequest: Object.freeze(buildRequest),
		});
	},

	/** Convert one production profile placement into an explicit point-local scene request. */
	createScene(profile, id = profile?.id, observerAltitudeMeters = 0) {
		requireProfile(profile);
		const direction = profile.models.sourcePlacement.placement.directionToLight;
		if (
			!Array.isArray(direction) ||
			direction.length !== 3 ||
			direction.some((component) => !Number.isFinite(component)) ||
			Math.abs(Math.hypot(...direction) - 1) > 1e-10
		) {
			throw new RangeError('Point-local scene projection requires a finite unit source direction.');
		}
		return Object.freeze({
			id,
			zenithDegrees: (Math.acos(Math.max(-1, Math.min(1, direction[2]))) * 180) / Math.PI,
			observerAltitudeMeters,
			instant: profile.models.sourcePlacement.observation.instant,
			profileIdentity: {
				id: profile.id,
				contentHash: profile.contentHash,
				schemaRevision: profile.schemaRevision,
				provenanceIdentity: profile.provenanceIdentity,
			},
		});
	},

	/** Create one shared construction request and ordered scenes from an arbitrary compatible profile list. */
	createBatch(
		profiles,
		{
			ids = profiles?.map((profile) => profile.id),
			observerAltitudeMeters = 0,
			numericalPolicy = undefined,
			scatteringAccuracy = undefined,
			solarInterpolation = undefined,
			positionDomain = undefined,
			spectralAerosols = undefined,
		} = {},
	) {
		if (
			!Array.isArray(profiles) ||
			profiles.length === 0 ||
			!Array.isArray(ids) ||
			ids.length !== profiles.length
		) {
			throw new RangeError('Point-local profile batching requires matching nonempty profile and scene-id lists.');
		}
		const input = DistantSunPointLocalProfileCompilerInputs.createInputSet(profiles[0], {
			numericalPolicy,
			scatteringAccuracy,
			solarInterpolation,
			positionDomain,
			spectralAerosols,
		});
		const scenes = profiles.map((profile, index) => {
			const candidate = DistantSunPointLocalProfileCompilerInputs.createInputSet(profile, {
				numericalPolicy,
				scatteringAccuracy,
				solarInterpolation,
				positionDomain,
				spectralAerosols,
			});
			if (candidate.numericalIdentity !== input.numericalIdentity) {
				throw new RangeError('Point-local profile batching requires one compatible construction profile.');
			}
			return DistantSunPointLocalProfileCompilerInputs.createScene(profile, ids[index], observerAltitudeMeters);
		});
		return Object.freeze({
			...input,
			scenes: Object.freeze(scenes),
			wavelengths: Object.freeze(
				input.buildRequest.transportSpec.domains.spectrum.channels.map((_channel, index) => index),
			),
		});
	},
});
