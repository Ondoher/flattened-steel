import {Registry} from '@polylith/core';
import {FlatEarthModel} from '../models/FlatEarthModel.js';
import {FlatEarthSession} from '../FlatEarthSession.js';

/**
 * Call this function to initialize an isolated registered Flat Earth model.
 *
 * @param {Registry} [registry] - Owning test application registry.
 * @returns {FlatEarthModelService} - Public scoped camera capability.
 */
export function createModel(registry = new Registry()) {
	new FlatEarthModel(registry).start();
	return registry.subscribe('flat-earth-model');
}

/**
 * Call this function to create a controller-owned session using a registered model.
 *
 * @param {string} viewId - Exact test view identity.
 * @param {(state: FlatEarthSceneState) => void} onChange - State observer.
 * @param {FlatEarthRuntimeFactory} [factory] - Test-owned graphics collaborator.
 * @returns {FlatEarthSession} - Session bound to its application model capability.
 */
export function createSession(viewId, onChange, factory) {
	let model = createModel();
	model.open(viewId);
	return new FlatEarthSession(viewId, model, onChange, factory);
}
