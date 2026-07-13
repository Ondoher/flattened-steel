import {
	NATIVE_4_POSITION_DOMAIN_OWNER,
	NATIVE_16_POSITION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
} from '../consts.js';
import SphericalNativePositionDomain from '../SphericalNativePositionDomain.js';

describe('spherical native position domains', /** Called by Jasmine to register the named test suite. */ () => {
	it('generates the selected Native4 and Native16 parity coordinates', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(coordinateValues(NATIVE_4_POSITION_DOMAIN_OWNER)).toEqual([0, 22500, 37500, 52500]);
		expect(coordinateValues(NATIVE_16_POSITION_DOMAIN_OWNER)).toEqual([
			0, 5625, 9375, 13125, 16875, 20625, 24375, 28125, 31875, 35625, 39375, 43125, 46875, 50625, 54375, 58125,
		]);
	});

	it('retains the production Native48 binary64 coordinates', /** Called by Jasmine to exercise the named behavior. */ () => {
		const values = coordinateValues(NATIVE_48_POSITION_DOMAIN_OWNER);

		expect(values).toHaveSize(48);
		expect(values[0]).toBe(0);
		expect(values[1]).toBe(1875);
		expect(values[6]).toBe(8124.999999999999);
		expect(values[12]).toBe(15625.000000000002);
		expect(values[24]).toBe(30624.999999999996);
		expect(values[47]).toBe(59375);
		expect(NATIVE_48_POSITION_DOMAIN_OWNER.boundaryAltitude).toEqual({value: 0, units: 'meters'});
	});

	it('accepts an exact ground boundary without changing the interior lattice', /** Called by Jasmine to exercise the named behavior. */ () => {
		const domain = new SphericalNativePositionDomain({
			id: 'test-spherical-native-48-boundary-zero',
			count: 48,
			boundaryAltitude: {value: 0, units: 'meters'},
		});
		const values = coordinateValues(domain);

		expect(values[0]).toBe(0);
		expect(values[1]).toBe(1875);
		expect(values[47]).toBe(59375);
		expect(domain.boundaryAltitude).toEqual({value: 0, units: 'meters'});
	});

	it('normalizes and validates an explicit boundary altitude', /** Called by Jasmine to exercise the named behavior. */ () => {
		const domain = new SphericalNativePositionDomain({
			id: 'test-spherical-native-48-boundary-kilometers',
			count: 48,
			boundaryAltitude: {value: 0.001, units: 'kilometers'},
		});

		expect(domain.nodes[0].coordinate).toEqual({value: 1, units: 'meters'});
		expect(domain.boundaryAltitude).toEqual({value: 1, units: 'meters'});
		expect(
			/** Called by Jasmine to invoke the operation whose outcome is asserted. */ () =>
				new SphericalNativePositionDomain({
					id: 'test-spherical-native-48-boundary-negative',
					count: 48,
					boundaryAltitude: {value: -1, units: 'meters'},
				}),
		).toThrowError(/must precede the first interior node/);
	});

	it('retains direct owner identities for every native extent', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(NATIVE_4_POSITION_DOMAIN_OWNER.id).toBe('algorithm32-native-4-position-v2');
		expect(NATIVE_16_POSITION_DOMAIN_OWNER.id).toBe('algorithm32-native-16-position-v2');
		expect(NATIVE_48_POSITION_DOMAIN_OWNER.id).toBe('algorithm32-native-48-position-v2');
		const repeated = new SphericalNativePositionDomain({
			id: NATIVE_48_POSITION_DOMAIN_OWNER.id,
			count: 48,
		});
		expect(repeated.id).toBe(NATIVE_48_POSITION_DOMAIN_OWNER.id);
	});

	it('keeps unit-bearing executable nodes on their owners', /** Called by Jasmine to exercise the named behavior. */ () => {
		for (const owner of [
			NATIVE_4_POSITION_DOMAIN_OWNER,
			NATIVE_16_POSITION_DOMAIN_OWNER,
			NATIVE_48_POSITION_DOMAIN_OWNER,
		]) {
			expect(
				owner.nodes.every(
					/**
					 * Called by Array.prototype.every to test one collection value against the shared condition.
					 * @param node - The node value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (node) => node.coordinate.units === 'meters',
				),
			).toBeTrue();
		}
	});
});

/**
 * Called by this module to coordinate values.
 * @param owner - The owner value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function coordinateValues(owner) {
	return owner.nodes.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param node - The node value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (node) => node.coordinate.value,
	);
}
