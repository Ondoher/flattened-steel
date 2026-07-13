import {CanonicalAtmosphere} from '../../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {DistantSunLightSource} from '../../../src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {SphericalEarthGeometry} from '../../../src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {UniformLambertianGroundBoundary} from '../../../src/algorithm32/implementation/uniform-lambertian-ground/UniformLambertianGroundBoundary.js';
import {
	FIBONACCI_34_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
	SphericalNativePositionDomain,
} from '../../../src/algorithm32/sampling-domains/index.js';
import {
	SpectralBasis,
	SpectralPacket,
	SPECTRAL_BASIS_SCHEMA_REVISION,
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
} from '../../../src/algorithm32/spectral-values/index.js';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {computeTheoreticalSunDirection, getSampleDirection, SPECTRUM} from './benchmark-domain.js';
import DensePairedFibonacciDirectionDomain from './DensePairedFibonacciDirectionDomain.js';
import {BrunetonAngularIntegrationDirectionDomain} from './BrunetonAngularIntegrationDirectionDomain.js';
import ReflectionCompletedFibonacci136DirectionDomain from './ReflectionCompletedFibonacci136DirectionDomain.js';
import ReflectionCompletedFibonacci68DirectionDomain from './ReflectionCompletedFibonacci68DirectionDomain.js';

export const BRUNETON_SOURCE_REVISION = '4df2ec6609bc0127a478bd34fff29c94352579cc';
export const PROFILE_SCHEMA_REVISION = 'algorithm32-execution-profile-v1';

const SOLAR_IRRADIANCE = Object.freeze([
	1.13419, 1.09801, 1.03541, 1.45086, 1.72453, 1.654, 1.70536, 1.97393, 2.03543, 2.00643, 1.95531, 1.95426, 1.92438,
	1.82092, 1.88517, 1.85545, 1.85083, 1.82758, 1.84475, 1.78771, 1.76683, 1.70858, 1.68278, 1.63849, 1.59608, 1.52211,
	1.52468, 1.47836, 1.4485, 1.40522, 1.35526, 1.32788, 1.28834, 1.26938, 1.23241, 1.20345, 1.17087, 1.1344, 1.11012,
	1.07147,
]);

const PENNDORF_SCATTERING = Object.freeze([
	70.45e-6, 62.82e-6, 56.2e-6, 50.43e-6, 45.4e-6, 40.98e-6, 37.08e-6, 33.65e-6, 30.6e-6, 27.89e-6, 25.48e-6, 23.33e-6,
	21.4e-6, 19.66e-6, 18.1e-6, 16.69e-6, 15.42e-6, 14.26e-6, 13.21e-6, 12.26e-6, 11.39e-6, 10.6e-6, 9.876e-6, 9.212e-6,
	8.604e-6, 8.045e-6, 7.531e-6, 7.057e-6, 6.62e-6, 6.217e-6, 5.844e-6, 5.498e-6, 5.178e-6, 4.881e-6, 4.605e-6,
	4.348e-6, 4.109e-6, 3.886e-6, 3.678e-6, 3.484e-6, 3.302e-6, 3.132e-6, 2.973e-6, 2.824e-6, 2.684e-6, 2.583e-6,
	2.481e-6, 2.38e-6,
]);

const GRASS_ALBEDO = Object.freeze([
	0.018, 0.019, 0.019, 0.02, 0.022, 0.024, 0.027, 0.029, 0.03, 0.031, 0.032, 0.032, 0.032, 0.033, 0.035, 0.04, 0.055,
	0.073, 0.084, 0.089, 0.089, 0.079, 0.069, 0.063, 0.061, 0.057, 0.052, 0.051, 0.048, 0.042, 0.039, 0.035, 0.035,
	0.043, 0.087, 0.156, 0.234, 0.334, 0.437, 0.513, 0.553, 0.571, 0.579, 0.581, 0.587,
]);

const BRUNETON_POSITION_DOMAIN = new SphericalNativePositionDomain({
	id: 'b1-bruneton-spherical-48-position-boundary-0m-v1',
	count: 48,
	boundaryAltitude: {value: 0, units: 'meters'},
});

function interpolateUniform(values, minimum, maximum, coordinate) {
	const clamped = Math.max(minimum, Math.min(maximum, coordinate));
	const position = ((clamped - minimum) * (values.length - 1)) / (maximum - minimum);
	const lowerIndex = Math.floor(position);
	const upperIndex = Math.min(values.length - 1, lowerIndex + 1);
	const fraction = position - lowerIndex;
	return values[lowerIndex] * (1 - fraction) + values[upperIndex] * fraction;
}

function directionFromZenithAzimuth(zenithDegrees, azimuthDegrees) {
	const zenith = (zenithDegrees * Math.PI) / 180;
	const azimuth = (azimuthDegrees * Math.PI) / 180;
	const horizontal = Math.sin(zenith);
	return Object.freeze([horizontal * Math.cos(azimuth), horizontal * Math.sin(azimuth), Math.cos(zenith)]);
}

function utcInstantFor(time) {
	const [hour, minute] = time.split(':').map(Number);
	return `2013-05-27T${String(hour + 4).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
}

export function createDirect40Basis() {
	return new SpectralBasis({
		id: 'b1-bruneton-direct-40-v1',
		schemaRevision: SPECTRAL_BASIS_SCHEMA_REVISION,
		semantics: SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY,
		channels: Array.from({length: SPECTRUM.size}, (_, index) => ({
			id: `lambda-${index}`,
			center: {value: SPECTRUM.minimumNm + SPECTRUM.spacingNm * index, units: 'nanometers'},
			width: {value: SPECTRUM.spacingNm, units: 'nanometers'},
		})),
	});
}

function createPacket(basis, quantity, values, provenanceIdentity) {
	return new SpectralPacket({
		basis,
		quantity,
		units:
			quantity === SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY
				? SPECTRAL_UNITS.IRRADIANCE_DENSITY
				: quantity === SPECTRAL_QUANTITIES.REFLECTANCE
					? SPECTRAL_UNITS.DIMENSIONLESS
					: SPECTRAL_UNITS.INVERSE_LENGTH,
		values,
		provenanceIdentity,
	});
}

export function createBrunetonProductionProfile({
	time,
	fittedAzimuthDegrees,
	maximumScatteringOrder = 4,
	incomingDirectionVariant = 'production-68',
}) {
	if (
		![
			'production-68',
			'ordinary-fibonacci-34',
			'bruneton-angular-288',
			'bruneton-angular-392',
			'bruneton-angular-512',
			'paired-fibonacci-272',
			'paired-fibonacci-544',
			'reflection-completed-ordinary-68',
			'reflection-completed-136',
		].includes(incomingDirectionVariant)
	) {
		throw new RangeError(`Unsupported B1 incoming-direction variant: ${incomingDirectionVariant}.`);
	}
	const theoreticalSun = computeTheoreticalSunDirection(time);
	const basis = createDirect40Basis();
	const wavelengths = basis.channels.map((channel) => channel.center.value);
	const sourceIrradianceDensity = createPacket(
		basis,
		SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		SOLAR_IRRADIANCE,
		`b1-bruneton-${BRUNETON_SOURCE_REVISION}:solar`,
	);
	const temperatureCorrection = 273.16 / (273.16 + 15);
	const rayleigh = createPacket(
		basis,
		SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
		wavelengths.map(
			(wavelength) => interpolateUniform(PENNDORF_SCATTERING, 360, 830, wavelength) * temperatureCorrection,
		),
		`b1-bruneton-${BRUNETON_SOURCE_REVISION}:penndorf`,
	);
	const mieExtinction = createPacket(
		basis,
		SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
		wavelengths.map((wavelength) => (0.04 * Math.pow(wavelength / 1000, -0.8)) / 1200),
		`b1-bruneton-${BRUNETON_SOURCE_REVISION}:mie-extinction`,
	);
	const albedo = createPacket(
		basis,
		SPECTRAL_QUANTITIES.REFLECTANCE,
		wavelengths.map((wavelength) => interpolateUniform(GRASS_ALBEDO, 360, 800, wavelength)),
		`b1-bruneton-${BRUNETON_SOURCE_REVISION}:grass`,
	);
	const lightSource = new DistantSunLightSource({
		angularRadius: {value: 0.004675, units: 'radians'},
		sourceIrradiance: sourceIrradianceDensity,
	});
	const atmosphere = new CanonicalAtmosphere({
		constants: {
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
			rayleighScaleHeight: {value: 8000, units: 'meters'},
			mieScaleHeight: {value: 1200, units: 'meters'},
			rayleighCoefficientScale: 5.8e-6,
			mieAngstromAlpha: 0.8,
			mieAngstromBeta: 0.04,
			mieSingleScatteringAlbedo: 0.8,
			miePhaseFunctionG: 0.7,
			ozoneAbsorptionEnabled: false,
		},
		spectralBasis: basis,
		seaLevelRayleighScattering: rayleigh,
		seaLevelMieExtinction: mieExtinction,
	});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6360000, units: 'meters'},
		topRadius: {value: 6420000, units: 'meters'},
		observerHeight: {value: 0, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: BRUNETON_POSITION_DOMAIN.boundaryAltitude,
		sourceTransmittanceIntervalCount: 20,
	});
	const groundBoundary = new UniformLambertianGroundBoundary({
		id: 'b1-bruneton-grass-v1',
		albedo,
	});
	const observation = {
		instant: utcInstantFor(time),
		location: {
			latitude: {value: 42.44337, units: 'degrees'},
			longitude: {value: -76.48163, units: 'degrees'},
		},
	};
	const directionToLight = directionFromZenithAzimuth(theoreticalSun.zenithDegrees, fittedAzimuthDegrees);
	const brunetonAngularSampleCounts = {
		'bruneton-angular-288': {polarSampleCount: 12, azimuthSampleCount: 24},
		'bruneton-angular-392': {polarSampleCount: 14, azimuthSampleCount: 28},
		'bruneton-angular-512': {polarSampleCount: 16, azimuthSampleCount: 32},
	}[incomingDirectionVariant];
	const incomingDirections =
		brunetonAngularSampleCounts !== undefined
			? new BrunetonAngularIntegrationDirectionDomain(directionToLight, [0, 0, 1], brunetonAngularSampleCounts)
			: incomingDirectionVariant === 'paired-fibonacci-272'
				? new DensePairedFibonacciDirectionDomain(272)
				: incomingDirectionVariant === 'paired-fibonacci-544'
					? new DensePairedFibonacciDirectionDomain(544)
					: incomingDirectionVariant === 'reflection-completed-ordinary-68'
						? new ReflectionCompletedFibonacci68DirectionDomain()
						: incomingDirectionVariant === 'reflection-completed-136'
							? new ReflectionCompletedFibonacci136DirectionDomain()
							: incomingDirectionVariant === 'ordinary-fibonacci-34'
								? FIBONACCI_34_DIRECTION_DOMAIN_OWNER
								: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER;
	const domains = {
		positions: BRUNETON_POSITION_DOMAIN,
		incomingDirections,
		outgoingDirections: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	};
	const numerical = {
		viewPath: {intervalCount: 40, sampleDistribution: null},
		sourcePathTransmittance: {intervalCount: 20},
		cacheConstruction: {transportIntervalCount: 40, maximumScatteringOrder},
	};
	const profileIdentity = {
		authority: BRUNETON_SOURCE_REVISION,
		time,
		fittedAzimuthDegrees,
		maximumScatteringOrder,
		incomingDirectionVariant,
		basis: basis.contentHash,
		source: sourceIrradianceDensity.contentHash,
		rayleigh: rayleigh.contentHash,
		mieExtinction: mieExtinction.contentHash,
		albedo: albedo.contentHash,
		directionToLight,
		numerical,
		domains: {
			positions: domains.positions.id,
			incomingDirections: domains.incomingDirections.id,
			outgoingDirections: domains.outgoingDirections.id,
		},
	};

	return {
		kind: 'algorithm32-execution-profile',
		id: `b1-bruneton-${time.replace(':', '')}-j${maximumScatteringOrder}${
			incomingDirectionVariant === 'production-68' ? '' : `-${incomingDirectionVariant}`
		}-v1`,
		schemaRevision: PROFILE_SCHEMA_REVISION,
		revision: 1,
		contentHash: CanonicalValueHash.sha256Value(profileIdentity),
		provenanceIdentity: `b1-bruneton-${BRUNETON_SOURCE_REVISION}`,
		spectral: {basis, sourceIrradianceDensity},
		models: {
			lightSource,
			atmosphere,
			geometry,
			groundBoundary,
			celestialSources: null,
			sourcePlacement: {
				kind: 'explicit-geometry-placement',
				observation,
				placement: {kind: 'distant-direction', directionToLight},
			},
		},
		numerical,
		domains,
	};
}

export function createViewDirection(gridX, gridY) {
	const direction = getSampleDirection(gridX, gridY);
	return directionFromZenithAzimuth(direction.zenithDegrees, direction.azimuthDegrees);
}
