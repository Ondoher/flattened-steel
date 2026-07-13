import {SphericalEarthGeometry} from '../../../src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {UniformLambertianGroundBoundary} from '../../../src/algorithm32/implementation/uniform-lambertian-ground/UniformLambertianGroundBoundary.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../../src/algorithm32/spectral-values/index.js';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {computeTheoreticalSunDirection, getSampleDirection} from '../b1-directional-sky-radiance/benchmark-domain.js';
import {createBrunetonProductionProfile} from '../b1-directional-sky-radiance/production-profile.js';

function directionFromAngles(zenithDegrees, azimuthDegrees, frame) {
	const zenith = (zenithDegrees * Math.PI) / 180;
	const azimuth = (azimuthDegrees * Math.PI) / 180;
	const horizontal = Math.sin(zenith);
	return frame === 'retained-z-up'
		? [horizontal * Math.cos(azimuth), horizontal * Math.sin(azimuth), Math.cos(zenith)]
		: [Math.cos(zenith), horizontal * Math.sin(azimuth), horizontal * Math.cos(azimuth)];
}

function assertFrame(frame) {
	if (!['current-x-up', 'retained-z-up'].includes(frame)) throw new RangeError(`Unsupported frame: ${frame}`);
}

function createProfile(
	condition,
	maximumScatteringOrder,
	frame = 'retained-z-up',
	groundVariant = 'production',
	boundaryAltitudeMeters = 2,
) {
	assertFrame(frame);
	if (!['production', 'black'].includes(groundVariant)) {
		throw new RangeError(`Unsupported ground variant: ${groundVariant}`);
	}
	if (![0, 0.001, 2].includes(boundaryAltitudeMeters)) {
		throw new RangeError('Unsupported boundary altitude: expected 0, 0.001, or 2 meters.');
	}
	const base = createBrunetonProductionProfile({
		time: condition.time,
		fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
		maximumScatteringOrder,
	});
	const theoreticalSun = computeTheoreticalSunDirection(condition.time);
	const directionToLight = directionFromAngles(
		theoreticalSun.zenithDegrees,
		condition.sun.fittedAzimuthDegrees,
		frame,
	);
	const observerUpDirection = frame === 'retained-z-up' ? [0, 0, 1] : [1, 0, 0];
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6360000, units: 'meters'},
		topRadius: {value: 6420000, units: 'meters'},
		observerHeight: {value: 0, units: 'meters'},
		observerUpDirection,
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: {value: boundaryAltitudeMeters, units: 'meters'},
		sourceTransmittanceIntervalCount: 20,
	});
	const basePositionDomain = base.domains.positions;
	const positionDomain = Object.assign(Object.create(Object.getPrototypeOf(basePositionDomain)), basePositionDomain, {
		id: `${basePositionDomain.id}-boundary-${boundaryAltitudeMeters}m`,
		boundaryAltitude: {value: boundaryAltitudeMeters, units: 'meters'},
		nodes: basePositionDomain.nodes.map((node, index) =>
			index === 0
				? {
						...node,
						coordinate: {value: boundaryAltitudeMeters, units: 'meters'},
						role: 'minimum-in-atmosphere-altitude',
					}
				: node,
		),
	});
	const models = {
		...base.models,
		geometry,
		groundBoundary:
			groundVariant === 'production'
				? base.models.groundBoundary
				: new UniformLambertianGroundBoundary({
						id: 'frame-parity-black-ground',
						albedo: new SpectralPacket({
							basis: base.models.groundBoundary.albedo.basis,
							quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
							units: SPECTRAL_UNITS.DIMENSIONLESS,
							values: base.models.groundBoundary.albedo.values.map(() => 0),
							provenanceIdentity: 'algorithm32-frame-parity:black-ground',
						}),
					}),
		sourcePlacement: {
			...base.models.sourcePlacement,
			placement: {kind: 'distant-direction', directionToLight},
		},
	};
	return {
		...base,
		id: `${base.id}-${frame}`,
		contentHash: CanonicalValueHash.sha256Value({
			base: base.contentHash,
			frame,
			directionToLight,
			groundVariant,
			boundaryAltitudeMeters,
		}),
		domains: {...base.domains, positions: positionDomain},
		models,
	};
}

function createViewDirection(gridX, gridY, frame = 'retained-z-up') {
	assertFrame(frame);
	const direction = getSampleDirection(gridX, gridY);
	return directionFromAngles(direction.zenithDegrees, direction.azimuthDegrees, frame);
}

export const FrameDomain = Object.freeze({createProfile, createViewDirection});
