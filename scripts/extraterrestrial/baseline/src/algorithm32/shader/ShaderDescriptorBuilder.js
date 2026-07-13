import { stableHash } from './stableHash.js';
import { acceptOptionalArray } from './shaderCollectionValidation.js';

/**
 * Clone JSON-compatible data.
 *
 * @param {unknown} value - Supplies the value.
 * @returns {unknown} Return the cloned value.
 */
function cloneJson(value) {
	return JSON.parse(JSON.stringify(value));
}

/**
 * Create one descriptor section.
 *
 * @param {string} descriptorId - Supplies the section id.
 * @param {readonly string[]} compatibilityTags - Supplies compatibility tags.
 * @param {unknown} facts - Supplies section facts.
 * @returns {ShaderDescriptorSection} Return the section.
 */
function section(descriptorId, compatibilityTags, facts) {
	const body = {
		descriptorId,
		compatibilityTags: [...compatibilityTags],
		facts: cloneJson(facts),
	};

	return {
		...body,
		fingerprint: stableHash(body),
	};
}

/**
 * Accept a required object-valued field.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {object} The accepted object.
 */
function acceptRequiredObject(value, label) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must be an object when supplied.`);
	}

	return value;
}

/**
 * Accept an optional object-valued field.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {object | undefined} The accepted object or undefined.
 */
function acceptOptionalObject(value, label) {
	if (value === undefined) {
		return undefined;
	}

	return acceptRequiredObject(value, label);
}

/**
 * Accept an optional config snapshot and its object-valued sections.
 *
 * @param {unknown} value - Supplies the candidate config snapshot.
 * @returns {Config | undefined} The accepted facade config.
 */
function acceptConfigSnapshot(value) {
	if (value === undefined) {
		return undefined;
	}

	const snapshot = /** @type {ConfigSnapshot} */ (
		acceptRequiredObject(value, 'Shader descriptor config')
	);
	const config = /** @type {Config} */ (
		acceptRequiredObject(snapshot.config, 'Shader descriptor config.config')
	);

	acceptOptionalObject(config.execution, 'Shader descriptor config.execution');
	acceptOptionalObject(config.shader, 'Shader descriptor config.shader');

	if (config.color === null) {
		throw new TypeError('Shader descriptor config.color must not be null.');
	}

	return config;
}

/**
 * Accept a non-empty string field.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {string} The accepted string.
 */
function acceptNonEmptyString(value, label) {
	if (typeof value !== 'string' || value.trim().length === 0) {
		throw new TypeError(`${label} must be a non-empty string when supplied.`);
	}

	return value;
}

/**
 * Build shader descriptors from the facade-owned shared model snapshot.
 */
export class ShaderDescriptorBuilder {
	/**
	 * Build one shader descriptor.
	 *
	 * @param {ShaderDescriptorBuildRequest} request - Supplies shared model and runtime facts.
	 * @returns {Algorithm32ShaderDescriptor} Return the shader descriptor.
	 */
	build(request) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('Shader descriptor build request is required.');
		}

		acceptOptionalObject(request.model, 'Shader descriptor model');
		acceptOptionalObject(request.snapshot, 'Shader descriptor snapshot');
		const config = acceptConfigSnapshot(request.config);
		const snapshot = request.snapshot === undefined
			? request.model?.snapshot?.()
			: request.snapshot;

		if (!snapshot) {
			throw new TypeError('Shader descriptor build request requires a shared model snapshot.');
		}

		const color = request.color === undefined
			? config?.color
			: request.color;

		if (typeof color?.describe !== 'function') {
			throw new TypeError('Shader descriptor build requires a Color abstraction with describe().');
		}

		const colorDescriptor = color.describe();
		const shaderConfig = config?.shader === undefined ? {} : config.shader;
		const requestedCompatibilityTags = /** @type {readonly string[]} */ (acceptOptionalArray(
			request.compatibilityTags,
			'Shader descriptor compatibilityTags',
		));

		for (const tag of requestedCompatibilityTags) {
			if (typeof tag !== 'string' || tag.trim().length === 0) {
				throw new TypeError('Shader descriptor compatibilityTags entries must be non-empty strings.');
			}
		}

		const cacheDescriptor = request.cacheDescriptor === undefined
			? {
				cacheKind: 'none',
				sourceKey: snapshot.lightSource.id ?? snapshot.lightSource.kind,
				version: snapshot.version,
			}
			: acceptRequiredObject(request.cacheDescriptor, 'Shader descriptor cacheDescriptor');
		const cacheCompatibilityTag = request.cacheDescriptor === undefined
			? 'no-scattering-cache'
			: 'cumulative-scattering-cache';
		const variantId = request.variantId === undefined
			? `model-v${snapshot.version}`
			: acceptNonEmptyString(request.variantId, 'Shader descriptor variantId');
		const mode = shaderConfig.mode === undefined
			? 'default'
			: acceptNonEmptyString(shaderConfig.mode, 'Shader descriptor shader mode');
		const compatibilityTags = [
			'algorithm32',
			'shared-model-descriptor',
			...requestedCompatibilityTags,
		];
		const sections = {
			spectralBasis: section('spectral-basis', ['spectral-basis'], snapshot.spectral),
			geometry: section('geometry', ['geometry'], snapshot.geometry),
			atmosphere: section('atmosphere', ['atmosphere'], snapshot.atmosphere),
			lightSource: section('light-source', ['light-source'], snapshot.lightSource),
			cache: section('cache', [cacheCompatibilityTag], cacheDescriptor),
			transport: section('transport', ['algorithm32-transport'], {
				execution: config?.execution === undefined ? {} : config.execution,
				spectralChannelCount: snapshot.spectral.channelCount,
			}),
			color: section('color', ['display-color'], colorDescriptor),
			runtime: section('runtime', ['three-fragment-shader'], {
				mode,
				cachePolicy: shaderConfig.cachePolicy ?? null,
				capabilityPolicy: shaderConfig.capabilityPolicy ?? null,
				renderTargetPolicy: shaderConfig.renderTargetPolicy ?? null,
				modelVersion: snapshot.version,
			}),
		};
		const body = {
			descriptorId: 'algorithm32-shader-descriptor',
			variantId,
			compatibilityTags,
			...sections,
		};

		return {
			...body,
			fingerprint: stableHash(body),
		};
	}
}
