import { sha256Descriptor } from '../../descriptors/descriptorSupport.js';

/** Name of the executor-owned wavelength-layer uniform. */
export const CACHE_WAVELENGTH_LAYER_BINDING_NAME = 'a32CacheWavelengthLayer';

/** Identify the shared omitted-boundary module without source-kind coupling. */
export const CANONICAL_BLACK_GROUND_MODULE_ID =
	'algorithm32-canonical-black-ground-scatter-module-v1';

/** Derive an injective GLSL-safe input sampler name from a logical field id. */
export function cacheFieldInputBindingName(fieldId) {
	const bytes = new TextEncoder().encode(fieldId);
	const encoded = Array.from(
		bytes,
		(value) => value.toString(16).padStart(2, '0'),
	).join('');
	return `a32CacheField_${encoded}`;
}

/** Copy packed cache data and derive its stable metadata identity. */
export function createCacheData(definition) {
	const body = {
		id: definition.id,
		quantity: definition.quantity,
		units: definition.units,
		shape: [...definition.shape],
		values: Array.from(definition.values),
	};

	return /** @type {CacheData} */ ({
		...body,
		contentHash: sha256Descriptor(body),
	});
}

/** Return stable metadata for one already typed shader binding value. */
function bindingIdentity(binding) {
	if (binding.spec.kind === 'data') {
		return {
			id: binding.value.id,
			contentHash: binding.value.contentHash,
		};
	}

	if (binding.spec.kind === 'uniform'
		&& binding.spec.shaderType.startsWith('float[')) {
		return {
			contentHash: /** @type {SpectralPacket} */ (binding.value).contentHash,
		};
	}

	return binding.value;
}

/** Construct one owner module and derive its descriptive content identity. */
export function createCacheBuildModule(definition) {
	const blocks = [...definition.blocks].sort((left, right) =>
		left.phase.localeCompare(right.phase)
		|| left.order - right.order
		|| left.id.localeCompare(right.id));
	const bindings = [...definition.bindings].sort((left, right) =>
		left.spec.id.localeCompare(right.spec.id));
	const body = {
		id: definition.id,
		owner: definition.owner,
		provides: [...definition.provides].sort(),
		requires: [...definition.requires].sort(),
		blocks,
		bindings,
	};
	const identity = {
		...body,
		bindings: bindings.map((binding) => ({
			spec: binding.spec,
			value: bindingIdentity(binding),
		})),
	};

	return /** @type {CacheBuildModule} */ ({
		...body,
		contentHash: sha256Descriptor(identity),
	});
}

/** Derive descriptive identity for one complete source-owned logical plan. */
export function createCachePlanIdentity(id, fields, passes) {
	const body = {
		kind: 'source-owned-cache-construction-plan',
		id,
		fields: fields.map((field) => ({
			id: field.id,
			storage: field.storage,
			descriptor: field.descriptor.contentHash,
		})),
		passes: passes.map((pass) => ({
			id: pass.id,
			kind: pass.kind,
			order: pass.order,
			inputs: pass.inputs,
			output: pass.output,
			modules: pass.modules.map((module) => ({
				id: module.id,
				owner: module.owner,
				contentHash: module.contentHash,
			})),
		})),
	};

	return {
		id,
		contentHash: sha256Descriptor(body),
	};
}

/** Derive descriptive identity for one owner's modules in a logical plan. */
export function createCacheOwnerIdentity(owner, id, passes) {
	const modules = passes
		.flatMap((pass) => pass.modules)
		.filter((module) => module.owner === owner)
		.map((module) => ({
			id: module.id,
			contentHash: module.contentHash,
		}));

	return {
		id,
		contentHash: sha256Descriptor({
			kind: 'cache-construction-owner',
			id,
			modules,
		}),
	};
}
