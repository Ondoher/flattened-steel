const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const RELATIVE_PATH_PATTERN = /^(?![./])(?!.+\/(?:\.|\.\.)(?:\/|$))[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\/?$/u;
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
 * @returns {DistantSunSceneCacheExpectedCompatibility} - Accepted compatibility projection.
 */
function acceptExpectedCompatibility(value, label) {
	const expected = requireRecord(value, label);
	requireExactKeys(
		expected,
		['sceneSun', 'atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity'],
		label,
	);
	const sceneSun = requireRecord(expected.sceneSun, `${label} sceneSun`);
	requireExactKeys(sceneSun, ['id', 'instant', 'directionToSourceUpEastNorth', 'sourceIdentity'], `${label} sceneSun`);
	requireString(sceneSun.id, `${label} sceneSun id`);
	requireIsoTimestamp(sceneSun.instant, `${label} sceneSun instant`);
	if (
		!Array.isArray(sceneSun.directionToSourceUpEastNorth) ||
		sceneSun.directionToSourceUpEastNorth.length !== 3 ||
		sceneSun.directionToSourceUpEastNorth.some(
			(coordinate) => typeof coordinate !== 'number' || !Number.isFinite(coordinate),
		)
	) {
		throw new TypeError(`${label} sceneSun direction must contain three finite numbers.`);
	}
	requireString(sceneSun.sourceIdentity, `${label} sceneSun sourceIdentity`);
	for (const name of ['atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity']) {
		requireString(expected[name], `${label} ${name}`);
	}
	return /** @type {DistantSunSceneCacheExpectedCompatibility} */ (expected);
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
 * Call this function to validate the scene-manifest fields consumed by C0.
 *
 * @param {unknown} value - Candidate manifest.
 * @param {string} label - Diagnostic identity.
 * @returns {CacheOptimizationSceneManifest} - Accepted manifest.
 */
function acceptSceneManifest(value, label) {
	const manifest = requireRecord(value, label);
	if (manifest.schemaId !== 'algorithm32-distant-sun-runtime-scene-cache-manifest-v2') {
		throw new TypeError(`${label} schema is unsupported.`);
	}
	requireString(manifest.cacheIdentity, `${label} cacheIdentity`);
	requireContractPath(manifest.ledgerPath, `${label} ledgerPath`);
	requireSha256(manifest.ledgerSha256, `${label} ledgerSha256`);
	for (const name of ['exactSeamPayload', 'logicalToUniqueIndex']) {
		const artifact = requireRecord(manifest[name], `${label} ${name}`);
		requireContractPath(artifact.path, `${label} ${name} path`);
		requireCount(artifact.byteLength, `${label} ${name} byteLength`);
		requireSha256(artifact.sha256, `${label} ${name} sha256`);
	}
	return /** @type {CacheOptimizationSceneManifest} */ (manifest);
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
	if (ledger.schemaId !== 'algorithm32-distant-sun-packed-row-ledger-v1' || !Array.isArray(ledger.rows)) {
		throw new TypeError(`${label} schema or rows are invalid.`);
	}
	for (const [index, candidate] of ledger.rows.entries()) {
		const row = requireRecord(candidate, `${label} row ${index}`);
		for (const name of ['altitudeIndex', 'firstSolarZenithIndex', 'lastSolarZenithIndex', 'packedRowCount']) {
			requireCount(row[name], `${label} row ${index} ${name}`);
		}
	}
	return /** @type {CacheOptimizationRowLedger} */ (ledger);
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
	acceptSceneManifest,
	acceptRowLedger,
	acceptConclusion,
	acceptTerminalResult,
	acceptArtifactRecord,
	acceptArtifactManifest,
	acceptProgressEvent,
};

export default CacheOptimizationContracts;
