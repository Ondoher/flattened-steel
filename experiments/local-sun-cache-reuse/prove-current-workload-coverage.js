import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import * as THREE from 'three';
import {FlatEarthGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {TheHoursObservatoryCamera} from '../../scripts/flat32/the-hours/TheHoursObservatoryCamera.js';
import {resolveShellState} from './resolve-shell-state.js';
import {shellStencil} from './shell-layout.js';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Check finite future-film coverage and compact support without capturing or encoding video.
 * @returns {Promise<void>} - Sealed geometric bound and omitted-band addressing proof.
 */
async function main() {
	const run = await ExperimentRun.create('p5-coverage');
	try {
		const parents = [];
		for (const artifact of ['contract.json', 'layout.json'])
			parents.push(await readParent('00478-p3-contract', artifact));
		const layout = /** @type {LocalSunShellLayout} */ (JSON.parse(new TextDecoder().decode(parents[1].bytes)));
		if (
			parents[0].artifactSha256 !== '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704' ||
			parents[1].artifactSha256 !== 'd1c7dea2b0587474de5930d75e8e91e9fb61d20ed92faefce2ab7a239a290864'
		)
			throw new Error('Unpinned workload coverage contract.');
		const control = await readParent('00018-controls', 'controls.json');
		parents.push(control);
		const controls = JSON.parse(new TextDecoder().decode(control.bytes));
		const location = controls.states[0].observation.location,
			dateBasis = '2024-12-14T12:00:00.000Z';
		const start = FlatEarthGeometry.resolveObservationInstant({
			dateBasis,
			location,
			kind: 'closest-angle',
			angle: {value: 180, units: 'degrees'},
		});
		const camera = new THREE.PerspectiveCamera(60, 3840 / 2160, 0.0005, 500),
			score = new TheHoursObservatoryCamera({camera, durationSeconds: 60});
		const frames = [];
		let minimumMargin = Infinity,
			maximumSourceOffset = 0,
			queries = 0;
		const cameraBound = Math.hypot(205, 42),
			translationBound = Math.hypot(10000, 10000),
			rayExtent = 1926774;
		for (let slot = 0; slot <= 1800; slot++) {
			const seconds = slot / 30,
				instant = new Date(Date.parse(start) + (seconds / 60) * 86400000).toISOString();
			const state = resolveShellState({instant, location}),
				source = state.geometry.sourcePosition.coordinates,
				length = Math.hypot(...source);
			const pose = score.apply({
				animationSeconds: seconds,
				directionToSunScene: [source[0] / length, source[2] / length, -source[1] / length],
				solarZenithDegrees: (Math.acos(source[2] / length) * 180) / Math.PI,
			});
			const sourceOffset = Math.hypot(source[0], source[1]),
				maximumRho = sourceOffset + cameraBound + translationBound + rayExtent,
				margin = layout.maximumRho - maximumRho;
			if (
				Math.hypot(pose.positionMeters[0], pose.positionMeters[2]) > cameraBound ||
				pose.positionMeters[1] < 0 ||
				pose.positionMeters[1] > layout.top
			)
				throw new Error('Actual camera pose exceeds the declared horizontal/slab bound.');
			if (
				state.geometry.localLightSourceHeight.value !== layout.height ||
				state.geometry.topAltitude.value !== layout.top
			)
				throw new Error('Physical workload differs from admitted source/slab.');
			minimumMargin = Math.min(minimumMargin, margin);
			maximumSourceOffset = Math.max(maximumSourceOffset, sourceOffset);
			// Every point of any finite camera ray lies within this horizontal triangle
			// bound. At the bound and each altitude, require real compact stencil taps.
			if (margin >= 0)
				for (const row of layout.rows) {
					const stencil = shellStencil(layout, maximumRho, row.z);
					if (
						stencil.indices.some((i) => !layout.bands[layout.nodes[i].band].admitted) ||
						Math.abs(stencil.weights.reduce((n, w) => n + w, 0) - 1) > 1e-12
					)
						throw new Error('Workload compact support enters an omitted band.');
					queries++;
				}
			frames.push({
				slot,
				encoded: slot < 1800,
				seconds,
				phaseDegrees: 180 + 6 * seconds,
				instant,
				sourceMeters: source,
				camera: pose,
				marginMeters: margin,
			});
		}
		const entry = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/prove-current-workload-coverage.js');
		await checkPath(repositoryRoot, entry);
		const bundle = await rollup({
			input: entry,
			external: (id) => id.startsWith('node:') || ['rollup', '@rollup/plugin-node-resolve'].includes(id),
			plugins: [nodeResolve(), createRequire(import.meta.url)('@rollup/plugin-commonjs')()],
			onwarn() {},
		});
		let files;
		try {
			files = bundle.watchFiles;
		} finally {
			await bundle.close();
		}
		const implementation = [];
		for (const file of [...new Set([...files, path.join(repositoryRoot, 'package-lock.json')])].filter(
			(v) => !v.startsWith('\0'),
		)) {
			await checkPath(repositoryRoot, file);
			const bytes = await readFile(file);
			implementation.push({path: path.relative(repositoryRoot, file).replaceAll('\\', '/'), sha256: hash(bytes)});
		}
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'current-workload-coverage-input-v1',
					command: process.argv.slice(1),
					parents: parents.map(({bytes, ...identity}) => identity),
					implementation,
					node: process.version,
					dateBasis,
					start,
					operation:
						'Resolve 1801 exact geometry/camera frame and endpoint states at the selected date; apply a conservative horizontal triangle bound and actual compact stencils. No candidate rendering, light interpolation or encoding.',
				},
				null,
				'\t',
			),
		);
		await run.write('frames.json', JSON.stringify(frames, null, '\t'));
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'current-workload-coverage-v1',
					covered: minimumMargin >= 0,
					minimumMarginMeters: minimumMargin,
					maximumSourceOffsetMeters: maximumSourceOffset,
					frameStates: frames.length,
					queries,
					omittedBands: layout.omittedBands,
					allocatedOmittedNodes: layout.nodes.filter((n) => !layout.bands[n.band].admitted).length,
					maximumRhoMeters: layout.maximumRho,
					parameters: {cameraBound, translationBound, rayExtent},
					claim: 'Finite geometric coverage and compact support; not rendered film qualification or continuous ephemeris extrema.',
				},
				null,
				'\t',
			),
		);
		await run.finish('accepted');
		console.log(JSON.stringify({run: run.name, covered: minimumMargin >= 0, minimumMarginMeters: minimumMargin}));
	} catch (error) {
		await run.finish('failed', String(error.stack ?? error));
		throw error;
	}
}
await main();
