import {
	STELLAR_CAMERA_FRAME_ID,
	STELLAR_PROJECTION_CLASSIFICATIONS,
	STELLAR_VIEWPORT_CONVENTION_ID,
	requireFiniteNumber,
	requireUnitDirection,
	requireViewportSize,
} from './contracts.js';
import {resolveCatalogDirectionAtObservation} from './CelestialPlacementTransform.js';

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
	if (!(length > 1e-15)) {
		throw new RangeError(`${label} is degenerate.`);
	}
	return Object.freeze(value.map((coordinate) => coordinate / length));
}

function rayFromNdc(ndcX, ndcY, camera) {
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
	], 'Pixel-corner ray');
}

function sphericalTriangleSolidAngle(a, b, c) {
	const numerator = Math.abs(dot(a, cross(b, c)));
	const denominator = 1 + dot(a, b) + dot(b, c) + dot(c, a);
	return 2 * Math.atan2(numerator, denominator);
}

export function createPerspectiveCameraContract({
	azimuthRadians,
	elevationRadians,
	verticalFieldOfViewRadians,
	viewport,
}) {
	requireFiniteNumber(azimuthRadians, 'Camera azimuth');
	requireFiniteNumber(elevationRadians, 'Camera elevation');
	requireFiniteNumber(verticalFieldOfViewRadians, 'Vertical field of view');
	if (elevationRadians <= -Math.PI / 2 || elevationRadians >= Math.PI / 2) {
		throw new RangeError('Camera elevation must remain strictly inside (-pi/2, pi/2).');
	}
	if (verticalFieldOfViewRadians <= 0 || verticalFieldOfViewRadians >= Math.PI) {
		throw new RangeError('Vertical field of view must remain inside (0, pi).');
	}
	const acceptedViewport = requireViewportSize(viewport);
	const cosineElevation = Math.cos(elevationRadians);
	const forward = Object.freeze([
		Math.sin(azimuthRadians) * cosineElevation,
		Math.cos(azimuthRadians) * cosineElevation,
		Math.sin(elevationRadians),
	]);
	const right = normalize(cross(forward, [0, 0, 1]), 'Camera right direction');
	const up = normalize(cross(right, forward), 'Camera up direction');
	return Object.freeze({
		frameId: STELLAR_CAMERA_FRAME_ID,
		viewportConventionId: STELLAR_VIEWPORT_CONVENTION_ID,
		azimuthRadians,
		elevationRadians,
		verticalFieldOfViewRadians,
		viewport: acceptedViewport,
		forward,
		right,
		up,
		aspectRatio: acceptedViewport.width / acceptedViewport.height,
		tangentHalfVerticalFieldOfView: Math.tan(verticalFieldOfViewRadians / 2),
	});
}

export function projectLocalDirectionToPixel(localDirection, camera) {
	const direction = requireUnitDirection(localDirection, 'local ENU direction');
	if (direction[2] <= 0) {
		return Object.freeze({
			classification: STELLAR_PROJECTION_CLASSIFICATIONS.BELOW_HORIZON,
			localDirectionEastNorthUp: direction,
		});
	}
	const depth = dot(direction, camera.forward);
	if (!(depth > 0)) {
		return Object.freeze({
			classification: STELLAR_PROJECTION_CLASSIFICATIONS.OFF_FRAME,
			localDirectionEastNorthUp: direction,
			cameraDepth: depth,
		});
	}
	const ndcX = dot(direction, camera.right)
		/ (depth * camera.tangentHalfVerticalFieldOfView * camera.aspectRatio);
	const ndcY = dot(direction, camera.up)
		/ (depth * camera.tangentHalfVerticalFieldOfView);
	if (ndcX < -1 || ndcX >= 1 || ndcY < -1 || ndcY >= 1) {
		return Object.freeze({
			classification: STELLAR_PROJECTION_CLASSIFICATIONS.OFF_FRAME,
			localDirectionEastNorthUp: direction,
			cameraDepth: depth,
			ndc: Object.freeze([ndcX, ndcY]),
		});
	}
	const pixelX = Math.floor((ndcX + 1) * 0.5 * camera.viewport.width);
	const pixelY = Math.floor((1 - ndcY) * 0.5 * camera.viewport.height);
	return Object.freeze({
		classification: STELLAR_PROJECTION_CLASSIFICATIONS.OCCUPIED_PIXEL,
		localDirectionEastNorthUp: direction,
		cameraDepth: depth,
		ndc: Object.freeze([ndcX, ndcY]),
		pixel: Object.freeze({
			x: pixelX,
			y: pixelY,
			linearIndex: pixelY * camera.viewport.width + pixelX,
		}),
	});
}

/** Return the exact perspective-projected solid angle of one half-open pixel. */
export function pixelSolidAngleSteradians(pixelX, pixelY, camera) {
	if (
		!Number.isSafeInteger(pixelX)
		|| !Number.isSafeInteger(pixelY)
		|| pixelX < 0
		|| pixelX >= camera.viewport.width
		|| pixelY < 0
		|| pixelY >= camera.viewport.height
	) {
		throw new RangeError('Pixel coordinates must lie inside the camera viewport.');
	}
	const left = 2 * pixelX / camera.viewport.width - 1;
	const right = 2 * (pixelX + 1) / camera.viewport.width - 1;
	const top = 1 - 2 * pixelY / camera.viewport.height;
	const bottom = 1 - 2 * (pixelY + 1) / camera.viewport.height;
	const topLeft = rayFromNdc(left, top, camera);
	const topRight = rayFromNdc(right, top, camera);
	const bottomRight = rayFromNdc(right, bottom, camera);
	const bottomLeft = rayFromNdc(left, bottom, camera);
	const solidAngle = sphericalTriangleSolidAngle(topLeft, topRight, bottomRight)
		+ sphericalTriangleSolidAngle(topLeft, bottomRight, bottomLeft);
	if (!(solidAngle > 0) || !Number.isFinite(solidAngle)) {
		throw new RangeError('Projected pixel solid angle must be finite and positive.');
	}
	return solidAngle;
}

export function projectCatalogMembers({
	members,
	catalogFrameId,
	observation,
	camera,
}) {
	if (!Array.isArray(members)) {
		throw new TypeError('Stellar projection members must be an array.');
	}
	return Object.freeze(members.map((member, memberIndex) => {
		const memberId = typeof member?.id === 'string'
			? member.id
			: typeof member?.memberId === 'string'
				? member.memberId
				: `invalid-member-${memberIndex}`;
		try {
			const placement = resolveCatalogDirectionAtObservation({
				direction: member.direction,
				catalogFrameId,
				observation,
			});
			return Object.freeze({
				memberIndex,
				memberId,
				placement,
				...projectLocalDirectionToPixel(
					placement.localDirectionEastNorthUp,
					camera,
				),
			});
		} catch (error) {
			return Object.freeze({
				memberIndex,
				memberId,
				classification: STELLAR_PROJECTION_CLASSIFICATIONS.INVALID,
				error: Object.freeze({
					name: error instanceof Error ? error.name : 'Error',
					message: error instanceof Error ? error.message : String(error),
				}),
			});
		}
	}));
}
