import {
	canonicalDescriptorString,
	immutableDescriptorData,
	sha256Descriptor,
} from '../../descriptors/descriptorSupport.js';

describe('descriptorSupport', () => {
	it('deep-copies descriptor data without runtime freezing', () => {
		const source = {
			z: new Float32Array([1, 2]),
			a: { enabled: true },
		};
		const copied = immutableDescriptorData(source);

		source.z[0] = 99;
		source.a.enabled = false;

		expect(copied).toEqual({ a: { enabled: true }, z: [1, 2] });
		expect(Object.isFrozen(copied)).toBeFalse();
		expect(Object.isFrozen(copied.a)).toBeFalse();
		expect(Object.isFrozen(copied.z)).toBeFalse();
	});

	it('serializes keys canonically and computes the browser-safe SHA-256 value', () => {
		const left = { b: 2, a: [1, true] };
		const right = { a: [1, true], b: 2 };

		expect(canonicalDescriptorString(left)).toBe('{"a":[1,true],"b":2}');
		expect(sha256Descriptor(left)).toBe(sha256Descriptor(right));
		expect(sha256Descriptor('abc')).toBe(
			'sha256:6cc43f858fbb763301637b5af970e2a46b46f461f27e5a0f41e009c59b827b25',
		);
	});

});
