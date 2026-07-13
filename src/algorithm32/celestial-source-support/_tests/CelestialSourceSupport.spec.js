import {CelestialSourceSupport} from '../CelestialSourceSupport.js';

describe('CelestialSourceSupport', /** Called by Jasmine to register the named test suite. */ () => {
	it('derives canonical source identity from normalized executable facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		const left = {
			id: 'sun',
			kind: 'distant-uniform-sun',
			profile: 'uniform-disk',
			angularRadiusRadians: 0.0047,
			surfaceRadiance: 'sha256:radiance',
		};
		const right = {
			surfaceRadiance: 'sha256:radiance',
			angularRadiusRadians: 0.0047,
			profile: 'uniform-disk',
			kind: 'distant-uniform-sun',
			id: 'sun',
		};

		expect(CelestialSourceSupport.describeIdentity(left)).toEqual(CelestialSourceSupport.describeIdentity(right));
		expect(CelestialSourceSupport.describeIdentity(left)).toEqual({
			id: 'sun',
			kind: 'distant-uniform-sun',
			definitionHash: 'sha256:9cd4ba0e222b5cadafaf61b56210cec11edb51d8a83ded32dab00ec43cec8565',
		});
	});

	it('describes distinct logical fragments without cache packing or runtime facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		const angularRadius = {value: 0.0047, units: 'radians'};
		const catalog = {
			catalogId: 'bsc-v50',
			catalogVersion: 'V/50',
			catalogSha256: `sha256:${'1'.repeat(64)}`,
			selectionId: 'brightest-500',
			selectionSha256: `sha256:${'2'.repeat(64)}`,
			frame: 'fk5-j2000-mean-equatorial-rh-v1',
			epoch: {instant: '2000-01-01T12:00:00Z', timeScale: 'utc'},
		};
		const distantDefinition = /** @type {DistantSunCelestialSourceDefinition} */ ({
			id: 'sun',
			kind: 'distant-uniform-sun',
			angularRadius,
			surfaceRadiance: {},
			profile: 'uniform-disk',
		});
		const stellarDefinition = /** @type {StellarPointSetSourceDefinition} */ ({
			id: 'stars',
			kind: 'static-stellar-point-set',
			catalog,
			members: Array.from({length: 500}),
		});
		const radius = {value: 1000, units: 'meters'};
		const centerHeight = {value: 5000, units: 'meters'};
		const finiteDefinition = /** @type {FiniteLocalSunSourceDefinition} */ ({
			id: 'local-sun',
			kind: 'finite-local-sun',
			radius,
			centerHeight,
			surfaceRadiance: {},
			profile: 'uniform-disk',
		});

		expect(CelestialSourceSupport.describeFragment(distantDefinition)).toEqual({
			sourceId: 'sun',
			sourceKind: 'distant-uniform-sun',
			quantity: 'spectral-radiance-density',
			units: 'W m^-2 sr^-1 nm^-1',
			channelCount: 15,
			support: {angularRadius, profile: 'uniform-disk'},
		});
		expect(CelestialSourceSupport.describeFragment(stellarDefinition)).toEqual({
			sourceId: 'stars',
			sourceKind: 'static-stellar-point-set',
			quantity: 'spectral-irradiance-density',
			units: 'W m^-2 nm^-1',
			channelCount: 15,
			support: {catalog, memberCount: 500},
		});
		expect(CelestialSourceSupport.describeFragment(finiteDefinition)).toEqual({
			sourceId: 'local-sun',
			sourceKind: 'finite-local-sun',
			quantity: 'spectral-radiance-density',
			units: 'W m^-2 sr^-1 nm^-1',
			channelCount: 15,
			support: {radius, centerHeight, profile: 'uniform-disk'},
		});
	});
});
