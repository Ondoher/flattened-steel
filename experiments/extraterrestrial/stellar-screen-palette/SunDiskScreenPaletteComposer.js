const CHANNEL_COUNT = 15;
const SAMPLE_OFFSETS = Object.freeze([
	Object.freeze([-0.25, -0.25]),
	Object.freeze([0.25, -0.25]),
	Object.freeze([-0.25, 0.25]),
	Object.freeze([0.25, 0.25]),
]);
const SAMPLE_WEIGHT = 0.25;
const DISK_BOUNDARY_SEGMENT_COUNT = 512;
const COVERAGE_EPSILON = 1e-12;
const MAXIMUM_UINT16_NONZERO_INDEX = 65535;

function dot(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function cross(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

function normalize(value, label) {
	const length = Math.hypot(...value);
	if (!(length > 1e-15) || !Number.isFinite(length)) {
		throw new RangeError(`${label} must be a finite nondegenerate direction.`);
	}
	return value.map((coordinate) => coordinate / length);
}

function requireNative15(values, label) {
	if ((!Array.isArray(values) && !ArrayBuffer.isView(values)) || values.length !== CHANNEL_COUNT) {
		throw new TypeError(`${label} must contain exactly 15 values.`);
	}
	return Array.from(values, (value, channelIndex) => {
		if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
			throw new RangeError(`${label}[${channelIndex}] must be finite and nonnegative.`);
		}
		return value;
	});
}

function requireCamera(camera) {
	const {width, height} = camera?.viewport ?? {};
	if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
		throw new RangeError('Sun projection requires a positive integer viewport.');
	}
	for (const key of ['forward', 'right', 'up']) normalize(camera[key] ?? [], `Camera ${key}`);
	if (!(camera.tangentHalfVerticalFieldOfView > 0) || !(camera.aspectRatio > 0)) {
		throw new RangeError('Sun projection requires the accepted perspective camera scale.');
	}
	return camera;
}

function projectDirectionToNdc(direction, camera) {
	const depth = dot(direction, camera.forward);
	if (!(depth > 0)) return null;
	return [
		dot(direction, camera.right)
			/ (depth * camera.tangentHalfVerticalFieldOfView * camera.aspectRatio),
		dot(direction, camera.up) / (depth * camera.tangentHalfVerticalFieldOfView),
	];
}

function ndcToPixel([ndcX, ndcY], camera) {
	return [
		(ndcX + 1) * 0.5 * camera.viewport.width,
		(1 - ndcY) * 0.5 * camera.viewport.height,
	];
}

function polygonArea(polygon) {
	let twiceArea = 0;
	for (let index = 0; index < polygon.length; index += 1) {
		const current = polygon[index];
		const next = polygon[(index + 1) % polygon.length];
		twiceArea += current[0] * next[1] - next[0] * current[1];
	}
	return Math.abs(twiceArea) * 0.5;
}

function clipPolygon(polygon, inside, intersection) {
	if (polygon.length === 0) return polygon;
	const output = [];
	let previous = polygon[polygon.length - 1];
	let previousInside = inside(previous);
	for (const current of polygon) {
		const currentInside = inside(current);
		if (currentInside !== previousInside) output.push(intersection(previous, current));
		if (currentInside) output.push(current);
		previous = current;
		previousInside = currentInside;
	}
	return output;
}

function intersectAtX(left, right, x) {
	const scale = (x - left[0]) / (right[0] - left[0]);
	return [x, left[1] + scale * (right[1] - left[1])];
}

function intersectAtY(left, right, y) {
	const scale = (y - left[1]) / (right[1] - left[1]);
	return [left[0] + scale * (right[0] - left[0]), y];
}

function clipDiskPolygonToPixel(polygon, pixelX, pixelY) {
	let clipped = clipPolygon(polygon, ([x]) => x >= pixelX, (left, right) => intersectAtX(left, right, pixelX));
	clipped = clipPolygon(clipped, ([x]) => x <= pixelX + 1, (left, right) => intersectAtX(left, right, pixelX + 1));
	clipped = clipPolygon(clipped, ([, y]) => y >= pixelY, (left, right) => intersectAtY(left, right, pixelY));
	clipped = clipPolygon(clipped, ([, y]) => y <= pixelY + 1, (left, right) => intersectAtY(left, right, pixelY + 1));
	return clipped.length >= 3 ? Math.min(1, polygonArea(clipped)) : 0;
}

function projectedDiskPolygon(directionToSun, angularRadiusRadians, camera) {
	const helper = Math.abs(directionToSun[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
	const tangent0 = normalize(cross(helper, directionToSun), 'Sun tangent');
	const tangent1 = normalize(cross(directionToSun, tangent0), 'Sun bitangent');
	const cosine = Math.cos(angularRadiusRadians);
	const sine = Math.sin(angularRadiusRadians);
	const polygon = [];
	for (let index = 0; index < DISK_BOUNDARY_SEGMENT_COUNT; index += 1) {
		const angle = 2 * Math.PI * index / DISK_BOUNDARY_SEGMENT_COUNT;
		const direction = [0, 1, 2].map((axis) => cosine * directionToSun[axis]
			+ sine * (Math.cos(angle) * tangent0[axis] + Math.sin(angle) * tangent1[axis]));
		const ndc = projectDirectionToNdc(direction, camera);
		if (!ndc) return null;
		polygon.push(ndcToPixel(ndc, camera));
	}
	return polygon;
}

function rayFromPixelSample(pixelX, pixelY, offsetX, offsetY, camera) {
	const ndcX = 2 * (pixelX + 0.5 + offsetX) / camera.viewport.width - 1;
	const ndcY = 1 - 2 * (pixelY + 0.5 + offsetY) / camera.viewport.height;
	return normalize([
		camera.forward[0]
			+ ndcX * camera.tangentHalfVerticalFieldOfView * camera.aspectRatio * camera.right[0]
			+ ndcY * camera.tangentHalfVerticalFieldOfView * camera.up[0],
		camera.forward[1]
			+ ndcX * camera.tangentHalfVerticalFieldOfView * camera.aspectRatio * camera.right[1]
			+ ndcY * camera.tangentHalfVerticalFieldOfView * camera.up[1],
		camera.forward[2]
			+ ndcX * camera.tangentHalfVerticalFieldOfView * camera.aspectRatio * camera.right[2]
			+ ndcY * camera.tangentHalfVerticalFieldOfView * camera.up[2],
	], 'Sun pixel sample ray');
}

function conservativeFootprint(directionToSun, angularRadiusRadians, camera) {
	const helper = Math.abs(directionToSun[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
	const tangent0 = normalize(cross(helper, directionToSun), 'Sun tangent');
	const tangent1 = normalize(cross(directionToSun, tangent0), 'Sun bitangent');
	const projected = [];
	const cosine = Math.cos(angularRadiusRadians);
	const sine = Math.sin(angularRadiusRadians);
	for (let sampleIndex = 0; sampleIndex < 64; sampleIndex += 1) {
		const angle = 2 * Math.PI * sampleIndex / 64;
		const direction = [0, 1, 2].map((axis) => cosine * directionToSun[axis]
			+ sine * (Math.cos(angle) * tangent0[axis] + Math.sin(angle) * tangent1[axis]));
		const ndc = projectDirectionToNdc(direction, camera);
		if (ndc) projected.push(ndc);
	}
	const center = projectDirectionToNdc(directionToSun, camera);
	if (center) projected.push(center);
	if (projected.length === 0) return null;
	const ndcXs = projected.map((value) => value[0]);
	const ndcYs = projected.map((value) => value[1]);
	const margin = 2;
	const minimumX = Math.max(0, Math.floor((Math.min(...ndcXs) + 1) * 0.5 * camera.viewport.width) - margin);
	const maximumX = Math.min(camera.viewport.width - 1, Math.ceil((Math.max(...ndcXs) + 1) * 0.5 * camera.viewport.width) + margin);
	const minimumY = Math.max(0, Math.floor((1 - Math.max(...ndcYs)) * 0.5 * camera.viewport.height) - margin);
	const maximumY = Math.min(camera.viewport.height - 1, Math.ceil((1 - Math.min(...ndcYs)) * 0.5 * camera.viewport.height) + margin);
	if (minimumX > maximumX || minimumY > maximumY) return null;
	return Object.freeze({minimumX, maximumX, minimumY, maximumY});
}

/** Derive uniform production-disk radiance from its irradiance and angular support. */
export function deriveUniformSunDiskRadiance(sourceIrradiance, angularRadiusRadians) {
	const irradiance = requireNative15(sourceIrradiance, 'Sun source irradiance');
	if (!(angularRadiusRadians > 0 && angularRadiusRadians < Math.PI / 2)) {
		throw new RangeError('Sun angular radius must lie inside (0, pi/2).');
	}
	const solidAngleSteradians = 2 * Math.PI * (1 - Math.cos(angularRadiusRadians));
	return Object.freeze({
		values: Object.freeze(irradiance.map((value) => value / solidAngleSteradians)),
		solidAngleSteradians,
	});
}

/** Project the production four-sample uniform disk into transient per-pixel hit counts. */
export function projectUniformSunDiskCoverage({camera, directionToSun, angularRadiusRadians}) {
	const acceptedCamera = requireCamera(camera);
	const sunDirection = normalize(directionToSun, 'Direction to Sun');
	if (!(angularRadiusRadians > 0 && angularRadiusRadians < Math.PI / 2)) {
		throw new RangeError('Sun angular radius must lie inside (0, pi/2).');
	}
	const {width, height} = acceptedCamera.viewport;
	const sampleHits = new Uint8Array(width * height);
	const footprint = conservativeFootprint(sunDirection, angularRadiusRadians, acceptedCamera);
	const classifications = {zero: width * height, quarter: 0, half: 0, threeQuarter: 0, full: 0};
	let evaluatedPixelCount = 0;
	let evaluatedSampleCount = 0;
	let groundRejectedSampleCount = 0;
	if (footprint) {
		const minimumDiskCosine = Math.cos(angularRadiusRadians);
		for (let pixelY = footprint.minimumY; pixelY <= footprint.maximumY; pixelY += 1) {
			for (let pixelX = footprint.minimumX; pixelX <= footprint.maximumX; pixelX += 1) {
				evaluatedPixelCount += 1;
				let hits = 0;
				for (const [offsetX, offsetY] of SAMPLE_OFFSETS) {
					evaluatedSampleCount += 1;
					const ray = rayFromPixelSample(pixelX, pixelY, offsetX, offsetY, acceptedCamera);
					if (ray[2] <= 0) {
						groundRejectedSampleCount += 1;
						continue;
					}
					if (dot(ray, sunDirection) >= minimumDiskCosine) hits += 1;
				}
				if (hits === 0) continue;
				const linearIndex = pixelY * width + pixelX;
				sampleHits[linearIndex] = hits;
				classifications.zero -= 1;
				classifications[['zero', 'quarter', 'half', 'threeQuarter', 'full'][hits]] += 1;
			}
		}
	}
	return Object.freeze({
		policyIdentity: 'production-four-sample-any-positive-owns-v1',
		sampleOffsets: SAMPLE_OFFSETS,
		sampleWeight: SAMPLE_WEIGHT,
		sampleHits,
		footprint,
		classifications: Object.freeze(classifications),
		evaluatedPixelCount,
		evaluatedSampleCount,
		groundRejectedSampleCount,
	});
}

/** Rasterize the projected angular disk by geometric pixel-square overlap. */
export function projectUniformSunDiskPixelOverlap({camera, directionToSun, angularRadiusRadians}) {
	const acceptedCamera = requireCamera(camera);
	const sunDirection = normalize(directionToSun, 'Direction to Sun');
	if (!(angularRadiusRadians > 0 && angularRadiusRadians < Math.PI / 2)) {
		throw new RangeError('Sun angular radius must lie inside (0, pi/2).');
	}
	const {width, height} = acceptedCamera.viewport;
	const coverageFractions = new Float64Array(width * height);
	const polygon = projectedDiskPolygon(sunDirection, angularRadiusRadians, acceptedCamera);
	const classifications = {zero: width * height, partial: 0, full: 0};
	if (!polygon) {
		return Object.freeze({
			policyIdentity: 'projected-disk-pixel-overlap-any-positive-owns-v1',
			boundarySegmentCount: DISK_BOUNDARY_SEGMENT_COUNT,
			coverageFractions,
			footprint: null,
			classifications: Object.freeze(classifications),
			projectedDiskAreaPixels: 0,
			coveredAreaPixels: 0,
			minimumPositiveCoverage: 0,
			maximumCoverage: 0,
		});
	}
	const xs = polygon.map(([x]) => x);
	const ys = polygon.map(([, y]) => y);
	const minimumX = Math.max(0, Math.floor(Math.min(...xs)));
	const maximumX = Math.min(width - 1, Math.ceil(Math.max(...xs)) - 1);
	const minimumY = Math.max(0, Math.floor(Math.min(...ys)));
	const maximumY = Math.min(height - 1, Math.ceil(Math.max(...ys)) - 1);
	const footprint = minimumX <= maximumX && minimumY <= maximumY
		? Object.freeze({minimumX, maximumX, minimumY, maximumY})
		: null;
	let coveredAreaPixels = 0;
	let minimumPositiveCoverage = 1;
	let maximumCoverage = 0;
	if (footprint) {
		for (let pixelY = minimumY; pixelY <= maximumY; pixelY += 1) {
			for (let pixelX = minimumX; pixelX <= maximumX; pixelX += 1) {
				const fraction = clipDiskPolygonToPixel(polygon, pixelX, pixelY);
				if (!(fraction > COVERAGE_EPSILON)) continue;
				const acceptedFraction = Math.min(1, Math.max(0, fraction));
				coverageFractions[pixelY * width + pixelX] = acceptedFraction;
				coveredAreaPixels += acceptedFraction;
				minimumPositiveCoverage = Math.min(minimumPositiveCoverage, acceptedFraction);
				maximumCoverage = Math.max(maximumCoverage, acceptedFraction);
				classifications.zero -= 1;
				if (acceptedFraction >= 1 - COVERAGE_EPSILON) classifications.full += 1;
				else classifications.partial += 1;
			}
		}
	}
	return Object.freeze({
		policyIdentity: 'projected-disk-pixel-overlap-any-positive-owns-v1',
		boundarySegmentCount: DISK_BOUNDARY_SEGMENT_COUNT,
		coverageFractions,
		footprint,
		classifications: Object.freeze(classifications),
		projectedDiskAreaPixels: polygonArea(polygon),
		coveredAreaPixels,
		minimumPositiveCoverage: classifications.partial + classifications.full > 0 ? minimumPositiveCoverage : 0,
		maximumCoverage,
	});
}

function requireStellarProduct(product) {
	if (!(product?.pixelIndex instanceof Uint16Array)) throw new TypeError('Stellar product requires a Uint16 matrix.');
	if (!(product?.palette instanceof Float32Array) || product.palette.length % CHANNEL_COUNT !== 0) {
		throw new TypeError('Stellar product requires an entry-major Float32 native-15 palette.');
	}
	const {width, height} = product.viewport ?? {};
	if (product.pixelIndex.length !== width * height) throw new RangeError('Stellar matrix and viewport differ.');
	return product;
}

/** Flatten the opaque Sun over the accepted stellar back layer into the unchanged palette schema. */
export function composeSunDiskOverStellarPalette({stellarProduct, coverage, sunRadiance, sourceIdentity}) {
	const stellar = requireStellarProduct(stellarProduct);
	const usesGeometricCoverage = coverage?.coverageFractions instanceof Float64Array;
	const usesFourSampleCoverage = coverage?.sampleHits instanceof Uint8Array;
	if ((!usesGeometricCoverage && !usesFourSampleCoverage)
		|| (coverage.coverageFractions ?? coverage.sampleHits).length !== stellar.pixelIndex.length) {
		throw new TypeError('Sun coverage must provide one geometric fraction or four-sample hit count per pixel.');
	}
	const radiance = requireNative15(sunRadiance, 'Sun radiance');
	const pixelIndex = new Uint16Array(stellar.pixelIndex.length);
	const entries = [new Float64Array(CHANNEL_COUNT)];
	let stellarOccupiedPixelCount = 0;
	let sunOccupiedPixelCount = 0;
	let suppressedStellarPixelCount = 0;
	let retainedStellarPixelCount = 0;
	for (let linearIndex = 0; linearIndex < pixelIndex.length; linearIndex += 1) {
		const stellarPaletteIndex = stellar.pixelIndex[linearIndex];
		if (stellarPaletteIndex !== 0) stellarOccupiedPixelCount += 1;
		const hitCount = usesFourSampleCoverage ? coverage.sampleHits[linearIndex] : null;
		const scale = usesGeometricCoverage ? coverage.coverageFractions[linearIndex] : hitCount * SAMPLE_WEIGHT;
		if (!Number.isFinite(scale) || scale < 0 || scale > 1) {
			throw new RangeError(`Sun coverage at pixel ${linearIndex} lies outside [0, 1].`);
		}
		if (scale === 0 && stellarPaletteIndex === 0) continue;
		const output = new Float64Array(CHANNEL_COUNT);
		if (scale > 0) {
			sunOccupiedPixelCount += 1;
			if (stellarPaletteIndex !== 0) suppressedStellarPixelCount += 1;
			for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
				output[channelIndex] = radiance[channelIndex] * scale;
			}
		} else {
			retainedStellarPixelCount += 1;
			const offset = stellarPaletteIndex * CHANNEL_COUNT;
			for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
				output[channelIndex] = stellar.palette[offset + channelIndex];
			}
		}
		const outputIndex = entries.length;
		if (outputIndex > MAXIMUM_UINT16_NONZERO_INDEX) {
			throw new RangeError('Composed Sun/stars palette exceeds Uint16 capacity.');
		}
		pixelIndex[linearIndex] = outputIndex;
		entries.push(output);
	}
	const palette = new Float32Array(entries.length * CHANNEL_COUNT);
	for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
		palette.set(entries[entryIndex], entryIndex * CHANNEL_COUNT);
	}
	return Object.freeze({
		contract: stellar.contract,
		identities: Object.freeze({
			...stellar.identities,
			source: sourceIdentity,
			layerPolicy: coverage.policyIdentity ?? 'production-four-sample-any-positive-owns-v1',
			legacySunContribution: 'disabled',
		}),
		viewport: stellar.viewport,
		pixelIndex,
		palette,
		metadata: Object.freeze({
			stellarOccupiedPixelCount,
			sunOccupiedPixelCount,
			suppressedStellarPixelCount,
			retainedStellarPixelCount,
			paletteEntryCount: entries.length,
			matrixBytes: pixelIndex.byteLength,
			paletteBytes: palette.byteLength,
			legacySunContributionEnabled: false,
			coverageClassifications: coverage.classifications ?? null,
		}),
	});
}

export const SUN_DISK_SCREEN_PALETTE_POLICY = Object.freeze({
	id: 'production-four-sample-any-positive-owns-v1',
	sampleOffsets: SAMPLE_OFFSETS,
	sampleWeight: SAMPLE_WEIGHT,
	ownership: 'sample-hit-count > 0',
	radianceScale: 'sample-hit-count * 0.25',
	legacySunContribution: 'disabled',
});

export const SUN_DISK_PIXEL_OVERLAP_POLICY = Object.freeze({
	id: 'projected-disk-pixel-overlap-any-positive-owns-v1',
	boundarySegmentCount: DISK_BOUNDARY_SEGMENT_COUNT,
	ownership: 'projected disk/pixel overlap area > 0',
	radianceScale: 'projected disk/pixel overlap area divided by one pixel',
	legacySunContribution: 'disabled',
});
