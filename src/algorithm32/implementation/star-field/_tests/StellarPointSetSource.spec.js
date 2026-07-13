import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {CelestialSourceRoster} from '../../../celestial-source-support/CelestialSourceRoster.js';
import {DistantSunLightSource, StellarPointSetSource} from '../../index.js';

describe('StellarPointSetSource', /** Called by Jasmine to register the named test suite. */ () => {
	it('exposes the exact reviewed 500-member native-15 definition', /** Called by Jasmine to exercise the named behavior. */ () => {
		const definition = new StellarPointSetSource().celestialSourceDefinition;

		expect(definition.id).toBe('stellar-catalog-v50');
		expect(definition.kind).toBe('static-stellar-point-set');
		expect(definition.catalog).toEqual({
			catalogId: 'cds-v50-bright-star-catalogue-5th-revised',
			catalogVersion: 'V/50/catalog; Bright Star Catalogue, 5th Revised Edition',
			catalogSha256: 'sha256:d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759',
			selectionId: 'finite-j2000-position-and-vmag; ascending-vmag; ascending-hr-tiebreak; first-500',
			selectionSha256: 'sha256:3356dfa973a860bd91430010d77704d304abedbed92691f9faa58007ddb4d67e',
			frame: 'fk5-j2000-mean-equatorial-rh-v1',
			epoch: {instant: '2000-01-01T12:00:00Z', timeScale: 'utc'},
		});
		expect(definition.members.length).toBe(500);
		expect(definition.members[0].id).toBe('bsc-v50-hr-2491');
		expect(definition.members.at(-1).id).toBe('bsc-v50-hr-7590');
		expect(new Set(definition.members.map((member) => member.id)).size).toBe(500);
		for (const member of definition.members) {
			expect(member.direction.reduce((sum, value) => sum + value * value, 0)).toBeCloseTo(1, 14);
			expect(member.spectralIrradiance.basis).toBe(NATIVE_15_SPECTRAL_BASIS);
			expect(member.spectralIrradiance.values.length).toBe(15);
			expect(member.spectralIrradiance.values.every((value) => Number.isFinite(value) && value >= 0)).toBeTrue();
		}
	});

	it('retains stable definition, packet, and placement identities', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new StellarPointSetSource();
		const definition = source.celestialSourceDefinition;
		const observation = /** @type {GeometryObservation} */ ({
			instant: '2025-03-20T12:00:00Z',
			location: {
				latitude: {value: 34, units: 'degrees'},
				longitude: {value: -118, units: 'degrees'},
			},
		});
		const placement = source.createCelestialPlacementState(observation);

		expect(source.id).toBe(definition.id);
		expect(source.kind).toBe(definition.kind);
		expect(source.describeCelestialSourceIdentity()).toEqual({
			id: 'stellar-catalog-v50',
			kind: 'static-stellar-point-set',
			definitionHash: 'sha256:3d78489127c2df5f2d3a94b05d69032695889a7ddf6da9d9f365fe10ba4fe6c2',
		});
		expect(definition.members[0].spectralIrradiance.contentHash).toBe(
			'sha256:fd3adbaf1804ca147dea6a435f3b0fb878bd8f1e1a444894712d5553fc9ac2dd',
		);
		expect(definition.members.at(-1).spectralIrradiance.contentHash).toBe(
			'sha256:58da79bff4d40f4fcfa3af42d44d719adef40607ee686e5d98b26e9cedaf9d38',
		);
		expect(placement).toEqual({
			sourceId: source.id,
			kind: 'static-stellar-point-set',
			frame: 'celestial-rh-v1',
			epoch: definition.catalog.epoch,
			observation,
			memberDirections: definition.members.map((member) => member.direction),
		});
	});

	it('packs only canonical directions and native-15 packets into immutable shader input', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new StellarPointSetSource();
		const definition = source.celestialSourceDefinition;
		const table = source.createStellarGenerationSourceTable();
		const values = table.copyValues();

		expect(table).toBe(source.createStellarGenerationSourceTable());
		expect(table.identity).toBe('sha256:93dec8deb8bf5594778f523d0d01454194dbe0b052e812cf3fd67e1a20bc4d51');
		expect(table.sourceIdentity).toBe(source.describeCelestialSourceIdentity().definitionHash);
		expect(table.frame).toBe(definition.catalog.frame);
		expect(table.epoch).toEqual(definition.catalog.epoch);
		expect(table.memberIds).toEqual(definition.members.map((member) => member.id));
		expect(table.layout).toEqual({
			schema: 'stellar-generation-source-table-v1',
			storageFormat: 'R32F',
			memberOrder: 'canonical-selection-order',
			memberCount: 500,
			componentCount: 18,
			directionOffset: 0,
			directionComponentCount: 3,
			spectralOffset: 3,
			spectralChannelCount: 15,
		});
		expect(values).toEqual(jasmine.any(Float32Array));
		expect(values.length).toBe(500 * 18);
		expect(values.byteLength).toBe(36_000);

		for (const [memberIndex, member] of definition.members.entries()) {
			const offset = memberIndex * table.layout.componentCount;
			expect(Array.from(values.slice(offset, offset + 3))).toEqual(member.direction.map(Math.fround));
			expect(Array.from(values.slice(offset + 3, offset + 18))).toEqual(
				member.spectralIrradiance.values.map(Math.fround),
			);
		}

		values[0] = 42;
		const memberIds = /** @type {string[]} */ (table.memberIds);
		memberIds[0] = 'mutated';
		const epoch = /** @type {{instant: string; timeScale: CelestialTimeScale}} */ (table.epoch);
		epoch.instant = 'mutated';
		expect(table.copyValues()[0]).toBe(Math.fround(definition.members[0].direction[0]));
		expect(table.memberIds[0]).toBe(definition.members[0].id);
		expect(table.epoch).toEqual(definition.catalog.epoch);
	});

	it('describes only the logical stellar cache fragment', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new StellarPointSetSource();

		expect(source.createCelestialCacheFragment(/** @type {CelestialCacheBuildRequest} */ ({}))).toEqual({
			sourceId: source.id,
			sourceKind: 'static-stellar-point-set',
			quantity: 'spectral-irradiance-density',
			units: 'W m^-2 nm^-1',
			channelCount: 15,
			support: {
				catalog: source.celestialSourceDefinition.catalog,
				memberCount: 500,
			},
		});
	});

	it('is accepted through the spherical production roster with the shared atmospheric Sun', /** Called by Jasmine to exercise the named behavior. */ () => {
		const sun = new DistantSunLightSource({angularRadius: {value: 0.004, units: 'radians'}});
		const stars = new StellarPointSetSource();
		const roster = /** @type {SphericalSunStarsSourceRoster} */ ({
			id: 'standard-spherical-sun-stars',
			family: 'spherical-sun-stars-radial-v1',
			sun,
			stars,
		});
		const geometry = /** @type {GeometryModel} */ (
			/** @type {unknown} */ ({
				celestialCapabilityFamily: 'spherical-sun-stars-radial-v1',
				describeCelestialContributionDomain() {},
				resolveCelestialPlacements() {},
				createCelestialBuildSample() {},
				createCelestialQueryPacket() {},
			})
		);

		expect(
			CelestialSourceRoster.accept({
				roster,
				lightSource: sun,
				geometry,
				basis: NATIVE_15_SPECTRAL_BASIS,
			}),
		).toBe(roster);
	});
});
