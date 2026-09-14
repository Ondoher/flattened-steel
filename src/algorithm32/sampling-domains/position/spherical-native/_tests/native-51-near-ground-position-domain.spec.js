import {NATIVE_48_POSITION_DOMAIN_OWNER, NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER} from '../consts.js';
import {SphericalNativePositionDomains} from '../SphericalNativePositionDomains.js';

describe('Native51NearGroundPositionDomain', () => {
	it('adds the three selected near-ground samples and preserves every retained altitude exactly', () => {
		const domain = NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER;
		expect(domain.id).toBe('algorithm32-native-51-near-ground-position-v1');
		expect(domain.count).toBe(51);
		expect(domain.nodes.slice(0, 5).map((node) => node.coordinate.value)).toEqual([
			0, 468.75, 937.5, 1406.25, 1875,
		]);
		for (let index = 1; index < 48; index += 1) {
			expect(
				Object.is(
					domain.nodes[index + 3].coordinate.value,
					NATIVE_48_POSITION_DOMAIN_OWNER.nodes[index].coordinate.value,
				),
			).toBeTrue();
		}
		expect(
			domain.nodes.every((node, index) => node.index === index && node.coordinate.units === 'meters'),
		).toBeTrue();
		expect(domain.bottomRadius).toEqual({value: 6360000, units: 'meters'});
		expect(domain.topRadius).toEqual({value: 6420000, units: 'meters'});
	});

	it('retains the default owner and accepts physical facts independently of descriptive metadata', () => {
		expect(SphericalNativePositionDomains.select()).toBe(NATIVE_48_POSITION_DOMAIN_OWNER);
		expect(SphericalNativePositionDomains.select('native51-near-ground')).toBe(
			NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER,
		);
		const input = structuredClone(NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER);
		input.nodes[1].metadata = {constructionNodePolicy: 'diagnostic text only'};
		expect(SphericalNativePositionDomains.accept(input)).toBe(NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER);
		expect(
			SphericalNativePositionDomains.accept({...NATIVE_48_POSITION_DOMAIN_OWNER, id: 'retained-b1-profile-name'}),
		).toBe(NATIVE_48_POSITION_DOMAIN_OWNER);
	});

	it('rejects unsupported selectors, altered knots, units, order, and identities', () => {
		expect(() => SphericalNativePositionDomains.select('native96')).toThrowError(RangeError);
		const original = NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER;
		for (const change of [
			(domain) => {
				domain.nodes[1].coordinate.value += 1;
			},
			(domain) => {
				domain.nodes[1].coordinate.units = 'kilometers';
			},
			(domain) => {
				domain.nodes[1].index = 2;
			},
			(domain) => {
				domain.id = NATIVE_48_POSITION_DOMAIN_OWNER.id;
			},
			(domain) => {
				domain.count = 48;
			},
		]) {
			const input = structuredClone(original);
			change(input);
			expect(() => SphericalNativePositionDomains.accept(input)).toThrowError(RangeError);
		}
	});
});
