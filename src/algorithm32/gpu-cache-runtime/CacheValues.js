import {CanonicalValueHash} from '../value-identity/CanonicalValueHash.js';

/** Runtime cache-data and plan-identity construction methods. */
export const CacheValues = {
	/**
	 * Call this method to copy packed cache data and derive its stable metadata identity.
	 *
	 * @param {CacheDataDefinition} definition - The packed cache-data definition.
	 * @returns {CacheData} - The copied and identified cache data.
	 */
	createData(definition) {
		const body = {
			id: definition.id,
			quantity: definition.quantity,
			units: definition.units,
			shape: [...definition.shape],
			values: Array.from(definition.values),
		};

		return /** @type {CacheData} */ ({
			...body,
			contentHash: CanonicalValueHash.sha256Value(body),
		});
	},

	/**
	 * Call this method to derive descriptive identity for one complete source-owned logical plan.
	 *
	 * @param {string} planIdentifier - The logical plan identifier.
	 * @param {readonly CacheFieldSpec[]} fields - The logical plan fields.
	 * @param {readonly CachePass[]} passes - The ordered construction passes.
	 * @param {CachePlanReuseFacts} [reuseFacts] - The source-owned reuse facts.
	 * @returns {CacheReuseIdentity} - The complete plan identity.
	 */
	createPlanIdentity(planIdentifier, fields, passes, reuseFacts = {}) {
		const body = {
			kind: 'source-owned-cache-construction-plan',
			id: planIdentifier,
			fields: fields.map((field) => ({
				id: field.id,
				storage: field.storage,
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
			reuseFacts,
		};

		return {
			id: planIdentifier,
			contentHash: CanonicalValueHash.sha256Value(body),
		};
	},
};
