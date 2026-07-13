import { readFileSync } from 'node:fs';

const fixture = JSON.parse(readFileSync(new URL(
	'../fixtures/algorithm32-production-native-n4-cpu-gpu-parity-oracle.json',
	import.meta.url,
), 'utf8'));
const policy = JSON.parse(readFileSync(new URL(
	'../../fixtures/gpu-cache-parity-policy.json',
	import.meta.url,
), 'utf8'));

const FIELD_NAMES = [
	'J1',
	'Jthrough1',
	'L1',
	'J2',
	'Jthrough2',
	'L2',
	'J3',
	'Jthrough3',
	'L3',
	'J4',
	'Jthrough4',
];

describe('Algorithm32 native N4 CPU/GPU parity oracle fixture', () => {
	it('pins the exact default native spherical distant-Sun configuration', () => {
		expect(fixture.schema).toBe(
			'algorithm32-production-native-n4-cpu-gpu-parity-oracle-v1',
		);
		expect(fixture.status).toBe('checked-production-binary64-cpu-oracle');
		expect(fixture.configuration.profile).toEqual(jasmine.objectContaining({
			id: 'algorithm32-native-production-default-v1',
			role: 'native-production-default',
			comparisonParity: false,
		}));
		expect(fixture.configuration.atmosphere).toEqual(jasmine.objectContaining({
			kind: 'canonical-atmosphere',
			spectralChannelCount: 15,
		}));
		expect(fixture.configuration.geometry).toEqual(jasmine.objectContaining({
			kind: 'spherical-earth-geometry',
			bottomRadius: { value: 6360000, units: 'meters' },
			topRadius: { value: 6420000, units: 'meters' },
			observerHeight: { value: 2, units: 'meters' },
			directionToSource: [0, 1, 0],
			cacheAltitudeBinCount: 48,
			cacheBoundaryAltitude: { value: 2, units: 'meters' },
			sourceTransmittanceIntervalCount: 20,
		}));
		expect(fixture.configuration.geometry.observerLocalSceneFrame.up)
			.toEqual([1, 0, 0]);
		expect(fixture.configuration.lightSource).toEqual(jasmine.objectContaining({
			kind: 'distant-sun-light-source',
			directionToLight: [0, 1, 0],
			angularRadius: { value: 0.004675, units: 'radians' },
			spectralChannelCount: 15,
		}));
		expect(fixture.configuration.groundBoundary).toEqual(jasmine.objectContaining({
			id: 'algorithm32-black-ground-boundary-v1',
			behavior: 'zero-reflection',
		}));
		expect(fixture.configuration.maximumScatteringOrder).toBe(4);
		expect(fixture.configuration.sourceTransmittanceIntervalCount).toBe(20);
		expect(fixture.configuration.transportIntervalCount).toBe(40);
	});

	it('records every selected pass with all five queries and fifteen channels', () => {
		expect(fixture.wavelengthIndices).toEqual(policy.wavelengthIndices);
		expect(fixture.fields.map((field) => field.name)).toEqual(FIELD_NAMES);

		for (const field of fixture.fields) {
			expect(field.precision).toBe('binary64');
			expect(field.basisId).toBe('algorithm32-native-15-spectral-basis-v1');
			expect(field.positionDomainId).toBe('algorithm32-native-48-position-v1');
			const expectedQueries = field.queryKind === 'radiance'
				? policy.radianceQueries
				: policy.scatteringDensityQueries;
			expect(field.queries.length).toBe(expectedQueries.length);

			field.queries.forEach((query, queryIndex) => {
				expect(query.positionIndex).toBe(expectedQueries[queryIndex].positionIndex);
				expect(query.altitude).toEqual(expectedQueries[queryIndex].altitude);
				expect(query.directionIndex).toBe(expectedQueries[queryIndex].directionIndex);
				expect(query.cacheDirection).toEqual(
					expectedQueries[queryIndex].cacheDirection,
				);
				expect(query.values.length).toBe(15);
				expect(query.values.every((value) =>
					Number.isFinite(value) && value >= 0)).toBeTrue();
			});
		}
	});

	it('derives cumulative probes from pure orders in production operation order', () => {
		const fields = new Map(fixture.fields.map((field) => [field.name, field]));
		let expected = fields.get('J1').queries.map((query) => [...query.values]);

		for (const maximumOrder of [1, 2, 3, 4]) {
			if (maximumOrder > 1) {
				const pure = fields.get(`J${maximumOrder}`);
				expected = expected.map((values, queryIndex) => values.map(
					(value, wavelengthIndex) =>
						value + pure.queries[queryIndex].values[wavelengthIndex],
				));
			}

			const cumulative = fields.get(`Jthrough${maximumOrder}`);
			expect(cumulative.order).toEqual({
				kind: 'cumulative-through',
				value: maximumOrder,
				included: Array.from(
					{ length: maximumOrder },
					(_value, index) => index + 1,
				),
			});
			cumulative.queries.forEach((query, queryIndex) => {
				expect(query.values).toEqual(expected[queryIndex]);
			});
		}
	});

	it('records standalone production provenance and measured build timing', () => {
		expect(fixture.provenance.oracle).toBe(
			'src/algorithm32 production binary64 CPU recurrence',
		);
		expect(fixture.provenance.runtimeImports).toBe(
			'src/algorithm32 only; no Algorithm32-Star runtime imports',
		);
		expect(fixture.provenance.queryPolicy).toEqual({
			schema: policy.schema,
			status: policy.status,
		});
		expect(fixture.provenance.constructionIdentities.boundary)
			.toEqual(jasmine.objectContaining({
				id: 'algorithm32-black-ground-boundary-v1',
			}));
		expect(fixture.provenance.cacheDescriptor.id).toBe(
			'algorithm32-distant-sun-cpu-scattering-cache-n4-v1',
		);
		expect(fixture.buildTiming.startedAt).toEqual(jasmine.any(String));
		expect(fixture.buildTiming.duration).toEqual({
			value: 1421463.5862,
			units: 'milliseconds',
		});
		expect(fixture.buildTiming.runtime).toMatch(/^v\d+/u);
		expect(fixture.buildTiming.platform).toBe('win32');
		expect(fixture.buildTiming.architecture).toBe('x64');
	});
});
