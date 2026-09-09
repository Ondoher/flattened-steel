import {
	E1_CHANNEL_COUNT,
	E1_DIRECTION_LAYOUT_ID,
	E1_DIRECTION_ROW_BYTE_LENGTH,
	E1_LOGICAL_DIRECTION_COUNT,
	E1_UNIQUE_DIRECTION_COUNT,
} from '../consts.js';

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const RELATIVE_PATH_PATTERN = /^(?![./])(?!.+\/(?:\.|\.\.)(?:\/|$))[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\/?$/u;
const UNIT_VECTOR_TOLERANCE = 1e-12;
const E1_LAYOUT_DIMENSIONS = {
	'2x8': {altitudeCount: 2, solarZenithCount: 8},
	'4x8': {altitudeCount: 4, solarZenithCount: 8},
	'4x16': {altitudeCount: 4, solarZenithCount: 16},
	'8x8': {altitudeCount: 8, solarZenithCount: 8},
};
const TERMINAL_CONCLUSIONS = new Set(['accepted', 'rejected', 'failed', 'interrupted']);
const REQUIRED_IDENTITY_CHECKS = [
	'catalog',
	'package-report',
	'scene-manifest',
	'row-ledger',
	'spectral-payload',
	'logical-to-unique-index',
];
const RUNTIME_SCENARIOS = [
	{id: 'cold-90', kind: 'cold-load', solarZenithDegrees: 90},
	{id: 'exact-reuse-90', kind: 'same-identity-reuse', solarZenithDegrees: 90},
	{id: 'adjacent-91', kind: 'replacement', solarZenithDegrees: 91},
	{id: 'nonadjacent-30', kind: 'replacement', solarZenithDegrees: 30},
	{id: 'warm-90', kind: 'warm-replacement', solarZenithDegrees: 90},
	{id: 'failed-replacement', kind: 'last-good-preservation', solarZenithDegrees: 90},
	{id: 'superseded-91-by-92', kind: 'in-flight-supersession', solarZenithDegrees: [91, 92]},
	{id: 'caller-cancelled-93', kind: 'in-flight-cancellation', solarZenithDegrees: 93},
	{id: 'context-restoration-92', kind: 'webgl-context-cycle', solarZenithDegrees: 92},
	{id: 'dark-boundary', kind: 'resolver-boundary', solarZenithDegrees: [107.999, 108, 180]},
];
const MEASUREMENT_VOCABULARY = {
	storage: ['artifactCount', 'byteLength'],
	transport: ['requestCount', 'responseByteLength', 'uniqueRequestCount'],
	latency: ['browserElapsedMilliseconds', 'hostWallMilliseconds'],
	codec: ['encodeMilliseconds', 'decodeMilliseconds', 'inverseShuffleMilliseconds', 'workerQueueMilliseconds'],
	memory: [
		'browserHeapBeforeBytes',
		'browserHeapAfterBytes',
		'peakBrowserHeapBytes',
		'peakWorkerHeapBytes',
		'peakProcessResidentBytes',
		'peakProcessHeapBytes',
		'peakGpuResidentBytes',
		'peakDiskStagingBytes',
		'activeResidentTextureBytes',
		'lastTransitionTextureBytes',
		'lastTransitionWithStagingBytes',
	],
	generation: [
		'setupMilliseconds',
		'calculationMilliseconds',
		'readbackMilliseconds',
		'stagingMilliseconds',
		'encodingMilliseconds',
		'validationMilliseconds',
		'publicationMilliseconds',
		'totalMilliseconds',
	],
	exactness: ['checkedByteLength', 'expectedSha256', 'actualSha256', 'matches'],
};
const CANDIDATE_BOUNDS = {
	completeDeployedByteLengthMaximum: 600_000_000,
	completeGenerationMillisecondsMaximum: 900_000,
	decodedBlockByteLengthMaximum: 16_777_216,
	decodedRetentionTargetBytes: 67_108_864,
};
const MEASUREMENT_PURPOSE =
	'Comparable control and candidate measurements for exact-value distant-Sun cache storage, generation, transport, memory, and lifecycle behavior.';
const AVAILABILITY_RULE =
	'Every declared metric is emitted as a finite number, boolean, SHA-256 string, or explicit null when the metric does not apply to that control or candidate.';
const NON_NEGOTIABLE = [
	'exact decoded reconstruction',
	'bounded allocation before decode',
	'subscriber-isolated cancellation',
	'stale-result rejection',
	'last-good transactional publication',
	'texture-free darkness at and above 108 degrees',
];
const BROWSER_STAGE_IDS = RUNTIME_SCENARIOS.slice(0, 9).map((scenario) => scenario.id);

/**
 * Called by schema validators to require exact JSON structure and ordering.
 *
 * @param {unknown} value - Candidate JSON value.
 * @param {unknown} expected - Canonical JSON value.
 * @param {string} label - Diagnostic identity.
 * @returns {void}
 */
function requireExactJson(value, expected, label) {
	if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError(`${label} differs from its frozen contract.`);
}

/**
 * Called by schema validators to require an exact object property set.
 *
 * @param {CacheOptimizationJsonObject} value - Candidate JSON object.
 * @param {string[]} expected - Canonical property names.
 * @param {string} label - Diagnostic identity.
 * @returns {void}
 */
function requireExactKeys(value, expected, label) {
	requireExactJson(Object.keys(value).sort(), [...expected].sort(), `${label} properties`);
}

/**
 * Called by measurement validators to require a finite nonnegative number.
 *
 * @param {unknown} value - Candidate value.
 * @param {string} label - Diagnostic identity.
 * @returns {number} - Accepted measurement.
 */
function requireNonnegativeNumber(value, label) {
	const number = requireNumber(value, label);
	if (number < 0) throw new TypeError(`${label} must be nonnegative.`);
	return number;
}

/**
 * Call this function to require a non-array JSON object.
 *
 * @param {unknown} value - Candidate value.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationJsonObject} - Accepted object.
 */
function requireRecord(value, label) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
	return /** @type {CacheOptimizationJsonObject} */ (value);
}

/**
 * Call this function to require a nonempty string.
 *
 * @param {unknown} value - Candidate value.
 * @param {string} label - Diagnostic identity.
 * @returns {string} - Accepted string.
 */
function requireString(value, label) {
	if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${label} must be a nonempty string.`);
	return value;
}

/**
 * Call this function to require a finite number.
 *
 * @param {unknown} value - Candidate value.
 * @param {string} label - Diagnostic identity.
 * @returns {number} - Accepted finite number.
 */
function requireNumber(value, label) {
	if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
	return value;
}

/**
 * Call this function to require a nonnegative safe-integer count.
 *
 * @param {unknown} value - Candidate value.
 * @param {string} label - Diagnostic identity.
 * @returns {number} - Accepted count.
 */
function requireCount(value, label) {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
		throw new TypeError(`${label} must be a nonnegative safe integer.`);
	}
	return value;
}

/**
 * Call this function to require a lowercase hexadecimal SHA-256.
 *
 * @param {unknown} value - Candidate value.
 * @param {string} label - Diagnostic identity.
 * @returns {string} - Accepted SHA-256.
 */
function requireSha256(value, label) {
	if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) throw new TypeError(`${label} must be a SHA-256.`);
	return value;
}

/**
 * Call this function to validate a closed relative-path, length, and SHA-256 identity.
 * Rejects extra, missing, malformed, or unsafe fields; callers must not read an unaccepted identity.
 *
 * @param {unknown} value - Candidate file identity.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationFileIdentity} - Accepted file identity.
 */
function acceptFileIdentity(value, label) {
	const identity = requireRecord(value, label);
	requireExactKeys(identity, ['path', 'byteLength', 'sha256'], label);
	requireContractPath(identity.path, `${label} path`);
	requireCount(identity.byteLength, `${label} byteLength`);
	requireSha256(identity.sha256, `${label} sha256`);
	return /** @type {CacheOptimizationFileIdentity} */ (identity);
}

/**
 * Call this function to require a normalized, non-dot relative contract path.
 *
 * @param {unknown} value - Candidate value.
 * @param {string} label - Diagnostic identity.
 * @returns {string} - Accepted path.
 */
function requireContractPath(value, label) {
	if (typeof value !== 'string' || !RELATIVE_PATH_PATTERN.test(value) || value.split('/').some((part) => part.startsWith('.'))) {
		throw new TypeError(`${label} must be a normalized non-dot relative path.`);
	}
	return value;
}

/**
 * Call this function to require a canonical ISO timestamp.
 *
 * @param {unknown} value - Candidate value.
 * @param {string} label - Diagnostic identity.
 * @returns {string} - Accepted timestamp.
 */
function requireIsoTimestamp(value, label) {
	const timestamp = requireString(value, label);
	try {
		if (new Date(timestamp).toISOString() !== timestamp) throw new TypeError();
	} catch {
		throw new TypeError(`${label} must be a canonical ISO timestamp.`);
	}
	return timestamp;
}

/**
 * Call this function to copy and validate a recursively serializable JSON value.
 *
 * @param {unknown} value - Candidate value.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationJsonValue} - Normalized JSON value.
 */
function normalizeJsonValue(value, label) {
	let serialized;
	try {
		serialized = JSON.stringify(value);
	} catch (error) {
		throw new TypeError(`${label} is not JSON serializable: ${error.message}`);
	}
	if (serialized === undefined) throw new TypeError(`${label} is not a JSON value.`);
	const normalized = JSON.parse(serialized);
	const inspect = (candidate, location) => {
		if (
			candidate === undefined ||
			typeof candidate === 'function' ||
			typeof candidate === 'symbol' ||
			typeof candidate === 'bigint'
		) {
			throw new TypeError(`${location} is not a JSON value.`);
		}
		if (typeof candidate === 'number' && !Number.isFinite(candidate)) {
			throw new TypeError(`${location} must be finite.`);
		}
		if (Array.isArray(candidate)) candidate.forEach((item, index) => inspect(item, `${location}[${index}]`));
		else if (candidate && typeof candidate === 'object') {
			for (const [key, item] of Object.entries(candidate)) inspect(item, `${location}.${key}`);
		}
	};
	inspect(value, label);
	return /** @type {CacheOptimizationJsonValue} */ (normalized);
}

/**
 * Call this function to validate the frozen C0 measurement contract.
 *
 * @param {unknown} value - Candidate contract.
 * @returns {CacheOptimizationMeasurementContract} - Accepted contract.
 */
function acceptMeasurementContract(value) {
	const contract = requireRecord(value, 'Measurement contract');
	requireExactKeys(
		contract,
		['schemaId', 'purpose', 'inventory', 'runtimeScenarios', 'measurements', 'availabilityRule', 'candidateBounds', 'nonNegotiable'],
		'Measurement contract',
	);
	if (contract.schemaId !== 'distant-sun-cache-optimization-c0-measurement-contract-v1') {
		throw new TypeError('Measurement contract schema is unsupported.');
	}
	if (contract.purpose !== MEASUREMENT_PURPOSE) throw new TypeError('Measurement purpose differs from its frozen contract.');
	const inventory = requireRecord(contract.inventory, 'Measurement inventory');
	requireExactKeys(
		inventory,
		['packageCount', 'distinctCoordinateCount', 'expectedTotalByteLength', 'requiredIdentityChecks'],
		'Measurement inventory',
	);
	requireCount(inventory.packageCount, 'Measurement packageCount');
	requireCount(inventory.distinctCoordinateCount, 'Measurement distinctCoordinateCount');
	requireCount(inventory.expectedTotalByteLength, 'Measurement expectedTotalByteLength');
	requireExactJson(
		{
			packageCount: inventory.packageCount,
			distinctCoordinateCount: inventory.distinctCoordinateCount,
			expectedTotalByteLength: inventory.expectedTotalByteLength,
		},
		{packageCount: 109, distinctCoordinateCount: 5_494, expectedTotalByteLength: 17_230_339_148},
		'Measurement inventory values',
	);
	requireExactJson(inventory.requiredIdentityChecks, REQUIRED_IDENTITY_CHECKS, 'Measurement identity checks');
	requireExactJson(contract.runtimeScenarios, RUNTIME_SCENARIOS, 'Measurement runtime scenarios');
	const measurements = requireRecord(contract.measurements, 'Measurement vocabulary');
	requireExactKeys(measurements, ['unavailableValue', ...Object.keys(MEASUREMENT_VOCABULARY)], 'Measurement vocabulary');
	if (measurements.unavailableValue !== null) throw new TypeError('Unavailable measurement value must be null.');
	for (const [name, expected] of Object.entries(MEASUREMENT_VOCABULARY)) {
		requireExactJson(measurements[name], expected, `Measurement vocabulary ${name}`);
	}
	if (contract.availabilityRule !== AVAILABILITY_RULE) {
		throw new TypeError('Measurement availability rule differs from its frozen contract.');
	}
	requireExactJson(contract.candidateBounds, CANDIDATE_BOUNDS, 'Measurement candidate bounds');
	requireExactJson(contract.nonNegotiable, NON_NEGOTIABLE, 'Measurement nonnegotiable requirements');
	return /** @type {CacheOptimizationMeasurementContract} */ (
		normalizeJsonValue(contract, 'Measurement contract')
	);
}

/**
 * Call this function to validate the deployed package-set report fields consumed by C0.
 *
 * @param {unknown} value - Candidate report.
 * @returns {CacheOptimizationPackageReport} - Accepted report.
 */
function acceptPackageReport(value) {
	const report = requireRecord(value, 'Package report');
	if (report.schemaId !== 'algorithm32-distant-sun-bin-covered-runtime-package-set-v1' || report.accepted !== true) {
		throw new TypeError('Package report is not an accepted supported package set.');
	}
	requireContractPath(report.catalogPath, 'Package report catalogPath');
	requireSha256(report.catalogSha256, 'Package report catalogSha256');
	for (const name of ['packageCount', 'totalByteLength', 'sharedCoordinateHashCount']) {
		requireCount(report[name], `Package report ${name}`);
	}
	return /** @type {CacheOptimizationPackageReport} */ (report);
}

/**
 * Call this function to validate the deployed runtime catalog fields consumed by C0.
 *
 * @param {unknown} value - Candidate catalog.
 * @returns {CacheOptimizationRuntimeCatalog} - Accepted catalog.
 */
function acceptRuntimeCatalog(value) {
	const catalog = requireRecord(value, 'Runtime catalog');
	if (catalog.schemaId !== 'algorithm32-distant-sun-runtime-catalog-v1' || catalog.accepted !== true) {
		throw new TypeError('Runtime catalog is not an accepted supported catalog.');
	}
	requireNumber(catalog.darkFromSolarZenithDegrees, 'Catalog dark boundary');
	if (!Array.isArray(catalog.packages) || catalog.packages.length === 0) throw new TypeError('Catalog packages are required.');
	for (const [index, candidate] of catalog.packages.entries()) {
		const entry = requireRecord(candidate, `Catalog package ${index}`);
		requireString(entry.id, `Catalog package ${index} id`);
		requireNumber(entry.representativeSolarZenithDegrees, `Catalog package ${index} degrees`);
		requireContractPath(entry.assetPath, `Catalog package ${index} assetPath`);
		requireContractPath(entry.manifestPath, `Catalog package ${index} manifestPath`);
		requireSha256(entry.manifestSha256, `Catalog package ${index} manifestSha256`);
		requireString(entry.cacheIdentity, `Catalog package ${index} cacheIdentity`);
		requireRecord(entry.expected, `Catalog package ${index} expected`);
		requireCount(entry.byteLength, `Catalog package ${index} byteLength`);
	}
	return /** @type {CacheOptimizationRuntimeCatalog} */ (catalog);
}

/**
 * Call this function to validate the complete browser-control ingress payload.
 *
 * @param {unknown} value - Candidate control.
 * @returns {CacheOptimizationBrowserControl} - Accepted control.
 */
function acceptBrowserControl(value) {
	const control = requireRecord(value, 'Browser control');
	requireExactKeys(control, ['catalog', 'assets', 'failedAsset'], 'Browser control');
	acceptRuntimeCatalog(control.catalog);
	const assets = requireRecord(control.assets, 'Browser control assets');
	const assetNames = ['cold90', 'adjacent91', 'nonadjacent30', 'warm90', 'delayed91', 'replacement92', 'delayed93'];
	requireExactKeys(assets, assetNames, 'Browser control assets');
	for (const name of assetNames) {
		acceptBrowserAsset(assets[name], `Browser asset ${name}`);
	}
	acceptBrowserAsset(control.failedAsset, 'Failed browser asset');
	return /** @type {CacheOptimizationBrowserControl} */ (control);
}

/**
 * Called by the browser-control validator to validate one asset request.
 *
 * @param {unknown} value - Candidate asset.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationBrowserAsset} - Accepted asset.
 */
function acceptBrowserAsset(value, label) {
	const asset = requireRecord(value, label);
	requireExactKeys(asset, ['assetRoot', 'loadRequest'], label);
	if (typeof asset.assetRoot !== 'string' || !/^\/(?:delayed-)?package-root\/[A-Za-z0-9_./-]+\/$/u.test(asset.assetRoot)) {
		throw new TypeError(`${label} assetRoot is invalid.`);
	}
	const request = requireRecord(asset.loadRequest, `${label} loadRequest`);
	requireExactKeys(request, ['manifestPath', 'manifestSha256', 'cacheIdentity', 'expected'], `${label} loadRequest`);
	requireContractPath(request.manifestPath, `${label} manifestPath`);
	requireSha256(request.manifestSha256, `${label} manifestSha256`);
	requireString(request.cacheIdentity, `${label} cacheIdentity`);
	acceptExpectedCompatibility(request.expected, `${label} expected`);
	return /** @type {CacheOptimizationBrowserAsset} */ (asset);
}

/**
 * Called by browser-control validation to require production compatibility identities.
 *
 * @param {unknown} value - Candidate expected compatibility.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationExpectedCompatibility} - Accepted compatibility projection.
 */
function acceptExpectedCompatibility(value, label) {
	const expected = requireRecord(value, label);
	requireExactKeys(
		expected,
		['sceneSun', 'atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity'],
		label,
	);
	const sceneSun = acceptE1SceneSun(expected.sceneSun, `${label} sceneSun`);
	return {
		sceneSun,
		atmosphereIdentity: requireString(expected.atmosphereIdentity, `${label} atmosphereIdentity`),
		geometryIdentity: requireString(expected.geometryIdentity, `${label} geometryIdentity`),
		groundIdentity: requireString(expected.groundIdentity, `${label} groundIdentity`),
		numericalIdentity: requireString(expected.numericalIdentity, `${label} numericalIdentity`),
	};
}

/**
 * Called by browser-result validation to require one controller resource snapshot.
 *
 * @param {unknown} value - Candidate resource snapshot.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationControllerResources} - Accepted resource snapshot.
 */
function acceptControllerResources(value, label) {
	const resources = requireRecord(value, label);
	const names = [
		'maximumResidentTextureBytes',
		'maximumAtomicTransitionTextureBytes',
		'maximumTransitionWithStagingBytes',
		'activeResidentTextureBytes',
		'lastTransitionTextureBytes',
		'lastTransitionWithStagingBytes',
	];
	requireExactKeys(resources, names, label);
	for (const name of names) {
		const resource = requireRecord(resources[name], `${label} ${name}`);
		requireExactKeys(resource, ['value', 'units'], `${label} ${name}`);
		requireCount(resource.value, `${label} ${name} value`);
		if (resource.units !== 'bytes') throw new TypeError(`${label} ${name} units must be bytes.`);
	}
	return /** @type {CacheOptimizationControllerResources} */ (resources);
}

/**
 * Called by browser-result validation to require one rejection identity.
 *
 * @param {unknown} value - Candidate rejection identity.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationRejectionIdentity} - Accepted rejection identity.
 */
function acceptRejectionIdentity(value, label) {
	const rejection = requireRecord(value, label);
	requireExactKeys(rejection, ['type', 'name', 'message'], label);
	requireString(rejection.type, `${label} type`);
	if (rejection.name !== null) requireString(rejection.name, `${label} name`);
	requireString(rejection.message, `${label} message`);
	return /** @type {CacheOptimizationRejectionIdentity} */ (rejection);
}

/**
 * Call this function to validate a browser lifecycle baseline result.
 *
 * @param {unknown} value - Candidate result.
 * @returns {CacheOptimizationBrowserBaselineResult} - Accepted result.
 */
function acceptBrowserBaselineResult(value) {
	const result = requireRecord(value, 'Browser baseline result');
	requireExactKeys(
		result,
		['schemaId', 'accepted', 'gpu', 'stages', 'darkBoundary', 'finalResources', 'webglError'],
		'Browser baseline result',
	);
	if (result.schemaId !== 'distant-sun-cache-optimization-c0-browser-baseline-v1' || result.accepted !== true) {
		throw new TypeError('Browser baseline result is not accepted or uses an unsupported schema.');
	}
	const gpu = requireRecord(result.gpu, 'Browser baseline GPU');
	requireExactKeys(gpu, ['api', 'renderer'], 'Browser baseline GPU');
	requireString(gpu.api, 'Browser baseline GPU api');
	requireString(gpu.renderer, 'Browser baseline GPU renderer');
	if (!Array.isArray(result.stages) || result.stages.length !== 9) {
		throw new TypeError('Browser baseline must contain nine measured lifecycle stages.');
	}
	requireExactJson(
		result.stages.map((stage) => requireRecord(stage, 'Browser stage').id),
		BROWSER_STAGE_IDS,
		'Browser stage identities',
	);
	for (const [index, candidate] of result.stages.entries()) {
		const stage = requireRecord(candidate, `Browser stage ${index}`);
		requireExactKeys(
			stage,
			['id', 'browserElapsedMilliseconds', 'browserHeapBeforeBytes', 'browserHeapAfterBytes', 'peakBrowserHeapBytes', 'network', 'value'],
			`Browser stage ${index}`,
		);
		const stageId = requireString(stage.id, `Browser stage ${index} id`);
		requireNonnegativeNumber(stage.browserElapsedMilliseconds, `Browser stage ${index} browserElapsedMilliseconds`);
		for (const name of ['browserHeapBeforeBytes', 'browserHeapAfterBytes', 'peakBrowserHeapBytes']) {
			if (stage[name] !== null) requireNonnegativeNumber(stage[name], `Browser stage ${index} ${name}`);
		}
		const network = requireRecord(stage.network, `Browser stage ${index} network`);
		requireExactKeys(network, ['requestCount', 'responseByteLength', 'uniqueRequestCount'], `Browser stage ${index} network`);
		for (const name of ['requestCount', 'responseByteLength', 'uniqueRequestCount']) {
			requireCount(network[name], `Browser stage ${index} network ${name}`);
		}
		const observed = requireRecord(stage.value, `Browser stage ${index} value`);
		if (['cold-90', 'adjacent-91', 'nonadjacent-30', 'warm-90', 'context-restoration-92'].includes(stageId)) {
			requireExactKeys(observed, ['cacheIdentity', 'resources'], `Browser stage ${index} value`);
			requireString(observed.cacheIdentity, `Browser stage ${index} cacheIdentity`);
			acceptControllerResources(observed.resources, `Browser stage ${index} resources`);
		} else if (stageId === 'exact-reuse-90') {
			requireExactKeys(observed, ['cacheIdentity', 'reusedSameObject'], `Browser stage ${index} value`);
			requireString(observed.cacheIdentity, `Browser stage ${index} cacheIdentity`);
			if (observed.reusedSameObject !== true) throw new TypeError('Browser exact reuse did not preserve object identity.');
		} else if (stageId === 'failed-replacement') {
			requireExactKeys(observed, ['name', 'message', 'preservedActive'], `Browser stage ${index} value`);
			requireString(observed.name, `Browser stage ${index} error name`);
			requireString(observed.message, `Browser stage ${index} error message`);
			if (observed.preservedActive !== true) throw new TypeError('Browser failure did not preserve the active cache.');
		} else if (stageId === 'superseded-91-by-92') {
			requireExactKeys(
				observed,
				['supersededError', 'publishedCacheIdentity', 'resources'],
				`Browser stage ${index} value`,
			);
			if (acceptRejectionIdentity(observed.supersededError, `Browser stage ${index} superseded error`).name !== 'AbortError') {
				throw new TypeError('Browser supersession rejection must be AbortError-classified.');
			}
			requireString(observed.publishedCacheIdentity, `Browser stage ${index} published cacheIdentity`);
			acceptControllerResources(observed.resources, `Browser stage ${index} resources`);
		} else if (stageId === 'caller-cancelled-93') {
			requireExactKeys(observed, ['cancellationError', 'preservedActive'], `Browser stage ${index} value`);
			if (acceptRejectionIdentity(observed.cancellationError, `Browser stage ${index} cancellation error`).name !== 'AbortError') {
				throw new TypeError('Browser cancellation rejection must be AbortError-classified.');
			}
			if (observed.preservedActive !== true) throw new TypeError('Browser cancellation did not preserve the active cache.');
		}
	}
	if (!Array.isArray(result.darkBoundary) || result.darkBoundary.length !== 3) {
		throw new TypeError('Browser baseline dark boundary is incomplete.');
	}
	requireExactJson(
		result.darkBoundary,
		[
			{solarZenithDegrees: 107.999, status: 'ready', representativeSolarZenithDegrees: 108},
			{solarZenithDegrees: 108, status: 'dark', representativeSolarZenithDegrees: null},
			{solarZenithDegrees: 180, status: 'dark', representativeSolarZenithDegrees: null},
		],
		'Browser dark boundary',
	);
	acceptControllerResources(result.finalResources, 'Browser final resources');
	if (result.webglError !== 0) throw new TypeError('Browser result contains a WebGL error.');
	return /** @type {CacheOptimizationBrowserBaselineResult} */ (result);
}

/**
 * Call this function to validate the terminal C0 production-control result.
 *
 * @param {unknown} value - Candidate result.
 * @returns {CacheOptimizationC0Result} - Accepted C0 result.
 */
function acceptC0Result(value) {
	const result = requireRecord(value, 'C0 result');
	requireExactKeys(
		result,
		['schemaId', 'runId', 'conclusion', 'accepted', 'inventory', 'browser', 'measurements', 'claimBoundary'],
		'C0 result',
	);
	if (result.schemaId !== 'distant-sun-cache-optimization-c0-result-v2' || result.conclusion !== 'accepted') {
		throw new TypeError('Accepted C0 result schema or conclusion is invalid.');
	}
	acceptTerminalResult(result, requireString(result.runId, 'C0 result runId'), 'accepted');
	const inventory = requireRecord(result.inventory, 'C0 result inventory');
	requireExactKeys(
		inventory,
		['packageCount', 'totalByteLength', 'rowOccurrenceCount', 'distinctCoordinateCount', 'rowByteLength', 'elapsedMilliseconds'],
		'C0 inventory',
	);
	for (const name of [
		'packageCount',
		'totalByteLength',
		'rowOccurrenceCount',
		'distinctCoordinateCount',
		'rowByteLength',
	]) {
		requireCount(inventory[name], `C0 inventory ${name}`);
	}
	requireNonnegativeNumber(inventory.elapsedMilliseconds, 'C0 inventory elapsedMilliseconds');
	const browser = requireRecord(result.browser, 'C0 browser host result');
	requireExactKeys(
		browser,
		['schemaId', 'accepted', 'browserVersion', 'hostWallMilliseconds', 'requestTotals', 'consoleMessages', 'result'],
		'C0 browser host result',
	);
	if (browser.schemaId !== 'distant-sun-cache-optimization-c0-browser-host-result-v1' || browser.accepted !== true) {
		throw new TypeError('C0 browser host result is invalid.');
	}
	requireString(browser.browserVersion, 'C0 browserVersion');
	requireNonnegativeNumber(browser.hostWallMilliseconds, 'C0 hostWallMilliseconds');
	acceptNetworkSnapshot(browser.requestTotals, 'C0 request totals');
	acceptBrowserBaselineResult(browser.result);
	if (!Array.isArray(browser.consoleMessages) || browser.consoleMessages.some((message) => typeof message !== 'string')) {
		throw new TypeError('C0 consoleMessages must be strings.');
	}
	const measurements = requireRecord(result.measurements, 'C0 measurements');
	requireExactKeys(
		measurements,
		['storage', 'transport', 'latency', 'codec', 'memory', 'generation', 'exactness'],
		'C0 measurements',
	);
	const measurementFields = {
		storage: ['artifactCount', 'byteLength'],
		transport: ['requestCount', 'responseByteLength', 'uniqueRequestCount'],
		latency: ['browserElapsedMilliseconds', 'hostWallMilliseconds'],
		codec: ['encodeMilliseconds', 'decodeMilliseconds', 'inverseShuffleMilliseconds', 'workerQueueMilliseconds'],
		memory: [
			'browserHeapBeforeBytes',
			'browserHeapAfterBytes',
			'peakBrowserHeapBytes',
			'peakWorkerHeapBytes',
			'peakProcessResidentBytes',
			'peakProcessHeapBytes',
			'peakGpuResidentBytes',
			'peakDiskStagingBytes',
			'activeResidentTextureBytes',
			'lastTransitionTextureBytes',
			'lastTransitionWithStagingBytes',
		],
		generation: [
			'setupMilliseconds',
			'calculationMilliseconds',
			'readbackMilliseconds',
			'stagingMilliseconds',
			'encodingMilliseconds',
			'validationMilliseconds',
			'publicationMilliseconds',
			'totalMilliseconds',
		],
	};
	for (const [groupName, fieldNames] of Object.entries(measurementFields)) {
		const group = requireRecord(measurements[groupName], `C0 measurements ${groupName}`);
		requireExactKeys(group, fieldNames, `C0 measurements ${groupName}`);
		for (const fieldName of fieldNames) {
			const alwaysUnavailable = groupName === 'codec' || groupName === 'generation';
			const optionallyUnavailable =
				groupName === 'memory' &&
				['browserHeapBeforeBytes', 'browserHeapAfterBytes', 'peakWorkerHeapBytes', 'peakDiskStagingBytes'].includes(
					fieldName,
				);
			if (group[fieldName] === null) {
				if (!alwaysUnavailable && !optionallyUnavailable) {
					throw new TypeError(`C0 ${groupName} ${fieldName} must be available.`);
				}
			} else {
				if (alwaysUnavailable) throw new TypeError(`C0 ${groupName} ${fieldName} must be null.`);
				requireNonnegativeNumber(group[fieldName], `C0 ${groupName} ${fieldName}`);
			}
		}
	}
	const exactness = requireRecord(measurements.exactness, 'C0 measurements exactness');
	requireExactKeys(
		exactness,
		['checkedByteLength', 'expectedSha256', 'actualSha256', 'matches'],
		'C0 measurements exactness',
	);
	requireCount(exactness.checkedByteLength, 'C0 exactness checkedByteLength');
	requireSha256(exactness.expectedSha256, 'C0 exactness expectedSha256');
	requireSha256(exactness.actualSha256, 'C0 exactness actualSha256');
	if (exactness.matches !== true || exactness.expectedSha256 !== exactness.actualSha256) {
		throw new TypeError('C0 exactness must match.');
	}
	requireString(result.claimBoundary, 'C0 claimBoundary');
	return /** @type {CacheOptimizationC0Result} */ (result);
}

/**
 * Call this function to validate cumulative proof-host response counters.
 *
 * @param {unknown} value - Candidate snapshot.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationNetworkSnapshot} - Accepted snapshot.
 */
function acceptNetworkSnapshot(value, label) {
	const snapshot = requireRecord(value, label);
	requireExactKeys(snapshot, ['requestCount', 'responseByteLength', 'uniqueRequestCount', 'paths'], label);
	for (const name of ['requestCount', 'responseByteLength', 'uniqueRequestCount']) {
		requireCount(snapshot[name], `${label} ${name}`);
	}
	const paths = requireRecord(snapshot.paths, `${label} paths`);
	for (const [urlPath, candidate] of Object.entries(paths)) {
		requireString(urlPath, `${label} path`);
		const metrics = requireRecord(candidate, `${label} ${urlPath}`);
		requireExactKeys(metrics, ['count', 'byteLength'], `${label} ${urlPath}`);
		requireCount(metrics.count, `${label} ${urlPath} count`);
		requireCount(metrics.byteLength, `${label} ${urlPath} byteLength`);
	}
	return /** @type {CacheOptimizationNetworkSnapshot} */ (snapshot);
}

/**
 * Call this function to validate the complete immutable C0 inventory consumed by E1.
 * Rejects missing, extra, malformed, unsupported, or arithmetically incoherent inventory facts.
 *
 * @param {unknown} value - Candidate C0 inventory.
 * @returns {CacheOptimizationInventoryPins} - Accepted and normalized inventory pins.
 */
function acceptInventoryPins(value) {
	const inventory = requireRecord(value, 'C0 inventory pins');
	requireExactKeys(
		inventory,
		[
			'schemaId',
			'accepted',
			'packageCount',
			'totalByteLength',
			'rowOccurrenceCount',
			'distinctCoordinateCount',
			'rowByteLength',
			'elapsedMilliseconds',
			'packages',
		],
		'C0 inventory pins',
	);
	if (
		inventory.schemaId !== 'distant-sun-cache-optimization-c0-inventory-pins-v1' ||
		inventory.accepted !== true ||
		!Array.isArray(inventory.packages)
	) {
		throw new TypeError('C0 inventory pins schema, state, or packages are invalid.');
	}
	const packageCount = requireCount(inventory.packageCount, 'C0 inventory packageCount');
	const totalByteLength = requireCount(inventory.totalByteLength, 'C0 inventory totalByteLength');
	const rowOccurrenceCount = requireCount(inventory.rowOccurrenceCount, 'C0 inventory rowOccurrenceCount');
	const distinctCoordinateCount = requireCount(
		inventory.distinctCoordinateCount,
		'C0 inventory distinctCoordinateCount',
	);
	const rowByteLength = requireCount(inventory.rowByteLength, 'C0 inventory rowByteLength');
	const elapsedMilliseconds = requireNonnegativeNumber(
		inventory.elapsedMilliseconds,
		'C0 inventory elapsedMilliseconds',
	);
	if (
		packageCount !== 109 ||
		inventory.packages.length !== packageCount ||
		distinctCoordinateCount !== 5_494 ||
		rowByteLength !== E1_CHANNEL_COUNT * E1_DIRECTION_ROW_BYTE_LENGTH
	) {
		throw new TypeError('C0 inventory dimensions differ from the frozen E1 control.');
	}
	const packages = inventory.packages.map((candidate, index) => {
		const packagePin = requireRecord(candidate, `C0 inventory package ${index}`);
		requireExactKeys(
			packagePin,
			[
				'id',
				'representativeSolarZenithDegrees',
				'assetPath',
				'cacheIdentity',
				'byteLength',
				'rowCount',
				'manifest',
				'ledger',
				'payload',
				'logicalToUniqueIndex',
			],
			`C0 inventory package ${index}`,
		);
		const id = requireString(packagePin.id, `C0 inventory package ${index} id`);
		const representativeSolarZenithDegrees = requireCount(
			packagePin.representativeSolarZenithDegrees,
			`C0 inventory package ${index} degrees`,
		);
		const assetPath = requireContractPath(packagePin.assetPath, `C0 inventory package ${index} assetPath`);
		const cacheIdentity = requireString(packagePin.cacheIdentity, `C0 inventory package ${index} cacheIdentity`);
		const byteLength = requireCount(packagePin.byteLength, `C0 inventory package ${index} byteLength`);
		const rowCount = requireCount(packagePin.rowCount, `C0 inventory package ${index} rowCount`);
		const identities = {
			manifest: acceptFileIdentity(packagePin.manifest, `C0 inventory package ${index} manifest`),
			ledger: acceptFileIdentity(packagePin.ledger, `C0 inventory package ${index} ledger`),
			payload: acceptFileIdentity(packagePin.payload, `C0 inventory package ${index} payload`),
			logicalToUniqueIndex: acceptFileIdentity(
				packagePin.logicalToUniqueIndex,
				`C0 inventory package ${index} logical index`,
			),
		};
		if (
			id !== `solar-zenith-${String(index).padStart(3, '0')}-degrees` ||
			representativeSolarZenithDegrees !== index ||
			rowCount === 0 ||
			!Object.values(identities).every((identity) => identity.byteLength > 0 && identity.path.startsWith(assetPath)) ||
			identities.payload.byteLength !== rowCount * rowByteLength ||
			Object.values(identities).reduce((sum, identity) => sum + identity.byteLength, 0) !== byteLength
		) {
			throw new TypeError(`C0 inventory package ${index} byte arithmetic is incoherent.`);
		}
		return /** @type {CacheOptimizationInventoryPackage} */ ({
			id,
			representativeSolarZenithDegrees,
			assetPath,
			cacheIdentity,
			byteLength,
			rowCount,
			...identities,
		});
	});
	if (
		packages.reduce((sum, packagePin) => sum + packagePin.byteLength, 0) !== totalByteLength ||
		packages.reduce((sum, packagePin) => sum + packagePin.rowCount, 0) !== rowOccurrenceCount
	) {
		throw new TypeError('C0 inventory aggregate arithmetic is incoherent.');
	}
	return {
		schemaId: 'distant-sun-cache-optimization-c0-inventory-pins-v1',
		accepted: true,
		packageCount,
		totalByteLength,
		rowOccurrenceCount,
		distinctCoordinateCount,
		rowByteLength,
		elapsedMilliseconds,
		packages,
	};
}

/**
 * Call this function to validate one half-open scene-selection interval or the terminal 108-degree boundary package.
 * Rejects missing, extra, or non-finite values; callers must reject the owning manifest.
 *
 * @param {unknown} value - Candidate selection.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationE1SceneSelection} - Accepted selection.
 */
function acceptE1SceneSelection(value, label) {
	const selection = requireRecord(value, label);
	requireExactKeys(selection, ['representativeSolarZenithDegrees', 'minimumInputDegrees', 'maximumInputExclusiveDegrees'], label);
	const representativeSolarZenithDegrees = requireNonnegativeNumber(
		selection.representativeSolarZenithDegrees,
		`${label} representativeSolarZenithDegrees`,
	);
	const minimumInputDegrees = requireNonnegativeNumber(selection.minimumInputDegrees, `${label} minimumInputDegrees`);
	const maximumInputExclusiveDegrees = requireNonnegativeNumber(
		selection.maximumInputExclusiveDegrees,
		`${label} maximumInputExclusiveDegrees`,
	);
	const isTerminalDarkBoundaryPackage =
		representativeSolarZenithDegrees === 108 && maximumInputExclusiveDegrees === 108;
	if (
		minimumInputDegrees >= maximumInputExclusiveDegrees ||
		representativeSolarZenithDegrees < minimumInputDegrees ||
		(representativeSolarZenithDegrees >= maximumInputExclusiveDegrees && !isTerminalDarkBoundaryPackage)
	) {
		throw new TypeError(`${label} interval is incoherent.`);
	}
	return {
		representativeSolarZenithDegrees,
		minimumInputDegrees,
		maximumInputExclusiveDegrees,
	};
}

/**
 * Call this function to validate one scene-Sun identity and direction.
 * Rejects missing, extra, malformed, or non-finite values; callers must reject the owning manifest.
 *
 * @param {unknown} value - Candidate scene-Sun contract.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationE1SceneSun} - Accepted scene-Sun contract.
 */
function acceptE1SceneSun(value, label) {
	const sceneSun = requireRecord(value, label);
	requireExactKeys(sceneSun, ['id', 'instant', 'directionToSourceUpEastNorth', 'sourceIdentity'], label);
	const id = requireString(sceneSun.id, `${label} id`);
	const instant = requireIsoTimestamp(sceneSun.instant, `${label} instant`);
	const sourceIdentity = requireString(sceneSun.sourceIdentity, `${label} sourceIdentity`);
	if (!Array.isArray(sceneSun.directionToSourceUpEastNorth) || sceneSun.directionToSourceUpEastNorth.length !== 3) throw new TypeError(`${label} direction is invalid.`);
	const directionToSourceUpEastNorth = sceneSun.directionToSourceUpEastNorth.map((component) =>
		requireNumber(component, `${label} direction component`),
	);
	if (
		directionToSourceUpEastNorth.some((component) => component < -1 || component > 1) ||
		Math.abs(Math.hypot(...directionToSourceUpEastNorth) - 1) > UNIT_VECTOR_TOLERANCE
	) {
		throw new TypeError(`${label} direction must be a unit vector.`);
	}
	return {
		id,
		instant,
		directionToSourceUpEastNorth: /** @type {[number, number, number]} */ (directionToSourceUpEastNorth),
		sourceIdentity,
	};
}

/**
 * Called by source validators to accept one finite physical value with an exact unit.
 * Throws when the value is missing, non-finite, negative, or expressed in another unit.
 *
 * @template {string} TUnits
 * @param {unknown} value - Candidate physical measurement.
 * @param {TUnits} units - Required unit identity.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationMeasuredValue<TUnits>} - Accepted normalized measurement.
 */
function acceptMeasuredValue(value, units, label) {
	const measurement = requireRecord(value, label);
	requireExactKeys(measurement, ['value', 'units'], label);
	const acceptedValue = requireNonnegativeNumber(measurement.value, `${label} value`);
	if (measurement.units !== units) throw new TypeError(`${label} units are unsupported.`);
	return {value: acceptedValue, units};
}

/**
 * Called by scene-manifest ingress to validate the immutable source derivation.
 * Throws when provenance, operation, parameters, implementation, or output identities are incomplete.
 *
 * @param {unknown} value - Candidate production derivation.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationSourceDerivation} - Accepted normalized derivation.
 */
function acceptSourceDerivation(value, label) {
	const derivation = requireRecord(value, label);
	requireExactKeys(
		derivation,
		['schemaId', 'parentInventoryIndexSha256', 'parentCacheIdentities', 'operation', 'parameters', 'implementation', 'outputs'],
		label,
	);
	if (derivation.schemaId !== 'algorithm32-distant-sun-bin-covered-runtime-derivation-v1') {
		throw new TypeError(`${label} schema is unsupported.`);
	}
	const parentInventoryIndexSha256 = requireSha256(
		derivation.parentInventoryIndexSha256,
		`${label} parent inventory index`,
	);
	if (!Array.isArray(derivation.parentCacheIdentities) || derivation.parentCacheIdentities.length === 0) {
		throw new TypeError(`${label} parent cache identities are required.`);
	}
	const parentCacheIdentities = derivation.parentCacheIdentities.map((identity, index) =>
		requireString(identity, `${label} parent cache identity ${index}`),
	);
	const operation = requireString(derivation.operation, `${label} operation`);
	const parameters = acceptE1SceneSelection(derivation.parameters, `${label} parameters`);
	const implementation = requireContractPath(derivation.implementation, `${label} implementation`);
	const outputs = requireRecord(derivation.outputs, `${label} outputs`);
	requireExactKeys(outputs, ['ledgerSha256', 'exactSha256', 'logicalToUniqueIndexSha256'], `${label} outputs`);
	const ledgerSha256 = requireSha256(outputs.ledgerSha256, `${label} output ledgerSha256`);
	const exactSha256 = requireSha256(outputs.exactSha256, `${label} output exactSha256`);
	const logicalToUniqueIndexSha256 = requireSha256(
		outputs.logicalToUniqueIndexSha256,
		`${label} output logicalToUniqueIndexSha256`,
	);
	return {
		schemaId: 'algorithm32-distant-sun-bin-covered-runtime-derivation-v1',
		parentInventoryIndexSha256,
		parentCacheIdentities,
		operation,
		parameters,
		implementation,
		outputs: {
			ledgerSha256,
			exactSha256,
			logicalToUniqueIndexSha256,
		},
	};
}

/**
 * Called by row-ledger ingress to validate the physical support contract.
 * Throws when identities, measurements, units, or required support flags differ.
 *
 * @param {unknown} value - Candidate ledger support.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationLedgerSupport} - Accepted normalized support.
 */
function acceptLedgerSupport(value, label) {
	const support = requireRecord(value, label);
	requireExactKeys(
		support,
		['id', 'bottomRadius', 'topRadius', 'observerAltitude', 'observerSolarZenith', 'completeCameraRotation', 'arbitraryShortenedEndpoint'],
		label,
	);
	if (
		support.id !== 'san-jose-fixed-observer-complete-rotation-v1' ||
		support.completeCameraRotation !== true ||
		support.arbitraryShortenedEndpoint !== true
	) {
		throw new TypeError(`${label} identity or flags are unsupported.`);
	}
	const bottomRadius = acceptMeasuredValue(support.bottomRadius, 'meters', `${label} bottomRadius`);
	const topRadius = acceptMeasuredValue(support.topRadius, 'meters', `${label} topRadius`);
	const observerAltitude = acceptMeasuredValue(support.observerAltitude, 'meters', `${label} observerAltitude`);
	const observerSolarZenith = acceptMeasuredValue(
		support.observerSolarZenith,
		'radians',
		`${label} observerSolarZenith`,
	);
	if (
		bottomRadius.value !== 6_360_000 ||
		topRadius.value !== 6_420_000 ||
		observerAltitude.value !== 1.7 ||
		topRadius.value <= bottomRadius.value
	) {
		throw new TypeError(`${label} fixed physical support is incoherent.`);
	}
	return {
		id: 'san-jose-fixed-observer-complete-rotation-v1',
		bottomRadius,
		topRadius,
		observerAltitude,
		observerSolarZenith,
		completeCameraRotation: true,
		arbitraryShortenedEndpoint: true,
	};
}

/**
 * Call this function to validate the complete scene-manifest ingress contract consumed by C0 and E1.
 * Rejects missing, extra, malformed, or unsupported fields; callers must reject the package before derivation.
 *
 * @param {unknown} value - Candidate manifest.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationSceneManifest} - Accepted manifest.
 */
function acceptSceneManifest(value, label) {
	const manifest = requireRecord(value, label);
	requireExactKeys(
		manifest,
		[
			'schemaId',
			'cacheIdentity',
			'selection',
			'sceneSun',
			'atmosphereIdentity',
			'geometryIdentity',
			'groundIdentity',
			'numericalIdentity',
			'ledgerPath',
			'ledgerSha256',
			'exactSeamPayload',
			'logicalToUniqueIndex',
			'derivation',
		],
		label,
	);
	if (manifest.schemaId !== 'algorithm32-distant-sun-runtime-scene-cache-manifest-v2') {
		throw new TypeError(`${label} schema is unsupported.`);
	}
	const cacheIdentity = requireString(manifest.cacheIdentity, `${label} cacheIdentity`);
	const selection = acceptE1SceneSelection(manifest.selection, `${label} selection`);
	const sceneSun = acceptE1SceneSun(manifest.sceneSun, `${label} sceneSun`);
	const compatibility = {};
	for (const name of ['atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity']) {
		compatibility[name] = requireString(manifest[name], `${label} ${name}`);
	}
	const ledgerPath = requireContractPath(manifest.ledgerPath, `${label} ledgerPath`);
	const ledgerSha256 = requireSha256(manifest.ledgerSha256, `${label} ledgerSha256`);
	const artifacts = {};
	for (const name of ['exactSeamPayload', 'logicalToUniqueIndex']) {
		const artifact = requireRecord(manifest[name], `${label} ${name}`);
		requireExactKeys(artifact, ['path', 'byteLength', 'sha256', 'codecId'], `${label} ${name}`);
		requireContractPath(artifact.path, `${label} ${name} path`);
		requireCount(artifact.byteLength, `${label} ${name} byteLength`);
		requireSha256(artifact.sha256, `${label} ${name} sha256`);
		if (artifact.codecId !== E1_DIRECTION_LAYOUT_ID) throw new TypeError(`${label} ${name} codec is unsupported.`);
		artifacts[name] = {
			path: artifact.path,
			byteLength: artifact.byteLength,
			sha256: artifact.sha256,
			codecId: artifact.codecId,
		};
	}
	const derivation = acceptSourceDerivation(manifest.derivation, `${label} derivation`);
	if (
		JSON.stringify(derivation.parameters) !== JSON.stringify(selection) ||
		derivation.outputs.ledgerSha256 !== ledgerSha256 ||
		derivation.outputs.exactSha256 !== artifacts.exactSeamPayload.sha256 ||
		derivation.outputs.logicalToUniqueIndexSha256 !== artifacts.logicalToUniqueIndex.sha256
	) {
		throw new TypeError(`${label} derivation relationships are incoherent.`);
	}
	return /** @type {CacheOptimizationSceneManifest} */ ({
		schemaId: 'algorithm32-distant-sun-runtime-scene-cache-manifest-v2',
		cacheIdentity,
		selection,
		sceneSun,
		...compatibility,
		ledgerPath,
		ledgerSha256,
		exactSeamPayload: artifacts.exactSeamPayload,
		logicalToUniqueIndex: artifacts.logicalToUniqueIndex,
		derivation,
	});
}

/**
 * Call this function to validate the packed-row-ledger fields consumed by C0.
 *
 * @param {unknown} value - Candidate ledger.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationRowLedger} - Accepted ledger.
 */
function acceptRowLedger(value, label) {
	const ledger = requireRecord(value, label);
	requireExactKeys(
		ledger,
		['schemaId', 'sceneSun', 'support', 'rows', 'retainedBlockCount', 'oracleByteLength', 'exactSeamByteLength'],
		label,
	);
	if (ledger.schemaId !== 'algorithm32-distant-sun-packed-row-ledger-v1' || !Array.isArray(ledger.rows)) {
		throw new TypeError(`${label} schema or rows are invalid.`);
	}
	const sceneSun = acceptE1SceneSun(ledger.sceneSun, `${label} sceneSun`);
	const support = acceptLedgerSupport(ledger.support, `${label} support`);
	const derivedObserverSolarZenith = Math.acos(sceneSun.directionToSourceUpEastNorth[0]);
	if (
		!Number.isFinite(derivedObserverSolarZenith) ||
		Math.abs(support.observerSolarZenith.value - derivedObserverSolarZenith) > UNIT_VECTOR_TOLERANCE
	) {
		throw new TypeError(`${label} observer solar zenith differs from its scene-Sun direction.`);
	}
	let expectedPackedRow = 0;
	const rows = ledger.rows.map((candidate, index) => {
		const row = requireRecord(candidate, `${label} row ${index}`);
		requireExactKeys(
			row,
			['altitudeIndex', 'altitude', 'firstSolarZenithIndex', 'lastSolarZenithIndex', 'firstPackedRow', 'packedRowCount'],
			`${label} row ${index}`,
		);
		const altitudeIndex = requireCount(row.altitudeIndex, `${label} row ${index} altitudeIndex`);
		const firstSolarZenithIndex = requireCount(
			row.firstSolarZenithIndex,
			`${label} row ${index} firstSolarZenithIndex`,
		);
		const lastSolarZenithIndex = requireCount(
			row.lastSolarZenithIndex,
			`${label} row ${index} lastSolarZenithIndex`,
		);
		const firstPackedRow = requireCount(row.firstPackedRow, `${label} row ${index} firstPackedRow`);
		const packedRowCount = requireCount(row.packedRowCount, `${label} row ${index} packedRowCount`);
		const altitude = acceptMeasuredValue(row.altitude, 'meters', `${label} row ${index} altitude`);
		if (
			lastSolarZenithIndex < firstSolarZenithIndex ||
			packedRowCount !== lastSolarZenithIndex - firstSolarZenithIndex + 1
		) {
			throw new TypeError(`${label} row ${index} span is incoherent.`);
		}
		if (firstPackedRow !== expectedPackedRow) throw new TypeError(`${label} row ${index} packed offset is incoherent.`);
		expectedPackedRow += packedRowCount;
		return {
			altitudeIndex,
			altitude,
			firstSolarZenithIndex,
			lastSolarZenithIndex,
			firstPackedRow,
			packedRowCount,
		};
	});
	const retainedBlockCount = requireCount(ledger.retainedBlockCount, `${label} retainedBlockCount`);
	const oracleByteLength = requireCount(ledger.oracleByteLength, `${label} oracleByteLength`);
	const exactSeamByteLength = requireCount(ledger.exactSeamByteLength, `${label} exactSeamByteLength`);
	if (
		rows.reduce((sum, row) => sum + row.packedRowCount, 0) !== retainedBlockCount ||
		exactSeamByteLength !==
			retainedBlockCount * E1_CHANNEL_COUNT * E1_DIRECTION_ROW_BYTE_LENGTH +
			E1_LOGICAL_DIRECTION_COUNT * Uint16Array.BYTES_PER_ELEMENT ||
		oracleByteLength < exactSeamByteLength
	) {
		throw new TypeError(`${label} retained row or byte total is incoherent.`);
	}
	return {
		schemaId: 'algorithm32-distant-sun-packed-row-ledger-v1',
		sceneSun,
		support,
		rows,
		retainedBlockCount,
		oracleByteLength,
		exactSeamByteLength,
	};
}

/**
 * Call this function to validate the checked-in E1 comparison matrix and immutable parent.
 * Rejects any changed matrix, policy, bound, scenario, or parent; callers must not run an unaccepted contract.
 *
 * @param {unknown} value - Candidate E1 contract.
 * @returns {CacheOptimizationE1CandidateContract} - Accepted contract.
 */
function acceptE1CandidateContract(value) {
	const contract = requireRecord(value, 'E1 candidate contract');
	requireExactKeys(
		contract,
		['schemaId', 'layouts', 'zstandardLevels', 'shuffle', 'acceptedC0', 'selectionPolicy', 'bounds', 'scenarios'],
		'E1 candidate contract',
	);
	if (contract.schemaId !== 'distant-sun-cache-optimization-e1-candidate-contract-v1') {
		throw new TypeError('E1 candidate contract schema is unsupported.');
	}
	if (!Array.isArray(contract.layouts) || contract.layouts.length !== 4) throw new TypeError('E1 requires four layouts.');
	requireExactJson(contract.layouts.map((layout) => requireRecord(layout, 'E1 layout')), [
		{id: '2x8', altitudeCount: 2, solarZenithCount: 8},
		{id: '4x8', altitudeCount: 4, solarZenithCount: 8},
		{id: '4x16', altitudeCount: 4, solarZenithCount: 16},
		{id: '8x8', altitudeCount: 8, solarZenithCount: 8},
	], 'E1 layouts');
	requireExactJson(contract.zstandardLevels, [1, 3, 6], 'E1 Zstandard profiles');
	if (contract.shuffle !== 'float32-byte-lane-v1') throw new TypeError('E1 shuffle is unsupported.');
	const parent = requireRecord(contract.acceptedC0, 'E1 accepted C0');
	requireExactKeys(parent, ['runId', 'artifactSetSha256'], 'E1 accepted C0');
	requireString(parent.runId, 'E1 accepted C0 runId');
	requireSha256(parent.artifactSetSha256, 'E1 accepted C0 artifactSetSha256');
	requireExactJson(
		parent,
		{
			runId: '000022-c0-production-control',
			artifactSetSha256: '0cbe7d12045136623a254852c19eb3eddc0e36127d404d8c63169c4147ee24a7',
		},
		'E1 accepted C0',
	);
	const selectionPolicy = requireRecord(contract.selectionPolicy, 'E1 selection policy');
	requireExactKeys(
		selectionPolicy,
		['primaryMetric', 'maximumGrowthRatioFromMinimum', 'withinBandPriority'],
		'E1 selection policy',
	);
	if (
		selectionPolicy.primaryMetric !== 'completeByteLength' ||
		selectionPolicy.maximumGrowthRatioFromMinimum !== 0.01
	) {
		throw new TypeError('E1 selection materiality rule changed.');
	}
	requireExactJson(
		selectionPolicy.withinBandPriority,
		['coldEncodedByteLength', 'coldRequestCount', 'encodeMilliseconds'],
		'E1 within-band priority',
	);
	const bounds = requireRecord(contract.bounds, 'E1 bounds');
	requireExactKeys(
		bounds,
		[
			'maximumCompleteByteLength',
			'maximumDecodedBlockByteLength',
			'maximumScenePayloadByteLength',
			'maximumTotalElapsedMilliseconds',
			'decodedRetentionByteLength',
		],
		'E1 bounds',
	);
	for (const key of [
		'maximumCompleteByteLength',
		'maximumDecodedBlockByteLength',
		'maximumScenePayloadByteLength',
		'maximumTotalElapsedMilliseconds',
		'decodedRetentionByteLength',
	]) {
		requireCount(bounds[key], `E1 bounds ${key}`);
	}
	requireExactJson(
		bounds,
		{
			maximumCompleteByteLength: 600_000_000,
			maximumDecodedBlockByteLength: 16_777_216,
			maximumScenePayloadByteLength: 161_183_760,
			maximumTotalElapsedMilliseconds: 900_000,
			decodedRetentionByteLength: 67_108_864,
		},
		'E1 bounds',
	);
	const scenarios = requireRecord(contract.scenarios, 'E1 scenarios');
	requireExactKeys(
		scenarios,
		['coldSceneDegrees', 'adjacentSceneDegrees', 'nonadjacentSceneDegrees', 'warmSceneDegrees'],
		'E1 scenarios',
	);
	for (const key of ['coldSceneDegrees', 'adjacentSceneDegrees', 'nonadjacentSceneDegrees', 'warmSceneDegrees']) {
		requireCount(scenarios[key], `E1 scenarios ${key}`);
	}
	requireExactJson(
		scenarios,
		{coldSceneDegrees: 90, adjacentSceneDegrees: 91, nonadjacentSceneDegrees: 30, warmSceneDegrees: 90},
		'E1 scenarios',
	);
	return /** @type {CacheOptimizationE1CandidateContract} */ (contract);
}

/**
 * Call this function to validate the catalog-wide E1 scene-selection contract.
 * Rejects any boundary or rule that differs from the accepted production catalog.
 *
 * @param {unknown} value - Candidate catalog-selection contract.
 * @returns {CacheOptimizationE1CatalogSelection} - Accepted selection contract.
 */
function acceptE1CatalogSelection(value) {
	const selection = requireRecord(value, 'E1 catalog selection');
	requireExactKeys(
		selection,
		[
			'kind',
			'darkFromSolarZenithDegrees',
			'startSolarZenithDegrees',
			'endSolarZenithDegrees',
			'incrementDegrees',
			'minimumInputDegrees',
			'maximumInputExclusiveDegrees',
		],
		'E1 catalog selection',
	);
	if (
		selection.kind !== 'ledger-covered-nearest-integer-half-up-v1' ||
		selection.darkFromSolarZenithDegrees !== 108 ||
		selection.startSolarZenithDegrees !== 0 ||
		selection.endSolarZenithDegrees !== 108 ||
		selection.incrementDegrees !== 1 ||
		selection.minimumInputDegrees !== 0 ||
		selection.maximumInputExclusiveDegrees !== 108
	) {
		throw new TypeError('E1 catalog selection differs from the accepted production contract.');
	}
	return /** @type {CacheOptimizationE1CatalogSelection} */ (selection);
}

/**
 * Call this function to validate an E1 graph root.
 * Rejects malformed or incomplete roots; callers must not traverse an unaccepted graph.
 *
 * @param {unknown} value - Candidate package-set report.
 * @returns {CacheOptimizationE1PackageSetReport} - Accepted graph root.
 */
function acceptE1PackageSetReport(value) {
	const report = requireRecord(value, 'E1 package-set report');
	requireExactKeys(
		report,
		['schemaId', 'parent', 'build', 'configuration', 'configurationIdentity', 'codec', 'catalog', 'catalogSelectionIdentity'],
		'E1 package-set report',
	);
	if (report.schemaId !== 'distant-sun-cache-package-set-report-v1') throw new TypeError('E1 package-set report schema is unsupported.');
	const parent = requireRecord(report.parent, 'E1 package-set parent');
	requireExactKeys(parent, ['runId', 'artifactSetSha256'], 'E1 package-set parent');
	requireString(parent.runId, 'E1 package-set parent runId');
	requireSha256(parent.artifactSetSha256, 'E1 package-set parent hash');
	const build = requireRecord(report.build, 'E1 package-set build');
	requireExactKeys(build, ['generator', 'implementationSetSha256', 'sourceCatalog'], 'E1 package-set build');
	acceptFileIdentity(build.generator, 'E1 package-set generator');
	requireSha256(build.implementationSetSha256, 'E1 package-set implementation set');
	acceptFileIdentity(build.sourceCatalog, 'E1 package-set source catalog');
	acceptFileIdentity(report.configuration, 'E1 package-set configuration');
	requireSha256(report.configurationIdentity, 'E1 package-set configuration identity');
	const codec = requireRecord(report.codec, 'E1 package-set codec');
	requireExactKeys(codec, ['id', 'level', 'implementation'], 'E1 package-set codec');
	const codecLevel = requireCount(codec.level, 'E1 package-set codec level');
	if (codec.id !== 'zstandard' || ![1, 3, 6].includes(codecLevel)) throw new TypeError('E1 package-set codec is unsupported.');
	requireString(codec.implementation, 'E1 package-set codec implementation');
	acceptFileIdentity(report.catalog, 'E1 package-set catalog');
	requireSha256(report.catalogSelectionIdentity, 'E1 package-set catalog selection identity');
	return /** @type {CacheOptimizationE1PackageSetReport} */ (report);
}

/**
 * Call this function to validate the complete E1 runtime catalog.
 * Rejects malformed or incomplete catalogs; callers must not resolve their scenes.
 *
 * @param {unknown} value - Candidate runtime catalog.
 * @returns {CacheOptimizationE1RuntimeCatalog} - Accepted runtime catalog.
 */
function acceptE1RuntimeCatalog(value) {
	const catalog = requireRecord(value, 'E1 runtime catalog');
	requireExactKeys(catalog, ['schemaId', 'selection', 'scenes'], 'E1 runtime catalog');
	if (catalog.schemaId !== 'distant-sun-cache-runtime-catalog-v1' || !Array.isArray(catalog.scenes) || catalog.scenes.length !== 109) throw new TypeError('E1 runtime catalog is invalid.');
	const selection = acceptE1CatalogSelection(catalog.selection);
	for (const [index, valueEntry] of catalog.scenes.entries()) {
		const entry = requireRecord(valueEntry, `E1 catalog scene ${index}`);
		requireExactKeys(entry, ['id', 'representativeSolarZenithDegrees', 'manifest'], `E1 catalog scene ${index}`);
		const id = requireString(entry.id, `E1 catalog scene ${index} id`);
		const degrees = requireCount(entry.representativeSolarZenithDegrees, `E1 catalog scene ${index} degrees`);
		const expectedDegrees = selection.startSolarZenithDegrees + index * selection.incrementDegrees;
		if (degrees !== expectedDegrees || id !== `solar-zenith-${String(expectedDegrees).padStart(3, '0')}-degrees`) {
			throw new TypeError(`E1 catalog scene ${index} breaks the accepted ordered coverage.`);
		}
		acceptFileIdentity(entry.manifest, `E1 catalog scene ${index} manifest`);
	}
	return /** @type {CacheOptimizationE1RuntimeCatalog} */ (catalog);
}

/**
 * Call this function to validate the closed E1 physical, layout, and codec contract.
 * Rejects unsupported or incoherent values; callers must reject the candidate.
 *
 * @param {unknown} value - Candidate configuration manifest.
 * @returns {CacheOptimizationE1ConfigurationManifest} - Accepted configuration manifest.
 */
function acceptE1ConfigurationManifest(value) {
	const manifest = requireRecord(value, 'E1 configuration manifest');
	requireExactKeys(
		manifest,
		['schemaId', 'configurationIdentity', 'atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity', 'directionLayout', 'spectralLayout', 'coordinateDomains', 'blockGrid', 'layout', 'codec', 'shuffle', 'rowByteLength', 'distinctCoordinateCount', 'blockIndex'],
		'E1 configuration manifest',
	);
	if (manifest.schemaId !== 'distant-sun-cache-configuration-manifest-v1') throw new TypeError('E1 configuration schema is unsupported.');
	for (const key of ['configurationIdentity', 'atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity']) requireString(manifest[key], `E1 configuration ${key}`);
	requireSha256(manifest.configurationIdentity, 'E1 configuration identity');
	if (manifest.shuffle !== 'float32-byte-lane-v1') throw new TypeError('E1 configuration shuffle is unsupported.');
	requireCount(manifest.rowByteLength, 'E1 configuration rowByteLength');
	requireCount(manifest.distinctCoordinateCount, 'E1 configuration coordinate count');
	acceptFileIdentity(manifest.blockIndex, 'E1 configuration block index');
	const direction = requireRecord(manifest.directionLayout, 'E1 direction layout');
	requireExactKeys(direction, ['id', 'uniqueDirectionCount', 'logicalDirectionCount', 'logicalToUniqueIndexSha256'], 'E1 direction layout');
	if (
		direction.id !== E1_DIRECTION_LAYOUT_ID ||
		direction.uniqueDirectionCount !== E1_UNIQUE_DIRECTION_COUNT ||
		direction.logicalDirectionCount !== E1_LOGICAL_DIRECTION_COUNT
	) {
		throw new TypeError('E1 direction layout is unsupported.');
	}
	requireSha256(direction.logicalToUniqueIndexSha256, 'E1 logical-to-unique hash');
	const spectral = requireRecord(manifest.spectralLayout, 'E1 spectral layout');
	requireExactKeys(spectral, ['id', 'channelCount', 'order'], 'E1 spectral layout');
	if (spectral.id !== 'Native15' || spectral.channelCount !== E1_CHANNEL_COUNT || spectral.order !== 'wavelength-major') throw new TypeError('E1 spectral layout is unsupported.');
	if (manifest.rowByteLength !== spectral.channelCount * direction.uniqueDirectionCount * Float32Array.BYTES_PER_ELEMENT) throw new TypeError('E1 row byte length differs from its declared spectral and direction layout.');
	const domains = requireRecord(manifest.coordinateDomains, 'E1 coordinate domains');
	requireExactKeys(domains, ['altitude', 'solarZenith'], 'E1 coordinate domains');
	const altitude = requireRecord(domains.altitude, 'E1 altitude domain');
	requireExactKeys(altitude, ['firstIndex', 'count'], 'E1 altitude domain');
	const solar = requireRecord(domains.solarZenith, 'E1 solar-zenith domain');
	requireExactKeys(solar, ['firstIndex', 'count', 'binWidthDegrees'], 'E1 solar-zenith domain');
	const altitudeFirstIndex = requireCount(altitude.firstIndex, 'E1 altitude first index');
	const altitudeCount = requireCount(altitude.count, 'E1 altitude count');
	const solarFirstIndex = requireCount(solar.firstIndex, 'E1 solar-zenith first index');
	const solarCount = requireCount(solar.count, 'E1 solar-zenith count');
	const solarBinWidthDegrees = requireNonnegativeNumber(solar.binWidthDegrees, 'E1 solar-zenith bin width');
	if (
		altitudeFirstIndex !== 0 ||
		altitudeCount !== 48 ||
		solarFirstIndex !== 0 ||
		solarCount !== 180 ||
		solarBinWidthDegrees !== 1
	) {
		throw new TypeError('E1 coordinate domains differ from the frozen production grid.');
	}
	const grid = requireRecord(manifest.blockGrid, 'E1 block grid');
	requireExactKeys(grid, ['altitudeCount', 'solarZenithCount', 'coordinateOrder', 'payloadOrder', 'omitUnpopulatedCoordinates'], 'E1 block grid');
	const gridAltitudeCount = requireCount(grid.altitudeCount, 'E1 block grid altitudeCount');
	const gridSolarZenithCount = requireCount(grid.solarZenithCount, 'E1 block grid solarZenithCount');
	if (grid.coordinateOrder !== 'altitude-then-solar-zenith' || grid.payloadOrder !== 'wavelength-then-coordinate-then-direction' || grid.omitUnpopulatedCoordinates !== true) throw new TypeError('E1 block-grid ordering is unsupported.');
	const layout = requireRecord(manifest.layout, 'E1 layout');
	requireExactKeys(layout, ['id', 'altitudeCount', 'solarZenithCount'], 'E1 layout');
	const layoutId = requireString(layout.id, 'E1 layout id');
	const dimensions = E1_LAYOUT_DIMENSIONS[layoutId];
	if (
		!dimensions ||
		layout.altitudeCount !== dimensions.altitudeCount ||
		layout.solarZenithCount !== dimensions.solarZenithCount ||
		gridAltitudeCount !== dimensions.altitudeCount ||
		gridSolarZenithCount !== dimensions.solarZenithCount
	) {
		throw new TypeError('E1 layout identity or block-grid dimensions are incoherent.');
	}
	const codec = requireRecord(manifest.codec, 'E1 codec');
	requireExactKeys(codec, ['id', 'level', 'implementation'], 'E1 codec');
	const codecLevel = requireCount(codec.level, 'E1 codec level');
	if (codec.id !== 'zstandard' || ![1, 3, 6].includes(codecLevel)) throw new TypeError('E1 codec is unsupported.');
	requireString(codec.implementation, 'E1 codec implementation');
	return /** @type {CacheOptimizationE1ConfigurationManifest} */ (manifest);
}

/**
 * Call this function to validate an E1 block index and its derivation records.
 * Rejects malformed entries; callers must not read their encoded artifacts.
 *
 * @param {unknown} value - Candidate block index.
 * @returns {CacheOptimizationE1BlockIndex} - Accepted block index.
 */
function acceptE1BlockIndex(value) {
	const index = requireRecord(value, 'E1 block index');
	requireExactKeys(index, ['schemaId', 'rowByteLength', 'distinctCoordinateCount', 'blocks'], 'E1 block index');
	if (index.schemaId !== 'distant-sun-cache-block-index-v1' || !Array.isArray(index.blocks)) throw new TypeError('E1 block index is invalid.');
	requireCount(index.rowByteLength, 'E1 block index rowByteLength');
	requireCount(index.distinctCoordinateCount, 'E1 block index coordinate count');
	for (const [blockIndex, valueBlock] of index.blocks.entries()) {
		const block = requireRecord(valueBlock, `E1 block ${blockIndex}`);
		requireExactKeys(block, ['id', 'tile', 'rowCount', 'decodedByteLength', 'decodedSha256', 'encodedByteLength', 'encodedSha256', 'path', 'coordinates', 'derivation'], `E1 block ${blockIndex}`);
		requireString(block.id, `E1 block ${blockIndex} id`);
		const tile = requireRecord(block.tile, `E1 block ${blockIndex} tile`);
		requireExactKeys(tile, ['altitudeIndex', 'solarZenithIndex'], `E1 block ${blockIndex} tile`);
		requireCount(tile.altitudeIndex, `E1 block ${blockIndex} tile altitude`);
		requireCount(tile.solarZenithIndex, `E1 block ${blockIndex} tile solar zenith`);
		for (const key of ['rowCount', 'decodedByteLength', 'encodedByteLength']) requireCount(block[key], `E1 block ${blockIndex} ${key}`);
		requireSha256(block.decodedSha256, `E1 block ${blockIndex} decoded hash`);
		requireSha256(block.encodedSha256, `E1 block ${blockIndex} encoded hash`);
		requireContractPath(block.path, `E1 block ${blockIndex} path`);
		if (!Array.isArray(block.coordinates) || block.coordinates.length !== block.rowCount) throw new TypeError(`E1 block ${blockIndex} coordinates are invalid.`);
		for (const [coordinateIndex, coordinate] of block.coordinates.entries()) {
			if (!Array.isArray(coordinate) || coordinate.length !== 2) throw new TypeError(`E1 block ${blockIndex} coordinate ${coordinateIndex} is invalid.`);
			requireCount(coordinate[0], `E1 block ${blockIndex} altitude index`);
			requireCount(coordinate[1], `E1 block ${blockIndex} solar index`);
		}
		const derivation = requireRecord(block.derivation, `E1 block ${blockIndex} derivation`);
		requireExactKeys(derivation, ['parentRunId', 'parentArtifactSetSha256', 'operation', 'configurationIdentity'], `E1 block ${blockIndex} derivation`);
		requireString(derivation.parentRunId, `E1 block ${blockIndex} parent run`);
		requireSha256(derivation.parentArtifactSetSha256, `E1 block ${blockIndex} parent artifact set`);
		requireString(derivation.operation, `E1 block ${blockIndex} operation`);
		requireSha256(derivation.configurationIdentity, `E1 block ${blockIndex} configuration identity`);
	}
	return /** @type {CacheOptimizationE1BlockIndex} */ (index);
}

/**
 * Call this function to validate one E1 scene and its block segments.
 * Rejects malformed or incomplete scenes; callers must not reconstruct them.
 *
 * @param {unknown} value - Candidate scene manifest.
 * @returns {CacheOptimizationE1SceneManifest} - Accepted scene manifest.
 */
function acceptE1SceneManifest(value) {
	const manifest = requireRecord(value, 'E1 scene manifest');
	requireExactKeys(manifest, ['schemaId', 'id', 'representativeSolarZenithDegrees', 'selection', 'sceneSun', 'compatibility', 'ledger', 'sourceManifestSha256', 'payloadSha256', 'payloadByteLength', 'segments'], 'E1 scene manifest');
	if (manifest.schemaId !== 'distant-sun-cache-scene-manifest-v1') throw new TypeError('E1 scene manifest schema is unsupported.');
	const id = requireString(manifest.id, 'E1 scene id');
	const representativeSolarZenithDegrees = requireCount(
		manifest.representativeSolarZenithDegrees,
		'E1 scene degrees',
	);
	const selection = acceptE1SceneSelection(manifest.selection, 'E1 scene selection');
	const sceneSun = acceptE1SceneSun(manifest.sceneSun, 'E1 scene sun');
	const compatibilityValue = requireRecord(manifest.compatibility, 'E1 scene compatibility');
	requireExactKeys(compatibilityValue, ['cacheIdentity', 'atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity'], 'E1 scene compatibility');
	const compatibility = {
		cacheIdentity: requireString(compatibilityValue.cacheIdentity, 'E1 scene compatibility cacheIdentity'),
		atmosphereIdentity: requireString(compatibilityValue.atmosphereIdentity, 'E1 scene compatibility atmosphereIdentity'),
		geometryIdentity: requireString(compatibilityValue.geometryIdentity, 'E1 scene compatibility geometryIdentity'),
		groundIdentity: requireString(compatibilityValue.groundIdentity, 'E1 scene compatibility groundIdentity'),
		numericalIdentity: requireString(compatibilityValue.numericalIdentity, 'E1 scene compatibility numericalIdentity'),
	};
	const ledger = acceptRowLedger(manifest.ledger, `E1 scene ${manifest.id} ledger`);
	const sourceManifestSha256 = requireSha256(manifest.sourceManifestSha256, 'E1 source manifest hash');
	const payloadSha256 = requireSha256(manifest.payloadSha256, 'E1 scene payload hash');
	const payloadByteLength = requireCount(manifest.payloadByteLength, 'E1 scene payload length');
	if (!Array.isArray(manifest.segments)) throw new TypeError('E1 scene segments must be an array.');
	const segments = manifest.segments.map((valueSegment, index) => {
		const segment = requireRecord(valueSegment, `E1 scene segment ${index}`);
		requireExactKeys(segment, ['blockIndex', 'firstBlockRow', 'rowCount'], `E1 scene segment ${index}`);
		for (const key of ['blockIndex', 'firstBlockRow', 'rowCount']) requireCount(segment[key], `E1 scene segment ${index} ${key}`);
		return {blockIndex: segment.blockIndex, firstBlockRow: segment.firstBlockRow, rowCount: segment.rowCount};
	});
	return /** @type {CacheOptimizationE1SceneManifest} */ ({
		schemaId: 'distant-sun-cache-scene-manifest-v1',
		id,
		representativeSolarZenithDegrees,
		selection,
		sceneSun,
		compatibility,
		ledger,
		sourceManifestSha256,
		payloadSha256,
		payloadByteLength,
		segments,
	});
}

/**
 * Call this function to validate the critical exactness, matrix, recommendation, and bound claims of an accepted E1 result.
 * Rejects incomplete, unsupported, non-finite, or arithmetically incoherent claims; callers must reject the run.
 *
 * @param {unknown} value - Candidate E1 result.
 * @returns {CacheOptimizationE1Result} - Accepted E1 result.
 */
function acceptE1Result(value) {
	const result = requireRecord(value, 'E1 result');
	requireExactKeys(result, ['schemaId', 'runId', 'conclusion', 'accepted', 'parent', 'exactness', 'candidates', 'recommendation', 'bounds', 'totalElapsedMilliseconds', 'claimBoundary'], 'E1 result');
	if (result.schemaId !== 'distant-sun-cache-optimization-e1-result-v2' || result.accepted !== true || result.conclusion !== 'accepted') {
		throw new TypeError('E1 result is not an accepted v2 result.');
	}
	requireString(result.runId, 'E1 result runId');
	const parent = requireRecord(result.parent, 'E1 parent');
	requireExactKeys(parent, ['runId', 'artifactSetSha256'], 'E1 parent');
	requireString(parent.runId, 'E1 parent runId');
	requireSha256(parent.artifactSetSha256, 'E1 parent artifactSetSha256');
	if (parent.runId !== '000022-c0-production-control' || parent.artifactSetSha256 !== '0cbe7d12045136623a254852c19eb3eddc0e36127d404d8c63169c4147ee24a7') throw new TypeError('E1 parent is not the accepted C0 control.');
	const exactness = requireRecord(result.exactness, 'E1 exactness');
	requireExactKeys(exactness, ['sceneCount', 'checkedByteLength', 'byteDifferenceCount', 'matches'], 'E1 exactness');
	if (exactness.matches !== true || exactness.byteDifferenceCount !== 0 || exactness.sceneCount !== 109 || exactness.checkedByteLength !== 17_227_670_880) {
		throw new TypeError('E1 exactness claim is incomplete.');
	}
	if (!Array.isArray(result.candidates) || result.candidates.length !== 12) throw new TypeError('E1 result must contain 12 candidates.');
	const acceptedLayouts = new Set(['2x8', '4x8', '4x16', '8x8']);
	const acceptedLevels = new Set([1, 3, 6]);
	const matrix = new Set();
	/**
	 * Called by terminal validation to accept one complete E1 candidate summary.
	 * Throws when identity, metrics, arithmetic, or request relationships are malformed or incoherent.
	 *
	 * @param {unknown} valueCandidate - Candidate summary value.
	 * @param {string} label - Diagnostic identity.
	 * @returns {CacheOptimizationE1CandidateSummary} - Accepted candidate summary.
	 */
	const acceptCandidate = (valueCandidate, label) => {
		const candidate = requireRecord(valueCandidate, label);
		requireExactKeys(candidate, ['id', 'layoutId', 'zstandardLevel', 'blockCount', 'uniqueBlockArtifactCount', 'encodedByteLength', 'metadataByteLength', 'metadataArtifactCount', 'completeByteLength', 'maximumDecodedBlockByteLength', 'codec', 'requests', 'exactBlockCount'], label);
		const id = requireString(candidate.id, `${label} id`);
		const layoutId = requireString(candidate.layoutId, `${label} layoutId`);
		const zstandardLevel = requireCount(candidate.zstandardLevel, `${label} zstandardLevel`);
		if (!acceptedLayouts.has(layoutId) || !acceptedLevels.has(zstandardLevel) || id !== `${layoutId}-zstd-${zstandardLevel}`) throw new TypeError(`${label} identity is unsupported.`);
		const blockCount = requireCount(candidate.blockCount, `${label} blockCount`);
		const uniqueBlockArtifactCount = requireCount(
			candidate.uniqueBlockArtifactCount,
			`${label} uniqueBlockArtifactCount`,
		);
		const encodedByteLength = requireCount(candidate.encodedByteLength, `${label} encodedByteLength`);
		const metadataByteLength = requireCount(candidate.metadataByteLength, `${label} metadataByteLength`);
		requireCount(candidate.metadataArtifactCount, `${label} metadataArtifactCount`);
		const completeByteLength = requireCount(candidate.completeByteLength, `${label} completeByteLength`);
		requireCount(candidate.maximumDecodedBlockByteLength, `${label} maximumDecodedBlockByteLength`);
		const exactBlockCount = requireCount(candidate.exactBlockCount, `${label} exactBlockCount`);
		if (
			blockCount === 0 ||
			uniqueBlockArtifactCount > blockCount ||
			completeByteLength !== encodedByteLength + metadataByteLength ||
			exactBlockCount !== blockCount
		) {
			throw new TypeError(`${label} size or exactness arithmetic is inconsistent.`);
		}
		const codec = requireRecord(candidate.codec, `${label} codec`);
		requireExactKeys(codec, ['shuffleMilliseconds', 'encodeMilliseconds', 'decodeMilliseconds', 'inverseShuffleMilliseconds'], `${label} codec`);
		for (const [key, metric] of Object.entries(codec)) requireNonnegativeNumber(metric, `${label} codec ${key}`);
		const requests = requireRecord(candidate.requests, `${label} requests`);
		requireExactKeys(requests, ['model', 'cold', 'adjacent', 'nonadjacent', 'warm', 'neighborReuse', 'overfetch'], `${label} requests`);
		requireString(requests.model, `${label} request model`);
		const scenarioMetrics = {};
		for (const scenario of ['cold', 'adjacent', 'nonadjacent', 'warm']) {
			const metrics = requireRecord(requests[scenario], `${label} ${scenario}`);
			requireExactKeys(metrics, ['requestCount', 'encodedByteLength', 'blockRequestCount', 'metadataRequestCount', 'metadataByteLength'], `${label} ${scenario}`);
			const requestCount = requireCount(metrics.requestCount, `${label} ${scenario} requestCount`);
			const blockRequestCount = requireCount(metrics.blockRequestCount, `${label} ${scenario} blockRequestCount`);
			const metadataRequestCount = requireCount(
				metrics.metadataRequestCount,
				`${label} ${scenario} metadataRequestCount`,
			);
			requireCount(metrics.encodedByteLength, `${label} ${scenario} encodedByteLength`);
			requireCount(metrics.metadataByteLength, `${label} ${scenario} metadataByteLength`);
			if (requestCount !== blockRequestCount + metadataRequestCount) throw new TypeError(`${label} ${scenario} request arithmetic is inconsistent.`);
			scenarioMetrics[scenario] = {
				requestCount,
				encodedByteLength: metrics.encodedByteLength,
				blockRequestCount,
				metadataRequestCount,
				metadataByteLength: metrics.metadataByteLength,
			};
		}
		const reuse = requireRecord(requests.neighborReuse, `${label} neighbor reuse`);
		requireExactKeys(reuse, ['sharedBlockCount', 'requiredBlockCount'], `${label} neighbor reuse`);
		const sharedBlockCount = requireCount(reuse.sharedBlockCount, `${label} shared blocks`);
		const requiredBlockCount = requireCount(reuse.requiredBlockCount, `${label} required blocks`);
		if (sharedBlockCount + scenarioMetrics.adjacent.blockRequestCount !== requiredBlockCount) {
			throw new TypeError(`${label} neighbor-reuse arithmetic is inconsistent.`);
		}
		if (Object.values(scenarioMetrics.warm).some((metric) => metric !== 0)) {
			throw new TypeError(`${label} warm reuse must require zero work.`);
		}
		const overfetch = requireRecord(requests.overfetch, `${label} overfetch`);
		requireExactKeys(overfetch, ['minimumRatio', 'meanRatio', 'maximumRatio'], `${label} overfetch`);
		const minimumRatio = requireNonnegativeNumber(overfetch.minimumRatio, `${label} overfetch minimumRatio`);
		const meanRatio = requireNonnegativeNumber(overfetch.meanRatio, `${label} overfetch meanRatio`);
		const maximumRatio = requireNonnegativeNumber(overfetch.maximumRatio, `${label} overfetch maximumRatio`);
		if (minimumRatio < 1 || minimumRatio > meanRatio || meanRatio > maximumRatio) {
			throw new TypeError(`${label} overfetch distribution is inconsistent.`);
		}
		return /** @type {CacheOptimizationE1CandidateSummary} */ (candidate);
	};
	const candidates = result.candidates.map((valueCandidate, index) =>
		acceptCandidate(valueCandidate, `E1 candidate ${index}`),
	);
	for (const candidate of candidates) {
		if (matrix.has(candidate.id)) throw new TypeError('E1 candidate matrix contains a duplicate.');
		matrix.add(candidate.id);
	}
	const recommendation = acceptCandidate(result.recommendation, 'E1 recommendation');
	const minimum = Math.min(...candidates.map((candidate) => candidate.completeByteLength));
	const material = candidates.filter((candidate) => candidate.completeByteLength <= minimum * 1.01).sort((left, right) => left.requests.cold.encodedByteLength - right.requests.cold.encodedByteLength || left.requests.cold.requestCount - right.requests.cold.requestCount || left.codec.encodeMilliseconds - right.codec.encodeMilliseconds);
	if (recommendation.id !== material[0].id) throw new TypeError('E1 recommendation does not follow the frozen selection policy.');
	requireExactJson(recommendation, candidates.find((candidate) => candidate.id === recommendation.id), 'E1 recommendation candidate');
	const bounds = requireRecord(result.bounds, 'E1 result bounds');
	requireExactKeys(bounds, ['maximumCompleteByteLength', 'maximumDecodedBlockByteLength', 'maximumScenePayloadByteLength', 'maximumTotalElapsedMilliseconds', 'decodedRetentionByteLength', 'completeByteLengthPasses', 'decodedBlockByteLengthPasses', 'scenePayloadByteLengthPasses', 'totalElapsedMillisecondsPasses'], 'E1 result bounds');
	if (bounds.maximumCompleteByteLength !== 600_000_000 || bounds.maximumDecodedBlockByteLength !== 16_777_216 || bounds.maximumScenePayloadByteLength !== 161_183_760 || bounds.maximumTotalElapsedMilliseconds !== 900_000 || bounds.decodedRetentionByteLength !== 67_108_864) throw new TypeError('E1 result bounds changed.');
	if (bounds.completeByteLengthPasses !== true || bounds.decodedBlockByteLengthPasses !== true || bounds.scenePayloadByteLengthPasses !== true || bounds.totalElapsedMillisecondsPasses !== true) {
		throw new TypeError('E1 recommendation does not pass its declared bounds.');
	}
	if (recommendation.completeByteLength > bounds.maximumCompleteByteLength || recommendation.maximumDecodedBlockByteLength > bounds.maximumDecodedBlockByteLength) throw new TypeError('E1 recommendation exceeds a declared bound.');
	const totalElapsedMilliseconds = requireNonnegativeNumber(
		result.totalElapsedMilliseconds,
		'E1 total elapsed milliseconds',
	);
	if (totalElapsedMilliseconds > bounds.maximumTotalElapsedMilliseconds) throw new TypeError('E1 total elapsed time exceeds its declared bound.');
	requireString(result.claimBoundary, 'E1 claim boundary');
	return /** @type {CacheOptimizationE1Result} */ (result);
}

/**
 * Accept the closed browser transport evidence emitted by E2.
 * Rejects incomplete measurements, unsupported decoder claims, missing fault controls, and retention or concurrency violations.
 *
 * @param {unknown} value - Candidate E2 browser evidence.
 * @returns {CacheOptimizationE2BrowserResult} - Accepted E2 browser evidence.
 */
function acceptE2BrowserResult(value) {
	const result = requireRecord(value, 'E2 browser result');
	requireExactKeys(result, ['accepted', 'concurrency', 'decoder', 'faults', 'heapAfterBytes', 'heapBeforeBytes', 'mainThreadResponsivenessTicks', 'metrics', 'perSceneDecompaction', 'retainedBytes', 'retentionTargetBytes', 'schemaId'], 'E2 browser result');
	if (result.schemaId !== 'distant-sun-cache-optimization-e2-browser-result-v1' || result.accepted !== true || result.concurrency !== 4 || result.retentionTargetBytes !== 67_108_864) throw new TypeError('E2 browser evidence identity is unsupported.');
	const retainedBytes = requireCount(result.retainedBytes, 'E2 retained bytes');
	const retentionTargetBytes = requireCount(result.retentionTargetBytes, 'E2 retention target bytes');
	if (retainedBytes > retentionTargetBytes) throw new TypeError('E2 retained bytes exceed the target.');
	const decoder = requireRecord(result.decoder, 'E2 decoder');
	requireExactKeys(decoder, ['implementation', 'nativeZstandardSupported', 'selected'], 'E2 decoder');
	if (decoder.selected !== 'three-r180-zstddec-wasm' || decoder.implementation !== 'WebAssembly fallback' || typeof decoder.nativeZstandardSupported !== 'boolean') throw new TypeError('E2 decoder evidence is unsupported.');
	for (const key of ['heapBeforeBytes', 'heapAfterBytes']) if (result[key] !== null) requireCount(result[key], `E2 ${key}`);
	if (requireCount(result.mainThreadResponsivenessTicks, 'E2 main-thread responsiveness ticks') < 1) throw new TypeError('E2 main-thread responsiveness was not observed.');
	const metrics = requireRecord(result.metrics, 'E2 metrics');
	requireExactKeys(metrics, ['maximumObservedRequests', 'peakMainHeapBytes', 'peakWorkerHeapBytes', 'requestCount', 'uniqueRequestCount'], 'E2 metrics');
	const requestCount = requireCount(metrics.requestCount, 'E2 metric requestCount');
	const uniqueRequestCount = requireCount(metrics.uniqueRequestCount, 'E2 metric uniqueRequestCount');
	const maximumObservedRequests = requireCount(metrics.maximumObservedRequests, 'E2 metric maximumObservedRequests');
	if (requestCount < uniqueRequestCount || maximumObservedRequests < 1 || maximumObservedRequests > 4) throw new TypeError('E2 request concurrency metrics are incoherent.');
	for (const key of ['peakMainHeapBytes', 'peakWorkerHeapBytes']) if (metrics[key] !== null) requireCount(metrics[key], `E2 metric ${key}`);
	if (!Array.isArray(result.perSceneDecompaction) || result.perSceneDecompaction.length < 7) throw new TypeError('E2 per-scene evidence is incomplete.');
	for (const [index, valueRecord] of result.perSceneDecompaction.entries()) {
		const record = requireRecord(valueRecord, `E2 scene ${index}`);
		requireExactKeys(record, ['decodedByteLength', 'decompressionMilliseconds', 'degrees', 'elapsedMilliseconds', 'encodedByteLength', 'inverseShuffleMilliseconds', 'newlyDecodedBlockCount', 'payloadSha256', 'publicationMilliseconds', 'published', 'requiredBlockCount', 'retainedBytes', 'reusedBlockCount', 'transferMilliseconds', 'uploadMilliseconds', 'workerQueueMilliseconds'], `E2 scene ${index}`);
		const decodedByteLength = requireCount(record.decodedByteLength, `E2 scene ${index} decodedByteLength`);
		const encodedByteLength = requireCount(record.encodedByteLength, `E2 scene ${index} encodedByteLength`);
		const newlyDecodedBlockCount = requireCount(record.newlyDecodedBlockCount, `E2 scene ${index} newlyDecodedBlockCount`);
		const requiredBlockCount = requireCount(record.requiredBlockCount, `E2 scene ${index} requiredBlockCount`);
		const reusedBlockCount = requireCount(record.reusedBlockCount, `E2 scene ${index} reusedBlockCount`);
		for (const key of ['degrees', 'retainedBytes']) requireCount(record[key], `E2 scene ${index} ${key}`);
		for (const key of ['decompressionMilliseconds', 'elapsedMilliseconds', 'inverseShuffleMilliseconds', 'publicationMilliseconds', 'transferMilliseconds', 'uploadMilliseconds', 'workerQueueMilliseconds']) requireNonnegativeNumber(record[key], `E2 scene ${index} ${key}`);
		if (reusedBlockCount + newlyDecodedBlockCount !== requiredBlockCount || decodedByteLength === 0 || encodedByteLength === 0 || typeof record.published !== 'boolean') throw new TypeError('E2 scene metrics are incoherent.');
		requireSha256(record.payloadSha256, `E2 scene ${index} payload SHA-256`);
	}
	const faults = requireRecord(result.faults, 'E2 faults');
	requireExactKeys(faults, ['cancellation', 'corruption', 'isolatedCancellation', 'stalePublicationRejected'], 'E2 faults');
	if (faults.stalePublicationRejected !== true) throw new TypeError('E2 stale publication control is absent.');
	for (const key of ['corruption', 'cancellation', 'isolatedCancellation']) {
		const fault = requireRecord(faults[key], `E2 ${key}`);
		if (typeof fault.name !== 'string') throw new TypeError(`E2 ${key} error identity is invalid.`);
	}
	const cancellation = requireRecord(faults.cancellation, 'E2 cancellation');
	const isolatedCancellation = requireRecord(faults.isolatedCancellation, 'E2 isolated cancellation');
	const cancellationElapsedMilliseconds = requireNonnegativeNumber(cancellation.elapsedMilliseconds, 'E2 cancellation elapsed milliseconds');
	const isolatedCancellationElapsedMilliseconds = requireNonnegativeNumber(isolatedCancellation.elapsedMilliseconds, 'E2 isolated cancellation elapsed milliseconds');
	if (cancellation.name !== 'AbortError' || cancellation.preservedActive !== true || cancellationElapsedMilliseconds < 0 || isolatedCancellation.name !== 'AbortError' || isolatedCancellationElapsedMilliseconds < 0) throw new TypeError('E2 cancellation controls are incomplete.');
	return /** @type {CacheOptimizationE2BrowserResult} */ (result);
}

/**
 * Accept a sealed E2 result envelope.
 * Rejects an E2 result whose fixed parent or browser evidence differs from the accepted experiment contract.
 *
 * @param {unknown} value - Candidate E2 terminal result.
 * @returns {CacheOptimizationE2Result} - Accepted E2 terminal result.
 */
function acceptE2Result(value) {
	const result = requireRecord(value, 'E2 result');
	requireExactKeys(result, ['accepted', 'browser', 'claimBoundary', 'conclusion', 'parent', 'runId', 'schemaId'], 'E2 result');
	if (result.schemaId !== 'distant-sun-cache-optimization-e2-result-v1' || result.accepted !== true || result.conclusion !== 'accepted') throw new TypeError('E2 result is not accepted.');
	const parent = requireRecord(result.parent, 'E2 parent');
	requireExactKeys(parent, ['artifactSetSha256', 'runId'], 'E2 parent');
	if (parent.runId !== '000041-e1-format-compression' || parent.artifactSetSha256 !== '19d79885512d628ad874501b3c854b86eae2dfc374910bdae1dbc6569c96cf4a') throw new TypeError('E2 parent is not the accepted E1 candidate.');
	acceptE2BrowserResult(result.browser);
	requireString(result.runId, 'E2 run id');
	requireString(result.claimBoundary, 'E2 claim boundary');
	return /** @type {CacheOptimizationE2Result} */ (result);
}

/**
 * Call this function to validate one closed terminal conclusion.
 *
 * @param {unknown} value - Candidate conclusion.
 * @returns {CacheOptimizationExperimentRunConclusion} - Accepted conclusion.
 */
function acceptConclusion(value) {
	if (typeof value !== 'string' || !TERMINAL_CONCLUSIONS.has(value)) {
		throw new TypeError('Run conclusion is unsupported.');
	}
	return /** @type {CacheOptimizationExperimentRunConclusion} */ (value);
}

/**
 * Call this function to validate terminal result identity and conclusion coherence.
 *
 * @param {unknown} value - Candidate result.
 * @param {string} runId - Owning run identity.
 * @param {CacheOptimizationExperimentRunConclusion} conclusion - Selected conclusion.
 * @returns {CacheOptimizationTerminalResult} - Accepted terminal result.
 */
function acceptTerminalResult(value, runId, conclusion) {
	const result = requireRecord(normalizeJsonValue(value, 'Terminal result'), 'Terminal result');
	requireString(result.schemaId, 'Terminal result schemaId');
	if (result.runId !== runId || result.conclusion !== acceptConclusion(conclusion)) {
		throw new TypeError('Terminal result identity or conclusion does not match its run.');
	}
	if (typeof result.accepted !== 'boolean' || result.accepted !== (conclusion === 'accepted')) {
		throw new TypeError('Terminal result accepted flag is inconsistent with its conclusion.');
	}
	return /** @type {CacheOptimizationTerminalResult} */ (result);
}

/**
 * Call this function to validate one immutable artifact record.
 *
 * @param {unknown} value - Candidate record.
 * @param {number} index - Artifact index.
 * @returns {CacheOptimizationArtifactRecord} - Accepted record.
 */
function acceptArtifactRecord(value, index) {
	const artifact = requireRecord(value, `Artifact ${index}`);
	requireContractPath(artifact.path, `Artifact ${index} path`);
	requireCount(artifact.byteLength, `Artifact ${index} byteLength`);
	requireSha256(artifact.sha256, `Artifact ${index} sha256`);
	return /** @type {CacheOptimizationArtifactRecord} */ (artifact);
}

/**
 * Call this function to validate a terminal artifact manifest.
 *
 * @param {unknown} value - Candidate manifest.
 * @returns {CacheOptimizationArtifactManifest} - Accepted manifest.
 */
function acceptArtifactManifest(value) {
	const manifest = requireRecord(value, 'Artifact manifest');
	if (manifest.schemaId !== 'distant-sun-cache-optimization-artifact-manifest-v1') {
		throw new TypeError('Artifact manifest schema is unsupported.');
	}
	requireString(manifest.runId, 'Artifact manifest runId');
	acceptConclusion(manifest.conclusion);
	requireSha256(manifest.artifactSetSha256, 'Artifact manifest artifactSetSha256');
	if (!Array.isArray(manifest.artifacts)) throw new TypeError('Artifact manifest artifacts must be an array.');
	const artifacts = manifest.artifacts.map((artifact, index) => acceptArtifactRecord(artifact, index));
	if (new Set(artifacts.map((artifact) => artifact.path)).size !== artifacts.length) {
		throw new TypeError('Artifact manifest contains duplicate paths.');
	}
	requireIsoTimestamp(manifest.finalizedAt, 'Artifact manifest finalizedAt');
	return /** @type {CacheOptimizationArtifactManifest} */ (/** @type {unknown} */ ({...manifest, artifacts}));
}

/**
 * Call this function to validate one append-only progress event.
 *
 * @param {unknown} value - Candidate event.
 * @param {number} index - Event index.
 * @returns {CacheOptimizationProgressEvent} - Accepted event.
 */
function acceptProgressEvent(value, index) {
	const event = requireRecord(value, `Progress event ${index}`);
	requireIsoTimestamp(event.timestamp, `Progress event ${index} timestamp`);
	requireString(event.phase, `Progress event ${index} phase`);
	requireString(event.message, `Progress event ${index} message`);
	if (event.completed !== undefined) requireCount(event.completed, `Progress event ${index} completed`);
	if (event.total !== undefined) requireCount(event.total, `Progress event ${index} total`);
	if ((event.completed === undefined) !== (event.total === undefined) || event.completed > event.total) {
		throw new TypeError(`Progress event ${index} count is incoherent.`);
	}
	if (event.state !== undefined) acceptConclusion(event.state);
	return /** @type {CacheOptimizationProgressEvent} */ (event);
}

/** Contract validation and JSON normalization operations for cache-optimization evidence. */
const CacheOptimizationContracts = {
	requireRecord,
	requireString,
	requireNumber,
	requireCount,
	requireSha256,
	acceptFileIdentity,
	requireContractPath,
	requireIsoTimestamp,
	normalizeJsonValue,
	acceptMeasurementContract,
	acceptPackageReport,
	acceptRuntimeCatalog,
	acceptBrowserControl,
	acceptBrowserBaselineResult,
	acceptC0Result,
	acceptNetworkSnapshot,
	acceptInventoryPins,
	acceptSceneManifest,
	acceptRowLedger,
	acceptE1CandidateContract,
	acceptE1CatalogSelection,
	acceptE1PackageSetReport,
	acceptE1RuntimeCatalog,
	acceptE1ConfigurationManifest,
	acceptE1BlockIndex,
	acceptE1SceneManifest,
	acceptE1Result,
	acceptE2BrowserResult,
	acceptE2Result,
	acceptConclusion,
	acceptTerminalResult,
	acceptArtifactRecord,
	acceptArtifactManifest,
	acceptProgressEvent,
};

export default CacheOptimizationContracts;
