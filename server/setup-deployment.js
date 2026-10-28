import {registry} from '@polylith/core';

/** Call this setup to attach installation services before any app router starts.
 * A missing installation registry rejects setup; the host must provide its startup context.
 * Discovered execution attaches the existing registry without restarting shared services.
 *
 * @param {DeploymentContext} context - Host-owned installation context.
 * @param {boolean} isMaster - Whether this repository owns the active server.
 * @returns {Promise<void>} - Shared startup completed when this repository is master.
 */
export default async function setupDeployment({sharedRegistry}, isMaster) {
	if (!sharedRegistry) throw new Error('Polylith did not provide the shared registry.');
	registry.attach('shared', sharedRegistry);
	if (isMaster) await sharedRegistry.start();
}
