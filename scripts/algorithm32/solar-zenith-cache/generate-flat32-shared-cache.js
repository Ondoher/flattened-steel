import {createFlat32Atmosphere} from '../../../src/flat32/Flat32Atmosphere.js';
import DistantSunSharedCacheGenerator from './DistantSunSharedCacheGenerator.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import {fileURLToPath} from 'node:url';

// App composition owns this selection; the generic compiler and canonical paper defaults remain unchanged.
const cancellation = new AbortController();
/** Called by process lifecycle to cancel the owned compiler and release its resources. */
const interrupt = () => cancellation.abort(new Error('Flat32 atmosphere generation interrupted.'));
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
try {
	if (process.argv.length !== 2)
		throw new RangeError('This entry builds the app-selected atmosphere without overrides.');
	const chromePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
	const files = new Files(fileURLToPath(new URL('../../../', import.meta.url)));
	const inputParents = await Promise.all(
		[
			'src/flat32/Flat32Atmosphere.js',
			'scripts/algorithm32/solar-zenith-cache/generate-flat32-shared-cache.js',
		].map(async (path, index) => {
			const bytes = await files.read(path);
			return {
				role: index === 0 ? 'application-atmosphere-source' : 'application-generation-entry',
				artifact: {path, byteLength: bytes.length, sha256: files.hash(bytes)},
			};
		}),
	);
	const result = await new DistantSunSharedCacheGenerator({chromePath}).run({
		chromePath,
		numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial(),
		solarInterpolation: 'monotone-cubic',
		scatteringAccuracy: 'corrected60-sun035',
		aerosolConstants: createFlat32Atmosphere().constants,
		maximumObserverAltitudeMeters: 40000,
		inputParents,
		signal: cancellation.signal,
	});
	process.stdout.write(`${JSON.stringify(result)}\n`);
} finally {
	process.removeListener('SIGINT', interrupt);
	process.removeListener('SIGTERM', interrupt);
}
