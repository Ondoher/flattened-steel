import {readFile} from 'node:fs/promises';

/** Authenticated proof-asset reads behind the loopback transport boundary. */
export class TheHoursAssetService {
	/** Creates an asset reader without opening a socket.
	 * @param {TheHoursAssetServiceConfiguration} configuration - Exact authenticated input and output capabilities.
	 */
	constructor(configuration) {
		this._configuration = configuration;
	}

	/** Call this method to read one exact allowed proof asset.
	 * @param {string} route - Parsed request pathname.
	 * @returns {Promise<TheHoursAssetResponse|null>} - Complete asset bytes and media type, or an absent route.
	 */
	async read(route) {
		let absolute;
		if (route.startsWith('/cache/')) absolute = await this._configuration.inputs.path(route.slice(7));
		else if (route === '/browser.js' || route === '/shared-cache-worker.js')
			absolute = await this._configuration.run.outputPath(route.slice(1));
		else absolute = this._configuration.assets.get(route);
		if (!absolute) return null;
		return {
			bytes: await readFile(absolute),
			contentType: route.endsWith('.js')
				? 'text/javascript'
				: route.endsWith('.json')
					? 'application/json'
					: 'application/octet-stream',
		};
	}
}
