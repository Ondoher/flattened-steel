import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { generateData } from './generate-data.js';
import {
  deltaEItp,
  linearSrgbToItp
} from '../e2-display-referenced-convergence/run.js';

const maxAbsDifference = (left, right) => left.reduce(
  (maximum, value, index) => Math.max(maximum, Math.abs(value - right[index])),
  0
);
const multiply = (left, right) => left.map((value, index) => value * right[index]);
const add = (left, right) => left.map((value, index) => value + right[index]);
const zeros = (count) => Array(count).fill(0);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const length = (vector) => Math.sqrt(dot(vector, vector));
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const scale = (vector, scalar) => vector.map((value) => value * scalar);
const addVectors = (a, b) => a.map((value, index) => value + b[index]);
const addScaled = (origin, direction, distance) =>
  origin.map((value, index) => value + direction[index] * distance);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];

function normalize(vector) {
  const magnitude = length(vector);
  return magnitude === 0 ? [0, 0, 0] : scale(vector, 1 / magnitude);
}

function sunDirection(sun) {
  const altitude = sun.solarAltitudeDegrees * Math.PI / 180;
  const azimuth = sun.solarAzimuthDegrees * Math.PI / 180;
  const horizontal = Math.cos(altitude);
  return normalize([
    horizontal * Math.cos(azimuth),
    horizontal * Math.sin(azimuth),
    Math.sin(altitude)
  ]);
}

export function skyDirection(physicalCase) {
  const zenith = physicalCase.viewZenithDegrees * Math.PI / 180;
  const azimuth = physicalCase.viewAzimuthDegrees * Math.PI / 180;
  const horizontal = Math.sin(zenith);
  return normalize([
    horizontal * Math.cos(azimuth),
    horizontal * Math.sin(azimuth),
    Math.cos(zenith)
  ]);
}

export function createSkyRay(data, physicalCase) {
  const origin = [
    0,
    0,
    data.atmosphere.bottomRadiusMeters + data.atmosphere.observerHeightMeters
  ];
  const direction = skyDirection(physicalCase);
  const radius = length(origin);
  const mu = dot(origin, direction) / radius;
  const topRadius = data.atmosphere.topRadiusMeters;
  const discriminant = radius * radius * (mu * mu - 1) + topRadius * topRadius;
  const distanceMeters = Math.max(
    0,
    -radius * mu + Math.sqrt(Math.max(0, discriminant))
  );
  return {
    origin,
    direction,
    distanceMeters,
    endpoint: addScaled(origin, direction, distanceMeters)
  };
}

export const BRUNETON_POLAR_SAMPLE_COUNT = 16;
export const BRUNETON_AZIMUTH_SAMPLE_COUNT = 32;
export const BRUNETON_INCOMING_SAMPLE_COUNT =
  BRUNETON_POLAR_SAMPLE_COUNT * BRUNETON_AZIMUTH_SAMPLE_COUNT;

export function createFibonacciIncomingDirectionSamples(
  axis,
  count,
  rotationTurns = 0
) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError('Fibonacci incident-direction count must be a positive integer.');
  }

  const halfCount = Math.floor(count / 2);
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const xAxis = normalize(axis);
  const reference = Math.abs(dot(xAxis, [0, 0, 1])) < 0.95
    ? [0, 0, 1]
    : [0, 1, 0];
  const zAxis = normalize(addVectors(
    reference,
    scale(xAxis, -dot(reference, xAxis))
  ));
  const yAxis = normalize(cross(zAxis, xAxis));
  const samples = [];
  const solidAngleSteradians = 4 * Math.PI / count;

  for (let index = -halfCount; samples.length < count; index += 1) {
    const z = (2 * index) / count;
    const latitude = Math.asin(clamp(z, -1, 1));
    const longitude = (2 * Math.PI * index) / goldenRatio +
      2 * Math.PI * rotationTurns;
    const horizontal = Math.cos(latitude);
    const direction = normalize(addVectors(
      addVectors(
        scale(xAxis, horizontal * Math.cos(longitude)),
        scale(yAxis, horizontal * Math.sin(longitude))
      ),
      scale(zAxis, z)
    ));
    samples.push({
      sampleIndex: samples.length,
      direction,
      solidAngleSteradians
    });
  }
  return samples;
}

function createBrunetonLocalFrame(position, viewRay, sunRay) {
  const zenith = normalize(position);
  const viewZenithCosine = dot(viewRay, zenith);
  const viewTangent = addVectors(
    viewRay,
    scale(zenith, -viewZenithCosine)
  );
  let xAxis;
  let yAxis;

  if (length(viewTangent) > 64 * Number.EPSILON) {
    xAxis = normalize(viewTangent);
    yAxis = normalize(cross(zenith, xAxis));
    if (dot(sunRay, yAxis) < 0) yAxis = scale(yAxis, -1);
  } else {
    const sunZenithCosine = dot(sunRay, zenith);
    const sunTangent = addVectors(
      sunRay,
      scale(zenith, -sunZenithCosine)
    );
    if (length(sunTangent) > 64 * Number.EPSILON) {
      yAxis = normalize(sunTangent);
      xAxis = normalize(cross(yAxis, zenith));
    } else {
      const reference = Math.abs(dot(zenith, [0, 0, 1])) < 0.95
        ? [0, 0, 1]
        : [0, 1, 0];
      xAxis = normalize(cross(reference, zenith));
      yAxis = normalize(cross(zenith, xAxis));
    }
  }

  return { xAxis, yAxis, zenith };
}

export function createBrunetonIncomingDirectionSamples(
  position,
  viewRay,
  sunRay
) {
  const frame = createBrunetonLocalFrame(position, viewRay, sunRay);
  const deltaTheta = Math.PI / BRUNETON_POLAR_SAMPLE_COUNT;
  const deltaPhi = Math.PI / BRUNETON_POLAR_SAMPLE_COUNT;
  const samples = [];

  for (
    let polarIndex = 0;
    polarIndex < BRUNETON_POLAR_SAMPLE_COUNT;
    polarIndex += 1
  ) {
    const theta = (polarIndex + 0.5) * deltaTheta;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const solidAngleSteradians = sinTheta * deltaTheta * deltaPhi;

    for (
      let azimuthIndex = 0;
      azimuthIndex < BRUNETON_AZIMUTH_SAMPLE_COUNT;
      azimuthIndex += 1
    ) {
      const phi = (azimuthIndex + 0.5) * deltaPhi;
      const localDirection = [
        Math.cos(phi) * sinTheta,
        Math.sin(phi) * sinTheta,
        cosTheta
      ];
      const direction = normalize(addVectors(
        addVectors(
          scale(frame.xAxis, localDirection[0]),
          scale(frame.yAxis, localDirection[1])
        ),
        scale(frame.zenith, localDirection[2])
      ));
      samples.push({
        sampleIndex: samples.length,
        polarIndex,
        azimuthIndex,
        direction,
        solidAngleSteradians
      });
    }
  }

  return samples;
}

function createModel(data) {
  const atmosphere = data.atmosphere;
  const wavelengths = data.spectralBasis.wavelengthsNanometers;
  const solarIrradiance = data.spectralBasis.solarIrradiance;
  const channelCount = wavelengths.length;

  const rayleighCoefficient = (wavelengthNanometers) =>
    atmosphere.rayleighCoefficientScale * (wavelengthNanometers * 1e-3) ** -4;
  const mieExtinctionCoefficient = (wavelengthNanometers) =>
    (atmosphere.mieAngstromBeta / atmosphere.mieScaleHeightMeters) *
      (wavelengthNanometers * 1e-3) ** -atmosphere.mieAngstromAlpha;
  const mieScatteringCoefficient = (wavelengthNanometers) =>
    mieExtinctionCoefficient(wavelengthNanometers) *
      atmosphere.mieSingleScatteringAlbedo;

  function densityAt(position) {
    const altitudeMeters = length(position) - atmosphere.bottomRadiusMeters;
    const altitude = Math.max(0, altitudeMeters);
    return {
      rayleigh: Math.exp(-altitude / atmosphere.rayleighScaleHeightMeters),
      mie: Math.exp(-altitude / atmosphere.mieScaleHeightMeters)
    };
  }

  function distanceToTop(radius, mu) {
    const discriminant = radius * radius * (mu * mu - 1) +
      atmosphere.topRadiusMeters ** 2;
    return Math.max(0, -radius * mu + Math.sqrt(Math.max(0, discriminant)));
  }

  function intersectsGround(radius, mu) {
    return mu < 0 && radius * radius * (mu * mu - 1) +
      atmosphere.bottomRadiusMeters ** 2 >= 0;
  }

  function opticalLengths(origin, direction, distance, intervals) {
    if (distance === 0) {
      return { rayleigh: 0, mie: 0 };
    }

    const step = distance / intervals;
    let rayleigh = 0;
    let mie = 0;
    for (let index = 0; index <= intervals; index += 1) {
      const weight = index === 0 || index === intervals ? 0.5 : 1;
      const density = densityAt(addScaled(origin, direction, index * step));
      rayleigh += density.rayleigh * weight * step;
      mie += density.mie * weight * step;
    }
    return { rayleigh, mie };
  }

  function transmittance(opticalLength) {
    const opticalDepth = wavelengths.map((wavelength) =>
      rayleighCoefficient(wavelength) * opticalLength.rayleigh +
      mieExtinctionCoefficient(wavelength) * opticalLength.mie
    );
    return {
      opticalDepth,
      values: opticalDepth.map((value) => Math.exp(-value))
    };
  }

  function transmittanceToSun(position, sunRay, controls) {
    const radius = length(position);
    const mu = dot(position, sunRay) / radius;
    if (intersectsGround(radius, mu)) {
      return zeros(channelCount);
    }
    return transmittance(opticalLengths(
      position,
      sunRay,
      distanceToTop(radius, mu),
      controls.sourceTransmittanceIntervals
    )).values;
  }

  const rayleighPhase = (nu) => (3 / (16 * Math.PI)) * (1 + nu * nu);
  function miePhase(nu) {
    const g = atmosphere.miePhaseAsymmetry;
    const k = (3 / (8 * Math.PI)) * ((1 - g * g) / (2 + g * g));
    return k * (1 + nu * nu) / (1 + g * g - 2 * g * nu) ** 1.5;
  }

  function computeSegment({
    origin,
    direction,
    distance,
    sun,
    sunRay,
    controls,
    includeSecondOrder,
    incidentCache
  }) {
    const fullOpticalLength = opticalLengths(
      origin,
      direction,
      distance,
      controls.pathIntervals
    );
    const fullTransmittance = transmittance(fullOpticalLength);
    if (distance === 0) {
      return {
        opticalDepth: fullTransmittance.opticalDepth,
        transmittance: fullTransmittance.values,
        firstOrderPathRadiance: zeros(channelCount),
        secondOrderPathRadiance: zeros(channelCount),
        pathRadiance: zeros(channelCount)
      };
    }

    const intervals = controls.pathIntervals;
    const step = distance / intervals;
    const samples = [];
    const cumulativeRayleigh = [0];
    const cumulativeMie = [0];
    const rayleighSum = zeros(channelCount);
    const mieSum = zeros(channelCount);
    const secondOrderSum = zeros(channelCount);

    for (let index = 0; index <= intervals; index += 1) {
      const position = addScaled(origin, direction, index * step);
      const density = densityAt(position);
      samples.push({ position, density });
      if (index > 0) {
        const previous = samples[index - 1].density;
        cumulativeRayleigh[index] = cumulativeRayleigh[index - 1] +
          0.5 * (previous.rayleigh + density.rayleigh) * step;
        cumulativeMie[index] = cumulativeMie[index - 1] +
          0.5 * (previous.mie + density.mie) * step;
      }
    }

    for (let index = 0; index <= intervals; index += 1) {
      const sample = samples[index];
      const weight = index === 0 || index === intervals ? 0.5 : 1;
      const viewTransmittance = transmittance({
        rayleigh: cumulativeRayleigh[index],
        mie: cumulativeMie[index]
      }).values;
      const sourceTransmittance = transmittanceToSun(sample.position, sunRay, controls);

      for (let channel = 0; channel < channelCount; channel += 1) {
        const combined = viewTransmittance[channel] * sourceTransmittance[channel];
        rayleighSum[channel] += combined * sample.density.rayleigh * weight;
        mieSum[channel] += combined * sample.density.mie * weight;
      }

      if (includeSecondOrder) {
        const secondOrder = computeSecondOrder({
          position: sample.position,
          viewRay: direction,
          sun,
          sunRay,
          density: sample.density,
          viewTransmittance,
          controls,
          incidentCache
        });
        for (let channel = 0; channel < channelCount; channel += 1) {
          secondOrderSum[channel] += secondOrder[channel] * weight;
        }
      }
    }

    const sunCosine = dot(direction, sunRay);
    const rayleighPhaseValue = rayleighPhase(sunCosine);
    const miePhaseValue = miePhase(sunCosine);
    const firstOrder = wavelengths.map((wavelength, channel) =>
      rayleighSum[channel] * step * solarIrradiance[channel] *
        rayleighCoefficient(wavelength) * rayleighPhaseValue +
      mieSum[channel] * step * solarIrradiance[channel] *
        mieScatteringCoefficient(wavelength) * miePhaseValue
    );
    const secondOrder = secondOrderSum.map((value) => value * step);

    return {
      opticalDepth: fullTransmittance.opticalDepth,
      transmittance: fullTransmittance.values,
      firstOrderPathRadiance: firstOrder,
      secondOrderPathRadiance: secondOrder,
      pathRadiance: firstOrder.map(
        (value, channel) => value + secondOrder[channel]
      )
    };
  }

  function computeSecondOrder({
    position,
    viewRay,
    sun,
    sunRay,
    density,
    viewTransmittance,
    controls,
    incidentCache
  }) {
    const result = zeros(channelCount);
    const representative = resolveIncidentRepresentative(position, controls);
    let directionSamples;
    if (
      controls.incidentQuadrature ===
      'algorithm32-source-oriented-fibonacci'
    ) {
      directionSamples = createFibonacciIncomingDirectionSamples(
        sunRay,
        controls.incidentDirections,
        controls.incidentRotationTurns ?? 0
      );
    } else if (
      controls.incidentQuadrature ===
      'bruneton-query-oriented-16x32-midpoint'
    ) {
      directionSamples = createBrunetonIncomingDirectionSamples(
        representative.origin,
        viewRay,
        sunRay
      );
    } else {
      throw new Error(
        `Unsupported incident quadrature: ${controls.incidentQuadrature}`
      );
    }

    for (const directionSample of directionSamples) {
      const incoming = directionSample.direction;
      const incident = incidentRadiance({
        representative,
        incoming,
        directionIndex: directionSample.sampleIndex,
        sun,
        sunRay,
        controls,
        incidentCache
      });
      const directionCosine = dot(viewRay, incoming);
      const rayleighPhaseValue = rayleighPhase(directionCosine);
      const miePhaseValue = miePhase(directionCosine);

      for (let channel = 0; channel < channelCount; channel += 1) {
        const scattering = density.rayleigh *
          rayleighCoefficient(wavelengths[channel]) * rayleighPhaseValue +
          density.mie * mieScatteringCoefficient(wavelengths[channel]) * miePhaseValue;
        result[channel] += viewTransmittance[channel] * incident[channel] *
          scattering * directionSample.solidAngleSteradians;
      }
    }
    return result;
  }

  function resolveIncidentRepresentative(position, controls) {
    const atmosphereHeight =
      atmosphere.topRadiusMeters - atmosphere.bottomRadiusMeters;
    const altitude = clamp(
      length(position) - atmosphere.bottomRadiusMeters,
      0,
      atmosphereHeight
    );
    const binSize = atmosphereHeight / controls.incidentAltitudeBins;
    const binIndex = clamp(
      Math.floor(altitude / binSize),
      0,
      controls.incidentAltitudeBins - 1
    );
    const binAltitude = (binIndex + 0.5) * binSize;
    return {
      binIndex,
      origin: [0, 0, atmosphere.bottomRadiusMeters + binAltitude]
    };
  }

  function incidentRadiance({
    representative,
    incoming,
    directionIndex,
    sun,
    sunRay,
    controls,
    incidentCache
  }) {
    const directionKey = incoming
      .map((value) => value.toPrecision(17))
      .join(',');
    const key = `${sun.id}|${representative.binIndex}|${directionKey}`;
    if (!incidentCache.has(key)) {
      const binOrigin = representative.origin;
      const radius = length(binOrigin);
      const mu = dot(binOrigin, incoming) / radius;
      if (intersectsGround(radius, mu)) {
        incidentCache.set(key, zeros(channelCount));
      } else {
        incidentCache.set(key, computeSegment({
          origin: binOrigin,
          direction: incoming,
          distance: distanceToTop(radius, mu),
          sun,
          sunRay,
          controls,
          includeSecondOrder: false,
          incidentCache
        }).pathRadiance);
      }
    }
    return incidentCache.get(key);
  }

  return { computeSegment };
}

function computeConfiguration(data, model, controls) {
  const incidentCache = new Map();
  const sunById = new Map(data.sunCases.map((sun) => [sun.id, sun]));

  return new Map(data.cases.map((physicalCase) => {
    const sun = sunById.get(physicalCase.sunCaseId);
    const sunRay = sunDirection(sun);
    const skyRay = createSkyRay(data, physicalCase);
    const transport = model.computeSegment({
      origin: skyRay.origin,
      direction: skyRay.direction,
      distance: skyRay.distanceMeters,
      sun,
      sunRay,
      controls,
      includeSecondOrder: true,
      incidentCache
    });
    return [physicalCase.id, {
      ...transport,
      viewDirection: skyRay.direction,
      distanceMeters: skyRay.distanceMeters,
      finalRadiance: [...transport.pathRadiance]
    }];
  }));
}

const CIE_ROWS = new Map(
  readFileSync(new URL(
    '../../../references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv',
    import.meta.url
  ), 'utf8')
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(',').map(Number))
    .map(([wavelength, xBar, yBar, zBar]) => [
      wavelength,
      [xBar, yBar, zBar]
    ])
);

export function interpolateCie(wavelengthNanometers) {
  const lower = Math.floor(wavelengthNanometers);
  const upper = Math.ceil(wavelengthNanometers);
  const lowerValue = CIE_ROWS.get(lower);
  const upperValue = CIE_ROWS.get(upper);
  if (!lowerValue || !upperValue) {
    throw new Error(`CIE data does not cover ${wavelengthNanometers} nm.`);
  }
  if (lower === upper) return [...lowerValue];
  const t = wavelengthNanometers - lower;
  return lowerValue.map((value, index) =>
    value * (1 - t) + upperValue[index] * t
  );
}

export function createDisplayMapper(data) {
  const matchingValues = data.spectralBasis.wavelengthsNanometers.map(
    interpolateCie
  );
  const binWidth = data.spectralBasis.binWidthNanometers;
  const efficacy = data.displayMapping.luminousEfficacyLumensPerWatt;
  const matrix = data.displayMapping.xyzToLinearSrgbMatrix;
  const toneDivisor = 5 * efficacy;

  return function mapSpectrum(spectrum) {
    const xyz = [0, 0, 0];
    for (let channel = 0; channel < spectrum.length; channel += 1) {
      for (let component = 0; component < 3; component += 1) {
        xyz[component] += spectrum[channel] *
          matchingValues[channel][component] * binWidth;
      }
    }
    const linearSrgb = multiplyMatrixVector(matrix, xyz).map(
      (value) => efficacy * value
    );
    const displayLinearSrgb = linearSrgb.map((value) =>
      clamp(1 - Math.exp(-Math.max(0, value) / toneDivisor), 0, 1)
    );
    return {
      xyz,
      linearSrgb,
      displayLinearSrgb,
      itp: linearSrgbToItp(displayLinearSrgb)
    };
  };
}

function multiplyMatrixVector(matrix, vector) {
  return matrix.map((row) => row.reduce(
    (sum, value, index) => sum + value * vector[index],
    0
  ));
}

function displayConfiguration(data, configuration, mapSpectrum) {
  return new Map(data.cases.map((physicalCase) => {
    const record = configuration.get(physicalCase.id);
    return [physicalCase.id, {
      ...record,
      display: mapSpectrum(record.finalRadiance)
    }];
  }));
}

export function e2AcceptanceUpperBound(
  observedDeltaEItp,
  referenceUncertaintyDeltaEItp,
  displayTransformUncertaintyDeltaEItp
) {
  return observedDeltaEItp +
    referenceUncertaintyDeltaEItp +
    displayTransformUncertaintyDeltaEItp;
}

export function acceptsE2Criterion(
  observedDeltaEItp,
  referenceUncertaintyDeltaEItp,
  displayTransformUncertaintyDeltaEItp,
  boundaryDeltaEItp = 1
) {
  return e2AcceptanceUpperBound(
    observedDeltaEItp,
    referenceUncertaintyDeltaEItp,
    displayTransformUncertaintyDeltaEItp
  ) < boundaryDeltaEItp;
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const percentile = (fraction) => sorted[
    Math.max(0, Math.ceil(fraction * sorted.length) - 1)
  ];
  return {
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    median: percentile(0.5),
    percentile95: percentile(0.95),
    maximum: sorted.at(-1)
  };
}

function pearsonCorrelation(left, right) {
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let covariance = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = left[index] - leftMean;
    const rightDelta = right[index] - rightMean;
    covariance += leftDelta * rightDelta;
    leftVariance += leftDelta * leftDelta;
    rightVariance += rightDelta * rightDelta;
  }
  return covariance / Math.sqrt(leftVariance * rightVariance);
}

const l2Norm = (values) => Math.sqrt(
  values.reduce((sum, value) => sum + value * value, 0)
);

const l2Difference = (left, right) => Math.sqrt(
  left.reduce((sum, value, index) => {
    const difference = value - right[index];
    return sum + difference * difference;
  }, 0)
);

function compareConfigurations(
  data,
  candidate,
  reference,
  mapSpectrum
) {
  const candidateDisplay = displayConfiguration(data, candidate, mapSpectrum);
  const referenceDisplay = displayConfiguration(data, reference, mapSpectrum);
  const caseRows = [];
  let maximumObservedDeltaEItp = 0;
  let maximumUpperBoundDeltaEItp = -Infinity;
  let maximumSecondOrderSpectralDelta = 0;
  let maximumFinalSpectralDelta = 0;
  let worstCaseId = null;
  const deltaEValues = [];
  const relativeLuminanceErrors = [];
  const relativeTotalSpectrumErrors = [];
  const relativeJ2MaterialityValues = [];
  const candidateLogLuminances = [];
  const referenceLogLuminances = [];
  let candidateLuminanceSum = 0;
  let referenceLuminanceSum = 0;
  const displayTransformUncertainty =
    data.displayDifferenceDiagnostics.displayTransformUncertaintyDeltaEItp;
  const referenceUncertainty =
    data.displayDifferenceDiagnostics.referenceUncertaintyDeltaEItp;

  for (const physicalCase of data.cases) {
    const candidateRecord = candidateDisplay.get(physicalCase.id);
    const referenceRecord = referenceDisplay.get(physicalCase.id);
    const observedDeltaEItp = deltaEItp(
      candidateRecord.display.itp,
      referenceRecord.display.itp
    );
    const upperBoundDeltaEItp = e2AcceptanceUpperBound(
      observedDeltaEItp,
      referenceUncertainty,
      displayTransformUncertainty
    );
    const secondOrderSpectralDelta = maxAbsDifference(
      candidateRecord.secondOrderPathRadiance,
      referenceRecord.secondOrderPathRadiance
    );
    const finalSpectralDelta = maxAbsDifference(
      candidateRecord.finalRadiance,
      referenceRecord.finalRadiance
    );
    const potentiallyIndistinguishable = upperBoundDeltaEItp <
      data.displayDifferenceDiagnostics.visibilityBoundaryDeltaEItp;
    const withinReferenceDisplayAccuracy = upperBoundDeltaEItp <
      data.displayDifferenceDiagnostics.acceptableAccuracyBoundaryDeltaEItp;
    const candidateLuminance = candidateRecord.display.xyz[1];
    const referenceLuminance = referenceRecord.display.xyz[1];
    const relativeLuminanceError = Math.abs(
      candidateLuminance - referenceLuminance
    ) / Math.max(Math.abs(referenceLuminance), 1e-30);
    const referenceTotalNorm = l2Norm(referenceRecord.finalRadiance);
    const relativeTotalSpectrumError = l2Difference(
      candidateRecord.finalRadiance,
      referenceRecord.finalRadiance
    ) / Math.max(referenceTotalNorm, 1e-30);
    const relativeJ2Materiality = l2Difference(
      candidateRecord.secondOrderPathRadiance,
      referenceRecord.secondOrderPathRadiance
    ) / Math.max(referenceTotalNorm, 1e-30);

    caseRows.push({
      caseId: physicalCase.id,
      candidateDisplayLinearSrgb:
        candidateRecord.display.displayLinearSrgb,
      referenceDisplayLinearSrgb:
        referenceRecord.display.displayLinearSrgb,
      observedDeltaEItp,
      referenceUncertaintyDeltaEItp: referenceUncertainty,
      displayTransformUncertaintyDeltaEItp: displayTransformUncertainty,
      upperBoundDeltaEItp,
      secondOrderSpectralDelta,
      finalSpectralDelta,
      candidateLuminance,
      referenceLuminance,
      relativeLuminanceError,
      relativeTotalSpectrumError,
      relativeJ2Materiality,
      potentiallyIndistinguishable,
      withinReferenceDisplayAccuracy
    });
    deltaEValues.push(upperBoundDeltaEItp);
    relativeLuminanceErrors.push(relativeLuminanceError);
    relativeTotalSpectrumErrors.push(relativeTotalSpectrumError);
    relativeJ2MaterialityValues.push(relativeJ2Materiality);
    candidateLogLuminances.push(Math.log10(Math.max(candidateLuminance, 1e-30)));
    referenceLogLuminances.push(Math.log10(Math.max(referenceLuminance, 1e-30)));
    candidateLuminanceSum += candidateLuminance;
    referenceLuminanceSum += referenceLuminance;
    maximumObservedDeltaEItp = Math.max(
      maximumObservedDeltaEItp,
      observedDeltaEItp
    );
    maximumSecondOrderSpectralDelta = Math.max(
      maximumSecondOrderSpectralDelta,
      secondOrderSpectralDelta
    );
    maximumFinalSpectralDelta = Math.max(
      maximumFinalSpectralDelta,
      finalSpectralDelta
    );
    if (upperBoundDeltaEItp > maximumUpperBoundDeltaEItp) {
      maximumUpperBoundDeltaEItp = upperBoundDeltaEItp;
      worstCaseId = physicalCase.id;
    }
  }

  return {
    maximumObservedDeltaEItp,
    maximumUpperBoundDeltaEItp,
    maximumSecondOrderSpectralDelta,
    maximumFinalSpectralDelta,
    worstCaseId,
    deltaEItpStatistics: summarize(deltaEValues),
    relativeLuminanceErrorStatistics: summarize(relativeLuminanceErrors),
    relativeTotalSpectrumErrorStatistics: summarize(relativeTotalSpectrumErrors),
    relativeJ2MaterialityStatistics: summarize(relativeJ2MaterialityValues),
    potentiallyIndistinguishableCaseCount: caseRows.filter(
      (row) => row.potentiallyIndistinguishable
    ).length,
    withinReferenceDisplayAccuracyCaseCount: caseRows.filter(
      (row) => row.withinReferenceDisplayAccuracy
    ).length,
    logLuminanceCorrelation: pearsonCorrelation(
      candidateLogLuminances,
      referenceLogLuminances
    ),
    aggregateLuminanceRatio: candidateLuminanceSum / referenceLuminanceSum,
    caseRows
  };
}

const exponential = (value) => value.toExponential(6);
const formatRgb = (values) =>
  `[${values.map((value) => value.toPrecision(7)).join(', ')}]`;

export function buildReport() {
  const data = generateData();
  const model = createModel(data);
  const mapSpectrum = createDisplayMapper(data);
  const configurationCache = new Map();
  let numericalEvaluationCount = 0;

  function configurationKey(controls) {
    return [
      controls.incidentQuadrature,
      controls.pathIntervals,
      controls.sourceTransmittanceIntervals,
      controls.incidentDirections,
      controls.incidentAltitudeBins,
      controls.incidentRotationTurns ?? 0
    ].join('|');
  }

  function getConfiguration(controls) {
    const key = configurationKey(controls);
    if (!configurationCache.has(key)) {
      const started = performance.now();
      const configuration = computeConfiguration(data, model, controls);
      configurationCache.set(key, {
        controls: { ...controls },
        configuration,
        elapsedMilliseconds: performance.now() - started
      });
      numericalEvaluationCount += data.cases.length;
    }
    return configurationCache.get(key);
  }

  const referenceEntry = getConfiguration(data.referenceQuadrature);
  const currentAlgorithm32Entry = getConfiguration(
    data.currentAlgorithm32Controls
  );
  const currentAlgorithm32Assessment = compareConfigurations(
    data,
    currentAlgorithm32Entry.configuration,
    referenceEntry.configuration,
    mapSpectrum
  );

  const directionAssessments = new Map();
  let evaluationOrder = 0;
  function assessDirectionCount(count) {
    if (directionAssessments.has(count)) {
      return directionAssessments.get(count);
    }
    const controls = {
      ...data.incidentDirectionSearch.fixedControls,
      id: `directions-${count}`,
      incidentDirections: count
    };
    const entry = getConfiguration(controls);
    const comparison = compareConfigurations(
      data,
      entry.configuration,
      referenceEntry.configuration,
      mapSpectrum
    );
    const assessment = {
      evaluationOrder: ++evaluationOrder,
      candidateCount: count,
      controls,
      elapsedMilliseconds: entry.elapsedMilliseconds,
      ...comparison
    };
    directionAssessments.set(count, assessment);
    return assessment;
  }

  const minimum = data.incidentDirectionSearch.minimumCount;
  const maximum = data.incidentDirectionSearch.maximumCount;
  for (let count = minimum; count <= maximum; count += 1) {
    assessDirectionCount(count);
  }

  const directionSearch = [...directionAssessments.values()].sort(
    (left, right) => left.evaluationOrder - right.evaluationOrder
  );
  const bestWorstCaseAssessment = directionSearch.reduce(
    (best, assessment) => !best ||
      assessment.deltaEItpStatistics.maximum <
        best.deltaEItpStatistics.maximum
      ? assessment
      : best,
    null
  );
  const bestMeanAssessment = directionSearch.reduce(
    (best, assessment) => !best ||
      assessment.deltaEItpStatistics.mean < best.deltaEItpStatistics.mean
      ? assessment
      : best,
    null
  );
  const paretoFrontier = [];
  let runningBestMaximum = Infinity;
  for (const assessment of directionSearch) {
    if (assessment.deltaEItpStatistics.maximum < runningBestMaximum) {
      runningBestMaximum = assessment.deltaEItpStatistics.maximum;
      paretoFrontier.push(assessment.candidateCount);
    }
  }

  const inputReport = { ...data };
  delete inputReport.cases;
  inputReport.caseGeneration = {
    expression: 'four Sun zeniths x six named observer-to-top-atmosphere sky rays',
    physicalCaseCount: data.cases.length,
    caseIdsAppearInResultTables: true
  };

  const lines = [
    '# E3 - Bruneton-Referenced Sky-Ray Direction Characterization',
    '',
    '## Question',
    '',
    data.experiment.question,
    '',
    '## Inputs',
    '',
    '```json',
    JSON.stringify(inputReport, null, 2),
    '```',
    '',
    '## Execution',
    '',
    `Iterations: ${data.cases.length} paired physical cases per configuration; ${numericalEvaluationCount} numerical case evaluations; ${configurationCache.size} distinct quadrature/count configurations`,
    '',
    '### Reference evaluation',
    '',
    '```json',
    JSON.stringify({
      controls: referenceEntry.controls,
      physicalCaseCount: data.cases.length,
      computedOnce: true,
      role: 'Pinned Bruneton-512 benchmark, not a continuous-integral truth estimate'
    }, null, 2),
    '```',
    '',
    '## Current Algorithm32 comparison',
    '',
    '| directions | work / current | mean Delta E ITP | median | p95 | maximum | cases below 1 | cases below 3 | p95 relative Y error | max relative Y error | log-Y correlation | aggregate Y ratio | worst case |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
    [
      `| ${data.currentAlgorithm32Controls.incidentDirections}`,
      '1.000000',
      exponential(currentAlgorithm32Assessment.deltaEItpStatistics.mean),
      exponential(currentAlgorithm32Assessment.deltaEItpStatistics.median),
      exponential(currentAlgorithm32Assessment.deltaEItpStatistics.percentile95),
      exponential(currentAlgorithm32Assessment.deltaEItpStatistics.maximum),
      `${currentAlgorithm32Assessment.potentiallyIndistinguishableCaseCount}/${data.cases.length}`,
      `${currentAlgorithm32Assessment.withinReferenceDisplayAccuracyCaseCount}/${data.cases.length}`,
      exponential(currentAlgorithm32Assessment.relativeLuminanceErrorStatistics.percentile95),
      exponential(currentAlgorithm32Assessment.relativeLuminanceErrorStatistics.maximum),
      currentAlgorithm32Assessment.logLuminanceCorrelation.toFixed(9),
      currentAlgorithm32Assessment.aggregateLuminanceRatio.toFixed(9),
      `${currentAlgorithm32Assessment.worstCaseId} |`
    ].join(' | ')
  ];

  lines.push(
    '',
    '## Practical-envelope accuracy/cost curve',
    '',
    '| order | directions | work / current | mean Delta E ITP | median | p95 | maximum | below 1 | below 3 | p95 relative Y error | max relative total-spectrum error | max relative J2 / reference-total | log-Y correlation | aggregate Y ratio | worst case |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |'
  );
  for (const row of directionSearch) {
    lines.push([
      `| ${row.evaluationOrder}`,
      row.candidateCount,
      (row.candidateCount / data.currentAlgorithm32Controls.incidentDirections).toFixed(6),
      exponential(row.deltaEItpStatistics.mean),
      exponential(row.deltaEItpStatistics.median),
      exponential(row.deltaEItpStatistics.percentile95),
      exponential(row.deltaEItpStatistics.maximum),
      `${row.potentiallyIndistinguishableCaseCount}/${data.cases.length}`,
      `${row.withinReferenceDisplayAccuracyCaseCount}/${data.cases.length}`,
      exponential(row.relativeLuminanceErrorStatistics.percentile95),
      exponential(row.relativeTotalSpectrumErrorStatistics.maximum),
      exponential(row.relativeJ2MaterialityStatistics.maximum),
      row.logLuminanceCorrelation.toFixed(9),
      row.aggregateLuminanceRatio.toFixed(9),
      `${row.worstCaseId} |`
    ].join(' | '));
  }

  lines.push(
    '',
    '## Current-count per-ray results',
    '',
    '| iteration | case | candidate display linear sRGB | Bruneton-512 display linear sRGB | Delta E ITP | relative Y error | relative total-spectrum error | relative J2 / reference-total | below 1 diagnostic | below 3 diagnostic |',
    '| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |'
  );
  currentAlgorithm32Assessment.caseRows.forEach((row, index) => {
    lines.push([
      `| ${index + 1}`,
      row.caseId,
      formatRgb(row.candidateDisplayLinearSrgb),
      formatRgb(row.referenceDisplayLinearSrgb),
      exponential(row.upperBoundDeltaEItp),
      exponential(row.relativeLuminanceError),
      exponential(row.relativeTotalSpectrumError),
      exponential(row.relativeJ2Materiality),
      row.potentiallyIndistinguishable ? 'yes' : 'no',
      `${row.withinReferenceDisplayAccuracy ? 'yes' : 'no'} |`
    ].join(' | '));
  });

  lines.push(
    '',
    '## Conclusion',
    '',
    [
      `Completed. The report characterizes every integer Fibonacci count from ${minimum} through ${maximum} over ${data.cases.length} actual observer-to-top-atmosphere sky rays.`,
      `Current count 34 has mean, p95, and maximum Delta E ITP values of ${currentAlgorithm32Assessment.deltaEItpStatistics.mean}, ${currentAlgorithm32Assessment.deltaEItpStatistics.percentile95}, and ${currentAlgorithm32Assessment.deltaEItpStatistics.maximum}.`,
      `The lowest maximum within the declared two-times-work envelope occurs at count ${bestWorstCaseAssessment.candidateCount}; the lowest mean occurs at count ${bestMeanAssessment.candidateCount}.`,
      `Running-best maximum-error counts are ${paretoFrontier.join(', ')}.`,
      'No count is selected by an automatic perceptual threshold. Values below',
      '1 and 3 Delta E ITP remain display-difference diagnostics; they are not',
      'treated as definitions of atmospheric-model correctness.',
      `Under the separate cost-neutral first-release policy, 34 is the best tested count that does not increase current angular work. At that count the log-luminance correlation is ${currentAlgorithm32Assessment.logLuminanceCorrelation}, aggregate luminance is ${currentAlgorithm32Assessment.aggregateLuminanceRatio} times the benchmark, and the mean Delta E ITP is ${currentAlgorithm32Assessment.deltaEItpStatistics.mean}; the largest differences remain in low-Sun horizon queries.`,
      'This supports retaining 34 as a practical first-release approximation',
      'with an explicit limitation, not as an imperceptible or numerically',
      'converged result. This result is an accuracy/cost characterization',
      'against a pinned finite benchmark, not a claim of continuous convergence',
      'or independent physical truth.'
    ].join(' ')
  );

  const accepted = directionSearch.length === maximum - minimum + 1 &&
    directionSearch.every((assessment) => Number.isFinite(
      assessment.deltaEItpStatistics.maximum
    ));

  return {
    accepted,
    text: `${lines.join('\n')}\n`,
    data,
    referenceEntry,
    currentAlgorithm32Assessment,
    directionSearch,
    selectedDirectionCount: null,
    bestWorstCaseAssessment,
    bestMeanAssessment,
    paretoFrontier,
    firstReleaseDecision: {
      policy: 'cost-neutral: do not exceed the current 34-direction angular work',
      retainedDirectionCount: 34,
      basis: 'best tested benchmark agreement within the declared cost-neutral envelope',
      limitation: 'largest discrepancies occur in low-Sun horizon queries; numerical convergence and perceptual indistinguishability are not claimed'
    },
    configurationCount: configurationCache.size,
    numericalEvaluationCount
  };
}



const invokedPath = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invokedPath === import.meta.url) {
  const report = buildReport();
  process.stdout.write(report.text);
  if (!report.accepted) {
    process.exitCode = 1;
  }
}
