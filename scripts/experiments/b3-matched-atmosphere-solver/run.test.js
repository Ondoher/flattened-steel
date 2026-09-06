import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {
	DIRECTION_CONTRACT,
	FIXED_CONDITIONS,
	FULL_WAVELENGTHS_NM,
	PUBLISHED,
	SCORED_WAVELENGTHS_NM,
	enumerateCoarseGrid,
	verifyContract,
} from './contract.js';
import {
	evaluateCoarseResults,
	makeConstantCube,
	parseMeasurementBoundary,
	parseUvspecOutput,
	scoreCubes,
	validateCube,
} from './cube.js';
import {
	buildCaseInput,
	buildSupportFileMap,
	cppDefaultFloat,
	fingerprintUvspecExecutable,
	phaseFunctionMoments,
} from './libradtran-input.js';
import {
	CANONICAL_INPUTS,
	HELP,
	parseArguments,
	readB1AggregateResult,
	renderReport,
	runExperiment,
	serializeReferenceCube,
} from './run.js';

test('the spectral contract reproduces Bruneton 40 bins and the 31 scored bins', () => {
	assert.equal(FULL_WAVELENGTHS_NM.length, 40);
	assert.equal(FULL_WAVELENGTHS_NM[0], 360);
	assert.equal(FULL_WAVELENGTHS_NM.at(-1), 818.25);
	assert.equal(SCORED_WAVELENGTHS_NM.length, 31);
	assert.equal(SCORED_WAVELENGTHS_NM.at(-1), 712.5);
});

test('the fixed boundary contains 17 times and 81 source-mapped directions', () => {
	assert.equal(FIXED_CONDITIONS.length, 17);
	assert.equal(FIXED_CONDITIONS[0].id, '09h30');
	assert.equal(FIXED_CONDITIONS.at(-1).id, '13h30');
	assert.ok(Math.abs(FIXED_CONDITIONS[0].sunZenithDeg - 48.93794688168912) < 1e-12);
	assert.ok(Math.abs(FIXED_CONDITIONS[0].sunAzimuthDeg - 91.14246195784821) < 1e-12);
	assert.ok(Math.abs(FIXED_CONDITIONS[0].theoreticalSunAzimuthDeg - 98.1424619578482) < 1e-12);
	assert.equal(DIRECTION_CONTRACT.directions.length, 81);
	assert.equal(DIRECTION_CONTRACT.uvspecViewZenithsDeg.length, 5);
	assert.equal(DIRECTION_CONTRACT.uvspecViewAzimuthsDeg.length, 48);
});

test('the exact 11x10x5 grid has 550 cases and one published coarse target', () => {
	const cases = enumerateCoarseGrid();
	assert.equal(cases.length, 550);
	assert.equal(
		cases.filter(
			(item) =>
				item.alpha === PUBLISHED.coarse.alpha &&
				item.beta === PUBLISHED.coarse.beta &&
				item.g === PUBLISHED.coarse.g,
		).length,
		1,
	);
});

test('all pinned-contract checks pass', () => {
	const result = verifyContract();
	assert.ok(
		result.accepted,
		result.checks
			.filter((check) => !check.accepted)
			.map((check) => check.name)
			.join(', '),
	);
});

test('the generated model preserves source directives and resolved defaults', () => {
	const files = buildSupportFileMap();
	assert.equal(files.size, 108);
	const model = files.get('model.txt');
	assert.match(model, /source solar solar_spectrum\.txt per_nm/);
	assert.match(model, /wavelength 360 818\.25/);
	assert.match(model, /mol_abs_param none/);
	assert.match(model, /aerosol_file explicit aerosol_properties\.txt/);
	assert.match(model, /disort_intcor moments/);
	assert.match(model, /pseudospherical/);
	assert.match(model, /output_user lambda uu/);
	assert.doesNotMatch(model, /rte_solver/);
	assert.doesNotMatch(model, /number_of_streams/);
	assert.equal(files.get('solar_spectrum.txt').trim().split('\n').length, 40);
	assert.equal(files.get('atmosphere.txt').trim().split('\n').length, 101);
	assert.equal(files.get('aerosol_properties.txt').trim().split('\n').length, 101);
	assert.equal(files.get('aerosol_properties_50.txt').trim().split('\n').length, 40);
});

test('a fixed-case input requests the complete rectangular uvspec direction grid', () => {
	const input = buildCaseInput(FIXED_CONDITIONS[0]);
	const umu = input
		.split('\n')
		.find((line) => line.startsWith('umu '))
		.split(/\s+/)
		.slice(1);
	const phi = input
		.split('\n')
		.find((line) => line.startsWith('phi '))
		.split(/\s+/)
		.slice(1);
	assert.equal(umu.length, 5);
	assert.equal(phi.length, 48);
	assert.match(input, /^include model\.txt/m);
	assert.match(input, /^sza 48\.9379$/m);
});

test('six-significant-digit formatting follows the pinned C++ adapter convention', () => {
	assert.equal(cppDefaultFloat(360), '360');
	assert.equal(cppDefaultFloat(818.25), '818.25');
	assert.equal(cppDefaultFloat(1.13419), '1.13419');
	assert.equal(cppDefaultFloat(0.00001234567), '1.23457e-05');
	assert.equal(cppDefaultFloat(2.545818e19), '2.54582e+19');
});

test('the 20 Cornette-Shanks moments are deterministic and finite', () => {
	const first = phaseFunctionMoments(0.7);
	const second = phaseFunctionMoments(0.7);
	assert.equal(first.length, 20);
	assert.deepEqual(first, second);
	assert.ok(first.every(Number.isFinite));
});

test('native solver fingerprints use the executable bytes', () => {
	assert.equal(
		fingerprintUvspecExecutable({uvspecPath: process.execPath}),
		fingerprintUvspecExecutable({uvspecPath: process.execPath}),
	);
	assert.match(fingerprintUvspecExecutable({uvspecPath: process.execPath}), /^[0-9a-f]{64}$/);
});

function syntheticUvspecOutput() {
	const columns = DIRECTION_CONTRACT.uvspecViewZenithsDeg.length * DIRECTION_CONTRACT.uvspecViewAzimuthsDeg.length;
	return FULL_WAVELENGTHS_NM.map((wavelength, wavelengthIndex) =>
		[wavelength, ...Array.from({length: columns}, (_, column) => wavelengthIndex * 1000 + column)].join(' '),
	).join('\n');
}

test('raw uvspec output is reduced from its rectangular grid to the exact 81 directions', () => {
	const values = parseUvspecOutput(syntheticUvspecOutput(), 'fixture');
	assert.equal(values.length, 81);
	assert.equal(values[0].length, 31);
	for (const direction of DIRECTION_CONTRACT.directions) {
		const expectedColumn =
			direction.gridZenithIndex * DIRECTION_CONTRACT.uvspecViewAzimuthsDeg.length + direction.gridAzimuthIndex;
		assert.equal(values[direction.index][0], expectedColumn);
		assert.equal(values[direction.index][30], 30000 + expectedColumn);
	}
});

test('the Bruneton RMSE scorer covers all 17x81x31 samples', () => {
	const reference = makeConstantCube(1);
	const candidate = makeConstantCube(1.01148);
	const result = scoreCubes(reference, candidate);
	assert.equal(result.sampleCount, 17 * 81 * 31);
	assert.ok(Math.abs(result.rmseMilliwatt - 11.48) < 1e-10);
	assert.equal(result.conditions.length, 17);
	assert.ok(result.conditions.every((condition) => condition.sampleCount === 81 * 31));
});

test('the durable B1 measurement TSV is consumed without importing B1 code', () => {
	const rows = [['time', 'grid_x', 'grid_y', ...FULL_WAVELENGTHS_NM.map((_, index) => `lambda_${index}`)].join('\t')];
	FIXED_CONDITIONS.forEach((condition, conditionIndex) => {
		for (let i = 0; i < 9; i += 1) {
			for (let j = 0; j < 9; j += 1) {
				rows.push(
					[
						condition.localTime.slice(0, 5),
						i,
						j,
						...FULL_WAVELENGTHS_NM.map(
							(_, wavelengthIndex) => conditionIndex * 10000 + i * 1000 + j * 100 + wavelengthIndex,
						),
					].join('\t'),
				);
			}
		}
	});
	const cube = parseMeasurementBoundary(rows.join('\n'));
	assert.equal(cube.values[3][2 * 9 + 4][30], 32430);
});

test('cube validation rejects a silently changed physical axis', () => {
	const cube = makeConstantCube(1);
	cube.wavelengthsNm[0] = 361;
	assert.throws(() => validateCube(cube), /wavelength axis/);
});

test('a complete coarse table reproduces the published minimum', () => {
	const cases = enumerateCoarseGrid().map((item) => ({
		...item,
		rmseMilliwatt: item.alpha === 0.8 && item.beta === 0.04 && item.g === 0.7 ? 11.48 : 12 + item.index / 1000,
	}));
	const result = evaluateCoarseResults({cases});
	assert.ok(result.accepted);
	assert.equal(result.observedCaseCount, 550);
	assert.deepEqual(result.minimum, {
		alpha: 0.8,
		beta: 0.04,
		g: 0.7,
		rmseMilliwatt: 11.48,
	});
});

test('contract-only execution is successful but cannot claim B3 acceptance', () => {
	const result = runExperiment();
	assert.ok(result.contract.accepted);
	assert.equal(result.accepted, false);
	assert.equal(result.stages.find((item) => item.id === 'fixed').status, 'not-run');
	assert.equal(result.stages.find((item) => item.id === 'acceptance').status, 'incomplete');
});

test('proposed scoring uses the shared measurements and published libRadtran scalar without a local reference cube', (t) => {
	const directory = mkdtempSync(join(tmpdir(), 'b3-published-reference-'));
	t.after(() => rmSync(directory, {recursive: true, force: true}));
	const paths = {
		measurements: join(directory, 'measurements.json'),
		proposed: join(directory, 'proposed.json'),
		mismatches: join(directory, 'mismatches.json'),
		rules: join(directory, 'rules.json'),
	};
	writeFileSync(paths.measurements, JSON.stringify(makeConstantCube(1)), 'utf8');
	writeFileSync(paths.proposed, JSON.stringify(makeConstantCube(1.01148)), 'utf8');
	writeFileSync(paths.mismatches, JSON.stringify({mismatches: []}), 'utf8');
	writeFileSync(
		paths.rules,
		JSON.stringify({
			declaredBeforeProposedResults: true,
			rules: ['Report the score beside the published libRadtran result.'],
		}),
		'utf8',
	);

	const result = runExperiment({
		measurementCubePath: paths.measurements,
		proposedCubePath: paths.proposed,
		mismatchMapPath: paths.mismatches,
		judgmentRulesPath: paths.rules,
	});

	assert.equal(result.referenceCube, null);
	assert.equal(result.fixedTarget, null);
	assert.ok(result.accepted);
	assert.equal(result.stages.find((item) => item.id === 'proposed').status, 'complete');
	assert.ok(Math.abs(result.proposed.rmseMilliwatt - 11.48) < 1e-10);
	assert.ok(Math.abs(result.proposed.differenceFromPublishedLibRadtranMilliwatt) < 1e-10);
	assert.ok(Math.abs(result.proposed.ratioToPublishedLibRadtran - 1) < 1e-10);
	const report = renderReport(result);
	assert.match(report, /Proposed method versus Kider measurements/);
	assert.match(report, /paper reports 11\.48/);
});

test('a failed optional local libRadtran cross-check does not block published-reference acceptance', (t) => {
	const directory = mkdtempSync(join(tmpdir(), 'b3-optional-crosscheck-'));
	t.after(() => rmSync(directory, {recursive: true, force: true}));
	const paths = {
		measurements: join(directory, 'measurements.json'),
		reference: join(directory, 'reference.json'),
		proposed: join(directory, 'proposed.json'),
		mismatches: join(directory, 'mismatches.json'),
		rules: join(directory, 'rules.json'),
	};
	writeFileSync(paths.measurements, JSON.stringify(makeConstantCube(1)), 'utf8');
	writeFileSync(paths.reference, JSON.stringify(makeConstantCube(2)), 'utf8');
	writeFileSync(paths.proposed, JSON.stringify(makeConstantCube(1.01148)), 'utf8');
	writeFileSync(paths.mismatches, JSON.stringify({mismatches: []}), 'utf8');
	writeFileSync(
		paths.rules,
		JSON.stringify({
			declaredBeforeProposedResults: true,
			rules: ['Report the score beside the published result.'],
		}),
		'utf8',
	);

	const result = runExperiment({
		referenceCubePath: paths.reference,
		measurementCubePath: paths.measurements,
		proposedCubePath: paths.proposed,
		mismatchMapPath: paths.mismatches,
		judgmentRulesPath: paths.rules,
	});

	assert.equal(result.fixedTarget.accepted, false);
	assert.ok(result.accepted);
	assert.equal(result.stages.find((item) => item.id === 'acceptance').status, 'accepted');
});

test('proposed scoring rejects a missing measurement boundary even when rules are supplied', (t) => {
	const directory = mkdtempSync(join(tmpdir(), 'b3-missing-measurements-'));
	t.after(() => rmSync(directory, {recursive: true, force: true}));
	const proposed = join(directory, 'proposed.json');
	const mismatches = join(directory, 'mismatches.json');
	const rules = join(directory, 'rules.json');
	writeFileSync(proposed, JSON.stringify(makeConstantCube(1)), 'utf8');
	writeFileSync(mismatches, JSON.stringify({mismatches: []}), 'utf8');
	writeFileSync(
		rules,
		JSON.stringify({
			declaredBeforeProposedResults: true,
			rules: ['Report the score.'],
		}),
		'utf8',
	);

	assert.throws(
		() =>
			runExperiment({
				proposedCubePath: proposed,
				mismatchMapPath: mismatches,
				judgmentRulesPath: rules,
			}),
		/requires --measurements/,
	);
});

test('candidate-labelled B1 aggregates are parsed exactly with Default-only legacy fallback', (t) => {
	const directory = mkdtempSync(join(tmpdir(), 'b3-b1-candidates-'));
	t.after(() => rmSync(directory, {recursive: true, force: true}));
	const labelled = join(directory, 'labelled.md');
	const legacy = join(directory, 'legacy.md');
	writeFileSync(
		labelled,
		[
			'Candidate aggregate RMSE [Algorithm32]: 14.635671 mW m^-2 sr^-1 nm^-1',
			'Candidate aggregate RMSE [Algorithm32-J2]: 13.250000 mW m^-2 sr^-1 nm^-1',
			'Candidate aggregate RMSE [Algorithm32-J3]: 13.000000 mW m^-2 sr^-1 nm^-1',
			'Candidate aggregate RMSE [Algorithm32-J4]: 12.750000 mW m^-2 sr^-1 nm^-1',
			'Candidate aggregate RMSE [Algorithm32-J5]: 12.500000 mW m^-2 sr^-1 nm^-1',
			'Candidate aggregate RMSE [Algorithm32-Paper-J4]: 11.750000 mW m^-2 sr^-1 nm^-1',
		].join('\n'),
		'utf8',
	);
	writeFileSync(legacy, 'Proposed aggregate RMSE: 14.635671 mW m^-2 sr^-1 nm^-1\n', 'utf8');

	assert.equal(readB1AggregateResult(labelled).aggregateRmseMilliwatt, 14.635671);
	assert.equal(readB1AggregateResult(labelled, 'Algorithm32-J2').aggregateRmseMilliwatt, 13.25);
	assert.equal(readB1AggregateResult(labelled, 'Algorithm32-J3').aggregateRmseMilliwatt, 13);
	assert.equal(readB1AggregateResult(labelled, 'Algorithm32-J4').aggregateRmseMilliwatt, 12.75);
	assert.equal(readB1AggregateResult(labelled, 'Algorithm32-J5').aggregateRmseMilliwatt, 12.5);
	assert.equal(readB1AggregateResult(labelled, 'Algorithm32-Paper-J4').aggregateRmseMilliwatt, 11.75);
	assert.equal(readB1AggregateResult(legacy).aggregateRmseMilliwatt, 14.635671);
	assert.throws(() => readB1AggregateResult(legacy, 'Algorithm32-J2'), /aggregate RMSE for Algorithm32-J2/);
});

test('Default and J2-J5 cubes receive independent B3 scores and consistency assessments', (t) => {
	const directory = mkdtempSync(join(tmpdir(), 'b3-candidate-profiles-'));
	t.after(() => rmSync(directory, {recursive: true, force: true}));
	const paths = {
		measurements: join(directory, 'measurements.json'),
		proposed: join(directory, 'proposed.json'),
		proposedJ2: join(directory, 'proposed-j2.json'),
		proposedJ3: join(directory, 'proposed-j3.json'),
		proposedJ4: join(directory, 'proposed-j4.json'),
		proposedJ5: join(directory, 'proposed-j5.json'),
		b1: join(directory, 'b1.md'),
	};
	writeFileSync(paths.measurements, JSON.stringify(makeConstantCube(1)), 'utf8');
	writeFileSync(paths.proposed, JSON.stringify(makeConstantCube(1.01)), 'utf8');
	writeFileSync(paths.proposedJ2, JSON.stringify(makeConstantCube(1.012)), 'utf8');
	writeFileSync(paths.proposedJ3, JSON.stringify(makeConstantCube(1.013)), 'utf8');
	writeFileSync(paths.proposedJ4, JSON.stringify(makeConstantCube(1.014)), 'utf8');
	writeFileSync(paths.proposedJ5, JSON.stringify(makeConstantCube(1.015)), 'utf8');
	writeFileSync(
		paths.b1,
		[
			'Candidate aggregate RMSE [Algorithm32]: 10.000000 mW m^-2 sr^-1 nm^-1',
			'Candidate aggregate RMSE [Algorithm32-J2]: 12.000000 mW m^-2 sr^-1 nm^-1',
			'Candidate aggregate RMSE [Algorithm32-J3]: 13.000000 mW m^-2 sr^-1 nm^-1',
			'Candidate aggregate RMSE [Algorithm32-J4]: 14.000000 mW m^-2 sr^-1 nm^-1',
			'Candidate aggregate RMSE [Algorithm32-J5]: 15.000000 mW m^-2 sr^-1 nm^-1',
		].join('\n'),
		'utf8',
	);

	const result = runExperiment({
		canonical: true,
		measurementCubePath: paths.measurements,
		proposedCubePath: paths.proposed,
		proposedJ2CubePath: paths.proposedJ2,
		proposedJ3CubePath: paths.proposedJ3,
		proposedJ4CubePath: paths.proposedJ4,
		proposedJ5CubePath: paths.proposedJ5,
		mismatchMapPath: CANONICAL_INPUTS.mismatchMapPath,
		j2MismatchMapPath: CANONICAL_INPUTS.j2MismatchMapPath,
		j3MismatchMapPath: CANONICAL_INPUTS.j3MismatchMapPath,
		j4MismatchMapPath: CANONICAL_INPUTS.j4MismatchMapPath,
		j5MismatchMapPath: CANONICAL_INPUTS.j5MismatchMapPath,
		judgmentRulesPath: CANONICAL_INPUTS.judgmentRulesPath,
		j2JudgmentRulesPath: CANONICAL_INPUTS.j2JudgmentRulesPath,
		j3JudgmentRulesPath: CANONICAL_INPUTS.j3JudgmentRulesPath,
		j4JudgmentRulesPath: CANONICAL_INPUTS.j4JudgmentRulesPath,
		j5JudgmentRulesPath: CANONICAL_INPUTS.j5JudgmentRulesPath,
		b1ResultPath: paths.b1,
	});

	assert.ok(result.accepted);
	assert.ok(result.complete);
	assert.ok(result.comparativeProfilesComplete);
	assert.ok(Math.abs(result.proposed.rmseMilliwatt - 10) < 1e-9);
	assert.ok(Math.abs(result.proposedJ2.rmseMilliwatt - 12) < 1e-9);
	assert.ok(Math.abs(result.proposedJ3.rmseMilliwatt - 13) < 1e-9);
	assert.ok(Math.abs(result.proposedJ4.rmseMilliwatt - 14) < 1e-9);
	assert.ok(Math.abs(result.proposedJ5.rmseMilliwatt - 15) < 1e-9);
	assert.ok(result.proposedAssessment.consistent);
	assert.ok(result.proposedJ2Assessment.consistent);
	assert.ok(result.proposedJ3Assessment.consistent);
	assert.ok(result.proposedJ4Assessment.consistent);
	assert.ok(result.proposedJ5Assessment.consistent);
	assert.equal(result.b1Result.candidateLabel, 'Algorithm32');
	assert.equal(result.b1ResultJ2.candidateLabel, 'Algorithm32-J2');
	assert.equal(result.b1ResultJ3.candidateLabel, 'Algorithm32-J3');
	assert.equal(result.b1ResultJ4.candidateLabel, 'Algorithm32-J4');
	assert.equal(result.b1ResultJ5.candidateLabel, 'Algorithm32-J5');
	assert.equal(result.mismatchMap.mismatches.length, 9);
	assert.equal(result.mismatchMapJ2.mismatches.length, 9);
	assert.equal(result.mismatchMapJ3.mismatches.length, 9);
	assert.equal(result.mismatchMapJ4.mismatches.length, 9);
	assert.equal(result.mismatchMapJ5.mismatches.length, 9);
	const report = renderReport(result);
	assert.match(report, /Algorithm32 Default/);
	assert.match(report, /Predeclared B3 classification - Algorithm32 J2/);
	assert.match(report, /Predeclared B3 classification - Algorithm32 J3/);
	assert.match(report, /Predeclared B3 classification - Algorithm32 J4/);
	assert.match(report, /Predeclared B3 classification - Algorithm32 J5/);
	assert.match(report, /Published libRadtran comparison - Algorithm32-J2/);
	assert.match(report, /Published libRadtran comparison - Algorithm32-J3/);
	assert.match(report, /Published libRadtran comparison - Algorithm32-J4/);
	assert.match(report, /Published libRadtran comparison - Algorithm32-J5/);
	assert.doesNotMatch(report, /Algorithm32-hi/);
});

test('canonical B3 CLI mode is explicit and binds save controls separately', () => {
	const options = parseArguments([
		'--canonical',
		'--save',
		'--require-complete',
		'--proposed-j3-cube',
		'j3.json',
		'--proposed-j5-cube',
		'j5.json',
		'--j3-mismatch-map',
		'j3-map.json',
		'--j5-mismatch-map',
		'j5-map.json',
		'--j3-judgment-rules',
		'j3-rules.json',
		'--j5-judgment-rules',
		'j5-rules.json',
	]);
	assert.equal(options.canonical, true);
	assert.equal(options.save, true);
	assert.equal(options.requireComplete, true);
	assert.equal(options.proposedJ3CubePath, 'j3.json');
	assert.equal(options.proposedJ5CubePath, 'j5.json');
	assert.match(CANONICAL_INPUTS.proposedJ3CubePath, /algorithm32-j3-proposed-cube\.json$/);
	assert.match(CANONICAL_INPUTS.proposedJ5CubePath, /algorithm32-j5-proposed-cube\.json$/);
	assert.match(HELP, /Default and J2-J5 boundaries/);
	assert.match(HELP, /--proposed-j3-cube FILE/);
	assert.match(HELP, /--proposed-j5-cube FILE/);
	assert.throws(() => parseArguments(['--proposed-hi-cube', 'old.json']), /Unknown argument/);
});

test('current-production scoring binds one run and requires its B1 result', () => {
	assert.equal(
		parseArguments(['--production-run', 'tmp/current-production-run']).productionRunPath,
		'tmp/current-production-run',
	);
	assert.throws(() => runExperiment({productionRunPath: 'tmp/current-production-run'}), /requires --b1-result/);
});

test('paper B3 profile-family CLI mode is explicit', () => {
	const options = parseArguments(['--canonical', '--profile-family', 'paper']);
	assert.equal(options.canonical, true);
	assert.equal(options.profileFamily, 'paper');
	assert.throws(() => parseArguments(['--profile-family', 'unknown']), /Unknown candidate profile family/);
});

test('the durable reference artifact is a standalone validated cube with provenance', () => {
	const serialized = serializeReferenceCube({
		referenceCube: makeConstantCube(0.25),
		referenceMode: '--uvspec',
		inputs: {
			uvspec: {path: 'fixture-uvspec', sha256: 'a'.repeat(64)},
		},
	});
	const cube = validateCube(JSON.parse(serialized));
	assert.equal(cube.provenance.libRadtranVersion, '2.0.1');
	assert.equal(cube.provenance.uvspecExecutable.sha256, 'a'.repeat(64));
	assert.deepEqual(cube.provenance.aerosolParameters, PUBLISHED.coarse);
});
