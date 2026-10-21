import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	SphericalNativePositionDomains,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
} from '../../../src/algorithm32/sampling-domains/index.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../../src/algorithm32/profiles/native-15/native-15-profile.js';
import DistantSunSceneCacheLedger from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheLedger.js';
import {DISTANT_SUN_SCENE_CACHE_COMPILER_IDENTITY, DISTANT_SUN_SCENE_CACHE_NUMERICAL_IDENTITY} from './consts.js';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';
import {DistantSunScatteringAccuracy} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunScatteringAccuracy.js';

/** Cohesive production input owner for the offline distant-Sun scene-cache compiler. */
export const DistantSunSceneCacheCompilerInputs = {
	/**
	 * Call this method to return the first qualified San Jose nautical-twilight scene definition.
	 *
	 * @returns {DistantSunSceneCacheCompilerScene} - The exact scene and fixed support.
	 */
	createQualifiedSanJoseNauticalScene() {
		/** @type {UnitVector3} */
		const directionToSourceUpEastNorth = [-0.16946677586889025, -0.7579900644516986, 0.6298667113517853];
		const observerSolarZenithRadians = Math.acos(directionToSourceUpEastNorth[0]);

		return {
			sceneSun: {
				id: 'san-jose-nautical-twilight',
				instant: '2024-06-21T04:26:03.503Z',
				directionToSourceUpEastNorth,
				sourceIdentity: 'algorithm32-native-distant-collimated-sun-v1',
			},
			support: {
				id: 'san-jose-fixed-observer-complete-rotation-v1',
				bottomRadius: {value: 6360000, units: 'meters'},
				topRadius: {value: 6420000, units: 'meters'},
				observerAltitude: {value: 1.7, units: 'meters'},
				observerSolarZenith: {value: observerSolarZenithRadians, units: 'radians'},
				completeCameraRotation: true,
				arbitraryShortenedEndpoint: true,
			},
		};
	},

	/**
	 * Call this method to create a Native48 or explicitly selected Native51/Z180/W27/F68/Native15/N4 request.
	 *
	 * @param {DistantSunSceneCacheCompilerScene} scene - The exact scene Sun state and fixed support.
	 * @param {DistantSunSceneCacheCompilerOptions} [options] - Explicit candidate controls.
	 * @returns {DistantSunSceneCacheCompilerInputSet} - The compiler request, ledger, scene, and identities.
	 */
	createInputSet(scene, options = {}) {
		const positionDomain = SphericalNativePositionDomains.select(options.positionDomain);
		const geometryPolicy = DistantSunSceneCacheNumerics.accept(options.numericalPolicy);
		const accuracy = DistantSunScatteringAccuracy.accept(options.scatteringAccuracy);
		if (
			options.solarInterpolation !== undefined &&
			!['linear', 'monotone-cubic'].includes(options.solarInterpolation)
		)
			throw new RangeError('Unsupported compiler solar interpolation.');
		const ledger = new DistantSunSceneCacheLedger({
			...scene,
			positionDomain,
			solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
			outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		});
		const spectrumChannels = NATIVE_15_SPECTRAL_BASIS.channels.map((channel, index) => ({
			id: channel.id,
			centerNanometers: channel.center.value,
			binWidthNanometers: channel.width.value,
			sourceIrradianceDensityWattsPerSquareMeterPerNanometer: NATIVE_SOURCE_IRRADIANCE_DENSITY.values[index],
		}));
		const domains = {
			position: {
				id: positionDomain.id,
				count: positionDomain.count,
				nodes: positionDomain.nodes.map((node) => ({
					index: node.index,
					altitudeMeters: node.coordinate.value,
				})),
			},
			solarZenith: {
				id: SOLAR_ZENITH_180_DOMAIN_OWNER.id,
				count: SOLAR_ZENITH_180_DOMAIN_OWNER.count,
				nodes: SOLAR_ZENITH_180_DOMAIN_OWNER.nodes.map((node) => ({
					index: node.index,
					solarZenithDegrees: 0.5 + node.index,
					muS: node.muS,
				})),
			},
			incoming: {
				id: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.id,
				directionCount: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount,
				unitVectors: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.unitVectors,
				integrationWeightsSteradians:
					REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.integrationWeights.values,
			},
			outgoing: {
				id: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.id,
				faceWidth: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.faceWidth,
				directionCount: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount,
				unitVectors: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unitVectors,
				positiveFaceCenterIndices: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.positiveFaceCenterIndices,
			},
			spectrum: {
				id: NATIVE_15_SPECTRAL_BASIS.id,
				channels: spectrumChannels,
			},
		};
		const transportSpec = {
			id: 'algorithm32-qualified-point-local-distant-sun-transport-v1',
			source: {
				id: scene.sceneSun.sourceIdentity,
				spectralIrradianceDensity: NATIVE_SOURCE_IRRADIANCE_DENSITY.values,
			},
			planet: {
				id: 'algorithm32-spherical-earth-6360-6420km-v1',
				bottomRadiusMeters: 6360000,
				topRadiusMeters: 6420000,
			},
			atmosphere: {
				id: 'algorithm32-canonical-no-ozone-v1',
				rayleighScaleHeightMeters: 8000,
				mieScaleHeightMeters: 1200,
				rayleighCoefficientScalePerMeter: 0.00000124062,
				mieAngstromAlpha: 0.8,
				mieAngstromBeta: 0.04,
				mieSingleScatteringAlbedo: 0.8,
				miePhaseFunctionG: 0.7,
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
			ground: {id: 'algorithm32-canonical-black-ground-boundary-v1'},
			numerical: {
				...(accuracy === 'legacy' ? {} : {scatteringAccuracy: accuracy}),
				...(geometryPolicy ? {geometryPolicy} : {}),
				...(options.solarInterpolation === 'monotone-cubic'
					? {solarInterpolation: options.solarInterpolation}
					: {}),
				sourcePathTransmittanceIntervalCount: 20,
				transportIntervalCount: DistantSunScatteringAccuracy.transportIntervals(accuracy, 15),
				maximumScatteringOrder: 4,
			},
			domains,
		};

		return {
			compilerIdentity: DISTANT_SUN_SCENE_CACHE_COMPILER_IDENTITY,
			numericalIdentity:
				geometryPolicy ||
				accuracy !== 'legacy' ||
				options.solarInterpolation === 'monotone-cubic' ||
				positionDomain !== NATIVE_48_POSITION_DOMAIN_OWNER
					? CanonicalValueHash.sha256Value(transportSpec)
					: DISTANT_SUN_SCENE_CACHE_NUMERICAL_IDENTITY,
			scene,
			ledger,
			buildRequest: {
				id: DISTANT_SUN_SCENE_CACHE_COMPILER_IDENTITY,
				transportSpec,
			},
		};
	},
};
