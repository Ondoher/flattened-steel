import {
	CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
} from '../consts.js';
import CubedSphereDirectionDomain from '../CubedSphereDirectionDomain.js';

describe('cubed-sphere direction domains', /** Called by Jasmine to register the named test suite. */ () => {
	it('generates W3, W9, and W27 with their exact stored extents', /** Called by Jasmine to exercise the named behavior. */ () => {
		expectDomainExtents(CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER, 3, 54, 26);
		expectDomainExtents(CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER, 9, 486, 386);
		expectDomainExtents(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER, 27, 4374, 4058);
	});

	it('publishes the exact positive-axis face centers for every width', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.positiveFaceCenterIndices).toEqual({
			positiveX: 4,
			positiveY: 22,
			positiveZ: 40,
		});
		expect(CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER.positiveFaceCenterIndices).toEqual({
			positiveX: 40,
			positiveY: 202,
			positiveZ: 364,
		});
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.positiveFaceCenterIndices).toEqual({
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

	it('retains duplicate physical seam nodes for every width', /** Called by Jasmine to exercise the named behavior. */ () => {
		for (const owner of [
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
			CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		]) {
			const last = owner.faceWidth - 1;
			const middle = last / 2;
			const positiveXEdge = owner.flattenNodeIndex(0, last, middle);
			const positiveYEdge = owner.flattenNodeIndex(2, 0, middle);

			expect(owner.unitVectors[positiveXEdge]).toEqual(owner.unitVectors[positiveYEdge]);
		}
	});

	it('resolves exact, midpoint, and face-tie stencils at W9', /** Called by Jasmine to exercise the named behavior. */ () => {
		const owner = CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER;

		expect(owner.resolveStencil([1, 0, 0])).toEqual({
			indices: [owner.flattenNodeIndex(0, 4, 4)],
			weights: [1],
		});

		const midpointLength = Math.hypot(1, 1 / 8);
		const midpoint = owner.resolveStencil([1 / midpointLength, 1 / 8 / midpointLength, 0]);
		expect(midpoint.indices).toEqual([owner.flattenNodeIndex(0, 4, 4), owner.flattenNodeIndex(0, 5, 4)]);
		expect(midpoint.weights[0]).toBeCloseTo(0.5, 14);
		expect(midpoint.weights[1]).toBeCloseTo(0.5, 14);

		const seamLength = Math.sqrt(2);
		expect(owner.resolveStencil([1 / seamLength, 1 / seamLength, 0])).toEqual({
			indices: [owner.flattenNodeIndex(0, 8, 4)],
			weights: [1],
		});
	});

	it('requires unit-length directions for numerical reconstruction', /** Called by Jasmine to exercise the named behavior. */ () => {
		const owner = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER;

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => owner.resolveStencil([2, 0, 0]),
		).toThrowError(/unit vector/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => owner.resolveStencil([Number.NaN, 0, 1]),
		).toThrowError(/unit vector/u);
	});

	it('retains direct owner identities for every selected width', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.id).toBe('algorithm32-cubed-sphere-w3-outgoing-v1');
		expect(CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER.id).toBe('algorithm32-cubed-sphere-w9-outgoing-v1');
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.id).toBe('algorithm32-cubed-sphere-w27-outgoing-v1');
		const repeated = new CubedSphereDirectionDomain({
			id: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.id,
			faceWidth: 27,
		});
		expect(repeated.id).toBe(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.id);
	});
});

/**
 * Called by this module to expect domain extents.
 * @param owner - The owner value accepted by the operation.
 * @param faceWidth - The face width value accepted by the operation.
 * @param directionCount - The direction count value accepted by the operation.
 * @param uniqueCount - The unique count value accepted by the operation.
 */
function expectDomainExtents(owner, faceWidth, directionCount, uniqueCount) {
	expect(owner.faceWidth).toBe(faceWidth);
	expect(owner.cellWidth).toBe(faceWidth - 1);
	expect(owner.faceNodeCount).toBe(faceWidth * faceWidth);
	expect(owner.directionCount).toBe(directionCount);
	expect(owner.unitVectors).toHaveSize(directionCount);
	expect(
		new Set(
			owner.unitVectors.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param vector - The vector value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (vector) => JSON.stringify(vector),
			),
		).size,
	).toBe(uniqueCount);
}
