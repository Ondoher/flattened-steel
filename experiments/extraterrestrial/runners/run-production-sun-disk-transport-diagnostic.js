import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
	BrunetonColorDisplayModel,
	CanonicalAtmosphere,
	DistantSunLightSource,
	SphericalEarthGeometry,
} from '../../../src/algorithm32/implementation/index.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {DistantSunCelestialCpuCache} from '../../../src/algorithm32/implementation/distant-sun/celestial/DistantSunCelestialCpuCache.js';
import DistanceMath from '../../../src/algorithm32/math/DistanceMath.js';
import {NATIVE_48_POSITION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../src/algorithm32/spectral-values/index.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../../../src/algorithm32/profiles/native-15/native-15-profile.js';
import {
	assertDenyByDefaultWorkingTree,
	assertExistingRealPathContained,
	assertNoReparseEntries,
	createProtectedTrackedInventory,
	loadContainmentPolicy,
	verifyProtectedTrackedInventory,
} from '../harness/lib/containment.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_ROOT, PRODUCTION_SOURCE_ROOT, REPOSITORY_ROOT} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-production-sun-disk-transport-diagnostic.js';
const RUNNER_PATH = fileURLToPath(import.meta.url);
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'production-sun-disk-diagnostic-v1.json');
const CHANNEL_COUNT = 15;
const SEALED_BASELINE_OUTPUTS = [
	'references/results/experiments/b1-directional-sky-radiance/gpu/algorithm32-current-production-gpu-default-provenance.json',
	'references/results/experiments/b1-directional-sky-radiance/gpu/algorithm32-current-production-gpu-j4-cube.json',
	'references/results/experiments/b1-directional-sky-radiance/gpu/algorithm32-current-production-gpu-j4-provenance.json',
	'references/results/experiments/b1-directional-sky-radiance/gpu/figures/b1-aggregate-rmse.svg',
	'references/results/experiments/b1-directional-sky-radiance/gpu/figures/b1-figure5-relative-error-domes.svg',
	'references/results/experiments/b1-directional-sky-radiance/gpu/figures/b1-per-time-rmse.svg',
	'references/results/experiments/b1-directional-sky-radiance/gpu/manifest.json',
	'references/results/experiments/b1-directional-sky-radiance/gpu/result.md',
	'src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js',
	'src/algorithm32/implementation/bruneton-color/_tests/bruneton-color-display-model.spec.js',
	'src/algorithm32/rendering-runtime/three/_tests/stage10-spectral-composition.browser.js',
];

/** Accept the exact regenerated Step 1 evidence while retaining deny-by-default containment. */
async function prepareContainmentPolicy() {
	const policy = await loadContainmentPolicy();
	const acceptedPolicy = {
		...policy,
		writePolicy: {
			...policy.writePolicy,
			canonicalDocumentation: [...policy.writePolicy.canonicalDocumentation, ...SEALED_BASELINE_OUTPUTS],
		},
	};
	await assertDenyByDefaultWorkingTree(acceptedPolicy);
	return acceptedPolicy;
}

/** Require one diagnostic invariant. */
function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

/** Create one native-15 radiance packet for the production Color owner. */
function createRadiancePacket(sourceDefinition, values, provenanceIdentity) {
	return /** @type {SpectralRadiancePacket} */ (
		new SpectralPacket({
			basis: sourceDefinition.surfaceRadiance.basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values,
			provenanceIdentity,
		})
	);
}

/** Return photopic luminance from production linear-sRGB coordinates. */
function photopicLuminance(linearSrgb) {
	return 0.2126 * linearSrgb[0] + 0.7152 * linearSrgb[1] + 0.0722 * linearSrgb[2];
}

/** Integrate the normalized Henyey-Greenstein phase function over one forward cone. */
function acceptedHenyeyGreensteinFraction(anisotropy, coneRadiusRadians) {
	if (anisotropy === 0) return (1 - Math.cos(coneRadiusRadians)) / 2;
	const denominator = Math.sqrt(1 + anisotropy * anisotropy - 2 * anisotropy * Math.cos(coneRadiusRadians));
	return ((1 - anisotropy * anisotropy) / (2 * anisotropy)) * (1 / (1 - anisotropy) - 1 / denominator);
}

/** Integrate atmosphere coefficient families over one geometry-owned source path. */
function integrateOpticalDepthFamilies(atmosphere, sourcePath) {
	const result = {
		rayleigh: new Array(CHANNEL_COUNT).fill(0),
		mieScattering: new Array(CHANNEL_COUNT).fill(0),
		mieAbsorption: new Array(CHANNEL_COUNT).fill(0),
		otherAbsorption: new Array(CHANNEL_COUNT).fill(0),
	};
	for (const sample of sourcePath.samples) {
		const medium = atmosphere.sampleMedium(sample.atmosphereCoordinate);
		const measureMeters = DistanceMath.toMeters(sample.measure);
		for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
			result.rayleigh[channelIndex] += medium.rayleighScattering.values[channelIndex] * measureMeters;
			result.mieScattering[channelIndex] += medium.mieScattering.values[channelIndex] * measureMeters;
			result.mieAbsorption[channelIndex] +=
				(medium.mieExtinction.values[channelIndex] - medium.mieScattering.values[channelIndex]) * measureMeters;
			result.otherAbsorption[channelIndex] += medium.absorption.values[channelIndex] * measureMeters;
		}
	}
	return result;
}

/** Materialize direct-Sun radiance for one optical-depth policy. */
function transportSurfaceRadiance(sourceDefinition, opticalDepth) {
	return sourceDefinition.surfaceRadiance.values.map(
		(value, channelIndex) => value * Math.exp(-opticalDepth[channelIndex]),
	);
}

/** Produce Color-facing diagnostic values for one spectral radiance packet. */
function describeRadiance(color, packet) {
	const linearSrgb = color.radianceToLinearSrgb(packet);
	const displayRgb = color.radianceToDisplayRgb(packet);
	return {
		values: [...packet.values],
		linearSrgb,
		photopicLuminance: photopicLuminance(linearSrgb),
		displayRgb,
		displayPeak: Math.max(...displayRgb),
	};
}

/** Build one exact production configuration and all requested direct-Sun variants. */
function evaluateCondition(fixture, condition) {
	const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const atmosphere = new CanonicalAtmosphere();
	const geometry = new SphericalEarthGeometry({
		bottomRadius: profile.physical.geometry.bottomRadius,
		topRadius: profile.physical.geometry.topRadius,
		observerHeight: {value: fixture.observerHeightMeters, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		sceneFrame: {kind: 'observer-local'},
		cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN_OWNER.count,
		cacheBoundaryAltitude: NATIVE_48_POSITION_DOMAIN_OWNER.nodes[0].coordinate,
		sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
	});
	const source = new DistantSunLightSource({
		angularRadius: {value: fixture.sunAngularRadiusRadians, units: 'radians'},
	});
	const observation = {
		instant: condition.instant,
		location: {
			latitude: {value: fixture.location.latitudeDegrees, units: 'degrees'},
			longitude: {value: fixture.location.longitudeDegrees, units: 'degrees'},
		},
	};
	geometry.configureLightSource({lightSource: source, observation});
	const roster = /** @type {SphericalSunStarsSourceRoster} */ ({
		id: 'production-sun-disk-diagnostic-roster',
		family: 'spherical-sun-stars-radial-v1',
		sun: source,
		stars: null,
	});
	const placements = geometry.resolveCelestialPlacements({roster, observation});
	const placement = placements[0];
	requireCondition(placement?.kind === 'distant-uniform-sun', 'Diagnostic Sun placement is unavailable.');
	const query = geometry.createCelestialQueryPacket(roster, placements);
	const model = {
		profile,
		atmosphere,
		geometry,
		lightSource: source,
		celestialSources: roster,
	};
	const cache = new DistantSunCelestialCpuCache({
		model,
		domain: geometry.describeCelestialContributionDomain(),
		placement,
		source,
	});
	const cacheLookup = cache.lookup({
		receiverStencil: query.receiverStencil,
		directionStencil: query.sun.directionStencil,
	});
	const sourcePath = geometry.resolveAtmospherePath({
		ray: {origin: query.receiverPosition, direction: placement.directionToSource},
		sourcePathLimit: {maxDistance: null, reason: 'distant-source-to-atmosphere-boundary'},
	});
	const families = integrateOpticalDepthFamilies(atmosphere, sourcePath);
	const anisotropy = CANONICAL_ATMOSPHERE_CONSTANTS.miePhaseFunctionG;
	const diskFraction = acceptedHenyeyGreensteinFraction(anisotropy, fixture.sunAngularRadiusRadians);
	const oneDegreeFraction = acceptedHenyeyGreensteinFraction(
		anisotropy,
		(fixture.acceptanceConeRadiusDegrees * Math.PI) / 180,
	);
	const fullOpticalDepth = families.rayleigh.map(
		(value, index) =>
			value + families.mieScattering[index] + families.mieAbsorption[index] + families.otherAbsorption[index],
	);
	const paperBoundOpticalDepth = families.rayleigh.map(
		(value, index) =>
			value +
			(1 - anisotropy) * (families.mieScattering[index] + families.mieAbsorption[index]) +
			families.otherAbsorption[index],
	);
	const diskConeOpticalDepth = families.rayleigh.map(
		(value, index) =>
			value +
			families.mieAbsorption[index] +
			(1 - diskFraction) * families.mieScattering[index] +
			families.otherAbsorption[index],
	);
	const oneDegreeConeOpticalDepth = families.rayleigh.map(
		(value, index) =>
			value +
			families.mieAbsorption[index] +
			(1 - oneDegreeFraction) * families.mieScattering[index] +
			families.otherAbsorption[index],
	);
	const definition = source.celestialSourceDefinition;
	const color = new BrunetonColorDisplayModel();
	const variants = Object.fromEntries(
		[
			['cacheInterpolatedFullExtinction', cacheLookup.radiance.values],
			['exactFullExtinction', transportSurfaceRadiance(definition, fullOpticalDepth)],
			['paperOneMinusGBound', transportSurfaceRadiance(definition, paperBoundOpticalDepth)],
			['finiteDiskCone', transportSurfaceRadiance(definition, diskConeOpticalDepth)],
			['finiteOneDegreeCone', transportSurfaceRadiance(definition, oneDegreeConeOpticalDepth)],
		].map(([id, values]) => {
			const packet = createRadiancePacket(
				definition,
				values,
				`production-sun-disk-diagnostic:${condition.id}:${id}`,
			);
			return [id, describeRadiance(color, packet)];
		}),
	);
	const exact = variants.exactFullExtinction.photopicLuminance;
	const cached = variants.cacheInterpolatedFullExtinction.photopicLuminance;
	return {
		id: condition.id,
		instant: condition.instant,
		directionToSource: placement.directionToSource,
		solarElevationDegrees: (Math.asin(placement.directionToSource[2]) * 180) / Math.PI,
		support: placement.support,
		cacheStencils: {
			receiver: query.receiverStencil,
			direction: query.sun.directionStencil,
		},
		sourcePathLengthMeters: DistanceMath.toMeters(sourcePath.length),
		acceptedForwardFraction: {
			diskRadius: diskFraction,
			oneDegreeRadius: oneDegreeFraction,
		},
		opticalDepthFamilies: families,
		variants,
		cacheToExactPhotopicRatio: exact === 0 ? null : cached / exact,
	};
}

async function main() {
	const fixture = JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
	const run = await initializeRunRecord({
		slug: 'production-sun-disk-transport-diagnostic',
		command: COMMAND,
		inputs: fixture,
		provenance: {
			productionCommit: '0376e78',
			productionSource: 'src/algorithm32',
			diagnosticOwner: 'experiments/extraterrestrial',
		},
		environment: {node: process.version, platform: process.platform},
		references: {
			design: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
			implementationPlan: 'agents/topics/extraterrestrial/sun-disk-appearance-implementation-plan.md',
			fixture: 'experiments/extraterrestrial/fixtures/production-sun-disk-diagnostic-v1.json',
		},
	});
	try {
		const policy = await prepareContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		await Promise.all([
			assertExistingRealPathContained(EXPERIMENT_ROOT, RUNNER_PATH, 'Sun-disk diagnostic runner'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, FIXTURE_PATH, 'Sun-disk diagnostic fixture'),
			assertExistingRealPathContained(REPOSITORY_ROOT, PRODUCTION_SOURCE_ROOT, 'Production source root'),
			assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree'),
		]);
		const conditions = fixture.conditions.map((condition) => evaluateCondition(fixture, condition));
		for (const condition of conditions) {
			requireCondition(condition.sourcePathLengthMeters > 0, `${condition.id} source path must be positive.`);
			requireCondition(
				condition.acceptedForwardFraction.diskRadius >= 0 &&
					condition.acceptedForwardFraction.diskRadius <= condition.acceptedForwardFraction.oneDegreeRadius &&
					condition.acceptedForwardFraction.oneDegreeRadius <= 1,
				`${condition.id} accepted forward fractions must be ordered and bounded.`,
			);
			for (const variant of Object.values(condition.variants)) {
				requireCondition(
					variant.values.every((value) => Number.isFinite(value) && value >= 0),
					`${condition.id} variant radiance must remain finite and nonnegative.`,
				);
			}
		}
		const after = await verifyProtectedTrackedInventory(before, policy);
		const evidence = {
			schemaVersion: fixture.schemaVersion,
			atmosphere: {
				miePhaseFunctionG: CANONICAL_ATMOSPHERE_CONSTANTS.miePhaseFunctionG,
				mieSingleScatteringAlbedo: CANONICAL_ATMOSPHERE_CONSTANTS.mieSingleScatteringAlbedo,
			},
			conditions,
			containment: {protectedFiles: after.fileCount},
		};
		await run.writeJsonArtifact('evidence/sun-disk-transport-diagnostic.json', evidence);
		const summaryRows = conditions
			.map(
				(condition) =>
					`| ${condition.id} | ${condition.solarElevationDegrees.toFixed(4)} | ${condition.sourcePathLengthMeters.toFixed(0)} | ${condition.variants.cacheInterpolatedFullExtinction.photopicLuminance.toExponential(6)} | ${condition.variants.exactFullExtinction.photopicLuminance.toExponential(6)} | ${condition.cacheToExactPhotopicRatio?.toExponential(6) ?? 'n/a'} | ${condition.variants.exactFullExtinction.displayPeak.toFixed(9)} |`,
			)
			.join('\n');
		const report = `# ${run.runId}: Production Sun-disk transport diagnostic

Conclusion: **accepted diagnostic evidence**.

| condition | solar elevation (deg) | source path (m) | cached photopic | exact photopic | cache/exact | exact display peak |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${summaryRows}

This run compares the unchanged production cache with exact-path full extinction,
the reviewed one-minus-g bound, and absorption-preserving finite-cone variants.
It does not change or validate ordinary atmospheric scattering.
`;
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				schemaVersion: evidence.schemaVersion,
				conditionCount: conditions.length,
				cacheToExactPhotopicRatios: conditions.map((condition) => ({
					id: condition.id,
					value: condition.cacheToExactPhotopicRatio,
				})),
			},
			report,
		});
		process.stdout.write(
			`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256}, null, 2)}\n`,
		);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({
				conclusion: 'failed',
				result: {error: detail},
				report: `# ${run.runId}: Production Sun-disk transport diagnostic\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
			process.stderr.write(
				`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`,
			);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
