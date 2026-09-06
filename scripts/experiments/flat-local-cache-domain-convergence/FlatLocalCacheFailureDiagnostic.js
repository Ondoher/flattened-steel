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
import {LocalSunLightSource} from '../../../src/algorithm32/light-sources/LocalSunLightSource.js';
import {buildLocalSunCpuTransportedRadiance} from '../../../src/algorithm32/light-sources/local-sun-scattering-density-transport.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../../src/algorithm32/profiles/native-15-profile.js';
import {
	FAILURE_DIAGNOSTIC_RELATIVE_PATH,
	FAILURE_DIAGNOSTIC_SCHEMA,
	POLICY_RELATIVE_PATH,
	PRESERVED_REPORT_RELATIVE_PATH,
	PRESERVED_REPORT_SHA256,
	W3_FACE_WIDTH,
	W9_FACE_WIDTH,
	W27_FACE_WIDTH,
} from './failure-diagnostic-consts.js';

/**
 * Replay only preserved worst cases to attribute the failed promotion study.
 */
export default class FlatLocalCacheFailureDiagnostic {
	/** @type {string} */
	#workspaceRoot;

	/**
	 * Create one post-result diagnostic.
	 *
	 * @param {{ readonly workspaceRoot: string }} request - Supplies repository root.
	 */
	constructor(request) {
		if (typeof request?.workspaceRoot !== 'string' || request.workspaceRoot.length === 0) {
			throw new TypeError('FlatLocalCacheFailureDiagnostic requires workspaceRoot.');
		}
		this.#workspaceRoot = request.workspaceRoot;
	}

	/**
	 * Replay exact frozen failures and write a separate diagnostic.
	 *
	 * @returns {Promise<object>} Terminal summary.
	 */
	async run() {
		const preservedBytes = await readFile(join(this.#workspaceRoot, PRESERVED_REPORT_RELATIVE_PATH));
		const preservedSha256 = this.#sha256(preservedBytes);
		if (preservedSha256 !== PRESERVED_REPORT_SHA256) {
			throw new Error('Preserved convergence report hash changed before diagnosis.');
		}
		const preserved = JSON.parse(preservedBytes);
		const policy = JSON.parse(await readFile(join(this.#workspaceRoot, POLICY_RELATIVE_PATH), 'utf8'));
		const shared = this.#createSharedOwners(policy);
		const spatialReferencePolicy = policy.spatialStudy.reference;
		const currentPolicy = policy.positionCandidates.find(
			(candidate) => candidate.id === policy.productionSelection.position.id,
		);
		const spatialReference = this.#buildFixture({
			policy,
			shared,
			id: spatialReferencePolicy.id,
			zNodesMeters: spatialReferencePolicy.zNodesMeters,
			rhoNodesMeters: spatialReferencePolicy.rhoNodesMeters,
			sourceTransmittanceIntervalCount: spatialReferencePolicy.sourceTransmittanceIntervalCount,
			outgoingDirectionDomainOwner: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
			maximumScatteringOrder: 4,
		});
		const current = this.#buildFixture({
			policy,
			shared,
			id: currentPolicy.id,
			zNodesMeters: currentPolicy.zNodesMeters,
			rhoNodesMeters: currentPolicy.rhoNodesMeters,
			sourceTransmittanceIntervalCount: policy.productionSelection.sourceTransmittanceIntervalCount,
			outgoingDirectionDomainOwner: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
			maximumScatteringOrder: 4,
		});
		const spatial = this.#diagnoseCurrentSpatialFailures({
			policy,
			preserved,
			reference: spatialReference,
			candidate: current,
		});
		const source = this.#diagnoseSourceControlFailure({
			policy,
			preserved,
			shared,
			candidate: spatialReference,
		});
		const transport = this.#diagnoseTransportControlFailure({
			policy,
			preserved,
			shared,
			fixture: spatialReference,
		});
		const outgoing = this.#diagnoseOutgoingFailure({
			policy,
			preserved,
			shared,
		});
		const diagnostic = {
			schema: FAILURE_DIAGNOSTIC_SCHEMA,
			status: 'completed-post-result-focused-replay',
			preservedReport: {
				path: PRESERVED_REPORT_RELATIVE_PATH,
				sha256: preservedSha256,
				resultIdentitySha256: preserved.resultIdentitySha256,
			},
			replayBoundary: {
				cases: 'exact preserved worst cases only',
				newCandidates: false,
				policyChanged: false,
				thresholdsChanged: false,
				productionChanged: false,
			},
			spatial,
			sourceTransmittance: source,
			storedFieldTransport: transport,
			outgoing,
			wiringAudit: this.#wiringAudit(),
		};
		const outputPath = join(this.#workspaceRoot, FAILURE_DIAGNOSTIC_RELATIVE_PATH);
		await mkdir(dirname(outputPath), {recursive: true});
		await writeFile(outputPath, `${JSON.stringify(diagnostic, null, 2)}\n`, 'utf8');

		return {
			path: FAILURE_DIAGNOSTIC_RELATIVE_PATH,
			preservedReportSha256: preservedSha256,
			status: diagnostic.status,
		};
	}

	/**
	 * Create the exact configured atmosphere and source.
	 *
	 * @param {any} policy - Supplies physical facts.
	 * @returns {object} Shared owners.
	 */
	#createSharedOwners(policy) {
		const configured = policy.configuredCase;
		return {
			atmosphere: new CanonicalAtmosphere({
				constants: CANONICAL_ATMOSPHERE_CONSTANTS,
				spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			}),
			lightSource: new LocalSunLightSource({
				sourceKey: 'flat-local-domain-convergence-point-sun',
				position: this.#position(configured.sourcePositionMeters),
				sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
				referenceDistance: this.#distance(configured.referenceDistanceMeters),
				referenceSpectralIncidentScale: configured.referenceSpectralIncidentScale,
				radius: this.#distance(configured.sourceRadiusMeters),
				distanceFalloff: configured.distanceFalloff,
				sourceTransmittanceIntervalCount: policy.productionSelection.sourceTransmittanceIntervalCount,
			}),
			profile: DEFAULT_NATIVE_PRODUCTION_PROFILE,
		};
	}

	/**
	 * Build one exact frozen production-owner fixture.
	 *
	 * @param {object} request - Supplies frozen domain facts.
	 * @returns {object} Completed fixture.
	 */
	#buildFixture(request) {
		const configured = request.policy.configuredCase;
		const geometry = new FlatEarthGeometry({
			observerPosition: this.#position(configured.observerPositionMeters),
			sourcePosition: this.#position(configured.sourcePositionMeters),
			topAltitude: this.#distance(configured.topAltitudeMeters),
			cacheRadialMaximum: this.#distance(configured.radialMaximumMeters),
			cacheAltitudeNodes: request.zNodesMeters.map((value) => this.#distance(value)),
			cacheRadialNodes: request.rhoNodesMeters.map((value) => this.#distance(value)),
		});
		const positionDomainOwner = geometry.createLocalSunCachePositionDomain();
		const faceWidth = request.outgoingDirectionDomainOwner.faceWidth;
		const domainSelection = new LocalSunConstructionDomainSelection({
			id: `flat-local-failure-diagnostic-${request.id}` + `-w${faceWidth}`,
			positionDomainOwner,
			incomingDirectionDomain: FIBONACCI_34_DIRECTION_DOMAIN_OWNER.descriptor,
			incomingUnitVectors: FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors,
			incomingIntegrationWeights: FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights,
			outgoingDirectionDomainOwner: request.outgoingDirectionDomainOwner,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			radiancePackingId: `flat-local-failure-diagnostic-${request.id}` + '-radiance',
			scatteringDensityPackingId: `flat-local-failure-diagnostic-${request.id}` + `-w${faceWidth}-density`,
		});
		const constructionIdentities = {
			source: {
				id: request.shared.lightSource.id,
				contentHash: this.#hashJson(request.shared.lightSource.describe()),
			},
			atmosphere: {
				id: request.shared.atmosphere.id,
				contentHash: this.#hashJson(request.shared.atmosphere.describe()),
			},
			geometry: {
				id: geometry.id,
				contentHash: this.#hashJson(geometry.describe()),
			},
			domain: {
				id: domainSelection.id,
				contentHash: this.#hashJson({
					position: domainSelection.positionDomain,
					incoming: domainSelection.incomingDirectionDomain,
					outgoing: domainSelection.outgoingDirectionDomain,
				}),
			},
		};
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
			result,
		};
	}

	/**
	 * Replay every preserved current-grid worst spectrum and its cumulative companion.
	 *
	 * @param {object} request - Supplies preserved and rebuilt fields.
	 * @returns {object} Exact per-order attribution.
	 */
	#diagnoseCurrentSpatialFailures(request) {
		const preservedCurrent = request.preserved.studies.spatial.candidates.find(
			(candidate) => candidate.id === request.policy.productionSelection.position.id,
		);
		const fields = {};

		for (const fieldLabel of request.policy.spatialStudy.comparedFields) {
			const preservedField = preservedCurrent.fields[fieldLabel];
			const query = this.#parseSpatialWorstId({
				policy: request.policy,
				id: preservedField.worstSpectrum.id,
			});
			fields[fieldLabel] = this.#spatialComparison({
				reference: request.reference,
				candidate: request.candidate,
				fieldLabel,
				query,
				preservedField,
			});
		}

		const overallFieldLabel = Object.entries(preservedCurrent.fields).reduce((worst, entry) =>
			entry[1].maximumNormalizedLInf > worst[1].maximumNormalizedLInf ? entry : worst,
		)[0];
		const overall = fields[overallFieldLabel];
		const cumulativeCompanion = this.#spatialComparison({
			reference: request.reference,
			candidate: request.candidate,
			fieldLabel: 'Jthrough4',
			query: overall.query,
			preservedField: preservedCurrent.fields.Jthrough4,
		});

		return {
			currentPositionDomainId: preservedCurrent.id,
			fields,
			overallWorstField: overallFieldLabel,
			overallWorst: overall,
			cumulativeAtOverallWorstProbe: cumulativeCompanion,
			attribution:
				'The same physical z/rho point and same W3 local direction are compared. Candidate uses geometry-owned bilinear reconstruction; reference is an exact node in the denser non-nested production-owner domain. J2-J4 additionally include each domain own containing-lower construction recurrence, so their differences are joint domain/interpolation/recurrence discretization, not an independent continuous-cache error.',
		};
	}

	/**
	 * Resolve and compare one spatial worst spectrum.
	 *
	 * @param {object} request - Supplies fixtures, field, and query.
	 * @returns {object} Exact scalar attribution.
	 */
	#spatialComparison(request) {
		const referencePositionIndex = this.#positionIndex(
			request.reference.domainSelection,
			request.query.zMeters,
			request.query.rhoMeters,
		);
		const position = request.reference.domainSelection.positionNodes[referencePositionIndex].metadata.position;
		const atmosphereCoordinate = request.candidate.geometry.resolveAtmosphereCoordinate(position);
		const positionStencil = request.candidate.geometry.resolveScatteringCachePositionStencil({
			position,
			atmosphereCoordinate,
			positionDomain: request.candidate.domainSelection.positionDomain,
		});
		const referenceSpectrum = this.#readExactSpectrum({
			field: this.#field(request.reference.result, request.fieldLabel),
			positionIndex: referencePositionIndex,
			directionIndex: request.query.directionIndex,
		});
		const candidateSpectrum = this.#sampleSpectrum({
			field: this.#field(request.candidate.result, request.fieldLabel),
			positionStencil,
			directionStencil: {
				indices: [request.query.directionIndex],
				weights: [1],
			},
		});
		const cacheDirection = request.reference.domainSelection.outgoingUnitVectors[request.query.directionIndex];
		const physicalDirection = request.reference.geometry.expressPhysicalScatteringCacheDirection({
			position,
			cacheDirection,
		});

		return {
			field: request.fieldLabel,
			query: request.query,
			position,
			cacheDirection,
			physicalDirection,
			candidatePositionStencil: positionStencil,
			sourcePath: this.#sourcePathFacts({
				fixture: request.reference,
				position,
				sampleCount: request.reference.result.descriptor.controls.sourceTransmittanceIntervalCount ?? 15,
			}),
			exactDifference: this.#exactDifference({
				referenceSpectrum,
				candidateSpectrum,
			}),
			preservedSummary: request.preservedField.worstSpectrum,
		};
	}

	/**
	 * Replay the exact source 15-versus-60 worst spectrum.
	 *
	 * @param {object} request - Supplies preserved result and candidate.
	 * @returns {object} Source control attribution.
	 */
	#diagnoseSourceControlFailure(request) {
		const preserved = request.preserved.studies.controls.sourceTransmittance;
		const referencePolicy = request.policy.spatialStudy.reference;
		const reference = this.#buildFixture({
			policy: request.policy,
			shared: request.shared,
			id: `${referencePolicy.id}-source60`,
			zNodesMeters: referencePolicy.zNodesMeters,
			rhoNodesMeters: referencePolicy.rhoNodesMeters,
			sourceTransmittanceIntervalCount: preserved.referenceIntervalCount,
			outgoingDirectionDomainOwner: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
			maximumScatteringOrder: 1,
		});
		const query = this.#parseControlWorstId({
			policy: request.policy,
			id: preserved.worstSpectrum.id,
		});
		const referencePositionIndex = this.#positionIndex(reference.domainSelection, query.zMeters, query.rhoMeters);
		const candidatePositionIndex = this.#positionIndex(
			request.candidate.domainSelection,
			query.zMeters,
			query.rhoMeters,
		);
		const position = reference.domainSelection.positionNodes[referencePositionIndex].metadata.position;
		const referenceSpectrum = this.#readExactSpectrum({
			field: reference.result.pureScatteringDensityByOrder[0],
			positionIndex: referencePositionIndex,
			directionIndex: query.directionIndex,
		});
		const candidateSpectrum = this.#readExactSpectrum({
			field: request.candidate.result.pureScatteringDensityByOrder[0],
			positionIndex: candidatePositionIndex,
			directionIndex: query.directionIndex,
		});

		return {
			field: 'J1',
			query,
			position,
			cacheDirection: reference.domainSelection.outgoingUnitVectors[query.directionIndex],
			candidateIntervalCount: preserved.candidateIntervalCount,
			referenceIntervalCount: preserved.referenceIntervalCount,
			sourcePath: this.#sourcePathFacts({
				fixture: reference,
				position,
				sampleCount: preserved.referenceIntervalCount,
			}),
			exactDifference: this.#exactDifference({
				referenceSpectrum,
				candidateSpectrum,
			}),
			preservedSummary: preserved.worstSpectrum,
			attribution:
				'Same exact position, W3 local direction, medium, source, and field domain; only source-path sample count differs. This is a source-path integration-control miss, not spatial interpolation.',
		};
	}

	/**
	 * Replay the exact stored-field transport 15-versus-60 worst spectrum.
	 *
	 * @param {object} request - Supplies preserved result and fixture.
	 * @returns {object} Transport control attribution.
	 */
	#diagnoseTransportControlFailure(request) {
		const preserved = request.preserved.studies.controls.storedFieldTransport;
		const calculator = new SpectralCalculator({
			geometry: request.fixture.geometry,
			atmosphere: request.shared.atmosphere,
			lightSource: request.shared.lightSource,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			executionControls: {
				pathIntervalCount: preserved.referenceIntervalCount,
				sourceTransmittanceIntervalCount: request.policy.productionSelection.sourceTransmittanceIntervalCount,
			},
		});
		const referenceField = buildLocalSunCpuTransportedRadiance({
			scatteringDensity: request.fixture.result.pureScatteringDensityByOrder[0],
			geometry: request.fixture.geometry,
			atmosphere: request.shared.atmosphere,
			calculator,
			sourceState: request.shared.lightSource.describe(),
			domainSelection: request.fixture.domainSelection,
			pathIntervalCount: preserved.referenceIntervalCount,
			id: 'flat-local-failure-diagnostic-l1-transport60',
		});
		const candidateField = request.fixture.result.pureRadianceByOrder[0];
		const query = this.#parseControlWorstId({
			policy: request.policy,
			id: preserved.worstSpectrum.id,
		});
		const positionIndex = this.#positionIndex(request.fixture.domainSelection, query.zMeters, query.rhoMeters);
		const node = request.fixture.domainSelection.positionNodes[positionIndex];
		const position = node.metadata.position;
		const cacheDirection = request.fixture.domainSelection.incomingUnitVectors[query.directionIndex];
		const physicalDirection = request.fixture.geometry.expressPhysicalScatteringCacheDirection({
			position,
			cacheDirection,
		});
		const ray = request.fixture.geometry.resolveCacheBuildRay({
			altitude: node.metadata.z,
			rho: node.metadata.rho,
			incomingDirection: physicalDirection,
			metadata: {
				position,
				positionIndex,
			},
		});

		return {
			field: 'L1',
			query,
			position,
			cacheDirection,
			physicalDirection,
			candidateIntervalCount: preserved.candidateIntervalCount,
			referenceIntervalCount: preserved.referenceIntervalCount,
			path: {
				startDistance: ray.startDistance,
				endDistance: ray.endDistance,
				length: this.#distance(ray.endDistance.value - ray.startDistance.value),
				metadata: ray.metadata,
			},
			exactDifference: this.#exactDifference({
				referenceSpectrum: this.#readExactSpectrum({
					field: referenceField,
					positionIndex,
					directionIndex: query.directionIndex,
				}),
				candidateSpectrum: this.#readExactSpectrum({
					field: candidateField,
					positionIndex,
					directionIndex: query.directionIndex,
				}),
			}),
			preservedSummary: preserved.worstSpectrum,
			attribution:
				'Same stored J1 field, exact position, F34 direction, geometry, atmosphere, and containing-lower lookup; only transport interval count differs. The long radial ray crosses piecewise-constant construction cells, so this measures the production control together with its declared construction lookup rather than isolated smooth quadrature.',
		};
	}

	/**
	 * Replay the exact W9-versus-W27 supporting worst spectrum.
	 *
	 * @param {object} request - Supplies preserved result and owners.
	 * @returns {object} Outgoing refinement attribution.
	 */
	#diagnoseOutgoingFailure(request) {
		const preserved = request.preserved.studies.outgoing;
		const outgoing = request.policy.outgoingStudy;
		const candidate = this.#buildFixture({
			policy: request.policy,
			shared: request.shared,
			id: 'outgoing-w9-candidate',
			zNodesMeters: outgoing.positionAxes.zNodesMeters,
			rhoNodesMeters: outgoing.positionAxes.rhoNodesMeters,
			sourceTransmittanceIntervalCount: outgoing.sourceTransmittanceIntervalCount,
			outgoingDirectionDomainOwner: CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
			maximumScatteringOrder: 1,
		});
		const reference = this.#buildFixture({
			policy: request.policy,
			shared: request.shared,
			id: 'outgoing-w27-reference',
			zNodesMeters: outgoing.positionAxes.zNodesMeters,
			rhoNodesMeters: outgoing.positionAxes.rhoNodesMeters,
			sourceTransmittanceIntervalCount: outgoing.sourceTransmittanceIntervalCount,
			outgoingDirectionDomainOwner: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			maximumScatteringOrder: 1,
		});
		const query = this.#parseOutgoingWorstId(preserved.worstSpectrum.id);
		const node = reference.domainSelection.positionNodes[query.positionIndex];
		const position = node.metadata.position;
		const cacheDirection = reference.domainSelection.outgoingUnitVectors[query.directionIndex];
		const candidateStencil = candidate.domainSelection.resolveOutgoingDirectionStencil(cacheDirection);

		return {
			field: 'J1',
			query,
			position,
			cacheDirection,
			physicalDirection: reference.geometry.expressPhysicalScatteringCacheDirection({
				position,
				cacheDirection,
			}),
			candidateDirectionStencil: candidateStencil,
			exactDifference: this.#exactDifference({
				referenceSpectrum: this.#readExactSpectrum({
					field: reference.result.pureScatteringDensityByOrder[0],
					positionIndex: query.positionIndex,
					directionIndex: query.directionIndex,
				}),
				candidateSpectrum: this.#sampleSpectrum({
					field: candidate.result.pureScatteringDensityByOrder[0],
					positionStencil: {
						indices: [query.positionIndex],
						weights: [1],
					},
					directionStencil: candidateStencil,
				}),
			}),
			preservedSummary: preserved.worstSpectrum,
			attribution:
				'Same exact physical position and local direction. W27 provides the exact node; W9 is reconstructed through its production bilinear stencil. This valid refinement delta rejects W9 at the declared maximum but does not estimate beyond-W27 error.',
		};
	}

	/**
	 * Return exact scalar and spectrum facts for one comparison.
	 *
	 * @param {object} request - Supplies spectra.
	 * @returns {object} Exact maximum-channel data.
	 */
	#exactDifference(request) {
		let channelIndex = 0;
		let maximumAbsoluteError = -1;
		let referenceScale = 0;
		for (let index = 0; index < request.referenceSpectrum.length; index += 1) {
			referenceScale = Math.max(referenceScale, Math.abs(request.referenceSpectrum[index]));
			const error = Math.abs(request.candidateSpectrum[index] - request.referenceSpectrum[index]);
			if (error > maximumAbsoluteError) {
				maximumAbsoluteError = error;
				channelIndex = index;
			}
		}
		const referenceValue = request.referenceSpectrum[channelIndex];
		const candidateValue = request.candidateSpectrum[channelIndex];
		const channel = NATIVE_15_SPECTRAL_BASIS.channels[channelIndex];

		return {
			channelIndex,
			channel,
			referenceValue,
			candidateValue,
			signedDifference: candidateValue - referenceValue,
			absoluteDifference: maximumAbsoluteError,
			referenceScale,
			normalizedLInf: maximumAbsoluteError / Math.max(referenceScale, 1e-30),
			candidateToReferenceRatio: referenceValue === 0 ? null : candidateValue / referenceValue,
			referenceSpectrum: Array.from(request.referenceSpectrum),
			candidateSpectrum: Array.from(request.candidateSpectrum),
			magnitudeAssessment:
				referenceScale <= 1e-20
					? 'concentrated-at-extremely-small-reference-scale'
					: 'not-concentrated-at-the-1e-30-metric-floor',
		};
	}

	/**
	 * Resolve the finite source path at one physical position.
	 *
	 * @param {object} request - Supplies fixture and sample count.
	 * @returns {object} Source-path facts.
	 */
	#sourcePathFacts(request) {
		const atmosphereCoordinate = request.fixture.geometry.resolveAtmosphereCoordinate(request.position);
		const sourceRelativePosition = request.fixture.geometry.resolveSourceRelativePosition({
			position: request.position,
			atmosphereCoordinate,
		});
		const directLighting = request.fixture.result ? request.fixture : null;
		const directionToSource = sourceRelativePosition.directionToSource;
		const sourcePath = request.fixture.geometry.resolveAtmospherePath({
			ray: {
				origin: request.position,
				direction: directionToSource,
			},
			sourcePathLimit: {
				maxDistance: sourceRelativePosition.distanceFromSource,
				reason: 'finite-local-source-distance',
			},
			sampleCount: request.sampleCount,
		});

		return {
			distanceFromSource: sourceRelativePosition.distanceFromSource,
			directionToSource,
			length: sourcePath.length,
			blockedByGround: sourcePath.blockedByGround,
			metadata: sourcePath.metadata,
			sampleCount: request.sampleCount,
			directLightingOwnerPresent: directLighting !== null,
		};
	}

	/**
	 * Parse one spatial worst id against declared positions.
	 *
	 * @param {object} request - Supplies policy and id.
	 * @returns {object} Query coordinates.
	 */
	#parseSpatialWorstId(request) {
		const [positionId, directionLabel] = request.id.split(':');
		const position = request.policy.spatialStudy.stressPositions.find((candidate) => candidate.id === positionId);
		if (!position) {
			throw new RangeError(`Unknown preserved spatial position ${positionId}.`);
		}

		return {
			positionId,
			zMeters: position.zMeters,
			rhoMeters: position.rhoMeters,
			directionIndex: Number(directionLabel.replace('w3-', '')),
		};
	}

	/**
	 * Parse one control worst id.
	 *
	 * @param {object} request - Supplies policy and id.
	 * @returns {object} Query coordinates.
	 */
	#parseControlWorstId(request) {
		const [positionId, directionLabel] = request.id.split(':');
		const position = request.policy.spatialStudy.stressPositions.find((candidate) => candidate.id === positionId);
		if (!position) {
			throw new RangeError(`Unknown preserved control position ${positionId}.`);
		}

		return {
			positionId,
			zMeters: position.zMeters,
			rhoMeters: position.rhoMeters,
			directionIndex: Number(directionLabel.replace('direction-', '')),
		};
	}

	/**
	 * Parse the W9/W27 worst id.
	 *
	 * @param {string} id - Supplies preserved id.
	 * @returns {object} Position and direction indices.
	 */
	#parseOutgoingWorstId(id) {
		const [positionLabel, directionLabel] = id.split(':');
		return {
			positionIndex: Number(positionLabel.replace('position-', '')),
			directionIndex: Number(directionLabel.replace('w27-', '')),
		};
	}

	/**
	 * Select one result field.
	 *
	 * @param {LocalSunCpuCacheResult} result - Supplies completed fields.
	 * @param {string} fieldLabel - Supplies field id.
	 * @returns {CpuDirectionalSpectralFieldContract} Selected field.
	 */
	#field(result, fieldLabel) {
		if (fieldLabel === 'Jthrough4') {
			return result.cumulativeScatteringDensity;
		}
		return result.pureScatteringDensityByOrder[Number(fieldLabel.slice(1)) - 1];
	}

	/**
	 * Find one exact domain node.
	 *
	 * @param {LocalSunConstructionDomainSelection} domain - Supplies nodes.
	 * @param {number} zMeters - Supplies altitude.
	 * @param {number} rhoMeters - Supplies radius.
	 * @returns {number} Exact flattened index.
	 */
	#positionIndex(domain, zMeters, rhoMeters) {
		const index = domain.positionNodes.findIndex(
			(node) => node.metadata.z.value === zMeters && node.metadata.rho.value === rhoMeters,
		);
		if (index < 0) {
			throw new RangeError(`Missing exact node z=${zMeters}, rho=${rhoMeters}.`);
		}
		return index;
	}

	/**
	 * Read one exact field spectrum.
	 *
	 * @param {object} request - Supplies field coordinates.
	 * @returns {Float64Array} Spectrum.
	 */
	#readExactSpectrum(request) {
		const reader = request.field.createReader();
		const values = new Float64Array(NATIVE_15_SPECTRAL_BASIS.channelCount);
		for (let wavelengthIndex = 0; wavelengthIndex < values.length; wavelengthIndex += 1) {
			values[wavelengthIndex] = reader.readScalar({
				positionIndex: request.positionIndex,
				directionIndex: request.directionIndex,
				wavelengthIndex,
			});
		}
		return values;
	}

	/**
	 * Sample one field through resolved stencils.
	 *
	 * @param {object} request - Supplies field and stencils.
	 * @returns {Float64Array} Spectrum.
	 */
	#sampleSpectrum(request) {
		const reader = request.field.createReader();
		const values = new Float64Array(NATIVE_15_SPECTRAL_BASIS.channelCount);
		for (let positionTap = 0; positionTap < request.positionStencil.indices.length; positionTap += 1) {
			for (let directionTap = 0; directionTap < request.directionStencil.indices.length; directionTap += 1) {
				const weight =
					request.positionStencil.weights[positionTap] * request.directionStencil.weights[directionTap];
				for (let wavelengthIndex = 0; wavelengthIndex < values.length; wavelengthIndex += 1) {
					values[wavelengthIndex] +=
						reader.readScalar({
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
	 * State the audited comparison alignment.
	 *
	 * @returns {object} Wiring conclusions.
	 */
	#wiringAudit() {
		return {
			spatial:
				'Same physical point and W3 local direction; reference exact-node read versus candidate geometry-owned bilinear position stencil.',
			sourceTransmittance:
				'Same exact point, W3 direction, source, atmosphere, and field domain; only source-path interval count differs.',
			storedFieldTransport:
				'Same exact point, F34 direction, stored J1, geometry, atmosphere, and construction lookup; only transport interval count differs.',
			outgoing:
				'Same exact point and local direction; exact W27 node versus W9 production interpolation stencil.',
			invalidComparisonFound: false,
			metadataCaveat:
				'Diagnostic source-count override changes numerical construction without changing the source owner configured default identity. The result is never published, and both field and report hashes distinguish it; this is a diagnostic descriptor caveat, not a numerical point/direction mismatch.',
		};
	}

	/**
	 * Create a meter distance.
	 *
	 * @param {number} value - Supplies meters.
	 * @returns {Distance} Distance packet.
	 */
	#distance(value) {
		return {value, units: 'meters'};
	}

	/**
	 * Create a meter position.
	 *
	 * @param {readonly number[]} coordinates - Supplies coordinates.
	 * @returns {Position} Position packet.
	 */
	#position(coordinates) {
		return {
			coordinates: [...coordinates],
			units: 'meters',
		};
	}

	/**
	 * Hash JSON content.
	 *
	 * @param {unknown} value - Supplies content.
	 * @returns {string} SHA-256.
	 */
	#hashJson(value) {
		return this.#sha256(JSON.stringify(value));
	}

	/**
	 * Hash bytes or text.
	 *
	 * @param {string | Uint8Array} value - Supplies content.
	 * @returns {string} SHA-256.
	 */
	#sha256(value) {
		return createHash('sha256').update(value).digest('hex');
	}
}
