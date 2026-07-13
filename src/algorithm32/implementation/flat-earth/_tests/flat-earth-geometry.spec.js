import * as THREE from 'three';

import {CachePassAssembler} from '../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER} from '../../../sampling-domains/direction/cubed-sphere/consts.js';
import {LocalSunLightSource} from '../../local-sun/LocalSunLightSource.js';
import {FlatEarthGeometry} from '../FlatEarthGeometry.js';

describe('FlatEarthGeometry', /** Called by Jasmine to register the named test suite. */ () => {
	it('resolves flat observation instants through the public geometry class', /** Called by Jasmine to exercise the named behavior. */ () => {
		const request = {
			dateBasis: '2026-06-21T12:00:00.000Z',
			location: {latitude: degrees(37.3382), longitude: degrees(-121.8863)},
		};
		const solarNoon = FlatEarthGeometry.resolveObservationInstant({...request, kind: 'solar-noon'});
		const sunrise = FlatEarthGeometry.resolveObservationInstant({...request, kind: 'sunrise'});
		const sunset = FlatEarthGeometry.resolveObservationInstant({...request, kind: 'sunset'});

		expect(new Date(sunrise).getTime()).toBeLessThan(new Date(solarNoon).getTime());
		expect(new Date(sunset).getTime()).toBeGreaterThan(new Date(solarNoon).getTime());
		expect(
			FlatEarthGeometry.resolveObservationInstant({...request, kind: 'closest-angle', angle: degrees(0)}),
		).toBe(solarNoon);
	});

	it('exposes normalized flat geometry and its executable frame facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		expect(geometry.id).toBe('flat-earth-geometry');
		expect(geometry.configuration).toEqual(
			jasmine.objectContaining({
				observerPosition: position([0, 0, 2]),
				topAltitude: meters(12),
				cacheRadialMaximum: meters(4_800_000),
				sceneSkyRayLimit: meters(100),
				observerCenteredDome: null,
			}),
		);
		expect(geometry.configuration.sourcePosition.coordinates[0]).toBeCloseTo(10, 12);
		expect(geometry.configuration.sourcePosition.coordinates[1]).toBeCloseTo(0, 12);
		expect(geometry.configuration.sourcePosition.coordinates[2]).toBe(5);
		expect(geometry.configuration.observerLocalSceneFrame).toEqual({
			up: [0, 0, 1],
			right: [1, 0, 0],
			forward: [0, -1, 0],
		});
	});

	it('normalizes supported physical units at construction', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry({
			observerPosition: kilometerPosition([0, 0, 0.002]),
			localLightSourceHeight: kilometers(0.005),
			projectionRadius: kilometers(0.1),
			topAltitude: kilometers(0.012),
			sceneSkyRayLimit: kilometers(0.1),
		});

		expect(geometry.configuration).toEqual(
			jasmine.objectContaining({
				observerPosition: position([0, 0, 2]),
				topAltitude: meters(12),
				cacheRadialMaximum: meters(4_800_000),
				sceneSkyRayLimit: meters(100),
			}),
		);
		expect(geometry.configuration.sourcePosition.coordinates[0]).toBeCloseTo(10, 12);
		expect(geometry.configuration.sourcePosition.coordinates[1]).toBeCloseTo(0, 12);
		expect(geometry.configuration.sourcePosition.coordinates[2]).toBe(5);
	});

	it('creates its geometry-owned shader contribution', /** Called by Jasmine to exercise the named behavior. */ () => {
		const contribution = createGeometry().createShaderContribution();

		expect(contribution.id).toBe('geometry-flat-earth');
		expect(contribution.owner).toBe('geometry');
		expect(contribution.provides).toEqual([
			'geometry.reconstructViewRay',
			'geometry.resolveAtmospherePath',
			'geometry.atmosphereCoordinateTypes',
			'geometry.resolveAtmosphereCoordinate',
			'geometry.scatteringCacheStencilTypes',
			'geometry.resolveScatteringCachePositionStencil',
			'geometry.resolveScatteringCacheDirectionStencil',
			'geometry.finiteCelestialAtmosphereSegment',
		]);
	});

	it('resolves the configured finite Sun into one source-relative celestial query', /** Called by Jasmine to exercise the named behavior. */ () => {
		const observation = createObservation();
		const geometry = new FlatEarthGeometry({
			observerPosition: position([0, 0, 2]),
			topAltitude: meters(100_000),
			localLightSourceHeight: meters(4_828_032),
			projectionRadius: meters(6_371_008.8),
			sceneSkyRayLimit: meters(10_000_000),
		});
		const localSun = new LocalSunLightSource({
			sourceKey: 'flat-celestial-test-sun',
			referenceDistance: meters(4_800_000),
			referenceSpectralIncidentScale: 1,
			radius: meters(25_749.504),
		});
		geometry.configureLightSource({lightSource: localSun, observation});
		const roster = /** @type {FlatLocalFiniteSunSourceRoster} */ ({
			id: 'flat-celestial-test-roster',
			family: 'flat-local-finite-sun-v1',
			localSun,
		});
		const placements = geometry.resolveCelestialPlacements({roster, observation});
		const packet = geometry.createCelestialQueryPacket(roster, placements);

		expect(geometry.celestialCapabilityFamily).toBe('flat-local-finite-sun-v1');
		expect(placements).toEqual([
			{
				sourceId: 'flat-celestial-test-sun',
				kind: 'finite-local-sun',
				center: geometry.configuration.sourcePosition,
			},
		]);
		expect(packet).toEqual(
			jasmine.objectContaining({
				family: 'flat-local-finite-sun-v1',
				observation,
				receiverPosition: position([0, 0, 2]),
				sun: {placement: placements[0]},
			}),
		);
		expect(packet.contentHash).toMatch(/^sha256:/);
	});

	it('resolves view rays against flat top, ground, and safe cap boundaries', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		expect(geometry.resolveViewRaySegment({direction: [0, 0, 1]}).endDistance).toEqual(meters(10));
		expect(geometry.resolveViewRaySegment({direction: [0, 0, -1]}).endDistance).toEqual(meters(2));
		expect(geometry.resolveViewRaySegment({direction: [1, 0, 0]}).endDistance).toEqual(meters(100));
		expect(geometry.runtimeDiagnostics[0]).toEqual(
			jasmine.objectContaining({
				id: 'flat-ray-parallel-no-boundary-hit',
				severity: 'warning',
			}),
		);
		expect(
			geometry.resolveViewRaySegment({
				direction: [0, 0, 1],
				endDistance: meters(4),
			}).endDistance,
		).toEqual(meters(4));
	});

	it('uses top altitude as the finite no-cap horizontal view policy', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry({
			sceneSkyRayLimit: null,
		});

		expect(
			geometry.resolveViewRaySegment({
				direction: [1, 0, 0],
			}).endDistance,
		).toEqual(meters(12));
		expect(geometry.runtimeDiagnostics[0]).toEqual(
			jasmine.objectContaining({
				id: 'flat-ray-parallel-default-top-cap',
				severity: 'warning',
			}),
		);
	});

	it('resolves atmosphere coordinates and records domain diagnostics', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		const inDomainCoordinate = geometry.resolveAtmosphereCoordinate(position([1, 2, 3]));
		const outOfDomainCoordinate = geometry.resolveAtmosphereCoordinate(position([1, 2, 20]));

		expect(inDomainCoordinate.altitude).toEqual(meters(3));
		expect(inDomainCoordinate.rho.value).toBeCloseTo(Math.hypot(9, 2), 12);
		expect(outOfDomainCoordinate.altitude).toEqual(meters(20));
		expect(outOfDomainCoordinate.rho.value).toBeCloseTo(Math.hypot(9, 2), 12);
		expect(geometry.runtimeDiagnostics[0]).toEqual(
			jasmine.objectContaining({
				id: 'flat-atmosphere-coordinate-out-of-domain',
				severity: 'warning',
			}),
		);
	});

	it('builds flat atmosphere path samples and retains ground-bound segments', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const path = geometry.resolveAtmospherePath({
			ray: {
				origin: position([0, 0, 2]),
				direction: [0, 0, 1],
			},
			sampleCount: 2,
		});
		const clipped = geometry.resolveAtmospherePath({
			ray: {
				origin: position([0, 0, 2]),
				direction: [0, 0, 1],
			},
			sourcePathLimit: {maxDistance: meters(3)},
			sampleCount: 2,
		});
		const blocked = geometry.resolveAtmospherePath({
			ray: {
				origin: position([0, 0, 2]),
				direction: [0, 0, -1],
			},
			sourcePathLimit: {maxDistance: meters(10)},
			sampleCount: 2,
		});

		expect(path.length).toEqual(meters(10));
		expect(
			path.samples.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param sample - The sample value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (sample) => sample.measure,
			),
		).toEqual([meters(2.5), meters(5), meters(2.5)]);
		expect(clipped.length).toEqual(meters(3));
		expect(blocked.blockedByGround).toBeTrue();
		expect(blocked.length).toEqual(meters(2));
		expect(
			blocked.samples.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param sample - The sample value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (sample) => sample.measure,
			),
		).toEqual([meters(0.5), meters(1), meters(0.5)]);
		expect(blocked.metadata).toEqual(
			jasmine.objectContaining({
				boundaryKind: 'ground',
				terminatedByGround: true,
				groundOccludedRequestedEndpoint: true,
				observerDomeApplied: false,
			}),
		);
	});

	it('resolves local source-relative facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const sourceRelativePosition = geometry.resolveSourceRelativePosition({
			position: position([0, 0, 2]),
		});

		expect(sourceRelativePosition.distanceFromSource.value).toBeCloseTo(Math.sqrt(109), 12);
		expect(sourceRelativePosition.directionToSource[0]).toBeCloseTo(10 / Math.sqrt(109), 12);
		expect(sourceRelativePosition.directionToSource[2]).toBeCloseTo(3 / Math.sqrt(109), 12);
		expect(sourceRelativePosition.radialDistanceFromSourceSubpoint.value).toBeCloseTo(10, 12);
		expect(sourceRelativePosition.altitude).toEqual(meters(2));
	});

	it('owns the selected flattened z-major, rho-minor position domain', /** Called by Jasmine to exercise the named behavior. */ () => {
		const domain = createGeometry().createLocalSunCachePositionDomain();

		expect(domain.zNodes).toEqual([
			meters(0),
			meters((12 * 1) / 400),
			meters((12 * 1) / 200),
			meters((12 * 1) / 100),
			meters((12 * 3) / 200),
			meters((12 * 3) / 100),
			meters((12 * 1) / 20),
			meters((12 * 7) / 100),
			meters((12 * 1) / 10),
			meters((12 * 7) / 50),
			meters((12 * 1) / 5),
			meters((12 * 1) / 4),
			meters((12 * 3) / 8),
			meters((12 * 1) / 2),
			meters((12 * 5) / 8),
			meters((12 * 3) / 4),
			meters((12 * 7) / 8),
			meters((12 * 99) / 100),
			meters(12),
		]);
		expect(domain.rhoNodes).toEqual([
			meters(0),
			meters((4_800_000 * 1) / 96),
			meters((4_800_000 * 1) / 48),
			meters((4_800_000 * 1) / 24),
			meters((4_800_000 * 1) / 12),
			meters((4_800_000 * 1) / 8),
			meters((4_800_000 * 1) / 4),
			meters((4_800_000 * 3) / 8),
			meters((4_800_000 * 1) / 2),
			meters((4_800_000 * 5) / 8),
			meters((4_800_000 * 3) / 4),
			meters((4_800_000 * 7) / 8),
			meters((4_800_000 * 15) / 16),
			meters((4_800_000 * 47) / 48),
			meters(4_800_000),
		]);
		expect(domain.count).toBe(285);
		expect(domain.nodes[21]).toEqual(
			jasmine.objectContaining({
				index: 21,
				metadata: jasmine.objectContaining({
					position: position([1_200_010, 0, (12 * 1) / 400]),
					z: meters((12 * 1) / 400),
					rho: meters(1_200_000),
					zIndex: 1,
					rhoIndex: 6,
				}),
			}),
		);
	});

	it('keeps count overrides uniform and explicit cache nodes authoritative', /** Called by Jasmine to exercise the named behavior. */ () => {
		const generated = createGeometry().createLocalSunCachePositionDomain({
			zCount: 3,
			rhoCount: 4,
		});
		expect(generated.zNodes).toEqual([meters(0), meters(6), meters(12)]);
		expect(generated.rhoNodes).toEqual([meters(0), meters(1_600_000), meters(3_200_000), meters(4_800_000)]);

		const explicit = createGeometry({
			cacheAltitudeNodes: [meters(0), meters(2), meters(12)],
			cacheRadialNodes: [meters(0), meters(10), meters(80), meters(4_800_000)],
		}).createLocalSunCachePositionDomain({
			zCount: 3,
			rhoCount: 4,
		});
		expect(explicit.zNodes).toEqual([meters(0), meters(2), meters(12)]);
		expect(explicit.rhoNodes).toEqual([meters(0), meters(10), meters(80), meters(4_800_000)]);
	});

	it('uses the same bilinear z/rho reconstruction for view and construction', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry({
			cacheAltitudeNodes: [meters(0), meters(6), meters(12)],
			cacheRadialNodes: [meters(0), meters(50), meters(4_800_000)],
		});
		const samplePosition = position([-15, 0, 3]);
		const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(samplePosition);

		expect(
			geometry.resolveScatteringCachePositionStencil({
				position: samplePosition,
				atmosphereCoordinate,
			}),
		).toEqual({
			indices: [0, 1, 3, 4],
			weights: [0.25, 0.25, 0.25, 0.25],
		});
		expect(
			geometry.resolveScatteringCacheConstructionPositionStencil({
				position: samplePosition,
				atmosphereCoordinate,
			}),
		).toEqual({
			indices: [0, 1, 3, 4],
			weights: [0.25, 0.25, 0.25, 0.25],
		});
	});

	it('uses a position-varying radial frame with deterministic rho-zero behavior', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const radialPosition = position([20, 0, 2]);
		const centerPosition = position([10, 0, 2]);

		expect(
			geometry.expressScatteringCacheDirection({
				position: radialPosition,
				physicalOutgoingDirection: [1, 0, 0],
			}),
		).toEqual([1, 0, 0]);
		expect(
			geometry.resolveScatteringCacheDirectionStencil({
				position: radialPosition,
				physicalOutgoingDirection: [1, 0, 0],
			}),
		).toEqual({
			indices: [364],
			weights: [1],
		});
		expect(
			geometry.resolveScatteringCacheDirectionStencil({
				position: centerPosition,
				physicalOutgoingDirection: [1, 0, 0],
			}),
		).toEqual({
			indices: [364],
			weights: [1],
		});
		expect(
			geometry.expressPhysicalScatteringCacheDirection({
				position: centerPosition,
				cacheDirection: [1, 0, 0],
			}),
		).toEqual([1, 0, 0]);
	});

	it('keeps reusable cache axes independent of observer and view limits', /** Called by Jasmine to exercise the named behavior. */ () => {
		const baseline = createGeometry();
		const changedView = createGeometry({
			observerPosition: position([700, -300, 40]),
			sceneSkyRayLimit: meters(1000),
		});

		const changedDomain = changedView.createLocalSunCachePositionDomain();
		const baselineDomain = baseline.createLocalSunCachePositionDomain();
		expect(changedDomain.id).toBe(baselineDomain.id);
		expect(changedDomain.nodes).toEqual(baselineDomain.nodes);
		expect(changedView.configuration).toEqual(
			jasmine.objectContaining({
				cacheRadialFallbackDirection: [1, 0, 0],
			}),
		);
	});

	it('retains ground construction segments and excludes the observer dome', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry({
			observerCenteredDome: {
				apexAltitude: meters(5),
				maxObserverViewRayExtent: meters(3),
			},
		});
		const groundIntersection = geometry.resolveGroundIntersection({
			origin: position([1, 2, 3]),
			direction: [0, 0, -1],
		});
		const buildRay = geometry.resolveCacheBuildRay({
			coordinateKey: 'test-upward',
			coordinates: [0, 0],
			altitude: meters(2),
			rho: meters(10),
			incomingDirection: [0, 0, 1],
			metadata: {
				position: position([0, 0, 2]),
			},
		});

		expect(groundIntersection).toEqual({
			position: position([1, 2, 0]),
			normal: [0, 0, 1],
			distance: meters(3),
		});
		expect(
			geometry.resolveViewRaySegment({
				direction: [0, 0, 1],
			}).endDistance,
		).toEqual(meters(3));
		expect(buildRay.endDistance).toEqual(meters(10));
		expect(buildRay.metadata).toEqual({
			boundaryKind: 'top-atmosphere',
			terminatedByGround: false,
			observerDomeApplied: false,
		});
		const groundBuildRay = geometry.resolveCacheBuildRay({
			coordinateKey: 'test-downward',
			coordinates: [0, 0],
			altitude: meters(2),
			rho: meters(10),
			incomingDirection: [0, 0, -1],
			metadata: {
				position: position([0, 0, 2]),
			},
		});
		expect(groundBuildRay.endDistance).toEqual(meters(2));
		expect(groundBuildRay.metadata).toEqual(
			jasmine.objectContaining({
				boundaryKind: 'ground',
				terminatedByGround: true,
			}),
		);
	});

	it('continues inward from the top boundary instead of selecting a zero-length top exit', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const inwardBuildRay = geometry.resolveCacheBuildRay({
			coordinateKey: 'test-top-inward',
			coordinates: [0, 0],
			altitude: meters(12),
			rho: meters(0),
			incomingDirection: [0, 0, -1],
			metadata: {
				position: position([10, 0, 12]),
			},
		});
		const outwardBuildRay = geometry.resolveCacheBuildRay({
			coordinateKey: 'test-top-outward',
			coordinates: [0, 0],
			altitude: meters(12),
			rho: meters(0),
			incomingDirection: [0, 0, 1],
			metadata: {
				position: position([10, 0, 12]),
			},
		});

		expect(inwardBuildRay.endDistance).toEqual(meters(12));
		expect(inwardBuildRay.metadata).toEqual(
			jasmine.objectContaining({
				boundaryKind: 'ground',
				terminatedByGround: true,
			}),
		);
		expect(outwardBuildRay.endDistance).toEqual(meters(0));
		expect(outwardBuildRay.metadata).toEqual(
			jasmine.objectContaining({
				boundaryKind: 'top-atmosphere',
				terminatedByGround: false,
			}),
		);
	});

	it('assembles a finite local-source path clipped by the top boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const domains = createCacheConstructionDomains(geometry);
		const geometryModule = geometry.createCacheModule(
			/** @type {CacheBuildContext} */ ({
				kind: 'primary-j1',
				domains,
			}),
		);
		const consumer = CacheBuildModules.createBuildModule({
			id: 'flat-source-path-observer',
			owner: 'cache',
			provides: ['test.flatSourcePath'],
			requires: ['geometry.sourcePath'],
			blocks: [
				{
					id: 'flat-source-path-observer-main',
					phase: 'main',
					order: 0,
					source: `a32CacheOutput = cacheSourcePathDistance(
	vec3(10.0, 0.0, 2.0),
	vec3(0.0, 0.0, 1.0)
);`,
				},
			],
			bindings: [],
		});
		const assembled = new CachePassAssembler().assemble(
			{
				id: 'flat-source-path-assembly',
				kind: 'primary-j1',
				order: 0,
				inputs: [],
				output: 'j1',
				modules: [consumer, geometryModule],
			},
			{
				id: 'j1',
				storage: {
					format: 'R32F',
					width: domains.outgoingDirectionCount,
					height: domains.positionCount,
					layers: 15,
				},
			},
		);

		expect(assembled.bindings).toContain(
			jasmine.objectContaining({
				spec: jasmine.objectContaining({
					name: 'uCacheGeometrySourcePosition',
				}),
				value: geometry.configuration.sourcePosition,
			}),
		);
		expect(assembled.source).toContain('float cacheSourcePathDistance(vec3 positionMeters, vec3 direction)');
		expect(assembled.source).toContain('? min(sourceDistanceMeters, topDistanceMeters)');
		expect(assembled.source.indexOf('cacheTopBoundaryDistance')).toBeLessThan(
			assembled.source.indexOf('cacheSourcePathDistance'),
		);
	});

	it('packs transport through selected W3, position, and spectral owners', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const fullDomains = createCacheConstructionDomains(geometry, {
			zCount: 3,
			rhoCount: 2,
		});
		const positionNode = fullDomains.positionNodes[2];
		const domains = /** @type {CacheConstructionDomains} */ ({
			...fullDomains,
			positionNodes: [positionNode],
			spectralChannelCount: 2,
		});
		const atmosphere = /** @type {Pick<AtmosphereModel, "sampleMedium">} */ ({
			/**
			 * Call this method to sample medium.
			 * @returns - The result produced by the operation.
			 */ sampleMedium() {
				return {
					extinction: {
						values: [0, 0],
					},
				};
			},
		});
		const data = geometry.createTransportData({
			atmosphere,
			domains,
			intervalCount: 2,
		});
		const activeTaps = [];

		expect(data.coefficients.shape[2]).toBe(2);
		expect(data.coefficients.values.length).toBe(
			data.tapCount *
				domains.positionNodes.length *
				domains.incomingDirectionCount *
				domains.spectralChannelCount,
		);
		for (let tapIndex = 0; tapIndex < data.tapCount; tapIndex += 1) {
			const sourceOffset = tapIndex * 3;
			if (data.sources.values[sourceOffset + 2] === 1) {
				activeTaps.push({
					directionIndex: data.sources.values[sourceOffset],
					positionIndex: data.sources.values[sourceOffset + 1],
					coefficient: data.coefficients.values[tapIndex],
				});
			}
		}

		expect(activeTaps.length).toBe(2);
		expect(
			activeTaps.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param interpolationTap - The tap value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (interpolationTap) =>
					interpolationTap.directionIndex >= 0 &&
					interpolationTap.directionIndex < CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.directionCount,
			),
		).toBeTrue();
		expect(
			activeTaps
				.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param interpolationTap - The tap value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (interpolationTap) => interpolationTap.positionIndex,
				)
				.sort(),
		).toEqual([2, 4]);
		expect(
			activeTaps.find(
				/**
				 * Called by Array.prototype.find to test one collection value for selection.
				 * @param interpolationTap - The tap value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (interpolationTap) => interpolationTap.positionIndex === 2,
			).coefficient,
		).toBeCloseTo(3, 6);
		expect(
			activeTaps.find(
				/**
				 * Called by Array.prototype.find to test one collection value for selection.
				 * @param interpolationTap - The tap value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (interpolationTap) => interpolationTap.positionIndex === 4,
			).coefficient,
		).toBeCloseTo(3, 6);

		const [sourceX, sourceY] = geometry.configuration.sourcePosition.coordinates;
		const midpoint = position([sourceX, sourceY, 9]);
		const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(midpoint);
		expect(
			geometry.resolveScatteringCacheConstructionPositionStencil({
				position: midpoint,
				atmosphereCoordinate,
				positionAxes: domains,
			}),
		).toEqual({
			indices: [2, 4],
			weights: [0.5, 0.5],
		});
		expect(
			geometry.resolveScatteringCachePositionStencil({
				position: midpoint,
				atmosphereCoordinate,
				positionAxes: domains,
			}),
		).toEqual({
			indices: [2, 4],
			weights: [0.5, 0.5],
		});
	});

	it('provides bounded integrated transport rays and construction stencils', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const domains = /** @type {FlatLocalCacheConstructionDomains} */ ({
			...createCacheConstructionDomains(geometry),
			spectralChannelCount: 1,
		});
		const module = geometry.createCacheModule({
			kind: 'transport',
			domains,
		});
		const source = module.blocks.map(({source: blockSource}) => blockSource).join('\n');

		expect(module.provides).toEqual([
			'geometry.cachePosition',
			'geometry.constructionDirectionStencil',
			'geometry.constructionPositionStencil',
			'geometry.integratedTransportRay',
		]);
		expect(module.bindings).toContain(
			jasmine.objectContaining({
				spec: jasmine.objectContaining({name: 'CACHE_Z_COUNT', kind: 'define'}),
				value: 2,
			}),
		);
		expect(module.bindings).toContain(
			jasmine.objectContaining({
				spec: jasmine.objectContaining({name: 'CACHE_OUTGOING_FACE_WIDTH', kind: 'define'}),
				value: 3,
			}),
		);
		expect(source).toContain('struct CacheTransportRay');
		expect(source).toContain('CacheTransportRay cacheIntegratedTransportRay(');
		expect(source).toContain('CachePositionStencil cacheConstructionPositionStencil(');
		expect(source).toContain('CacheDirectionStencil cacheConstructionDirectionStencil(');
		expect(source).toContain('topDistanceMeters < selectedDistanceMeters');
		expect(source).toContain('radialDistanceMeters < selectedDistanceMeters');
		expect(source).toContain('CACHE_OUTGOING_FACE_NODE_COUNT');
	});

	it('maps observer-local scene positions and directions', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		expect(
			geometry.mapObserverLocalScenePointToModelPosition(scenePosition([1, 2, 3]), {
				sceneScale: sceneScale(2),
			}),
		).toEqual(position([2, -6, 4]));
		expect(geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0])).toEqual([0, -0, 1]);
		expect(
			geometry.mapModelPositionToObserverLocalScenePoint(position([2, -6, 4]), {
				sceneScale: sceneScale(2),
			}),
		).toEqual(scenePosition([1, 2, 3]));
		expect(
			geometry.mapGroundOffsetToScenePoint(scenePosition([4, 0, -5]), {
				heightAboveGround: sceneDistance(6),
			}),
		).toEqual(scenePosition([4, 6, -5]));
		expect(geometry.projectScenePointToGroundAlongDirection(scenePosition([2, 4, -3]), [0, -1, 0])).toEqual(
			scenePosition([2, 0, -3]),
		);
		expect(geometry.projectScenePointToGroundAlongDirection(scenePosition([2, 4, -3]), [1, 0, 0])).toEqual(
			scenePosition([2, 0, -3]),
		);
	});

	it('accepts only the canonical tuple shape for core directions', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.mapObserverLocalSceneDirectionToModelDirection({
					coordinates: [0, 1, 0],
				}),
		).toThrowError(/three-component vector/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.mapObserverLocalSceneDirectionToModelDirection({
					x: 0,
					y: 1,
					z: 0,
				}),
		).toThrowError(/three-component vector/);
	});

	it('creates geometry-owned Three flat endpoint objects', /** Called by Jasmine to exercise the named behavior. */ () => {
		const endpoints = createGeometry().createThreeEndpointObjects({
			sceneScale: sceneScale(2),
			groundExtent: meters(40),
			name: 'test-flat',
			visualMaterialDisplayRgba: [10, 20, 30, 128],
			shadow: {
				enabled: true,
				shadowPolicy: 'test-ground-shadow-policy',
			},
		});
		const visualObject = endpoints.visualObjects[0];
		const raycastObject = endpoints.raycastObjects[0];
		const hits = [];

		raycastObject.updateMatrixWorld(true);
		raycastObject.raycast(
			new THREE.Raycaster(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, -1, 0), 0, 100),
			hits,
		);

		expect(visualObject instanceof THREE.Mesh).toBeTrue();
		expect(visualObject.geometry.type).toBe('PlaneGeometry');
		expect(visualObject.geometry.parameters.width).toBe(20);
		expect(visualObject.geometry.parameters.height).toBe(20);
		expect(visualObject.rotation.x).toBeCloseTo(-Math.PI / 2, 12);
		expect(visualObject.position.toArray()).toEqual([0, 0, -0]);
		expect(visualObject.material.transparent).toBeTrue();
		expect(visualObject.material.opacity).toBeCloseTo(128 / 255, 12);
		expect(visualObject.receiveShadow).toBeTrue();
		expect(visualObject.userData).toEqual(
			jasmine.objectContaining({
				algorithm32SceneInput: true,
				algorithm32EndpointRole: 'geometry-ground-visual',
				endpointKind: 'geometry-ground-boundary',
				sceneScale: sceneScale(2),
				shadowPolicy: 'test-ground-shadow-policy',
				shadowReceiverPolicy: 'geometry-owned-ground-receives-three-shadow-map',
			}),
		);
		expect(raycastObject.userData).toEqual(
			jasmine.objectContaining({
				algorithm32SceneInput: true,
				algorithm32EndpointRole: 'geometry-ground-exact-raycast',
				endpointKind: 'geometry-ground-boundary',
				sceneScale: sceneScale(2),
			}),
		);
		expect(hits.length).toBe(1);
		expect(hits[0].distance).toBeCloseTo(2, 12);
		expect(endpoints.metadata).toEqual(
			jasmine.objectContaining({
				owner: 'FlatEarthGeometry',
				groundPlane: 'z-equals-zero',
				groundExtent: meters(40),
				width: sceneDistance(20),
				depth: sceneDistance(20),
				center: scenePosition([0, 0, -0]),
				shadow: jasmine.objectContaining({
					enabled: true,
					receiveShadow: true,
					shadowPolicy: 'test-ground-shadow-policy',
				}),
			}),
		);
	});

	it('resolves a geometry-owned scene-depth cap from flat endpoint extent', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		expect(geometry.resolveSceneDepthMax().value).toBeCloseTo(Math.hypot(10000, 10000, 2), 12);
		expect(
			geometry.resolveSceneDepthMax({
				groundExtent: meters(40),
			}).value,
		).toBeCloseTo(Math.hypot(20, 20, 2), 12);
		expect(
			geometry.resolveSceneDepthMax({
				cameraPosition: position([0, 0, 12]),
				groundExtent: meters(40),
			}).value,
		).toBeCloseTo(Math.hypot(20, 20, 12), 12);
		expect(
			geometry.resolveSceneDepthMax({
				cameraScenePosition: scenePosition([0, 3, 0]),
				sceneScale: sceneScale(2),
				groundExtent: meters(40),
			}).value,
		).toBeCloseTo(Math.hypot(20, 20, 6), 12);
	});

	it('supports an observer-centered dome boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry({
			observerCenteredDome: {
				apexAltitude: meters(12),
				maxObserverViewRayExtent: meters(10),
			},
		});

		expect(geometry.configuration.observerCenteredDome).toEqual(
			jasmine.objectContaining({
				centerPolicy: 'observer-centered',
				sphereCenter: position([0, 0, 2]),
				sphereRadius: meters(10),
			}),
		);
		expect(geometry.distanceToObserverCenteredDomeBoundary(position([0, 0, 2]), [1, 0, 0])).toBe(10);
	});

	it('defaults only omitted endpoint options and rejects explicit invalid values', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const defaults = geometry.createThreeEndpointObjects({
			shadow: null,
		});

		expect(defaults.visualObjects[0].material.type).toBe('MeshBasicMaterial');
		expect(defaults.metadata.shadow).toBeNull();

		for (const visualMaterialDisplayRgba of [null, {}, [1, 2], [1, 2, 3, 4, 5], [1, 2, Number.NaN]]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => geometry.createThreeEndpointObjects({visualMaterialDisplayRgba}),
			).toThrowError(/visualMaterialDisplayRgba/u);
		}

		for (const visualMaterialLighting of [null, 'phong', 1]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => geometry.createThreeEndpointObjects({visualMaterialLighting}),
			).toThrowError(/visualMaterialLighting/u);
		}

		for (const shadow of [
			true,
			{enabled: null},
			{enabled: 'true'},
			{enabled: true, receiveShadow: null},
			{enabled: true, shadowPolicy: null},
		]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => geometry.createThreeEndpointObjects({shadow}),
			).toThrowError(/shadow/u);
		}

		for (const request of [
			{widthSegments: null},
			{widthSegments: 1.5},
			{heightSegments: null},
			{heightSegments: 2.5},
			{groundExtent: null},
			{sceneScale: null},
			{visualMaterialColor: null},
			{spectralReferenceId: null},
			{name: null},
		]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => geometry.createThreeEndpointObjects(request),
			).toThrow();
		}

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveViewRaySegment({origin: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveViewRaySegment({direction: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveViewRaySegment({endDistance: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.resolveAtmospherePath({
					ray: {origin: position([0, 0, 2]), direction: [0, 0, 1]},
					startDistance: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.resolveAtmospherePath({
					ray: {origin: position([0, 0, 2]), direction: [0, 0, 1]},
					sourcePathLimit: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.resolveAtmospherePath({
					ray: {origin: position([0, 0, 2]), direction: [0, 0, 1]},
					sourcePathLimit: {maxDistance: null},
				}),
		).not.toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.resolveAtmospherePath({
					ray: {origin: position([0, 0, 2]), direction: [0, 0, 1]},
					sampleCount: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.mapGroundOffsetToScenePoint(scenePosition([0, 0, 0]), {
					heightAboveGround: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveSceneDepthMax({cameraPosition: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveSceneDepthMax({minimum: null}),
		).toThrow();
	});

	it('fails loudly for invalid flat geometry inputs', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => new FlatEarthGeometry(),
		).toThrowError(/configuration/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createGeometry({localLightSourceHeight: meters(0)}),
		).toThrowError(/localLightSourceHeight/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createGeometry({topAltitude: meters(0)}),
		).toThrowError(/topAltitude/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createGeometry({projectionRadius: meters(0)}),
		).toThrowError(/projectionRadius/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createGeometry({
					cacheRadialNodes: [meters(0), meters(50)],
				}),
		).toThrowError(/cacheRadialMaximum endpoints/);
		const configuredGeometry = createGeometry();
		expect(
			configuredGeometry.resolveSourceRelativePosition({
				position: configuredGeometry.configuration.sourcePosition,
			}),
		).toEqual(
			jasmine.objectContaining({
				directionToSource: [0, 0, 1],
				directionFromSource: [-0, -0, -1],
				distanceFromSource: meters(0),
			}),
		);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createGeometry().resolveAtmosphereCoordinate(position([0, 0, Number.NaN])),
		).toThrowError(/finite/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createGeometry().mapObserverLocalScenePointToModelPosition(scenePosition([1, 2, 3]), {
					sceneScale: {value: 0, units: 'meters-per-scene-unit'},
				}),
		).toThrowError(/sceneScale/);
	});
});

/**
 * Called by this module to create geometry.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createGeometry(overrides = {}) {
	const {observation = createObservation(), ...geometryOverrides} = overrides;
	const geometry = new FlatEarthGeometry({
		observerPosition: position([0, 0, 2]),
		topAltitude: meters(12),
		localLightSourceHeight: meters(5),
		projectionRadius: meters(100),
		sceneSkyRayLimit: meters(100),
		...geometryOverrides,
	});
	geometry.configureLightSource({
		lightSource: {
			geometryPlacementKind: 'finite-position',
			configureGeometryPlacement() {},
		},
		observation,
	});

	return geometry;
}

/** Create the fixed observation used by flat geometry tests. */
function createObservation() {
	return {
		instant: '2026-03-20T12:00:00.000Z',
		location: {
			latitude: {value: -0.27940210679735955, units: 'degrees'},
			longitude: {value: -1.5903827852862762, units: 'degrees'},
		},
	};
}

/**
 * Called by this module to create an angle in degrees.
 * @param value - The angular value.
 * @returns - The unit-bearing angle.
 */
function degrees(value) {
	return {value, units: 'degrees'};
}

/**
 * Called by this module to create cache construction domains.
 * @param geometry - The geometry value accepted by the operation.
 * @param input2 - The destructured input accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createCacheConstructionDomains(geometry, {zCount = 2, rhoCount = 2} = {}) {
	const positionDomain = geometry.createLocalSunCachePositionDomain({
		zCount,
		rhoCount,
	});
	return /** @type {FlatLocalCacheConstructionDomains} */ ({
		id: `test-flat-z${zCount}-rho${rhoCount}-w3`,
		positionDomain,
		positionNodes: positionDomain.nodes,
		positionCount: positionDomain.count,
		zNodes: positionDomain.zNodes,
		rhoNodes: positionDomain.rhoNodes,
		zCount: positionDomain.zCount,
		rhoCount: positionDomain.rhoCount,
		incomingDirectionDomain: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
		incomingUnitVectors: [[0, 0, 1]],
		incomingIntegrationWeights: {
			values: [4 * Math.PI],
			units: 'steradians',
		},
		incomingDirectionCount: 1,
		outgoingDirectionDomain: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
		outgoingUnitVectors: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.unitVectors,
		outgoingDirectionCount: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.directionCount,
		/**
		 * Call this method to resolve outgoing direction stencil.
		 * @param direction - The direction value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ resolveOutgoingDirectionStencil(direction) {
			return CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.resolveStencil(direction);
		},
	});
}

/**
 * Called by this module to meters.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function meters(value) {
	return {value, units: 'meters'};
}

/**
 * Called by this module to kilometers.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function kilometers(value) {
	return {value, units: 'kilometers'};
}

/**
 * Called by this module to position.
 * @param coordinates - The coordinates value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function position(coordinates) {
	return {coordinates, units: 'meters'};
}

/**
 * Called by this module to kilometer position.
 * @param coordinates - The coordinates value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function kilometerPosition(coordinates) {
	return {coordinates, units: 'kilometers'};
}

/**
 * Called by this module to scene distance.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function sceneDistance(value) {
	return {value, units: 'scene-units'};
}

/**
 * Called by this module to scene position.
 * @param coordinates - The coordinates value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function scenePosition(coordinates) {
	return {coordinates, units: 'scene-units'};
}

/**
 * Called by this module to scene scale.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function sceneScale(value) {
	return {value, units: 'meters-per-scene-unit'};
}
