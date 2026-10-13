import {readFileSync} from 'node:fs';
import {LocalSunCompactProfileSelection} from '../LocalSunCompactProfileSelection.js';
import {Algorithm32} from '../../../algorithm32/Algorithm32.js';
import {StellarPointSetSource} from '../../../star-field/StellarPointSetSource.js';
import {FlatEarthGeometry} from '../../../flat-earth/FlatEarthGeometry.js';

describe('Qualified compact ordinary-scene profile selection', () => {
	const observation = {
		instant: '2024-12-14T17:27:41.487Z',
		location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: 0, units: 'degrees'}},
	};
	/** Create the explicit supported ordinary profile.
	 *
	 * @returns {LocalSunCompactConstructionProfile} - Genuine physical selection.
	 */
	function create() {
		return new LocalSunCompactProfileSelection().create({
			observation,
			observerPosition: {coordinates: [0, 0, 5], units: 'meters'},
			viewRayLimit: {value: 1926774, units: 'meters'},
			maximumScatteringOrder: 1,
		});
	}
	it('preserves every qualified compact seed and actual domain dimension', () => {
		const profile = create();
		const control = JSON.parse(
			readFileSync(new URL('../fixtures/local-sun-compact-p0-controls.json', import.meta.url), 'utf8'),
		).controls;
		expect(profile.domains.topology.positionCount).toBe(1049);
		expect(profile.domains.topology.rows.length).toBe(control.rows.length);
		for (let i = 0; i < control.rows.length; i++)
			expect(profile.domains.topology.rows[i].altitude).toEqual(control.rows[i].altitude);
		expect(profile.domains.topology.coverageRadius).toEqual(control.geometry.coverageRadius);
		expect(profile.numerical.maximumScatteringOrder).toBe(1);
	});
	it('admits genuine local Sun and stars while leaving canonical construction roster-free', () => {
		const profile = create();
		const stars = new StellarPointSetSource();
		const roster = {
			id: 'qualified-flat-stars-test',
			family: 'flat-local-finite-sun-v1',
			localSun: profile.models.lightSource,
			stars,
		};
		const canonical = profile.createExecutionProfile();
		const live = profile.createExecutionProfile(roster);
		expect(canonical.models.celestialSources).toBeNull();
		expect(live.models.celestialSources).toBe(roster);
		expect(live.contentHash).not.toBe(canonical.contentHash);
		const algorithm = new Algorithm32({profile: live});
		expect(algorithm.config.config.profile.models.celestialSources).toBe(roster);
		algorithm.dispose();
	});
	it('matches every public CPU stellar direction to the preserved independent controls', () => {
		const fixture = JSON.parse(
			readFileSync(
				new URL('../../../flat-earth/fixtures/local-sun-p4-celestial-controls.json', import.meta.url),
				'utf8',
			),
		);
		for (const row of fixture.rows) {
			const profile = new LocalSunCompactProfileSelection().create({
				observation: row.observation,
				observerPosition: {coordinates: [0, 0, 5], units: 'meters'},
				viewRayLimit: {value: 1926774, units: 'meters'},
				maximumScatteringOrder: 1,
			});
			const geometry = /** @type {FlatEarthGeometry} */ (profile.models.geometry);
			for (let member = 0; member < 2000; member++)
				expect(
					geometry.resolveStellarCatalogDirection([
						fixture.members[member * 4],
						fixture.members[member * 4 + 1],
						fixture.members[member * 4 + 2],
					]),
				).toEqual(row.expectedDirections[member]);
		}
	});
	describe('complete camera-cone support', () => {
		it('admits an inward cone near the coverage edge without demanding the entire dome', () => {
			const profile = create(),
				geometry = /** @type {FlatEarthGeometry} */ (profile.models.geometry),
				source = profile.models.lightSource.configuration.position.coordinates;
			const ray = geometry.resolveCompactViewSupport({
				origin: {coordinates: [source[0] + 32000000, source[1], 5], units: 'meters'},
				forward: [-1, 0, 0],
				halfAngle: {value: 0.1, units: 'radians'},
				coverageRadius: profile.domains.topology.coverageRadius,
			});
			expect(ray.direction[0]).toBeLessThan(0);
		});
		it('rejects an outward cone whose center ray crosses compact coverage', () => {
			const profile = create(),
				geometry = /** @type {FlatEarthGeometry} */ (profile.models.geometry),
				source = profile.models.lightSource.configuration.position.coordinates;
			expect(() =>
				geometry.resolveCompactViewSupport({
					origin: {coordinates: [source[0] + 32000000, source[1], 5], units: 'meters'},
					forward: [1, 0, 0],
					halfAngle: {value: 0.1, units: 'radians'},
					coverageRadius: profile.domains.topology.coverageRadius,
				}),
			).toThrowError(RangeError);
		});
		it('rejects unsupported cone edges even when its inward center ray is supported', () => {
			const profile = create(),
				geometry = /** @type {FlatEarthGeometry} */ (profile.models.geometry),
				source = profile.models.lightSource.configuration.position.coordinates;
			expect(() =>
				geometry.resolveCompactViewSupport({
					origin: {coordinates: [source[0] + 33377000, source[1], 5], units: 'meters'},
					forward: [-1, 0, 0],
					halfAngle: {value: Math.PI / 2 - 0.01, units: 'radians'},
					coverageRadius: profile.domains.topology.coverageRadius,
				}),
			).toThrowError(RangeError);
		});
	});
});
