import {Registry} from '@polylith/core';
import {StellarCatalog} from '../stellar-catalog.js';

describe('Application stellar catalog', () => {
	it('returns the loaded Polaris catalog direction without exposing its retained tuple', () => {
		const catalog = new StellarCatalog(new Registry());
		catalog.start();
		const direction = [0.01, 0.01, 0.9999];
		catalog.resources = {source: {celestialSourceDefinition: {members: [{id: 'bsc-v50-hr-424', direction}]}}};
		const result = catalog.getDirection('bsc-v50-hr-424');
		expect(result).toEqual(direction);
		result[0] = 0.5;
		expect(catalog.getDirection('bsc-v50-hr-424')).toEqual(direction);
	});
	it('shares in-flight source loading, cancels only the caller, and reuses the completed catalog', async () => {
		let catalog = new StellarCatalog(new Registry());
		catalog.start();
		let resolve;
		let source = {source: {id: 'authenticated-2000'}, presentationFilters: {id: 'human'}};
		let load = spyOn(catalog, '_load').and.returnValue(
			new Promise((accept) => {
				resolve = accept;
			}),
		);
		let first = new AbortController();
		let cancelled = catalog.load(first.signal).catch((error) => error);
		let second = catalog.load();
		first.abort();
		expect((await cancelled).name).toBe('AbortError');
		resolve(source);
		expect(await second).toBe(source);
		expect(await catalog.load()).toBe(source);
		expect(load).toHaveBeenCalledTimes(1);
		catalog.stop();
	});

	it('retries failures and rejects a stopped lifetime before it can publish stale data', async () => {
		let catalog = new StellarCatalog(new Registry());
		catalog.start();
		let resolve;
		let load = spyOn(catalog, '_load').and.rejectWith(new Error('missing package'));
		await expectAsync(catalog.load()).toBeRejectedWithError('missing package');
		load.and.returnValue(
			new Promise((accept) => {
				resolve = accept;
			}),
		);
		let old = catalog.load().catch((error) => error);
		catalog.stop();
		let source = {source: {id: 'new lifetime'}, presentationFilters: {id: 'human'}};
		load.and.resolveTo(source);
		expect(await catalog.load()).toBe(source);
		resolve({id: 'old lifetime'});
		expect((await old).name).toBe('AbortError');
		expect(await catalog.load()).toBe(source);
	});

	it('uses app-relative IO routes, authenticates payloads and rejects unsafe manifest paths', async () => {
		let catalog = new StellarCatalog(new Registry());
		catalog.start();
		let bytes = new Uint8Array([1, 2, 3]).buffer;
		let digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
		let sha256 = Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
		let request = jasmine.createSpy('request').and.resolveTo(new Response(bytes));
		catalog.io = {request};
		let signal = new AbortController().signal;
		let artifact = {path: 'members.bin', byteLength: 3, sha256};
		expect(new Uint8Array(await catalog._artifact('stellar-catalogs/package/', artifact, signal))).toEqual(
			new Uint8Array(bytes),
		);
		expect(request).toHaveBeenCalledWith('stellar-catalogs/package/members.bin', {
			signal,
			headers: {Accept: 'application/octet-stream'},
		});
		request.and.callFake(async () => new Response(bytes));
		await expectAsync(
			catalog._artifact('package/', {...artifact, sha256: 'invalid'}, signal),
		).toBeRejectedWithError(/authentication/);
		for (let path of ['../private.json', 'https://other.test/file.json', '/file.json', 'nested/file.bin']) {
			await expectAsync(catalog._artifact('package/', {...artifact, path}, signal)).toBeRejectedWithError(
				/invalid artifact path/,
			);
		}
	});

	it('enables Algorithm32 human filters in Flat32 order with the same strengths and shared lifetime', async () => {
		let catalog = new StellarCatalog(new Registry());
		catalog.start();
		let source = {id: 'authenticated-2000'};
		spyOn(catalog, '_loadStars').and.resolveTo(source);
		spyOn(catalog, '_loadHumanVision').and.resolveTo(Array(15).fill(1));
		let resources = await catalog.load();
		expect(resources.source).toBe(source);
		expect((await catalog.load()).presentationFilters).toBe(resources.presentationFilters);
		expect(resources.presentationFilters.filters).toEqual([
			{
				id: 'human-mesopic-luminance-v1',
				order: 0,
				stage: 'source-linear',
				target: 'stellar',
				enabled: true,
				parameters: jasmine.objectContaining({maximumRodContribution: 0.5}),
			},
			{
				id: 'human-low-light-chroma-v1',
				order: 1,
				stage: 'source-linear',
				target: 'stellar',
				enabled: true,
				parameters: jasmine.objectContaining({maximumChromaRetention: 0.65}),
			},
		]);
		let metadata = {
			target: 'stellar',
			adaptationLuminanceCdM2: 0.001,
			transportedNative15: Array(15).fill(0.01),
			visualMagnitude: 6,
		};
		let faint = resources.presentationFilters.applySourceLinear([1, 0, 0], metadata);
		expect(faint[0]).toBeCloseTo(faint[1], 12);
		expect(faint[1]).toBeCloseTo(faint[2], 12);
		let bright = resources.presentationFilters.applySourceLinear([1, 0, 0], {...metadata, visualMagnitude: 0});
		expect(bright[0]).toBeGreaterThan(bright[1]);
	});

	it('authenticates the human package identity and validates its decoded weights at the transport boundary', async () => {
		let catalog = new StellarCatalog(new Registry());
		catalog.start();
		let manifest = {
			schemaId: 'algorithm32-production-human-vision-filter-package-v1',
			packageId: 'human-vision-filter-package-v1',
			parents: {sourceSha256: '6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759'},
			artifact: {
				path: 'native15-scotopic-weights.json',
				byteLength: 0,
				sha256: '85e1d15c93e849550dbe84fdf1df000565eda0f57ac6e10210b5ee200bc91a09',
			},
		};
		let request = jasmine.createSpy('request').and.callFake(async () => new Response(JSON.stringify(manifest)));
		catalog.io = {request};
		let bytes = new TextEncoder().encode(JSON.stringify({values: Array(15).fill(1)})).buffer;
		let artifact = spyOn(catalog, '_artifact').and.resolveTo(bytes);
		let signal = new AbortController().signal;
		expect(await catalog._loadHumanVision(signal)).toEqual(Array(15).fill(1));
		expect(request).toHaveBeenCalledWith('presentation-filters/human-vision-filter-package-v1/manifest.json', {
			signal,
		});
		manifest.parents.sourceSha256 = 'wrong-source';
		await expectAsync(catalog._loadHumanVision(signal)).toBeRejectedWithError(/identity/);
		manifest.parents.sourceSha256 = '6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759';
		artifact.and.resolveTo(new TextEncoder().encode(JSON.stringify({values: [1, -1]})).buffer);
		await expectAsync(catalog._loadHumanVision(signal)).toBeRejectedWithError(/fifteen finite nonnegative/);
	});
});
