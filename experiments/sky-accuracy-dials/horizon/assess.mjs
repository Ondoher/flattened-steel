import assert from 'node:assert/strict';
import {createRun, identity, readRepository, verifyRun, storage} from '../io/files.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

/** Validate paired stage evidence and retain quantitative attribution without changing rendering.
 * @returns {void} Seals the small assessment or preserves a failed outcome.
 */
function main() {
	const paired = process.argv[2], reference = process.argv[3];
	assert.ok(paired && reference, 'Explicit sealed paired and species runs required.');
	const parents = [verifyRun(paired), verifyRun(reference), identity(`${reference}/reference.json`), identity('experiments/sky-accuracy-dials/horizon/assess.mjs')];
	const local = JSON.parse(readRepository(`${paired}/local-observation.json`).toString('utf8'));
	const distant = JSON.parse(readRepository(`${paired}/distant-observation.json`).toString('utf8'));
	const numerical = JSON.parse(readRepository(`${reference}/reference.json`).toString('utf8'));
	parents.push(identity(`${paired}/local-observation.json`), identity(`${paired}/distant-observation.json`));
	const run = createRun('horizon-assess', {parents, operation: 'Validate sky-only stages, installed display equation, reference convergence and fixed-extinction species additivity; report signed numerical and display effects.', parameters: {maximumEvidenceBytes: 1048576}});
	try {
		const color = new ColorResetSlope078P2ColorDisplayModel();
		const modes = [];
		const excluded = [];
		let maximumDisplayError = 0;
		for (const [name, data] of [['distant', distant], ['local', local]]) {
			assert.equal(data.facts.glError, 0);
			assert.equal(data.rays.length, 18);
			assert.equal(data.facts.state.locationLabel, 'San Jose');
			const rows = [];
			for (const ray of data.rays) {
				assert.equal(ray.stages.length, 13);
				assert.ok(ray.stages.flat().every(Number.isFinite));
				if (ray.stages[4][0] !== 0) {excluded.push({mode: name, uv: ray.uv, reason: 'Scene hit mask: ground/object ray excluded from sky attribution.'}); continue;}
				const raw = ray.stages[1].slice(0, 3), displayed = ray.stages[0].slice(0, 3);
	const expected = color.linearSrgbToDisplayRgb(/** @type {HorizonLinearRgb} */ (raw), {value: ray.stages[4][3], units: 'lux'});
				maximumDisplayError = Math.max(maximumDisplayError, ...displayed.map((value, channel) => Math.abs(value - expected[channel])));
				const spectral = ray.stages.slice(5, 9).flat().slice(0, 15), transmission = ray.stages.slice(9, 13).flat().slice(0, 15);
				assert.ok(spectral.every((value) => value >= 0) && spectral.some((value) => value > 0));
				assert.ok(transmission.every((value) => value >= 0 && value <= 1));
				rows.push({uv: ray.uv, nominalElevationDegrees: ray.elevationDegrees,
					physicalElevationDegrees: Math.asin(ray.stages[3][2]) * 180 / Math.PI,
					raw, displayed, rawChannelSpread: (Math.max(...raw) - Math.min(...raw)) / Math.max(...raw),
					displayChannelSpread: (Math.max(...displayed) - Math.min(...displayed)) / Math.max(...displayed),
					maximumCompositionDifference: Math.max(...raw.map((value, channel) => Math.abs(value - ray.stages[2][channel])))});
			}
			modes.push({name, rows});
		}
		assert.ok(maximumDisplayError < 0.0001, 'Readback does not match installed display equation.');
		const referenceRows = numerical.rows.map((row) => {
			assert.ok(row.maximumRefinementRelative < 0.0001 && row.components.maximumAdditiveRelative < 1e-10);
			return {elevationDegrees: row.elevationDegrees, cachedRgb: row.cachedRgb, referenceRgb: row.referenceRgb,
				maximumSpectralRelativeError: Math.max(...row.signedDifference.map((value, channel) => Math.abs(value) / row.high[channel])),
				maximumRgbRelativeError: Math.max(...row.referenceRgb.map((value, channel) => Math.abs(row.cachedRgb[channel] - value) / Math.abs(value))),
				rayleighRgb: row.components.rayleighRgb, mieRgb: row.components.mieRgb, displayInteraction: row.components.displayInteraction,
				maximumRefinementRelative: row.maximumRefinementRelative, maximumAdditiveRelative: row.components.maximumAdditiveRelative};
		});
		assert.equal(referenceRows.length, 6);
		const summary = {modes, excluded, referenceRows, maximumDisplayError,
			maximumReferenceRefinementRelative: Math.max(...referenceRows.map((row) => row.maximumRefinementRelative)),
			maximumCacheSpectralRelativeError: Math.max(...referenceRows.map((row) => row.maximumSpectralRelativeError)),
			maximumCacheRgbRelativeError: Math.max(...referenceRows.map((row) => row.maximumRgbRelativeError)),
			storage: storage(), limitations: ['Current default camera, not screenshot pixel registration.', 'Continuous reference covers six local N1 center rays only; distant N4 numerical adequacy is untested.', 'Channel spread is a descriptive RGB measure, not perceptual color difference.', 'Species isolation retains combined extinction and does not simulate removing an aerosol.', 'No physical input fit, production fix or orange-horizon qualification.']};
		run.write('assessment.json', summary);
		run.finish('accepted', {skyRays: modes.reduce((count, mode) => count + mode.rows.length, 0), excluded: excluded.length, referenceRays: 6, maximumDisplayError});
		verifyRun(run.path);
		console.log(JSON.stringify({run: run.path, maximumDisplayError, maximumCacheSpectralRelativeError: summary.maximumCacheSpectralRelativeError, maximumCacheRgbRelativeError: summary.maximumCacheRgbRelativeError}));
	} catch (error) {run.finish('failed', {error: String(error)}); throw error;}
}

main();
