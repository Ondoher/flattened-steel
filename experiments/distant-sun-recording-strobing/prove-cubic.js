import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {StrobingRun} from './StrobingRun.js';
import {StrobingCubicPatch} from './StrobingCubicPatch.js';
import {StrobingHermite} from './creative/StrobingHermite.js';

const candidateId = process.argv[2];
if (!/^\d{5}-[a-z][a-z0-9-]{0,15}$/u.test(candidateId ?? '')) throw new Error('Supply a sealed candidate package run.');
const run = await StrobingRun.allocate('cubic-proof');
try {
	const parentRoot = await StrobingRun.checkedPath(
		StrobingRun.repositoryRoot,
		`${StrobingRun.outputRelative}/runs/${candidateId}`,
	);
	const manifest = /** @type {StrobingParentManifest} */ (
		await StrobingRun.readJson(parentRoot, 'artifact-manifest.json')
	);
	if (
		manifest.state !== 'accepted' ||
		(await StrobingRun.inventory(parentRoot, manifest.excludedPaths)).artifactSetSha256 !==
			manifest.artifactSetSha256
	)
		throw new Error('Candidate package did not authenticate.');
	const packageRoot = await StrobingRun.checkedPath(parentRoot, 'candidate');
	const report = /** @type {DistantSunSharedCachePackageSetReport} */ (
		await StrobingRun.readJson(packageRoot, 'package-set.json')
	);
	const catalog = /** @type {DistantSunSharedCacheRuntimeCatalog} */ (
		await StrobingRun.readJson(packageRoot, report.runtimeCatalog.path)
	);
	const scenes = [];
	for (const entry of catalog.scenes)
		scenes.push(
			/** @type {DistantSunSharedCacheSceneManifest} */ (
				await StrobingRun.readJson(packageRoot, entry.manifest.path)
			),
		);
	const globalCoordinates = new Set(
		scenes.flatMap((scene) => scene.coordinates.map((coordinate) => coordinate.join(','))),
	);
	const support = scenes.map((scene, ordinal) => {
		const neighbors = scenes.slice(Math.max(0, ordinal - 2), ordinal + 3);
		const blocks = new Set(neighbors.flatMap((neighbor) => neighbor.requiredBlockIds));
		const coordinates = new Set(
			neighbors.flatMap((neighbor) => neighbor.coordinates.map((coordinate) => coordinate.join(','))),
		);
		let missingResident = 0,
			oneSidedGlobalBoundary = 0;
		for (const [altitude, zenith] of scene.coordinates)
			for (const offset of [-1, 1]) {
				const key = `${altitude},${Math.min(179, Math.max(0, zenith + offset))}`;
				if (!coordinates.has(key)) {
					if (globalCoordinates.has(key)) missingResident += 1;
					else oneSidedGlobalBoundary += 1;
				}
			}
		return {ordinal, requiredBlocks: blocks.size, missingResident, oneSidedGlobalBoundary};
	});
	if (support.some((scene) => scene.requiredBlocks > 24 || scene.missingResident))
		throw new Error('Cubic support or capacity proof failed.');
	// Evaluate the exact authored GLSL scalar equation as JavaScript over retained physical knots.
	const helpers = StrobingCubicPatch.helpers();
	const slope = helpers.match(/float strobingSlope\(float left, float right\) \{([\s\S]*?)\n\}/u)?.[1];
	const formula = helpers.match(/return \(2\.0\*t3[\s\S]*?\*m1;/u)?.[0];
	if (!slope || !formula) throw new Error('Authored cubic equation anchors changed.');
	const equation = `(function(a,b,c,d,t){function strobingSlope(left,right){${slope}} const t2=t*t,t3=t2*t,m0=strobingSlope(b-a,c-b),m1=strobingSlope(c-b,d-c);${formula}})`;
	const interpolate = /** @type {(a:number,b:number,c:number,d:number,t:number)=>number} */ (
		vm.runInNewContext(equation, Object.create(null), {timeout: 1000})
	);
	const fieldRoot = await StrobingRun.checkedPath(
		StrobingRun.repositoryRoot,
		`${StrobingRun.outputRelative}/runs/00012-field-compile`,
	);
	const field = /** @type {{rows: {altitude:number, zenithDegrees:number, meanDirections:number}[]}} */ (
		await StrobingRun.readJson(fieldRoot, 'field.json')
	);
	let intervals = 0,
		maxEndpointError = 0,
		maxSlopeMismatch = 0;
	for (let altitude = 0; altitude <= 8; altitude++) {
		const values = field.rows
			.filter((row) => row.altitude === altitude)
			.sort((a, b) => a.zenithDegrees - b.zenithDegrees)
			.map((row) => row.meanDirections);
		for (let index = 1; index < values.length - 3; index++) {
			const [a, b, c, d, e] = values.slice(index - 1, index + 4);
			const at = (t) => interpolate(a, b, c, d, t);
			maxEndpointError = Math.max(maxEndpointError, Math.abs(at(0) - b), Math.abs(at(1) - c));
			const epsilon = 1e-5;
			maxSlopeMismatch = Math.max(
				maxSlopeMismatch,
				Math.abs((at(1) - at(1 - epsilon)) / epsilon - (interpolate(b, c, d, e, epsilon) - c) / epsilon),
			);
			let previous = b;
			for (let step = 1; step <= 100; step++) {
				const value = at(step / 100),
					tolerance = Math.max(Math.abs(b), Math.abs(c)) * 1e-12;
				if (Math.abs(value - StrobingHermite.value(a, b, c, d, step / 100)) > tolerance)
					throw new Error('Physical-light cubic differs from the qualified field equation.');
				if (
					value < Math.min(b, c) - tolerance ||
					value > Math.max(b, c) + tolerance ||
					(value - previous) * (c - b) < -tolerance * Math.abs(c - b)
				)
					throw new Error('Cubic interpolation overshoots or reverses a sampled monotone interval.');
				previous = value;
			}
			intervals++;
		}
	}
	if (maxEndpointError !== 0 || maxSlopeMismatch > 1e-10) throw new Error('Endpoint or shared-tangent proof failed.');
	const patch = StrobingCubicPatch.apply(
		await readFile(await StrobingRun.checkedPath(StrobingRun.repositoryRoot, 'dist/flat32/flat32.js'), 'utf8'),
	);
	if (!patch.source.includes('const required = window.ids;')) throw new Error('Cubic support is discardable.');
	await run.writeJson('proof.json', {
		support,
		maximumResidentBlocks: Math.max(...support.map((scene) => scene.requiredBlocks)),
		atlasLayers: 24,
		maximumAtlasCount: 2,
		maximumPacketGpuBytes: 859963392,
		intervals,
		maxEndpointError,
		maxSlopeMismatch,
		sampledMonotonicityPass: true,
		physicalLightEquationMatches: true,
		equation,
		scope: 'All scene support; retained channel-6 direction-mean physical knots, altitudes 0-8, zenith 65.5-85.5.',
	});
	await run.writeJson('provenance.json', {
		operation:
			'Authenticate corrected package; independently enumerate cubic support; evaluate authored Hermite equation at endpoints, knot tangents, and 100 points per physical interval.',
		parents: [
			{
				root: path.relative(StrobingRun.repositoryRoot, parentRoot),
				manifest: await StrobingRun.identity(parentRoot, 'artifact-manifest.json'),
			},
			{
				root: path.relative(StrobingRun.repositoryRoot, fieldRoot),
				field: await StrobingRun.identity(fieldRoot, 'field.json'),
			},
		],
		implementation: await StrobingRun.inventory(
			path.join(StrobingRun.repositoryRoot, 'experiments/distant-sun-recording-strobing'),
			['node_modules'],
		),
		node: process.version,
	});
	await run.finish('accepted', {
		purpose: 'cubic-support-and-interpolation-proof',
		sceneCount: scenes.length,
		intervals,
		maximumResidentBlocks: Math.max(...support.map((scene) => scene.requiredBlocks)),
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
