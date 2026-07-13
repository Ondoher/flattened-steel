import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W27_FACES,
	CUBED_SPHERE_W27_UNIT_VECTORS,
} from '../consts.js';
import CubedSphereDirectionDomain from '../CubedSphereDirectionDomain.js';
import {FIBONACCI_34_DIRECTION_DOMAIN_OWNER} from '../../fibonacci/consts.js';

describe('CubedSphereW27DirectionDomain', /** Called by Jasmine to register the named test suite. */ () => {
	it('retains the exact six-face W27 topology and storage order', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount).toBe(4374);
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.faceWidth).toBe(27);
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.cellWidth).toBe(26);
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.faceNodeCount).toBe(729);
		expect(CUBED_SPHERE_W27_UNIT_VECTORS.length).toBe(4374);
		expect(
			CUBED_SPHERE_W27_FACES.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param face - The face value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (face) => face.id,
			),
		).toEqual(['positive-x', 'negative-x', 'positive-y', 'negative-y', 'positive-z', 'negative-z']);
	});

	it('retains the exact right-handed face axes', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(CUBED_SPHERE_W27_FACES).toEqual([
			{id: 'positive-x', normal: [1, 0, 0], uAxis: [0, 1, 0], vAxis: [0, 0, 1]},
			{id: 'negative-x', normal: [-1, 0, 0], uAxis: [0, -1, 0], vAxis: [0, 0, 1]},
			{id: 'positive-y', normal: [0, 1, 0], uAxis: [-1, 0, 0], vAxis: [0, 0, 1]},
			{id: 'negative-y', normal: [0, -1, 0], uAxis: [1, 0, 0], vAxis: [0, 0, 1]},
			{id: 'positive-z', normal: [0, 0, 1], uAxis: [1, 0, 0], vAxis: [0, 1, 0]},
			{id: 'negative-z', normal: [0, 0, -1], uAxis: [-1, 0, 0], vAxis: [0, 1, 0]},
		]);
	});

	it('generates exact face centers and duplicate physical seam nodes', /** Called by Jasmine to exercise the named behavior. */ () => {
		const expectedCenters = [
			[1, 0, 0],
			[-1, 0, 0],
			[0, 1, 0],
			[0, -1, 0],
			[0, 0, 1],
			[0, 0, -1],
		];

		for (let faceIndex = 0; faceIndex < 6; faceIndex += 1) {
			const index = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.flattenNodeIndex(faceIndex, 13, 13);
			expect(CUBED_SPHERE_W27_UNIT_VECTORS[index]).toEqual(expectedCenters[faceIndex]);
		}

		for (const faceVIndex of [0, 7, 13, 21, 26]) {
			const positiveXEdge = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.flattenNodeIndex(0, 26, faceVIndex);
			const positiveYEdge = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.flattenNodeIndex(2, 0, faceVIndex);
			expect(CUBED_SPHERE_W27_UNIT_VECTORS[positiveXEdge]).toEqual(CUBED_SPHERE_W27_UNIT_VECTORS[positiveYEdge]);
		}

		const unique = new Set(
			CUBED_SPHERE_W27_UNIT_VECTORS.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param vector - The vector value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (vector) => JSON.stringify(vector),
			),
		);
		expect(unique.size).toBe(4058);
	});

	it('round trips every declared flattened-address boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		for (const address of [
			[0, 0, 0],
			[0, 26, 26],
			[3, 12, 19],
			[5, 26, 26],
		]) {
			const index = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.flattenNodeIndex(...address);
			const decoded = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unflattenNodeIndex(index);
			expect([decoded.faceIndex, decoded.uIndex, decoded.vIndex]).toEqual(address);
		}
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.flattenNodeIndex(6, 0, 0),
		).toThrowError(/faceIndex/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unflattenNodeIndex(4374),
		).toThrowError(/index/u);
	});

	it('uses the retained dominant-face bilinear construction stencil', /** Called by Jasmine to exercise the named behavior. */ () => {
		const exactCenter = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil([1, 0, 0]);
		expect(exactCenter).toEqual({
			indices: [CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.flattenNodeIndex(0, 13, 13)],
			weights: [1],
		});

		const midpointLength = Math.hypot(1, 1 / 26);
		const midpoint = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil([
			1 / midpointLength,
			1 / 26 / midpointLength,
			0,
		]);
		expect(midpoint.indices).toEqual([
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.flattenNodeIndex(0, 13, 13),
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.flattenNodeIndex(0, 14, 13),
		]);
		expect(midpoint.weights[0]).toBeCloseTo(0.5, 14);
		expect(midpoint.weights[1]).toBeCloseTo(0.5, 14);

		const seamLength = Math.sqrt(2);
		const faceTie = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil([1 / seamLength, 1 / seamLength, 0]);
		expect(faceTie).toEqual({
			indices: [CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.flattenNodeIndex(0, 26, 13)],
			weights: [1],
		});
	});

	it('pins direct reconstruction identity separately from Fibonacci', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.id).toBe('algorithm32-cubed-sphere-w27-outgoing-v1');
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.id).not.toBe(FIBONACCI_34_DIRECTION_DOMAIN_OWNER.id);
		const repeated = new CubedSphereDirectionDomain({
			id: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.id,
			faceWidth: 27,
		});
		expect(repeated).not.toBe(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER);
		expect(repeated.id).toBe(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.id);
		expect(repeated.unitVectors).toEqual(CUBED_SPHERE_W27_UNIT_VECTORS);
	});
});
