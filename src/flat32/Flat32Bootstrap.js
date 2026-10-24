import {registry} from '@polylith/core';
import '@polylith/features';
import '@polylith/config';

import {Flat32Application} from './Flat32Application.js';
import {createDistantSunSceneCacheHttpResolver} from './DistantSunSceneCacheResolver.js';
import {loadBrightest2000StellarCatalogPackage} from './Brightest2000StellarCatalogPackageLoader.js';
import {loadHumanVisionFilterPackage} from './HumanVisionFilterPackageLoader.js';

/** Own browser application startup selection and the cleanup handoff. */
export class Flat32Bootstrap {
	/** Start the registry, retire the earlier application, then load and start the selected application.
	 * Missing roots, invalid query configuration, registry failures or unauthenticated packages reject startup.
	 * The browser module loader reports rejection; correct the root, query or assets and reload to retry.
	 * A failed configuration or asset load publishes no replacement cleanup callback.
	 *
	 * @returns {Promise<void>} Resolve after the selected application's synchronous startup returns.
	 */
	async start() {
		const SUNSET_FACING_CAMERA_DIRECTION = /** @type {const} */ ([-0.784864, 0.422618, -0.453204]);
		const COLOR_RESET_SUNSET_FACING_CAMERA_DIRECTION = /** @type {const} */ ([
			-0.8626973302119799, 0.08715574274765817, -0.4981537844393295,
		]);
		const FLAT_180_SOURCE_FACING_CAMERA_DIRECTION = /** @type {const} */ ([-0.0007728, 0.151886, -0.988397]);

		await registry.start();

		window.__flat32Cleanup?.();

		const root = document.getElementById('main-content');

		if (root === null) {
			throw new Error('Flat32 requires the #main-content application root.');
		}

		const searchParameters = new URLSearchParams(window.location.search);
		const localSunCache = searchParameters.get('localSunCache') ?? 'compact-v9-native15';
		if (!['compact-v9-native15', 'rectangular'].includes(localSunCache)) {
			throw new RangeError(`Unsupported Flat32 localSunCache query selection: ${localSunCache}.`);
		}
		const diagnostic = searchParameters.get('diagnostic');
		const colorModelQuery = searchParameters.get('colorModel');
		const stellarCatalogQuery = searchParameters.get('stellarCatalog');
		const stellarCatalog = /** @type {Flat32StellarCatalogId} */ (stellarCatalogQuery ?? 'brightest-2000');
		const stellarPresentation = searchParameters.get('stellarPresentation') ?? 'human';
		if (
			colorModelQuery !== null &&
			![
				'basic-bruneton',
				'color-reset-slope-078-p9',
				'color-reset-slope-078-p2',
				'color-reset-altitude-half-v1',
			].includes(colorModelQuery)
		) {
			throw new RangeError(`Unsupported Flat32 colorModel query selection: ${colorModelQuery}.`);
		}
		const colorDisplayModelConfiguration =
			colorModelQuery === null ? null : {model: /** @type {Flat32FixedColorModelId} */ (colorModelQuery)};
		if (!['physical', 'chroma', 'mesopic', 'human'].includes(stellarPresentation)) {
			throw new RangeError(`Unsupported Flat32 stellarPresentation query selection: ${stellarPresentation}.`);
		}
		if (!['brightest-500', 'brightest-2000'].includes(stellarCatalog)) {
			throw new RangeError(`Unsupported Flat32 stellarCatalog query selection: ${stellarCatalogQuery}.`);
		}
		const brightest2000StellarCatalogDefinition =
			stellarCatalog === 'brightest-2000' ? await loadBrightest2000StellarCatalogPackage() : undefined;
		const mesopicFilter = {
			id: /** @type {const} */ ('human-mesopic-luminance-v1'),
			stage: /** @type {const} */ ('source-linear'),
			target: /** @type {const} */ ('stellar'),
			enabled: stellarPresentation === 'mesopic' || stellarPresentation === 'human',
			parameters: {maximumRodContribution: 0.5},
		};
		const chromaFilter = {
			id: /** @type {const} */ ('human-low-light-chroma-v1'),
			stage: /** @type {const} */ ('source-linear'),
			target: /** @type {const} */ ('stellar'),
			enabled: stellarPresentation === 'chroma' || stellarPresentation === 'human',
			parameters: {maximumChromaRetention: 0.65},
		};
		const presentationFilters = stellarPresentation === 'physical' ? [] : [mesopicFilter, chromaFilter];
		const humanVisionPackage = mesopicFilter.enabled ? await loadHumanVisionFilterPackage() : null;
		let performanceSamples = [];
		const performanceCallback =
			searchParameters.get('performance') === '1'
				? /** @param {ShaderPerformanceSample} sample */ (sample) => {
						performanceSamples.push(sample);
						if (performanceSamples.length > 256) performanceSamples.shift();
						window.__flat32PerformanceSamples = performanceSamples;
						if (sample.event === 'gpu-elapsed' && sample.gpuDuration !== null) {
							document.documentElement.dataset.flat32LastGpuPass = sample.passName;
							document.documentElement.dataset.flat32LastGpuMilliseconds = String(
								sample.gpuDuration.value * 1000,
							);
						}
					}
				: undefined;
		const flatDiagnosticMatch =
			diagnostic?.match(/^flat(0|135|180)-(wide|default)-n([124])(?:-(ferwerda|bruneton))?$/) ?? null;
		const referenceColorMatch =
			diagnostic?.match(
				/^spherical-(reference|sunset-facing|color-reset-sunset-facing)-(ferwerda|bruneton|production)-n4$/,
			) ?? null;
		if (
			diagnostic === 'spherical-wide-n4' ||
			diagnostic === 'spherical-default-n1' ||
			flatDiagnosticMatch !== null ||
			referenceColorMatch !== null
		) {
			document.documentElement.dataset.flat32Diagnostic = diagnostic;
		}
		/** @type {Flat32ApplicationConfiguration} */
		const applicationConfiguration =
			diagnostic === 'spherical-wide-n4'
				? {
						cameraFieldOfViewDegrees: 120,
						maximumScatteringOrder: /** @type {const} */ (4),
						reviewObjectsEnabled: false,
					}
				: diagnostic === 'spherical-default-n1'
					? {
							initialModeKind: /** @type {const} */ ('spherical-distant'),
							maximumScatteringOrder: /** @type {const} */ (1),
							reviewObjectsEnabled: true,
						}
					: referenceColorMatch !== null
						? {
								cameraFieldOfViewDegrees: 78,
								cameraDirectionScene:
									referenceColorMatch[1] === 'color-reset-sunset-facing'
										? COLOR_RESET_SUNSET_FACING_CAMERA_DIRECTION
										: referenceColorMatch[1] === 'sunset-facing'
											? SUNSET_FACING_CAMERA_DIRECTION
											: /** @type {const} */ ([0, 0.422618, -0.906308]),
								maximumScatteringOrder: /** @type {const} */ (4),
								reviewObjectsEnabled: false,
								colorDisplayModelConfiguration:
									referenceColorMatch[2] === 'bruneton'
										? {model: 'basic-bruneton'}
										: referenceColorMatch[2] === 'ferwerda'
											? {model: 'ferwerda-control', adaptationLuminanceCdPerSquareMeter: 0.001}
											: undefined,
							}
						: flatDiagnosticMatch !== null
							? {
									...(flatDiagnosticMatch[2] === 'wide' ? {cameraFieldOfViewDegrees: 120} : {}),
									...(flatDiagnosticMatch[1] === '180'
										? {cameraDirectionScene: FLAT_180_SOURCE_FACING_CAMERA_DIRECTION}
										: {}),
									initialFlatTimeIndex:
										flatDiagnosticMatch[1] === '180' ? 4 : flatDiagnosticMatch[1] === '135' ? 3 : 0,
									initialModeKind: /** @type {const} */ ('flat-local'),
									maximumScatteringOrder: /** @type {SupportedCacheScatteringOrder} */ (
										Number(flatDiagnosticMatch[3])
									),
									reviewObjectsEnabled: flatDiagnosticMatch[2] !== 'wide',
									...(flatDiagnosticMatch[4] === 'bruneton'
										? {colorDisplayModelConfiguration: {model: 'basic-bruneton'}}
										: {}),
								}
							: {};
		const application = new Flat32Application(root, {
			...applicationConfiguration,
			localSunCachePolicy: localSunCache === 'rectangular' ? undefined : 'compact-v9-native15',
			...(colorDisplayModelConfiguration === null ? {} : {colorDisplayModelConfiguration}),
			stellarCatalog,
			...(stellarCatalog === 'brightest-2000' ? {brightest2000StellarCatalogDefinition} : {}),
			presentationFilters,
			...(humanVisionPackage === null
				? {}
				: {scotopicLuminanceWeights: humanVisionPackage.scotopicLuminanceWeights}),
			performanceCallback,
			resolveDistantSunSceneCacheAsset: createDistantSunSceneCacheHttpResolver(),
		});

		window.__flat32Cleanup = application.dispose.bind(application);
		application.start();
	}
}

await new Flat32Bootstrap().start();
