import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {apex, diskRadius, centerZ, sphereRadius, capHeight, clearance, radiusAt, interval} from './geometry.mjs';
import {createRun, identity, repository} from './io.mjs';

const parents = [
	identity('experiments/sky-accuracy-dials/horizon-reference/gpu.mjs'),
	identity('experiments/sky-accuracy-dials/continuation/direct-solver/math.mjs'),
	identity('scripts/libradtran/installation.json'),
	identity('scripts/libradtran/README.md'),
	identity('src/algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js'),
	identity('agents/topics/poc-experiments/engineering-studies/cache-design.md'),
];
const run = createRun('m1-boundary', parents);
/** @type {DomeProofCheck[]} */
const checks = [];

/**
 * Records a checked numeric physical identity.
 *
 * @param {string} name - Analytic identity or physical invariant.
 * @param {number} actual - Measured value.
 * @param {number} expected - Independently known result.
 * @param {number} tolerance - Declared absolute numeric tolerance.
 */
function near(name, actual, expected, tolerance) {
	const error = Math.abs(actual - expected);
	checks.push({name, actual, expected, error, tolerance});
	assert.ok(error <= tolerance, `${name}: ${actual} != ${expected}; error ${error}`);
}

/**
 * Captures one read-only external process without changing its working directory.
 *
 * @param {string} executable - Installed executable.
 * @param {string[]} args - Argument array, without shell composition.
 * @returns {Promise<DomeProcessResult>} - Captured process output and status.
 */
function capture(executable, args) {
	return new Promise((resolve) => {
		const child = spawn(executable, args, {cwd: run.root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (bytes) => {
			stdout += bytes.toString();
		});
		child.stderr.on('data', (bytes) => {
			stderr += bytes.toString();
		});
		child.on('error', (error) => resolve({code: null, stdout, stderr, error: String(error)}));
		child.on('close', (code) => resolve({code, stdout, stderr}));
	});
}

try {
	run.write('physical-input.json', {
		geometry: {
			frame: 'fixed-north-pole-aeqd-z-up',
			diskRadius: {value: diskRadius, units: 'meters'},
			apex: {value: apex, units: 'meters'},
			centerZ,
			sphereRadius,
		},
		derivation: 'Recovered shallow-cap profile; radius=(pi*6371.0088)*1000; centerZ=(H^2-R^2)/(2H).',
		coordinate:
			'Shortest Euclidean distance to finite curved cap for interior samples; exterior classified independently.',
		distribution: 'd_i=(H-z)*(i/(N-1))^2; retain only reachable values and add counted valid-row boundary support.',
		counts: [2, 4, 8, 16, 32, 64],
		referenceScope: 'Boundary and coordinate proof only; not a scattering accuracy result.',
	});
	near('center cap height', capHeight(0), apex, 1e-9);
	near('rim cap height', capHeight(diskRadius), 0, 0);
	near('axis-to-cap Euclidean distance', clearance([0, 0, 2000]), apex - 2000, 1e-8);
	near('outward ray at apex has zero atmosphere', interval([0, 0, apex], [0, 0, 1]).exit, 0, 1e-8);
	near('inward ray at apex reaches ground', interval([0, 0, apex], [0, 0, -1]).exit, apex, 1e-6);
	near('outward ray at rim has zero atmosphere', interval([diskRadius, 0, 0], [1, 0, 0]).exit, 0, 0);
	near('inward ray along ground spans disk', interval([diskRadius, 0, 0], [-1, 0, 0]).exit, 2 * diskRadius, 1e-6);
	near('elevated rim outward ray is vacuum', interval([diskRadius, 0, 2], [1, 0, 0]).exit, 0, 0);
	const outside = interval([0, 0, apex + 500], [0, 0, -1]);
	near('outside observer enters at cap', outside.entry, 500, 1e-6);
	near('outside observer reaches finite ground', outside.exit, apex + 500, 1e-6);
	const elevatedRim = interval([diskRadius, 0, 2], [-1, 0, 0]);
	assert.ok(elevatedRim.entry > 0 && elevatedRim.exit > elevatedRim.entry);
	const coordinateErrors = [];
	for (const z of [0, 2, 100, 1000, 5000, 10000, 20000, 40000, 99000]) {
		for (const fraction of [0, 0.001, 0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.99, 1]) {
			const distance = (apex - z) * fraction;
			const r = radiusAt(z, distance);
			const observed = clearance([r, 0, z]);
			coordinateErrors.push(Math.abs(observed - distance));
			near(`clearance roundtrip z=${z},fraction=${fraction}`, observed, distance, 1e-7);
			near(`cap contains sample z=${z},fraction=${fraction}`, Math.min(capHeight(r) - z, 0), 0, 1e-7);
		}
	}
	run.write('coordinate-proof.json', {
		checks,
		maximumRoundtripErrorMeters: Math.max(...coordinateErrors),
		elevatedRim,
		reflection:
			'The two distances fix map radius and Sun radius up to y reflection; directional y must also reflect.',
	});
	run.progress('boundary', `${checks.length} analytic and coordinate checks passed.`);
	const rows = [];
	const a = diskRadius * 0.5;
	for (const z of [2, 1000, 10000, 40000]) {
		const maximumRadius = radiusAt(z, 0);
		for (const beta of [0, 0.03, 0.2, 0.5, 0.77, 0.97, 1]) {
			const rho = Math.max(0, a - maximumRadius) + beta * (a + maximumRadius - Math.max(0, a - maximumRadius));
			const rmin = Math.abs(a - rho);
			const rmax = Math.min(maximumRadius, a + rho);
			const low = Math.max(0, clearance([rmax, 0, z]));
			const high = Math.max(low, clearance([rmin, 0, z]));
			for (const count of [2, 4, 8, 16, 32, 64]) {
				const nominal = Array.from({length: count}, (_, i) => (apex - z) * (i / (count - 1)) ** 2);
				const retained = nominal.filter((d) => d >= low && d <= high);
				const effective = [...new Set([...retained, low, high])].sort((x, y) => x - y);
				for (const fraction of [0, 0.137, 0.43, 0.861, 1]) {
					const d = low + fraction * (high - low);
					assert.ok(effective[0] <= d + 1e-8 && effective.at(-1) >= d - 1e-8);
				}
				rows.push({
					z,
					beta,
					rho,
					count,
					low,
					high,
					nominalRetained: retained.length,
					effective: effective.length,
					supportAdded: effective.length - retained.length,
				});
			}
		}
	}
	run.write('row-support.json', {
		policy: 'Retain nominal globally quadratic nodes within each valid row and add deduplicated low/high boundary nodes. Count all support storage.',
		rows,
	});
	run.progress('support', 'Coarse and fine slice rows have explicitly counted endpoint support.');
	const installation = JSON.parse(
		readFileSync(path.join(repository, 'scripts/libradtran/installation.json'), 'utf8'),
	);
	const version = await capture(installation.wslExecutable, [
		'-d',
		installation.distribution,
		'-u',
		installation.user,
		'--exec',
		installation.executable,
		'-v',
	]);
	run.write('libradtran-version.json', version);
	if (version.code === 0) {
		const help = await capture(installation.wslExecutable, [
			'-d',
			installation.distribution,
			'-u',
			installation.user,
			'--exec',
			installation.executable,
			'-h',
		]);
		run.write('libradtran-help.txt', help.stdout + '\n' + help.stderr);
	}
	run.write(
		'm1-report.md',
		`# M1 geometry slice\n\n${checks.length} checks passed. Maximum clearance roundtrip error: ${Math.max(...coordinateErrors)} meters. ${rows.length} slice-row cases checked.\n\nAdditional row endpoints are needed for coverage, including at coarse counts; they must be included in storage and build measurements. This is geometry evidence, not cache accuracy.\n\nlibRadtran version capture: code=${version.code}; error=${version.error ?? 'none'}. Exact dome/source compatibility remains to be established.\n`,
	);
	run.finish('accepted', {
		message:
			'Physical coordinate and endpoint-support proof passed; solver capability capture is separately scoped.',
		checks: checks.length,
		supportCases: rows.length,
		versionAvailable: version.code === 0,
	});
	console.log(
		JSON.stringify({
			run: run.root,
			checks: checks.length,
			maximumCoordinateError: Math.max(...coordinateErrors),
			version,
		}),
	);
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack, checks});
	run.finish('failed', {message: String(error)});
	throw error;
}
