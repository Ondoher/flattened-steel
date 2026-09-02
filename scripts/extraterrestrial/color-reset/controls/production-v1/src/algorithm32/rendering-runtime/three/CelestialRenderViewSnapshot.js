import {PixelMath} from '../../math/PixelMath.js';
import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';

const VIEW_SCHEMA = 'stellar-screen-palette-view-v1';

/** Renderer-neutral perspective camera and viewport snapshot derivation. */
export class CelestialRenderViewSnapshot {
	/** Derive an exact identity from projection-affecting view facts. */
	static createIdentity(view) {
		CelestialRenderViewSnapshot._validateView(view);
		return CanonicalValueHash.sha256Value({
			schema: VIEW_SCHEMA,
			projection: view.projection,
			modelViewProjectionMatrix: [...view.modelViewProjectionMatrix],
			inverseProjectionMatrix: [...view.inverseProjectionMatrix],
			viewportSize: {...view.viewportSize},
		});
	}

	/** Capture one exact runtime camera snapshot. */
	static capture(camera, viewportSize) {
		if (camera?.isPerspectiveCamera !== true) {
			throw new TypeError('Stellar generation requires a Three perspective camera.');
		}
		camera.updateMatrixWorld?.();
		const projection = [...camera.projectionMatrix.elements];
		const viewMatrix = [...camera.matrixWorldInverse.elements];
		const inverseProjection = camera.projectionMatrixInverse?.elements
			? [...camera.projectionMatrixInverse.elements]
			: CelestialRenderViewSnapshot._invertMatrix4(projection);
		const facts = {
			projection: /** @type {const} */ ('perspective'),
			modelViewProjectionMatrix: CelestialRenderViewSnapshot._multiplyMatrix4(projection, viewMatrix),
			inverseProjectionMatrix: inverseProjection,
			viewportSize: PixelMath.acceptPixelSize(viewportSize, 'Stellar generation viewport'),
		};

		return {...facts, identity: CelestialRenderViewSnapshot.createIdentity(facts)};
	}

	/** Multiply two column-major four-matrices. */
	static _multiplyMatrix4(left, right) {
		const result = new Array(16).fill(0);
		for (let column = 0; column < 4; column += 1) {
			for (let row = 0; row < 4; row += 1) {
				for (let index = 0; index < 4; index += 1) {
					result[column * 4 + row] += left[index * 4 + row] * right[column * 4 + index];
				}
			}
		}
		return result;
	}

	/** Invert one finite column-major four-matrix through pivoted Gauss-Jordan elimination. */
	static _invertMatrix4(matrix) {
		if (matrix.length !== 16 || matrix.some((value) => !Number.isFinite(value))) {
			throw new RangeError('Stellar generation projection matrix must contain 16 finite values.');
		}
		const rows = [0, 1, 2, 3].map((row) => [
			matrix[row],
			matrix[4 + row],
			matrix[8 + row],
			matrix[12 + row],
			row === 0 ? 1 : 0,
			row === 1 ? 1 : 0,
			row === 2 ? 1 : 0,
			row === 3 ? 1 : 0,
		]);
		for (let pivotColumn = 0; pivotColumn < 4; pivotColumn += 1) {
			let pivotRow = pivotColumn;
			for (let row = pivotColumn + 1; row < 4; row += 1) {
				if (Math.abs(rows[row][pivotColumn]) > Math.abs(rows[pivotRow][pivotColumn])) pivotRow = row;
			}
			if (Math.abs(rows[pivotRow][pivotColumn]) <= Number.EPSILON) {
				throw new RangeError('Stellar generation projection matrix must be invertible.');
			}
			[rows[pivotColumn], rows[pivotRow]] = [rows[pivotRow], rows[pivotColumn]];
			const pivot = rows[pivotColumn][pivotColumn];
			rows[pivotColumn] = rows[pivotColumn].map((value) => value / pivot);
			for (let row = 0; row < 4; row += 1) {
				if (row === pivotColumn) continue;
				const scale = rows[row][pivotColumn];
				rows[row] = rows[row].map((value, column) => value - scale * rows[pivotColumn][column]);
			}
		}
		const inverse = new Array(16);
		for (let column = 0; column < 4; column += 1) {
			for (let row = 0; row < 4; row += 1) inverse[column * 4 + row] = rows[row][column + 4];
		}
		return inverse;
	}

	/** Validate complete renderer-neutral view facts. */
	static _validateView(view) {
		const matrices = [view.modelViewProjectionMatrix, view.inverseProjectionMatrix];
		if (
			view.projection !== 'perspective' ||
			matrices.some((matrix) => matrix.length !== 16 || matrix.some((value) => !Number.isFinite(value)))
		) {
			throw new RangeError('Stellar generation requires finite perspective matrices.');
		}
		PixelMath.acceptPixelSize(view.viewportSize, 'Stellar generation viewport');
	}
}
