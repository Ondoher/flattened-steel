import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readRepository, verifyRun} from '../../io/files.mjs';
import {spectra, summarize} from '../reference-comparison/analysis.mjs';

/** Authenticate retained benchmark spectra and prior geometry without new transport.
 * @returns {{rows:SkyReferenceRow[], parents:DialFileIdentity[], direct:unknown[], checks:object}}
 */
export function inputs() {
	const root = 'tmp/experiments/sky-accuracy-dials/runs/';
	const match = verifyRun(root + '00231-reference-match');
	assert.equal(match.sha256, 'eec39850444983bbde01e0df8848d34749de7e01f7f41082b1ffd2299ed12aec');
	const terminal = JSON.parse(readRepository(match.path, match).toString());
	/** @type {DialFileIdentity[]} */ const parents = [match];
	/** @param {string} suffix */ const parent = (suffix) => {
		const ids = terminal.recipe.parents.filter((p) => p.path.endsWith(suffix));
		assert.equal(ids.length, 1);
		const id = ids[0];
		parents.push(id);
		return readRepository(id.path, id).toString();
	};
	const analysisId = terminal.artifacts.find((a) => a.path.endsWith('/analysis.json.gz'));
	assert.ok(analysisId);
	parents.push(analysisId);
	const previous = JSON.parse(gunzipSync(readRepository(analysisId.path, analysisId)).toString());
	const control = spectra(parent('/00000-inputs/native48-gpu.tsv'), true),
		published = spectra(parent('/gpu/algorithm32-paper-proposed.tsv'), true),
		reference = spectra(parent('/published-models.tsv'), true),
		measured = spectra(parent('/measurement-boundary.tsv'), false);
	assert.equal(control.size, 1377);
	assert.equal(published.size, 1377);
	assert.equal(reference.size, 9 * 1377);
	assert.equal(measured.size, 1377);
	/** @type {SkyReferenceRow[]} */ const rows = previous.directional.map((r) => {
		const key = `${r.time}|${r.x}|${r.y}`,
			models = {
				control: control.get('proposed|' + key),
				published: published.get('proposed|' + key),
				bruneton: reference.get('bruneton|' + key),
				libradtran: reference.get('libradtran|' + key),
			};
		assert.ok(measured.has(key) && Object.values(models).every(Boolean));
		assert.deepEqual(models.bruneton, reference.get('elek|' + key));
		return {
			time: r.time,
			x: r.x,
			y: r.y,
			elevation: r.elevation,
			separation: r.separation,
			measured: measured.get(key),
			models,
		};
	});
	assert.equal(new Set(rows.map((r) => `${r.time}|${r.x}|${r.y}`)).size, 1377);
	// Canonical rings must really share elevation, not merely have similar labels.
	for (let ring = 0; ring <= 4; ring++) {
		const a = rows.filter((r) => Math.max(Math.abs(r.x - 4), Math.abs(r.y - 4)) === ring).map((r) => r.elevation);
		assert.ok(Math.max(...a) - Math.min(...a) < 2e-6);
	}
	const scores = summarize(
		rows,
		Array.from({length: 31}, (_, i) => i),
	);
	assert.ok(Math.abs(scores.models.bruneton.rmseMw - 11.28323859) < 1e-7);
	assert.ok(Math.abs(scores.models.libradtran.rmseMw - 11.48054694) < 1e-7);
	const direct = [];
	for (const [run, hash] of [
		['00230-direct-converge', 'f7e9dca4f8efe52f4cb236124e8b7149c903ff877a7f061d42be62e5cd402acb'],
		['00232-alternate-rays', '4ee0ad742f4e37b04983ba8177eb45bbe3f4cb5073d9a647b48b464dbde9def8'],
	]) {
		const seal = verifyRun(root + run);
		assert.equal(seal.sha256, hash);
		parents.push(seal);
		const record = JSON.parse(readRepository(seal.path, seal).toString());
		assert.equal(record.state, 'accepted');
		const get = (suffix) => {
			const id = record.artifacts.find((a) => a.path.endsWith('/' + suffix));
			assert.ok(id);
			parents.push(id);
			return readRepository(id.path, id);
		};
		const result = JSON.parse(gunzipSync(get('results.json.gz')).toString()),
			input = JSON.parse(get('inputs.json').toString());
		assert.equal(result.failure, null);
		for (const d of result.rows) {
			const ray = input.rays.find((r) => r.id === d.ray);
			assert.ok(ray);
			const bits = d.ray.split('-'),
				x = ray.x ?? Number(bits.at(-2)),
				y = ray.y ?? Number(bits.at(-1));
			const r = rows.find((r) => r.time === ray.time && r.x === x && r.y === y);
			assert.ok(r);
			assert.ok(Math.abs(r.measured[d.channel] - d.measured) < 1e-14);
			direct.push({
				run,
				ray: d.ray,
				time: r.time,
				x,
				y,
				channel: d.channel,
				elevation: r.elevation,
				separation: r.separation,
				residualMw: 1000 * (d.total.mean - d.measured),
				halfWidthMw: 1000 * d.total.halfWidth95,
				modelResidualsMw: Object.fromEntries(
					Object.entries(r.models).map(([name, values]) => [name, 1000 * (values[d.channel] - d.measured)]),
				),
			});
		}
	}
	assert.equal(direct.length, 50);
	return {rows, parents, direct, checks: {rays: rows.length, directScalars: direct.length, scores}};
}
