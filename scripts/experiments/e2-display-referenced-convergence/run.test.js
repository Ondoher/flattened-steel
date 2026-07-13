import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACCEPTABLE_ACCURACY_BOUNDARY,
  VISIBILITY_BOUNDARY,
  absoluteXyzToItp,
  deltaEItp,
  findVisibilityBoundary,
  linearSrgbToAbsoluteXyz,
  linearSrgbToItp,
  linearSrgbToItpIndependent,
  reproduceAnnex4,
  runExperiment,
  scanAdjacentNeutralCodes
} from './run.js';

const closeTo = (actual, expected, tolerance, message) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected} +/- ${tolerance}, received ${actual}`
  );
};

test('reproduces the printed-precision BT.2124 Annex 4 result', () => {
  const result = reproduceAnnex4();
  closeTo(result.printedInputDeltaEItp, 2.363, 5e-4, 'Delta E ITP');
  closeTo(result.fullInputDeltaEItp, 2.281932290543465, 1e-10,
    'full-input Delta E ITP');
  assert.ok(result.fullInputDeltaEItp < result.printedInputDeltaEItp);
});

test('reproduces the Annex 4 measured XYZ to ITP conversion', () => {
  const measured = absoluteXyzToItp([36, 15, 190]);
  closeTo(measured[0], 0.3568, 5e-5, 'I');
  closeTo(measured[1], 0.1321, 5e-5, 'T');
  closeTo(measured[2], -0.1629, 5e-5, 'P');
});

test('maps sRGB black and white to the declared absolute XYZ endpoints', () => {
  const black = linearSrgbToAbsoluteXyz([0, 0, 0]);
  const white = linearSrgbToAbsoluteXyz([1, 1, 1]);
  [0.1901, 0.2, 0.2178].forEach((expected, index) =>
    closeTo(black[index], expected, 1e-12, `black XYZ ${index}`));
  [76.04, 80, 87.12].forEach((expected, index) =>
    closeTo(white[index], expected, 5e-3, `white XYZ ${index}`));
});

test('independent sRGB-to-ITP realizations agree across representative colours', () => {
  const colours = [
    [0, 0, 0], [1, 1, 1], [0.18, 0.18, 0.18],
    [1, 0, 0], [0, 1, 0], [0, 0, 1],
    [0, 1, 1], [1, 0, 1], [1, 1, 0], [0.99, 0.5, 0.01]
  ];
  for (const colour of colours) {
    assert.ok(deltaEItp(
      linearSrgbToItp(colour),
      linearSrgbToItpIndependent(colour)
    ) < 1e-8);
  }
});

test('Delta E ITP satisfies identity, symmetry, and the triangle inequality', () => {
  const a = linearSrgbToItp([0.01, 0.01, 0.01]);
  const b = linearSrgbToItp([0.18, 0.2, 0.16]);
  const c = linearSrgbToItp([0.8, 0.4, 0.1]);
  assert.equal(deltaEItp(a, a), 0);
  closeTo(deltaEItp(a, b), deltaEItp(b, a), 1e-14, 'symmetry');
  assert.ok(deltaEItp(a, c) <= deltaEItp(a, b) + deltaEItp(b, c));
});

test('boundary search discovers the one-Delta-E-ITP point', () => {
  const cases = [
    { reference: [0, 0, 0], direction: [1, 0, 0] },
    { reference: [0.18, 0.18, 0.18], direction: [1, -1, 0] },
    { reference: [1, 1, 1], direction: [-1, -1, -1] },
    { reference: [1, 0, 0], direction: [-1, 1, 0] }
  ];
  for (const input of cases) {
    const result = findVisibilityBoundary(input.reference, input.direction);
    assert.ok(result);
    closeTo(result.deltaEItp, VISIBILITY_BOUNDARY, 1e-10,
      'boundary Delta E ITP');
    assert.ok(result.candidate.every((value) => value >= 0 && value <= 1));
  }
});

test('distinguishes potential visibility from scoped reference-display accuracy', () => {
  assert.equal(VISIBILITY_BOUNDARY, 1);
  assert.equal(ACCEPTABLE_ACCURACY_BOUNDARY, 3);
  assert.ok(reproduceAnnex4().printedInputDeltaEItp > VISIBILITY_BOUNDARY);
  assert.ok(
    reproduceAnnex4().printedInputDeltaEItp < ACCEPTABLE_ACCURACY_BOUNDARY
  );
});

test('adjacent eight-bit neutral codes are not uniformly subthreshold', () => {
  const result = scanAdjacentNeutralCodes();
  assert.deepEqual(
    [result.maximum.lowerCode, result.maximum.upperCode],
    [0, 1]
  );
  assert.deepEqual(
    [result.minimum.lowerCode, result.minimum.upperCode],
    [254, 255]
  );
  assert.ok(result.maximum.deltaEItp > 1);
  assert.ok(result.minimum.deltaEItp < 1);
});

test('rejects invalid display inputs and unusable directions', () => {
  assert.throws(() => linearSrgbToItp([-0.1, 0, 0]), /within \[0, 1\]/);
  assert.throws(() => findVisibilityBoundary([0, 0, 0], [0, 0, 0]),
    /non-zero/);
  assert.equal(findVisibilityBoundary([0, 0, 0], [-1, 0, 0]), null);
});

test('the complete E2 experiment satisfies every declared acceptance limit', () => {
  const result = runExperiment();
  assert.ok(result.accepted);
  assert.ok(result.boundaryResults.length > 0);
  assert.ok(result.maximumRootResidual <=
    result.acceptance.rootResidualLimit);
  assert.ok(result.transformSurvey.maximum.deltaEItp <=
    result.acceptance.transformDisagreementLimit);
  assert.equal(
    result.acceptance.acceptableAccuracyBoundaryDeltaEItp,
    ACCEPTABLE_ACCURACY_BOUNDARY
  );
});
