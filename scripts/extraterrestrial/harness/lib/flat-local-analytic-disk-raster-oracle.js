/** Return the dot product of two three-component vectors. */
function dot3(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

/** Return the cross product of two three-component vectors. */
function cross3(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

/** Return one component-wise vector sum. */
function add3(left, right) {
	return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

/** Return one component-wise vector difference. */
function subtract3(left, right) {
	return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

/** Return one scalar multiple of a vector. */
function scale3(value, scalar) {
	return [value[0] * scalar, value[1] * scalar, value[2] * scalar];
}

/** Return one finite normalized three-component vector. */
function normalize3(value, label) {
	const length = Math.hypot(...value);
	if (!(length > 0) || !Number.isFinite(length)) throw new RangeError(`${label} must be finite and nonzero.`);
	return value.map((component) => component / length);
}

/** Multiply one column-major four-by-four matrix by one four-vector. */
function multiplyMatrix4Vector4(elements, value) {
	return [
		elements[0] * value[0] + elements[4] * value[1] + elements[8] * value[2] + elements[12] * value[3],
		elements[1] * value[0] + elements[5] * value[1] + elements[9] * value[2] + elements[13] * value[3],
		elements[2] * value[0] + elements[6] * value[1] + elements[10] * value[2] + elements[14] * value[3],
		elements[3] * value[0] + elements[7] * value[1] + elements[11] * value[2] + elements[15] * value[3],
	];
}

/** Validate one column-major matrix inventory. */
function validateMatrix(elements, label) {
	if (!Array.isArray(elements) || elements.length !== 16 || !elements.every(Number.isFinite)) {
		throw new TypeError(`${label} must contain sixteen finite column-major values.`);
	}
}

/** Validate one finite three-vector. */
function validateVector(value, label) {
	if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
		throw new TypeError(`${label} must contain three finite values.`);
	}
}

/**
 * Create an independent binary64 direct ray/sphere subdivision authority.
 *
 * This authority shares the renderer matrices and geometry frame, but it does
 * not complete a conic or use the candidate's circle/quad overlap. Every
 * subdivision point is classified by a direct forward ray/sphere test.
 *
 * @param {object} request - Matrix, frame, source, and viewport facts.
 * @returns {object} - Bounded float64 ray/sphere oracle context.
 */
export function createFloat64RaySphereOracle(request) {
	validateMatrix(request.inverseProjectionMatrixElements, 'inverseProjectionMatrixElements');
	validateMatrix(request.inverseViewMatrixElements, 'inverseViewMatrixElements');
	validateVector(request.frame.right, 'frame.right');
	validateVector(request.frame.up, 'frame.up');
	validateVector(request.frame.forward, 'frame.forward');
	validateVector(request.rayOriginMeters, 'rayOriginMeters');
	validateVector(request.sourceCenterMeters, 'sourceCenterMeters');
	const width = Number(request.viewport?.width);
	const height = Number(request.viewport?.height);
	const radiusMeters = Number(request.sourceRadiusMeters);
	if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
		throw new RangeError('Oracle viewport dimensions must be positive integers.');
	}
	if (!(radiusMeters > 0) || !Number.isFinite(radiusMeters)) {
		throw new RangeError('Oracle source radius must be positive and finite.');
	}
	const unnormalizedRay = (textureX, textureY) => {
		const clip = [textureX * 2 - 1, textureY * 2 - 1, 1, 1];
		const view = multiplyMatrix4Vector4(request.inverseProjectionMatrixElements, clip);
		const scene = multiplyMatrix4Vector4(request.inverseViewMatrixElements, [view[0], view[1], view[2], 0]);
		return add3(
			add3(scale3(request.frame.right, scene[0]), scale3(request.frame.up, scene[1])),
			scale3(request.frame.forward, scene[2]),
		);
	};
	const rayUvOrigin = unnormalizedRay(0, 0);
	const rayUvX = subtract3(unnormalizedRay(1, 0), rayUvOrigin);
	const rayUvY = subtract3(unnormalizedRay(0, 1), rayUvOrigin);
	const sourceOffset = subtract3(request.sourceCenterMeters, request.rayOriginMeters);
	const sourceDistanceSquared = dot3(sourceOffset, sourceOffset);
	if (!(sourceDistanceSquared > radiusMeters * radiusMeters)) {
		throw new RangeError('Oracle source must be outside the ray origin.');
	}
	const sourceAxis = normalize3(sourceOffset, 'source axis');
	const tangentReference = Math.abs(sourceAxis[2]) < 0.875 ? [0, 0, 1] : [0, 1, 0];
	const tangentX = normalize3(cross3(tangentReference, sourceAxis), 'source tangent x');
	const tangentY = cross3(sourceAxis, tangentX);
	const coneTangentSquared = (radiusMeters * radiusMeters) / (sourceDistanceSquared - radiusMeters * radiusMeters);
	return {
		width,
		height,
		rayOriginMeters: [...request.rayOriginMeters],
		sourceCenterMeters: [...request.sourceCenterMeters],
		sourceRadiusMeters: radiusMeters,
		sourceOffset,
		radiusSquared: radiusMeters * radiusMeters,
		sphereQuadraticConstant: sourceDistanceSquared - radiusMeters * radiusMeters,
		sourceDistanceMeters: Math.sqrt(sourceDistanceSquared),
		sourceAxis,
		tangentX,
		tangentY,
		coneTangentSquared,
		rayUvOrigin,
		rayUvX,
		rayUvY,
	};
}

/** Return one affine unnormalized model ray from an oracle context. */
function oracleRay(context, textureX, textureY) {
	return add3(add3(context.rayUvOrigin, scale3(context.rayUvX, textureX)), scale3(context.rayUvY, textureY));
}

/** Classify one unnormalized ray through the exact forward sphere cone. */
function rayIntersectsSphere(context, ray) {
	const quadraticA = dot3(ray, ray);
	const quadraticB = -2 * dot3(ray, context.sourceOffset);
	const discriminant = quadraticB * quadraticB - 4 * quadraticA * context.sphereQuadraticConstant;
	if (!(quadraticA > 0) || discriminant < 0) return false;
	return (-quadraticB - Math.sqrt(discriminant)) / (2 * quadraticA) > 0;
}

/** Return one vector's coordinates in the stable source-axis tangent frame. */
function sourceFrameComponents(value, sourceAxis, tangentX, tangentY) {
	return [dot3(value, sourceAxis), dot3(value, tangentX), dot3(value, tangentY)];
}

/**
 * Resolve the binary64 stable screen-conic coefficients for one pixel.
 *
 * This diagnostic authority reconstructs the same mathematical conic from
 * the renderer matrices, but coverage remains independently authoritative
 * through direct forward ray/sphere subdivision.
 *
 * @param {object} context - Float64 oracle context.
 * @param {{x:number,y:number}} pixel - Bottom-left-origin integer pixel.
 * @returns {object} - Coefficients, forward-axis bounds, ellipse map, and conditioning.
 */
export function resolveFloat64ConicDiagnostics(context, pixel) {
	if (!Number.isInteger(pixel?.x) || !Number.isInteger(pixel?.y)) {
		throw new TypeError('Conic diagnostic pixel must contain integer x and y coordinates.');
	}
	const tangentX = context.tangentX;
	const tangentY = context.tangentY;
	const rayBase = oracleRay(context, (pixel.x + 0.5) / context.width, (pixel.y + 0.5) / context.height);
	const rayPixelX = scale3(context.rayUvX, 1 / context.width);
	const rayPixelY = scale3(context.rayUvY, 1 / context.height);
	const base = sourceFrameComponents(rayBase, context.sourceAxis, tangentX, tangentY);
	const pixelX = sourceFrameComponents(rayPixelX, context.sourceAxis, tangentX, tangentY);
	const pixelY = sourceFrameComponents(rayPixelY, context.sourceAxis, tangentX, tangentY);
	const tangentSquared = context.coneTangentSquared;
	const constantTerm = tangentSquared * base[0] * base[0] - base[1] * base[1] - base[2] * base[2];
	const linearTerm = [
		tangentSquared * base[0] * pixelX[0] - base[1] * pixelX[1] - base[2] * pixelX[2],
		tangentSquared * base[0] * pixelY[0] - base[1] * pixelY[1] - base[2] * pixelY[2],
	];
	const hessianXX = tangentSquared * pixelX[0] * pixelX[0] - pixelX[1] * pixelX[1] - pixelX[2] * pixelX[2];
	const hessianXY = tangentSquared * pixelX[0] * pixelY[0] - pixelX[1] * pixelY[1] - pixelX[2] * pixelY[2];
	const hessianYY = tangentSquared * pixelY[0] * pixelY[0] - pixelY[1] * pixelY[1] - pixelY[2] * pixelY[2];
	const hessianDeterminant = hessianXX * hessianYY - hessianXY * hessianXY;
	const axisVariationOnPixel = 0.5 * (Math.abs(pixelX[0]) + Math.abs(pixelY[0]));
	const axisMinimumOnPixel = base[0] - axisVariationOnPixel;
	const axisMaximumOnPixel = base[0] + axisVariationOnPixel;
	const trace = -(hessianXX + hessianYY);
	const discriminant = Math.sqrt(Math.max((hessianXX - hessianYY) ** 2 + 4 * hessianXY ** 2, 0));
	const minimumEigenvalue = 0.5 * (trace - discriminant);
	const maximumEigenvalue = 0.5 * (trace + discriminant);
	let ellipse = null;
	if (hessianXX < 0 && hessianYY < 0 && hessianDeterminant > 0) {
		const inverseTimesLinear = [
			(hessianYY * linearTerm[0] - hessianXY * linearTerm[1]) / hessianDeterminant,
			(-hessianXY * linearTerm[0] + hessianXX * linearTerm[1]) / hessianDeterminant,
		];
		const centerPixels = inverseTimesLinear.map((value) => -value);
		const centerSupport =
			constantTerm - dot3([linearTerm[0], linearTerm[1], 0], [inverseTimesLinear[0], inverseTimesLinear[1], 0]);
		if (centerSupport > 0) {
			const ellipseXX = -hessianXX / centerSupport;
			const ellipseXY = -hessianXY / centerSupport;
			const ellipseYY = -hessianYY / centerSupport;
			const cholesky00 = Math.sqrt(ellipseXX);
			const cholesky01 = ellipseXY / cholesky00;
			const cholesky11 = Math.sqrt(ellipseYY - cholesky01 * cholesky01);
			ellipse = {
				centerPixels,
				centerSupport,
				axisAtEllipseCenter: base[0] + pixelX[0] * centerPixels[0] + pixelY[0] * centerPixels[1],
				cholesky: [cholesky00, cholesky01, cholesky11],
				mapDeterminant: cholesky00 * cholesky11,
			};
		}
	}
	return {
		constantTerm,
		linearTerm,
		hessian: [hessianXX, hessianXY, hessianYY],
		hessianDeterminant,
		axis: {
			base: base[0],
			pixelX: pixelX[0],
			pixelY: pixelY[0],
			minimumOnPixel: axisMinimumOnPixel,
			maximumOnPixel: axisMaximumOnPixel,
		},
		conditionNumber: minimumEigenvalue > 0 ? maximumEigenvalue / minimumEigenvalue : Number.POSITIVE_INFINITY,
		minimumEigenvalue,
		maximumEigenvalue,
		coneTangentSquared: tangentSquared,
		ellipse,
	};
}

/**
 * Subdivide one pixel into a fixed float64 grid and classify every center ray.
 *
 * @param {object} context - Float64 oracle context.
 * @param {{x:number,y:number}} pixel - Bottom-left-origin integer pixel.
 * @param {number} axisCount - Fixed subdivisions per pixel axis.
 * @returns {object} - Coverage and bounded work accounting.
 */
export function resolveSubdivisionCoverage(context, pixel, axisCount) {
	if (!Number.isInteger(pixel?.x) || !Number.isInteger(pixel?.y)) {
		throw new TypeError('Oracle pixel must contain integer x and y coordinates.');
	}
	if (!Number.isInteger(axisCount) || axisCount < 2 || axisCount > 2048) {
		throw new RangeError('Oracle subdivision axis count must be in [2, 2048].');
	}
	const inverseSampleCount = 1 / axisCount;
	const textureStepX = inverseSampleCount / context.width;
	const textureStepY = inverseSampleCount / context.height;
	const firstTextureX = (pixel.x + 0.5 * inverseSampleCount) / context.width;
	const firstTextureY = (pixel.y + 0.5 * inverseSampleCount) / context.height;
	const rowStartRay = oracleRay(context, firstTextureX, firstTextureY);
	const rayStepX = scale3(context.rayUvX, textureStepX);
	const rayStepY = scale3(context.rayUvY, textureStepY);
	let hitCount = 0;
	let rowRayX = rowStartRay[0];
	let rowRayY = rowStartRay[1];
	let rowRayZ = rowStartRay[2];
	const sourceOffset = context.sourceOffset;
	const quadraticC = context.sphereQuadraticConstant;
	for (let rowIndex = 0; rowIndex < axisCount; rowIndex += 1) {
		let rayX = rowRayX;
		let rayY = rowRayY;
		let rayZ = rowRayZ;
		for (let columnIndex = 0; columnIndex < axisCount; columnIndex += 1) {
			const quadraticA = rayX * rayX + rayY * rayY + rayZ * rayZ;
			const quadraticB = -2 * (rayX * sourceOffset[0] + rayY * sourceOffset[1] + rayZ * sourceOffset[2]);
			const discriminant = quadraticB * quadraticB - 4 * quadraticA * quadraticC;
			if (quadraticA > 0 && discriminant >= 0 && (-quadraticB - Math.sqrt(discriminant)) / (2 * quadraticA) > 0) {
				hitCount += 1;
			}
			rayX += rayStepX[0];
			rayY += rayStepX[1];
			rayZ += rayStepX[2];
		}
		rowRayX += rayStepY[0];
		rowRayY += rayStepY[1];
		rowRayZ += rayStepY[2];
	}
	const sampleCount = axisCount * axisCount;
	return {
		coverage: hitCount / sampleCount,
		hitCount,
		sampleCount,
		axisCount,
		classification: 'independent-float64-forward-ray-sphere-fixed-subdivision',
	};
}

/** Return the normalized binary64 affine ray through one pixel center. */
export function resolveOraclePixelCenterDirection(context, pixel) {
	if (!Number.isInteger(pixel?.x) || !Number.isInteger(pixel?.y)) {
		throw new TypeError('Oracle direction pixel must contain integer x and y coordinates.');
	}
	return normalize3(
		oracleRay(context, (pixel.x + 0.5) / context.width, (pixel.y + 0.5) / context.height),
		'oracle pixel-center ray',
	);
}

/** Return the exact solid angle of one unit-vector spherical triangle. */
function sphericalTriangleSolidAngle(first, second, third) {
	const numerator = Math.abs(dot3(first, cross3(second, third)));
	const denominator = 1 + dot3(first, second) + dot3(second, third) + dot3(third, first);
	return 2 * Math.atan2(numerator, denominator);
}

/**
 * Resolve one perspective pixel's spherical solid angle from its four corner rays.
 *
 * @param {object} context - Float64 oracle context.
 * @param {{x:number,y:number}} pixel - Bottom-left-origin integer pixel.
 * @returns {number} - Pixel solid angle in steradians.
 */
export function resolvePixelSolidAngle(context, pixel) {
	const left = pixel.x / context.width;
	const right = (pixel.x + 1) / context.width;
	const bottom = pixel.y / context.height;
	const top = (pixel.y + 1) / context.height;
	const bottomLeft = normalize3(oracleRay(context, left, bottom), 'bottom-left pixel ray');
	const bottomRight = normalize3(oracleRay(context, right, bottom), 'bottom-right pixel ray');
	const topRight = normalize3(oracleRay(context, right, top), 'top-right pixel ray');
	const topLeft = normalize3(oracleRay(context, left, top), 'top-left pixel ray');
	return (
		sphericalTriangleSolidAngle(bottomLeft, bottomRight, topRight) +
		sphericalTriangleSolidAngle(bottomLeft, topRight, topLeft)
	);
}

/** Return one concise immutable matrix/oracle identity packet. */
export function describeFloat64RaySphereOracle(context) {
	return {
		algorithm: 'independent-float64-forward-ray-sphere-fixed-subdivision-v1',
		viewport: {width: context.width, height: context.height},
		rayOriginMeters: context.rayOriginMeters,
		sourceCenterMeters: context.sourceCenterMeters,
		sourceRadiusMeters: context.sourceRadiusMeters,
		sourceDistanceMeters: context.sourceDistanceMeters,
		coneTangentSquared: context.coneTangentSquared,
		affineUnnormalizedRay: {
			origin: context.rayUvOrigin,
			textureX: context.rayUvX,
			textureY: context.rayUvY,
		},
	};
}
