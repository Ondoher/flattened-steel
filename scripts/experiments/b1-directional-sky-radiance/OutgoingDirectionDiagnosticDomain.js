/** Sparse outgoing-direction domain used to measure cubed-sphere interpolation without constructing unused nodes. */
export class OutgoingDirectionDiagnosticDomain {
	/** Domain identifier. @readonly @type {string} */
	id;
	/** Sparse source-local outgoing directions. @readonly @type {readonly UnitVector3[]} */
	unitVectors;
	/** Number of sparse outgoing directions. @readonly @type {number} */
	directionCount;
	/** Sparse indices of the positive source-local axes. @readonly @type {CubedSpherePositiveFaceCenterIndices} */
	positiveFaceCenterIndices;
	/** Query reconstruction stencils in query order. @readonly @type {readonly ScatteringCacheDirectionStencil[]} */
	queryStencils;
	/** Query stencils keyed by exact requested direction. @type {Map<string, ScatteringCacheDirectionStencil>} */
	_queryStencilsByKey;
	/** Optional cubed-sphere face width. @type {number | undefined} */
	_faceWidth;
	/** Mutable sparse direction storage retained for equivalent query reconstruction. @type {UnitVector3[]} */
	_directions;
	/** Sparse indices by direction identity. @type {Map<string, number>} */
	_indicesByKey;

	/**
	 * Creates either exact query directions or the sparse cubed-sphere nodes needed to reconstruct them.
	 *
	 * @param {{id: string, queryDirections: readonly UnitVector3[], faceWidth?: number}} definition - Diagnostic domain definition.
	 */
	constructor(definition) {
		if (
			definition.faceWidth !== undefined &&
			(!Number.isSafeInteger(definition.faceWidth) || definition.faceWidth < 3 || definition.faceWidth % 2 === 0)
		) {
			throw new RangeError('Diagnostic cubed-sphere face width must be an odd integer of at least three.');
		}
		this.id = definition.id;
		this.positiveFaceCenterIndices = {positiveX: 0, positiveY: 2, positiveZ: 4};
		const directions = [
			[1, 0, 0],
			[-1, 0, 0],
			[0, 1, 0],
			[0, -1, 0],
			[0, 0, 1],
			[0, 0, -1],
		];
		const indicesByKey = new Map(directions.map((direction, index) => [this._vectorKey(direction), index]));
		this._faceWidth = definition.faceWidth;
		this._directions = directions;
		this._indicesByKey = indicesByKey;
		this.queryStencils = definition.queryDirections.map((direction) =>
			definition.faceWidth === undefined
				? this._exactStencil(direction, directions, indicesByKey)
				: this._gridStencil(direction, definition.faceWidth, directions, indicesByKey),
		);
		this._queryStencilsByKey = new Map(
			definition.queryDirections.map((direction, index) => [this._vectorKey(direction), this.queryStencils[index]]),
		);
		this.unitVectors = directions;
		this.directionCount = directions.length;
	}

	/**
	 * Called by construction to create a stable normalized-vector identity.
	 *
	 * @param {readonly number[]} direction - Direction components.
	 * @returns {string} - Component identity.
	 */
	_vectorKey(direction) {
		return direction.map((component) => (Object.is(component, -0) ? 0 : component).toPrecision(17)).join('/');
	}

	/**
	 * Called by construction to append one direction only when it is not already stored.
	 *
	 * @param {UnitVector3} direction - Source-local unit direction.
	 * @param {UnitVector3[]} directions - Mutable sparse directions.
	 * @param {Map<string, number>} indicesByKey - Sparse indices by direction identity.
	 * @returns {number} - Sparse direction index.
	 */
	_addDirection(direction, directions, indicesByKey) {
		const key = this._vectorKey(direction);
		const existing = indicesByKey.get(key);
		if (existing !== undefined) return existing;
		const index = directions.length;
		directions.push(direction);
		indicesByKey.set(key, index);
		return index;
	}

	/**
	 * Called by exact-domain construction to retain one requested direction.
	 *
	 * @param {UnitVector3} direction - Requested source-local direction.
	 * @param {UnitVector3[]} directions - Mutable sparse directions.
	 * @param {Map<string, number>} indicesByKey - Sparse indices by direction identity.
	 * @returns {ScatteringCacheDirectionStencil} - Exact one-tap stencil.
	 */
	_exactStencil(direction, directions, indicesByKey) {
		return {indices: [this._addDirection(direction, directions, indicesByKey)], weights: [1]};
	}

	/**
	 * Called by grid construction to select the retained dominant cubed-sphere face.
	 *
	 * @param {UnitVector3} direction - Source-local direction.
	 * @returns {{normal: UnitVector3, uAxis: UnitVector3, vAxis: UnitVector3}} - Selected face axes.
	 */
	_selectFace(direction) {
		const faces = [
			{normal: [1, 0, 0], uAxis: [0, 1, 0], vAxis: [0, 0, 1]},
			{normal: [-1, 0, 0], uAxis: [0, -1, 0], vAxis: [0, 0, 1]},
			{normal: [0, 1, 0], uAxis: [-1, 0, 0], vAxis: [0, 0, 1]},
			{normal: [0, -1, 0], uAxis: [1, 0, 0], vAxis: [0, 0, 1]},
			{normal: [0, 0, 1], uAxis: [1, 0, 0], vAxis: [0, 1, 0]},
			{normal: [0, 0, -1], uAxis: [-1, 0, 0], vAxis: [0, 1, 0]},
		];
		let selected = faces[0];
		let selectedProjection = this._dot(direction, selected.normal);
		for (let index = 1; index < faces.length; index += 1) {
			const projection = this._dot(direction, faces[index].normal);
			if (projection > selectedProjection) {
				selected = faces[index];
				selectedProjection = projection;
			}
		}
		return selected;
	}

	/**
	 * Called by grid construction to compute a three-component dot product.
	 *
	 * @param {readonly number[]} left - Left vector.
	 * @param {readonly number[]} right - Right vector.
	 * @returns {number} - Dot product.
	 */
	_dot(left, right) {
		return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
	}

	/**
	 * Called by grid construction to create one normalized cubed-sphere node.
	 *
	 * @param {{normal: UnitVector3, uAxis: UnitVector3, vAxis: UnitVector3}} face - Selected face axes.
	 * @param {number} uIndex - Face-local horizontal node index.
	 * @param {number} vIndex - Face-local vertical node index.
	 * @param {number} faceWidth - Nodes along one face edge.
	 * @returns {UnitVector3} - Normalized source-local direction.
	 */
	_gridDirection(face, uIndex, vIndex, faceWidth) {
		const cellWidth = faceWidth - 1;
		const uCoordinate = (2 * uIndex - cellWidth) / cellWidth;
		const vCoordinate = (2 * vIndex - cellWidth) / cellWidth;
		const point = [0, 1, 2].map(
			(component) =>
				face.normal[component] + face.uAxis[component] * uCoordinate + face.vAxis[component] * vCoordinate,
		);
		const length = Math.hypot(point[0], point[1], point[2]);
		return [point[0] / length, point[1] / length, point[2] / length];
	}

	/**
	 * Called by construction to resolve the sparse bilinear grid nodes for one query.
	 *
	 * @param {UnitVector3} direction - Requested source-local direction.
	 * @param {number} faceWidth - Nodes along one face edge.
	 * @param {UnitVector3[]} directions - Mutable sparse directions.
	 * @param {Map<string, number>} indicesByKey - Sparse indices by direction identity.
	 * @returns {ScatteringCacheDirectionStencil} - Sparse bilinear stencil.
	 */
	_gridStencil(direction, faceWidth, directions, indicesByKey) {
		const face = this._selectFace(direction);
		const denominator = this._dot(direction, face.normal);
		const cellWidth = faceWidth - 1;
		const uGrid = ((Math.max(-1, Math.min(1, this._dot(direction, face.uAxis) / denominator)) + 1) * cellWidth) / 2;
		const vGrid = ((Math.max(-1, Math.min(1, this._dot(direction, face.vAxis) / denominator)) + 1) * cellWidth) / 2;
		const nearestU = Math.floor(uGrid + 0.5);
		const nearestV = Math.floor(vGrid + 0.5);
		const uIsExact = Math.abs(uGrid - nearestU) <= 1e-10;
		const vIsExact = Math.abs(vGrid - nearestV) <= 1e-10;
		const lowerU = uIsExact ? nearestU : Math.floor(uGrid);
		const lowerV = vIsExact ? nearestV : Math.floor(vGrid);
		const upperU = uIsExact ? lowerU : Math.min(lowerU + 1, cellWidth);
		const upperV = vIsExact ? lowerV : Math.min(lowerV + 1, cellWidth);
		const uFraction = uIsExact ? 0 : uGrid - lowerU;
		const vFraction = vIsExact ? 0 : vGrid - lowerV;
		const nodes = [
			{u: lowerU, v: lowerV, weight: (1 - uFraction) * (1 - vFraction)},
			{u: upperU, v: lowerV, weight: uFraction * (1 - vFraction)},
			{u: lowerU, v: upperV, weight: (1 - uFraction) * vFraction},
			{u: upperU, v: upperV, weight: uFraction * vFraction},
		].filter((node) => node.weight > 0);
		return {
			indices: nodes.map((node) =>
				this._addDirection(this._gridDirection(face, node.u, node.v, faceWidth), directions, indicesByKey),
			),
			weights: nodes.map((node) => node.weight),
		};
	}

	/**
	 * Call this method to resolve one precomputed query stencil by query index.
	 *
	 * @param {number} queryIndex - Zero-based query index.
	 * @returns {ScatteringCacheDirectionStencil} - Sparse query stencil.
	 */
	queryStencil(queryIndex) {
		return this.queryStencils[queryIndex];
	}

	/**
	 * Call this method to satisfy the construction selection's outgoing-domain capability.
	 *
	 * @param {UnitVector3} _direction - Unused arbitrary direction.
	 * @returns {ScatteringCacheDirectionStencil} - First retained direction.
	 */
	resolveStencil(direction) {
		const declared = this._queryStencilsByKey.get(this._vectorKey(direction));
		if (declared) return declared;
		if (this._faceWidth === undefined) {
			throw new RangeError('Diagnostic outgoing domain received an undeclared exact query direction.');
		}
		const previousCount = this._directions.length;
		const reconstructed = this._gridStencil(
			direction,
			this._faceWidth,
			this._directions,
			this._indicesByKey,
		);
		if (this._directions.length !== previousCount) {
			throw new RangeError('Diagnostic outgoing domain query requires a node absent from its constructed GPU field.');
		}
		return reconstructed;
	}
}
