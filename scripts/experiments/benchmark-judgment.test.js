import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADVERSE,
  FAVORABLE,
  LIMITED,
  assessB3MismatchMap,
  classifyB1,
  classifyB2,
  classifyB3,
  classifyWholeAlgorithm
} from './benchmark-judgment.js';

const rules = JSON.parse(readFileSync(
  new URL('./whole-algorithm-judgment-rules.json', import.meta.url),
  'utf8'
));
const mismatchMap = JSON.parse(readFileSync(
  new URL('./b3-matched-atmosphere-solver/algorithm32-mismatch-map.json', import.meta.url),
  'utf8'
));
const paperMismatchMap = JSON.parse(readFileSync(
  new URL('./b3-matched-atmosphere-solver/algorithm32-paper-j4-mismatch-map.json', import.meta.url),
  'utf8'
));

test('B1 applies the frozen favorable and limited thresholds', () => {
  const favorable = classifyB1({
    aggregateRmseMilliwatt: 14.635671,
    conditionRmseByTime: { '10:15': 12.20553, '11:15': 14.33482, '13:15': 15.33495 },
    outputValid: true
  }, rules);
  assert.equal(favorable.classification, FAVORABLE);
  const limited = classifyB1({
    aggregateRmseMilliwatt: 20,
    conditionRmseByTime: { '10:15': 20, '11:15': 20, '13:15': 20 },
    outputValid: true
  }, rules);
  assert.equal(limited.classification, LIMITED);
  assert.equal(classifyB1({
    aggregateRmseMilliwatt: 50,
    conditionRmseByTime: { '10:15': 20, '11:15': 20, '13:15': 20 },
    outputValid: true
  }, rules).classification, ADVERSE);
});

test('B2 applies all three frozen thresholds', () => {
  const result = classifyB2({
    rmseWattsPerSquareMeter: 6.181836,
    biasWattsPerSquareMeter: -5.903324,
    worstAbsoluteResidualWattsPerSquareMeter: 8.906779,
    outputValid: true
  }, rules);
  assert.equal(result.classification, FAVORABLE);
  assert.equal(result.checks.length, 3);
});

test('B3 requires numeric consistency and the complete declared mismatch map', () => {
  assert.equal(assessB3MismatchMap(mismatchMap).complete, true);
  const result = classifyB3({
    b1AggregateRmseMilliwatt: 14.635671,
    b1Classification: FAVORABLE,
    b3AggregateRmseMilliwatt: 14.635671,
    mismatchMap
  });
  assert.equal(result.classification, FAVORABLE);
  assert.equal(result.consistent, true);
  assert.equal(classifyB3({
    b1AggregateRmseMilliwatt: 14.635671,
    b1Classification: FAVORABLE,
    b3AggregateRmseMilliwatt: 14.64,
    mismatchMap
  }).classification, ADVERSE);
});

test('B3 paper comparison maps may narrow required fields to remaining mismatches', () => {
  const paperFields = [
    'multiple-scattering treatment',
    'incident angular quadrature',
    'vertical and path discretization',
    'geometry approximation'
  ];
  const assessment = assessB3MismatchMap(paperMismatchMap, paperFields);
  assert.equal(assessment.complete, true);
  assert.equal(assessment.observedFieldCount, 4);
  assert.equal(assessment.observedMismatchCount, 4);
  assert.equal(assessment.observedMatchCount, 0);
});

test('whole-algorithm judgment follows the frozen conjunction rule', () => {
  const b1 = { classification: FAVORABLE };
  const b2 = { classification: FAVORABLE };
  const b3 = {
    classification: FAVORABLE,
    consistent: true,
    mismatchAssessment: { complete: true }
  };
  assert.equal(classifyWholeAlgorithm({ outputValid: true, b1, b2, b3 }).classification, FAVORABLE);
  assert.equal(classifyWholeAlgorithm({
    outputValid: true,
    b1: { classification: LIMITED },
    b2,
    b3: { ...b3, classification: LIMITED }
  }).classification, LIMITED);
});
