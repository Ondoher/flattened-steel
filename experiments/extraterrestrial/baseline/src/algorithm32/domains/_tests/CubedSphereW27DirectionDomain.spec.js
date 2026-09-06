import { FIBONACCI_34_DIRECTION_DOMAIN } from '../consts.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	CUBED_SPHERE_W27_FACES,
	CUBED_SPHERE_W27_UNIT_VECTORS,
	createCubedSphereW27DirectionStencil,
	createCubedSphereW27DirectionDomain,
	flattenCubedSphereW27NodeIndex,
	unflattenCubedSphereW27NodeIndex,
} from '../CubedSphereW27DirectionDomain.js';

describe('CubedSphereW27DirectionDomain', () => {
	it('retains the exact six-face W27 topology and storage order', () => {
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN.count).toBe(4374);
		expect(CUBED_SPHERE_W27_UNIT_VECTORS.length).toBe(4374);
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN.topology)
			.toEqual(jasmine.objectContaining({
				kind: 'six-face-boundary-inclusive-cubed-sphere',
				faceWidth: 27,
				cellWidth: 26,
				faceNodeCount: 729,
				storedDirectionCount: 4374,
				uniquePhysicalDirectionCount: 4058,
				flatteningOrder: 'face-major-then-v-then-u',
				seamStorage: 'duplicate-identical-physical-edge-and-corner-nodes',
			}));
		expect(CUBED_SPHERE_W27_FACES.map((face) => face.id)).toEqual([
			'positive-x',
			'negative-x',
			'positive-y',
			'negative-y',
			'positive-z',
			'negative-z',
		]);
	});

	it('retains the exact right-handed face axes', () => {
		expect(CUBED_SPHERE_W27_FACES).toEqual([
			{ id: 'positive-x', normal: [1, 0, 0], uAxis: [0, 1, 0], vAxis: [0, 0, 1] },
			{ id: 'negative-x', normal: [-1, 0, 0], uAxis: [0, -1, 0], vAxis: [0, 0, 1] },
			{ id: 'positive-y', normal: [0, 1, 0], uAxis: [-1, 0, 0], vAxis: [0, 0, 1] },
			{ id: 'negative-y', normal: [0, -1, 0], uAxis: [1, 0, 0], vAxis: [0, 0, 1] },
			{ id: 'positive-z', normal: [0, 0, 1], uAxis: [1, 0, 0], vAxis: [0, 1, 0] },
			{ id: 'negative-z', normal: [0, 0, -1], uAxis: [-1, 0, 0], vAxis: [0, 1, 0] },
		]);
	});

	it('generates exact face centers and duplicate physical seam nodes', () => {
		const expectedCenters = [
			[1, 0, 0],
			[-1, 0, 0],
			[0, 1, 0],
			[0, -1, 0],
			[0, 0, 1],
			[0, 0, -1],
		];

		for (let faceIndex = 0; faceIndex < 6; faceIndex += 1) {
			const index = flattenCubedSphereW27NodeIndex(faceIndex, 13, 13);
			expect(CUBED_SPHERE_W27_UNIT_VECTORS[index]).toEqual(
				expectedCenters[faceIndex],
			);
		}

		for (const vIndex of [0, 7, 13, 21, 26]) {
			const positiveXEdge = flattenCubedSphereW27NodeIndex(0, 26, vIndex);
			const positiveYEdge = flattenCubedSphereW27NodeIndex(2, 0, vIndex);
			expect(CUBED_SPHERE_W27_UNIT_VECTORS[positiveXEdge]).toEqual(
				CUBED_SPHERE_W27_UNIT_VECTORS[positiveYEdge],
			);
		}

		const unique = new Set(CUBED_SPHERE_W27_UNIT_VECTORS.map(
			(vector) => JSON.stringify(vector),
		));
		expect(unique.size).toBe(4058);
	});

	it('round trips every declared flattened-address boundary', () => {
		for (const address of [
			[0, 0, 0],
			[0, 26, 26],
			[3, 12, 19],
			[5, 26, 26],
		]) {
			const index = flattenCubedSphereW27NodeIndex(...address);
			const decoded = unflattenCubedSphereW27NodeIndex(index);
			expect([
				decoded.faceIndex,
				decoded.uIndex,
				decoded.vIndex,
			]).toEqual(address);
		}
		expect(() => flattenCubedSphereW27NodeIndex(6, 0, 0))
			.toThrowError(/faceIndex/u);
		expect(() => unflattenCubedSphereW27NodeIndex(4374))
			.toThrowError(/index/u);
	});

	it('uses the retained dominant-face bilinear construction stencil', () => {
		const exactCenter = createCubedSphereW27DirectionStencil([1, 0, 0]);
		expect(exactCenter).toEqual({
			indices: [flattenCubedSphereW27NodeIndex(0, 13, 13)],
			weights: [1],
		});

		const midpointLength = Math.hypot(1, 1 / 26);
		const midpoint = createCubedSphereW27DirectionStencil([
			1 / midpointLength,
			(1 / 26) / midpointLength,
			0,
		]);
		expect(midpoint.indices).toEqual([
			flattenCubedSphereW27NodeIndex(0, 13, 13),
			flattenCubedSphereW27NodeIndex(0, 14, 13),
		]);
		expect(midpoint.weights[0]).toBeCloseTo(0.5, 14);
		expect(midpoint.weights[1]).toBeCloseTo(0.5, 14);

		const seamLength = Math.sqrt(2);
		const faceTie = createCubedSphereW27DirectionStencil([
			1 / seamLength,
			1 / seamLength,
			0,
		]);
		expect(faceTie).toEqual({
			indices: [flattenCubedSphereW27NodeIndex(0, 26, 13)],
			weights: [1],
		});
	});

	it('pins reconstruction and source-frame identity separately from Fibonacci', () => {
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN.integrationWeights).toBeNull();
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN.interpolation)
			.toEqual(jasmine.objectContaining({
				kind: 'dominant-face-bilinear',
				revision: 'seam-aware-boundary-nodes-v1',
			}));
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN.frame.kind)
			.toBe('source-local-cubed-sphere-pinned-frame-v1');
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN.frame.kind)
			.not.toBe(FIBONACCI_34_DIRECTION_DOMAIN.frame.kind);
		expect(createCubedSphereW27DirectionDomain().contentHash)
			.toBe(CUBED_SPHERE_W27_DIRECTION_DOMAIN.contentHash);
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN.contentHash).toBe(
			'sha256:b27c677bb8527d77fe7a50a2caa7f7a2af16c99ccf37138e1f75e9e4085047a0',
		);
	});

});
