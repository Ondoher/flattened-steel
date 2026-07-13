import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync
} from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SOURCE_COMMIT =
  '4df2ec6609bc0127a478bd34fff29c94352579cc';

export const DEFAULT_DATASET_ROOT = fileURLToPath(new URL(
  '../../../references/downloads/kider-clear-sky-framework-2014/' +
    'radiance-2013-05-27-bruneton-subset/extracted/',
  import.meta.url
));

export const DATASET_REFERENCE_PATH =
  'references/downloads/kider-clear-sky-framework-2014/' +
  'radiance-2013-05-27-bruneton-subset/extracted';

export const SOURCE_SPECTRAL_PACKET = Object.freeze({
  sampleCount: 40,
  minimumNanometers: 360,
  maximumNanometers: 830,
  sampleSpacingNanometers: (830 - 360) / 40
});

export const FIGURE_8_SPECTRAL_RANGE = Object.freeze({
  minimumNanometers: 360,
  maximumNanometers: 720
});

export const QUADRATURE = Object.freeze({
  n: 100,
  zenithSamples: 50,
  azimuthSamples: 200,
  totalDirections: 10_000,
  zenithRule: 'theta_i=(i+0.5)*pi/100, i=0..49',
  azimuthRule: 'phi_j=j*pi/100, j=0..199',
  differentialSolidAngleRule:
    'sin(theta_i)*(pi/100)*(pi/100) sr',
  projectionRule: 'cos(theta_i)'
});

export const CONDITION_NAMES = Object.freeze(Array.from(
  { length: 17 },
  (_, index) => {
    const minutes = 9 * 60 + 30 + index * 15;
    const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
    const minute = String(minutes % 60).padStart(2, '0');
    return `2013-05-27___${hour}.${minute}.00`;
  }
));

export const PUBLISHED_MODEL_NAMES = Object.freeze([
  'nishita93',
  'nishita96',
  'preetham',
  'oneal',
  'haber',
  'bruneton',
  'elek',
  'hosek',
  'libradtran'
]);

// Sample order copied from MeasuredAtmosphere::GetFileNameAndSampleLocation.
// Each pair is a coordinate in the source 9-by-9 square-to-disk field before
// the source's Kider counterclockwise-to-clockwise azimuth conversion.
const KIDER_COORDS_FLAT = Object.freeze([
  // First turn.
  8, 4, 8, 5, 8, 6, 8, 7, 8, 8, 7, 8, 6, 8, 5, 8, 4, 8, 3, 8, 2, 8, 1, 8,
  0, 8, 0, 7, 0, 6, 0, 5, 0, 4, 0, 3, 0, 2, 0, 1, 0, 0, 1, 0, 2, 0, 3, 0,
  4, 0, 5, 0, 6, 0, 7, 0, 8, 0, 8, 1, 8, 2, 8, 3,
  // Second turn.
  7, 3, 7, 2, 7, 1, 6, 1, 5, 1, 4, 1, 3, 1, 2, 1, 1, 1, 1, 2, 1, 3, 1, 4,
  1, 5, 1, 6, 1, 7, 2, 7, 3, 7, 4, 7, 5, 7, 6, 7, 7, 7, 7, 6, 7, 5, 7, 4,
  // Third turn.
  6, 4, 6, 5, 6, 6, 5, 6, 4, 6, 3, 6, 2, 6, 2, 5, 2, 4, 2, 3, 2, 2,
  3, 2, 4, 2, 5, 2, 6, 2, 6, 3,
  // Fourth turn.
  5, 3, 4, 3, 3, 3, 3, 4, 3, 5, 4, 5, 5, 5, 5, 4,
  // Zenith.
  4, 4
]);

export const KIDER_SAMPLE_COORDINATES = Object.freeze(Array.from(
  { length: 81 },
  (_, index) => Object.freeze([
    KIDER_COORDS_FLAT[2 * index],
    KIDER_COORDS_FLAT[2 * index + 1]
  ])
));

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be finite.`);
  }
}

function assertGrid(grid) {
  if (!Array.isArray(grid) || grid.length !== 9 ||
      grid.some((row) => !Array.isArray(row) || row.length !== 9 ||
        row.some((value) => !Number.isFinite(value)))) {
    throw new TypeError('A hemispherical function requires a finite 9x9 grid.');
  }
}

export function sourcePacketWavelengthNanometers(sampleIndex) {
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0 ||
      sampleIndex > SOURCE_SPECTRAL_PACKET.sampleCount) {
    throw new RangeError('Spectral sample index must be in [0, 40].');
  }
  return SOURCE_SPECTRAL_PACKET.minimumNanometers +
    sampleIndex * SOURCE_SPECTRAL_PACKET.sampleSpacingNanometers;
}

export function parseKiderRadianceText(text) {
  if (typeof text !== 'string') {
    throw new TypeError('Kider radiance input must be text.');
  }
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error('Kider radiance input has no data rows.');
  }

  const wavelengthsNanometers = [];
  const radianceWattsPerSquareMeterPerSteradianPerNanometer = [];
  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const columns = trimmed.split(/\s+/);
    if (columns.length < 2) {
      throw new Error(`Malformed Kider radiance row: ${line}`);
    }
    const wavelength = Number(columns[0]);
    const radiance = Number(columns[1]);
    assertFiniteNumber(wavelength, 'Wavelength');
    assertFiniteNumber(radiance, 'Spectral radiance');
    if (wavelengthsNanometers.length > 0 &&
        wavelength <= wavelengthsNanometers.at(-1)) {
      throw new Error('Kider wavelengths must be strictly increasing.');
    }
    wavelengthsNanometers.push(wavelength);
    radianceWattsPerSquareMeterPerSteradianPerNanometer.push(radiance);
  }

  if (wavelengthsNanometers.length === 0) {
    throw new Error('Kider radiance input has no valid data rows.');
  }

  return Object.freeze({
    wavelengthsNanometers: Object.freeze(wavelengthsNanometers),
    radianceWattsPerSquareMeterPerSteradianPerNanometer: Object.freeze(
      radianceWattsPerSquareMeterPerSteradianPerNanometer
    )
  });
}

function interpolateSortedSamples(x, samplePoints, sampleValues) {
  if (x <= samplePoints[0]) return sampleValues[0];
  if (x >= samplePoints.at(-1)) return sampleValues.at(-1);

  let minimumIndex = 0;
  let maximumIndex = samplePoints.length - 1;
  while (maximumIndex - minimumIndex > 1) {
    const middleIndex = Math.floor((minimumIndex + maximumIndex) / 2);
    if (x < samplePoints[middleIndex]) {
      maximumIndex = middleIndex;
    } else {
      minimumIndex = middleIndex;
    }
  }
  const u = (x - samplePoints[minimumIndex]) /
    (samplePoints[maximumIndex] - samplePoints[minimumIndex]);
  return sampleValues[minimumIndex] * (1 - u) +
    sampleValues[maximumIndex] * u;
}

export function resampleToSourceSpectralPacket(parsedSpectrum) {
  const { wavelengthsNanometers, radianceWattsPerSquareMeterPerSteradianPerNanometer } =
    parsedSpectrum;
  if (!Array.isArray(wavelengthsNanometers) ||
      !Array.isArray(radianceWattsPerSquareMeterPerSteradianPerNanometer) ||
      wavelengthsNanometers.length !==
        radianceWattsPerSquareMeterPerSteradianPerNanometer.length ||
      wavelengthsNanometers.length === 0) {
    throw new TypeError('A parsed spectrum needs equal nonempty sample arrays.');
  }
  return Object.freeze(Array.from(
    { length: SOURCE_SPECTRAL_PACKET.sampleCount },
    (_, sampleIndex) => interpolateSortedSamples(
      sourcePacketWavelengthNanometers(sampleIndex),
      wavelengthsNanometers,
      radianceWattsPerSquareMeterPerSteradianPerNanometer
    )
  ));
}

// This is the exact dimensional_types subset integral used by the pinned
// source: each fixed packet value is constant over [sample(i), sample(i+1)),
// with the last intersecting bin clipped at the requested maximum.
export function integrateSourcePacket(
  packet,
  minimumNanometers = FIGURE_8_SPECTRAL_RANGE.minimumNanometers,
  maximumNanometers = FIGURE_8_SPECTRAL_RANGE.maximumNanometers
) {
  if (!Array.isArray(packet) ||
      packet.length !== SOURCE_SPECTRAL_PACKET.sampleCount ||
      packet.some((value) => !Number.isFinite(value))) {
    throw new TypeError('Spectral integration requires a finite 40-value packet.');
  }
  if (!(minimumNanometers >= SOURCE_SPECTRAL_PACKET.minimumNanometers &&
      maximumNanometers <= SOURCE_SPECTRAL_PACKET.maximumNanometers &&
      maximumNanometers >= minimumNanometers)) {
    throw new RangeError('Spectral integration range is outside [360, 830] nm.');
  }

  let sum = 0;
  for (let sampleIndex = 0;
    sampleIndex < SOURCE_SPECTRAL_PACKET.sampleCount;
    sampleIndex += 1) {
    const width = Math.min(
      sourcePacketWavelengthNanometers(sampleIndex + 1),
      maximumNanometers
    ) - Math.max(
      sourcePacketWavelengthNanometers(sampleIndex),
      minimumNanometers
    );
    sum += packet[sampleIndex] * Math.max(width, 0);
  }
  return sum;
}

export function toUnitDisk(x, y) {
  const a = 2 * x - 1;
  const b = 2 * y - 1;
  let radius;
  let azimuth;
  if (a > -b) {
    if (a > b) {
      radius = a;
      azimuth = (Math.PI / 4) * (b / a);
    } else {
      radius = b;
      azimuth = (Math.PI / 4) * (2 - a / b);
    }
  } else if (a < b) {
    radius = -a;
    azimuth = (Math.PI / 4) * (4 + b / a);
  } else {
    radius = -b;
    azimuth = b !== 0 ? (Math.PI / 4) * (6 - a / b) : 0;
  }
  return Object.freeze({ radius, azimuthRadians: azimuth });
}

export function getSampleDirection(i, j) {
  if (!Number.isInteger(i) || !Number.isInteger(j) ||
      i < 0 || i >= 9 || j < 0 || j >= 9) {
    throw new RangeError('Sample coordinates must be integers in [0, 8].');
  }
  const disk = toUnitDisk((i + 0.5) / 9, (j + 0.5) / 9);
  return Object.freeze({
    viewZenithRadians: Math.acos(1 - disk.radius * disk.radius),
    viewAzimuthRadians: disk.azimuthRadians
  });
}

export function cubic(u, am1, a0, a1, a2) {
  return (a0 * 2 + ((-am1 + a1) +
    ((am1 * 2 - a0 * 5 + a1 * 4 - a2) +
      (-am1 + a0 * 3 - a1 * 3 + a2) * u) * u) * u) * 0.5;
}

export class HemisphericalFunction {
  constructor(grid) {
    assertGrid(grid);
    this.grid = grid.map((row) => Object.freeze([...row]));
    Object.freeze(this.grid);
  }

  get(i, j) {
    return this.grid[i][j];
  }

  sample(viewZenithRadians, viewAzimuthRadians) {
    assertFiniteNumber(viewZenithRadians, 'View zenith');
    assertFiniteNumber(viewAzimuthRadians, 'View azimuth');
    const z = Math.cos(viewZenithRadians);
    const radius = Math.sqrt(1 - z);
    let u = 4.5 * radius;
    const ringIndex = Math.floor(u);
    u -= ringIndex;
    return cubic(
      u,
      this.#getRing(ringIndex - 1, viewAzimuthRadians),
      this.#getRing(ringIndex, viewAzimuthRadians),
      this.#getRing(ringIndex + 1, viewAzimuthRadians),
      this.#getRing(ringIndex + 2, viewAzimuthRadians)
    );
  }

  #getRing(ringIndex, viewAzimuthRadians) {
    if (ringIndex < -1) {
      throw new RangeError('Ring index must be at least -1.');
    }
    if (ringIndex === -1) {
      return this.#getRing(1, viewAzimuthRadians) -
        this.#getZenithDerivative(viewAzimuthRadians) * 2;
    }
    if (ringIndex > 4) {
      return this.#getRing(ringIndex - 3, viewAzimuthRadians) -
        this.#getRing(ringIndex - 2, viewAzimuthRadians) * 3 +
        this.#getRing(ringIndex - 1, viewAzimuthRadians) * 3;
    }

    let u = (viewAzimuthRadians / Math.PI) * (4 * ringIndex);
    const indexInRing = Math.floor(u);
    u -= indexInRing;
    return cubic(
      u,
      this.#getRingSample(ringIndex, indexInRing - 1),
      this.#getRingSample(ringIndex, indexInRing),
      this.#getRingSample(ringIndex, indexInRing + 1),
      this.#getRingSample(ringIndex, indexInRing + 2)
    );
  }

  #getRingSample(ringIndex, rawIndexInRing) {
    if (ringIndex === 0) return this.grid[4][4];
    let indexInRing = rawIndexInRing;
    const ringSampleCount = 8 * ringIndex;
    while (indexInRing < 0) indexInRing += ringSampleCount;
    const dx = Math.max(-ringIndex, Math.min(
      ringIndex,
      Math.abs(indexInRing % ringSampleCount - 4 * ringIndex) - 2 * ringIndex
    ));
    const dy = Math.max(-ringIndex, Math.min(
      ringIndex,
      Math.abs((indexInRing + 6 * ringIndex) % ringSampleCount -
        4 * ringIndex) - 2 * ringIndex
    ));
    return this.grid[4 + dx][4 + dy];
  }

  #getZenithDerivative(viewAzimuthRadians) {
    const norm = 1 / Math.sqrt(2);
    const scale = 0.5 / (1 + 2 * norm);
    const derivativeX = (
      (this.grid[5][4] - this.grid[3][4]) +
      (this.grid[5][5] - this.grid[3][3]) * norm +
      (this.grid[5][3] - this.grid[3][5]) * norm
    ) * scale;
    const derivativeY = (
      (this.grid[4][5] - this.grid[4][3]) +
      (this.grid[5][5] - this.grid[3][3]) * norm +
      (this.grid[3][5] - this.grid[5][3]) * norm
    ) * scale;
    return derivativeX * Math.cos(viewAzimuthRadians) +
      derivativeY * Math.sin(viewAzimuthRadians);
  }
}

export function mapKiderSamplesToSourceGrid(sampleValues) {
  if (!Array.isArray(sampleValues) || sampleValues.length !== 81 ||
      sampleValues.some((value) => !Number.isFinite(value))) {
    throw new TypeError('Kider mapping requires 81 finite sample values.');
  }
  const grid = Array.from({ length: 9 }, () => Array(9).fill(Number.NaN));
  for (let sampleIndex = 0; sampleIndex < 81; sampleIndex += 1) {
    const [x, y] = KIDER_SAMPLE_COORDINATES[sampleIndex];
    // Kider filenames measure azimuth counterclockwise from North; Bruneton's
    // function uses clockwise azimuth, so the square's y coordinate is flipped.
    grid[x][8 - y] = sampleValues[sampleIndex];
  }
  // The source identifies sample 0 (North, low elevation) as systematically
  // wrong and replaces it with the mean of its same-elevation neighbors.
  grid[8][4] = (grid[8][3] + grid[8][5]) * 0.5;
  assertGrid(grid);
  return Object.freeze(grid.map((row) => Object.freeze(row)));
}

export function integrateHemisphericalRadiance(
  sampleRadiance,
  n = QUADRATURE.n
) {
  if (typeof sampleRadiance !== 'function') {
    throw new TypeError('Angular integration requires a radiance function.');
  }
  if (!Number.isInteger(n) || n <= 0 || n % 2 !== 0) {
    throw new RangeError('Quadrature N must be a positive even integer.');
  }
  const delta = Math.PI / n;
  let irradiance = 0;
  let projectedSolidAngleWeight = 0;
  let sampleCount = 0;
  for (let zenithIndex = 0; zenithIndex < n / 2; zenithIndex += 1) {
    const viewZenith = (zenithIndex + 0.5) * delta;
    const cosine = Math.cos(viewZenith);
    const sine = Math.sin(viewZenith);
    const projectedDifferentialSolidAngle = sine * delta * delta * cosine;
    for (let azimuthIndex = 0;
      azimuthIndex < 2 * n;
      azimuthIndex += 1) {
      const viewAzimuth = azimuthIndex * delta;
      const radiance = sampleRadiance(viewZenith, viewAzimuth);
      assertFiniteNumber(radiance, 'Interpolated band radiance');
      irradiance += radiance * projectedDifferentialSolidAngle;
      projectedSolidAngleWeight += projectedDifferentialSolidAngle;
      sampleCount += 1;
    }
  }
  return Object.freeze({ irradiance, projectedSolidAngleWeight, sampleCount });
}

export function composeFigure8MeasurementColumns(skyIrradiance) {
  assertFiniteNumber(skyIrradiance, 'Sky irradiance');
  // MeasuredAtmosphere::GetSunIrradiance returns a zero spectrum. Therefore
  // the source's plotted measurement total (sun + sky) equals sky exactly.
  const directSunIrradiance = 0;
  return Object.freeze({
    skyIrradiance,
    directSunIrradiance,
    plottedTotalIrradiance: skyIrradiance + directSunIrradiance
  });
}

function sampleIndexFromFileName(fileName) {
  const match = fileName.match(/_-_(\d+)____/);
  if (!match) {
    throw new Error(`Cannot identify Kider sample index in ${fileName}.`);
  }
  return Number(match[1]);
}

function loadCondition(datasetRoot, conditionName, datasetHasher) {
  const directoryPath = join(datasetRoot, conditionName);
  if (!existsSync(directoryPath)) {
    throw new Error(`Missing Kider condition directory: ${directoryPath}`);
  }

  const files = readdirSync(directoryPath)
    .filter((name) => name.endsWith('.asd.rad.txt'))
    .map((name) => Object.freeze({
      name,
      sampleIndex: sampleIndexFromFileName(name)
    }))
    .sort((a, b) => a.sampleIndex - b.sampleIndex);
  if (files.length !== 81 ||
      files.some((file, index) => file.sampleIndex !== index)) {
    throw new Error(`${conditionName} does not contain samples 0 through 80.`);
  }

  const bandRadiances = [];
  let byteLength = 0;
  const conditionHasher = createHash('sha256');
  for (const file of files) {
    const filePath = join(directoryPath, file.name);
    const bytes = readFileSync(filePath);
    const relativePath = relative(datasetRoot, filePath).replaceAll('\\', '/');
    const pathBytes = Buffer.from(relativePath, 'utf8');
    const separator = Buffer.from([0]);
    datasetHasher.update(pathBytes).update(separator).update(bytes).update(separator);
    conditionHasher.update(Buffer.from(basename(filePath), 'utf8'))
      .update(separator).update(bytes).update(separator);
    byteLength += bytes.byteLength;

    const parsed = parseKiderRadianceText(bytes.toString('utf8'));
    const packet = resampleToSourceSpectralPacket(parsed);
    bandRadiances.push(integrateSourcePacket(packet));
  }

  const grid = mapKiderSamplesToSourceGrid(bandRadiances);
  const field = new HemisphericalFunction(grid);
  const angular = integrateHemisphericalRadiance(
    (viewZenith, viewAzimuth) => field.sample(viewZenith, viewAzimuth)
  );
  const columns = composeFigure8MeasurementColumns(angular.irradiance);
  return Object.freeze({
    conditionName,
    localTime: conditionName.match(/___(\d{2})\.(\d{2})/).slice(1).join(':'),
    fileCount: files.length,
    byteLength,
    conditionSha256: conditionHasher.digest('hex'),
    ...angular,
    ...columns
  });
}

export function reproduceFigure8MeasurementCurve(
  datasetRoot = DEFAULT_DATASET_ROOT
) {
  if (!existsSync(datasetRoot)) {
    throw new Error(`Kider dataset root does not exist: ${datasetRoot}`);
  }
  const directoryNames = readdirSync(datasetRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (directoryNames.length !== CONDITION_NAMES.length ||
      directoryNames.some((name, index) => name !== CONDITION_NAMES[index])) {
    throw new Error('Kider dataset root does not contain the exact 17-condition subset.');
  }

  const datasetHasher = createHash('sha256');
  const conditions = CONDITION_NAMES.map((conditionName) =>
    loadCondition(datasetRoot, conditionName, datasetHasher));
  const fileCount = conditions.reduce((sum, condition) =>
    sum + condition.fileCount, 0);
  const byteLength = conditions.reduce((sum, condition) =>
    sum + condition.byteLength, 0);
  return Object.freeze({
    datasetRoot,
    datasetIdentityAlgorithm:
      'SHA-256(relative UTF-8 path || NUL || file bytes || NUL), ' +
      'condition order then numeric sample-index order',
    datasetSha256: datasetHasher.digest('hex'),
    fileCount,
    byteLength,
    conditions: Object.freeze(conditions)
  });
}

function emptyPacketGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(undefined));
}

export function parsePublishedModelSpectraTsv(text, sourceName = '<memory>') {
  if (typeof text !== 'string') {
    throw new TypeError('Published-model spectra input must be text.');
  }
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  const expectedHeader = [
    'model', 'time', 'grid_x', 'grid_y',
    ...Array.from(
      { length: SOURCE_SPECTRAL_PACKET.sampleCount },
      (_, index) => `lambda_${index}`
    )
  ];
  if (lines.length === 0 ||
      lines[0].split('\t').join('\u0000') !== expectedHeader.join('\u0000')) {
    throw new Error(`${sourceName} does not have the canonical B1 spectra header.`);
  }

  const models = new Map();
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const columns = lines[lineIndex].split('\t');
    if (columns.length !== expectedHeader.length) {
      throw new Error(`${sourceName}:${lineIndex + 1} has ${columns.length} columns; expected ${expectedHeader.length}.`);
    }
    const [model, time, gridXText, gridYText, ...packetText] = columns;
    const gridX = Number(gridXText);
    const gridY = Number(gridYText);
    if (!model || !/^\d{2}:\d{2}$/.test(time) ||
        !Number.isInteger(gridX) || gridX < 0 || gridX > 8 ||
        !Number.isInteger(gridY) || gridY < 0 || gridY > 8) {
      throw new Error(`${sourceName}:${lineIndex + 1} has an invalid model, time, or grid coordinate.`);
    }
    const packet = packetText.map(Number);
    if (packet.some((value) => !Number.isFinite(value))) {
      throw new Error(`${sourceName}:${lineIndex + 1} contains a non-finite spectral radiance.`);
    }
    if (!models.has(model)) models.set(model, new Map());
    const conditions = models.get(model);
    if (!conditions.has(time)) conditions.set(time, emptyPacketGrid());
    const grid = conditions.get(time);
    if (grid[gridX][gridY] !== undefined) {
      throw new Error(`${sourceName} repeats ${model} ${time} (${gridX},${gridY}).`);
    }
    grid[gridX][gridY] = Object.freeze(packet);
  }

  return models;
}

function validateModelGrid(models, sourceName, expectedModelNames) {
  const actualModels = [...models.keys()].sort();
  const expectedModels = [...expectedModelNames].sort();
  if (actualModels.join('\u0000') !== expectedModels.join('\u0000')) {
    throw new Error(
      `${sourceName} must contain exactly the nine published models; found ${actualModels.join(', ') || 'none'}.`
    );
  }
  const expectedTimes = CONDITION_NAMES.map((name) =>
    name.match(/___(\d{2})\.(\d{2})/).slice(1).join(':'));
  for (const model of expectedModelNames) {
    const conditions = models.get(model);
    const actualTimes = [...conditions.keys()].sort();
    if (actualTimes.join('\u0000') !== [...expectedTimes].sort().join('\u0000')) {
      throw new Error(`${sourceName} does not contain the exact 17 conditions for ${model}.`);
    }
    for (const time of expectedTimes) {
      const grid = conditions.get(time);
      for (let x = 0; x < 9; x += 1) {
        for (let y = 0; y < 9; y += 1) {
          const packet = grid[x][y];
          if (!Array.isArray(packet) ||
              packet.length !== SOURCE_SPECTRAL_PACKET.sampleCount) {
            throw new Error(`${sourceName} is missing ${model} ${time} (${x},${y}).`);
          }
        }
      }
    }
  }
  return expectedTimes;
}

export function reproduceFigure8ModelCurves(path, expectedModelNames) {
  if (!Array.isArray(expectedModelNames) || expectedModelNames.length === 0 ||
      expectedModelNames.some((name) => typeof name !== 'string' || !name)) {
    throw new TypeError('Expected model names must be a nonempty string array.');
  }
  if (!existsSync(path)) {
    throw new Error(`Published-model spectra table does not exist: ${path}`);
  }
  const bytes = readFileSync(path);
  const models = parsePublishedModelSpectraTsv(bytes.toString('utf8'), path);
  const times = validateModelGrid(models, path, expectedModelNames);
  const conditions = times.map((localTime) => {
    const diffuseSkyIrradiance = {};
    for (const model of expectedModelNames) {
      const packetGrid = models.get(model).get(localTime);
      const bandGrid = packetGrid.map((row) =>
        row.map((packet) => integrateSourcePacket(packet)));
      const field = new HemisphericalFunction(bandGrid);
      const angular = integrateHemisphericalRadiance(
        (viewZenith, viewAzimuth) => field.sample(viewZenith, viewAzimuth)
      );
      diffuseSkyIrradiance[model] = angular.irradiance;
    }
    return Object.freeze({
      localTime,
      sampleCountPerModel: QUADRATURE.totalDirections,
      diffuseSkyIrradiance: Object.freeze(diffuseSkyIrradiance)
    });
  });
  return Object.freeze({
    path,
    byteLength: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    modelNames: Object.freeze([...expectedModelNames]),
    rowCount: expectedModelNames.length * times.length * 81,
    conditions: Object.freeze(conditions)
  });
}

export function reproduceFigure8PublishedModelCurves(path) {
  return reproduceFigure8ModelCurves(path, PUBLISHED_MODEL_NAMES);
}
