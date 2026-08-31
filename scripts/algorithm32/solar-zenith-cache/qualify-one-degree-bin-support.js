import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import DistantSunSceneCacheLedger from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheLedger.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
} from '../../../src/algorithm32/sampling-domains/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/native-15/native-15-profile.js';

function argument(name) {
	const index = process.argv.indexOf(name);
	if (index < 0 || index + 1 >= process.argv.length) throw new Error(`${name} is required.`);
	return process.argv[index + 1];
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function scene(degrees) {
	const radians = (degrees * Math.PI) / 180;
	return {
		sceneSun: {
			id: `qualification-solar-zenith-${degrees}`,
			instant: '2000-01-01T12:00:00.000Z',
			directionToSourceUpEastNorth: [Math.cos(radians), -Math.sin(radians), 0],
			sourceIdentity: 'algorithm32-native-distant-collimated-sun-v1',
		},
		support: {
			id: 'san-jose-fixed-observer-complete-rotation-v1',
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
			observerAltitude: {value: 1.7, units: 'meters'},
			observerSolarZenith: {value: radians, units: 'radians'},
			completeCameraRotation: true,
			arbitraryShortenedEndpoint: true,
		},
	};
}

function ledgerFor(degrees) {
	return new DistantSunSceneCacheLedger({
		...scene(degrees),
		positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
		solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
		outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
}

async function ordinaryFile(file, label) {
	const facts = await lstat(file);
	if (facts.isSymbolicLink()) throw new Error(`${label} must not be a symlink or junction.`);
	const resolved = await realpath(file);
	if (!(await stat(resolved)).isFile()) throw new Error(`${label} must be a file.`);
	return resolved;
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const indexPath = await ordinaryFile(path.resolve(argument('--inventory-index')), 'Inventory index');
const outputDirectory = path.resolve(argument('--output'));
if (!outputDirectory.startsWith(`${evidenceRoot}${path.sep}`)) {
	throw new Error('Bin-support qualification output must remain under tmp/extraterrestrial.');
}
try {
	await stat(outputDirectory);
	throw new Error('Bin-support qualification output already exists; evidence is immutable.');
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
await mkdir(outputDirectory);
if ((await realpath(outputDirectory)) !== outputDirectory) throw new Error('Qualification output must resolve exactly.');

const indexBytes = await readFile(indexPath);
const inventory = JSON.parse(indexBytes.toString('utf8'));
const failures = [];
const bins = [];
for (const entry of inventory.packages) {
	const manifest = JSON.parse(await readFile(await ordinaryFile(path.join(entry.path, entry.manifestPath), entry.id), 'utf8'));
	const center = JSON.parse(await readFile(await ordinaryFile(path.join(entry.path, manifest.ledgerPath), entry.id), 'utf8'));
	const degrees = entry.solarZenithDegrees;
	const minimumInputDegrees = Math.max(0, degrees - 0.5);
	const maximumInputExclusiveDegrees = degrees === 108 ? 108.5 : degrees + 0.5;
	const edgeLedgers = [
		{label: 'lower-inclusive', degrees: minimumInputDegrees, ledger: ledgerFor(minimumInputDegrees)},
		{
			label: 'upper-exclusive-limit',
			degrees: maximumInputExclusiveDegrees - 1e-9,
			ledger: ledgerFor(maximumInputExclusiveDegrees - 1e-9),
		},
	];
	let missingRowCount = 0;
	for (const edge of edgeLedgers) {
		for (let altitudeIndex = 0; altitudeIndex < center.rows.length; altitudeIndex += 1) {
			const available = center.rows[altitudeIndex];
			const required = edge.ledger.rows[altitudeIndex];
			if (
				available.firstSolarZenithIndex > required.firstSolarZenithIndex ||
				available.lastSolarZenithIndex < required.lastSolarZenithIndex
			) {
				missingRowCount += 1;
				failures.push({
					centerDegrees: degrees,
					edge: edge.label,
					edgeDegrees: edge.degrees,
					altitudeIndex,
					available: [available.firstSolarZenithIndex, available.lastSolarZenithIndex],
					required: [required.firstSolarZenithIndex, required.lastSolarZenithIndex],
				});
			}
		}
	}
	bins.push({
		representativeSolarZenithDegrees: degrees,
		minimumInputDegrees,
		maximumInputExclusiveDegrees,
		missingRowCount,
	});
}

const report = {
	schemaId: 'algorithm32-distant-sun-one-degree-bin-support-qualification-v1',
	accepted: failures.length === 0,
	inventoryIndexSha256: sha256(indexBytes),
	binPolicy: 'nearest-integer-half-up-v1',
	qualifiedInputRangeDegrees: [0, 108.5],
	darkFromSolarZenithDegrees: 108.5,
	binCount: bins.length,
	missingRowCount: failures.length,
	bins,
	failures,
	derivation: {
		operation: 'compare every emitted center ledger against both limiting scene-support ledgers for its half-open nearest-degree bin',
		implementation: 'scripts/algorithm32/solar-zenith-cache/qualify-one-degree-bin-support.js',
	},
};
await writeFile(path.join(outputDirectory, 'qualification-report.json'), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({accepted: report.accepted, binCount: bins.length, missingRowCount: failures.length})}\n`);
if (!report.accepted) process.exitCode = 1;
