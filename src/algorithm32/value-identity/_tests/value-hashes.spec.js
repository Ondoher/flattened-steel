import {CanonicalValueHash} from '../CanonicalValueHash.js';
import {StableValueHash} from '../StableValueHash.js';

describe('canonical value identity', /** Called by Jasmine to register the named test suite. */ () => {
	it('is stable across object key order and preserves the established hash', /** Called by Jasmine to exercise the named behavior. */ () => {
		const left = {b: 2, a: [1, true]};
		const right = {a: [1, true], b: 2};

		expect(CanonicalValueHash.sha256Value(left)).toBe(CanonicalValueHash.sha256Value(right));
		expect(CanonicalValueHash.sha256Value('abc')).toBe(
			'sha256:6cc43f858fbb763301637b5af970e2a46b46f461f27e5a0f41e009c59b827b25',
		);
	});

	it('normalizes typed arrays to their logical values', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(CanonicalValueHash.sha256Value(new Float32Array([1, 2]))).toBe(CanonicalValueHash.sha256Value([1, 2]));
	});

	it('preserves stable stringify and FNV identities as a distinct contract', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(StableValueHash.stableStringify({b: 2, a: [1, true]})).toBe('{"a":[1,true],"b":2}');
		expect(StableValueHash.stableHash('abc')).toBe('fnv1a32:b6413aeb');
		expect(StableValueHash.stableHash('abc')).not.toBe(CanonicalValueHash.sha256Value('abc'));
	});
});
