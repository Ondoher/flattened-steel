import {
	NATIVE_48_POSITION_DOMAIN,
	NATIVE_48_POSITION_NODES,
	createNative48PositionDomain,
} from '../Native48PositionDomain.js';

describe('Native48PositionDomain', () => {
	it('owns the exact retained 48 physical coordinates including 2 meters', () => {
		const values = NATIVE_48_POSITION_NODES.map((node) => node.coordinate.value);

		expect(values.length).toBe(48);
		expect(values[0]).toBe(2);
		expect(values[1]).toBe(1875);
		expect(values[47]).toBe(59375);
		for (let index = 1; index < values.length; index += 1) {
			expect(values[index]).toBe(((index + 0.5) / 48) * 60000);
		}
		expect(values[6]).toBe(8124.999999999999);
		expect(values[12]).toBe(15625.000000000002);
		expect(values[24]).toBe(30624.999999999996);
		expect(NATIVE_48_POSITION_NODES.every(
			(node) => node.coordinate.units === 'meters',
		)).toBeTrue();
	});

	it('declares the selected mapping and final-view-only interpolation', () => {
		expect(NATIVE_48_POSITION_DOMAIN.nodes).not.toBe(NATIVE_48_POSITION_NODES);
		expect(NATIVE_48_POSITION_DOMAIN.nodes).toEqual(NATIVE_48_POSITION_NODES);
		expect(NATIVE_48_POSITION_DOMAIN.id).toBe(
			'algorithm32-native-48-position-v1',
		);
		expect(NATIVE_48_POSITION_DOMAIN.mapping).toEqual(jasmine.objectContaining({
			kind: 'spherical-altitude-above-ground-v1',
			bottomRadius: { value: 6360000, units: 'meters' },
			topRadius: { value: 6420000, units: 'meters' },
			boundary: { value: 2, units: 'meters' },
		}));
		expect(NATIVE_48_POSITION_DOMAIN.interpolation).toEqual(jasmine.objectContaining({
			kind: 'linear-actual-neighboring-nodes-v1',
			scope: 'final-view-only',
			constructionLookup: 'retained-legacy-altitude-bin-nearest-v1',
		}));
	});

	it('is reproducibly content addressed', () => {
		const repeated = createNative48PositionDomain();

		expect(repeated.contentHash).toBe(NATIVE_48_POSITION_DOMAIN.contentHash);
		expect(NATIVE_48_POSITION_DOMAIN.contentHash).toBe(
			'sha256:4607a46195252a09df23c6b1684921146fcd3a0beaf68ac40da5ce228ae8428e',
		);
	});

});
