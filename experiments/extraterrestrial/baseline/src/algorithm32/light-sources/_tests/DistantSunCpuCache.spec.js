import {
	createCacheConstructionControlsDescriptor,
} from '../../caches/CacheConstructionControlsDescriptor.js';
import {
	createScatteringCacheDescriptor,
} from '../../caches/ScatteringCacheDescriptor.js';
import {
	FIBONACCI_34_DIRECTION_DOMAIN,
	createCubedSphereW27DirectionStencil,
} from '../../domains/index.js';
import {
	createDistantSunCpuCumulativeScatteringDensityField,
} from '../DistantSunCpuFields.js';
import { DistantSunCpuCache } from '../DistantSunCpuCache.js';

const FIELD_ID_PREFIX = 'test-distant-sun-resident-cumulative';
const FIELD_PROVENANCE = 'test-distant-sun-resident-cache-provenance';

function createConstructionIdentities(order) {
	return {
		source: { id: `test-source-n${order}`, contentHash: `test-source-hash-n${order}` },
		atmosphere: { id: 'test-atmosphere', contentHash: 'test-atmosphere-hash' },
		geometry: { id: 'test-geometry', contentHash: 'test-geometry-hash' },
	};
}

function createDescriptor(fieldDescriptor, order) {
	return createScatteringCacheDescriptor({
		id: `test-distant-sun-resident-cache-n${order}`,
		field: fieldDescriptor,
		incomingDirectionDomain: FIBONACCI_34_DIRECTION_DOMAIN,
		controls: createCacheConstructionControlsDescriptor({
			id: `test-distant-sun-resident-controls-n${order}`,
			transportIntervalCount: 15,
			maximumScatteringOrder: order,
		}),
		constructionIdentities: createConstructionIdentities(order),
	});
}

function createBuildResult(order, configureField) {
	const cumulativeScatteringDensity =
		createDistantSunCpuCumulativeScatteringDensityField({
			id: `${FIELD_ID_PREFIX}-n${order}`,
			cumulativeThroughOrder: order,
			provenanceIdentity: FIELD_PROVENANCE,
		});
	const writer = cumulativeScatteringDensity.createWriter();
	if (configureField) {
		configureField(writer);
	}
	cumulativeScatteringDensity.seal();
	const descriptor = createDescriptor(
		cumulativeScatteringDensity.descriptor,
		order,
	);

	if (order === 1) {
		return {
			maximumScatteringOrder: 1,
			pureScatteringDensityByOrder: [cumulativeScatteringDensity],
			pureRadianceByOrder: [],
			cumulativeScatteringDensity,
			descriptor,
		};
	}
	if (order === 2) {
		return {
			maximumScatteringOrder: 2,
			pureScatteringDensityByOrder: [
				cumulativeScatteringDensity,
				cumulativeScatteringDensity,
			],
			pureRadianceByOrder: [cumulativeScatteringDensity],
			cumulativeScatteringDensity,
			descriptor,
		};
	}

	return {
		maximumScatteringOrder: 4,
		pureScatteringDensityByOrder: [
			cumulativeScatteringDensity,
			cumulativeScatteringDensity,
			cumulativeScatteringDensity,
			cumulativeScatteringDensity,
		],
		pureRadianceByOrder: [
			cumulativeScatteringDensity,
			cumulativeScatteringDensity,
			cumulativeScatteringDensity,
		],
		cumulativeScatteringDensity,
		descriptor,
	};
}

describe('DistantSunCpuCache', () => {
	const positionStencil = { indices: [3, 9], weights: [0.25, 0.75] };
	const directionStencil = { indices: [17, 31], weights: [0.4, 0.6] };
	let buildResult;
	let cache;

	beforeAll(() => {
		buildResult = createBuildResult(4, (writer) => {
			for (let positionTap = 0;
				positionTap < positionStencil.indices.length;
				positionTap += 1) {
				for (let directionTap = 0;
					directionTap < directionStencil.indices.length;
					directionTap += 1) {
					for (let wavelengthIndex = 0;
						wavelengthIndex < 15;
						wavelengthIndex += 1) {
						const positionIndex = positionStencil.indices[positionTap];
						const directionIndex = directionStencil.indices[directionTap];
						writer.writeScalar({
							positionIndex,
							directionIndex,
							wavelengthIndex,
						}, (positionIndex + 1) * 100
							+ (directionIndex + 1) * 2
							+ wavelengthIndex);
					}
				}
			}
		});
		cache = new DistantSunCpuCache(buildResult);
	});

	afterAll(() => {
		cache.dispose();
	});

	it('consumes completed N1, N2, and N4 results', () => {
		const firstOrder = new DistantSunCpuCache(createBuildResult(1));
		const secondOrder = new DistantSunCpuCache(createBuildResult(2));

		expect(firstOrder.descriptor.controls.maximumScatteringOrder).toBe(1);
		expect(secondOrder.descriptor.controls.maximumScatteringOrder).toBe(2);
		expect(cache.descriptor.controls.maximumScatteringOrder).toBe(4);

		firstOrder.dispose();
		secondOrder.dispose();
	});

	it('returns typed cumulative density from the position-by-W27 tensor product', () => {
		const packet = cache.sampleResolved({ positionStencil, directionStencil });

		expect(packet.kind).toBe('algorithm32-spectral-packet');
		expect(packet.quantity).toBe('spectral-scattering-density');
		expect(packet.units).toBe('W m^-3 sr^-1 nm^-1');
		expect(packet.basis).toBe(cache.descriptor.field.basis);
		expect(packet.semantics).toBe(cache.descriptor.field.sampleSemantics);
		expect(packet.provenanceIdentity).toBe(FIELD_PROVENANCE);
		expect(packet.values.length).toBe(15);

		packet.values.forEach((value, wavelengthIndex) => {
			let expected = 0;
			for (let positionTap = 0;
				positionTap < positionStencil.indices.length;
				positionTap += 1) {
				for (let directionTap = 0;
					directionTap < directionStencil.indices.length;
					directionTap += 1) {
					const positionIndex = positionStencil.indices[positionTap];
					const directionIndex = directionStencil.indices[directionTap];
					expected += ((positionIndex + 1) * 100
						+ (directionIndex + 1) * 2
						+ wavelengthIndex)
						* positionStencil.weights[positionTap]
						* directionStencil.weights[directionTap];
				}
			}

			expect(value).toBeCloseTo(expected, 12);
		});
	});

	it('samples the full two-position by four-W27-tap interpolation surface', () => {
		const directionLength = Math.hypot(1, 0.12, 0.18);
		const fourTapDirectionStencil = createCubedSphereW27DirectionStencil([
			1 / directionLength,
			0.12 / directionLength,
			0.18 / directionLength,
		]);
		const twoTapPositionStencil = {
			indices: [4, 5],
			weights: [0.6, 0.4],
		};

		expect(fourTapDirectionStencil.indices.length).toBe(4);
		const result = createBuildResult(4, (writer) => {
			for (const positionIndex of twoTapPositionStencil.indices) {
				for (const directionIndex of fourTapDirectionStencil.indices) {
					for (let wavelengthIndex = 0;
						wavelengthIndex < 15;
						wavelengthIndex += 1) {
						writer.writeScalar({
							positionIndex,
							directionIndex,
							wavelengthIndex,
						}, positionIndex * 1000 + directionIndex + wavelengthIndex / 10);
					}
				}
			}
		});
		const interpolatingCache = new DistantSunCpuCache(result);
		const packet = interpolatingCache.sampleResolved({
			positionStencil: twoTapPositionStencil,
			directionStencil: fourTapDirectionStencil,
		});

		packet.values.forEach((value, wavelengthIndex) => {
			let expected = 0;
			for (let positionTap = 0;
				positionTap < twoTapPositionStencil.indices.length;
				positionTap += 1) {
				for (let directionTap = 0;
					directionTap < fourTapDirectionStencil.indices.length;
					directionTap += 1) {
					const positionIndex = twoTapPositionStencil.indices[positionTap];
					const directionIndex = fourTapDirectionStencil.indices[directionTap];
					expected += (positionIndex * 1000
						+ directionIndex
						+ wavelengthIndex / 10)
						* twoTapPositionStencil.weights[positionTap]
						* fourTapDirectionStencil.weights[directionTap];
				}
			}

			expect(value).toBeCloseTo(expected, 11);
		});

		interpolatingCache.dispose();
	});

	it('uses source-owned executable facts rather than descriptor metadata', () => {
		const result = createBuildResult(4, (writer) => {
			for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
				writer.writeScalar({
					positionIndex: 3,
					directionIndex: 17,
					wavelengthIndex,
				}, wavelengthIndex + 10);
			}
		});
		const metadataDecoy = {
			...result.descriptor,
			field: {
				...result.descriptor.field,
				positionDomain: { count: 1 },
				directionDomain: { count: 1 },
				basis: { channelCount: 1 },
				quantity: 'metadata-only-decoy',
				units: 'metadata-only-decoy',
				sampleSemantics: 'metadata-only-decoy',
			},
		};
		const metadataOnlyCache = new DistantSunCpuCache({
			...result,
			descriptor: /** @type {ScatteringCacheDescriptor} */ (
				/** @type {unknown} */ (metadataDecoy)
			),
		});
		const packet = metadataOnlyCache.sampleResolved({
			positionStencil: { indices: [3], weights: [1] },
			directionStencil: { indices: [17], weights: [1] },
		});

		expect(packet.values.length).toBe(15);
		expect(packet.quantity).toBe('spectral-scattering-density');
		expect(packet.units).toBe('W m^-3 sr^-1 nm^-1');
		expect(packet.values[14]).toBe(24);

		metadataOnlyCache.dispose();
	});

	it('disposes idempotently and rejects later reads', () => {
		const disposable = new DistantSunCpuCache(createBuildResult(1));

		disposable.dispose();
		expect(() => disposable.dispose()).not.toThrow();
		expect(() => disposable.sampleResolved({
			positionStencil: { indices: [0], weights: [1] },
			directionStencil: { indices: [0], weights: [1] },
		})).toThrowError(/disposed/u);
	});
});
