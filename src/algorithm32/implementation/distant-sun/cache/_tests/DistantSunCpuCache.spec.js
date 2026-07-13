import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../../profiles/native-15/native-15-profile.js';
import {SpectralBasis, SPECTRAL_SAMPLE_SEMANTICS} from '../../../../spectral-values/index.js';
import {CpuDirectionalSpectralField} from '../../../../light-source-support/cache/CpuDirectionalSpectralField.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from '../consts.js';
import DistantSunConstructionDomainSelection from '../DistantSunConstructionDomainSelection.js';
import {DistantSunCpuCache} from '../DistantSunCpuCache.js';

/** Field id prefix constant. */
const FIELD_ID_PREFIX = 'test-distant-sun-resident-cumulative';
/** Field provenance constant. */
const FIELD_PROVENANCE = 'test-distant-sun-resident-cache-provenance';

/**
 * Called by this module to create build result. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 * @param order - The order value accepted by the operation.
 * @param configureField - The configure field value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createBuildResult(order, configureField, domainSelection = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION) {
	const cumulativeScatteringDensity = new CpuDirectionalSpectralField({
		id: `${FIELD_ID_PREFIX}-n${order}`,
		provenanceIdentity: FIELD_PROVENANCE,
		order: {
			kind: 'cumulative-through',
			value: order,
			included: Array.from(
				{length: order},
				/**
				 * Called by the surrounding operation to handle one callback invocation.
				 * @param _unused - The intentionally unused callback value.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (_unused, index) => index + 1,
			),
		},
		packing: domainSelection.scatteringDensityPacking,
	});
	const writer = cumulativeScatteringDensity.createWriter();
	if (configureField) {
		configureField(writer);
	}
	cumulativeScatteringDensity.seal();
	const options = {
		transportIntervalCount: 15,
		maximumScatteringOrder: order,
	};

	if (order === 1) {
		return {
			maximumScatteringOrder: 1,
			domainSelection,
			pureScatteringDensityByOrder: [cumulativeScatteringDensity],
			pureRadianceByOrder: [],
			cumulativeScatteringDensity,
			options,
		};
	}
	if (order === 2) {
		return {
			maximumScatteringOrder: 2,
			domainSelection,
			pureScatteringDensityByOrder: [cumulativeScatteringDensity, cumulativeScatteringDensity],
			pureRadianceByOrder: [cumulativeScatteringDensity],
			cumulativeScatteringDensity,
			options,
		};
	}

	return {
		maximumScatteringOrder: 4,
		domainSelection,
		pureScatteringDensityByOrder: [
			cumulativeScatteringDensity,
			cumulativeScatteringDensity,
			cumulativeScatteringDensity,
			cumulativeScatteringDensity,
		],
		pureRadianceByOrder: [cumulativeScatteringDensity, cumulativeScatteringDensity, cumulativeScatteringDensity],
		cumulativeScatteringDensity,
		options,
	};
}

describe('DistantSunCpuCache', /** Called by Jasmine to register the named test suite. */ () => {
	const positionStencil = {indices: [3, 9], weights: [0.25, 0.75]};
	const directionStencil = {indices: [17, 31], weights: [0.4, 0.6]};
	let buildResult;
	let cache;

	beforeAll(
		/** Called by Jasmine to prepare the test context. */ () => {
			buildResult = createBuildResult(
				4,
				/**
				 * Called by the surrounding operation to handle one callback invocation.
				 * @param writer - The writer value accepted by the operation.
				 */ (writer) => {
					for (let positionTap = 0; positionTap < positionStencil.indices.length; positionTap += 1) {
						for (let directionTap = 0; directionTap < directionStencil.indices.length; directionTap += 1) {
							for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
								const positionIndex = positionStencil.indices[positionTap];
								const directionIndex = directionStencil.indices[directionTap];
								writer.writeScalar(
									{
										positionIndex,
										directionIndex,
										wavelengthIndex,
									},
									(positionIndex + 1) * 100 + (directionIndex + 1) * 2 + wavelengthIndex,
								);
							}
						}
					}
				},
			);
			cache = new DistantSunCpuCache(buildResult);
		},
	);

	afterAll(
		/** Called by Jasmine to release the test context. */ () => {
			cache.dispose();
		},
	);

	it('consumes completed N1, N2, and N4 results', /** Called by Jasmine to exercise the named behavior. */ () => {
		const firstResult = createBuildResult(1);
		const secondResult = createBuildResult(2);
		const firstOrder = new DistantSunCpuCache(firstResult);
		const secondOrder = new DistantSunCpuCache(secondResult);

		expect(firstResult.options.maximumScatteringOrder).toBe(1);
		expect(secondResult.options.maximumScatteringOrder).toBe(2);
		expect(buildResult.options.maximumScatteringOrder).toBe(4);
		expect(firstOrder.sampleProvenanceIdentity).toBe(FIELD_PROVENANCE);
		expect(secondOrder.sampleProvenanceIdentity).toBe(FIELD_PROVENANCE);
		expect(cache.sampleProvenanceIdentity).toBe(FIELD_PROVENANCE);

		firstOrder.dispose();
		secondOrder.dispose();
	});

	it('returns typed cumulative density from the position-by-W27 tensor product', /** Called by Jasmine to exercise the named behavior. */ () => {
		const packet = cache.sampleResolved({positionStencil, directionStencil});

		expect(packet.kind).toBe('algorithm32-spectral-packet');
		expect(packet.quantity).toBe('spectral-scattering-density');
		expect(packet.units).toBe('W m^-3 sr^-1 nm^-1');
		expect(packet.basis).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(packet.semantics).toBe(NATIVE_15_SPECTRAL_BASIS.semantics);
		expect(packet.provenanceIdentity).toBe(FIELD_PROVENANCE);
		expect(packet.values.length).toBe(15);

		packet.values.forEach(
			/**
			 * Called by Array.prototype.forEach to process one collection value.
			 * @param value - The value accepted by the operation.
			 * @param wavelengthIndex - The wavelength index value accepted by the operation.
			 */ (value, wavelengthIndex) => {
				let expected = 0;
				for (let positionTap = 0; positionTap < positionStencil.indices.length; positionTap += 1) {
					for (let directionTap = 0; directionTap < directionStencil.indices.length; directionTap += 1) {
						const positionIndex = positionStencil.indices[positionTap];
						const directionIndex = directionStencil.indices[directionTap];
						expected +=
							((positionIndex + 1) * 100 + (directionIndex + 1) * 2 + wavelengthIndex) *
							positionStencil.weights[positionTap] *
							directionStencil.weights[directionTap];
					}
				}

				expect(value).toBeCloseTo(expected, 12);
			},
		);
	});

	it('samples the full two-position by four-W27-tap interpolation surface', /** Called by Jasmine to exercise the named behavior. */ () => {
		const directionLength = Math.hypot(1, 0.12, 0.18);
		const fourTapDirectionStencil = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil([
			1 / directionLength,
			0.12 / directionLength,
			0.18 / directionLength,
		]);
		const twoTapPositionStencil = {
			indices: [4, 5],
			weights: [0.6, 0.4],
		};

		expect(fourTapDirectionStencil.indices.length).toBe(4);
		const result = createBuildResult(
			4,
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @param writer - The writer value accepted by the operation.
			 */ (writer) => {
				for (const positionIndex of twoTapPositionStencil.indices) {
					for (const directionIndex of fourTapDirectionStencil.indices) {
						for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
							writer.writeScalar(
								{
									positionIndex,
									directionIndex,
									wavelengthIndex,
								},
								positionIndex * 1000 + directionIndex + wavelengthIndex / 10,
							);
						}
					}
				}
			},
		);
		const interpolatingCache = new DistantSunCpuCache(result);
		const packet = interpolatingCache.sampleResolved({
			positionStencil: twoTapPositionStencil,
			directionStencil: fourTapDirectionStencil,
		});

		packet.values.forEach(
			/**
			 * Called by Array.prototype.forEach to process one collection value.
			 * @param value - The value accepted by the operation.
			 * @param wavelengthIndex - The wavelength index value accepted by the operation.
			 */ (value, wavelengthIndex) => {
				let expected = 0;
				for (let positionTap = 0; positionTap < twoTapPositionStencil.indices.length; positionTap += 1) {
					for (
						let directionTap = 0;
						directionTap < fourTapDirectionStencil.indices.length;
						directionTap += 1
					) {
						const positionIndex = twoTapPositionStencil.indices[positionTap];
						const directionIndex = fourTapDirectionStencil.indices[directionTap];
						expected +=
							(positionIndex * 1000 + directionIndex + wavelengthIndex / 10) *
							twoTapPositionStencil.weights[positionTap] *
							fourTapDirectionStencil.weights[directionTap];
					}
				}

				expect(value).toBeCloseTo(expected, 11);
			},
		);

		interpolatingCache.dispose();
	});

	it('uses source-owned executable field facts directly', /** Called by Jasmine to exercise the named behavior. */ () => {
		const result = createBuildResult(
			4,
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @param writer - The writer value accepted by the operation.
			 */ (writer) => {
				for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
					writer.writeScalar(
						{
							positionIndex: 3,
							directionIndex: 17,
							wavelengthIndex,
						},
						wavelengthIndex + 10,
					);
				}
			},
		);
		const directCache = new DistantSunCpuCache(result);
		const packet = directCache.sampleResolved({
			positionStencil: {indices: [3], weights: [1]},
			directionStencil: {indices: [17], weights: [1]},
		});

		expect(directCache.sampleProvenanceIdentity).toBe(result.cumulativeScatteringDensity.provenanceIdentity);
		expect(packet.values.length).toBe(15);
		expect(packet.quantity).toBe('spectral-scattering-density');
		expect(packet.units).toBe('W m^-3 sr^-1 nm^-1');
		expect(packet.values[14]).toBe(24);

		directCache.dispose();
	});

	it('publishes all 40 channels from a profile-sized CPU cache artifact', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = new SpectralBasis({
			id: 'test-cpu-cache-direct-40',
			semantics: SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY,
			channels: Array.from({length: 40}, (_unused, index) => ({
				id: `sample-${index}`,
				center: {value: 360 + index * 10, units: 'nanometers'},
				width: {value: 10, units: 'nanometers'},
			})),
		});
		const compact = NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
		const profile = /** @type {Algorithm32ExecutionProfile} */ (
			/** @type {unknown} */ ({
				id: 'test-cpu-cache-direct-40-profile',
				spectral: {basis},
				domains: {
					positions: compact.positionDomain,
					incomingDirections: compact.incomingDirectionDomain,
					outgoingDirections: compact.outgoingDirectionDomain,
				},
			})
		);
		const domains = DistantSunConstructionDomainSelection.fromProfile(profile);
		const result = createBuildResult(
			1,
			/** Write one complete selected spectrum. */ (writer) => {
				for (let wavelengthIndex = 0; wavelengthIndex < 40; wavelengthIndex += 1) {
					writer.writeScalar({directionIndex: 0, positionIndex: 0, wavelengthIndex}, wavelengthIndex + 1);
				}
			},
			domains,
		);
		const direct40Cache = new DistantSunCpuCache(result);
		const packet = direct40Cache.sampleResolved({
			positionStencil: {indices: [0], weights: [1]},
			directionStencil: {indices: [0], weights: [1]},
		});

		expect(packet.basis).toBe(basis);
		expect(packet.semantics).toBe(SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY);
		expect(packet.values).toHaveSize(40);
		expect(packet.values[39]).toBe(40);
		direct40Cache.dispose();
	});

	it('disposes idempotently and rejects later reads', /** Called by Jasmine to exercise the named behavior. */ () => {
		const disposable = new DistantSunCpuCache(createBuildResult(1));

		disposable.dispose();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => disposable.dispose(),
		).not.toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				disposable.sampleResolved({
					positionStencil: {indices: [0], weights: [1]},
					directionStencil: {indices: [0], weights: [1]},
				}),
		).toThrowError(/disposed/u);
	});
});
