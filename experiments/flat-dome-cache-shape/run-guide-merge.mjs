import assert from 'node:assert/strict';
import {createRun, identity} from './io.mjs';
import {acceptedRuns, readEvidence, runsRoot} from './evidence.mjs';

const baseline = `${runsRoot}/00032-m3-guide-recover`;
const correction = acceptedRuns('m3-lib-away').at(-1);
assert.ok(correction, 'Complete the direction-corrected native away-ray subset first.');
const run = createRun(
	'm3-guide-merged',
	[baseline, correction].map((p) => identity(`${p}/manifest.json`)),
);
try {
	const replacements = new Map(readEvidence(`${correction}/readings.json`).map((row) => [row.id, row]));
	assert.equal(replacements.size, 189);
	const readings = readEvidence(`${baseline}/readings.json`).map((row) => {
		if (row.id.endsWith('-away-low')) {
			const replacement = replacements.get(row.id);
			assert.ok(replacement && Math.abs(replacement.actualRelativeViewAzimuthDegrees - 180) < 1e-5);
			return {
				...replacement,
				correctionRun: correction,
				supersedes: {
					run: baseline,
					id: row.id,
					reason: 'Original away-ray guide used a sunward native azimuth; reuse only the newly solved180-degree case.',
				},
			};
		}
		return {...row, originalRun: baseline};
	});
	assert.equal(readings.length, 567);
	run.write('readings.json', readings);
	run.finish('accepted', {
		message:
			'Complete actual native guide matrix merged from authenticated original sunward/zenith cases and189 corrected away-azimuth solves; superseded guide error explicitly retained.',
		corrected: replacements.size,
	});
	console.log(run.root);
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack});
	run.finish('failed', {message: String(error)});
	throw error;
}
