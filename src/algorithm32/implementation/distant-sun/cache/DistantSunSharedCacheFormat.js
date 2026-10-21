import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
} from '../../../sampling-domains/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import DistantSunSceneCacheLedger from './DistantSunSceneCacheLedger.js';
import {DistantSunScatteringAccuracy} from './DistantSunScatteringAccuracy.js';
import {
	DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID,
	DISTANT_SUN_SHARED_CACHE_BLOCK_ALTITUDE_COUNT,
	DISTANT_SUN_SHARED_CACHE_BLOCK_INDEX_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_BLOCK_SOLAR_ZENITH_COUNT,
	DISTANT_SUN_SHARED_CACHE_CODEC_PROFILE_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_COMPRESSION_ID,
	DISTANT_SUN_SHARED_CACHE_CONFIGURATION_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_ACCURACY_CONFIGURATION_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_DECODED_SCALAR_ID,
	DISTANT_SUN_SHARED_CACHE_DERIVATION_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT,
	DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT,
	DISTANT_SUN_SHARED_CACHE_MAXIMUM_DECODED_BLOCK_BYTES,
	DISTANT_SUN_SHARED_CACHE_PACKAGE_SET_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH,
	DISTANT_SUN_SHARED_CACHE_RUNTIME_CATALOG_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_SCENE_MANIFEST_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_SHUFFLE_ID,
	DISTANT_SUN_SHARED_CACHE_SPECTRAL_CHANNEL_COUNT,
	DISTANT_SUN_SHARED_CACHE_UNIQUE_DIRECTION_COUNT,
	DISTANT_SUN_SHARED_CACHE_ZSTANDARD_LEVEL,
} from './consts.js';

/** Serialized production shared-cache schema parser and compatibility validator. */
export default class DistantSunSharedCacheFormat {
	/**
	 * Called by format validators to require one ordinary JSON object.
	 *
	 * @param {unknown} value - Candidate object.
	 * @param {string} label - Diagnostic label.
	 * @returns {Record<string, unknown>} - Accepted record.
	 */
	_requireRecord(value, label) {
		if (value === null || typeof value !== 'object' || Array.isArray(value)) {
			throw new TypeError(`${label} must be an object.`);
		}
		return /** @type {Record<string, unknown>} */ (value);
	}

	/**
	 * Called by format validators to reject missing, extra, or ambiguous properties.
	 *
	 * @param {Record<string, unknown>} record - Candidate record.
	 * @param {readonly string[]} expectedKeys - Complete allowed property set.
	 * @param {string} label - Diagnostic label.
	 * @returns {void}
	 */
	_requireExactKeys(record, expectedKeys, label) {
		const actualKeys = Object.keys(record).sort();
		const canonicalKeys = [...expectedKeys].sort();
		if (
			actualKeys.length !== canonicalKeys.length ||
			actualKeys.some((actualKey, index) => actualKey !== canonicalKeys[index])
		) {
			throw new TypeError(`${label} properties are incompatible.`);
		}
	}

	/**
	 * Called by format validators to require a nonempty string.
	 *
	 * @param {unknown} value - Candidate string.
	 * @param {string} label - Diagnostic label.
	 * @returns {string} - Accepted string.
	 */
	_requireString(value, label) {
		if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${label} must be a nonempty string.`);
		return value;
	}

	/**
	 * Called by format validators to require one nonnegative integer.
	 *
	 * @param {unknown} value - Candidate integer.
	 * @param {string} label - Diagnostic label.
	 * @returns {number} - Accepted integer.
	 */
	_requireCount(value, label) {
		if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
			throw new RangeError(`${label} must be a nonnegative safe integer.`);
		return value;
	}

	/**
	 * Called by format validators to require one positive integer.
	 *
	 * @param {unknown} value - Candidate integer.
	 * @param {string} label - Diagnostic label.
	 * @returns {number} - Accepted integer.
	 */
	_requirePositiveCount(value, label) {
		const count = this._requireCount(value, label);
		if (count === 0) throw new RangeError(`${label} must be positive.`);
		return count;
	}

	/**
	 * Called by format validators to require one lowercase SHA-256 identity.
	 *
	 * @param {unknown} value - Candidate hash.
	 * @param {string} label - Diagnostic label.
	 * @returns {string} - Accepted hash.
	 */
	_requireSha256(value, label) {
		if (typeof value !== 'string' || !/^[a-f0-9]{64}$/u.test(value)) {
			throw new RangeError(`${label} must be a lowercase SHA-256 hash.`);
		}
		return value;
	}

	/**
	 * Called by format validators to require one canonical contained POSIX asset path.
	 *
	 * @param {unknown} value - Candidate path.
	 * @param {string} label - Diagnostic label.
	 * @returns {string} - Accepted path.
	 */
	_requirePath(value, label) {
		const candidate = this._requireString(value, label);
		const segments = candidate.split('/');
		if (
			candidate.startsWith('/') ||
			candidate.includes('\\') ||
			segments.some(
				(segment) =>
					segment.length === 0 || segment === '.' || segment === '..' || !/^[A-Za-z0-9._-]+$/u.test(segment),
			)
		) {
			throw new RangeError(`${label} must be a canonical contained asset path.`);
		}
		return candidate;
	}

	/**
	 * Called by format validators to require one content-addressed file identity.
	 *
	 * @param {unknown} value - Candidate file identity.
	 * @param {string} label - Diagnostic label.
	 * @returns {DistantSunSharedCacheFileIdentity} - Accepted file identity.
	 */
	_requireFileIdentity(value, label) {
		const identity = this._requireRecord(value, label);
		this._requireExactKeys(identity, ['path', 'byteLength', 'sha256'], label);
		this._requirePath(identity.path, `${label} path`);
		this._requirePositiveCount(identity.byteLength, `${label} byte length`);
		this._requireSha256(identity.sha256, `${label} hash`);
		return /** @type {DistantSunSharedCacheFileIdentity} */ (identity);
	}

	/**
	 * Called by format validators to require one exact unit vector.
	 *
	 * @param {unknown} value - Candidate vector.
	 * @param {string} label - Diagnostic label.
	 * @returns {UnitVector3} - Accepted vector.
	 */
	_requireUnitVector(value, label) {
		if (!Array.isArray(value) || value.length !== 3 || value.some((component) => !Number.isFinite(component))) {
			throw new RangeError(`${label} must contain three finite components.`);
		}
		const magnitude = Math.hypot(value[0], value[1], value[2]);
		if (Math.abs(magnitude - 1) > 1e-10) throw new RangeError(`${label} must be normalized.`);
		return /** @type {UnitVector3} */ (/** @type {unknown} */ (value));
	}

	/**
	 * Called by public parsers to decode one JSON record without accepting aliases.
	 *
	 * @param {string} serialized - Serialized JSON text.
	 * @param {string} label - Diagnostic label.
	 * @returns {unknown} - Parsed JSON value.
	 */
	_parse(serialized, label) {
		if (typeof serialized !== 'string') throw new TypeError(`${label} JSON must be a string.`);
		try {
			return JSON.parse(serialized);
		} catch (error) {
			throw new SyntaxError(`${label} JSON is malformed.`, {cause: error});
		}
	}

	/**
	 * Called by package and block validators to require complete derivation identities.
	 * Descriptive derivation fields never select or recover executable format facts.
	 *
	 * @param {unknown} value - Candidate derivation.
	 * @param {string} label - Diagnostic label.
	 * @returns {DistantSunSharedCacheDerivation} - Accepted derivation.
	 */
	_requireDerivation(value, label) {
		const derivation = this._requireRecord(value, label);
		this._requireExactKeys(
			derivation,
			[
				'schemaId',
				'parents',
				'operationId',
				'equationId',
				'implementation',
				'tools',
				'parametersSha256',
				'outputs',
			],
			label,
		);
		if (derivation.schemaId !== DISTANT_SUN_SHARED_CACHE_DERIVATION_SCHEMA_ID) {
			throw new RangeError(`${label} schema is unsupported.`);
		}
		for (const property of ['operationId', 'equationId']) {
			this._requireString(derivation[property], `${label} ${property}`);
		}
		this._requireSha256(derivation.parametersSha256, `${label} parameters hash`);

		const implementation = this._requireRecord(derivation.implementation, `${label} implementation`);
		this._requireExactKeys(implementation, ['id', 'version', 'sha256'], `${label} implementation`);
		this._requireString(implementation.id, `${label} implementation id`);
		this._requireString(implementation.version, `${label} implementation version`);
		this._requireSha256(implementation.sha256, `${label} implementation hash`);

		if (!Array.isArray(derivation.parents) || derivation.parents.length === 0) {
			throw new RangeError(`${label} must retain at least one parent artifact.`);
		}
		const parentRoles = new Set();
		for (const [parentIndex, parentValue] of derivation.parents.entries()) {
			const parent = this._requireRecord(parentValue, `${label} parent ${parentIndex}`);
			this._requireExactKeys(parent, ['role', 'artifact'], `${label} parent ${parentIndex}`);
			const role = this._requireString(parent.role, `${label} parent ${parentIndex} role`);
			if (parentRoles.has(role)) throw new RangeError(`${label} parent roles must be unique.`);
			parentRoles.add(role);
			this._requireFileIdentity(parent.artifact, `${label} parent ${parentIndex} artifact`);
		}

		if (!Array.isArray(derivation.tools) || derivation.tools.length === 0) {
			throw new RangeError(`${label} must identify every material tool.`);
		}
		for (const [toolIndex, toolValue] of derivation.tools.entries()) {
			const tool = this._requireRecord(toolValue, `${label} tool ${toolIndex}`);
			this._requireExactKeys(tool, ['id', 'version'], `${label} tool ${toolIndex}`);
			this._requireString(tool.id, `${label} tool ${toolIndex} id`);
			this._requireString(tool.version, `${label} tool ${toolIndex} version`);
		}

		if (!Array.isArray(derivation.outputs) || derivation.outputs.length === 0) {
			throw new RangeError(`${label} must retain at least one output identity.`);
		}
		const outputRoles = new Set();
		for (const [outputIndex, outputValue] of derivation.outputs.entries()) {
			const output = this._requireRecord(outputValue, `${label} output ${outputIndex}`);
			this._requireExactKeys(output, ['role', 'byteLength', 'sha256'], `${label} output ${outputIndex}`);
			const role = this._requireString(output.role, `${label} output ${outputIndex} role`);
			if (outputRoles.has(role)) throw new RangeError(`${label} output roles must be unique.`);
			outputRoles.add(role);
			this._requirePositiveCount(output.byteLength, `${label} output ${outputIndex} byte length`);
			this._requireSha256(output.sha256, `${label} output ${outputIndex} hash`);
		}
		return /** @type {DistantSunSharedCacheDerivation} */ (derivation);
	}

	/**
	 * Called by scene validation to require the canonical runtime selection interval.
	 *
	 * @param {unknown} value - Candidate selection.
	 * @param {number} representativeSolarZenithDegrees - Scene representative angle in degrees.
	 * @returns {DistantSunSharedCacheSceneSelection} - Accepted selection.
	 */
	_requireSceneSelection(value, representativeSolarZenithDegrees) {
		const selection = this._requireRecord(value, 'Shared-cache scene selection');
		this._requireExactKeys(
			selection,
			['representativeSolarZenithDegrees', 'minimumInputDegrees', 'maximumInputExclusiveDegrees'],
			'Shared-cache scene selection',
		);
		const expectedMinimum = Math.max(0, representativeSolarZenithDegrees - 0.5);
		const expectedMaximum = representativeSolarZenithDegrees === 108 ? 108 : representativeSolarZenithDegrees + 0.5;
		if (
			selection.representativeSolarZenithDegrees !== representativeSolarZenithDegrees ||
			selection.minimumInputDegrees !== expectedMinimum ||
			selection.maximumInputExclusiveDegrees !== expectedMaximum
		) {
			throw new RangeError('Shared-cache scene selection breaks nearest-integer half-up coverage.');
		}
		return /** @type {DistantSunSharedCacheSceneSelection} */ (selection);
	}

	/**
	 * Called by scene validation to require a complete physical Sun identity.
	 *
	 * @param {unknown} value - Candidate Sun identity.
	 * @returns {DistantSunSceneSunIdentity} - Accepted Sun identity.
	 */
	_requireSceneSun(value) {
		const sceneSun = this._requireRecord(value, 'Shared-cache scene Sun');
		this._requireExactKeys(
			sceneSun,
			['id', 'instant', 'directionToSourceUpEastNorth', 'sourceIdentity'],
			'Shared-cache scene Sun',
		);
		this._requireString(sceneSun.id, 'Shared-cache scene Sun id');
		const instant = this._requireString(sceneSun.instant, 'Shared-cache scene Sun instant');
		if (new Date(instant).toISOString() !== instant)
			throw new RangeError('Shared-cache scene Sun instant must be canonical UTC.');
		this._requireUnitVector(sceneSun.directionToSourceUpEastNorth, 'Shared-cache scene Sun direction');
		this._requireString(sceneSun.sourceIdentity, 'Shared-cache scene Sun source identity');
		return /** @type {DistantSunSceneSunIdentity} */ (sceneSun);
	}

	/**
	 * Call this method to parse and validate the selected production codec profile.
	 * Invalid structure, identities, or unsupported codec values throw; callers must reject the artifact before use.
	 *
	 * @param {unknown} value - Candidate codec profile.
	 * @returns {DistantSunSharedCacheCodecProfile} - Accepted codec profile.
	 */
	acceptCodecProfile(value) {
		const profile = this._requireRecord(value, 'Shared-cache codec profile');
		this._requireExactKeys(
			profile,
			['schemaId', 'id', 'compression', 'level', 'shuffle', 'decodedScalar', 'implementation'],
			'Shared-cache codec profile',
		);
		if (
			profile.schemaId !== DISTANT_SUN_SHARED_CACHE_CODEC_PROFILE_SCHEMA_ID ||
			profile.id !== 'algorithm32-distant-sun-shared-cache-zstandard-level-6-v1' ||
			profile.compression !== DISTANT_SUN_SHARED_CACHE_COMPRESSION_ID ||
			profile.level !== DISTANT_SUN_SHARED_CACHE_ZSTANDARD_LEVEL ||
			profile.shuffle !== DISTANT_SUN_SHARED_CACHE_SHUFFLE_ID ||
			profile.decodedScalar !== DISTANT_SUN_SHARED_CACHE_DECODED_SCALAR_ID
		) {
			throw new RangeError('Shared-cache codec profile is unsupported.');
		}
		const implementation = this._requireRecord(profile.implementation, 'Shared-cache codec implementation');
		this._requireExactKeys(implementation, ['id', 'version', 'sha256'], 'Shared-cache codec implementation');
		this._requireString(implementation.id, 'Shared-cache codec implementation id');
		this._requireString(implementation.version, 'Shared-cache codec implementation version');
		this._requireSha256(implementation.sha256, 'Shared-cache codec implementation hash');
		return /** @type {DistantSunSharedCacheCodecProfile} */ (profile);
	}

	/**
	 * Call this method to parse a serialized production codec profile.
	 * Malformed JSON or an incompatible profile throws; callers must reject the artifact before use.
	 *
	 * @param {string} serialized - Serialized codec-profile JSON.
	 * @returns {DistantSunSharedCacheCodecProfile} - Accepted codec profile.
	 */
	parseCodecProfile(serialized) {
		return this.acceptCodecProfile(this._parse(serialized, 'Shared-cache codec profile'));
	}

	/**
	 * Call this method to validate a production shared-cache package-set report.
	 * Invalid structure, identities, paths, or derivation data throw; callers must reject the package set before use.
	 *
	 * @param {unknown} value - Candidate package-set report.
	 * @returns {DistantSunSharedCachePackageSetReport} - Accepted package-set report.
	 */
	acceptPackageSetReport(value) {
		const report = this._requireRecord(value, 'Shared-cache package-set report');
		this._requireExactKeys(
			report,
			[
				'schemaId',
				'packageSetIdentity',
				'derivation',
				'generator',
				'codecProfile',
				'configurations',
				'runtimeCatalog',
			],
			'Shared-cache package-set report',
		);
		if (report.schemaId !== DISTANT_SUN_SHARED_CACHE_PACKAGE_SET_SCHEMA_ID) {
			throw new RangeError('Shared-cache package-set report schema is unsupported.');
		}
		this._requireSha256(report.packageSetIdentity, 'Shared-cache package-set identity');
		this._requireDerivation(report.derivation, 'Shared-cache package-set derivation');
		const generator = this._requireRecord(report.generator, 'Shared-cache generator identity');
		this._requireExactKeys(generator, ['id', 'version', 'sha256'], 'Shared-cache generator identity');
		this._requireString(generator.id, 'Shared-cache generator id');
		this._requireString(generator.version, 'Shared-cache generator version');
		this._requireSha256(generator.sha256, 'Shared-cache generator hash');
		this.acceptCodecProfile(report.codecProfile);
		if (!Array.isArray(report.configurations) || report.configurations.length === 0) {
			throw new RangeError('Shared-cache package set must identify at least one configuration.');
		}
		const configurationPaths = new Set();
		for (const [configurationIndex, configuration] of report.configurations.entries()) {
			const identity = this._requireFileIdentity(
				configuration,
				`Shared-cache configuration ${configurationIndex}`,
			);
			if (configurationPaths.has(identity.path))
				throw new RangeError('Shared-cache configuration paths must be unique.');
			configurationPaths.add(identity.path);
		}
		this._requireFileIdentity(report.runtimeCatalog, 'Shared-cache runtime catalog');
		return /** @type {DistantSunSharedCachePackageSetReport} */ (report);
	}

	/**
	 * Call this method to parse a serialized package-set report.
	 * Malformed JSON or an incompatible report throws; callers must reject the package set before use.
	 *
	 * @param {string} serialized - Serialized package-set JSON.
	 * @returns {DistantSunSharedCachePackageSetReport} - Accepted report.
	 */
	parsePackageSetReport(serialized) {
		return this.acceptPackageSetReport(this._parse(serialized, 'Shared-cache package-set report'));
	}

	/**
	 * Call this method to validate the complete ordered production runtime catalog.
	 * Invalid structure, coverage, ordering, paths, or identities throw; callers must reject the catalog before use.
	 *
	 * @param {unknown} value - Candidate runtime catalog.
	 * @returns {DistantSunSharedCacheRuntimeCatalog} - Accepted runtime catalog.
	 */
	acceptRuntimeCatalog(value) {
		const catalog = this._requireRecord(value, 'Shared-cache runtime catalog');
		this._requireExactKeys(
			catalog,
			['schemaId', 'configurationIdentity', 'selection', 'scenes'],
			'Shared-cache runtime catalog',
		);
		if (catalog.schemaId !== DISTANT_SUN_SHARED_CACHE_RUNTIME_CATALOG_SCHEMA_ID) {
			throw new RangeError('Shared-cache runtime catalog schema is unsupported.');
		}
		this._requireSha256(catalog.configurationIdentity, 'Shared-cache catalog configuration identity');
		const selection = this._requireRecord(catalog.selection, 'Shared-cache catalog selection');
		this._requireExactKeys(
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
			'Shared-cache catalog selection',
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
			throw new RangeError('Shared-cache catalog selection differs from production.');
		}
		if (!Array.isArray(catalog.scenes) || catalog.scenes.length !== 109) {
			throw new RangeError('Shared-cache runtime catalog must cover all 109 production scenes.');
		}
		const manifestPaths = new Set();
		for (const [sceneOrdinal, sceneValue] of catalog.scenes.entries()) {
			const scene = this._requireRecord(sceneValue, `Shared-cache catalog scene ${sceneOrdinal}`);
			this._requireExactKeys(
				scene,
				['id', 'representativeSolarZenithDegrees', 'manifest'],
				`Shared-cache catalog scene ${sceneOrdinal}`,
			);
			const expectedId = `solar-zenith-${String(sceneOrdinal).padStart(3, '0')}-degrees`;
			if (scene.id !== expectedId || scene.representativeSolarZenithDegrees !== sceneOrdinal) {
				throw new RangeError(`Shared-cache catalog scene ${sceneOrdinal} breaks canonical ordered coverage.`);
			}
			const manifest = this._requireFileIdentity(
				scene.manifest,
				`Shared-cache catalog scene ${sceneOrdinal} manifest`,
			);
			if (manifestPaths.has(manifest.path))
				throw new RangeError('Shared-cache catalog manifest paths must be unique.');
			manifestPaths.add(manifest.path);
		}
		return /** @type {DistantSunSharedCacheRuntimeCatalog} */ (catalog);
	}

	/**
	 * Call this method to parse a serialized production runtime catalog.
	 * Malformed JSON or an incompatible catalog throws; callers must reject the catalog before use.
	 *
	 * @param {string} serialized - Serialized runtime-catalog JSON.
	 * @returns {DistantSunSharedCacheRuntimeCatalog} - Accepted runtime catalog.
	 */
	parseRuntimeCatalog(serialized) {
		return this.acceptRuntimeCatalog(this._parse(serialized, 'Shared-cache runtime catalog'));
	}

	/**
	 * Call this method to validate one physical/numerical shared-cache configuration.
	 * Invalid structure, domains, layouts, codec, paths, or identities throw; callers must reject the configuration.
	 *
	 * @param {unknown} value - Candidate configuration manifest.
	 * @returns {DistantSunSharedCacheConfigurationManifest} - Accepted configuration manifest.
	 */
	acceptConfigurationManifest(value) {
		const manifest = this._requireRecord(value, 'Shared-cache configuration manifest');
		const accuracySchema = manifest.schemaId === DISTANT_SUN_SHARED_CACHE_ACCURACY_CONFIGURATION_SCHEMA_ID;
		this._requireExactKeys(
			manifest,
			[
				'schemaId',
				'configurationIdentity',
				...(accuracySchema ? ['scatteringAccuracy'] : []),
				'atmosphereIdentity',
				'geometryIdentity',
				'groundIdentity',
				'numericalIdentity',
				'directionLayout',
				'spectralLayout',
				'coordinateDomains',
				'blockGrid',
				'codecProfile',
				'blockIndex',
			],
			'Shared-cache configuration manifest',
		);
		if (manifest.schemaId !== DISTANT_SUN_SHARED_CACHE_CONFIGURATION_SCHEMA_ID && !accuracySchema) {
			throw new RangeError('Shared-cache configuration schema is unsupported.');
		}
		if (accuracySchema && DistantSunScatteringAccuracy.accept(manifest.scatteringAccuracy) === 'legacy')
			throw new RangeError('Accuracy configuration requires its explicit corrected scattering policy.');
		this._requireSha256(manifest.configurationIdentity, 'Shared-cache configuration identity');
		for (const identityName of ['atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity']) {
			this._requireString(manifest[identityName], `Shared-cache ${identityName}`);
		}

		const directionLayout = this._requireRecord(manifest.directionLayout, 'Shared-cache direction layout');
		this._requireExactKeys(
			directionLayout,
			['id', 'uniqueDirectionCount', 'logicalDirectionCount', 'logicalToUniqueIndex'],
			'Shared-cache direction layout',
		);
		if (
			directionLayout.id !== DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID ||
			directionLayout.uniqueDirectionCount !== DISTANT_SUN_SHARED_CACHE_UNIQUE_DIRECTION_COUNT ||
			directionLayout.logicalDirectionCount !== DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT
		) {
			throw new RangeError('Shared-cache direction layout is incompatible with production W27.');
		}
		const logicalToUniqueIndex = this._requireFileIdentity(
			directionLayout.logicalToUniqueIndex,
			'Shared-cache logical-to-unique index',
		);
		if (logicalToUniqueIndex.byteLength !== DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT * 2) {
			throw new RangeError('Shared-cache logical-to-unique index byte length is incompatible with W27.');
		}

		const spectralLayout = this._requireRecord(manifest.spectralLayout, 'Shared-cache spectral layout');
		this._requireExactKeys(
			spectralLayout,
			['id', 'channelCount', 'order', 'scalar'],
			'Shared-cache spectral layout',
		);
		if (
			spectralLayout.id !== 'Native15' ||
			spectralLayout.channelCount !== DISTANT_SUN_SHARED_CACHE_SPECTRAL_CHANNEL_COUNT ||
			spectralLayout.order !== 'wavelength-major' ||
			spectralLayout.scalar !== DISTANT_SUN_SHARED_CACHE_DECODED_SCALAR_ID
		) {
			throw new RangeError('Shared-cache spectral layout is incompatible with Native15.');
		}

		const domains = this._requireRecord(manifest.coordinateDomains, 'Shared-cache coordinate domains');
		this._requireExactKeys(domains, ['altitude', 'solarZenith'], 'Shared-cache coordinate domains');
		const altitude = this._requireRecord(domains.altitude, 'Shared-cache altitude domain');
		const solarZenith = this._requireRecord(domains.solarZenith, 'Shared-cache solar-zenith domain');
		this._requireExactKeys(altitude, ['firstIndex', 'count'], 'Shared-cache altitude domain');
		this._requireExactKeys(
			solarZenith,
			['firstIndex', 'count', 'binWidthDegrees'],
			'Shared-cache solar-zenith domain',
		);
		if (
			altitude.firstIndex !== 0 ||
			altitude.count !== 48 ||
			solarZenith.firstIndex !== 0 ||
			solarZenith.count !== 180 ||
			solarZenith.binWidthDegrees !== 1
		) {
			throw new RangeError('Shared-cache coordinate domains differ from Native48/Z180.');
		}

		const blockGrid = this._requireRecord(manifest.blockGrid, 'Shared-cache block grid');
		this._requireExactKeys(
			blockGrid,
			['altitudeCount', 'solarZenithCount', 'coordinateOrder', 'payloadOrder', 'omitUnpopulatedCoordinates'],
			'Shared-cache block grid',
		);
		if (
			blockGrid.altitudeCount !== DISTANT_SUN_SHARED_CACHE_BLOCK_ALTITUDE_COUNT ||
			blockGrid.solarZenithCount !== DISTANT_SUN_SHARED_CACHE_BLOCK_SOLAR_ZENITH_COUNT ||
			blockGrid.coordinateOrder !== 'altitude-then-solar-zenith' ||
			blockGrid.payloadOrder !== 'wavelength-then-coordinate-then-direction' ||
			blockGrid.omitUnpopulatedCoordinates !== true
		) {
			throw new RangeError('Shared-cache block grid differs from the selected 8x8 format.');
		}
		this.acceptCodecProfile(manifest.codecProfile);
		this._requireFileIdentity(manifest.blockIndex, 'Shared-cache block index');
		return /** @type {DistantSunSharedCacheConfigurationManifest} */ (manifest);
	}

	/**
	 * Call this method to parse a serialized configuration manifest.
	 * Malformed JSON or an incompatible configuration throws; callers must reject the configuration before use.
	 *
	 * @param {string} serialized - Serialized configuration JSON.
	 * @returns {DistantSunSharedCacheConfigurationManifest} - Accepted configuration.
	 */
	parseConfigurationManifest(serialized) {
		return this.acceptConfigurationManifest(this._parse(serialized, 'Shared-cache configuration manifest'));
	}

	/**
	 * Called by block validation to calculate its configuration-qualified logical identity.
	 *
	 * @param {string} configurationIdentity - Physical/numerical configuration hash.
	 * @param {number} altitudeIndex - First altitude tile index.
	 * @param {number} solarZenithIndex - First local-solar-zenith tile index.
	 * @returns {string} - Canonical logical decoded block identity.
	 */
	_blockId(configurationIdentity, altitudeIndex, solarZenithIndex) {
		return `algorithm32-distant-sun-shared-block:${configurationIdentity}:a${String(altitudeIndex).padStart(2, '0')}:z${String(solarZenithIndex).padStart(3, '0')}`;
	}

	/**
	 * Call this method to validate one complete shared-block index before any encoded block is requested.
	 * Invalid coverage, ordering, sizes, identities, paths, or derivations throw; callers must perform no block request.
	 *
	 * @param {unknown} value - Candidate block index.
	 * @param {DistantSunSharedCacheConfigurationManifest} configuration - Accepted owning configuration.
	 * @returns {DistantSunSharedCacheBlockIndex} - Accepted block index.
	 */
	acceptBlockIndex(value, configuration) {
		this.acceptConfigurationManifest(configuration);
		const index = this._requireRecord(value, 'Shared-cache block index');
		this._requireExactKeys(
			index,
			['schemaId', 'configurationIdentity', 'rowByteLength', 'distinctCoordinateCount', 'blocks'],
			'Shared-cache block index',
		);
		if (
			index.schemaId !== DISTANT_SUN_SHARED_CACHE_BLOCK_INDEX_SCHEMA_ID ||
			index.configurationIdentity !== configuration.configurationIdentity ||
			index.rowByteLength !== DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH ||
			!Array.isArray(index.blocks) ||
			index.blocks.length === 0
		) {
			throw new RangeError('Shared-cache block index identity or shape is incompatible.');
		}
		const declaredCoordinateCount = this._requirePositiveCount(
			index.distinctCoordinateCount,
			'Shared-cache distinct coordinate count',
		);
		const blockIds = new Set();
		const coordinateKeys = new Set();
		let previousTileOrdinal = -1;
		let actualCoordinateCount = 0;

		for (const [blockOrdinal, blockValue] of index.blocks.entries()) {
			const block = this._requireRecord(blockValue, `Shared-cache block ${blockOrdinal}`);
			this._requireExactKeys(
				block,
				[
					'id',
					'tile',
					'rowCount',
					'coordinates',
					'decoded',
					'encoded',
					'codecProfileId',
					'shuffle',
					'derivation',
				],
				`Shared-cache block ${blockOrdinal}`,
			);
			const tile = this._requireRecord(block.tile, `Shared-cache block ${blockOrdinal} tile`);
			this._requireExactKeys(
				tile,
				['altitudeIndex', 'solarZenithIndex'],
				`Shared-cache block ${blockOrdinal} tile`,
			);
			const altitudeIndex = this._requireCount(
				tile.altitudeIndex,
				`Shared-cache block ${blockOrdinal} altitude tile`,
			);
			const solarZenithIndex = this._requireCount(
				tile.solarZenithIndex,
				`Shared-cache block ${blockOrdinal} solar-zenith tile`,
			);
			if (
				altitudeIndex >= 48 ||
				solarZenithIndex >= 180 ||
				altitudeIndex % DISTANT_SUN_SHARED_CACHE_BLOCK_ALTITUDE_COUNT !== 0 ||
				solarZenithIndex % DISTANT_SUN_SHARED_CACHE_BLOCK_SOLAR_ZENITH_COUNT !== 0
			) {
				throw new RangeError(`Shared-cache block ${blockOrdinal} tile is outside the canonical 8x8 grid.`);
			}
			const tileOrdinal = altitudeIndex * 180 + solarZenithIndex;
			if (tileOrdinal <= previousTileOrdinal)
				throw new RangeError('Shared-cache blocks are not in canonical tile order.');
			previousTileOrdinal = tileOrdinal;

			const expectedBlockId = this._blockId(configuration.configurationIdentity, altitudeIndex, solarZenithIndex);
			if (block.id !== expectedBlockId || blockIds.has(block.id)) {
				throw new RangeError(
					`Shared-cache block ${blockOrdinal} logical identity is incompatible or duplicated.`,
				);
			}
			blockIds.add(block.id);
			const rowCount = this._requirePositiveCount(block.rowCount, `Shared-cache block ${blockOrdinal} row count`);
			if (rowCount > DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT) {
				throw new RangeError(`Shared-cache block ${blockOrdinal} exceeds the 64-row format bound.`);
			}
			if (!Array.isArray(block.coordinates) || block.coordinates.length !== rowCount) {
				throw new RangeError(`Shared-cache block ${blockOrdinal} coordinate count is incompatible.`);
			}
			let previousCoordinateOrdinal = -1;
			for (const [blockRowIndex, coordinate] of block.coordinates.entries()) {
				if (!Array.isArray(coordinate) || coordinate.length !== 2) {
					throw new TypeError(
						`Shared-cache block ${blockOrdinal} row ${blockRowIndex} coordinate is malformed.`,
					);
				}
				const coordinateAltitudeIndex = this._requireCount(
					coordinate[0],
					`Shared-cache block ${blockOrdinal} row ${blockRowIndex} altitude`,
				);
				const coordinateSolarZenithIndex = this._requireCount(
					coordinate[1],
					`Shared-cache block ${blockOrdinal} row ${blockRowIndex} solar zenith`,
				);
				if (
					coordinateAltitudeIndex < altitudeIndex ||
					coordinateAltitudeIndex >= Math.min(48, altitudeIndex + 8) ||
					coordinateSolarZenithIndex < solarZenithIndex ||
					coordinateSolarZenithIndex >= Math.min(180, solarZenithIndex + 8)
				) {
					throw new RangeError(`Shared-cache block ${blockOrdinal} owns a coordinate outside its tile.`);
				}
				const coordinateOrdinal = coordinateAltitudeIndex * 180 + coordinateSolarZenithIndex;
				if (coordinateOrdinal <= previousCoordinateOrdinal) {
					throw new RangeError(
						`Shared-cache block ${blockOrdinal} coordinates are not altitude-then-solar ordered.`,
					);
				}
				previousCoordinateOrdinal = coordinateOrdinal;
				const coordinateKey = `${coordinateAltitudeIndex}:${coordinateSolarZenithIndex}`;
				if (coordinateKeys.has(coordinateKey))
					throw new RangeError('Shared-cache coordinate ownership is duplicated.');
				coordinateKeys.add(coordinateKey);
			}

			const decoded = this._requireRecord(block.decoded, `Shared-cache block ${blockOrdinal} decoded identity`);
			this._requireExactKeys(
				decoded,
				['byteLength', 'sha256'],
				`Shared-cache block ${blockOrdinal} decoded identity`,
			);
			const decodedByteLength = this._requirePositiveCount(
				decoded.byteLength,
				`Shared-cache block ${blockOrdinal} decoded byte length`,
			);
			this._requireSha256(decoded.sha256, `Shared-cache block ${blockOrdinal} decoded hash`);
			if (
				decodedByteLength !== rowCount * DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH ||
				decodedByteLength > DISTANT_SUN_SHARED_CACHE_MAXIMUM_DECODED_BLOCK_BYTES
			) {
				throw new RangeError(
					`Shared-cache block ${blockOrdinal} decoded allocation is incompatible or oversized.`,
				);
			}

			const encoded = this._requireFileIdentity(
				block.encoded,
				`Shared-cache block ${blockOrdinal} encoded artifact`,
			);
			if (encoded.path !== `blocks/${encoded.sha256}.zst`) {
				throw new RangeError(`Shared-cache block ${blockOrdinal} encoded artifact identity is incompatible.`);
			}
			if (
				block.codecProfileId !== configuration.codecProfile.id ||
				block.shuffle !== DISTANT_SUN_SHARED_CACHE_SHUFFLE_ID
			) {
				throw new RangeError(`Shared-cache block ${blockOrdinal} codec identity is incompatible.`);
			}
			const derivation = this._requireDerivation(
				block.derivation,
				`Shared-cache block ${blockOrdinal} derivation`,
			);
			const decodedOutput = derivation.outputs.find((output) => output.role === 'decoded-block');
			const encodedOutput = derivation.outputs.find((output) => output.role === 'encoded-block');
			if (
				decodedOutput?.byteLength !== decoded.byteLength ||
				decodedOutput?.sha256 !== decoded.sha256 ||
				encodedOutput?.byteLength !== encoded.byteLength ||
				encodedOutput?.sha256 !== encoded.sha256
			) {
				throw new RangeError(`Shared-cache block ${blockOrdinal} derivation output identities are corrupt.`);
			}
			actualCoordinateCount += rowCount;
		}

		if (actualCoordinateCount !== declaredCoordinateCount) {
			throw new RangeError('Shared-cache block index coordinate coverage has a gap or inconsistent count.');
		}
		return /** @type {DistantSunSharedCacheBlockIndex} */ (index);
	}

	/**
	 * Call this method to parse a serialized block index against its accepted configuration.
	 * Malformed JSON or an incompatible index throws; callers must perform no block request.
	 *
	 * @param {string} serialized - Serialized block-index JSON.
	 * @param {DistantSunSharedCacheConfigurationManifest} configuration - Accepted owning configuration.
	 * @returns {DistantSunSharedCacheBlockIndex} - Accepted block index.
	 */
	parseBlockIndex(serialized, configuration) {
		return this.acceptBlockIndex(this._parse(serialized, 'Shared-cache block index'), configuration);
	}

	/**
	 * Call this method to validate one scene manifest against its configuration and block ownership.
	 * Invalid scene identity, ledger, coverage, block references, or derivation throws; callers must not reconstruct it.
	 *
	 * @param {unknown} value - Candidate scene manifest.
	 * @param {DistantSunSharedCacheConfigurationManifest} configuration - Accepted owning configuration.
	 * @param {DistantSunSharedCacheBlockIndex} blockIndex - Accepted owning block index.
	 * @returns {DistantSunSharedCacheSceneManifest} - Accepted scene manifest.
	 */
	acceptSceneManifest(value, configuration, blockIndex) {
		this.acceptBlockIndex(blockIndex, configuration);
		const manifest = this._requireRecord(value, 'Shared-cache scene manifest');
		this._requireExactKeys(
			manifest,
			[
				'schemaId',
				'id',
				'representativeSolarZenithDegrees',
				'selection',
				'sceneSun',
				'compatibility',
				'ledger',
				'coordinates',
				'requiredBlockIds',
				'reconstructedPayload',
				'derivation',
			],
			'Shared-cache scene manifest',
		);
		if (manifest.schemaId !== DISTANT_SUN_SHARED_CACHE_SCENE_MANIFEST_SCHEMA_ID) {
			throw new RangeError('Shared-cache scene-manifest schema is unsupported.');
		}
		const representativeSolarZenithDegrees = this._requireCount(
			manifest.representativeSolarZenithDegrees,
			'Shared-cache representative solar zenith',
		);
		if (
			representativeSolarZenithDegrees > 108 ||
			manifest.id !== `solar-zenith-${String(representativeSolarZenithDegrees).padStart(3, '0')}-degrees`
		) {
			throw new RangeError('Shared-cache scene identity is incompatible with production coverage.');
		}
		this._requireSceneSelection(manifest.selection, representativeSolarZenithDegrees);
		const sceneSun = this._requireSceneSun(manifest.sceneSun);

		const compatibility = this._requireRecord(manifest.compatibility, 'Shared-cache scene compatibility');
		this._requireExactKeys(
			compatibility,
			['configurationIdentity', 'atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity'],
			'Shared-cache scene compatibility',
		);
		for (const identityName of [
			'configurationIdentity',
			'atmosphereIdentity',
			'geometryIdentity',
			'groundIdentity',
			'numericalIdentity',
		]) {
			if (compatibility[identityName] !== configuration[identityName]) {
				throw new RangeError(`Shared-cache scene ${identityName} is physically incompatible.`);
			}
		}

		const ledger = DistantSunSceneCacheLedger.fromRecord(
			/** @type {DistantSunSceneCacheLedgerRecord} */ (manifest.ledger),
			{
				positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
				solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
				outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
				spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			},
		);
		if (
			ledger.sceneSun.id !== sceneSun.id ||
			ledger.sceneSun.instant !== sceneSun.instant ||
			ledger.sceneSun.sourceIdentity !== sceneSun.sourceIdentity ||
			ledger.sceneSun.directionToSourceUpEastNorth.some(
				(component, componentIndex) => component !== sceneSun.directionToSourceUpEastNorth[componentIndex],
			)
		) {
			throw new RangeError('Shared-cache scene ledger and manifest identify different Sun states.');
		}

		if (!Array.isArray(manifest.coordinates) || manifest.coordinates.length !== ledger.retainedBlockCount) {
			throw new RangeError('Shared-cache scene coordinates do not cover its retained ledger rows.');
		}
		const coordinateToBlock = new Map();
		for (const block of blockIndex.blocks) {
			for (const [blockRowIndex, coordinate] of block.coordinates.entries()) {
				coordinateToBlock.set(`${coordinate[0]}:${coordinate[1]}`, {blockId: block.id, blockRowIndex});
			}
		}
		const derivedBlockIds = [];
		const seenBlockIds = new Set();
		let scenePackedRow = 0;
		for (const ledgerRow of ledger.rows) {
			for (
				let solarZenithIndex = ledgerRow.firstSolarZenithIndex;
				solarZenithIndex <= ledgerRow.lastSolarZenithIndex;
				solarZenithIndex += 1
			) {
				const coordinate = manifest.coordinates[scenePackedRow];
				if (
					!Array.isArray(coordinate) ||
					coordinate.length !== 2 ||
					coordinate[0] !== ledgerRow.altitudeIndex ||
					coordinate[1] !== solarZenithIndex
				) {
					throw new RangeError('Shared-cache scene coordinates are not in canonical ledger order.');
				}
				const owner = coordinateToBlock.get(`${coordinate[0]}:${coordinate[1]}`);
				if (!owner) throw new RangeError('Shared-cache scene coordinate has a gap in block ownership.');
				if (!seenBlockIds.has(owner.blockId)) {
					seenBlockIds.add(owner.blockId);
					derivedBlockIds.push(owner.blockId);
				}
				scenePackedRow += 1;
			}
		}
		if (
			!Array.isArray(manifest.requiredBlockIds) ||
			manifest.requiredBlockIds.length !== derivedBlockIds.length ||
			manifest.requiredBlockIds.some((blockId, blockOrdinal) => blockId !== derivedBlockIds[blockOrdinal])
		) {
			throw new RangeError('Shared-cache scene required-block identity or ordering is incompatible.');
		}

		const reconstructedPayload = this._requireRecord(
			manifest.reconstructedPayload,
			'Shared-cache reconstructed payload',
		);
		this._requireExactKeys(reconstructedPayload, ['byteLength', 'sha256'], 'Shared-cache reconstructed payload');
		this._requireSha256(reconstructedPayload.sha256, 'Shared-cache reconstructed payload hash');
		if (reconstructedPayload.byteLength !== ledger.retainedBlockCount * DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH) {
			throw new RangeError('Shared-cache reconstructed payload byte length differs from its ledger.');
		}
		const derivation = this._requireDerivation(manifest.derivation, 'Shared-cache scene derivation');
		const reconstructedOutput = derivation.outputs.find((output) => output.role === 'reconstructed-scene');
		if (
			reconstructedOutput?.byteLength !== reconstructedPayload.byteLength ||
			reconstructedOutput?.sha256 !== reconstructedPayload.sha256
		) {
			throw new RangeError('Shared-cache scene derivation does not authenticate its reconstructed payload.');
		}
		return /** @type {DistantSunSharedCacheSceneManifest} */ (manifest);
	}

	/**
	 * Call this method to parse a serialized scene manifest against accepted owners.
	 * Malformed JSON or an incompatible scene manifest throws; callers must not reconstruct it.
	 *
	 * @param {string} serialized - Serialized scene-manifest JSON.
	 * @param {DistantSunSharedCacheConfigurationManifest} configuration - Accepted owning configuration.
	 * @param {DistantSunSharedCacheBlockIndex} blockIndex - Accepted owning block index.
	 * @returns {DistantSunSharedCacheSceneManifest} - Accepted scene manifest.
	 */
	parseSceneManifest(serialized, configuration, blockIndex) {
		return this.acceptSceneManifest(
			this._parse(serialized, 'Shared-cache scene manifest'),
			configuration,
			blockIndex,
		);
	}
}
