import {
	SphericalEarthGeometry,
} from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import {
	createCubedSphereW27DirectionStencil,
} from '../candidate/src/algorithm32/domains/index.js';
import {
	createCacheBuildModule,
} from '../candidate/src/algorithm32/caches/gpu/cacheBuildContracts.js';
import {
	createShaderContribution,
	formatShaderFloat,
} from '../candidate/src/algorithm32/shader/shaderContribution.js';
import {
	localW27Direction,
	physicalW27Direction,
} from '../candidate/src/algorithm32/geometries/scattering-cache-direction-frames.js';

export const ROLLED_W27_SOURCE_AXIS_POLICY_ID = 'source-axis-roll-v1';

const CACHE_SOURCE_FRAME_BLOCK_ID = 'spherical-geometry-source-frames';
const RUNTIME_STENCIL_BLOCK_ID = 'geometry-cache-stencils';
const CACHE_W27_FUNCTION_SIGNATURE =
	'vec3 cacheW27PhysicalDirection(vec3 localDirection, vec3 directionToSource) {';
const RUNTIME_W27_FUNCTION_SIGNATURE =
	'vec3 scatteringCacheLocalW27Direction(vec3 positionMeters, vec3 physicalDirection) {';
const CACHE_KINDS_WITH_W27_PHYSICAL_DIRECTION = new Set([
	'primary-j1',
	'direct-l1',
	'scatter',
]);
const TRIGONOMETRIC_SNAP_TOLERANCE = Number.EPSILON * 8;

const BASE_CACHE_W27_FUNCTION = `vec3 cacheW27PhysicalDirection(vec3 localDirection, vec3 directionToSource) {
	vec3 xAxis = directionToSource;
	vec3 zAxis = vec3(0.0, 0.0, 1.0)
		- xAxis * dot(vec3(0.0, 0.0, 1.0), xAxis);
	if (length(zAxis) <= 1.0e-10) {
		vec3 fallback = cacheLeastAlignedAxis(xAxis);
		zAxis = fallback - xAxis * dot(fallback, xAxis);
	}
	zAxis = normalize(zAxis);
	vec3 yAxis = normalize(cross(zAxis, xAxis));
	return normalize(
		xAxis * localDirection.x
		+ yAxis * localDirection.y
		+ zAxis * localDirection.z
	);
}`;

const BASE_RUNTIME_W27_FUNCTION = `vec3 scatteringCacheLocalW27Direction(vec3 positionMeters, vec3 physicalDirection) {
	vec3 xAxis = normalize(directionToAtmosphericSource(positionMeters));
	vec3 zAxis = vec3(0.0, 0.0, 1.0)
		- xAxis * dot(vec3(0.0, 0.0, 1.0), xAxis);
	if (length(zAxis) <= 1.0e-10) {
		vec3 fallback = scatteringCacheLeastAlignedAxis(xAxis);
		zAxis = fallback - xAxis * dot(fallback, xAxis);
	}
	zAxis = normalize(zAxis);
	vec3 yAxis = normalize(cross(zAxis, xAxis));
	vec3 direction = normalize(physicalDirection);
	return vec3(
		dot(direction, xAxis),
		dot(direction, yAxis),
		dot(direction, zAxis)
	);
}`;

/** Return a finite roll in the canonical half-open interval [-pi, pi). */
function canonicalRollRadians(value) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new RangeError('w27RollRadians must be finite.');
	}

	const fullTurn = Math.PI * 2;
	let canonical = value % fullTurn;
	if (canonical >= Math.PI) {
		canonical -= fullTurn;
	}
	if (canonical < -Math.PI) {
		canonical += fullTurn;
	}

	return Math.abs(canonical) <= TRIGONOMETRIC_SNAP_TOLERANCE
		? 0
		: canonical;
}

/** Snap the exact quarter-turn controls to stable zero and unit values. */
function canonicalTrigonometricValue(value) {
	for (const exactValue of [-1, 0, 1]) {
		if (Math.abs(value - exactValue) <= TRIGONOMETRIC_SNAP_TOLERANCE) {
			return exactValue;
		}
	}

	return value;
}

/** Count non-overlapping exact source occurrences. */
function exactOccurrenceCount(source, expectedSource) {
	let count = 0;
	let offset = 0;

	while (offset <= source.length - expectedSource.length) {
		const index = source.indexOf(expectedSource, offset);
		if (index < 0) {
			break;
		}
		count += 1;
		offset = index + expectedSource.length;
	}

	return count;
}

/** Reject a moved, duplicated, removed, or edited candidate hook. */
function requireExactHookCount(label, actualCount, expectedCount) {
	if (actualCount !== expectedCount) {
		throw new Error(
			`Rolled W27 adapter expected ${expectedCount} ${label} hook(s), `
				+ `but found ${actualCount}; refusing to patch a changed candidate seam.`,
		);
	}
}

/** Replace one complete source hook after verifying its exact cardinality. */
function replaceExactHook(source, expectedSource, replacementSource, label) {
	const count = exactOccurrenceCount(source, expectedSource);
	requireExactHookCount(label, count, 1);
	return source.replace(expectedSource, replacementSource);
}

/** Construct the cache-build W27 mapper for one baked roll. */
function rolledCacheW27Function(cosine, sine) {
	if (cosine === 1 && sine === 0) {
		return BASE_CACHE_W27_FUNCTION;
	}

	return `vec3 cacheW27PhysicalDirection(vec3 localDirection, vec3 directionToSource) {
	vec3 xAxis = directionToSource;
	vec3 zAxis = vec3(0.0, 0.0, 1.0)
		- xAxis * dot(vec3(0.0, 0.0, 1.0), xAxis);
	if (length(zAxis) <= 1.0e-10) {
		vec3 fallback = cacheLeastAlignedAxis(xAxis);
		zAxis = fallback - xAxis * dot(fallback, xAxis);
	}
	zAxis = normalize(zAxis);
	vec3 yAxis = normalize(cross(zAxis, xAxis));
	const float w27RollCosine = ${formatShaderFloat(cosine)};
	const float w27RollSine = ${formatShaderFloat(sine)};
	vec3 rolledYAxis = yAxis * w27RollCosine + zAxis * w27RollSine;
	vec3 rolledZAxis = zAxis * w27RollCosine - yAxis * w27RollSine;
	return normalize(
		xAxis * localDirection.x
		+ rolledYAxis * localDirection.y
		+ rolledZAxis * localDirection.z
	);
}`;
}

/** Construct the runtime physical-to-W27 mapper for one baked roll. */
function rolledRuntimeW27Function(cosine, sine) {
	if (cosine === 1 && sine === 0) {
		return BASE_RUNTIME_W27_FUNCTION;
	}

	return `vec3 scatteringCacheLocalW27Direction(vec3 positionMeters, vec3 physicalDirection) {
	vec3 xAxis = normalize(directionToAtmosphericSource(positionMeters));
	vec3 zAxis = vec3(0.0, 0.0, 1.0)
		- xAxis * dot(vec3(0.0, 0.0, 1.0), xAxis);
	if (length(zAxis) <= 1.0e-10) {
		vec3 fallback = scatteringCacheLeastAlignedAxis(xAxis);
		zAxis = fallback - xAxis * dot(fallback, xAxis);
	}
	zAxis = normalize(zAxis);
	vec3 yAxis = normalize(cross(zAxis, xAxis));
	const float w27RollCosine = ${formatShaderFloat(cosine)};
	const float w27RollSine = ${formatShaderFloat(sine)};
	vec3 rolledYAxis = yAxis * w27RollCosine + zAxis * w27RollSine;
	vec3 rolledZAxis = zAxis * w27RollCosine - yAxis * w27RollSine;
	vec3 direction = normalize(physicalDirection);
	return vec3(
		dot(direction, xAxis),
		dot(direction, rolledYAxis),
		dot(direction, rolledZAxis)
	);
}`;
}

/**
 * Rotate the source-aligned cubed-sphere W27 frame about its physical +X axis.
 *
 * Positive angles use the right-hand rule. The adapter changes cache
 * construction, packed recurrence transport, CPU lookup, and runtime GLSL as
 * one policy. It deliberately remains contained and imports the candidate only
 * as a read-only implementation base.
 */
export class RolledW27SphericalEarthGeometry extends SphericalEarthGeometry {
	/**
	 * Create one experimental spherical geometry.
	 *
	 * @param {SphericalEarthGeometryConfig & {w27RollRadians?: number}} configuration
	 * Supplies the candidate geometry configuration and source-axis roll.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object'
			|| Array.isArray(configuration)) {
			throw new TypeError(
				'RolledW27SphericalEarthGeometry configuration is required.',
			);
		}

		const {
			w27RollRadians = 0,
			...sphericalConfiguration
		} = configuration;
		super(sphericalConfiguration);

		this._w27RollRadians = canonicalRollRadians(w27RollRadians);
		this._w27RollCosine = canonicalTrigonometricValue(
			Math.cos(this._w27RollRadians),
		);
		this._w27RollSine = canonicalTrigonometricValue(
			Math.sin(this._w27RollRadians),
		);
	}

	/** Return the canonical configured roll in radians. */
	get w27RollRadians() {
		return this._w27RollRadians;
	}

	/** Return whether the adapter is the exact candidate-frame control. */
	_isZeroW27Roll() {
		return this._w27RollCosine === 1 && this._w27RollSine === 0;
	}

	/** Convert baseline-local coordinates to coordinates in the rolled frame. */
	_toRolledW27Direction(direction) {
		return [
			direction[0],
			this._w27RollCosine * direction[1]
				+ this._w27RollSine * direction[2],
			-this._w27RollSine * direction[1]
				+ this._w27RollCosine * direction[2],
		];
	}

	/** Convert rolled-frame coordinates to baseline-local coordinates. */
	_toBaselineW27Direction(direction) {
		return [
			direction[0],
			this._w27RollCosine * direction[1]
				- this._w27RollSine * direction[2],
			this._w27RollSine * direction[1]
				+ this._w27RollCosine * direction[2],
		];
	}

	/** Include the experimental frame policy in geometry/cache compatibility. */
	describe() {
		return {
			...super.describe(),
			experimentalW27Frame: {
				policy: ROLLED_W27_SOURCE_AXIS_POLICY_ID,
				radians: this._w27RollRadians,
			},
		};
	}

	/** Express a physical direction in the rolled W27 frame. */
	expressScatteringCacheDirection(request) {
		if (this._isZeroW27Roll()) {
			return super.expressScatteringCacheDirection(request);
		}

		return this._toRolledW27Direction(localW27Direction(
			request.physicalOutgoingDirection,
			this.configuration.directionToSource,
		));
	}

	/** Resolve the cubed-sphere stencil after applying the configured roll. */
	resolveScatteringCacheDirectionStencil(request) {
		if (this._isZeroW27Roll()) {
			return super.resolveScatteringCacheDirectionStencil(request);
		}

		return createCubedSphereW27DirectionStencil(
			this.expressScatteringCacheDirection(request),
		);
	}

	/** Express one rolled W27 cache direction in physical model space. */
	expressPhysicalScatteringCacheDirection(request) {
		if (this._isZeroW27Roll()) {
			return super.expressPhysicalScatteringCacheDirection(request);
		}

		return this.expressPhysicalOutgoingScatteringDirection(
			request.cacheDirection,
		);
	}

	/** Express one rolled W27 outgoing direction in physical model space. */
	expressPhysicalOutgoingScatteringDirection(cacheDirection) {
		if (this._isZeroW27Roll()) {
			return super.expressPhysicalOutgoingScatteringDirection(cacheDirection);
		}

		return physicalW27Direction(
			this._toBaselineW27Direction(cacheDirection),
			this.configuration.directionToSource,
		);
	}

	/**
	 * Rotate the direct baseline-local stencil seam inside candidate transport
	 * packing without copying its long physical integration implementation.
	 */
	createTransportData(request) {
		if (this._isZeroW27Roll()) {
			return super.createTransportData(request);
		}
		if (!request?.domains
			|| typeof request.domains.resolveOutgoingDirectionStencil !== 'function') {
			throw new TypeError(
				'Rolled W27 transport requires an outgoing-direction stencil resolver.',
			);
		}

		const domains = request.domains;
		const geometry = this;
		const rolledDomains = new Proxy(domains, {
			get(target, property, receiver) {
				if (property === 'resolveOutgoingDirectionStencil') {
					return (baselineLocalDirection) =>
						target.resolveOutgoingDirectionStencil.call(
							target,
							geometry._toRolledW27Direction(baselineLocalDirection),
						);
				}

				return Reflect.get(target, property, receiver);
			},
		});

		return super.createTransportData({
			...request,
			domains: rolledDomains,
		});
	}

	/** Validate and patch the one cache-build physical W27 hook. */
	_patchCacheBlocks(module, contextKind) {
		const expectedCount = CACHE_KINDS_WITH_W27_PHYSICAL_DIRECTION.has(
			contextKind,
		) ? 1 : 0;
		const blockCount = module.blocks.filter(
			(block) => block.id === CACHE_SOURCE_FRAME_BLOCK_ID,
		).length;
		const signatureCount = module.blocks.reduce(
			(count, block) => count + exactOccurrenceCount(
				block.source,
				CACHE_W27_FUNCTION_SIGNATURE,
			),
			0,
		);
		const exactBodyCount = module.blocks.reduce(
			(count, block) => count + exactOccurrenceCount(
				block.source,
				BASE_CACHE_W27_FUNCTION,
			),
			0,
		);

		requireExactHookCount(
			`cache block id "${CACHE_SOURCE_FRAME_BLOCK_ID}"`,
			blockCount,
			expectedCount,
		);
		requireExactHookCount(
			`cache function signature "${CACHE_W27_FUNCTION_SIGNATURE}"`,
			signatureCount,
			expectedCount,
		);
		requireExactHookCount(
			'exact cache W27 function body',
			exactBodyCount,
			expectedCount,
		);

		if (expectedCount === 0) {
			return module.blocks;
		}

		const replacement = rolledCacheW27Function(
			this._w27RollCosine,
			this._w27RollSine,
		);
		return module.blocks.map((block) => block.id === CACHE_SOURCE_FRAME_BLOCK_ID
			? {
				...block,
				source: replaceExactHook(
					block.source,
					BASE_CACHE_W27_FUNCTION,
					replacement,
					'exact cache W27 function body',
				),
			}
			: block);
	}

	/** Rebuild the cache module identity after exact source-hook adaptation. */
	createCacheModule(context) {
		const module = super.createCacheModule(context);
		const blocks = this._patchCacheBlocks(module, context.kind);
		const rollIdentity = formatShaderFloat(this._w27RollRadians);

		return createCacheBuildModule({
			id: `${module.id}:experimental-${ROLLED_W27_SOURCE_AXIS_POLICY_ID}:${rollIdentity}`,
			owner: module.owner,
			provides: module.provides,
			requires: module.requires,
			blocks,
			bindings: module.bindings,
		});
	}

	/** Validate and patch the one final-view physical-to-W27 GLSL hook. */
	createShaderContribution(request) {
		const contribution = super.createShaderContribution(request);
		const blockCount = contribution.functions.filter(
			(block) => block.id === RUNTIME_STENCIL_BLOCK_ID,
		).length;
		const signatureCount = contribution.functions.reduce(
			(count, block) => count + exactOccurrenceCount(
				block.code,
				RUNTIME_W27_FUNCTION_SIGNATURE,
			),
			0,
		);
		const exactBodyCount = contribution.functions.reduce(
			(count, block) => count + exactOccurrenceCount(
				block.code,
				BASE_RUNTIME_W27_FUNCTION,
			),
			0,
		);

		requireExactHookCount(
			`runtime block id "${RUNTIME_STENCIL_BLOCK_ID}"`,
			blockCount,
			1,
		);
		requireExactHookCount(
			`runtime function signature "${RUNTIME_W27_FUNCTION_SIGNATURE}"`,
			signatureCount,
			1,
		);
		requireExactHookCount(
			'exact runtime W27 function body',
			exactBodyCount,
			1,
		);

		const replacement = rolledRuntimeW27Function(
			this._w27RollCosine,
			this._w27RollSine,
		);
		const functions = contribution.functions.map((block) =>
			block.id === RUNTIME_STENCIL_BLOCK_ID
				? {
					...block,
					code: replaceExactHook(
						block.code,
						BASE_RUNTIME_W27_FUNCTION,
						replacement,
						'exact runtime W27 function body',
					),
				}
				: block);
		const rollIdentity = formatShaderFloat(this._w27RollRadians);

		return createShaderContribution({
			...contribution,
			id: `${contribution.id}:experimental-${ROLLED_W27_SOURCE_AXIS_POLICY_ID}:${rollIdentity}`,
			functions,
			diagnostics: {
				...(contribution.diagnostics ?? {}),
				experimentalW27Frame: {
					policy: ROLLED_W27_SOURCE_AXIS_POLICY_ID,
					radians: this._w27RollRadians,
				},
			},
		});
	}
}

export default RolledW27SphericalEarthGeometry;
