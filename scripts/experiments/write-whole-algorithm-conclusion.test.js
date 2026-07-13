import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  evaluateWholeAlgorithm,
  renderWholeAlgorithmConclusion
} from './write-whole-algorithm-conclusion.js';

const PROFILE_FIXTURES = Object.freeze([
  Object.freeze({
    key: 'default',
    id: 'Algorithm32',
    b1StageKey: 'proposedStage',
    b2ScoreKey: 'proposedScore',
    b2AssessmentKey: 'proposedAssessment',
    b2OutputValidKey: 'proposedOutputValid',
    b3ScoreKey: 'proposed',
    b3AssessmentKey: 'proposedAssessment',
    maximumScatteringOrder: null,
    b1Rmse: 14.5,
    b2Rmse: 6.2
  }),
  Object.freeze({
    key: 'j2',
    id: 'Algorithm32-J2',
    b1StageKey: 'proposedJ2Stage',
    b2ScoreKey: 'proposedJ2Score',
    b2AssessmentKey: 'proposedJ2Assessment',
    b2OutputValidKey: 'proposedJ2OutputValid',
    b3ScoreKey: 'proposedJ2',
    b3AssessmentKey: 'proposedJ2Assessment',
    maximumScatteringOrder: 2,
    b1Rmse: 13.25,
    b2Rmse: 5.8
  }),
  Object.freeze({
    key: 'j3',
    id: 'Algorithm32-J3',
    b1StageKey: 'proposedJ3Stage',
    b2ScoreKey: 'proposedJ3Score',
    b2AssessmentKey: 'proposedJ3Assessment',
    b2OutputValidKey: 'proposedJ3OutputValid',
    b3ScoreKey: 'proposedJ3',
    b3AssessmentKey: 'proposedJ3Assessment',
    maximumScatteringOrder: 3,
    b1Rmse: 13.0,
    b2Rmse: 5.7
  }),
  Object.freeze({
    key: 'j4',
    id: 'Algorithm32-J4',
    b1StageKey: 'proposedJ4Stage',
    b2ScoreKey: 'proposedJ4Score',
    b2AssessmentKey: 'proposedJ4Assessment',
    b2OutputValidKey: 'proposedJ4OutputValid',
    b3ScoreKey: 'proposedJ4',
    b3AssessmentKey: 'proposedJ4Assessment',
    maximumScatteringOrder: 4,
    b1Rmse: 12.75,
    b2Rmse: 5.6
  }),
  Object.freeze({
    key: 'j5',
    id: 'Algorithm32-J5',
    b1StageKey: 'proposedJ5Stage',
    b2ScoreKey: 'proposedJ5Score',
    b2AssessmentKey: 'proposedJ5Assessment',
    b2OutputValidKey: 'proposedJ5OutputValid',
    b3ScoreKey: 'proposedJ5',
    b3AssessmentKey: 'proposedJ5Assessment',
    maximumScatteringOrder: 5,
    b1Rmse: 12.5,
    b2Rmse: 5.5
  })
]);

function check(id, label, observed) {
  return Object.freeze({
    id,
    label,
    observed,
    favorableThreshold: 20,
    limitedThreshold: 30,
    classification: 'favorable'
  });
}

function b1Assessment(rmse) {
  return Object.freeze({
    experiment: 'B1',
    classification: 'favorable',
    outputValid: true,
    checks: Object.freeze([
      check('aggregate', 'Aggregate RMSE', rmse),
      check('time-10:15', '10:15 RMSE', rmse + 0.1),
      check('time-11:15', '11:15 RMSE', rmse + 0.2),
      check('time-13:15', '13:15 RMSE', rmse + 0.3)
    ])
  });
}

function b2Assessment(rmse) {
  return Object.freeze({
    experiment: 'B2',
    classification: 'favorable',
    outputValid: true,
    checks: Object.freeze([
      check('rmse', 'RMSE', rmse),
      check('absolute-bias', 'Absolute bias', rmse - 0.2),
      check('worst-absolute-residual', 'Worst absolute residual', rmse + 1)
    ])
  });
}

function controls(maximumScatteringOrder) {
  const base = {
    pathIntervalCount: 40,
    sourceTransmittanceIntervalCount: 20,
    incidentDirectionCount: 34,
    incidentAltitudeBinCount: 48
  };
  return maximumScatteringOrder == null
    ? Object.freeze(base)
    : Object.freeze({
      ...base,
      scatteringOutputFaceWidth: 27,
      scatteringOutputDirectionCount: 4374,
      maximumScatteringOrder,
      positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes'
    });
}

function fixtureRuns() {
  const b1 = {
    accepted: true,
    profileComparisonComplete: true
  };
  const b2 = {
    fullBenchmarkAccepted: true,
    comparativeProfilesComplete: true
  };
  const b3 = {
    accepted: true,
    complete: true,
    comparativeProfilesComplete: true
  };
  PROFILE_FIXTURES.forEach((profile, index) => {
    const assessment1 = b1Assessment(profile.b1Rmse);
    const assessment2 = b2Assessment(profile.b2Rmse);
    b1[profile.b1StageKey] = Object.freeze({
      candidateId: profile.id,
      assessment: assessment1,
      score: Object.freeze({
        aggregate: Object.freeze({ rmseMilliwatt: profile.b1Rmse })
      }),
      provenance: Object.freeze({
        runId: `00020${index}-fixture-${profile.key}`,
        numericalControls: controls(profile.maximumScatteringOrder)
      })
    });
    b2[profile.b2ScoreKey] = Object.freeze({
      rmseWattsPerSquareMeter: profile.b2Rmse,
      biasWattsPerSquareMeter: -profile.b2Rmse + 0.2,
      worstCondition: Object.freeze({ localTime: `1${index}:15`, residual: profile.b2Rmse + 1 })
    });
    b2[profile.b2AssessmentKey] = assessment2;
    b2[profile.b2OutputValidKey] = true;
    b3[profile.b3ScoreKey] = Object.freeze({
      candidateLabel: profile.id,
      rmseMilliwatt: profile.b1Rmse,
      publishedLibRadtranRmseMilliwatt: 11.48,
      ratioToPublishedLibRadtran: profile.b1Rmse / 11.48
    });
    b3[profile.b3AssessmentKey] = Object.freeze({
      experiment: 'B3',
      classification: 'favorable',
      b1AggregateRmseMilliwatt: profile.b1Rmse,
      b3AggregateRmseMilliwatt: profile.b1Rmse,
      differenceMilliwatt: 0,
      toleranceMilliwatt: 0.000001,
      consistent: true,
      mismatchAssessment: Object.freeze({
        complete: true,
        observedFieldCount: 9,
        expectedFieldCount: 9
      })
    });
  });
  return Object.freeze({
    b1: Object.freeze(b1),
    b2: Object.freeze(b2),
    b3: Object.freeze(b3)
  });
}

function fixturePaths() {
  const keys = [
    'publishedModels', 'measurements',
    'defaultRules', 'j2Rules', 'j3Rules', 'j4Rules', 'j5Rules',
    'defaultNativeBoundary', 'defaultBoundary', 'defaultProvenance',
    'defaultCube', 'defaultMismatchMap',
    'j2NativeBoundary', 'j2Boundary', 'j2Provenance', 'j2Cube', 'j2MismatchMap',
    'j3NativeBoundary', 'j3Boundary', 'j3Provenance', 'j3Cube', 'j3MismatchMap',
    'j4NativeBoundary', 'j4Boundary', 'j4Provenance', 'j4Cube', 'j4MismatchMap',
    'j5NativeBoundary', 'j5Boundary', 'j5Provenance', 'j5Cube', 'j5MismatchMap',
    'b1Result', 'b1Figure5', 'b2Result', 'b3Result', 'output'
  ];
  return Object.freeze(Object.fromEntries(keys.map((key) => [key, `fixture:${key}`])));
}

function evaluateFixture(paths = fixturePaths()) {
  const fixture = fixtureRuns();
  const calls = {};
  const run = evaluateWholeAlgorithm({
    paths,
    runners: {
      b1(options) {
        calls.b1 = options;
        return fixture.b1;
      },
      b2(options) {
        calls.b2 = options;
        return fixture.b2;
      },
      b3(options) {
        calls.b3 = options;
        return fixture.b3;
      }
    }
  });
  return { run, calls };
}

test('whole-algorithm evaluation binds the actual Default and J2 through J5 APIs', () => {
  const paths = fixturePaths();
  const { run, calls } = evaluateFixture(paths);

  assert.deepEqual(calls.b1, {
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
    j5JudgmentRulesPath: paths.j5Rules
  });
  assert.deepEqual(calls.b2, {
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
    j5JudgmentRulesPath: paths.j5Rules
  });
  assert.deepEqual(calls.b3, {
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
    b1ResultPath: paths.b1Result
  });
  assert.deepEqual(
    Object.values(run.profiles).map((profile) => profile.id),
    ['Algorithm32', 'Algorithm32-J2', 'Algorithm32-J3', 'Algorithm32-J4', 'Algorithm32-J5']
  );
  assert.equal(run.defaultAssessment.classification, 'favorable');
  assert.equal(run.j2Assessment.classification, 'favorable');
  assert.equal(run.j3Assessment.classification, 'favorable');
  assert.equal(run.j4Assessment.classification, 'favorable');
  assert.equal(run.j5Assessment.classification, 'favorable');
  assert.equal(run.assessment, run.defaultAssessment);
});

test('whole-algorithm evaluation rejects a candidate without its stable id', () => {
  const fixture = fixtureRuns();
  const wrongB1 = {
    ...fixture.b1,
    proposedJ2Stage: {
      ...fixture.b1.proposedJ2Stage,
      candidateId: 'wrong-id'
    }
  };
  assert.throws(
    () => evaluateWholeAlgorithm({
      paths: fixturePaths(),
      runners: {
        b1: () => wrongB1,
        b2: () => fixture.b2,
        b3: () => fixture.b3
      }
    }),
    /must carry stable id Algorithm32-J2/
  );
});

test('whole-algorithm report compares all five subjects and hashes every artifact', () => {
  const directory = mkdtempSync(join(tmpdir(), 'whole-algorithm-conclusion-'));
  try {
    const paths = { ...fixturePaths() };
    const evidenceKeys = [
      'defaultNativeBoundary', 'defaultBoundary', 'defaultProvenance',
      'defaultCube', 'defaultRules', 'defaultMismatchMap',
      'j2NativeBoundary', 'j2Boundary', 'j2Provenance',
      'j2Cube', 'j2Rules', 'j2MismatchMap',
      'j3NativeBoundary', 'j3Boundary', 'j3Provenance',
      'j3Cube', 'j3Rules', 'j3MismatchMap',
      'j4NativeBoundary', 'j4Boundary', 'j4Provenance',
      'j4Cube', 'j4Rules', 'j4MismatchMap',
      'j5NativeBoundary', 'j5Boundary', 'j5Provenance',
      'j5Cube', 'j5Rules', 'j5MismatchMap',
      'b1Result', 'b1Figure5', 'b2Result', 'b3Result'
    ];
    const expectedHashes = [];
    for (const key of evidenceKeys) {
      const path = join(directory, `${key}.fixture`);
      const content = `exact evidence for ${key}\n`;
      writeFileSync(path, content, 'utf8');
      paths[key] = path;
      expectedHashes.push(createHash('sha256').update(content).digest('hex'));
    }

    const { run } = evaluateFixture(paths);
    const report = renderWholeAlgorithmConclusion(run, { paths });

    assert.match(report, /Algorithm32: \*\*FAVORABLE\*\*/);
    assert.match(report, /Algorithm32-J2: \*\*FAVORABLE\*\*/);
    assert.match(report, /Algorithm32-J3: \*\*FAVORABLE\*\*/);
    assert.match(report, /Algorithm32-J4: \*\*FAVORABLE\*\*/);
    assert.match(report, /Algorithm32-J5: \*\*FAVORABLE\*\*/);
    assert.match(report, /000200-fixture-default/);
    assert.match(report, /000201-fixture-j2/);
    assert.match(report, /000202-fixture-j3/);
    assert.match(report, /000203-fixture-j4/);
    assert.match(report, /000204-fixture-j5/);
    assert.match(report, /appends three locally generated Algorithm32 panels/);
    assert.match(report, /Default and J2, J3, and J5 remain fully scored/);
    assert.match(report, /## Adjacent n-order changes/);
    assert.match(report, /Algorithm32-J2 -> Algorithm32-J3/);
    assert.match(report, /Algorithm32-J3 -> Algorithm32-J4/);
    assert.match(report, /Algorithm32-J4 -> Algorithm32-J5/);
    assert.match(report, /do not prove convergence or select a release order/);
    assert.match(report, /B2 remains an integral transform of the B1 measurement field/);
    assert.match(report, /subsequent project-policy decision selects J4/i);
    assert.match(report, /plain `Algorithm32` means order 4/);
    assert.match(report, /`Algorithm32₂`/);
    assert.match(report, /in-sample comparisons/);
    assert.doesNotMatch(report, /Algorithm32-hi/);
    for (const hash of expectedHashes) {
      assert.match(report, new RegExp(hash));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
