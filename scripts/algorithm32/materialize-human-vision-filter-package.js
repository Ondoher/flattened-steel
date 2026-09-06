import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = {
	path: 'experiments/extraterrestrial/color-reset/fixtures/cie/CIE_sle_scotopic.csv',
	sha256: '6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759',
};
const outputRoot = path.join(repositoryRoot, 'server/flat32/data/human-vision-filter-package-v1');

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function efficiencyAt(rows, wavelength) {
	if (wavelength < 380 || wavelength > 780) return 0;
	if (wavelength === 780) return rows.at(-1).efficiency;
	const lower = Math.floor(wavelength);
	const ratio = wavelength - lower;
	return rows[lower - 380].efficiency * (1 - ratio) + rows[lower + 1 - 380].efficiency * ratio;
}

function integrate(rows, lower, upper) {
	const knots = [lower];
	for (let wavelength = Math.ceil(lower); wavelength < upper; wavelength += 1) knots.push(wavelength);
	knots.push(upper);
	let sum = 0;
	for (let index = 1; index < knots.length; index += 1) {
		const left = knots[index - 1];
		const right = knots[index];
		sum += ((right - left) * (efficiencyAt(rows, left) + efficiencyAt(rows, right))) / 2;
	}
	return sum;
}

const sourceBytes = await readFile(path.join(repositoryRoot, source.path));
if (sha256(sourceBytes) !== source.sha256) throw new Error('P7 CIE scotopic source hash mismatch.');
const rows = sourceBytes
	.toString('utf8')
	.trim()
	.split(/\r?\n/u)
	.map((line) => {
		const [wavelength, efficiency] = line.split(',').map(Number);
		return {wavelength, efficiency};
	});
if (rows.length !== 401 || rows[0].wavelength !== 380 || rows.at(-1).wavelength !== 780) {
	throw new Error('P7 CIE scotopic source grid changed.');
}
const binWidth = (830 - 360) / 15;
const values = Array.from({length: 15}, (_, index) => {
	const lower = 360 + index * binWidth;
	return 1700 * integrate(rows, lower, lower + binWidth);
});
const artifactBytes = Buffer.from(`${JSON.stringify({values})}\n`, 'utf8');
const artifactSha256 = sha256(artifactBytes);
await mkdir(outputRoot, {recursive: true});
await writeFile(path.join(outputRoot, 'native15-scotopic-weights.json'), artifactBytes, {flag: 'wx'});
const manifest = {
	schemaId: 'algorithm32-production-human-vision-filter-package-v1',
	packageId: 'human-vision-filter-package-v1',
	parents: {
		sourcePath: source.path,
		sourceSha256: source.sha256,
		containedRunId: '000054-cr6e-toggleable-mesopic-stellar-luminance',
	},
	derivation: {
		operation: '1700-times-piecewise-linear-integral-per-native15-bin',
		lowerNanometers: 360,
		upperNanometers: 830,
		binCount: 15,
	},
	artifact: {path: 'native15-scotopic-weights.json', byteLength: artifactBytes.byteLength, sha256: artifactSha256},
	redistribution: 'local-only-pending-cie-license-and-source-clearance',
};
await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, {flag: 'wx'});
console.log(JSON.stringify({outputRoot, artifact: manifest.artifact}, null, 2));
