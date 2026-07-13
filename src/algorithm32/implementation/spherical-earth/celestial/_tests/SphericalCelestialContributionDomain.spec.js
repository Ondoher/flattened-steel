import {DistantSunLightSource, SphericalEarthGeometry, StellarPointSetSource} from '../../../index.js';
import DistanceMath from '../../../../math/DistanceMath.js';
import {SphericalCelestialContributionDomain} from '../SphericalCelestialContributionDomain.js';

const OBSERVATION = {
	instant: '2024-06-21T03:26:03.503Z',
	location: {
		latitude: {value: 0, units: /** @type {const} */ ('degrees')},
		longitude: {value: 0, units: /** @type {const} */ ('degrees')},
	},
};

/**
 * Create configured spherical geometry and its shared distant Sun.
 *
 * @param {Readonly<{observation?: GeometryObservation, direction?: UnitVector3, angularRadiusRadians?: number, topRadiusMeters?: number}>} [options] - Fixture overrides.
 * @returns {{geometry: SphericalEarthGeometry, sun: DistantSunLightSource, observation: GeometryObservation}} - Configured owners.
 */
function createConfiguredOwners(options = {}) {
	const observation = options.observation ?? OBSERVATION;
	const sun = new DistantSunLightSource({
		angularRadius: {value: options.angularRadiusRadians ?? 0.01, units: 'radians'},
	});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6_360_000, units: 'meters'},
		topRadius: {value: options.topRadiusMeters ?? 6_420_000, units: 'meters'},
		observerHeight: {value: 1_000, units: 'meters'},
		observerUpDirection: [0, 0, 1],
	});
	geometry.configureLightSource({
		lightSource: sun,
		observation,
		placement: {
			kind: 'distant-direction',
			directionToLight: options.direction ?? [0, 0, 1],
		},
	});

	return {geometry, sun, observation};
}

/**
 * Create one spherical roster.
 *
 * @param {DistantSunLightSource} sun - Exact configured atmospheric Sun.
 * @param {StellarPointSetSource | null} [stars] - Optional reviewed stellar source.
 * @returns {SphericalSunStarsSourceRoster} - Accepted roster shape.
 */
function createRoster(sun, stars = null) {
	return {
		id: 'spherical-sun-stars-test-roster',
		family: 'spherical-sun-stars-radial-v1',
		sun,
		stars,
	};
}

describe('SphericalCelestialContributionDomain', /** Called by Jasmine to register the named test suite. */ () => {
	it('describes the qualified 13-by-11 domain with exact ground and atmosphere-top endpoints', /** Called by Jasmine to exercise the named behavior. */ () => {
		const {geometry} = createConfiguredOwners();
		const domain = geometry.describeCelestialContributionDomain();

		expect(geometry.celestialCapabilityFamily).toBe('spherical-sun-stars-radial-v1');
		expect(domain.family).toBe('spherical-sun-stars-radial-v1');
		expect(domain.altitudeNodes.map((node) => node.value)).toEqual([
			0, 250, 500, 750, 1_000, 5_000, 10_000, 15_000, 25_000, 35_000, 42_500, 50_000, 60_000,
		]);
		expect(domain.directionCoordinates).toEqual([
			0, 0.03125, 0.0625, 0.09375, 0.125, 0.25, 0.5, 0.75, 0.875, 0.9375, 1,
		]);
		expect(domain.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
	});

	it('contributes the geometry-owned two-axis celestial-cache stencil representation', /** Called by Jasmine to exercise the named behavior. */ () => {
		const {geometry, sun, observation} = createConfiguredOwners();
		const roster = createRoster(sun);
		const placements = geometry.resolveCelestialPlacements({roster, observation});
		const queryPacket = geometry.createCelestialQueryPacket(roster, placements);
		const contribution = geometry.createCelestialCacheShaderContribution({model: {}, queryPacket});

		expect(contribution.id).toBe('geometry-spherical-celestial-cache-stencil');
		expect(contribution.owner).toBe('geometry');
		expect(contribution.provides).toEqual([
			'geometry.celestialCacheStencilTypes',
			'geometry.resolveCelestialCacheStencil',
			'geometry.resolveStellarPointSetCacheStencil',
			'geometry.resolveDistantSunDiskSupport',
		]);
		expect(contribution.requires).toEqual([]);
		expect(contribution.functions).toEqual([
			jasmine.objectContaining({
				slot: 'declareTypes',
				code: jasmine.stringMatching(/struct CelestialCacheBilinearStencil/),
			}),
			jasmine.objectContaining({
				slot: 'sampleCelestialCache',
				code: jasmine.stringMatching(/resolveDistantSunCelestialCacheStencil/),
			}),
			jasmine.objectContaining({
				slot: 'sampleCelestialCache',
				code: jasmine.stringMatching(/resolveStellarPointSetCacheStencil/),
			}),
			jasmine.objectContaining({
				slot: 'evaluateCelestialRadiance',
				code: jasmine.stringMatching(/distantSunCelestialSampleHasGroundSupport/),
			}),
		]);
		expect(contribution.diagnostics).toEqual(jasmine.objectContaining({queryIdentity: queryPacket.contentHash}));
	});

	it('reuses the atmospheric Sun placement and retains one transformed 500-member stellar source', /** Called by Jasmine to exercise the named behavior. */ () => {
		const {geometry, sun, observation} = createConfiguredOwners();
		const stars = new StellarPointSetSource();
		const placements = geometry.resolveCelestialPlacements({
			roster: createRoster(sun, stars),
			observation,
		});

		expect(placements.length).toBe(2);
		expect(placements[0]).toEqual({
			sourceId: sun.id,
			kind: 'distant-uniform-sun',
			directionToSource: sun.configuration.directionToLight,
			support: {
				kind: 'uniform-disk',
				angularRadiusRadians: 0.01,
				classification: 'full',
				visibleFraction: 1,
			},
		});
		if (placements[1].kind !== 'static-stellar-point-set') {
			fail('Expected stellar placement.');
			return;
		}
		expect(placements[1].memberDirections.length).toBe(500);
		const canonicalFirst = stars.celestialSourceDefinition.members[0].direction;
		expect(placements[1].memberDirections[0][0]).toBeCloseTo(canonicalFirst[1], 14);
		expect(placements[1].memberDirections[0][1]).toBeCloseTo(canonicalFirst[2], 14);
		expect(placements[1].memberDirections[0][2]).toBeCloseTo(canonicalFirst[0], 14);
	});

	it('classifies full, partial, and empty disk support through the current spherical horizon', /** Called by Jasmine to exercise the named behavior. */ () => {
		const groundRadiusMeters = 6_360_000;
		const receiverRadiusMeters = groundRadiusMeters + 1_000;
		const horizonRadialCosine = -Math.sqrt(1 - (groundRadiusMeters / receiverRadiusMeters) ** 2);
		const horizonDirection = /** @type {UnitVector3} */ ([
			Math.sqrt(1 - horizonRadialCosine ** 2),
			0,
			horizonRadialCosine,
		]);
		const partial = createConfiguredOwners({direction: horizonDirection});
		const emptyRadialCosine = Math.sin(Math.asin(horizonRadialCosine) - 0.02);
		const empty = createConfiguredOwners({
			direction: [Math.sqrt(1 - emptyRadialCosine ** 2), 0, emptyRadialCosine],
		});

		const partialPlacement = partial.geometry.resolveCelestialPlacements({
			roster: createRoster(partial.sun),
			observation: partial.observation,
		})[0];
		const emptyPlacement = empty.geometry.resolveCelestialPlacements({
			roster: createRoster(empty.sun),
			observation: empty.observation,
		})[0];
		expect(partialPlacement.kind).toBe('distant-uniform-sun');
		expect(emptyPlacement.kind).toBe('distant-uniform-sun');
		if (partialPlacement.kind === 'distant-uniform-sun') {
			expect(partialPlacement.support.classification).toBe('partial');
			expect(partialPlacement.support.visibleFraction).toBeCloseTo(0.5, 12);
		}
		if (emptyPlacement.kind === 'distant-uniform-sun') {
			expect(emptyPlacement.support.classification).toBe('empty');
			expect(emptyPlacement.support.visibleFraction).toBe(0);
		}
	});

	it('builds through the existing atmosphere-path owner and preserves exact tangent contact classification', /** Called by Jasmine to exercise the named behavior. */ () => {
		const {geometry, sun, observation} = createConfiguredOwners();
		const domain = geometry.describeCelestialContributionDomain();
		const placement = geometry.resolveCelestialPlacements({roster: createRoster(sun), observation})[0];
		const tangent = geometry.createCelestialBuildSample({
			domain,
			placement,
			receiverIndex: 0,
			directionIndex: 0,
		});
		const zenith = geometry.createCelestialBuildSample({
			domain,
			placement,
			receiverIndex: 4,
			directionIndex: 10,
		});

		expect(tangent.receiverPosition).toEqual({coordinates: [0, 0, 6_360_000], units: 'meters'});
		expect(tangent.supported).toBeTrue();
		expect(tangent.sourcePath.blockedByGround).toBeUndefined();
		expect(zenith.receiverPosition).toEqual({coordinates: [0, 0, 6_361_000], units: 'meters'});
		expect(zenith.atmosphereCoordinate.altitude).toEqual({value: 1_000, units: 'meters'});
		expect(zenith.sourcePath.length.value).toBeCloseTo(59_000, 10);
		expect(zenith.sourcePath.samples.length).toBe(11);
		expect(zenith.supported).toBeTrue();
	});

	it('derives hashed exact, interpolated, out-of-domain, clear, and ground-horizon stencils', /** Called by Jasmine to exercise the named behavior. */ () => {
		const {geometry, observation} = createConfiguredOwners();
		const collaborator = new SphericalCelestialContributionDomain({
			geometry,
			bottomRadius: geometry.configuration.bottomRadius,
			topRadius: geometry.configuration.topRadius,
			observerHeight: geometry.configuration.observerHeight,
			observation,
		});
		const exactPosition = geometry.createCelestialReceiverPositionAtAltitude({value: 1_000, units: 'meters'});
		const interpolatedPosition = geometry.createCelestialReceiverPositionAtAltitude({
			value: 7_500,
			units: 'meters',
		});
		const belowGround = DistanceMath.positionInMeters([0, 0, 6_359_999]);
		const exact = collaborator.resolveReceiverStencil(exactPosition);
		const interpolated = collaborator.resolveReceiverStencil(interpolatedPosition);
		const outside = collaborator.resolveReceiverStencil(belowGround);
		const clear = collaborator.resolveDirectionStencil(exactPosition, [0, 0, 1]);
		const ground = collaborator.resolveDirectionStencil(exactPosition, [0, 0, -1]);

		expect(exact).toEqual({
			classification: 'valid',
			valid: true,
			altitude: {value: 1_000, units: 'meters'},
			indices: [4, 4],
			weights: [1, 0],
			contentHash: jasmine.stringMatching(/^sha256:[0-9a-f]{64}$/),
		});
		expect(interpolated.indices).toEqual([5, 6]);
		expect(interpolated.weights).toEqual([0.5, 0.5]);
		expect(outside.valid).toBeFalse();
		expect(outside.classification).toBe('out-of-domain');
		expect(outside.weights).toEqual([0, 0]);
		expect(clear.classification).toBe('clear');
		expect(clear.directionCoordinate).toBe(1);
		expect(clear.indices).toEqual([10, 10]);
		expect(ground.classification).toBe('ground-horizon');
		expect(ground.valid).toBeFalse();
		expect(ground.weights).toEqual([0, 0]);
	});

	it('assembles stable complete query packets and replaces identity for source, observation, or geometry changes', /** Called by Jasmine to exercise the named behavior. */ () => {
		const stars = new StellarPointSetSource();
		const base = createConfiguredOwners();
		const baseRoster = createRoster(base.sun, stars);
		const basePlacements = base.geometry.resolveCelestialPlacements({
			roster: baseRoster,
			observation: base.observation,
		});
		const first = base.geometry.createCelestialQueryPacket(baseRoster, basePlacements);
		const repeated = base.geometry.createCelestialQueryPacket(baseRoster, basePlacements);
		const changedSource = createConfiguredOwners({angularRadiusRadians: 0.02});
		const changedObservation = createConfiguredOwners({
			observation: {
				...OBSERVATION,
				instant: '2024-06-21T03:27:03.503Z',
			},
		});
		const changedLocation = createConfiguredOwners({
			observation: {
				...OBSERVATION,
				location: {
					latitude: {value: 1, units: 'degrees'},
					longitude: {value: 0, units: 'degrees'},
				},
			},
		});
		const changedGeometry = createConfiguredOwners({topRadiusMeters: 6_430_000});
		const variants = [changedSource, changedObservation, changedLocation, changedGeometry].map(
			/**
			 * Called by Array.prototype.map to construct one replacement query packet.
			 * @param {ReturnType<typeof createConfiguredOwners>} owners - Replacement configured owners.
			 * @returns {SphericalCelestialQueryPacket} - Replacement query packet.
			 */
			(owners) => {
				const roster = createRoster(owners.sun, stars);
				const placements = owners.geometry.resolveCelestialPlacements({
					roster,
					observation: owners.observation,
				});
				return owners.geometry.createCelestialQueryPacket(roster, placements);
			},
		);

		expect(first.contentHash).toBe(repeated.contentHash);
		expect(first.family).toBe('spherical-sun-stars-radial-v1');
		expect(first.receiverStencil.valid).toBeTrue();
		expect(first.sun.placement).toBe(basePlacements[0]);
		expect(first.stars.placement).toBe(basePlacements[1]);
		expect(first.stars.memberDirectionStencils.length).toBe(500);
		expect(new Set(variants.map((packet) => packet.contentHash)).size).toBe(4);
		for (const packet of variants) {
			expect(packet.contentHash).not.toBe(first.contentHash);
		}
	});
});
