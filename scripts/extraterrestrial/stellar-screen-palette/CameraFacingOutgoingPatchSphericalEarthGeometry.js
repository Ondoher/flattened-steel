import {DirectionDomainDescriptor} from
	'../candidate/src/algorithm32/domains/DirectionDomainDescriptor.js';
import {createShaderContribution} from
	'../candidate/src/algorithm32/shader/shaderContribution.js';
import {
	CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER,
	DOUBLED_OUTGOING_DIRECTION_COUNT,
	DoubledOutgoingSphericalEarthGeometry,
} from './DoubledOutgoingSphericalEarthGeometry.js';

export const CAMERA_FACING_PATCH_POLICY_ID =
	'contained-spherical-camera-facing-w77-density-patch-over-w39-v1';
export const CAMERA_FACING_PATCH_GRID_STEP = 1 / 38;
export const CAMERA_FACING_PATCH_HALF_COLUMN_COUNT = 51;
export const CAMERA_FACING_PATCH_HALF_ROW_COUNT = 32;
export const CAMERA_FACING_PATCH_WIDTH =
	2 * CAMERA_FACING_PATCH_HALF_COLUMN_COUNT + 1;
export const CAMERA_FACING_PATCH_HEIGHT =
	2 * CAMERA_FACING_PATCH_HALF_ROW_COUNT + 1;
export const CAMERA_FACING_PATCH_DIRECTION_COUNT =
	CAMERA_FACING_PATCH_WIDTH * CAMERA_FACING_PATCH_HEIGHT;
export const CAMERA_FACING_PATCH_OFFSET = DOUBLED_OUTGOING_DIRECTION_COUNT;
export const CAMERA_FACING_PATCH_TOTAL_DIRECTION_COUNT =
	DOUBLED_OUTGOING_DIRECTION_COUNT + CAMERA_FACING_PATCH_DIRECTION_COUNT;

const RUNTIME_STENCIL_BLOCK_ID = 'geometry-cache-stencils';
const UNIT_TOLERANCE = 2e-12;
const EXACT_NODE_TOLERANCE = 1e-10;

function dot(left, right) {
	return left[0] * right[0]
		+ left[1] * right[1]
		+ left[2] * right[2];
}

function cross(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

function normalize(value, label) {
	if (!Array.isArray(value) || value.length !== 3
		|| !value.every(Number.isFinite)) {
		throw new TypeError(`${label} must be a finite three-vector.`);
	}
	const length = Math.hypot(...value);
	if (!(length > 0)) throw new RangeError(`${label} must be nonzero.`);
	return value.map((component) => component / length);
}

function normalizeTwice(value, label) {
	return normalize(normalize(value, label), label);
}

function assertCameraBasis(frame) {
	const forward = normalize(frame?.forward, 'camera patch forward');
	const right = normalize(frame?.right, 'camera patch right');
	const up = normalize(frame?.up, 'camera patch up');
	if (Math.abs(dot(forward, right)) > UNIT_TOLERANCE
		|| Math.abs(dot(forward, up)) > UNIT_TOLERANCE
		|| Math.abs(dot(right, up)) > UNIT_TOLERANCE
		|| dot(cross(right, up), forward) > -1 + UNIT_TOLERANCE) {
		throw new RangeError(
			'Camera patch forward/right/up must be an orthonormal camera frame.',
		);
	}
	return {forward, right, up};
}

function gridLocation(value, count) {
	const nearest = Math.round(value);
	if (Math.abs(value - nearest) <= EXACT_NODE_TOLERANCE) {
		return {lower: nearest, upper: nearest, fraction: 0};
	}
	const lower = Math.floor(value);
	return {
		lower,
		upper: Math.min(lower + 1, count - 1),
		fraction: value - lower,
	};
}

function createPatchUnitVectors(frame) {
	const vectors = [];
	for (let row = -CAMERA_FACING_PATCH_HALF_ROW_COUNT;
		row <= CAMERA_FACING_PATCH_HALF_ROW_COUNT;
		row += 1) {
		const v = row * CAMERA_FACING_PATCH_GRID_STEP;
		for (let column = -CAMERA_FACING_PATCH_HALF_COLUMN_COUNT;
			column <= CAMERA_FACING_PATCH_HALF_COLUMN_COUNT;
			column += 1) {
			const u = column * CAMERA_FACING_PATCH_GRID_STEP;
			vectors.push(normalizeTwice([
				frame.forward[0] + u * frame.right[0] + v * frame.up[0],
				frame.forward[1] + u * frame.right[1] + v * frame.up[1],
				frame.forward[2] + u * frame.right[2] + v * frame.up[2],
			], 'camera patch direction'));
		}
	}
	return vectors;
}

class CameraFacingOutgoingPatchDirectionDomain {
	constructor({cameraSourceLocalFrame, verticalFovDegrees, aspectRatio}) {
		this.cameraSourceLocalFrame = assertCameraBasis(cameraSourceLocalFrame);
		if (!(verticalFovDegrees > 0 && verticalFovDegrees < 180)
			|| !(aspectRatio > 0) || !Number.isFinite(aspectRatio)) {
			throw new RangeError('Camera patch requires a finite perspective view.');
		}
		const verticalHalfTangent = Math.tan(
			verticalFovDegrees * Math.PI / 360,
		);
		const horizontalHalfTangent = verticalHalfTangent * aspectRatio;
		const maximumPatchU = CAMERA_FACING_PATCH_HALF_COLUMN_COUNT
			* CAMERA_FACING_PATCH_GRID_STEP;
		const maximumPatchV = CAMERA_FACING_PATCH_HALF_ROW_COUNT
			* CAMERA_FACING_PATCH_GRID_STEP;
		if (!(maximumPatchU - horizontalHalfTangent
			> CAMERA_FACING_PATCH_GRID_STEP)
			|| !(maximumPatchV - verticalHalfTangent
				> CAMERA_FACING_PATCH_GRID_STEP)) {
			throw new RangeError(
				'Camera patch must cover the complete viewport with a one-cell margin.',
			);
		}
		this.patch = {
			offset: CAMERA_FACING_PATCH_OFFSET,
			width: CAMERA_FACING_PATCH_WIDTH,
			height: CAMERA_FACING_PATCH_HEIGHT,
			directionCount: CAMERA_FACING_PATCH_DIRECTION_COUNT,
			gridStep: CAMERA_FACING_PATCH_GRID_STEP,
			halfColumnCount: CAMERA_FACING_PATCH_HALF_COLUMN_COUNT,
			halfRowCount: CAMERA_FACING_PATCH_HALF_ROW_COUNT,
			maximumU: maximumPatchU,
			maximumV: maximumPatchV,
			verticalFovDegrees,
			aspectRatio,
			verticalHalfTangent,
			horizontalHalfTangent,
			horizontalMargin: maximumPatchU - horizontalHalfTangent,
			verticalMargin: maximumPatchV - verticalHalfTangent,
		};
		this.directionCount = CAMERA_FACING_PATCH_TOTAL_DIRECTION_COUNT;
		this.unitVectors = [
			...CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER.unitVectors,
			...createPatchUnitVectors(this.cameraSourceLocalFrame),
		];
		this.positiveFaceCenterIndices = {
			...CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER.positiveFaceCenterIndices,
		};
		this.descriptor = new DirectionDomainDescriptor({
			id: CAMERA_FACING_PATCH_POLICY_ID,
			schemaRevision:
				CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER.descriptor.schemaRevision,
			generatorRevision: 'camera-facing-gnomonic-overlay-v1',
			frame: CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER.descriptor.frame,
			topology: {
				kind: 'w39-cubed-sphere-plus-camera-facing-gnomonic-patch',
				baseDirectionDomain:
					CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER.descriptor,
				baseDirectionCount: DOUBLED_OUTGOING_DIRECTION_COUNT,
				patch: {
					...this.patch,
					flatteningOrder: 'row-major-v-then-u',
					cameraSourceLocalFrame: this.cameraSourceLocalFrame,
					cellDensityRelationship:
						'one-half the W39 gnomonic cell spacing on each camera tangent-plane axis',
				},
				storedDirectionCount: this.directionCount,
			},
			interpolation: {
				kind: 'camera-patch-bilinear-with-w39-dominant-face-fallback',
				revision: 'complete-viewport-one-cell-margin-v1',
				exactNodeCoordinateTolerance: EXACT_NODE_TOLERANCE,
				selection:
					'use camera patch when its tangent-plane coordinates are in bounds; otherwise use unchanged W39',
			},
			precision: 'binary64-generated',
			count: this.directionCount,
			unitVectors: this.unitVectors,
			integrationWeights: null,
		});
	}

	resolveStencil(direction) {
		const coarseStencil =
			CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER.resolveStencil(direction);
		const acceptedDirection = normalize(direction, 'camera patch lookup direction');
		const denominator = dot(
			acceptedDirection,
			this.cameraSourceLocalFrame.forward,
		);
		if (!(denominator > 0)) return coarseStencil;
		const u = dot(acceptedDirection, this.cameraSourceLocalFrame.right)
			/ denominator;
		const v = dot(acceptedDirection, this.cameraSourceLocalFrame.up)
			/ denominator;
		const uGrid = u / CAMERA_FACING_PATCH_GRID_STEP
			+ CAMERA_FACING_PATCH_HALF_COLUMN_COUNT;
		const vGrid = v / CAMERA_FACING_PATCH_GRID_STEP
			+ CAMERA_FACING_PATCH_HALF_ROW_COUNT;
		if (uGrid < 0 || uGrid > CAMERA_FACING_PATCH_WIDTH - 1
			|| vGrid < 0 || vGrid > CAMERA_FACING_PATCH_HEIGHT - 1) {
			return coarseStencil;
		}
		const uLocation = gridLocation(uGrid, CAMERA_FACING_PATCH_WIDTH);
		const vLocation = gridLocation(vGrid, CAMERA_FACING_PATCH_HEIGHT);
		const index = (column, row) => CAMERA_FACING_PATCH_OFFSET
			+ row * CAMERA_FACING_PATCH_WIDTH + column;
		return {
			indices: [
				index(uLocation.lower, vLocation.lower),
				index(uLocation.upper, vLocation.lower),
				index(uLocation.lower, vLocation.upper),
				index(uLocation.upper, vLocation.upper),
			],
			weights: [
				(1 - uLocation.fraction) * (1 - vLocation.fraction),
				uLocation.fraction * (1 - vLocation.fraction),
				(1 - uLocation.fraction) * vLocation.fraction,
				uLocation.fraction * vLocation.fraction,
			],
		};
	}
}

function exactOccurrenceCount(source, expected) {
	let count = 0;
	let offset = 0;
	while (offset <= source.length - expected.length) {
		const index = source.indexOf(expected, offset);
		if (index < 0) break;
		count += 1;
		offset = index + expected.length;
	}
	return count;
}

function replaceExact(source, expected, replacement, label) {
	const count = exactOccurrenceCount(source, expected);
	if (count !== 1) {
		throw new Error(
			`Camera-facing patch adapter expected one ${label}, found ${count}.`,
		);
	}
	return source.replace(expected, replacement);
}

function glslFloat(value) {
	if (!Number.isFinite(value)) throw new TypeError('GLSL literal must be finite.');
	return value.toExponential(16);
}

function glslVector(value) {
	return `vec3(${value.map(glslFloat).join(', ')})`;
}

function patchRuntimeStencil(source, frame) {
	const insertion = `vec3 direction = scatteringCacheLocalW27Direction(positionMeters, physicalDirection);
	const vec3 CAMERA_PATCH_FORWARD = ${glslVector(frame.forward)};
	const vec3 CAMERA_PATCH_RIGHT = ${glslVector(frame.right)};
	const vec3 CAMERA_PATCH_UP = ${glslVector(frame.up)};
	float cameraPatchDenominator = dot(direction, CAMERA_PATCH_FORWARD);
	if (cameraPatchDenominator > 0.0) {
		float cameraPatchU = dot(direction, CAMERA_PATCH_RIGHT)
			/ cameraPatchDenominator;
		float cameraPatchV = dot(direction, CAMERA_PATCH_UP)
			/ cameraPatchDenominator;
		float cameraPatchUGrid = cameraPatchU * 38.0 + 51.0;
		float cameraPatchVGrid = cameraPatchV * 38.0 + 32.0;
		if (cameraPatchUGrid >= 0.0 && cameraPatchUGrid <= 102.0
			&& cameraPatchVGrid >= 0.0 && cameraPatchVGrid <= 64.0) {
			float cameraPatchUNearest = floor(cameraPatchUGrid + 0.5);
			float cameraPatchVNearest = floor(cameraPatchVGrid + 0.5);
			bool cameraPatchUExact = abs(cameraPatchUGrid - cameraPatchUNearest)
				<= 1.0e-10;
			bool cameraPatchVExact = abs(cameraPatchVGrid - cameraPatchVNearest)
				<= 1.0e-10;
			int cameraPatchULower = cameraPatchUExact
				? int(cameraPatchUNearest) : int(floor(cameraPatchUGrid));
			int cameraPatchVLower = cameraPatchVExact
				? int(cameraPatchVNearest) : int(floor(cameraPatchVGrid));
			int cameraPatchUUpper = cameraPatchUExact
				? cameraPatchULower : min(cameraPatchULower + 1, 102);
			int cameraPatchVUpper = cameraPatchVExact
				? cameraPatchVLower : min(cameraPatchVLower + 1, 64);
			float cameraPatchUFraction = cameraPatchUExact
				? 0.0 : cameraPatchUGrid - float(cameraPatchULower);
			float cameraPatchVFraction = cameraPatchVExact
				? 0.0 : cameraPatchVGrid - float(cameraPatchVLower);
			int cameraPatchOffset = 9126;
			ivec4 cameraPatchIndices = ivec4(
				cameraPatchOffset + cameraPatchVLower * 103 + cameraPatchULower,
				cameraPatchOffset + cameraPatchVLower * 103 + cameraPatchUUpper,
				cameraPatchOffset + cameraPatchVUpper * 103 + cameraPatchULower,
				cameraPatchOffset + cameraPatchVUpper * 103 + cameraPatchUUpper
			);
			vec4 cameraPatchWeights = vec4(
				(1.0 - cameraPatchUFraction) * (1.0 - cameraPatchVFraction),
				cameraPatchUFraction * (1.0 - cameraPatchVFraction),
				(1.0 - cameraPatchUFraction) * cameraPatchVFraction,
				cameraPatchUFraction * cameraPatchVFraction
			);
			return CacheDirectionStencil(cameraPatchIndices, cameraPatchWeights);
		}
	}`;
	return replaceExact(
		source,
		'vec3 direction = scatteringCacheLocalW27Direction(positionMeters, physicalDirection);',
		insertion,
		'camera-patch runtime insertion seam',
	);
}

export class CameraFacingOutgoingPatchSphericalEarthGeometry
	extends DoubledOutgoingSphericalEarthGeometry {
	constructor(configuration, patchConfiguration) {
		super(configuration);
		const physicalFrame = assertCameraBasis(
			patchConfiguration?.cameraPhysicalFrame,
		);
		const sourceLocalFrame = {
			forward: super.expressScatteringCacheDirection({
				physicalOutgoingDirection: physicalFrame.forward,
			}),
			right: super.expressScatteringCacheDirection({
				physicalOutgoingDirection: physicalFrame.right,
			}),
			up: super.expressScatteringCacheDirection({
				physicalOutgoingDirection: physicalFrame.up,
			}),
		};
		this._outgoingDirectionDomainOwner =
			new CameraFacingOutgoingPatchDirectionDomain({
				cameraSourceLocalFrame: sourceLocalFrame,
				verticalFovDegrees: patchConfiguration.verticalFovDegrees,
				aspectRatio: patchConfiguration.aspectRatio,
			});
	}

	get outgoingDirectionDomainOwner() {
		return this._outgoingDirectionDomainOwner;
	}

	describe() {
		const descriptor = this._outgoingDirectionDomainOwner?.descriptor;
		return {
			...super.describe(),
			containedOutgoingDirectionDomain: descriptor
				? {
					policy: CAMERA_FACING_PATCH_POLICY_ID,
					id: descriptor.id,
					contentHash: descriptor.contentHash,
					baseW39DirectionCount: DOUBLED_OUTGOING_DIRECTION_COUNT,
					patch: this._outgoingDirectionDomainOwner.patch,
					cameraSourceLocalFrame:
						this._outgoingDirectionDomainOwner.cameraSourceLocalFrame,
					directionCount: this._outgoingDirectionDomainOwner.directionCount,
				}
				: super.describe().containedOutgoingDirectionDomain,
		};
	}

	resolveScatteringCacheDirectionStencil(request) {
		return this._outgoingDirectionDomainOwner.resolveStencil(
			this.expressScatteringCacheDirection(request),
		);
	}

	createShaderContribution(request) {
		const contribution = super.createShaderContribution(request);
		const matching = contribution.functions.filter(
			(block) => block.id === RUNTIME_STENCIL_BLOCK_ID,
		);
		if (matching.length !== 1) {
			throw new Error(
				`Camera-facing patch adapter expected one ${RUNTIME_STENCIL_BLOCK_ID} block.`,
			);
		}
		const functions = contribution.functions.map((block) =>
			block.id === RUNTIME_STENCIL_BLOCK_ID
				? {
					...block,
					code: patchRuntimeStencil(
						block.code,
						this._outgoingDirectionDomainOwner.cameraSourceLocalFrame,
					),
				}
				: block);
		return createShaderContribution({
			...contribution,
			id: `${contribution.id}:${CAMERA_FACING_PATCH_POLICY_ID}`,
			functions,
			diagnostics: {
				...(contribution.diagnostics ?? {}),
				containedOutgoingDirectionDomain:
					this.describe().containedOutgoingDirectionDomain,
			},
		});
	}
}

export function auditCameraFacingOutgoingPatchGeometry(geometry) {
	if (!(geometry instanceof CameraFacingOutgoingPatchSphericalEarthGeometry)) {
		throw new TypeError('Camera-facing patch audit requires its geometry.');
	}
	const owner = geometry.outgoingDirectionDomainOwner;
	const centerStencil = owner.resolveStencil(
		owner.cameraSourceLocalFrame.forward,
	);
	const expectedCenterIndex = CAMERA_FACING_PATCH_OFFSET
		+ CAMERA_FACING_PATCH_HALF_ROW_COUNT * CAMERA_FACING_PATCH_WIDTH
		+ CAMERA_FACING_PATCH_HALF_COLUMN_COUNT;
	if (owner.unitVectors.length !== CAMERA_FACING_PATCH_TOTAL_DIRECTION_COUNT
		|| owner.descriptor.count !== CAMERA_FACING_PATCH_TOTAL_DIRECTION_COUNT
		|| centerStencil.indices.some((index) => index !== expectedCenterIndex)
		|| centerStencil.weights[0] !== 1) {
		throw new Error('Camera-facing outgoing patch structure changed.');
	}
	return {
		schemaId: 'camera-facing-outgoing-patch-audit-v1',
		accepted: true,
		policyId: CAMERA_FACING_PATCH_POLICY_ID,
		contentHash: owner.descriptor.contentHash,
		baseW39DirectionCount: DOUBLED_OUTGOING_DIRECTION_COUNT,
		patchDirectionCount: CAMERA_FACING_PATCH_DIRECTION_COUNT,
		totalDirectionCount: CAMERA_FACING_PATCH_TOTAL_DIRECTION_COUNT,
		patch: owner.patch,
		cameraSourceLocalFrame: owner.cameraSourceLocalFrame,
		centerIndex: expectedCenterIndex,
		positiveFaceCenterIndices: owner.positiveFaceCenterIndices,
	};
}

export default CameraFacingOutgoingPatchSphericalEarthGeometry;
