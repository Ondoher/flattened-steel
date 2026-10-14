import * as THREE from '../../../../../node_modules/three/build/three.module.js';
import {ThreeCacheBackend} from '../ThreeCacheBackend.js';

/** Create a complete signed, channel- and address-coded physical scalar fixture on the GPU.
 * @param {ThreeCacheBackend} backend - Backend that owns the fixture.
 * @returns {Promise<GpuCacheField>} - Completed 7 by 3 by 15 scalar field.
 */
async function createFixture(backend) {
	const specification = {id: 'spectral-packing-fixture', storage: {format: 'R32F', width: 7, height: 3, layers: 15}};
	const field = backend.allocateField(specification);
	const shader = {
		id: 'spectral-packing-fixture',
		sourceHash: 'signed-channel-address-fixture-v1',
		output: specification,
		bindings: [],
		source: `precision highp float; precision highp int;
uniform int a32CacheWavelengthLayer; out float value;
void main(){int channel=a32CacheWavelengthLayer;float signValue=channel%2==0?1.0:-1.0;
value=signValue*(float(channel*128)+floor(gl_FragCoord.y)*8.0+floor(gl_FragCoord.x)+0.25);}`,
	};
	const program = await backend.compile(shader);
	try {
		for (let layer = 0; layer < 15; layer++)
			backend.submitLayer({program, inputs: [], output: field, layer, bindings: []});
		return field;
	} finally {
		program.dispose();
	}
}

describe('Spectral runtime packing', () => {
	let renderer, backend;
	beforeEach(() => {
		renderer = new THREE.WebGLRenderer({canvas: document.createElement('canvas')});
		renderer.setSize(7, 3, false);
		backend = new ThreeCacheBackend({THREE, renderer});
	});
	afterEach(() => {
		backend.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
	});

	it('packs every channel and address exactly, zeroes padding and outlives its scalar source', async () => {
		const field = await createFixture(backend);
		const sentinel = new THREE.WebGLRenderTarget(2, 2);
		renderer.setRenderTarget(sentinel);
		renderer.setViewport(0, 0, 1, 2);
		renderer.setScissor(0, 0, 2, 1);
		renderer.setScissorTest(true);
		const packed = backend.packRuntimeField({
			source: field,
			id: 'packed-v1',
			valueKey: 'cache.cumulativeScatteringDensity',
		});
		expect(renderer.getRenderTarget()).toBe(sentinel);
		expect(renderer.getViewport(new THREE.Vector4()).toArray()).toEqual([0, 0, 1, 2]);
		expect(renderer.getScissor(new THREE.Vector4()).toArray()).toEqual([0, 0, 2, 1]);
		expect(renderer.getScissorTest()).toBeTrue();
		field.dispose();
		expect(packed.storage).toEqual({format: 'RGBA32F', width: 7, height: 3, layers: 4});
		const coordinates = [];
		for (let layer = 0; layer < 4; layer++)
			for (let y = 0; y < 3; y++) for (let x = 0; x < 7; x++) coordinates.push({x, y, layer});
		const actual = backend.readTextureTexels(packed, coordinates);
		for (let index = 0; index < coordinates.length; index++) {
			const {x, y, layer} = coordinates[index];
			for (let component = 0; component < 4; component++) {
				const channel = layer * 4 + component;
				const expected = channel === 15 ? 0 : (channel % 2 === 0 ? 1 : -1) * (channel * 128 + y * 8 + x + 0.25);
				expect(actual[index * 4 + component])
					.withContext(`channel ${channel}, x ${x}, y ${y}`)
					.toBe(expected);
			}
		}
		const logical = await backend.readRuntimeBindingField(packed.runtimeBinding);
		for (let channel = 0; channel < 15; channel++)
			for (let y = 0; y < 3; y++)
				for (let x = 0; x < 7; x++)
					expect(logical.values[(channel * 3 + y) * 7 + x]).toBe(
						(channel % 2 === 0 ? 1 : -1) * (channel * 128 + y * 8 + x + 0.25),
					);
		packed.dispose();
		packed.dispose();
		expect(() => backend.readTextureTexels(packed, [{x: 0, y: 0, layer: 0}])).toThrow();
		sentinel.dispose();
	});

	it('releases a failed conversion target and preserves the scalar source and renderer state', async () => {
		const field = await createFixture(backend);
		const sentinel = new THREE.WebGLRenderTarget(2, 2);
		renderer.setRenderTarget(sentinel);
		const before = renderer.info.memory.textures;
		const render = renderer.render;
		renderer.render = () => {
			throw new Error('Injected packing draw failure');
		};
		try {
			expect(() =>
				backend.packRuntimeField({
					source: field,
					id: 'failed-packed',
					valueKey: 'cache.cumulativeScatteringDensity',
				}),
			).toThrowError('Injected packing draw failure');
		} finally {
			renderer.render = render;
		}
		expect(renderer.getRenderTarget()).toBe(sentinel);
		expect(renderer.info.memory.textures).toBe(before);
		const result = await backend.readSelectedScalars({
			field,
			coordinates: [{directionIndex: 6, positionIndex: 2, wavelengthIndex: 14}],
		});
		expect(result.samples[0].value).toBe(14 * 128 + 2 * 8 + 6 + 0.25);
		field.dispose();
		sentinel.dispose();
	});

	it('rejects foreign and disposed sources without publishing a packed owner', async () => {
		const field = await createFixture(backend);
		const other = new ThreeCacheBackend({THREE, renderer});
		try {
			expect(() =>
				other.packRuntimeField({source: field, id: 'foreign', valueKey: 'cache.cumulativeScatteringDensity'}),
			).toThrowError(/owned/);
		} finally {
			other.dispose();
		}
		field.dispose();
		expect(() =>
			backend.packRuntimeField({source: field, id: 'retired', valueKey: 'cache.cumulativeScatteringDensity'}),
		).toThrowError(/disposed/);
	});
});
