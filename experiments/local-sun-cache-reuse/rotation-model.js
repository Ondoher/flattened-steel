import {
	Algorithm32,
	CanonicalAtmosphere,
	FlatEarthGeometry,
	LocalSunLightSource,
} from '../../src/algorithm32/implementation/index.js';
import {createNativeExecutionProfile} from '../../src/algorithm32/profiles/index.js';
import {SharedModel} from '../../src/algorithm32/implementation/algorithm32/model/SharedModel.js';
import LocalSunConstructionDomainSelection from '../../src/algorithm32/implementation/local-sun/cache/LocalSunConstructionDomainSelection.js';
import {createFlat32ColorDisplayModel} from '../../src/flat32/Flat32ColorDisplayModel.js';
import {Reference} from '../../src/algorithm32/reference-execution/Reference.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../src/algorithm32/spectral-values/index.js';
import {transmission} from './continuous-reference.js';
import {createCorrectedGeometry, extendCoverage, stabilizeAxisFrame} from './corrected-geometry.js';
import {installPrecisionEndpoints} from './precision-endpoints.js';
import {installShellGeometry} from './shell-geometry.js';
import {installShellSource} from './shell-source.js';
import {shellNodeDirectionStencil,shellSpectralNodeWeight} from './shell-axis.js';
import {createShellAtmosphere} from './shell-runtime.js';
import {ShellRuntimeCalculator} from './shell-runtime-calculator.js';

/** Rotate a z-up physical position or direction about the origin.
 * @param {readonly number[]} value - Physical three-vector.
 * @param {number} degrees - Counterclockwise synthetic rotation, not orbital time.
 * @returns {UnitVector3} - Rotated vector; its original magnitude is preserved.
 */
export function rotate(value, degrees) {
	const angle = (degrees * Math.PI) / 180,
		c = Math.cos(angle),
		s = Math.sin(angle);
	return [c * value[0] - s * value[1], s * value[0] + c * value[1], value[2]];
}

/** Normalize a direction without changing positions.
 * @param {readonly number[]} value - Nonzero direction.
 * @returns {UnitVector3} - Unit direction.
 */
export function unit(value) {
	const length = Math.hypot(...value);
	if (!(length > 0)) throw new Error('Zero direction.');
	return [value[0] / length, value[1] / length, value[2] / length];
}

/** Construct independently owned fresh physical models at a frozen synthetic rotation.
 * @param {LocalSunRotationRecipe} recipe - Authenticated Flat 0 control and profile selection.
 * @param {number} degrees - Synthetic fixed-offset angle.
 * @returns {LocalSunRotationOwners} - Models whose lifetime is owned by the caller.
 */
export function createOwners(recipe, degrees) {
	const state = recipe.state,
		g = state.geometry;
	const rotation = rotate(g.sourcePosition.coordinates, degrees),offset=recipe.shellPlacementOffset ?? [0,0],observerOffset=recipe.shellObserverOffset ?? [0,0];
	const rotatedSource=/** @type {UnitVector3} */([rotation[0]+offset[0],rotation[1]+offset[1],rotation[2]]);
	const observerPosition={...g.observerPosition,coordinates:/** @type {UnitVector3} */([g.observerPosition.coordinates[0]+observerOffset[0],g.observerPosition.coordinates[1]+observerOffset[1],g.observerPosition.coordinates[2]])};
	const radialMaximum = Math.hypot(
			rotatedSource[0] - observerPosition.coordinates[0],
			rotatedSource[1] - observerPosition.coordinates[1],
	);
	/** @type {FlatEarthGeometryConfig} */
	const geometryConfiguration = {
		observerPosition,
		topAltitude: g.topAltitude,
		localLightSourceHeight: g.localLightSourceHeight,
		projectionRadius: g.projectionRadius,
		sceneSkyRayLimit: g.sceneSkyRayLimit,
		observerCenteredDome: g.observerCenteredDome,
		...(observerOffset.some(value=>value!==0) && g.observerCenteredDome ? {observerCenteredDome:{...g.observerCenteredDome,sphereCenter:{...g.observerCenteredDome.sphereCenter,coordinates:/** @type {UnitVector3} */([g.observerCenteredDome.sphereCenter.coordinates[0]+observerOffset[0],g.observerCenteredDome.sphereCenter.coordinates[1]+observerOffset[1],g.observerCenteredDome.sphereCenter.coordinates[2]])}}} : {}),
		...(recipe.diagnostic
			? {
					cacheAltitudeNodes: [0, 2, 6, 12, 18].map((i) => g.cacheAltitudeNodes[i]),
					cacheRadialNodes: [0, 2, 7, 12, 14].map((i) => ({
						value:
							i === 14
								? radialMaximum
								: (g.cacheRadialNodes[i].value / g.cacheRadialMaximum.value) * radialMaximum,
						units: /** @type {const} */ ('meters'),
					})),
				}
			: {}),
	};
	const geometry = recipe.candidate
		? createCorrectedGeometry(geometryConfiguration, degrees)
		: new FlatEarthGeometry(geometryConfiguration);
	const source = new LocalSunLightSource({
		sourceKey: 'local-sun-p2-fixed-offset',
		referenceDistance: state.source.referenceDistance,
		referenceSpectralIncidentScale: state.source.referenceSpectralIncidentScale,
		radius: state.source.radius,
		distanceFalloff: state.source.distanceFalloff,
		sourceTransmittanceIntervalCount: state.source.sourceTransmittanceIntervalCount,
	});
	if (source.sourceIrradiance.contentHash !== state.source.sourceIrradiance.contentHash)
		throw new Error('Frozen source spectrum changed.');
	const placement = {
		kind: /** @type {const} */ ('finite-position'),
		position: {coordinates: rotatedSource, units: /** @type {const} */ ('meters')},
	};
	geometry.configureLightSource({lightSource: source, observation: state.observation, placement});
	if (recipe.shellLayout) {
		installShellGeometry(geometry, recipe.shellLayout);
		installShellSource(source, recipe.shellLayout);
	}
	if (!recipe.shellLayout && (recipe.candidate === 'covered' || recipe.candidate === 'precision')) extendCoverage(geometry);
	if (recipe.candidate) stabilizeAxisFrame(geometry);
	if (recipe.candidate === 'precision') installPrecisionEndpoints(geometry);
	const domains = LocalSunConstructionDomainSelection.fromGeometry(geometry,
		recipe.shellIncoming ? {incomingDirectionDomainOwner:recipe.shellIncoming} : {});
	const atmosphere = recipe.shellRuntime ? createShellAtmosphere(recipe.shellMieAlbedo) : new CanonicalAtmosphere();
	const profile = createNativeExecutionProfile({
		lightSource: source,
		atmosphere,
		geometry,
		groundBoundary: null,
		observation: state.observation,
		sourcePlacement: placement,
		domains: {
			positions: domains.positionDomain,
			incomingDirections: domains.incomingDirectionDomain,
			outgoingDirections: domains.outgoingDirectionDomain,
		},
		execution: state.execution,
	});
	const facade = new Algorithm32({profile, color: createFlat32ColorDisplayModel()});
	const model = new SharedModel({profile, version: 1});
	if(recipe.shellRuntime) {
		facade._reference.dispose();
		facade._reference=new Reference({model:facade._model,calculator:new ShellRuntimeCalculator({model:facade._model})});
	}
	return {geometry, source, domains, profile, facade, model};
}

/** Reconstruct an outgoing field using production spatial and angular stencils.
 * @param {LocalSunRotationField} field - Layer-major GPU field readback.
 * @param {FlatEarthGeometry} geometry - Active physical query frame.
 * @param {readonly number[]} position - Physical meters.
 * @param {UnitVector3} direction - Physical outgoing direction.
 * @returns {Float64Array} - All fifteen reconstructed channels.
 */
export function sampleField(field, geometry, position, direction) {
	const point = {
		coordinates: /** @type {UnitVector3} */ ([position[0], position[1], position[2]]),
		units: /** @type {const} */ ('meters'),
	};
	const ps = geometry.resolveScatteringCachePositionStencil({
		position: point,
		atmosphereCoordinate: geometry.resolveAtmosphereCoordinate(point),
	});
	const values = new Float64Array(field.storage.layers);
	for (let p = 0; p < ps.indices.length; p++) {
		const ds=shellNodeDirectionStencil(geometry,ps.indices[p],point,direction);
		const nodeWeights=Array.from({length:values.length},(_,c)=>shellSpectralNodeWeight(geometry,ps.indices[p],point,c));
		for (let d = 0; d < ds.indices.length; d++)
			for (let c = 0; c < values.length; c++)
				values[c] +=
					nodeWeights[c] *
					ps.weights[p] *
					ds.weights[d] *
					field.values[(c * field.storage.height + ps.indices[p]) * field.storage.width + ds.indices[d]];
	}
	return values;
}

/** Make a CPU common-path reader of the measured GPU cumulative field.
 * This checks CPU/GPU reconstruction, not independent physical accuracy.
 * @param {LocalSunRotationField} field - Measured resident field.
 * @param {FlatEarthGeometry} geometry - Active query geometry.
 * @param {SpectralBasis} basis - Frozen Native15 basis.
 * @returns {CpuScatteringCache} - Stateless read-only adapter.
 */
export function cpuReader(field, geometry, basis) {
	return {
		sampleProvenanceIdentity: 'p2-gpu-readback-cpu-reconstruction',
		sampleCumulativeScatteringDensity(request) {
			return /** @type {SpectralScatteringDensityPacket} */ (
				new SpectralPacket({
					basis,
					quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
					units: SPECTRAL_UNITS.SCATTERING_DENSITY,
					semantics: basis.semantics,
					values: sampleField(
						field,
						geometry,
						request.context.position.coordinates,
						request.context.physicalOutgoingDirection,
					),
					provenanceIdentity: 'p2-gpu-readback-cpu-reconstruction',
				})
			);
		},
		dispose() {},
	};
}

/** Evaluate exact common-path CPU rays from one measured field.
 * @param {LocalSunRotationOwners} owners - Fresh geometry/profile.
 * @param {LocalSunRotationField} field - Fresh or canonical cumulative values.
 * @param {readonly UnitVector3[]} directions - World-fixed or equivalently rotated rays.
 * @returns {LocalSunRotationRayResult[]} - Spectra, transmission and physical endpoints.
 */
export function cpuRays(owners, field, directions) {
	const reference = new Reference({
		model: owners.model,
		scatteringCache: cpuReader(field, owners.geometry, owners.profile.spectral.basis),
		...(owners.model.atmosphere.id.includes(':shell-flat-analytic-columns-column-runtime-v1') ? {calculator:new ShellRuntimeCalculator({model:owners.model})} : {}),
	});
	return directions.map((direction) => {
		const result = reference.evaluate({viewRay: {direction}});
		return {
			radiance: Array.from(result.pathRadiance.values),
			transmittance: Array.from(result.transmittance.values),
			segment: result.viewRaySegment,
			samples: result.pathIntegrationPoints.map((p) => {
				const ray = result.viewRaySegment.ray,
					t = p.distanceAlongRay.value;
				return {
					coordinates: /** @type {UnitVector3} */ ([
						ray.origin.coordinates[0] + ray.direction[0] * t,
						ray.origin.coordinates[1] + ray.direction[1] * t,
						ray.origin.coordinates[2] + ray.direction[2] * t,
					]),
					units: /** @type {const} */ ('meters'),
				};
			}),
		};
	});
}

/** Produce the frozen 9-by-9 camera ray grid and horizon sentinels.
 * @returns {UnitVector3[]} - z-up, world-fixed physical directions.
 */
export function viewDirections() {
	/** @type {UnitVector3[]} */
	const directions = [];
	const scale = Math.tan((35 * Math.PI) / 180);
	for (let y = 0; y < 9; y++)
		for (let x = 0; x < 9; x++)
			directions.push(
				unit([((((x + 0.5) / 9) * 2 - 1) * scale * 720) / 414, 1, (((y + 0.5) / 9) * 2 - 1) * scale]),
			);
	for (const az of [0, 45, 90, 135, 180])
		for (const el of [-0.01, 0, 0.01]) {
			const a = (az * Math.PI) / 180,
				e = (el * Math.PI) / 180;
			directions.push([Math.sin(a) * Math.cos(e), Math.cos(a) * Math.cos(e), Math.sin(e)]);
		}
	return directions;
}

/** Track channelwise frozen absolute-plus-relative limits without averaging failures.
 * @param {ArrayLike<number>} actual - Candidate channels.
 * @param {ArrayLike<number>} expected - Reference channels.
 * @param {number} absolute - Quantity absolute bound.
 * @param {number} relative - Frozen relative bound.
 * @returns {LocalSunRotationResidual} - Complete scalar count and worst residual.
 */
export function residual(actual, expected, absolute, relative) {
	if (actual.length !== expected.length) throw new Error('Comparison shape mismatch.');
	let maximumAbsolute = 0,
		maximumRatio = 0,
		failures = 0,
		nonfinite = 0,
		negative = 0,
		worstIndex = 0;
	for (let i = 0; i < actual.length; i++) {
		if (!Number.isFinite(actual[i]) || !Number.isFinite(expected[i])) {
			nonfinite++;
			failures++;
			continue;
		}
		if (actual[i] < -absolute || expected[i] < -absolute) negative++;
		const error = Math.abs(actual[i] - expected[i]),
			ratio = error / (absolute + relative * Math.abs(expected[i]));
		if (ratio > maximumRatio) {
			maximumRatio = ratio;
			worstIndex = i;
		}
		maximumAbsolute = Math.max(maximumAbsolute, error);
		if (ratio > 1) failures++;
	}
	return {count: actual.length, maximumAbsolute, maximumRatio, failures, nonfinite, negative, worstIndex};
}

/** Check source distance, inverse-square calibration and analytic transmission symmetry.
 * @param {LocalSunRotationOwners} owners - Rotated physical models.
 * @param {LocalSunRotationOwners} canonical - Canonical physical models.
 * @param {number} degrees - Synthetic rotation.
 * @param {readonly number[]} [offset] - Horizontal source displacement for equivalent physical samples, meters.
 * @returns {LocalSunRotationSourceChecks} - Independent geometric/analytic sentinels.
 */
export function sourceChecks(owners, canonical, degrees,offset=[0,0]) {
	let maximumDistanceResidualMeters = 0,
		maximumInverseSquareRelative = 0,
		maximumTransmissionResidual = 0;
	for (const z of [5, 250, 1500, 7000, 25000, 62500, 99000])
		for (const fraction of [0, 1 / 96, 0.19, 0.51, 0.93, 1]) {
			const base = canonical.geometry.configuration,
				s = base.sourcePosition.coordinates;
			const p = /** @type {UnitVector3} */ ([s[0] + fraction * base.cacheRadialMaximum.value, s[1], z]),rotation=rotate(p,degrees),
				q=/** @type {UnitVector3} */([rotation[0]+offset[0],rotation[1]+offset[1],rotation[2]]);
			const a = canonical.geometry.resolveSourceRelativePosition({position: {coordinates: p, units: 'meters'}});
			const b = owners.geometry.resolveSourceRelativePosition({position: {coordinates: q, units: 'meters'}});
			maximumDistanceResidualMeters = Math.max(
				maximumDistanceResidualMeters,
				Math.abs(a.distanceFromSource.value - b.distanceFromSource.value),
			);
			const direct = owners.source.sampleDirectLighting({sourceRelativePosition: b});
			const expected = (owners.source.configuration.referenceDistance.value / b.distanceFromSource.value) ** 2;
			for (let c = 0; c < 15; c++)
				maximumInverseSquareRelative = Math.max(
					maximumInverseSquareRelative,
					Math.abs(direct.sourceIrradiance.values[c] / owners.source.sourceIrradiance.values[c] - expected) /
						expected,
				);
			const topFactor = (100000 - z) / (s[2] - z),
				ta = transmission(z, 100000, a.distanceFromSource.value * topFactor),
				tb = transmission(z, 100000, b.distanceFromSource.value * topFactor);
			maximumTransmissionResidual = Math.max(
				maximumTransmissionResidual,
				...ta.map((v, c) => Math.abs(v - tb[c])),
			);
		}
	return {samples: 42, maximumDistanceResidualMeters, maximumInverseSquareRelative, maximumTransmissionResidual};
}

/** Check every CPU integration point against the declared cylinder before admitting reuse.
 * @param {LocalSunRotationOwners} owners - Active physical cylinder.
 * @param {LocalSunRotationRayResult[]} rays - Exact CPU path observations.
 * @returns {LocalSunRotationCoverage} - Explicit admitted/excluded ray indices, no clamped pass.
 */
export function rayCoverage(owners, rays) {
	const g = owners.geometry.configuration,
		s = g.sourceSubpoint.coordinates,
		admitted = [],
		excluded = [];
	for (let index = 0; index < rays.length; index++) {
		let excess = 0;
		for (const point of rays[index].samples) {
			const p = point.coordinates;
			excess = Math.max(
				excess,
				Math.hypot(p[0] - s[0], p[1] - s[1]) - g.cacheRadialMaximum.value,
				-p[2],
				p[2] - g.topAltitude.value,
			);
		}
		if (excess > 1e-6) excluded.push({index, maximumExcessMeters: excess});
		else admitted.push(index);
	}
	return {
		admitted,
		excluded,
		roundoffToleranceMeters: 1e-6,
		rule: 'No out-of-cylinder ray is qualified, even when fresh and reused production clamping agrees.',
	};
}
