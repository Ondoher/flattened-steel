import { SharedModel } from '../../models/SharedModel.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../../profiles/index.js';
import { ShaderDescriptorBuilder } from '../ShaderDescriptorBuilder.js';

/**
 * Create a descriptor-bearing model double.
 *
 * @param {string} owner - Supplies owner name.
 * @returns {object} Return model double.
 */
function createModel(owner) {
	return {
		describe() {
			return {
				kind: `algorithm32-${owner}-model`,
				id: `${owner}-test`,
				fingerprint: `${owner}:fingerprint`,
			};
		},
	};
}

/**
 * Create a shared model for descriptor specs.
 *
 * @returns {SharedModel} Return shared model.
 */
function createSharedModel() {
	return new SharedModel({
		version: 5,
		lightSource: createModel('light-source'),
		atmosphere: createModel('atmosphere'),
		geometry: createModel('geometry'),
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
}

describe('ShaderDescriptorBuilder', () => {
	it('builds deterministic descriptor sections from the shared model snapshot', () => {
		const builder = new ShaderDescriptorBuilder();
		const model = createSharedModel();
		const config = {
			version: 5,
			config: {
				execution: {
					pathIntervalCount: 8,
				},
				shader: {
					mode: 'test-mode',
				},
			},
			model: model.snapshot(),
		};
		const color = {
			describe() {
				return {
					kind: 'algorithm32-color',
					id: 'test-color',
					colorSpace: 'linear-display',
					fingerprint: 'color:fingerprint',
				};
			},
		};

		const first = builder.build({ model, config, color });
		const second = builder.build({ snapshot: model.snapshot(), config, color });

		expect(first.fingerprint).toBe(second.fingerprint);
		expect(first.variantId).toBe('model-v5');
		expect(first.spectralBasis.facts.channelCount)
			.toBe(NATIVE_15_SPECTRAL_BASIS.channelCount);
		expect(first.geometry.facts.id).toBe('geometry-test');
		expect(first.lightSource.facts.id).toBe('light-source-test');
		expect(first.transport.facts.execution.pathIntervalCount).toBe(8);
		expect(first.color.facts.id).toBe('test-color');
		expect(first.runtime.facts.mode).toBe('test-mode');
	});

	it('fails loudly when config does not supply Color', () => {
		const builder = new ShaderDescriptorBuilder();

		expect(() => builder.build({
			model: createSharedModel(),
		})).toThrowError(/Color abstraction/);
	});

	it('uses configured Color from the accepted facade config snapshot', () => {
		const builder = new ShaderDescriptorBuilder();
		const descriptor = builder.build({
			model: createSharedModel(),
			config: {
				config: {
					color: {
						describe() {
							return {
								kind: 'algorithm32-color',
								id: 'config-color',
								colorSpace: 'linear-display',
								fingerprint: 'color:config',
							};
						},
					},
				},
			},
		});

		expect(descriptor.color.facts).toEqual(jasmine.objectContaining({
			id: 'config-color',
			colorSpace: 'linear-display',
		}));
	});

	it('describes the completed cumulative scattering cache without an incident tag', () => {
		const descriptor = new ShaderDescriptorBuilder().build({
			model: createSharedModel(),
			color: {
				describe() {
					return { id: 'color', fingerprint: 'color' };
				},
			},
			cacheDescriptor: /** @type {ScatteringCacheDescriptor} */ (/** @type {unknown} */ ({
				kind: 'scattering-cache',
				id: 'cumulative-cache',
			})),
		});

		expect(descriptor.cache.compatibilityTags).toEqual([
			'cumulative-scattering-cache',
		]);
		expect(descriptor.cache.facts).toEqual(jasmine.objectContaining({
			kind: 'scattering-cache',
			id: 'cumulative-cache',
		}));
	});

	it('defaults only absent descriptor options and rejects explicit null values', () => {
		const builder = new ShaderDescriptorBuilder();
		const model = createSharedModel();
		const color = {
			describe() {
				return { id: 'color', fingerprint: 'color' };
			},
		};
		const build = (overrides) => builder.build({ model, color, ...overrides });

		expect(() => build({ config: null })).toThrowError(/config/);
		expect(() => build({ cacheDescriptor: null })).toThrowError(/cacheDescriptor/);
		expect(() => build({ compatibilityTags: null })).toThrowError(/compatibilityTags/);
		expect(() => build({ variantId: null })).toThrowError(/variantId/);
		expect(() => build({ config: { config: { shader: null } } })).toThrowError(/config\.shader/);
		expect(() => build({ config: { config: { shader: { mode: null } } } })).toThrowError(/shader mode/);
		expect(() => builder.build({
			model,
			color: null,
			config: { config: { color } },
		})).toThrowError(/Color abstraction/);
	});
});
