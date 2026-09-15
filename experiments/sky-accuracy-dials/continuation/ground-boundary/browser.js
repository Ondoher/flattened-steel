import {runGpuBrowser as runContinuationCapture} from '../browser.js';
import {prepareGroundDensityCapture} from '../capture/ground.js';
import {compileGroundBoundary, groundBoundaryDigest} from './driver.js';
import {queryGroundArithmeticPrecision} from './arithmetic-precision.js';

/** @type {SkyGroundBoundaryTargetControl|null} */
let activeControl = null;
/** @type {SkySixCommonModule|null} */
let activeCommon = null;

/** Load the exact target extension before delegating the unchanged four-order evaluator.
 * @param {string} apiUrl - Owned loopback capability.
 * @param {string} compilerUrl - This authenticated module's compiler export.
 * @returns {Promise<SkyGpuBrowserResult>} Four regenerated fields, spectra and seven-method envelopes.
 */
export async function runGpuBrowser(apiUrl, compilerUrl) {
	if (activeControl) throw new Error('Concurrent ground-boundary browser control is forbidden.');
	const response = await fetch(apiUrl + '/control');
	if (!response.ok) throw new Error('Ground-boundary control is unavailable.');
	const control = /** @type {SkyGroundBoundaryTargetControl} */ (await response.json());
	if (
		control.executionSchemaId !== 'sky-ground-boundary-control-v1' ||
		!['ground-j2-p48-raw', 'ground-j2-p55-raw'].includes(control.caseId) ||
		JSON.stringify(control.channels) !== '[0,8]' ||
		JSON.stringify(control.actualOrders) !== '[1,2,3,4]' ||
		!Number.isSafeInteger(control.deadlineEpochMilliseconds) ||
		control.deadlineEpochMilliseconds <= Date.now()
	)
		throw new Error('Ground-boundary control is malformed or expired.');
	const common = /** @type {SkySixCommonModule} */ (await import(compilerUrl));
	if (typeof common.createDistantSunSceneCacheCommonShaderSource !== 'function')
		throw new Error('Authenticated common shader capability is missing.');
	activeControl = control;
	activeCommon = common;
	try {
		return await runContinuationCapture(apiUrl, import.meta.url);
	} finally {
		activeControl = null;
		activeCommon = null;
	}
}

/** Adapt the compiler capability while keeping shadow J2 outside the four propagated fields.
 * @param {SkyGpuCompileRequest} request - Existing four-order capture callback contract.
 * @returns {Promise<SkyGroundBoundaryTargetCompilerReport>} Actual new compiler schema and sparse shadow proof.
 */
export async function compileDistantSunSceneCacheWavelength(request) {
	const control = activeControl;
	if (!control || !activeCommon || JSON.stringify(request.buildRequest) !== JSON.stringify(control.buildRequest))
		throw new Error('Compiler is outside its authenticated target invocation.');
	const arithmeticPrecision = queryGroundArithmeticPrecision(request.gl);
	const ground = prepareGroundDensityCapture(request.buildRequest, {
		...control.continuation,
		groundDensityProbes: control.groundProofProbes,
	});
	if (!ground) throw new Error('Declared ground support is absent.');
	const coordinates = request.fieldProbeCoordinates.J2;
	if (!coordinates?.length) throw new Error('Original sparse union is absent.');
	const words = new Uint32Array(coordinates.length * 2);
	for (const [index, point] of coordinates.entries()) {
		words[index * 2] = point.x;
		words[index * 2 + 1] = point.y;
	}
	const coordinateSha256 = await groundBoundaryDigest(new Uint8Array(words.buffer));
	/** @type {SkyGroundBoundaryShadowProof|null} */ let shadowProof = null;
	/** @type {string|null} */ let commonShaderSource = null;
	const generator = activeCommon;
	const report = await compileGroundBoundary({
		...request,
		commonModule: {
			createDistantSunSceneCacheCommonShaderSource(parameters) {
				if (commonShaderSource !== null) throw new Error('Common shader was generated more than once.');
				commonShaderSource = generator.createDistantSunSceneCacheCommonShaderSource(parameters);
				if (typeof commonShaderSource !== 'string' || commonShaderSource.length > 65536)
					throw new Error('Common shader source is missing or unbounded.');
				return commonShaderSource;
			},
		},
		fieldProbeCoordinates: {...request.fieldProbeCoordinates, 'J2-shadow': coordinates},
		groundProbeCoordinates: ground.coordinates,
		reportProgress: async (stage) => {
			if (Date.now() >= control.deadlineEpochMilliseconds) throw new Error('Ground-boundary deadline reached.');
			await request.reportProgress?.(stage);
		},
		onFieldProbes: async (capture) => {
			if (Date.now() >= control.deadlineEpochMilliseconds) throw new Error('Ground-boundary deadline reached.');
			if (capture.fieldId !== 'J2-shadow') {
				await request.onFieldProbes?.(capture);
				return;
			}
			if (
				shadowProof ||
				capture.wavelengthIndex !== request.wavelengthIndex ||
				capture.values.length !== coordinates.length
			)
				throw new Error('Shadow callback changed its contract.');
			const field = new Float32Array(coordinates.length);
			let minimum = Infinity,
				maximum = -Infinity;
			for (const [index, entry] of capture.values.entries()) {
				if (
					entry.x !== coordinates[index].x ||
					entry.y !== coordinates[index].y ||
					!Number.isFinite(entry.value) ||
					entry.value < 0 ||
					Math.fround(entry.value) !== entry.value
				)
					throw new Error('Shadow field is invalid or reordered.');
				field[index] = entry.value;
				minimum = Math.min(minimum, entry.value);
				maximum = Math.max(maximum, entry.value);
			}
			shadowProof = {
				schemaId: 'sky-ground-boundary-shadow-proof-v1',
				coordinateCount: coordinates.length,
				coordinateSha256,
				fieldId: 'J2-shadow',
				originalFieldId: 'J2',
				count: field.length,
				minimum,
				maximum,
				pureSha256: await groundBoundaryDigest(new Uint8Array(field.buffer)),
			};
		},
	});
	if (!shadowProof || commonShaderSource === null)
		throw new Error('Original J2 shadow or common source was not observed.');
	if (!Array.isArray(report.ledger) || !Array.isArray(report.timings))
		throw new Error('Actual compiler work metadata is missing.');
	return {
		...report,
		shadowProof,
		commonShaderSource,
		arithmeticPrecision,
		ledger: /** @type {readonly SkyGroundBoundaryTargetLedger[]} */ (report.ledger),
		timings: /** @type {readonly SkyGroundBoundaryTargetTiming[]} */ (report.timings),
	};
}
