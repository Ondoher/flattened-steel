import {ShaderCompatibilityValidator} from '../ShaderCompatibilityValidator.js';

/**
 * Called by this module to create one shader contribution.
 *
 * @param {Partial<ShaderContribution>} [overrides] - Supplies overrides.
 * @returns {ShaderContribution} - Return contribution.
 */
function createContribution(overrides = {}) {
	return {
		id: 'runtime-state',
		owner: 'runtime',
		provides: ['createInitialShaderState'],
		requires: [],
		defines: [],
		uniforms: [],
		textures: [],
		functions: [],
		mainHooks: [],
		bindingRequirements: [],
		...overrides,
	};
}

describe('ShaderCompatibilityValidator', /** Called by Jasmine to register the named test suite. */ () => {
	it('accepts contributions that satisfy symbol requirements', /** Called by Jasmine to exercise the named behavior. */ () => {
		const validator = new ShaderCompatibilityValidator();
		const report = validator.validate({
			contributions: [createContribution()],
			mainRequiredSymbols: ['createInitialShaderState'],
		});

		expect(report.status).toBe('accepted');
		expect(report.providedSymbols).toEqual(['createInitialShaderState']);
		expect(report.requiredSymbols).toEqual(['createInitialShaderState']);
		expect(report.errors).toEqual([]);
	});

	it('rejects missing required symbols', /** Called by Jasmine to exercise the named behavior. */ () => {
		const validator = new ShaderCompatibilityValidator();
		const report = validator.validate({
			contributions: [],
			mainRequiredSymbols: ['createInitialShaderState'],
		});

		expect(report.status).toBe('rejected');
		expect(report.missingRequiredSymbols).toEqual(['createInitialShaderState']);
		expect(report.errors[0]).toContain('Required shader symbol is missing');
	});

	it('rejects duplicate provided symbols', /** Called by Jasmine to exercise the named behavior. */ () => {
		const validator = new ShaderCompatibilityValidator();
		const report = validator.validate({
			contributions: [createContribution({id: 'runtime-a'}), createContribution({id: 'runtime-b'})],
			mainRequiredSymbols: ['createInitialShaderState'],
		});

		expect(report.status).toBe('rejected');
		expect(report.duplicateProvidedSymbols).toEqual(['createInitialShaderState']);
		expect(report.errors[0]).toContain('provided by multiple contributions');
	});

	it('accepts requirements supplied by the runtime skeleton', /** Called by Jasmine to exercise the named behavior. */ () => {
		const validator = new ShaderCompatibilityValidator();
		const report = validator.validate({
			contributions: [],
			mainRequiredSymbols: ['createInitialShaderState'],
			systemProvidedSymbols: ['createInitialShaderState'],
		});

		expect(report.status).toBe('accepted');
		expect(report.errors).toEqual([]);
		expect(report.requiredSymbols).toEqual(['createInitialShaderState']);
	});
});
