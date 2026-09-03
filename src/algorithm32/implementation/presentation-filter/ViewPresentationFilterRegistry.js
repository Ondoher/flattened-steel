import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';

export const VIEW_PRESENTATION_FILTER_REGISTRY_ID = 'view-presentation-filter-registry-v1';

export const VIEW_PRESENTATION_FILTER_STAGES = /** @type {const} */ ({
	SPECTRAL_VIEW: 'spectral-view',
	SOURCE_LINEAR: 'source-linear',
	COMPOSED_LINEAR: 'composed-linear',
	DISPLAY_OUTPUT: 'display-output',
});

export const VIEW_PRESENTATION_FILTER_TARGETS = /** @type {const} */ ({
	STELLAR: 'stellar',
	SOLAR: 'solar',
	SKY: 'sky',
	SCENE: 'scene',
	COMPOSED: 'composed',
});

export const VIEW_PRESENTATION_FILTER_IDS = /** @type {const} */ ({
	HUMAN_MESOPIC_LUMINANCE_V1: 'human-mesopic-luminance-v1',
	HUMAN_LOW_LIGHT_CHROMA_V1: 'human-low-light-chroma-v1',
});

export const HUMAN_MESOPIC_LUMINANCE_PARAMETERS = Object.freeze({
	photopicBoundaryCdM2: 5,
	scotopicBoundaryCdM2: 0.005,
	maximumRodContribution: 0.5,
});

export const HUMAN_LOW_LIGHT_CHROMA_PARAMETERS = Object.freeze({
	fullColorMagnitude: 0,
	neutralMagnitude: 3.2,
	maximumChromaRetention: 0.65,
});

export const HUMAN_LOW_LIGHT_LUMINANCE_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);

export const NATIVE_15_SCOTOPIC_LUMINANCE_WEIGHT_COUNT = 15;

const FILTER_KEYS = new Set(['id', 'stage', 'target', 'enabled', 'parameters']);

function requireRecord(value, label) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must be an object.`);
	}
	return value;
}

function requireKeys(record, accepted, label) {
	for (const key of Object.keys(record)) {
		if (!accepted.has(key)) throw new RangeError(`${label} does not support ${key}.`);
	}
}

function requireExactNumber(value, expected, label) {
	if (value !== expected) throw new RangeError(`${label} must equal ${expected}.`);
	return value;
}

function acceptFilter(candidate, order) {
	const label = `View-presentation filter ${order}`;
	const filter = requireRecord(candidate, label);
	requireKeys(filter, FILTER_KEYS, label);
	if (filter.stage !== VIEW_PRESENTATION_FILTER_STAGES.SOURCE_LINEAR) {
		throw new RangeError(`${label} requests an unimplemented stage.`);
	}
	if (filter.target !== VIEW_PRESENTATION_FILTER_TARGETS.STELLAR) {
		throw new RangeError(`${label} requests an unimplemented target.`);
	}
	if (typeof filter.enabled !== 'boolean') throw new TypeError(`${label} enabled must be boolean.`);
	const parameters = requireRecord(filter.parameters, `${label} parameters`);

	if (filter.id === VIEW_PRESENTATION_FILTER_IDS.HUMAN_MESOPIC_LUMINANCE_V1) {
		requireKeys(parameters, new Set(['maximumRodContribution']), `${label} parameters`);
		return Object.freeze({
			id: filter.id,
			stage: filter.stage,
			target: filter.target,
			order,
			enabled: filter.enabled,
			parameters: Object.freeze({
				...HUMAN_MESOPIC_LUMINANCE_PARAMETERS,
				maximumRodContribution: requireExactNumber(
					parameters.maximumRodContribution,
					HUMAN_MESOPIC_LUMINANCE_PARAMETERS.maximumRodContribution,
					`${label} maximumRodContribution`,
				),
			}),
		});
	}

	if (filter.id === VIEW_PRESENTATION_FILTER_IDS.HUMAN_LOW_LIGHT_CHROMA_V1) {
		requireKeys(parameters, new Set(['maximumChromaRetention']), `${label} parameters`);
		return Object.freeze({
			id: filter.id,
			stage: filter.stage,
			target: filter.target,
			order,
			enabled: filter.enabled,
			parameters: Object.freeze({
				...HUMAN_LOW_LIGHT_CHROMA_PARAMETERS,
				maximumChromaRetention: requireExactNumber(
					parameters.maximumChromaRetention,
					HUMAN_LOW_LIGHT_CHROMA_PARAMETERS.maximumChromaRetention,
					`${label} maximumChromaRetention`,
				),
			}),
		});
	}

	throw new RangeError(`${label} is not registered.`);
}

function acceptRgb(rgb) {
	if (rgb?.length !== 3) throw new RangeError('Source-linear RGB must contain exactly three channels.');
	const values = Array.from(rgb, Number);
	if (!values.every(Number.isFinite)) throw new RangeError('Source-linear RGB must be finite.');
	return values;
}

function smoothstep01(value) {
	const bounded = Math.max(0, Math.min(1, value));
	return bounded * bounded * (3 - 2 * bounded);
}

export function humanMesopicRodWeight(adaptationLuminanceCdM2) {
	if (!Number.isFinite(adaptationLuminanceCdM2) || adaptationLuminanceCdM2 < 0) {
		throw new RangeError('Adaptation luminance must be finite and nonnegative.');
	}
	const parameters = HUMAN_MESOPIC_LUMINANCE_PARAMETERS;
	const bounded = Math.max(adaptationLuminanceCdM2, parameters.scotopicBoundaryCdM2);
	const logarithmicRange = Math.log10(parameters.photopicBoundaryCdM2) -
		Math.log10(parameters.scotopicBoundaryCdM2);
	const position = (Math.log10(parameters.photopicBoundaryCdM2) - Math.log10(bounded)) /
		logarithmicRange;
	return parameters.maximumRodContribution * smoothstep01(position);
}

export function native15ScotopicLuminance(transportedNative15, scotopicLuminanceWeights) {
	if (
		transportedNative15?.length !== NATIVE_15_SCOTOPIC_LUMINANCE_WEIGHT_COUNT ||
		scotopicLuminanceWeights?.length !== NATIVE_15_SCOTOPIC_LUMINANCE_WEIGHT_COUNT
	) {
		throw new RangeError('Scotopic luminance requires exactly 15 transported channels.');
	}
	let luminance = 0;
	for (let index = 0; index < NATIVE_15_SCOTOPIC_LUMINANCE_WEIGHT_COUNT; index += 1) {
		const value = Number(transportedNative15[index]);
		const weight = Number(scotopicLuminanceWeights[index]);
		if (!Number.isFinite(value) || value < 0 || !Number.isFinite(weight) || weight < 0) {
			throw new RangeError('Transported Native15 radiance and scotopic weights must be finite and nonnegative.');
		}
		luminance += value * weight;
	}
	return luminance;
}

export function humanLowLightChromaRetention(visualMagnitude) {
	if (!Number.isFinite(visualMagnitude)) throw new RangeError('Visual magnitude must be finite.');
	const parameters = HUMAN_LOW_LIGHT_CHROMA_PARAMETERS;
	const position = (parameters.neutralMagnitude - visualMagnitude) /
		(parameters.neutralMagnitude - parameters.fullColorMagnitude);
	return parameters.maximumChromaRetention * smoothstep01(position);
}

/** Ordered, versioned owner for the currently implemented presentation-filter hooks. */
export class ViewPresentationFilterRegistry {
	/** @type {readonly any[]} */
	_filters;
	/** @type {string} */
	_identity;
	/** @type {readonly number[] | null} */
	_scotopicLuminanceWeights;

	/**
	 * @param {readonly any[]} filters - Ordered registered filter selections.
	 * @param {Readonly<{scotopicLuminanceWeights?: ArrayLike<number>}>} configuration - Optional authenticated local data.
	 */
	constructor(filters = [], configuration = {}) {
		if (!Array.isArray(filters)) throw new TypeError('View-presentation filters must be an array.');
		this._filters = filters.map(acceptFilter);
		const ids = this._filters.map(({id}) => id);
		if (new Set(ids).size !== ids.length) throw new RangeError('View-presentation filter ids must be unique.');
		const mesopic = ids.indexOf(VIEW_PRESENTATION_FILTER_IDS.HUMAN_MESOPIC_LUMINANCE_V1);
		const chroma = ids.indexOf(VIEW_PRESENTATION_FILTER_IDS.HUMAN_LOW_LIGHT_CHROMA_V1);
		if (mesopic >= 0 && chroma >= 0 && mesopic > chroma) {
			throw new RangeError('Human mesopic luminance must precede human low-light chroma.');
		}
		this._identity = CanonicalValueHash.sha256Value({
			schemaId: VIEW_PRESENTATION_FILTER_REGISTRY_ID,
			filters: this._filters,
		});
		this._scotopicLuminanceWeights = configuration.scotopicLuminanceWeights === undefined
			? null
			: Object.freeze(Array.from(configuration.scotopicLuminanceWeights, Number));
		if (
			this._scotopicLuminanceWeights !== null &&
			(this._scotopicLuminanceWeights.length !== NATIVE_15_SCOTOPIC_LUMINANCE_WEIGHT_COUNT ||
				!this._scotopicLuminanceWeights.every((value) => Number.isFinite(value) && value >= 0))
		) {
			throw new RangeError('Scotopic luminance weights must contain 15 finite nonnegative values.');
		}
		Object.freeze(this._filters);
	}

	get id() {
		return VIEW_PRESENTATION_FILTER_REGISTRY_ID;
	}

	get identity() {
		return this._identity;
	}

	get filters() {
		return this._filters;
	}

	get enabled() {
		return this._filters.some((filter) => filter.enabled);
	}

	/** Apply only matching stellar source-linear filters; identity returns the original RGB object. */
	applySourceLinear(rgb, metadata) {
		const applicable = this._filters.filter(
			(filter) => filter.enabled && filter.target === metadata?.target,
		);
		if (applicable.length === 0) return rgb;
		let result = acceptRgb(rgb);
		for (const filter of applicable) {
			if (filter.id === VIEW_PRESENTATION_FILTER_IDS.HUMAN_MESOPIC_LUMINANCE_V1) {
				const photopic = HUMAN_LOW_LIGHT_LUMINANCE_WEIGHTS.reduce(
					(sum, weight, index) => sum + result[index] * weight,
					0,
				);
				if (!Number.isFinite(photopic) || photopic < 0) {
					throw new RangeError('E8 stellar photopic luminance must be finite and nonnegative.');
				}
				if (photopic !== 0) {
					if (this._scotopicLuminanceWeights === null) {
						throw new RangeError('Mesopic execution requires authenticated local scotopic weights.');
					}
					const scotopic = native15ScotopicLuminance(
						metadata?.transportedNative15,
						this._scotopicLuminanceWeights,
					);
					const weight = humanMesopicRodWeight(metadata?.adaptationLuminanceCdM2);
					const mesopic = photopic + weight * (scotopic - photopic);
					result = result.map((component) => component * (mesopic / photopic));
				}
				continue;
			}
			const luminance = HUMAN_LOW_LIGHT_LUMINANCE_WEIGHTS.reduce(
				(sum, weight, index) => sum + result[index] * weight,
				0,
			);
			const retention = humanLowLightChromaRetention(metadata?.visualMagnitude);
			result = result.map((component) => luminance + retention * (component - luminance));
		}
		if (!result.every(Number.isFinite)) throw new RangeError('Presentation-filter output must be finite.');
		return result;
	}

	/** GLSL source-linear hook consumed by P7 without introducing a general callback surface. */
	createStellarSourceLinearShaderHook() {
		const mesopicEnabled = this._filters.some(
			({id, enabled}) => id === VIEW_PRESENTATION_FILTER_IDS.HUMAN_MESOPIC_LUMINANCE_V1 && enabled,
		);
		const chromaEnabled = this._filters.some(
			({id, enabled}) => id === VIEW_PRESENTATION_FILTER_IDS.HUMAN_LOW_LIGHT_CHROMA_V1 && enabled,
		);
		if (mesopicEnabled && this._scotopicLuminanceWeights === null) {
			throw new RangeError('Mesopic shader generation requires authenticated local scotopic weights.');
		}
		const scotopicWeights = (this._scotopicLuminanceWeights ?? new Array(15).fill(0))
			.map((value) => Number(value).toExponential(16));
		return Object.freeze({
			id: 'stellar-source-linear-presentation-filter-hook-v1',
			registryIdentity: this._identity,
			scotopicWeightsIdentity: this._scotopicLuminanceWeights === null
				? null
				: CanonicalValueHash.sha256Value(this._scotopicLuminanceWeights),
			stage: VIEW_PRESENTATION_FILTER_STAGES.SOURCE_LINEAR,
			target: VIEW_PRESENTATION_FILTER_TARGETS.STELLAR,
			source: `const float STELLAR_SCOTOPIC_WEIGHTS[15] = float[15](${scotopicWeights.join(', ')});
vec3 applyStellarSourceLinearPresentationFilters(
	vec3 sourceRgb,
	float transportedNative15[15],
	float visualMagnitude,
	float adaptationLuminanceCdM2
) {
	vec3 filteredRgb = sourceRgb;
	${mesopicEnabled ? `float photopic = dot(filteredRgb, vec3(0.2126, 0.7152, 0.0722));
	if (photopic > 0.0) {
		float boundedAdaptation = max(adaptationLuminanceCdM2, 0.005);
		float t = clamp((log(5.0) / log(10.0) - log(boundedAdaptation) / log(10.0)) / 3.0, 0.0, 1.0);
		float rodWeight = 0.5 * t * t * (3.0 - 2.0 * t);
		float scotopic = 0.0;
		for (int channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			scotopic += transportedNative15[channelIndex] * STELLAR_SCOTOPIC_WEIGHTS[channelIndex];
		}
		float mesopic = photopic + rodWeight * (scotopic - photopic);
		filteredRgb *= mesopic / photopic;
	}` : ''}
	${chromaEnabled ? `float luminance = dot(filteredRgb, vec3(0.2126, 0.7152, 0.0722));
	float magnitudeT = clamp((3.2 - visualMagnitude) / 3.2, 0.0, 1.0);
	float retention = 0.65 * magnitudeT * magnitudeT * (3.0 - 2.0 * magnitudeT);
	filteredRgb = vec3(luminance) + retention * (filteredRgb - vec3(luminance));` : ''}
	return filteredRgb;
}`,
		});
	}

	/** Contribute the selected source-linear hook and live adaptation scalar. */
	createShaderContribution() {
		if (!this.enabled) throw new Error('Disabled presentation filters have no shader contribution.');
		const hook = this.createStellarSourceLinearShaderHook();
		return ShaderContributions.createShaderContribution({
			id: hook.id,
			owner: 'stellarSource',
			provides: ['presentation.applyStellarSourceLinear'],
			requires: [],
			textures: [],
			uniforms: [ShaderContributions.createShaderUniformDeclaration(
				'uStellarAdaptationLuminanceCdM2',
				'float',
				'presentation.stellar.adaptationLuminanceCdM2',
				0,
			)],
			bindingRequirements: [ShaderContributions.createShaderBindingRequirement(
				'presentation.stellar-adaptation-luminance',
				'stellarSource',
				'uniform',
				'frame',
				'presentation.stellar.adaptationLuminanceCdM2',
				true,
			)],
			functions: [ShaderContributions.createShaderSourceBlock(
				'presentation-stellar-source-linear-hook',
				'composeSceneColor',
				-10,
				hook.source,
			)],
			mainHooks: [],
			diagnostics: {
				registryIdentity: this.identity,
				scotopicWeightsIdentity: hook.scotopicWeightsIdentity,
				stage: hook.stage,
				target: hook.target,
			},
		});
	}
}
