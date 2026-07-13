import * as THREE from '../../../../../../node_modules/three/build/three.module.js';

import {CacheGpuExecutor} from '../../../../gpu-cache-runtime/CacheGpuExecutor.js';
import {CanonicalAtmosphere, SphericalEarthGeometry} from '../../../index.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../canonical-atmosphere/consts.js';
import {createNativeExecutionProfile} from '../../../../profiles/native-15/native-15-profile.js';
import {CachePassAssembler} from '../../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {ThreeCacheBackend} from '../../../three-cache-backend/ThreeCacheBackend.js';
import {DistantSunLightSource} from '../../DistantSunLightSource.js';
import {DistantSunCacheController} from '../DistantSunCacheController.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../consts.js';

const POLICY_URL = '/base/src/algorithm32/implementation/distant-sun/cache/fixtures/gpu-cache-parity-policy.json';
const ORACLE_URL =
	'/base/src/algorithm32/implementation/distant-sun/cache/fixtures/algorithm32-production-native-n4-cpu-gpu-parity-oracle.json';

function fieldId(name) {
	if (/^Jthrough\d+$/u.test(name)) return `distant-sun-j-through-${name.slice('Jthrough'.length)}`;
	return `distant-sun-${name.toLowerCase()}`;
}

function createRenderer() {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
	});
	if (!context) throw new Error('Distant-Sun GPU-direct transport parity requires WebGL2.');
	if (!context.getExtension('EXT_color_buffer_float')) {
		throw new Error('Distant-Sun GPU-direct transport parity requires EXT_color_buffer_float.');
	}
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.debug.checkShaderErrors = true;
	renderer.setSize(2, 2, false);
	return {canvas, renderer};
}

function createPlan() {
	const atmosphere = new CanonicalAtmosphere({constants: CANONICAL_ATMOSPHERE_CONSTANTS});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
		topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
		observerHeight: {value: 2, units: 'meters'},
		observerUpDirection: [1, 0, 0],
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: {value: 2, units: 'meters'},
		sourceTransmittanceIntervalCount: 20,
	});
	const source = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
	const observation = {
		instant: '2026-03-20T12:00:00.000Z',
		location: {
			latitude: {value: 0, units: 'degrees'},
			longitude: {value: 0, units: 'degrees'},
		},
	};
	geometry.configureLightSource({
		lightSource: source,
		observation,
		placement: {kind: 'distant-direction', directionToLight: [0, 1, 0]},
	});
	const domains = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const nativeProfile = createNativeExecutionProfile({
		lightSource: source,
		atmosphere,
		geometry,
		groundBoundary: null,
		observation,
		domains: {
			positions: domains.positionDomain,
			incomingDirections: domains.incomingDirectionDomain,
			outgoingDirections: domains.outgoingDirectionDomain,
		},
		execution: {maximumScatteringOrder: 4},
	});
	const profile = {
		...nativeProfile,
		numerical: {
			...nativeProfile.numerical,
			cacheConstruction: {
				...nativeProfile.numerical.cacheConstruction,
				transportIntervalCount: 40,
			},
		},
	};
	const model = /** @type {SharedModel} */ (
		/** @type {unknown} */ ({lightSource: source, atmosphere, geometry, groundBoundary: null, profile})
	);
	const controller = new DistantSunCacheController({
		model,
		backend: /** @type {CacheGpuBackend} */ ({}),
	});
	const plan = controller.createBuildPlan();
	controller.dispose();
	return plan;
}

function createProbes(oracle, plan) {
	const planFieldIds = new Set(plan.fields.map(({id}) => id));
	return oracle.fields
		.filter((field) => planFieldIds.has(fieldId(field.name)))
		.map((field) => ({
			field: fieldId(field.name),
			coordinates: field.queries.flatMap((query) =>
				oracle.wavelengthIndices.map((wavelengthIndex) => ({
					directionIndex: query.directionIndex,
					positionIndex: query.positionIndex,
					wavelengthIndex,
				})),
			),
		}));
}

function boundFor(field, policy) {
	if (field.queryKind === 'radiance') return policy.bounds.pureRadiance;
	return field.order.kind === 'cumulative-through'
		? policy.bounds.cumulativeScatteringDensity
		: policy.bounds.pureScatteringDensity;
}

describe('distant-Sun GPU-direct transport', () => {
	it('matches the current reflection-completed Fibonacci-68 N4 binary64 CPU field probes', async () => {
		const [policy, oracle] = await Promise.all([
			fetch(POLICY_URL).then((response) => response.json()),
			fetch(ORACLE_URL).then((response) => response.json()),
		]);
		const plan = createPlan();
		const resources = createRenderer();
		const backend = new ThreeCacheBackend({THREE, renderer: resources.renderer});
		const executor = new CacheGpuExecutor({backend, assembler: new CachePassAssembler()});
		let artifact;

		try {
			artifact = await executor.execute(plan, {
				probeReader: backend,
				probes: createProbes(oracle, plan),
			});
			const probesByField = new Map();
			for (const passDiagnostic of artifact.diagnostics.passes) {
				if (!passDiagnostic.probe) continue;
				const pass = plan.passes.find(({id}) => id === passDiagnostic.id);
				probesByField.set(pass.output, passDiagnostic.probe.samples);
			}

			let comparedValueCount = 0;
			let maximumRelativeResidual = 0;
			for (const field of oracle.fields) {
				const samples = probesByField.get(fieldId(field.name));
				if (!samples) continue;
				const expectedValues = field.queries.flatMap((query) => query.values);
				expect(samples.length).toBe(expectedValues.length);
				const bound = boundFor(field, policy);
				for (let index = 0; index < samples.length; index += 1) {
					const expected = expectedValues[index];
					const residual = Math.abs(samples[index].value - expected);
					const allowed = bound.absolute + bound.relative * Math.abs(expected);
					expect(residual).withContext(`${field.name} sample ${index}`).toBeLessThanOrEqual(allowed);
					if (expected !== 0)
						maximumRelativeResidual = Math.max(maximumRelativeResidual, residual / Math.abs(expected));
					comparedValueCount += 1;
				}
			}
			expect(comparedValueCount).toBe(750);
			console.log(
				`DISTANT_GPU_DIRECT_TRANSPORT_RESULT=${JSON.stringify({
					comparedValueCount,
					maximumRelativeResidual,
					memory: artifact.diagnostics.memory,
				})}`,
			);
		} finally {
			artifact?.dispose();
			executor.dispose();
			backend.dispose();
			resources.renderer.dispose();
			resources.renderer.forceContextLoss();
			resources.canvas.remove();
		}
	});
});
