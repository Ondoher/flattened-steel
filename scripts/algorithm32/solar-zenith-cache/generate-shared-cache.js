import DistantSunSharedCacheGenerator from './DistantSunSharedCacheGenerator.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';
import {DistantSunScatteringAccuracy} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunScatteringAccuracy.js';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const cancellation = new AbortController();
const interrupt = () => cancellation.abort(new Error('Generation interrupted.'));
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
try {
	const argumentsByName = new Map();
	for (let index = 2; index < process.argv.length; index += 2) {
		const name = process.argv[index];
		const value = process.argv[index + 1];
		if (
			![
				'--input',
				'--output',
				'--chrome',
				'--surface-limit',
				'--solar-interpolation',
				'--numerical-policy',
				'--scattering-accuracy',
				'--mie-angstrom-beta',
				'--maximum-observer-altitude-meters',
			].includes(name) ||
			!value ||
			value.startsWith('--') ||
			argumentsByName.has(name)
		) {
			throw new Error(
				'Usage: [--input INPUT.json --output REPOSITORY/RELATIVE/RUN] [--chrome ABSOLUTE_CHROME_PATH]',
			);
		}
		argumentsByName.set(name, value);
	}
	const inputPath = argumentsByName.get('--input');
	const surfaceLimit = argumentsByName.get('--surface-limit');
	const policyName = argumentsByName.get('--numerical-policy');
	if (policyName !== undefined && (policyName !== 'anchored-radial' || surfaceLimit !== undefined))
		throw new Error('Select either a surface limit or --numerical-policy anchored-radial.');
	const numericalPolicy = policyName
		? DistantSunSceneCacheNumerics.createAnchoredRadial()
		: surfaceLimit === undefined
			? undefined
			: DistantSunSceneCacheNumerics.createSurfaceLimit(Number(surfaceLimit));
	const solarInterpolation = argumentsByName.get('--solar-interpolation');
	const scatteringAccuracy = DistantSunScatteringAccuracy.accept(argumentsByName.get('--scattering-accuracy'));
	const aerosolArgument = argumentsByName.get('--mie-angstrom-beta');
	const altitudeArgument = argumentsByName.get('--maximum-observer-altitude-meters');
	const maximumObserverAltitudeMeters = altitudeArgument === undefined ? undefined : Number(altitudeArgument);
	if (
		maximumObserverAltitudeMeters !== undefined &&
		(!Number.isFinite(maximumObserverAltitudeMeters) ||
			maximumObserverAltitudeMeters < 0 ||
			maximumObserverAltitudeMeters >= 60000)
	)
		throw new RangeError('Maximum observer altitude must be finite, nonnegative and below 60000 metres.');
	const mieAngstromBeta = aerosolArgument === undefined ? undefined : Number(aerosolArgument);
	if (mieAngstromBeta !== undefined && (!Number.isFinite(mieAngstromBeta) || mieAngstromBeta < 0))
		throw new RangeError('Aerosol optical-depth scale must be finite and nonnegative.');
	if (solarInterpolation !== undefined && !['linear', 'monotone-cubic'].includes(solarInterpolation))
		throw new RangeError('Unsupported solar interpolation.');
	if (
		inputPath &&
		(numericalPolicy ||
			solarInterpolation ||
			scatteringAccuracy !== 'legacy' ||
			aerosolArgument !== undefined ||
			altitudeArgument !== undefined)
	)
		throw new Error('Explicit input owns its numerical policy and interpolation.');
	const outputDirectory = argumentsByName.get('--output');
	if (Boolean(inputPath) !== Boolean(outputDirectory)) {
		throw new Error('Explicit compilation requires both --input and --output.');
	}
	const chromePath =
		argumentsByName.get('--chrome') ??
		process.env.CHROME_PATH ??
		'C:/Program Files/Google/Chrome/Application/chrome.exe';
	const generator = new DistantSunSharedCacheGenerator({chromePath});
	let result;
	if (inputPath) {
		const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
		const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
		const input = JSON.parse((await files.read(inputPath)).toString('utf8'));
		result = await generator.compile({
			outputDirectory,
			buildRequest: input.buildRequest,
			scenes: input.scenes,
			wavelengths: input.wavelengths,
			signal: cancellation.signal,
			onProgress: (event) => {
				process.stdout.write(`${JSON.stringify(event)}\n`);
			},
		});
	} else {
		result = await generator.run({
			chromePath,
			numericalPolicy,
			solarInterpolation,
			scatteringAccuracy,
			mieAngstromBeta,
			maximumObserverAltitudeMeters,
			signal: cancellation.signal,
		});
	}
	process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
	process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
	process.exitCode = 1;
} finally {
	process.removeListener('SIGINT', interrupt);
	process.removeListener('SIGTERM', interrupt);
}
