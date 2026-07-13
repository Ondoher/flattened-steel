import { readFileSync } from 'node:fs';

import {
	CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	PAIRED_FIBONACCI_34_DIRECTION_DOMAIN,
} from '../../domains/consts.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
} from '../../profiles/native-15-profile.js';

const policy = JSON.parse(readFileSync(new URL(
	'../local-sun-gpu-cache-parity-policy.json',
	import.meta.url,
), 'utf8'));

describe('flat/local GPU cache parity policy', () => {
	it('records the implemented public cutover without claiming reflective acceptance', () => {
		expect(policy.schema).toBe(
			'algorithm32-flat-local-gpu-cache-parity-policy-v3',
		);
		expect(policy.status).toBe(
			'stage-9.6-implemented-omitted-ground-star-validated-reflective-validation-pending',
		);
		expect(policy.claimBoundary).toContain(
			'public publication',
		);
		expect(policy.supersededPolicies.map(
			({ schema }) => schema,
		)).toEqual([
			'algorithm32-flat-local-gpu-cache-parity-policy-v2',
			'algorithm32-flat-local-shell-held-gpu-parity-policy-v1',
		]);
		expect(policy.authority.acceptedImplementation.sha256)
			.toBe(
				'6a27106bce134174309a59908c6bcbb278a22989f74c64274347840ccc8abeb6',
			);
		expect(policy.promotionState).toBe(
			'stage-9.6-public-runtime-enabled-omitted-ground-star-validated-reflective-implemented-validation-pending',
		);
		expect(policy.authority.starCpuGold).toEqual(
			jasmine.objectContaining({
				path:
					'src/algorithm32/light-sources/fixtures/'
					+ 'algorithm32-star-local-sun-shell-cpu-gold.json',
				sha256:
					'61532368d7efa2d4a60fc932a901097a8e583ccb0eb3593eb9b26d29c2674985',
				fixtureId:
					'algorithm32-star-local-sun-shell-cpu-gold-v3-sha256:'
					+ 'bb3a1f871a375e53d9c180899003041afc4dda93cbe3fe69e62080481bd8d0c9',
			}),
		);
		expect(policy.authority.cpuComparisonReport).toEqual(
			jasmine.objectContaining({
				sha256:
					'd5fa37c70729eec944f59a7802f51b3a66dfb875969f0f1d076ab9ab0ea2c399',
				reportId:
					'algorithm32-star-local-sun-shell-cpu-comparison-report-v3-sha256:'
					+ '358f1abbbc910774be040baae85d240c2d2d0ca14c9eb4f51bb96af5ceaddd5a',
				state: 'passed',
				fieldComparedScalarCount: 40560,
				fieldMismatchCount: 0,
				coreExactComparedLeafCount: 26900,
				inputAuthenticationComparedLeafCount: 224,
				exactComparedLeafCount: 27124,
				exactMismatchCount: 0,
				behavioralEdgeRecordCount: 29,
				residentSampledScalarCount: 9720,
			}),
		);
		expect(policy.authority.starGpuMethodAuthority.controlDifference)
			.toContain('used 4 path and 4 source-transmittance intervals');
	});

	it('pins shell-held J1, continuous direct L1, and fixed paired-F34', () => {
		expect(policy.selectedContract).toEqual(
			jasmine.objectContaining({
				shellCount: 2048,
				boundaryCount: 2049,
				shellApplication:
					'primary-j1-amplitude-only',
				primaryRadiance:
					'continuous-direct-l1',
				storedFieldTransport: [
					'j2-to-l2',
					'j3-to-l3',
				],
				queryTimeShellScaleCount: 0,
			}),
		);
		expect(policy.productionDomain.incoming).toEqual({
			kind: 'paired-fibonacci-34',
			id:
				PAIRED_FIBONACCI_34_DIRECTION_DOMAIN.id,
			contentHash:
				PAIRED_FIBONACCI_34_DIRECTION_DOMAIN
					.contentHash,
			directionCount:
				PAIRED_FIBONACCI_34_DIRECTION_DOMAIN.count,
			pairCount: 17,
			weightSteradians: 0.36959913571644626,
			frame:
				'source-subpoint-radial-tangent-vertical',
		});
		expect(policy.productionDomain.outgoing.directionCount)
			.toBe(
				CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER
					.directionCount,
			);
		expect(policy.productionDomain.spectralChannelCount)
			.toBe(NATIVE_15_SPECTRAL_BASIS.channelCount);
	});

	it('pins the bounded CPU and passed R32F comparison gates', () => {
		expect(policy.boundedComparisonDomain).toEqual({
			position: {
				kind: 'source-subpoint-z2-rho2',
				zNodeCount: 2,
				rhoNodeCount: 2,
				positionCount: 4,
				positionFlattening: 'z-major-rho-minor',
			},
			incoming: {
				kind: 'paired-fibonacci-34',
				directionCount: 34,
			},
			outgoing: {
				kind: 'cubed-sphere-w3',
				directionCount:
					CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER
						.directionCount,
			},
			spectralChannelCount: 15,
			sourceTransmittanceIntervalCount: 15,
			transportIntervalCount: 15,
			fieldScalarCount: 22320,
		});
		expect(policy.binary64Bounds.pureRadiance)
			.toEqual({ absolute: 1e-15, relative: 1e-12 });
		expect(policy.binary64Bounds.pureScatteringDensity)
			.toEqual({ absolute: 1e-18, relative: 1e-12 });
		expect(policy.r32fBounds.pureRadiance)
			.toEqual({ absolute: 2e-9, relative: 0.005 });
		expect(policy.r32fBounds.cumulativeScatteringDensity)
			.toEqual({ absolute: 8e-12, relative: 0.005 });
		expect(policy.requestedOrders).toEqual([1, 2, 4]);
		expect(policy.expectedPassGraphs.n2).toEqual([
			'local-sun-primary-j1',
			'local-sun-direct-l1',
			'local-sun-scatter-l1-to-j2',
			'local-sun-add-j1-j2-to-jthrough2',
		]);
	});

	it('records reflective validation as deferred and public lifecycle as passed', () => {
		expect(policy.groundCases.required).toEqual([
			'omitted-canonical-black',
			'explicit-zero-lambertian',
			'nonzero-lambertian',
		]);
		expect(policy.groundCases.currentIndependentLocalAuthority)
			.toEqual(['omitted-canonical-black']);
		expect(policy.groundCases.explicitZeroAlbedo.value).toBe(0);
		expect(policy.groundCases.nonzeroAlbedo.value).toBe(0.25);
		expect(policy.groundCases.boundedProbeIndices.scalarCountPerCase)
			.toBe(3300);
		expect(policy.groundCases.acceptanceBoundary)
			.toContain('remains unaccepted');
		expect(policy.groundCases.implementationState).toBe(
			'implemented-and-production-cpu-gpu-checked-independent-star-validation-pending',
		);
		expect(policy.stage963Gate).toEqual(
			jasmine.objectContaining({
				state: 'passed',
				omittedGroundComparedScalarCount: 40560,
				n4FieldScalarCount: 22320,
				fieldMismatchCount: 0,
				reflectiveComparedScalarCountPerCase: 3300,
				boundaryUploadScalarCount: 2049,
				boundaryUploadBytes: 8196,
				cpuFieldUploadCount: 0,
				maximumProbeScalarCount: 4096,
				webGlErrorCount: 0,
				reflectiveClaim:
					'implemented-validation-pending',
				publicLifecycle:
					'enabled-and-passed-stage-9.6.4',
			}),
		);
		expect(policy.stage964Gate).toEqual(
			jasmine.objectContaining({
				state: 'passed',
				publicController: 'enabled',
				publication: 'complete-result-only',
				activeCachePreservedOnFailure: true,
				cameraAndDisplayInvalidate: false,
			}),
		);
		expect(policy.stage965Gate).toEqual(
			jasmine.objectContaining({
				state: 'passed',
				maximumScatteringOrder: 4,
				observerCenteredFinalViewDome: true,
				transactionalPublication: true,
				failurePreservesLastPublishedRuntime: true,
				unownedCandidateCleanup: true,
				sharpHorizonDiscontinuityPresent: false,
			}),
		);
		expect(policy.stage966Gate).toEqual(
			jasmine.objectContaining({
				state: 'passed',
				nodeSpecs: '507/507',
				localSunBrowserSpecs: '3/3',
				broadAlgorithm32BrowserSpecs: '13/13',
				groundBrowserSpecs: '5/5',
				flat32BrowserSpecs: '3/3',
				productionBuild: 'passed',
				sourceAndBuiltOutputContainment: 'passed',
				supportedHardwareQualification: 'open',
			}),
		);
		expect(policy.resourceCriteria.factBoundaryTextureBytes)
			.toBe(8196);
		expect(policy.resourceCriteria.productionRetainedSourceFactBytes)
			.toBe(32776);
		expect(policy.resourceCriteria.oneLogicalN4PackedTransportBytes)
			.toBe(164652480);
		expect(policy.resourceCriteria.observedN4PeakTrackedStorageBytes)
			.toBe(389675392);
		expect(policy.resourceCriteria.readback)
			.toBe('declared-bounded-probes-only');
		expect(policy.invariants.continuousDirectL1ReadsShellFacts)
			.toBeFalse();
		expect(policy.invariants.storedTransportAcceptsJ1)
			.toBeFalse();
		expect(policy.invariants.cpuFieldUploadCount).toBe(0);
	});
});
