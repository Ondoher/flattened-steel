import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync
} from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PUBLISHED_MODELS,
  PUBLISHED_RMSE_ORACLE,
  PUBLISHED_RMSE_TOLERANCE_MW
} from './published-oracle.js';
import {
  CAPTURE_TIMES,
  computeTheoreticalSunDirection,
  getSampleDirection,
  SPECTRUM
} from './benchmark-domain.js';

export { CAPTURE_TIMES, computeTheoreticalSunDirection, getSampleDirection, SPECTRUM };

export const KIDER_ROOT = fileURLToPath(new URL(
  '../../../references/downloads/kider-clear-sky-framework-2014/radiance-2013-05-27-bruneton-subset/extracted/',
  import.meta.url
));

// Canonical fingerprints of the acquired official subset. The raw digest is
// over time/index-tagged file bytes; the processed digest is over repaired
// canonical-grid Float64 values. Together they detect payload and transform
// drift in later runs.
export const EXPECTED_DATASET_FINGERPRINTS = Object.freeze({
  rawAcquisitionSha256: 'cab6098aac3f5380ea981a27ef5b0531a9818c3a59aef7abcacb43f53f510de9',
  processedGridSha256: '18d5a3d02ffe688bf18afcc96bd39962de7a610870cc4bbe685fa6ac415be27e'
});

// Sample traversal from MeasuredAtmosphere::GetFileNameAndSampleLocation.
const COORDINATE_VALUES = Object.freeze([
  8, 4, 8, 5, 8, 6, 8, 7, 8, 8, 7, 8, 6, 8, 5, 8, 4, 8, 3, 8, 2, 8, 1, 8,
  0, 8, 0, 7, 0, 6, 0, 5, 0, 4, 0, 3, 0, 2, 0, 1, 0, 0, 1, 0, 2, 0, 3, 0,
  4, 0, 5, 0, 6, 0, 7, 0, 8, 0, 8, 1, 8, 2, 8, 3,
  7, 3, 7, 2, 7, 1, 6, 1, 5, 1, 4, 1, 3, 1, 2, 1, 1, 1, 1, 2, 1, 3, 1, 4,
  1, 5, 1, 6, 1, 7, 2, 7, 3, 7, 4, 7, 5, 7, 6, 7, 7, 7, 7, 6, 7, 5, 7, 4,
  6, 4, 6, 5, 6, 6, 5, 6, 4, 6, 3, 6, 2, 6, 2, 5, 2, 4, 2, 3, 2, 2,
  3, 2, 4, 2, 5, 2, 6, 2, 6, 3,
  5, 3, 4, 3, 3, 3, 3, 4, 3, 5, 4, 5, 5, 5, 5, 4,
  4, 4
]);

export const SAMPLE_COORDINATES = Object.freeze(Array.from({ length: 81 }, (_, i) =>
  Object.freeze({ sourceX: COORDINATE_VALUES[2 * i], sourceY: COORDINATE_VALUES[2 * i + 1] })
));

export function wavelengthAt(index) {
  if (!Number.isInteger(index) || index < 0 || index > SPECTRUM.size) {
    throw new RangeError(`Spectrum index must be an integer from 0 through ${SPECTRUM.size}.`);
  }
  return SPECTRUM.minimumNm + (SPECTRUM.maximumNm - SPECTRUM.minimumNm) * index / SPECTRUM.size;
}
export const SCORE_SAMPLE_INDICES = Object.freeze(Array.from(
  { length: SPECTRUM.size },
  (_, i) => i
).filter((i) => wavelengthAt(i) >= SPECTRUM.scoreMinimumNm && wavelengthAt(i) <= SPECTRUM.scoreMaximumNm));

export function canonicalCoordinate(sampleIndex) {
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= SAMPLE_COORDINATES.length) {
    throw new RangeError('Kider sample index must be an integer from 0 through 80.');
  }
  const { sourceX, sourceY } = SAMPLE_COORDINATES[sampleIndex];
  return Object.freeze({ gridX: sourceX, gridY: 8 - sourceY });
}

function parseFileIdentity(path, time) {
  const name = basename(path);
  const match = name.match(/^2013-05-27___(\d{2})\.(\d{2})\.00_-_(\d+)____(-?\d+(?:\.\d+)?)___(-?\d+(?:\.\d+)?)\.asd\.rad\.txt$/);
  if (!match) throw new Error(`Unexpected Kider filename: ${name}`);
  const fileTime = `${match[1]}:${match[2]}`;
  if (fileTime !== time) throw new Error(`Filename ${name} belongs to ${fileTime}, expected ${time}.`);
  const sampleIndex = Number(match[3]);
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex > 80) {
    throw new Error(`Filename ${name} has an invalid sample index.`);
  }
  return Object.freeze({
    sampleIndex,
    azimuthDegrees: Number(match[4]),
    elevationDegrees: Number(match[5])
  });
}
export function parseKiderSpectrum(text, sourceName = '<memory>') {
  const lines = text.split(/\r?\n/);
  while (lines.length && lines.at(-1).trim() === '') lines.pop();
  if (lines.length !== SPECTRUM.sourceSampleCount + 1) {
    throw new Error(`${sourceName}: expected ${SPECTRUM.sourceSampleCount} spectral rows, found ${lines.length - 1}.`);
  }
  if (!lines[0].startsWith('Wavelength\t')) {
    throw new Error(`${sourceName}: missing Kider wavelength header.`);
  }
  const wavelengths = new Float64Array(SPECTRUM.sourceSampleCount);
  const values = new Float64Array(SPECTRUM.sourceSampleCount);
  for (let i = 1; i < lines.length; i += 1) {
    const fields = lines[i].trim().split(/\s+/);
    if (fields.length !== 2) throw new Error(`${sourceName}: malformed spectral row ${i}.`);
    const wavelength = Number(fields[0]);
    const value = Number(fields[1]);
    const expectedWavelength = SPECTRUM.sourceMinimumNm + i - 1;
    if (wavelength !== expectedWavelength || !Number.isFinite(value)) {
      throw new Error(`${sourceName}: invalid spectral row ${i}; expected finite ${expectedWavelength} nm sample.`);
    }
    wavelengths[i - 1] = wavelength;
    values[i - 1] = value;
  }
  return Object.freeze({ wavelengths, values });
}

export function resampleToBruneton40(source) {
  if (!source || source.wavelengths?.length !== SPECTRUM.sourceSampleCount || source.values?.length !== SPECTRUM.sourceSampleCount) {
    throw new TypeError('The source spectrum must contain the complete 350-2500 nm Kider record.');
  }
  const result = new Float64Array(SPECTRUM.size);
  for (let i = 0; i < result.length; i += 1) {
    const wavelength = wavelengthAt(i);
    const lowerWavelength = Math.floor(wavelength);
    const lowerIndex = lowerWavelength - SPECTRUM.sourceMinimumNm;
    const fraction = wavelength - lowerWavelength;
    result[i] = source.values[lowerIndex] * (1 - fraction) + source.values[lowerIndex + (fraction > 0 ? 1 : 0)] * fraction;
  }
  return result;
}

function validateFilenameDirection(identity) {
  const { sourceX, sourceY } = SAMPLE_COORDINATES[identity.sampleIndex];
  const direction = getSampleDirection(sourceX, sourceY);
  let expectedAzimuth = direction.azimuthDegrees;
  if (expectedAzimuth < 0) expectedAzimuth += 360;
  const expectedElevation = 90 - direction.zenithDegrees;
  // The C++ source uses ostream's default six significant digits in filenames.
  const printToleranceDegrees = 5e-4;
  if (Math.abs(identity.azimuthDegrees - expectedAzimuth) > printToleranceDegrees ||
      Math.abs(identity.elevationDegrees - expectedElevation) > printToleranceDegrees) {
    throw new Error(`Kider sample ${identity.sampleIndex} filename direction does not match the Shirley-Chiu map.`);
  }
}

function averageSpectra(a, b) {
  const result = new Float64Array(SPECTRUM.size);
  for (let i = 0; i < result.length; i += 1) result[i] = (a[i] + b[i]) * 0.5;
  return result;
}

function cubic(u, am1, a0, a1, a2) {
  return (a0 * 2 + ((-am1 + a1) + ((am1 * 2 - a0 * 5 + a1 * 4 - a2) +
    (-am1 + a0 * 3 - a1 * 3 + a2) * u) * u) * u) * 0.5;
}

function ringSample(grid, ringIndex, indexInRing) {
  if (ringIndex === 0) return grid[4][4];
  while (indexInRing < 0) indexInRing += 8 * ringIndex;
  const dx = Math.max(-ringIndex, Math.min(ringIndex,
    Math.abs(indexInRing % (8 * ringIndex) - 4 * ringIndex) - 2 * ringIndex));
  const dy = Math.max(-ringIndex, Math.min(ringIndex,
    Math.abs((indexInRing + 6 * ringIndex) % (8 * ringIndex) - 4 * ringIndex) - 2 * ringIndex));
  return grid[4 + dx][4 + dy];
}

function zenithDerivative(grid, azimuthRadians) {
  const norm = 1 / Math.sqrt(2);
  const scale = 0.5 / (1 + 2 * norm);
  const derivativeX = ((grid[5][4] - grid[3][4]) +
    (grid[5][5] - grid[3][3]) * norm +
    (grid[5][3] - grid[3][5]) * norm) * scale;
  const derivativeY = ((grid[4][5] - grid[4][3]) +
    (grid[5][5] - grid[3][3]) * norm +
    (grid[3][5] - grid[5][3]) * norm) * scale;
  return derivativeX * Math.cos(azimuthRadians) + derivativeY * Math.sin(azimuthRadians);
}

function ringValue(grid, ringIndex, azimuthRadians) {
  if (ringIndex === -1) return ringValue(grid, 1, azimuthRadians) - 2 * zenithDerivative(grid, azimuthRadians);
  if (ringIndex > 4) {
    return ringValue(grid, ringIndex - 3, azimuthRadians) -
      3 * ringValue(grid, ringIndex - 2, azimuthRadians) +
      3 * ringValue(grid, ringIndex - 1, azimuthRadians);
  }
  let u = azimuthRadians / Math.PI * (4 * ringIndex);
  const i = Math.floor(u);
  u -= i;
  return cubic(u,
    ringSample(grid, ringIndex, i - 1),
    ringSample(grid, ringIndex, i),
    ringSample(grid, ringIndex, i + 1),
    ringSample(grid, ringIndex, i + 2));
}

export function sampleHemisphericalScalar(grid, zenithRadians, azimuthRadians) {
  const radius = Math.sqrt(1 - Math.cos(zenithRadians));
  let u = 4.5 * radius;
  const ringIndex = Math.floor(u);
  u -= ringIndex;
  return cubic(u,
    ringValue(grid, ringIndex - 1, azimuthRadians),
    ringValue(grid, ringIndex, azimuthRadians),
    ringValue(grid, ringIndex + 1, azimuthRadians),
    ringValue(grid, ringIndex + 2, azimuthRadians));
}

function symmetryError(grid, axisAzimuthRadians) {
  let error = 0;
  for (let i = 0; i < 16; i += 1) {
    const viewZenith = Math.acos((i + 0.5) / 16);
    for (let j = 0; j < 64; j += 1) {
      const viewAzimuth = j / 64 * 2 * Math.PI;
      const difference = sampleHemisphericalScalar(grid, viewZenith, viewAzimuth) -
        sampleHemisphericalScalar(grid, viewZenith, axisAzimuthRadians * 2 - viewAzimuth);
      error += difference < 0 ? -difference : difference;
    }
  }
  return error;
}

export function estimateSunAzimuth(grid, initialAzimuthDegrees) {
  const radiansPerDegree = Math.PI / 180;
  const minimum = (initialAzimuthDegrees - 20) * radiansPerDegree;
  const maximum = (initialAzimuthDegrees + 20) * radiansPerDegree;
  let minimumError = symmetryError(grid, minimum);
  let best = minimum;
  let candidate = minimum;
  do {
    candidate += 0.2 * radiansPerDegree;
    const error = symmetryError(grid, candidate);
    if (error < minimumError) {
      minimumError = error;
      best = candidate;
    }
  } while (candidate < maximum);
  return Object.freeze({
    azimuthDegrees: best / radiansPerDegree,
    symmetryError: minimumError,
    searchMinimumDegrees: minimum / radiansPerDegree,
    searchMaximumDegrees: maximum / radiansPerDegree,
    stepDegrees: 0.2
  });
}

function makeGrid() {
  return Array.from({ length: 9 }, () => Array(9));
}

function updateDoubleHash(hash, value, scratch) {
  scratch.writeDoubleLE(value, 0);
  hash.update(scratch);
}

function loadCondition(root, time, rawHash) {
  const directoryName = `2013-05-27___${time.replace(':', '.')}.00`;
  const directory = join(root, directoryName);
  if (!existsSync(directory)) throw new Error(`Missing Kider capture directory: ${directory}`);
  const entries = readdirSync(directory)
    .filter((name) => name.endsWith('.asd.rad.txt'))
    .map((name) => {
      const path = join(directory, name);
      return { path, identity: parseFileIdentity(path, time) };
    })
    .sort((a, b) => a.identity.sampleIndex - b.identity.sampleIndex);
  if (entries.length !== 81) throw new Error(`${directoryName}: expected 81 spectra, found ${entries.length}.`);
  const bySample = Array(81);
  let minimumRadiance = Infinity;
  let maximumRadiance = -Infinity;
  for (const { path, identity } of entries) {
    if (bySample[identity.sampleIndex]) throw new Error(`${directoryName}: duplicate sample ${identity.sampleIndex}.`);
    validateFilenameDirection(identity);
    const buffer = readFileSync(path);
    rawHash.update(`${time}\0${String(identity.sampleIndex).padStart(2, '0')}\0`);
    rawHash.update(buffer);
    const spectrum = resampleToBruneton40(parseKiderSpectrum(buffer.toString('utf8'), basename(path)));
    for (const value of spectrum) {
      minimumRadiance = Math.min(minimumRadiance, value);
      maximumRadiance = Math.max(maximumRadiance, value);
    }
    bySample[identity.sampleIndex] = spectrum;
  }
  if (bySample.some((item) => !item)) throw new Error(`${directoryName}: sample index coverage is incomplete.`);
  const grid = makeGrid();
  bySample.forEach((spectrum, sampleIndex) => {
    const { gridX, gridY } = canonicalCoordinate(sampleIndex);
    if (grid[gridX][gridY]) throw new Error(`${directoryName}: direction map is not one-to-one.`);
    grid[gridX][gridY] = spectrum;
  });
  // Retained published preprocessing: anomalous sample 0 (north) is replaced
  // with the mean of the nearest samples at the same elevation.
  grid[8][4] = averageSpectra(grid[8][3], grid[8][5]);
  const integratedGrid = makeGrid();
  for (let x = 0; x < 9; x += 1) {
    for (let y = 0; y < 9; y += 1) {
      integratedGrid[x][y] = Array.from(grid[x][y]).reduce((sum, value) => sum + value, 0) * SPECTRUM.spacingNm;
    }
  }
  const theoreticalSun = computeTheoreticalSunDirection(time);
  const fittedSunAzimuth = estimateSunAzimuth(integratedGrid, theoreticalSun.theoreticalAzimuthDegrees);
  return Object.freeze({
    time,
    directoryName,
    grid,
    sourceFileCount: entries.length,
    sourceSampleCount: entries.length * SPECTRUM.sourceSampleCount,
    resampledValueCount: entries.length * SPECTRUM.size,
    scoreValueCount: entries.length * SCORE_SAMPLE_INDICES.length,
    repairedSourceSampleIndex: 0,
    repairedGridCoordinate: Object.freeze([8, 4]),
    repairNeighborSampleIndices: Object.freeze([1, 31]),
    minimumRadiance,
    maximumRadiance,
    sun: Object.freeze({ ...theoreticalSun, fittedAzimuthDegrees: fittedSunAzimuth.azimuthDegrees, azimuthSymmetryError: fittedSunAzimuth.symmetryError })
  });
}

export function loadKiderDataset(root = KIDER_ROOT) {
  const rawHash = createHash('sha256');
  const conditions = CAPTURE_TIMES.map((time) => loadCondition(root, time, rawHash));
  const processedHash = createHash('sha256');
  const scratch = Buffer.allocUnsafe(8);
  for (const condition of conditions) {
    processedHash.update(`${condition.time}\0`);
    for (let x = 0; x < 9; x += 1) {
      for (let y = 0; y < 9; y += 1) {
        for (const value of condition.grid[x][y]) updateDoubleHash(processedHash, value, scratch);
      }
    }
  }
  return Object.freeze({
    root,
    conditions,
    captureCount: conditions.length,
    spectrumCount: conditions.reduce((sum, item) => sum + item.sourceFileCount, 0),
    sourceValueCount: conditions.reduce((sum, item) => sum + item.sourceSampleCount, 0),
    resampledValueCount: conditions.reduce((sum, item) => sum + item.resampledValueCount, 0),
    scoreValueCount: conditions.reduce((sum, item) => sum + item.scoreValueCount, 0),
    rawAcquisitionSha256: rawHash.digest('hex'),
    processedGridSha256: processedHash.digest('hex')
  });
}

export function integrateCommonInterval(spectrum) {
  if (!spectrum || spectrum.length !== SPECTRUM.size) throw new TypeError('Expected one 40-sample spectrum.');
  let sum = 0;
  for (let i = 0; i < SPECTRUM.size; i += 1) {
    const width = Math.min(wavelengthAt(i + 1), SPECTRUM.scoreMaximumNm) -
      Math.max(wavelengthAt(i), SPECTRUM.scoreMinimumNm);
    if (width > 0) sum += spectrum[i] * width;
  }
  return sum;
}

function assertGrid(grid, label) {
  if (!Array.isArray(grid) || grid.length !== 9) throw new TypeError(`${label}: expected a 9x9 direction grid.`);
  for (let x = 0; x < 9; x += 1) {
    if (!Array.isArray(grid[x]) || grid[x].length !== 9) throw new TypeError(`${label}: expected a 9x9 direction grid.`);
    for (let y = 0; y < 9; y += 1) {
      if (!grid[x][y] || grid[x][y].length !== SPECTRUM.size || Array.from(grid[x][y]).some((v) => !Number.isFinite(v))) {
        throw new TypeError(`${label}: each direction requires 40 finite radiance values.`);
      }
    }
  }
}

export function scoreCondition(modelGrid, measuredGrid) {
  assertGrid(modelGrid, 'model');
  assertGrid(measuredGrid, 'measurement');
  let squaredError = 0;
  let count = 0;
  let worstAbsoluteResidual = 0;
  let worst = null;
  const relativeErrors = [];
  for (let x = 0; x < 9; x += 1) {
    for (let y = 0; y < 9; y += 1) {
      const model = modelGrid[x][y];
      const measured = measuredGrid[x][y];
      for (const spectralIndex of SCORE_SAMPLE_INDICES) {
        const residual = model[spectralIndex] - measured[spectralIndex];
        squaredError += residual * residual;
        count += 1;
        if (Math.abs(residual) > worstAbsoluteResidual) {
          worstAbsoluteResidual = Math.abs(residual);
          worst = Object.freeze({ gridX: x, gridY: y, spectralIndex, wavelengthNm: wavelengthAt(spectralIndex), residual });
        }
      }
      const measuredIntegral = integrateCommonInterval(measured);
      const modelIntegral = integrateCommonInterval(model);
      relativeErrors.push(Object.freeze({
        gridX: x,
        gridY: y,
        relativeError: (modelIntegral - measuredIntegral) / measuredIntegral
      }));
    }
  }
  if (count !== 81 * SPECTRUM.scoreSampleCount) throw new Error(`Scoring count drifted to ${count}.`);
  const rmseW = Math.sqrt(squaredError / count);
  return Object.freeze({
    sampleCount: count,
    rmseW,
    rmseMilliwatt: rmseW * 1000,
    paperRoundedRmseMilliwatt: Math.round(rmseW / 1e-4) / 10,
    worstAbsoluteResidualW: worstAbsoluteResidual,
    worst,
    relativeErrors: Object.freeze(relativeErrors)
  });
}

export function aggregateConditionScores(conditionScores) {
  if (!Array.isArray(conditionScores) || conditionScores.length !== CAPTURE_TIMES.length) {
    throw new TypeError('Aggregate B1 scoring requires all 17 condition scores.');
  }
  const rmseW = Math.sqrt(conditionScores.reduce((sum, item) => sum + item.rmseW * item.rmseW, 0) / conditionScores.length);
  return Object.freeze({
    conditionCount: conditionScores.length,
    rmseW,
    rmseMilliwatt: rmseW * 1000,
    paperRoundedRmseMilliwatt: Math.round(rmseW / 1e-4) / 10
  });
}

export function parseSpectraTsv(path) {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('#'));
  if (!lines.length) throw new Error(`${path}: empty spectra table.`);
  const header = lines.shift().split('\t');
  if (header.length !== 44 || header[0] !== 'model' || header[1] !== 'time' || header[2] !== 'grid_x' || header[3] !== 'grid_y') {
    throw new Error(`${path}: expected model, time, grid_x, grid_y, and 40 spectral columns.`);
  }
  const models = new Map();
  for (const line of lines) {
    const fields = line.split('\t');
    if (fields.length !== 44) throw new Error(`${path}: malformed spectra row.`);
    const [model, time] = fields;
    const x = Number(fields[2]);
    const y = Number(fields[3]);
    if (!CAPTURE_TIMES.includes(time) || ![x, y].every((v) => Number.isInteger(v) && v >= 0 && v < 9)) {
      throw new Error(`${path}: invalid condition or direction coordinate.`);
    }
    const spectrum = Float64Array.from(fields.slice(4), Number);
    if (Array.from(spectrum).some((value) => !Number.isFinite(value))) throw new Error(`${path}: non-finite radiance.`);
    if (!models.has(model)) models.set(model, new Map());
    const byTime = models.get(model);
    if (!byTime.has(time)) byTime.set(time, makeGrid());
    if (byTime.get(time)[x][y]) throw new Error(`${path}: duplicate ${model}/${time}/${x}/${y}.`);
    byTime.get(time)[x][y] = spectrum;
  }
  for (const [model, byTime] of models) {
    for (const time of CAPTURE_TIMES) {
      if (!byTime.has(time)) throw new Error(`${path}: ${model} is missing ${time}.`);
      assertGrid(byTime.get(time), `${model}/${time}`);
    }
  }
  return models;
}

export function scoreModels(dataset, spectraModels) {
  const results = new Map();
  for (const [model, byTime] of spectraModels) {
    const conditionScores = dataset.conditions.map((condition) => Object.freeze({
      time: condition.time,
      ...scoreCondition(byTime.get(condition.time), condition.grid)
    }));
    results.set(model, Object.freeze({
      conditionScores: Object.freeze(conditionScores),
      aggregate: aggregateConditionScores(conditionScores)
    }));
  }
  return results;
}

export function evaluatePublishedOracle(modelScores) {
  const missingModels = PUBLISHED_MODELS.filter((model) => !modelScores.has(model));
  const checks = [];
  for (const model of PUBLISHED_MODELS) {
    if (!modelScores.has(model)) continue;
    const score = modelScores.get(model);
    for (const [time, values] of Object.entries(PUBLISHED_RMSE_ORACLE.perTime)) {
      const observed = score.conditionScores.find((item) => item.time === time)?.paperRoundedRmseMilliwatt;
      const expected = values[model];
      checks.push(Object.freeze({ model, scope: time, observed, expected, difference: observed - expected, passed: Math.abs(observed - expected) <= PUBLISHED_RMSE_TOLERANCE_MW }));
    }
    const observed = score.aggregate.paperRoundedRmseMilliwatt;
    const expected = PUBLISHED_RMSE_ORACLE.aggregate[model];
    checks.push(Object.freeze({ model, scope: 'aggregate', observed, expected, difference: observed - expected, passed: Math.abs(observed - expected) <= PUBLISHED_RMSE_TOLERANCE_MW }));
  }
  return Object.freeze({
    missingModels: Object.freeze(missingModels),
    checks: Object.freeze(checks),
    completed: missingModels.length === 0,
    passed: missingModels.length === 0 && checks.every((item) => item.passed)
  });
}
