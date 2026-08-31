import * as THREE from '../../../../../node_modules/three/build/three.module.js';
import {createNativeExecutionProfile} from '../../../profiles/index.js';
import {Reference} from '../../../reference-execution/Reference.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../spectral-values/index.js';
import {ThreeCacheBackend} from '../../three-cache-backend/ThreeCacheBackend.js';
import {LocalSunCacheController} from '../../local-sun/cache/LocalSunCacheController.js';
import {LocalSunCacheSource} from '../../local-sun/cache/LocalSunCacheSource.js';
import {LocalSunShellFactCache} from '../../local-sun/cache/LocalSunShellFactCache.js';
import {
	createDefaultAuthorityOwners,
	createSealedAuthorityDomainSelection,
} from '../../local-sun/cache/_tests/local-sun-gpu-transport-authority.js';
import {ReceiverEnvironmentLightTransportCpuSampler} from '../ReceiverEnvironmentLightTransportCpuSampler.js';
import {ReceiverEnvironmentLightTransportSampler} from '../ReceiverEnvironmentLightTransportSampler.js';

function modelFromProfile(profile) {
	return {
		profile,
		lightSource: profile.models.lightSource,
		atmosphere: profile.models.atmosphere,
		geometry: profile.models.geometry,
		groundBoundary: profile.models.groundBoundary,
		celestialSources: null,
		spectral: {basis: profile.spectral.basis},
	};
}

function rendererResources() {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false});
	if (!context || !context.getExtension('EXT_color_buffer_float'))
		throw new Error('Production receiver-light parity requires float WebGL2 targets.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.debug.checkShaderErrors = true;
	renderer.setSize(32, 1, false);
	return {canvas, renderer, backend: new ThreeCacheBackend({THREE, renderer})};
}

function compareBatches(gpu, cpu, label) {
	expect(gpu).toHaveSize(32);
	expect(cpu).toHaveSize(32);
	let maximumRelativeResidual = 0;
	let maximumAbsoluteResidual = 0;
	for (let directionIndex = 0; directionIndex < 32; directionIndex += 1) {
		for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			const actual = gpu[directionIndex].values[channelIndex];
			const expected = cpu[directionIndex].values[channelIndex];
			const absolute = Math.abs(actual - expected);
			const relative = expected === 0 ? 0 : absolute / Math.abs(expected);
			maximumAbsoluteResidual = Math.max(maximumAbsoluteResidual, absolute);
			maximumRelativeResidual = Math.max(maximumRelativeResidual, relative);
			expect(Number.isFinite(actual)).withContext(`${label} ${directionIndex}:${channelIndex}`).toBeTrue();
			expect(absolute)
				.withContext(`${label} ${directionIndex}:${channelIndex}`)
				.toBeLessThanOrEqual(2e-7 + 0.025 * Math.abs(expected));
		}
	}
	console.info(
		`${label}_RECEIVER_ENVIRONMENT_PARITY=${JSON.stringify({maximumAbsoluteResidual, maximumRelativeResidual})}`,
	);
}

function readbackCpuCache(field, basis, geometry) {
	return {
		sampleCumulativeScatteringDensity(request) {
			const positionStencil = geometry.resolveScatteringCachePositionStencil({
				position: request.context.position,
				atmosphereCoordinate: request.context.atmosphereCoordinate,
			});
			const directionStencil = geometry.resolveScatteringCacheDirectionStencil({
				position: request.context.position,
				physicalOutgoingDirection: request.context.physicalOutgoingDirection,
			});
			const values = new Float64Array(basis.channelCount);
			for (let positionTap = 0; positionTap < positionStencil.indices.length; positionTap += 1) {
				for (let directionTap = 0; directionTap < directionStencil.indices.length; directionTap += 1) {
					const positionIndex = positionStencil.indices[positionTap];
					const directionIndex = directionStencil.indices[directionTap];
					const weight = positionStencil.weights[positionTap] * directionStencil.weights[directionTap];
					for (let channelIndex = 0; channelIndex < basis.channelCount; channelIndex += 1) {
						values[channelIndex] +=
							field.values[
								(channelIndex * field.storage.height + positionIndex) * field.storage.width +
									directionIndex
							] * weight;
					}
				}
			}
			return new SpectralPacket({
				basis,
				quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
				units: SPECTRAL_UNITS.SCATTERING_DENSITY,
				semantics: basis.semantics,
				values,
				provenanceIdentity: 'receiver-environment-active-gpu-field-readback-oracle',
			});
		},
	};
}

function createLocalModel() {
	const owners = createDefaultAuthorityOwners();
	const domains = createSealedAuthorityDomainSelection(owners.geometry);
	const observation = owners.geometry.configuration.observation;
	const profile = createNativeExecutionProfile({
		lightSource: owners.lightSource,
		atmosphere: owners.atmosphere,
		geometry: owners.geometry,
		groundBoundary: null,
		observation,
		domains: {
			positions: domains.positionDomain,
			incomingDirections: domains.incomingDirectionDomain,
			outgoingDirections: domains.outgoingDirectionDomain,
		},
		execution: {maximumScatteringOrder: 4},
	});
	return modelFromProfile({...profile, models: {...profile.models, celestialSources: null}});
}

describe('Receiver environment-light production-cache parity', () => {
	it('matches all 32x15 samples for Flat/local N4', async () => {
		const resources = rendererResources();
		const model = createLocalModel();
		const source = new LocalSunCacheSource({
			source: model.lightSource,
			shellFactCache: new LocalSunShellFactCache({sourceConfiguration: model.lightSource.configuration}),
		});
		const controller = new LocalSunCacheController({model, source, backend: resources.backend});
		try {
			const gpuCache = await controller.createScatteringCache({});
			const resident = await resources.backend.readRuntimeBindingField(gpuCache.getRuntimeBindings().bindings[0]);
			const cpuCache = readbackCpuCache(resident, model.spectral.basis, model.geometry);
			const gpu = await new ReceiverEnvironmentLightTransportSampler({
				THREE,
				renderer: resources.renderer,
				backend: resources.backend,
				model,
				scatteringCache: gpuCache,
			}).sample();
			const cpu = new ReceiverEnvironmentLightTransportCpuSampler({
				reference: new Reference({model, scatteringCache: cpuCache}),
			}).sample();
			compareBatches(gpu, cpu, 'FLAT_LOCAL');
		} finally {
			controller.dispose();
			resources.backend.dispose();
			resources.renderer.dispose();
			resources.renderer.forceContextLoss();
			resources.canvas.remove();
		}
	});
});
