import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {freemem} from 'node:os';
import {gunzipSync} from 'node:zlib';
import {checkedAbsolute, createRun, identity, readRepository, storage, verifyRun} from '../io/files.mjs';
import {loadInputs} from '../execution.mjs';
import {extractBoundary, loadSpectra, measurements} from '../processing.mjs';
import {deriveProfile} from '../numerics/profile.js';
import {validateChannelDiagnostics} from './capture/diagnostics.js';
import {admitPhysicalReferenceChannel} from './reference/physical/admission.mjs';
import {readRegistration} from './registration/run.mjs';
import {admitJob} from './resources.mjs';

const MiB = 1024 ** 2;
const rules = ['gauss4', 'gauss8', 'gauss8-split', 'simpson8', 'simpson16', 'simpson32'];
const sourcePaths = [
	'experiments/sky-accuracy-dials/continuation/j1-assessment.mjs',
	'experiments/sky-accuracy-dials/continuation/j1-assessment/types.d.ts',
	'experiments/sky-accuracy-dials/continuation/reference/physical/admission.mjs',
	'experiments/sky-accuracy-dials/continuation/capture/diagnostics.js',
	'experiments/sky-accuracy-dials/continuation/registration/run.mjs',
	'experiments/sky-accuracy-dials/continuation/resources.mjs',
	'experiments/sky-accuracy-dials/continuation/allocations.mjs',
	'experiments/sky-accuracy-dials/continuation/invalid-evidence.mjs',
	'experiments/sky-accuracy-dials/io/files.mjs',
	'experiments/sky-accuracy-dials/execution.mjs',
	'experiments/sky-accuracy-dials/inputs.mjs',
	'experiments/sky-accuracy-dials/processing.mjs',
	'experiments/sky-accuracy-dials/analysis/boundary.mjs',
	'experiments/sky-accuracy-dials/numerics/profile.js',
	'experiments/sky-accuracy-dials/numerics/math.js',
];

/** Read only an exactly sealed artifact. @param {SkyJ1AssessmentParent} parent @param {string} name @returns {Buffer} */
function bytes(parent, name) {
	const artifact = parent.seal.artifacts.find((item) => item.path === `${parent.run}/${name}`);
	assert.ok(artifact, `Missing sealed artifact ${name}.`);
	return readRepository(artifact.path, artifact);
}

/** Authenticate one accepted source without allocating evidence. @param {string} run @param {string} registration @returns {SkyJ1AssessmentParent} */
function parent(run, registration) {
	const id = verifyRun(run);
	/** @type {SkyJ1AssessmentSeal} */ const seal = JSON.parse(readRepository(id.path, id).toString());
	assert.equal(seal.state, 'accepted');
	assert.equal(seal.run, run);
	assert.equal(seal.recipe.parameters.continuationRegistration, registration);
	assert.equal(seal.recipe.parameters.phase, 'C1');
	return {run, identity: id, seal};
}

/** Authenticate the frozen executable using bounded streaming memory. @param {DialContinuationToolIdentity} expected @returns {Promise<void>} */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let count = 0;
	for await (const chunk of createReadStream(checkedAbsolute(process.execPath))) {
		hash.update(chunk);
		count += chunk.length;
	}
	assert.equal(count, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Reproduce the complete six-method allowance; per-method values alone are not total references.
 * @param {readonly SkyContinuationProbeDiagnostic[]} rows @returns {SkyContinuationProbeDiagnostic}
 */
function envelope(rows) {
	assert.equal(rows.length, 7);
	const methods = new Map(rows.map((row) => [row.methodId, row]));
	assert.equal(methods.size, 7);
	for (const rule of [...rules, 'reference-envelope']) assert.ok(methods.has(rule));
	const a = methods.get('gauss8-split'),
		b = methods.get('simpson32'),
		result = methods.get('reference-envelope');
	const g0 = Math.abs(methods.get('gauss8').value - methods.get('gauss4').value);
	const g1 = Math.abs(a.value - methods.get('gauss8').value);
	const s0 = Math.abs(methods.get('simpson16').value - methods.get('simpson8').value);
	const s1 = Math.abs(b.value - methods.get('simpson16').value);
	const difference = Math.abs(a.value - b.value),
		tolerance = 1e-9 + 1e-6 * Math.max(Math.abs(a.value), Math.abs(b.value));
	const reasons = [];
	if (g1 > Math.max(tolerance, g0)) reasons.push('Gauss correction did not shrink.');
	if (s1 > Math.max(tolerance, s0)) reasons.push('Simpson correction did not shrink.');
	if (difference > 2 * tolerance)
		reasons.push('Independent integration rules disagree above the component tolerance.');
	if (rules.some((rule) => methods.get(rule).errorAllowance === null))
		reasons.push('At least one optical-depth prefix is unresolved.');
	assert.equal(result.value, a.value);
	assert.deepEqual(result.limitations ?? [], reasons);
	assert.equal(
		result.errorAllowance,
		reasons.length ? null : 2 * Math.max(g1, s1, difference) + Math.max(a.errorAllowance, b.errorAllowance),
	);
	return result;
}

/** Authenticate H's controls, channels, field support and every retained method/envelope.
 * @param {SkyJ1AssessmentParent} source @param {DialContinuationRegistrationRead} registration
 * @param {DialInputs} inputs @param {string} caseId @param {() => void} progress @returns {SkyJ1AssessmentCapture}
 */
function capture(source, registration, inputs, caseId, progress) {
	assert.equal(source.seal.recipe.parameters.jobKind, 'gpu');
	assert.equal(source.seal.recipe.parameters.scope, 'screen');
	const loaded = loadSpectra(source.run),
		control = loaded.control;
	assert.equal(loaded.caseId, caseId);
	const candidate = registration.record.constructionCases.find((item) => item.id === caseId);
	assert.ok(candidate);
	const profile = deriveProfile(inputs.native48, {
		...candidate.controls,
		viewIntervals: control.controls.viewIntervals,
	});
	assert.deepEqual(control.buildRequest, profile.buildRequest);
	assert.deepEqual(control.controls, profile.controls);
	assert.deepEqual(control.channels, registration.record.scopes.screen.channels);
	assert.deepEqual(
		control.scenes,
		inputs.scenes.filter((scene) => registration.record.scopes.screen.times.includes(scene.time)),
	);
	assert.deepEqual(control.continuation, {
		finalFirstOrder: candidate.finalFirstOrder,
		referenceMode: 'component',
		probes: registration.probes,
		probeScenes: registration.probeScenes,
	});
	/** @type {SkyContinuationAnalysisChannel[]} */ const channels = [];
	/** @type {DialFileIdentity[]} */ const diagnostics = [];
	/** @type {Map<string, SkyContinuationProbeDiagnostic>} */ const envelopes = new Map();
	for (const channel of control.channels) {
		progress();
		/** @type {SkyContinuationAnalysisChannel} */ const metadata = JSON.parse(
			bytes(source, `channel-${String(channel).padStart(2, '0')}.json`).toString(),
		);
		assert.equal(metadata.channel, channel);
		assert.deepEqual(
			metadata.fieldChecks.map((field) => field.fieldId),
			['J1', 'J2', 'J3', 'J4'],
		);
		channels.push(metadata);
		assert.equal(Boolean(metadata.diagnosticArtifact), registration.record.scopes.probeChannels.includes(channel));
		if (!metadata.diagnosticArtifact) continue;
		const artifact = metadata.diagnosticArtifact;
		assert.ok(
			source.seal.artifacts.some(
				(item) =>
					item.path === artifact.path &&
					item.byteLength === artifact.byteLength &&
					item.sha256 === artifact.sha256,
			),
		);
		assert.ok(artifact.path.startsWith(`${source.run}/`) && artifact.path.endsWith('-diagnostics.json.gz'));
		const record = validateChannelDiagnostics(
			JSON.parse(gunzipSync(readRepository(artifact.path, artifact), {maxOutputLength: 2 * MiB}).toString()),
		);
		diagnostics.push(artifact);
		const grouped = candidate.finalFirstOrder === 'factored' ? 'grouped-factored-n1' : 'grouped';
		assert.equal(record.probes.length, 40 * 4 * 2 * 7);
		for (const probe of registration.probes)
			for (const representation of ['cumulative', grouped])
				for (let order = 1; order <= 4; order++) {
					const rows = record.probes.filter(
						(row) =>
							row.probeId === probe.probeId &&
							row.order === order &&
							row.representationId === representation,
					);
					for (const row of rows) {
						assert.equal(row.time, probe.time);
						assert.equal(row.gridX, probe.gridX);
						assert.equal(row.gridY, probe.gridY);
						assert.equal(
							row.sceneId,
							registration.probeScenes.find((scene) => scene.time === probe.time).id,
						);
					}
					envelopes.set(`${channel}/${probe.probeId}/${representation}/${order}`, envelope(rows));
				}
	}
	/** @type {{execution: SkyGpuHostResult}} */ const execution = JSON.parse(
		bytes(source, 'execution.json').toString(),
	);
	assert.ok(execution.execution.executionSucceeded && execution.execution.browser);
	const coordinateSha256 = execution.execution.browser.plan.coordinateSha256;
	assert.match(coordinateSha256, /^[a-f0-9]{64}$/u);
	return {parent: source, loaded, coordinateSha256, channels, envelopes, diagnostics};
}

/** Verify the exact final-J1 causal intervention before interpreting any contrast.
 * @param {SkyJ1AssessmentCapture} raw @param {SkyJ1AssessmentCapture} factored @returns {SkyContinuationCausalResult}
 */
function causalParity(raw, factored) {
	for (const key of ['buildRequest', 'controls', 'scenes', 'channels'])
		assert.deepEqual(raw.loaded.control[key], factored.loaded.control[key]);
	assert.equal(raw.coordinateSha256, factored.coordinateSha256);
	let higherOrderChecks = 0,
		rawScalarChecks = 0;
	for (const [index, channel] of raw.channels.entries())
		for (let order = 1; order < 4; order++) {
			const a = channel.fieldChecks[order],
				b = factored.channels[index].fieldChecks[order];
			assert.equal(a.count, b.count);
			assert.equal(a.pureSha256, b.pureSha256);
			higherOrderChecks++;
		}
	for (const q of raw.loaded.control.controls.viewIntervals)
		for (const solar of raw.loaded.control.controls.solarInterpolations)
			for (let order = 1; order <= 4; order++) {
				const a = extractBoundary(raw.loaded, 'cumulative', q, solar, order),
					b = extractBoundary(factored.loaded, 'cumulative', q, solar, order);
				assert.equal(a.values.length, b.values.length);
				for (const [index, value] of a.values.entries()) {
					assert.ok(Object.is(value, b.values[index]));
					rawScalarChecks++;
				}
			}
	return {
		assessed: true,
		passed: true,
		parents: [raw.parent.identity, factored.parent.identity],
		coordinateParity: true,
		higherOrderChecks,
		higherOrderParity: true,
		rawScalarChecks,
		rawCumulativeParity: true,
		interpretation:
			'Only grouped final-view J1 changes. Matched J2-J4 fields and raw cumulative spectra remain exact; this is not regenerated higher-order density factorization.',
	};
}

/** Authenticate all physical rows, including explicit unresolved or unattempted entries.
 * @param {SkyJ1AssessmentParent} source @param {DialContinuationRegistrationRead} registration
 * @returns {SkyPhysicalReferenceReport}
 */
function physicalReference(source, registration) {
	assert.equal(source.seal.recipe.parameters.jobKind, 'cpu');
	assert.equal(source.seal.recipe.parameters.scope, 'component');
	assert.equal(source.seal.result.caseId, 'physical-j1-reference');
	/** @type {SkyJ1AssessmentPhysicalControl} */ const control = JSON.parse(bytes(source, 'control.json').toString());
	assert.deepEqual(control.registration, registration.seal);
	assert.deepEqual(control.input, registration.record.inputs);
	assert.deepEqual(control.channels, registration.record.scopes.probeChannels);
	const expected = registration.record.probeRays.map((ray, index) => ({
		id: registration.probes[index].probeId,
		time: ray.time,
		gridX: ray.gridX,
		gridY: ray.gridY,
		ray: {origin: ray.origin, direction: ray.direction, length: ray.lengthMeters},
	}));
	assert.deepEqual(control.probes, expected);
	/** @type {SkyPhysicalReferenceReport} */ const report = JSON.parse(bytes(source, 'reference.json').toString());
	assert.equal(report.schemaId, 'sky-independent-physical-j1-reference-v1');
	assert.equal(report.units, 'W m^-2 sr^-1 nm^-1');
	if (control.profile === undefined) {
		assert.equal(
			source.run,
			'tmp/experiments/sky-accuracy-dials/runs/00102-c1-physical-j1',
			'Only the original standard pilot predates explicit work-profile telemetry.',
		);
		assert.equal(report.profile, undefined);
	} else {
		assert.ok(['standard', 'simpson-expanded-medium'].includes(control.profile));
		assert.equal(report.profile, control.profile);
	}
	assert.equal(report.rows.length, 160);
	assert.equal(report.probes.length, 40);
	for (const [probeIndex, probe] of expected.entries()) {
		const detail = report.probes[probeIndex];
		assert.equal(detail.probeId, probe.id);
		assert.ok(detail.methods.length === 0 || detail.methods.length === 2);
		for (const [index, channel] of control.channels.entries()) {
			const row = report.rows[probeIndex * 4 + index];
			assert.equal(row.probeId, probe.id);
			assert.equal(row.time, probe.time);
			assert.equal(row.gridX, probe.gridX);
			assert.equal(row.gridY, probe.gridY);
			assert.equal(row.channel, channel);
			if (detail.methods.length) {
				const [a, b] = detail.methods,
					admitted = admitPhysicalReferenceChannel(a, b, index);
				assert.equal(row.gaussWatts, a.values?.[index] ?? null);
				assert.equal(row.simpsonWatts, b.values?.[index] ?? null);
				for (const key of ['resolved', 'methodDifferenceWatts', 'empiricalAllowanceWatts', 'reasons'])
					assert.deepEqual(row[key], admitted[key]);
			} else {
				assert.equal(row.resolved, false);
				assert.equal(row.gaussWatts, null);
				assert.equal(row.simpsonWatts, null);
				assert.equal(row.methodDifferenceWatts, null);
				assert.equal(row.empiricalAllowanceWatts, null);
				assert.ok(row.reasons.length > 0);
			}
		}
	}
	assert.equal(
		report.resolved,
		report.rows.every((row) => row.resolved),
	);
	return report;
}

/** Sum nonnegative numerical allowances without turning a missing value into zero. @param {readonly (number|null)[]} values @returns {number|null} */
function allowance(values) {
	return values.some((value) => value === null) ? null : values.reduce((sum, value) => sum + value, 0);
}

/** Enforce a floating-point algebraic identity independently of empirical reference uncertainty. @param {number} error @param {readonly number[]} terms @returns {void} */
function roundoffIdentity(error, terms) {
	assert.ok(
		Math.abs(error) <= 256 * Number.EPSILON * Math.max(1e-30, ...terms.map(Math.abs)),
		'Residual decomposition failed its roundoff identity.',
	);
}

/** Evaluate one representation against the shared physical reference and observation.
 * @param {SkyContinuationProbeDiagnostic} first @param {SkyContinuationProbeDiagnostic} fourth
 * @param {number|null} physical @param {number|null} physicalAllowance @param {number} measured
 * @returns {SkyJ1AssessmentCase}
 */
function caseValues(first, fourth, physical, physicalAllowance, measured) {
	const numerical = physical === null ? null : first.value - physical;
	const remaining = physical === null ? null : fourth.value - first.value + physical - measured;
	const residual = fourth.value - measured;
	const identityResidual = physical === null ? null : residual - (numerical + remaining);
	if (identityResidual !== null) {
		roundoffIdentity(identityResidual, [first.value, fourth.value, physical, measured]);
		roundoffIdentity(residual ** 2 - (numerical ** 2 + remaining ** 2 + 2 * numerical * remaining), [
			residual ** 2,
			numerical ** 2,
			remaining ** 2,
			2 * numerical * remaining,
		]);
	}
	return {
		firstOrderW: first.value,
		fourthOrderW: fourth.value,
		firstOrderAllowanceW: first.errorAllowance,
		fourthOrderAllowanceW: fourth.errorAllowance,
		numericalW: numerical,
		absoluteFirstOrderErrorW: numerical === null ? null : Math.abs(numerical),
		numericalAllowanceW: allowance([first.errorAllowance, physicalAllowance]),
		residualW: residual,
		remainingW: remaining,
		remainingAllowanceW: allowance([fourth.errorAllowance, first.errorAllowance, physicalAllowance]),
		crossTermW2: numerical === null ? null : 2 * numerical * remaining,
		identityResidualW: identityResidual,
	};
}

/** Frozen numerical improvement gates; an unavailable reference is never a failed numerical result.
 * @param {number|null} reduction @param {number|null} uncertainty @param {DialContinuationScientificGates} gates @returns {boolean|null}
 */
function qualifies(reduction, uncertainty, gates) {
	return reduction === null || uncertainty === null
		? null
		: reduction > 0 &&
				uncertainty <= gates.maximumAllowanceToReduction * reduction &&
				reduction > gates.strictReductionAllowanceMultiplier * uncertainty;
}

/** Compare every frozen scalar without pruning unresolved members.
 * @param {DialContinuationRegistrationRead} registration @param {SkyPhysicalReferenceReport} physical
 * @param {SkyJ1AssessmentCapture} raw @param {SkyJ1AssessmentCapture} factored @param {DialAnalysisBoundary} measured
 * @returns {SkyJ1AssessmentRow[]}
 */
function assessmentRows(registration, physical, raw, factored, measured) {
	return physical.rows.map((row, index) => {
		const geometry = registration.record.probeRays[Math.floor(index / 4)];
		const get = (
			/** @type {SkyJ1AssessmentCapture} */ source,
			/** @type {string} */ representation,
			/** @type {number} */ order,
		) => {
			const value = source.envelopes.get(`${row.channel}/${row.probeId}/${representation}/${order}`);
			assert.ok(value);
			return value;
		};
		const firstRaw = get(raw, 'grouped', 1),
			fourthRaw = get(raw, 'grouped', 4),
			firstFactored = get(factored, 'grouped-factored-n1', 1),
			fourthFactored = get(factored, 'grouped-factored-n1', 4);
		const timeIndex = measured.times.indexOf(row.time),
			channelIndex = measured.channels.indexOf(row.channel);
		assert.ok(timeIndex >= 0 && channelIndex >= 0);
		const observation =
			measured.values[(timeIndex * 81 + row.gridY * 9 + row.gridX) * measured.channels.length + channelIndex];
		assert.ok(Number.isFinite(observation));
		const value = row.resolved ? (row.gaussWatts + row.simpsonWatts) / 2 : null,
			u = row.resolved ? row.empiricalAllowanceWatts : null;
		const a = caseValues(firstRaw, fourthRaw, value, u, observation),
			b = caseValues(firstFactored, fourthFactored, value, u, observation);
		const reduction =
			a.absoluteFirstOrderErrorW === null ? null : a.absoluteFirstOrderErrorW - b.absoluteFirstOrderErrorW;
		const reductionAllowance = allowance([a.numericalAllowanceW, b.numericalAllowanceW]);
		const higherOrderDifference = b.fourthOrderW - b.firstOrderW - (a.fourthOrderW - a.firstOrderW);
		roundoffIdentity(higherOrderDifference, [a.fourthOrderW, a.firstOrderW, b.fourthOrderW, b.firstOrderW]);
		if (value !== null)
			roundoffIdentity(b.remainingW - a.remainingW - higherOrderDifference, [
				a.remainingW,
				b.remainingW,
				value,
				observation,
			]);
		return {
			probeId: row.probeId,
			time: row.time,
			gridX: row.gridX,
			gridY: row.gridY,
			channel: row.channel,
			elevationDegrees: geometry.elevationDegrees,
			sunSeparationDegrees: geometry.sunSeparationDegrees,
			measuredW: observation,
			physicalW: value,
			physicalAllowanceW: u,
			reasons: [
				...new Set([
					...row.reasons,
					...[firstRaw, fourthRaw, firstFactored, fourthFactored].flatMap((item) => item.limitations ?? []),
				]),
			],
			raw: a,
			factored: b,
			reductionW: reduction,
			reductionAllowanceW: reductionAllowance,
			reductionQualified: qualifies(reduction, reductionAllowance, registration.record.scientificGates),
			higherOrderDifferenceW: higherOrderDifference,
			higherOrderDifferenceAllowanceW: allowance([
				firstRaw.errorAllowance,
				fourthRaw.errorAllowance,
				firstFactored.errorAllowance,
				fourthFactored.errorAllowance,
			]),
		};
	});
}

/** Euclidean norm with complete coverage. @param {readonly (number|null)[]} values @returns {number|null} */
function norm(values) {
	return values.some((value) => value === null)
		? null
		: Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

/** Retain signed compensation and its exact SSE identity for one representation.
 * @param {readonly SkyJ1AssessmentCase[]} values @returns {SkyJ1AssessmentCaseGroup}
 */
function caseGroup(values) {
	const complete = values.every((value) => value.numericalAllowanceW !== null && value.remainingAllowanceW !== null);
	const residualSse = values.reduce((sum, value) => sum + value.residualW ** 2, 0);
	const numericalSse = complete ? values.reduce((sum, value) => sum + value.numericalW ** 2, 0) : null;
	const remainingSse = complete ? values.reduce((sum, value) => sum + value.remainingW ** 2, 0) : null;
	const crossTerm = complete ? values.reduce((sum, value) => sum + value.crossTermW2, 0) : null;
	const identityResidual = complete ? residualSse - (numericalSse + remainingSse + crossTerm) : null;
	if (complete) roundoffIdentity(identityResidual, [residualSse, numericalSse, remainingSse, crossTerm]);
	return {
		numericalNormW: complete ? Math.sqrt(numericalSse) : null,
		numericalAllowanceNormW: norm(values.map((value) => value.numericalAllowanceW)),
		numericalSseW2: numericalSse,
		remainingSseW2: remainingSse,
		crossTermW2: crossTerm,
		residualSseW2: residualSse,
		componentRmseMilliwatt: 1000 * Math.sqrt(residualSse / values.length),
		identityResidualW2: identityResidual,
		remainingAllowanceNormW: norm(values.map((value) => value.remainingAllowanceW)),
	};
}

/** Full frozen groups plus descriptive geometry; no grouping silently removes unresolved rows.
 * @param {readonly SkyJ1AssessmentRow[]} rows @param {DialContinuationRegistrationRead} registration @returns {SkyJ1AssessmentGroup[]}
 */
function assessmentGroups(rows, registration) {
	/** @type {Map<string, readonly SkyJ1AssessmentRow[]>} */ const groups = new Map([['all-frozen-probes', rows]]);
	for (const time of registration.record.scopes.probeTimes) {
		groups.set(
			`time/${time}`,
			rows.filter((row) => row.time === time),
		);
		for (const channel of registration.record.scopes.probeChannels)
			groups.set(
				`time/${time}/channel/${channel}`,
				rows.filter((row) => row.time === time && row.channel === channel),
			);
	}
	for (const channel of registration.record.scopes.probeChannels)
		groups.set(
			`channel/${channel}`,
			rows.filter((row) => row.channel === channel),
		);
	groups.set(
		'near-sun-at-most-15deg',
		rows.filter((row) => row.sunSeparationDegrees <= 15),
	);
	groups.set(
		'low-elevation-at-most-20deg',
		rows.filter((row) => row.elevationDegrees <= 20),
	);
	groups.set(
		'zenith-at-least-75deg',
		rows.filter((row) => row.elevationDegrees >= 75),
	);
	return [...groups]
		.filter(([, values]) => values.length)
		.map(([id, values]) => {
			const raw = caseGroup(values.map((row) => row.raw)),
				factored = caseGroup(values.map((row) => row.factored));
			const reduction =
				raw.numericalNormW === null || factored.numericalNormW === null
					? null
					: raw.numericalNormW - factored.numericalNormW;
			const uncertainty = norm(values.map((row) => row.reductionAllowanceW));
			return {
				id,
				count: values.length,
				resolvedCount: values.filter(
					(row) => row.raw.remainingAllowanceW !== null && row.factored.remainingAllowanceW !== null,
				).length,
				raw,
				factored,
				reductionW: reduction,
				reductionAllowanceW: uncertainty,
				reductionQualified: qualifies(reduction, uncertainty, registration.record.scientificGates),
				higherOrderDifferenceNormW: norm(values.map((row) => row.higherOrderDifferenceW)),
				higherOrderDifferenceAllowanceNormW: norm(values.map((row) => row.higherOrderDifferenceAllowanceW)),
				reasons: [...new Set(values.flatMap((row) => row.reasons))],
			};
		});
}

/** Flatten nested result records into a compact column table; null remains an explicit cell.
 * @param {readonly object[]} rows @returns {string}
 */
function csv(rows) {
	/** @param {object} row @param {string} [prefix] @returns {Record<string,unknown>} */
	const flatten = (row, prefix = '') =>
		Object.fromEntries(
			Object.entries(row).flatMap(([key, value]) =>
				value !== null && typeof value === 'object' && !Array.isArray(value)
					? Object.entries(flatten(value, `${prefix}${key}.`))
					: [[`${prefix}${key}`, value]],
			),
		);
	const records = rows.map((row) => flatten(row)),
		columns = Object.keys(records[0]);
	/** @param {unknown} value @returns {string} */
	const cell = (value) =>
		JSON.stringify(value === null ? 'null' : Array.isArray(value) ? value.join(' | ') : String(value));
	return `${columns.map(cell).join(',')}\n${records.map((row) => columns.map((key) => cell(row[key])).join(',')).join('\n')}\n`;
}

/** Assess the frozen physical-J1 causal pair without executing a new numerical solver.
 * @param {string} registrationRun - Accepted immutable C0 control.
 * @param {string} physicalRun - Accepted standard or explicitly expanded physical reference.
 * @param {string} rawHRun - Accepted raw H screen capture.
 * @param {string} factoredHRun - Accepted final-J1-factored H screen capture.
 * @returns {Promise<DialExecutionResult>} Authenticated compact diagnostic; unresolved accuracy remains explicit.
 */
export async function assessPhysicalJ1(registrationRun, physicalRun, rawHRun, factoredHRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const planSnapshot = {...registration.record.plan, path: `${registration.run}/continuation-plan.md`};
	readRepository(planSnapshot.path, planSnapshot);
	assert.deepEqual(registration.record.scopes.probeChannels, [0, 8, 24, 30]);
	assert.equal(registration.probes.length, 40);
	const admission = admitJob(registration, 'cpu', 'component', 2.5 * MiB, 'C1');
	await authenticateNode(registration.record.host.node);
	const sources = sourcePaths.map((path) => identity(path));
	const parents = [physicalRun, rawHRun, factoredHRun].map((path) => parent(path, registration.run));
	assert.equal(new Set(parents.map((item) => item.run)).size, 3);
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const inputs = loadInputs(),
		measured = measurements();
	/** @type {DialDerivation} */ const recipe = {
		parents: [
			registration.seal,
			registration.record.inputs,
			planSnapshot,
			measured.sourceIdentity,
			...parents.map((item) => item.identity),
			...sources,
			...(admission.usage.invalidEvidence ?? []).map((item) => item.seal),
			...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		],
		operation:
			'Authenticate physical J1, the exact H causal pair and all six-method fixed-field envelopes. Assess first-order absolute/norm errors with combined empirical allowances and decompose biased-probe N4 measurement residuals, retaining unresolved rows without pruning.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C1',
			caseId: 'physical-j1-assessment',
			admission,
			node: registration.record.host.node,
			sources,
			physicalRun,
			rawHRun,
			factoredHRun,
			channels: registration.record.scopes.probeChannels,
			equations: {
				physical:
					'P=(Gauss+Simpson)/2 only on admitted physical rows; use the admitted physical empirical allowance.',
				numerical:
					'n=L1-P; Un=U1+UP; D=norm(nRaw)-norm(nFactored); U_D=norm(U1Raw+U1Factored+2*UP); qualify only complete groups with U_D<=0.2D and D>2U_D.',
				compensation:
					'r=L4-M; p=(L4-L1+P)-M; r=n+p; SSE(r)=SSE(n)+SSE(p)+2*dot(n,p); Up=U4+U1+UP. p includes higher-order numerical and physical/observation discrepancies.',
				pair: 'pFactored-pRaw=(L4Factored-L1Factored)-(L4Raw-L1Raw); assess exact field/hash parity and floating-point algebra separately from summed empirical allowances.',
			},
		},
	};
	const initialBytes = storage().retainedBytes,
		run = createRun('c1-j1-assess', recipe),
		definition = identity(`${run.path}/definition.json`);
	/** @type {DialFileIdentity|null} */ let seal = null;
	let lastProgress = 0;
	const guard = () => {
		const current = run.guard();
		assert.ok(Date.now() - started < admission.timeoutMilliseconds, 'Assessment exceeds remaining CPU time.');
		assert.ok(freemem() >= registration.budgets.hostHeadroomBytes, 'Assessment host headroom floor reached.');
		assert.ok(
			current.retainedBytes - initialBytes < admission.allocatedBytes - 256 * 1024,
			'Assessment must retain its seal/failure reserve.',
		);
		assert.ok(
			current.retainedBytes - registration.initialStorage.retainedBytes <= registration.budgets.newRetainedBytes,
		);
		if (Date.now() - lastProgress > 25000) {
			run.progress('assess', 'Authenticating references and evaluating the frozen component decomposition.');
			lastProgress = Date.now();
		}
	};
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @returns {DialFileIdentity} */
	const write = (
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the authenticated assessment recipe and retained numerical/reference values.`,
		},
	) => {
		guard();
		const data = Buffer.isBuffer(value)
			? value
			: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
		assert.ok(data.length + storage().retainedBytes - initialBytes < admission.allocatedBytes - 256 * 1024);
		return run.write(name, data, derivation);
	};
	try {
		guard();
		const physical = physicalReference(parents[0], registration);
		const raw = capture(parents[1], registration, inputs, 'r0', guard),
			factored = capture(parents[2], registration, inputs, 'h-factored', guard);
		const causal = causalParity(raw, factored),
			rows = assessmentRows(registration, physical, raw, factored, measured),
			groups = assessmentGroups(rows, registration);
		const limitations = [
			'The 40 rays were selected using baseline point errors plus geometric/mandatory probes; their four-channel component RMSE is biased and is not a full B1, 31-channel or general N4 claim.',
			'Physical J1 and fixed-field reference allowances are empirical numerical envelopes, not rigorous bounds, confidence intervals, or model/observation uncertainty.',
			'Fixed-field envelopes retain Float32 recurrence fields and their reconstruction. Only final-view integration and optical-depth prefixes are resolved by those envelopes.',
			'The remaining residual p includes higher-order numerical error, unresolved scattering orders, common physical-model discrepancy and measurement/geometry discrepancy; it is not physics-only.',
			'Negative cross terms diagnose cancellation on this finite measured sample. Removing J1 numerical error need not improve the measured N4 fit.',
			'Null physical estimates, allowances and aggregate decompositions remain unqualified. Group membership never drops unresolved rows. Geometric groups overlap and must not be summed.',
			'Historical standard pilot compatibility is restricted to the exact original 00102 run; missing profile/pass telemetry is not fabricated.',
		];
		write('rows.json', rows);
		write('rows.csv', csv(rows));
		write('groups.json', groups);
		write('groups.csv', csv(groups));
		const summary = {
			schemaId: 'sky-continuation-physical-j1-assessment-v1',
			units: 'W m^-2 sr^-1 nm^-1',
			causal,
			physicalResolvedCount: physical.rows.filter((row) => row.resolved).length,
			completeComparisonCount: rows.filter(
				(row) =>
					row.reductionAllowanceW !== null &&
					row.raw.remainingAllowanceW !== null &&
					row.factored.remainingAllowanceW !== null,
			).length,
			scalarReductionQualifiedCount: rows.filter((row) => row.reductionQualified === true).length,
			groupCount: groups.length,
			groupReductionQualifiedCount: groups.filter((group) => group.reductionQualified === true).length,
			maximumHigherOrderDifferenceW: Math.max(...rows.map((row) => Math.abs(row.higherOrderDifferenceW))),
			overall: groups[0],
			sources: parents.map((item) => item.identity),
			diagnosticArtifacts: [...raw.diagnostics, ...factored.diagnostics],
			limitations,
		};
		write('summary.json', summary);
		const overall = groups[0],
			fmt = (/** @type {number|null} */ value) => (value === null ? 'unresolved' : (1000 * value).toPrecision(8));
		write(
			'report.md',
			`# Physical J1 assessment and measured residual compensation\n\nCausal parity passed. ${summary.physicalResolvedCount}/160 physical references and ${summary.completeComparisonCount}/160 complete comparisons resolve. ${summary.groupReductionQualifiedCount}/${summary.groupCount} complete or explicitly unresolved groups qualify the registered J1 reduction gate.\n\nOn all frozen probes, J1 error norm: raw ${fmt(overall.raw.numericalNormW)} → factored ${fmt(overall.factored.numericalNormW)} mW. Four-channel biased-probe N4 RMSE: ${overall.raw.componentRmseMilliwatt.toPrecision(9)} → ${overall.factored.componentRmseMilliwatt.toPrecision(9)} mW. These scores are not the ordinary screen/full B1 score.\n\nFor each representation, r=L4−M, n=L1−P and p=L4−L1+P−M. The retained signed decomposition verifies r=n+p and ||r||²=||n||²+||p||²+2n·p. The p term includes higher-order numerical and physical/observation discrepancies. Matched higher-order contribution differences are within the checked floating-point allowance.\n\n- [Per-probe values and allowances](rows.csv)\n- [Complete groups, signed SSE terms and gates](groups.csv)\n- [Coverage, causal checks and source identities](summary.json)\n\n${limitations.map((item) => `- ${item}`).join('\n')}\n`,
		);
		for (const source of sources)
			write(`sources/${source.path}.txt`, readRepository(source.path, source), {
				parents: [source],
				operation: 'Preserve exact executed assessment/helper source bytes.',
			});
		for (const item of recipe.parents) readRepository(item.path, item);
		await authenticateNode(registration.record.host.node);
		guard();
		seal = run.finish('accepted', {
			jobElapsedMilliseconds: Date.now() - started,
			caseId: 'physical-j1-assessment',
			physicalResolvedCount: summary.physicalResolvedCount,
			completeComparisonCount: summary.completeComparisonCount,
			causal,
			cleanup: run.cleanup(),
		});
	} catch (error) {
		run.finish('failed', {
			jobElapsedMilliseconds: Date.now() - started,
			message: String(error),
			stack: error.stack,
			cleanup: run.cleanup(),
		});
		verifyRun(run.path);
		throw error;
	}
	verifyRun(run.path);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.equal(terminal.state, 'accepted', 'Source/heartbeat failure cannot qualify the assessment.');
	assert.ok(
		seal.byteLength + terminal.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0) <=
			admission.allocatedBytes,
	);
	return {run: run.path, seal, accepted: true};
}
