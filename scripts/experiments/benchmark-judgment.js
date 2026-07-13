export const FAVORABLE = 'favorable';
export const LIMITED = 'limited';
export const ADVERSE = 'adverse';

export const B3_CONSISTENCY_TOLERANCE_MILLIWATT = 0.000001;

export const REQUIRED_B3_MISMATCH_FIELDS = Object.freeze([
  'spectral representation',
  'ground reflection',
  'molecular-scattering parameterization',
  'multiple-scattering treatment',
  'incident angular quadrature',
  'vertical and path discretization',
  'geometry approximation',
  'observer altitude',
  'solar source treatment'
]);

function classifyChecks(checks, valid = true) {
  if (!valid || checks.some((check) => check.classification === ADVERSE)) return ADVERSE;
  return checks.every((check) => check.classification === FAVORABLE)
    ? FAVORABLE
    : LIMITED;
}

function thresholdCheck(id, label, observed, thresholds, unit) {
  if (!Number.isFinite(observed)) {
    return Object.freeze({
      id,
      label,
      observed,
      favorableThreshold: thresholds.favorableMedian,
      limitedThreshold: thresholds.limitedUpperQuartile,
      unit,
      classification: ADVERSE
    });
  }
  const classification = observed <= thresholds.favorableMedian
    ? FAVORABLE
    : observed <= thresholds.limitedUpperQuartile
      ? LIMITED
      : ADVERSE;
  return Object.freeze({
    id,
    label,
    observed,
    favorableThreshold: thresholds.favorableMedian,
    limitedThreshold: thresholds.limitedUpperQuartile,
    unit,
    classification
  });
}

function comparatorScale(judgmentRules) {
  const scale = judgmentRules?.publishedComparatorScale;
  if (!scale || typeof scale !== 'object') {
    throw new TypeError('Judgment rules require publishedComparatorScale thresholds.');
  }
  return scale;
}

export function classifyB1({ aggregateRmseMilliwatt, conditionRmseByTime, outputValid }, judgmentRules) {
  const scale = comparatorScale(judgmentRules);
  const checks = [thresholdCheck(
    'aggregate',
    'Aggregate RMSE',
    aggregateRmseMilliwatt,
    scale.b1AggregateRmseMilliwatt,
    'mW m^-2 sr^-1 nm^-1'
  )];
  for (const [time, thresholds] of Object.entries(scale.b1Figure5RmseMilliwattByTime)) {
    checks.push(thresholdCheck(
      `time-${time}`,
      `${time} RMSE`,
      conditionRmseByTime[time],
      thresholds,
      'mW m^-2 sr^-1 nm^-1'
    ));
  }
  return Object.freeze({
    experiment: 'B1',
    classification: classifyChecks(checks, outputValid),
    outputValid: Boolean(outputValid),
    checks: Object.freeze(checks)
  });
}

export function classifyB2({
  rmseWattsPerSquareMeter,
  biasWattsPerSquareMeter,
  worstAbsoluteResidualWattsPerSquareMeter,
  outputValid
}, judgmentRules) {
  const scale = comparatorScale(judgmentRules);
  const checks = Object.freeze([
    thresholdCheck(
      'rmse',
      'RMSE',
      rmseWattsPerSquareMeter,
      scale.b2RmseWattsPerSquareMeter,
      'W m^-2'
    ),
    thresholdCheck(
      'absolute-bias',
      'Absolute bias',
      Math.abs(biasWattsPerSquareMeter),
      scale.b2AbsoluteBiasWattsPerSquareMeter,
      'W m^-2'
    ),
    thresholdCheck(
      'worst-absolute-residual',
      'Worst absolute residual',
      worstAbsoluteResidualWattsPerSquareMeter,
      scale.b2WorstAbsoluteResidualWattsPerSquareMeter,
      'W m^-2'
    )
  ]);
  return Object.freeze({
    experiment: 'B2',
    classification: classifyChecks(checks, outputValid),
    outputValid: Boolean(outputValid),
    checks
  });
}

export function assessB3MismatchMap(
  mismatchMap,
  requiredFields = REQUIRED_B3_MISMATCH_FIELDS
) {
  if (!Array.isArray(requiredFields) || requiredFields.length === 0 ||
      requiredFields.some((field) => typeof field !== 'string' || !field.trim())) {
    throw new TypeError('B3 required mismatch fields must be a nonempty string array.');
  }
  const mismatchRows = Array.isArray(mismatchMap?.mismatches) ? mismatchMap.mismatches : [];
  const matchRows = Array.isArray(mismatchMap?.matches) ? mismatchMap.matches : [];
  const rows = [...mismatchRows, ...matchRows];
  const counts = new Map();
  for (const row of rows) {
    if (typeof row?.field === 'string') {
      counts.set(row.field, (counts.get(row.field) ?? 0) + 1);
    }
  }
  const missingFields = requiredFields.filter((field) => !counts.has(field));
  const unexpectedFields = [...counts.keys()].filter((field) => !requiredFields.includes(field));
  const duplicateFields = [...counts]
    .filter(([, count]) => count !== 1)
    .map(([field]) => field);
  const invalidDispositions = rows
    .filter((row) => typeof row?.disposition !== 'string' || !row.disposition.trim())
    .map((row) => row?.field ?? '<unknown>');
  return Object.freeze({
    complete: mismatchMap?.schema === 'algorithm32-b3-mismatch-map-v1' &&
      missingFields.length === 0 && duplicateFields.length === 0 &&
      unexpectedFields.length === 0 && invalidDispositions.length === 0,
    expectedFieldCount: requiredFields.length,
    observedFieldCount: rows.length,
    observedMismatchCount: mismatchRows.length,
    observedMatchCount: matchRows.length,
    missingFields: Object.freeze(missingFields),
    unexpectedFields: Object.freeze(unexpectedFields),
    duplicateFields: Object.freeze(duplicateFields),
    invalidDispositions: Object.freeze(invalidDispositions)
  });
}

export function classifyB3({
  b1AggregateRmseMilliwatt,
  b1Classification,
  b3AggregateRmseMilliwatt,
  mismatchMap,
  requiredMismatchFields = REQUIRED_B3_MISMATCH_FIELDS
}) {
  const differenceMilliwatt = b3AggregateRmseMilliwatt - b1AggregateRmseMilliwatt;
  const consistent = Number.isFinite(differenceMilliwatt) &&
    Math.abs(differenceMilliwatt) <= B3_CONSISTENCY_TOLERANCE_MILLIWATT;
  const mismatchAssessment = assessB3MismatchMap(mismatchMap, requiredMismatchFields);
  return Object.freeze({
    experiment: 'B3',
    classification: consistent && mismatchAssessment.complete
      ? b1Classification
      : ADVERSE,
    inheritedFrom: 'B1',
    b1AggregateRmseMilliwatt,
    b3AggregateRmseMilliwatt,
    differenceMilliwatt,
    toleranceMilliwatt: B3_CONSISTENCY_TOLERANCE_MILLIWATT,
    consistent,
    mismatchAssessment
  });
}

export function classifyWholeAlgorithm({ outputValid, b1, b2, b3 }) {
  let classification;
  if (!outputValid || b1.classification === ADVERSE || b2.classification === ADVERSE ||
      !b3.consistent || !b3.mismatchAssessment.complete) {
    classification = ADVERSE;
  } else if (b1.classification === FAVORABLE && b2.classification === FAVORABLE &&
      b3.classification === FAVORABLE) {
    classification = FAVORABLE;
  } else {
    classification = LIMITED;
  }
  return Object.freeze({
    classification,
    outputValid: Boolean(outputValid),
    b1: b1.classification,
    b2: b2.classification,
    b3: b3.classification,
    b3Consistent: b3.consistent,
    mismatchMapComplete: b3.mismatchAssessment.complete
  });
}
