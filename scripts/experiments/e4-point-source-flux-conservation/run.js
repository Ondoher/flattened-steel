import { pathToFileURL } from 'node:url';

export const EXPERIMENT = 'E4';
export const NAME = 'Point-Source Flux Conservation';
export const QUESTION = [
  'What point-response normalization and raster-boundary accounting conserve',
  'transported point flux when it is distributed as pixel spectral radiance?'
].join(' ');

export const CHANNEL_COUNT = 15;
const ROUNDING_SAFETY_FACTOR = 8;

const packet = (factory) => Object.freeze(
  Array.from({ length: CHANNEL_COUNT }, (_, channel) => factory(channel))
);

export const SOURCE_PACKETS = Object.freeze({
  primary: packet((channel) => (channel + 1) * (channel + 2) * 1e-13),
  secondary: packet((channel) => (0.25 + (CHANNEL_COUNT - channel) * 0.6) * 1e-13)
});

const entry = (pixelId, weight, solidAngleSteradians, onRaster) =>
  Object.freeze({ pixelId, weight, solidAngleSteradians, onRaster });

const source = (sourceId, flux, footprint) => Object.freeze({
  sourceId,
  flux,
  footprint: Object.freeze(footprint)
});

const singleSourceCase = (id, description, footprint) => Object.freeze({
  id,
  description,
  sources: Object.freeze([source('primary', SOURCE_PACKETS.primary, footprint)])
});

export const CASES = Object.freeze([
  singleSourceCase('interior', 'Four-pixel interior response.', [
    entry('p00', 0.25, 2.0e-6, true),
    entry('p10', 0.25, 2.1e-6, true),
    entry('p01', 0.25, 2.2e-6, true),
    entry('p11', 0.25, 2.3e-6, true)
  ]),
  singleSourceCase('subpixel', 'Asymmetric subpixel response.', [
    entry('p00', 0.125, 1.7e-6, true),
    entry('p10', 0.375, 1.8e-6, true),
    entry('p01', 0.125, 1.9e-6, true),
    entry('p11', 0.375, 2.0e-6, true)
  ]),
  singleSourceCase('edge', 'Half of the response lies beyond one raster edge.', [
    entry('edge-on-0', 0.3, 2.4e-6, true),
    entry('edge-on-1', 0.2, 2.5e-6, true),
    entry('edge-off-0', 0.3, 2.4e-6, false),
    entry('edge-off-1', 0.2, 2.5e-6, false)
  ]),
  singleSourceCase('corner', 'Only one response entry remains on raster.', [
    entry('corner-on', 0.16, 3.0e-6, true),
    entry('corner-off-x', 0.24, 3.1e-6, false),
    entry('corner-off-y', 0.24, 3.2e-6, false),
    entry('corner-off-xy', 0.36, 3.3e-6, false)
  ]),
  singleSourceCase('fully-off-raster', 'The complete normalized response is off raster.', [
    entry('off-0', 0.25, 2.7e-6, false),
    entry('off-1', 0.25, 2.8e-6, false),
    entry('off-2', 0.25, 2.9e-6, false),
    entry('off-3', 0.25, 3.0e-6, false)
  ]),
  singleSourceCase('fine-resolution', 'Small pixel solid angles represent a fine raster.', [
    entry('fine-0', 0.5, 1.0e-7, true),
    entry('fine-1', 0.5, 1.2e-7, true)
  ]),
  singleSourceCase('wide-field', 'Large pixel solid angles represent a wider field of view.', [
    entry('wide-0', 0.5, 8.0e-6, true),
    entry('wide-1', 0.5, 9.0e-6, true)
  ]),
  Object.freeze({
    id: 'overlapping-sources',
    description: 'Two sources contribute linearly to one shared pixel.',
    sources: Object.freeze([
      source('primary', SOURCE_PACKETS.primary, [
        entry('shared', 1, 2.0e-6, true)
      ]),
      source('secondary', SOURCE_PACKETS.secondary, [
        entry('shared', 0.5, 2.0e-6, true),
        entry('secondary-neighbor', 0.5, 2.5e-6, true)
      ])
    ])
  })
]);

const zeros = () => Array(CHANNEL_COUNT).fill(0);

function assertPacket(name, value) {
  if (!Array.isArray(value) || value.length !== CHANNEL_COUNT) {
    throw new TypeError(`${name} must contain exactly ${CHANNEL_COUNT} channels.`);
  }
  if (value.some((channel) => !Number.isFinite(channel) || channel < 0)) {
    throw new TypeError(`${name} must contain finite nonnegative values.`);
  }
}

function assertEntry(value) {
  if (!value || typeof value.pixelId !== 'string' || value.pixelId.length === 0) {
    throw new TypeError('Response entry requires a pixelId.');
  }
  if (!Number.isFinite(value.weight) || value.weight < 0) {
    throw new TypeError('Response entry weight must be finite and nonnegative.');
  }
  if (!Number.isFinite(value.solidAngleSteradians) || value.solidAngleSteradians <= 0) {
    throw new TypeError('Response entry solid angle must be finite and positive.');
  }
  if (typeof value.onRaster !== 'boolean') {
    throw new TypeError('Response entry requires an onRaster classification.');
  }
}

function addPacket(target, addition) {
  for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
    target[channel] += addition[channel];
  }
  return target;
}

function scalePacket(value, scale) {
  return value.map((channel) => channel * scale);
}

function gamma(operationCount) {
  const product = operationCount * Number.EPSILON;
  if (product >= 1) throw new RangeError('Floating-point operation bound is invalid.');
  return product / (1 - product);
}

function packetComparison(actual, expected, operationCount) {
  assertPacket('actual packet', actual);
  assertPacket('expected packet', expected);
  const relativeBound = ROUNDING_SAFETY_FACTOR * gamma(operationCount);
  let maximumAbsoluteResidual = 0;
  let maximumLimit = 0;
  let accepted = true;

  for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
    const residual = Math.abs(actual[channel] - expected[channel]);
    const limit = Math.max(Number.MIN_VALUE, Math.abs(expected[channel]) * relativeBound);
    maximumAbsoluteResidual = Math.max(maximumAbsoluteResidual, residual);
    maximumLimit = Math.max(maximumLimit, limit);
    accepted &&= residual <= limit;
  }

  return Object.freeze({
    maximumAbsoluteResidual,
    maximumLimit,
    relativeBound,
    accepted
  });
}

export function spectralRadianceForEntry(flux, responseWeight, solidAngleSteradians) {
  assertPacket('spectral flux density', flux);
  if (!Number.isFinite(responseWeight) || responseWeight < 0) {
    throw new TypeError('Response weight must be finite and nonnegative.');
  }
  if (!Number.isFinite(solidAngleSteradians) || solidAngleSteradians <= 0) {
    throw new TypeError('Pixel solid angle must be finite and positive.');
  }
  return flux.map((channel) => channel * responseWeight / solidAngleSteradians);
}

function evaluateSource(input) {
  assertPacket(`${input.sourceId} flux`, input.flux);
  if (!Array.isArray(input.footprint) || input.footprint.length === 0) {
    throw new TypeError(`${input.sourceId} requires a nonempty response footprint.`);
  }

  let onRasterMass = 0;
  let offRasterMass = 0;
  const observedOnRasterFlux = zeros();
  const observedOffRasterFlux = zeros();
  const evaluatedEntries = [];

  for (const footprintEntry of input.footprint) {
    assertEntry(footprintEntry);
    const radiance = spectralRadianceForEntry(
      input.flux,
      footprintEntry.weight,
      footprintEntry.solidAngleSteradians
    );
    const recoveredFlux = scalePacket(radiance, footprintEntry.solidAngleSteradians);

    if (footprintEntry.onRaster) {
      onRasterMass += footprintEntry.weight;
      addPacket(observedOnRasterFlux, recoveredFlux);
    } else {
      offRasterMass += footprintEntry.weight;
      addPacket(observedOffRasterFlux, recoveredFlux);
    }

    evaluatedEntries.push(Object.freeze({ ...footprintEntry, radiance }));
  }

  const responseMass = onRasterMass + offRasterMass;
  const massLimit = ROUNDING_SAFETY_FACTOR * gamma(input.footprint.length + 1);
  const massAccepted = Math.abs(responseMass - 1) <= massLimit;
  const expectedOnRasterFlux = scalePacket(input.flux, onRasterMass);
  const expectedOffRasterFlux = scalePacket(input.flux, offRasterMass);
  const expectedTotalFlux = [...input.flux];
  const observedTotalFlux = addPacket(
    [...observedOnRasterFlux],
    observedOffRasterFlux
  );
  const operationCount = 4 * input.footprint.length + 4;
  const onComparison = packetComparison(
    observedOnRasterFlux,
    expectedOnRasterFlux,
    operationCount
  );
  const offComparison = packetComparison(
    observedOffRasterFlux,
    expectedOffRasterFlux,
    operationCount
  );
  const totalComparison = packetComparison(
    observedTotalFlux,
    expectedTotalFlux,
    operationCount
  );

  return Object.freeze({
    sourceId: input.sourceId,
    inputFlux: input.flux,
    entries: Object.freeze(evaluatedEntries),
    onRasterMass,
    offRasterMass,
    responseMass,
    massLimit,
    observedOnRasterFlux: Object.freeze(observedOnRasterFlux),
    observedOffRasterFlux: Object.freeze(observedOffRasterFlux),
    observedTotalFlux: Object.freeze(observedTotalFlux),
    expectedOnRasterFlux: Object.freeze(expectedOnRasterFlux),
    expectedOffRasterFlux: Object.freeze(expectedOffRasterFlux),
    onComparison,
    offComparison,
    totalComparison,
    accepted: massAccepted && onComparison.accepted &&
      offComparison.accepted && totalComparison.accepted
  });
}

function aggregateOnRasterFlux(sourceResults) {
  const pixels = new Map();

  for (const sourceResult of sourceResults) {
    for (const evaluatedEntry of sourceResult.entries) {
      if (!evaluatedEntry.onRaster) continue;
      const prior = pixels.get(evaluatedEntry.pixelId);
      if (prior && prior.solidAngleSteradians !== evaluatedEntry.solidAngleSteradians) {
        throw new Error(`Pixel ${evaluatedEntry.pixelId} has conflicting solid angles.`);
      }
      const radiance = prior?.radiance ?? zeros();
      addPacket(radiance, evaluatedEntry.radiance);
      pixels.set(evaluatedEntry.pixelId, {
        solidAngleSteradians: evaluatedEntry.solidAngleSteradians,
        radiance
      });
    }
  }

  const recovered = zeros();
  for (const pixel of pixels.values()) {
    addPacket(recovered, scalePacket(pixel.radiance, pixel.solidAngleSteradians));
  }
  return Object.freeze(recovered);
}

export function evaluateCase(input) {
  if (!input || !Array.isArray(input.sources) || input.sources.length === 0) {
    throw new TypeError('Point-source case requires at least one source.');
  }
  const sourceResults = input.sources.map(evaluateSource);
  const aggregateObservedOnRasterFlux = aggregateOnRasterFlux(sourceResults);
  const aggregateExpectedOnRasterFlux = sourceResults.reduce(
    (sum, result) => addPacket(sum, result.expectedOnRasterFlux),
    zeros()
  );
  const aggregateOffRasterFlux = sourceResults.reduce(
    (sum, result) => addPacket(sum, result.observedOffRasterFlux),
    zeros()
  );
  const aggregateObservedTotalFlux = addPacket(
    [...aggregateObservedOnRasterFlux],
    aggregateOffRasterFlux
  );
  const aggregateExpectedTotalFlux = input.sources.reduce(
    (sum, item) => addPacket(sum, item.flux),
    zeros()
  );
  const entryCount = input.sources.reduce(
    (sum, item) => sum + item.footprint.length,
    0
  );
  const operationCount = 6 * entryCount + 6 * input.sources.length + 8;
  const additivityComparison = packetComparison(
    aggregateObservedOnRasterFlux,
    aggregateExpectedOnRasterFlux,
    operationCount
  );
  const totalComparison = packetComparison(
    aggregateObservedTotalFlux,
    aggregateExpectedTotalFlux,
    operationCount
  );
  const maximumPartitionResidual = Math.max(...sourceResults.flatMap((result) => [
    result.onComparison.maximumAbsoluteResidual,
    result.offComparison.maximumAbsoluteResidual
  ]));
  const maximumResponseMassResidual = Math.max(...sourceResults.map((result) =>
    Math.abs(result.responseMass - 1)));

  return Object.freeze({
    id: input.id,
    description: input.description,
    sourceResults: Object.freeze(sourceResults),
    aggregateObservedOnRasterFlux,
    aggregateExpectedOnRasterFlux: Object.freeze(aggregateExpectedOnRasterFlux),
    aggregateObservedTotalFlux: Object.freeze(aggregateObservedTotalFlux),
    aggregateExpectedTotalFlux: Object.freeze(aggregateExpectedTotalFlux),
    additivityComparison,
    totalComparison,
    maximumPartitionResidual,
    maximumResponseMassResidual,
    accepted: sourceResults.every((result) => result.accepted) &&
      additivityComparison.accepted && totalComparison.accepted
  });
}

export function runExperiment() {
  const results = CASES.map(evaluateCase);
  return Object.freeze({
    experiment: EXPERIMENT,
    name: NAME,
    question: QUESTION,
    results: Object.freeze(results),
    accepted: results.every((result) => result.accepted),
    maxima: Object.freeze({
      responseMassResidual: Math.max(...results.map((result) =>
        result.maximumResponseMassResidual)),
      partitionFluxResidual: Math.max(...results.map((result) =>
        result.maximumPartitionResidual)),
      totalFluxResidual: Math.max(...results.map((result) =>
        result.totalComparison.maximumAbsoluteResidual)),
      overlappingAdditivityResidual: results.find((result) =>
        result.id === 'overlapping-sources')
        ?.additivityComparison.maximumAbsoluteResidual ?? 0
    })
  });
}

const format = (value) => Number(value).toExponential(6);

export function renderReport(experimentResult) {
  const lines = [
    `# ${EXPERIMENT} - ${NAME}`,
    '',
    '## Question',
    '',
    QUESTION,
    '',
    '## Inputs',
    '',
    '```json',
    JSON.stringify({
      basis: {
        channelCount: CHANNEL_COUNT,
        sampleMeaning: 'spectral-flux-density packet on the adopted canonical basis'
      },
      physicalDataTypes: {
        sourcePacket: 'spectral flux density',
        pixelValue: 'spectral radiance density',
        responseWeight: 'normalized dimensionless point-response mass',
        pixelSolidAngle: 'solid angle'
      },
      formulas: {
        pixelRadiance: 'L_lambda_i = F_lambda * p_i / Omega_i',
        accountedFlux: 'sum_i(L_lambda_i * Omega_i)',
        edgeAccounting: 'on-raster flux + off-raster flux = source flux'
      },
      roundingBound: {
        arithmetic: 'IEEE-754 binary64',
        gamma: 'gamma(n) = n*epsilon/(1-n*epsilon)',
        safetyFactor: ROUNDING_SAFETY_FACTOR
      },
      sourcePackets: SOURCE_PACKETS,
      cases: CASES
    }, null, 2),
    '```',
    '',
    '## Iterations',
    '',
    `Iterations: ${experimentResult.results.length}`,
    '',
    '| iteration | case | sources | response mass on/off | maximum mass residual | maximum partition residual | maximum total residual | maximum additivity residual | accepted |',
    '| ---: | --- | ---: | --- | ---: | ---: | ---: | ---: | --- |'
  ];

  experimentResult.results.forEach((result, index) => {
    const onMass = result.sourceResults.reduce(
      (sum, sourceResult) => sum + sourceResult.onRasterMass,
      0
    );
    const offMass = result.sourceResults.reduce(
      (sum, sourceResult) => sum + sourceResult.offRasterMass,
      0
    );
    lines.push([
      `| ${index + 1}`,
      result.id,
      result.sourceResults.length,
      `${format(onMass)} / ${format(offMass)}`,
      format(result.maximumResponseMassResidual),
      format(result.maximumPartitionResidual),
      format(result.totalComparison.maximumAbsoluteResidual),
      format(result.additivityComparison.maximumAbsoluteResidual),
      `${result.accepted ? 'yes' : 'no'} |`
    ].join(' | '));
  });

  lines.push('', '## Maximum observed residuals', '', '```json');
  lines.push(JSON.stringify(experimentResult.maxima, null, 2));
  lines.push('```', '', '## Conclusion', '');
  lines.push(experimentResult.accepted
    ? [
        'Accepted. A normalized point response conserves every channel of the',
        'input spectral flux when each pixel receives',
        'L_lambda_i = F_lambda * p_i / Omega_i. On-raster and explicitly',
        'off-raster response mass account for the complete flux without edge',
        'renormalization; the result is invariant to pixel solid angle and',
        'overlapping sources add linearly.'
      ].join(' ')
    : [
        'Rejected. At least one response-mass, flux-recovery, raster-boundary,',
        'solid-angle-invariance, or overlapping-source criterion failed.'
      ].join(' '));

  return `${lines.join('\n')}\n`;
}

const invokedPath = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invokedPath === import.meta.url) {
  const result = runExperiment();
  process.stdout.write(renderReport(result));
  if (!result.accepted) process.exitCode = 1;
}
