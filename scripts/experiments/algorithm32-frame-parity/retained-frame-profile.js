import {SphericalEarthGeometry} from '../../../src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {computeTheoreticalSunDirection, getSampleDirection} from '../b1-directional-sky-radiance/benchmark-domain.js';
import {createBrunetonProductionProfile} from '../b1-directional-sky-radiance/production-profile.js';

function directionFromZenithAzimuth(zenithDegrees, azimuthDegrees) {
	const zenith = (zenithDegrees * Math.PI) / 180;
	const azimuth = (azimuthDegrees * Math.PI) / 180;
	const horizontal = Math.sin(zenith);
	return [horizontal * Math.cos(azimuth), horizontal * Math.sin(azimuth), Math.cos(zenith)];
}

export function createRetainedFrameProfile(request) {
	const base = createBrunetonProductionProfile(request);
	const theoreticalSun = computeTheoreticalSunDirection(request.time);
	const directionToLight = directionFromZenithAzimuth(theoreticalSun.zenithDegrees, request.fittedAzimuthDegrees);
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6360000, units: 'meters'},
		topRadius: {value: 6420000, units: 'meters'},
		observerHeight: {value: 0, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: {value: 2, units: 'meters'},
		sourceTransmittanceIntervalCount: 20,
	});
	return {
		...base,
		id: `${base.id}-retained-z-up`,
		contentHash: CanonicalValueHash.sha256Value({base: base.contentHash, frame: 'retained-z-up', directionToLight}),
		models: {
			...base.models,
			geometry,
			sourcePlacement: {
				...base.models.sourcePlacement,
				placement: {kind: 'distant-direction', directionToLight},
			},
		},
	};
}

export function createRetainedFrameViewDirection(gridX, gridY) {
	const direction = getSampleDirection(gridX, gridY);
	return directionFromZenithAzimuth(direction.zenithDegrees, direction.azimuthDegrees);
}
