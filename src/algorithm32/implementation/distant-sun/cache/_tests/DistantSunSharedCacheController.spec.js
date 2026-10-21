import DistantSunSharedCacheController from '../DistantSunSharedCacheController.js';
import DistantSunSharedCachePackage from '../DistantSunSharedCachePackage.js';
import DistantSunSharedCacheSupport from '../DistantSunSharedCacheSupport.js';
import {DISTANT_SUN_SHARED_CACHE_PACKET_BLOCK_SCHEMA_ID, DISTANT_SUN_SHARED_CACHE_PACKET_BYTES} from '../consts.js';

describe('Shared-cache residency and publication', () => {
	let fixture;
	afterEach(() => fixture?.controller.dispose());

	it('rejects both legacy/focused package and lookup mismatches before allocation', /** Called by Jasmine to prove explicit package-policy pairing. */ () => {
		fixture = createFixture();
		expect(
			() =>
				new DistantSunSharedCacheController({...fixture.definition, scatteringAccuracy: 'corrected60-sun035'}),
		).toThrowError(/scattering policies differ/u);
		fixture.graph.configuration.scatteringAccuracy = 'corrected60-sun035';
		expect(() => new DistantSunSharedCacheController({...fixture.definition})).toThrowError(
			/scattering policies differ/u,
		);
		expect(fixture.backend.liveArrays).toBe(0);
	});

	it('preserves the focused mapping through publication, darkness and restoration', /** Called by Jasmine to exercise candidate lifecycle with the existing resource owner. */ async () => {
		fixture = createFixture(true, true, true, 'corrected60-sun035');
		expect(await fixture.controller.requestScene(0)).toBeTrue();
		expect(fixture.controller.publishFrame().scatteringAccuracy).toBe('corrected60-sun035');
		expect(await fixture.controller.requestScene(null)).toBeTrue();
		expect(fixture.controller.publishFrame().scatteringAccuracy).toBe('corrected60-sun035');
		expect(fixture.controller.publishFrame().snapshot.status).toBe('dark');
		expect(await fixture.controller.requestScene(1)).toBeTrue();
		expect(fixture.controller.publishFrame().scatteringAccuracy).toBe('corrected60-sun035');
		fixture.backend.lose();
		expect(fixture.controller.publishFrame()).toBeUndefined();
		fixture.backend.restore();
		expect(await fixture.controller.requestScene(1)).toBeTrue();
		expect(fixture.controller.publishFrame().scatteringAccuracy).toBe('corrected60-sun035');
	});

	it('rejects a missing interior cubic neighbor before any atlas allocation', /** Called by Jasmine to prove complete-stencil admission. */ () => {
		fixture = createFixture();
		expect(
			/** Called by Jasmine to exercise missing cubic support. */ () =>
				new DistantSunSharedCacheSupport({
					blockIndex: {blocks: [{id: 'center', coordinates: [[0, 1]]}]},
					scenes: [
						{
							id: 'missing-neighbor',
							requiredBlockIds: ['center'],
							ledger: {rows: [{altitudeIndex: 0, firstSolarZenithIndex: 1, lastSolarZenithIndex: 1}]},
						},
					],
				}),
		).toThrowError(/omits interior coordinate 0:0/u);
		expect(fixture.backend.liveArrays).toBe(0);
	});

	it('supersedes an isolated preparation without ever allocating a third atlas', /** Called by Jasmine to prove peak residency and last-good publication across cancellation. */ async () => {
		fixture = createFixture(true);
		await fixture.controller.requestScene(0);
		const first = fixture.controller.publishFrame();
		fixture.defer = true;
		const stale = fixture.controller.requestScene(60);
		const newest = fixture.controller.requestScene(80);
		expect(fixture.controller.publishFrame()).toBe(first);
		expect(fixture.backend.maximumLiveArrays).toBeLessThanOrEqual(2);
		fixture.defer = false;
		fixture.resolvePending();
		expect(await stale).toBeFalse();
		expect(await newest).toBeTrue();
		expect(fixture.controller.publishFrame().snapshot.sceneOrdinal).toBe(80);
		expect(fixture.backend.maximumLiveArrays).toBe(2);
		expect(fixture.backend.liveArrays).toBe(1);
	});

	it('publishes complete cubic support through forward and reverse scene traversal', async () => {
		fixture = createFixture(true, true, true);
		const route = [0, 1, 2, 1, 0];
		fixture.controller.setRoute(route);
		let previous;
		for (const [routeIndex, ordinal] of route.entries()) {
			expect(await fixture.controller.requestScene(ordinal, {routeIndex})).toBeTrue();
			if (previous) expect(fixture.controller.diagnostics().sceneOrdinal).toBe(previous.snapshot.sceneOrdinal);
			const frame = fixture.controller.publishFrame();
			expect(frame.solarInterpolation).toBe('monotone-cubic');
			expect(frame.snapshot.sceneOrdinal).toBe(ordinal);
			const table = frame.metadataTextures.find(
				(texture) => texture.valueKey === 'cache.sharedCoordinateAddress',
			);
			for (const row of fixture.graph.scenes[ordinal].ledger.rows) {
				for (
					let zenith = Math.max(0, row.firstSolarZenithIndex - 1);
					zenith <= row.lastSolarZenithIndex + 1;
					zenith++
				) {
					const address = (row.altitudeIndex * table.storage.width + zenith) * 2;
					const slot = frame.snapshot.residentSlots.find(
						(entry) => entry.slotIndex === table.values[address],
					);
					expect(slot).toBeDefined();
					expect(frame.snapshot.requiredBlockIds).toContain(slot.logicalBlockId);
					const block = fixture.graph.blockIndex.blocks.find((entry) => entry.id === slot.logicalBlockId);
					expect(block.coordinates[table.values[address + 1]]).toEqual([row.altitudeIndex, zenith]);
				}
			}
			expect(fixture.backend.liveArrays).toBe(1);
			expect(fixture.backend.liveMetadata).toBe(3);
			previous = frame;
		}
	});

	it('preloads complete required rows and changes prepared scenes without requests or packet uploads', async () => {
		fixture = createFixture();
		expect(await fixture.controller.requestScene(0)).toBeTrue();
		expect(fixture.controller.diagnostics().sceneOrdinal).toBeNull();
		const first = fixture.controller.publishFrame();
		expect(first.snapshot.requiredBlockIds.length).toBe(18);
		expect(fixture.backend.uploads).toBe(18);
		const rows = first.snapshot.rowAddressTable;
		for (const [packedRow, coordinate] of fixture.graph.scenes[0].coordinates.entries()) {
			const slotIndex = rows.values[packedRow * 2];
			const blockRow = rows.values[packedRow * 2 + 1];
			const resident = first.snapshot.residentSlots.find((slot) => slot.slotIndex === slotIndex);
			const block = fixture.graph.blockIndex.blocks.find((item) => item.id === resident.logicalBlockId);
			expect(block.coordinates[blockRow]).toEqual(coordinate);
		}
		expect(Array.from(first.snapshot.altitudeLedgerTable.values.slice(47 * 4, 48 * 4))).toEqual([
			0,
			23,
			47 * 24,
			0,
		]);
		const requests = fixture.requests;
		expect(await fixture.controller.requestScene(1)).toBeTrue();
		const second = fixture.controller.publishFrame();
		expect(second.snapshot.sceneOrdinal).toBe(1);
		expect(second.atlas).toBe(first.atlas);
		expect(fixture.requests).toBe(requests);
		expect(fixture.backend.uploads).toBe(18);
		expect(fixture.activePins).toBe(18);
	});

	it('holds every published slot when a distant jump exceeds the admitted transition memory', async () => {
		fixture = createFixture();
		await fixture.controller.requestScene(0);
		const first = fixture.controller.publishFrame();
		expect(await fixture.controller.requestScene(60)).toBeFalse();
		expect(fixture.controller.publishFrame()).toBe(first);
		expect(fixture.backend.uploads).toBe(18);
		expect(fixture.activePins).toBe(18);
		expect(fixture.controller.diagnostics().lastError).toContain('transition budget');
	});

	it('prioritizes visible and requested blocks, then deterministically evicts obsolete layers for prediction', async () => {
		fixture = createFixture(false, true);
		fixture.controller.setRoute([0, 1, 2]);
		await fixture.controller.requestScene(0, {routeIndex: 0});
		expect(fixture.backend.uploads).toBe(24);
		fixture.controller.publishFrame();
		await fixture.controller.requestScene(1, {routeIndex: 1});
		fixture.controller.publishFrame();
		expect(fixture.backend.uploads).toBe(24);
		expect(fixture.backend.liveArrays).toBe(1);
		// After the frame releases obsolete visible pins, refill the future window.
		await fixture.controller.requestScene(1, {routeIndex: 1});
		fixture.controller.publishFrame();
		expect(fixture.backend.uploads).toBe(30);
		const requests = fixture.requests;
		await fixture.controller.requestScene(2, {routeIndex: 2});
		expect(fixture.controller.publishFrame().snapshot.sceneOrdinal).toBe(2);
		expect(fixture.requests).toBe(requests);
		expect(fixture.backend.uploads).toBe(30);
	});

	it('prepares a qualified isolated jump and releases the prior atlas only after complete publication', async () => {
		fixture = createFixture(true);
		await fixture.controller.requestScene(0);
		const first = fixture.controller.publishFrame();
		await fixture.controller.requestScene(60);
		expect(fixture.backend.liveArrays).toBe(2);
		expect(fixture.activePins).toBe(36);
		expect(first.snapshot.sceneOrdinal).toBe(0);
		const next = fixture.controller.publishFrame();
		expect(next.snapshot.sceneOrdinal).toBe(60);
		expect(next.atlas).not.toBe(first.atlas);
		expect(fixture.backend.liveArrays).toBe(1);
		expect(fixture.activePins).toBe(18);
	});

	it('preserves last-good pins and metadata after a failed isolated upload', async () => {
		fixture = createFixture(true);
		await fixture.controller.requestScene(0);
		const first = fixture.controller.publishFrame();
		fixture.backend.failAtUpload = 22;
		expect(await fixture.controller.requestScene(60)).toBeFalse();
		expect(fixture.controller.publishFrame()).toBe(first);
		expect(fixture.activePins).toBe(18);
		expect(fixture.backend.liveArrays).toBe(1);
		expect(fixture.backend.liveMetadata).toBe(2);
	});

	it('rejects stale completion after darkness and never allocates textures for an initial dark state', async () => {
		fixture = createFixture(true);
		fixture.defer = true;
		const stale = fixture.controller.requestScene(0);
		expect(await fixture.controller.requestScene(null)).toBeTrue();
		expect(fixture.controller.publishFrame().snapshot.status).toBe('dark');
		fixture.resolvePending();
		expect(await stale).toBeFalse();
		expect(fixture.controller.publishFrame().snapshot.status).toBe('dark');
		expect(fixture.backend.liveArrays).toBe(0);
		expect(fixture.activePins).toBe(0);
		fixture.controller.dispose();
		fixture = createFixture();
		await fixture.controller.requestScene(null);
		expect(fixture.controller.publishFrame().bindings).toEqual([]);
		expect(fixture.backend.liveArrays).toBe(0);
	});

	it('keeps catalog scene 108 available below the separate input-angle darkness boundary', async () => {
		fixture = createFixture();
		expect(await fixture.controller.requestScene(108)).toBeTrue();
		const frame = fixture.controller.publishFrame();
		expect(frame.snapshot.status).toBe('ready');
		expect(frame.snapshot.sceneOrdinal).toBe(108);
		expect(frame.snapshot.requiredBlockIds.length).toBe(18);
		expect(await fixture.controller.requestScene(null)).toBeTrue();
		expect(fixture.controller.publishFrame().snapshot.status).toBe('dark');
	});

	it('invalidates lost generations and reuploads a complete scene after restoration', async () => {
		fixture = createFixture();
		await fixture.controller.requestScene(0);
		fixture.controller.publishFrame();
		fixture.backend.lose();
		expect(fixture.controller.publishFrame()).toBeUndefined();
		fixture.backend.restore();
		expect(await fixture.controller.requestScene(1)).toBeTrue();
		expect(fixture.controller.publishFrame().snapshot.sceneOrdinal).toBe(1);
		expect(fixture.backend.uploads).toBe(36);
		expect(fixture.activePins).toBe(18);
	});

	it('uses route position and reversal, cancels superseded work, and disposes pending pins', async () => {
		fixture = createFixture(true);
		fixture.controller.setRoute([3, 2, 3, 4]);
		await fixture.controller.requestScene(3, {routeIndex: 0, velocityDegreesPerSecond: -1});
		expect(fixture.controller.diagnostics().predictedScene).toBe(2);
		fixture.controller.publishFrame();
		await fixture.controller.requestScene(3, {routeIndex: 2});
		expect(fixture.controller.diagnostics().predictedScene).toBe(4);
		fixture.defer = true;
		const pending = fixture.controller.requestScene(60);
		fixture.controller.dispose();
		fixture.resolvePending();
		expect(await pending).toBeFalse();
		expect(fixture.activePins).toBe(0);
		expect(fixture.backend.liveArrays).toBe(0);
		expect(fixture.backend.liveMetadata).toBe(0);
	});

	it('rejects unqualified larger or transition allocations before allocating GPU storage', () => {
		fixture = createFixture();
		expect(
			() =>
				new DistantSunSharedCacheController({
					...fixture.definition,
					layers: 62,
					maximumGpuBytes: 62 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
				}),
		).toThrowError(/qualification/u);
		expect(
			() =>
				new DistantSunSharedCacheController({
					...fixture.definition,
					maximumGpuBytes: 48 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
				}),
		).toThrowError(/qualification/u);
		expect(fixture.backend.liveArrays).toBe(0);
	});

	it('rejects metadata origin, path, allocation, truncation, and hash failures before graph continuation', async () => {
		const previous = Object.getOwnPropertyDescriptor(globalThis, 'location');
		Object.defineProperty(globalThis, 'location', {value: {origin: 'http://localhost'}, configurable: true});
		let requests = 0;
		const request = {
			rootUrl: 'http://localhost/assets/',
			report: {path: 'package-set.json', byteLength: 2, sha256: 'a'.repeat(64)},
			signal: new AbortController().signal,
			fetch: async () => {
				requests += 1;
				return new Response('{}');
			},
		};
		try {
			await expectAsync(
				DistantSunSharedCachePackage.load({...request, rootUrl: 'http://outside/assets/'}),
			).toBeRejectedWithError(/same-origin/u);
			await expectAsync(
				DistantSunSharedCachePackage.load({...request, report: {...request.report, path: '../root'}}),
			).toBeRejectedWithError(/identity/u);
			await expectAsync(
				DistantSunSharedCachePackage.load({
					...request,
					report: {...request.report, byteLength: 40 * 1024 * 1024},
				}),
			).toBeRejectedWithError(/bound/u);
			expect(requests).toBe(0);
			await expectAsync(DistantSunSharedCachePackage.load(request)).toBeRejectedWithError(/hash/u);
			await expectAsync(
				DistantSunSharedCachePackage.load({...request, report: {...request.report, byteLength: 3}}),
			).toBeRejectedWithError(/length/u);
		} finally {
			if (previous) Object.defineProperty(globalThis, 'location', previous);
			else delete globalThis.location;
		}
	});
});

/** Creates a deterministic independent coordinate oracle and resource-accounting capabilities. */
function createFixture(transition = false, sliding = false, cubic = false, scatteringAccuracy = undefined) {
	const blocks = [];
	for (const base of cubic ? [0, 40] : [0, 48])
		for (let altitude = 0; altitude < 48; altitude += 8)
			for (let zenith = base; zenith < base + (sliding ? 40 : 24); zenith += 8) {
				const coordinates = [];
				for (let a = altitude; a < altitude + 8; a++)
					for (let z = zenith; z < zenith + 8; z++) coordinates.push([a, z]);
				blocks.push({
					id: `block:${altitude}:${zenith}`,
					coordinates,
					rowCount: 64,
					decoded: {sha256: (blocks.length + 1).toString(16).padStart(64, '0')},
				});
			}
	const scenes = Array.from({length: 109}, (_, ordinal) => {
		const base = ordinal >= 50 ? 48 : sliding && ordinal <= 2 ? ordinal * 8 : 0;
		const rowWidth = cubic ? 16 : 24;
		const coordinates = [],
			rows = [];
		for (let altitude = 0; altitude < 48; altitude++) {
			rows.push({
				altitudeIndex: altitude,
				firstSolarZenithIndex: base,
				lastSolarZenithIndex: base + rowWidth - 1,
				firstPackedRow: coordinates.length,
			});
			for (let z = base; z < base + rowWidth; z++) coordinates.push([altitude, z]);
		}
		return {
			coordinates,
			ledger: {rows},
			requiredBlockIds: blocks
				.filter((block) => block.coordinates[0][1] >= base && block.coordinates[0][1] < base + rowWidth)
				.map((block) => block.id),
		};
	});
	const graph = {
		blockIndex: {blocks},
		scenes,
		logicalToUniqueIndex: new Uint16Array(),
		configuration: {scatteringAccuracy, directionLayout: {logicalToUniqueIndex: {sha256: 'b'.repeat(64)}}},
	};
	const values = new Float32Array(DISTANT_SUN_SHARED_CACHE_PACKET_BYTES / 4);
	const fixture = {graph, activePins: 0, requests: 0, defer: false};
	const pending = [];
	fixture.resolvePending = () => {
		for (const resolve of pending.splice(0)) resolve();
	};
	const transport = {
		request: async ({block}) => {
			fixture.requests += 1;
			if (fixture.defer) await new Promise((resolve) => pending.push(resolve));
			fixture.activePins += 1;
			let released = false;
			return {
				packet: {
					schemaId: DISTANT_SUN_SHARED_CACHE_PACKET_BLOCK_SCHEMA_ID,
					logicalBlockId: block.id,
					decodedSha256: block.decoded.sha256,
					blockRowCount: 64,
					values,
					storage: {format: 'RGBA32F', width: 648, height: 1728, layers: 1, xFastest: true, flipY: false},
				},
				repin: () => {
					if (released) throw Error('Released pin');
				},
				release: () => {
					if (!released) {
						released = true;
						fixture.activePins -= 1;
					}
				},
			};
		},
	};
	const states = new Map();
	const backend = {
		liveArrays: 0,
		maximumLiveArrays: 0,
		liveMetadata: 0,
		uploads: 0,
		failAtUpload: Infinity,
		allocatePersistentArray: (request) => {
			backend.liveArrays += 1;
			backend.maximumLiveArrays = Math.max(backend.maximumLiveArrays, backend.liveArrays);
			const handle = {
				...request,
				runtimeBinding: {valueKey: request.valueKey},
				dispose: () => {
					if (states.delete(handle)) backend.liveArrays -= 1;
				},
			};
			states.set(handle, {generation: 1, unavailable: false, protectedLayers: [], layerIdentities: []});
			return handle;
		},
		getPersistentArrayState: (array) => states.get(array),
		protectPersistentArrayLayers: (array, layers) => {
			states.get(array).protectedLayers = layers;
		},
		uploadPersistentArrayLayer: ({array, layer, identity}) => {
			const state = states.get(array);
			if (state.unavailable || state.protectedLayers.includes(layer))
				throw Error('Protected or unavailable slot');
			backend.uploads += 1;
			if (backend.uploads === backend.failAtUpload) throw Error('Injected upload failure');
			state.layerIdentities[layer] = identity;
		},
		uploadImmutableTexture: (request) => {
			backend.liveMetadata += 1;
			let disposed = false;
			return {
				...request,
				runtimeBinding: {valueKey: request.valueKey},
				dispose: () => {
					if (!disposed) {
						disposed = true;
						backend.liveMetadata -= 1;
					}
				},
			};
		},
		lose: () => {
			for (const state of states.values()) {
				state.generation += 1;
				state.unavailable = true;
			}
		},
		restore: () => {
			for (const state of states.values()) {
				state.unavailable = false;
				state.protectedLayers = [];
				state.layerIdentities = [];
			}
		},
	};
	fixture.backend = backend;
	fixture.definition = {
		solarInterpolation: cubic ? 'monotone-cubic' : undefined,
		scatteringAccuracy,
		backend,
		transport,
		package: {getGraph: () => graph, getBlockUrl: (id) => `http://localhost/${id}`},
		maximumGpuBytes: (transition ? 48 : 24) * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
		transitionQualification: transition
			? {
					evidenceId: 'test-proof',
					targetId: 'test-target',
					maximumBytes: 48 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
				}
			: undefined,
	};
	fixture.controller = new DistantSunSharedCacheController(fixture.definition);
	return fixture;
}
