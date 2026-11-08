import {readFile} from 'node:fs/promises';
import {buildDistantSunSharedCacheWorker} from '../../../../scripts/algorithm32/solar-zenith-cache/build-shared-cache-worker.js';

const descriptor = JSON.parse(await readFile(new URL('./build.json', import.meta.url), 'utf8'));
const featureRoot = 'features/spherical-earth';

export default {
	/**
	 * Called by Polylith to materialize this feature's Worker in the actual application output context.
	 *
	 * @param {SphericalEarthBuildApplication} app - Source/output-aware builder capability.
	 * @returns {Promise<void>} - Complete feature registration and Worker output.
	 */
	async build(app) {
		await buildDistantSunSharedCacheWorker(app.destPath);
		app.addFeatureIndex(`${featureRoot}/${descriptor.index}`);
		app.addMainCss(featureRoot, descriptor.css);
	},
};
