/** Deterministic dependency inventory for ordered scene requests. */
export default class CacheWorkPlanner {
	/** Call this method to plan each distinct configuration/coordinate operation once.
	 * Invalid identities or coordinates throw before a plan is returned.
	 * @param {CacheReuseSceneRequest[]} requests - Ordered requests, including repetitions.
	 * @returns {CacheReusePlan} - Stable inventory with scene-to-inventory indexes.
	 */
	plan(requests) {
		if (!Array.isArray(requests)) throw new Error('Scene requests must be an array.');
		const inventory = [];
		const indexes = new Map();
		const scenes = [];
		for (const request of requests) {
			if (
				!request ||
				typeof request.configurationIdentity !== 'string' ||
				!request.configurationIdentity ||
				typeof request.id !== 'string' ||
				!Array.isArray(request.coordinates)
			)
				throw new Error('Invalid scene request.');
			const slots = [];
			for (const coordinate of request.coordinates) {
				if (
					!Array.isArray(coordinate) ||
					coordinate.length !== 2 ||
					coordinate.some((value) => !Number.isSafeInteger(value) || value < 0 || Object.is(value, -0))
				) {
					throw new Error('Invalid coordinate.');
				}
				const key = JSON.stringify([request.configurationIdentity, ...coordinate]);
				if (!indexes.has(key)) {
					indexes.set(key, inventory.length);
					inventory.push({configurationIdentity: request.configurationIdentity, coordinate: [...coordinate]});
				}
				slots.push(indexes.get(key));
			}
			scenes.push({id: request.id, slots});
		}
		return {inventory, scenes, requestedRows: scenes.reduce((sum, scene) => sum + scene.slots.length, 0)};
	}
}
