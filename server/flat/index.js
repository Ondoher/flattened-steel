import {registry} from '@polylith/core';
import './services/routers.js';
import './features/index.js';
/**
 * Call this router to start server services and install their ordered routes.
 *
 * @param {unknown} express - The Express module.
 * @param {unknown} router - The Polylith router.
 * @param {FlatServerApplication} app - The Polylith server application.
 * @param {import('@polylith/core').Registry} sharedRegistry - The installation registry supplied by Polylith.
 * @returns {Promise<boolean>} - True after route installation completes.
 */
export default async function mainRouter(express, router, app, sharedRegistry) {
	if (!sharedRegistry) throw new Error('Polylith did not provide the shared registry.');
	registry.attach('shared', sharedRegistry);
	await registry.start();
	let routers = /** @type {import('./services/routers.js').RoutersService} */ (registry.subscribe('routers'));
	for (let name of routers.get()) {
		let contribution = /** @type {FlatRouteContribution} */ (registry.subscribe(name));
		contribution.routes(express, router, app);
	}
	return true;
}
