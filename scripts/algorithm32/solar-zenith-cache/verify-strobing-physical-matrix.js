import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import Compiler from './DistantSunSceneCacheOfflineCompiler.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';
import {createP2PhysicalMatrix} from './DistantSunP2PhysicalMatrix.js';

const argumentsList = process.argv.slice(2),
	screen = argumentsList.includes('--screen');
const jobArgument = argumentsList.find((value) => value.startsWith('--jobs=')),
	jobs = Number(jobArgument?.slice(7) ?? 3);
const profileArgument = argumentsList.find((value) => value.startsWith('--profiles-from=')),
	profileHashArgument = argumentsList.find((value) => value.startsWith('--profiles-sha256=')),
	profileRun = profileArgument?.slice('--profiles-from='.length),
	profileHash = profileHashArgument?.slice('--profiles-sha256='.length);
assert.ok(
	argumentsList.every((value) => ['--screen', jobArgument, profileArgument, profileHashArgument].includes(value)) &&
		new Set(argumentsList).size === argumentsList.length &&
		Number.isInteger(jobs) &&
		jobs >= 1 &&
		jobs <= 3 &&
		Boolean(profileArgument) === Boolean(profileHashArgument) &&
		(!profileArgument ||
			(/^tmp\/production-algorithm32\/distant-sun-strobing-promotion\/physical-[a-f0-9-]+$/u.test(profileRun) &&
				/^[a-f0-9]{64}$/u.test(profileHash))),
	'Usage: verify-strobing-physical-matrix.js [--screen] [--jobs=1|2|3] [--profiles-from=SEALED_PHYSICAL_RUN --profiles-sha256=DEFINITION_SHA256]',
);
const repository = fileURLToPath(new URL('../../../', import.meta.url)),
	files = new Files(repository);
const run = `tmp/production-algorithm32/distant-sun-strobing-promotion/physical-${randomUUID()}`;
await files.directory(run);
const artifacts = [],
	parents = [];
/** Exclusively retain a new run artifact and its exact content identity. */
async function write(name, value) {
	const artifact = await files.write(
		`${run}/${name}`,
		Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`),
	);
	artifacts.push(artifact);
	return artifact;
}
/** Resolve and authenticate a consumed ordinary repository file. */
async function readParent(relativePath, expected = null) {
	const bytes = await files.read(relativePath, expected);
	parents.push({path: relativePath, byteLength: bytes.length, sha256: files.hash(bytes)});
	return bytes;
}
/** Freeze the complete static source closure, including browser and worker entry points. */
async function sources() {
	const queue = [
			'verify-strobing-physical-matrix.js',
			'DistantSunP2PhysicalBrowser.js',
			'DistantSunP2PhysicalReferenceWorker.js',
			...(!profileRun ? ['DistantSunP2PhysicalProfiles.js'] : []),
		].map((name) => `scripts/algorithm32/solar-zenith-cache/${name}`),
		seen = new Set(),
		result = [];
	while (queue.length) {
		const sourcePath = queue.shift();
		if (seen.has(sourcePath)) continue;
		assert.ok(
			!sourcePath.startsWith('experiments/'),
			'Production physical proof cannot import a contained experiment.',
		);
		seen.add(sourcePath);
		const bytes = await readParent(sourcePath);
		result.push({path: sourcePath, byteLength: bytes.length, sha256: files.hash(bytes)});
		await files.directory(`${run}/sources/${path.posix.dirname(sourcePath)}`);
		await write(`sources/${sourcePath}.txt`, bytes);
		for (const match of bytes.toString().matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/gu))
			if (match[1].startsWith('.'))
				queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), match[1])));
	}
	const lock = await readParent('package-lock.json');
	result.push({path: 'package-lock.json', byteLength: lock.length, sha256: files.hash(lock)});
	return result;
}

/** Authenticate immutable profile data without importing or revalidating its historical construction code.
 * @returns {Promise<{profiles: P2PhysicalProfile[], origin: unknown}>} - Exact parent profile data and its derivation.
 */
async function profileData() {
	if (!profileRun) {
		const helper = await import('./DistantSunP2PhysicalProfiles.js');
		return {
			profiles: helper.createP2PhysicalProfiles(),
			origin: {mode: 'fresh-construction', helper: 'DistantSunP2PhysicalProfiles.js'},
		};
	}
	const definitionPath = `${profileRun}/definition.json`,
		definitionBytes = await readParent(definitionPath);
	assert.equal(files.hash(definitionBytes), profileHash, 'Profile parent definition identity changed.');
	const definition = JSON.parse(definitionBytes.toString()),
		sealedPath = `${profileRun}/sealed.json`,
		sealedBytes = await readParent(sealedPath),
		sealed = JSON.parse(sealedBytes.toString());
	assert.equal(definition.schema, 'algorithm32-p2-physical-proof-v1');
	assert.equal(sealed.accepted, true, 'Profile-data parent must be a sealed accepted physical proof.');
	const entry = sealed.artifacts.find((artifact) => artifact.path === definitionPath);
	assert.ok(entry, 'Profile parent seal must authenticate its definition.');
	assert.equal(entry.sha256, profileHash);
	assert.equal(entry.byteLength, definitionBytes.length);
	assert.ok(Array.isArray(definition.profiles) && definition.profiles.length === 2);
	await files.directory(`${run}/parents`);
	const definitionCopy = await write('parents/profiles-definition.json', definitionBytes),
		sealCopy = await write('parents/profiles-sealed.json', sealedBytes);
	return {
		profiles: definition.profiles,
		origin: {
			mode: 'authenticated-profile-data',
			sourceRun: profileRun,
			definition: {path: definitionPath, byteLength: definitionBytes.length, sha256: profileHash},
			sealed: {path: sealedPath, byteLength: sealedBytes.length, sha256: files.hash(sealedBytes)},
			copies: [definitionCopy, sealCopy],
			operation:
				'Consume only exact serialized buildRequest profile data; recompute all GPU fields and independent reference values using this run current frozen implementation. Historical construction source identities remain provenance, not current executed source.',
		},
	};
}
const heartbeat = setInterval(
	() => process.stdout.write(`${JSON.stringify({run, phase: 'physical-matrix-host', jobs})}\n`),
	25000,
);
try {
	const sourceIdentities = await sources();
	if (profileRun)
		assert.ok(
			!sourceIdentities.some(
				(source) =>
					source.path.endsWith('/DistantSunSharedCacheCubicLookup.js') ||
					source.path.endsWith('/DistantSunP2PhysicalProfiles.js'),
			),
			'Profile-data mode unexpectedly imports profile construction or runtime cubic lookup.',
		);
	const verifier = JSON.parse(
		(
			await readParent('tmp/experiments/point-local-cache-builder/00011-verify/sealed.json', {
				byteLength: 74180,
				sha256: '8768021c5d4cfa5878e604893ae10839ee4e101c0e57347936164c0f03746479',
			})
		).toString(),
	);
	assert.equal(verifier.state, 'accepted');
	const scenePath = 'tmp/experiments/point-local-cache-builder/00000-profiles/profiles.json',
		sceneIdentity = verifier.parents.find((parent) => parent.path === scenePath);
	assert.ok(sceneIdentity);
	const scenes = JSON.parse((await readParent(scenePath, sceneIdentity)).toString()).scenes;
	const {profiles, origin: profileOrigin} = await profileData();
	assert.deepEqual(
		profiles.map((profile) => profile.id),
		['native15', 'direct40'],
	);
	for (const [index, profile] of profiles.entries()) {
		const spec = profile.buildRequest.transportSpec;
		assert.deepEqual(spec.numerical.geometryPolicy, DistantSunSceneCacheNumerics.createAnchoredRadial());
		assert.equal(spec.numerical.solarInterpolation, 'monotone-cubic');
		assert.equal(spec.numerical.maximumScatteringOrder, 4);
		assert.equal(spec.numerical.sourcePathTransmittanceIntervalCount, 20);
		assert.equal(spec.numerical.transportIntervalCount, index === 0 ? 15 : 40);
		assert.equal(spec.domains.position.count, 48);
		assert.equal(spec.domains.solarZenith.count, 180);
		assert.equal(spec.domains.incoming.unitVectors.length, 68);
		assert.equal(spec.domains.outgoing.unitVectors.length, 4374);
		assert.equal(spec.domains.spectrum.channels.length, index === 0 ? 15 : 40);
		assert.equal(
			spec.domains.spectrum.id,
			index === 0 ? 'algorithm32-native-15-spectral-basis-v1' : 'b1-bruneton-direct-40-v1',
		);
	}
	for (const profile of profiles)
		assert.equal(profile.buildRequest.transportSpec.atmosphere.ozone.absorptionEnabled, false);
	for (const key of ['position', 'solarZenith'])
		assert.deepEqual(
			profiles[0].buildRequest.transportSpec.domains[key].nodes,
			profiles[1].buildRequest.transportSpec.domains[key].nodes,
		);
	assert.deepEqual(
		profiles[0].buildRequest.transportSpec.domains.outgoing.unitVectors,
		profiles[1].buildRequest.transportSpec.domains.outgoing.unitVectors,
	);
	for (const key of ['bottomRadiusMeters', 'topRadiusMeters'])
		assert.equal(
			profiles[0].buildRequest.transportSpec.planet[key],
			profiles[1].buildRequest.transportSpec.planet[key],
		);
	const matrix = createP2PhysicalMatrix(profiles[0].buildRequest, {screen, scenes}),
		matrixIdentity = await write('matrix.json', matrix);
	const requests = profiles.flatMap((profile, profileIndex) =>
		profile.buildRequest.transportSpec.domains.spectrum.channels.flatMap((_channel, channel) =>
			!screen || (profileIndex === 0 && channel === 7) ? [{profileIndex, channel}] : [],
		),
	);
	const definition = await write('definition.json', {
		schema: 'algorithm32-p2-physical-proof-v1',
		screen,
		jobs,
		matrix: matrixIdentity,
		profiles,
		profileOrigin,
		profileDataIdentities: profiles.map((profile) => ({
			id: profile.id,
			encoding: 'JSON.stringify UTF-8',
			buildRequestSha256: files.hash(JSON.stringify(profile.buildRequest)),
			domainsSha256: files.hash(JSON.stringify(profile.buildRequest.transportSpec.domains)),
			numericalPolicySha256: files.hash(JSON.stringify(profile.buildRequest.transportSpec.numerical)),
		})),
		requests,
		sources: sourceIdentities,
		parents,
		tolerance: {
			density: {absolute: 1e-10, relative: 0.01, units: 'W m^-3 sr^-1 nm^-1'},
			radiance: {absolute: 1e-8, relative: 0.01, units: 'W m^-2 sr^-1 nm^-1'},
			transmittance: {absolute: 1e-6, relative: 0.001},
		},
		fieldLayout: {
			orders: ['J1', 'J2', 'J3', 'J4'],
			ordering: 'field-major then matrix.coordinates index',
			gpu: 'IEEE754 binary32 little-endian',
			reference: 'IEEE754 binary64 little-endian',
		},
		operation:
			'Production R32F recurrence probes on unchanged Native48/Z180/F68/W27 fields, versus independent binary64 recurrence; continuous source/N1 diagnostics use their own physical probe coordinates and do not replace recurrence domains.',
	});
	process.stdout.write(
		`${JSON.stringify({run, phase: 'matrix-defined', coordinates: matrix.coordinates.length, queries: matrix.queries.length, rays: matrix.rays.length, channels: requests.length})}\n`,
	);
	const execution = await new Compiler({
		chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	}).compileLayers({
		outputDirectory: path.join(repository, run, 'browser'),
		control: {
			profiles,
			requests,
			coordinates: matrix.coordinates,
			queries: matrix.queries.map(({stencil: _stencil, ...query}) => query),
		},
		browserModulePath: '/repository/scripts/algorithm32/solar-zenith-cache/DistantSunP2PhysicalBrowser.js',
		layerCount: requests.length,
	});
	const gpuExecution = await write('gpu-execution.json', execution.browserExecution),
		children = [];
	for (const [requestIndex, request] of requests.entries()) {
		const name = `${profiles[request.profileIndex].id}/channel-${String(request.channel).padStart(2, '0')}`;
		await files.directory(`${run}/${name}`);
		const bytes = execution.layers[requestIndex],
			densityLength = matrix.coordinates.length * 16;
		assert.equal(bytes.length, densityLength + matrix.queries.length * 8);
		const gpuDensity = await write(`${name}/gpu-density.f32`, bytes.subarray(0, densityLength)),
			gpuDirect = await write(`${name}/gpu-direct.f32`, bytes.subarray(densityLength));
		const childDefinition = await write(`${name}/definition.json`, {
			...request,
			parentDefinition: definition,
			matrix: matrixIdentity,
			gpuDensity,
			gpuDirect,
			gpuExecution,
		});
		children.push({name, definition: childDefinition});
	}
	let next = 0;
	const completed = [];
	await Promise.all(
		Array.from({length: Math.min(jobs, children.length)}, async () => {
			while (next < children.length) {
				const child = children[next++];
				const code = await new Promise((resolve, reject) => {
					const processChild = spawn(
						process.execPath,
						[
							path.join(
								repository,
								'scripts/algorithm32/solar-zenith-cache/DistantSunP2PhysicalReferenceWorker.js',
							),
							run,
							child.name,
							definition.sha256,
							child.definition.sha256,
						],
						{cwd: repository, stdio: 'inherit', windowsHide: true},
					);
					processChild.once('error', reject);
					processChild.once('exit', (code) => resolve(code));
				});
				const sealedBytes = await files.read(`${run}/${child.name}/sealed.json`),
					sealed = JSON.parse(sealedBytes.toString());
				const identity = {
					path: `${run}/${child.name}/sealed.json`,
					byteLength: sealedBytes.length,
					sha256: files.hash(sealedBytes),
				};
				for (const artifact of sealed.artifacts) await files.read(artifact.path, artifact, 64 * 1024 * 1024);
				completed.push({
					name: child.name,
					exitCode: code,
					accepted: code === 0 && sealed.accepted === true,
					sealed: identity,
				});
			}
		}),
	);
	for (const source of sourceIdentities) await files.read(source.path, source);
	const accepted = completed.length === requests.length && completed.every((child) => child.accepted);
	await write('result.json', {
		accepted,
		screen,
		children: completed,
		matrix: matrixIdentity,
		definition,
		tools: {node: process.version},
		limitations: [
			'Full physical acceptance remains separate from B1/B2/B3 scoring and POC appearance preservation.',
			'Stateless reverse replay does not substitute for application publication tests.',
			'Higher-order physical values use independently recomputed discrete fields; continuum convergence is not claimed.',
		],
	});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted, artifacts})}\n`));
	process.stdout.write(`${JSON.stringify({run, accepted, screen, children: completed.length})}\n`);
	if (!accepted) process.exitCode = 1;
} catch (error) {
	await write('failure.json', {error: String(error)});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted: false, artifacts})}\n`));
	throw error;
} finally {
	clearInterval(heartbeat);
}
