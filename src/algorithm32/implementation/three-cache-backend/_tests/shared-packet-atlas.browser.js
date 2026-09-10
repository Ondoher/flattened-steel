import * as THREE from '../../../../../node_modules/three/build/three.module.js';
import {ThreeCacheBackend} from '../ThreeCacheBackend.js';
import DistantSunSharedCachePacketLayout from '../../distant-sun/cache/DistantSunSharedCachePacketLayout.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../sampling-domains/index.js';

/** Independent three-row spectral fixture with exact channel/direction-specific bits. */
function packetFixture() {
	const source = new Float32Array(3 * 4058 * 15),
		bits = new Uint32Array(source.buffer);
	for (let index = 0; index < bits.length; index += 1) bits[index] = 0x3f000000 + index;
	const directions = new Uint16Array(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices);
	const packet = new DistantSunSharedCachePacketLayout().pack({
		logicalBlockId: 'fixture',
		decodedSha256: 'a'.repeat(64),
		logicalToUniqueIndexSha256: 'b'.repeat(64),
		blockRowCount: 3,
		decodedValues: source,
		logicalToUniqueIndex: directions,
	});
	return {packet, bits, directions};
}

describe('Shared packet atlas GPU primitives', () => {
	let renderer, backend;
	beforeEach(() => {
		renderer = new THREE.WebGLRenderer({canvas: document.createElement('canvas')});
		renderer.setSize(4, 4, false);
		backend = new ThreeCacheBackend({THREE, renderer});
	});
	afterEach(() => {
		backend?.dispose();
		renderer?.dispose();
		renderer?.forceContextLoss();
	});

	it('allocates the 24-layer atlas and retrieves exact channel, seam, padding, and layer addresses', () => {
		const array = backend.allocatePersistentArray({
			id: 'packet-atlas',
			valueKey: 'cache.sharedPacketAtlas',
			storage: {format: 'RGBA32F', width: 648, height: 1728, layers: 24},
			maximumBytes: 429981696,
		});
		expect(array.byteLength).toBe(429981696);
		const fixture = packetFixture(),
			context = renderer.getContext();
		context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);
		const previousBinding = context.getParameter(context.TEXTURE_BINDING_2D_ARRAY);
		backend.uploadPersistentArrayLayer({array, layer: 0, identity: 'first', values: fixture.packet.values});
		backend.uploadPersistentArrayLayer({array, layer: 23, identity: 'last', values: fixture.packet.values});
		expect(context.getParameter(context.UNPACK_FLIP_Y_WEBGL)).toBeTrue();
		expect(context.getParameter(context.TEXTURE_BINDING_2D_ARRAY)).toBe(previousBinding);
		const coordinates = [];
		for (const layer of [0, 23])
			for (const y of [0, 26, 27, 80, 81, 1727])
				for (const x of [0, 26, 27, 161, 162, 324, 486, 647]) coordinates.push({x, y, layer});
		const actual = backend.readTextureTexels(array, coordinates),
			actualBits = new Uint32Array(actual.buffer);
		for (let index = 0; index < coordinates.length; index += 1) {
			const {x, y} = coordinates[index],
				row = Math.floor(y / 27),
				channelGroup = Math.floor(x / 162);
			const face = Math.floor((x % 162) / 27),
				horizontal = x % 27,
				vertical = y % 27;
			const unique = fixture.directions[face * 729 + vertical * 27 + horizontal];
			for (let component = 0; component < 4; component += 1) {
				const channel = channelGroup * 4 + component;
				const expected = row >= 3 || channel >= 15 ? 0 : fixture.bits[(channel * 3 + row) * 4058 + unique];
				expect(actualBits[index * 4 + component])
					.withContext(`texel ${index}, component ${component}`)
					.toBe(expected);
			}
		}
		const bindings = {backendId: backend.id, bindings: [array.runtimeBinding]},
			uniforms = {'cache.sharedPacketAtlas': {value: null}};
		backend.installRuntimeBindings({bindings, uniforms});
		const installed = uniforms['cache.sharedPacketAtlas'].value;
		const sentinel = {};
		uniforms['cache.sharedPacketAtlas'].value = sentinel;
		expect(() =>
			backend.installRuntimeBindings({
				bindings: {backendId: backend.id, bindings: [array.runtimeBinding, {...array.runtimeBinding}]},
				uniforms,
			}),
		).toThrowError(/opaque/);
		expect(uniforms['cache.sharedPacketAtlas'].value).toBe(sentinel);
		backend.installRuntimeBindings({bindings, uniforms});
		backend.protectPersistentArrayLayers(array, [0]);
		expect(() =>
			backend.uploadPersistentArrayLayer({array, layer: 0, identity: 'forbidden', values: fixture.packet.values}),
		).toThrowError(/Published/);
		backend.uploadPersistentArrayLayer({array, layer: 23, identity: 'replacement', values: fixture.packet.values});
		backend.installRuntimeBindings({bindings, uniforms});
		expect(uniforms['cache.sharedPacketAtlas'].value).toBe(installed);
		expect(backend.getPersistentArrayState(array).layerIdentities[0]).toBe('first');
		expect(backend.getPersistentArrayState(array).layerIdentities[23]).toBe('replacement');
		expect(() => backend.protectPersistentArrayLayers(array, [1])).toThrowError(/unpopulated/);
		const other = new ThreeCacheBackend({THREE, renderer});
		try {
			expect(() => other.getPersistentArrayState(array)).toThrowError(/owned/);
		} finally {
			other.dispose();
		}
		array.dispose();
		expect(() => backend.getPersistentArrayState(array)).toThrowError();
	});

	it('uploads exact unsigned row addresses and signed altitude metadata and rejects invalid allocations', () => {
		const row = backend.uploadImmutableTexture({
			id: 'rows',
			valueKey: 'cache.sharedRowAddress',
			storage: {format: 'RG16UI', width: 2, height: 2, layers: 1},
			values: new Uint16Array([0, 0, 23, 63, 65535, 65535, 5, 3]),
		});
		expect(
			Array.from(
				backend.readTextureTexels(row, [
					{x: 1, y: 0, layer: 0},
					{x: 0, y: 1, layer: 0},
				]),
			),
		).toEqual([23, 63, 0, 1, 65535, 65535, 0, 1]);
		const ledger = backend.uploadImmutableTexture({
			id: 'ledger',
			valueKey: 'cache.sharedAltitudeLedger',
			storage: {format: 'RGBA32I', width: 2, height: 1, layers: 1},
			values: new Int32Array([-1, -1, -1, 0, 0, 180, 799, 1]),
		});
		expect(
			Array.from(
				backend.readTextureTexels(ledger, [
					{x: 0, y: 0, layer: 0},
					{x: 1, y: 0, layer: 0},
				]),
			),
		).toEqual([-1, -1, -1, 0, 0, 180, 799, 1]);
		expect(() =>
			backend.allocatePersistentArray({
				id: 'over-budget',
				valueKey: 'cache.sharedPacketAtlas',
				storage: {format: 'RGBA32F', width: 648, height: 1728, layers: 24},
				maximumBytes: 1,
			}),
		).toThrowError(/policy/);
		expect(() =>
			backend.uploadImmutableTexture({
				id: 'wrong-type',
				valueKey: 'cache.sharedAltitudeLedger',
				storage: {format: 'RGBA32I', width: 1, height: 1, layers: 1},
				values: new Uint16Array(4),
			}),
		).toThrowError(/type/);
	});
});
