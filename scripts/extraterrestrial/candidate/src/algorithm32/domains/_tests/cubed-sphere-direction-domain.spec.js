import {
	CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
} from '../consts.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	createCubedSphereW27DirectionDomain,
} from '../CubedSphereW27DirectionDomain.js';

describe('cubed-sphere direction domains', () => {
	it('generates W3, W9, and W27 with their exact stored extents', () => {
		expectDomainExtents(
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
			3,
			54,
			26,
		);
		expectDomainExtents(
			CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
			9,
			486,
			386,
		);
		expectDomainExtents(
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			27,
			4374,
			4058,
		);
	});

	it('publishes the exact positive-axis face centers for every width', () => {
		expect(CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER
			.positiveFaceCenterIndices).toEqual({
			positiveX: 4,
			positiveY: 22,
			positiveZ: 40,
		});
		expect(CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER
			.positiveFaceCenterIndices).toEqual({
			positiveX: 40,
			positiveY: 202,
			positiveZ: 364,
		});
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER
			.positiveFaceCenterIndices).toEqual({
			positiveX: 364,
			positiveY: 1822,
			positiveZ: 3280,
		});

		for (const owner of [
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
			CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		]) {
			const centers = owner.positiveFaceCenterIndices;
			expect(owner.unitVectors[centers.positiveX]).toEqual([1, 0, 0]);
			expect(owner.unitVectors[centers.positiveY]).toEqual([0, 1, 0]);
			expect(owner.unitVectors[centers.positiveZ]).toEqual([0, 0, 1]);
		}
	});

	it('retains duplicate physical seam nodes for every width', () => {
		for (const owner of [
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
			CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		]) {
			const last = owner.faceWidth - 1;
			const middle = last / 2;
			const positiveXEdge = owner.flattenNodeIndex(0, last, middle);
			const positiveYEdge = owner.flattenNodeIndex(2, 0, middle);

			expect(owner.unitVectors[positiveXEdge]).toEqual(
				owner.unitVectors[positiveYEdge],
			);
		}
	});

	it('resolves exact, midpoint, and face-tie stencils at W9', () => {
		const owner = CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER;

		expect(owner.resolveStencil([1, 0, 0])).toEqual({
			indices: [owner.flattenNodeIndex(0, 4, 4)],
			weights: [1],
		});

		const midpointLength = Math.hypot(1, 1 / 8);
		const midpoint = owner.resolveStencil([
			1 / midpointLength,
			(1 / 8) / midpointLength,
			0,
		]);
		expect(midpoint.indices).toEqual([
			owner.flattenNodeIndex(0, 4, 4),
			owner.flattenNodeIndex(0, 5, 4),
		]);
		expect(midpoint.weights[0]).toBeCloseTo(0.5, 14);
		expect(midpoint.weights[1]).toBeCloseTo(0.5, 14);

		const seamLength = Math.sqrt(2);
		expect(owner.resolveStencil([
			1 / seamLength,
			1 / seamLength,
			0,
		])).toEqual({
			indices: [owner.flattenNodeIndex(0, 8, 4)],
			weights: [1],
		});
	});

	it('requires unit-length directions for numerical reconstruction', () => {
		const owner = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER;

		expect(() => owner.resolveStencil([2, 0, 0]))
			.toThrowError(/unit vector/u);
		expect(() => owner.resolveStencil([Number.NaN, 0, 1]))
			.toThrowError(/unit vector/u);
	});

	it('retains the established W27 metadata identity', () => {
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER
			.descriptor.contentHash).toBe(
			'sha256:b27c677bb8527d77fe7a50a2caa7f7a2af16c99ccf37138e1f75e9e4085047a0',
		);
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN.contentHash).toBe(
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.descriptor.contentHash,
		);
		expect(createCubedSphereW27DirectionDomain().contentHash).toBe(
			CUBED_SPHERE_W27_DIRECTION_DOMAIN.contentHash,
		);
	});
});

function expectDomainExtents(owner, faceWidth, directionCount, uniqueCount) {
	expect(owner.faceWidth).toBe(faceWidth);
	expect(owner.directionCount).toBe(directionCount);
	expect(owner.unitVectors).toHaveSize(directionCount);
	expect(owner.descriptor.topology).toEqual(jasmine.objectContaining({
		faceWidth,
		cellWidth: faceWidth - 1,
		faceNodeCount: faceWidth * faceWidth,
		storedDirectionCount: directionCount,
		uniquePhysicalDirectionCount: uniqueCount,
	}));
}
