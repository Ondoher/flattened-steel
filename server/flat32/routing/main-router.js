import {registry} from '../registry.js';

/** Call this router to attach installation services and mount ordered app routes.
 * A missing installation registry or invalid router contribution rejects startup.
 * Package-load failures remain owned by their features and retain their 503 routes.
 *
 * @param {unknown} expressApplication - Host-owned Express application.
 * @param {Flat32HttpRouter} router - App-scoped HTTP route collection.
 * @param {Flat32ServerApplication} application - Polylith app mount information.
 * @param {ServerRegistry} sharedRegistry - Explicit installation registry from Polylith.
 * @returns {Promise<boolean>} - True after the app routes have been installed.
 */
export default async function mainRouter(expressApplication, router, application, sharedRegistry) {
	if (!sharedRegistry) throw new Error('Polylith did not provide the shared registry.');
	registry.attach('shared', sharedRegistry);
	await registry.start();
	let routers = /** @type {import('../services/routers.js').RoutersService} */ (registry.subscribe('routers'));
	for (let name of routers.get()) {
		let contribution = /** @type {Flat32RouterContribution} */ (registry.subscribe(name));
		contribution.routes(expressApplication, router, application);
	}
	return true;
}
