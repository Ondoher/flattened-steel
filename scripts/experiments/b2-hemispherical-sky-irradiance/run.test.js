import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  CONDITION_NAMES,
  FIGURE_8_SPECTRAL_RANGE,
  HemisphericalFunction,
  PUBLISHED_MODEL_NAMES,
  QUADRATURE,
  composeFigure8MeasurementColumns,
  getSampleDirection,
  integrateHemisphericalRadiance,
  integrateSourcePacket,
  mapKiderSamplesToSourceGrid,
  parseKiderRadianceText,
  parsePublishedModelSpectraTsv,
  resampleToSourceSpectralPacket,
  reproduceFigure8PublishedModelCurves,
  sourcePacketWavelengthNanometers
} from './benchmark.js';
import { parseArguments, renderReport, runExperiment } from './run.js';

const degrees = (radians) => radians * 180 / Math.PI;
const near = (actual, expected, tolerance, message) =>
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, got ${actual}`);

test('the exact Kider sample mapping flips azimuth and repairs sample zero', () => {
  const grid = mapKiderSamplesToSourceGrid(
    Array.from({ length: 81 }, (_, index) => index)
  );
  assert.equal(grid[8][3], 1);
  assert.equal(grid[8][5], 31);
  assert.equal(grid[8][4], 16);
  assert.equal(grid[4][4], 80);
});

test('the Shirley-Chiu source directions match published source checks', () => {
  const zenith = getSampleDirection(4, 4);
  near(degrees(zenith.viewZenithRadians), 0, 1e-9, 'zenith');

  const northLow = getSampleDirection(8, 4);
  near(degrees(northLow.viewZenithRadians), 90 - 12.1151, 1e-4,
    'north low zenith angle');
  near(degrees(northLow.viewAzimuthRadians), 0, 1e-4,
    'north low azimuth');

  const east = getSampleDirection(4, 7);
  near(degrees(east.viewZenithRadians), 90 - 33.749, 1e-4,
    'east zenith angle');
  near(degrees(east.viewAzimuthRadians), 90, 1e-4, 'east azimuth');
});

test('bicubic interpolation reproduces every grid node and source spot checks', () => {
  const grid = Array.from(
    { length: 9 },
    (_, i) => Array.from({ length: 9 }, (_, j) => i * 10 + j)
  );
  const field = new HemisphericalFunction(grid);
  for (let i = 0; i < 9; i += 1) {
    for (let j = 0; j < 9; j += 1) {
      const direction = getSampleDirection(i, j);
      near(field.sample(
        direction.viewZenithRadians,
        direction.viewAzimuthRadians
      ), i * 10 + j, 1e-8, `grid node ${i},${j}`);
      near(field.sample(
        direction.viewZenithRadians,
        direction.viewAzimuthRadians + 2 * Math.PI
      ), i * 10 + j, 1e-8, `periodic grid node ${i},${j}`);
    }
  }
  near(field.sample(
    (90 - 12.1151) * Math.PI / 180,
    (90 / 16) * Math.PI / 180
  ), 84.5, 0.1, 'outer-ring interpolation');
  near(field.sample(
    (90 - (53.3665 + 33.749) * 0.5) * Math.PI / 180,
    0
  ), 69, 0.1, 'between-ring interpolation');
});

test('raw spectra are linearly resampled onto the exact 40-point source packet', () => {
  const text = [
    'Wavelength\tfixture',
    ...Array.from({ length: 2151 }, (_, index) => {
      const wavelength = 350 + index;
      return `${wavelength}\t${2 * wavelength + 3}`;
    })
  ].join('\n');
  const parsed = parseKiderRadianceText(text);
  const packet = resampleToSourceSpectralPacket(parsed);
  assert.equal(packet.length, 40);
  near(sourcePacketWavelengthNanometers(1), 371.75, 1e-12,
    'packet sample one wavelength');
  near(packet[1], 2 * 371.75 + 3, 1e-12,
    'linearly resampled sample one');
  near(sourcePacketWavelengthNanometers(40), 830, 1e-12,
    'packet upper bin boundary');
});

test('the 360-720 nm subset integral preserves the source left-bin boundary rule', () => {
  const packet = Array.from({ length: 40 }, (_, index) => {
    const wavelength = sourcePacketWavelengthNanometers(index);
    return 2 * wavelength + 3;
  });
  let expected = 0;
  for (let index = 0; index < 30; index += 1) {
    expected += packet[index] * 11.75;
  }
  expected += packet[30] * 7.5;
  near(integrateSourcePacket(packet), expected, 1e-9,
    'left-bin subset integral');
  near(integrateSourcePacket(Array(40).fill(2)),
    2 * (FIGURE_8_SPECTRAL_RANGE.maximumNanometers -
      FIGURE_8_SPECTRAL_RANGE.minimumNanometers),
    1e-12,
    'constant spectral density integral');
});

test('the N=100 angular rule uses 50x200 directions and integrates constant radiance', () => {
  const constantRadiance = 2;
  const result = integrateHemisphericalRadiance(() => constantRadiance);
  const delta = Math.PI / QUADRATURE.n;
  const exactDiscreteProjectedWeight = Math.PI * Math.PI /
    (QUADRATURE.n * Math.sin(delta));
  assert.equal(result.sampleCount, 50 * 200);
  near(result.projectedSolidAngleWeight, exactDiscreteProjectedWeight, 1e-12,
    'discrete projected solid-angle sum');
  near(result.irradiance,
    constantRadiance * exactDiscreteProjectedWeight,
    1e-11,
    'constant-radiance irradiance');
  near(result.irradiance, constantRadiance * Math.PI, 0.0011,
    'continuous Lambertian hemisphere result');
});

test('spectral integration commutes with the source linear bicubic interpolation', () => {
  const packets = Array.from({ length: 9 }, (_, i) =>
    Array.from({ length: 9 }, (_, j) =>
      Array.from({ length: 40 }, (_, k) => 0.001 * (1 + i + 2 * j + 3 * k))));
  const direction = { viewZenithRadians: 0.71, viewAzimuthRadians: 1.23 };
  const integratedGrid = packets.map((row) =>
    row.map((packet) => integrateSourcePacket(packet)));
  const integrateThenInterpolate = new HemisphericalFunction(integratedGrid)
    .sample(direction.viewZenithRadians, direction.viewAzimuthRadians);
  const interpolatedPacket = Array.from({ length: 40 }, (_, k) => {
    const channelGrid = packets.map((row) => row.map((packet) => packet[k]));
    return new HemisphericalFunction(channelGrid)
      .sample(direction.viewZenithRadians, direction.viewAzimuthRadians);
  });
  const interpolateThenIntegrate = integrateSourcePacket(interpolatedPacket);
  near(integrateThenInterpolate, interpolateThenIntegrate, 1e-12,
    'linear-operation commutation');
});

test('the Figure 8 measurement boundary excludes direct Sun exactly', () => {
  const columns = composeFigure8MeasurementColumns(123.456);
  assert.equal(columns.skyIrradiance, 123.456);
  assert.equal(columns.directSunIrradiance, 0);
  assert.equal(columns.plottedTotalIrradiance, columns.skyIrradiance);
});

test('the acquired dataset produces all 17 measurement iterations without accepting full B2', () => {
  const run = runExperiment();
  assert.equal(run.reproduction.conditions.length, CONDITION_NAMES.length);
  assert.equal(run.reproduction.fileCount, 17 * 81);
  assert.ok(run.measurementStageCompleted);
  assert.equal(run.publishedModelColumnsStatus, 'pending');
  assert.equal(run.proposedMethodColumnStatus, 'pending');
  assert.equal(run.fullBenchmarkAccepted, false);
});

function syntheticPublishedModelsTsv(modelNames = PUBLISHED_MODEL_NAMES) {
  const lines = [[
    'model', 'time', 'grid_x', 'grid_y',
    ...Array.from({ length: 40 }, (_, index) => `lambda_${index}`)
  ].join('\t')];
  const times = CONDITION_NAMES.map((name) =>
    name.match(/___(\d{2})\.(\d{2})/).slice(1).join(':'));
  modelNames.forEach((model, modelIndex) => {
    const radiance = (modelIndex + 1) * 0.001;
    for (const time of times) {
      for (let x = 0; x < 9; x += 1) {
        for (let y = 0; y < 9; y += 1) {
          lines.push([
            model, time, x, y,
            ...Array(40).fill(radiance)
          ].join('\t'));
        }
      }
    }
  });
  return `${lines.join('\n')}\n`;
}

function syntheticProposedTsv(multiplier) {
  const names = [
    ...Array.from({ length: multiplier - 1 }, (_, index) => `fixture-${index}`),
    'proposed'
  ];
  const lines = syntheticPublishedModelsTsv(names).split('\n');
  return `${lines.filter((line, index) =>
    index === 0 || line.startsWith('proposed\t')).join('\n')}\n`;
}

test('published-model TSV parsing preserves the canonical 9x9 spectral packets', () => {
  const models = parsePublishedModelSpectraTsv(syntheticPublishedModelsTsv());
  assert.deepEqual([...models.keys()], PUBLISHED_MODEL_NAMES);
  assert.equal(models.get('bruneton').get('09:30')[8][8].length, 40);
  assert.equal(models.get('bruneton').get('09:30')[8][8][0], 0.006);
});

test('published-model curves integrate a constant spectral-radiance field', () => {
  const directory = mkdtempSync(join(tmpdir(), 'b2-published-models-'));
  const path = join(directory, 'models.tsv');
  try {
    writeFileSync(path, syntheticPublishedModelsTsv(), 'utf8');
    const curves = reproduceFigure8PublishedModelCurves(path);
    assert.equal(curves.rowCount, 9 * 17 * 81);
    assert.equal(curves.conditions.length, 17);
    const projectedWeight = integrateHemisphericalRadiance(() => 1)
      .projectedSolidAngleWeight;
    near(
      curves.conditions[0].diffuseSkyIrradiance.bruneton,
      0.006 * 360 * projectedWeight,
      1e-10,
      'Bruneton constant-field irradiance'
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('a proposed curve is scored only with predeclared judgment rules', () => {
  const directory = mkdtempSync(join(tmpdir(), 'b2-proposed-'));
  const proposedPath = join(directory, 'proposed.tsv');
  const rulesPath = join(directory, 'rules.json');
  try {
    writeFileSync(proposedPath, syntheticPublishedModelsTsv(['proposed']), 'utf8');
    assert.throws(
      () => runExperiment({ proposedPath }),
      /--proposed requires --judgment-rules/
    );
    writeFileSync(rulesPath, JSON.stringify({
      declaredBeforeProposedResults: true,
      rules: ['Report the observed RMSE and bias without selecting a post-result threshold.']
    }), 'utf8');
    const run = runExperiment({ proposedPath, judgmentRulesPath: rulesPath });
    assert.equal(run.publishedReferenceStage.status, 'adopted');
    assert.equal(run.proposedMethodColumnStatus, 'scored');
    assert.equal(run.proposedScore.conditions.length, 17);
    assert.equal(run.fullBenchmarkAccepted, true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Default and J2 through J5 curves are integrated and scored independently', () => {
  const directory = mkdtempSync(join(tmpdir(), 'b2-candidate-profiles-'));
  const proposedPath = join(directory, 'proposed.tsv');
  const proposedJ2Path = join(directory, 'proposed-j2.tsv');
  const proposedJ3Path = join(directory, 'proposed-j3.tsv');
  const proposedJ4Path = join(directory, 'proposed-j4.tsv');
  const proposedJ5Path = join(directory, 'proposed-j5.tsv');
  const rulesPath = join(directory, 'rules.json');
  const j2RulesPath = join(directory, 'j2-rules.json');
  const j3RulesPath = join(directory, 'j3-rules.json');
  const j4RulesPath = join(directory, 'j4-rules.json');
  const j5RulesPath = join(directory, 'j5-rules.json');
  try {
    writeFileSync(proposedPath, syntheticProposedTsv(1), 'utf8');
    writeFileSync(proposedJ2Path, syntheticProposedTsv(2), 'utf8');
    writeFileSync(proposedJ3Path, syntheticProposedTsv(3), 'utf8');
    writeFileSync(proposedJ4Path, syntheticProposedTsv(4), 'utf8');
    writeFileSync(proposedJ5Path, syntheticProposedTsv(5), 'utf8');
    const rules = {
      declaredBeforeProposedResults: true,
      rules: ['Report this candidate independently without a post-result threshold.']
    };
    writeFileSync(rulesPath, JSON.stringify(rules), 'utf8');
    writeFileSync(j2RulesPath, JSON.stringify(rules), 'utf8');
    writeFileSync(j3RulesPath, JSON.stringify(rules), 'utf8');
    writeFileSync(j4RulesPath, JSON.stringify(rules), 'utf8');
    writeFileSync(j5RulesPath, JSON.stringify(rules), 'utf8');

    assert.throws(
      () => runExperiment({ proposedJ2Path }),
      /--proposed-j2 requires --j2-judgment-rules/
    );
    assert.throws(
      () => runExperiment({ proposedJ3Path }),
      /--proposed-j3 requires --j3-judgment-rules/
    );
    assert.throws(
      () => runExperiment({ proposedJ4Path }),
      /--proposed-j4 requires --j4-judgment-rules/
    );
    assert.throws(
      () => runExperiment({ proposedJ5Path }),
      /--proposed-j5 requires --j5-judgment-rules/
    );
    const run = runExperiment({
      proposedPath,
      proposedJ2Path,
      proposedJ3Path,
      proposedJ4Path,
      proposedJ5Path,
      judgmentRulesPath: rulesPath,
      j2JudgmentRulesPath: j2RulesPath,
      j3JudgmentRulesPath: j3RulesPath,
      j4JudgmentRulesPath: j4RulesPath,
      j5JudgmentRulesPath: j5RulesPath
    });
    assert.equal(run.proposedMethodColumnStatus, 'scored');
    assert.equal(run.proposedJ2ColumnStatus, 'scored');
    assert.equal(run.proposedJ3ColumnStatus, 'scored');
    assert.equal(run.proposedJ4ColumnStatus, 'scored');
    assert.equal(run.proposedJ5ColumnStatus, 'scored');
    assert.ok(run.comparativeProfilesComplete);
    assert.ok(run.fullBenchmarkAccepted);
    assert.notEqual(
      run.proposedScore.rmseWattsPerSquareMeter,
      run.proposedJ2Score.rmseWattsPerSquareMeter
    );
    assert.notEqual(
      run.proposedJ2Score.rmseWattsPerSquareMeter,
      run.proposedJ3Score.rmseWattsPerSquareMeter
    );
    assert.notEqual(
      run.proposedJ3Score.rmseWattsPerSquareMeter,
      run.proposedJ4Score.rmseWattsPerSquareMeter
    );
    assert.notEqual(
      run.proposedJ4Score.rmseWattsPerSquareMeter,
      run.proposedJ5Score.rmseWattsPerSquareMeter
    );
    const report = renderReport(run);
    assert.match(report, /Algorithm32 Default \(W m\^-2\)/);
    assert.match(report, /Algorithm32 J2 \(W m\^-2\)/);
    assert.match(report, /Algorithm32 J3 \(W m\^-2\)/);
    assert.match(report, /Algorithm32 J4 \(W m\^-2\)/);
    assert.match(report, /Algorithm32 J5 \(W m\^-2\)/);
    assert.doesNotMatch(report, /Algorithm32-hi/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('canonical CLI mode is explicit and can be combined with output options', () => {
  const options = parseArguments([
    '--canonical',
    '--published-models', 'fixture.tsv',
    '--proposed-j2', 'j2.tsv',
    '--j2-judgment-rules', 'j2-rules.json',
    '--proposed-j3', 'j3.tsv',
    '--j3-judgment-rules', 'j3-rules.json',
    '--proposed-j4', 'j4.tsv',
    '--j4-judgment-rules', 'j4-rules.json',
    '--proposed-j5', 'j5.tsv',
    '--j5-judgment-rules', 'j5-rules.json'
  ]);
  assert.equal(options.canonical, true);
  assert.equal(options.publishedModelsPath, join(process.cwd(), 'fixture.tsv'));
  assert.equal(options.proposedJ2Path, join(process.cwd(), 'j2.tsv'));
  assert.equal(options.j2JudgmentRulesPath, join(process.cwd(), 'j2-rules.json'));
  assert.equal(options.proposedJ3Path, join(process.cwd(), 'j3.tsv'));
  assert.equal(options.j3JudgmentRulesPath, join(process.cwd(), 'j3-rules.json'));
  assert.equal(options.proposedJ4Path, join(process.cwd(), 'j4.tsv'));
  assert.equal(options.j4JudgmentRulesPath, join(process.cwd(), 'j4-rules.json'));
  assert.equal(options.proposedJ5Path, join(process.cwd(), 'j5.tsv'));
  assert.equal(options.j5JudgmentRulesPath, join(process.cwd(), 'j5-rules.json'));
  assert.throws(
    () => runExperiment({
      canonical: true,
      publishedModelsPath: null,
      proposedPath: null,
      proposedJ2Path: null,
      proposedJ3Path: null,
      proposedJ4Path: null,
      proposedJ5Path: null
    }),
    /Canonical B2 requires Algorithm32 Default and J2 through J5 candidate paths/
  );
});

test('current-production scoring accepts one run manifest path', () => {
  assert.equal(
    parseArguments(['--production-run', 'tmp/current-production-run']).productionRunPath,
    join(process.cwd(), 'tmp/current-production-run')
  );
});

test('paper profile-family CLI mode is explicit', () => {
  assert.equal(
    parseArguments(['--canonical', '--profile-family', 'paper']).profileFamily,
    'paper'
  );
  assert.throws(
    () => parseArguments(['--profile-family', 'unknown']),
    /Unknown candidate profile family/
  );
});
