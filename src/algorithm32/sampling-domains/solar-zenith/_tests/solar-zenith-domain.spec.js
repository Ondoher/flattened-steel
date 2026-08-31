import {SOLAR_ZENITH_180_DOMAIN_OWNER} from '../consts.js';

describe('solar-zenith domain', /** Called by Jasmine to register the named test suite. */ () => {
	it('owns the selected Z180 cell centers and interpolation', /** Called by Jasmine to exercise the named behavior. */ () => {
		const domain = SOLAR_ZENITH_180_DOMAIN_OWNER;

		expect(domain.id).toBe('uniform-solar-zenith-cell-centers-180x1-degree-v1');
		expect(domain.count).toBe(180);
		expect((domain.nodes[0].angle.value * 180) / Math.PI).toBeCloseTo(0.5, 14);
		expect((domain.nodes[179].angle.value * 180) / Math.PI).toBeCloseTo(179.5, 12);
		expect(domain.resolveStencil({value: Math.PI / 2, units: 'radians'})).toEqual({
			indices: [89, 90],
			weights: [0.5, 0.5],
		});
	});

	it('clamps only the physical zero and pi endpoints to their nearest centers', /** Called by Jasmine to exercise the named behavior. */ () => {
		const domain = SOLAR_ZENITH_180_DOMAIN_OWNER;

		expect(domain.resolveStencil({value: 0, units: 'radians'})).toEqual({indices: [0], weights: [1]});
		expect(domain.resolveStencil({value: Math.PI, units: 'radians'})).toEqual({indices: [179], weights: [1]});
	});
});
