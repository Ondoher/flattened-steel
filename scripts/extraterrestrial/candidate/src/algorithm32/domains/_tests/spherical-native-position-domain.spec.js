import {
	NATIVE_4_POSITION_DOMAIN_OWNER,
	NATIVE_16_POSITION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
} from '../consts.js';
import {
	NATIVE_48_POSITION_DOMAIN,
	createNative48PositionDomain,
} from '../Native48PositionDomain.js';

describe('spherical native position domains', () => {
	it('generates the selected Native4 and Native16 parity coordinates', () => {
		expect(coordinateValues(NATIVE_4_POSITION_DOMAIN_OWNER)).toEqual([
			2,
			22500,
			37500,
			52500,
		]);
		expect(coordinateValues(NATIVE_16_POSITION_DOMAIN_OWNER)).toEqual([
			2,
			5625,
			9375,
			13125,
			16875,
			20625,
			24375,
			28125,
			31875,
			35625,
			39375,
			43125,
			46875,
			50625,
			54375,
			58125,
		]);
	});

	it('retains the production Native48 binary64 coordinates', () => {
		const values = coordinateValues(NATIVE_48_POSITION_DOMAIN_OWNER);

		expect(values).toHaveSize(48);
		expect(values[0]).toBe(2);
		expect(values[1]).toBe(1875);
		expect(values[6]).toBe(8124.999999999999);
		expect(values[12]).toBe(15625.000000000002);
		expect(values[24]).toBe(30624.999999999996);
		expect(values[47]).toBe(59375);
	});

	it('retains the established Native48 metadata identity', () => {
		expect(NATIVE_48_POSITION_DOMAIN_OWNER.descriptor.contentHash).toBe(
			'sha256:4607a46195252a09df23c6b1684921146fcd3a0beaf68ac40da5ce228ae8428e',
		);
		expect(NATIVE_48_POSITION_DOMAIN.contentHash).toBe(
			NATIVE_48_POSITION_DOMAIN_OWNER.descriptor.contentHash,
		);
		expect(createNative48PositionDomain().contentHash).toBe(
			NATIVE_48_POSITION_DOMAIN.contentHash,
		);
	});

	it('keeps executable nodes distinct from descriptor metadata copies', () => {
		for (const owner of [
			NATIVE_4_POSITION_DOMAIN_OWNER,
			NATIVE_16_POSITION_DOMAIN_OWNER,
			NATIVE_48_POSITION_DOMAIN_OWNER,
		]) {
			expect(owner.descriptor.nodes).not.toBe(owner.nodes);
			expect(owner.descriptor.nodes).toEqual(owner.nodes);
			expect(owner.nodes.every(
				(node) => node.coordinate.units === 'meters',
			)).toBeTrue();
		}
	});
});

function coordinateValues(owner) {
	return owner.nodes.map((node) => node.coordinate.value);
}
