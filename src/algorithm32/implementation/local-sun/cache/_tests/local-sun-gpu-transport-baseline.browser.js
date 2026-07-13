import * as THREE from '../../../../../../node_modules/three/build/three.module.js';
import {CacheGpuExecutor} from '../../../../gpu-cache-runtime/CacheGpuExecutor.js';
import {CachePassAssembler} from '../../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {ThreeCacheBackend} from '../../../three-cache-backend/ThreeCacheBackend.js';
import {LocalSunCacheController} from '../LocalSunCacheController.js';
import {LocalSunCacheSource} from '../LocalSunCacheSource.js';
import {LocalSunShellFactCache} from '../LocalSunShellFactCache.js';
import {
	createDefaultAuthorityOwners,
	createDefaultAuthorityProbeCoordinates,
	createSealedAuthorityDomainSelection,
} from './local-sun-gpu-transport-authority.js';

/**
 * Call this method to describe the browser GPU without treating it as a
 * performance or product-support classification.
 *
 * @param {WebGL2RenderingContext} context - The WebGL2 context used for the authority execution.
 * @returns {Readonly<Record<string, unknown>>} - The observed renderer facts.
 */
function describeGpu(context) {
	const debug = context.getExtension('WEBGL_debug_renderer_info');
	return {
		version: context.getParameter(context.VERSION),
		shadingLanguageVersion: context.getParameter(context.SHADING_LANGUAGE_VERSION),
		vendor: debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : context.getParameter(context.VENDOR),
		renderer: debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER),
		maximumArrayLayers: context.getParameter(context.MAX_ARRAY_TEXTURE_LAYERS),
		maximumTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE),
		extColorBufferFloat: context.getExtension('EXT_color_buffer_float') !== null,
	};
}

describe('local-Sun GPU transport indexed baseline', /** Called by Jasmine to register the named suite. */ () => {
	it('executes selected default L2 and L3 probes without fixed-width transport bindings', async () => {
		const canvas = document.createElement('canvas');
		canvas.width = 4;
		canvas.height = 4;
		document.body.appendChild(canvas);
		const context = canvas.getContext('webgl2', {
			alpha: false,
			antialias: false,
			depth: false,
			preserveDrawingBuffer: true,
			stencil: false,
		});
		if (!context) {
			throw new Error('Step 0 packed authority requires WebGL2.');
		}
		const renderer = new THREE.WebGLRenderer({canvas, context});
		renderer.debug.checkShaderErrors = true;
		renderer.setSize(4, 4, false);
		const backend = new ThreeCacheBackend({THREE, renderer});
		const {atmosphere, geometry, lightSource} = createDefaultAuthorityOwners();
		const source = new LocalSunCacheSource({
			source: lightSource,
			shellFactCache: new LocalSunShellFactCache({sourceConfiguration: lightSource.configuration}),
		});
		const controller = new LocalSunCacheController({source, backend});
		const executor = new CacheGpuExecutor({backend, assembler: new CachePassAssembler()});
		const coordinates = createDefaultAuthorityProbeCoordinates();
		const domains = createSealedAuthorityDomainSelection(geometry);
		const firstCoordinate = [coordinates[0]];
		const readIndexedPlan = async () => {
			console.info('INDEXED_TRANSPORT_PHASE=plan-start');
			const plan = controller.createBuildPlan({
				atmosphere,
				geometry,
				maximumScatteringOrder: 4,
				domainSelection: domains,
			});
			console.info('INDEXED_TRANSPORT_PHASE=plan-complete');
			const artifact = await executor.execute(plan, {
				probeReader: backend,
				probes: [
					{field: 'local-sun-j1', coordinates: firstCoordinate},
					{field: 'local-sun-l1', coordinates: firstCoordinate},
					{field: 'local-sun-j2', coordinates: firstCoordinate},
					{field: 'local-sun-l2', coordinates},
					{field: 'local-sun-l3', coordinates},
				],
			});
			console.info('INDEXED_TRANSPORT_PHASE=execute-complete');
			try {
				const l2 = artifact.diagnostics.passes.find(({id}) => id === 'local-sun-transport-j2-to-l2')?.probe;
				const l3 = artifact.diagnostics.passes.find(({id}) => id === 'local-sun-transport-j3-to-l3')?.probe;
				const stages = artifact.diagnostics.passes
					.filter(({id}) =>
						['local-sun-primary-j1', 'local-sun-direct-l1', 'local-sun-scatter-l1-to-j2'].includes(id),
					)
					.map(({id, probe}) => ({id, value: probe?.samples[0]?.value}));
				console.info(`INDEXED_TRANSPORT_STAGE_PROBES=${JSON.stringify(stages)}`);
				expect(l2?.samples).toHaveSize(960);
				expect(l3?.samples).toHaveSize(960);
				return {plan, l2: l2.samples, l3: l3.samples, memory: artifact.diagnostics.memory};
			} finally {
				artifact.dispose();
			}
		};

		try {
			const indexed = await readIndexedPlan();
			const transportBindings = indexed.plan.passes
				.filter(({kind}) => kind === 'transport')
				.flatMap(({modules}) => modules.flatMap(({bindings}) => bindings));
			expect(transportBindings.some(({spec}) => spec.id === 'flat-geometry-transport-sources')).toBeFalse();
			expect(transportBindings.some(({spec}) => spec.id === 'flat-geometry-transport-coefficients')).toBeFalse();
			expect(transportBindings.filter(({spec}) => spec.id === 'flat-indexed-transport-offsets')).toHaveSize(2);
			console.info(
				`INDEXED_TRANSPORT_GPU_BASELINE=${JSON.stringify({
					gpu: describeGpu(context),
					indexedPlanIdentity: indexed.plan.identity,
					indexedMemory: indexed.memory,
				})}`,
			);
		} finally {
			executor.dispose();
			controller.dispose();
			backend.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
			canvas.remove();
		}
	});
});
