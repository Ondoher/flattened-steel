import DistantSunSharedCacheGenerator from './DistantSunSharedCacheGenerator.js';

const cancellation = new AbortController();
process.once('SIGINT', () => cancellation.abort(new Error('Generation interrupted.')));
process.once('SIGTERM', () => cancellation.abort(new Error('Generation terminated.')));
try {
	const result = await new DistantSunSharedCacheGenerator().run({
		chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
		signal: cancellation.signal,
	});
	process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
	process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
	process.exitCode = 1;
}
