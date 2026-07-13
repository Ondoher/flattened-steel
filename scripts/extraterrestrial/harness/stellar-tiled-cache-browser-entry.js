import * as THREE from 'three';
import { TiledStarPointSetCache } from '../candidate/src/algorithm32/caches/celestial/TiledStarPointSetCache.js';
import { TiledStarPointSetGpuCacheController } from '../candidate/src/algorithm32/caches/celestial/TiledStarPointSetGpuCacheController.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';

function syntheticSource(members) {
	const goldenAngle = Math.PI * (3 - Math.sqrt(5));
	return {
		describeStaticIdentity: () => ({ sourceId: 'browser-structural-stellar-roster', kind: 'catalog-point-set', packetPolicy: 'browser-structural-v1' }),
		createTransportMembers: () => members.map((member) => ({ memberId: member.memberId, sourceIrradiance: { contentHash: `synthetic:${member.memberId}` } })),
		describeCanonicalPointDirections: () => members.map((member, index) => {
			const z = 1 - 2 * ((index + 0.5) / members.length);
			const radius = Math.sqrt(Math.max(0, 1 - z * z));
			const azimuth = index * goldenAngle;
			return {
				memberId: member.memberId,
				frameId: 'celestial-rh-v1',
				direction: [radius * Math.cos(azimuth), radius * Math.sin(azimuth), z],
			};
		}),
	};
}

/** Exercise the normal Three cache executor over the full fixed star layout. */
export async function runStellarTiledCacheBrowserProof() {
	const report = async (stage) => { if (typeof globalThis.a32StellarCacheProgress === 'function') await globalThis.a32StellarCacheProgress(stage); };
	await report('function-entered');
	const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false });
	const backend = new ThreeCacheBackend({ THREE, renderer });
	await report('context-ready');
	const directionCount = 11, positionCount = 13, wavelengthCount = 15;
	const members = Array.from({ length: 500 }, (_, index) => ({ memberId: `browser-star-${String(index).padStart(3, '0')}` }));
	const fields = new Map(members.map((member, memberIndex) => {
		const data = new Float64Array(directionCount * positionCount * wavelengthCount);
		for (let h = 0; h < positionCount; h += 1) for (let u = 0; u < directionCount; u += 1) for (let wavelength = 0; wavelength < wavelengthCount; wavelength += 1) data[((h * directionCount + u) * wavelengthCount) + wavelength] = (memberIndex + 1) * 1e-7 + (h + 1) * 1e-9 + (u + 1) * 1e-11 + (wavelength + 1) * 1e-13;
		return [member.memberId, { data }];
	}));
	await report('raw-member-fields-ready');
	const tiledCache = new TiledStarPointSetCache({ source: syntheticSource(members), pointCache: { members, memberFields: fields, domain: { uNodes: Array.from({ length: directionCount }, (_, index) => index), altitudeNodesMeters: Array.from({ length: positionCount }, (_, index) => index) }, channelCount: wavelengthCount, fieldIdentity: 'browser-structural-point-field-v1' } });
	await report('tiled-cache-packed');
	let schedulerYieldCount = 0;
	const controller = new TiledStarPointSetGpuCacheController({
		backend,
		scheduler: {
			yieldControl: async () => {
				schedulerYieldCount += 1;
				await report(`submitted-layer-${schedulerYieldCount}`);
				await new Promise((resolve) => setTimeout(resolve, 0));
			},
		},
	});
	try {
		await report('tiled-cache-prepared');
		const cache = await controller.build({ tiledCache });
		await report('cache-build-complete');
		const probes = [
			{ memberIndex: 0, u: 0, h: 0, wavelengthIndex: 0 }, { memberIndex: 237, u: 5, h: 6, wavelengthIndex: 7 }, { memberIndex: 499, u: 10, h: 12, wavelengthIndex: 14 },
		].map((probe) => ({ ...probe, directionIndex: (probe.memberIndex % 32) * directionCount + probe.u, positionIndex: Math.floor(probe.memberIndex / 32) * positionCount + probe.h }));
		const readback = await cache.readSelectedScalars(backend, probes.map(({ directionIndex, positionIndex, wavelengthIndex }) => ({ directionIndex, positionIndex, wavelengthIndex })));
		await report('readback-complete');
		let maximumError = 0; for (let index = 0; index < probes.length; index += 1) { const probe = probes[index]; const memberId = members[probe.memberIndex].memberId; maximumError = Math.max(maximumError, Math.abs(readback.samples[index].value - tiledCache.read(memberId, probe.u, probe.h, probe.wavelengthIndex))); }
		const active = controller.active; const allocateField = backend.allocateField.bind(backend); backend.allocateField = () => { throw new Error('injected tiled-star allocation failure'); }; controller._activeIdentity = 'force-staging-failure'; let failurePreserved = false;
		try { await controller.build({ tiledCache }); } catch (error) { failurePreserved = /injected tiled-star allocation failure/u.test(String(error.message)) && controller.active === active; } finally { backend.allocateField = allocateField; }
		return { capabilities: backend.capabilities, resource: cache._artifact.result.storage, maximumError, readbackCount: readback.samples.length, cacheRenderPassCount: cache._artifact.diagnostics.passes.length, cacheRenderSubmissionCount: wavelengthCount, schedulerYieldCount, unusedTilesZero: tiledCache.isUnusedTileZero(), failurePreserved };
	} finally { controller.dispose(); backend.dispose(); renderer.dispose(); }
}
