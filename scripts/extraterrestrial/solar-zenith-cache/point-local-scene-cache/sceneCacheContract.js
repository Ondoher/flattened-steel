const native48AltitudesMeters = Object.freeze(Array.from(
	{length: 48},
	(_unused, index) => index === 0 ? 0 : ((index + 0.5) / 48) * 60000,
));

const commonSceneSupport = Object.freeze({
	location: Object.freeze({
		name: 'San Jose',
		latitudeDegrees: 37.3382,
		longitudeDegrees: -121.8863,
	}),
	bottomRadiusMeters: 6360000,
	topRadiusMeters: 6420000,
	observer: Object.freeze({
		heightMeters: 1.7,
		positionPolicy: 'fixed at the retained San Jose observer position',
	}),
	cameraSupport: Object.freeze({
		orientation: 'complete unit sphere',
		translation: 'none',
	}),
	rayEndpointSupport:
		'arbitrary Geometry-shortened endpoint from zero through the first object, ground, or atmosphere-exit termination',
});

function scene({id, label, timeIso, directionToSourceUpEastNorth}) {
	const solarElevationDegrees = Math.asin(directionToSourceUpEastNorth[0])
		* 180 / Math.PI;
	return Object.freeze({
		id,
		cacheIdentity: `san-jose-${id}-point-local-c4-native15-n4-v1`,
		label,
		timeIso,
		directionToSourceUpEastNorth: Object.freeze(directionToSourceUpEastNorth),
		solarElevationDegrees,
		observerSolarZenithDegrees: 90 - solarElevationDegrees,
		support: commonSceneSupport,
	});
}

export const POINT_LOCAL_SCENE_CACHE_CONTRACT = Object.freeze({
	schemaId: 'point-local-solar-zenith-scene-cache-contract-v1',
	semantic: Object.freeze({
		field: 'C4 = J1 + J2 + J3 + J4',
		quantity: 'cumulative local spectral scattering density',
		units: 'W m^-3 sr^-1 nm^-1 per Native15 bin-average spectral channel',
		coordinates: Object.freeze([
			'altitude',
			'actual local solar zenith',
			'complete local source-relative outgoing direction',
			'Native15 wavelength channel',
		]),
		excludedCoordinates: Object.freeze([
			'camera origin', 'camera orientation', 'camera ray length',
			'object identity', 'object depth', 'display state',
		]),
	}),
	geometryBoundary:
		'Geometry supplies t_end unchanged; Algorithm32 samples actual p=o+t*v and queries this cache at each sample.',
	domains: Object.freeze({
		altitude: Object.freeze({
			id: 'algorithm32-native-48-position-v2',
			count: 48,
			nodesMeters: native48AltitudesMeters,
		}),
		solarZenith: Object.freeze({
			id: 'uniform-solar-zenith-cell-centers-180x1-degree-v1',
			count: 180,
			firstCenterDegrees: 0.5,
			spacingDegrees: 1,
			interpolation: 'linear in solar-zenith angle',
		}),
		incoming: Object.freeze({
			id: 'reflection-completed-fibonacci-68-v1', count: 68,
		}),
		outgoingPoc: Object.freeze({
			id: 'cubed-sphere-w39-outgoing-v1', faceWidth: 39, count: 9126,
		}),
		outgoingSuccessor: Object.freeze({
			id: 'algorithm32-cubed-sphere-w27-outgoing-v1',
			faceWidth: 27, count: 4374,
		}),
		spectral: Object.freeze({
			id: 'algorithm32-native-15-spectral-basis-v1',
			count: 15,
			storage: 'R32F scalar per wavelength channel',
		}),
	}),
	construction: Object.freeze({
		maximumOrder: 4,
		constructionPathIntervals: 15,
		ozone: 'enabled using the retained lane-local Native15 atmosphere',
		precision: 'R32F resident field; implementation-defined transient precision',
	}),
	reconstruction: Object.freeze({
		maximumSpectrumTaps: 16,
		stencil: '2 altitude x 2 solar-zenith x 4 cubed-sphere direction',
		outOfSupport:
			'explicit lookup/build failure; never clamp to a retained row and never substitute spectral zero',
	}),
	packedLayout: Object.freeze({
		x: 'outgoing direction index',
		y: 'packed row index resolved from (altitude index, solar-zenith index)',
		z: 'Native15 wavelength layer',
		ledgerSchemaId: 'point-local-packed-row-ledger-v1',
		manifestSchemaId: 'point-local-scene-cache-manifest-v1',
	}),
	scenes: Object.freeze([
		scene({
			id: 'solar-noon',
			label: 'San Jose solar noon',
			timeIso: '2024-06-20T20:08:00.000Z',
			directionToSourceUpEastNorth: [
				0.9707655273706587, 0.0033828659702589154,
				-0.24000593135711085,
			],
		}),
		scene({
			id: 'nautical-twilight',
			label: 'San Jose one hour after sunset',
			timeIso: '2024-06-21T04:26:03.503Z',
			directionToSourceUpEastNorth: [
				-0.16946677586889025, -0.7579900644516986,
				0.6298667113517853,
			],
		}),
	]),
	historicalEvidence: Object.freeze([
		'000466-bruneton-source-luminance-lift-spherical-comparison',
		'000497-san-jose-nautical-actual-point-j1-causal-control',
		'000498-san-jose-nautical-zenith-culling-memory',
		'000509-san-jose-nautical-actual-point-cache-poc',
		'000511-san-jose-five-scene-actual-point-scattering',
		'000513-san-jose-solar-noon-near-ground-page',
		'000515-san-jose-solar-noon-validity-aware-runtime',
	]),
});

export default POINT_LOCAL_SCENE_CACHE_CONTRACT;

