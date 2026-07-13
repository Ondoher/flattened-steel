import {
	DEFAULT_CACHE_CONSTRUCTION_CONTROLS,
	DEFAULT_CUMULATIVE_SCATTERING_FIELD,
	DEFAULT_SCATTERING_DENSITY_LAYOUT,
	BLACK_GROUND_BOUNDARY_IDENTITY,
	SUPPORTED_CACHE_SCATTERING_ORDERS,
	DIRECTION_DOMAIN_ROLES,
	DIRECTIONAL_FIELD_QUANTITIES,
	DIRECTIONAL_FIELD_UNITS,
	SELECTED_CACHE_FOUNDATION,
	createDenseScalarArrayLayout,
	createDirectionalSpectralFieldDescriptor,
	createCacheConstructionControlsDescriptor,
	createScalarArrayTextureLayout,
	createScatteringCacheDescriptor,
	nextScatteringOrder,
} from '../index.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	FIBONACCI_34_DIRECTION_DOMAIN,
	NATIVE_48_POSITION_DOMAIN,
} from '../../domains/index.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../../profiles/native-15-profile.js';

describe('stage-one scattering cache descriptors', () => {
	it('supports requested maxima 1, 2, and 4 with 4 as the default', () => {
		expect(SUPPORTED_CACHE_SCATTERING_ORDERS).toEqual([1, 2, 4]);
		expect(DEFAULT_CACHE_CONSTRUCTION_CONTROLS.maximumScatteringOrder).toBe(4);
		expect(DEFAULT_CACHE_CONSTRUCTION_CONTROLS.transportIntervalCount).toBe(15);

		for (const maximumScatteringOrder of SUPPORTED_CACHE_SCATTERING_ORDERS) {
			const controls = createCacheConstructionControlsDescriptor({
				id: `test-order-${maximumScatteringOrder}`,
				transportIntervalCount: 15,
				maximumScatteringOrder,
			});
			expect(controls.maximumScatteringOrder).toBe(maximumScatteringOrder);
		}
	});

	it('declares the selected native-15/48/Fibonacci-34/W27 R32F field', () => {
		expect(SELECTED_CACHE_FOUNDATION.basis.channelCount).toBe(15);
		expect(SELECTED_CACHE_FOUNDATION.positionDomain.count).toBe(48);
		expect(SELECTED_CACHE_FOUNDATION.incomingDirectionDomain.count).toBe(34);
		expect(SELECTED_CACHE_FOUNDATION.outgoingDirectionDomain.count).toBe(4374);
		expect(SELECTED_CACHE_FOUNDATION.supportedMaximumScatteringOrders)
			.toEqual([1, 2, 4]);
		expect(DEFAULT_CUMULATIVE_SCATTERING_FIELD.order).toEqual({
			kind: 'cumulative-through',
			value: 4,
			included: [1, 2, 3, 4],
		});
		expect(DEFAULT_SCATTERING_DENSITY_LAYOUT.axes).toEqual({
			x: 'direction',
			y: 'position',
			layer: 'wavelength',
		});
		expect(DEFAULT_SCATTERING_DENSITY_LAYOUT.storage).toEqual({
			value: 12597120,
			units: 'bytes',
		});
	});

	it('keeps units in values or explicit units data, never property names', () => {
		const unitSuffix = /(Meters|Kilometers|Nanometers|Micrometers|Radians|Degrees|Steradians|Bytes)$/;
		const keys = collectKeys(SELECTED_CACHE_FOUNDATION);

		expect(keys.filter((key) => unitSuffix.test(key))).toEqual([]);
		expect(NATIVE_48_POSITION_DOMAIN.nodes[0].coordinate).toEqual({
			value: 2,
			units: 'meters',
		});
		expect(FIBONACCI_34_DIRECTION_DOMAIN.integrationWeights.units).toBe('steradians');
	});

	it('publishes stable metadata identity', () => {
		const first = createCompleteCacheDescriptor();
		const second = createCompleteCacheDescriptor();

		expect(first.contentHash).toBe(second.contentHash);
	});

	it('uses one canonical black-ground identity when the boundary is omitted', () => {
		const identities = constructionIdentities();
		delete identities.boundary;
		const cache = createScatteringCacheDescriptor({
			id: 'test-black-ground-cache',
			field: DEFAULT_CUMULATIVE_SCATTERING_FIELD,
			incomingDirectionDomain: FIBONACCI_34_DIRECTION_DOMAIN,
			controls: DEFAULT_CACHE_CONSTRUCTION_CONTROLS,
			constructionIdentities: identities,
		});

		expect(cache.constructionIdentities.boundary)
			.toEqual(BLACK_GROUND_BOUNDARY_IDENTITY);
	});

	it('emits default schema metadata when the typed definition omits it', () => {
		const controls = createCacheConstructionControlsDescriptor({
			id: 'default-schema-controls',
			transportIntervalCount: 15,
			maximumScatteringOrder: 4,
		});

		const layout = createScalarArrayTextureLayout({
			id: 'default-schema-layout',
			directionCount: 1,
			positionCount: 1,
			wavelengthCount: 1,
		});

		const field = createDirectionalSpectralFieldDescriptor(
			fieldDefinition(DEFAULT_CUMULATIVE_SCATTERING_FIELD, 'default-schema-field'),
		);

		expect(controls.schemaRevision)
			.toBe(DEFAULT_CACHE_CONSTRUCTION_CONTROLS.schemaRevision);
		expect(layout.schemaRevision)
			.toBe(DEFAULT_SCATTERING_DENSITY_LAYOUT.schemaRevision);
		expect(field.schemaRevision)
			.toBe(DEFAULT_CUMULATIVE_SCATTERING_FIELD.schemaRevision);
	});

	it('derives the next order from typed pure-radiance metadata', () => {
		const layout = createScalarArrayTextureLayout({
			id: 'test-radiance-layout',
			directionCount: FIBONACCI_34_DIRECTION_DOMAIN.count,
			positionCount: NATIVE_48_POSITION_DOMAIN.count,
			wavelengthCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
		});
		const pure = createDirectionalSpectralFieldDescriptor({
			id: 'test-pure-radiance-order-1',
			quantity: DIRECTIONAL_FIELD_QUANTITIES.RADIANCE_DENSITY,
			units: DIRECTIONAL_FIELD_UNITS.RADIANCE_DENSITY,
			directionRole: DIRECTION_DOMAIN_ROLES.INCOMING_RADIANCE,
			basis: NATIVE_15_SPECTRAL_BASIS,
			positionDomain: NATIVE_48_POSITION_DOMAIN,
			directionDomain: FIBONACCI_34_DIRECTION_DOMAIN,
			precision: 'binary32',
			layout,
			order: { kind: 'pure', value: 1 },
			provenanceIdentity: 'test-fixture',
		});
		expect(nextScatteringOrder(pure)).toBe(2);
	});

	it('describes binary64 CPU fields without mislabeling them as R32F', () => {
		const layout = createDenseScalarArrayLayout({
			id: 'test-binary64-cpu-scattering-layout',
			directionCount: CUBED_SPHERE_W27_DIRECTION_DOMAIN.count,
			positionCount: NATIVE_48_POSITION_DOMAIN.count,
			wavelengthCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
		});
		const field = createDirectionalSpectralFieldDescriptor({
			...fieldDefinition(
				DEFAULT_CUMULATIVE_SCATTERING_FIELD,
				'test-binary64-cpu-scattering-field',
			),
			precision: 'binary64',
			layout,
			order: { kind: 'pure', value: 1 },
		});

		expect(field.precision).toBe('binary64');
		expect(field.layout.kind).toBe('dense-scalar-array-layout');
		expect(field.layout.format).toBe('Float64Array');
		expect(field.layout.storage).toEqual({
			value: 25194240,
			units: 'bytes',
		});
	});
});

function createCompleteCacheDescriptor() {
	return createScatteringCacheDescriptor({
		id: 'test-complete-cache',
		field: DEFAULT_CUMULATIVE_SCATTERING_FIELD,
		incomingDirectionDomain: FIBONACCI_34_DIRECTION_DOMAIN,
		controls: DEFAULT_CACHE_CONSTRUCTION_CONTROLS,
		constructionIdentities: constructionIdentities(),
	});
}

function constructionIdentities() {
	return {
		source: { id: 'test-source', contentHash: 'sha256:test-source' },
		atmosphere: { id: 'test-atmosphere', contentHash: 'sha256:test-atmosphere' },
		geometry: { id: 'test-geometry', contentHash: 'sha256:test-geometry' },
		boundary: { id: 'test-boundary', contentHash: 'sha256:test-boundary' },
	};
}

function fieldDefinition(field, id) {
	return {
		id,
		quantity: field.quantity,
		units: field.units,
		directionRole: field.directionRole,
		basis: field.basis,
		positionDomain: field.positionDomain,
		directionDomain: field.directionDomain,
		precision: field.precision,
		layout: field.layout,
		order: field.order,
		provenanceIdentity: field.provenanceIdentity,
	};
}

function collectKeys(value, keys = [], visited = new WeakSet()) {
	if (!value || typeof value !== 'object' || visited.has(value)) {
		return keys;
	}

	visited.add(value);

	for (const [key, child] of Object.entries(value)) {
		keys.push(key);
		collectKeys(child, keys, visited);
	}

	return keys;
}
