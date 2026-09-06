import {
	createShaderBindingRequirement,
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
	createShaderUniformDescriptor,
	formatShaderFloat,
	formatShaderFloatArray,
} from '../shaderContribution.js';

describe('shaderContribution helpers', () => {
	it('creates independent complete contribution records', () => {
		const first = createShaderContribution({
			id: 'first',
			owner: 'geometry',
			functions: [createShaderSourceBlock('block', 'declareFunctions', 2, 'float f();')],
		});
		const second = createShaderContribution({ id: 'second', owner: 'atmosphere' });

		expect(first).toEqual(jasmine.objectContaining({
			id: 'first',
			owner: 'geometry',
			defines: [],
			uniforms: [],
			textures: [],
			mainHooks: [],
			bindingRequirements: [],
			diagnostics: null,
		}));
		expect(first.functions).toEqual([{
			id: 'block',
			slot: 'declareFunctions',
			order: 2,
			code: 'float f();',
		}]);

		first.defines.push('FIRST');
		expect(second.defines).toEqual([]);
	});

	it('creates uniform, texture, and binding descriptors without alternate shapes', () => {
		const uniform = createShaderUniformDescriptor('uValue', 'float', 'runtime.value');
		const defaultedUniform = createShaderUniformDescriptor(
			'uDefaulted',
			'float',
			'runtime.defaulted',
			0,
		);

		expect(uniform).toEqual({ name: 'uValue', type: 'float', valueKey: 'runtime.value' });
		expect(Object.hasOwn(uniform, 'defaultValue')).toBeFalse();
		expect(defaultedUniform).toEqual({
			name: 'uDefaulted',
			type: 'float',
			valueKey: 'runtime.defaulted',
			defaultValue: 0,
		});
		expect(createShaderTextureDescriptor('uCache', 'sampler3D', 'cache.texture')).toEqual({
			name: 'uCache',
			type: 'sampler3D',
			valueKey: 'cache.texture',
		});
		expect(createShaderBindingRequirement(
			'cache-binding',
			'cache',
			'texture',
			'build',
			'cache.texture',
			true,
		)).toEqual({
			id: 'cache-binding',
			owner: 'cache',
			kind: 'texture',
			updateFrequency: 'build',
			valueKey: 'cache.texture',
			required: true,
		});
	});

	it('formats deterministic scalar and array GLSL literals', () => {
		expect(formatShaderFloat(2)).toBe('2.0');
		expect(formatShaderFloat(Math.PI)).toBe('3.14159265359');
		expect(formatShaderFloatArray([2, Math.PI])).toBe('2.0, 3.14159265359');
	});
});
