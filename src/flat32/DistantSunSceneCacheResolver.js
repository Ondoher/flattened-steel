import {registry} from '@polylith/core';
import {FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID, FLAT32_DISTANT_SUN_DENSE_CACHE_FORMAT_ID} from './consts.js';
import './services/io.js';

const RUNTIME_CATALOG_SCHEMA = 'algorithm32-distant-sun-runtime-catalog-v1';

/** Called by catalog and HTTP resolution to require one nonempty trailing-slash asset base URL. */
function requireBaseUrl(assetBaseUrl) {
	if (typeof assetBaseUrl !== 'string' || assetBaseUrl.length === 0) {
		throw new TypeError('Distant-Sun scene-cache asset base URL is required.');
	}
	return assetBaseUrl.endsWith('/') ? assetBaseUrl : `${assetBaseUrl}/`;
}

/** Called by HTTP resolution to require the registered or explicitly supplied Flat32 HTTP service. */
function requireIo(value) {
	if (value === null || typeof value !== 'object' || typeof value.requestJson !== 'function') {
		throw new TypeError('Distant-Sun cache resolution requires the Flat32 io service.');
	}
	return /** @type {Flat32IoService} */ (value);
}

/** Called by HTTP resolution to validate its optional caller-owned cancellation request. */
function requireResolutionRequest(value) {
	if (
		value === null ||
		typeof value !== 'object' ||
		Array.isArray(value) ||
		Object.keys(value).some((property) => property !== 'signal') ||
		(value.signal !== undefined && !(value.signal instanceof globalThis.AbortSignal))
	) {
		throw new TypeError('Distant-Sun cache-resolution request is incompatible.');
	}
	return /** @type {Flat32DistantSunCacheResolutionRequest} */ (value);
}

/** Called by scalar resolution to require the deployed dense runtime catalog and complete ordered coverage. */
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
		const assetPathMatch =
			typeof entry?.assetPath === 'string' ? entry.assetPath.match(/^packages\/([a-f0-9]{64})\/$/u) : null;
		const cacheIdentityMatch =
			typeof entry?.cacheIdentity === 'string'
				? entry.cacheIdentity.match(/^algorithm32-distant-sun-scene-cache-sha256:([a-f0-9]{64})$/u)
				: null;
		const expectedMinimumDegrees = Math.max(binning.minimumInputDegrees, expectedDegrees - 0.5);
		const expectedMaximumDegrees =
			expectedDegrees === binning.endSolarZenithDegrees
				? binning.maximumInputExclusiveDegrees
				: expectedDegrees + 0.5;
		if (
			entry?.representativeSolarZenithDegrees !== expectedDegrees ||
			entry.minimumInputDegrees !== expectedMinimumDegrees ||
			entry.maximumInputExclusiveDegrees !== expectedMaximumDegrees ||
			assetPathMatch === null ||
			typeof entry.manifestPath !== 'string' ||
			!/^scene-cache-manifest-[a-f0-9]{64}\.json$/u.test(entry.manifestPath) ||
			entry.manifestSha256 !== entry.manifestPath.slice(21, -5) ||
			cacheIdentityMatch === null ||
			cacheIdentityMatch[1] !== assetPathMatch[1] ||
			!entry.expected?.sceneSun
		) {
			throw new TypeError(`Distant-Sun runtime catalog entry ${index} is incompatible.`);
		}
	}
	return catalog;
}

/**
 * Resolve one finite observer solar-zenith scalar through an accepted runtime catalog.
 * Invalid catalogs, asset roots, scalar angles, or inconsistent coverage throw; callers must retain their prior state.
 */
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
		return {
			schemaId: FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID,
			cacheFormat: FLAT32_DISTANT_SUN_DENSE_CACHE_FORMAT_ID,
			status: /** @type {const} */ ('dark'),
			requestedSolarZenithDegrees: solarZenithDegrees,
		};
	}
	const binning = catalog.binning;
	if (
		solarZenithDegrees < binning.minimumInputDegrees ||
		solarZenithDegrees >= binning.maximumInputExclusiveDegrees
	) {
		return {
			schemaId: FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID,
			cacheFormat: FLAT32_DISTANT_SUN_DENSE_CACHE_FORMAT_ID,
			status: /** @type {const} */ ('unsupported'),
			requestedSolarZenithDegrees: solarZenithDegrees,
		};
	}
	const representativeSolarZenithDegrees = Math.floor(solarZenithDegrees + 0.5);
	const entry = catalog.packages[representativeSolarZenithDegrees - binning.startSolarZenithDegrees];
	if (solarZenithDegrees < entry.minimumInputDegrees || solarZenithDegrees >= entry.maximumInputExclusiveDegrees) {
		throw new RangeError('Distant-Sun runtime catalog does not cover the selected scalar angle.');
	}
	return {
		schemaId: FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID,
		cacheFormat: FLAT32_DISTANT_SUN_DENSE_CACHE_FORMAT_ID,
		status: /** @type {const} */ ('ready'),
		requestedSolarZenithDegrees: solarZenithDegrees,
		representativeSolarZenithDegrees,
		asset: {
			assetRoot: `${base}${entry.assetPath}`,
			loadRequest: {
				manifestPath: entry.manifestPath,
				manifestSha256: entry.manifestSha256,
				cacheIdentity: entry.cacheIdentity,
				expected: entry.expected,
			},
		},
	};
}

/**
 * Create the production scalar resolver over one already-loaded generated catalog.
 * An invalid catalog or asset root throws during creation; callers must not install the resulting resolver.
 */
export function createDistantSunSceneCacheCatalogResolver(catalog, assetBaseUrl = 'scene-caches/') {
	requireCatalog(catalog);
	requireBaseUrl(assetBaseUrl);
	return (solarZenithDegrees) => resolveDistantSunSceneCache(catalog, solarZenithDegrees, assetBaseUrl);
}

/** Called by HTTP resolution to reject an unversioned, foreign-format, or uncontained response. */
function requireResolution(value, assetBaseUrl, requestedSolarZenithDegrees) {
	if (
		value?.schemaId === FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID &&
		value?.cacheFormat === FLAT32_DISTANT_SUN_DENSE_CACHE_FORMAT_ID &&
		value?.status === 'ready' &&
		value.requestedSolarZenithDegrees === requestedSolarZenithDegrees &&
		Number.isInteger(value.representativeSolarZenithDegrees) &&
		typeof value.asset?.assetRoot === 'string' &&
		typeof value.asset?.loadRequest?.manifestPath === 'string' &&
		typeof value.asset?.loadRequest?.manifestSha256 === 'string' &&
		typeof value.asset?.loadRequest?.cacheIdentity === 'string' &&
		value.asset?.loadRequest?.expected?.sceneSun
	) {
		const pageUrl = globalThis.location?.href ?? 'http://localhost/';
		const expectedAssetBaseUrl = new URL(requireBaseUrl(assetBaseUrl), pageUrl);
		const assetRoot = new URL(value.asset.assetRoot, pageUrl);
		const relativeAssetRoot = assetRoot.href.slice(expectedAssetBaseUrl.href.length);
		const packageMatch = relativeAssetRoot.match(/^packages\/([a-f0-9]{64})\/$/u);
		const cacheIdentityMatch = value.asset.loadRequest.cacheIdentity.match(
			/^algorithm32-distant-sun-scene-cache-sha256:([a-f0-9]{64})$/u,
		);
		const manifestMatch = value.asset.loadRequest.manifestPath.match(
			/^scene-cache-manifest-([a-f0-9]{64})\.json$/u,
		);
		const expected = value.asset.loadRequest.expected;
		const direction = expected.sceneSun?.directionToSourceUpEastNorth;
		const instantMilliseconds = Date.parse(expected.sceneSun?.instant);
		if (
			assetRoot.origin !== expectedAssetBaseUrl.origin ||
			!assetRoot.href.startsWith(expectedAssetBaseUrl.href) ||
			packageMatch === null ||
			cacheIdentityMatch === null ||
			cacheIdentityMatch[1] !== packageMatch[1] ||
			manifestMatch === null ||
			manifestMatch[1] !== value.asset.loadRequest.manifestSha256 ||
			value.representativeSolarZenithDegrees !== Math.floor(requestedSolarZenithDegrees + 0.5) ||
			expected.sceneSun.id !==
				`solar-zenith-${String(value.representativeSolarZenithDegrees).padStart(3, '0')}-degrees` ||
			typeof expected.sceneSun.instant !== 'string' ||
			!Number.isFinite(instantMilliseconds) ||
			new Date(instantMilliseconds).toISOString() !== expected.sceneSun.instant ||
			!Array.isArray(direction) ||
			direction.length !== 3 ||
			direction.some((component) => !Number.isFinite(component)) ||
			Math.abs(Math.hypot(...direction) - 1) > 1e-10 ||
			typeof expected.sceneSun.sourceIdentity !== 'string' ||
			expected.sceneSun.sourceIdentity.length === 0 ||
			['atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity'].some(
				(identityName) => typeof expected[identityName] !== 'string' || expected[identityName].length === 0,
			)
		) {
			throw new TypeError('Distant-Sun cache-resolution asset identity is incompatible or uncontained.');
		}
		return value;
	}
	if (
		value?.schemaId === FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID &&
		value?.cacheFormat === FLAT32_DISTANT_SUN_DENSE_CACHE_FORMAT_ID &&
		(value?.status === 'dark' || value?.status === 'unsupported') &&
		value.requestedSolarZenithDegrees === requestedSolarZenithDegrees
	) {
		return value;
	}
	throw new TypeError('Distant-Sun cache-resolution response is incompatible.');
}

/**
 * Create the browser client for the production scalar-solar-zenith endpoint.
 * Invalid endpoint, service, or asset-root configuration throws during creation. The returned resolver rejects on
 * cancellation, transport or JSON failure, and incompatible or uncontained responses; callers must preserve the
 * last-good cache selection.
 */
export function createDistantSunSceneCacheHttpResolver(
	endpointUrl = 'api/distant-sun-scene-cache',
	io = registry.subscribe('io'),
	assetBaseUrl = 'scene-caches/',
) {
	if (typeof endpointUrl !== 'string' || endpointUrl.length === 0) {
		throw new TypeError('Distant-Sun cache-resolution endpoint URL is required.');
	}
	const acceptedIo = requireIo(io);
	requireBaseUrl(assetBaseUrl);
	return async (solarZenithDegrees, request = {}) => {
		if (!Number.isFinite(solarZenithDegrees)) {
			throw new TypeError('Distant-Sun scene-cache resolver requires a finite solar-zenith angle in degrees.');
		}
		if (solarZenithDegrees < 0 || solarZenithDegrees > 180) {
			throw new RangeError('Distant-Sun solar-zenith angle must be between 0 and 180 degrees.');
		}
		const acceptedRequest = requireResolutionRequest(request);
		const url = new URL(endpointUrl, globalThis.location?.href ?? 'http://localhost/');
		url.searchParams.set('solarZenithDegrees', String(solarZenithDegrees));
		const resolution = await acceptedIo.requestJson({
			method: 'GET',
			route: url,
			signal: acceptedRequest.signal,
		});
		return requireResolution(resolution, assetBaseUrl, solarZenithDegrees);
	};
}
