import assert from 'node:assert/strict';
import {incidentWorld} from '../j2/angular.mjs';
import {createVolumeWorkerPool} from '../volume-worker/pool.mjs';
import {sumVolumeJ2} from '../volume-j2/angular.mjs';
import {assessVolumeJ2} from '../volume-j2/assess.mjs';
import {thetaGroups} from './geometry.mjs';

/** @param {SkyAngularThetaStage} stage @returns {SkyAngularThetaCase} */
export function thetaCase(stage) {
	assert.ok(stage === 'pilot' || stage === 'fine');
	const radialCount = stage === 'pilot' ? 16 : 32;
	const azimuthCount = stage === 'pilot' ? 32 : 64;
	return {stage, frame: 'theta', radialCount, azimuthCount, fullDirectionCount: 3 * radialCount * azimuthCount};
}

/** @returns {SkyAngularFrameState} */
export function thetaState() {
	return {
		nodes: [],
		unresolvedWitnesses: [],
		completedBatches: 0,
		expectedCount: 0,
		matrixComplete: false,
		partialCountsUnavailable: false,
	};
}

/** Compact the unchanged incident solver result in deterministic task order.
 * @param {SkyVolumeWorkerRow} row @param {SkyVolumeJ2Target} target @param {number} index
 * @param {number|null} mirrorOf @returns {SkyVolumeJ2Node}
 */
function compact(row, target, index, mirrorOf) {
	return {
		targetId: target.id,
		index,
		mirrorOf,
		direction: row.result.geometry.direction,
		channels: row.result.channels,
		branch: row.result.geometry.branch,
		elapsedMilliseconds: row.elapsedMilliseconds,
		mediumEvaluations: row.result.methods.reduce((sum, m) => sum + m.mediumEvaluations, 0),
		outerEvaluations: row.result.methods.reduce((sum, m) => sum + m.outerEvaluations, 0),
	};
}

/** The caller writes each completed batch before another batch begins. The
 * unchanged pool owns at most four workers and always joins them before exit.
 * @param {SkyAngularThetaInput} input @param {SkyAngularThetaCase} candidate
 * @param {SkyAngularFrameState} state @param {SkyAngularFrameExecutionOptions} options
 * @returns {Promise<{groups:SkyVolumeJ2Group[],rows:SkyVolumeJ2Row[],checks:SkyVolumeJ2Check[]}>}
 */
export async function executeTheta(input, candidate, state, options) {
	const {spec, target} = input,
		channels = [0, 8];
	const groups = thetaGroups(
		spec.planet.bottomRadiusMeters,
		target.origin,
		candidate.radialCount,
		candidate.azimuthCount,
	);
	assert.equal(groups.length * 2, candidate.fullDirectionCount);
	const mirrorIndices = [0, groups.length - 1];
	const addresses = [
		...groups.map((_, index) => ({index, mirrorOf: /** @type {number|null} */ (null)})),
		...mirrorIndices.map((index) => ({index, mirrorOf: index})),
	];
	state.expectedCount = addresses.length;
	const pool = createVolumeWorkerPool(spec, channels, {
		workerCount: 4,
		deadlineEpochMilliseconds: options.deadlineEpochMilliseconds,
		guard: options.guard,
	});
	try {
		for (let offset = 0; offset < addresses.length; offset += 256) {
			options.guard();
			const batch = addresses.slice(offset, offset + 256);
			const tasks = batch.map((address) => {
				const group = groups[address.index],
					local = address.mirrorOf === null ? group.incident.direction : group.incident.mirror;
				assert.ok(local);
				return {
					id:
						candidate.stage +
						':' +
						address.index +
						':' +
						(address.mirrorOf === null ? 'representative' : 'mirror'),
					origin: target.origin,
					direction: incidentWorld(target.origin, local),
				};
			});
			state.partialCountsUnavailable = true;
			const evaluated = await pool.evaluate(tasks);
			const nodes = evaluated.map((row, i) => {
				assert.equal(row.id, tasks[i].id);
				assert.deepEqual(row.result.geometry.direction, tasks[i].direction);
				if (!row.result.resolved && state.unresolvedWitnesses.length < 8)
					state.unresolvedWitnesses.push(row.result);
				return compact(row, target, batch[i].index, batch[i].mirrorOf);
			});
			state.nodes.push(...nodes);
			state.completedBatches++;
			state.partialCountsUnavailable = false;
			options.onBatch(nodes, state.nodes.length, state.expectedCount);
			for (const [i, node] of nodes.entries()) assert.equal(node.branch, groups[batch[i].index].branch);
			if (evaluated.some((row) => !row.result.resolved)) break;
		}
	} finally {
		await pool.close();
	}
	const representatives = state.nodes.filter((node) => node.mirrorOf === null);
	const rows = sumVolumeJ2(spec, target, channels, groups, representatives);
	const checks = assessVolumeJ2(spec, [target], channels, state.nodes, [], [rows], [mirrorIndices]);
	state.matrixComplete =
		state.nodes.length === state.expectedCount && checks.every((check) => check.state === 'passed');
	return {groups, rows, checks};
}
