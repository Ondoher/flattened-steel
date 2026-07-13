import {NATIVE_48_POSITION_DOMAIN_OWNER, NATIVE_48_POSITION_NODES} from '../consts.js';
import SphericalNativePositionDomain from '../SphericalNativePositionDomain.js';

describe('Native48PositionDomain', /** Called by Jasmine to register the named test suite. */ () => {
	it('owns the exact retained 48 physical coordinates including ground', /** Called by Jasmine to exercise the named behavior. */ () => {
		const values = NATIVE_48_POSITION_NODES.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param node - The node value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (node) => node.coordinate.value,
		);

		expect(values.length).toBe(48);
		expect(values[0]).toBe(0);
		expect(values[1]).toBe(1875);
		expect(values[47]).toBe(59375);
		for (let index = 1; index < values.length; index += 1) {
			expect(values[index]).toBe(((index + 0.5) / 48) * 60000);
		}
		expect(values[6]).toBe(8124.999999999999);
		expect(values[12]).toBe(15625.000000000002);
		expect(values[24]).toBe(30624.999999999996);
		expect(
			NATIVE_48_POSITION_NODES.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param node - The node value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (node) => node.coordinate.units === 'meters',
			),
		).toBeTrue();
	});

	it('exposes direct selected owner facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(NATIVE_48_POSITION_DOMAIN_OWNER.nodes).toBe(NATIVE_48_POSITION_NODES);
		expect(NATIVE_48_POSITION_DOMAIN_OWNER.id).toBe('algorithm32-native-48-position-v2');
		expect(NATIVE_48_POSITION_DOMAIN_OWNER.bottomRadius).toEqual({value: 6360000, units: 'meters'});
		expect(NATIVE_48_POSITION_DOMAIN_OWNER.topRadius).toEqual({value: 6420000, units: 'meters'});
	});

	it('creates independent owners with the same direct identity and values', /** Called by Jasmine to exercise the named behavior. */ () => {
		const repeated = new SphericalNativePositionDomain({
			id: NATIVE_48_POSITION_DOMAIN_OWNER.id,
			count: 48,
		});

		expect(repeated).not.toBe(NATIVE_48_POSITION_DOMAIN_OWNER);
		expect(repeated.id).toBe(NATIVE_48_POSITION_DOMAIN_OWNER.id);
		expect(repeated.nodes).toEqual(NATIVE_48_POSITION_NODES);
	});
});
