import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import * as THREE from 'three';
import {FlatLocalMode} from '../../src/flat32/FlatLocalMode.js';
import {LocationTimeController} from '../../src/flat32/LocationTimeController.js';
import {FlatEarthGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {LocalSunLightSource} from '../../src/algorithm32/implementation/local-sun/LocalSunLightSource.js';
import {TheHoursObservatoryCamera} from '../../scripts/flat32/the-hours/TheHoursObservatoryCamera.js';
import {ExperimentRun} from './ExperimentRun.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Resolve current physical controls without constructing GPU fields.
 * @param {GeometryObservation} observation - Exact placement request.
 * @returns {LocalSunFrozenPlacement} - Complete placement and axes.
 */
function resolve(observation) {
	const mode = new FlatLocalMode({
		sceneScale: {value: 1000, units: 'meters-per-scene-unit'},
		maximumScatteringOrder: 4,
		observation,
	});
	try {
		return {
			observation,
			geometry: mode.geometry.configuration,
			summary: mode.describe(),
			source: /** @type {LocalSunLightSource} */ (mode.algorithm32.config.config.lightSource).configuration,
			execution: mode.algorithm32.config.config.execution,
		};
	} finally {
		mode.dispose();
	}
}

/** Freeze cadence, finite film coverage and immutable parent identities.
 * @returns {Promise<void>} - Sealed controls run.
 */
async function main() {
	const run = await ExperimentRun.create('controls');
	let failure = null;
	try {
		const fixturePath = path.join(
			repositoryRoot,
			'experiments/extraterrestrial/fixtures/union-glacier-flat-local-closest-approach-v1.json',
		);
		await checkPath(repositoryRoot, fixturePath);
		const fixtureBytes = await readFile(fixturePath);
		/** @type {LocalSunHistoricalFixture} */
		const fixture = JSON.parse(fixtureBytes.toString('utf8'));
		const controller = new LocationTimeController();
		const start = controller.start();
		const states = [0, 45, 90, 135, 180].map((angle, index) => {
			const placement = resolve(controller.selectTime(start, index).observation);
			const historical = fixture.states.find((value) => value.id === `flat-${angle}`);
			const delta = historical
				? placement.geometry.sourcePosition.coordinates.map(
						(value, axis) => value - historical.centerMeters[axis],
					)
				: null;
			return {
				id: `flat-${angle}`,
				role: angle === 90 ? 'withheld-decisive-holdout' : 'development-and-qualification',
				historicalDeltaMeters: delta,
				...placement,
			};
		});
		await run.write(
			'historical-overlap.json',
			`${JSON.stringify(
				states.map((state) => ({
					id: state.id,
					instant: state.observation.instant,
					sourceMeters: state.geometry.sourcePosition.coordinates,
					historicalDeltaMeters: state.historicalDeltaMeters,
				})),
				null,
				'\t',
			)}\n`,
		);
		const solstice = {
			instant: '2024-12-21T09:20:00.000Z',
			precision: 'published minute; no subminute astronomical accuracy claim',
			authority:
				'https://aa.usno.navy.mil/calculated/seasons?dst=false&submit=Get+Data&tz=0&tz_label=true&tz_sign=0&year=2024',
		};
		const filmStart = FlatEarthGeometry.resolveObservationInstant({
			dateBasis: solstice.instant,
			location: start.observation.location,
			kind: 'closest-angle',
			angle: {value: 180, units: 'degrees'},
		});
		const camera = new THREE.PerspectiveCamera(60, 3840 / 2160, 0.0005, 500);
		const score = new TheHoursObservatoryCamera({camera, durationSeconds: 60});
		const film = [];
		for (let slot = 0; slot <= 1800; slot += 1) {
			const seconds = slot / 30;
			const instant = new Date(Date.parse(filmStart) + (seconds / 60) * 86400000).toISOString();
			const placement = resolve({instant, location: start.observation.location});
			const source = placement.geometry.sourcePosition.coordinates;
			// The original score uses the exact source direction; finite-source camera correction remains a P6 composition obligation.
			const length = Math.hypot(...source);
			const pose = score.apply({
				animationSeconds: seconds,
				directionToSunScene: [source[0] / length, source[2] / length, -source[1] / length],
				solarZenithDegrees: (Math.acos(source[2] / length) * 180) / Math.PI,
			});
			film.push({
				slot,
				encoded: slot < 1800,
				seconds,
				phaseDegrees: 180 + 6 * seconds,
				instant,
				sourceMeters: source,
				camera: pose,
			});
		}
		const maxOffset = Math.max(
			...states.map((state) => Math.hypot(...state.geometry.sourcePosition.coordinates.slice(0, 2))),
			...film.map((frame) => Math.hypot(...frame.sourceMeters.slice(0, 2))),
		);
		// Authored score radius <=205 m and |side| <=42 m; triangle bounds are valid continuously, not only at sampled frames.
		const cameraHorizontalBound = Math.hypot(205, 42);
		const rayExtent = 1926774;
		const translationBound = Math.hypot(10000, 10000);
		const coverage = {
			radialMaximumMeters:
				Math.ceil((maxOffset + translationBound + cameraHorizontalBound + rayExtent + 1000) / 1000) * 1000,
			maximumSampledSourceOffsetMeters: maxOffset,
			translationBoundMeters: translationBound,
			cameraHorizontalBoundMeters: cameraHorizontalBound,
			rayExtentMeters: rayExtent,
			sourceDriftMarginMeters: 1000,
			equation:
				'ceil_1000(max sampled source offset + hypot(10000,10000) + hypot(205,42) + max view ray extent + 1000 m drift margin)',
			disposition:
				'Finite declared workload only. Every query is checked against this cylinder before reuse; construction paths terminate at its boundary. No clamping may count as covered. The expanded cylinder is candidate construction policy, separate from current per-state radii.',
			continuousSourceCoverage:
				'1801 exact frame/endpoint states admitted; any additional state must pass the same runtime coverage check. Continuous ephemeris extrema are not claimed.',
		};
		const parents = [];
		const candidateAxes = {
			zNodesMeters: states[0].geometry.cacheAltitudeNodes.map((value) => value.value),
			rhoNodesMeters: states[0].geometry.cacheRadialNodes.map(
				(value) => (value.value / states[0].geometry.cacheRadialMaximum.value) * coverage.radialMaximumMeters,
			),
			meaning:
				'Fixed-coverage candidate policy axes, not current production per-state axes. Boundary truncation is a separate construction-policy comparison.',
		};
		for (const relative of [
			'experiments/local-sun-cache-reuse/freeze-controls.js',
			'experiments/local-sun-cache-reuse/ExperimentRun.js',
			'src/flat32/FlatLocalMode.js',
			'src/flat32/LocationTimeController.js',
			'src/flat32/consts.js',
			'src/algorithm32/implementation/flat-earth/consts.js',
			'scripts/flat32/the-hours/TheHoursObservatoryCamera.js',
			'scripts/flat32/the-hours/TheHoursObservatoryScene.js',
			'scripts/flat32/the-hours/TheHoursRandom.js',
			'scripts/flat32/the-hours/TheHoursRecorder.js',
			'scripts/flat32/the-hours/desert-reflectance.js',
			'scripts/flat32/the-hours/TheHoursDesertSceneLighting.js',
			'scripts/flat32/the-hours/TheHoursLightingSamples.js',
			'scripts/flat32/the-hours/consts.js',
			'scripts/experiments/flat-local-cache-domain-convergence/flat-local-cache-domain-post-promotion-verification-policy.json',
			'package-lock.json',
		]) {
			const target = path.join(repositoryRoot, relative);
			await checkPath(repositoryRoot, target);
			const bytes = await readFile(target);
			parents.push({path: relative, byteLength: bytes.length, sha256: hash(bytes)});
		}
		const result = {
			schema: 'local-sun-frozen-controls-v1',
			productionHead: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: repositoryRoot, encoding: 'utf8'}).trim(),
			states,
			historicalFixture: {path: path.relative(repositoryRoot, fixturePath), sha256: hash(fixtureBytes)},
			solstice,
			film: {
				startInstant: filmStart,
				durationSeconds: 60,
				frames: 1800,
				fps: 30,
				width: 3840,
				height: 2160,
				endpointSlot: 1800,
				clock: '180 + 360*t/60; exact instant = start + 24h*t/60',
				recipe: 'unchanged scene/camera/shadows/one-second measured-light interpolation; only declared physical source, location, solstice date and clock change',
			},
			coverage,
			candidateAxes,
			parents,
			derivation:
				'Public production location-time resolver and FlatLocalMode source placement; immutable historical four-state overlap; original camera score evaluated at every ideal slot and separate endpoint. No fields, candidate or numerical accuracy claim.',
		};
		await run.write('controls.json', `${JSON.stringify(result, null, '\t')}\n`);
		await run.write('film-coverage.json', `${JSON.stringify(film, null, '\t')}\n`);
	} catch (error) {
		failure = String(error.stack ?? error);
	}
	await run.finish(failure ? 'failed' : 'accepted', failure);
	console.log(JSON.stringify({run: run.name, failure}));
	if (failure) process.exitCode = 1;
}

await main();
