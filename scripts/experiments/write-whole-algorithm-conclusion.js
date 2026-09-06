import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {classifyWholeAlgorithm} from './benchmark-judgment.js';
import {runExperiment as runB1} from './b1-directional-sky-radiance/run.js';
import {runExperiment as runB2} from './b2-hemispherical-sky-irradiance/run.js';
import {runExperiment as runB3} from './b3-matched-atmosphere-solver/run.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RESULTS = resolve(ROOT, 'references/results/experiments');
const B1_RESULTS = resolve(RESULTS, 'b1-directional-sky-radiance');
const B3_RESULTS = resolve(RESULTS, 'b3-matched-atmosphere-solver');
const B3_RUNNER = resolve(ROOT, 'scripts/experiments/b3-matched-atmosphere-solver');

const PATHS = Object.freeze({
	publishedModels: resolve(B1_RESULTS, 'published-models.tsv'),
	measurements: resolve(B1_RESULTS, 'measurement-boundary.tsv'),
	defaultRules: resolve(ROOT, 'scripts/experiments/whole-algorithm-judgment-rules.json'),
	j2Rules: resolve(ROOT, 'scripts/experiments/whole-algorithm-j2-judgment-rules.json'),
	j3Rules: resolve(ROOT, 'scripts/experiments/whole-algorithm-j3-judgment-rules.json'),
	j4Rules: resolve(ROOT, 'scripts/experiments/whole-algorithm-j4-judgment-rules.json'),
	j5Rules: resolve(ROOT, 'scripts/experiments/whole-algorithm-j5-judgment-rules.json'),
	defaultNativeBoundary: resolve(B1_RESULTS, 'algorithm32-native-15.tsv'),
	defaultBoundary: resolve(B1_RESULTS, 'algorithm32-proposed.tsv'),
	defaultProvenance: resolve(B1_RESULTS, 'algorithm32-boundary-provenance.json'),
	defaultCube: resolve(B3_RESULTS, 'algorithm32-proposed-cube.json'),
	defaultMismatchMap: resolve(B3_RUNNER, 'algorithm32-mismatch-map.json'),
	j2NativeBoundary: resolve(B1_RESULTS, 'algorithm32-j2-native-15.tsv'),
	j2Boundary: resolve(B1_RESULTS, 'algorithm32-j2-proposed.tsv'),
	j2Provenance: resolve(B1_RESULTS, 'algorithm32-j2-boundary-provenance.json'),
	j2Cube: resolve(B3_RESULTS, 'algorithm32-j2-proposed-cube.json'),
	j2MismatchMap: resolve(B3_RUNNER, 'algorithm32-j2-mismatch-map.json'),
	j3NativeBoundary: resolve(B1_RESULTS, 'algorithm32-j3-native-15.tsv'),
	j3Boundary: resolve(B1_RESULTS, 'algorithm32-j3-proposed.tsv'),
	j3Provenance: resolve(B1_RESULTS, 'algorithm32-j3-boundary-provenance.json'),
	j3Cube: resolve(B3_RESULTS, 'algorithm32-j3-proposed-cube.json'),
	j3MismatchMap: resolve(B3_RUNNER, 'algorithm32-j3-mismatch-map.json'),
	j4NativeBoundary: resolve(B1_RESULTS, 'algorithm32-j4-native-15.tsv'),
	j4Boundary: resolve(B1_RESULTS, 'algorithm32-j4-proposed.tsv'),
	j4Provenance: resolve(B1_RESULTS, 'algorithm32-j4-boundary-provenance.json'),
	j4Cube: resolve(B3_RESULTS, 'algorithm32-j4-proposed-cube.json'),
	j4MismatchMap: resolve(B3_RUNNER, 'algorithm32-j4-mismatch-map.json'),
	j5NativeBoundary: resolve(B1_RESULTS, 'algorithm32-j5-native-15.tsv'),
	j5Boundary: resolve(B1_RESULTS, 'algorithm32-j5-proposed.tsv'),
	j5Provenance: resolve(B1_RESULTS, 'algorithm32-j5-boundary-provenance.json'),
	j5Cube: resolve(B3_RESULTS, 'algorithm32-j5-proposed-cube.json'),
	j5MismatchMap: resolve(B3_RUNNER, 'algorithm32-j5-mismatch-map.json'),
	b1Result: resolve(B1_RESULTS, 'result.md'),
	b1Figure5: resolve(B1_RESULTS, 'figures/b1-figure5-relative-error-domes.svg'),
	b2Result: resolve(RESULTS, 'b2-hemispherical-sky-irradiance/result.md'),
	b3Result: resolve(B3_RESULTS, 'result.md'),
	output: resolve(RESULTS, 'algorithm32-whole-algorithm-conclusion.md'),
});

const PROFILE_DEFINITIONS = Object.freeze([
	Object.freeze({
		key: 'default',
		id: 'Algorithm32',
		label: 'Algorithm32 Default',
		role: 'unchanged comparison baseline',
		b1StageKey: 'proposedStage',
		b2ScoreKey: 'proposedScore',
		b2AssessmentKey: 'proposedAssessment',
		b2OutputValidKey: 'proposedOutputValid',
		b3ScoreKey: 'proposed',
		b3AssessmentKey: 'proposedAssessment',
		evidence: Object.freeze([
			['native 15-channel boundary', 'defaultNativeBoundary'],
			['B1/B2 projected boundary', 'defaultBoundary'],
			['B3 prefix cube', 'defaultCube'],
			['boundary provenance', 'defaultProvenance'],
			['judgment rules', 'defaultRules'],
			['B3 mismatch map', 'defaultMismatchMap'],
		]),
	}),
	Object.freeze({
		key: 'j2',
		id: 'Algorithm32-J2',
		label: 'Algorithm32₂',
		role: 'cumulative scattering through order 2',
		b1StageKey: 'proposedJ2Stage',
		b2ScoreKey: 'proposedJ2Score',
		b2AssessmentKey: 'proposedJ2Assessment',
		b2OutputValidKey: 'proposedJ2OutputValid',
		b3ScoreKey: 'proposedJ2',
		b3AssessmentKey: 'proposedJ2Assessment',
		evidence: Object.freeze([
			['native 15-channel boundary', 'j2NativeBoundary'],
			['B1/B2 projected boundary', 'j2Boundary'],
			['B3 prefix cube', 'j2Cube'],
			['boundary provenance', 'j2Provenance'],
			['judgment rules', 'j2Rules'],
			['B3 mismatch map', 'j2MismatchMap'],
		]),
	}),
	Object.freeze({
		key: 'j3',
		id: 'Algorithm32-J3',
		label: 'Algorithm32₃',
		role: 'cumulative scattering through order 3',
		b1StageKey: 'proposedJ3Stage',
		b2ScoreKey: 'proposedJ3Score',
		b2AssessmentKey: 'proposedJ3Assessment',
		b2OutputValidKey: 'proposedJ3OutputValid',
		b3ScoreKey: 'proposedJ3',
		b3AssessmentKey: 'proposedJ3Assessment',
		evidence: Object.freeze([
			['native 15-channel boundary', 'j3NativeBoundary'],
			['B1/B2 projected boundary', 'j3Boundary'],
			['B3 prefix cube', 'j3Cube'],
			['boundary provenance', 'j3Provenance'],
			['judgment rules', 'j3Rules'],
			['B3 mismatch map', 'j3MismatchMap'],
		]),
	}),
	Object.freeze({
		key: 'j4',
		id: 'Algorithm32-J4',
		label: 'Algorithm32₄',
		role: 'cumulative scattering through order 4',
		b1StageKey: 'proposedJ4Stage',
		b2ScoreKey: 'proposedJ4Score',
		b2AssessmentKey: 'proposedJ4Assessment',
		b2OutputValidKey: 'proposedJ4OutputValid',
		b3ScoreKey: 'proposedJ4',
		b3AssessmentKey: 'proposedJ4Assessment',
		evidence: Object.freeze([
			['native 15-channel boundary', 'j4NativeBoundary'],
			['B1/B2 projected boundary', 'j4Boundary'],
			['B3 prefix cube', 'j4Cube'],
			['boundary provenance', 'j4Provenance'],
			['judgment rules', 'j4Rules'],
			['B3 mismatch map', 'j4MismatchMap'],
		]),
	}),
	Object.freeze({
		key: 'j5',
		id: 'Algorithm32-J5',
		label: 'Algorithm32₅',
		role: 'cumulative scattering through order 5',
		b1StageKey: 'proposedJ5Stage',
		b2ScoreKey: 'proposedJ5Score',
		b2AssessmentKey: 'proposedJ5Assessment',
		b2OutputValidKey: 'proposedJ5OutputValid',
		b3ScoreKey: 'proposedJ5',
		b3AssessmentKey: 'proposedJ5Assessment',
		evidence: Object.freeze([
			['native 15-channel boundary', 'j5NativeBoundary'],
			['B1/B2 projected boundary', 'j5Boundary'],
			['B3 prefix cube', 'j5Cube'],
			['boundary provenance', 'j5Provenance'],
			['judgment rules', 'j5Rules'],
			['B3 mismatch map', 'j5MismatchMap'],
		]),
	}),
]);

function fileRecord(path) {
	const bytes = readFileSync(path);
	const normalizedPath = path.replaceAll('\\', '/');
	const normalizedRoot = ROOT.replaceAll('\\', '/');
	return Object.freeze({
		path: normalizedPath.startsWith(`${normalizedRoot}/`)
			? normalizedPath.slice(normalizedRoot.length + 1)
			: normalizedPath,
		bytes: bytes.byteLength,
		sha256: createHash('sha256').update(bytes).digest('hex'),
	});
}

function assessProfile({b1Assessment, b2Assessment, b3Assessment, outputValid}) {
	return classifyWholeAlgorithm({
		outputValid,
		b1: b1Assessment,
		b2: b2Assessment,
		b3: b3Assessment,
	});
}

function requireCompleteRuns(b1, b2, b3) {
	const candidatesComplete = PROFILE_DEFINITIONS.every(
		(definition) =>
			b1[definition.b1StageKey]?.assessment &&
			b2[definition.b2ScoreKey] &&
			b2[definition.b2AssessmentKey] &&
			b3[definition.b3ScoreKey] &&
			b3[definition.b3AssessmentKey],
	);
	const complete =
		b1.accepted &&
		b1.profileComparisonComplete &&
		b2.fullBenchmarkAccepted &&
		b2.comparativeProfilesComplete &&
		b3.accepted &&
		b3.complete &&
		b3.comparativeProfilesComplete &&
		candidatesComplete;
	if (!complete) {
		throw new Error(
			'Algorithm32 Default and J2 through J5 require accepted B1, B2, and B3 ' +
				'assessments before whole-algorithm closeout.',
		);
	}
}

function buildProfile(run, definition) {
	const b1Stage = run.b1[definition.b1StageKey];
	const b2Score = run.b2[definition.b2ScoreKey];
	const b2Assessment = run.b2[definition.b2AssessmentKey];
	const b3Score = run.b3[definition.b3ScoreKey];
	const b3Assessment = run.b3[definition.b3AssessmentKey];
	if (b1Stage.candidateId !== definition.id) {
		throw new Error(
			`B1 candidate slot ${definition.key} must carry stable id ${definition.id}, ` +
				`not ${b1Stage.candidateId ?? '<missing>'}.`,
		);
	}
	if (b3Score.candidateLabel !== definition.id) {
		throw new Error(
			`B3 candidate slot ${definition.key} must carry stable id ${definition.id}, ` +
				`not ${b3Score.candidateLabel ?? '<missing>'}.`,
		);
	}
	const assessment = assessProfile({
		outputValid: b1Stage.assessment.outputValid && run.b2[definition.b2OutputValidKey],
		b1Assessment: b1Stage.assessment,
		b2Assessment,
		b3Assessment,
	});
	return Object.freeze({
		...definition,
		b1Stage,
		b1Assessment: b1Stage.assessment,
		b2Score,
		b2Assessment,
		b3Score,
		b3Assessment,
		assessment,
	});
}

export function evaluateWholeAlgorithm({
	paths = PATHS,
	runners = Object.freeze({b1: runB1, b2: runB2, b3: runB3}),
} = {}) {
	const b1 = runners.b1({
		canonical: true,
		publishedModelsPath: paths.publishedModels,
		proposedPath: paths.defaultBoundary,
		proposedProvenancePath: paths.defaultProvenance,
		judgmentRulesPath: paths.defaultRules,
		proposedJ2Path: paths.j2Boundary,
		proposedJ2ProvenancePath: paths.j2Provenance,
		j2JudgmentRulesPath: paths.j2Rules,
		proposedJ3Path: paths.j3Boundary,
		proposedJ3ProvenancePath: paths.j3Provenance,
		j3JudgmentRulesPath: paths.j3Rules,
		proposedJ4Path: paths.j4Boundary,
		proposedJ4ProvenancePath: paths.j4Provenance,
		j4JudgmentRulesPath: paths.j4Rules,
		proposedJ5Path: paths.j5Boundary,
		proposedJ5ProvenancePath: paths.j5Provenance,
		j5JudgmentRulesPath: paths.j5Rules,
	});
	const b2 = runners.b2({
		canonical: true,
		publishedModelsPath: paths.publishedModels,
		proposedPath: paths.defaultBoundary,
		judgmentRulesPath: paths.defaultRules,
		proposedJ2Path: paths.j2Boundary,
		j2JudgmentRulesPath: paths.j2Rules,
		proposedJ3Path: paths.j3Boundary,
		j3JudgmentRulesPath: paths.j3Rules,
		proposedJ4Path: paths.j4Boundary,
		j4JudgmentRulesPath: paths.j4Rules,
		proposedJ5Path: paths.j5Boundary,
		j5JudgmentRulesPath: paths.j5Rules,
	});
	const b3 = runners.b3({
		canonical: true,
		measurementCubePath: paths.measurements,
		proposedCubePath: paths.defaultCube,
		mismatchMapPath: paths.defaultMismatchMap,
		judgmentRulesPath: paths.defaultRules,
		proposedJ2CubePath: paths.j2Cube,
		j2MismatchMapPath: paths.j2MismatchMap,
		j2JudgmentRulesPath: paths.j2Rules,
		proposedJ3CubePath: paths.j3Cube,
		j3MismatchMapPath: paths.j3MismatchMap,
		j3JudgmentRulesPath: paths.j3Rules,
		proposedJ4CubePath: paths.j4Cube,
		j4MismatchMapPath: paths.j4MismatchMap,
		j4JudgmentRulesPath: paths.j4Rules,
		proposedJ5CubePath: paths.j5Cube,
		j5MismatchMapPath: paths.j5MismatchMap,
		j5JudgmentRulesPath: paths.j5Rules,
		b1ResultPath: paths.b1Result,
	});

	requireCompleteRuns(b1, b2, b3);
	const baseRun = Object.freeze({b1, b2, b3});
	const profiles = Object.freeze(
		Object.fromEntries(
			PROFILE_DEFINITIONS.map((definition) => [definition.key, buildProfile(baseRun, definition)]),
		),
	);
	return Object.freeze({
		b1,
		b2,
		b3,
		profiles,
		assessment: profiles.default.assessment,
		defaultAssessment: profiles.default.assessment,
		j2Assessment: profiles.j2.assessment,
		j3Assessment: profiles.j3.assessment,
		j4Assessment: profiles.j4.assessment,
		j5Assessment: profiles.j5.assessment,
	});
}

function observedCheck(assessment, id) {
	const check = assessment.checks.find((item) => item.id === id);
	if (!check) throw new Error(`Missing ${assessment.experiment} judgment check: ${id}.`);
	return check;
}

function signed(value, digits = 6) {
	return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

function percentChange(next, baseline) {
	return (100 * (next - baseline)) / baseline;
}

function renderEvidenceTable(records) {
	return [
		'| profile | artifact role | path | bytes | SHA-256 |',
		'| --- | --- | --- | ---: | --- |',
		...records.map(
			({profile, role, record}) =>
				`| ${profile} | ${role} | ${record.path} | ${record.bytes} | \`${record.sha256}\` |`,
		),
	];
}

function formatControls(controls) {
	const base =
		`${controls.pathIntervalCount}/${controls.sourceTransmittanceIntervalCount}/` +
		`${controls.incidentDirectionCount}/${controls.incidentAltitudeBinCount}`;
	if (!controls.maximumScatteringOrder) return base;
	return (
		`${base}; W${controls.scatteringOutputFaceWidth}/` +
		`${controls.scatteringOutputDirectionCount}/Jthrough${controls.maximumScatteringOrder}; ` +
		`${controls.positionLookup}`
	);
}

function comparisonTable(profiles) {
	const baseline = profiles.default;
	return PROFILE_DEFINITIONS.slice(1)
		.map((definition) => profiles[definition.key])
		.map((profile) => {
			const b1Change =
				profile.b1Stage.score.aggregate.rmseMilliwatt - baseline.b1Stage.score.aggregate.rmseMilliwatt;
			const b2Change = profile.b2Score.rmseWattsPerSquareMeter - baseline.b2Score.rmseWattsPerSquareMeter;
			return (
				`| ${profile.id} | ${signed(b1Change)} | ` +
				`${signed(percentChange(profile.b1Stage.score.aggregate.rmseMilliwatt, baseline.b1Stage.score.aggregate.rmseMilliwatt), 2)}% | ` +
				`${signed(b2Change)} | ` +
				`${signed(percentChange(profile.b2Score.rmseWattsPerSquareMeter, baseline.b2Score.rmseWattsPerSquareMeter), 2)}% |`
			);
		});
}

function adjacentOrderComparisonTable(profiles) {
	return PROFILE_DEFINITIONS.slice(2).map((definition, index) => {
		const previousDefinition = PROFILE_DEFINITIONS[index + 1];
		const previous = profiles[previousDefinition.key];
		const current = profiles[definition.key];
		const b1Previous = previous.b1Stage.score.aggregate.rmseMilliwatt;
		const b1Current = current.b1Stage.score.aggregate.rmseMilliwatt;
		const b2Previous = previous.b2Score.rmseWattsPerSquareMeter;
		const b2Current = current.b2Score.rmseWattsPerSquareMeter;
		return (
			`| ${previous.id} -> ${current.id} | ${signed(b1Current - b1Previous)} | ` +
			`${signed(percentChange(b1Current, b1Previous), 2)}% | ` +
			`${signed(b2Current - b2Previous)} | ` +
			`${signed(percentChange(b2Current, b2Previous), 2)}% |`
		);
	});
}

function candidateAssessmentHeader() {
	return [
		`| criterion | ${PROFILE_DEFINITIONS.map((definition) => `${definition.id} observed | result`).join(
			' | ',
		)} | favorable maximum | limited maximum |`,
		`| --- | ${PROFILE_DEFINITIONS.map(() => '---: | ---').join(' | ')} | ---: | ---: |`,
	];
}

function candidateCheckTable(profiles, assessmentKey, checkIds) {
	const defaultAssessment = profiles.default[assessmentKey];
	return checkIds.map((id) => {
		const checks = PROFILE_DEFINITIONS.map((definition) =>
			observedCheck(profiles[definition.key][assessmentKey], id),
		);
		const threshold = observedCheck(defaultAssessment, id);
		return (
			`| ${threshold.label} | ` +
			checks.map((check) => `${check.observed.toFixed(6)} | ${check.classification}`).join(' | ') +
			` | ${threshold.favorableThreshold.toFixed(6)} | ` +
			`${threshold.limitedThreshold.toFixed(6)} |`
		);
	});
}

export function renderWholeAlgorithmConclusion(run, {paths = PATHS} = {}) {
	const profiles = run.profiles;
	const orderedProfiles = PROFILE_DEFINITIONS.map((definition) => profiles[definition.key]);
	const coreEvidence = orderedProfiles.flatMap((profile) =>
		profile.evidence.map(([role, pathKey]) =>
			Object.freeze({
				profile: profile.id,
				role,
				record: fileRecord(paths[pathKey]),
			}),
		),
	);
	const generatedEvidence = [
		['shared', 'B1 result', paths.b1Result],
		['shared', 'B1 Figure 5 chart', paths.b1Figure5],
		['shared', 'B2 result', paths.b2Result],
		['shared', 'B3 result', paths.b3Result],
	].map(([profile, role, path]) =>
		Object.freeze({
			profile,
			role,
			record: fileRecord(path),
		}),
	);

	const b1CheckIds = ['aggregate', 'time-10:15', 'time-11:15', 'time-13:15'];
	const b2CheckIds = ['rmse', 'absolute-bias', 'worst-absolute-residual'];
	const classifications = orderedProfiles
		.map((profile) => `${profile.id}: **${profile.assessment.classification.toUpperCase()}**`)
		.join('; ');

	const lines = [
		'# Algorithm32 Whole-Algorithm Benchmark Conclusion',
		'',
		`Whole-algorithm classifications: ${classifications}.`,
		'',
		'## Subjects and decision rules',
		'',
		'Algorithm32 Default is the unchanged production comparison boundary. The comparison subjects `Algorithm32₂`, `Algorithm32₃`, `Algorithm32₄`, and `Algorithm32₅` use the retained W27 outgoing cache, pinned 34-direction incoming quadrature, 48 physical altitude nodes, view-only actual-node altitude interpolation, and cumulative scattering through their named maximum order. The provenance run id and complete numerical-control packet below identify each evaluated subject.',
		'',
		'Each subject retains its native 15-channel spectral-radiance packet and applies the same predeclared piecewise-constant projection onto the Bruneton comparison coordinates. Each is classified independently with its own pre-result judgment record; the comparator thresholds are identical. Adding J2 through J5 does not replace or retroactively alter the Default assessment.',
		'',
		"Subsequent project policy selects cumulative J4 as Algorithm32's default going forward. This document preserves the preselection comparison and its stable subject labels; J5 remains retained comparison evidence, not the default.",
		'',
		'Under the current nomenclature, plain `Algorithm32` means order 4, while a non-default order is written with a subscript, such as `Algorithm32₂` or `Algorithm32₅`; `Algorithm32₄` is valid when the order needs to be explicit. The hyphenated names below remain unchanged stable evidence identifiers.',
		'',
		'| stable id | role | controls | sealed run | B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | B2 RMSE (W m^-2) | B3 RMSE (mW m^-2 sr^-1 nm^-1) | classification |',
		'| --- | --- | --- | --- | ---: | ---: | ---: | --- |',
		...orderedProfiles.map(
			(profile) =>
				`| ${profile.id} | ${profile.role} | ${formatControls(profile.b1Stage.provenance.numericalControls)} | ${profile.b1Stage.provenance.runId} | ${profile.b1Stage.score.aggregate.rmseMilliwatt.toFixed(6)} | ${profile.b2Score.rmseWattsPerSquareMeter.toFixed(6)} | ${profile.b3Score.rmseMilliwatt.toFixed(6)} | ${profile.assessment.classification} |`,
		),
		'',
		'## Comparison with unchanged Algorithm32',
		'',
		'Signed changes below are candidate minus Default. A negative value is a lower error for that aggregate; a positive value is a higher error. These paired aggregate changes do not establish that every direction, wavelength, or time changes in the same way.',
		'',
		'| candidate | B1 RMSE change | B1 percent change | B2 RMSE change | B2 percent change |',
		'| --- | ---: | ---: | ---: | ---: |',
		...comparisonTable(profiles),
		'',
		'## Adjacent n-order changes',
		'',
		'These rows compare each completed cumulative n-order candidate with the immediately preceding n-order candidate. A negative value is a lower measured error. The shrinking J3-to-J4 and J4-to-J5 changes are evidence of diminishing in-sample improvement on these observables; they do not prove convergence or select a release order.',
		'',
		'| transition | B1 RMSE change | B1 percent change | B2 RMSE change | B2 percent change |',
		'| --- | ---: | ---: | ---: | ---: |',
		...adjacentOrderComparisonTable(profiles),
		'',
		'## B1 -- directional spectral radiance',
		'',
		'All five complete 55,080-value boundaries are required to be finite and nonnegative. Each aggregate uses all 42,687 scored values; the three time rows are the values printed by the paper for direct peer-threshold comparison.',
		'',
		...candidateAssessmentHeader(),
		...candidateCheckTable(profiles, 'b1Assessment', b1CheckIds),
		'',
		"The self-contained [extended Figure 5 chart](b1-directional-sky-radiance/figures/b1-figure5-relative-error-domes.svg) preserves the paper's 27 published comparison-model panels and appends three locally generated Algorithm32 panels from the selected paper-profile J4 boundary. Default and J2, J3, and J5 remain fully scored in the tables and retained evidence but are omitted from the active figures. The panels use the same relative-error display transform and visualize B1; they add no threshold or independent benchmark vote.",
		'',
		'## B2 -- hemispherical diffuse-sky irradiance',
		'',
		...candidateAssessmentHeader(),
		...candidateCheckTable(profiles, 'b2Assessment', b2CheckIds),
		'',
		...orderedProfiles.map(
			(profile) =>
				`${profile.id}: worst residual at ${profile.b2Score.worstCondition.localTime}; signed energy bias ${profile.b2Score.biasWattsPerSquareMeter.toFixed(6)} W m^-2.`,
		),
		'',
		'B2 remains an integral transform of the B1 measurement field, not an independent instrument dataset. Its result can expose a different aggregate response to directional changes, but it is not an additional independent vote.',
		'',
		'## B3 -- matched-atmosphere solver context',
		'',
		`| value | ${PROFILE_DEFINITIONS.map((definition) => definition.id).join(' | ')} |`,
		`| --- | ${PROFILE_DEFINITIONS.map(() => '---:').join(' | ')} |`,
		`| B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | ${orderedProfiles.map((profile) => profile.b3Assessment.b1AggregateRmseMilliwatt.toFixed(6)).join(' | ')} |`,
		`| B3 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | ${orderedProfiles.map((profile) => profile.b3Assessment.b3AggregateRmseMilliwatt.toFixed(6)).join(' | ')} |`,
		`| B3 minus B1 (mW m^-2 sr^-1 nm^-1) | ${orderedProfiles.map((profile) => signed(profile.b3Assessment.differenceMilliwatt, 9)).join(' | ')} |`,
		`| consistency tolerance | ${orderedProfiles.map((profile) => profile.b3Assessment.toleranceMilliwatt.toFixed(6)).join(' | ')} |`,
		`| published libRadtran coarse RMSE | ${orderedProfiles.map((profile) => profile.b3Score.publishedLibRadtranRmseMilliwatt.toFixed(2)).join(' | ')} |`,
		`| candidate / libRadtran RMSE ratio | ${orderedProfiles.map((profile) => profile.b3Score.ratioToPublishedLibRadtran.toFixed(6)).join(' | ')} |`,
		`| declared mismatch fields | ${orderedProfiles.map((profile) => `${profile.b3Assessment.mismatchAssessment.observedFieldCount}/${profile.b3Assessment.mismatchAssessment.expectedFieldCount}`).join(' | ')} |`,
		`| inherited classification | ${orderedProfiles.map((profile) => profile.b3Assessment.classification).join(' | ')} |`,
		'',
		'Each B1/B3 consistency check must pass, and each subject retains its own complete mismatch map. B3 is the same-measurement scalar observable as B1; it adds fuller-solver pedigree and declared model-difference context rather than an independent acceptance vote.',
		'',
		'## Exact profile evidence',
		'',
		'The hashes below bind each stable candidate id to its native and projected boundaries, provenance record, judgment rules, and mismatch map. The subjects do not share or overwrite candidate artifacts.',
		'',
		...renderEvidenceTable(coreEvidence),
		'',
		'## Generated benchmark reports and figure',
		'',
		...renderEvidenceTable(generatedEvidence),
		'',
		'## Conclusion',
		'',
		`${classifications}. Each classification combines that subject\'s B1 and B2 thresholds with its B1/B3 consistency result and complete mismatch declaration. The comparison reports the effect of cumulative scattering through J2 to J5 without treating a visual impression or a post-result threshold as authority.`,
		'',
		"These benchmark results do not by themselves establish convergence beyond J5 or account for construction cost and steady-state performance. A subsequent project-policy decision selects J4 as Algorithm32's default. Default remains the unchanged implementation comparison boundary until the selected J4 path passes the integration, parity, lifecycle, and performance gates owned by the cache design.",
		'',
		'These are in-sample comparisons because the adopted aerosol parameters were fitted to the same Kider measurements. No classification establishes out-of-sample atmospheric accuracy, flat-geometry accuracy, finite-local-source accuracy, resolved-solar-disc accuracy, surface-material correctness, or pointwise equality with libRadtran. Those declared limitations remain under every classification.',
		'',
	];
	return `${lines.join('\n')}\n`;
}

function main() {
	const run = evaluateWholeAlgorithm();
	const report = renderWholeAlgorithmConclusion(run);
	mkdirSync(dirname(PATHS.output), {recursive: true});
	writeFileSync(PATHS.output, report, 'utf8');
	process.stdout.write(report);
	process.stderr.write(`Saved whole-algorithm conclusion: ${PATHS.output}\n`);
	if (Object.values(run.profiles).some((profile) => profile.assessment.classification === 'adverse')) {
		process.exitCode = 2;
	}
}

const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) {
	try {
		main();
	} catch (error) {
		process.stderr.write(`${error.stack ?? error.message}\n`);
		process.exitCode = 1;
	}
}
