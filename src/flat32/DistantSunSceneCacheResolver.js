const RUNTIME_CATALOG_SCHEMA = 'algorithm32-distant-sun-runtime-catalog-v1';

function requireBaseUrl(assetBaseUrl) {
	if (typeof assetBaseUrl !== 'string' || assetBaseUrl.length === 0) {
		throw new TypeError('Distant-Sun scene-cache asset base URL is required.');
	}
	return assetBaseUrl.endsWith('/') ? assetBaseUrl : `${assetBaseUrl}/`;
}

function requireCatalog(catalog) {
	if (
		catalog?.schemaId !== RUNTIME_CATALOG_SCHEMA ||
		catalog.accepted !== true ||
		!Array.isArray(catalog.packages) ||
		catalog.packages.length === 0
	) {
		throw new TypeError('Distant-Sun runtime catalog is incompatible.');
	}
	const binning = catalog.binning;
	if (
		binning?.kind !== 'ledger-covered-nearest-integer-half-up-v1' ||
		!Number.isInteger(binning.startSolarZenithDegrees) ||
		!Number.isInteger(binning.endSolarZenithDegrees) ||
		binning.incrementDegrees !== 1 ||
		binning.minimumInputDegrees !== binning.startSolarZenithDegrees ||
		binning.maximumInputExclusiveDegrees !== catalog.darkFromSolarZenithDegrees ||
		catalog.darkFromSolarZenithDegrees !== binning.endSolarZenithDegrees ||
		catalog.packages.length !== binning.endSolarZenithDegrees - binning.startSolarZenithDegrees + 1
	) {
		throw new TypeError('Distant-Sun runtime catalog binning is incompatible.');
	}
	for (let index = 0; index < catalog.packages.length; index += 1) {
		const expectedDegrees = binning.startSolarZenithDegrees + index;
		const entry = catalog.packages[index];
		const expectedMinimumDegrees = Math.max(binning.minimumInputDegrees, expectedDegrees - 0.5);
		const expectedMaximumDegrees =
			expectedDegrees === binning.endSolarZenithDegrees
				? binning.maximumInputExclusiveDegrees
				: expectedDegrees + 0.5;
		if (
			entry?.representativeSolarZenithDegrees !== expectedDegrees ||
			entry.minimumInputDegrees !== expectedMinimumDegrees ||
			entry.maximumInputExclusiveDegrees !== expectedMaximumDegrees ||
			typeof entry.assetPath !== 'string' ||
			!entry.assetPath.startsWith('packages/') ||
			!entry.assetPath.endsWith('/') ||
			typeof entry.manifestPath !== 'string' ||
			!/^scene-cache-manifest-[a-f0-9]{64}\.json$/u.test(entry.manifestPath) ||
			entry.manifestSha256 !== entry.manifestPath.slice(21, -5) ||
			typeof entry.cacheIdentity !== 'string' ||
			!entry.expected?.sceneSun
		) {
			throw new TypeError(`Distant-Sun runtime catalog entry ${index} is incompatible.`);
		}
	}
	return catalog;
}

/** Resolve one finite observer solar-zenith scalar through an accepted runtime catalog. */
export function resolveDistantSunSceneCache(catalogValue, solarZenithDegrees, assetBaseUrl = 'scene-caches/') {
	const catalog = requireCatalog(catalogValue);
	const base = requireBaseUrl(assetBaseUrl);
	if (!Number.isFinite(solarZenithDegrees)) {
		throw new TypeError('Distant-Sun scene-cache resolver requires a finite solar-zenith angle in degrees.');
	}
	if (solarZenithDegrees < 0 || solarZenithDegrees > 180) {
		throw new RangeError('Distant-Sun solar-zenith angle must be between 0 and 180 degrees.');
	}
	if (catalog.darkFromSolarZenithDegrees !== undefined && solarZenithDegrees >= catalog.darkFromSolarZenithDegrees) {
		return Object.freeze({
			status: /** @type {const} */ ('dark'),
			requestedSolarZenithDegrees: solarZenithDegrees,
		});
	}
	const binning = catalog.binning;
	if (
		solarZenithDegrees < binning.minimumInputDegrees ||
		solarZenithDegrees >= binning.maximumInputExclusiveDegrees
	) {
		return Object.freeze({
			status: /** @type {const} */ ('unsupported'),
			requestedSolarZenithDegrees: solarZenithDegrees,
		});
	}
	const representativeSolarZenithDegrees = Math.floor(solarZenithDegrees + 0.5);
	const entry = catalog.packages[representativeSolarZenithDegrees - binning.startSolarZenithDegrees];
	if (solarZenithDegrees < entry.minimumInputDegrees || solarZenithDegrees >= entry.maximumInputExclusiveDegrees) {
		throw new RangeError('Distant-Sun runtime catalog does not cover the selected scalar angle.');
	}
	return Object.freeze({
		status: /** @type {const} */ ('ready'),
		requestedSolarZenithDegrees: solarZenithDegrees,
		representativeSolarZenithDegrees,
		asset: Object.freeze({
			assetRoot: `${base}${entry.assetPath}`,
			loadRequest: Object.freeze({
				manifestPath: entry.manifestPath,
				manifestSha256: entry.manifestSha256,
				cacheIdentity: entry.cacheIdentity,
				expected: entry.expected,
			}),
		}),
	});
}

/** Create the production scalar resolver over one already-loaded generated catalog. */
export function createDistantSunSceneCacheCatalogResolver(catalog, assetBaseUrl = 'scene-caches/') {
	requireCatalog(catalog);
	requireBaseUrl(assetBaseUrl);
	return (solarZenithDegrees) => resolveDistantSunSceneCache(catalog, solarZenithDegrees, assetBaseUrl);
}

function requireResolution(value) {
	if (
		value?.status === 'ready' &&
		Number.isFinite(value.requestedSolarZenithDegrees) &&
		Number.isInteger(value.representativeSolarZenithDegrees) &&
		typeof value.asset?.assetRoot === 'string' &&
		typeof value.asset?.loadRequest?.manifestPath === 'string' &&
		typeof value.asset?.loadRequest?.manifestSha256 === 'string' &&
		typeof value.asset?.loadRequest?.cacheIdentity === 'string' &&
		value.asset?.loadRequest?.expected?.sceneSun
	) {
		return value;
	}
	if (
		(value?.status === 'dark' || value?.status === 'unsupported') &&
		Number.isFinite(value.requestedSolarZenithDegrees)
	) {
		return value;
	}
	throw new TypeError('Distant-Sun cache-resolution response is incompatible.');
}

/** Create the browser client for the production scalar-solar-zenith endpoint. */
export function createDistantSunSceneCacheHttpResolver(
	endpointUrl = 'api/distant-sun-scene-cache',
	fetchImplementation = globalThis.fetch,
) {
	if (typeof endpointUrl !== 'string' || endpointUrl.length === 0) {
		throw new TypeError('Distant-Sun cache-resolution endpoint URL is required.');
	}
	if (typeof fetchImplementation !== 'function') {
		throw new TypeError('Distant-Sun cache-resolution fetch implementation is required.');
	}
	return async (solarZenithDegrees, request = {}) => {
		if (!Number.isFinite(solarZenithDegrees)) {
			throw new TypeError('Distant-Sun scene-cache resolver requires a finite solar-zenith angle in degrees.');
		}
		const url = new URL(endpointUrl, globalThis.location?.href ?? 'http://localhost/');
		url.searchParams.set('solarZenithDegrees', String(solarZenithDegrees));
		const response = await fetchImplementation(url, {
			method: 'GET',
			headers: {accept: 'application/json'},
			signal: request.signal,
		});
		if (!response.ok) {
			throw new Error(`Distant-Sun cache resolver failed with HTTP ${response.status}.`);
		}
		return requireResolution(await response.json());
	};
}
