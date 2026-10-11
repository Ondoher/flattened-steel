import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {ExperimentRun} from './ExperimentRun.js';
import {createSanJoseWinterControls} from './san-jose-winter-controls.js';
import {resolveShellState} from './resolve-shell-state.js';
import {
	sampleFilmClock,
	sampleFilmCamera,
	FILM_NATIVE_WIDTH,
	FILM_NATIVE_HEIGHT,
	FILM_CIRCUIT_FOV_DEGREES,
} from './film-director.js';
import {readParent} from './parent-evidence.js';
import {shellStencil} from './shell-layout.js';
import {repositoryRoot, checkPath, hash, hashFile} from './run-boundary.js';

/** Resolve the previous far-side boundary with the ordinary production location/time path.
 * @returns {LocalSunFilmControls} - New physical controls; historical controls stay immutable.
 */
export function deriveFilmControls() {
	const following = createSanJoseWinterControls().find((state) => state.id === 'flat-180');
	if (!following) throw new Error('Missing San Jose far-boundary control.');
	const startObservation = {
		...following.observation,
		instant: new Date(Date.parse(following.observation.instant) - 86400000).toISOString(),
	};
	return {
		startObservation,
		state: resolveShellState(startObservation),
		derivation: {
			dateBasis: '2024-12-21T09:20:00.000Z',
			resolvedFollowingBoundary: following.observation.instant,
			startInstant: startObservation.instant,
			endInstant: new Date(Date.parse(startObservation.instant) + 86400000).toISOString(),
			operation:
				'Resolve San Jose closest-angle 180 through production; subtract exactly one day to select the preceding boundary. Resolve each increasing instant independently, retaining seasonal drift.',
		},
	};
}

/** Prove source-clock winding, physical source invariants and unchanged circuit lens without a GPU.
 * @returns {Promise<void>} - One newly sealed focused proof run.
 */
async function main() {
	const run = await ExperimentRun.create('p6-film-proof');
	let failure = null;
	try {
		if (process.argv.length !== 2) throw new Error('Film proof accepts no options.');
		const parents = await Promise.all(
			['contract.json', 'layout.json'].map((name) => readParent('00478-p3-contract', name)),
		);
		if (
			parents[0].artifactSha256 !== '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704' ||
			parents[1].artifactSha256 !== 'd1c7dea2b0587474de5930d75e8e91e9fb61d20ed92faefce2ab7a239a290864'
		)
			throw new Error('Pinned film coverage policy changed.');
		/** @type {LocalSunShellLayout} */ const layout = JSON.parse(new TextDecoder().decode(parents[1].bytes));
		const controls = deriveFilmControls(),
			rows = [],
			coverage = [],
			start = Date.parse(controls.startObservation.instant);
		let bearing = 0,
			previous = 0,
			priorInstant = start,
			minimumCoverageMargin = Infinity,
			maximumCameraOffset = 0,
			stencilQueries = 0;
		for (let slot = 0; slot <= 2700; slot++) {
			const clock = sampleFilmClock(slot / 30),
				instant = new Date(start + clock.sourceProgress * 86400000).toISOString();
			const state = resolveShellState({...controls.startObservation, instant});
			const source = state.source.position.coordinates,
				camera = clock.cameraMeters,
				observer = state.geometry.observerPosition.coordinates;
			const delta = [
				source[0] - observer[0] - camera[0],
				source[1] - observer[1] + camera[2],
				source[2] - observer[2] - camera[1],
			];
			const distance = Math.hypot(...delta),
				azimuth = (Math.atan2(delta[0], delta[1]) * 180) / Math.PI;
			const observerDelta = source.map((value, axis) => value - observer[axis]),
				observerDistance = Math.hypot(...observerDelta);
			/** @type {UnitVector3} */ const direction = [
				observerDelta[0] / observerDistance,
				observerDelta[1] / observerDistance,
				observerDelta[2] / observerDistance,
			];
			const pose = sampleFilmCamera(clock.filmSeconds, direction),
				look = pose.targetScene.map((value, axis) => value - camera[axis] / 1000);
			const bottomRayElevationDegrees =
				(Math.atan2(look[1], Math.hypot(look[0], look[2])) * 180) / Math.PI -
				clock.verticalFieldOfViewDegrees / 2;
			if (slot) bearing += ((azimuth - previous + 540) % 360) - 180;
			else bearing = azimuth;
			previous = azimuth;
			if (
				Date.parse(instant) < priorInstant ||
				(slot > 300 && slot < 2400 && Date.parse(instant) <= priorInstant)
			)
				throw new Error('Film source clock is not strictly increasing throughout its circuit.');
			priorInstant = Date.parse(instant);
			if (
				clock.filmSeconds >= 10 &&
				clock.filmSeconds <= 80 &&
				(clock.verticalFieldOfViewDegrees !== FILM_CIRCUIT_FOV_DEGREES || bottomRayElevationDegrees >= 0)
			)
				throw new Error('Circuit lens changed or floor is outside the lower view.');
			if (
				state.source.radius.value !== 25749.504 ||
				state.geometry.localLightSourceHeight.value !== 4828032 ||
				state.source.sourceIrradiance.contentHash !== controls.state.source.sourceIrradiance.contentHash
			)
				throw new Error('Physical source policy drifted.');
			const sourceOffset = Math.hypot(source[0] - observer[0], source[1] - observer[1]),
				cameraOffset = Math.hypot(camera[0], camera[2]),
				rayExtent = state.geometry.sceneSkyRayLimit.value;
			const maximumRho = sourceOffset + cameraOffset + rayExtent,
				margin = layout.maximumRho - maximumRho;
			if (
				!Number.isFinite(rayExtent) ||
				rayExtent <= 0 ||
				margin < 0 ||
				camera[1] + observer[2] < 0 ||
				camera[1] + observer[2] > layout.top ||
				state.geometry.localLightSourceHeight.value !== layout.height ||
				state.geometry.topAltitude.value !== layout.top
			)
				throw new Error('A source/camera/finite-ray domain is unsupported by the frozen shell.');
			minimumCoverageMargin = Math.min(minimumCoverageMargin, margin);
			maximumCameraOffset = Math.max(maximumCameraOffset, cameraOffset);
			for (const level of layout.rows) {
				const stencil = shellStencil(layout, maximumRho, level.z);
				if (
					stencil.indices.some((index) => !layout.bands[layout.nodes[index].band].admitted) ||
					Math.abs(stencil.weights.reduce((sum, value) => sum + value, 0) - 1) > 1e-12
				)
					throw new Error('Film ray bound addresses an omitted shell band.');
				stencilQueries++;
			}
			coverage.push({
				slot,
				sourceOffsetMeters: sourceOffset,
				cameraOffsetMeters: cameraOffset,
				finiteRayExtentMeters: rayExtent,
				maximumRhoMeters: maximumRho,
				marginMeters: margin,
				compactStencilQueries: layout.rows.length,
				bottomRayElevationDegrees,
				bottomRayGroundDistanceMeters:
					bottomRayElevationDegrees < 0
						? (observer[2] + camera[1]) / -Math.sin((bottomRayElevationDegrees * Math.PI) / 180)
						: null,
			});
			/** @type {LocalSunFilmGeometryRow} */ const row = {
				slot,
				filmSeconds: clock.filmSeconds,
				instant,
				sourcePhaseDegrees: clock.sourcePhaseDegrees,
				unwrappedBearingDegrees: bearing,
				distanceMeters: distance,
				radiusMeters: state.source.radius.value,
				verticalFieldOfViewDegrees: clock.verticalFieldOfViewDegrees,
				bottomRayElevationDegrees,
				diameterPixels:
					(FILM_NATIVE_HEIGHT * state.source.radius.value) /
					(Math.sqrt(distance * distance - state.source.radius.value ** 2) *
						Math.tan((clock.verticalFieldOfViewDegrees * Math.PI) / 360)),
			};
			rows.push(row);
			if (slot % 300 === 0) await run.progress('geometry', JSON.stringify({completed: slot, total: 2700}));
		}
		const circuit = rows.filter((row) => row.filmSeconds >= 10 && row.filmSeconds <= 80),
			diameters = circuit.map((row) => row.diameterPixels),
			near = Math.max(...diameters),
			far = Math.min(...diameters),
			winding = circuit.at(-1).unwrappedBearingDegrees - circuit[0].unwrappedBearingDegrees;
		if (
			Math.abs(Math.abs(winding) - 360) > 0.2 ||
			near < 14 ||
			far < 6 ||
			near / far < 2.2 ||
			near / far > 2.4 ||
			circuit.at(-1).sourcePhaseDegrees !== 540
		)
			throw new Error('Circuit geometry/size gates failed.');
		const sources = [],
			entry = fileURLToPath(import.meta.url);
		const build = await rollup({
			input: entry,
			external: (id) => id.startsWith('node:') || ['rollup', '@rollup/plugin-node-resolve'].includes(id),
			plugins: [nodeResolve(), createRequire(import.meta.url)('@rollup/plugin-commonjs')()],
			onwarn() {},
		});
		let files;
		try {
			files = build.watchFiles;
		} finally {
			await build.close();
		}
		for (const file of [...new Set([...files, path.join(repositoryRoot, 'package-lock.json')])].filter(
			(name) => !name.startsWith('\0'),
		))
			sources.push({
				path: path.relative(repositoryRoot, file).replaceAll('\\', '/'),
				...(await hashFile(repositoryRoot, file)),
			});
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'local-sun-p6-film-proof-input-v1',
					command: process.argv,
					node: process.version,
					controls,
					viewportSize: {width: FILM_NATIVE_WIDTH, height: FILM_NATIVE_HEIGHT},
					parents: parents.map(({bytes, ...identity}) => identity),
					sources,
					operation:
						'Sample all 2700 ideal slots plus endpoint; resolve physical state independently and unwrap atan2(east,north); use the unchanged authoritative on-axis producer diameter from physical radius/distance and actual lens. Require the circuit bottom view ray to point below the horizontal plane. Bound every finite camera ray by source horizontal offset + actual camera horizontal offset + production sceneSkyRayLimit, then require admitted compact stencils at every shell altitude.',
				},
				null,
				'\t',
			),
		);
		await run.write('geometry.json', JSON.stringify(rows));
		await run.write(
			'coverage.json',
			JSON.stringify({
				schema: 'local-sun-p6-film-coverage-v1',
				operation:
					'Conservative horizontal triangle bound for every finite ray at each exact encoded state; compact stencil partition and omission admission at each altitude.',
				frames: coverage,
			}),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'local-sun-p6-film-proof-v1',
					passed: true,
					frames: 2700,
					endpointControls: 1,
					windingDegrees: winding,
					nearDiameterPixels: near,
					farDiameterPixels: far,
					ratio: near / far,
					floorFraming: {
						allCircuitBottomRaysBelowHorizon: true,
						minimumBottomRayElevationDegrees: Math.min(
							...circuit.map((row) => row.bottomRayElevationDegrees),
						),
						maximumBottomRayElevationDegrees: Math.max(
							...circuit.map((row) => row.bottomRayElevationDegrees),
						),
					},
					geometrySha256: hash(JSON.stringify(rows)),
					coverage: {
						minimumMarginMeters: minimumCoverageMargin,
						maximumCameraOffsetMeters: maximumCameraOffset,
						stencilQueries,
						omittedBands: layout.omittedBands,
						allocatedOmittedNodes: layout.nodes.filter((node) => !layout.bands[node.band].admitted).length,
					},
					limitation:
						'CPU geometric estimates and finite-ray support at every encoded state; GPU disc coverage, skyline occlusion and decoded-media visibility require separate capture qualification.',
				},
				null,
				'\t',
			),
		);
	} catch (error) {
		failure = error instanceof Error ? error.stack : String(error);
		process.exitCode = 1;
	} finally {
		await run.finish(failure ? 'failed' : 'accepted', failure);
		console.log(run.name);
		if (failure) console.error(failure);
	}
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
