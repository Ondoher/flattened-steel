import assert from 'node:assert/strict';
import {identity, readRepository, verifyRun} from './io/files.mjs';
import {inputRun} from './inputs.mjs';
import {ALL_RAYS, parseBoundaryTsv, RADIANCE_UNITS, selectBoundary} from './analysis/boundary.mjs';
import {scoreBoundary} from './analysis/metrics.mjs';

/** Read the authenticated previously measured Kider boundary.
 * @returns {DialAnalysisBoundary}
 */
export function measurements() {
	verifyRun(inputRun);
	const file = `${inputRun}/measurements.tsv`;
	return parseBoundaryTsv(readRepository(file).toString(), {configId: 'kider', sourceIdentity: identity(file)});
}

/** Convert an immutable streamed GPU run into one explicitly selected spectral boundary.
 * @param {string} runPath @param {SkyRepresentation} [representation] @param {number} [viewCount]
 * @param {SkySolarInterpolation} [solar] @param {number} [order] @returns {DialAnalysisBoundary}
 */
export function runBoundary(
	runPath,
	representation = 'cumulative',
	viewCount = 30,
	solar = 'monotone-cubic',
	order = 4,
) {
	return extractBoundary(loadSpectra(runPath), representation, viewCount, solar, order);
}

/** Authenticate each source artifact once and keep compact channel buffers in this operation.
 * @param {string} runPath @returns {DialLoadedSpectra}
 */
export function loadSpectra(runPath) {
	const sealIdentity = verifyRun(runPath);
	const seal = JSON.parse(readRepository(sealIdentity.path, sealIdentity).toString());
	assert.equal(seal.state, 'accepted');
	const read = (file) =>
		readRepository(
			file,
			seal.artifacts.find((artifact) => artifact.path === file),
		);
	const control = /** @type {SkyGpuControl} */ (JSON.parse(read(`${runPath}/control.json`).toString()));
	const spectra = control.channels.map((channel) => {
		const stem = `${runPath}/channel-${String(channel).padStart(2, '0')}`;
		const metadata = JSON.parse(read(`${stem}.json`).toString());
		return {channel, shape: metadata.shape, bytes: read(`${stem}.f64`)};
	});
	return {sealIdentity, caseId: seal.result.caseId, control, spectra};
}

/** Select one model from already authenticated compact input buffers.
 * @param {DialLoadedSpectra} loaded @param {SkyRepresentation} representation @param {number} viewCount
 * @param {SkySolarInterpolation} solar @param {number} order @returns {DialAnalysisBoundary}
 */
export function extractBoundary(loaded, representation, viewCount, solar, order) {
	const {control, sealIdentity} = loaded;
	const representationIndex = control.controls.representations.indexOf(representation);
	const viewIndex =
		control.controls.viewIntervals.indexOf(viewCount) * control.controls.solarInterpolations.length +
		control.controls.solarInterpolations.indexOf(solar);
	assert.ok(
		representationIndex >= 0 &&
			control.controls.viewIntervals.includes(viewCount) &&
			control.controls.solarInterpolations.includes(solar),
	);
	assert.ok(Number.isInteger(order) && order >= 1 && order <= 4);
	const times = control.scenes.map((scene) => scene.time),
		channels = control.channels;
	const values = new Float64Array(times.length * 81 * channels.length);
	for (const [channelOrdinal, metadata] of loaded.spectra.entries()) {
		const bytes = metadata.bytes;
		assert.deepEqual(metadata.shape, {
			representationCount: control.controls.representations.length,
			viewCount: control.controls.viewIntervals.length * control.controls.solarInterpolations.length,
			orderCount: 4,
			rayCount: times.length * 81,
		});
		const offset =
			((representationIndex * metadata.shape.viewCount + viewIndex) * 4 + order - 1) * metadata.shape.rayCount;
		for (let scene = 0; scene < times.length; scene++)
			for (let x = 0; x < 9; x++)
				for (let y = 0; y < 9; y++) {
					const sourceIndex = offset + scene * 81 + x * 9 + y;
					const targetIndex = (scene * 81 + y * 9 + x) * channels.length + channelOrdinal;
					values[targetIndex] = bytes.readDoubleLE(sourceIndex * 8);
				}
	}
	return {
		configId: `${loaded.caseId}/${representation}/q${viewCount}/${solar}/n${order}`,
		quantity: 'radiance',
		units: RADIANCE_UNITS,
		sourceIdentity: sealIdentity,
		times,
		channels,
		rayIndices: ALL_RAYS,
		values,
	};
}

/** Compare a baseline reproduction to the retained CPU evaluation of exactly the same field representation.
 * @param {DialAnalysisBoundary} actual @param {boolean} [native51] @returns {DialParityResult}
 */
export function baselineParity(actual, native51 = false) {
	const file = `${inputRun}/native${native51 ? 51 : 48}-cpu.tsv`;
	const source = parseBoundaryTsv(readRepository(file).toString(), {
		modelId: native51 ? 'native51-cpu-q30' : 'production',
		configId: native51 ? 'native51-old-cpu' : 'native48-old-cpu',
		sourceIdentity: identity(file),
	});
	const expected = selectBoundary(source, actual);
	let maximumAbsoluteError = 0,
		squaredError = 0,
		failures = 0;
	for (let index = 0; index < actual.values.length; index++) {
		const difference = Math.abs(actual.values[index] - expected.values[index]);
		maximumAbsoluteError = Math.max(maximumAbsoluteError, difference);
		squaredError += difference * difference;
		if (difference > 1e-8 + 1e-5 * Math.abs(expected.values[index])) failures++;
	}
	return {
		count: actual.values.length,
		maximumAbsoluteError,
		rmsDifference: Math.sqrt(squaredError / actual.values.length),
		failures,
		passed: failures === 0,
		tolerance: 'abs(new-oldCPU) <= 1e-8 + 1e-5*abs(oldCPU)',
		expectedIdentity: source.sourceIdentity,
	};
}

/** Build compact score rows for all representations, views and four cumulative orders in one run.
 * @param {string} runPath @returns {DialRunScores}
 */
export function runScores(runPath) {
	const loaded = loadSpectra(runPath),
		control = loaded.control;
	const measured = measurements();
	const rows = [];
	for (const representation of control.controls.representations)
		for (const q of control.controls.viewIntervals)
			for (const solar of control.controls.solarInterpolations)
				for (let order = 1; order <= 4; order++) {
					const model = extractBoundary(loaded, representation, q, solar, order);
					const channels = model.channels.filter((channel) => channel <= 30);
					rows.push({
						representation,
						q,
						solar,
						order,
						configId: model.configId,
						score: scoreBoundary(model, measured, channels),
					});
				}
	return {
		run: runPath,
		seal: identity(`${runPath}/sealed.json`),
		fullRegisteredBoundary: rows[0].score.fullRegisteredBoundary,
		rows,
	};
}
