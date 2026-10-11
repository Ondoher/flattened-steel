import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {selectSunSize, SOLAR_ANGULAR_DIAMETER_DEGREES} from './sun-size.js';

/** Verify overhead calibration, altitude scaling, power preservation and parent immutability.
 * @returns {Promise<void>} - Sealed focused proof; no GPU work or historical writes.
 */
async function main() {
	const run = await ExperimentRun.create('sun-size-proof');
	let failure = null;
	try {
		const parent = await readParent('00018-controls', 'controls.json');
		/** @type {{states: LocalSunCelestialControlState[]}} */
		const controls = JSON.parse(new TextDecoder().decode(parent.bytes));
		const before = hash(JSON.stringify(controls.states));
		const fixed = selectSunSize(controls.states, 'fixed-16mi');
		const calibrated = selectSunSize(controls.states, 'overhead-calibrated');
		const rows = calibrated.states.map((state, index) => {
			const original = controls.states[index], height = state.geometry.localLightSourceHeight.value,
				radius = state.source.radius.value,
				angularDegrees = 2 * Math.atan2(radius, Math.sqrt(height * height - radius * radius)) * 180 / Math.PI;
			const {radius: originalRadius, ...originalPower} = original.source;
			const {radius: selectedRadius, ...selectedPower} = state.source;
			if (Math.abs(angularDegrees - SOLAR_ANGULAR_DIAMETER_DEGREES) > 1e-12 ||
				fixed.states[index].source.radius.value !== 25749.504 ||
				JSON.stringify(originalPower) !== JSON.stringify(selectedPower) ||
				JSON.stringify(original.geometry) !== JSON.stringify(state.geometry))
				throw new Error('Calibration changed source power/geometry or missed overhead diameter.');
			return {id: state.id, radiusMeters: radius, angularDegrees, unchangedSourcePower: true};
		});
		const original = controls.states[0], height = original.geometry.localLightSourceHeight.value * 1.5;
		const higher = {...original, geometry: {...original.geometry, localLightSourceHeight: {value: height, units: /** @type {const} */ ('meters')},
			sourcePosition: {...original.geometry.sourcePosition, coordinates: /** @type {UnitVector3} */ ([original.geometry.sourcePosition.coordinates[0], original.geometry.sourcePosition.coordinates[1], height])}},
			source: {...original.source, position: {...original.source.position, coordinates: /** @type {UnitVector3} */ ([original.source.position.coordinates[0], original.source.position.coordinates[1], height])}}};
		const higherSelection = selectSunSize([higher], 'overhead-calibrated');
		if (Math.abs(higherSelection.states[0].source.radius.value / calibrated.states[0].source.radius.value - 1.5) > 1e-12)
			throw new Error('Radius did not follow source altitude.');
		let invalidHeightRejected = false;
		try { selectSunSize([{...original, geometry: {...original.geometry, localLightSourceHeight: {value: 0, units: 'meters'}}}], 'overhead-calibrated'); }
		catch { invalidHeightRejected = true; }
		if (!invalidHeightRejected || hash(JSON.stringify(controls.states)) !== before ||
			(await readParent('00018-controls', 'controls.json')).artifactSha256 !== parent.artifactSha256)
			throw new Error('Invalid height admitted or parent controls changed.');
		const sources = [];
		for (const relative of ['prove-sun-size.js', 'sun-size.js', 'ExperimentRun.js', 'parent-evidence.js', 'run-boundary.js']) {
			const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', relative);
			await checkPath(repositoryRoot, file);
			const bytes = await readFile(file);
			sources.push({path: 'experiments/local-sun-cache-reuse/' + relative, sha256: hash(bytes)});
		}
		const {bytes, ...parentIdentity} = parent;
		await run.write('result.json', JSON.stringify({
			schema: 'local-sun-size-proof-v1', parent: parentIdentity, sources,
			tool: {node: process.version}, operation: 'Select both radius modes; independently recover overhead angle using atan2; scale source altitude by 1.5; check unchanged power/geometry and immutable parent.',
			calibration: calibrated.calibration, rows, higherRadiusMeters: higherSelection.states[0].source.radius.value,
			altitudeScalingPassed: true, invalidHeightRejected, parentUnchanged: true,
			inputStatesSha256: before, outputStatesSha256: hash(JSON.stringify(calibrated.states)), passed: true,
		}, null, '\t'));
	} catch (error) {
		failure = error instanceof Error ? error.stack : String(error);
		process.exitCode = 1;
		console.log(failure);
	} finally {
		await run.finish(failure ? 'failed' : 'accepted', failure);
		console.log(run.name);
	}
}
await main();
