import {ShaderContributions} from '../ShaderContributions.js';
import {ShaderSource} from '../ShaderSource.js';

describe('shader-contribution helpers', /** Called by Jasmine to register the named test suite. */ () => {
	it('creates independent complete contribution records', /** Called by Jasmine to exercise the named behavior. */ () => {
		const first = ShaderContributions.createShaderContribution({
			id: 'first',
			owner: 'geometry',
			functions: [ShaderContributions.createShaderSourceBlock('block', 'declareHelpers', 2, 'float f();')],
		});
		const second = ShaderContributions.createShaderContribution({id: 'second', owner: 'atmosphere'});

		expect(first).toEqual(
			jasmine.objectContaining({
				id: 'first',
				owner: 'geometry',
				defines: [],
				uniforms: [],
				textures: [],
				mainHooks: [],
				bindingRequirements: [],
				diagnostics: null,
			}),
		);
		expect(first.functions).toEqual([
			{
				id: 'block',
				slot: 'declareHelpers',
				order: 2,
				code: 'float f();',
			},
		]);

		first.defines.push('FIRST');
		expect(second.defines).toEqual([]);
	});

	it('creates uniform, texture, and binding declarations without alternate shapes', /** Called by Jasmine to exercise the named behavior. */ () => {
		const uniform = ShaderContributions.createShaderUniformDeclaration('uValue', 'float', 'runtime.value');
		const defaultedUniform = ShaderContributions.createShaderUniformDeclaration(
			'uDefaulted',
			'float',
			'runtime.defaulted',
			0,
		);

		expect(uniform).toEqual({name: 'uValue', type: 'float', valueKey: 'runtime.value'});
		expect(Object.hasOwn(uniform, 'defaultValue')).toBeFalse();
		expect(defaultedUniform).toEqual({
			name: 'uDefaulted',
			type: 'float',
			valueKey: 'runtime.defaulted',
			defaultValue: 0,
		});
		expect(ShaderContributions.createShaderTextureDeclaration('uCache', 'sampler3D', 'cache.texture')).toEqual({
			name: 'uCache',
			type: 'sampler3D',
			valueKey: 'cache.texture',
		});
		expect(
			ShaderContributions.createShaderBindingRequirement(
				'cache-binding',
				'cache',
				'texture',
				'build',
				'cache.texture',
				true,
			),
		).toEqual({
			id: 'cache-binding',
			owner: 'cache',
			kind: 'texture',
			updateFrequency: 'build',
			valueKey: 'cache.texture',
			required: true,
		});
	});

	it('formats deterministic scalar and array GLSL literals', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(ShaderSource.formatFloat(2)).toBe('2.0');
		expect(ShaderSource.formatFloat(Math.PI)).toBe('3.14159265359');
		expect(ShaderSource.formatFloatArray([2, Math.PI])).toBe('2.0, 3.14159265359');
	});
});
