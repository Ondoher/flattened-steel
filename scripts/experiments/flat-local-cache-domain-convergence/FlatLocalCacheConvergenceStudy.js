import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';

import {CanonicalAtmosphere} from '../../../src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../src/algorithm32/constants/Algorithm32CanonicalData.js';
import {
	CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
} from '../../../src/algorithm32/domains/consts.js';
import {FIBONACCI_34_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/domains/consts.js';
import {FlatEarthGeometry} from '../../../src/algorithm32/geometries/FlatEarthGeometry.js';
import {SpectralCalculator} from '../../../src/algorithm32/implementation/SpectralCalculator.js';
import LocalSunConstructionDomainSelection from '../../../src/algorithm32/light-sources/LocalSunConstructionDomainSelection.js';
import LocalSunCpuCache from '../../../src/algorithm32/light-sources/LocalSunCpuCache.js';
import {LocalSunLightSource} from '../../../src/algorithm32/light-sources/LocalSunLightSource.js';
import {buildLocalSunCpuTransportedRadiance} from '../../../src/algorithm32/light-sources/local-sun-scattering-density-transport.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../../src/algorithm32/profiles/native-15-profile.js';
import {
	FLOAT32_BYTES_PER_SCALAR,
	LOCAL_CACHE_DIRECTION_COMPONENT_COUNT,
	LOCAL_CACHE_POSITION_COMPONENT_COUNT,
	POLICY_RELATIVE_PATH,
	REPORT_RELATIVE_PATH,
	SPECTRAL_ABSOLUTE_FLOOR,
	STUDY_SOURCE_RELATIVE_PATHS,
	TRANSPORT_SOURCE_COMPONENT_COUNT,
	W3_FACE_WIDTH,
	W9_FACE_WIDTH,
	W27_FACE_WIDTH,
} from './consts.js';

/**
 * Run the bounded Stage 9 flat/local cache-domain convergence study.
 */
export default class FlatLocalCacheConvergenceStudy {
	/** @type {string} */
	#workspaceRoot;

	/**
	 * Create the deterministic study.
	 *
	 * @param {{ readonly workspaceRoot: string }} request - Supplies repository root.
	 */
	constructor(request) {
		if (typeof request?.workspaceRoot !== 'string' || request.workspaceRoot.length === 0) {
			throw new TypeError('FlatLocalCacheConvergenceStudy requires workspaceRoot.');
		}

		this.#workspaceRoot = request.workspaceRoot;
	}

	/**
	 * Execute the predeclared comparisons and write the deterministic report.
	 *
	 * @returns {Promise<object>} A small terminal summary.
	 */
	async run() {
		const policy = await this.#readPolicy();
		this.#assertPolicy(policy);
		const sourceHashesBefore = await this.#hashSources(policy);
		const shared = this.#createSharedOwners(policy);
		const spatial = this.#runSpatialStudy(policy, shared);
		const controls = this.#runControlStudies(policy, shared, spatial.referenceFixture);
		const outgoing = this.#runOutgoingStudy(policy, shared);
		const resources = this.#runResourceStudy(policy, shared);
		const decision = this.#resolveDecision({
			policy,
			spatial,
			controls,
			outgoing,
			resources,
		});
		const sourceHashesAfter = await this.#hashSources(policy);

		if (this.#canonicalJson(sourceHashesBefore) !== this.#canonicalJson(sourceHashesAfter)) {
			throw new Error('Convergence study sources changed during execution.');
		}

		const studies = {
			spatial: {
				reference: spatial.reference,
				candidates: spatial.candidates,
			},
			controls,
			outgoing,
			resources,
		};
		const policyBytes = await readFile(join(this.#workspaceRoot, POLICY_RELATIVE_PATH));
		const report = {
			schema: policy.report.schema,
			status: 'completed',
			claimBoundary: policy.claimBoundary,
			policy: {
				path: POLICY_RELATIVE_PATH,
				sha256: this.#sha256(policyBytes),
			},
			sourceHashes: sourceHashesAfter,
			inputIdentitySha256: this.#hashJson({
				policy,
				sourceHashes: sourceHashesAfter,
			}),
			studies,
			decision,
			resultIdentitySha256: this.#hashJson({
				studies,
				decision,
			}),
		};

		await this.#writeReport(report, policy);

		return {
			reportPath: REPORT_RELATIVE_PATH,
			status: report.status,
			decision: report.decision.status,
			currentPositionDomainPass: report.decision.currentPositionDomainPass,
			recommendedCandidateId: report.decision.recommendedCandidateId,
			controlStudiesPass: report.decision.controlStudiesPass,
			resourceCriteriaPass: report.decision.resourceCriteriaPass,
			resultIdentitySha256: report.resultIdentitySha256,
		};
	}

	/**
	 * Load the checked predeclaration.
	 *
	 * @returns {Promise<any>} The parsed policy.
	 */
	async #readPolicy() {
		return JSON.parse(await readFile(join(this.#workspaceRoot, POLICY_RELATIVE_PATH), 'utf8'));
	}

	/**
	 * Require the policy facts the executable study depends on.
	 *
	 * @param {any} policy - Supplies the parsed policy.
	 * @returns {void}
	 */
	#assertPolicy(policy) {
		if (
			policy?.schema !== 'algorithm32-flat-local-cache-domain-convergence-policy-v5' ||
			policy.status !== 'predeclared-before-post-promotion-verification-output' ||
			policy.report?.schema !== 'algorithm32-flat-local-cache-domain-convergence-report-v5' ||
			policy.report?.path !== REPORT_RELATIVE_PATH ||
			policy.productionSelection?.maximumScatteringOrder !== 4 ||
			policy.spatialStudy?.reference?.outgoingFaceWidth !== W3_FACE_WIDTH ||
			policy.spatialStudy?.diagnostics?.retainedWorstSpectrumCountPerFieldCandidate !== 10 ||
			policy.outgoingStudy?.candidateFaceWidth !== W9_FACE_WIDTH ||
			policy.outgoingStudy?.referenceFaceWidth !== W27_FACE_WIDTH ||
			typeof policy.resourceCriteria?.defaultPositionDomainRequirement !== 'string' ||
			policy.positionCandidates?.length !== 1 ||
			policy.positionCandidates[0]?.id !== policy.productionSelection?.position?.id ||
			policy.positionCandidates[0]?.role !== 'current-production-selection' ||
			this.#canonicalJson(policy.positionCandidates[0]?.zNodesMeters) !==
				this.#canonicalJson(policy.productionSelection?.position?.zNodesMeters) ||
			this.#canonicalJson(policy.positionCandidates[0]?.rhoNodesMeters) !==
				this.#canonicalJson(policy.productionSelection?.position?.rhoNodesMeters)
		) {
			throw new TypeError('Flat/local cache convergence policy is incomplete or unsupported.');
		}

		for (const candidate of policy.positionCandidates) {
			if (
				candidate.positionCount !== candidate.zNodesMeters.length * candidate.rhoNodesMeters.length ||
				candidate.positionCount > policy.resourceCriteria.maximumPositionCountUnderW27ResidentLimit ||
				!this.#strictlyIncreasing(candidate.zNodesMeters) ||
				!this.#strictlyIncreasing(candidate.rhoNodesMeters)
			) {
				throw new RangeError(`Invalid predeclared position candidate ${candidate.id}.`);
			}
		}
	}

	/**
	 * Hash every production and study source named by the policy.
	 *
	 * @param {any} policy - Supplies source paths.
	 * @returns {Promise<readonly object[]>} Ordered source hashes.
	 */
	async #hashSources(policy) {
		const paths = [...policy.evidence.productionOwners, ...STUDY_SOURCE_RELATIVE_PATHS];
		const uniquePaths = [...new Set(paths)].sort();
		const results = [];

		for (const relativePath of uniquePaths) {
			const bytes = await readFile(join(this.#workspaceRoot, relativePath));
			results.push({
				path: relativePath,
				byteLength: bytes.byteLength,
				sha256: this.#sha256(bytes),
			});
		}

		return results;
	}

	/**
	 * Create shared atmosphere and point-source owners.
	 *
	 * @param {any} policy - Supplies the configured diagnostic case.
	 * @returns {object} The shared owners.
	 */
	#createSharedOwners(policy) {
		const configured = policy.configuredCase;
		const atmosphere = new CanonicalAtmosphere({
			constants: CANONICAL_ATMOSPHERE_CONSTANTS,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		});
		const lightSource = new LocalSunLightSource({
			sourceKey: 'flat-local-domain-convergence-point-sun',
			position: this.#position(configured.sourcePositionMeters),
			sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
			referenceDistance: this.#distance(configured.referenceDistanceMeters),
			referenceSpectralIncidentScale: configured.referenceSpectralIncidentScale,
			radius: this.#distance(configured.sourceRadiusMeters),
			distanceFalloff: configured.distanceFalloff,
			sourceTransmittanceIntervalCount: policy.productionSelection.sourceTransmittanceIntervalCount,
		});

		return {
			atmosphere,
			lightSource,
			profile: DEFAULT_NATIVE_PRODUCTION_PROFILE,
		};
	}

	/**
	 * Run N4 spatial convergence for the current and bounded fallback grids.
	 *
	 * @param {any} policy - Supplies spatial cases and limits.
	 * @param {any} shared - Supplies atmosphere and source.
	 * @returns {object} Spatial results plus the retained reference fixture.
	 */
	#runSpatialStudy(policy, shared) {
		const referencePolicy = policy.spatialStudy.reference;
		const referenceFixture = this.#buildFixture({
			policy,
			shared,
			id: referencePolicy.id,
			zNodesMeters: referencePolicy.zNodesMeters,
			rhoNodesMeters: referencePolicy.rhoNodesMeters,
			sourceTransmittanceIntervalCount: referencePolicy.sourceTransmittanceIntervalCount,
			outgoingDirectionDomainOwner: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
			maximumScatteringOrder: referencePolicy.maximumScatteringOrder,
		});
		const candidates = [];

		for (const candidatePolicy of policy.positionCandidates) {
			const candidateFixture = this.#buildFixture({
				policy,
				shared,
				id: candidatePolicy.id,
				zNodesMeters: candidatePolicy.zNodesMeters,
				rhoNodesMeters: candidatePolicy.rhoNodesMeters,
				sourceTransmittanceIntervalCount: policy.productionSelection.sourceTransmittanceIntervalCount,
				outgoingDirectionDomainOwner: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
				maximumScatteringOrder: policy.productionSelection.maximumScatteringOrder,
			});
			candidates.push(
				this.#compareSpatialFixture({
					policy,
					referenceFixture,
					candidateFixture,
					candidatePolicy,
				}),
			);
		}

		return {
			referenceFixture,
			reference: {
				id: referencePolicy.id,
				positionCount: referenceFixture.domainSelection.positionCount,
				zNodeCount: referenceFixture.domainSelection.zCount,
				rhoNodeCount: referenceFixture.domainSelection.rhoCount,
				outgoingDirectionCount: referenceFixture.domainSelection.outgoingDirectionCount,
				maximumScatteringOrder: referenceFixture.result.maximumScatteringOrder,
				fieldHashes: this.#resultFieldHashes(referenceFixture.result),
				interpretation: referencePolicy.interpretation,
			},
			candidates,
		};
	}

	/**
	 * Build one actual production-owner CPU result on a selected diagnostic domain.
	 *
	 * @param {object} request - Supplies case and domain facts.
	 * @returns {object} The completed fixture.
	 */
	#buildFixture(request) {
		const geometry = this.#createGeometry({
			policy: request.policy,
			zNodesMeters: request.zNodesMeters,
			rhoNodesMeters: request.rhoNodesMeters,
			sourceTransmittanceIntervalCount: request.sourceTransmittanceIntervalCount,
		});
		const domainSelection = this.#createDomainSelection({
			id: request.id,
			geometry,
			outgoingDirectionDomainOwner: request.outgoingDirectionDomainOwner,
		});
		const constructionIdentities = this.#constructionIdentities({
			geometry,
			atmosphere: request.shared.atmosphere,
			lightSource: request.shared.lightSource,
			domainSelection,
		});
		const result = request.shared.lightSource.buildCpuScatteringCache({
			atmosphere: request.shared.atmosphere,
			geometry,
			profile: request.shared.profile,
			constructionIdentities,
			domainSelection,
			maximumScatteringOrder: request.maximumScatteringOrder,
			sourceTransmittanceIntervalCount: request.sourceTransmittanceIntervalCount,
		});

		return {
			geometry,
			domainSelection,
			constructionIdentities,
			result,
		};
	}

	/**
	 * Construct selected explicit axes or the promoted production defaults.
	 *
	 * @param {object} request - Supplies policy and optional explicit axes.
	 * @returns {FlatEarthGeometry} The configured geometry.
	 */
	#createGeometry(request) {
		const configured = request.policy.configuredCase;
		const cacheAxes = request.useConfiguredDefaultNodes
			? {}
			: {
					cacheAltitudeNodes: request.zNodesMeters.map((value) => this.#distance(value)),
					cacheRadialNodes: request.rhoNodesMeters.map((value) => this.#distance(value)),
				};

		return new FlatEarthGeometry({
			observerPosition: this.#position(configured.observerPositionMeters),
			sourcePosition: this.#position(configured.sourcePositionMeters),
			topAltitude: this.#distance(configured.topAltitudeMeters),
			cacheRadialMaximum: this.#distance(configured.radialMaximumMeters),
			...cacheAxes,
		});
	}

	/**
	 * Bind a flat position owner to one production cubed-sphere owner.
	 *
	 * @param {object} request - Supplies identity and executable owners.
	 * @returns {LocalSunConstructionDomainSelection} The coherent domain.
	 */
	#createDomainSelection(request) {
		const positionDomainOwner = request.geometry.createLocalSunCachePositionDomain();
		const faceWidth = request.outgoingDirectionDomainOwner.faceWidth;

		return new LocalSunConstructionDomainSelection({
			id: `flat-local-domain-study-${request.id}` + `-fibonacci34-w${faceWidth}`,
			positionDomainOwner,
			incomingDirectionDomain: FIBONACCI_34_DIRECTION_DOMAIN_OWNER.descriptor,
			incomingUnitVectors: FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors,
			incomingIntegrationWeights: FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights,
			outgoingDirectionDomainOwner: request.outgoingDirectionDomainOwner,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			radiancePackingId: `flat-local-domain-study-${request.id}` + '-radiance-packing',
			scatteringDensityPackingId: `flat-local-domain-study-${request.id}` + `-w${faceWidth}-density-packing`,
		});
	}

	/**
	 * Create deterministic descriptor identities for one actual build.
	 *
	 * @param {object} request - Supplies physical and domain owners.
	 * @returns {object} Construction identities.
	 */
	#constructionIdentities(request) {
		return {
			source: {
				id: request.lightSource.id,
				contentHash: this.#hashJson(request.lightSource.describe()),
			},
			atmosphere: {
				id: request.atmosphere.id,
				contentHash: this.#hashJson(request.atmosphere.describe()),
			},
			geometry: {
				id: request.geometry.id,
				contentHash: this.#hashJson(request.geometry.describe()),
			},
			domain: {
				id: request.domainSelection.id,
				contentHash: this.#hashJson({
					position: request.domainSelection.positionDomain,
					incoming: request.domainSelection.incomingDirectionDomain,
					outgoing: request.domainSelection.outgoingDirectionDomain,
				}),
			},
		};
	}

	/**
	 * Compare all declared pure and cumulative N4 fields at stress positions.
	 *
	 * @param {object} request - Supplies fixtures, policy, and candidate identity.
	 * @returns {object} The candidate result.
	 */
	#compareSpatialFixture(request) {
		const fieldResults = {};
		const referenceCache = new LocalSunCpuCache(request.referenceFixture.result);
		const candidateCache = new LocalSunCpuCache(request.candidateFixture.result);

		try {
			for (const fieldLabel of request.policy.spatialStudy.comparedFields) {
				const comparisons = [];
				const referenceField = this.#resultField(request.referenceFixture.result, fieldLabel);
				const candidateField = this.#resultField(request.candidateFixture.result, fieldLabel);
				const referenceReader = referenceField.createReader();
				const candidateReader = candidateField.createReader();

				for (const stressPosition of request.policy.spatialStudy.stressPositions) {
					const referencePositionIndex = this.#positionIndex(
						request.referenceFixture.domainSelection,
						stressPosition.zMeters,
						stressPosition.rhoMeters,
					);
					const position =
						request.referenceFixture.domainSelection.positionNodes[referencePositionIndex].metadata
							.position;
					const atmosphereCoordinate =
						request.candidateFixture.geometry.resolveAtmosphereCoordinate(position);
					const candidatePositionStencil =
						request.candidateFixture.geometry.resolveScatteringCachePositionStencil({
							position,
							atmosphereCoordinate,
							positionDomain: request.candidateFixture.domainSelection.positionDomain,
						});

					for (const directionIndex of request.policy.spatialStudy.outgoingDirectionIndicesW3) {
						const referenceSpectrum = this.#readExactSpectrum({
							reader: referenceReader,
							positionIndex: referencePositionIndex,
							directionIndex,
						});
						const candidateSpectrum =
							fieldLabel === 'Jthrough4'
								? candidateCache.sampleResolved({
										positionStencil: candidatePositionStencil,
										directionStencil: {
											indices: [directionIndex],
											weights: [1],
										},
									}).values
								: this.#sampleSpectrum({
										reader: candidateReader,
										positionStencil: candidatePositionStencil,
										directionStencil: {
											indices: [directionIndex],
											weights: [1],
										},
									});

						if (fieldLabel === 'Jthrough4') {
							const observableReference = referenceCache.sampleResolved({
								positionStencil: {
									indices: [referencePositionIndex],
									weights: [1],
								},
								directionStencil: {
									indices: [directionIndex],
									weights: [1],
								},
							}).values;
							this.#assertSpectraExactlyEqual(
								referenceSpectrum,
								observableReference,
								'reference resident cumulative sample',
							);
						}

						comparisons.push(
							this.#compareSpectra({
								id: `${stressPosition.id}` + `:w3-${directionIndex}`,
								reference: referenceSpectrum,
								candidate: candidateSpectrum,
							}),
						);
					}
				}

				fieldResults[fieldLabel] = this.#summarizeComparisons({
					comparisons,
					maximumNormalizedLInf: request.policy.spatialStudy.spectrumMetric.maximumNormalizedLInf,
					maximumP95NormalizedRms: request.policy.spatialStudy.spectrumMetric.maximumP95NormalizedRms,
					retainedWorstSpectrumCount:
						request.policy.spatialStudy.diagnostics.retainedWorstSpectrumCountPerFieldCandidate,
				});
			}
		} finally {
			referenceCache.dispose();
			candidateCache.dispose();
		}

		const spatialPass = Object.values(fieldResults).every((result) => result.pass);
		const maximumNormalizedLInf = Math.max(
			...Object.values(fieldResults).map((result) => result.maximumNormalizedLInf),
		);
		const maximumP95NormalizedRms = Math.max(
			...Object.values(fieldResults).map((result) => result.p95NormalizedRms),
		);

		return {
			id: request.candidatePolicy.id,
			role: request.candidatePolicy.role,
			positionCount: request.candidateFixture.domainSelection.positionCount,
			zNodesMeters: request.candidatePolicy.zNodesMeters,
			rhoNodesMeters: request.candidatePolicy.rhoNodesMeters,
			fieldHashes: this.#resultFieldHashes(request.candidateFixture.result),
			fields: fieldResults,
			maximumNormalizedLInf,
			maximumP95NormalizedRms,
			spatialPass,
		};
	}

	/**
	 * Run source-path and stored-field transport interval studies.
	 *
	 * @param {any} policy - Supplies controls and probes.
	 * @param {any} shared - Supplies physical owners.
	 * @param {any} referenceFixture - Supplies the 15-control dense fixture.
	 * @returns {object} Both control results.
	 */
	#runControlStudies(policy, shared, referenceFixture) {
		return {
			sourceTransmittance: this.#runSourceTransmittanceStudy(policy, shared, referenceFixture),
			storedFieldTransport: this.#runStoredFieldTransportStudy(policy, shared, referenceFixture),
		};
	}

	/**
	 * Compare production 15-interval primary values with a 60-interval build.
	 *
	 * @param {any} policy - Supplies source limits.
	 * @param {any} shared - Supplies atmosphere and source.
	 * @param {any} candidateFixture - Supplies the 15-interval result.
	 * @returns {object} Source-control convergence.
	 */
	#runSourceTransmittanceStudy(policy, shared, candidateFixture) {
		const control = policy.controlStudies.sourceTransmittance;
		const referencePolicy = policy.spatialStudy.reference;
		const referenceFixture = this.#buildFixture({
			policy,
			shared,
			id: `${referencePolicy.id}-source60`,
			zNodesMeters: referencePolicy.zNodesMeters,
			rhoNodesMeters: referencePolicy.rhoNodesMeters,
			sourceTransmittanceIntervalCount: control.referenceIntervalCount,
			outgoingDirectionDomainOwner: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
			maximumScatteringOrder: 1,
		});
		const comparisons = this.#compareExactFieldProbes({
			policy,
			referenceFixture,
			referenceField: referenceFixture.result.pureScatteringDensityByOrder[0],
			candidateFixture,
			candidateField: candidateFixture.result.pureScatteringDensityByOrder[0],
			directionIndices: policy.spatialStudy.outgoingDirectionIndicesW3,
		});
		const summary = this.#summarizeComparisons({
			comparisons,
			maximumNormalizedLInf: control.maximumNormalizedLInf,
			maximumP95NormalizedRms: control.maximumP95NormalizedRms,
		});

		return {
			candidateIntervalCount: control.candidateIntervalCount,
			referenceIntervalCount: control.referenceIntervalCount,
			field: control.field,
			candidateFieldSha256: this.#hashField(candidateFixture.result.pureScatteringDensityByOrder[0]),
			referenceFieldSha256: this.#hashField(referenceFixture.result.pureScatteringDensityByOrder[0]),
			...summary,
		};
	}

	/**
	 * Compare production 15-interval J1 transport with 60 intervals.
	 *
	 * @param {any} policy - Supplies transport limits.
	 * @param {any} shared - Supplies atmosphere and source.
	 * @param {any} fixture - Supplies selected J1 and L1 fields.
	 * @returns {object} Transport-control convergence.
	 */
	#runStoredFieldTransportStudy(policy, shared, fixture) {
		const control = policy.controlStudies.storedFieldTransport;
		const calculator = new SpectralCalculator({
			geometry: fixture.geometry,
			atmosphere: shared.atmosphere,
			lightSource: shared.lightSource,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			executionControls: {
				pathIntervalCount: control.referenceIntervalCount,
				sourceTransmittanceIntervalCount: policy.productionSelection.sourceTransmittanceIntervalCount,
			},
		});
		const referenceField = buildLocalSunCpuTransportedRadiance({
			scatteringDensity: fixture.result.pureScatteringDensityByOrder[0],
			geometry: fixture.geometry,
			atmosphere: shared.atmosphere,
			calculator,
			sourceState: shared.lightSource.describe(),
			domainSelection: fixture.domainSelection,
			pathIntervalCount: control.referenceIntervalCount,
			id: 'flat-local-domain-study-reference-l1-transport60',
		});
		const candidateField = fixture.result.pureRadianceByOrder[0];
		const comparisons = this.#compareExactFieldProbes({
			policy,
			referenceFixture: fixture,
			referenceField,
			candidateFixture: fixture,
			candidateField,
			directionIndices: control.incomingDirectionIndices,
		});
		const summary = this.#summarizeComparisons({
			comparisons,
			maximumNormalizedLInf: control.maximumNormalizedLInf,
			maximumP95NormalizedRms: control.maximumP95NormalizedRms,
		});

		return {
			candidateIntervalCount: control.candidateIntervalCount,
			referenceIntervalCount: control.referenceIntervalCount,
			field: control.field,
			candidateFieldSha256: this.#hashField(candidateField),
			referenceFieldSha256: this.#hashField(referenceField),
			...summary,
		};
	}

	/**
	 * Compare exact-node fields over the declared stress positions.
	 *
	 * @param {object} request - Supplies fields, domains, and directions.
	 * @returns {readonly object[]} Spectral comparisons.
	 */
	#compareExactFieldProbes(request) {
		const referenceReader = request.referenceField.createReader();
		const candidateReader = request.candidateField.createReader();
		const comparisons = [];

		for (const stressPosition of request.policy.spatialStudy.stressPositions) {
			const referencePositionIndex = this.#positionIndex(
				request.referenceFixture.domainSelection,
				stressPosition.zMeters,
				stressPosition.rhoMeters,
			);
			const candidatePositionIndex = this.#positionIndex(
				request.candidateFixture.domainSelection,
				stressPosition.zMeters,
				stressPosition.rhoMeters,
			);

			for (const directionIndex of request.directionIndices) {
				comparisons.push(
					this.#compareSpectra({
						id: `${stressPosition.id}` + `:direction-${directionIndex}`,
						reference: this.#readExactSpectrum({
							reader: referenceReader,
							positionIndex: referencePositionIndex,
							directionIndex,
						}),
						candidate: this.#readExactSpectrum({
							reader: candidateReader,
							positionIndex: candidatePositionIndex,
							directionIndex,
						}),
					}),
				);
			}
		}

		return comparisons;
	}

	/**
	 * Compare W9 interpolation with exact W27 primary-field nodes.
	 *
	 * @param {any} policy - Supplies angular probes and limits.
	 * @param {any} shared - Supplies physical owners.
	 * @returns {object} The bounded angular-refinement result.
	 */
	#runOutgoingStudy(policy, shared) {
		const outgoing = policy.outgoingStudy;
		const candidateFixture = this.#buildFixture({
			policy,
			shared,
			id: 'outgoing-w9-candidate',
			zNodesMeters: outgoing.positionAxes.zNodesMeters,
			rhoNodesMeters: outgoing.positionAxes.rhoNodesMeters,
			sourceTransmittanceIntervalCount: outgoing.sourceTransmittanceIntervalCount,
			outgoingDirectionDomainOwner: CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
			maximumScatteringOrder: 1,
		});
		const referenceFixture = this.#buildFixture({
			policy,
			shared,
			id: 'outgoing-w27-reference',
			zNodesMeters: outgoing.positionAxes.zNodesMeters,
			rhoNodesMeters: outgoing.positionAxes.rhoNodesMeters,
			sourceTransmittanceIntervalCount: outgoing.sourceTransmittanceIntervalCount,
			outgoingDirectionDomainOwner: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			maximumScatteringOrder: 1,
		});
		const candidateField = candidateFixture.result.pureScatteringDensityByOrder[0];
		const referenceField = referenceFixture.result.pureScatteringDensityByOrder[0];
		const candidateReader = candidateField.createReader();
		const referenceReader = referenceField.createReader();
		const directionIndices = this.#stridedIndices({
			count: referenceFixture.domainSelection.outgoingDirectionCount,
			stride: outgoing.referenceDirectionIndexStride,
			includeFinal: outgoing.includeFinalReferenceDirection,
		});
		const comparisons = [];

		for (
			let positionIndex = 0;
			positionIndex < referenceFixture.domainSelection.positionCount;
			positionIndex += 1
		) {
			for (const referenceDirectionIndex of directionIndices) {
				const cacheDirection = referenceFixture.domainSelection.outgoingUnitVectors[referenceDirectionIndex];
				const candidateDirectionStencil =
					candidateFixture.domainSelection.resolveOutgoingDirectionStencil(cacheDirection);
				comparisons.push(
					this.#compareSpectra({
						id: `position-${positionIndex}` + `:w27-${referenceDirectionIndex}`,
						reference: this.#readExactSpectrum({
							reader: referenceReader,
							positionIndex,
							directionIndex: referenceDirectionIndex,
						}),
						candidate: this.#sampleSpectrum({
							reader: candidateReader,
							positionStencil: {
								indices: [positionIndex],
								weights: [1],
							},
							directionStencil: candidateDirectionStencil,
						}),
					}),
				);
			}
		}

		const summary = this.#summarizeComparisons({
			comparisons,
			maximumNormalizedLInf: outgoing.maximumNormalizedLInf,
			maximumP95NormalizedRms: outgoing.maximumP95NormalizedRms,
		});

		return {
			candidateFaceWidth: outgoing.candidateFaceWidth,
			referenceFaceWidth: outgoing.referenceFaceWidth,
			sampledReferenceDirectionCount: directionIndices.length,
			positionCount: referenceFixture.domainSelection.positionCount,
			candidateFieldSha256: this.#hashField(candidateField),
			referenceFieldSha256: this.#hashField(referenceField),
			acceptanceInterpretation: outgoing.acceptanceInterpretation,
			scope: outgoing.scope,
			...summary,
		};
	}

	/**
	 * Measure production-domain logical resource facts through actual owners.
	 *
	 * @param {any} policy - Supplies selected domain and limits.
	 * @param {any} shared - Supplies atmosphere.
	 * @returns {object} Resource calculations and pass states.
	 */
	#runResourceStudy(policy, shared) {
		const production = policy.productionSelection;
		const resourcePolicy = policy.resourceCriteria;
		const geometry = this.#createGeometry({
			policy,
			useConfiguredDefaultNodes: true,
			sourceTransmittanceIntervalCount: production.sourceTransmittanceIntervalCount,
		});
		const domainSelection = this.#createDomainSelection({
			id: `${production.position.id}-resource-measurement`,
			geometry,
			outgoingDirectionDomainOwner: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		});
		const realizedZNodesMeters = domainSelection.zNodes.map((node) => node.value);
		const realizedRhoNodesMeters = domainSelection.rhoNodes.map((node) => node.value);
		const defaultPositionDomainPass =
			this.#canonicalJson(realizedZNodesMeters) === this.#canonicalJson(production.position.zNodesMeters) &&
			this.#canonicalJson(realizedRhoNodesMeters) === this.#canonicalJson(production.position.rhoNodesMeters);
		const transportData = geometry.createTransportData({
			atmosphere: shared.atmosphere,
			domains: domainSelection,
			intervalCount: production.transportIntervalCount,
		});
		const measuredTransportBytes =
			(transportData.sources.values.length + transportData.coefficients.values.length) * FLOAT32_BYTES_PER_SCALAR;
		const auxiliaryPackedBytes =
			domainSelection.positionCount * LOCAL_CACHE_POSITION_COMPONENT_COUNT * FLOAT32_BYTES_PER_SCALAR +
			domainSelection.incomingDirectionCount *
				(LOCAL_CACHE_DIRECTION_COMPONENT_COUNT + 1) *
				FLOAT32_BYTES_PER_SCALAR +
			domainSelection.outgoingDirectionCount * LOCAL_CACHE_DIRECTION_COMPONENT_COUNT * FLOAT32_BYTES_PER_SCALAR;
		const packedDataBytes = measuredTransportBytes + auxiliaryPackedBytes;
		const scatteringDensityFieldBytes =
			domainSelection.scatteringDensityPacking.scalarCount * resourcePolicy.scalarBytes;
		const radianceFieldBytes = domainSelection.radiancePacking.scalarCount * resourcePolicy.scalarBytes;
		const peakFieldBytes =
			resourcePolicy.fieldPeakModel.scatteringDensityFields * scatteringDensityFieldBytes +
			resourcePolicy.fieldPeakModel.radianceFields * radianceFieldBytes;
		const peakTrackedLogicalBytes = peakFieldBytes + packedDataBytes;
		const candidates = policy.positionCandidates.map((candidate) =>
			this.#candidateResourceEstimate({
				candidate,
				policy,
			}),
		);

		return {
			production: {
				positionDomainId: domainSelection.positionDomain.id,
				positionCount: domainSelection.positionCount,
				realizedZNodesMeters,
				realizedRhoNodesMeters,
				defaultPositionDomainPass,
				incomingDirectionCount: domainSelection.incomingDirectionCount,
				outgoingDirectionCount: domainSelection.outgoingDirectionCount,
				spectralChannelCount: production.spectralChannelCount,
				transportIntervalCount: production.transportIntervalCount,
				measuredTransportQueryCount: transportData.queryCount,
				measuredTransportTapCount: transportData.tapCount,
				declaredTransportTapUpperBound: resourcePolicy.packedTransportTapUpperBoundPerQuery,
				measuredTransportBytes,
				auxiliaryPackedBytes,
				packedDataBytes,
				scatteringDensityFieldBytes,
				radianceFieldBytes,
				peakFieldBytes,
				residentCumulativeFieldBytes: scatteringDensityFieldBytes,
				peakTrackedLogicalBytes,
				residentPass: scatteringDensityFieldBytes <= resourcePolicy.residentCumulativeFieldBytesMaximum,
				peakTrackedPass: peakTrackedLogicalBytes <= resourcePolicy.peakTrackedLogicalBytesMaximum,
				transportTapBoundPass: transportData.tapCount <= resourcePolicy.packedTransportTapUpperBoundPerQuery,
			},
			candidates,
			qualificationBoundary: resourcePolicy.qualificationBoundary,
		};
	}

	/**
	 * Conservatively estimate one fallback's W27 logical resources.
	 *
	 * @param {object} request - Supplies candidate and policy.
	 * @returns {object} The bounded resource estimate.
	 */
	#candidateResourceEstimate(request) {
		const candidate = request.candidate;
		const production = request.policy.productionSelection;
		const resource = request.policy.resourceCriteria;
		const scatteringDensityFieldBytes =
			candidate.positionCount *
			production.outgoing.directionCount *
			production.spectralChannelCount *
			resource.scalarBytes;
		const radianceFieldBytes =
			candidate.positionCount *
			production.incoming.directionCount *
			production.spectralChannelCount *
			resource.scalarBytes;
		const queryCount = candidate.positionCount * production.incoming.directionCount;
		const transportBytesUpperBound =
			queryCount *
			resource.packedTransportTapUpperBoundPerQuery *
			(TRANSPORT_SOURCE_COMPONENT_COUNT + production.spectralChannelCount) *
			resource.scalarBytes;
		const auxiliaryPackedBytes =
			candidate.positionCount * LOCAL_CACHE_POSITION_COMPONENT_COUNT * resource.scalarBytes +
			production.incoming.directionCount * (LOCAL_CACHE_DIRECTION_COMPONENT_COUNT + 1) * resource.scalarBytes +
			production.outgoing.directionCount * LOCAL_CACHE_DIRECTION_COMPONENT_COUNT * resource.scalarBytes;
		const peakFieldBytes =
			resource.fieldPeakModel.scatteringDensityFields * scatteringDensityFieldBytes +
			resource.fieldPeakModel.radianceFields * radianceFieldBytes;
		const peakTrackedLogicalBytesUpperBound = peakFieldBytes + transportBytesUpperBound + auxiliaryPackedBytes;

		return {
			id: candidate.id,
			positionCount: candidate.positionCount,
			residentCumulativeFieldBytes: scatteringDensityFieldBytes,
			peakTrackedLogicalBytesUpperBound,
			residentPass: scatteringDensityFieldBytes <= resource.residentCumulativeFieldBytesMaximum,
			peakTrackedPass: peakTrackedLogicalBytesUpperBound <= resource.peakTrackedLogicalBytesMaximum,
		};
	}

	/**
	 * Apply the predeclared retain/fallback/failure rule.
	 *
	 * @param {object} request - Supplies all study outputs.
	 * @returns {object} The honest selection result.
	 */
	#resolveDecision(request) {
		const currentId = request.policy.productionSelection.position.id;
		const current = request.spatial.candidates.find((candidate) => candidate.id === currentId);
		const resourceById = new Map(request.resources.candidates.map((candidate) => [candidate.id, candidate]));
		const eligibleFallbacks = request.spatial.candidates
			.filter((candidate) => {
				const resources = resourceById.get(candidate.id);
				return (
					candidate.id !== currentId &&
					candidate.spatialPass &&
					resources?.residentPass &&
					resources?.peakTrackedPass
				);
			})
			.sort(
				(left, right) =>
					left.positionCount - right.positionCount ||
					left.maximumNormalizedLInf - right.maximumNormalizedLInf ||
					left.maximumP95NormalizedRms - right.maximumP95NormalizedRms ||
					left.id.localeCompare(right.id),
			);
		const controlStudyDisposition = Object.fromEntries(
			Object.entries(request.controls).map(([id, result]) => {
				const policy = request.policy.controlStudies[id];
				return [
					id,
					{
						gating: policy.gating !== false,
						pass: result.pass,
						promotionRole: policy.promotionRole,
					},
				];
			}),
		);
		const controlStudiesPass = Object.values(controlStudyDisposition)
			.filter((control) => control.gating)
			.every((control) => control.pass);
		const gatingControlStudyCount = Object.values(controlStudyDisposition).filter(
			(control) => control.gating,
		).length;
		const characterizationFailureIds = Object.entries(controlStudyDisposition)
			.filter(([, control]) => !control.gating && !control.pass)
			.map(([id]) => id);
		const productionResources = request.resources.production;
		const resourceCriteriaPass =
			productionResources.defaultPositionDomainPass &&
			productionResources.residentPass &&
			productionResources.peakTrackedPass &&
			productionResources.transportTapBoundPass;
		const currentPositionDomainPass = current?.spatialPass === true;
		let status = 'no-position-domain-promoted';
		let recommendedCandidateId = null;

		if (currentPositionDomainPass && controlStudiesPass && resourceCriteriaPass) {
			status = 'retain-current-production-selection';
			recommendedCandidateId = currentId;
		} else if (controlStudiesPass && eligibleFallbacks.length > 0) {
			status = 'current-selection-rejected-bounded-fallback-identified';
			recommendedCandidateId = eligibleFallbacks[0].id;
		}

		return {
			status,
			currentPositionDomainId: currentId,
			currentPositionDomainPass,
			controlStudiesPass,
			gatingControlStudyCount,
			characterizationFailureIds,
			controlStudyDisposition,
			resourceCriteriaPass,
			outgoingSupportingStudyPass: request.outgoing.pass,
			recommendedCandidateId,
			productionChangeRequired: recommendedCandidateId !== null && recommendedCandidateId !== currentId,
			eligibleFallbackIds: eligibleFallbacks.map((candidate) => candidate.id),
			failureRule: request.policy.selectionRule.failureRule,
		};
	}

	/**
	 * Resolve one result field by its declared label.
	 *
	 * @param {LocalSunCpuCacheResult} result - Supplies completed fields.
	 * @param {string} label - Supplies J1..J4 or Jthrough4.
	 * @returns {CpuDirectionalSpectralFieldContract} The selected field.
	 */
	#resultField(result, label) {
		if (label === 'Jthrough4') {
			return result.cumulativeScatteringDensity;
		}
		const order = Number(label.slice(1));
		const field = result.pureScatteringDensityByOrder[order - 1];
		if (!field) {
			throw new RangeError(`Missing result field ${label}.`);
		}

		return field;
	}

	/**
	 * Hash all spatially compared result fields.
	 *
	 * @param {LocalSunCpuCacheResult} result - Supplies completed fields.
	 * @returns {object} Ordered field hashes.
	 */
	#resultFieldHashes(result) {
		const hashes = {};
		for (let order = 1; order <= result.pureScatteringDensityByOrder.length; order += 1) {
			hashes[`J${order}`] = this.#hashField(result.pureScatteringDensityByOrder[order - 1]);
		}
		hashes[`Jthrough${result.maximumScatteringOrder}`] = this.#hashField(result.cumulativeScatteringDensity);

		return hashes;
	}

	/**
	 * Find an exact z/rho node in a study domain.
	 *
	 * @param {LocalSunConstructionDomainSelection} domain - Supplies nodes.
	 * @param {number} zMeters - Supplies exact altitude.
	 * @param {number} rhoMeters - Supplies exact radius.
	 * @returns {number} The flattened node index.
	 */
	#positionIndex(domain, zMeters, rhoMeters) {
		const index = domain.positionNodes.findIndex(
			(node) => node.metadata.z.value === zMeters && node.metadata.rho.value === rhoMeters,
		);
		if (index < 0) {
			throw new RangeError(`Missing exact study node z=${zMeters}, rho=${rhoMeters}.`);
		}

		return index;
	}

	/**
	 * Read one exact spectral row from a field.
	 *
	 * @param {object} request - Supplies reader coordinates.
	 * @returns {Float64Array} The fifteen-channel spectrum.
	 */
	#readExactSpectrum(request) {
		const values = new Float64Array(NATIVE_15_SPECTRAL_BASIS.channelCount);
		for (let wavelengthIndex = 0; wavelengthIndex < values.length; wavelengthIndex += 1) {
			values[wavelengthIndex] = request.reader.readScalar({
				positionIndex: request.positionIndex,
				directionIndex: request.directionIndex,
				wavelengthIndex,
			});
		}

		return values;
	}

	/**
	 * Sample one field through supplied position and direction stencils.
	 *
	 * @param {object} request - Supplies reader and resolved stencils.
	 * @returns {Float64Array} The reconstructed spectrum.
	 */
	#sampleSpectrum(request) {
		const values = new Float64Array(NATIVE_15_SPECTRAL_BASIS.channelCount);

		for (let positionTap = 0; positionTap < request.positionStencil.indices.length; positionTap += 1) {
			for (let directionTap = 0; directionTap < request.directionStencil.indices.length; directionTap += 1) {
				const weight =
					request.positionStencil.weights[positionTap] * request.directionStencil.weights[directionTap];
				for (let wavelengthIndex = 0; wavelengthIndex < values.length; wavelengthIndex += 1) {
					values[wavelengthIndex] +=
						request.reader.readScalar({
							positionIndex: request.positionStencil.indices[positionTap],
							directionIndex: request.directionStencil.indices[directionTap],
							wavelengthIndex,
						}) * weight;
				}
			}
		}

		return values;
	}

	/**
	 * Calculate one spectrum-normalized error record.
	 *
	 * @param {object} request - Supplies labelled reference and candidate values.
	 * @returns {object} The deterministic metrics.
	 */
	#compareSpectra(request) {
		let referenceScale = SPECTRAL_ABSOLUTE_FLOOR;
		let maximumAbsoluteError = 0;
		let squaredNormalizedNumerator = 0;
		let nonFiniteScalarCount = 0;
		let negativeScalarCount = 0;

		for (let index = 0; index < request.reference.length; index += 1) {
			referenceScale = Math.max(referenceScale, Math.abs(request.reference[index]));
		}
		for (let index = 0; index < request.reference.length; index += 1) {
			const reference = request.reference[index];
			const candidate = request.candidate[index];
			if (!Number.isFinite(reference) || !Number.isFinite(candidate)) {
				nonFiniteScalarCount += 1;
				continue;
			}
			if (reference < 0 || candidate < 0) {
				negativeScalarCount += 1;
			}
			const absoluteError = Math.abs(candidate - reference);
			maximumAbsoluteError = Math.max(maximumAbsoluteError, absoluteError);
			squaredNormalizedNumerator += (absoluteError / referenceScale) ** 2;
		}

		return {
			id: request.id,
			referenceScale,
			maximumAbsoluteError,
			normalizedLInf: maximumAbsoluteError / referenceScale,
			normalizedRms: Math.sqrt(squaredNormalizedNumerator / request.reference.length),
			nonFiniteScalarCount,
			negativeScalarCount,
		};
	}

	/**
	 * Summarize comparison rows under fixed limits.
	 *
	 * @param {object} request - Supplies rows and thresholds.
	 * @returns {object} The summary and pass state.
	 */
	#summarizeComparisons(request) {
		const sortedRms = request.comparisons
			.map((comparison) => comparison.normalizedRms)
			.sort((left, right) => left - right);
		const percentileIndex = Math.min(sortedRms.length - 1, Math.max(0, Math.ceil(0.95 * sortedRms.length) - 1));
		const worstLInf = request.comparisons.reduce((worst, comparison) =>
			comparison.normalizedLInf > worst.normalizedLInf ? comparison : worst,
		);
		const maximumAbsoluteError = Math.max(
			...request.comparisons.map((comparison) => comparison.maximumAbsoluteError),
		);
		const nonFiniteScalarCount = request.comparisons.reduce(
			(sum, comparison) => sum + comparison.nonFiniteScalarCount,
			0,
		);
		const negativeScalarCount = request.comparisons.reduce(
			(sum, comparison) => sum + comparison.negativeScalarCount,
			0,
		);
		const maximumNormalizedLInf = worstLInf.normalizedLInf;
		const p95NormalizedRms = sortedRms[percentileIndex];
		const worstSpectra =
			request.retainedWorstSpectrumCount === undefined
				? null
				: request.comparisons
						.map((comparison, ordinal) => ({
							comparison,
							ordinal,
						}))
						.sort(this.#compareWorstSpectrumEntries)
						.slice(0, request.retainedWorstSpectrumCount)
						.map(({comparison}) => this.#spectrumDiagnostic(comparison));
		const pass =
			nonFiniteScalarCount === 0 &&
			negativeScalarCount === 0 &&
			maximumNormalizedLInf <= request.maximumNormalizedLInf &&
			p95NormalizedRms <= request.maximumP95NormalizedRms;

		return {
			spectrumCount: request.comparisons.length,
			scalarCount: request.comparisons.length * NATIVE_15_SPECTRAL_BASIS.channelCount,
			maximumAbsoluteError,
			maximumNormalizedLInf,
			p95NormalizedRms,
			nonFiniteScalarCount,
			negativeScalarCount,
			worstSpectrum: this.#spectrumDiagnostic(worstLInf),
			...(worstSpectra === null ? {} : {worstSpectra}),
			limits: {
				maximumNormalizedLInf: request.maximumNormalizedLInf,
				maximumP95NormalizedRms: request.maximumP95NormalizedRms,
			},
			pass,
		};
	}

	/**
	 * Order retained diagnostics without changing the existing worst-spectrum
	 * or acceptance calculations.
	 *
	 * @param {{ comparison: object, ordinal: number }} left - Supplies one row.
	 * @param {{ comparison: object, ordinal: number }} right - Supplies another.
	 * @returns {number} The deterministic sort comparison.
	 */
	#compareWorstSpectrumEntries(left, right) {
		const normalizedDifference = right.comparison.normalizedLInf - left.comparison.normalizedLInf;
		if (normalizedDifference !== 0) {
			return normalizedDifference;
		}
		if (left.comparison.id < right.comparison.id) {
			return -1;
		}
		if (left.comparison.id > right.comparison.id) {
			return 1;
		}
		return left.ordinal - right.ordinal;
	}

	/**
	 * Retain the stable diagnostic subset of one spectrum comparison.
	 *
	 * @param {object} comparison - Supplies one complete comparison row.
	 * @returns {object} The report-safe diagnostic.
	 */
	#spectrumDiagnostic(comparison) {
		return {
			id: comparison.id,
			referenceScale: comparison.referenceScale,
			maximumAbsoluteError: comparison.maximumAbsoluteError,
			normalizedLInf: comparison.normalizedLInf,
			normalizedRms: comparison.normalizedRms,
		};
	}

	/**
	 * Hash one field in logical scalar order as little-endian binary64.
	 *
	 * @param {CpuDirectionalSpectralFieldContract} field - Supplies a sealed field.
	 * @returns {string} SHA-256 of canonical scalar bytes.
	 */
	#hashField(field) {
		const reader = field.createReader();
		const bytes = Buffer.allocUnsafe(reader.scalarCount * 8);
		for (let offset = 0; offset < reader.scalarCount; offset += 1) {
			bytes.writeDoubleLE(reader.readScalarAtOffset(offset), offset * 8);
		}

		return this.#sha256(bytes);
	}

	/**
	 * Create deterministic strided indices.
	 *
	 * @param {object} request - Supplies extent, stride, and endpoint rule.
	 * @returns {readonly number[]} The ordered indices.
	 */
	#stridedIndices(request) {
		const indices = [];
		for (let index = 0; index < request.count; index += request.stride) {
			indices.push(index);
		}
		if (request.includeFinal && indices[indices.length - 1] !== request.count - 1) {
			indices.push(request.count - 1);
		}

		return indices;
	}

	/**
	 * Require exact spectra for the resident-reference cross-check.
	 *
	 * @param {ArrayLike<number>} left - Supplies first spectrum.
	 * @param {ArrayLike<number>} right - Supplies second spectrum.
	 * @param {string} label - Supplies diagnostic label.
	 * @returns {void}
	 */
	#assertSpectraExactlyEqual(left, right, label) {
		for (let index = 0; index < left.length; index += 1) {
			if (!Object.is(left[index], right[index])) {
				throw new Error(`${label} differs at wavelength ${index}.`);
			}
		}
	}

	/**
	 * Return whether an axis is strictly increasing.
	 *
	 * @param {readonly number[]} values - Supplies an axis.
	 * @returns {boolean} True for a valid ordered axis.
	 */
	#strictlyIncreasing(values) {
		return values.every((value, index) => index === 0 || value > values[index - 1]);
	}

	/**
	 * Create one unit-bearing distance.
	 *
	 * @param {number} value - Supplies meters.
	 * @returns {Distance} The distance packet.
	 */
	#distance(value) {
		return {value, units: 'meters'};
	}

	/**
	 * Create one unit-bearing position.
	 *
	 * @param {readonly number[]} coordinates - Supplies meters.
	 * @returns {Position} The position packet.
	 */
	#position(coordinates) {
		return {
			coordinates: [...coordinates],
			units: 'meters',
		};
	}

	/**
	 * Hash deterministic JSON for an accepted value.
	 *
	 * @param {unknown} value - Supplies data.
	 * @returns {string} SHA-256.
	 */
	#hashJson(value) {
		return this.#sha256(this.#canonicalJson(value));
	}

	/**
	 * Serialize JSON with recursively sorted object keys.
	 *
	 * @param {unknown} value - Supplies serializable data.
	 * @returns {string} Canonical JSON.
	 */
	#canonicalJson(value) {
		return JSON.stringify(this.#canonicalValue(value));
	}

	/**
	 * Recursively sort ordinary object keys without changing array order.
	 *
	 * @param {unknown} value - Supplies serializable data.
	 * @returns {unknown} Canonicalized data.
	 */
	#canonicalValue(value) {
		if (Array.isArray(value)) {
			return value.map((entry) => this.#canonicalValue(entry));
		}
		if (
			value !== null &&
			typeof value === 'object' &&
			!(value instanceof Float32Array) &&
			!(value instanceof Float64Array)
		) {
			const canonical = {};
			for (const key of Object.keys(value).sort()) {
				canonical[key] = this.#canonicalValue(value[key]);
			}
			return canonical;
		}
		if (value instanceof Float32Array || value instanceof Float64Array) {
			return Array.from(value);
		}

		return value;
	}

	/**
	 * Hash bytes or text with SHA-256.
	 *
	 * @param {string | Uint8Array} value - Supplies content.
	 * @returns {string} Lowercase hexadecimal hash.
	 */
	#sha256(value) {
		return createHash('sha256').update(value).digest('hex');
	}

	/**
	 * Write the canonical deterministic report.
	 *
	 * @param {object} report - Supplies completed evidence.
	 * @param {any} policy - Supplies the declared path.
	 * @returns {Promise<void>}
	 */
	async #writeReport(report, policy) {
		const reportPath = join(this.#workspaceRoot, policy.report.path);
		await mkdir(dirname(reportPath), {recursive: true});
		await writeFile(reportPath, `${JSON.stringify(this.#canonicalValue(report), null, 2)}\n`, 'utf8');
	}
}
