import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../..");
const ARTIFACT_ROOT = path.join(
  ROOT,
  "tmp",
  "atmosphere",
  "cleanroom_environment"
);
const SCRIPT_PATH = path.relative(ROOT, __filename).replaceAll("\\", "/");
const LOCAL_SOURCE_PATH = "scripts/flat/experimental/bruneton-start-fresh.js";

const STEPS = {
  "transfer-baseline": {
    id: "transfer-baseline",
    label: "transfer-baseline",
    kind: "baseline",
    title: "Finite object transfer baseline",
    status: "experimental baseline",
    stateGoal:
      "Produce a complete 001-transfer-baseline artifact using experiment 032 constants and assumptions, the low-Sun and highest-Sun Bruneton Figure 1 cases, algorithmic stress spectra, and long finite target distances.",
    numericalControls: {
      viewRayScatteringIntervals: 20,
      sampleToSunTransmittanceIntervals: 10,
      secondOrderIncomingDirections: 17,
      secondOrderIncidentAltitudeBins: 24,
    },
  },
  "transfer-convergence": {
    id: "transfer-convergence",
    label: "transfer-convergence",
    kind: "convergence",
    title: "Finite object transfer convergence pass",
    status: "planned convergence follow-up",
    stateGoal:
      "Repeat the transfer baseline with doubled numerical controls and report convergence deltas.",
    numericalControls: {
      viewRayScatteringIntervals: 40,
      sampleToSunTransmittanceIntervals: 20,
      secondOrderIncomingDirections: 34,
      secondOrderIncidentAltitudeBins: 48,
    },
  },
  "transfer-refined-baseline": {
    id: "transfer-refined-baseline",
    label: "transfer-refined-baseline",
    kind: "baseline",
    title: "Finite object transfer refined baseline",
    status: "refined baseline after first convergence margin check",
    stateGoal:
      "Promote the doubled-sample transfer run shape to a refined baseline after the original baseline failed the 5x convergence-margin gate.",
    numericalControls: {
      viewRayScatteringIntervals: 40,
      sampleToSunTransmittanceIntervals: 20,
      secondOrderIncomingDirections: 34,
      secondOrderIncidentAltitudeBins: 48,
    },
  },
  "transfer-refined-convergence": {
    id: "transfer-refined-convergence",
    label: "transfer-refined-convergence",
    kind: "convergence",
    title: "Finite object transfer refined convergence pass",
    status: "refined convergence follow-up",
    stateGoal:
      "Compare the refined doubled-sample baseline against an 80/40/68/96 high-sample convergence run.",
    numericalControls: {
      viewRayScatteringIntervals: 80,
      sampleToSunTransmittanceIntervals: 40,
      secondOrderIncomingDirections: 68,
      secondOrderIncidentAltitudeBins: 96,
    },
  },
};

const ATMOSPHERE = {
  bottomRadiusMeters: 6360000,
  topRadiusMeters: 6420000,
  observerHeightMeters: 2,
  rayleighScaleHeightMeters: 8000,
  mieScaleHeightMeters: 1200,
  rayleighCoefficientScale: 1.24062e-6,
  mieAngstromAlpha: 0.8,
  mieAngstromBeta: 0.04,
  mieSingleScatteringAlbedo: 0.8,
  miePhaseFunctionG: 0.7,
  ozoneAbsorption: 0,
};

const SPECTRAL_DELTA_NM = (830 - 360) / 15;
const SPECTRAL_CHANNELS = [
  {
    wavelengthNanometers: 375.666666666667,
    solarIrradiance: 1.068866666667,
    cie: [0.00082512, 0.000024284, 0.00388120013333],
  },
  {
    wavelengthNanometers: 407,
    solarIrradiance: 1.729673,
    cie: [0.031318, 0.000868, 0.14908],
  },
  {
    wavelengthNanometers: 438.333333333333,
    solarIrradiance: 1.862071666667,
    cie: [0.341686666667, 0.0209466666667, 1.70569333333],
  },
  {
    wavelengthNanometers: 469.666666666667,
    solarIrradiance: 2.022063333333,
    cie: [0.199076, 0.0898413333333, 1.30367066667],
  },
  {
    wavelengthNanometers: 501,
    solarIrradiance: 1.908154,
    cie: [0.0044, 0.33986, 0.26006],
  },
  {
    wavelengthNanometers: 532.333333333333,
    solarIrradiance: 1.883391,
    cie: [0.19361662, 0.88666338, 0.0364106666667],
  },
  {
    wavelengthNanometers: 563.666666666667,
    solarIrradiance: 1.834246666667,
    cie: [0.656026666667, 0.982973333333, 0.00305666593333],
  },
  {
    wavelengthNanometers: 595,
    solarIrradiance: 1.76744,
    cie: [1.0567, 0.6949, 0.001],
  },
  {
    wavelengthNanometers: 626.333333333333,
    solarIrradiance: 1.65952,
    cie: [0.722333333333, 0.306066666667, 0.000086666664],
  },
  {
    wavelengthNanometers: 657.666666666667,
    solarIrradiance: 1.548102333333,
    cie: [0.190006666667, 0.0706133333333, 0],
  },
  {
    wavelengthNanometers: 689,
    solarIrradiance: 1.45078,
    cie: [0.02474, 0.008952, 0],
  },
  {
    wavelengthNanometers: 720.333333333333,
    solarIrradiance: 1.340960333333,
    cie: [0.0028426512, 0.00102653333333, 0],
  },
  {
    wavelengthNanometers: 751.666666666667,
    solarIrradiance: 1.262433333333,
    cie: [0.000299809433333, 0.000108266666667, 0],
  },
  {
    wavelengthNanometers: 783,
    solarIrradiance: 1.175208,
    cie: [0.000034215932, 0.000012356, 0],
  },
  {
    wavelengthNanometers: 814.333333333333,
    solarIrradiance: 1.090824,
    cie: [0.00000378221413333, 0.00000136582666667, 0],
  },
].map((channel) => ({
  ...channel,
  wavelengthBinWidthNanometers: SPECTRAL_DELTA_NM,
}));

const XYZ_TO_SRGB = [
  3.2406, -1.5372, -0.4986,
  -0.9689, 1.8758, 0.0415,
  0.0557, -0.204, 1.057,
];
const MAX_LUMINOUS_EFFICACY = 683;
const BRUNETON_COMPARISON_TONE_MAP_EXPOSURE_SCALE = 5;
const DISPLAY_TONE_MAP_K =
  1 / (BRUNETON_COMPARISON_TONE_MAP_EXPOSURE_SCALE * MAX_LUMINOUS_EFFICACY);

const SUN_CASES = [
  {
    id: "figure1-06h00-z87",
    sourceTimeOfDay: "06h00",
    sourceSunZenithDegrees: 87,
    sunAltitudeDegrees: 3,
    sunAzimuthDegrees: -25.83454348280912,
    role: "sunrise/sunset stress case",
  },
  {
    id: "figure1-13h15-z21",
    sourceTimeOfDay: "13h15",
    sourceSunZenithDegrees: 21,
    sunAltitudeDegrees: 69,
    sunAzimuthDegrees: 85.31410016049729,
    role: "highest-Sun stress case",
  },
];

const DISTANCES_METERS = [0, 100, 1000, 5000, 20000, 50000, 100000];
const SEGMENT_DIAGNOSTIC_DISTANCES_METERS = [1000, 20000, 100000];
const CAMERA = {
  id: "ground-camera",
  originMetersENU: [0, 0, 2],
  forwardMetersENU: [1, 0, 0],
  upMetersENU: [0, 0, 1],
};

const OBJECT_SPECTRA = [
  {
    id: "black",
    title: "Black object, zero caller radiance",
    evaluate: () => 0,
  },
  {
    id: "neutral_unit",
    title: "Neutral unit radiance",
    evaluate: () => 1,
  },
  {
    id: "neutral_high",
    title: "Neutral high radiance",
    evaluate: () => 10,
  },
  {
    id: "blue_step",
    title: "Blue-biased step radiance",
    evaluate: (lambdaNm) => (lambdaNm <= 501 ? 1 : 0.05),
  },
  {
    id: "green_peak",
    title: "Green middle-spectrum peak radiance",
    evaluate: (lambdaNm) =>
      Math.max(0.05, 1 - Math.abs(lambdaNm - 563.666666666667) / 120),
  },
  {
    id: "red_step",
    title: "Red-biased step radiance",
    evaluate: (lambdaNm) => (lambdaNm >= 626.333333333333 ? 1 : 0.05),
  },
];

const REFERENCES = [
  {
    id: "bruneton-functions-glsl",
    title:
      "Eric Bruneton, Precomputed Atmospheric Scattering, atmosphere/functions.glsl",
    url:
      "https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/functions.glsl#L41-L53",
    usedFor: [
      "top-atmosphere boundary distance",
      "optical-length integration",
      "Beer-Lambert transmittance",
    ],
  },
  {
    id: "bruneton-demo-constants",
    title:
      "Eric Bruneton, Precomputed Atmospheric Scattering, atmosphere/demo/demo.cc",
    url:
      "https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/demo/demo.cc#L12-L20",
    usedFor: [
      "Earth radii",
      "Rayleigh and Mie scale heights",
      "Rayleigh coefficient law",
      "solar irradiance source table carried by the cleanroom script",
    ],
  },
  {
    id: "bruneton-single-scattering",
    title:
      "Eric Bruneton, Precomputed Atmospheric Scattering, atmosphere/functions.glsl",
    url:
      "https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/functions.glsl#L82-L109",
    usedFor: [
      "single-scattering integrand",
      "Rayleigh phase function",
      "Cornette-Shanks Mie phase function",
    ],
  },
  {
    id: "bruneton-2016-clear-sky-parameters",
    title:
      "Eric Bruneton, A Qualitative and Quantitative Evaluation of 8 Clear Sky Models",
    url: "https://arxiv.org/abs/1612.04336",
    usedFor: [
      "aerosol Angstrom alpha 0.8",
      "aerosol Angstrom beta 0.04",
      "aerosol single-scattering albedo 0.8",
      "Mie phase asymmetry g 0.7",
    ],
  },
  {
    id: "bruneton-2016-no-ozone-comparison-policy",
    title:
      "Eric Bruneton, A Qualitative and Quantitative Evaluation of 8 Clear Sky Models",
    url: "https://arxiv.org/abs/1612.04336",
    usedFor: ["no-ozone comparison policy"],
  },
  {
    id: "bruneton-2016-nishita96-double-scattering",
    title:
      "Eric Bruneton, A Qualitative and Quantitative Evaluation of 8 Clear Sky Models",
    url: "https://arxiv.org/abs/1612.04336",
    usedFor: [
      "incoming-direction integration requirement for double scattering",
    ],
  },
  {
    id: "gonzalez-2009-fibonacci-sphere-lattice",
    title:
      "Alvaro Gonzalez, Measurement of areas on a sphere using Fibonacci and latitude-longitude lattices",
    url: "https://arxiv.org/abs/0912.4540",
    usedFor: ["full-sphere Fibonacci direction set for second-order sampling"],
  },
  {
    id: "bruneton-color-constants",
    title:
      "Eric Bruneton, Precomputed Atmospheric Scattering, atmosphere/constants.h",
    url:
      "https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/constants.h",
    usedFor: [
      "CIE color matching functions",
      "XYZ to linear sRGB matrix",
      "maximum luminous efficacy 683",
    ],
  },
  {
    id: "bruneton-2016-comparison-source-tone-map",
    title:
      "Eric Bruneton, clear-sky-models comparison source, atmosphere/comparisons.cc",
    url:
      "https://github.com/ebruneton/clear-sky-models/blob/master/atmosphere/comparisons.cc#L148-L153",
    usedFor: ["display-only k = 1 / (5 * 683) tone map"],
  },
  {
    id: "bruneton-2016-figure1-four-view-layout",
    title:
      "Eric Bruneton, A Qualitative and Quantitative Evaluation of 8 Clear Sky Models, Figure 1",
    url: "https://arxiv.org/abs/1612.04336",
    usedFor: [
      "required 06h00 / 87 degree low-Sun case",
      "required 13h15 / 21 degree highest-Sun case",
    ],
  },
  {
    id: "bruneton-demo-finite-object-composition",
    title:
      "Eric Bruneton, Precomputed Atmospheric Scattering, atmosphere/demo/demo.glsl",
    url:
      "https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/demo/demo.glsl",
    usedFor: [
      "finite object radiance composed as radiance * transmittance + in-scatter",
    ],
  },
];

const ALGORITHMIC_DECISIONS = [
  {
    id: "synthetic-object-radiance",
    value:
      "black, neutral_unit, neutral_high, blue_step, green_peak, red_step",
    reason:
      "Stress the transfer equation without introducing material-reflectance ownership.",
  },
  {
    id: "baseline-distances",
    value: DISTANCES_METERS,
    reason:
      "Cover zero identity, near-field, mid-distance, and long finite path stress cases.",
  },
  {
    id: "target-card-size",
    value: { widthMeters: 1, heightMeters: 1 },
    reason:
      "Visualization metadata only; baseline criteria use center-ray transfer packets.",
  },
  {
    id: "baseline-numerical-controls",
    value: STEPS["transfer-baseline"].numericalControls,
    reason:
      "Inherited experiment 032 controls pending the 002 convergence pass.",
  },
  {
    id: "contact-sheet-layout",
    value:
      "Sun case and object-spectrum blocks, distance rows, source/attenuated/path/final columns.",
    reason:
      "Expose the transfer components without using image pixels as the proof data.",
  },
  {
    id: "ratio-epsilon",
    value: 1e-30,
    reason:
      "Avoid divide-by-zero diagnostics for path-radiance fraction summaries.",
  },
];

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, value);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getExistingArtifacts() {
  ensureDirectory(ARTIFACT_ROOT);

  return fs
    .readdirSync(ARTIFACT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{3}-/.test(entry.name))
    .map((entry) => ({
      name: entry.name,
      number: Number(entry.name.slice(0, 3)),
      path: path.join(ARTIFACT_ROOT, entry.name),
    }))
    .filter((entry) => Number.isFinite(entry.number))
    .sort((a, b) => a.number - b.number);
}

function getRequestedStepId() {
  const stepArgument = process.argv.find((argument) =>
    argument.startsWith("--step=")
  );

  if (stepArgument) {
    return stepArgument.slice("--step=".length);
  }

  const artifacts = getExistingArtifacts();
  return artifacts.length === 0 ? "transfer-baseline" : "transfer-convergence";
}

function activeStep() {
  const requestedStepId = getRequestedStepId();

  if (!Object.hasOwn(STEPS, requestedStepId)) {
    const validSteps = Object.keys(STEPS).join(", ");
    throw new Error(`Unknown step "${requestedStepId}". Valid steps: ${validSteps}`);
  }

  return STEPS[requestedStepId];
}

function isConvergenceStep(step) {
  return step.kind === "convergence";
}

function nextArtifactInfo(step) {
  const artifacts = getExistingArtifacts();
  const nextNumber =
    artifacts.reduce((max, artifact) => Math.max(max, artifact.number), 0) + 1;
  const folderName = `${String(nextNumber).padStart(3, "0")}-${step.label}`;
  const directory = path.join(ARTIFACT_ROOT, folderName);

  if (fs.existsSync(directory)) {
    throw new Error(`Refusing to overwrite existing artifact: ${directory}`);
  }

  ensureDirectory(directory);
  return {
    artifactNumber: nextNumber,
    folderName,
    directory,
    existingArtifacts: artifacts.map((artifact) => artifact.name),
  };
}

function findLatestAcceptedBaselineArtifact(existingArtifactNames) {
  const artifactNames = [...existingArtifactNames].reverse();

  for (const artifactName of artifactNames) {
    if (!/^\d{3}-.*baseline$/.test(artifactName)) {
      continue;
    }

    const directory = path.join(ARTIFACT_ROOT, artifactName);
    const criteriaPath = path.join(directory, "criteria-results.json");
    const provenancePath = path.join(directory, "provenance.json");
    const transferCasesPath = path.join(directory, "transfer-cases.json");

    if (
      !fs.existsSync(criteriaPath) ||
      !fs.existsSync(provenancePath) ||
      !fs.existsSync(transferCasesPath)
    ) {
      continue;
    }

    const criteriaResults = readJson(criteriaPath);
    const provenance = readJson(provenancePath);

    if (
      provenance.status === "accepted" &&
      criteriaResults.summary &&
      criteriaResults.summary.failed === 0
    ) {
      const transferCases = readJson(transferCasesPath);

      return {
        folderName: artifactName,
        directory,
        criteriaResults,
        provenance,
        transferCases: transferCases.transferCases,
      };
    }
  }

  return null;
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function length(vector) {
  return Math.sqrt(dot(vector, vector));
}

function normalize(vector) {
  const vectorLength = length(vector);

  if (vectorLength === 0) {
    return [0, 0, 0];
  }

  return [
    vector[0] / vectorLength,
    vector[1] / vectorLength,
    vector[2] / vectorLength,
  ];
}

function scaleVector(vector, scalar) {
  return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar];
}

function addVectors(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function addScaled(origin, direction, distance) {
  return [
    origin[0] + direction[0] * distance,
    origin[1] + direction[1] * distance,
    origin[2] + direction[2] * distance,
  ];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function enuToWorld(positionMetersENU) {
  return [
    positionMetersENU[0],
    positionMetersENU[1],
    ATMOSPHERE.bottomRadiusMeters + positionMetersENU[2],
  ];
}

function observerPosition() {
  return enuToWorld(CAMERA.originMetersENU);
}

function sunDirection(sunCase) {
  const altitude = degreesToRadians(sunCase.sunAltitudeDegrees);
  const azimuth = degreesToRadians(sunCase.sunAzimuthDegrees);
  const horizontalLength = Math.cos(altitude);

  return normalize([
    horizontalLength * Math.cos(azimuth),
    horizontalLength * Math.sin(azimuth),
    Math.sin(altitude),
  ]);
}

function wavelengthNanometersToMicrometers(wavelengthNanometers) {
  return wavelengthNanometers * 1e-3;
}

function rayleighScatteringCoefficientAt(wavelengthMicrometers) {
  return ATMOSPHERE.rayleighCoefficientScale * wavelengthMicrometers ** -4;
}

function mieExtinctionCoefficientAt(wavelengthMicrometers) {
  return (
    (ATMOSPHERE.mieAngstromBeta / ATMOSPHERE.mieScaleHeightMeters) *
    wavelengthMicrometers ** -ATMOSPHERE.mieAngstromAlpha
  );
}

function mieScatteringCoefficientAt(wavelengthMicrometers) {
  return (
    mieExtinctionCoefficientAt(wavelengthMicrometers) *
    ATMOSPHERE.mieSingleScatteringAlbedo
  );
}

function exponentialDensity(altitudeMeters, scaleHeightMeters) {
  return Math.exp(-Math.max(0, altitudeMeters) / scaleHeightMeters);
}

function densityAtPosition(position) {
  const altitude = length(position) - ATMOSPHERE.bottomRadiusMeters;

  return {
    altitudeMeters: altitude,
    rayleigh: exponentialDensity(altitude, ATMOSPHERE.rayleighScaleHeightMeters),
    mie: exponentialDensity(altitude, ATMOSPHERE.mieScaleHeightMeters),
    absorption: 0,
  };
}

function distanceToTopAtmosphereBoundary(radius, mu) {
  const discriminant =
    radius * radius * (mu * mu - 1) +
    ATMOSPHERE.topRadiusMeters * ATMOSPHERE.topRadiusMeters;

  return Math.max(0, -radius * mu + Math.sqrt(Math.max(0, discriminant)));
}

function rayIntersectsGround(radius, mu) {
  return (
    mu < 0 &&
    radius * radius * (mu * mu - 1) +
      ATMOSPHERE.bottomRadiusMeters * ATMOSPHERE.bottomRadiusMeters >=
      0
  );
}

function computeOpticalLengthsAlongDistance(
  origin,
  direction,
  distance,
  sampleCount
) {
  if (distance === 0 || sampleCount === 0) {
    return {
      distance,
      rayleighOpticalLength: 0,
      mieOpticalLength: 0,
      absorptionOpticalLength: 0,
    };
  }

  const step = distance / sampleCount;
  let rayleighOpticalLength = 0;
  let mieOpticalLength = 0;
  let absorptionOpticalLength = 0;

  for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
    const sampleDistance = sampleIndex * step;
    const samplePosition = addScaled(origin, direction, sampleDistance);
    const density = densityAtPosition(samplePosition);
    const weight = sampleIndex === 0 || sampleIndex === sampleCount ? 0.5 : 1;

    rayleighOpticalLength += density.rayleigh * weight * step;
    mieOpticalLength += density.mie * weight * step;
    absorptionOpticalLength += density.absorption * weight * step;
  }

  return {
    distance,
    rayleighOpticalLength,
    mieOpticalLength,
    absorptionOpticalLength,
  };
}

function computeOpticalLengthsToTop(origin, direction, sampleCount) {
  const radius = length(origin);
  const mu = dot(origin, direction) / radius;
  const distanceToTop = distanceToTopAtmosphereBoundary(radius, mu);

  return computeOpticalLengthsAlongDistance(
    origin,
    direction,
    distanceToTop,
    sampleCount
  );
}

function computeTransmittanceSpectrum(opticalLengths) {
  const opticalDepthByWavelength = SPECTRAL_CHANNELS.map((channel) => {
    const wavelengthMicrometers = wavelengthNanometersToMicrometers(
      channel.wavelengthNanometers
    );

    return (
      rayleighScatteringCoefficientAt(wavelengthMicrometers) *
        opticalLengths.rayleighOpticalLength +
      mieExtinctionCoefficientAt(wavelengthMicrometers) *
        opticalLengths.mieOpticalLength +
      ATMOSPHERE.ozoneAbsorption *
        (opticalLengths.absorptionOpticalLength || 0)
    );
  });

  return {
    opticalDepthByWavelength,
    transmittanceByWavelength: opticalDepthByWavelength.map((tau) =>
      Math.exp(-tau)
    ),
  };
}

function computeTransmittanceToSunSpectrum(position, sunRay, controls) {
  const radius = length(position);
  const mu = dot(position, sunRay) / radius;

  if (rayIntersectsGround(radius, mu)) {
    return SPECTRAL_CHANNELS.map(() => 0);
  }

  return computeTransmittanceSpectrum(
    computeOpticalLengthsToTop(
      position,
      sunRay,
      controls.sampleToSunTransmittanceIntervals
    )
  ).transmittanceByWavelength;
}

function rayleighPhaseFunction(nu) {
  return (3 / (16 * Math.PI)) * (1 + nu * nu);
}

function miePhaseFunction(g, nu) {
  const k = (3 / (8 * Math.PI)) * ((1 - g * g) / (2 + g * g));

  return (
    (k * (1 + nu * nu)) /
    (1 + g * g - 2 * g * nu) ** 1.5
  );
}

function fibonacciSphereIncomingDirections(sunRay, count) {
  const halfCount = Math.floor(count / 2);
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const sunAxis = normalize(sunRay);
  const reference =
    Math.abs(dot(sunAxis, [0, 0, 1])) < 0.95 ? [0, 0, 1] : [0, 1, 0];
  const zAxis = normalize(
    addVectors(reference, scaleVector(sunAxis, -dot(reference, sunAxis)))
  );
  const yAxis = normalize(cross(zAxis, sunAxis));
  const directions = [];

  for (let index = -halfCount; directions.length < count; index += 1) {
    const z = (2 * index) / count;
    const latitude = Math.asin(clamp(z, -1, 1));
    const longitude = (2 * Math.PI * index) / goldenRatio;
    const horizontalScale = Math.cos(latitude);
    const localX = horizontalScale * Math.cos(longitude);
    const localY = horizontalScale * Math.sin(longitude);
    const localZ = z;

    directions.push(
      normalize(
        addVectors(
          addVectors(scaleVector(sunAxis, localX), scaleVector(yAxis, localY)),
          scaleVector(zAxis, localZ)
        )
      )
    );
  }

  return directions;
}

function zeroSpectrum() {
  return SPECTRAL_CHANNELS.map(() => 0);
}

function computePathRadianceSegment({
  origin,
  direction,
  distance,
  sunCase,
  sunRay,
  controls,
  includeSecondOrder,
  incidentSkyCache,
}) {
  const fullOpticalLengths = computeOpticalLengthsAlongDistance(
    origin,
    direction,
    distance,
    controls.viewRayScatteringIntervals
  );
  const fullTransmittance = computeTransmittanceSpectrum(fullOpticalLengths);

  if (distance === 0) {
    return {
      opticalDepthByWavelength: fullTransmittance.opticalDepthByWavelength,
      transmittanceByWavelength: fullTransmittance.transmittanceByWavelength,
      pathRadianceByWavelength: zeroSpectrum(),
      firstOrderPathRadianceByWavelength: zeroSpectrum(),
      secondOrderPathRadianceByWavelength: zeroSpectrum(),
      diagnostics: {
        sampleCount: controls.viewRayScatteringIntervals,
        minAltitudeMeters: ATMOSPHERE.observerHeightMeters,
        maxAltitudeMeters: ATMOSPHERE.observerHeightMeters,
      },
    };
  }

  const sampleCount = controls.viewRayScatteringIntervals;
  const step = distance / sampleCount;
  const samples = [];
  const cumulativeRayleigh = [0];
  const cumulativeMie = [0];
  const cumulativeAbsorption = [0];
  const rayleighSum = zeroSpectrum();
  const mieSum = zeroSpectrum();
  const secondOrderSum = zeroSpectrum();
  let minAltitudeMeters = Number.POSITIVE_INFINITY;
  let maxAltitudeMeters = Number.NEGATIVE_INFINITY;

  for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
    const sampleDistance = sampleIndex * step;
    const position = addScaled(origin, direction, sampleDistance);
    const density = densityAtPosition(position);

    minAltitudeMeters = Math.min(minAltitudeMeters, density.altitudeMeters);
    maxAltitudeMeters = Math.max(maxAltitudeMeters, density.altitudeMeters);
    samples.push({ position, density });

    if (sampleIndex > 0) {
      const previousDensity = samples[sampleIndex - 1].density;
      cumulativeRayleigh[sampleIndex] =
        cumulativeRayleigh[sampleIndex - 1] +
        0.5 * (previousDensity.rayleigh + density.rayleigh) * step;
      cumulativeMie[sampleIndex] =
        cumulativeMie[sampleIndex - 1] +
        0.5 * (previousDensity.mie + density.mie) * step;
      cumulativeAbsorption[sampleIndex] =
        cumulativeAbsorption[sampleIndex - 1] +
        0.5 * (previousDensity.absorption + density.absorption) * step;
    }
  }

  for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
    const sample = samples[sampleIndex];
    const weight = sampleIndex === 0 || sampleIndex === sampleCount ? 0.5 : 1;
    const viewTransmittance = computeTransmittanceSpectrum({
      rayleighOpticalLength: cumulativeRayleigh[sampleIndex],
      mieOpticalLength: cumulativeMie[sampleIndex],
      absorptionOpticalLength: cumulativeAbsorption[sampleIndex],
    }).transmittanceByWavelength;
    const sunTransmittance = computeTransmittanceToSunSpectrum(
      sample.position,
      sunRay,
      controls
    );

    for (let channelIndex = 0; channelIndex < SPECTRAL_CHANNELS.length; channelIndex += 1) {
      const transmittance =
        viewTransmittance[channelIndex] * sunTransmittance[channelIndex];

      rayleighSum[channelIndex] +=
        transmittance * sample.density.rayleigh * weight;
      mieSum[channelIndex] += transmittance * sample.density.mie * weight;
    }

    if (includeSecondOrder) {
      const secondOrder = computeSecondOrderAtSample({
        sunCase,
        position: sample.position,
        viewRay: direction,
        sunRay,
        density: sample.density,
        viewTransmittance,
        controls,
        incidentSkyCache,
      });

      for (let channelIndex = 0; channelIndex < SPECTRAL_CHANNELS.length; channelIndex += 1) {
        secondOrderSum[channelIndex] += secondOrder[channelIndex] * weight;
      }
    }
  }

  const nu = dot(direction, sunRay);
  const rayleighPhase = rayleighPhaseFunction(nu);
  const miePhase = miePhaseFunction(ATMOSPHERE.miePhaseFunctionG, nu);
  const firstOrderPathRadianceByWavelength = SPECTRAL_CHANNELS.map(
    (channel, channelIndex) => {
      const wavelengthMicrometers = wavelengthNanometersToMicrometers(
        channel.wavelengthNanometers
      );
      const rayleigh =
        rayleighSum[channelIndex] *
        step *
        channel.solarIrradiance *
        rayleighScatteringCoefficientAt(wavelengthMicrometers) *
        rayleighPhase;
      const mie =
        mieSum[channelIndex] *
        step *
        channel.solarIrradiance *
        mieScatteringCoefficientAt(wavelengthMicrometers) *
        miePhase;

      return rayleigh + mie;
    }
  );
  const secondOrderPathRadianceByWavelength = secondOrderSum.map(
    (value) => value * step
  );
  const pathRadianceByWavelength = firstOrderPathRadianceByWavelength.map(
    (value, index) => value + secondOrderPathRadianceByWavelength[index]
  );

  return {
    opticalDepthByWavelength: fullTransmittance.opticalDepthByWavelength,
    transmittanceByWavelength: fullTransmittance.transmittanceByWavelength,
    pathRadianceByWavelength,
    firstOrderPathRadianceByWavelength,
    secondOrderPathRadianceByWavelength,
    diagnostics: {
      sampleCount,
      minAltitudeMeters,
      maxAltitudeMeters,
      rayleighOpticalLength: fullOpticalLengths.rayleighOpticalLength,
      mieOpticalLength: fullOpticalLengths.mieOpticalLength,
      absorptionOpticalLength: fullOpticalLengths.absorptionOpticalLength,
    },
  };
}

function computeSecondOrderAtSample({
  sunCase,
  position,
  viewRay,
  sunRay,
  density,
  viewTransmittance,
  controls,
  incidentSkyCache,
}) {
  const secondOrder = zeroSpectrum();
  const incomingDirections = fibonacciSphereIncomingDirections(
    sunRay,
    controls.secondOrderIncomingDirections
  );
  const angularWeight = (4 * Math.PI) / incomingDirections.length;

  for (let directionIndex = 0; directionIndex < incomingDirections.length; directionIndex += 1) {
    const incomingDirection = incomingDirections[directionIndex];
    const incidentRadiance = incidentSkyRadianceForSecondOrder({
      sunCase,
      sunRay,
      incomingDirection,
      directionIndex,
      position,
      controls,
      incidentSkyCache,
    });
    const nu = dot(viewRay, incomingDirection);
    const rayleighPhase = rayleighPhaseFunction(nu);
    const miePhase = miePhaseFunction(ATMOSPHERE.miePhaseFunctionG, nu);

    for (let channelIndex = 0; channelIndex < SPECTRAL_CHANNELS.length; channelIndex += 1) {
      const wavelengthMicrometers = wavelengthNanometersToMicrometers(
        SPECTRAL_CHANNELS[channelIndex].wavelengthNanometers
      );
      const scatteringCoefficient =
        density.rayleigh *
          rayleighScatteringCoefficientAt(wavelengthMicrometers) *
          rayleighPhase +
        density.mie *
          mieScatteringCoefficientAt(wavelengthMicrometers) *
          miePhase;

      secondOrder[channelIndex] +=
        viewTransmittance[channelIndex] *
        incidentRadiance[channelIndex] *
        scatteringCoefficient *
        angularWeight;
    }
  }

  return secondOrder;
}

function incidentSkyRadianceForSecondOrder({
  sunCase,
  sunRay,
  incomingDirection,
  directionIndex,
  position,
  controls,
  incidentSkyCache,
}) {
  const altitude = clamp(
    length(position) - ATMOSPHERE.bottomRadiusMeters,
    0,
    ATMOSPHERE.topRadiusMeters - ATMOSPHERE.bottomRadiusMeters
  );
  const binSize =
    (ATMOSPHERE.topRadiusMeters - ATMOSPHERE.bottomRadiusMeters) /
    controls.secondOrderIncidentAltitudeBins;
  const binIndex = clamp(
    Math.floor(altitude / binSize),
    0,
    controls.secondOrderIncidentAltitudeBins - 1
  );
  const key = `${sunCase.id}|${directionIndex}|${binIndex}`;

  if (!incidentSkyCache.has(key)) {
    const binAltitude = (binIndex + 0.5) * binSize;
    const binOrigin = [0, 0, ATMOSPHERE.bottomRadiusMeters + binAltitude];
    const radius = length(binOrigin);
    const mu = dot(binOrigin, incomingDirection) / radius;

    if (rayIntersectsGround(radius, mu)) {
      incidentSkyCache.set(key, zeroSpectrum());
    } else {
      const distanceToTop = distanceToTopAtmosphereBoundary(radius, mu);
      const incident = computePathRadianceSegment({
        origin: binOrigin,
        direction: incomingDirection,
        distance: distanceToTop,
        sunCase,
        sunRay,
        controls,
        includeSecondOrder: false,
        incidentSkyCache,
      });

      incidentSkyCache.set(key, incident.pathRadianceByWavelength);
    }
  }

  return incidentSkyCache.get(key);
}

function objectRadianceSpectrum(objectSpectrum) {
  return SPECTRAL_CHANNELS.map((channel) =>
    objectSpectrum.evaluate(channel.wavelengthNanometers)
  );
}

function spectralToDisplayPreview(radianceByWavelength) {
  let x = 0;
  let y = 0;
  let z = 0;

  for (let channelIndex = 0; channelIndex < SPECTRAL_CHANNELS.length; channelIndex += 1) {
    const channel = SPECTRAL_CHANNELS[channelIndex];
    const radiance = radianceByWavelength[channelIndex];

    x += channel.cie[0] * radiance * channel.wavelengthBinWidthNanometers;
    y += channel.cie[1] * radiance * channel.wavelengthBinWidthNanometers;
    z += channel.cie[2] * radiance * channel.wavelengthBinWidthNanometers;
  }

  const linearSrgb = [
    MAX_LUMINOUS_EFFICACY *
      (XYZ_TO_SRGB[0] * x + XYZ_TO_SRGB[1] * y + XYZ_TO_SRGB[2] * z),
    MAX_LUMINOUS_EFFICACY *
      (XYZ_TO_SRGB[3] * x + XYZ_TO_SRGB[4] * y + XYZ_TO_SRGB[5] * z),
    MAX_LUMINOUS_EFFICACY *
      (XYZ_TO_SRGB[6] * x + XYZ_TO_SRGB[7] * y + XYZ_TO_SRGB[8] * z),
  ];
  const displayRgb = linearSrgb.map((value) =>
    clamp(1 - Math.exp(-DISPLAY_TONE_MAP_K * Math.max(0, value)), 0, 1)
  );
  const encodedRgb = displayRgb.map((value) => clampByte(value * 255));

  return {
    cieXyzUnscaled: [x, y, z],
    linearSrgb,
    displayRgb,
    encodedRgb,
    negativeLinearChannelCount: linearSrgb.filter((value) => value < 0).length,
    clippedEncodedChannelCount: encodedRgb.filter((value) => value >= 255).length,
  };
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxAbs(values) {
  return values.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
}

function l2(values) {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

function subtractArrays(a, b) {
  return a.map((value, index) => value - b[index]);
}

function addArrays(a, b) {
  return a.map((value, index) => value + b[index]);
}

function multiplyArrays(a, b) {
  return a.map((value, index) => value * b[index]);
}

function scaleArray(a, scalar) {
  return a.map((value) => value * scalar);
}

function computeTransferCases(step, artifactInfo) {
  const controls = step.numericalControls;
  const transferCases = [];
  const transferBySunDistance = new Map();
  const compositionDiagnostics = [];
  const incidentSkyCache = new Map();
  const origin = observerPosition();
  const direction = normalize(CAMERA.forwardMetersENU);

  for (const sunCase of SUN_CASES) {
    const sunRay = sunDirection(sunCase);

    for (const distanceMeters of DISTANCES_METERS) {
      const transferKey = `${sunCase.id}|${distanceMeters}`;
      const transfer = computePathRadianceSegment({
        origin,
        direction,
        distance: distanceMeters,
        sunCase,
        sunRay,
        controls,
        includeSecondOrder: true,
        incidentSkyCache,
      });

      transferBySunDistance.set(transferKey, transfer);
    }

    for (const distanceMeters of SEGMENT_DIAGNOSTIC_DISTANCES_METERS) {
      const halfDistance = distanceMeters / 2;
      const midpoint = addScaled(origin, direction, halfDistance);
      const compositionFullControls = {
        ...controls,
        viewRayScatteringIntervals: controls.viewRayScatteringIntervals * 2,
      };
      const full = computePathRadianceSegment({
        origin,
        direction,
        distance: distanceMeters,
        sunCase,
        sunRay,
        controls: compositionFullControls,
        includeSecondOrder: true,
        incidentSkyCache,
      });
      const first = computePathRadianceSegment({
        origin,
        direction,
        distance: halfDistance,
        sunCase,
        sunRay,
        controls,
        includeSecondOrder: true,
        incidentSkyCache,
      });
      const second = computePathRadianceSegment({
        origin: midpoint,
        direction,
        distance: halfDistance,
        sunCase,
        sunRay,
        controls,
        includeSecondOrder: true,
        incidentSkyCache,
      });
      const recomposedTransmittance = multiplyArrays(
        first.transmittanceByWavelength,
        second.transmittanceByWavelength
      );
      const recomposedPathRadiance = addArrays(
        first.pathRadianceByWavelength,
        multiplyArrays(first.transmittanceByWavelength, second.pathRadianceByWavelength)
      );

      compositionDiagnostics.push({
        sunCase: sunCase.id,
        distanceMeters,
        splitDistanceMeters: halfDistance,
        fullSegmentViewIntervals:
          compositionFullControls.viewRayScatteringIntervals,
        splitSegmentViewIntervalsEach: controls.viewRayScatteringIntervals,
        maxTransmittanceError: maxAbs(
          subtractArrays(full.transmittanceByWavelength, recomposedTransmittance)
        ),
        maxPathRadianceError: maxAbs(
          subtractArrays(full.pathRadianceByWavelength, recomposedPathRadiance)
        ),
        meanFullTransmittance: mean(full.transmittanceByWavelength),
        meanFullPathRadiance: mean(full.pathRadianceByWavelength),
      });
    }

    for (const objectSpectrum of OBJECT_SPECTRA) {
      const objectRadianceByWavelength = objectRadianceSpectrum(objectSpectrum);

      for (const distanceMeters of DISTANCES_METERS) {
        const transfer = transferBySunDistance.get(`${sunCase.id}|${distanceMeters}`);
        const attenuatedObjectRadianceByWavelength = multiplyArrays(
          objectRadianceByWavelength,
          transfer.transmittanceByWavelength
        );
        const finalRadianceByWavelength = addArrays(
          attenuatedObjectRadianceByWavelength,
          transfer.pathRadianceByWavelength
        );
        const targetCenterMetersENU = [distanceMeters, 0, 2];
        const caseId = [
          sunCase.id,
          `${String(distanceMeters).padStart(6, "0")}m`,
          objectSpectrum.id,
        ].join("--");

        transferCases.push({
          caseId,
          wavelengthsNm: SPECTRAL_CHANNELS.map(
            (channel) => channel.wavelengthNanometers
          ),
          units: {
            wavelengthsNm: "nm",
            distanceMeters: "m",
            opticalDepthByWavelength: "dimensionless",
            transmittanceByWavelength: "dimensionless",
            objectRadianceByWavelength:
              "algorithmic unit spectral-radiance scale",
            pathRadianceByWavelength:
              "experiment 032 cleanroom spectral radiance scale",
            attenuatedObjectRadianceByWavelength:
              "algorithmic unit spectral-radiance scale after dimensionless transmittance",
            finalRadianceByWavelength:
              "mixed caller unit radiance plus atmosphere spectral radiance for transfer-equation stress test",
          },
          sunCase: {
            id: sunCase.id,
            sourceTimeOfDay: sunCase.sourceTimeOfDay,
            sourceSunZenithDegrees: sunCase.sourceSunZenithDegrees,
            sunAltitudeDegrees: sunCase.sunAltitudeDegrees,
            sunAzimuthDegrees: sunCase.sunAzimuthDegrees,
            sunDirection: sunRay,
          },
          geometryProfileId: "spherical-earth-ground-observer",
          sourceProfileId: "bruneton-figure1-directional-sun",
          camera: CAMERA,
          target: {
            id: `target-${distanceMeters}m-${objectSpectrum.id}`,
            shape: "spectral-card",
            centerMetersENU: targetCenterMetersENU,
            normalMetersENU: [-1, 0, 0],
            widthMeters: distanceMeters === 0 ? 0 : 1,
            heightMeters: distanceMeters === 0 ? 0 : 1,
            distanceMeters,
            objectSpectrumId: objectSpectrum.id,
          },
          segment: {
            originMeters: CAMERA.originMetersENU,
            targetMeters: targetCenterMetersENU,
            lengthMeters: distanceMeters,
            directionMeters: direction,
          },
          objectSpectrumId: objectSpectrum.id,
          objectRadianceByWavelength,
          opticalDepthByWavelength: transfer.opticalDepthByWavelength,
          transmittanceByWavelength: transfer.transmittanceByWavelength,
          pathRadianceByWavelength: transfer.pathRadianceByWavelength,
          attenuatedObjectRadianceByWavelength,
          finalRadianceByWavelength,
          components: {
            firstOrderPathRadianceByWavelength:
              transfer.firstOrderPathRadianceByWavelength,
            secondOrderPathRadianceByWavelength:
              transfer.secondOrderPathRadianceByWavelength,
          },
          displayPreview: {
            sourceObject: spectralToDisplayPreview(objectRadianceByWavelength),
            attenuatedObject: spectralToDisplayPreview(
              attenuatedObjectRadianceByWavelength
            ),
            pathRadiance: spectralToDisplayPreview(
              transfer.pathRadianceByWavelength
            ),
            finalRadiance: spectralToDisplayPreview(finalRadianceByWavelength),
          },
          diagnostics: {
            meanTransmittance: mean(transfer.transmittanceByWavelength),
            minTransmittance: Math.min(...transfer.transmittanceByWavelength),
            meanPathRadiance: mean(transfer.pathRadianceByWavelength),
            meanFinalRadiance: mean(finalRadianceByWavelength),
            meanPathRadianceFraction: mean(
              transfer.pathRadianceByWavelength.map((value, index) => {
                const denominator = Math.max(
                  Math.abs(finalRadianceByWavelength[index]),
                  1e-30
                );
                return value / denominator;
              })
            ),
            transferDiagnostics: transfer.diagnostics,
          },
        });
      }
    }
  }

  return {
    transferCases,
    compositionDiagnostics,
    cacheDiagnostics: {
      incidentSkyCacheEntries: incidentSkyCache.size,
    },
    artifactInfo,
  };
}

function casesByKey(transferCases) {
  const result = new Map();

  for (const transferCase of transferCases) {
    result.set(
      `${transferCase.sunCase.id}|${transferCase.target.distanceMeters}|${transferCase.objectSpectrumId}`,
      transferCase
    );
  }

  return result;
}

function criterionResult({
  criterionId,
  status,
  tolerance,
  measuredError,
  effectSize,
  sourceOrStatus,
  cases,
  notes,
}) {
  return {
    criterionId,
    status,
    tolerance,
    measuredError,
    effectSize,
    sourceOrStatus,
    cases,
    notes,
  };
}

function computeConvergenceComparison(
  transferCases,
  baselineArtifact,
  demonstrationEffects
) {
  const baselineByKey = casesByKey(baselineArtifact.transferCases);
  let maxTransmittanceDelta = 0;
  let maxPathRadianceDelta = 0;
  let maxFinalRadianceDelta = 0;
  let maxAttenuatedObjectDelta = 0;
  let matchedCaseCount = 0;
  const missingCaseIds = [];

  for (const transferCase of transferCases) {
    const key = `${transferCase.sunCase.id}|${transferCase.target.distanceMeters}|${transferCase.objectSpectrumId}`;
    const baselineCase = baselineByKey.get(key);

    if (!baselineCase) {
      missingCaseIds.push(transferCase.caseId);
      continue;
    }

    matchedCaseCount += 1;
    maxTransmittanceDelta = Math.max(
      maxTransmittanceDelta,
      maxAbs(
        subtractArrays(
          transferCase.transmittanceByWavelength,
          baselineCase.transmittanceByWavelength
        )
      )
    );
    maxPathRadianceDelta = Math.max(
      maxPathRadianceDelta,
      maxAbs(
        subtractArrays(
          transferCase.pathRadianceByWavelength,
          baselineCase.pathRadianceByWavelength
        )
      )
    );
    maxFinalRadianceDelta = Math.max(
      maxFinalRadianceDelta,
      maxAbs(
        subtractArrays(
          transferCase.finalRadianceByWavelength,
          baselineCase.finalRadianceByWavelength
        )
      )
    );
    maxAttenuatedObjectDelta = Math.max(
      maxAttenuatedObjectDelta,
      maxAbs(
        subtractArrays(
          transferCase.attenuatedObjectRadianceByWavelength,
          baselineCase.attenuatedObjectRadianceByWavelength
        )
      )
    );
  }

  const marginMultiplier = 5;
  const epsilon = 1e-30;
  const distanceTransmittanceMargin =
    demonstrationEffects.distanceEffectSize /
    Math.max(maxTransmittanceDelta, epsilon);
  const sunPathMargin =
    demonstrationEffects.sunPathDifference /
    Math.max(maxPathRadianceDelta, epsilon);
  const sunFinalMargin =
    demonstrationEffects.sunFinalDifference /
    Math.max(maxFinalRadianceDelta, epsilon);
  const minimumMargin = Math.min(
    distanceTransmittanceMargin,
    sunPathMargin,
    sunFinalMargin
  );

  return {
    baselineArtifact: baselineArtifact.folderName,
    matchedCaseCount,
    missingCaseIds,
    maxTransmittanceDelta,
    maxPathRadianceDelta,
    maxFinalRadianceDelta,
    maxAttenuatedObjectDelta,
    marginMultiplier,
    effects: demonstrationEffects,
    margins: {
      distanceTransmittanceMargin,
      sunPathMargin,
      sunFinalMargin,
      minimumMargin,
    },
    passed:
      missingCaseIds.length === 0 &&
      distanceTransmittanceMargin >= marginMultiplier &&
      sunPathMargin >= marginMultiplier &&
      sunFinalMargin >= marginMultiplier,
  };
}

function evaluateCriteria(transferCases, compositionDiagnostics, options = {}) {
  const byKey = casesByKey(transferCases);
  const criteria = [];
  const hardTolerance = { absolute: 1e-10, relative: 1e-8 };
  const zeroTolerance = { absolute: 1e-12 };
  let maxCompositionError = 0;
  let maxZeroTransmittanceError = 0;
  let maxZeroPathRadiance = 0;
  let maxBlackIdentityError = 0;
  let maxLinearityError = 0;
  let maxBeerLambertError = 0;
  let minTransmittance = Number.POSITIVE_INFINITY;
  let maxTransmittance = Number.NEGATIVE_INFINITY;
  let minOpticalDepth = Number.POSITIVE_INFINITY;
  let finiteNonnegativeFailureCount = 0;

  for (const transferCase of transferCases) {
    const recomposed = addArrays(
      multiplyArrays(
        transferCase.objectRadianceByWavelength,
        transferCase.transmittanceByWavelength
      ),
      transferCase.pathRadianceByWavelength
    );

    maxCompositionError = Math.max(
      maxCompositionError,
      maxAbs(subtractArrays(recomposed, transferCase.finalRadianceByWavelength))
    );

    for (let index = 0; index < SPECTRAL_CHANNELS.length; index += 1) {
      const transmittance = transferCase.transmittanceByWavelength[index];
      const opticalDepth = transferCase.opticalDepthByWavelength[index];

      minTransmittance = Math.min(minTransmittance, transmittance);
      maxTransmittance = Math.max(maxTransmittance, transmittance);
      minOpticalDepth = Math.min(minOpticalDepth, opticalDepth);
      maxBeerLambertError = Math.max(
        maxBeerLambertError,
        Math.abs(transmittance - Math.exp(-opticalDepth))
      );

      for (const value of [
        opticalDepth,
        transmittance,
        transferCase.objectRadianceByWavelength[index],
        transferCase.pathRadianceByWavelength[index],
        transferCase.attenuatedObjectRadianceByWavelength[index],
        transferCase.finalRadianceByWavelength[index],
      ]) {
        if (!Number.isFinite(value) || value < -1e-12) {
          finiteNonnegativeFailureCount += 1;
        }
      }
    }

    if (transferCase.target.distanceMeters === 0) {
      maxZeroTransmittanceError = Math.max(
        maxZeroTransmittanceError,
        maxAbs(transferCase.transmittanceByWavelength.map((value) => value - 1))
      );
      maxZeroPathRadiance = Math.max(
        maxZeroPathRadiance,
        maxAbs(transferCase.pathRadianceByWavelength)
      );
    }

    if (transferCase.objectSpectrumId === "black") {
      maxBlackIdentityError = Math.max(
        maxBlackIdentityError,
        maxAbs(
          subtractArrays(
            transferCase.finalRadianceByWavelength,
            transferCase.pathRadianceByWavelength
          )
        )
      );
    }
  }

  const linearityPairs = [
    ["neutral_high", "neutral_unit"],
    ["red_step", "blue_step"],
    ["green_peak", "neutral_unit"],
  ];

  for (const sunCase of SUN_CASES) {
    for (const distanceMeters of DISTANCES_METERS) {
      for (const [aId, bId] of linearityPairs) {
        const a = byKey.get(`${sunCase.id}|${distanceMeters}|${aId}`);
        const b = byKey.get(`${sunCase.id}|${distanceMeters}|${bId}`);
        const finalDelta = subtractArrays(
          a.finalRadianceByWavelength,
          b.finalRadianceByWavelength
        );
        const objectDelta = subtractArrays(
          a.objectRadianceByWavelength,
          b.objectRadianceByWavelength
        );
        const expected = multiplyArrays(a.transmittanceByWavelength, objectDelta);

        maxLinearityError = Math.max(
          maxLinearityError,
          maxAbs(subtractArrays(finalDelta, expected))
        );
      }
    }
  }

  criteria.push(
    criterionResult({
      criterionId: "composition-identity",
      status: maxCompositionError <= hardTolerance.absolute ? "pass" : "fail",
      tolerance: hardTolerance,
      measuredError: maxCompositionError,
      sourceOrStatus: "reference-backed",
      cases: "all 84 transfer cases",
      notes:
        "Stored final radiance equals T_view * L_object + L_path on spectral arrays.",
    })
  );
  criteria.push(
    criterionResult({
      criterionId: "zero-distance-identity",
      status:
        maxZeroTransmittanceError <= zeroTolerance.absolute &&
        maxZeroPathRadiance <= zeroTolerance.absolute
          ? "pass"
          : "fail",
      tolerance: zeroTolerance,
      measuredError: {
        maxZeroTransmittanceError,
        maxZeroPathRadiance,
      },
      sourceOrStatus: "reference-backed transfer identity",
      cases: "all 0 m cases",
      notes: "Zero-length segment must have T = 1 and L_path = 0.",
    })
  );
  criteria.push(
    criterionResult({
      criterionId: "black-object-identity",
      status: maxBlackIdentityError <= hardTolerance.absolute ? "pass" : "fail",
      tolerance: hardTolerance,
      measuredError: maxBlackIdentityError,
      sourceOrStatus: "reference-backed transfer identity",
      cases: "black object cases",
      notes: "With zero object radiance, final radiance equals path radiance.",
    })
  );
  criteria.push(
    criterionResult({
      criterionId: "linearity-identity",
      status: maxLinearityError <= hardTolerance.absolute ? "pass" : "fail",
      tolerance: hardTolerance,
      measuredError: maxLinearityError,
      sourceOrStatus: "reference-backed transfer identity",
      cases: linearityPairs.map((pair) => pair.join(" - ")),
      notes:
        "Final-radiance differences equal transmittance times object-radiance differences.",
    })
  );

  const maxSegmentTransmittanceError = compositionDiagnostics.reduce(
    (max, diagnostic) => Math.max(max, diagnostic.maxTransmittanceError),
    0
  );
  const maxSegmentPathRadianceError = compositionDiagnostics.reduce(
    (max, diagnostic) => Math.max(max, diagnostic.maxPathRadianceError),
    0
  );

  criteria.push(
    criterionResult({
      criterionId: "segment-composition-identity",
      status:
        maxSegmentTransmittanceError <= 1e-5 &&
        maxSegmentPathRadianceError <= 1e-5
          ? "pass"
          : "fail",
      tolerance: { absolute: 1e-5, status: "algorithmic until convergence" },
      measuredError: {
        maxSegmentTransmittanceError,
        maxSegmentPathRadianceError,
      },
      sourceOrStatus: "reference-backed identity, algorithmic numerical gate",
      cases: compositionDiagnostics.map(
        (diagnostic) => `${diagnostic.sunCase} ${diagnostic.distanceMeters}m`
      ),
      notes:
        "Splitting a segment recomposes T_full = T_1 * T_2 and L_path_full = L_path_1 + T_1 * L_path_2.",
    })
  );
  criteria.push(
    criterionResult({
      criterionId: "transmittance-bounds",
      status:
        minTransmittance >= -1e-12 && maxTransmittance <= 1 + 1e-12
          ? "pass"
          : "fail",
      tolerance: { lower: 0, upper: 1, slack: 1e-12 },
      measuredError: { minTransmittance, maxTransmittance },
      sourceOrStatus: "reference-backed",
      cases: "all transfer cases",
      notes: "Beer-Lambert transmittance should stay in [0, 1].",
    })
  );
  criteria.push(
    criterionResult({
      criterionId: "nonnegative-optical-depth",
      status: minOpticalDepth >= -1e-12 ? "pass" : "fail",
      tolerance: { lower: 0, slack: 1e-12 },
      measuredError: { minOpticalDepth },
      sourceOrStatus: "reference-backed",
      cases: "all transfer cases",
      notes: "Optical depth should be nonnegative.",
    })
  );
  criteria.push(
    criterionResult({
      criterionId: "beer-lambert-identity",
      status: maxBeerLambertError <= 1e-12 ? "pass" : "fail",
      tolerance: { absolute: 1e-12 },
      measuredError: maxBeerLambertError,
      sourceOrStatus: "reference-backed",
      cases: "all transfer cases",
      notes: "Stored transmittance equals exp(-opticalDepth).",
    })
  );
  criteria.push(
    criterionResult({
      criterionId: "finite-nonnegative-radiance",
      status: finiteNonnegativeFailureCount === 0 ? "pass" : "fail",
      tolerance: { nonnegativeSlack: 1e-12 },
      measuredError: { finiteNonnegativeFailureCount },
      sourceOrStatus: "reference-backed",
      cases: "all transfer cases",
      notes: "Radiance and transfer arrays must be finite and nonnegative.",
    })
  );

  const distanceResponses = [];
  for (const sunCase of SUN_CASES) {
    const nearCase = byKey.get(`${sunCase.id}|100|neutral_unit`);
    const farCase = byKey.get(`${sunCase.id}|100000|neutral_unit`);

    distanceResponses.push({
      sunCase: sunCase.id,
      nearMeanTransmittance: nearCase.diagnostics.meanTransmittance,
      farMeanTransmittance: farCase.diagnostics.meanTransmittance,
      nearMeanPathFraction: nearCase.diagnostics.meanPathRadianceFraction,
      farMeanPathFraction: farCase.diagnostics.meanPathRadianceFraction,
      transmittanceDrop:
        nearCase.diagnostics.meanTransmittance -
        farCase.diagnostics.meanTransmittance,
      pathFractionChange:
        farCase.diagnostics.meanPathRadianceFraction -
        nearCase.diagnostics.meanPathRadianceFraction,
    });
  }
  const distanceEffectSize = Math.min(
    ...distanceResponses.map((response) => response.transmittanceDrop)
  );

  criteria.push(
    criterionResult({
      criterionId: "distance-response",
      status: distanceEffectSize > 0 ? "pass" : "fail",
      tolerance: {
        effect: "positive transmittance drop from 100 m to 100 km",
        status: "algorithmic demonstration gate",
      },
      effectSize: { distanceResponses },
      sourceOrStatus: "algorithmic demonstration criterion",
      cases: "neutral_unit at 100 m and 100 km for both Sun cases",
      notes:
        "Longer finite segments reduce the object term and change relative path-radiance influence.",
    })
  );

  const highSun = byKey.get("figure1-13h15-z21|20000|neutral_unit");
  const lowSun = byKey.get("figure1-06h00-z87|20000|neutral_unit");
  const sunPathDifference = maxAbs(
    subtractArrays(
      highSun.pathRadianceByWavelength,
      lowSun.pathRadianceByWavelength
    )
  );
  const sunFinalDifference = maxAbs(
    subtractArrays(
      highSun.finalRadianceByWavelength,
      lowSun.finalRadianceByWavelength
    )
  );
  const convergenceComparison = options.baselineArtifact
    ? computeConvergenceComparison(transferCases, options.baselineArtifact, {
        distanceEffectSize,
        sunPathDifference,
        sunFinalDifference,
      })
    : null;

  criteria.push(
    criterionResult({
      criterionId: "sun-position-response",
      status:
        sunPathDifference > 1e-12 && sunFinalDifference > 1e-12
          ? "pass"
          : "fail",
      tolerance: {
        effect: "nonzero spectral delta at 20 km",
        status: "algorithmic demonstration gate",
      },
      effectSize: { sunPathDifference, sunFinalDifference },
      sourceOrStatus: "algorithmic demonstration criterion",
      cases: "neutral_unit at 20 km",
      notes:
        "Low-Sun and highest-Sun cases produce different path radiance and final object radiance.",
    })
  );

  criteria.push(
    criterionResult({
      criterionId: "spectral-proof",
      status: "pass",
      sourceOrStatus: "artifact-structure check",
      cases: "all transfer cases",
      notes:
        "Criteria are computed from wavelength-indexed arrays before CIE, sRGB, tone mapping, or PNG writing.",
    })
  );
  criteria.push(
    criterionResult({
      criterionId: "display-boundary-proof",
      status: "pass",
      sourceOrStatus: "artifact-structure check",
      cases: "contact-sheet.png and displayPreview fields",
      notes:
        "Display previews are generated from transfer-cases.json values and are not used for pass/fail transport checks.",
    })
  );
  criteria.push(
    criterionResult({
      criterionId: "no-sky-only-proof",
      status: "pass",
      sourceOrStatus: "artifact-structure check",
      cases: "84 finite object endpoint cases",
      notes: "The artifact contains finite target endpoints, not only sky rays.",
    })
  );
  if (options.step && isConvergenceStep(options.step)) {
    criteria.push(
      criterionResult({
        criterionId: "convergence-backed-effect-margin",
        status:
          convergenceComparison && convergenceComparison.passed
            ? "pass"
            : "fail",
        tolerance: {
          marginMultiplier: 5,
          status: "algorithmic convergence gate",
        },
        measuredError: convergenceComparison
          ? {
              maxTransmittanceDelta:
                convergenceComparison.maxTransmittanceDelta,
              maxPathRadianceDelta:
                convergenceComparison.maxPathRadianceDelta,
              maxFinalRadianceDelta:
                convergenceComparison.maxFinalRadianceDelta,
              maxAttenuatedObjectDelta:
                convergenceComparison.maxAttenuatedObjectDelta,
              missingCaseIds: convergenceComparison.missingCaseIds,
            }
          : {
              missingBaselineArtifact: true,
            },
        effectSize: convergenceComparison
          ? convergenceComparison.effects
          : undefined,
        sourceOrStatus: "algorithmic convergence gate",
        cases: convergenceComparison
          ? `${convergenceComparison.matchedCaseCount} matched cases against ${convergenceComparison.baselineArtifact}`
          : "no accepted baseline artifact found",
        notes: convergenceComparison
          ? `Minimum effect-to-convergence margin is ${convergenceComparison.margins.minimumMargin}.`
          : "A convergence artifact requires a previous accepted transfer-baseline artifact.",
      })
    );
  } else {
    criteria.push(
      criterionResult({
        criterionId: "convergence-backed-effect-margin",
        status: "unresolved",
        tolerance: {
          requiredFollowUp: "transfer-convergence",
        },
        sourceOrStatus: "algorithmic pending convergence",
        cases: "all demonstration effects",
        notes:
          "The baseline records effect sizes; the convergence margin is intentionally deferred to the next numbered artifact.",
      })
    );
  }

  return {
    summary: {
      passed: criteria.filter((criterion) => criterion.status === "pass").length,
      failed: criteria.filter((criterion) => criterion.status === "fail").length,
      unresolved: criteria.filter((criterion) => criterion.status === "unresolved").length,
      notApplicable: criteria.filter((criterion) => criterion.status === "not-applicable").length,
    },
    metrics: {
      maxCompositionError,
      maxZeroTransmittanceError,
      maxZeroPathRadiance,
      maxBlackIdentityError,
      maxLinearityError,
      maxSegmentTransmittanceError,
      maxSegmentPathRadianceError,
      maxBeerLambertError,
      minTransmittance,
      maxTransmittance,
      minOpticalDepth,
      finiteNonnegativeFailureCount,
      distanceResponses,
      sunPathDifference,
      sunFinalDifference,
      convergenceComparison,
    },
    compositionDiagnostics,
    criteria,
  };
}

function makeInputs(step) {
  return {
    schemaVersion: 1,
    runId: `${new Date().toISOString()}-${step.id}`,
    stateGoal: step.stateGoal,
    sourceBoundary: {
      allowedLocalCode: [LOCAL_SOURCE_PATH],
      forbiddenLocalSources: [
        "scripts/flat/atmosphere_rejected/",
        "older Flat atmosphere code",
        "older local atmosphere docs",
        "previous local atmosphere logs and generated images",
      ],
    },
    atmosphereProfile: {
      id: "experiment-032-source-k-no-ground-profile",
      geometry: "spherical Earth atmosphere",
      noOzone: true,
      noGroundCoupling: true,
      noDirectSolarDiscCameraRadiance: true,
      constants: ATMOSPHERE,
    },
    geometryProfile: {
      id: "spherical-earth-ground-observer",
      coordinateFrame: "local-tangent-east-north-up",
      bottomRadiusMeters: ATMOSPHERE.bottomRadiusMeters,
      topRadiusMeters: ATMOSPHERE.topRadiusMeters,
      observerHeightMeters: ATMOSPHERE.observerHeightMeters,
    },
    sourceProfile: {
      id: "bruneton-figure1-directional-sun",
      type: "directional",
      sunCases: SUN_CASES,
    },
    spectralGrid: {
      wavelengthCount: SPECTRAL_CHANNELS.length,
      rangeNanometers: [360, 830],
      samplePolicy: "15 centered wavelength samples",
      deltaNanometers: SPECTRAL_DELTA_NM,
      wavelengthsNm: SPECTRAL_CHANNELS.map(
        (channel) => channel.wavelengthNanometers
      ),
      channels: SPECTRAL_CHANNELS,
    },
    numericalControls: step.numericalControls,
    camera: CAMERA,
    sunCases: SUN_CASES,
    environmentTargets: DISTANCES_METERS.map((distanceMeters) => ({
      id: `target-${distanceMeters}m`,
      shape: "spectral-card",
      centerMetersENU: [distanceMeters, 0, 2],
      normalMetersENU: [-1, 0, 0],
      widthMeters: distanceMeters === 0 ? 0 : 1,
      heightMeters: distanceMeters === 0 ? 0 : 1,
      distanceMeters,
    })),
    objectSpectra: OBJECT_SPECTRA.map((spectrum) => ({
      id: spectrum.id,
      title: spectrum.title,
      valuesByWavelength: objectRadianceSpectrum(spectrum),
      units: "algorithmic unit spectral-radiance scale",
    })),
    outputProducts: [
      "state-goal.md",
      "inputs.json",
      "provenance.json",
      "equations-and-constants.json",
      "transfer-cases.json",
      "criteria-results.json",
      "report.md",
      "contact-sheet.png",
      "run.log",
      "script-snapshot.js",
    ],
    algorithmicStressDecisions: ALGORITHMIC_DECISIONS,
    references: REFERENCES,
  };
}

function makeEquationsAndConstants(step) {
  return {
    schemaVersion: 1,
    status: step.id,
    equations: [
      {
        id: "finite-object-transfer",
        expression: "L_camera(lambda) = T_view(lambda) * L_object(lambda) + L_path(lambda)",
        source: "bruneton-demo-finite-object-composition",
      },
      {
        id: "density-profiles",
        expression:
          "rho_R(h) = exp(-max(0, h) / H_R); rho_M(h) = exp(-max(0, h) / H_M); rho_O3(h) = 0",
        source:
          "bruneton-demo-constants; bruneton-2016-no-ozone-comparison-policy",
      },
      {
        id: "scattering-and-extinction",
        expression:
          "beta_R(lambda) = 1.24062e-6 * lambda_um^-4; beta_M_ext(lambda) = beta / H_M * lambda_um^-alpha; beta_M_sca = beta_M_ext * single_scattering_albedo",
        source: "bruneton-demo-constants; bruneton-2016-clear-sky-parameters",
      },
      {
        id: "beer-lambert",
        expression: "T(lambda) = exp(-tau(lambda))",
        source: "bruneton-functions-glsl",
      },
      {
        id: "single-scattering-integral",
        expression:
          "dL = T_view * T_sun * E_sun(lambda) * (rho_R * beta_R * P_R + rho_M * beta_M_sca * P_M) * ds",
        source: "bruneton-single-scattering",
      },
      {
        id: "second-order-integral",
        expression:
          "dL_2 = T_view * integral_S2(L_1(omega_i) * (rho_R * beta_R * P_R + rho_M * beta_M_sca * P_M) d omega_i) * ds",
        source:
          "bruneton-2016-nishita96-double-scattering; gonzalez-2009-fibonacci-sphere-lattice",
      },
      {
        id: "spectral-display",
        expression:
          "linear_sRGB = XYZ_TO_SRGB * 683 * integral(CIE(lambda) * L(lambda) d lambda); display = 1 - exp(-k * max(0, linear_sRGB)); k = 1 / (5 * 683)",
        source:
          "bruneton-color-constants; bruneton-2016-comparison-source-tone-map",
      },
    ],
    constants: {
      atmosphere: ATMOSPHERE,
      numericalControls: step.numericalControls,
      sunCases: SUN_CASES,
      spectralGrid: {
        count: SPECTRAL_CHANNELS.length,
        deltaNanometers: SPECTRAL_DELTA_NM,
        channels: SPECTRAL_CHANNELS,
      },
      display: {
        maxLuminousEfficacy: MAX_LUMINOUS_EFFICACY,
        brunetonComparisonToneMapExposureScale:
          BRUNETON_COMPARISON_TONE_MAP_EXPOSURE_SCALE,
        k: DISPLAY_TONE_MAP_K,
        xyzToSrgb: XYZ_TO_SRGB,
      },
    },
    algorithmicDecisions: ALGORITHMIC_DECISIONS,
    references: REFERENCES,
  };
}

function makeCrcTable() {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    table[n] = c >>> 0;
  }

  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buffers) {
  let crc = 0xffffffff;

  for (const buffer of buffers) {
    for (const byte of buffer) {
      crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const lengthBuffer = Buffer.alloc(4);
  const crcBuffer = Buffer.alloc(4);

  lengthBuffer.writeUInt32BE(data.length, 0);
  crcBuffer.writeUInt32BE(crc32([typeBuffer, data]), 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function writePng(filePath, width, height, pixels) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const header = Buffer.alloc(13);
  const rows = [];

  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  for (let y = 0; y < height; y += 1) {
    const filter = Buffer.from([0]);
    const rowStart = y * width * 4;
    const rowEnd = rowStart + width * 4;
    rows.push(filter, pixels.subarray(rowStart, rowEnd));
  }

  const imageData = zlib.deflateSync(Buffer.concat(rows), { level: 9 });
  const png = Buffer.concat([
    signature,
    pngChunk("IHDR", header),
    pngChunk("IDAT", imageData),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filePath, png);
}

function fillRect(pixels, imageWidth, x, y, width, height, rgba) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      const offset = (yy * imageWidth + xx) * 4;
      pixels[offset] = rgba[0];
      pixels[offset + 1] = rgba[1];
      pixels[offset + 2] = rgba[2];
      pixels[offset + 3] = rgba[3];
    }
  }
}

function writeContactSheet(filePath, transferCases) {
  const swatchWidth = 34;
  const swatchHeight = 14;
  const gap = 2;
  const groupGap = 5;
  const rowCount = transferCases.length;
  const width = gap + 4 * swatchWidth + 5 * gap;
  const height =
    gap +
    rowCount * swatchHeight +
    (rowCount - 1) * gap +
    (SUN_CASES.length * OBJECT_SPECTRA.length - 1) * groupGap +
    gap;
  const pixels = Buffer.alloc(width * height * 4);

  fillRect(pixels, width, 0, 0, width, height, [18, 18, 18, 255]);

  let rowIndex = 0;
  let y = gap;
  for (const sunCase of SUN_CASES) {
    for (const objectSpectrum of OBJECT_SPECTRA) {
      for (const distanceMeters of DISTANCES_METERS) {
        const transferCase = transferCases.find(
          (candidate) =>
            candidate.sunCase.id === sunCase.id &&
            candidate.objectSpectrumId === objectSpectrum.id &&
            candidate.target.distanceMeters === distanceMeters
        );
        const previews = [
          transferCase.displayPreview.sourceObject.encodedRgb,
          transferCase.displayPreview.attenuatedObject.encodedRgb,
          transferCase.displayPreview.pathRadiance.encodedRgb,
          transferCase.displayPreview.finalRadiance.encodedRgb,
        ];

        for (let column = 0; column < previews.length; column += 1) {
          const x = gap + column * (swatchWidth + gap);
          const rgb = previews[column];
          fillRect(pixels, width, x, y, swatchWidth, swatchHeight, [
            rgb[0],
            rgb[1],
            rgb[2],
            255,
          ]);
        }

        rowIndex += 1;
        y += swatchHeight + gap;
      }

      if (rowIndex < rowCount) {
        y += groupGap;
      }
    }
  }

  writePng(filePath, width, height, pixels);
}

function nextRecommendation(step, criteriaResults) {
  if (criteriaResults.summary.failed > 0) {
    return "Continue with the next diagnostic artifact; do not overwrite this failed run.";
  }

  if (isConvergenceStep(step) && criteriaResults.summary.unresolved === 0) {
    return "State goal reached for the transfer baseline and convergence proof. Optional later tracks are Lambertian surface lighting, local Sun, and flat long-sightline follow-ups.";
  }

  if (criteriaResults.summary.unresolved > 0) {
    if (step.id === "transfer-refined-baseline") {
      return "Run `node scripts/flat/atmosphere-environment/run.js --step=transfer-refined-convergence` to test the refined baseline against the next doubled sample counts.";
    }

    return "Run the next `transfer-convergence` artifact to measure convergence deltas for the demonstration effects.";
  }

  return "Run `node scripts/flat/atmosphere-environment/run.js --step=transfer-convergence` to create the next numbered convergence artifact.";
}

function inputChangeSentence(step) {
  if (step.id === "transfer-refined-baseline") {
    return "Numerical controls changed to the doubled transfer-convergence counts from 004; atmosphere constants, Sun cases, distances, and object spectra stayed unchanged.";
  }

  if (step.id === "transfer-refined-convergence") {
    return "Numerical controls changed to 80/40/68/96 for convergence comparison against the latest accepted refined baseline; atmosphere constants, Sun cases, distances, and object spectra stayed unchanged.";
  }

  if (isConvergenceStep(step)) {
    return "Numerical controls changed to doubled sample counts for convergence comparison; atmosphere constants, Sun cases, distances, and object spectra stayed unchanged.";
  }

  return "None relative to the preflight baseline. This run uses experiment 032 constants and assumptions.";
}

function convergenceStatusSentence(step, criteriaResults) {
  const comparison = criteriaResults.metrics.convergenceComparison;

  if (comparison) {
    return `Convergence comparison against ${comparison.baselineArtifact} passed: ${comparison.passed}. Minimum effect-to-convergence margin: ${comparison.margins.minimumMargin}.`;
  }

  if (isConvergenceStep(step)) {
    return "No accepted baseline artifact was available for convergence comparison.";
  }

  return "The unresolved convergence-backed effect margin belongs to the transfer-convergence follow-up.";
}

function makeStateGoal(step, status, criteriaResults) {
  return `# ${step.title}

Status: ${status}

## State Goal

${step.stateGoal}

## Success Definition

The artifact succeeds when hard spectral transfer identities pass on the
recorded wavelength arrays and convergence-sensitive demonstration claims are
either resolved or explicitly carried to the next numbered artifact.

## Attempted

- Generated the fixed 84-case baseline matrix.
- Used experiment 032 atmosphere constants and assumptions.
- Composed caller-provided object radiance with finite-segment atmospheric
  transmittance and path radiance.
- Wrote spectral JSON before display previews.
- Generated a contact sheet from transfer-cases.json.

## Result

- Criteria passed: ${criteriaResults.summary.passed}
- Criteria failed: ${criteriaResults.summary.failed}
- Criteria unresolved: ${criteriaResults.summary.unresolved}

## Next

${nextRecommendation(step, criteriaResults)}
`;
}

function makeReport(step, status, transferCases, criteriaResults, cacheDiagnostics) {
  const metrics = criteriaResults.metrics;

  return `# ${step.title}

Status: ${status}

## Summary

Generated ${transferCases.length} primary finite object-transfer cases:
\`2\` Sun cases, \`7\` distances, and \`6\` synthetic object spectra. The
transport endpoint is spectral radiance by wavelength. CIE, sRGB, tone mapping,
and PNG output are display consumers only.

Criteria passed: ${criteriaResults.summary.passed}. Failed:
${criteriaResults.summary.failed}. Unresolved:
${criteriaResults.summary.unresolved}. ${convergenceStatusSentence(
  step,
  criteriaResults
)}

## What It Shows

- Zero-distance transfer preserved object radiance.
- Black objects returned only atmospheric path radiance.
- Object-radiance differences stayed linear under view transmittance.
- Longer finite segments reduced mean transmittance.
- Low-Sun and high-Sun cases produced different path radiance.

## Key Metrics

| Metric | Value |
| --- | ---: |
| Max final-composition error | ${metrics.maxCompositionError} |
| Max zero-distance transmittance error | ${metrics.maxZeroTransmittanceError} |
| Max zero-distance path radiance | ${metrics.maxZeroPathRadiance} |
| Max black-object identity error | ${metrics.maxBlackIdentityError} |
| Max linearity error | ${metrics.maxLinearityError} |
| Max split-segment transmittance error | ${metrics.maxSegmentTransmittanceError} |
| Max split-segment path-radiance error | ${metrics.maxSegmentPathRadianceError} |
| Min transmittance | ${metrics.minTransmittance} |
| Max transmittance | ${metrics.maxTransmittance} |
| Incident sky cache entries | ${cacheDiagnostics.incidentSkyCacheEntries} |
| Min convergence margin | ${metrics.convergenceComparison ? metrics.convergenceComparison.margins.minimumMargin : "not run"} |

## Distance Responses

${metrics.distanceResponses
  .map(
    (response) =>
      `- ${response.sunCase}: mean T 100 m = ${response.nearMeanTransmittance}, mean T 100 km = ${response.farMeanTransmittance}, path fraction change = ${response.pathFractionChange}`
  )
  .join("\n")}

## Display Boundary

\`contact-sheet.png\` is generated from \`transfer-cases.json\`. It uses one
fixed artifact-wide display mapping: CIE to linear sRGB, then
\`1 - exp(-k * linear_sRGB)\` with \`k = 1 / (5 * 683)\`. Swatches are
organized as Sun-case and object-spectrum blocks with distance rows and four
columns: source object, attenuated object, path radiance, and final radiance.

The source object spectra are algorithmic unit radiance arrays. They are not
material reflectance measurements.

## Next

${nextRecommendation(step, criteriaResults)}
`;
}

function makeRunningLogEntry(artifactInfo, step, status, criteriaResults) {
  return `## ${artifactInfo.folderName}

State goal:
${step.stateGoal}

What it is doing:
Generate finite object-transfer packets for two Bruneton Figure 1 Sun cases,
seven algorithmic distances, and six synthetic caller-provided object spectra.

Inputs and assumptions changed:
${inputChangeSentence(step)}

Commands run:
\`node ${SCRIPT_PATH} --step=${step.id}\`

What it learned:
The artifact generated ${criteriaResults.summary.passed} passing criteria,
${criteriaResults.summary.failed} failing criteria, and
${criteriaResults.summary.unresolved} unresolved criteria.
${convergenceStatusSentence(step, criteriaResults)}

Accepted/rejected/superseded/blocked:
${status}

Next:
${nextRecommendation(step, criteriaResults)}

`;
}

function writeRunLog(filePath, lines) {
  writeText(filePath, `${lines.join("\n")}\n`);
}

function copyScriptSnapshot(artifactDirectory) {
  fs.copyFileSync(__filename, path.join(artifactDirectory, "script-snapshot.js"));
}

function summarizeGeneratedFiles(artifactDirectory) {
  return fs
    .readdirSync(artifactDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

function main() {
  const step = activeStep();
  const artifactInfo = nextArtifactInfo(step);
  const startedAt = new Date().toISOString();
  const command = `node ${SCRIPT_PATH} --step=${step.id}`;
  const runLogLines = [
    `startedAt=${startedAt}`,
    `script=${SCRIPT_PATH}`,
    `step=${step.id}`,
    `artifact=${artifactInfo.folderName}`,
    `command=${command}`,
  ];

  const inputs = makeInputs(step);
  const baselineArtifact =
    isConvergenceStep(step)
      ? findLatestAcceptedBaselineArtifact(artifactInfo.existingArtifacts)
      : null;

  if (baselineArtifact) {
    inputs.convergenceReferenceArtifact = {
      folderName: baselineArtifact.folderName,
      artifactFolder: path
        .relative(ROOT, baselineArtifact.directory)
        .replaceAll("\\", "/"),
      status: baselineArtifact.provenance.status,
    };
    runLogLines.push(`convergenceReference=${baselineArtifact.folderName}`);
  }

  const { transferCases, compositionDiagnostics, cacheDiagnostics } =
    computeTransferCases(step, artifactInfo);
  const criteriaResults = evaluateCriteria(
    transferCases,
    compositionDiagnostics,
    {
      step,
      baselineArtifact,
    }
  );
  const status =
    criteriaResults.summary.failed === 0 ? "accepted" : "rejected";

  runLogLines.push(`status=${status}`);
  runLogLines.push(`completedAt=${new Date().toISOString()}`);

  writeText(
    path.join(artifactInfo.directory, "state-goal.md"),
    makeStateGoal(step, status, criteriaResults)
  );
  writeJson(path.join(artifactInfo.directory, "inputs.json"), inputs);
  writeJson(
    path.join(artifactInfo.directory, "equations-and-constants.json"),
    makeEquationsAndConstants(step)
  );
  writeJson(path.join(artifactInfo.directory, "transfer-cases.json"), {
    schemaVersion: 1,
    caseCount: transferCases.length,
    transferCases,
    compositionDiagnostics,
    cacheDiagnostics,
  });
  writeJson(
    path.join(artifactInfo.directory, "criteria-results.json"),
    criteriaResults
  );
  writeText(
    path.join(artifactInfo.directory, "report.md"),
    makeReport(step, status, transferCases, criteriaResults, cacheDiagnostics)
  );
  writeContactSheet(
    path.join(artifactInfo.directory, "contact-sheet.png"),
    transferCases
  );
  copyScriptSnapshot(artifactInfo.directory);
  writeRunLog(path.join(artifactInfo.directory, "run.log"), runLogLines);
  writeJson(path.join(artifactInfo.directory, "provenance.json"), {
    schemaVersion: 1,
    step,
    scriptPath: SCRIPT_PATH,
    command,
    artifactFolder: path.relative(ROOT, artifactInfo.directory).replaceAll("\\", "/"),
    artifactNumber: artifactInfo.artifactNumber,
    artifactNumberDecision: {
      existingArtifacts: artifactInfo.existingArtifacts,
      nextArtifactNumber: artifactInfo.artifactNumber,
      policy: "max(existing NNN) + 1; never overwrite",
    },
    sourceBoundary: inputs.sourceBoundary,
    startedAt,
    completedAt: new Date().toISOString(),
    status,
    runningLog: path
      .relative(ROOT, path.join(ARTIFACT_ROOT, "running-log.md"))
      .replaceAll("\\", "/"),
    scriptSnapshot: "script-snapshot.js",
    convergenceReferenceArtifact: baselineArtifact
      ? baselineArtifact.folderName
      : null,
    references: REFERENCES,
    algorithmicDecisions: ALGORITHMIC_DECISIONS,
    generatedFiles: summarizeGeneratedFiles(artifactInfo.directory),
  });

  fs.appendFileSync(
    path.join(ARTIFACT_ROOT, "running-log.md"),
    makeRunningLogEntry(artifactInfo, step, status, criteriaResults)
  );

  console.log(`Wrote ${artifactInfo.folderName}`);
  console.log(`Status: ${status}`);
  console.log(
    `Criteria: ${criteriaResults.summary.passed} pass, ${criteriaResults.summary.failed} fail, ${criteriaResults.summary.unresolved} unresolved`
  );
}

main();
